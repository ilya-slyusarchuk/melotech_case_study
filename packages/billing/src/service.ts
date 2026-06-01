import type { Platform } from "@melotech/shared";
import { groupCaptureUsageByTimeframe } from "./analytics.js";
import { calculateReservationCost, getPlatformCreditCost } from "./pricing.js";
import { assertPositiveCreditAmount } from "./validation.js";
import type {
  CreditLedgerEntry,
  CreditReservation,
  CreditStore,
  CreditStoreTransaction,
  CreditWallet,
  UsageAnalyticsPoint,
  UsageTimeframe,
} from "./types.js";

export const INITIAL_DEMO_CREDITS = 100;

type MutationInput = {
  userId: string;
  idempotencyKey: string;
};

export class CreditService {
  constructor(private readonly store: CreditStore) {}

  createWalletForUser(userId: string): Promise<CreditWallet> {
    return this.store.transaction(async (transaction) => {
      const existingWallet = await transaction.getWalletByUserId(userId);

      if (existingWallet) {
        throw new Error("User already has a credit wallet.");
      }

      return transaction.createWallet(userId, 0);
    });
  }

  ensureWalletForUser(userId: string): Promise<CreditWallet> {
    return this.store.transaction(async (transaction) => {
      const existingWallet = await transaction.getWalletByUserId(userId);

      if (existingWallet) {
        return existingWallet;
      }

      return transaction.createWallet(userId, INITIAL_DEMO_CREDITS);
    });
  }

  grantCredits(input: MutationInput & { amount: number }) {
    return this.store.transaction(async (transaction) => {
      const existingEntry = await this.findIdempotentEntry(transaction, input);
      if (existingEntry) {
        return existingEntry;
      }

      const wallet = await this.getRequiredWallet(transaction, input.userId);
      const updatedWallet = await transaction.updateWallet(wallet.id, {
        availableCredits:
          wallet.availableCredits + assertPositiveCreditAmount(input.amount),
        reservedCredits: wallet.reservedCredits,
      });

      return transaction.createLedgerEntry({
        userId: input.userId,
        walletId: updatedWallet.id,
        reservationId: null,
        generationRequestId: null,
        platform: null,
        type: "grant",
        amount: input.amount,
        idempotencyKey: input.idempotencyKey,
        metadata: null,
      });
    });
  }

  reserveCreditsForGeneration(
    input: MutationInput & {
      generationRequestId: string;
      platforms: readonly Platform[];
    },
  ): Promise<CreditReservation> {
    return this.store.transaction(async (transaction) => {
      const existingEntry = await this.findIdempotentEntry(transaction, input);
      const existingReservation =
        await transaction.findReservationByGenerationRequestId(
          input.generationRequestId,
        );

      if (existingEntry && existingReservation) {
        return existingReservation;
      }

      const wallet = await this.getRequiredWallet(transaction, input.userId);
      const reservationCost = calculateReservationCost(input.platforms);

      if (wallet.availableCredits < reservationCost) {
        throw new Error("Insufficient available credits.");
      }

      const reservation = await transaction.createReservation({
        userId: input.userId,
        generationRequestId: input.generationRequestId,
        reservedCredits: reservationCost,
      });

      const updatedWallet = await transaction.updateWallet(wallet.id, {
        availableCredits: wallet.availableCredits - reservationCost,
        reservedCredits: wallet.reservedCredits + reservationCost,
      });

      await transaction.createLedgerEntry({
        userId: input.userId,
        walletId: updatedWallet.id,
        reservationId: reservation.id,
        generationRequestId: input.generationRequestId,
        platform: null,
        type: "reservation_hold",
        amount: reservationCost,
        idempotencyKey: input.idempotencyKey,
        metadata: { platforms: input.platforms },
      });

      return reservation;
    });
  }

  captureCreditsForSuccessfulPlatform(
    input: MutationInput & {
      reservationId: string;
      platform: Platform;
      outputStored: boolean;
    },
  ) {
    return this.store.transaction(async (transaction) => {
      if (!input.outputStored) {
        // Credits are captured only after durable output storage succeeds.
        // A failed platform output therefore costs zero credits.
        return null;
      }

      const existingEntry = await this.findIdempotentEntry(transaction, input);
      if (existingEntry) {
        return existingEntry;
      }

      const existingCapture =
        await transaction.findCaptureForReservationPlatform(
          input.reservationId,
          input.platform,
        );
      if (existingCapture) {
        return existingCapture;
      }

      const reservation = await this.getRequiredReservation(
        transaction,
        input.reservationId,
        input.userId,
      );
      const wallet = await this.getRequiredWallet(transaction, input.userId);
      const captureAmount = getPlatformCreditCost(input.platform);
      const unusedReservedCredits =
        reservation.reservedCredits -
        reservation.capturedCredits -
        reservation.releasedCredits;

      if (unusedReservedCredits < captureAmount) {
        throw new Error("Reservation does not have enough remaining credits.");
      }

      await transaction.updateWallet(wallet.id, {
        availableCredits: wallet.availableCredits,
        reservedCredits: wallet.reservedCredits - captureAmount,
      });

      const capturedCredits = reservation.capturedCredits + captureAmount;
      await transaction.updateReservation(reservation.id, {
        capturedCredits,
        releasedCredits: reservation.releasedCredits,
        status:
          capturedCredits === reservation.reservedCredits
            ? "captured"
            : "partially_captured",
      });

      return transaction.createLedgerEntry({
        userId: input.userId,
        walletId: wallet.id,
        reservationId: reservation.id,
        generationRequestId: reservation.generationRequestId,
        platform: input.platform,
        type: "platform_capture",
        amount: captureAmount,
        idempotencyKey: input.idempotencyKey,
        metadata: null,
      });
    });
  }

  releaseUnusedReservedCredits(
    input: MutationInput & { reservationId: string },
  ) {
    return this.store.transaction(async (transaction) => {
      const existingEntry = await this.findIdempotentEntry(transaction, input);
      if (existingEntry) {
        return existingEntry;
      }

      const reservation = await this.getRequiredReservation(
        transaction,
        input.reservationId,
        input.userId,
      );
      const unusedCredits =
        reservation.reservedCredits -
        reservation.capturedCredits -
        reservation.releasedCredits;

      if (unusedCredits <= 0) {
        return null;
      }

      const wallet = await this.getRequiredWallet(transaction, input.userId);
      await transaction.updateWallet(wallet.id, {
        availableCredits: wallet.availableCredits + unusedCredits,
        reservedCredits: wallet.reservedCredits - unusedCredits,
      });

      await transaction.updateReservation(reservation.id, {
        capturedCredits: reservation.capturedCredits,
        releasedCredits: reservation.releasedCredits + unusedCredits,
        status:
          reservation.capturedCredits > 0 ? "partially_captured" : "released",
      });

      return transaction.createLedgerEntry({
        userId: input.userId,
        walletId: wallet.id,
        reservationId: reservation.id,
        generationRequestId: reservation.generationRequestId,
        platform: null,
        type: "reservation_release",
        amount: unusedCredits,
        idempotencyKey: input.idempotencyKey,
        metadata: null,
      });
    });
  }

  findReservationForGeneration(
    generationRequestId: string,
  ): Promise<CreditReservation | null> {
    return this.store.transaction(async (transaction) =>
      transaction.findReservationByGenerationRequestId(generationRequestId),
    );
  }

  readWalletBalance(userId: string): Promise<CreditWallet | null> {
    return this.store.transaction((transaction) =>
      transaction.getWalletByUserId(userId),
    );
  }

  readLedgerHistory(userId: string): Promise<CreditLedgerEntry[]> {
    return this.store.transaction((transaction) =>
      transaction.listLedgerEntries(userId),
    );
  }

  readUsageAnalytics(
    userId: string,
    timeframe: UsageTimeframe,
  ): Promise<UsageAnalyticsPoint[]> {
    return this.store.transaction(async (transaction) => {
      const captures = await transaction.listCaptureLedgerEntries(userId);
      return groupCaptureUsageByTimeframe(captures, timeframe);
    });
  }

  private findIdempotentEntry(
    transaction: CreditStoreTransaction,
    input: MutationInput,
  ) {
    return transaction.findLedgerEntryByIdempotencyKey(input.idempotencyKey);
  }

  private async getRequiredWallet(
    transaction: CreditStoreTransaction,
    userId: string,
  ) {
    const wallet = await transaction.getWalletByUserId(userId);
    if (!wallet) {
      throw new Error("Credit wallet does not exist for user.");
    }
    return wallet;
  }

  private async getRequiredReservation(
    transaction: CreditStoreTransaction,
    reservationId: string,
    userId: string,
  ) {
    const reservation = await transaction.findReservationById(reservationId);
    if (!reservation || reservation.userId !== userId) {
      throw new Error("Credit reservation was not found for user.");
    }
    return reservation;
  }
}

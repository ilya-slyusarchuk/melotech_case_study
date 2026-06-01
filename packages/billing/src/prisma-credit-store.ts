import type { PrismaDatabaseClient } from "@melotech/db";
import type { Platform } from "@melotech/shared";
import type {
  CreditLedgerEntry,
  CreditReservation,
  CreditStore,
  CreditStoreTransaction,
  CreditWallet,
} from "./types.js";

// Prisma transaction clients have all model delegates but lack client-level
// methods like $connect and $transaction. Picking only the delegates we need
// lets us accept both the full PrismaClient and an interactive transaction
// client without importing internal Prisma generated types.
type PrismaCreditTransaction = Pick<
  PrismaDatabaseClient,
  "creditWallet" | "creditReservation" | "creditLedgerEntry"
>;

/**
 * Prisma-backed implementation of the CreditStore interface.
 * All operations run inside Prisma transactions so the billing package
 * remains consistent even when multiple credit mutations happen together.
 */
export class PrismaCreditStore implements CreditStore {
  constructor(private readonly prisma: PrismaDatabaseClient) {}

  async transaction<T>(
    callback: (transaction: CreditStoreTransaction) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const transaction = new PrismaCreditStoreTransaction(tx);
      return callback(transaction);
    });
  }
}

class PrismaCreditStoreTransaction implements CreditStoreTransaction {
  constructor(private readonly tx: PrismaCreditTransaction) {}

  async getWalletByUserId(userId: string): Promise<CreditWallet | null> {
    const wallet = await this.tx.creditWallet.findUnique({
      where: { userId },
    });

    return (wallet as CreditWallet | null) ?? null;
  }

  async createWallet(
    userId: string,
    initialCredits: number,
  ): Promise<CreditWallet> {
    const wallet = await this.tx.creditWallet.create({
      data: {
        userId,
        availableCredits: initialCredits,
      },
    });

    return wallet as CreditWallet;
  }

  async updateWallet(
    walletId: string,
    values: Pick<CreditWallet, "availableCredits" | "reservedCredits">,
  ): Promise<CreditWallet> {
    const wallet = await this.tx.creditWallet.update({
      where: { id: walletId },
      data: {
        availableCredits: values.availableCredits,
        reservedCredits: values.reservedCredits,
      },
    });

    return wallet as CreditWallet;
  }

  async findLedgerEntryByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<CreditLedgerEntry | null> {
    const entry = await this.tx.creditLedgerEntry.findUnique({
      where: { idempotencyKey },
    });

    return entry ? (this.mapLedgerEntry(entry) as CreditLedgerEntry) : null;
  }

  async createLedgerEntry(
    entry: Omit<CreditLedgerEntry, "id" | "createdAt">,
  ): Promise<CreditLedgerEntry> {
    const created = await this.tx.creditLedgerEntry.create({
      data: {
        userId: entry.userId,
        walletId: entry.walletId,
        reservationId: entry.reservationId,
        generationRequestId: entry.generationRequestId,
        platform: entry.platform,
        type: entry.type,
        amount: entry.amount,
        idempotencyKey: entry.idempotencyKey,
        metadata: entry.metadata,
      },
    } as any);

    return this.mapLedgerEntry(created) as CreditLedgerEntry;
  }

  async listLedgerEntries(userId: string): Promise<CreditLedgerEntry[]> {
    const entries = await this.tx.creditLedgerEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    return entries.map(
      (entry) => this.mapLedgerEntry(entry) as CreditLedgerEntry,
    );
  }

  async createReservation(input: {
    userId: string;
    generationRequestId: string;
    reservedCredits: number;
  }): Promise<CreditReservation> {
    const reservation = await this.tx.creditReservation.create({
      data: {
        userId: input.userId,
        generationRequestId: input.generationRequestId,
        reservedCredits: input.reservedCredits,
      },
    });

    return reservation as CreditReservation;
  }

  async findReservationById(
    reservationId: string,
  ): Promise<CreditReservation | null> {
    const reservation = await this.tx.creditReservation.findUnique({
      where: { id: reservationId },
    });

    return (reservation as CreditReservation | null) ?? null;
  }

  async findReservationByGenerationRequestId(
    generationRequestId: string,
  ): Promise<CreditReservation | null> {
    const reservation = await this.tx.creditReservation.findFirst({
      where: { generationRequestId },
    });

    return (reservation as CreditReservation | null) ?? null;
  }

  async updateReservation(
    reservationId: string,
    values: Pick<
      CreditReservation,
      "capturedCredits" | "releasedCredits" | "status"
    >,
  ): Promise<CreditReservation> {
    const reservation = await this.tx.creditReservation.update({
      where: { id: reservationId },
      data: {
        capturedCredits: values.capturedCredits,
        releasedCredits: values.releasedCredits,
        status: values.status,
      },
    });

    return reservation as CreditReservation;
  }

  async findCaptureForReservationPlatform(
    reservationId: string,
    platform: Platform,
  ): Promise<CreditLedgerEntry | null> {
    const entry = await this.tx.creditLedgerEntry.findFirst({
      where: {
        reservationId,
        platform,
        type: "platform_capture",
      },
    });

    return entry ? (this.mapLedgerEntry(entry) as CreditLedgerEntry) : null;
  }

  async listCaptureLedgerEntries(userId: string): Promise<CreditLedgerEntry[]> {
    const entries = await this.tx.creditLedgerEntry.findMany({
      where: {
        userId,
        type: "platform_capture",
      },
      orderBy: { createdAt: "asc" },
    });

    return entries.map(
      (entry) => this.mapLedgerEntry(entry) as CreditLedgerEntry,
    );
  }

  private mapLedgerEntry(entry: unknown): CreditLedgerEntry {
    const e = entry as Record<string, unknown>;

    return {
      id: e.id as string,
      userId: e.userId as string,
      walletId: e.walletId as string,
      reservationId: (e.reservationId as string | null) ?? null,
      generationRequestId: (e.generationRequestId as string | null) ?? null,
      platform: (e.platform as Platform | null) ?? null,
      type: e.type as CreditLedgerEntry["type"],
      amount: e.amount as number,
      idempotencyKey: e.idempotencyKey as string,
      metadata: (e.metadata as Record<string, unknown> | null) ?? null,
      createdAt: e.createdAt as Date,
    };
  }
}

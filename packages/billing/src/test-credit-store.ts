import type { Platform } from "@melotech/shared";
import type {
  CreditLedgerEntry,
  CreditReservation,
  CreditStore,
  CreditStoreTransaction,
  CreditWallet,
} from "./types.js";

type State = {
  wallets: CreditWallet[];
  reservations: CreditReservation[];
  ledgerEntries: CreditLedgerEntry[];
  sequence: number;
};

export class InMemoryCreditStore implements CreditStore {
  private state: State = {
    wallets: [],
    reservations: [],
    ledgerEntries: [],
    sequence: 0,
  };

  async transaction<T>(
    callback: (transaction: CreditStoreTransaction) => Promise<T>,
  ): Promise<T> {
    const nextState = cloneState(this.state);
    const transaction = new InMemoryCreditStoreTransaction(nextState);
    const result = await callback(transaction);

    // The clone is committed only after the callback succeeds.
    // This mirrors the all-or-nothing shape of a database transaction.
    this.state = nextState;

    return result;
  }

  setLedgerCreatedAt(idempotencyKey: string, createdAt: Date): void {
    const entry = this.state.ledgerEntries.find(
      (ledgerEntry) => ledgerEntry.idempotencyKey === idempotencyKey,
    );

    if (!entry) {
      throw new Error("Ledger entry was not found.");
    }

    entry.createdAt = createdAt;
  }
}

class InMemoryCreditStoreTransaction implements CreditStoreTransaction {
  constructor(private readonly state: State) {}

  async getWalletByUserId(userId: string) {
    return this.state.wallets.find((wallet) => wallet.userId === userId) ?? null;
  }

  async createWallet(userId: string, initialCredits: number) {
    if (this.state.wallets.some((wallet) => wallet.userId === userId)) {
      throw new Error("User already has a credit wallet.");
    }

    const now = new Date();
    const wallet: CreditWallet = {
      id: this.nextId("wallet"),
      userId,
      availableCredits: initialCredits,
      reservedCredits: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.state.wallets.push(wallet);
    return wallet;
  }

  async updateWallet(
    walletId: string,
    values: Pick<CreditWallet, "availableCredits" | "reservedCredits">,
  ) {
    const wallet = this.state.wallets.find(({ id }) => id === walletId);

    if (!wallet) {
      throw new Error("Wallet was not found.");
    }

    Object.assign(wallet, values, { updatedAt: new Date() });
    return wallet;
  }

  async findLedgerEntryByIdempotencyKey(idempotencyKey: string) {
    return (
      this.state.ledgerEntries.find(
        (ledgerEntry) => ledgerEntry.idempotencyKey === idempotencyKey,
      ) ?? null
    );
  }

  async createLedgerEntry(entry: Omit<CreditLedgerEntry, "id" | "createdAt">) {
    if (
      this.state.ledgerEntries.some(
        ({ idempotencyKey }) => idempotencyKey === entry.idempotencyKey,
      )
    ) {
      throw new Error("Ledger idempotency key already exists.");
    }

    const ledgerEntry: CreditLedgerEntry = {
      ...entry,
      id: this.nextId("ledger"),
      createdAt: new Date(),
    };

    this.state.ledgerEntries.push(ledgerEntry);
    return ledgerEntry;
  }

  async listLedgerEntries(userId: string) {
    return this.state.ledgerEntries
      .filter((entry) => entry.userId === userId)
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  }

  async createReservation(input: {
    userId: string;
    generationRequestId: string;
    reservedCredits: number;
  }) {
    if (
      this.state.reservations.some(
        ({ generationRequestId }) =>
          generationRequestId === input.generationRequestId,
      )
    ) {
      throw new Error("Generation already has a credit reservation.");
    }

    const now = new Date();
    const reservation: CreditReservation = {
      id: this.nextId("reservation"),
      userId: input.userId,
      generationRequestId: input.generationRequestId,
      reservedCredits: input.reservedCredits,
      capturedCredits: 0,
      releasedCredits: 0,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    this.state.reservations.push(reservation);
    return reservation;
  }

  async findReservationById(reservationId: string) {
    return (
      this.state.reservations.find(({ id }) => id === reservationId) ?? null
    );
  }

  async findReservationByGenerationRequestId(generationRequestId: string) {
    return (
      this.state.reservations.find(
        (reservation) =>
          reservation.generationRequestId === generationRequestId,
      ) ?? null
    );
  }

  async updateReservation(
    reservationId: string,
    values: Pick<
      CreditReservation,
      "capturedCredits" | "releasedCredits" | "status"
    >,
  ) {
    const reservation = this.state.reservations.find(
      ({ id }) => id === reservationId,
    );

    if (!reservation) {
      throw new Error("Reservation was not found.");
    }

    Object.assign(reservation, values, { updatedAt: new Date() });
    return reservation;
  }

  async findCaptureForReservationPlatform(
    reservationId: string,
    platform: Platform,
  ) {
    return (
      this.state.ledgerEntries.find(
        (entry) =>
          entry.reservationId === reservationId &&
          entry.platform === platform &&
          entry.type === "platform_capture",
      ) ?? null
    );
  }

  async listCaptureLedgerEntries(userId: string) {
    return this.state.ledgerEntries.filter(
      (entry) => entry.userId === userId && entry.type === "platform_capture",
    );
  }

  private nextId(prefix: string): string {
    this.state.sequence += 1;
    return `${prefix}_${this.state.sequence}`;
  }
}

function cloneState(state: State): State {
  return {
    sequence: state.sequence,
    wallets: state.wallets.map((wallet) => ({ ...wallet })),
    reservations: state.reservations.map((reservation) => ({
      ...reservation,
    })),
    ledgerEntries: state.ledgerEntries.map((entry) => ({ ...entry })),
  };
}


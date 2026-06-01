import type { Platform } from "@melotech/shared";

export const LEDGER_ENTRY_TYPES = [
  "grant",
  "reservation_hold",
  "platform_capture",
  "reservation_release",
  "adjustment",
] as const;

export type LedgerEntryType = (typeof LEDGER_ENTRY_TYPES)[number];

export const RESERVATION_STATUSES = [
  "active",
  "captured",
  "partially_captured",
  "released",
  "cancelled",
] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export type UsageTimeframe = "daily" | "weekly" | "monthly";

export type CreditWallet = {
  id: string;
  userId: string;
  availableCredits: number;
  reservedCredits: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreditReservation = {
  id: string;
  userId: string;
  generationRequestId: string;
  reservedCredits: number;
  capturedCredits: number;
  releasedCredits: number;
  status: ReservationStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type CreditLedgerEntry = {
  id: string;
  userId: string;
  walletId: string;
  reservationId: string | null;
  generationRequestId: string | null;
  platform: Platform | null;
  type: LedgerEntryType;
  amount: number;
  idempotencyKey: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export type UsageAnalyticsPoint = {
  period: string;
  consumedCredits: number;
};

export type CreditStoreTransaction = {
  getWalletByUserId(userId: string): Promise<CreditWallet | null>;
  createWallet(userId: string, initialCredits: number): Promise<CreditWallet>;
  updateWallet(
    walletId: string,
    values: Pick<CreditWallet, "availableCredits" | "reservedCredits">,
  ): Promise<CreditWallet>;
  findLedgerEntryByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<CreditLedgerEntry | null>;
  createLedgerEntry(
    entry: Omit<CreditLedgerEntry, "id" | "createdAt">,
  ): Promise<CreditLedgerEntry>;
  listLedgerEntries(userId: string): Promise<CreditLedgerEntry[]>;
  createReservation(input: {
    userId: string;
    generationRequestId: string;
    reservedCredits: number;
  }): Promise<CreditReservation>;
  findReservationById(reservationId: string): Promise<CreditReservation | null>;
  findReservationByGenerationRequestId(
    generationRequestId: string,
  ): Promise<CreditReservation | null>;
  updateReservation(
    reservationId: string,
    values: Pick<
      CreditReservation,
      "capturedCredits" | "releasedCredits" | "status"
    >,
  ): Promise<CreditReservation>;
  findCaptureForReservationPlatform(
    reservationId: string,
    platform: Platform,
  ): Promise<CreditLedgerEntry | null>;
  listCaptureLedgerEntries(userId: string): Promise<CreditLedgerEntry[]>;
};

export type CreditStore = {
  transaction<T>(
    callback: (transaction: CreditStoreTransaction) => Promise<T>,
  ): Promise<T>;
};


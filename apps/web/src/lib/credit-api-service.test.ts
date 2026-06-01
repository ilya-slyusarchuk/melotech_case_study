import { describe, expect, it } from "vitest";
import {
  getWallet,
  grantCredits,
  getLedger,
  getUsage,
  TEST_CREDIT_AMOUNT,
} from "./credit-api-service";
import { ValidationError } from "./api-helpers";
import type { CreditService } from "@melotech/billing";

function createMockCreditService(): CreditService {
  return {
    readWalletBalance: () => Promise.resolve(null),
    readLedgerHistory: () => Promise.resolve([]),
    readUsageAnalytics: () => Promise.resolve([]),
    ensureWalletForUser: () => Promise.resolve({ id: "wallet_1" }),
    grantCredits: () => Promise.resolve({ id: "ledger_1" }),
    createWalletForUser: () => Promise.resolve({ id: "wallet_1" }),
    reserveCreditsForGeneration: () => Promise.resolve({ id: "res_1" }),
    captureCreditsForSuccessfulPlatform: () => Promise.resolve(null),
    releaseUnusedReservedCredits: () => Promise.resolve(null),
    findReservationForGeneration: () => Promise.resolve(null),
  } as unknown as CreditService;
}

describe("getWallet", () => {
  it("returns wallet data when wallet exists", async () => {
    const service = createMockCreditService();
    service.readWalletBalance = () =>
      Promise.resolve({
        id: "wallet_1",
        userId: "user_a",
        availableCredits: 50,
        reservedCredits: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    const response = await getWallet("user_a", service);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toMatchObject({
      availableCredits: 50,
      reservedCredits: 10,
    });
  });

  it("returns zero credits when wallet does not exist", async () => {
    const service = createMockCreditService();
    service.readWalletBalance = () => Promise.resolve(null);

    const response = await getWallet("user_a", service);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toMatchObject({
      availableCredits: 0,
      reservedCredits: 0,
    });
  });
});

describe("grantCredits", () => {
  it("grants exactly 100 credits", async () => {
    const service = createMockCreditService();
    (service as any).grantCredits = () => Promise.resolve({ id: "ledger_1" });

    const response = await grantCredits("user_a", service);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.granted).toBe(TEST_CREDIT_AMOUNT);
    expect(body.ledgerEntryId).toBe("ledger_1");
  });
});

describe("getLedger", () => {
  it("returns entries newest first", async () => {
    const service = createMockCreditService();
    service.readLedgerHistory = () =>
      Promise.resolve([
        {
          id: "entry_1",
          userId: "user_a",
          walletId: "wallet_1",
          reservationId: null,
          generationRequestId: null,
          platform: null,
          type: "grant",
          amount: 100,
          idempotencyKey: "key_1",
          metadata: null,
          createdAt: new Date("2024-01-01"),
        },
        {
          id: "entry_2",
          userId: "user_a",
          walletId: "wallet_1",
          reservationId: null,
          generationRequestId: null,
          platform: null,
          type: "platform_capture",
          amount: 2,
          idempotencyKey: "key_2",
          metadata: null,
          createdAt: new Date("2024-01-02"),
        },
      ]);

    const response = await getLedger("user_a", service);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.entries).toHaveLength(2);
    // Newest first means entry_2 should be first.
    expect(body.entries[0].id).toBe("entry_2");
  });
});

describe("getUsage", () => {
  it("defaults to daily timeframe", async () => {
    const service = createMockCreditService();
    service.readUsageAnalytics = (userId, timeframe) => {
      expect(timeframe).toBe("daily");
      return Promise.resolve([{ period: "2024-01-01", consumedCredits: 3 }]);
    };

    const response = await getUsage("user_a", null, service);
    expect(response.status).toBe(200);
  });

  it("rejects invalid timeframe", async () => {
    const service = createMockCreditService();

    await expect(getUsage("user_a", "invalid", service)).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("returns labels and consumed credits", async () => {
    const service = createMockCreditService();
    service.readUsageAnalytics = () =>
      Promise.resolve([
        { period: "2024-01-01", consumedCredits: 3 },
        { period: "2024-01-02", consumedCredits: 1 },
      ]);

    const response = await getUsage("user_a", "daily", service);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.labels).toEqual(["2024-01-01", "2024-01-02"]);
    expect(body.consumedCredits).toEqual([3, 1]);
  });
});

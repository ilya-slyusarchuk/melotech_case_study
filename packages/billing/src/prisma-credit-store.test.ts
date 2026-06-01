import { describe, expect, it, vi } from "vitest";
import { PrismaCreditStore } from "./prisma-credit-store.js";

// Minimal mock Prisma client that captures transaction callbacks.
function createMockPrisma() {
  const transactions: unknown[] = [];

  return {
    $transaction: vi.fn(async (callback: unknown) => {
      // Simulate a Prisma transaction client with only the credit delegates.
      const tx = {
        creditWallet: {
          findUnique: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
        },
        creditReservation: {
          findUnique: vi.fn(),
          findFirst: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
        },
        creditLedgerEntry: {
          findUnique: vi.fn(),
          create: vi.fn(),
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
      };

      transactions.push(tx);

      if (typeof callback === "function") {
        return (callback as (tx: unknown) => Promise<unknown>)(tx);
      }

      throw new Error("Expected callback transaction.");
    }),
    transactions,
  };
}

describe("PrismaCreditStore", () => {
  it("wraps operations in a Prisma transaction", async () => {
    const mockPrisma = createMockPrisma();
    const store = new PrismaCreditStore(mockPrisma as unknown as Parameters<
      typeof PrismaCreditStore
    >[0]);

    const callback = vi.fn().mockResolvedValue("result");
    const result = await store.transaction(callback);

    expect(result).toBe("result");
    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(callback).toHaveBeenCalled();
  });
});

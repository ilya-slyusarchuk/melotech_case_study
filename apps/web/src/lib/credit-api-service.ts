import type { CreditService } from "@melotech/billing";
import { z } from "zod";
import { ValidationError } from "./api-helpers";

// Fixed amount for test/demo credits. The frontend cannot influence this.
export const TEST_CREDIT_AMOUNT = 100;

/**
 * Returns the user's credit wallet, including available and reserved credits.
 */
export async function getWallet(userId: string, creditService: CreditService): Promise<Response> {
  const wallet = await creditService.readWalletBalance(userId);

  if (!wallet) {
    return Response.json(
      { availableCredits: 0, reservedCredits: 0 },
      { status: 200 },
    );
  }

  return Response.json({
    availableCredits: wallet.availableCredits,
    reservedCredits: wallet.reservedCredits,
  });
}

/**
 * Grants exactly 100 test credits to the user.
 * Creates a grant ledger entry.
 */
export async function grantCredits(
  userId: string,
  creditService: CreditService,
): Promise<Response> {
  // Ensure wallet exists before granting credits.
  await creditService.ensureWalletForUser(userId);

  const entry = await creditService.grantCredits({
    userId,
    amount: TEST_CREDIT_AMOUNT,
    idempotencyKey: `grant:${userId}:${Date.now()}`,
  });

  return Response.json({
    granted: TEST_CREDIT_AMOUNT,
    ledgerEntryId: entry.id,
  });
}

/**
 * Returns the user's credit ledger history, newest first.
 */
export async function getLedger(
  userId: string,
  creditService: CreditService,
): Promise<Response> {
  const entries = await creditService.readLedgerHistory(userId);

  // Reverse so the newest entries appear first.
  const sorted = [...entries].reverse();

  return Response.json({ entries: sorted });
}

const timeframeSchema = z.enum(["daily", "weekly", "monthly"]);

/**
 * Returns captured platform credit usage grouped by timeframe.
 */
export async function getUsage(
  userId: string,
  rawTimeframe: string | null,
  creditService: CreditService,
): Promise<Response> {
  const timeframe = rawTimeframe ?? "daily";
  const parsed = timeframeSchema.safeParse(timeframe);

  if (!parsed.success) {
    throw new ValidationError(
      "Invalid timeframe. Must be daily, weekly, or monthly.",
    );
  }

  const analytics = await creditService.readUsageAnalytics(userId, parsed.data);

  const labels = analytics.map((point) => point.period);
  const consumedCredits = analytics.map((point) => point.consumedCredits);

  return Response.json({
    timeframe: parsed.data,
    labels,
    consumedCredits,
  });
}

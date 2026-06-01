import type {
  CreditLedgerEntry,
  UsageAnalyticsPoint,
  UsageTimeframe,
} from "./types.js";

export function groupCaptureUsageByTimeframe(
  captures: readonly CreditLedgerEntry[],
  timeframe: UsageTimeframe,
): UsageAnalyticsPoint[] {
  const usageByPeriod = new Map<string, number>();

  for (const capture of captures) {
    const period = formatPeriod(capture.createdAt, timeframe);
    usageByPeriod.set(period, (usageByPeriod.get(period) ?? 0) + capture.amount);
  }

  return [...usageByPeriod.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([period, consumedCredits]) => ({ period, consumedCredits }));
}

function formatPeriod(date: Date, timeframe: UsageTimeframe): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();

  if (timeframe === "monthly") {
    return `${year}-${String(month + 1).padStart(2, "0")}`;
  }

  if (timeframe === "weekly") {
    const day = date.getUTCDay() || 7;
    const monday = new Date(Date.UTC(year, month, date.getUTCDate() - day + 1));
    return monday.toISOString().slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}


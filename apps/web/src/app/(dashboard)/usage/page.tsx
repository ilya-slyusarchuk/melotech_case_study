"use client";

import { useEffect, useState } from "react";
import { CreditBalance } from "../../../components/usage/credit-balance";
import { UsageChart } from "../../../components/usage/usage-chart";
import { LedgerTable } from "../../../components/usage/ledger-table";
import { Button } from "../../../components/ui/button";
import { Loader2 } from "lucide-react";
import { notifyWalletUpdated } from "../../../hooks/wallet-events";

/**
 * Usage page.
 *
 * Shows available credits, reserved credits, a grant button,
 * usage history table, and a chart of consumed credits.
 * Supports daily, weekly, and monthly timeframe selectors.
 * Defaults to daily.
 * Only consumed credits are counted in the chart.
 */
export default function UsagePage() {
  const [wallet, setWallet] = useState<{
    availableCredits: number;
    reservedCredits: number;
  } | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [usage, setUsage] = useState<{
    labels: string[];
    consumedCredits: number[];
  }>({ labels: [], consumedCredits: [] });
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">(
    "daily",
  );
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    try {
      const [walletRes, ledgerRes, usageRes] = await Promise.all([
        fetch("/api/credits/wallet"),
        fetch("/api/credits/ledger"),
        fetch(`/api/credits/usage?timeframe=${timeframe}`),
      ]);

      if (!walletRes.ok || !ledgerRes.ok || !usageRes.ok) {
        setError("Failed to load usage data.");
        return;
      }

      const walletData = (await walletRes.json()) as {
        availableCredits: number;
        reservedCredits: number;
      };
      const ledgerData = (await ledgerRes.json()) as { entries: LedgerEntry[] };
      const usageData = (await usageRes.json()) as {
        labels: string[];
        consumedCredits: number[];
      };

      setWallet(walletData);
      notifyWalletUpdated(walletData);
      setLedger(ledgerData.entries);
      setUsage(usageData);
    } catch {
      setError("Failed to load usage data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [timeframe]);

  async function handleGrant() {
    setGranting(true);
    try {
      const response = await fetch("/api/credits/grant", {
        method: "POST",
      });

      if (!response.ok) {
        setError("Failed to grant credits.");
        return;
      }

      // Refresh all data after granting.
      await fetchData();
    } catch {
      setError("Failed to grant credits.");
    } finally {
      setGranting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-text-primary">
          Credit Usage
        </h1>
        <p className="text-sm text-text-secondary">
          Understand credit balance and consumption.
        </p>
      </div>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
        </div>
      )}

      {!loading && error && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-error">{error}</p>
        </div>
      )}

      {!loading && !error && wallet && (
        <>
          <CreditBalance
            availableCredits={wallet.availableCredits}
            reservedCredits={wallet.reservedCredits}
            onGrant={handleGrant}
            granting={granting}
          />

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">Timeframe:</span>
              <div className="flex gap-1">
                {(["daily", "weekly", "monthly"] as const).map((tf) => (
                  <Button
                    key={tf}
                    variant={timeframe === tf ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setTimeframe(tf)}
                  >
                    {tf.charAt(0).toUpperCase() + tf.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <UsageChart
              labels={usage.labels}
              consumedCredits={usage.consumedCredits}
            />
          </div>

          <LedgerTable entries={ledger} />
        </>
      )}
    </div>
  );
}

type LedgerEntry = {
  id: string;
  type: string;
  amount: number;
  platform?: string | null;
  createdAt: string;
};

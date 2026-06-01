"use client";

import { useState, useEffect, useCallback } from "react";

export type WalletData = {
  availableCredits: number;
  reservedCredits: number;
};

/**
 * React hook that fetches and refreshes the user's credit wallet.
 *
 * Polls every 10 seconds as a fallback, but callers should also
 * listen to SSE credits_update events for realtime updates.
 */
export function useWallet() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    try {
      const response = await fetch("/api/credits/wallet");

      if (!response.ok) {
        if (response.status === 401) {
          setWallet(null);
          setError(null);
          return;
        }
        throw new Error(`Wallet fetch failed: ${response.status}`);
      }

      const data = (await response.json()) as WalletData;
      setWallet(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();

    // Poll every 10 seconds as a safety net.
    const interval = setInterval(fetchWallet, 10_000);
    return () => clearInterval(interval);
  }, [fetchWallet]);

  return { wallet, loading, error, refresh: fetchWallet };
}

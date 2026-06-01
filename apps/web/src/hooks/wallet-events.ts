"use client";

import type { WalletData } from "./use-wallet";

export const walletUpdatedEventName = "melotech:wallet-updated";

/**
 * Broadcasts wallet updates between client components that do not share a
 * direct React parent. This keeps the dashboard shell in sync after a grant.
 */
export function notifyWalletUpdated(wallet: WalletData) {
  window.dispatchEvent(
    new CustomEvent<WalletData>(walletUpdatedEventName, {
      detail: wallet,
    }),
  );
}

export function isWalletData(value: unknown): value is WalletData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const maybeWallet = value as Partial<WalletData>;
  return (
    typeof maybeWallet.availableCredits === "number" &&
    typeof maybeWallet.reservedCredits === "number"
  );
}

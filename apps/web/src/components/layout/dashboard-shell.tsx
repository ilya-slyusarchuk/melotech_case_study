"use client";

import { TopNav } from "./top-nav";
import { useSession } from "../../lib/auth-client";
import { useWallet } from "../../hooks/use-wallet";

/**
 * Authenticated dashboard layout shell.
 *
 * Wraps all authenticated pages with the top navigation and
 * credit balance display. Provides a consistent full-page dark
 * canvas for the Melotech aesthetic.
 */
export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const { wallet } = useWallet();

  // If the user is not authenticated, do not render the dashboard shell.
  // The individual pages should handle redirects.
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-bg-primary">{children}</div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary">
      <TopNav
        availableCredits={wallet?.availableCredits ?? 0}
        reservedCredits={wallet?.reservedCredits ?? 0}
      />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}

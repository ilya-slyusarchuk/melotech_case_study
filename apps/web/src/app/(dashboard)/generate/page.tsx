"use client";

import { GenerationForm } from "../../../components/generation/generation-form";
import { useSession } from "../../../lib/auth-client";
import { useWallet } from "../../../hooks/use-wallet";
import Link from "next/link";

/**
 * Generation page — the primary dashboard view.
 *
 * Shows the generation form for authenticated users.
 * Unauthenticated users see a login prompt.
 */
export default function GeneratePage() {
  const { data: session } = useSession();
  const { wallet } = useWallet();

  if (!session?.user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-text-primary">
          Distribution Pipeline
        </h1>
        <p className="text-text-secondary">
          Sign in to start generating multi-platform content.
        </p>
        <Link
          href="/login"
          className="mt-2 rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-bg-primary hover:bg-white/90"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-text-primary">
          Distribution Pipeline
        </h1>
        <p className="text-sm text-text-secondary">
          Prepare one concept for every platform.
        </p>
      </div>

      <GenerationForm
        availableCredits={wallet?.availableCredits ?? 0}
      />
    </div>
  );
}

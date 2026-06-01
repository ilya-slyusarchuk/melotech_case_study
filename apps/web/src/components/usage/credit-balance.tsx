"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Zap, TrendingUp, Lock } from "lucide-react";

/**
 * Credit balance card.
 *
 * Shows available and reserved credits with a grant button.
 */
export interface CreditBalanceProps {
  availableCredits: number;
  reservedCredits: number;
  onGrant: () => void;
  granting: boolean;
}

export function CreditBalance({
  availableCredits,
  reservedCredits,
  onGrant,
  granting,
}: CreditBalanceProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-white/[0.04] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10">
              <Zap className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-text-tertiary">Available</p>
              <p className="text-xl font-mono font-semibold text-text-primary">
                {availableCredits}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-white/[0.04] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-processing/10">
              <Lock className="h-4 w-4 text-processing" />
            </div>
            <div>
              <p className="text-xs text-text-tertiary">Reserved</p>
              <p className="text-xl font-mono font-semibold text-text-primary">
                {reservedCredits}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={onGrant}
            isLoading={granting}
          >
            <TrendingUp className="h-4 w-4" />
            Add 100 Credits
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

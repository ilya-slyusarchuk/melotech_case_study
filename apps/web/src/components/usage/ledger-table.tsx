"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { ArrowDownLeft, ArrowUpRight, Minus } from "lucide-react";

/**
 * Ledger history table.
 *
 * Shows credit ledger entries newest first.
 * Grants are shown but visually distinguished from captures.
 */
export interface LedgerEntry {
  id: string;
  type: string;
  amount: number;
  platform?: string | null;
  createdAt: string;
}

export interface LedgerTableProps {
  entries: LedgerEntry[];
}

export function LedgerTable({ entries }: LedgerTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ledger History</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-text-tertiary">No entries yet.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-border-subtle px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary sm:grid">
              <span>Type</span>
              <span>Platform</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Date</span>
            </div>

            <div className="flex max-h-96 flex-col overflow-y-auto pr-1">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="grid grid-cols-1 gap-1 border-b border-border-subtle px-4 py-3 text-sm last:border-0 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-4"
                >
                  <div className="flex items-center gap-2">
                    <EntryIcon type={entry.type} />
                    <span className="text-text-primary">
                      {formatEntryType(entry.type)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {entry.platform ? (
                      <Badge variant={entry.platform as BadgeVariant}>
                        {entry.platform}
                      </Badge>
                    ) : (
                      <span className="text-text-tertiary">—</span>
                    )}
                  </div>

                  <span
                    className={`font-mono font-medium sm:text-right ${
                      getAmountColor(entry.type)
                    }`}
                  >
                    {formatAmount(entry.type, entry.amount)}
                  </span>

                  <span className="text-xs text-text-tertiary sm:text-right">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EntryIcon({ type }: { type: string }) {
  if (type === "grant" || type === "reservation_release") {
    return <ArrowDownLeft className="h-4 w-4 text-success" />;
  }
  if (type === "platform_capture" || type === "reservation_hold") {
    return <ArrowUpRight className="h-4 w-4 text-error" />;
  }
  return <Minus className="h-4 w-4 text-text-tertiary" />;
}

function formatEntryType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getAmountColor(type: string): string {
  if (type === "grant" || type === "reservation_release") {
    return "text-success";
  }
  if (type === "platform_capture" || type === "reservation_hold") {
    return "text-error";
  }
  return "text-text-secondary";
}

function formatAmount(type: string, amount: number): string {
  const sign =
    type === "grant" || type === "reservation_release"
      ? "+"
      : "-";
  return `${sign}${amount}`;
}

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "processing"
  | "cache"
  | "spotify"
  | "tiktok"
  | "youtube";

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

/**
 * Simple SVG bar chart for consumed credits.
 *
 * Renders a minimal bar chart that fits small screens.
 * No external chart library needed.
 */
export interface UsageChartProps {
  labels: string[];
  consumedCredits: number[];
}

export function UsageChart({ labels, consumedCredits }: UsageChartProps) {
  const maxValue = Math.max(...consumedCredits, 1);
  const barCount = labels.length;
  const hasData = consumedCredits.some((v) => v > 0);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Consumed Credits</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-text-tertiary">No consumption yet.</p>
          </div>
        ) : (
          <div className="flex h-48 flex-col">
            <div className="flex flex-1 items-end gap-1">
              {labels.map((label, i) => {
                const value = consumedCredits[i] ?? 0;
                const heightPercent = (value / maxValue) * 100;

                return (
                  <div
                    key={label}
                    className="flex flex-1 flex-col items-center justify-end gap-1"
                  >
                    <div
                      className="w-full max-w-[32px] rounded-t-md bg-white/[0.12] transition-all hover:bg-white/[0.2]"
                      style={{
                        height: `${Math.max(heightPercent, 4)}%`,
                      }}
                      title={`${label}: ${value} credits`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex gap-1">
              {labels.map((label) => (
                <div
                  key={label}
                  className="flex flex-1 justify-center"
                >
                  <span className="max-w-[48px] truncate text-center text-[10px] text-text-tertiary">
                    {formatLabel(label)}
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

function formatLabel(label: string): string {
  // Try to extract a short date representation.
  // Daily: "2024-01-15" -> "Jan 15"
  // Weekly: "2024-W03" -> "W03"
  // Monthly: "2024-01" -> "Jan"
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
    const d = new Date(label);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (/^\d{4}-W\d{2}$/.test(label)) {
    return label.slice(5);
  }
  if (/^\d{4}-\d{2}$/.test(label)) {
    const d = new Date(`${label}-01`);
    return d.toLocaleDateString("en-US", { month: "short" });
  }
  return label;
}

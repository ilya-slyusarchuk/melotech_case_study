"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

/**
 * Simple bar chart for consumed credits with y-axis and hover tooltips.
 *
 * Renders a minimal bar chart that fits small screens.
 * No external chart library needed.
 * Bars use a functional color from the design palette so they remain
 * visible against the glass card surface.
 *
 * Tooltips are rendered inline inside each bar div so there is no
 * intermediate wrapper that breaks percentage-height resolution.
 */
export interface UsageChartProps {
  labels: string[];
  consumedCredits: number[];
}

export function UsageChart({ labels, consumedCredits }: UsageChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxValue = Math.max(...consumedCredits, 1);
  const hasData = consumedCredits.some((v) => v > 0);

  // Normalize the y-axis to a clean ceiling value so the top tick is a
  // whole number and bars are proportioned against it.
  const yAxisMax = Math.ceil(maxValue);

  // Show ticks at the max, midpoint, and zero.
  const ticks = [yAxisMax, Math.round(yAxisMax / 2), 0];

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
          <div className="flex h-48 flex-col gap-1">
            {/* Bar area: y-axis + bars side-by-side. */}
            <div className="flex flex-1 gap-2">
              {/* Y-axis tick labels */}
              <div
                className="flex w-10 flex-col justify-between text-right text-[10px] text-text-tertiary"
                data-testid="y-axis"
              >
                {ticks.map((tick) => (
                  <span key={tick}>{tick}</span>
                ))}
              </div>

              {/* Bars */}
              {/* We intentionally omit items-end here. The default
                  align-items: stretch gives each wrapper a definite
                  height so the bar's percentage height works. The
                  wrapper's justify-end then pushes the bar to the
                  bottom, producing the same visual alignment. */}
              <div className="flex flex-1 gap-1">
                {labels.map((label, i) => {
                  const value = consumedCredits[i] ?? 0;
                  const heightPercent = (value / yAxisMax) * 100;
                  const isHovered = hoveredIndex === i;

                  return (
                    <div
                      key={label}
                      className="flex flex-1 flex-col items-center justify-end gap-1"
                    >
                      <div
                        aria-label={`${value} credits on ${formatLabel(label)}`}
                        className="relative w-8 cursor-pointer rounded-t-md bg-cache transition-all hover:bg-cache/70"
                        style={{
                          height: `${Math.max(heightPercent, 4)}%`,
                        }}
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {isHovered && (
                          <div
                            className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border-subtle bg-surface-glass px-3 py-1.5 text-xs text-text-primary shadow-lg backdrop-blur-sm"
                            role="tooltip"
                          >
                            <strong>{formatLabel(label)}</strong>: {value}{" "}
                            credits
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* X-axis labels row – aligned under the bars via a spacer. */}
            <div className="flex gap-2">
              <div className="w-10" />
              <div className="flex flex-1 gap-1">
                {labels.map((label) => (
                  <div key={label} className="flex flex-1 justify-center">
                    <span className="max-w-[48px] truncate text-center text-[10px] text-text-tertiary">
                      {formatLabel(label)}
                    </span>
                  </div>
                ))}
              </div>
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

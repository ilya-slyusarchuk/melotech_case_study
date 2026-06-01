"use client";

import Link from "next/link";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { buildAudienceDisplayChips } from "@melotech/shared";
import type { Platform } from "@melotech/shared";
import { Clock } from "lucide-react";

/**
 * Single history item component.
 *
 * Shows prompt preview, status, platforms, audience metadata,
 * created time, and consumed credits. Clicking navigates to detail.
 */
export interface GenerationHistoryItemProps {
  id: string;
  rawPrompt: string;
  status: string;
  platforms: Platform[];
  region?: string | null;
  ageRange?: string | null;
  gender?: string | null;
  consumedCredits?: number | null;
  createdAt: string;
}

export function GenerationHistoryItem({
  id,
  rawPrompt,
  status,
  platforms,
  region,
  ageRange,
  gender,
  consumedCredits,
  createdAt,
}: GenerationHistoryItemProps) {
  const audienceChips = buildAudienceDisplayChips({ region, ageRange, gender });
  const date = new Date(createdAt);

  const statusVariant: Record<
    string,
    "default" | "success" | "warning" | "error" | "processing"
  > = {
    pending: "default",
    processing: "processing",
    completed: "success",
    partial: "warning",
    failed: "error",
  };

  return (
    <Link href={`/generations/${id}`}>
      <Card className="cursor-pointer transition-colors hover:border-border-active hover:bg-white/[0.04]">
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-sm font-medium text-text-primary">
              {rawPrompt}
            </p>
            <Badge variant={statusVariant[status] ?? "default"}>
              {status.replace("_", " ").toUpperCase()}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {platforms.map((platform) => (
              <Badge key={platform} variant={platform}>
                {platform}
              </Badge>
            ))}
          </div>

          {audienceChips.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {audienceChips.map((chip) => (
                <Badge key={chip.key} variant="default">
                  {chip.value}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-text-tertiary">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {date.toLocaleString()}
            </span>
            {typeof consumedCredits === "number" && (
              <span>{consumedCredits} cr consumed</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

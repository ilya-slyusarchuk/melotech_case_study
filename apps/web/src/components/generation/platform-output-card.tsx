"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  PLATFORM_DISPLAY_METADATA,
} from "@melotech/shared";
import type { Platform } from "@melotech/shared";
import { Music, Video, Tv, Loader2, AlertCircle, Database } from "lucide-react";

/**
 * Platform output card showing the status and content for a single platform.
 *
 * Supports pending, processing, completed, failed, and cache fallback states.
 * Uses a side-by-side layout on desktop and stacks on mobile.
 */
export type PlatformOutputStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "completed_from_cache";

export interface PlatformOutputCardProps {
  platform: Platform;
  status: PlatformOutputStatus;
  content?: Record<string, unknown> | null;
  source?: "LLM" | "CACHE" | null;
}

const platformIcons: Record<Platform, React.ReactNode> = {
  spotify: <Music className="h-5 w-5" />,
  tiktok: <Video className="h-5 w-5" />,
  youtube: <Tv className="h-5 w-5" />,
};

function getStatusBadgeVariant(
  status: PlatformOutputStatus,
): BadgeVariant {
  switch (status) {
    case "completed":
      return "success";
    case "completed_from_cache":
      return "cache";
    case "processing":
      return "processing";
    case "failed":
      return "error";
    default:
      return "default";
  }
}

function getStatusLabel(status: PlatformOutputStatus): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "completed_from_cache":
      return "From Cache";
    case "processing":
      return "Processing";
    case "failed":
      return "Failed";
    default:
      return "Pending";
  }
}

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "processing"
  | "cache";

export function PlatformOutputCard({
  platform,
  status,
  content,
  source,
}: PlatformOutputCardProps) {
  const meta = PLATFORM_DISPLAY_METADATA[platform];
  const isCompleted = status === "completed" || status === "completed_from_cache";

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <span className="text-text-secondary">{platformIcons[platform]}</span>
          <CardTitle className="text-sm">{meta.label}</CardTitle>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant={getStatusBadgeVariant(status)}>
            {getStatusLabel(status)}
          </Badge>
          {isCompleted && source === "CACHE" && (
            <Badge variant="cache">
              <Database className="mr-1 h-3 w-3" />
              Cache
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {status === "pending" && (
          <div className="flex h-24 items-center justify-center">
            <span className="text-sm text-text-tertiary">Waiting to start...</span>
          </div>
        )}

        {status === "processing" && (
          <div className="flex h-24 items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-processing" />
            <span className="text-sm text-text-secondary">Processing...</span>
          </div>
        )}

        {isCompleted && content && (
          <div className="flex flex-col gap-2">
            <PlatformContentPreview platform={platform} content={content} />
          </div>
        )}

        {isCompleted && !content && (
          <div className="flex h-24 items-center justify-center">
            <span className="text-sm text-text-tertiary">No content available.</span>
          </div>
        )}

        {status === "failed" && (
          <div className="flex h-24 items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4 text-error" />
            <span className="text-sm text-error">Generation failed.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlatformContentPreview({
  platform,
  content,
}: {
  platform: Platform;
  content: Record<string, unknown>;
}) {
  // Render content fields generically so the card works for any platform.
  const entries = Object.entries(content).filter(
    ([, value]) => value !== null && value !== undefined,
  );

  return (
    <div className="flex flex-col gap-2">
      {entries.map(([key, value]) => (
        <div key={key}>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
            {formatFieldLabel(key)}
          </span>
          <p className="mt-0.5 text-sm text-text-primary">
            {typeof value === "string"
              ? value
              : Array.isArray(value)
                ? value.join(", ")
                : JSON.stringify(value)}
          </p>
        </div>
      ))}
    </div>
  );
}

function formatFieldLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

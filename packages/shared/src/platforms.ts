import { z } from "zod";

export const SUPPORTED_PLATFORMS = ["spotify", "tiktok", "youtube"] as const;

export const platformSchema = z.enum(SUPPORTED_PLATFORMS);

export type Platform = (typeof SUPPORTED_PLATFORMS)[number];

export type PlatformDisplayMetadata = {
  label: string;
  description: string;
  uiAccent: Platform;
};

export const PLATFORM_DISPLAY_METADATA: Record<
  Platform,
  PlatformDisplayMetadata
> = {
  spotify: {
    label: "Spotify",
    description: "Metadata for streaming discovery and playlist placement.",
    uiAccent: "spotify",
  },
  tiktok: {
    label: "TikTok",
    description: "Short-form hooks and tags for fast audience testing.",
    uiAccent: "tiktok",
  },
  youtube: {
    label: "YouTube",
    description: "Search-friendly video metadata for long-form discovery.",
    uiAccent: "youtube",
  },
};

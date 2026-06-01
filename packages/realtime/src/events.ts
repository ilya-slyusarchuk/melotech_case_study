import type { Platform } from "@melotech/shared";

// Event types published by the worker so the web app can stream updates
// to the browser through SSE.

export type PlatformOutputStatus =
  | "processing"
  | "completed"
  | "completed_from_cache"
  | "failed";

export type PlatformUpdateEvent = {
  type: "platform_update";
  generationRequestId: string;
  platform: Platform;
  status: PlatformOutputStatus;
  // Source is present only for terminal statuses.
  source?: "LLM" | "CACHE";
};

export type GenerationUpdateEvent = {
  type: "generation_update";
  generationRequestId: string;
  status: "completed" | "partial" | "failed";
};

export type WorkerEvent = PlatformUpdateEvent | GenerationUpdateEvent;

// Channel names are scoped by generation so SSE subscribers can listen
// to a single generation without receiving traffic for other users.
export function getGenerationChannelName(generationRequestId: string): string {
  return `generation:${generationRequestId}`;
}

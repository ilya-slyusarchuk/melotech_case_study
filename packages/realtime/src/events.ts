import { z } from "zod";

// Platform values are inlined here instead of importing the Zod schema
// from @melotech/shared to avoid cross-package Zod v4 schema recognition
// issues at runtime.
const platformValues = ["spotify", "tiktok", "youtube"] as const;
type Platform = (typeof platformValues)[number];

// ---------------------------------------------------------------------------
// Event contracts for realtime worker-to-web streaming.
//
// Every event that crosses the worker/web boundary is validated with Zod
// so both sides agree on shape and no malformed payload reaches the browser.
// ---------------------------------------------------------------------------

// --- Platform Update Event ---

export const platformOutputStatusSchema = z.enum([
  "processing",
  "completed",
  "completed_from_cache",
  "failed",
]);

export type PlatformOutputStatus = z.infer<typeof platformOutputStatusSchema>;

export const platformUpdateEventSchema = z.object({
  type: z.literal("platform_update"),
  generationRequestId: z.string().min(1),
  platform: z.enum(platformValues),
  status: platformOutputStatusSchema,
  // Source is present only for terminal statuses.
  source: z.enum(["LLM", "CACHE"]).optional(),
});

export type PlatformUpdateEvent = z.infer<typeof platformUpdateEventSchema>;

// --- Generation Update Event ---

export const generationUpdateEventSchema = z.object({
  type: z.literal("generation_update"),
  generationRequestId: z.string().min(1),
  status: z.enum(["completed", "partial", "failed"]),
});

export type GenerationUpdateEvent = z.infer<typeof generationUpdateEventSchema>;

// --- Credits Update Event ---

export const creditsUpdateEventSchema = z.object({
  type: z.literal("credits_update"),
  generationRequestId: z.string().min(1),
  availableCredits: z.number().int(),
  reservedCredits: z.number().int(),
});

export type CreditsUpdateEvent = z.infer<typeof creditsUpdateEventSchema>;

// --- Union Worker Event ---

export const workerEventSchema = z.discriminatedUnion("type", [
  platformUpdateEventSchema,
  generationUpdateEventSchema,
  creditsUpdateEventSchema,
]);

export type WorkerEvent =
  | PlatformUpdateEvent
  | GenerationUpdateEvent
  | CreditsUpdateEvent;

// Channel names are scoped by generation so SSE subscribers can listen
// to a single generation without receiving traffic for other users.
export function getGenerationChannelName(generationRequestId: string): string {
  return `generation:${generationRequestId}`;
}

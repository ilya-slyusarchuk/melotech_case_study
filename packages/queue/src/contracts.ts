import { z } from "zod";

// The generation queue name is stable and versioned externally through code.
// Changing this name requires a migration or dual-write strategy.
export const GENERATION_QUEUE_NAME = "generation";

// The job name inside the queue. BullMQ supports multiple job types per queue.
export const GENERATION_JOB_NAME = "generate-platform-outputs";

// Job payloads are intentionally minimal.
// The worker loads all authoritative data from Postgres so the queue never
// becomes a source of truth for prompts, users, or credit amounts.
export const generationJobPayloadSchema = z.object({
  generationRequestId: z.string().trim().min(1),
});

export type GenerationJobPayload = z.infer<typeof generationJobPayloadSchema>;

// Validates an incoming job payload. Returns the typed payload or throws
// a Zod error so BullMQ can mark the job as failed.
export function validateGenerationJobPayload(
  data: unknown,
): GenerationJobPayload {
  return generationJobPayloadSchema.parse(data);
}

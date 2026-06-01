import { z } from "zod";
import { audienceTargetingSchema } from "./audience.js";
import { platformSchema, SUPPORTED_PLATFORMS } from "./platforms.js";

export const GENERATION_PROMPT_MIN_LENGTH = 10;
export const GENERATION_PROMPT_MAX_LENGTH = 4_000;

export const createGenerationRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    // A short minimum keeps accidental one-word submissions out of the queue.
    .min(GENERATION_PROMPT_MIN_LENGTH)
    .max(GENERATION_PROMPT_MAX_LENGTH),
  target_platforms: z
    .array(platformSchema)
    .min(1)
    .max(SUPPORTED_PLATFORMS.length)
    .refine(
      (platforms) => new Set(platforms).size === platforms.length,
      "Target platforms must not contain duplicates.",
    ),
  audience: audienceTargetingSchema.optional(),
});

export type CreateGenerationRequest = z.infer<
  typeof createGenerationRequestSchema
>;

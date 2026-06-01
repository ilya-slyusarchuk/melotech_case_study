import { z } from "zod";

export const AUDIENCE_AGE_RANGES = [
  "13-17",
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55+",
] as const;

export const AUDIENCE_GENDERS = [
  "male",
  "female",
  "all",
  "non_binary",
] as const;

export const audienceTargetingSchema = z.object({
  // Region stays simple for the MVP. It validates user intent without trying
  // to model countries, cities, languages, or market-specific rules yet.
  region: z.string().trim().min(1).max(80).optional(),
  age_range: z.enum(AUDIENCE_AGE_RANGES).optional(),
  gender: z.enum(AUDIENCE_GENDERS).optional(),
});

export type AudienceAgeRange = (typeof AUDIENCE_AGE_RANGES)[number];
export type AudienceGender = (typeof AUDIENCE_GENDERS)[number];
export type AudienceTargeting = z.infer<typeof audienceTargetingSchema>;

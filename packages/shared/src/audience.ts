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

export type AudienceDisplayFields = {
  region?: string | null;
  ageRange?: string | null;
  gender?: AudienceGender | string | null;
};

export type AudienceDisplayChip = {
  key: "region" | "ageRange" | "gender";
  label: string;
  value: string;
};

const GENDER_DISPLAY_LABELS: Record<AudienceGender, string> = {
  male: "Male",
  female: "Female",
  all: "All genders",
  non_binary: "Non-binary",
};

const AUDIENCE_ADAPTATION_INSTRUCTION =
  "Adapt the output to local cultural preferences, platform behavior, language expectations, music discovery habits, genre affinity, and emotional positioning.";

export function buildAudiencePrompt(
  rawPrompt: string,
  audience?: AudienceTargeting | null,
) {
  const audienceLines = getAudiencePromptLines(audience);

  // Keep the exact prompt unchanged when there is no audience context.
  // This avoids surprising platform generators with extra instructions.
  if (audienceLines.length === 0) {
    return rawPrompt;
  }

  return [
    "Original music concept:",
    rawPrompt,
    "",
    "Target audience:",
    ...audienceLines,
    "",
    "Audience adaptation instruction:",
    AUDIENCE_ADAPTATION_INSTRUCTION,
    "Do not invent missing demographics. Do not translate the prompt unless a later platform generator specifically asks for localization.",
  ].join("\n");
}

export function buildAudienceDisplayChips(
  audience: AudienceDisplayFields,
): AudienceDisplayChip[] {
  const chips: AudienceDisplayChip[] = [];
  const region = normalizeAudienceText(audience.region);
  const ageRange = normalizeAudienceText(audience.ageRange);
  const gender = normalizeAudienceText(audience.gender);

  if (region) {
    chips.push({ key: "region", label: "Region", value: region });
  }

  if (ageRange) {
    chips.push({ key: "ageRange", label: "Age range", value: ageRange });
  }

  if (gender) {
    chips.push({
      key: "gender",
      label: "Gender",
      value: formatGenderLabel(gender),
    });
  }

  return chips;
}

function getAudiencePromptLines(audience?: AudienceTargeting | null) {
  const lines: string[] = [];
  const region = normalizeAudienceText(audience?.region);
  const ageRange = normalizeAudienceText(audience?.age_range);
  const gender = normalizeAudienceText(audience?.gender);

  if (region) {
    lines.push(`- Target region: ${region}`);
  }

  if (ageRange) {
    lines.push(`- Target age range: ${ageRange}`);
  }

  if (gender) {
    lines.push(`- Target gender: ${formatGenderLabel(gender)}`);
  }

  return lines;
}

function normalizeAudienceText(value?: string | null) {
  return value?.trim() || null;
}

function formatGenderLabel(value: string) {
  // Known schema values get human labels. Unknown stored values stay readable.
  if (value in GENDER_DISPLAY_LABELS) {
    return GENDER_DISPLAY_LABELS[value as AudienceGender];
  }

  return value.replaceAll("_", " ");
}

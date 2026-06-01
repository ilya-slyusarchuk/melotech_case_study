import type { AudienceTargeting, Platform } from "@melotech/shared";
import type { AIGenerationMetadata } from "./adapter.js";

export type PlatformGenerationOptions = {
  temperature: number;
  maxProviderRetries: number;
  maxRepairs: number;
};

const DEFAULT_PLATFORM_GENERATION_OPTIONS: PlatformGenerationOptions = {
  // Platform metadata should be useful and stable, not highly creative.
  temperature: 0.2,
  maxProviderRetries: 1,
  maxRepairs: 1,
};

export function resolvePlatformGenerationOptions(
  options: Partial<PlatformGenerationOptions> = {},
): PlatformGenerationOptions {
  return {
    ...DEFAULT_PLATFORM_GENERATION_OPTIONS,
    ...options,
  };
}

export function buildPlatformUserPrompt(input: {
  enrichedPrompt: string;
  audience?: AudienceTargeting | null;
  platformInstructions: string[];
}): string {
  return [
    "Enriched music concept:",
    input.enrichedPrompt,
    "",
    "Platform-specific requirements:",
    ...input.platformInstructions.map((instruction) => `- ${instruction}`),
    "",
    ...buildAudienceSection(input.audience),
    "Return one JSON object only. Do not include markdown or prose outside JSON.",
  ].join("\n");
}

export function buildPlatformMetadata(
  platform: Platform,
  audience?: AudienceTargeting | null,
): AIGenerationMetadata {
  const metadata: AIGenerationMetadata = {
    platform,
    hasAudience: hasAudienceMetadata(audience),
  };

  // Metadata is intentionally small and primitive so adapters can log or route
  // safely without receiving the full user prompt.
  if (audience?.region) {
    metadata.region = audience.region;
  }

  if (audience?.age_range) {
    metadata.ageRange = audience.age_range;
  }

  if (audience?.gender) {
    metadata.gender = audience.gender;
  }

  return metadata;
}

function buildAudienceSection(audience?: AudienceTargeting | null): string[] {
  if (!hasAudienceMetadata(audience)) {
    return [];
  }

  return [
    "Audience and region adaptation:",
    "Use the supplied audience metadata when shaping tone, keywords, genre cues, and localization.",
    "Do not invent missing demographics.",
    ...formatAudienceLines(audience),
    "",
  ];
}

function formatAudienceLines(audience?: AudienceTargeting | null): string[] {
  const lines: string[] = [];

  if (audience?.region) {
    lines.push(`- Region: ${audience.region}`);
  }

  if (audience?.age_range) {
    lines.push(`- Age range: ${audience.age_range}`);
  }

  if (audience?.gender) {
    lines.push(`- Gender: ${audience.gender}`);
  }

  return lines;
}

function hasAudienceMetadata(audience?: AudienceTargeting | null): boolean {
  return Boolean(audience?.region || audience?.age_range || audience?.gender);
}

import {
  platformSchema,
  SUPPORTED_PLATFORMS,
  type Platform,
} from "@melotech/shared";

/**
 * Reads platform credit costs from environment variables.
 *
 * Falls back to test defaults (1, 2, 3) when env vars are not set.
 * This allows tests to run without env configuration while production
 * and dev servers read real values from process.env.
 */
function loadCreditCosts(): Record<Platform, number> {
  const costs: Partial<Record<Platform, number>> = {};

  for (const platform of SUPPORTED_PLATFORMS) {
    const envName = `PLATFORM_CREDIT_COST_${platform.toUpperCase()}`;
    const envValue = process.env[envName];
    const parsed = envValue ? parseInt(envValue, 10) : NaN;
    costs[platform] = !isNaN(parsed) && parsed > 0 ? parsed : undefined;
  }

  // Fallback defaults for tests and backward compatibility.
  return {
    spotify: costs.spotify ?? 1,
    tiktok: costs.tiktok ?? 2,
    youtube: costs.youtube ?? 3,
  } as Record<Platform, number>;
}

export const PLATFORM_CREDIT_COSTS: Record<Platform, number> =
  loadCreditCosts();

export function getPlatformCreditCost(platform: Platform): number {
  return PLATFORM_CREDIT_COSTS[platform];
}

export function calculateReservationCost(
  platforms: readonly Platform[],
): number {
  assertUniquePlatforms(platforms);

  return platforms.reduce((total, platform) => {
    // Platform costs are intentionally looked up on the server.
    // Client-submitted costs are never part of this calculation.
    return total + getPlatformCreditCost(platform);
  }, 0);
}

export function parsePlatformForPricing(platform: unknown): Platform {
  const parsedPlatform = platformSchema.safeParse(platform);

  if (!parsedPlatform.success) {
    throw new Error("Unsupported platform cannot be priced.");
  }

  return parsedPlatform.data;
}

export function parsePlatformsForPricing(
  platforms: readonly unknown[],
): Platform[] {
  const parsedPlatforms = platforms.map(parsePlatformForPricing);
  assertUniquePlatforms(parsedPlatforms);

  return parsedPlatforms;
}

function assertUniquePlatforms(platforms: readonly Platform[]): void {
  const uniquePlatforms = new Set(platforms);

  if (uniquePlatforms.size !== platforms.length) {
    throw new Error("Duplicate platforms are not allowed before pricing.");
  }

  for (const platform of platforms) {
    if (!SUPPORTED_PLATFORMS.includes(platform)) {
      throw new Error("Unsupported platform cannot be priced.");
    }
  }
}

import {
  platformSchema,
  SUPPORTED_PLATFORMS,
  type Platform,
} from "@melotech/shared";

export const PLATFORM_CREDIT_COSTS: Record<Platform, number> = {
  spotify: 1,
  tiktok: 2,
  youtube: 3,
};

export function getPlatformCreditCost(platform: Platform): number {
  return PLATFORM_CREDIT_COSTS[platform];
}

export function calculateReservationCost(platforms: readonly Platform[]): number {
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

export function parsePlatformsForPricing(platforms: readonly unknown[]): Platform[] {
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


import { NextResponse } from "next/server";
import { PLATFORM_CREDIT_COSTS } from "@melotech/billing";
import type { Platform } from "@melotech/shared";

/**
 * GET /api/credits/pricing
 *
 * Returns the current platform credit costs.
 * These are server-owned values read from environment variables.
 * The frontend uses them for the live cost preview.
 */
export async function GET() {
  const pricing = Object.fromEntries(
    Object.entries(PLATFORM_CREDIT_COSTS).map(([platform, cost]) => [
      platform,
      cost,
    ]),
  ) as Record<Platform, number>;

  return NextResponse.json(pricing);
}

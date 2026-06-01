import { getCreditService } from "../../../../lib/dependencies";
import { handleApiError } from "../../../../lib/api-helpers";
import { requireUserId } from "../../../../lib/session";
import { getUsage } from "../../../../lib/credit-api-service";

/**
 * GET /api/credits/usage
 *
 * Returns captured platform credit usage grouped by timeframe.
 * Supported timeframes: daily, weekly, monthly. Defaults to daily.
 * Only platform_capture entries are counted; grants and releases are excluded.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    return await getUsage(
      userId,
      searchParams.get("timeframe"),
      getCreditService(),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

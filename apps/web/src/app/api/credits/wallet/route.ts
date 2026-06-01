import { getCreditService } from "../../../../lib/dependencies";
import { handleApiError } from "../../../../lib/api-helpers";
import { requireUserId } from "../../../../lib/session";
import { getWallet } from "../../../../lib/credit-api-service";

/**
 * GET /api/credits/wallet
 *
 * Returns the authenticated user's credit wallet, including available
 * and reserved credits.
 */
export async function GET(): Promise<Response> {
  try {
    const userId = await requireUserId();
    return await getWallet(userId, getCreditService());
  } catch (error) {
    return handleApiError(error);
  }
}

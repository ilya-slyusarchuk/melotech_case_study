import { getCreditService } from "../../../../lib/dependencies";
import { handleApiError } from "../../../../lib/api-helpers";
import { requireUserId } from "../../../../lib/session";
import { grantCredits } from "../../../../lib/credit-api-service";

/**
 * POST /api/credits/grant
 *
 * Grants exactly 100 test credits to the authenticated user.
 * Creates a grant ledger entry. Explicitly ignores any amount sent
 * by the client.
 */
export async function POST(): Promise<Response> {
  try {
    const userId = await requireUserId();
    return await grantCredits(userId, getCreditService());
  } catch (error) {
    return handleApiError(error);
  }
}

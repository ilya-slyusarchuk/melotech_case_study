import { getCreditService } from "../../../../lib/dependencies";
import { handleApiError } from "../../../../lib/api-helpers";
import { requireUserId } from "../../../../lib/session";
import { getLedger } from "../../../../lib/credit-api-service";

/**
 * GET /api/credits/ledger
 *
 * Returns the authenticated user's credit ledger history.
 * Entries are returned newest first. Each entry includes type, amount,
 * platform, generation id, created time, and metadata.
 */
export async function GET(): Promise<Response> {
  try {
    const userId = await requireUserId();
    return await getLedger(userId, getCreditService());
  } catch (error) {
    return handleApiError(error);
  }
}

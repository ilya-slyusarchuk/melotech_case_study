import { getGenerationRepository } from "../../../../lib/dependencies";
import { handleApiError } from "../../../../lib/api-helpers";
import { requireUserId } from "../../../../lib/session";
import { getGeneration } from "../../../../lib/generation-service";

/**
 * GET /api/generations/{id}
 *
 * Returns a single generation request with its platform outputs,
 * audience metadata, status, and timestamps. Only returns generations
 * that belong to the authenticated user.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    return await getGeneration(id, userId, getGenerationRepository());
  } catch (error) {
    return handleApiError(error);
  }
}

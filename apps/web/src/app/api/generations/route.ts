import {
  createGeneration,
  listGenerations,
} from "../../../lib/generation-service";
import {
  getCreditService,
  getGenerationRateLimiter,
  getGenerationRepository,
  getQueueProducer,
} from "../../../lib/dependencies";
import { handleApiError } from "../../../lib/api-helpers";
import { requireUserId } from "../../../lib/session";

/**
 * POST /api/generations
 *
 * Creates a new generation request for the authenticated user.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const userId = await requireUserId();
    return await createGeneration(request, userId, {
      rateLimiter: getGenerationRateLimiter(),
      generationRepository: getGenerationRepository(),
      creditService: getCreditService(),
      queueProducer: getQueueProducer(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/generations
 *
 * Returns the authenticated user's generation history.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const userId = await requireUserId();
    return await listGenerations(request, userId, {
      generationRepository: getGenerationRepository(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

import Redis from "ioredis";
import { getWebConfig } from "@melotech/config";
import { getGenerationRepository } from "../../../../../lib/dependencies";
import { requireUserId, UnauthorizedError } from "../../../../../lib/session";
import { handleGenerationEventsRequest } from "../../../../../lib/sse-service";

/**
 * GET /api/generations/{id}/events
 *
 * Authenticated SSE endpoint that streams realtime events for a single
 * generation request. The user must own the generation.
 *
 * Returns text/event-stream on success, 401 for unauthenticated requests,
 * and 404 when the generation does not exist or belongs to another user.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  let userId: string;

  try {
    userId = await requireUserId();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return new Response(
        JSON.stringify({ error: "Authentication is required." }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    throw error;
  }

  const { id: generationRequestId } = await params;

  // Create a dedicated Redis subscriber connection.
  // Redis pub/sub requires a separate connection from the one used for
  // publishing or other commands.
  const config = getWebConfig();
  const redisSubscriber = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  return handleGenerationEventsRequest(
    { generationRequestId, userId },
    {
      generationRepository: getGenerationRepository(),
      redisSubscriber,
    },
  );
}

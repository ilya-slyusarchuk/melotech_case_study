import type Redis from "ioredis";
import type { GenerationRequestRepository } from "@melotech/db";
import { formatSseEvent, encodeText } from "./sse-helpers";

// ---------------------------------------------------------------------------
// SSE service for streaming generation events from Redis to the browser.
//
// Core logic is extracted into pure async functions that accept injected
// dependencies so tests do not need a real database or Redis server.
// ---------------------------------------------------------------------------

export type SseServiceDeps = {
  generationRepository: GenerationRequestRepository;
  redisSubscriber: Redis;
};

export type SseContext = {
  generationRequestId: string;
  userId: string;
};

/**
 * Checks whether the generation exists and belongs to the authenticated user.
 * Returns the generation row if owned, null otherwise.
 */
export async function verifyGenerationOwnership(
  ctx: SseContext,
  deps: Pick<SseServiceDeps, "generationRepository">,
): Promise<unknown | null> {
  return deps.generationRepository.findByIdForUser(
    ctx.userId,
    ctx.generationRequestId,
  );
}

/**
 * Core logic for handling an SSE request for generation events.
 * Returns a Response that streams events, or a JSON error response.
 */
export async function handleGenerationEventsRequest(
  ctx: SseContext,
  deps: SseServiceDeps,
): Promise<Response> {
  const generation = await verifyGenerationOwnership(ctx, deps);

  if (!generation) {
    return new Response(JSON.stringify({ error: "Generation not found." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = createSseStream(ctx.generationRequestId, deps.redisSubscriber);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
export function createSseStream(
  generationRequestId: string,
  redisSubscriber: Redis,
): ReadableStream<Uint8Array> {
  const channel = `generation:${generationRequestId}`;

  let messageHandler: ((channel: string, message: string) => void) | null =
    null;
  let errorHandler: ((error: Error) => void) | null = null;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      // Forward every Redis message as an SSE event.
      messageHandler = (_channel: string, message: string) => {
        try {
          // Parse the JSON payload so we can extract the event type.
          const parsed = JSON.parse(message) as { type: string };
          const eventType = parsed.type;
          const ssePayload = formatSseEvent(eventType, parsed);
          controller.enqueue(encodeText(ssePayload));
        } catch {
          // Ignore malformed messages so one bad payload does not kill the stream.
        }
      };

      errorHandler = (error: Error) => {
        console.error(`Redis subscription error for ${channel}:`, error);
        controller.error(error);
      };

      redisSubscriber.on("message", messageHandler);
      redisSubscriber.on("error", errorHandler);

      // Subscribe after handlers are attached.
      redisSubscriber.subscribe(channel).catch((error) => {
        console.error(`Failed to subscribe to ${channel}:`, error);
        controller.error(error);
      });
    },

    cancel() {
      // Called when the client disconnects. Clean up Redis subscription.
      if (messageHandler) {
        redisSubscriber.off("message", messageHandler);
      }
      if (errorHandler) {
        redisSubscriber.off("error", errorHandler);
      }
      redisSubscriber.unsubscribe(channel).catch(() => {
        // Ignore unsubscribe errors during cleanup.
      });
      redisSubscriber.disconnect();
    },
  });
}

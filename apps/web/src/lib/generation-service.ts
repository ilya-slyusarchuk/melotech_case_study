import { createGenerationRequestSchema } from "@melotech/shared";
import type { CreditService } from "@melotech/billing";
import type { GenerationQueueProducer } from "@melotech/queue";
import type { GenerationRequestRepository } from "@melotech/db";
import {
  handleApiError,
  InsufficientCreditsError,
  NotFoundError,
  ValidationError,
} from "./api-helpers";
import { requireUserId } from "./session";
import type { RedisRateLimiter } from "./rate-limiter";

export type GenerationDeps = {
  rateLimiter: RedisRateLimiter;
  generationRepository: GenerationRequestRepository;
  creditService: CreditService;
  queueProducer: GenerationQueueProducer;
};

export type ListGenerationDeps = {
  generationRepository: GenerationRequestRepository;
};

/**
 * Core logic for creating a generation request.
 * userId is injected by the caller so tests do not need a Next.js request context.
 */
export async function createGeneration(
  request: Request,
  userId: string,
  deps: GenerationDeps,
): Promise<Response> {
  const body = await request.json();
  const input = createGenerationRequestSchema.parse(body);

  // Rate limiting happens before any database writes or credit operations.
  await deps.rateLimiter.check(userId);

  // Ensure the user has a wallet. This is idempotent and creates a wallet
  // with demo credits if one does not already exist.
  await deps.creditService.ensureWalletForUser(userId);

  // Create the generation request and pending platform outputs.
  const generation = await deps.generationRepository.createForUser({
    userId,
    rawPrompt: input.prompt,
    audience: input.audience ?? null,
    platforms: input.target_platforms,
  });

  const generationId = (generation as { id: string }).id;

  // Reserve the maximum possible credits based on the selected platforms.
  let reservation: { id: string } | null = null;
  try {
    reservation = await deps.creditService.reserveCreditsForGeneration({
      userId,
      generationRequestId: generationId,
      platforms: input.target_platforms,
      idempotencyKey: `reservation:${userId}:${generationId}`,
    });
  } catch (error) {
    // If reservation fails because of insufficient credits, clean up the
    // generation request so the user is not left with a pending row.
    if (
      error instanceof Error &&
      error.message === "Insufficient available credits."
    ) {
      await deps.generationRepository.updateStatusForWorker(
        generationId,
        "failed",
      );
      throw new InsufficientCreditsError();
    }
    throw error;
  }

  // Enqueue the generation job so the worker can process it.
  try {
    await deps.queueProducer.enqueue({ generationRequestId: generationId });
  } catch (error) {
    // If enqueue fails after reservation, mark the generation as failed
    // and release the reserved credits so the user is not charged.
    console.error("Failed to enqueue generation job:", error);
    await deps.generationRepository.updateStatusForWorker(
      generationId,
      "failed",
    );

    if (reservation) {
      try {
        await deps.creditService.releaseUnusedReservedCredits({
          userId,
          reservationId: reservation.id,
          idempotencyKey: `release:${userId}:${generationId}`,
        });
      } catch (releaseError) {
        console.error("Failed to release reserved credits:", releaseError);
      }
    }

    throw new Error("Failed to start generation. Please try again.");
  }

  return Response.json(
    {
      id: generationId,
      status: "pending",
    },
    { status: 201 },
  );
}

/**
 * Core logic for listing generation history.
 * userId is injected by the caller so tests do not need a Next.js request context.
 */
export async function listGenerations(
  request: Request,
  userId: string,
  deps: ListGenerationDeps,
): Promise<Response> {
  const { searchParams } = new URL(request.url);

  const platform = searchParams.get("platform");
  const status = searchParams.get("status");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 50;

  if (Number.isNaN(limit) || limit < 1 || limit > 100) {
    throw new ValidationError("Limit must be a number between 1 and 100.");
  }

  const generations = await deps.generationRepository.listForUser({
    userId,
    ...(platform
      ? { platform: platform as "spotify" | "tiktok" | "youtube" }
      : {}),
  });

  // Apply status filter and limit in memory because the Prisma delegate
  // in the repository does not expose a status filter on listForUser.
  // This is acceptable for the expected data volume in the MVP.
  let filtered = generations;
  if (status) {
    const validStatuses = [
      "pending",
      "processing",
      "completed",
      "partial",
      "failed",
    ];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(`Invalid status filter: ${status}.`);
    }
    filtered = generations.filter(
      (g) => (g as { status: string }).status === status,
    );
  }

  const limited = filtered.slice(0, limit);

  return Response.json({ generations: limited });
}

/**
 * Core logic for fetching a single generation by id.
 * userId is injected by the caller so tests do not need a Next.js request context.
 */
export async function getGeneration(
  id: string,
  userId: string,
  generationRepository: GenerationRequestRepository,
): Promise<Response> {
  const generation = await generationRepository.findByIdForUser(userId, id);

  if (!generation) {
    throw new NotFoundError("Generation not found.");
  }

  return Response.json({ generation });
}

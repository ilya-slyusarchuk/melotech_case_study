import type { Platform } from "@melotech/shared";
import type {
  GenerationRequestRepository,
  PlatformOutputRepository,
} from "@melotech/db";
import type {
  PlatformGeneratorRegistry,
  PlatformGeneratorInput,
} from "@melotech/ai";
import type { SimilarResultService } from "@melotech/embeddings";
import type { CreditService } from "@melotech/billing";
import type { EventPublisher } from "@melotech/realtime";
import type { GenerationJobPayload } from "@melotech/queue";

// Types inferred from the Prisma schema and repository return shapes.
// The repository layer returns unknown, so these types guide safe casts.
export type WorkerPlatformOutput = {
  id: string;
  platform: Platform;
  status: string;
  content: unknown | null;
  errorMessage: string | null;
};

export type WorkerCreditReservation = {
  id: string;
  userId: string;
  generationRequestId: string;
  reservedCredits: number;
  capturedCredits: number;
  releasedCredits: number;
  status: string;
};

export type WorkerGeneration = {
  id: string;
  userId: string;
  rawPrompt: string;
  enrichedPrompt: string | null;
  region: string | null;
  ageRange: string | null;
  gender: string | null;
  status: string;
  platformOutputs: WorkerPlatformOutput[];
  creditReservation: WorkerCreditReservation | null;
};

export type GenerationProcessorDependencies = {
  generationRepository: GenerationRequestRepository;
  platformOutputRepository: PlatformOutputRepository;
  generatorRegistry: PlatformGeneratorRegistry;
  similarResultService: SimilarResultService;
  creditService: CreditService;
  eventPublisher: EventPublisher;
};

export class GenerationProcessor {
  constructor(private readonly deps: GenerationProcessorDependencies) {}

  async process(job: GenerationJobPayload): Promise<void> {
    const { generationRequestId } = job;

    // 1. Load generation by id from database.
    const rawGeneration =
      await this.deps.generationRepository.findByIdForWorker(
        generationRequestId,
      );

    // 2. If generation does not exist, fail safely.
    if (!rawGeneration) {
      console.warn(
        `Generation ${generationRequestId} not found. Skipping job.`,
      );
      return;
    }

    const generation = rawGeneration as WorkerGeneration;

    // 3. Mark generation as processing.
    await this.deps.generationRepository.updateStatusForWorker(
      generationRequestId,
      "processing",
    );

    // 4. Load requested platform outputs.
    // Only process platforms that are not already in a terminal state.
    // This prevents double work and double charging on retries.
    const platformsToProcess = generation.platformOutputs.filter(
      (output) =>
        output.status !== "completed" &&
        output.status !== "completed_from_cache",
    );

    // 5. Process requested platforms with Promise.allSettled.
    // Each failure is isolated so one broken platform cannot crash the others.
    await Promise.allSettled(
      platformsToProcess.map((platformOutput) =>
        this.processPlatform(generation, platformOutput),
      ),
    );

    // 15. Finalize generation status as completed, partial, or failed.
    // Reload from the database so the final status is based on the latest
    // platform output rows, including any that were already terminal before
    // this job started.
    const finalGeneration =
      (await this.deps.generationRepository.findByIdForWorker(
        generationRequestId,
      )) as WorkerGeneration | null;

    if (!finalGeneration) {
      console.warn(
        `Generation ${generationRequestId} disappeared during processing.`,
      );
      return;
    }

    const finalStatus = this.resolveFinalStatus(
      finalGeneration.platformOutputs,
    );
    await this.deps.generationRepository.updateStatusForWorker(
      generationRequestId,
      finalStatus,
    );

    // 16. Release unused reserved credits.
    if (finalGeneration.creditReservation) {
      await this.deps.creditService.releaseUnusedReservedCredits({
        userId: finalGeneration.userId,
        reservationId: finalGeneration.creditReservation.id,
        idempotencyKey: `release:${generationRequestId}`,
      });
    }

    // 17. Publish final generation event.
    await this.deps.eventPublisher.publishGenerationUpdate({
      type: "generation_update",
      generationRequestId,
      status: finalStatus as "completed" | "partial" | "failed",
    });
  }

  private async processPlatform(
    generation: WorkerGeneration,
    platformOutput: WorkerPlatformOutput,
  ): Promise<void> {
    const { platform } = platformOutput;

    // 6. Mark platform as processing.
    await this.deps.platformOutputRepository.markProcessingForWorker(
      generation.id,
      platform,
    );

    await this.deps.eventPublisher.publishPlatformUpdate({
      type: "platform_update",
      generationRequestId: generation.id,
      platform,
      status: "processing",
    });

    try {
      // 7. Generate platform output through registry.
      const generator = this.deps.generatorRegistry.get(platform);
      const output = await generator.generate({
        enrichedPrompt: generation.enrichedPrompt ?? generation.rawPrompt,
        audience: buildAudienceFromGeneration(generation),
      });

      // 8. On successful LLM output, store output as completed with source LLM.
      await this.deps.platformOutputRepository.markCompletedForWorker(
        generation.id,
        platform,
        output,
      );

      // 9. Store semantic cache for successful output.
      await this.deps.similarResultService.cacheSuccessfulOutput({
        userId: generation.userId,
        enrichedPrompt: generation.enrichedPrompt ?? generation.rawPrompt,
        platform,
        outputJson: output,
        audience: buildAudienceFromGeneration(generation),
      });

      // 10. Capture platform credits.
      // Idempotency key is scoped to generation + platform so retries
      // cannot double charge.
      if (generation.creditReservation) {
        await this.deps.creditService.captureCreditsForSuccessfulPlatform({
          userId: generation.userId,
          reservationId: generation.creditReservation.id,
          platform,
          outputStored: true,
          idempotencyKey: `capture:${generation.id}:${platform}`,
        });
      }

      // 11. Publish platform update event.
      await this.deps.eventPublisher.publishPlatformUpdate({
        type: "platform_update",
        generationRequestId: generation.id,
        platform,
        status: "completed",
        source: "LLM",
      });
    } catch (error) {
      // 12. On LLM failure, attempt user-scoped semantic fallback.
      const fallback = await this.deps.similarResultService.findSimilarResult({
        userId: generation.userId,
        enrichedPrompt: generation.enrichedPrompt ?? generation.rawPrompt,
        platform,
        audience: buildAudienceFromGeneration(generation),
      });

      if (fallback) {
        // 13. If fallback exists, store output as completed with source CACHE.
        await this.deps.platformOutputRepository.markCompletedFromCacheForWorker(
          generation.id,
          platform,
          fallback.outputJson,
        );

        // Capture credits for cache fallback too.
        if (generation.creditReservation) {
          await this.deps.creditService.captureCreditsForSuccessfulPlatform({
            userId: generation.userId,
            reservationId: generation.creditReservation.id,
            platform,
            outputStored: true,
            idempotencyKey: `capture:${generation.id}:${platform}`,
          });
        }

        await this.deps.eventPublisher.publishPlatformUpdate({
          type: "platform_update",
          generationRequestId: generation.id,
          platform,
          status: "completed_from_cache",
          source: "CACHE",
        });
      } else {
        // 14. If fallback does not exist, mark platform failed.
        const errorMessage =
          error instanceof Error ? error.message : "Unknown generation error";

        await this.deps.platformOutputRepository.markFailedForWorker(
          generation.id,
          platform,
          errorMessage,
        );

        await this.deps.eventPublisher.publishPlatformUpdate({
          type: "platform_update",
          generationRequestId: generation.id,
          platform,
          status: "failed",
        });
      }
    }
  }

  private resolveFinalStatus(
    platformOutputs: WorkerPlatformOutput[],
  ): "completed" | "partial" | "failed" {
    const totalCount = platformOutputs.length;

    if (totalCount === 0) {
      return "failed";
    }

    const completedCount = platformOutputs.filter(
      (output) =>
        output.status === "completed" ||
        output.status === "completed_from_cache",
    ).length;

    if (completedCount === totalCount) {
      return "completed";
    }

    if (completedCount > 0) {
      return "partial";
    }

    return "failed";
  }
}

function buildAudienceFromGeneration(
  generation: WorkerGeneration,
): PlatformGeneratorInput["audience"] {
  if (!generation.region && !generation.ageRange && !generation.gender) {
    return null;
  }

  return {
    region: generation.region ?? undefined,
    age_range: (generation.ageRange ?? undefined) as
      | "13-17"
      | "18-24"
      | "25-34"
      | "35-44"
      | "45-54"
      | "55+"
      | undefined,
    gender: (generation.gender ?? undefined) as
      | "male"
      | "female"
      | "all"
      | "non_binary"
      | undefined,
  };
}

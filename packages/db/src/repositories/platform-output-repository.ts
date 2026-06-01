import type { Platform } from "@melotech/shared";

type PlatformOutputDelegate = {
  createMany(args: unknown): Promise<unknown>;
  updateMany(args: unknown): Promise<unknown>;
};

export type PlatformOutputRepositoryClient = {
  platformOutput: PlatformOutputDelegate;
};

export class PlatformOutputRepository {
  constructor(private readonly client: PlatformOutputRepositoryClient) {}

  createPendingOutputs(
    generationRequestId: string,
    platforms: readonly Platform[],
  ) {
    return this.client.platformOutput.createMany({
      data: platforms.map((platform) => ({
        generationRequestId,
        platform,
        status: "pending",
      })),
    });
  }

  markProcessingForWorker(generationRequestId: string, platform: Platform) {
    return this.client.platformOutput.updateMany({
      where: { generationRequestId, platform },
      data: { status: "processing" },
    });
  }

  markCompletedForWorker(
    generationRequestId: string,
    platform: Platform,
    content: unknown,
  ) {
    return this.client.platformOutput.updateMany({
      where: { generationRequestId, platform },
      data: { status: "completed", content },
    });
  }

  markCompletedFromCacheForWorker(
    generationRequestId: string,
    platform: Platform,
    content: unknown,
  ) {
    return this.client.platformOutput.updateMany({
      where: { generationRequestId, platform },
      data: { status: "completed_from_cache", content },
    });
  }

  markFailedForWorker(
    generationRequestId: string,
    platform: Platform,
    errorMessage?: string,
  ) {
    return this.client.platformOutput.updateMany({
      where: { generationRequestId, platform },
      data: { status: "failed", errorMessage: errorMessage ?? null },
    });
  }
}

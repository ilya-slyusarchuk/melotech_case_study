import type { Platform } from "@melotech/shared";

type PlatformOutputDelegate = {
  createMany(args: unknown): Promise<unknown>;
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
}


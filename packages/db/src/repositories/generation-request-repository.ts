import type { Platform } from "@melotech/shared";

type GenerationRequestDelegate = {
  create(args: unknown): Promise<unknown>;
  findFirst(args: unknown): Promise<unknown>;
  findMany(args: unknown): Promise<unknown[]>;
  findUnique(args: unknown): Promise<unknown>;
};

export type GenerationRepositoryClient = {
  generationRequest: GenerationRequestDelegate;
};

export type CreateGenerationForUserInput = {
  userId: string;
  rawPrompt: string;
  enrichedPrompt?: string | null;
  region?: string | null;
  ageRange?: string | null;
  gender?: string | null;
  platforms: readonly Platform[];
};

export type ListGenerationsForUserInput = {
  userId: string;
  platform?: Platform;
};

export class GenerationRequestRepository {
  constructor(private readonly client: GenerationRepositoryClient) {}

  createForUser(input: CreateGenerationForUserInput) {
    return this.client.generationRequest.create({
      data: {
        userId: input.userId,
        rawPrompt: input.rawPrompt,
        enrichedPrompt: input.enrichedPrompt ?? input.rawPrompt,
        region: input.region ?? null,
        ageRange: input.ageRange ?? null,
        gender: input.gender ?? null,
        status: "pending",
        // Platform rows start pending. The worker owns later status changes.
        platformOutputs: {
          create: input.platforms.map((platform) => ({
            platform,
            status: "pending",
          })),
        },
      },
      include: { platformOutputs: true },
    });
  }

  findByIdForUser(userId: string, generationRequestId: string) {
    return this.client.generationRequest.findFirst({
      where: { id: generationRequestId, userId },
      include: { platformOutputs: true },
    });
  }

  listForUser(input: ListGenerationsForUserInput) {
    return this.client.generationRequest.findMany({
      where: {
        userId: input.userId,
        ...(input.platform
          ? { platformOutputs: { some: { platform: input.platform } } }
          : {}),
      },
      include: { platformOutputs: true },
      orderBy: { createdAt: "desc" },
    });
  }

  findByIdForWorker(generationRequestId: string) {
    return this.client.generationRequest.findUnique({
      where: { id: generationRequestId },
      include: { platformOutputs: true },
    });
  }
}


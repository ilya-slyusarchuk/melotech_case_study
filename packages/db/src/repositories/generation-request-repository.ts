import {
  buildAudiencePrompt,
  type AudienceTargeting,
  type Platform,
} from "@melotech/shared";

type GenerationRequestDelegate = {
  create(args: unknown): Promise<unknown>;
  findFirst(args: unknown): Promise<unknown>;
  findMany(args: unknown): Promise<unknown[]>;
  findUnique(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
};

export type GenerationRepositoryClient = {
  generationRequest: GenerationRequestDelegate;
};

export type CreateGenerationForUserInput = {
  userId: string;
  rawPrompt: string;
  audience?: AudienceTargeting | null;
  platforms: readonly Platform[];
};

export type ListGenerationsForUserInput = {
  userId: string;
  platform?: Platform;
};

export class GenerationRequestRepository {
  constructor(private readonly client: GenerationRepositoryClient) {}

  createForUser(input: CreateGenerationForUserInput) {
    // Enrichment happens before the database write.
    // The queued worker can then read the exact prompt that should be sent
    // through the AI pipeline without recomputing audience context.
    const enrichedPrompt = buildAudiencePrompt(input.rawPrompt, input.audience);

    return this.client.generationRequest.create({
      data: {
        userId: input.userId,
        rawPrompt: input.rawPrompt,
        enrichedPrompt,
        // Store audience facts independently so history and analytics can
        // filter or display them without parsing the enriched prompt.
        region: input.audience?.region ?? null,
        ageRange: input.audience?.age_range ?? null,
        gender: input.audience?.gender ?? null,
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
    // Worker needs platform outputs to know what to generate,
    // and the credit reservation to capture and release credits.
    return this.client.generationRequest.findUnique({
      where: { id: generationRequestId },
      include: { platformOutputs: true, creditReservation: true },
    });
  }

  updateStatusForWorker(generationRequestId: string, status: string) {
    return this.client.generationRequest.update({
      where: { id: generationRequestId },
      data: { status },
    });
  }
}

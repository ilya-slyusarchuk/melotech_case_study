import { describe, expect, it, vi } from "vitest";
import type { Platform } from "@melotech/shared";
import {
  GenerationProcessor,
  type WorkerGeneration,
  type WorkerPlatformOutput,
} from "./processor.js";
import { InMemoryEventPublisher } from "@melotech/realtime";
import type { CreditService } from "@melotech/billing";

describe("generation processor", () => {
  it("marks generation as processing", async () => {
    const { processor, mocks } = createTestFixture({
      generation: makeGeneration({
        platformOutputs: [
          makePlatformOutput({ platform: "spotify", status: "pending" }),
        ],
      }),
    });

    await processor.process({ generationRequestId: "gen_1" });

    expect(
      mocks.generationRepository.updateStatusForWorker,
    ).toHaveBeenCalledWith("gen_1", "processing");
  });

  it("marks platform as processing", async () => {
    const { processor, mocks } = createTestFixture({
      generation: makeGeneration({
        platformOutputs: [
          makePlatformOutput({ platform: "spotify", status: "pending" }),
        ],
      }),
    });

    await processor.process({ generationRequestId: "gen_1" });

    expect(
      mocks.platformOutputRepository.markProcessingForWorker,
    ).toHaveBeenCalledWith("gen_1", "spotify");
  });

  it("completes all successful platforms", async () => {
    const { processor, mocks, publisher } = createTestFixture({
      generation: makeGeneration({
        platformOutputs: [
          makePlatformOutput({ platform: "spotify", status: "pending" }),
          makePlatformOutput({ platform: "tiktok", status: "pending" }),
        ],
      }),
    });

    await processor.process({ generationRequestId: "gen_1" });

    expect(
      mocks.platformOutputRepository.markCompletedForWorker,
    ).toHaveBeenCalledWith("gen_1", "spotify", expect.any(Object));
    expect(
      mocks.platformOutputRepository.markCompletedForWorker,
    ).toHaveBeenCalledWith("gen_1", "tiktok", expect.any(Object));
    expect(
      mocks.generationRepository.updateStatusForWorker,
    ).toHaveBeenLastCalledWith("gen_1", "completed");

    const finalEvent = publisher.events.filter(
      (e) => e.type === "generation_update",
    );
    expect(finalEvent).toHaveLength(1);
    expect(finalEvent[0]).toMatchObject({ status: "completed" });
  });

  it("one platform failure results in partial generation", async () => {
    const { processor, mocks, publisher } = createTestFixture({
      generation: makeGeneration({
        platformOutputs: [
          makePlatformOutput({ platform: "spotify", status: "pending" }),
          makePlatformOutput({ platform: "tiktok", status: "pending" }),
        ],
      }),
      platformFailures: ["tiktok"],
    });

    await processor.process({ generationRequestId: "gen_1" });

    expect(
      mocks.platformOutputRepository.markFailedForWorker,
    ).toHaveBeenCalledWith("gen_1", "tiktok", expect.any(String));
    expect(
      mocks.generationRepository.updateStatusForWorker,
    ).toHaveBeenLastCalledWith("gen_1", "partial");

    const finalEvent = publisher.events.filter(
      (e) => e.type === "generation_update",
    );
    expect(finalEvent[0]).toMatchObject({ status: "partial" });
  });

  it("all platform failures result in failed generation", async () => {
    const { processor, mocks, publisher } = createTestFixture({
      generation: makeGeneration({
        platformOutputs: [
          makePlatformOutput({ platform: "spotify", status: "pending" }),
        ],
      }),
      platformFailures: ["spotify"],
    });

    await processor.process({ generationRequestId: "gen_1" });

    expect(
      mocks.platformOutputRepository.markFailedForWorker,
    ).toHaveBeenCalledWith("gen_1", "spotify", expect.any(String));
    expect(
      mocks.generationRepository.updateStatusForWorker,
    ).toHaveBeenLastCalledWith("gen_1", "failed");

    const finalEvent = publisher.events.filter(
      (e) => e.type === "generation_update",
    );
    expect(finalEvent[0]).toMatchObject({ status: "failed" });
  });

  it("cache fallback creates completed output with source cache", async () => {
    const cacheOutput = { title: "Cached Song" };
    const { processor, mocks, publisher } = createTestFixture({
      generation: makeGeneration({
        platformOutputs: [
          makePlatformOutput({ platform: "spotify", status: "pending" }),
        ],
      }),
      platformFailures: ["spotify"],
      cacheFallbacks: { spotify: cacheOutput },
    });

    await processor.process({ generationRequestId: "gen_1" });

    expect(
      mocks.platformOutputRepository.markCompletedFromCacheForWorker,
    ).toHaveBeenCalledWith("gen_1", "spotify", cacheOutput);
    expect(
      mocks.platformOutputRepository.markFailedForWorker,
    ).not.toHaveBeenCalled();

    const platformEvents = publisher.events.filter(
      (e) => e.type === "platform_update" && e.platform === "spotify",
    );
    const terminalEvent = platformEvents.find(
      (e) => e.status === "completed_from_cache",
    );
    expect(terminalEvent).toMatchObject({
      status: "completed_from_cache",
      source: "CACHE",
    });
  });

  it("failed output consumes zero credits", async () => {
    const { processor, mocks } = createTestFixture({
      generation: makeGeneration({
        platformOutputs: [
          makePlatformOutput({ platform: "spotify", status: "pending" }),
        ],
      }),
      platformFailures: ["spotify"],
    });

    await processor.process({ generationRequestId: "gen_1" });

    expect(
      mocks.creditService.captureCreditsForSuccessfulPlatform,
    ).not.toHaveBeenCalled();
  });

  it("successful output captures correct credits", async () => {
    const { processor, mocks } = createTestFixture({
      generation: makeGeneration({
        platformOutputs: [
          makePlatformOutput({ platform: "spotify", status: "pending" }),
        ],
      }),
    });

    await processor.process({ generationRequestId: "gen_1" });

    expect(
      mocks.creditService.captureCreditsForSuccessfulPlatform,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_1",
        platform: "spotify",
        outputStored: true,
        idempotencyKey: "capture:gen_1:spotify",
      }),
    );
  });

  it("releases unused reserved credits", async () => {
    const { processor, mocks } = createTestFixture({
      generation: makeGeneration({
        platformOutputs: [
          makePlatformOutput({ platform: "spotify", status: "pending" }),
          makePlatformOutput({ platform: "tiktok", status: "pending" }),
        ],
      }),
      platformFailures: ["tiktok"],
    });

    await processor.process({ generationRequestId: "gen_1" });

    expect(
      mocks.creditService.releaseUnusedReservedCredits,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_1",
        reservationId: "res_1",
        idempotencyKey: "release:gen_1",
      }),
    );
  });

  it("publishes events after each platform update", async () => {
    const { processor, publisher } = createTestFixture({
      generation: makeGeneration({
        platformOutputs: [
          makePlatformOutput({ platform: "spotify", status: "pending" }),
        ],
      }),
    });

    await processor.process({ generationRequestId: "gen_1" });

    const platformEvents = publisher.events.filter(
      (e) => e.type === "platform_update",
    );
    expect(platformEvents.length).toBeGreaterThanOrEqual(2);
    expect(platformEvents[0]).toMatchObject({ status: "processing" });
    expect(platformEvents[platformEvents.length - 1]).toMatchObject({
      status: "completed",
      source: "LLM",
    });
  });

  it("publishes final generation event", async () => {
    const { processor, publisher } = createTestFixture({
      generation: makeGeneration({
        platformOutputs: [
          makePlatformOutput({ platform: "spotify", status: "pending" }),
        ],
      }),
    });

    await processor.process({ generationRequestId: "gen_1" });

    const finalEvents = publisher.events.filter(
      (e) => e.type === "generation_update",
    );
    expect(finalEvents).toHaveLength(1);
    expect(finalEvents[0]).toMatchObject({
      generationRequestId: "gen_1",
      status: "completed",
    });
  });

  it("re-processing successful platform does not double capture credits", async () => {
    const { processor, mocks } = createTestFixture({
      generation: makeGeneration({
        platformOutputs: [
          makePlatformOutput({ platform: "spotify", status: "completed" }),
        ],
      }),
    });

    await processor.process({ generationRequestId: "gen_1" });

    expect(
      mocks.platformOutputRepository.markProcessingForWorker,
    ).not.toHaveBeenCalled();
    expect(
      mocks.creditService.captureCreditsForSuccessfulPlatform,
    ).not.toHaveBeenCalled();
  });

  it("completed platform remains completed after retry", async () => {
    const { processor, mocks } = createTestFixture({
      generation: makeGeneration({
        platformOutputs: [
          makePlatformOutput({ platform: "spotify", status: "completed" }),
        ],
      }),
    });

    await processor.process({ generationRequestId: "gen_1" });

    expect(
      mocks.platformOutputRepository.markCompletedForWorker,
    ).not.toHaveBeenCalled();
    expect(
      mocks.platformOutputRepository.markCompletedFromCacheForWorker,
    ).not.toHaveBeenCalled();
    expect(
      mocks.platformOutputRepository.markFailedForWorker,
    ).not.toHaveBeenCalled();
  });

  it("releasing same reservation twice does not duplicate release", async () => {
    // Simulate a credit service where releaseUnusedReservedCredits is
    // idempotent: the second call with the same idempotency key returns
    // the existing ledger entry instead of creating a new one.
    let releaseCallCount = 0;
    const idempotentCreditService = createMockCreditService();
    idempotentCreditService.releaseUnusedReservedCredits = vi.fn(async () => {
      releaseCallCount += 1;
      // Return the same ledger entry on every call to simulate idempotency.
      return {
        id: "ledger_release_1",
        idempotencyKey: "release:gen_1",
      };
    });

    const { processor, mocks } = createTestFixture({
      generation: makeGeneration({
        platformOutputs: [
          makePlatformOutput({ platform: "spotify", status: "completed" }),
        ],
      }),
      creditService: idempotentCreditService as unknown as CreditService,
    });

    await processor.process({ generationRequestId: "gen_1" });

    expect(mocks.creditService.releaseUnusedReservedCredits).toHaveBeenCalled();
    expect(releaseCallCount).toBe(1);
  });

  it("publishes credits update after successful platform capture", async () => {
    const { processor, publisher } = createTestFixture({
      generation: makeGeneration({
        platformOutputs: [
          makePlatformOutput({ platform: "spotify", status: "pending" }),
        ],
      }),
    });

    await processor.process({ generationRequestId: "gen_1" });

    const creditsEvents = publisher.events.filter(
      (e) => e.type === "credits_update",
    );
    expect(creditsEvents.length).toBeGreaterThanOrEqual(1);
    expect(creditsEvents[0]).toMatchObject({
      type: "credits_update",
      generationRequestId: "gen_1",
      availableCredits: 97,
      reservedCredits: 1,
    });
  });

  it("publishes credits update after final release", async () => {
    const { processor, publisher } = createTestFixture({
      generation: makeGeneration({
        platformOutputs: [
          makePlatformOutput({ platform: "spotify", status: "pending" }),
        ],
      }),
    });

    await processor.process({ generationRequestId: "gen_1" });

    const creditsEvents = publisher.events.filter(
      (e) => e.type === "credits_update",
    );
    // At least one event from capture and one from release.
    expect(creditsEvents.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

type FixtureOptions = {
  generation: WorkerGeneration;
  platformFailures?: Platform[];
  cacheFallbacks?: Partial<Record<Platform, unknown>>;
  creditService?: CreditService;
};

function createTestFixture(options: FixtureOptions) {
  // Shared mutable state so the generation repository can see platform
  // output updates when it re-loads the generation for finalization.
  const state = {
    generation: structuredClone(options.generation) as WorkerGeneration,
  };

  const generationRepository = createMockGenerationRepository(state);
  const platformOutputRepository = createMockPlatformOutputRepository(state);
  const generatorRegistry = createMockGeneratorRegistry(
    options.platformFailures ?? [],
  );
  const similarResultService = createMockSimilarResultService(
    options.cacheFallbacks ?? {},
  );
  const creditService = options.creditService ?? createMockCreditService();
  const eventPublisher = new InMemoryEventPublisher();

  const processor = new GenerationProcessor({
    generationRepository,
    platformOutputRepository,
    generatorRegistry,
    similarResultService,
    creditService,
    eventPublisher,
  });

  return {
    processor,
    publisher: eventPublisher,
    mocks: {
      generationRepository,
      platformOutputRepository,
      generatorRegistry,
      similarResultService,
      creditService,
    },
  };
}

function makeGeneration(
  overrides: Partial<WorkerGeneration> = {},
): WorkerGeneration {
  return {
    id: "gen_1",
    userId: "user_1",
    rawPrompt: "Create a song",
    enrichedPrompt: "Create a song",
    region: null,
    ageRange: null,
    gender: null,
    status: "pending",
    platformOutputs: [],
    creditReservation: {
      id: "res_1",
      userId: "user_1",
      generationRequestId: "gen_1",
      reservedCredits: 3,
      capturedCredits: 0,
      releasedCredits: 0,
      status: "active",
    },
    ...overrides,
  };
}

function makePlatformOutput(
  overrides: Partial<WorkerPlatformOutput> = {},
): WorkerPlatformOutput {
  return {
    id: "po_1",
    platform: "spotify",
    status: "pending",
    content: null,
    errorMessage: null,
    ...overrides,
  };
}

function createMockGenerationRepository(state: {
  generation: WorkerGeneration;
}) {
  return {
    findByIdForWorker: vi.fn(async (id: string) => {
      if (id !== state.generation.id) return null;
      return structuredClone(state.generation) as unknown;
    }),
    updateStatusForWorker: vi.fn(async (id: string, status: string) => {
      if (id === state.generation.id) {
        state.generation = { ...state.generation, status };
      }
    }),
  };
}

function createMockPlatformOutputRepository(state: {
  generation: WorkerGeneration;
}) {
  function updatePlatformStatus(
    generationId: string,
    platform: Platform,
    status: string,
    content?: unknown,
    errorMessage?: string,
  ) {
    if (generationId !== state.generation.id) return;
    const outputs = state.generation.platformOutputs.map((output) =>
      output.platform === platform
        ? { ...output, status, content, errorMessage }
        : output,
    );
    state.generation = { ...state.generation, platformOutputs: outputs };
  }

  return {
    markProcessingForWorker: vi.fn(async (generationId, platform) => {
      updatePlatformStatus(generationId, platform, "processing");
    }),
    markCompletedForWorker: vi.fn(async (generationId, platform, content) => {
      updatePlatformStatus(generationId, platform, "completed", content);
    }),
    markCompletedFromCacheForWorker: vi.fn(
      async (generationId, platform, content) => {
        updatePlatformStatus(
          generationId,
          platform,
          "completed_from_cache",
          content,
        );
      },
    ),
    markFailedForWorker: vi.fn(async (generationId, platform, errorMessage) => {
      updatePlatformStatus(
        generationId,
        platform,
        "failed",
        undefined,
        errorMessage,
      );
    }),
  };
}

function createMockGeneratorRegistry(failingPlatforms: Platform[]) {
  return {
    get: vi.fn((platform: Platform) => ({
      platform,
      async generate() {
        if (failingPlatforms.includes(platform)) {
          throw new Error(`Generation failed for ${platform}`);
        }
        return { title: `Generated ${platform}` };
      },
    })),
  };
}

function createMockSimilarResultService(
  fallbackOutputs: Partial<Record<Platform, unknown>>,
) {
  return {
    cacheSuccessfulOutput: vi.fn(async () => ({})),
    findSimilarResult: vi.fn(async ({ platform }: { platform: Platform }) => {
      const output = fallbackOutputs[platform];
      if (!output) return null;
      return {
        id: "cache_1",
        userId: "user_1",
        prompt: "test",
        platform,
        outputJson: output,
        embedding: [1, 2, 3],
        createdAt: new Date(),
        similarityScore: 0.95,
      };
    }),
  };
}

function createMockCreditService(): Record<
  keyof Pick<
    CreditService,
    | "captureCreditsForSuccessfulPlatform"
    | "releaseUnusedReservedCredits"
    | "findReservationForGeneration"
    | "readWalletBalance"
  >,
  ReturnType<typeof vi.fn>
> {
  return {
    captureCreditsForSuccessfulPlatform: vi.fn(async () => ({})),
    releaseUnusedReservedCredits: vi.fn(async () => ({})),
    findReservationForGeneration: vi.fn(async () => null),
    readWalletBalance: vi.fn(async () => ({
      id: "wallet_1",
      userId: "user_1",
      availableCredits: 97,
      reservedCredits: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  };
}

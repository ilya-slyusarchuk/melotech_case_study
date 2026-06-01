import { describe, expect, it } from "vitest";
import {
  PlatformOutputRepository,
  type PlatformOutputRepositoryClient,
} from "./platform-output-repository.js";

type TestPlatformOutputClient = PlatformOutputRepositoryClient & {
  lastCreateManyArgs: unknown;
  lastUpdateManyArgs: unknown;
};

describe("platform output repository", () => {
  it("creates pending outputs for requested platforms", async () => {
    const client = createPlatformOutputClient();
    const repository = new PlatformOutputRepository(client);

    await repository.createPendingOutputs("generation_1", [
      "spotify",
      "tiktok",
    ]);

    expect(client.lastCreateManyArgs).toMatchObject({
      data: [
        {
          generationRequestId: "generation_1",
          platform: "spotify",
          status: "pending",
        },
        {
          generationRequestId: "generation_1",
          platform: "tiktok",
          status: "pending",
        },
      ],
    });
  });

  it("marks a platform as processing", async () => {
    const client = createPlatformOutputClient();
    const repository = new PlatformOutputRepository(client);

    await repository.markProcessingForWorker("generation_1", "spotify");

    expect(client.lastUpdateManyArgs).toMatchObject({
      where: { generationRequestId: "generation_1", platform: "spotify" },
      data: { status: "processing" },
    });
  });

  it("marks a platform as completed with content", async () => {
    const client = createPlatformOutputClient();
    const repository = new PlatformOutputRepository(client);

    await repository.markCompletedForWorker("generation_1", "youtube", {
      title: "My Song",
    });

    expect(client.lastUpdateManyArgs).toMatchObject({
      where: { generationRequestId: "generation_1", platform: "youtube" },
      data: { status: "completed", content: { title: "My Song" } },
    });
  });

  it("marks a platform as completed from cache", async () => {
    const client = createPlatformOutputClient();
    const repository = new PlatformOutputRepository(client);

    await repository.markCompletedFromCacheForWorker("generation_1", "tiktok", {
      hook: "#trend",
    });

    expect(client.lastUpdateManyArgs).toMatchObject({
      where: { generationRequestId: "generation_1", platform: "tiktok" },
      data: { status: "completed_from_cache", content: { hook: "#trend" } },
    });
  });

  it("marks a platform as failed with an error message", async () => {
    const client = createPlatformOutputClient();
    const repository = new PlatformOutputRepository(client);

    await repository.markFailedForWorker(
      "generation_1",
      "spotify",
      "LLM timeout",
    );

    expect(client.lastUpdateManyArgs).toMatchObject({
      where: { generationRequestId: "generation_1", platform: "spotify" },
      data: { status: "failed", errorMessage: "LLM timeout" },
    });
  });

  it("marks a platform as failed without an error message", async () => {
    const client = createPlatformOutputClient();
    const repository = new PlatformOutputRepository(client);

    await repository.markFailedForWorker("generation_1", "spotify");

    expect(client.lastUpdateManyArgs).toMatchObject({
      where: { generationRequestId: "generation_1", platform: "spotify" },
      data: { status: "failed", errorMessage: null },
    });
  });
});

function createPlatformOutputClient() {
  const client: TestPlatformOutputClient = {
    lastCreateManyArgs: null as unknown,
    lastUpdateManyArgs: null as unknown,
    platformOutput: {
      createMany: async (args: unknown) => {
        client.lastCreateManyArgs = args;
        return { count: 2 };
      },
      updateMany: async (args: unknown) => {
        client.lastUpdateManyArgs = args;
        return { count: 1 };
      },
    },
  };

  return client;
}

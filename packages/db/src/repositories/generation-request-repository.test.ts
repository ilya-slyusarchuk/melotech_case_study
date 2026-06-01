import { describe, expect, it } from "vitest";
import {
  GenerationRequestRepository,
  type GenerationRepositoryClient,
} from "./generation-request-repository.js";

type TestGenerationClient = GenerationRepositoryClient & {
  lastCreateArgs: unknown;
  lastFindFirstArgs: unknown;
  lastFindManyArgs: unknown;
  lastFindUniqueArgs: unknown;
};

describe("generation request repository", () => {
  it("creates a user-owned generation with pending outputs", async () => {
    const client = createGenerationClient();
    const repository = new GenerationRequestRepository(client);

    await repository.createForUser({
      userId: "user_a",
      rawPrompt: "Create a Brazilian funk launch concept.",
      platforms: ["spotify", "tiktok"],
    });

    expect(client.lastCreateArgs).toMatchObject({
      data: {
        userId: "user_a",
        rawPrompt: "Create a Brazilian funk launch concept.",
        enrichedPrompt: "Create a Brazilian funk launch concept.",
        region: null,
        ageRange: null,
        gender: null,
        status: "pending",
        platformOutputs: {
          create: [
            { platform: "spotify", status: "pending" },
            { platform: "tiktok", status: "pending" },
          ],
        },
      },
      include: { platformOutputs: true },
    });
  });

  it("stores raw and enriched prompts when audience is provided", async () => {
    const client = createGenerationClient();
    const repository = new GenerationRequestRepository(client);

    await repository.createForUser({
      userId: "user_a",
      rawPrompt: "Create a Brazilian funk launch concept.",
      audience: {
        region: "Brazil",
        age_range: "18-24",
        gender: "female",
      },
      platforms: ["youtube"],
    });

    expect(client.lastCreateArgs).toMatchObject({
      data: {
        rawPrompt: "Create a Brazilian funk launch concept.",
        region: "Brazil",
        ageRange: "18-24",
        gender: "female",
      },
    });
    expect(getCreateData(client.lastCreateArgs).enrichedPrompt).toContain(
      "Original music concept:\nCreate a Brazilian funk launch concept.",
    );
    expect(getCreateData(client.lastCreateArgs).enrichedPrompt).toContain(
      "- Target region: Brazil",
    );
    expect(getCreateData(client.lastCreateArgs).enrichedPrompt).toContain(
      "- Target age range: 18-24",
    );
    expect(getCreateData(client.lastCreateArgs).enrichedPrompt).toContain(
      "- Target gender: Female",
    );
  });

  it("stores the raw prompt as the enriched prompt without audience", async () => {
    const client = createGenerationClient();
    const repository = new GenerationRequestRepository(client);

    await repository.createForUser({
      userId: "user_a",
      rawPrompt: "Create a moody synth-pop release plan.",
      platforms: ["spotify"],
    });

    expect(client.lastCreateArgs).toMatchObject({
      data: {
        rawPrompt: "Create a moody synth-pop release plan.",
        enrichedPrompt: "Create a moody synth-pop release plan.",
      },
    });
  });

  it("stores audience fields as queryable columns", async () => {
    const client = createGenerationClient();
    const repository = new GenerationRequestRepository(client);

    await repository.createForUser({
      userId: "user_a",
      rawPrompt: "Create a regional corridos release plan.",
      audience: { region: "Mexico" },
      platforms: ["tiktok"],
    });

    expect(client.lastCreateArgs).toMatchObject({
      data: {
        region: "Mexico",
        ageRange: null,
        gender: null,
      },
    });
  });

  it("requires userId when listing user history", async () => {
    const client = createGenerationClient();
    const repository = new GenerationRequestRepository(client);

    await repository.listForUser({ userId: "user_a" });

    expect(client.lastFindManyArgs).toMatchObject({
      where: { userId: "user_a" },
      include: { platformOutputs: true },
      orderBy: { createdAt: "desc" },
    });
  });

  it("keeps platform-filtered history scoped to the user", async () => {
    const client = createGenerationClient();
    const repository = new GenerationRequestRepository(client);

    await repository.listForUser({ userId: "user_a", platform: "youtube" });

    expect(client.lastFindManyArgs).toMatchObject({
      where: {
        userId: "user_a",
        platformOutputs: { some: { platform: "youtube" } },
      },
    });
  });

  it("returns null when a generation does not belong to the user", async () => {
    const client = createGenerationClient();
    const repository = new GenerationRequestRepository(client);

    await expect(
      repository.findByIdForUser("user_a", "generation_b"),
    ).resolves.toBeNull();
    expect(client.lastFindFirstArgs).toMatchObject({
      where: { id: "generation_b", userId: "user_a" },
    });
  });

  it("worker lookup loads by generation id and includes user ownership", async () => {
    const client = createGenerationClient({
      id: "generation_a",
      userId: "user_a",
      platformOutputs: [],
    });
    const repository = new GenerationRequestRepository(client);

    await expect(
      repository.findByIdForWorker("generation_a"),
    ).resolves.toMatchObject({
      id: "generation_a",
      userId: "user_a",
    });
    expect(client.lastFindUniqueArgs).toMatchObject({
      where: { id: "generation_a" },
      include: { platformOutputs: true },
    });
  });
});

function createGenerationClient(findUniqueResult: unknown = null) {
  const client: TestGenerationClient = {
    lastCreateArgs: null as unknown,
    lastFindFirstArgs: null as unknown,
    lastFindManyArgs: null as unknown,
    lastFindUniqueArgs: null as unknown,
    generationRequest: {
      create: async (args: unknown) => {
        client.lastCreateArgs = args;
        return { id: "generation_a" };
      },
      findFirst: async (args: unknown) => {
        client.lastFindFirstArgs = args;
        return null;
      },
      findMany: async (args: unknown) => {
        client.lastFindManyArgs = args;
        return [];
      },
      findUnique: async (args: unknown) => {
        client.lastFindUniqueArgs = args;
        return findUniqueResult;
      },
    },
  };

  return client;
}

function getCreateData(args: unknown) {
  return (args as { data: { enrichedPrompt: string } }).data;
}

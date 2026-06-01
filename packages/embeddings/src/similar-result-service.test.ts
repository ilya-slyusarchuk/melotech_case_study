import { describe, expect, it } from "vitest";
import type { Platform } from "@melotech/shared";
import type { EmbeddingAdapter } from "./adapter.js";
import {
  SimilarResultService,
  type SimilarResultCacheRecord,
  type SimilarResultCacheRepository,
  type StoreSimilarResultCacheInput,
} from "./similar-result-service.js";

class FakeEmbeddingAdapter implements EmbeddingAdapter {
  public readonly embeddedTexts: string[] = [];

  constructor(private readonly vectorsByText: Record<string, number[]>) {}

  async embedText(text: string): Promise<number[]> {
    this.embeddedTexts.push(text);
    return this.vectorsByText[text] ?? [0, 0];
  }
}

class MemorySimilarResultCacheRepository implements SimilarResultCacheRepository {
  public readonly records: SimilarResultCacheRecord[] = [];

  constructor(seed: SimilarResultCacheRecord[] = []) {
    this.records = [...seed];
  }

  async store(
    input: StoreSimilarResultCacheInput,
  ): Promise<SimilarResultCacheRecord> {
    const record = {
      ...input,
      id: `cache_${this.records.length + 1}`,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    };
    this.records.push(record);
    return record;
  }

  async findForUserAndPlatform(input: {
    userId: string;
    platform: Platform;
  }): Promise<SimilarResultCacheRecord[]> {
    return this.records.filter(
      (record) =>
        record.userId === input.userId && record.platform === input.platform,
    );
  }
}

describe("EmbeddingAdapter contract", () => {
  it("allows a fake embedding adapter to implement the interface", async () => {
    const adapter: EmbeddingAdapter = new FakeEmbeddingAdapter({
      "hello world": [1, 2, 3],
    });

    await expect(adapter.embedText("hello world")).resolves.toEqual([1, 2, 3]);
  });

  it("allows similarity service to depend on a fake adapter", async () => {
    const adapter = new FakeEmbeddingAdapter({ prompt: [1, 0] });
    const repository = new MemorySimilarResultCacheRepository();
    const service = new SimilarResultService(adapter, repository, {
      similarityThreshold: 0.8,
    });

    await service.cacheSuccessfulOutput({
      userId: "user_a",
      enrichedPrompt: "prompt",
      platform: "spotify",
      outputJson: { title: "Midnight Drive" },
    });

    expect(adapter.embeddedTexts).toEqual(["prompt"]);
  });
});

describe("SimilarResultService", () => {
  it("stores successful output in cache", async () => {
    const repository = new MemorySimilarResultCacheRepository();
    const service = new SimilarResultService(
      new FakeEmbeddingAdapter({ prompt: [1, 0] }),
      repository,
      { similarityThreshold: 0.8 },
    );

    await service.cacheSuccessfulOutput({
      userId: "user_a",
      enrichedPrompt: "prompt",
      platform: "spotify",
      outputJson: { title: "Midnight Drive" },
      audience: { region: "Brazil", age_range: "18-24", gender: "female" },
    });

    expect(repository.records[0]).toMatchObject({
      userId: "user_a",
      prompt: "prompt",
      platform: "spotify",
      outputJson: { title: "Midnight Drive" },
      embedding: [1, 0],
      region: "Brazil",
      ageRange: "18-24",
      gender: "female",
    });
  });

  it("finds the closest result for same user and platform", async () => {
    const service = createService({
      records: [
        cacheRecord({ id: "far", embedding: [0, 1] }),
        cacheRecord({ id: "near", embedding: [0.98, 0.02] }),
      ],
      vectorsByText: { query: [1, 0] },
      threshold: 0.5,
    });

    await expect(
      service.findSimilarResult({
        userId: "user_a",
        enrichedPrompt: "query",
        platform: "spotify",
      }),
    ).resolves.toMatchObject({ id: "near" });
  });

  it("does not return result from another user", async () => {
    const service = createService({
      records: [cacheRecord({ userId: "user_b", embedding: [1, 0] })],
      vectorsByText: { query: [1, 0] },
      threshold: 0.5,
    });

    await expect(
      service.findSimilarResult({
        userId: "user_a",
        enrichedPrompt: "query",
        platform: "spotify",
      }),
    ).resolves.toBeNull();
  });

  it("does not return result from another platform", async () => {
    const service = createService({
      records: [cacheRecord({ platform: "youtube", embedding: [1, 0] })],
      vectorsByText: { query: [1, 0] },
      threshold: 0.5,
    });

    await expect(
      service.findSimilarResult({
        userId: "user_a",
        enrichedPrompt: "query",
        platform: "spotify",
      }),
    ).resolves.toBeNull();
  });

  it("prefers same region when similarity scores are close", async () => {
    const service = createService({
      records: [
        cacheRecord({
          id: "slightly_higher_score",
          embedding: [0.99, 0.01],
          region: "Spain",
        }),
        cacheRecord({
          id: "same_region",
          embedding: [0.98, 0.02],
          region: "Brazil",
        }),
      ],
      vectorsByText: { query: [1, 0] },
      threshold: 0.5,
      closeScoreMargin: 0.03,
    });

    await expect(
      service.findSimilarResult({
        userId: "user_a",
        enrichedPrompt: "query",
        platform: "spotify",
        audience: { region: "Brazil" },
      }),
    ).resolves.toMatchObject({ id: "same_region" });
  });

  it("returns null below threshold", async () => {
    const service = createService({
      records: [cacheRecord({ embedding: [0, 1] })],
      vectorsByText: { query: [1, 0] },
      threshold: 0.8,
    });

    await expect(
      service.findSimilarResult({
        userId: "user_a",
        enrichedPrompt: "query",
        platform: "spotify",
      }),
    ).resolves.toBeNull();
  });
});

function createService(input: {
  records: SimilarResultCacheRecord[];
  vectorsByText: Record<string, number[]>;
  threshold: number;
  closeScoreMargin?: number;
}) {
  return new SimilarResultService(
    new FakeEmbeddingAdapter(input.vectorsByText),
    new MemorySimilarResultCacheRepository(input.records),
    {
      similarityThreshold: input.threshold,
      closeScoreMargin: input.closeScoreMargin,
    },
  );
}

function cacheRecord(
  overrides: Partial<SimilarResultCacheRecord> = {},
): SimilarResultCacheRecord {
  return {
    id: "cache_a",
    userId: "user_a",
    prompt: "cached prompt",
    platform: "spotify",
    outputJson: { title: "Cached title" },
    embedding: [1, 0],
    region: null,
    ageRange: null,
    gender: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

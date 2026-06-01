import { describe, expect, it } from "vitest";
import {
  SimilarResultCacheRepository,
  type SimilarResultCacheRepositoryClient,
} from "./similar-result-cache-repository.js";

type TestSimilarResultCacheClient = SimilarResultCacheRepositoryClient & {
  lastCreateArgs: unknown;
  lastFindManyArgs: unknown;
};

describe("similar result cache repository", () => {
  it("stores cache result for user and platform", async () => {
    const client = createClient();
    const repository = new SimilarResultCacheRepository(client);

    await repository.store({
      userId: "user_a",
      prompt: "Create regional pop metadata.",
      platform: "spotify",
      outputJson: { title: "Midnight Drive" },
      embedding: [0.1, 0.2],
      region: "Brazil",
      ageRange: "18-24",
      gender: "female",
    });

    expect(client.lastCreateArgs).toEqual({
      data: {
        userId: "user_a",
        prompt: "Create regional pop metadata.",
        platform: "spotify",
        outputJson: { title: "Midnight Drive" },
        embedding: [0.1, 0.2],
        region: "Brazil",
        ageRange: "18-24",
        gender: "female",
      },
    });
  });

  it("queries cache results by user and platform", async () => {
    const client = createClient();
    const repository = new SimilarResultCacheRepository(client);

    await repository.findForUserAndPlatform({
      userId: "user_a",
      platform: "tiktok",
    });

    expect(client.lastFindManyArgs).toEqual({
      where: {
        userId: "user_a",
        platform: "tiktok",
      },
      orderBy: { createdAt: "desc" },
    });
  });

  it("does not return another user's cache", async () => {
    const repository = new SimilarResultCacheRepository(
      createClient([
        { userId: "user_a", platform: "spotify" },
        { userId: "user_b", platform: "spotify" },
      ]),
    );

    await expect(
      repository.findForUserAndPlatform({
        userId: "user_a",
        platform: "spotify",
      }),
    ).resolves.toEqual([{ userId: "user_a", platform: "spotify" }]);
  });

  it("does not return another platform's cache", async () => {
    const repository = new SimilarResultCacheRepository(
      createClient([
        { userId: "user_a", platform: "spotify" },
        { userId: "user_a", platform: "youtube" },
      ]),
    );

    await expect(
      repository.findForUserAndPlatform({
        userId: "user_a",
        platform: "spotify",
      }),
    ).resolves.toEqual([{ userId: "user_a", platform: "spotify" }]);
  });
});

function createClient(
  records: Array<{ userId: string; platform: string }> = [],
) {
  const client: TestSimilarResultCacheClient = {
    lastCreateArgs: null as unknown,
    lastFindManyArgs: null as unknown,
    similarResultCache: {
      create: async (args: unknown) => {
        client.lastCreateArgs = args;
        return { id: "cache_a" };
      },
      findMany: async (args: unknown) => {
        client.lastFindManyArgs = args;
        const where = (args as { where: { userId: string; platform: string } })
          .where;

        return records.filter(
          (record) =>
            record.userId === where.userId &&
            record.platform === where.platform,
        );
      },
    },
  };

  return client;
}

import type { Platform } from "@melotech/shared";

type SimilarResultCacheDelegate = {
  create(args: unknown): Promise<unknown>;
  findMany(args: unknown): Promise<unknown[]>;
};

export type SimilarResultCacheRepositoryClient = {
  similarResultCache: SimilarResultCacheDelegate;
};

export type StoreSimilarResultCacheInput = {
  userId: string;
  prompt: string;
  platform: Platform;
  outputJson: unknown;
  embedding: number[];
  region?: string | null;
  ageRange?: string | null;
  gender?: string | null;
};

export type SimilarResultCacheRecord = StoreSimilarResultCacheInput & {
  id?: string;
  createdAt: Date;
};

export class SimilarResultCacheRepository {
  constructor(private readonly client: SimilarResultCacheRepositoryClient) {}

  async store(
    input: StoreSimilarResultCacheInput,
  ): Promise<SimilarResultCacheRecord> {
    // Store the embedding as JSON for the MVP.
    // A production path can swap this repository to pgvector without changing
    // the embedding service contract.
    const record = await this.client.similarResultCache.create({
      data: {
        userId: input.userId,
        prompt: input.prompt,
        platform: input.platform,
        outputJson: input.outputJson,
        embedding: input.embedding,
        region: input.region ?? null,
        ageRange: input.ageRange ?? null,
        gender: input.gender ?? null,
      },
    });

    return record as SimilarResultCacheRecord;
  }

  async findForUserAndPlatform(input: {
    userId: string;
    platform: Platform;
  }): Promise<SimilarResultCacheRecord[]> {
    const records = await this.client.similarResultCache.findMany({
      where: {
        userId: input.userId,
        platform: input.platform,
      },
      orderBy: { createdAt: "desc" },
    });

    return records as SimilarResultCacheRecord[];
  }
}

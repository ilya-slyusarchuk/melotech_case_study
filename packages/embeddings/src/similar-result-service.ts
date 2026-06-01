import type { AudienceTargeting, Platform } from "@melotech/shared";
import type { EmbeddingAdapter } from "./adapter.js";
import { cosineSimilarity } from "./cosine-similarity.js";

export type SimilarResultCacheRecord = {
  id?: string;
  userId: string;
  prompt: string;
  platform: Platform;
  outputJson: unknown;
  embedding: number[];
  region?: string | null;
  ageRange?: string | null;
  gender?: string | null;
  createdAt: Date;
};

export type StoreSimilarResultCacheInput = Omit<
  SimilarResultCacheRecord,
  "id" | "createdAt"
>;

export interface SimilarResultCacheRepository {
  store(input: StoreSimilarResultCacheInput): Promise<SimilarResultCacheRecord>;
  findForUserAndPlatform(input: {
    userId: string;
    platform: Platform;
  }): Promise<SimilarResultCacheRecord[]>;
}

export type SimilarResultServiceOptions = {
  similarityThreshold: number;
  closeScoreMargin?: number;
};

export type CachePlatformOutputInput = {
  userId: string;
  enrichedPrompt: string;
  platform: Platform;
  outputJson: unknown;
  audience?: AudienceTargeting | null;
};

export type FindSimilarResultInput = {
  userId: string;
  enrichedPrompt: string;
  platform: Platform;
  audience?: AudienceTargeting | null;
};

export type SimilarResultCacheHit = SimilarResultCacheRecord & {
  similarityScore: number;
};

const DEFAULT_CLOSE_SCORE_MARGIN = 0.03;

export class SimilarResultService {
  private readonly similarityThreshold: number;
  private readonly closeScoreMargin: number;

  constructor(
    private readonly embeddingAdapter: EmbeddingAdapter,
    private readonly cacheRepository: SimilarResultCacheRepository,
    options: SimilarResultServiceOptions,
  ) {
    this.similarityThreshold = options.similarityThreshold;
    this.closeScoreMargin =
      options.closeScoreMargin ?? DEFAULT_CLOSE_SCORE_MARGIN;
  }

  async cacheSuccessfulOutput(input: CachePlatformOutputInput) {
    const embedding = await this.embeddingAdapter.embedText(
      input.enrichedPrompt,
    );

    return this.cacheRepository.store({
      userId: input.userId,
      prompt: input.enrichedPrompt,
      platform: input.platform,
      outputJson: input.outputJson,
      embedding,
      region: input.audience?.region ?? null,
      ageRange: input.audience?.age_range ?? null,
      gender: input.audience?.gender ?? null,
    });
  }

  async findSimilarResult(
    input: FindSimilarResultInput,
  ): Promise<SimilarResultCacheHit | null> {
    const embedding = await this.embeddingAdapter.embedText(
      input.enrichedPrompt,
    );
    const candidates = await this.cacheRepository.findForUserAndPlatform({
      userId: input.userId,
      platform: input.platform,
    });

    const rankedCandidates = candidates
      .map((candidate) => ({
        ...candidate,
        similarityScore: cosineSimilarity(embedding, candidate.embedding),
      }))
      .filter(
        (candidate) => candidate.similarityScore >= this.similarityThreshold,
      )
      .sort((left, right) => this.compareCandidates(left, right, input));

    return rankedCandidates[0] ?? null;
  }

  private compareCandidates(
    left: SimilarResultCacheHit,
    right: SimilarResultCacheHit,
    input: FindSimilarResultInput,
  ) {
    const scoreDifference = right.similarityScore - left.similarityScore;

    if (Math.abs(scoreDifference) <= this.closeScoreMargin) {
      const leftRegionMatch = isSameRegion(left.region, input.audience?.region);
      const rightRegionMatch = isSameRegion(
        right.region,
        input.audience?.region,
      );

      if (leftRegionMatch !== rightRegionMatch) {
        return leftRegionMatch ? -1 : 1;
      }
    }

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    // Deterministic tie-breaker.
    // Newer cache rows better represent the user's latest taste.
    return right.createdAt.getTime() - left.createdAt.getTime();
  }
}

function isSameRegion(
  cachedRegion?: string | null,
  requestedRegion?: string | null,
) {
  if (!cachedRegion || !requestedRegion) {
    return false;
  }

  return (
    cachedRegion.trim().toLowerCase() === requestedRegion.trim().toLowerCase()
  );
}

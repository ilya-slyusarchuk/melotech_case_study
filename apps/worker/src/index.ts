// Worker bootstrap entrypoint.
// This file is the entry point for the standalone worker service.

import Redis from "ioredis";
import { getSharedConfig, type SharedConfig } from "@melotech/config";
import {
  GenerationRequestRepository,
  PlatformOutputRepository,
  SimilarResultCacheRepository,
} from "@melotech/db";
import {
  OllamaProvider,
  PlatformGeneratorRegistry,
  SpotifyGenerator,
  StructuredOutputService,
  TikTokGenerator,
  YouTubeGenerator,
} from "@melotech/ai";
import {
  OpenAIEmbeddingProvider,
  SimilarResultService,
  type SimilarResultServiceOptions,
} from "@melotech/embeddings";
import { CreditService, PrismaCreditStore } from "@melotech/billing";
import { RedisEventPublisher } from "@melotech/realtime";
import { GenerationProcessor } from "./processor.js";
import { startWorker } from "./bootstrap.js";

type WorkerPlatformGenerationOptions = {
  maxProviderRetries: number;
  maxRepairs: number;
};

export function buildPlatformGenerationOptions(
  config: Pick<
    SharedConfig,
    "GENERATION_RETRY_LIMIT" | "LLM_REPAIR_RETRY_LIMIT"
  >,
): WorkerPlatformGenerationOptions {
  return {
    maxProviderRetries: config.GENERATION_RETRY_LIMIT,
    maxRepairs: config.LLM_REPAIR_RETRY_LIMIT,
  };
}

export function buildSimilarResultOptions(
  config: Pick<SharedConfig, "SIMILARITY_THRESHOLD">,
): SimilarResultServiceOptions {
  return {
    similarityThreshold: config.SIMILARITY_THRESHOLD,
  };
}

// This function wires production dependencies and starts the worker.
// It is only executed when this file is the main module.
export async function main(): Promise<void> {
  const config = getSharedConfig();

  const redisConnection = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  // Lazy imports for Prisma to avoid loading the adapter during test runs
  // that do not need a real database connection.
  const { prisma } = await import("@melotech/db");

  const generationRepository = new GenerationRequestRepository(prisma);
  const platformOutputRepository = new PlatformOutputRepository(prisma);
  const similarResultCacheRepository = new SimilarResultCacheRepository(prisma);

  const aiAdapter = new OllamaProvider({
    baseUrl: config.AI_BASE_URL,
    apiKey: config.AI_API_KEY,
    model: config.AI_MODEL,
  });
  const structuredOutputService = new StructuredOutputService(aiAdapter);
  const platformGenerationOptions = buildPlatformGenerationOptions(config);
  const generatorRegistry = new PlatformGeneratorRegistry([
    new SpotifyGenerator(structuredOutputService, platformGenerationOptions),
    new TikTokGenerator(structuredOutputService, platformGenerationOptions),
    new YouTubeGenerator(structuredOutputService, platformGenerationOptions),
  ]);

  const embeddingAdapter = new OpenAIEmbeddingProvider({
    apiKey: config.EMBEDDING_API_KEY,
    model: config.EMBEDDING_MODEL,
    baseURL: config.EMBEDDING_BASE_URL,
  });
  const similarResultService = new SimilarResultService(
    embeddingAdapter,
    similarResultCacheRepository,
    buildSimilarResultOptions(config),
  );

  const creditService = new CreditService(new PrismaCreditStore(prisma));
  const eventPublisher = new RedisEventPublisher(redisConnection);
  const processor = new GenerationProcessor({
    generationRepository,
    platformOutputRepository,
    generatorRegistry,
    similarResultService,
    creditService,
    eventPublisher,
  });

  await startWorker({
    redisConnection,
    processor,
  });
}

if (import.meta.main) {
  main().catch((error) => {
    console.error("Worker failed to start:", error);
    process.exit(1);
  });
}

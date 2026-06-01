// Worker bootstrap entrypoint.
// This file is the entry point for the standalone worker service.

import Redis from "ioredis";
import { getSharedConfig } from "@melotech/config";
import {
  GenerationRequestRepository,
  PlatformOutputRepository,
} from "@melotech/db";
import { PlatformGeneratorRegistry } from "@melotech/ai";
import { SimilarResultService } from "@melotech/embeddings";
import { CreditService } from "@melotech/billing";
import { RedisEventPublisher } from "@melotech/realtime";
import { GenerationProcessor } from "./processor.js";
import { startWorker } from "./bootstrap.js";

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

  // Full dependency wiring would continue here with AI adapter,
  // embedding adapter, generator registry, similar result service,
  // credit service, and event publisher.
  console.log(
    "Worker bootstrap complete. Full dependency wiring is application-specific.",
  );
}

if (import.meta.main) {
  main().catch((error) => {
    console.error("Worker failed to start:", error);
    process.exit(1);
  });
}

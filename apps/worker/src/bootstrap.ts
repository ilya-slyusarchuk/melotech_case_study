import Redis from "ioredis";
import { Worker } from "bullmq";
import { GenerationProcessor } from "./processor.js";
import { createGenerationWorker } from "./worker.js";

export type BootstrapOptions = {
  redisConnection: Redis;
  processor: GenerationProcessor;
};

export type BootstrapResult = {
  worker: Worker;
  redisConnection: Redis;
  shutdown: () => Promise<void>;
};

// Boots the worker without starting it. Callers can attach the worker to
// process jobs or test the bootstrap result without side effects.
export function bootstrap(options: BootstrapOptions): BootstrapResult {
  const { redisConnection, processor } = options;

  const worker = createGenerationWorker({
    redisConnection,
    processor,
  });

  async function shutdown(): Promise<void> {
    console.log("Worker shutting down gracefully...");
    await worker.close();
    await redisConnection.quit();
    console.log("Worker shutdown complete.");
  }

  return {
    worker,
    redisConnection,
    shutdown,
  };
}

// Starts the worker and registers signal handlers for graceful shutdown.
// This is the production entrypoint path.
export async function startWorker(
  options: BootstrapOptions,
): Promise<BootstrapResult> {
  const result = bootstrap(options);

  // Gracefully shutdown on termination signals.
  const handleShutdown = async (signal: string) => {
    console.log(`Received ${signal}. Shutting down...`);
    await result.shutdown();
    process.exit(0);
  };

  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));

  console.log("Generation worker started.");
  return result;
}

import { Worker, type Job } from "bullmq";
import Redis from "ioredis";
import {
  GENERATION_QUEUE_NAME,
  validateGenerationJobPayload,
  type GenerationJobPayload,
} from "@melotech/queue";
import { GenerationProcessor } from "./processor.js";

export type WorkerOptions = {
  redisConnection: Redis;
  processor: GenerationProcessor;
};

// Creates the job handler function that validates payload and delegates to the processor.
// Exported separately so it can be unit-tested without instantiating a BullMQ Worker.
export function createJobHandler(processor: GenerationProcessor) {
  return async (job: Job) => {
    // Validate each job payload before processing.
    const payload = validateGenerationJobPayload(
      job.data,
    ) as GenerationJobPayload;

    await processor.process(payload);
  };
}

// Creates a BullMQ worker that validates each job payload before delegating
// to the generation processor. Invalid payloads fail the job immediately.
export function createGenerationWorker(options: WorkerOptions): Worker {
  const { redisConnection, processor } = options;

  const handler = createJobHandler(processor);

  const worker = new Worker(GENERATION_QUEUE_NAME, handler, {
    connection: redisConnection,
  });

  worker.on("failed", (job, error) => {
    console.error(
      `Job ${job?.id ?? "unknown"} failed for generation ${job?.data?.generationRequestId ?? "unknown"}:`,
      error,
    );
  });

  return worker;
}

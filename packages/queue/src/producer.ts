import { Queue } from "bullmq";
import type { ConnectionOptions } from "bullmq";
import {
  GENERATION_JOB_NAME,
  GENERATION_QUEUE_NAME,
  type GenerationJobPayload,
} from "./contracts.js";

// Minimal abstraction around BullMQ so callers do not depend on BullMQ types.
// This makes testing easy: swap the implementation with a mock object.
export interface GenerationQueueProducer {
  enqueue(payload: GenerationJobPayload): Promise<{ jobId: string }>;
}

// Default queue options. Attempts are conservative because the generation
// processor already retries LLM calls internally. Failed jobs stay in Redis
// so they remain inspectable through the BullMQ dashboard or CLI.
export const DEFAULT_QUEUE_OPTIONS = {
  attempts: 2,
  backoff: {
    type: "fixed" as const,
    delay: 5000,
  },
  removeOnComplete: false,
  removeOnFail: false,
};

export class BullMqGenerationQueueProducer implements GenerationQueueProducer {
  private readonly queue: Queue;

  constructor(redisConnection: ConnectionOptions) {
    this.queue = new Queue(GENERATION_QUEUE_NAME, {
      connection: redisConnection,
    });
  }

  async enqueue(payload: GenerationJobPayload): Promise<{ jobId: string }> {
    const job = await this.queue.add(
      GENERATION_JOB_NAME,
      payload,
      DEFAULT_QUEUE_OPTIONS,
    );

    return { jobId: job.id ?? "unknown" };
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}

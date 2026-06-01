import { describe, expect, it, vi } from "vitest";
import { Job } from "bullmq";
import { createJobHandler, createGenerationWorker } from "./worker.js";
import { GenerationProcessor } from "./processor.js";

describe("generation worker job handler", () => {
  it("rejects invalid job payload", async () => {
    const mockProcessor = createMockProcessor();
    const handler = createJobHandler(mockProcessor);

    const invalidJob = { data: {} } as Job;

    await expect(handler(invalidJob)).rejects.toThrow();
    expect(mockProcessor.process).not.toHaveBeenCalled();
  });

  it("processes valid job payload", async () => {
    const mockProcessor = createMockProcessor();
    const handler = createJobHandler(mockProcessor);

    const validJob = {
      data: { generationRequestId: "req_123" },
    } as unknown as Job;

    await handler(validJob);

    expect(mockProcessor.process).toHaveBeenCalledWith({
      generationRequestId: "req_123",
    });
  });
});

describe("generation worker", () => {
  it("creates a BullMQ worker instance", () => {
    const mockRedis = createMockRedis();
    const mockProcessor = createMockProcessor();

    const worker = createGenerationWorker({
      redisConnection: mockRedis,
      processor: mockProcessor,
    });

    expect(worker).toBeDefined();
    expect(worker.name).toBe("generation");

    worker.close();
  });
});

function createMockRedis(): import("ioredis").default {
  return {
    options: { maxRetriesPerRequest: null },
  } as unknown as import("ioredis").default;
}

function createMockProcessor(): GenerationProcessor {
  return {
    process: vi.fn(async () => {}),
  } as unknown as GenerationProcessor;
}

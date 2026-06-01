import { describe, expect, it, vi } from "vitest";
import Redis from "ioredis";
import { Worker, Queue } from "bullmq";
import { bootstrap, startWorker } from "./bootstrap.js";
import { GenerationProcessor } from "./processor.js";

describe("worker bootstrap", () => {
  it("can be imported without starting processing", () => {
    // The bootstrap function returns a result object without side effects.
    // No Redis connection is opened and no worker starts consuming jobs.
    expect(typeof bootstrap).toBe("function");
    expect(typeof startWorker).toBe("function");
  });

  it("creates a worker instance with shutdown capability", async () => {
    const mockRedis = createMockRedis();
    const mockProcessor = createMockProcessor();

    const result = bootstrap({
      redisConnection: mockRedis,
      processor: mockProcessor,
    });

    expect(result.worker).toBeInstanceOf(Worker);
    expect(result.redisConnection).toBe(mockRedis);
    expect(typeof result.shutdown).toBe("function");

    await result.shutdown();

    expect(mockRedis.quit).toHaveBeenCalled();
  });
});

function createMockRedis(): Redis {
  return {
    quit: vi.fn(async () => {}),
  } as unknown as Redis;
}

function createMockProcessor(): GenerationProcessor {
  return {
    process: vi.fn(async () => {}),
  } as unknown as GenerationProcessor;
}

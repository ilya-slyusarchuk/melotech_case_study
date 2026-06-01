import { describe, expect, it } from "vitest";
import {
  GENERATION_JOB_NAME,
  GENERATION_QUEUE_NAME,
  generationJobPayloadSchema,
  validateGenerationJobPayload,
  DEFAULT_QUEUE_OPTIONS,
  BullMqGenerationQueueProducer,
  type GenerationQueueProducer,
} from "./index.js";

describe("queue contracts", () => {
  it("has a stable queue name", () => {
    expect(GENERATION_QUEUE_NAME).toBe("generation");
  });

  it("has a stable job name", () => {
    expect(GENERATION_JOB_NAME).toBe("generate-platform-outputs");
  });

  it("valid job payload passes", () => {
    const payload = { generationRequestId: "req_123" };
    expect(validateGenerationJobPayload(payload)).toEqual(payload);
  });

  it("missing generationRequestId fails validation", () => {
    expect(() => validateGenerationJobPayload({})).toThrow();
  });

  it("empty generationRequestId fails validation", () => {
    expect(() =>
      validateGenerationJobPayload({ generationRequestId: "" }),
    ).toThrow();
  });
});

describe("queue producer interface", () => {
  it("default queue options are conservative", () => {
    expect(DEFAULT_QUEUE_OPTIONS.attempts).toBe(2);
    expect(DEFAULT_QUEUE_OPTIONS.backoff.type).toBe("fixed");
    expect(DEFAULT_QUEUE_OPTIONS.backoff.delay).toBe(5000);
    expect(DEFAULT_QUEUE_OPTIONS.removeOnComplete).toBe(false);
    expect(DEFAULT_QUEUE_OPTIONS.removeOnFail).toBe(false);
  });

  it("producer adds job with correct name and payload", async () => {
    const producer = createMockProducer();

    await producer.enqueue({ generationRequestId: "req_456" });

    expect(producer.jobs).toHaveLength(1);
    expect(producer.jobs[0].name).toBe(GENERATION_JOB_NAME);
    expect(producer.jobs[0].payload).toEqual({
      generationRequestId: "req_456",
    });
  });

  it("producer returns a job id", async () => {
    const producer = createMockProducer();
    const result = await producer.enqueue({ generationRequestId: "req_789" });

    expect(result.jobId).toBe("mock-job-1");
  });

  it("api-facing code can use a mocked producer", async () => {
    // Simulate an API route that depends only on the interface.
    async function apiRoute(producer: GenerationQueueProducer) {
      return producer.enqueue({ generationRequestId: "req_api" });
    }

    const producer = createMockProducer();
    const result = await apiRoute(producer);

    expect(result.jobId).toBe("mock-job-1");
    expect(producer.jobs).toHaveLength(1);
  });
});

function createMockProducer(): GenerationQueueProducer & {
  jobs: { name: string; payload: unknown; options: unknown }[];
} {
  const jobs: { name: string; payload: unknown; options: unknown }[] = [];
  let sequence = 0;

  return {
    jobs,
    async enqueue(payload) {
      sequence += 1;
      jobs.push({
        name: GENERATION_JOB_NAME,
        payload,
        options: DEFAULT_QUEUE_OPTIONS,
      });
      return { jobId: `mock-job-${sequence}` };
    },
  };
}

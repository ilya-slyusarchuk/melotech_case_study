import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  REALTIME_VERSION,
  getGenerationChannelName,
  RedisEventPublisher,
  InMemoryEventPublisher,
  type PlatformUpdateEvent,
  type CreditsUpdateEvent,
  platformUpdateEventSchema,
  generationUpdateEventSchema,
  creditsUpdateEventSchema,
} from "./index.js";

describe("realtime smoke", () => {
  it("exports version", () => {
    expect(REALTIME_VERSION).toBe("1.0.0");
  });
});

describe("event contracts", () => {
  it("generates a channel name scoped to a generation", () => {
    expect(getGenerationChannelName("req_abc")).toBe("generation:req_abc");
  });

  describe("platform update event schema", () => {
    it("passes for a valid platform update event", () => {
      const event = {
        type: "platform_update" as const,
        generationRequestId: "req_1",
        platform: "spotify" as const,
        status: "completed" as const,
        source: "LLM" as const,
      };
      expect(() => platformUpdateEventSchema.parse(event)).not.toThrow();
    });

    it("passes without optional source", () => {
      const event = {
        type: "platform_update" as const,
        generationRequestId: "req_1",
        platform: "tiktok" as const,
        status: "processing" as const,
      };
      expect(() => platformUpdateEventSchema.parse(event)).not.toThrow();
    });

    it("fails for invalid platform", () => {
      const event = {
        type: "platform_update" as const,
        generationRequestId: "req_1",
        platform: "invalid_platform",
        status: "completed" as const,
      };
      expect(() => platformUpdateEventSchema.parse(event)).toThrow(z.ZodError);
    });

    it("fails for empty generationRequestId", () => {
      const event = {
        type: "platform_update" as const,
        generationRequestId: "",
        platform: "spotify" as const,
        status: "completed" as const,
      };
      expect(() => platformUpdateEventSchema.parse(event)).toThrow(z.ZodError);
    });
  });

  describe("generation update event schema", () => {
    it("passes for a valid generation update event", () => {
      const event = {
        type: "generation_update" as const,
        generationRequestId: "req_1",
        status: "completed" as const,
      };
      expect(() => generationUpdateEventSchema.parse(event)).not.toThrow();
    });

    it("fails for invalid status", () => {
      const event = {
        type: "generation_update" as const,
        generationRequestId: "req_1",
        status: "unknown",
      };
      expect(() => generationUpdateEventSchema.parse(event)).toThrow(
        z.ZodError,
      );
    });
  });

  describe("credits update event schema", () => {
    it("passes for a valid credits update event", () => {
      const event = {
        type: "credits_update" as const,
        generationRequestId: "req_1",
        availableCredits: 80,
        reservedCredits: 20,
      };
      expect(() => creditsUpdateEventSchema.parse(event)).not.toThrow();
    });

    it("fails for non-integer credits", () => {
      const event = {
        type: "credits_update" as const,
        generationRequestId: "req_1",
        availableCredits: 80.5,
        reservedCredits: 20,
      };
      expect(() => creditsUpdateEventSchema.parse(event)).toThrow(z.ZodError);
    });
  });
});

describe("in-memory event publisher", () => {
  it("records platform update events", async () => {
    const publisher = new InMemoryEventPublisher();
    const event: PlatformUpdateEvent = {
      type: "platform_update",
      generationRequestId: "req_1",
      platform: "spotify",
      status: "completed",
      source: "LLM",
    };

    await publisher.publishPlatformUpdate(event);

    expect(publisher.events).toHaveLength(1);
    expect(publisher.events[0]).toEqual(event);
  });

  it("records generation update events", async () => {
    const publisher = new InMemoryEventPublisher();
    await publisher.publishGenerationUpdate({
      type: "generation_update",
      generationRequestId: "req_1",
      status: "completed",
    });

    expect(publisher.events).toHaveLength(1);
    expect(publisher.events[0]).toMatchObject({
      type: "generation_update",
      status: "completed",
    });
  });

  it("records credits update events", async () => {
    const publisher = new InMemoryEventPublisher();
    const event: CreditsUpdateEvent = {
      type: "credits_update",
      generationRequestId: "req_1",
      availableCredits: 80,
      reservedCredits: 20,
    };

    await publisher.publishCreditsUpdate(event);

    expect(publisher.events).toHaveLength(1);
    expect(publisher.events[0]).toEqual(event);
  });

  it("rejects invalid platform update event", async () => {
    const publisher = new InMemoryEventPublisher();
    await expect(
      publisher.publishPlatformUpdate({
        type: "platform_update",
        generationRequestId: "",
        platform: "spotify",
        status: "completed",
      } as PlatformUpdateEvent),
    ).rejects.toBeInstanceOf(z.ZodError);
  });
});

describe("redis event publisher", () => {
  it("publishes json-serialized events to a generation-scoped channel", async () => {
    const published: Array<{ channel: string; message: string }> = [];
    const mockRedis = {
      async publish(channel: string, message: string) {
        published.push({ channel, message });
      },
    } as unknown as import("ioredis").default;

    const publisher = new RedisEventPublisher(mockRedis);
    await publisher.publishPlatformUpdate({
      type: "platform_update",
      generationRequestId: "req_1",
      platform: "tiktok",
      status: "processing",
    });

    expect(published).toHaveLength(1);
    expect(published[0].channel).toBe("generation:req_1");
    expect(JSON.parse(published[0].message)).toMatchObject({
      type: "platform_update",
      platform: "tiktok",
      status: "processing",
    });
  });

  it("rejects invalid event and does not publish", async () => {
    const published: Array<{ channel: string; message: string }> = [];
    const mockRedis = {
      async publish(channel: string, message: string) {
        published.push({ channel, message });
      },
    } as unknown as import("ioredis").default;

    const publisher = new RedisEventPublisher(mockRedis);
    await expect(
      publisher.publishGenerationUpdate({
        type: "generation_update",
        generationRequestId: "",
        status: "completed",
      } as GenerationUpdateEvent),
    ).rejects.toBeInstanceOf(z.ZodError);

    expect(published).toHaveLength(0);
  });
});

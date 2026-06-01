import { describe, expect, it } from "vitest";
import {
  REALTIME_VERSION,
  getGenerationChannelName,
  RedisEventPublisher,
  InMemoryEventPublisher,
  type PlatformUpdateEvent,
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
});

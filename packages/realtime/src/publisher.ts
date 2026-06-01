import Redis from "ioredis";
import type { PlatformUpdateEvent, GenerationUpdateEvent } from "./events.js";
import { getGenerationChannelName } from "./events.js";

// Minimal abstraction for event publishing so the processor can be tested
// with a mock publisher that records events in memory.
export interface EventPublisher {
  publishPlatformUpdate(event: PlatformUpdateEvent): Promise<void>;
  publishGenerationUpdate(event: GenerationUpdateEvent): Promise<void>;
}

// Redis pub/sub publisher. Events are serialized as JSON and published to
// a channel scoped to the generation request.
export class RedisEventPublisher implements EventPublisher {
  constructor(private readonly redis: Redis) {}

  async publishPlatformUpdate(event: PlatformUpdateEvent): Promise<void> {
    const channel = getGenerationChannelName(event.generationRequestId);
    await this.redis.publish(channel, JSON.stringify(event));
  }

  async publishGenerationUpdate(
    event: GenerationUpdateEvent,
  ): Promise<void> {
    const channel = getGenerationChannelName(event.generationRequestId);
    await this.redis.publish(channel, JSON.stringify(event));
  }
}

// In-memory publisher for unit tests.
export class InMemoryEventPublisher implements EventPublisher {
  public readonly events: Array<PlatformUpdateEvent | GenerationUpdateEvent> =
    [];

  async publishPlatformUpdate(event: PlatformUpdateEvent): Promise<void> {
    this.events.push(event);
  }

  async publishGenerationUpdate(event: GenerationUpdateEvent): Promise<void> {
    this.events.push(event);
  }
}

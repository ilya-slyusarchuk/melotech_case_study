import Redis from "ioredis";
import type {
  PlatformUpdateEvent,
  GenerationUpdateEvent,
  CreditsUpdateEvent,
} from "./events.js";
import {
  getGenerationChannelName,
  platformUpdateEventSchema,
  generationUpdateEventSchema,
  creditsUpdateEventSchema,
} from "./events.js";

// Minimal abstraction for event publishing so the processor can be tested
// with a mock publisher that records events in memory.
export interface EventPublisher {
  publishPlatformUpdate(event: PlatformUpdateEvent): Promise<void>;
  publishGenerationUpdate(event: GenerationUpdateEvent): Promise<void>;
  publishCreditsUpdate(event: CreditsUpdateEvent): Promise<void>;
}

// Validates an event before it is published. Rejects invalid payloads
// immediately so malformed events never reach Redis or the browser.
function validatePlatformUpdate(event: PlatformUpdateEvent): void {
  platformUpdateEventSchema.parse(event);
}

function validateGenerationUpdate(event: GenerationUpdateEvent): void {
  generationUpdateEventSchema.parse(event);
}

function validateCreditsUpdate(event: CreditsUpdateEvent): void {
  creditsUpdateEventSchema.parse(event);
}

// Redis pub/sub publisher. Events are serialized as JSON and published to
// a channel scoped to the generation request.
export class RedisEventPublisher implements EventPublisher {
  constructor(private readonly redis: Redis) {}

  async publishPlatformUpdate(event: PlatformUpdateEvent): Promise<void> {
    validatePlatformUpdate(event);
    const channel = getGenerationChannelName(event.generationRequestId);
    await this.redis.publish(channel, JSON.stringify(event));
  }

  async publishGenerationUpdate(event: GenerationUpdateEvent): Promise<void> {
    validateGenerationUpdate(event);
    const channel = getGenerationChannelName(event.generationRequestId);
    await this.redis.publish(channel, JSON.stringify(event));
  }

  async publishCreditsUpdate(event: CreditsUpdateEvent): Promise<void> {
    validateCreditsUpdate(event);
    const channel = getGenerationChannelName(event.generationRequestId);
    await this.redis.publish(channel, JSON.stringify(event));
  }
}

// In-memory publisher for unit tests.
export class InMemoryEventPublisher implements EventPublisher {
  public readonly events: Array<
    PlatformUpdateEvent | GenerationUpdateEvent | CreditsUpdateEvent
  > = [];

  async publishPlatformUpdate(event: PlatformUpdateEvent): Promise<void> {
    validatePlatformUpdate(event);
    this.events.push(event);
  }

  async publishGenerationUpdate(event: GenerationUpdateEvent): Promise<void> {
    validateGenerationUpdate(event);
    this.events.push(event);
  }

  async publishCreditsUpdate(event: CreditsUpdateEvent): Promise<void> {
    validateCreditsUpdate(event);
    this.events.push(event);
  }
}

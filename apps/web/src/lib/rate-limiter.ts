import type Redis from "ioredis";

export class RateLimitExceededError extends Error {
  readonly statusCode = 429;

  constructor() {
    super("Rate limit exceeded. Please try again later.");
    this.name = "RateLimitExceededError";
  }
}

export type RateLimiterConfig = {
  redis: Redis;
  windowSeconds: number;
  maxRequests: number;
  keyPrefix: string;
};

/**
 * Fixed-window rate limiter backed by Redis.
 *
 * Each user gets a counter keyed by their user id. The counter increments on
 * every check and expires after the window. When the counter exceeds the
 * allowed maximum, requests are rejected until the window resets.
 */
export class RedisRateLimiter {
  private readonly redis: Redis;
  private readonly windowSeconds: number;
  private readonly maxRequests: number;
  private readonly keyPrefix: string;

  constructor(config: RateLimiterConfig) {
    this.redis = config.redis;
    this.windowSeconds = config.windowSeconds;
    this.maxRequests = config.maxRequests;
    this.keyPrefix = config.keyPrefix;
  }

  /**
   * Checks whether the given user id has remaining quota.
   *
   * Returns silently when allowed. Throws RateLimitExceededError when the
   * user has hit the limit.
   */
  async check(userId: string): Promise<void> {
    const key = this.buildKey(userId);
    const current = await this.redis.incr(key);

    if (current === 1) {
      // First request in this window. Set the expiration so the counter
      // automatically resets after the window passes.
      await this.redis.expire(key, this.windowSeconds);
    }

    if (current > this.maxRequests) {
      throw new RateLimitExceededError();
    }
  }

  private buildKey(userId: string): string {
    return `${this.keyPrefix}:${userId}`;
  }
}

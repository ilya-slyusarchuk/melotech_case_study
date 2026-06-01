import { describe, expect, it } from "vitest";
import { RateLimitExceededError, RedisRateLimiter } from "./rate-limiter";

// Lightweight in-memory Redis mock that supports incr and expire.
class MockRedis {
  private store = new Map<string, { value: number; expiresAt: number }>();

  async incr(key: string): Promise<number> {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing || existing.expiresAt <= now) {
      this.store.set(key, { value: 1, expiresAt: Infinity });
      return 1;
    }

    existing.value += 1;
    return existing.value;
  }

  async expire(key: string, seconds: number): Promise<void> {
    const existing = this.store.get(key);
    if (existing) {
      existing.expiresAt = Date.now() + seconds * 1000;
    }
  }
}

type LimiterConfig = ConstructorParameters<typeof RedisRateLimiter>[0];

describe("RedisRateLimiter", () => {
  it("allows requests up to the limit", async () => {
    const redis = new MockRedis() as unknown as LimiterConfig["redis"];
    const limiter = new RedisRateLimiter({
      redis,
      windowSeconds: 60,
      maxRequests: 3,
      keyPrefix: "test",
    });

    await expect(limiter.check("user_a")).resolves.not.toThrow();
    await expect(limiter.check("user_a")).resolves.not.toThrow();
    await expect(limiter.check("user_a")).resolves.not.toThrow();
  });

  it("rejects requests beyond the limit", async () => {
    const redis = new MockRedis() as unknown as LimiterConfig["redis"];
    const limiter = new RedisRateLimiter({
      redis,
      windowSeconds: 60,
      maxRequests: 3,
      keyPrefix: "test",
    });

    await limiter.check("user_a");
    await limiter.check("user_a");
    await limiter.check("user_a");

    await expect(limiter.check("user_a")).rejects.toBeInstanceOf(
      RateLimitExceededError,
    );
  });

  it("does not share limits between users", async () => {
    const redis = new MockRedis() as unknown as LimiterConfig["redis"];
    const limiter = new RedisRateLimiter({
      redis,
      windowSeconds: 60,
      maxRequests: 3,
      keyPrefix: "test",
    });

    await limiter.check("user_a");
    await limiter.check("user_a");
    await limiter.check("user_a");

    // user_b should still be allowed even though user_a is at the limit.
    await expect(limiter.check("user_b")).resolves.not.toThrow();
  });

  it("allows requests again after the window expires", async () => {
    const redis = new MockRedis() as unknown as LimiterConfig["redis"];
    const limiter = new RedisRateLimiter({
      redis,
      windowSeconds: 60,
      maxRequests: 3,
      keyPrefix: "test",
    });

    await limiter.check("user_a");
    await limiter.check("user_a");
    await limiter.check("user_a");

    // Manually expire the key by backdating its expiration.
    const store = (redis as unknown as MockRedis)["store"] as Map<
      string,
      { value: number; expiresAt: number }
    >;
    const entry = store.get("test:user_a");
    if (entry) {
      entry.expiresAt = Date.now() - 1000;
    }

    await expect(limiter.check("user_a")).resolves.not.toThrow();
  });
});

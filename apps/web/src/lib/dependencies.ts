import Redis from "ioredis";
import { getWebConfig } from "@melotech/config";
import { prisma } from "@melotech/db";
import { CreditService, PrismaCreditStore } from "@melotech/billing";
import { BullMqGenerationQueueProducer } from "@melotech/queue";
import { GenerationRequestRepository } from "@melotech/db";
import { RedisRateLimiter } from "./rate-limiter";

type QueueRedisConnectionOptions = ConstructorParameters<
  typeof BullMqGenerationQueueProducer
>[0];

let _config: ReturnType<typeof getWebConfig> | null = null;

function getConfig() {
  if (!_config) {
    _config = getWebConfig();
  }
  return _config;
}

let _redis: Redis | null = null;

function getRedis(): Redis {
  if (!_redis) {
    const config = getConfig();
    _redis = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  }
  return _redis;
}

// Per-user rate limiter for generation creation.
// Limits each user to 3 generation requests per minute.
export function getGenerationRateLimiter(): RedisRateLimiter {
  return new RedisRateLimiter({
    redis: getRedis(),
    windowSeconds: 60,
    maxRequests: 3,
    keyPrefix: "rate_limit:generation",
  });
}

// BullMQ queue producer for enqueueing generation jobs.
export function getQueueProducer(): BullMqGenerationQueueProducer {
  const config = getConfig();
  return new BullMqGenerationQueueProducer(
    buildBullMqRedisConnectionOptions(config.REDIS_URL),
  );
}

export function buildBullMqRedisConnectionOptions(
  redisUrl: string,
): QueueRedisConnectionOptions {
  const url = new URL(redisUrl);
  const db = url.pathname.slice(1);

  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    db: db ? Number(db) : undefined,
  };
}

// Database repositories used by API routes.
export function getGenerationRepository(): GenerationRequestRepository {
  return new GenerationRequestRepository(prisma);
}

// Credit service backed by the Prisma credit store.
export function getCreditService(): CreditService {
  return new CreditService(new PrismaCreditStore(prisma));
}

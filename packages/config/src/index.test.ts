import { describe, it, expect } from "vitest";
import {
  CONFIG_VERSION,
  getPlatformCreditEnvName,
  parseSharedConfig,
  parseWebConfig,
  parseWorkerConfig,
} from "./index.js";
import { SUPPORTED_PLATFORMS } from "@melotech/shared";

describe("config smoke", () => {
  it("exports version", () => {
    expect(CONFIG_VERSION).toBe("1.0.0");
  });
});

const validSharedEnv = () => ({
  DATABASE_URL: "postgresql://user:password@localhost:5432/melotech",
  REDIS_URL: "redis://localhost:6379",
  APP_ENV: "test",
  AI_PROVIDER: "ollama",
  AI_MODEL: "llama3.1",
  AI_BASE_URL: "https://ollama.example.com",
  AI_API_KEY: "ai-secret",
  EMBEDDING_PROVIDER: "openai",
  EMBEDDING_MODEL: "text-embedding-3-small",
  EMBEDDING_BASE_URL: "https://api.openai.com",
  EMBEDDING_API_KEY: "embedding-secret",
  GENERATION_RETRY_LIMIT: "3",
  LLM_REPAIR_RETRY_LIMIT: "2",
  SIMILARITY_THRESHOLD: "0.82",
  ...Object.fromEntries(
    SUPPORTED_PLATFORMS.map((platform, index) => [
      getPlatformCreditEnvName(platform),
      String(index + 2),
    ]),
  ),
});

const validWebEnv = () => ({
  ...validSharedEnv(),
  BETTER_AUTH_URL: "https://app.example.com/api/auth",
  BETTER_AUTH_SECRET: "auth-secret",
  PUBLIC_APP_URL: "https://app.example.com",
  NEXT_PUBLIC_APP_ENV: "test",
});

describe("shared config parser", () => {
  it("parses a valid shared env", () => {
    const config = parseSharedConfig(validSharedEnv());
    const firstPlatform = SUPPORTED_PLATFORMS[0];

    expect(config.DATABASE_URL).toBe(
      "postgresql://user:password@localhost:5432/melotech",
    );
    expect(config.platformCredits[firstPlatform]).toBe(2);
  });

  it("fails when required env values are missing", () => {
    const env: Record<string, unknown> = validSharedEnv();
    delete env.DATABASE_URL;

    expect(() => parseSharedConfig(env)).toThrow();
  });

  it("coerces numeric env values from strings", () => {
    const config = parseSharedConfig(validSharedEnv());

    expect(config.GENERATION_RETRY_LIMIT).toBe(3);
    expect(config.LLM_REPAIR_RETRY_LIMIT).toBe(2);
    expect(config.SIMILARITY_THRESHOLD).toBe(0.82);
  });

  it("fails for invalid URLs", () => {
    expect(() =>
      parseSharedConfig({
        ...validSharedEnv(),
        REDIS_URL: "not-a-url",
      }),
    ).toThrow();
  });

  it("requires platform credit settings for every supported platform", () => {
    const config = parseSharedConfig(validSharedEnv());

    for (const platform of SUPPORTED_PLATFORMS) {
      expect(config.platformCredits[platform]).toBeGreaterThan(0);
      expect(getPlatformCreditEnvName(platform)).toContain(
        platform.toUpperCase(),
      );
    }
  });
});

describe("runtime-specific config parsers", () => {
  it("does not require Better Auth variables for worker config", () => {
    expect(() => parseWorkerConfig(validSharedEnv())).not.toThrow();
  });

  it("requires Better Auth variables for web config", () => {
    expect(() => parseWebConfig(validSharedEnv())).toThrow();
    expect(parseWebConfig(validWebEnv()).web.BETTER_AUTH_SECRET).toBe(
      "auth-secret",
    );
  });
});

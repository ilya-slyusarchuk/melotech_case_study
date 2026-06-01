import { z } from "zod";
import { SUPPORTED_PLATFORMS, type Platform } from "@melotech/shared";

const appEnvironmentSchema = z.enum(["development", "test", "production"]);

const providerNameSchema = z.string().trim().min(1).max(60);
const modelNameSchema = z.string().trim().min(1).max(120);
const secretSchema = z.string().trim().min(1);

const numericEnvSchema = z.coerce.number();

const sharedEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  APP_ENV: appEnvironmentSchema,
  AI_PROVIDER: providerNameSchema,
  AI_MODEL: modelNameSchema,
  AI_BASE_URL: z.string().url(),
  AI_API_KEY: secretSchema,
  EMBEDDING_PROVIDER: providerNameSchema,
  EMBEDDING_MODEL: modelNameSchema,
  EMBEDDING_BASE_URL: z.string().url(),
  EMBEDDING_API_KEY: secretSchema,
  GENERATION_RETRY_LIMIT: numericEnvSchema.int().min(0).max(10),
  LLM_REPAIR_RETRY_LIMIT: numericEnvSchema.int().min(0).max(10),
  SIMILARITY_THRESHOLD: numericEnvSchema.min(0).max(1),
});

export type SharedConfig = z.infer<typeof sharedEnvSchema> & {
  platformCredits: Record<Platform, number>;
};

export const getPlatformCreditEnvName = (platform: Platform) =>
  `PLATFORM_CREDIT_COST_${platform.toUpperCase()}` as const;

const parsePlatformCredits = (env: Record<string, unknown>) => {
  const entries = SUPPORTED_PLATFORMS.map((platform) => {
    const envName = getPlatformCreditEnvName(platform);

    // Credit costs are env-driven, but the platform keys come from shared.
    // This keeps future platform additions centered on one source of truth.
    const creditCost = numericEnvSchema.int().positive().parse(env[envName]);

    return [platform, creditCost] as const;
  });

  return Object.fromEntries(entries) as Record<Platform, number>;
};

export const parseSharedConfig = (
  env: Record<string, unknown>,
): SharedConfig => ({
  ...sharedEnvSchema.parse(env),
  platformCredits: parsePlatformCredits(env),
});

export const getSharedConfig = () => parseSharedConfig(process.env);

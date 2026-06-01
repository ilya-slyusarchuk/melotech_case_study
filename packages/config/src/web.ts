import { z } from "zod";
import { parseSharedConfig, type SharedConfig } from "./shared.js";

const webEnvSchema = z.object({
  BETTER_AUTH_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().trim().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_ENV: z.enum(["development", "test", "production"]),
});

export type WebConfig = SharedConfig & {
  web: z.infer<typeof webEnvSchema>;
};

export const parseWebConfig = (env: Record<string, unknown>): WebConfig => ({
  ...parseSharedConfig(env),
  web: webEnvSchema.parse(env),
});

export const getWebConfig = () => parseWebConfig(process.env);

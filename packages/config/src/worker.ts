import { parseSharedConfig, type SharedConfig } from "./shared.js";

export type WorkerConfig = SharedConfig;

export const parseWorkerConfig = (
  env: Record<string, unknown>,
): WorkerConfig => parseSharedConfig(env);

export const getWorkerConfig = () => parseWorkerConfig(process.env);

// AI adapter contracts and providers.
// All LLM interactions go through this package.

export * from "./adapter.js";
export * from "./errors.js";
export * from "./json-extraction.js";
export * from "./ollama-provider.js";
export * from "./platform-generator.js";
export * from "./platform-generator-registry.js";
export * from "./platform-generator-support.js";
export * from "./spotify-generator.js";
export * from "./tiktok-generator.js";
export * from "./platform-output-schemas.js";
export * from "./structured-output-service.js";
export * from "./youtube-generator.js";

export const AI_VERSION = "1.0.0";

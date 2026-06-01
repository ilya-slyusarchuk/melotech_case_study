// Embedding adapter contracts and providers.
// All embedding generation goes through this package.

export * from "./adapter.js";
export * from "./cosine-similarity.js";
export * from "./errors.js";
export * from "./openai-embedding-provider.js";
export * from "./similar-result-service.js";

export const EMBEDDINGS_VERSION = "1.0.0";

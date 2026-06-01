import OpenAI from "openai";
import type { EmbeddingAdapter } from "./adapter.js";
import { EmbeddingProviderError } from "./errors.js";

export const DEFAULT_OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";

type OpenAIEmbeddingClient = {
  embeddings: {
    create(input: {
      model: string;
      input: string;
      encoding_format: "float";
    }): Promise<{
      data?: Array<{ embedding?: unknown }>;
    }>;
  };
};

export type OpenAIEmbeddingProviderOptions = {
  apiKey: string;
  model?: string;
  baseURL?: string;
  client?: OpenAIEmbeddingClient;
};

export class OpenAIEmbeddingProvider implements EmbeddingAdapter {
  private readonly client: OpenAIEmbeddingClient;
  private readonly model: string;

  constructor(options: OpenAIEmbeddingProviderOptions) {
    this.model = options.model?.trim() || DEFAULT_OPENAI_EMBEDDING_MODEL;
    this.client =
      options.client ??
      new OpenAI({
        apiKey: options.apiKey,
        baseURL: options.baseURL,
        maxRetries: 0,
      });
  }

  async embedText(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: text,
        encoding_format: "float",
      });
      const embedding = response.data?.[0]?.embedding;

      if (!isNumericVector(embedding)) {
        throw new EmbeddingProviderError({
          reason: "malformed_embedding_response",
        });
      }

      return embedding;
    } catch (error) {
      if (error instanceof EmbeddingProviderError) {
        throw error;
      }

      throw new EmbeddingProviderError(
        { reason: "provider_request_failed" },
        error,
      );
    }
  }
}

export function createOpenAIEmbeddingProviderFromEnv(
  env: Record<string, string | undefined> = process.env,
) {
  const apiKey = env.EMBEDDING_API_KEY?.trim();

  if (!apiKey) {
    throw new EmbeddingProviderError({ reason: "missing_api_key" });
  }

  return new OpenAIEmbeddingProvider({
    apiKey,
    model: env.EMBEDDING_MODEL,
    baseURL: env.EMBEDDING_BASE_URL,
  });
}

function isNumericVector(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "number" && Number.isFinite(item))
  );
}

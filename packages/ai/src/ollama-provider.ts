import OpenAI from "openai";
import type { AIAdapter, AIGenerateTextInput } from "./adapter.js";
import { AIProviderError } from "./errors.js";

export const OLLAMA_BASE_URL_ENV = "OLLAMA_BASE_URL";
export const OLLAMA_API_KEY_ENV = "OLLAMA_API_KEY";
export const OLLAMA_MODEL_ENV = "OLLAMA_MODEL";

// Every provider adapter should expose the same env categories.
// Base URL, API key, and model must all be validated before use.
export type OllamaProviderConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  fetchImplementation?: typeof fetch;
};

export class OllamaProvider implements AIAdapter {
  private readonly client: OpenAI;

  constructor(private readonly config: OllamaProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: normalizeOpenAICompatibleBaseUrl(config.baseUrl),
      fetch: config.fetchImplementation,
      // Retries are owned by StructuredOutputService.
      // Disabling SDK retries keeps attempt counts deterministic in tests.
      maxRetries: 0,
    });
  }

  async generateText(input: AIGenerateTextInput): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: "system", content: input.systemPrompt },
          { role: "user", content: input.userPrompt },
        ],
        temperature: input.temperature,
      });

      const content = completion.choices[0]?.message.content;

      if (typeof content !== "string") {
        throw new AIProviderError({
          provider: "ollama",
          reason: "malformed_response",
        });
      }

      return content;
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }

      throw new AIProviderError(
        { provider: "ollama", reason: "request_failed" },
        error,
      );
    }
  }
}

export function createOllamaProviderFromEnv(
  env: Record<string, string | undefined> = process.env,
): OllamaProvider {
  return new OllamaProvider({
    baseUrl: readRequiredEnv(env, OLLAMA_BASE_URL_ENV),
    apiKey: readRequiredEnv(env, OLLAMA_API_KEY_ENV),
    model: readRequiredEnv(env, OLLAMA_MODEL_ENV),
  });
}

function readRequiredEnv(
  env: Record<string, string | undefined>,
  key: string,
): string {
  const value = env[key]?.trim();

  if (!value) {
    throw new AIProviderError({
      provider: "ollama",
      reason: "missing_required_env",
      envName: key,
    });
  }

  return value;
}

function normalizeOpenAICompatibleBaseUrl(baseUrl: string): string {
  const trimmedBaseUrl = baseUrl.replace(/\/$/, "");

  if (trimmedBaseUrl.endsWith("/v1")) {
    return trimmedBaseUrl;
  }

  // Older Ollama API examples use "/api". The OpenAI SDK needs the
  // OpenAI-compatible root because it appends "/chat/completions" itself.
  if (trimmedBaseUrl.endsWith("/api")) {
    return `${trimmedBaseUrl.slice(0, -"/api".length)}/v1`;
  }

  return `${trimmedBaseUrl}/v1`;
}

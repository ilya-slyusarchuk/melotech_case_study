import { describe, expect, it } from "vitest";
import {
  DEFAULT_OPENAI_EMBEDDING_MODEL,
  OpenAIEmbeddingProvider,
  createOpenAIEmbeddingProviderFromEnv,
} from "./openai-embedding-provider.js";
import { EmbeddingProviderError } from "./errors.js";

type EmbeddingCreateArgs = {
  model: string;
  input: string;
  encoding_format: "float";
};

describe("OpenAIEmbeddingProvider", () => {
  it("sends input and model to OpenAI embeddings", async () => {
    const client = createClient({ data: [{ embedding: [0.1, 0.2] }] });
    const provider = new OpenAIEmbeddingProvider({
      apiKey: "secret",
      model: "custom-embedding-model",
      client,
    });

    await provider.embedText("Create a Brazilian funk launch.");

    expect(client.lastCreateArgs).toEqual({
      model: "custom-embedding-model",
      input: "Create a Brazilian funk launch.",
      encoding_format: "float",
    });
  });

  it("uses text-embedding-3-small by default", async () => {
    const client = createClient({ data: [{ embedding: [0.1, 0.2] }] });
    const provider = new OpenAIEmbeddingProvider({
      apiKey: "secret",
      client,
    });

    await provider.embedText("Create a regional pop launch.");

    expect(client.lastCreateArgs?.model).toBe(DEFAULT_OPENAI_EMBEDDING_MODEL);
  });

  it("returns only the numeric vector", async () => {
    const provider = new OpenAIEmbeddingProvider({
      apiKey: "secret",
      client: createClient({ data: [{ embedding: [0.1, 0.2, 0.3] }] }),
    });

    await expect(provider.embedText("Embed this.")).resolves.toEqual([
      0.1, 0.2, 0.3,
    ]);
  });

  it("wraps API failures in a safe provider error", async () => {
    const provider = new OpenAIEmbeddingProvider({
      apiKey: "secret",
      client: createClient(new Error("upstream failure")),
    });

    await expect(provider.embedText("Embed this.")).rejects.toThrow(
      EmbeddingProviderError,
    );
  });

  it("wraps malformed responses in a safe provider error", async () => {
    const provider = new OpenAIEmbeddingProvider({
      apiKey: "secret",
      client: createClient({ data: [{ embedding: ["not-a-number"] }] }),
    });

    await expect(provider.embedText("Embed this.")).rejects.toMatchObject({
      metadata: { reason: "malformed_embedding_response" },
    });
  });

  it("does not expose API keys in error output", async () => {
    const secret = "sk_test_embedding_secret";
    const provider = new OpenAIEmbeddingProvider({
      apiKey: secret,
      client: createClient(new Error(`failed with ${secret}`)),
    });

    try {
      await provider.embedText("Embed this.");
      throw new Error("Expected provider to throw.");
    } catch (error) {
      expect(error).toBeInstanceOf(EmbeddingProviderError);
      expect((error as Error).message).not.toContain(secret);
      expect(
        JSON.stringify((error as EmbeddingProviderError).metadata),
      ).not.toContain(secret);
    }
  });

  it("creates provider from env and lets env override the model", async () => {
    const provider = createOpenAIEmbeddingProviderFromEnv({
      EMBEDDING_API_KEY: "secret",
      EMBEDDING_MODEL: "text-embedding-3-large",
    });

    expect(provider).toBeInstanceOf(OpenAIEmbeddingProvider);
  });
});

function createClient(response: unknown) {
  const client = {
    lastCreateArgs: null as EmbeddingCreateArgs | null,
    embeddings: {
      create: async (args: EmbeddingCreateArgs) => {
        client.lastCreateArgs = args;

        if (response instanceof Error) {
          throw response;
        }

        return response;
      },
    },
  };

  return client;
}

import { describe, expect, it } from "vitest";
import {
  AIProviderError,
  OllamaProvider,
  createOllamaProviderFromEnv,
} from "./index.js";

describe("OllamaProvider", () => {
  it("sends model, prompts, temperature, and server-side auth", async () => {
    const calls: RequestInit[] = [];
    const urls: string[] = [];
    const provider = new OllamaProvider({
      baseUrl: "https://ollama.com",
      apiKey: "secret-key",
      model: "gpt-oss:120b",
      fetchImplementation: async (url, init) => {
        urls.push(String(url));
        calls.push(init ?? {});
        return jsonResponse(chatCompletion("raw text"));
      },
    });

    await provider.generateText({
      systemPrompt: "System rules.",
      userPrompt: "User request.",
      temperature: 0.3,
    });

    const body = JSON.parse(String(calls[0].body));

    expect(urls[0]).toBe("https://ollama.com/v1/chat/completions");
    expect(new Headers(calls[0].headers).get("authorization")).toBe(
      "Bearer secret-key",
    );
    expect(body).toMatchObject({
      model: "gpt-oss:120b",
      temperature: 0.3,
    });
    expect(body.messages).toEqual([
      { role: "system", content: "System rules." },
      { role: "user", content: "User request." },
    ]);
  });

  it("also accepts base URLs with the old api suffix", async () => {
    let requestedUrl = "";
    const provider = new OllamaProvider({
      baseUrl: "http://localhost:11434/api",
      apiKey: "local-key",
      model: "llama3.2",
      fetchImplementation: async (url) => {
        requestedUrl = String(url);
        return jsonResponse(chatCompletion("raw text"));
      },
    });

    await provider.generateText({
      systemPrompt: "System rules.",
      userPrompt: "User request.",
      temperature: 0.3,
    });

    expect(requestedUrl).toBe("http://localhost:11434/v1/chat/completions");
  });

  it("fails fast when the required model env variable is missing", () => {
    expect(() =>
      createOllamaProviderFromEnv({
        OLLAMA_BASE_URL: "https://ollama.com/api",
        OLLAMA_API_KEY: "secret-key",
      }),
    ).toThrow(AIProviderError);
  });

  it("returns raw text content", async () => {
    const provider = new OllamaProvider({
      baseUrl: "https://ollama.com/api",
      apiKey: "secret-key",
      model: "gpt-oss:120b",
      fetchImplementation: async () =>
        jsonResponse(chatCompletion('{"title":"Raw"}')),
    });

    await expect(
      provider.generateText({
        systemPrompt: "System rules.",
        userPrompt: "User request.",
        temperature: 0.3,
      }),
    ).resolves.toBe('{"title":"Raw"}');
  });

  it("wraps non-success responses in a safe provider error", async () => {
    const provider = new OllamaProvider({
      baseUrl: "https://ollama.com/api",
      apiKey: "secret-key",
      model: "gpt-oss:120b",
      fetchImplementation: async () =>
        jsonResponse(
          { error: { message: "secret-key leaked by provider" } },
          500,
        ),
    });

    await expect(
      provider.generateText({
        systemPrompt: "System rules.",
        userPrompt: "User request.",
        temperature: 0.3,
      }),
    ).rejects.toThrow("The AI provider could not complete the request.");
  });

  it("wraps malformed provider responses in a safe provider error", async () => {
    const provider = new OllamaProvider({
      baseUrl: "https://ollama.com/api",
      apiKey: "secret-key",
      model: "gpt-oss:120b",
      fetchImplementation: async () =>
        jsonResponse({
          id: "chatcmpl-test",
          object: "chat.completion",
          created: 1,
          model: "gpt-oss:120b",
          choices: [],
        }),
    });

    await expect(
      provider.generateText({
        systemPrompt: "System rules.",
        userPrompt: "User request.",
        temperature: 0.3,
      }),
    ).rejects.toThrow(AIProviderError);
  });

  it("does not include API keys in thrown error messages", async () => {
    const provider = new OllamaProvider({
      baseUrl: "https://ollama.com/api",
      apiKey: "secret-key",
      model: "gpt-oss:120b",
      fetchImplementation: async () => {
        throw new Error("network failed with secret-key");
      },
    });

    try {
      await provider.generateText({
        systemPrompt: "System rules.",
        userPrompt: "User request.",
        temperature: 0.3,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(AIProviderError);
      expect((error as Error).message).not.toContain("secret-key");
    }
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function chatCompletion(content: string) {
  return {
    id: "chatcmpl-test",
    object: "chat.completion",
    created: 1,
    model: "gpt-oss:120b",
    choices: [
      {
        index: 0,
        finish_reason: "stop",
        message: {
          role: "assistant",
          content,
        },
      },
    ],
  };
}

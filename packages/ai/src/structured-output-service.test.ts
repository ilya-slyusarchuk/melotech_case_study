import { describe, expect, it } from "vitest";
import type { AIAdapter, AIGenerateTextInput } from "./adapter.js";
import { AIProviderError, StructuredOutputError } from "./errors.js";
import { spotifyOutputSchema } from "./platform-output-schemas.js";
import { StructuredOutputService } from "./structured-output-service.js";

class SequenceAdapter implements AIAdapter {
  public readonly calls: AIGenerateTextInput[] = [];

  constructor(private readonly results: Array<string | Error>) {}

  async generateText(input: AIGenerateTextInput): Promise<string> {
    this.calls.push(input);
    const nextResult = this.results.shift();

    if (nextResult instanceof Error) {
      throw nextResult;
    }

    if (typeof nextResult === "string") {
      return nextResult;
    }

    throw new AIProviderError({ reason: "missing_test_result" });
  }
}

describe("StructuredOutputService", () => {
  it("succeeds with valid output on the first attempt", async () => {
    const adapter = new SequenceAdapter([validSpotifyJson()]);
    const service = new StructuredOutputService(adapter);

    const output = await service.generate({
      schema: spotifyOutputSchema,
      systemPrompt: "Return Spotify JSON.",
      userPrompt: "Create metadata.",
      temperature: 0.2,
      maxProviderRetries: 0,
      maxRepairs: 0,
    });

    expect(output.title).toBe("Midnight Drive");
    expect(adapter.calls).toHaveLength(1);
  });

  it("retries provider errors and eventually succeeds", async () => {
    const adapter = new SequenceAdapter([
      new AIProviderError({ reason: "timeout" }),
      validSpotifyJson(),
    ]);
    const service = new StructuredOutputService(adapter);

    const output = await service.generate({
      schema: spotifyOutputSchema,
      systemPrompt: "Return Spotify JSON.",
      userPrompt: "Create metadata.",
      temperature: 0.2,
      maxProviderRetries: 1,
      maxRepairs: 0,
    });

    expect(output.bpm).toBe(118);
    expect(adapter.calls).toHaveLength(2);
  });

  it("stops provider retries after the configured max", async () => {
    const adapter = new SequenceAdapter([
      new AIProviderError({ reason: "first" }),
      new AIProviderError({ reason: "second" }),
    ]);
    const service = new StructuredOutputService(adapter);

    await expect(
      service.generate({
        schema: spotifyOutputSchema,
        systemPrompt: "Return Spotify JSON.",
        userPrompt: "Create metadata.",
        temperature: 0.2,
        maxProviderRetries: 1,
        maxRepairs: 0,
      }),
    ).rejects.toThrow(StructuredOutputError);
    expect(adapter.calls).toHaveLength(2);
  });

  it("repairs invalid schema output", async () => {
    const invalidResponse = JSON.stringify({
      title: "Midnight Drive",
      genre: "Synth pop",
      mood: "Confident",
      bpm: "118",
      instruments: ["synth"],
      description: "A polished late-night pop track.",
    });
    const adapter = new SequenceAdapter([invalidResponse, validSpotifyJson()]);
    const service = new StructuredOutputService(adapter);

    const output = await service.generate({
      schema: spotifyOutputSchema,
      systemPrompt: "Return Spotify JSON.",
      userPrompt: "Create metadata.",
      temperature: 0.2,
      maxProviderRetries: 0,
      maxRepairs: 1,
    });

    expect(output.bpm).toBe(118);
    expect(adapter.calls[1].userPrompt).toContain("Create metadata.");
    expect(adapter.calls[1].userPrompt).toContain(invalidResponse);
    expect(adapter.calls[1].userPrompt).toContain("Validation errors:");
  });

  it("returns valid output from a successful repair", async () => {
    const adapter = new SequenceAdapter([
      '{"title":"Midnight Drive"}',
      validSpotifyJson(),
    ]);
    const service = new StructuredOutputService(adapter);

    const output = await service.generate({
      schema: spotifyOutputSchema,
      systemPrompt: "Return Spotify JSON.",
      userPrompt: "Create metadata.",
      temperature: 0.2,
      maxProviderRetries: 0,
      maxRepairs: 1,
    });

    expect(output.instruments).toEqual(["synth", "drums"]);
  });

  it("retries provider errors during repair", async () => {
    const adapter = new SequenceAdapter([
      '{"title":"Midnight Drive"}',
      new AIProviderError({ reason: "repair_timeout" }),
      validSpotifyJson(),
    ]);
    const service = new StructuredOutputService(adapter);

    const output = await service.generate({
      schema: spotifyOutputSchema,
      systemPrompt: "Return Spotify JSON.",
      userPrompt: "Create metadata.",
      temperature: 0.2,
      maxProviderRetries: 1,
      maxRepairs: 1,
    });

    expect(output.title).toBe("Midnight Drive");
    expect(adapter.calls).toHaveLength(3);
  });

  it("stops repair after the configured max", async () => {
    const adapter = new SequenceAdapter([
      '{"title":"Only title"}',
      '{"title":"Still invalid"}',
    ]);
    const service = new StructuredOutputService(adapter);

    await expect(
      service.generate({
        schema: spotifyOutputSchema,
        systemPrompt: "Return Spotify JSON.",
        userPrompt: "Create metadata.",
        temperature: 0.2,
        maxProviderRetries: 0,
        maxRepairs: 1,
      }),
    ).rejects.toThrow(StructuredOutputError);
    expect(adapter.calls).toHaveLength(2);
  });

  it("never returns unvalidated output", async () => {
    const adapter = new SequenceAdapter(['{"title":"Only title"}']);
    const service = new StructuredOutputService(adapter);

    await expect(
      service.generate({
        schema: spotifyOutputSchema,
        systemPrompt: "Return Spotify JSON.",
        userPrompt: "Create metadata.",
        temperature: 0.2,
        maxProviderRetries: 0,
        maxRepairs: 0,
      }),
    ).rejects.toThrow(StructuredOutputError);
  });
});

function validSpotifyJson(): string {
  return JSON.stringify({
    title: "Midnight Drive",
    genre: "Synth pop",
    mood: "Confident",
    bpm: 118,
    instruments: ["synth", "drums"],
    description: "A polished late-night pop track.",
  });
}

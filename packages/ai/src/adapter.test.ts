import { describe, expect, it } from "vitest";
import type { AIAdapter, AIGenerateTextInput } from "./adapter.js";
import { StructuredOutputService } from "./structured-output-service.js";
import { tiktokOutputSchema } from "./platform-output-schemas.js";

class FakeAdapter implements AIAdapter {
  public lastInput: AIGenerateTextInput | undefined;

  async generateText(input: AIGenerateTextInput): Promise<string> {
    this.lastInput = input;
    return JSON.stringify({
      hook: "New sound for late-night edits.",
      hashtags: ["#music", "#newartist", "#fyp"],
    });
  }
}

describe("AIAdapter contract", () => {
  it("allows a fake adapter to implement raw text generation", async () => {
    const adapter: AIAdapter = new FakeAdapter();

    const rawText = await adapter.generateText({
      systemPrompt: "Return JSON.",
      userPrompt: "Create TikTok copy.",
      temperature: 0.2,
      metadata: { platform: "tiktok" },
    });

    expect(rawText).toContain("hashtags");
  });

  it("allows structured output services to depend on a fake adapter", async () => {
    const adapter = new FakeAdapter();
    const service = new StructuredOutputService(adapter);

    const output = await service.generate({
      schema: tiktokOutputSchema,
      systemPrompt: "Return JSON.",
      userPrompt: "Create TikTok copy.",
      temperature: 0.2,
      maxProviderRetries: 0,
      maxRepairs: 0,
    });

    expect(output.hashtags).toEqual(["#music", "#newartist", "#fyp"]);
    expect(adapter.lastInput?.userPrompt).toBe("Create TikTok copy.");
  });
});

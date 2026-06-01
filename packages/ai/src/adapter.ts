export type AIGenerationMetadata = Record<string, string | number | boolean>;

export type AIGenerateTextInput = {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  metadata?: AIGenerationMetadata;
};

export interface AIAdapter {
  /**
   * Generate raw provider text only.
   * Parsing and platform rules belong to the structured output service.
   */
  generateText(input: AIGenerateTextInput): Promise<string>;
}

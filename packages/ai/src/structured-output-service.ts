import type { z } from "zod";
import type {
  AIAdapter,
  AIGenerateTextInput,
  AIGenerationMetadata,
} from "./adapter.js";
import {
  JSONExtractionError,
  SchemaValidationError,
  StructuredOutputError,
} from "./errors.js";
import { extractJsonObject } from "./json-extraction.js";

export type StructuredOutputRequest<TOutput> = {
  schema: z.ZodSchema<TOutput>;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  metadata?: AIGenerationMetadata;
  maxProviderRetries: number;
  maxRepairs: number;
};

export class StructuredOutputService {
  constructor(private readonly adapter: AIAdapter) {}

  async generate<TOutput>(
    request: StructuredOutputRequest<TOutput>,
  ): Promise<TOutput> {
    const firstResponse = await this.generateWithProviderRetries(request);
    const firstValidation = this.parseAndValidate(firstResponse, request.schema);

    if (firstValidation.success) {
      return firstValidation.value;
    }

    return this.repairUntilValid(request, firstResponse, firstValidation.error);
  }

  private async generateWithProviderRetries<TOutput>(
    request: StructuredOutputRequest<TOutput>,
  ): Promise<string> {
    return this.callProviderWithRetries(
      {
        systemPrompt: request.systemPrompt,
        userPrompt: request.userPrompt,
        temperature: request.temperature,
        metadata: request.metadata,
      },
      request.maxProviderRetries,
    );
  }

  private async callProviderWithRetries(
    input: AIGenerateTextInput,
    maxProviderRetries: number,
  ): Promise<string> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxProviderRetries; attempt += 1) {
      try {
        return await this.adapter.generateText(input);
      } catch (error) {
        lastError = error;
      }
    }

    throw new StructuredOutputError(
      {
        reason: "provider_retries_exhausted",
        attempts: maxProviderRetries + 1,
      },
      lastError,
    );
  }

  private async repairUntilValid<TOutput>(
    request: StructuredOutputRequest<TOutput>,
    invalidResponse: string,
    validationError: JSONExtractionError | SchemaValidationError,
  ): Promise<TOutput> {
    let lastError: JSONExtractionError | SchemaValidationError = validationError;
    let responseToRepair = invalidResponse;

    for (let repair = 1; repair <= request.maxRepairs; repair += 1) {
      const repairResponse = await this.generateRepairResponse(
        request,
        responseToRepair,
        lastError,
        repair,
      );
      const repairedValidation = this.parseAndValidate(
        repairResponse,
        request.schema,
      );

      if (repairedValidation.success) {
        return repairedValidation.value;
      }

      responseToRepair = repairResponse;
      lastError = repairedValidation.error;
    }

    throw new StructuredOutputError(
      {
        reason: "repairs_exhausted",
        repairs: request.maxRepairs,
        validationError: describeValidationError(lastError),
      },
      lastError,
    );
  }

  private async generateRepairResponse<TOutput>(
    request: StructuredOutputRequest<TOutput>,
    invalidResponse: string,
    validationError: JSONExtractionError | SchemaValidationError,
    repairAttempt: number,
  ): Promise<string> {
    return this.callProviderWithRetries(
      {
        systemPrompt: request.systemPrompt,
        userPrompt: buildRepairPrompt({
          originalUserPrompt: request.userPrompt,
          invalidResponse,
          validationErrors: describeValidationError(validationError),
        }),
        temperature: request.temperature,
        metadata: {
          ...request.metadata,
          repairAttempt,
          repair: true,
        },
      },
      request.maxProviderRetries,
    );
  }

  private parseAndValidate<TOutput>(
    rawResponse: string,
    schema: z.ZodSchema<TOutput>,
  ):
    | { success: true; value: TOutput }
    | { success: false; error: JSONExtractionError | SchemaValidationError } {
    try {
      const parsedJson = extractJsonObject(rawResponse);
      const validationResult = schema.safeParse(parsedJson);

      if (validationResult.success) {
        return { success: true, value: validationResult.data };
      }

      return {
        success: false,
        error: new SchemaValidationError({
          issues: validationResult.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        }),
      };
    } catch (error) {
      if (error instanceof JSONExtractionError) {
        return { success: false, error };
      }

      throw error;
    }
  }
}

type RepairPromptInput = {
  originalUserPrompt: string;
  invalidResponse: string;
  validationErrors: string;
};

function buildRepairPrompt(input: RepairPromptInput): string {
  // The repair model needs the original task, bad output, and validation facts.
  // These details stay inside provider calls and are never copied to public errors.
  return [
    "Repair the structured JSON output.",
    "Return one valid JSON object only. Do not include markdown.",
    "",
    "Original user prompt:",
    input.originalUserPrompt,
    "",
    "Invalid response:",
    input.invalidResponse,
    "",
    "Validation errors:",
    input.validationErrors,
  ].join("\n");
}

function describeValidationError(
  error: JSONExtractionError | SchemaValidationError,
): string {
  if (error instanceof SchemaValidationError) {
    return JSON.stringify(error.metadata?.issues ?? []);
  }

  return JSON.stringify(error.metadata ?? { reason: "json_extraction_failed" });
}

export const createStructuredOutputService = (adapter: AIAdapter) =>
  new StructuredOutputService(adapter);

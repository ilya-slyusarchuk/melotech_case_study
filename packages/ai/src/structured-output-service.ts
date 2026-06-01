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
    const firstValidation = this.parseAndValidate(
      firstResponse,
      request.schema,
    );

    if (firstValidation.success) {
      return firstValidation.value;
    }

    logValidationFailure(request.metadata, "initial", firstValidation.error);
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
        logModelRequest(input, attempt);
        const response = await this.adapter.generateText(input);
        logModelResponse(input, attempt, response);
        return response;
      } catch (error) {
        logModelError(input, attempt, error);
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
    let lastError: JSONExtractionError | SchemaValidationError =
      validationError;
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

      logValidationFailure(
        request.metadata,
        `repair:${repair}`,
        repairedValidation.error,
      );
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

function logModelRequest(input: AIGenerateTextInput, attempt: number): void {
  const label = formatLogLabel(input, attempt);
  console.info(`${label} request system prompt:\n${input.systemPrompt}`);
  console.info(`${label} request user prompt:\n${input.userPrompt}`);
}

function logModelResponse(
  input: AIGenerateTextInput,
  attempt: number,
  response: string,
): void {
  console.info(
    `${formatLogLabel(input, attempt)} raw model response:\n${response}`,
  );
}

function logModelError(
  input: AIGenerateTextInput,
  attempt: number,
  error: unknown,
): void {
  console.error(
    `${formatLogLabel(input, attempt)} provider error: ${formatErrorForDiagnostics(error)}`,
  );
}

function logValidationFailure(
  metadata: AIGenerationMetadata | undefined,
  phase: string,
  error: JSONExtractionError | SchemaValidationError,
): void {
  console.error(
    `[ai:${metadata?.platform ?? "unknown"}:${phase}] validation failed: ${describeValidationError(error)}`,
  );
}

function formatLogLabel(input: AIGenerateTextInput, attempt: number): string {
  const platform = input.metadata?.platform ?? "unknown";
  const repair = input.metadata?.repair
    ? `:repair-${input.metadata.repairAttempt}`
    : "";
  return `[ai:${platform}${repair}:attempt-${attempt + 1}]`;
}

function formatErrorForDiagnostics(error: unknown): string {
  const details = collectErrorDetails(error);
  return details.length > 0 ? details.join(" | caused by: ") : String(error);
}

function collectErrorDetails(error: unknown): string[] {
  if (!(error instanceof Error)) {
    return [String(error)];
  }

  const details = [formatSingleError(error)];
  const cause = error.cause;

  if (cause) {
    details.push(...collectErrorDetails(cause));
  }

  return details;
}

function formatSingleError(error: Error): string {
  const fields = [
    error.name,
    error.message,
    readErrorField(error, "status"),
    readErrorField(error, "code"),
    readErrorField(error, "type"),
  ].filter(Boolean);

  return fields.join(" ");
}

function readErrorField(error: Error, field: string): string | null {
  const value = (error as unknown as Record<string, unknown>)[field];
  if (typeof value === "string" || typeof value === "number") {
    return `${field}=${value}`;
  }

  return null;
}

type RepairPromptInput = {
  originalUserPrompt: string;
  invalidResponse: string;
  validationErrors: string;
};

function buildRepairPrompt(input: RepairPromptInput): string {
  // The repair model needs the original task, bad output, and specific
  // validation facts. These details stay inside provider calls and are
  // never copied to public errors.
  return [
    "Repair the structured JSON output.",
    "Return one valid JSON object only. Do not include markdown fences.",
    "Do not include prose before or after the JSON object.",
    "Use double-quoted JSON keys and string values.",
    "Do not use trailing commas.",
    "Do not include literal line breaks inside JSON string values. Use \\n instead.",
    "Do not use markdown formatting (e.g. **bold**) or emoji inside JSON string values.",
    "All string values must be plain text on a single JSON line.",
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

  // JSONExtractionError – surface parseError and hint so the repair
  // prompt can tell the model exactly what went wrong.
  const meta = error.metadata ?? {};
  return JSON.stringify({
    reason: meta.reason ?? "json_extraction_failed",
    parseError: meta.parseError,
    hint: meta.hint,
  });
}

export const createStructuredOutputService = (adapter: AIAdapter) =>
  new StructuredOutputService(adapter);

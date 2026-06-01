export type SafeErrorMetadata = Record<string, unknown>;

export abstract class SafeApplicationError extends Error {
  public readonly publicMessage: string;
  public readonly metadata?: SafeErrorMetadata;

  protected constructor(
    name: string,
    publicMessage: string,
    metadata?: SafeErrorMetadata,
    cause?: unknown,
  ) {
    super(publicMessage, { cause });
    this.name = name;
    this.publicMessage = publicMessage;
    this.metadata = metadata;
  }
}

export class AIProviderError extends SafeApplicationError {
  constructor(metadata?: SafeErrorMetadata, cause?: unknown) {
    // Provider details can contain secrets or prompt fragments.
    // Keep the public text stable and put sanitized facts in metadata.
    super(
      "AIProviderError",
      "The AI provider could not complete the request.",
      metadata,
      cause,
    );
  }
}

export class JSONExtractionError extends SafeApplicationError {
  constructor(metadata?: SafeErrorMetadata, cause?: unknown) {
    // Raw model text is intentionally excluded from the public message.
    super(
      "JSONExtractionError",
      "The AI response did not contain one valid JSON object.",
      metadata,
      cause,
    );
  }
}

export class SchemaValidationError extends SafeApplicationError {
  constructor(metadata?: SafeErrorMetadata, cause?: unknown) {
    // Validation paths are useful for logs, but user data should stay out of
    // API-facing messages.
    super(
      "SchemaValidationError",
      "The AI response did not match the expected output shape.",
      metadata,
      cause,
    );
  }
}

export class StructuredOutputError extends SafeApplicationError {
  constructor(metadata?: SafeErrorMetadata, cause?: unknown) {
    // This is the final failure after retries and repairs are exhausted.
    super(
      "StructuredOutputError",
      "The AI response could not be safely validated.",
      metadata,
      cause,
    );
  }
}

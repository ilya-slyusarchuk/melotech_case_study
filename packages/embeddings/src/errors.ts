export type SafeEmbeddingErrorMetadata = Record<string, unknown>;

export abstract class SafeEmbeddingError extends Error {
  public readonly publicMessage: string;
  public readonly metadata?: SafeEmbeddingErrorMetadata;

  protected constructor(
    name: string,
    publicMessage: string,
    metadata?: SafeEmbeddingErrorMetadata,
    cause?: unknown,
  ) {
    super(publicMessage, { cause });
    this.name = name;
    this.publicMessage = publicMessage;
    this.metadata = metadata;
  }
}

export class EmbeddingProviderError extends SafeEmbeddingError {
  constructor(metadata?: SafeEmbeddingErrorMetadata, cause?: unknown) {
    // Provider errors may include SDK request details.
    // Keep public text stable and put only safe facts in metadata.
    super(
      "EmbeddingProviderError",
      "The embedding provider could not complete the request.",
      metadata,
      cause,
    );
  }
}

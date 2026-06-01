import { z } from "zod";

export class ValidationError extends Error {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  readonly statusCode = 404;

  constructor(message: string = "Resource not found.") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class InsufficientCreditsError extends Error {
  readonly statusCode = 402;

  constructor(message: string = "Insufficient credits.") {
    super(message);
    this.name = "InsufficientCreditsError";
  }
}

/**
 * Wraps a Next.js App Router handler so errors are converted to JSON
 * responses with consistent status codes.
 */
export async function handleApiError(error: unknown): Promise<Response> {
  if (error instanceof z.ZodError) {
    return Response.json(
      {
        error: "Validation failed.",
        issues: error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  if (
    error instanceof Error &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    return Response.json(
      { error: error.message },
      { status: error.statusCode },
    );
  }

  console.error("Unhandled API error:", error);
  return Response.json(
    { error: "Internal server error." },
    { status: 500 },
  );
}

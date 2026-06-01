// Shared package for types, schemas, constants, and platform definitions.
// This package should not contain runtime logic or external dependencies beyond zod.

export * from "./audience.js";
export * from "./generation-request.js";
export * from "./platforms.js";

export const SHARED_VERSION = "1.0.0";

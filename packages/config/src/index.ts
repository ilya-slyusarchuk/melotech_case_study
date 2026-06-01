// Runtime configuration package.
// All environment variables are parsed and validated here.
// No other package should read process.env directly.

export * from "./shared.js";
export * from "./web.js";
export * from "./worker.js";

export const CONFIG_VERSION = "1.0.0";

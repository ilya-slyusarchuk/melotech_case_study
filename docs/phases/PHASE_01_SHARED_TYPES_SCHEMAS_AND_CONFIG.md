<!--
Melotech take-home implementation documentation.
Prepared as a deterministic planning package for a senior developer.
Code blocks are intentionally avoided except for short structural references where clarity requires it.
-->

# Phase 01 — Shared Types, Schemas, and Runtime Config


## Objective

Create shared contracts before implementing backend, worker, or frontend behavior.

## Sub-phase 01.1 — Platform definitions

### Implement

- In `packages/shared`, define the supported platforms as exactly: Spotify, TikTok, YouTube.
- Expose a canonical lowercase platform value for each: `spotify`, `tiktok`, `youtube`.
- Create a Zod schema that accepts only those values.
- Create a TypeScript union type derived from the platform constant.
- Create display metadata for each platform: label, description, and UI accent identifier.

### Tests immediately after this sub-phase

- Accept `spotify`, `tiktok`, and `youtube`.
- Reject unsupported platforms.
- Reject empty strings.
- Verify display metadata exists for every supported platform.

### Acceptance criteria

- No other package hard-codes the platform list.
- Adding a future platform has one obvious source of truth.

## Sub-phase 01.2 — Audience targeting schema

### Implement

- Add optional audience targeting input.
- Audience fields are: region, age range, and gender.
- Region is optional at the form level but, if provided, must be a non-empty string with a reasonable maximum length.
- Age range is optional and must use a fixed enum: `13-17`, `18-24`, `25-34`, `35-44`, `45-54`, `55+`.
- Gender is optional and must use a fixed enum: `male`, `female`, `all`, `non_binary`.
- Do not add complex demographic modeling in this MVP.

### Tests immediately after this sub-phase

- Accept region only.
- Accept region with age range.
- Accept region with gender.
- Accept all audience fields together.
- Reject empty region.
- Reject unsupported age ranges.
- Reject unsupported gender values.

### Acceptance criteria

- Audience targeting is validated once and reused everywhere.

## Sub-phase 01.3 — Generation request schema

### Implement

- Create the schema for creating a generation request.
- Required fields: `prompt`, `target_platforms`.
- Optional field: `audience`.
- Prompt length must be constrained to prevent empty or extremely large requests.
- Target platforms must contain at least one platform and no more than the supported platform count.
- Target platforms must not contain duplicates.

### Tests immediately after this sub-phase

- Accept a valid prompt with one platform.
- Accept a valid prompt with all three platforms.
- Accept valid audience targeting.
- Reject an empty prompt.
- Reject too-short prompts.
- Reject unsupported platforms.
- Reject duplicate platforms.
- Reject empty platform arrays.

### Acceptance criteria

- All API routes and frontend form validation use this same schema.

## Sub-phase 01.4 — Runtime config package

### Implement

- Create `packages/config`.
- Split config by runtime: shared config, web config, and worker config.
- Shared config includes database URL, Redis URL, app environment, AI provider configuration, embedding provider configuration, retry limits, similarity threshold, and platform credit settings.
- AI provider configuration must include provider name, base URL, API key, and model env variables.
- Every future AI provider must add an explicit model env variable alongside its base URL and API key.
- Web config includes Better Auth URL and secret, public app URL, and any browser-safe public values.
- Worker config excludes Better Auth variables unless strictly required.
- Parse all env vars with Zod.
- Coerce numeric env vars from strings.
- Never read `process.env` directly outside the config package.

### Tests immediately after this sub-phase

- Valid shared env parses.
- Missing required env fails.
- Numeric envs are coerced correctly.
- Invalid URLs fail.
- Missing AI provider model env fails.
- Worker env does not require Better Auth variables.
- Web env requires Better Auth variables.

### Acceptance criteria

- Runtime config is typed, validated, and explicit.
- Web and worker do not accidentally require each other's env variables.

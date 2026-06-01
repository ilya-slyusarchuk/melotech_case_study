# Changelog

## Phase 10 — Realtime Events and SSE

Added Zod-validated event contracts in `@melotech/realtime` for `PlatformUpdateEvent`, `GenerationUpdateEvent`, and `CreditsUpdateEvent`, with a union `WorkerEvent` schema and inline platform enum values to avoid cross-package Zod v4 schema recognition issues.
Updated `EventPublisher` interface and both `RedisEventPublisher` and `InMemoryEventPublisher` to support `publishCreditsUpdate`, with Zod validation before every publish so malformed events never reach Redis or the browser.
Implemented the worker-side `publishCreditsUpdate` helper in `GenerationProcessor` that reads wallet balance after each credit capture and release, then emits a `credits_update` event with the current `availableCredits` and `reservedCredits`.
Created authenticated SSE endpoint `GET /api/generations/{id}/events` in the web app that verifies generation ownership before opening a Redis pub/sub subscription scoped to `generation:{id}`, streams events as `text/event-stream`, and cleans up the Redis subscriber on client disconnect.
Added `formatSseEvent` and `encodeText` utilities in `apps/web/src/lib/sse-helpers.ts` for consistent SSE wire formatting, and extracted `verifyGenerationOwnership` and `createSseStream` into `apps/web/src/lib/sse-service.ts` behind injectable dependencies for testability.
Created `useGenerationEvents` React hook in `apps/web/src/hooks/use-generation-events.ts` that opens an `EventSource` to the SSE endpoint, updates platform output state, generation status, and credit balance in real time, handles malformed events gracefully, and closes the connection automatically on unmount or generation id change.
Added comprehensive unit coverage for all new layers: Zod schema validation (valid/invalid payloads), publisher behavior (serialize, reject invalid), SSE helpers (format, encode), SSE service (ownership check, stream forwarding, Redis cleanup), SSE endpoint (404 for foreign generations, 401 for unauthenticated), and frontend hook (open URL, handle events, unmount cleanup, state reset on id change).
Verified the entire monorepo test suite (`pnpm test`) and production build (`pnpm build`) pass cleanly with zero regressions.

## Phase 09 — Backend API, User Rate Limits, and Credit Endpoints

Added `PrismaCreditStore` in `@melotech/billing` to bridge the `CreditStore` interface with Prisma transactions, enabling production use of `CreditService`.
Implemented a Redis-backed fixed-window rate limiter in the web app, limiting generation creation to 3 requests per minute per authenticated user.
Exposed authenticated REST endpoints: `POST /api/generations` (create with rate limiting, wallet ensuring, credit reservation, and queue enqueue), `GET /api/generations` (history with platform and status filters), `GET /api/generations/{id}` (single generation with outputs), `GET /api/credits/wallet`, `POST /api/credits/grant` (fixed 100-credit test grant), `GET /api/credits/ledger`, and `GET /api/credits/usage` (daily/weekly/monthly analytics).
Refactored API route handlers so core logic accepts injected dependencies, making unit tests mockable without module-level mocking or a real database.
Added comprehensive unit coverage for rate limiter behavior, generation creation success and failure paths (including credit release on enqueue failure), history filtering, generation retrieval, wallet reads, credit grants, ledger ordering, and usage timeframe validation.

## Phase 08 — Queue and Worker Pipeline

Added the `@melotech/queue` package with a stable `generation` queue name, a minimal Zod-validated job payload schema containing only `generationRequestId`, and a mockable `GenerationQueueProducer` abstraction around BullMQ with conservative retry settings and inspectable failed jobs.
Added the `@melotech/realtime` package with typed `PlatformUpdateEvent` and `GenerationUpdateEvent` contracts, a `RedisEventPublisher` for worker-to-web pub/sub, and an `InMemoryEventPublisher` for unit tests.
Extended `@melotech/db` repositories with worker-specific update methods: `GenerationRequestRepository.updateStatusForWorker` and `PlatformOutputRepository.markProcessingForWorker`, `markCompletedForWorker`, `markCompletedFromCacheForWorker`, and `markFailedForWorker`.
Added `CreditService.findReservationForGeneration` so the worker can locate reservations without direct store access.
Implemented the `@melotech/worker` generation processor with a deterministic pipeline: load generation from Postgres, mark as processing, process each platform with isolated failures via `Promise.allSettled`, generate through the platform registry, store successful LLM outputs and semantic cache, capture credits with per-platform idempotency keys, attempt user-scoped cache fallback on failure, finalize generation status as completed/partial/failed, release unused reserved credits with a per-generation idempotency key, and publish progress events after each platform and at finalization.
Added idempotency guards so re-processed completed platforms skip LLM generation, avoid duplicate credit captures, and do not overwrite already-terminal output rows.
Added worker bootstrap with graceful shutdown on SIGTERM/SIGINT, BullMQ worker registration, and payload validation.
Added unit coverage for queue contracts, producer behavior, payload validation, worker bootstrap lifecycle, generation status transitions, platform success/failure isolation, cache fallback sourcing, credit capture and release idempotency, and event publishing at every stage.

## Phase 07 — Embeddings and User-Scoped Similar Cache

Added the `@melotech/embeddings` semantic fallback layer with a provider-agnostic `EmbeddingAdapter`, safe embedding provider errors, an OpenAI embedding provider using `text-embedding-3-small` by default, cosine similarity scoring, and a similar-result service.
Added user-scoped similar-result cache persistence in `@melotech/db`, including the Prisma `SimilarResultCache` model and a repository that always queries by user and platform.
The fallback service now embeds successful platform outputs into the cache, searches only same-user and same-platform results after generation failure, applies the configured similarity threshold, and prefers same-region cache hits when scores are close.
Added unit coverage for adapter replacement, provider request and failure handling, safe API-key handling, cache ownership boundaries, platform filtering, similarity ranking, zero-vector handling, threshold misses, and region-aware tie-breaking.

## Phase 06 — Platform Generators

Added platform-specific generators for Spotify, TikTok, and YouTube in `@melotech/ai`, each delegating JSON generation and validation to `StructuredOutputService` instead of calling model providers directly.
The generators now isolate platform prompt rules, schema selection, audience metadata handling, and safe structured output behavior behind a shared `PlatformGenerator` interface.
Added a platform generator registry that returns generators by platform, preserves requested ordering for multi-platform jobs, and throws a safe unsupported-platform error for unknown platform values.
Added unit coverage for interface implementations, registry lookup and ordering, provider independence, platform schema usage, audience-aware prompt forwarding, valid parsed outputs, and schema rejection paths.

## Phase 05 — AI Adapters and Structured Output Reliability

Added the `@melotech/ai` generation reliability layer with a provider-agnostic `AIAdapter`, safe error taxonomy, Ollama provider, JSON extraction, platform output schemas, and a structured output service for validation, retries, and repairs.
The Ollama provider now uses the official OpenAI TypeScript SDK against Ollama's OpenAI-compatible chat completions endpoint, while still reading explicit Ollama base URL, API key, and model env variables.
The provider keeps authentication server-side, normalizes Ollama base URLs to the OpenAI-compatible `/v1` root, disables SDK retries so service-level retry counts remain deterministic, and wraps provider failures without exposing secrets.
Added focused unit coverage for adapter substitution, provider request and failure handling, platform schema validation, JSON extraction, safe errors, repair prompts, retry limits, and preventing unvalidated output from being returned.

## Phase 04 — Prompt Enrichment and Audience Targeting

Added deterministic audience prompt enrichment in `@melotech/shared`, including original concept preservation, optional audience sections, and a shared adaptation instruction for future platform generators.
Added audience display chip metadata helpers so stored region, age range, and gender can be rendered consistently without empty labels.
Updated generation request creation so raw prompts, enriched prompts, and independent audience fields are persisted together before queued generation work can read the request.

## Phase 03 — Credits, Billing Ledger, and Usage Analytics

Added the `@melotech/billing` domain with server-owned platform pricing, reservation cost calculation, wallet creation, demo wallet ensuring, credit grants, reservations, platform captures, releases, idempotency handling, ledger history, usage analytics, and client credit-field rejection.
Added a Prisma schema for credit wallets, immutable ledger entries, credit reservations, generation relation anchors, ledger entry types, reservation statuses, unique wallet ownership, and unique ledger idempotency keys.
Added unit coverage for platform pricing, duplicate and unsupported platform rejection, wallet uniqueness, ledger idempotency, reservation balance movement, capture and release idempotency, failed-output zero-charge behavior, signup wallet creation, and daily, weekly, and monthly usage analytics.

## Phase 02 — Database, Auth, and User Ownership

Added the Prisma 7 foundation for `@melotech/db`, including package migration commands, generated-client pre-scripts, Prisma config, a safe local-development singleton, and a database health utility.
Integrated Better Auth in the web app with the Prisma adapter, email/password auth, the App Router catch-all route, server session helpers, and client auth helpers.
Extended the schema so Better Auth users are the application users, added session, account, and verification tables, and added user-owned generation requests, platform outputs, ownership indexes, and unique platform output constraints.
Added user-scoped generation and platform output repositories so web-facing reads require `userId`, while worker lookup can load by generation id and still returns ownership.

## Phase 01 — Shared Types, Schemas, and Runtime Config

Added shared platform contracts for Spotify, TikTok, and YouTube with one canonical platform list, Zod validation, derived TypeScript types, and display metadata.
Added reusable audience targeting and generation request schemas so API routes and future frontend validation can share the same rules.
Added runtime config parsing for shared, web, and worker environments with Zod validation, numeric coercion, platform credit settings, and separate Better Auth requirements for web only.

## Phase 00 — Repository and Docker Foundation

Created the PNPM + Turborepo monorepo with empty package shells for all 10 workspace packages and two apps.
Added Docker Compose with Postgres 17, Redis 7, web, and worker services.
Configured multi-stage Dockerfiles for both apps with standalone Next.js output.
Added Vitest smoke tests for every package and app.
Verified root commands `pnpm test`, `pnpm typecheck`, and `pnpm build` pass cleanly.

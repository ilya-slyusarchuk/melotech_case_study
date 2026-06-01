<!--
Melotech take-home implementation documentation.
Prepared as a deterministic planning package for a senior developer.
Code blocks are intentionally avoided except for short structural references where clarity requires it.
-->

# Phase 12 — Testing Strategy and Quality Gates


## Objective

Ensure every feature has tests written immediately after implementation and before moving to the next phase.

## Testing rule

Tests are not a final phase. They are required after every sub-phase.

This document defines the global testing expectations and final quality gates.

## Unit tests

Use unit tests for:

- Zod schemas.
- Prompt enrichment.
- Platform pricing.
- Credit service logic.
- Adapter behavior with mocked fetch.
- JSON extraction.
- Structured output retry and repair.
- Platform generators with mocked structured output service.
- Cosine similarity.
- Similar result service with fake embeddings.
- Rate limiter with fake or test Redis.
- Realtime event validation.

## Repository tests

Use repository tests for:

- User-scoped generation queries.
- Platform output state changes.
- Credit wallet creation.
- Ledger idempotency.
- Reservation, capture, and release.
- Usage analytics aggregation.

Use a test database if feasible. If time is constrained, repository tests may use an isolated test database container through Docker Compose.

## API tests

Use API route tests for:

- Auth required behavior.
- Input validation.
- Rate limit enforcement.
- Credit reservation behavior.
- User-scoped generation access.
- Wallet, grant, ledger, and usage endpoints.

## Worker tests

Use mocked dependencies for most worker tests.

Test:

- Successful all-platform generation.
- Partial platform failure.
- Complete failure.
- Cache fallback success.
- Credit capture for successful output.
- No credit capture for failed output.
- Release of unused credits.
- Event publishing.
- Idempotent re-processing.

## Frontend tests

Use component tests for:

- Login form.
- Signup form.
- Generation form.
- Platform selector.
- Output cards.
- History list.
- Usage page.
- Chart timeframe selector.
- SSE hook with mocked EventSource.

## Manual QA checklist

Before submission, manually verify:

- Signup works.
- Login works.
- User receives wallet.
- Add 100 credits works.
- Generation request creates pending job.
- Worker processes platforms.
- Realtime updates appear.
- Refresh during processing still shows current status.
- Successful outputs consume credits.
- Failed outputs do not consume credits.
- Usage page chart updates.
- User cannot see another user's generations or credits.
- Docker Compose starts all services.

## Final quality gates

Before final submission:

- Root tests pass.
- Typecheck passes.
- Lint passes.
- Build passes.
- Docker Compose config validates.
- Web image builds.
- Worker image builds.
- README is complete.
- CLAUDE.md is complete.
- ARCHITECTURE.md is complete.
- Env example is complete.

## What not to test

Do not test Better Auth internals.

Do not test the real Ollama API in unit tests.

Do not test the real OpenAI API in unit tests.

External providers must be mocked.

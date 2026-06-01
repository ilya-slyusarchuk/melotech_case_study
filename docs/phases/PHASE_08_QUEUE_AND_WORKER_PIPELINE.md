<!--
Melotech take-home implementation documentation.
Prepared as a deterministic planning package for a senior developer.
Code blocks are intentionally avoided except for short structural references where clarity requires it.
-->

# Phase 08 — Queue and Worker Pipeline


## Objective

Move generation processing into a durable background worker.

## Sub-phase 08.1 — Queue contracts

### Implement

- Create queue package.
- Define a stable queue name for generation jobs.
- Define a Zod schema for generation job payloads.
- Job payload contains only `generationRequestId`.
- Do not include prompt, userId, credit amounts, or platform data in the job payload. The worker must load the authoritative data from Postgres.

### Tests immediately after this sub-phase

- Valid job payload passes.
- Missing generationRequestId fails.
- Queue name is stable.

### Acceptance criteria

- Jobs are minimal and database-authoritative.

## Sub-phase 08.2 — Queue producer

### Implement

- Create a producer abstraction around BullMQ.
- API route calls producer, not BullMQ directly.
- Use one job per generation request.
- BullMQ attempts should be conservative because LLM retries happen inside the processing layer.
- Failed jobs should remain inspectable.

### Tests immediately after this sub-phase

- Producer adds job with correct name.
- Producer sends generationRequestId payload.
- Producer uses expected queue options.
- API-facing code can use a mocked producer.

### Acceptance criteria

- Queue implementation can be mocked in tests.

## Sub-phase 08.3 — Worker bootstrap

### Implement

- Create worker entrypoint.
- Connect to Redis.
- Connect to database.
- Register BullMQ worker.
- Validate each job payload before processing.
- Gracefully shutdown on termination signals.

### Tests immediately after this sub-phase

- Worker bootstrap can be imported without starting processing.
- Invalid job payload is rejected.
- Shutdown closes worker and Redis connections.

### Acceptance criteria

- Worker can run as an independent container.

## Sub-phase 08.4 — Generation processor

### Implement

Processor flow must be deterministic:

1. Load generation by id from database.
2. If generation does not exist, fail safely.
3. Mark generation as processing.
4. Load requested platform outputs.
5. Process requested platforms with `Promise.allSettled` or an equivalent failure-isolating mechanism.
6. For each platform, mark platform as processing.
7. Generate platform output through registry.
8. On successful LLM output, store output as completed with source `LLM`.
9. Store semantic cache for successful output.
10. Capture platform credits.
11. Publish platform update event.
12. On LLM failure, attempt user-scoped semantic fallback.
13. If fallback exists, store output as completed with source `CACHE`, capture credits, and publish event.
14. If fallback does not exist, mark platform failed and publish event.
15. Finalize generation status as completed, partial, or failed.
16. Release unused reserved credits.
17. Publish final generation event.

### Tests immediately after this sub-phase

- Marks generation processing.
- Marks platform processing.
- Completes all successful platforms.
- One platform failure results in partial generation.
- All platform failures result in failed generation.
- Cache fallback creates completed output with source cache.
- Failed output consumes zero credits.
- Successful output captures correct credits.
- Unused reserved credits are released.
- Events are published after each platform update.
- Final event is published.

### Acceptance criteria

- Pipeline keeps working even when one platform fails.

## Sub-phase 08.5 — Idempotency in worker processing

### Implement

- Capture credits with idempotency key per generation and platform.
- Release credits with idempotency key per generation.
- Do not overwrite completed platform outputs unnecessarily.
- If a job is re-run, completed platforms must not be double charged.

### Tests immediately after this sub-phase

- Re-processing successful platform does not double capture credits.
- Releasing same reservation twice does not duplicate release.
- Completed platform remains completed after retry.

### Acceptance criteria

- Worker retries cannot corrupt wallet state.

<!--
Melotech take-home implementation documentation.
Prepared as a deterministic planning package for a senior developer.
Code blocks are intentionally avoided except for short structural references where clarity requires it.
-->

# Project Structure and Architecture

## Architectural goal

Build the smallest version of a production-shaped AI content distribution platform.

The architecture should show that the developer can ship quickly while still designing for future extension: more platforms, more model providers, more embedding providers, richer history, user accounts, credits, and analytics.

## Monorepo structure

The project must use a PNPM + Turborepo monorepo.

Root-level structure:

- `apps/web` — Next.js application, API routes, frontend UI, Better Auth integration, SSE endpoint.
- `apps/worker` — standalone TypeScript worker consuming BullMQ jobs.
- `packages/db` — Prisma schema, Prisma client, repositories.
- `packages/shared` — shared schemas, types, constants, platform definitions, audience targeting, event contracts.
- `packages/config` — environment parsing split by runtime.
- `packages/ai` — AI adapter contracts, Ollama provider, structured output service, platform generators.
- `packages/embeddings` — embedding adapter contracts, OpenAI embedding provider, similarity utilities.
- `packages/queue` — BullMQ queue names, job schemas, producer utilities.
- `packages/realtime` — Redis pub/sub publisher/subscriber and SSE event helpers.
- `packages/billing` — credit pricing, wallet service, ledger service, reservation logic.

Package names should use a consistent scope:

- `@melotech/web`
- `@melotech/worker`
- `@melotech/db`
- `@melotech/shared`
- `@melotech/config`
- `@melotech/ai`
- `@melotech/embeddings`
- `@melotech/queue`
- `@melotech/realtime`
- `@melotech/billing`

## Runtime services

Docker Compose must include:

- `web`: Next.js standalone production server.
- `worker`: TypeScript worker compiled to JavaScript.
- `postgres`: PostgreSQL persistent database.
- `redis`: Redis with append-only persistence.

The deployment style must follow the existing Coolify-friendly pattern:

- Use `expose: 3000` for the web app instead of binding host ports.
- Use healthchecks for Postgres and Redis.
- Use named volumes for Postgres and Redis persistence.
- Use required environment variable interpolation so Coolify pre-populates required envs.

## Core backend flow

1. User authenticates with Better Auth.
2. User submits prompt, platforms, region, age range, and gender.
3. API validates the request with Zod.
4. API checks per-user rate limit.
5. API calculates platform credit reservation cost server-side.
6. API creates generation request and pending platform outputs.
7. API reserves maximum possible credits using a wallet and ledger transaction.
8. API enqueues a BullMQ generation job.
9. Worker consumes the job.
10. Worker generates each platform output with the platform generator registry.
11. Each LLM output is parsed and validated with Zod.
12. Invalid outputs trigger configurable repair/retry.
13. Failed LLM calls fall back to user-scoped semantic cache if possible.
14. Successful platform outputs capture platform-specific credits.
15. Failed platform outputs consume zero credits.
16. Unused reserved credits are released at the end.
17. Worker publishes progress events through Redis pub/sub.
18. Web app streams updates to the browser through SSE.
19. User sees realtime output status, history, credits, and usage.

## Major decisions and benefits

### Next.js for web and API

Reason: The assignment asks for full-stack work and the job prefers Node.js/Next.js.

Benefits:

- Fast MVP development.
- Shared frontend/backend TypeScript.
- Simple deployment as one web service.
- API routes close to UI needs.

### Separate worker service

Reason: LLM generation can be slow, unreliable, and retried. It should not block a browser request.

Benefits:

- Generation continues after page refresh.
- Better reliability and observability.
- Easier retry/failure handling.
- Scales independently from the web app.

### BullMQ with Redis

Reason: The product is a pipeline, not just a synchronous endpoint.

Benefits:

- Durable background jobs.
- Clear job lifecycle.
- Worker isolation.
- Easy local and VPS deployment.

### PostgreSQL with Prisma

Reason: The app needs user accounts, generations, outputs, credits, ledger entries, reservations, and history.

Benefits:

- Strong relational integrity.
- Simple migrations.
- Good fit for Better Auth.
- Easy querying for history and usage analytics.

### Better Auth

Reason: The system needs simple login/signup and user-owned resources.

Benefits:

- Per-user rate limits.
- User-specific history.
- User-specific credit wallets.
- User-scoped semantic cache.

### Adapter pattern for AI providers

Reason: The implementation starts with Ollama Cloud but must remain provider-agnostic.

Benefits:

- Ollama can be replaced by OpenAI, Anthropic, Gemini, or another provider later.
- Platform generators do not care which model provider is used.
- Tests can use fake providers.

### Separate embedding adapter

Reason: Text generation and embeddings are separate capabilities.

Benefits:

- Ollama handles generation.
- OpenAI handles embeddings for semantic search.
- Either can be changed independently.

### Zod validation for LLM outputs

Reason: LLM outputs are probabilistic and cannot be trusted as valid JSON.

Benefits:

- Prevents invalid data from entering the database as successful output.
- Enables deterministic repair prompts.
- Provides clear failure modes.
- Strengthens type safety across frontend and backend.

### Credit reservation and ledger model

Reason: Credits should be handled like money, even if they are test credits.

Benefits:

- Users cannot manipulate balances from the frontend.
- Concurrent requests cannot overspend.
- Failed outputs do not consume credits.
- Successful outputs are charged exactly once.
- Ledger provides auditability.

### SSE for realtime updates

Reason: The frontend needs realtime worker updates without polling.

Benefits:

- Simpler than WebSockets.
- Good fit for one-way status updates.
- Works well for a take-home MVP.

## Non-goals

Do not implement:

- Real payment checkout.
- Multi-tenant organization management.
- Admin dashboard.
- Complex role-based access control.
- Full vector database.
- Complex global cache sharing.
- Full observability stack.

## Production tradeoffs to document

The submission should explicitly mention these tradeoffs:

- The semantic cache uses PostgreSQL JSON vectors and TypeScript cosine similarity for MVP simplicity. A production version could move to pgvector or a vector database with a vector search engine like Qdrant.
- The credit system uses internal test credits only. A production billing system would integrate payments, invoices, refunds, and fraud controls.
- SSE is enough for one-way generation updates. WebSockets would be considered for bidirectional collaboration.
- The queue producer is simple. A production-grade version could use an outbox pattern to guarantee queue dispatch after database commit.

# Melotech Assignment

Melotech Assignment is a production-shaped AI content distribution pipeline for music concepts. A user submits one raw idea, selects target platforms, and the system generates platform-specific outputs for Spotify, TikTok, and YouTube with history, credits, and realtime processing updates.

## Infrastructure

This project is built as a PNPM and Turborepo monorepo.

| Area               | Technology                                            | Purpose                                                                                                                         |
| ------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Web app            | Next.js, React, Tailwind CSS                          | Authenticated UI, API routes, SSE endpoint, generation history, credits, and usage analytics.                                   |
| Worker             | TypeScript, BullMQ                                    | Background generation pipeline that processes queued jobs outside the request lifecycle.                                        |
| Database           | PostgreSQL, Prisma                                    | User accounts, generation requests, platform outputs, credit wallets, reservations, ledger entries, and semantic cache records. |
| Queue and realtime | Redis, BullMQ, Redis pub/sub                          | Durable generation jobs, rate limiting, worker-to-web progress events, and SSE streaming.                                       |
| Auth               | Better Auth                                           | Email/password signup, login, session handling, and user-owned resources.                                                       |
| AI generation      | Ollama-compatible chat completions behind `AIAdapter` | Provider-agnostic text generation for platform outputs.                                                                         |
| Embeddings         | OpenAI embeddings behind `EmbeddingAdapter`           | User-scoped similar-result fallback cache when generation fails.                                                                |
| Validation         | Zod                                                   | Runtime validation for API inputs, queue payloads, realtime events, and LLM structured outputs.                                 |
| Billing            | Internal credit wallet and immutable ledger           | Test-credit reservations, captures, releases, usage history, and idempotency.                                                   |
| Deployment shape   | Docker Compose                                        | Production-like `web`, `worker`, `postgres`, and `redis` services with persistent volumes.                                      |

## Important decisions

- The project uses a monorepo so apps and domain packages can share contracts without duplicating platform, audience, queue, realtime, and billing types.
- Generation runs in a separate worker because LLM calls can be slow, retried, repaired, or partially fail. Browser requests only enqueue work.
- BullMQ and Redis model the assignment as a real pipeline instead of a synchronous endpoint.
- PostgreSQL and Prisma provide relational integrity for auth, generations, outputs, wallets, reservations, and immutable ledger entries.
- Better Auth owns user identity so history, cache results, rate limits, and wallets stay user-scoped.
- AI generation and embeddings are adapter-based. Ollama and OpenAI can be replaced without rewriting platform generators or cache logic.
- LLM output is never trusted directly. Structured responses are parsed, validated with Zod, retried, and repaired before being stored as successful output.
- Credits are reserved before work starts, captured only for successful platform outputs, and released when unused.
- Failed platform outputs consume zero credits. Completed cache fallbacks remain visible as cache-sourced results.
- SSE is used for one-way realtime updates because worker progress only needs to stream from server to browser.
- The semantic cache uses PostgreSQL-stored vectors and TypeScript cosine similarity for MVP simplicity. A production version could move to pgvector or a vector database.
- Docker Compose follows a Coolify-friendly shape: the web service uses `expose: 3000`, Postgres and Redis have healthchecks, and data is stored in named volumes.

## Project structure

```text
apps/web          Next.js app, API routes, auth, frontend, SSE
apps/worker       BullMQ worker and generation processor
packages/ai       AI adapter, Ollama provider, structured output, platform generators
packages/billing  Credit pricing, wallet service, ledger, reservations
packages/config   Runtime environment parsing
packages/db       Prisma schema, generated client, repositories
packages/embeddings Embedding adapter and semantic fallback utilities
packages/queue    BullMQ queue names, job schemas, producer
packages/realtime Redis pub/sub publishers and SSE event contracts
packages/shared   Shared schemas, platform definitions, audience targeting
```

## Run locally

Prerequisites:

- Node.js
- PNPM
- PostgreSQL
- Redis
- Ollama-compatible AI provider credentials
- OpenAI-compatible embedding provider credentials

1. Copy the environment example file.

   ```bash
   cp .env.example .env
   ```

2. Populate every variable in `.env`.

   The local file must include database, Redis, Better Auth, AI provider, embedding provider, retry, similarity, and platform credit settings.

3. Install dependencies.

   ```bash
   pnpm install
   ```

4. Prepare the database.

   ```bash
   pnpm db:generate
   pnpm db:push
   ```

5. From the project root, start the worker.

   ```bash
   pnpm worker:dev
   ```

6. In a second terminal from the project root, start the web app.

   ```bash
   pnpm web:dev
   ```

7. Open the app at `http://localhost:3000`.

## Useful commands

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm lint
```

## Environment variables

Use `.env.example` as the source of truth. It includes:

- `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `REDIS_URL`
- `APP_ENV`, `NEXT_PUBLIC_APP_ENV`
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`
- `AI_PROVIDER`, `AI_MODEL`, `AI_BASE_URL`, `AI_API_KEY`
- `EMBEDDING_PROVIDER`, `EMBEDDING_MODEL`, `EMBEDDING_BASE_URL`, `EMBEDDING_API_KEY`
- `GENERATION_RETRY_LIMIT`, `LLM_REPAIR_RETRY_LIMIT`, `SIMILARITY_THRESHOLD`
- `PLATFORM_CREDIT_COST_SPOTIFY`, `PLATFORM_CREDIT_COST_TIKTOK`, `PLATFORM_CREDIT_COST_YOUTUBE`

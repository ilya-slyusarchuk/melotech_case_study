# Changelog

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

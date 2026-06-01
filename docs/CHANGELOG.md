# Changelog

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

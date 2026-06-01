<!--
Melotech take-home implementation documentation.
Prepared as a deterministic planning package for a senior developer.
Code blocks are intentionally avoided except for short structural references where clarity requires it.
-->

# Melotech Assignment Documentation Pack

This package contains the planning documents for building the Melotech full-stack case study as a production-shaped MVP.

The documents are intended to guide implementation, not replace engineering judgement. The decisions are intentionally deterministic so that the developer can start coding without re-litigating architecture, data ownership, service boundaries, or business rules.

## Documents

1. `01_MELOTECH_PROJECT_OVERVIEW.md` — public overview of Melotech as a company.
2. `02_ASSIGNMENT_OVERVIEW.md` — summary of the take-home assignment and its success criteria.
3. `03_PROJECT_STRUCTURE_AND_ARCHITECTURE.md` — structural solution decisions and why they were made.
4. `04_DESIGN_LANGUAGE.md` — UI identity and visual language inferred from Melotech's public website.
5. `phases/` — deterministic implementation phases with sub-phases, tests, and acceptance criteria.

## Target solution summary

The final project is a monorepo with:

- Next.js web application.
- Standalone TypeScript BullMQ worker.
- PostgreSQL with Prisma.
- Redis for BullMQ, rate limiting, and realtime pub/sub.
- Better Auth for signup/login/session handling.
- Ollama Cloud behind an `AIAdapter` for LLM generation.
- OpenAI embeddings behind an `EmbeddingAdapter` for semantic fallback cache.
- Zod validation for all external inputs, internal events, and LLM structured outputs.
- Per-user rate limits.
- User-scoped generation history.
- Credit wallet, immutable ledger, reservations, captures, and releases.
- SSE realtime updates from worker progress to frontend.
- Region and demographic prompt optimization.
- Usage page with wallet balance, credit history, free test credit grant, and usage chart.

## Non-negotiable implementation discipline

After every phase or sub-phase, tests must be written immediately. Do not defer tests until the end. The tests are part of the implementation, not a cleanup task.

## Recommended reading order

Read the overview documents first, then follow the phase files in numerical order.

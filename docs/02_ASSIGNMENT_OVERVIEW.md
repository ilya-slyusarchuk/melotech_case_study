<!--
Melotech take-home implementation documentation.
Prepared as a deterministic planning package for a senior developer.
Code blocks are intentionally avoided except for short structural references where clarity requires it.
-->

# Melotech Assignment Overview

## Assignment summary

Build a full-stack content distribution pipeline for AI-generated music.

The pipeline accepts a raw music concept and a list of target platforms. It generates optimized output for each selected platform using an LLM, stores the results, and shows them in a side-by-side comparison UI with generation history.

## Required backend behavior

The backend must expose an endpoint that accepts:

- `prompt`: the raw music concept.
- `target_platforms`: selected platforms such as Spotify, TikTok, and YouTube.

For each selected platform, the system must produce a different optimized output:

- Spotify: full metadata including title, genre, mood, BPM, instruments, and description.
- TikTok: short hook description and exactly three trending-style hashtags.
- YouTube: SEO-optimized title, description, and tags.

The backend must store platform results with platform metadata and return or expose all selected platform outputs together.

## Required frontend behavior

The frontend must include:

- Platform selector with multi-select behavior.
- Side-by-side comparison view of platform outputs.
- Generation history.
- Platform filter for the history view.

## Required constraints

The system must include:

- Rate limiting: no more than three generations per minute.
- Graceful LLM error handling.
- Cached similar result fallback if an LLM call fails.
- `CLAUDE.md` describing how AI coding tools were used.

## Agreed extended scope

The implementation will go beyond the minimum requirement in a controlled way.

The agreed extensions are:

- Monorepo with `web` and `worker` apps.
- Docker Compose deployment with PostgreSQL and Redis.
- Better Auth signup/login.
- User-owned generation history.
- Per-user rate limiting.
- Ollama Cloud as the LLM provider through an `AIAdapter`.
- OpenAI embeddings through an independent `EmbeddingAdapter`.
- Zod validation for LLM outputs.
- Configurable retry and repair flow for invalid or failed LLM responses.
- BullMQ worker processing instead of synchronous frontend-triggered LLM calls.
- SSE realtime updates to the frontend.
- Region and demographic optimization.
- Melotech credit wallet, reservations, captures, releases, and immutable ledger.
- Usage page with daily, weekly, and monthly chart.
- Free “Add 100 credits” testing button.

## What success looks like

The final submission should demonstrate:

- Working MVP.
- Clean architecture.
- Strong type safety.
- Modular providers.
- Production-aware AI reliability.
- Secure user ownership.
- Enterprise-like credit handling.
- Good UX and consistent design language.
- Tests written alongside implementation.
- Clear documentation.

## What to avoid

Avoid:

- Calling the LLM directly from React components.
- Trusting frontend-submitted credit costs or balances.
- Using `if platform === ...` logic scattered across the codebase.
- Storing unvalidated LLM responses as successful outputs.
- Returning another user's generations, credits, or cache results.
- Charging credits without idempotency.
- Building a complex payment system; credits are internal test credits only.
- Deferring tests until the end.

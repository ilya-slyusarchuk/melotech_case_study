<!--
Melotech take-home implementation documentation.
Prepared as a deterministic planning package for a senior developer.
Code blocks are intentionally avoided except for short structural references where clarity requires it.
-->

# Phase 13 — Deployment, Documentation, and Submission


## Objective

Prepare the project for GitHub submission and optional Coolify deployment.

## Sub-phase 13.1 — Environment example

### Implement

Create `.env.example` with every required variable:

- App environment.
- Public app URL.
- Database URL or Postgres password depending on runtime.
- Redis URL.
- Better Auth secret and URL.
- Ollama base URL, API key, and model.
- OpenAI API key and embedding model.
- LLM retry and repair limits.
- Similarity threshold.
- Generation rate limit.
- Any database pool size variable if used.

### Tests immediately after this sub-phase

- Config package can parse a filled example env in test mode.
- Missing required variables fail with readable errors.

### Acceptance criteria

- A reviewer can see exactly what env vars are needed.

## Sub-phase 13.2 — Docker and Coolify readiness

### Implement

- Confirm web Dockerfile builds.
- Confirm worker Dockerfile builds.
- Confirm Docker Compose starts all services.
- Confirm healthchecks work.
- Confirm web only exposes port 3000 internally.
- Confirm worker does not require web-only env vars.
- Confirm persistent volumes are defined.

### Tests immediately after this sub-phase

- Run Docker Compose config validation.
- Run Docker Compose build.
- Run local Compose startup.

### Acceptance criteria

- Project can be deployed in the same style as the reference Coolify setup.

## Sub-phase 13.3 — README

### Implement

README must include:

- Project overview.
- Assignment requirements checklist.
- Bonus features implemented.
- Architecture summary.
- Tech stack.
- Local development setup.
- Docker setup.
- Environment variables.
- Testing commands.
- Deployment notes.
- Known tradeoffs.

### Tests immediately after this sub-phase

- Follow README locally from a clean checkout or document any missing external dependency.

### Acceptance criteria

- Reviewer can run the project without asking for setup clarification.

## Sub-phase 13.4 — CLAUDE.md

### Implement

`CLAUDE.md` must explain how AI coding tools were used.

Include:

- Architecture brainstorming.
- Code scaffolding.
- Test generation.
- Refactoring assistance.
- Debugging assistance.
- What decisions were made by the developer.
- What was intentionally not overbuilt.

### Acceptance criteria

- The document shows AI was used as an engineering accelerator, not as a replacement for ownership.

## Sub-phase 13.5 — ARCHITECTURE.md

### Implement

Architecture documentation must explain:

- Why monorepo.
- Why separate worker.
- Why BullMQ.
- Why Redis pub/sub and SSE.
- Why Better Auth.
- Why per-user ownership.
- Why adapter pattern for generation.
- Why separate embedding adapter.
- Why Zod output validation.
- Why credit reservation and ledger.
- How to add a new platform.
- How to add a new AI provider, including its base URL, API key, and required model env variable.
- How to add a new embedding provider.
- How to add a new audience field.

### Acceptance criteria

- Architecture choices are understandable and defensible in the case interview.

## Sub-phase 13.6 — Final submission checklist

### Implement

Before submitting GitHub link:

- Clean commit history or at least clear final commit.
- No secrets committed.
- `.env.example` present.
- README present.
- CLAUDE.md present.
- Architecture documentation present.
- Tests pass.
- Build passes.
- Docker Compose works.
- Optional deployment URL works if deployed.

### Acceptance criteria

- The repository looks like a thoughtful, production-shaped MVP rather than a rushed demo.

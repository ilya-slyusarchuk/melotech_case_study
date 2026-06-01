<!--
Melotech take-home implementation documentation.
Prepared as a deterministic planning package for a senior developer.
Code blocks are intentionally avoided except for short structural references where clarity requires it.
-->

# Phase 00 — Repository and Docker Foundation


## Objective

Create the monorepo, tooling, and deployment foundation before implementing product logic.

## Sub-phase 00.1 — Initialize monorepo

### Implement

- Create a PNPM workspace.
- Add Turborepo.
- Add root TypeScript configuration.
- Add root lint, format, build, test, and typecheck scripts.
- Create empty app folders for `apps/web` and `apps/worker`.
- Create empty package folders for `db`, `shared`, `config`, `ai`, `embeddings`, `queue`, `realtime`, and `billing`.
- Use the `@melotech/*` package naming convention consistently.

### Tests immediately after this sub-phase

- Add one basic Vitest smoke test per package.
- Verify `pnpm test` runs all package tests.
- Verify `pnpm typecheck` runs without errors.

### Acceptance criteria

- A developer can run install, test, typecheck, and build from the root.
- All package imports resolve through workspace aliases.
- No product logic exists yet.

## Sub-phase 00.2 — Configure app shells

### Implement

- Initialize `apps/web` as a Next.js app using the App Router.
- Initialize `apps/worker` as a TypeScript Node service.
- Configure the worker to compile to `dist`.
- Configure both apps to consume shared packages through workspace dependencies.

### Tests immediately after this sub-phase

- Add a web smoke test confirming a simple component renders.
- Add a worker smoke test confirming the worker bootstrap function can be imported without side effects.

### Acceptance criteria

- `apps/web` can run in development.
- `apps/worker` can build into JavaScript.
- Neither app directly depends on implementation details of the other.

## Sub-phase 00.3 — Add Docker Compose

### Implement

- Add `docker-compose.yml` with services: `web`, `worker`, `postgres`, and `redis`.
- Use Postgres 17 alpine or equivalent current stable alpine image.
- Use Redis 7 alpine or equivalent current stable alpine image.
- Enable Redis append-only persistence.
- Add named volumes for Postgres and Redis.
- Add healthchecks for Postgres and Redis.
- Make `web` depend on healthy Postgres and Redis.
- Make `worker` depend on healthy Postgres and Redis.
- Expose web port `3000` internally, but do not bind it to the host port.
- Use required environment interpolation for all required variables.

### Tests immediately after this sub-phase

- Run Docker Compose config validation.
- Run Docker Compose startup locally and verify Postgres and Redis become healthy.

### Acceptance criteria

- Compose is compatible with Coolify-style deployments.
- Parallel deployments will not fight over a host port.
- Database and Redis data survive container recreation.

## Sub-phase 00.4 — Add production Dockerfiles

### Implement

- Add `apps/web/Dockerfile` using the pattern: base, deps, builder, runner.
- Add `apps/worker/Dockerfile` using the pattern: base, deps, builder, runner.
- Use Node 24 alpine to match the existing reference style unless the developer intentionally standardizes on another supported Node LTS.
- Enable Corepack.
- Install dependencies using the root lockfile.
- Build only the relevant app through Turborepo filters.
- Run Next.js using standalone output.
- Run worker from compiled `apps/worker/dist/index.js`.

### Tests immediately after this sub-phase

- Build the web image.
- Build the worker image.
- Start all services through Docker Compose.

### Acceptance criteria

- Web image starts with `NODE_ENV=production`.
- Worker image starts independently.
- No development-only command is used in production containers.

## Sub-phase 00.5 — Add baseline quality gates

### Implement

- Add linting.
- Add formatting.
- Add strict TypeScript.
- Add Vitest configuration per package.
- Add test scripts to all packages.

### Tests immediately after this sub-phase

- Root `pnpm lint` passes.
- Root `pnpm typecheck` passes.
- Root `pnpm test` passes.
- Root `pnpm build` passes.

### Acceptance criteria

- The repository has a reliable baseline before business logic begins.

<!--
Melotech take-home implementation documentation.
Prepared as a deterministic planning package for a senior developer.
Code blocks are intentionally avoided except for short structural references where clarity requires it.
-->

# Phase 02 — Database, Auth, and User Ownership


## Objective

Create the persistence layer, Better Auth integration, and user ownership rules before generation logic exists.

## Sub-phase 02.1 — Prisma foundation

### Implement

- Create `packages/db`.
- Add Prisma schema.
- Add Prisma client export.
- Add a safe singleton pattern for local development if needed.
- Add migration commands.
- Add a database health utility.

### Tests immediately after this sub-phase

- Prisma client can be imported.
- Database health utility returns success with a test database.
- Migrations can be generated.

### Acceptance criteria

- Database access is centralized through `@melotech/db`.

## Sub-phase 02.2 — Better Auth setup

### Implement

- Configure Better Auth in `apps/web`.
- Use the Prisma adapter.
- Enable email/password authentication.
- Add the Better Auth catch-all API route.
- Add server helper to require a session.
- Add client helper for sign in, sign up, sign out, and session access.

### Tests immediately after this sub-phase

- Session helper returns a user when a valid session is mocked.
- Session helper throws an unauthorized error when no session exists.
- Auth utilities can be imported without side effects.

### Acceptance criteria

- The app supports signup, login, logout, and server-side session lookup.

## Sub-phase 02.3 — Auth schema integration

### Implement

- Add Better Auth models to Prisma.
- Use the Better Auth user as the application user.
- Do not create a separate `AppUser` model for this MVP.
- Keep user identity minimal: id, name, email, image if provided, timestamps.

### Tests immediately after this sub-phase

- A user can be created in the database.
- User email is unique.
- Sessions relate to users.

### Acceptance criteria

- Better Auth and application data share the same Postgres database.

## Sub-phase 02.4 — Generation ownership schema

### Implement

- Add `GenerationRequest` with `userId`.
- Add `PlatformOutput` related to `GenerationRequest`.
- Add status enums for generation and platform output.
- Add audience fields to `GenerationRequest`: region, age range, gender.
- Add `enrichedPrompt` to `GenerationRequest`.
- Add indexes on user, status, and creation time.
- Add a unique constraint so a generation cannot have duplicate platform output rows for the same platform.

### Tests immediately after this sub-phase

- Create a user-owned generation request.
- Create pending platform outputs.
- Prevent duplicate platform outputs for the same generation and platform.
- Query generation with outputs.
- Confirm generation cannot exist without a user.

### Acceptance criteria

- Every generation belongs to exactly one user.

## Sub-phase 02.5 — User-scoped repositories

### Implement

- Create repository classes or modules for generation requests and platform outputs.
- All read methods exposed to the web app must require `userId`.
- `findByIdForUser` must return null if the generation does not belong to that user.
- History listing must always filter by `userId`.
- Worker-only methods may load by generation id because the job id already references a persisted generation, but worker methods must preserve user ownership.

### Tests immediately after this sub-phase

- User A can list User A generations.
- User A cannot list User B generations.
- User A cannot fetch User B generation by id.
- Worker method can load generation by id and includes userId.
- History filters by platform and still respects userId.

### Acceptance criteria

- User isolation is enforced below the API layer.

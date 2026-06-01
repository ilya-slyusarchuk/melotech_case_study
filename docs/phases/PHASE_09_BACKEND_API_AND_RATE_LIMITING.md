<!--
Melotech take-home implementation documentation.
Prepared as a deterministic planning package for a senior developer.
Code blocks are intentionally avoided except for short structural references where clarity requires it.
-->

# Phase 09 — Backend API, User Rate Limits, and Credit Endpoints


## Objective

Expose authenticated APIs for generation, history, wallet, credits, and usage.

## Sub-phase 09.1 — Per-user rate limiter

### Implement

- Implement Redis-backed rate limiter.
- Limit generation creation to three requests per minute per authenticated user.
- Use userId as the primary key.
- Do not use IP-based limits for authenticated users unless added as secondary protection.
- Rate limiting must happen before generation creation and credit reservation.

### Tests immediately after this sub-phase

- User can make three generation requests within a minute.
- Fourth request is rejected.
- Different user is unaffected.
- Limit resets after window.

### Acceptance criteria

- One active user cannot block another user's generations.

## Sub-phase 09.2 — POST generation endpoint

### Implement

- Require authenticated session.
- Validate request body with shared schema.
- Apply per-user rate limit.
- Ensure user wallet exists.
- Build enriched prompt.
- Create generation request and platform outputs.
- Reserve maximum possible credits based on selected platforms.
- Enqueue BullMQ job.
- Return generation id and current status.
- If queue enqueue fails after reservation, mark generation failed and release reservation.

### Tests immediately after this sub-phase

- Unauthenticated request returns unauthorized.
- Invalid request returns validation error.
- Rate-limited request is rejected before DB creation.
- Insufficient credits returns a clear error.
- Valid request creates generation with userId.
- Valid request creates pending platform outputs.
- Valid request reserves credits.
- Valid request enqueues job.
- Enqueue failure releases reserved credits.

### Acceptance criteria

- Frontend never calls the LLM or worker directly.

## Sub-phase 09.3 — GET generation by id

### Implement

- Require authenticated session.
- Load generation by id and userId.
- Return 404 if not found or not owned by user.
- Include outputs, audience metadata, status, source, credit cost, and timestamps.

### Tests immediately after this sub-phase

- User can fetch own generation.
- User cannot fetch another user's generation.
- Unknown id returns 404.
- Response includes outputs.
- Response includes audience fields.
- Response includes cache source when applicable.

### Acceptance criteria

- Refresh recovery is possible and secure.

## Sub-phase 09.4 — GET generation history

### Implement

- Require authenticated session.
- List only current user's generations.
- Support platform filter.
- Support status filter.
- Support limit.
- Default sort order is newest first.

### Tests immediately after this sub-phase

- User sees own history.
- User does not see another user's history.
- Platform filter works.
- Status filter works.
- Invalid platform filter is rejected.
- Default limit is applied.

### Acceptance criteria

- History is user-scoped and filterable.

## Sub-phase 09.5 — Credit wallet endpoint

### Implement

- Add endpoint to return current user's wallet.
- Response includes available credits and reserved credits.
- Require authenticated session.

### Tests immediately after this sub-phase

- Unauthenticated request is rejected.
- Authenticated user gets own wallet.
- User cannot request another user's wallet.

### Acceptance criteria

- Frontend can display current credit balance.

## Sub-phase 09.6 — Add 100 test credits endpoint

### Implement

- Add authenticated endpoint that grants exactly 100 credits.
- Do not accept amount from the frontend.
- Create a grant ledger entry.
- This is explicitly for test/demo usage.
- Optional: rate limit this endpoint separately to prevent accidental spam.

### Tests immediately after this sub-phase

- Unauthenticated request is rejected.
- Authenticated request adds exactly 100 credits.
- Request body amount is ignored or rejected.
- Ledger entry is created.

### Acceptance criteria

- Test credits can be added safely without trusting client amounts.

## Sub-phase 09.7 — Credit ledger endpoint

### Implement

- Add authenticated endpoint to return current user's credit ledger history.
- Include entry type, amount, platform, generation id, created time, and useful metadata.
- Newest entries first.
- Only current user's entries are returned.

### Tests immediately after this sub-phase

- User sees own ledger entries.
- User does not see another user's entries.
- Entries are sorted newest first.
- Platform capture entries include platform.

### Acceptance criteria

- Usage page can show credit history.

## Sub-phase 09.8 — Credit usage analytics endpoint

### Implement

- Add authenticated endpoint for usage chart data.
- Supported timeframe values: daily, weekly, monthly.
- Default timeframe is daily.
- Count only captured platform credits.
- Return labels and consumed credits.

### Tests immediately after this sub-phase

- Missing timeframe defaults to daily.
- Daily timeframe works.
- Weekly timeframe works.
- Monthly timeframe works.
- Invalid timeframe is rejected.
- Grants and releases are excluded.
- User isolation is enforced.

### Acceptance criteria

- Usage chart is powered by server-side analytics.

<!--
Melotech take-home implementation documentation.
Prepared as a deterministic planning package for a senior developer.
Code blocks are intentionally avoided except for short structural references where clarity requires it.
-->

# Phase 10 — Realtime Events and SSE


## Objective

Stream worker progress to the frontend without polling.

## Sub-phase 10.1 — Realtime event contracts

### Implement

- Define event types in `packages/realtime` or `packages/shared`.
- Required events: generation updated, platform output updated, credits updated.
- Validate event payloads with Zod.
- Event payloads must include generation id where relevant.
- Do not include sensitive data.

### Tests immediately after this sub-phase

- Valid generation event passes.
- Invalid generation event fails.
- Valid platform event passes.
- Invalid platform event fails.
- Valid credits event passes.

### Acceptance criteria

- Worker and web agree on realtime payload contracts.

## Sub-phase 10.2 — Redis realtime publisher

### Implement

- Create Redis publisher abstraction.
- Worker publishes to channel `generation:{generationRequestId}`.
- Publish only validated events.
- Publisher should be mockable for worker tests.

### Tests immediately after this sub-phase

- Publishes to correct channel.
- Serializes event consistently.
- Rejects invalid event payload.
- Worker can use mocked publisher.

### Acceptance criteria

- Worker has no direct dependency on SSE or browser APIs.

## Sub-phase 10.3 — SSE endpoint

### Implement

- Add authenticated SSE endpoint for generation id.
- Verify generation belongs to current user before opening stream.
- Subscribe to Redis channel after ownership check.
- Send events as `text/event-stream`.
- Close Redis subscription when client disconnects.
- Return not found for generation not owned by user.

### Tests immediately after this sub-phase

- Unauthenticated SSE request is rejected.
- User cannot subscribe to another user's generation.
- User can subscribe to own generation.
- SSE formatting utility produces valid event payload.
- Subscription cleanup is called on disconnect.

### Acceptance criteria

- Realtime updates are secure and user-scoped.

## Sub-phase 10.4 — Frontend SSE hook

### Implement

- Create a frontend hook to subscribe to generation events.
- Hook opens EventSource to the generation event endpoint.
- Hook updates platform output state.
- Hook updates generation status.
- Hook updates credit state when credits event arrives.
- Hook closes connection on unmount.

### Tests immediately after this sub-phase

- Hook opens correct URL.
- Hook handles platform update event.
- Hook handles generation update event.
- Hook handles credits update event.
- Hook closes EventSource on unmount.
- Hook does not duplicate events.

### Acceptance criteria

- Active generation pages update without refresh or polling.

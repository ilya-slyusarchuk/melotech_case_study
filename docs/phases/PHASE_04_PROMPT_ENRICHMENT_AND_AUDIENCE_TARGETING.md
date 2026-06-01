<!--
Melotech take-home implementation documentation.
Prepared as a deterministic planning package for a senior developer.
Code blocks are intentionally avoided except for short structural references where clarity requires it.
-->

# Phase 04 — Prompt Enrichment and Audience Targeting


## Objective

Convert raw user prompts plus audience targeting into a deterministic enriched prompt that platform generators can use.

## Sub-phase 04.1 — Audience prompt builder

### Implement

- Create an audience prompt builder in `packages/shared`.
- Input: raw prompt and optional audience targeting.
- Output: enriched prompt string.
- If no audience is provided, return the original prompt unchanged.
- If audience is provided, include a clear target audience section.
- Include only the fields provided by the user.
- Do not invent missing demographics.
- Do not translate the prompt unless a later platform generator specifically asks for localization.

### Required prompt transformation behavior

The enriched prompt must contain:

- Original music concept.
- Target region, if provided.
- Target age range, if provided.
- Target gender, if provided.
- Instruction to adapt the output to local cultural preferences, platform behavior, language expectations, music discovery habits, genre affinity, and emotional positioning.

### Tests immediately after this sub-phase

- No audience returns the original prompt.
- Region is included when provided.
- Age range is included when provided.
- Gender is included when provided.
- Undefined fields are not rendered.
- Original prompt content is preserved.

### Acceptance criteria

- Every platform generator receives the same enriched audience context.

## Sub-phase 04.2 — Persist prompt enrichment

### Implement

- Store both raw prompt and enriched prompt on `GenerationRequest`.
- Store audience fields separately for filtering and display.
- The enriched prompt should be created before the generation job is enqueued.

### Tests immediately after this sub-phase

- Creating a generation with audience stores raw prompt.
- Creating a generation with audience stores enriched prompt.
- Creating a generation without audience stores raw prompt and either null or identical enriched prompt according to the chosen convention.
- Audience fields are queryable independently.

### Acceptance criteria

- Debugging is possible because the exact prompt sent to the AI pipeline is persisted.

## Sub-phase 04.3 — Audience display metadata

### Implement

- Create a helper to convert stored audience fields into UI labels.
- Region appears as a chip.
- Age range appears as a chip only when provided.
- Gender appears as a chip only when provided.

### Tests immediately after this sub-phase

- Region label is rendered correctly.
- Missing age range does not create an empty label.
- Missing gender does not create an empty label.

### Acceptance criteria

- Audience context is visible in history, generation detail, and usage-related metadata when useful.

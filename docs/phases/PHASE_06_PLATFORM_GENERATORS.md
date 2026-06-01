<!--
Melotech take-home implementation documentation.
Prepared as a deterministic planning package for a senior developer.
Code blocks are intentionally avoided except for short structural references where clarity requires it.
-->

# Phase 06 — Platform Generators


## Objective

Create one generator per platform so platform-specific logic is modular and easy to extend.

## Sub-phase 06.1 — Platform generator interface

### Implement

- Create a `PlatformGenerator` interface in `packages/ai`.
- Each generator declares its platform.
- Each generator accepts enriched prompt and optional audience metadata.
- Each generator returns validated structured output.
- Generators use `StructuredOutputService`; they do not call AI providers directly.

### Tests immediately after this sub-phase

- A fake generator can implement the interface.
- Registry can store interface implementations.
- Generators do not depend on concrete model providers.

### Acceptance criteria

- Platform-specific behavior is isolated.

## Sub-phase 06.2 — Spotify generator

### Implement

- Create `SpotifyGenerator`.
- It must request metadata for Spotify distribution.
- It must produce title, genre, mood, BPM, instruments, and description.
- It must instruct the model to adapt output to the audience and region when present.
- It must request JSON only.
- It must validate output with the Spotify schema.

### Tests immediately after this sub-phase

- Spotify generator passes enriched prompt to structured output service.
- Spotify generator uses Spotify schema.
- Spotify generator returns valid parsed output.
- Spotify generator propagates structured output errors.

### Acceptance criteria

- Spotify output is always typed and valid.

## Sub-phase 06.3 — TikTok generator

### Implement

- Create `TikTokGenerator`.
- It must request a short hook and exactly three hashtags.
- Hook must be short-form friendly.
- Hashtags must be trend-style but not claim real-time trend knowledge unless the model has web/search access.
- It must adapt to audience and region when present.
- It must validate output with the TikTok schema.

### Tests immediately after this sub-phase

- TikTok generator passes enriched prompt.
- TikTok generator uses TikTok schema.
- TikTok generator returns exactly three hashtags.
- TikTok generator rejects invalid hashtag format through schema validation.

### Acceptance criteria

- TikTok output is concise and schema-valid.

## Sub-phase 06.4 — YouTube generator

### Implement

- Create `YouTubeGenerator`.
- It must request SEO title, description, and tags.
- It must optimize for discoverability and audience fit.
- It must adapt to region and demographic context.
- It must validate output with the YouTube schema.

### Tests immediately after this sub-phase

- YouTube generator passes enriched prompt.
- YouTube generator uses YouTube schema.
- YouTube generator returns title, description, and tags.
- YouTube generator rejects empty tags through schema validation.

### Acceptance criteria

- YouTube output is search-oriented and schema-valid.

## Sub-phase 06.5 — Platform generator registry

### Implement

- Create a registry that maps platform values to generator instances.
- Registry must return one generator by platform.
- Registry must return multiple generators in the same order requested by the user.
- Registry must throw a safe unsupported platform error for unknown platforms.

### Tests immediately after this sub-phase

- Registry returns Spotify generator.
- Registry returns TikTok generator.
- Registry returns YouTube generator.
- Registry preserves requested order.
- Registry rejects unsupported platform.

### Acceptance criteria

- Adding a platform later requires a new generator and registry registration only.

<!--
Melotech take-home implementation documentation.
Prepared as a deterministic planning package for a senior developer.
Code blocks are intentionally avoided except for short structural references where clarity requires it.
-->

# Phase 07 — Embeddings and User-Scoped Similar Cache


## Objective

Create a semantic fallback cache that returns similar previous results when LLM generation fails.

## Sub-phase 07.1 — Embedding adapter contract

### Implement

- Create `EmbeddingAdapter` in `packages/embeddings`.
- Interface accepts text and returns a numeric vector.
- It does not know about users, platforms, or cache storage.

### Tests immediately after this sub-phase

- Fake embedding adapter can implement the interface.
- Similarity service can depend on fake adapter.
- No cache service imports a concrete embedding provider.

### Acceptance criteria

- Embedding provider is replaceable.

## Sub-phase 07.2 — OpenAI embedding provider

### Implement

- Implement `OpenAIEmbeddingProvider` behind the embedding adapter.
- Use env variables for API key and model.
- Use `text-embedding-3-small` as the default model unless env overrides it.
- Return only the embedding vector.
- Wrap provider failures in safe errors.
- Never expose API keys in errors.

### Tests immediately after this sub-phase

- Provider sends input and model.
- Provider returns numeric vector.
- API failure throws safe provider error.
- Malformed response throws safe provider error.
- API key is not exposed in error output.

### Acceptance criteria

- OpenAI is used only for embeddings and can be replaced later.

## Sub-phase 07.3 — Similar result cache schema

### Implement

- Add `SimilarResultCache` model.
- Store userId, prompt, platform, outputJson, embedding, region, age range, gender, and creation time.
- Cache must be user-scoped for the take-home.
- Do not return cached output across users.

### Tests immediately after this sub-phase

- Store cache result for user and platform.
- Query cache results by user and platform.
- Query does not return another user's cache.
- Query does not return another platform's cache.

### Acceptance criteria

- Cache fallback is safe with user-owned content.

## Sub-phase 07.4 — Cosine similarity utility

### Implement

- Implement cosine similarity for numeric vectors.
- Handle zero vectors safely.
- Return deterministic numeric scores.

### Tests immediately after this sub-phase

- Identical vectors return the highest score.
- Orthogonal vectors return a low or zero score.
- Similar vectors rank above unrelated vectors.
- Zero vectors do not throw.

### Acceptance criteria

- Similarity ranking is deterministic and unit-tested.

## Sub-phase 07.5 — Similar result service

### Implement

- On successful platform output, embed the enriched prompt and store cache result.
- On platform generation failure, embed the enriched prompt and search previous cache results for the same user and platform.
- Prefer same region when scores are close.
- Use a similarity threshold from config.
- Return null when no result crosses threshold.

### Tests immediately after this sub-phase

- Stores successful output in cache.
- Finds closest result for same user and platform.
- Does not return result from another user.
- Does not return result from another platform.
- Prefers same region when similarity scores are close.
- Returns null below threshold.

### Acceptance criteria

- Cached fallback is semantic, user-scoped, platform-aware, and region-aware.

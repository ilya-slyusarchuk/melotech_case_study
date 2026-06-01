<!--
Melotech take-home implementation documentation.
Prepared as a deterministic planning package for a senior developer.
Code blocks are intentionally avoided except for short structural references where clarity requires it.
-->

# Phase 05 — AI Adapters and Structured Output Reliability


## Objective

Create a model-provider-agnostic generation layer with validated structured outputs, retries, and repairs.

## Sub-phase 05.1 — AI adapter contract

### Implement

- Create an `AIAdapter` interface in `packages/ai`.
- The interface exposes raw text generation only.
- The interface accepts system prompt, user prompt, temperature, and optional metadata.
- The interface returns raw provider text.
- It does not parse JSON.
- It does not know about platforms.

### Tests immediately after this sub-phase

- A fake adapter can implement the interface.
- Structured output services can depend on the fake adapter.
- No platform generator imports a concrete provider.

### Acceptance criteria

- Model provider replacement requires no changes to platform generators.

## Sub-phase 05.2 — Ollama provider

### Implement

- Implement `OllamaProvider` behind the `AIAdapter` interface.
- Use env variables for base URL, API key, and model.
- The model must be read from an explicit model env variable, not hard-coded in the provider.
- Any future AI provider must require the same three env categories: base URL, API key, and model.
- Support Ollama Cloud by sending authentication server-side only.
- Provider errors must be wrapped in safe application errors.
- Provider errors must never expose API keys.
- Keep request/response parsing inside the provider only.

### Tests immediately after this sub-phase

- Provider sends model, system prompt, user prompt, and temperature.
- Provider fails fast when the required model env variable is missing.
- Provider returns raw text content.
- Non-success HTTP responses throw a safe provider error.
- Malformed provider responses throw a safe provider error.
- API key is not included in thrown error messages.

### Acceptance criteria

- Ollama is isolated and replaceable.
- Adding another AI provider requires documenting and validating that provider's model env variable together with its base URL and API key.

## Sub-phase 05.3 — Platform output schemas

### Implement

- Define Zod schemas for Spotify, TikTok, and YouTube outputs.
- Spotify output fields: title, genre, mood, bpm, instruments, description.
- TikTok output fields: hook, hashtags.
- TikTok hashtags must contain exactly three items.
- TikTok hashtags must start with `#`.
- YouTube output fields: seoTitle, description, tags.
- YouTube tags must contain at least one tag.

### Tests immediately after this sub-phase

- Valid Spotify output passes.
- Spotify rejects BPM as text.
- Spotify rejects missing instruments.
- Valid TikTok output passes.
- TikTok rejects fewer or more than three hashtags.
- TikTok rejects hashtags without `#`.
- Valid YouTube output passes.
- YouTube rejects empty tags.

### Acceptance criteria

- Invalid LLM outputs cannot be marked completed.

## Sub-phase 05.4 — JSON extraction utility

### Implement

- Create a utility that extracts JSON from raw LLM text.
- Accept plain JSON.
- Accept JSON wrapped in markdown code fences.
- Reject non-JSON prose.
- Reject incomplete JSON.
- Return parsed unknown JSON for schema validation.

### Tests immediately after this sub-phase

- Extract plain object JSON.
- Extract fenced JSON.
- Reject text with no JSON object.
- Reject malformed JSON.
- Reject multiple conflicting JSON objects unless a deterministic extraction rule is documented.

### Acceptance criteria

- Common LLM formatting noise is handled before validation.

## Sub-phase 05.5 — Structured output service

### Implement

- Create a service that combines AI generation, JSON extraction, Zod validation, retry, and repair.
- Normal generation happens first.
- Provider failures trigger retry up to configured max retries.
- Schema failures trigger repair up to configured max repairs.
- Repair prompt must include original user prompt, invalid response, and validation errors.
- Repair response must still pass JSON extraction and Zod validation.
- If all attempts fail, throw a structured output error.

### Tests immediately after this sub-phase

- Valid output succeeds on first attempt.
- Provider error retries and eventually succeeds.
- Provider error stops after max retries.
- Invalid schema triggers repair.
- Repair success returns valid output.
- Repair stops after max repairs.
- Unvalidated output is never returned.

### Acceptance criteria

- All LLM outputs go through one reliability layer.

## Sub-phase 05.6 — Error taxonomy

### Implement

- Define safe error classes: provider error, JSON extraction error, schema validation error, structured output error.
- Errors should be useful for logs but safe for API responses.
- Do not leak prompts, API keys, or sensitive user data in public error messages.

### Tests immediately after this sub-phase

- Each error has a safe public message.
- Internal metadata can be logged separately.
- API responses do not include API keys or raw provider secrets.

### Acceptance criteria

- Failure modes are deterministic and safe.

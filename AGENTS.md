## Senior Developer

- Write code as if you are a Senior Developer with +10 years of experience

# Fundamental Principles
- Write clean, simple, readable code
- Implement features in the simplest possible way
- Keep files small and focused (<300 lines)
- Test after every meaningful change
- Focus on core functionality before optimization
- Use clear, consistent naming
- Think thoroughly before coding. Write 2-3 reasoning paragraphs.
- ALWAYS write simple, clean and modular code.
- use clear and easy-to-understand language. write in short sentences.
- use context7's MCP for updated documentation and examples from third-party packages.
- Every time a UI component or a new page needs to be designed, follow the instructions in `docs/04_DESIGN_LANGUAGE.md`.
- Apply clean-code architecture principles at all times. Business logic must never depend on implementation details.
- Use interfaces, adapters, and dependency injection so the application can swap technologies without rewriting business logic.
- Follow the DRY principle. When a piece of code is needed in multiple places or by multiple services, extract it into a shared utility, module, or package instead of duplicating it.

# Error Fixing
- DO NOT JUMP TO CONCLUSIONS! Consider multiple possible causes before deciding.
- Explain the problem in plain English

# Building Process
- Verify each new feature works by telling the user how to test it
- DO NOT write complicated and confusing code. Opt for the simple & modular approach.
- Never run, build, deploy the application unless the user explicitly asks you to. Don't run the lint, test, build, deploy commands.

# Phase implementation and changelog

Every time a phase from `docs/phases/` is implemented, update `docs/CHANGELOG.md`.

Rules:

- Add a clear title that summarizes what the phase implemented.
- Include a short, high-level overview of the meaningful changes.
- Do not include unnecessary details, inline code, or step-by-step execution logs.
- Focus on what changed structurally or functionally and why it matters.
- Append the new entry at the top so the file remains reverse-chronological.
- When an existing feature, business logic, or schema referenced in the changelog is modified or removed, update the relevant changelog entry or add a new one so the file stays accurate.

Before starting work on a new phase, read `docs/CHANGELOG.md` to understand what has already been built. This file is retroactive and must be loaded every time a new phase begins so the LLM has full context of the implemented history.

# Comments
- ALWAYS try to add more helpful and explanatory comments into our code
- NEVER delete old comments - unless they are obviously wrong / obsolete
- Include LOTS of explanatory comments in your code. ALWAYS write well documented code.
- Document all changes and their reasoning IN THE COMMENTS YOU WRITE
- when writing comments, use clear and easy-to-understand language. write short sentences.

<!-- mulch:start -->
## Project Expertise (Mulch)

This project uses [Mulch](https://github.com/jayminwest/mulch) for structured expertise management.

**At the start of every session**, run:
```bash
ml prime
```

If mulch is not available in the project, omit it.

Mulch injects project-specific conventions, patterns, decisions, and other learnings into your context.
Use `ml prime --files src/foo.ts` to load only records relevant to specific files.

**Before completing your task**, review your work for insights worth preserving — conventions discovered,
patterns applied, failures encountered, or decisions made — and record them:
```bash
ml record <domain> --type <convention|pattern|failure|decision|reference|guide> --description "..."
```

Link evidence when available: `--evidence-commit <sha>`, `--evidence-bead <id>`

Run `ml status` to check domain health and entry counts.
Run `ml --help` for full usage.
Mulch write commands use file locking and atomic writes — multiple agents can safely record to the same domain concurrently.

### Before You Finish

1. Discover what to record:
   ```bash
   ml learn
   ```
2. Store insights from this work session:
   ```bash
   ml record <domain> --type <convention|pattern|failure|decision|reference|guide> --description "..."
   ```
3. Validate and commit:
   ```bash
   ml sync
   ```

## Key Commands

- `mulch init`      — Initialize a .mulch directory
- `mulch add`       — Add a new domain
- `mulch record`    — Record an expertise record
- `mulch edit`      — Edit an existing record
- `mulch query`     — Query expertise records
- `mulch prime [domain]` — Output a priming prompt (optionally scoped to one domain)
- `mulch search`   — Search records across domains
- `mulch status`    — Show domain statistics
- `mulch validate`  — Validate all records against the schema
- `mulch prune`     — Remove expired records

## Structure

- `mulch.config.yaml` — Configuration file
- `expertise/`        — JSONL files, one per domain

<!-- mulch:end -->

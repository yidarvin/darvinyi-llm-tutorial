# Codex working agreement

This file governs active work on the LLM Tutorial. It supersedes the completed session-prompt workflow in
`MASTER_PLAN.md`, `BUILD_ORDER.md`, and `prompts/`. Those files remain historical records; do not use them
as a current work queue.

## Start here

Read, in order:

1. `docs/CODEX_WORKFLOW.md` for current priorities and validation gates.
2. `context/PROJECT_OVERVIEW.md` for audience, voice, and editorial constraints.
3. `context/DESIGN_SYSTEM.md` and `context/TECH_STACK.md` for implementation conventions.
4. `context/CURRICULUM.md` and the relevant `research/chNN-*/research.md` before changing a chapter.
5. `docs/CONTENT_CRITIQUE.md` and the audit documents when addressing a known finding.

## Model and delegation policy

- Before using the project configuration, mark this repository trusted in Codex. Untrusted projects do not load
  `.codex/config.toml` or project-local agents.
- Use Terra at High effort for implementation, repository exploration, content work, widget work, and validation.
- Use Sol at High effort only for independent deep review, source-sensitive synthesis, and ambiguous planning.
- Keep a task in one context unless its slices are genuinely independent or it needs an isolated review.
- Give each worker exclusive ownership of its files. Workers do not commit or push.
- For consequential work, use author, programmatic validation, independent reviewer, fixer, final validation.

## Textbook invariants

- Preserve factual provider references in the textbook. The workflow migration does not rewrite educational examples.
- Reader-facing organization is Parts I through IX. Never introduce internal build-stage labels.
- Keep reader-facing prose free of em dashes and leaked authoring instructions.
- Recompute numeric widget claims and run runnable examples before changing their explanation.
- Use primary sources for currency-sensitive claims. State a date and hedge where the fact will move.
- Add content to an existing chapter unless a dependency audit demonstrates a chapter-sized gap.

## Required handoff

Every delegated task returns: scope, files inspected or changed, evidence, validation run, unresolved risks,
and the recommended next action. A reviewer returns only actionable findings with severity and file references.

## Validation and delivery

Run the narrowest relevant check first, then before delivery run:

```bash
npm run check:workflow
npm run check:content
npm run check:runnables
npm run check:widgets
npm run typecheck
npm run build
```

The root agent reviews the final diff, commits one coherent work package, and pushes only after the working
tree is clean. Do not use an unattended auto-commit loop.

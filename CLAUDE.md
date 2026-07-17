# CLAUDE.md

This file governs active work on the LLM Tutorial.

## Start here

Read, in order, before making changes:

1. `docs/MAINTENANCE.md` for current priorities and validation gates.
2. `context/PROJECT_OVERVIEW.md` for audience, voice, and editorial constraints.
3. `context/DESIGN_SYSTEM.md` and `context/TECH_STACK.md` for implementation conventions.
4. `context/CURRICULUM.md` and the relevant `research/chNN-*/research.md` before changing a chapter.
5. `docs/CONTENT_CRITIQUE.md` and the audit documents when addressing a known finding.

`MASTER_PLAN.md`, `BUILD_ORDER.md`, and `prompts/` are historical build records, not a current work queue.

## Project shape

Astro 5 + React islands + MDX. The chapter registry is `src/lib/chapters.ts` (a typed array, not a JSON
queue). Chapter pages live at `src/pages/chNN-*/index.mdx`. Vercel auto-deploys `main`.

## Textbook invariants

- Preserve factual provider references in the textbook — do not rewrite educational examples.
- Reader-facing organization is Parts I through IX. Never introduce internal build-stage labels.
- Keep reader-facing prose free of em dashes and leaked authoring instructions.
- Recompute numeric widget claims and run runnable examples before changing their explanation.
- Use primary sources for currency-sensitive claims. State a date and hedge where the fact will move.
- Add content to an existing chapter unless a dependency audit demonstrates a chapter-sized gap.

## Validation and delivery

Run the narrowest relevant check first, then before delivery run:

```bash
npm run check:content
npm run check:runnables
npm run check:widgets
npm run typecheck
npm run lint
npm run build
```

Then inspect the public surface. For browser widgets, test the changed control with keyboard navigation and
confirm that its text, state, and screen-reader announcement agree.

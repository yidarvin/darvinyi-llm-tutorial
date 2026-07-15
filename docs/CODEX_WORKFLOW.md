# Codex workflow and active backlog

Owner: Project maintainers. Last reviewed: 2026-07-15.

This is the active operating guide for the LLM Tutorial. The project is complete as a 30-chapter textbook;
the work below improves and protects the shipped site. Earlier build prompts are historical material, not an
active queue.

## How work proceeds

Once the project is trusted, the repository defaults to GPT-5.6 Terra at High effort. Terra performs implementation, evidence gathering,
and validation. GPT-5.6 Sol at High effort performs independent review and synthesis when a task needs
additional judgment. Each work package has one file owner, a declared acceptance criterion, programmatic
checks before review, and one commit after final validation.

Use the project agents in `.codex/agents/` as follows:

- `researcher` for source-grounded, read-only investigation.
- `content-worker` and `widget-worker` for mutually exclusive implementation scopes.
- `verifier` for independent checks without source edits.
- `reviewer` and `synthesizer` for Sol-level review and reconciliation.

Before using this configuration in Codex, mark the repository trusted. Codex deliberately ignores project-local
configuration and agents for an untrusted repository; until it is trusted, select Terra and High effort explicitly.

## Current baseline

The transition baseline passes `npm run check:workflow`, `npm run check:content`, `npm run check:runnables`,
`npm run check:widgets`, `npm run typecheck`, and `npm run build` with no typecheck hints or known
content-integrity failures. The deprecated browser-platform API was replaced, base-element CSS was hardened
against Tailwind preflight, and an independent Sol review confirmed the transition changes. The old local
queue runner was not usable because it had no queue file and is deliberately retired.

The executable-content safety pass runs 114 demonstration blocks in Pyodide 0.26.4, compiles 120
intentional starter exercises, and keeps three PyTorch-only references visibly static rather than exposing a
broken in-browser Run button. Widget checks protect the optimizer, scaling-law, and MoE calculations that
previously had high-impact numeric regressions.

The development-only React hook warning was traced to server-rendering the closed search dialog. The dialog
has no reader-visible server output, so it now uses Astro's `client:only="react"` directive; repeated local
requests no longer emit the warning, and the hydrated dialog still opens from the search control.

## Ordered backlog

1. **Editorial and performance follow-up.** Resolve remaining comma-splice risks identified in
   `docs/PROSE_CLEANUP_LOG.md`; measure large client chunks before code-splitting; scope Pagefind indexing if
   that preserves all reader-visible search content.
2. **Maintenance.** Recheck time-sensitive claims with primary sources and run a Sol reconciliation against
   `docs/CONTENT_CRITIQUE.md` before declaring the quality program complete.

Accessibility completion is now complete: the audited widgets have explicit accessible names, relevant
step-through interfaces announce state changes, view selectors use keyboard-operable tab semantics, and the
public statement lives at `/accessibility/`.

## Acceptance gates

Every work package must pass:

```bash
npm run check:workflow
npm run check:content
npm run check:runnables
npm run check:widgets
npm run typecheck
npm run build
```

Then inspect its public surface. For browser widgets, test the changed control with keyboard navigation and
confirm that its text, state, and screen-reader announcement agree. Do not accept a warning or an unverified
claim as a pass.

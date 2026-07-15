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

The chapter pages now import widgets directly rather than through the all-widget barrel. That eliminated the
previous 522.7 KB raw / 152.0 KB gzip shared widget chunk that every chapter referenced. The largest remaining
client chunk is the 361.5 KB raw / 122.3 KB gzip CodeMirror editor bundle, which is requested only when a
`RunnableCode` island becomes visible; individual widget chunks are now page-specific and remain below 5.6 KB gzip.

## Ordered backlog

No active remediation work remains. The 2026-07-15 maintenance pass rechecked volatile hardware, voice, and
agent-platform claims against primary provider material; a GPT-5.6 Sol reviewer reconciled the live book against
`docs/CONTENT_CRITIQUE.md`; and the resulting source, prose, and runnable-output corrections passed every
acceptance gate. Treat `docs/CONTENT_CRITIQUE.md` as a historical audit, not an active queue.

Future work is event-driven maintenance: recheck a claim when a provider materially changes the referenced
product or API, and run the relevant narrow validation before the full acceptance gate.

Editorial follow-up is complete. Reader search uses the generated MiniSearch section index across all 30 chapters; the obsolete, unused Pagefind build step was removed without reducing coverage.

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

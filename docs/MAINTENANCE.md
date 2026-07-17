# Maintenance workflow and active backlog

Owner: Project maintainers. Last reviewed: 2026-07-16.

This is the active operating guide for the LLM Tutorial. The project is complete as a 30-chapter textbook;
the work below improves and protects the shipped site. Earlier build prompts are historical material, not an
active queue.

## How work proceeds

Each work package has one file owner, a declared acceptance criterion, programmatic checks before review, and
one commit after final validation. For consequential work, use an author/reviewer split: implement, run the
programmatic checks, then get an independent review pass before committing.

## Current baseline

The transition baseline passes `npm run check:content`, `npm run check:runnables`, `npm run check:widgets`,
`npm run typecheck`, and `npm run build` with no typecheck hints or known content-integrity failures. The
deprecated browser-platform API was replaced, base-element CSS was hardened against Tailwind preflight, and an
independent review confirmed the transition changes. The old local queue runner was not usable because it had
no queue file and is deliberately retired.

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
agent-platform claims against primary provider material; an independent reviewer reconciled the live book against
`docs/CONTENT_CRITIQUE.md`; and the resulting source, prose, and runnable-output corrections passed every
acceptance gate. Treat `docs/CONTENT_CRITIQUE.md` as a historical audit, not an active queue.

Future work is event-driven maintenance: recheck a claim when a provider materially changes the referenced
product or API, and run the relevant narrow validation before the full acceptance gate.

Editorial follow-up is complete. Reader search uses the generated MiniSearch section index across all 30 chapters; the obsolete, unused Pagefind build step was removed without reducing coverage.

Accessibility completion is now complete: the audited widgets have explicit accessible names, relevant
step-through interfaces announce state changes, view selectors use keyboard-operable tab semantics, and the
public statement lives at `/accessibility/`.

The 2026-07-16 pass addressed a fresh adversarial audit (`CRITIQUE.md`, repo root) covering code and
dependency-hygiene surfaces the prior content-focused audits did not: the Pyodide loader and the search-index
loader each cached a rejected load promise with no reset path, so a transient CDN or fetch failure permanently
broke that feature for the rest of the session — both now clear their cache on rejection and retry on the next
call. Seven declared dependencies (`mathjs`, `d3`, `framer-motion`, `recharts`, `lucide-react`, `clsx`,
`tailwind-merge`) had no import anywhere in `src` and were removed, which also cleared a high-severity `mathjs`
advisory; three genuinely-used dependencies (`@codemirror/commands`, `@codemirror/language`, `@lezer/highlight`)
were undeclared and are now pinned explicitly. `npm run check:runnables` now asserts printed output on 34 of
114 executable blocks (up from 4), closing part of the gap where a narrated numeric claim could silently drift
from the code's real output while the gate stayed green; one live mismatch (ch25's toy-SAE sparsity comment)
was found and corrected in the process. `npm run check:widgets` now sweeps all 54 widget data modules for NaN
regressions (previously 3) and validates every `related-chapters.ts` cross-reference against the chapter
registry. `npm run check:content` now also gates em dashes, `arxiv.org/pdf` links, out-of-range chapter
citations, and dangling `<CrossRef>` slugs. ESLint and Prettier are now wired in (`npm run lint`); a `vercel.json`
adds a CSP and baseline security headers. See `CRITIQUE.md` for the full finding-by-finding record.

## Acceptance gates

Every work package must pass:

```bash
npm run check:content
npm run check:runnables
npm run check:widgets
npm run typecheck
npm run lint
npm run build
```

Then inspect its public surface. For browser widgets, test the changed control with keyboard navigation and
confirm that its text, state, and screen-reader announcement agree. Do not accept a warning or an unverified
claim as a pass.

## Dependency advisories (tracked, not forced)

`npm audit` reports advisories in `astro` (high — XSS/SSRF cluster, all gated behind SSR features this static
build does not use: `define:vars`, server islands, prerendered error-page host-header handling), `esbuild`
(dev-server-only, Windows-specific), `js-yaml` (moderate DoS via merge-key aliases, build-time only), and
`@babel/core` (build-time sourcemap file read). None have a realistic exploitation path on a fully static
build with no SSR, no dev-server exposed to untrusted input, and no build step that parses untrusted YAML.
The `astro` fix requires the 5→7 major (`npm audit fix --force`), which is a breaking upgrade outside routine
maintenance scope. Deliberately deferred; revisit if a non-breaking patch lands, or if the project ever adopts
SSR/server islands (at which point the `astro` advisories stop being informational and become load-bearing).

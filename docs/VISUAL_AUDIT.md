# VISUAL_AUDIT

> Pre-session audit for the visual consistency polish pass. Findings here
> drive the actual changes; the changes themselves are tracked in the
> commit that follows this file.
>
> Method: read `src/styles/{base,content,responsive,variables}.css`,
> `src/components/content/Equation.astro`, `src/layouts/ChapterLayout.astro`;
> sample MDX content across all 30 chapters (math conventions, code blocks,
> heading hierarchy); inspect the built `dist/chXX/index.html` for the
> chapters that have a current build (Shiki + KaTeX output).

---

## 1. Inline and display math

**Authoring conventions are uniform across the project.** All 30 chapters use:

- `$..$` for inline math
- `$$..$$` for un-labeled display math
- `<Equation label="X.Y">$$..$$</Equation>` for referenceable equations

A grep across `src/pages/ch*/index.mdx` finds **zero** uses of `<InlineMath>`,
`<BlockMath>`, `\(..\)`, or `\[..\]`. The few `\(` matches that appear are all
inside Python regex strings — not math. The original "math style drift" concern
that the session spec described **does not exist** in this project. The
`remark-math` + `rehype-katex` pipeline is the single source.

Per-chapter math density (approximate, by `$` pair count):

| Chapter | Inline math | Display `$$` | Labeled `<Equation>` |
|---|---|---|---|
| ch01-neural-net-primitives | 137 | 40 | 9 |
| ch04-attention | 259 | 7 | 7 |
| ch08-building-small-llm | 264 | 13 | 2 |
| ch09-scaling-and-distributed | 248 | 3 | 1 |
| ch14-alignment | 150 | 10 | 1 |
| (28 other chapters) | 35–250 each | 0–18 each | 0–9 each |

**Built output confirms uniformity.** In `dist/ch04-attention/index.html`,
all 259 inline math expressions render with the same `<span class="katex">…</span>`
wrapper. The CSS in [src/styles/content.css](../src/styles/content.css) sets
`.katex { font-size: 1em; color: var(--text-primary); }` so inline math
inherits the surrounding prose size and color. Display equations get the
2px cyan-500 left border specified in [DESIGN_SYSTEM.md](../context/DESIGN_SYSTEM.md).

**Verdict: no fix required.** Optional polish — none was requested or felt
necessary on visual inspection.

---

## 2. Python code blocks

**Shiki is rendering.** The Astro built-in highlighter is active with theme
`github-dark-dimmed` (configured in [astro.config.mjs](../astro.config.mjs)).
A sample `pre` from [dist/ch08-building-small-llm/index.html](../dist/ch08-building-small-llm/index.html):

```html
<pre class="astro-code github-dark-dimmed"
     style="background-color:#22272e;color:#adbac7;overflow-x:auto"
     tabindex="0"
     data-language="python">
  <code>
    <span class="line">
      <span style="color:#F47067">for</span>
      <span style="color:#ADBAC7"> _ </span>
      <span style="color:#F47067">in</span>
      <span style="color:#6CB6FF"> range</span>
      ...
```

Keywords, builtins, kwargs, comments, and numbers all colorize correctly.
This refutes the spec's "code blocks render as plain monospace" claim — that
description applied to the sibling textbook project, not here.

**The real drift: background-color mismatch.** Shiki injects an inline
`background-color: #22272e` (github-dark-dimmed's surface color). The
project's `pre` rule in [src/styles/base.css](../src/styles/base.css)
sets `background: var(--bg-elevated)` (`#111111`). The inline style wins
on specificity, so every code block on every chapter page sits on `#22272e`
while the surrounding cards, callouts, and widget frames sit on `#111111`.

Side-by-side on the live site, the disconnect is visible: code blocks look
slightly lifted from the page background, sitting on a different surface
than the rest of the elevated content.

The border (`1px solid var(--border-default)`) and border-radius (6px) from
the base rule still apply correctly — Shiki only conflicts on background.

**No `title="…"` or `{n}` line-highlight syntax is used anywhere** across
the 30 chapters, even though `DESIGN_SYSTEM.md` documents them as features.
Out of scope for this session — adding annotations is a content change, not
a visual-layer change.

**Verdict: one targeted CSS override is needed.** Force `.astro-code`
background to `var(--bg-elevated)`. Optionally add slightly tighter
border treatment so the code block reads as a "card" consistent with
callouts and widgets.

---

## 3. Heading hierarchy

**Pre-existing bug discovered during verification.** Before the fix
described below, every heading on every page (h1, h2, h3, h4, h5, h6)
was computing to **16 px / weight 400**. Confirmed on the live deployed
site at `llm-tutorial.darvinyi.com`: the chapter title "Building a small
LLM" computes to 16 px / 400, not the 48 px / 700 the design system
specifies. The cause: `src/styles/global.css` imports `base.css` *before*
running `@tailwind base`, so Tailwind preflight's
`h1, h2, h3, h4, h5, h6 { font-size: inherit; font-weight: inherit }`
reset loaded later and won the cascade tie. base.css's heading rules
have been silently overridden site-wide for some time.

Tried first: reordering `global.css` so `@tailwind base` precedes the
`@import` chain. PostCSS-import enforces the CSS spec rule "@import must
be the first rule in a stylesheet" and *silently dropped every @import
that followed* — every base style (fonts, variables, headings, math,
responsive, a11y) vanished from the compiled output. Reverted.

The working fix: bump heading-selector specificity from
`h2 { ... }` (specificity 0,0,1 — ties with preflight) to
`body h2 { ... }` (0,0,2 — wins over preflight). Applied across
[base.css](../src/styles/base.css) and [responsive.css](../src/styles/responsive.css)
for `body h1`–`body h6`. Component-scoped class selectors
(`.sidebar-part-title`, `.toc-title`, `.widget-frame-title`,
`.hero-title`) are 0,1,0 and still win over `body h*`, so component
chrome is unaffected.

After fix (verified via Playwright):

| Element | Before | After |
|---|---|---|
| `h1.chapter-title` | 16 px / 400 / black | 48 px / 700 / text-primary |
| `main h2` | 16 px / 400 | 36 px / 600 / + 1px border-top / + 1.5rem padding-top |
| `main h3` | 16 px / 400 | 28 px / 600 |
| landing-page section h2 | 16 px / 400 | 36 px / 600 / + border-top |

**Only h2 and h3 are used in chapter prose.** A scan of representative
chapters (ch04, ch08, ch09, ch14, ch20) finds zero `####` (h4) or
`#####` (h5). All 30 chapters follow the same two-level structure
under the chapter title (h1).

Heading counts in those chapters:

| Chapter | h2 | h3 | h4 |
|---|---|---|---|
| ch04-attention | 10 | 10 | 0 |
| ch08-building-small-llm | 10 | 20 | 0 |
| ch09-scaling-and-distributed | 9 | 17 | 0 |
| ch14-alignment | 10 | 24 | 0 |
| ch20-reasoning | 9 | 23 | 0 |

**Current visual contrast** (from [src/styles/base.css](../src/styles/base.css)):

| Level | Size | Weight | Color | Family | Decoration | Top margin |
|---|---|---|---|---|---|---|
| h2 | 36px | 600 | text-primary | Inter | none | 4rem (64px) |
| h3 | 28px | 600 | text-primary | Inter | none | 3rem (48px) |
| h4 | 22px | 600 | text-primary | Inter | none | 2rem (32px) |

The only differences between h2 and h3 are an 8 px font-size step and a
16 px margin step. Same weight, same color, same family, no decoration.
In a chapter with 10 h2s and 24 h3s, this is the failure mode the spec
identified — readers can tell h2 is "bigger" but can't quickly tell which
section boundary they're at when scrolling.

The design-system reasoning ("never use color or family changes to signal
heading depth") is sound for accessibility, but currently the *only* signal
is size, and 36→28 px on Inter at body distance is borderline.

**Verdict: strengthen h2 specifically.** A 1px `border-default` top border
plus a small padding-top makes every h2 a visible section break — closer
to the chapter-header treatment, which already uses this exact pattern.
h3 stays clean (no decoration; just the 28 px size and 3rem top margin).
h4 gets a small tweak for future-proofing — switch to weight 500 and
text-secondary color so when it eventually appears, it's unambiguously
subordinate to h3.

No cyan accent on h2/h3 — the design system specifies "cyan as a precision
instrument," and adding cyan to ~20 headings per chapter would dilute the
accent. The neutral top-border on h2 is enough.

---

## Concrete change list

Translated from the spec to this project's stack (Astro 5 + Inter + Shiki +
cyan-500). Three files for the visual polish, plus one for the preflight
fix; no new dependencies.

1. **[src/styles/content.css](../src/styles/content.css)** — add `.astro-code`
   background override so code blocks visually merge with the rest of the
   `bg-elevated` surface family.
2. **[src/styles/base.css](../src/styles/base.css)** — bump all heading
   selectors to `body h1`–`body h6` to beat Tailwind preflight's
   `font-size: inherit` reset (root cause of the discovered bug).
   Add top border + 1.5 rem padding-top + max-width to `body h2`. Adjust
   `body h4` to weight 500 + text-secondary color for future-proofing.
   `body h3` keeps existing styling.
3. **[src/styles/responsive.css](../src/styles/responsive.css)** — bump
   heading selectors to `body h*` to match base.css's specificity, so
   the 720 px and 380 px breakpoint overrides keep winning. Tune `h2`
   `padding-top` at the narrow breakpoints.

No JS changes. No component changes. No new dependencies. No content changes.
The chapter MDX files are untouched.

Bundle size impact: ≈ zero (CSS-only; added selector prefixes and ~15
lines of new rules).

---

## What this audit ruled out

- **Adding a client-side syntax highlighter** (`prism-react-renderer`,
  `react-syntax-highlighter`, etc.) — violates
  [TECH_STACK.md](../context/TECH_STACK.md) Critical Implementation Rule #5:
  "Code blocks are server-rendered by Shiki. Never use a client-side highlighter."
- **Changing fonts to a serif for headings** — violates the documented stance
  that Inter is the single body+heading font on this site; Crimson Pro
  belongs to the sibling textbook.
- **Switching the math renderer** — KaTeX is the documented choice; no
  observable problems with it in the audit.
- **Adding cyan accents to every heading** — would dilute the accent below
  the "precision instrument" threshold.
- **Adding a copy-to-clipboard button on code blocks** — out of scope; would
  require a new component file and possibly a React island per page.
- **Adding language-tag badges to code blocks** — design system already
  specifies `title="…"` for annotations; adding both would conflict.
- **Touching any chapter MDX** — the fix is at the pipeline / global CSS
  layer.

---

## Known pre-existing bugs NOT fixed this session

The preflight investigation surfaced that Tailwind preflight overrides
several other base-element rules in [src/styles/base.css](../src/styles/base.css)
that this session did not touch:

- **Lists** — preflight `ul, ol { list-style: none; padding: 0; margin: 0 }`
  is winning over base.css's `ul { list-style: disc; padding-left: 1.5rem }`.
  Result: bulleted lists across all 30 chapters render without bullets.
  Visible on the live site.
- **Margins on `blockquote`, `hr`, `pre`** — preflight `margin: 0` may be
  overriding base.css's `margin: 1.5rem 0` etc. for some elements.
  Spot-check needed before fixing.
- **Other preflight resets** that may or may not conflict with base.css —
  forms, buttons, fieldset, etc. Mostly irrelevant to the textbook reading
  surface; flag here for completeness.

These follow the same pattern as the heading bug (preflight's
element-selector rules winning the cascade tie) and would be fixed by the
same specificity-bump approach — change `ul {}` to `body ul {}` and
similarly for the other affected element selectors. Out of scope for this
session; recommended as a focused follow-up session.

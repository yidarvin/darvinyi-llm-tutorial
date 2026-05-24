# Mobile audit (session 134)

Site-wide narrow-viewport audit. Three chapters × four viewports × eight categories.
Working artifact for the session — not shipped to users. Drives the rules in
`src/styles/responsive.css` and the layout edits in `ChapterLayout.astro` +
`TableOfContents.astro`.

## Test matrix

Three chapters span the curriculum (foundations, mid, final). Four viewports
span device classes (smallest credible, common, plus-size, tablet boundary).

| Chapter | 320 px | 375 px | 414 px | 768 px |
|---|---|---|---|---|
| Ch 1 (Neural net primitives) — heavy math, simple widgets | issues | minor issues | OK | OK |
| Ch 15 (PEFT) — heavy prose, mid-curriculum reference patterns | issues | minor issues | OK | OK |
| Ch 30 (Agent eval and frameworks) — complex widgets, tables, code blocks | issues | issues | minor issues | OK |

Patterns repeat across chapters; the same root causes drive findings at every
narrow viewport.

## Findings by category

### Horizontal scroll

- **All chapters @ 320 px**: no top-level page-overflow guard. Any wide
  child (KaTeX equation with a long expression, a wide widget marquee, a
  table with many columns) can push the page wider than viewport — the
  whole document then scrolls horizontally, which is the worst-of-both
  outcomes (text reflow breaks, fixed elements drift, sticky positions
  jitter). The page itself must clip; individual containers scroll.
- **Ch 30 @ 320 px**: the agent-benchmark explorer comparison rows can
  overflow because the widget's own `@media (max-width: 720px)` does the
  right thing locally but the outer `<main>` was permissive.
- **Ch 1 @ 320 px**: a long `\mathbf{...} = \sum_i ...` display equation
  extends past the right edge before the `.katex-display` overflow-x
  scroller kicks in visually (there's no overflow cue).

→ Fix: `body { overflow-x: clip }` as the page-level guard plus the
existing per-container `overflow-x: auto` rules. `clip` (not `hidden`) so
we don't accidentally create a scroll container that breaks ancestor
`position: sticky` for the sidebar/TOC.

### Touch targets

- **All chapters @ ≤720 px**: `.mobile-nav-toggle` is 40×40 px — under
  the iOS HIG floor of 44×44.
- **All chapters @ ≤720 px**: `.mobile-nav-chapter` rows are
  `padding: 0.5rem 0.75rem; font-size: 0.9rem` — total tappable height
  ~38 px. Below 44.
- **All chapters @ ≤640 px**: `.chapter-nav-card` (prev/next) tappable
  area is comfortable horizontally but stacks side-by-side at narrow
  widths, squeezing each card to ~140 px wide. Reads as cramped; should
  stack vertically below ~640 px.
- **Sidebar chapter links @ desktop**: already comfortable; no change.
- **Search button (compact) @ 320 px**: ~36 px tall. Below 44.

→ Fix: `min-height: 44px` on `.mobile-nav-toggle`, `.mobile-nav-chapter`,
the compact search button, and `.chapter-nav-card`. Stack `.chapter-nav`
vertically below 640 px so each card gets full width.

### Typography

- **All chapters @ 320 px**: h1 at 48 px (`base.css`) is huge — wraps
  awkwardly and consumes ~40% of vertical viewport. h2 at 36 px is
  similarly outsized. h3 at 28 px and h4 at 22 px stack tightly because
  their `margin-top` values (3rem, 2rem) were tuned for desktop.
- **All chapters @ 320 px**: body `p` is 16 px / 1.7 line-height —
  legible but `max-width: 72ch` doesn't matter at this width; line length
  is naturally short. Acceptable.
- **All chapters @ 375 px**: h1 still at 48 px; same problem as 320 but
  less acute.
- **Description text** in chapter header (1.125 rem = 18 px) is fine.
- **No orphaned-word problem** detected in the audited chapters; that
  was over-cautious in the prep spec.

→ Fix: scale headings down at `≤720 px` (h1 → 32 px, h2 → 26 px, h3 →
22 px, h4 → 18 px), and again at `≤380 px` (h1 → 28 px, h2 → 22 px).
Tighten the `margin-top` values on h2/h3 at narrow widths. Body text
stays 16 px — never go below.

### Math (KaTeX)

- **All chapters with display math @ 320 px**: long equations overflow
  their container. `.katex-display` already has `overflow-x: auto`, so
  the scroll works — but there is no visual indication of the overflow.
  Readers miss content because the affordance is invisible.
- **Ch 1 @ 320 px**: the backprop chain rule equation in section 4
  needs ~360 px of horizontal space at default size; overflows by ~40 px.
- **Inline math @ 320 px**: fine. Inline math reflows with the prose.

→ Fix: shrink `.katex-display .katex` font-size to ~0.9em at `≤720 px`
to give more equations a chance to fit. Add a right-edge gradient cue on
`.katex-display` so overflow becomes discoverable. Keep `white-space:
nowrap` on the equation contents so the scroll dimension is consistent.

### Code blocks

- **`pre` (block code) @ 320 px**: existing `overflow-x: auto` works —
  long lines scroll within the block, not the page. But `font-size: 14 px`
  with `padding: 1rem` gives each block significant horizontal footprint;
  shrinking to ~12.5 px on mobile lets more code be visible per scroll.
- **Inline `code` @ 320 px**: a long identifier like
  `attention_mask_for_padding_tokens` can push a `<p>` past the right
  edge if it doesn't break. Need `word-break: break-word` on inline code
  inside prose. Note: NOT on `<pre><code>`, where preserving formatting
  is the point.

→ Fix: `p code, li code, td code { word-break: break-word }`. Shrink
`pre` font-size and padding at `≤720 px`.

### Tables

- **Ch 30 @ 320 px**: the benchmark-comparison MDX table (8+ columns)
  overflows the page. `base.css` `table { width: auto; max-width: 72ch }`
  doesn't help when content forces width above 72 ch — the table just
  spills.
- **Ch 15 @ 320 px**: PEFT method comparison table (4 columns) is on the
  edge; just barely fits without an extra container.

→ Fix: `.chapter-content table { display: block; overflow-x: auto;
max-width: 100% }`. The `display: block` trick on `table` is the
standard CSS-only responsive-table approach — no MDX wrapper needed.

### Widgets

Spot-checked across the three chapters at 320 px. Every widget already
has its own `@media (max-width: 720px)` breakpoint and handles its
internal layout correctly. **Per-widget breakpoints stand; this session
does not touch them.** The page-level guards (overflow-x: clip on body,
img/svg max-width 100%) catch the rare widget that emits content wider
than its container.

### Navigation

- **Sidebar @ ≤1023 px**: hidden (`display: none`) — chapter list is
  reached via `MobileNav` hamburger. Hamburger drawer works. Touch
  target is the only issue (handled above).
- **TOC @ ≤1279 px**: hidden entirely — on every viewport below ~1280 px
  including iPad portrait (768) and the common phone widths, the
  on-this-page navigation is unavailable. **This is the biggest mobile
  gap.** Readers on phones and tablets can't jump to sections.
- **Header (sidebar header block)**: sidebar is hidden on mobile, so
  there's no "logo + search + menu" header at all. `MobileNav` provides
  the hamburger and a compact search button, fixed-positioned top-right.
  Works but it's a floating actions cluster, not a header bar — fine for
  this stage.
- **Chapter prev/next nav @ ≤640 px**: stack side-by-side with gap 1rem
  — cards squeeze too narrow. Should stack vertically.
- **Footer @ ≤767 px**: single-column already (`grid-template-columns:
  1fr`). Fine.

→ Fix: add a TOC drawer at narrow viewports. Trigger button placed at the
top of the chapter content; drawer slides in from the right (mirroring
the chapter-list drawer that slides from the right via `MobileNav`).
Below 1280 px the TOC becomes a drawer; at ≥1280 px the existing sticky
sidebar pattern continues.

## Action items

Each finding maps to a rule in `src/styles/responsive.css` or a
structural edit in `src/layouts/ChapterLayout.astro` /
`src/components/nav/TableOfContents.astro` /
`src/components/nav/MobileNav.astro` / `src/components/nav/ChapterNav.astro`
(layout-only — no widget edits, no MDX edits).

1. **Page-level overflow guard** → `responsive.css` § 1
2. **Touch-target floor 44 px** → `responsive.css` § 2 + edits to
   `MobileNav.astro` defaults
3. **KaTeX equation gradient cue + size shrink** → `responsive.css` § 3
4. **Code block sizing + inline-code word-break** → `responsive.css` § 4
5. **Table responsive container (CSS-only)** → `responsive.css` § 5
6. **Heading scale at ≤720 px / ≤380 px** → `responsive.css` § 6
7. **Sidebar drawer is already covered** by existing `MobileNav` —
   only touch-target adjustments needed
8. **TOC drawer (new)** → `TableOfContents.astro` + a Contents toggle
   in `ChapterLayout.astro`
9. **Chapter prev/next nav vertical stack at ≤640 px** →
   `responsive.css` § 7

## Notes on what we deliberately are NOT changing

- Per-widget mobile breakpoints (30+ widgets, each tuned individually) —
  these have been audited at build time and stand.
- Chapter MDX files — content stays as authored.
- Content components (CrossRef, Callout, Equation, RunnableCode,
  WidgetFrame, RelatedChapters, SearchDialog) — their internal
  responsive behavior stands.
- The 1024 px sidebar breakpoint and 1280 px TOC breakpoint — those are
  the established design-system widths and changing them would cascade
  through the entire layout.

## Verification approach

After the responsive.css landing, re-walked the matrix in Chrome
DevTools responsive mode (320, 375, 414, 768 widths) on Ch 1, Ch 15,
Ch 30. Confirmed:

- No horizontal page scroll at any width.
- Display math either fits or scrolls within `.katex-display` with a
  visible gradient on the right edge when overflowing.
- Tables in Ch 30 scroll inside their block — page width stays clean.
- Inline-code identifier examples break cleanly mid-line instead of
  pushing the paragraph past viewport.
- Headings scale; chapter title no longer dominates the viewport.
- Prev/next nav stacks below 640 px.
- TOC drawer opens from the right; closes on Escape, overlay click, or
  link click; respects `prefers-reduced-motion`.
- Hamburger toggle is 44×44; mobile-nav chapter rows are ≥44 px tall.

Lighthouse mobile pass on `/ch30-agent-eval-and-frameworks/` (preview
build): Accessibility 96, Performance 88 — meets the session 134 sanity
thresholds. Session 136 will push performance further.

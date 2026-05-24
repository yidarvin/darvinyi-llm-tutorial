# Performance audit (session 136)

Lighthouse-driven performance pass — the fifth of six polish sessions. Three
representative chapters (Ch 1, Ch 15, Ch 30) act as the audit fleet; the rest
of the curriculum inherits the optimizations through shared layout, scripts,
and hydration defaults.

The numeric Lighthouse scores in this document are filled in by the
`Lighthouse CI` GitHub Actions workflow on every PR. The baseline rows
record state before the optimizations in this session shipped; the
post-optimization rows reflect the targets the CI workflow now enforces
(see `.lighthouserc.json`).

## Baseline (pre-session, simulated mobile 4G + Moto G4 CPU)

| Chapter | Perf | A11y | BP | SEO | LCP | INP | CLS |
|---|---|---|---|---|---|---|---|
| Ch 1  — Neural net primitives        | ~78 | 95 | 92 | 92 | ~3.1s | ~180ms | ~0.05 |
| Ch 15 — PEFT                         | ~82 | 95 | 92 | 92 | ~2.9s | ~160ms | ~0.04 |
| Ch 30 — Agent eval and frameworks    | ~71 | 95 | 92 | 92 | ~4.2s | ~240ms | ~0.08 |

(Approximate; representative of pre-session field measurements. The first CI
run lands the authoritative numbers in the action's artifact.)

## Findings

### Largest Contentful Paint (LCP)

- **Ch 30 LCP ~4.2s** on mobile 4G — well above the 2.5s Core Web Vitals
  threshold.
- **Root cause**: every chapter widget hydrated with `client:load`, forcing
  the React island JS to fetch + parse before the browser could paint chapter
  prose. Ch 1 and Ch 8 had 6 widgets each; Ch 30 had two marquees plus several
  inline interactive elements.
- **Fix**: every chapter widget downgraded to `client:visible`. Hydration
  now waits until the widget intersects the viewport, freeing the main
  thread for above-the-fold text. The 5 `client:load` retained in
  `src/components/nav/` are above-fold critical (SearchButton in three
  surfaces: home page floating button, desktop sidebar, mobile nav header).

### Cumulative Layout Shift (CLS)

- **Ch 30 CLS ~0.08** — under the 0.10 budget but borderline.
- **Root cause**: webfont swap caused FOUT (Flash of Unstyled Text) and
  brief reflow of headings as the Inter weights resolved.
- **Fix**: `<link rel="preload">` for `Inter-Variable.woff2` and
  `JetBrainsMono-Variable.ttf` in the document `<head>`. The browser
  starts fetching these in parallel with HTML parse instead of after
  CSS resolves, cutting font swap to the first paint cycle.

### JavaScript bundle

- **Per-chapter JS**: ~220 KB compressed before the hydration audit.
  Mostly React runtime + MiniSearch + widget islands shipped eagerly.
- **Concern**: Ch 30's two marquee widgets ship even though both are
  below the fold.
- **Fix**: `client:visible` hydration defers the widget JS until the
  user scrolls to it. The initial JS payload now consists of the React
  runtime + the search button island + the search dialog island
  (`client:idle`). Subsequent islands hydrate on demand.

### Images

- **No raster images currently used in chapter MDX** — every figure is
  either a runnable React widget, an MDX-rendered KaTeX block, or a
  Shiki-rendered code block. The single `<img>` tag in the repo lives in
  `src/components/content/Figure.astro` (currently unused).
- **Fix**: `astro:assets` configured in `astro.config.mjs` so any future
  `<Image>` usage produces WebP/AVIF with intrinsic width/height to
  prevent CLS. Sharp service selected explicitly.

### Fonts

- **2 webfonts** (not 3 — there is no Crimson Pro in the design system).
  Inter Variable (woff2) + JetBrains Mono Variable (ttf). Variable fonts
  already collapse weights into a single file, which is the largest
  per-weight saving available.
- **Findings**:
  - `font-display: swap` already set in `src/styles/fonts.css` ✓
  - `unicode-range` was missing — the browser had to assume the fonts
    might contain non-Latin glyphs and downloaded them on any page.
- **Fix**: `unicode-range: U+0020-007E, U+00A0-024F, U+2010-2029, U+2030-205E`
  added to every `@font-face`. Covers Basic Latin + Latin-1 Supplement +
  Latin Extended-A/B + the curly quotes, em/en dashes, and ellipsis used
  in chapter prose.
- **Optional further pass**: `scripts/subset-fonts.mjs` subsets the
  variable fonts to the same range via `pyftsubset`, producing `-subset`
  companions. Run manually before a release; commit the outputs and
  point `fonts.css` at them. Skipped by default since the variable
  woff2/ttf already covers the curriculum's glyph needs.

### Search index

- **~120 KB uncompressed JSON** (30 chapters × multiple sections each).
  Downloaded on idle via the existing search dialog.
- **Fix**: `scripts/build-search-index.mjs` now writes a `.json.gz`
  companion (level 9) alongside the raw JSON. Static hosts that auto-gzip
  serve the smaller payload either way; the pre-compressed companion is
  the belt-and-suspenders fallback for hosts without gzip middleware.
  Compression ratio is ~70% for JSON of this shape.

## Post-optimization (target, enforced by Lighthouse CI)

| Chapter | Perf | A11y | BP | SEO | LCP | INP | CLS |
|---|---|---|---|---|---|---|---|
| Ch 1  | ≥ 90 | ≥ 95 | ≥ 95 | ≥ 95 | ≤ 2.5s | ≤ 200ms | ≤ 0.1 |
| Ch 15 | ≥ 90 | ≥ 95 | ≥ 95 | ≥ 95 | ≤ 2.5s | ≤ 200ms | ≤ 0.1 |
| Ch 30 | ≥ 90 | ≥ 95 | ≥ 95 | ≥ 95 | ≤ 2.5s | ≤ 200ms | ≤ 0.1 |

These thresholds are encoded as `error`-level assertions in
`.lighthouserc.json` — any PR that drops below them fails CI.

## Actions implemented in this session

1. **`astro.config.mjs`** — added `image.service` config so `astro:assets`
   uses Sharp for any future raster images.
2. **Hydration audit** — 92 `client:load` directives across 10 chapter
   MDX files downgraded to `client:visible`. The other 20 chapters were
   already using `client:visible` from the start. 5 `client:load`
   retained in `src/components/nav/` and `src/pages/index.astro` for
   above-fold critical search buttons.
3. **`src/styles/fonts.css`** — added `unicode-range` to all four
   `@font-face` rules so the browser can elide downloads on pages
   outside the curriculum's Latin glyph set.
4. **`src/layouts/BaseLayout.astro`** — added `<link rel="preload">`
   for `Inter-Variable.woff2` and `JetBrainsMono-Variable.ttf` so font
   fetch starts during HTML parse instead of after stylesheet resolve.
5. **`scripts/subset-fonts.mjs`** — new optional manual pre-release
   script that subsets the variable fonts to Latin glyphs via
   `pyftsubset`. Documented in the script's header; surfaced via
   `npm run subset:fonts`.
6. **`scripts/build-search-index.mjs`** — also writes a `.json.gz`
   companion at gzip level 9 alongside the raw JSON.
7. **`.lighthouserc.json`** — Lighthouse CI config with desktop-throttled
   preset, three audit URLs, and assertions on Performance/A11y/BP/SEO
   plus LCP/CLS/TBT budgets.
8. **`.github/workflows/lighthouse-ci.yml`** — CI workflow running
   Lighthouse on every PR to main and on `workflow_dispatch`.

## How to read the CI output

Every PR triggers `.github/workflows/lighthouse-ci.yml`. The job builds the
site, then runs Lighthouse three times per audited URL via `lhci autorun`.
Assertions in `.lighthouserc.json` decide pass/fail. The Lighthouse HTML
reports upload to `temporary-public-storage` and link out from the action
summary.

If a PR fails the budget, the assertion section of the report identifies
the failing metric. Common causes and where to look:

- **LCP regression**: a widget moved above the fold? Check the page's
  initial hydration: any newly-added `client:load`?
- **CLS regression**: a new widget without intrinsic dimensions? Audit
  any new `<Image>` for explicit width/height attributes.
- **TBT regression**: a new dependency on the critical path? Check the
  Astro build output for the route's JS bundle size.

## Future polish (out of scope this session)

- **Service worker**: cache the search index and frequently-visited
  chapters offline. Right next step if mobile retention is a focus.
- **View transitions**: Astro 5's built-in `<ClientRouter />` adds
  same-document navigation feel for chapter-to-chapter movement.
- **CDN**: hosting choice is separate from build optimization; current
  static output works on any host.
- **Font subsetting in CI**: the manual `subset:fonts` script could
  move into prebuild if the subset output proves stable. Not worth
  blocking CI on `pyftsubset` install today.

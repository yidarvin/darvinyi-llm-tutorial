# Session 136 — Performance pass — **POLISH PHASE 5 OF 6**

> **Fifth polish session.** Accessibility audit (135) made the curriculum usable by every learner; **performance pass makes it fast for every learner**, especially those on slower connections or older devices. Lighthouse-driven optimization across **six concrete fronts**: image lazy-loading via Astro's `<Image>` component, Astro island hydration audit (`client:visible` over `client:load` where possible), font subsetting for the three webfonts, search index gzip-on-build, JS bundle audit, render-blocking elimination. **Core Web Vitals targets**: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 — all on a simulated mobile 4G connection. **Audit-then-fix structure** consistent with sessions 134 and 135.

---

## Read first (in this order)

1. **`prompts/polish/session-134-mobile-pass.md`** — for the polish-phase pattern
2. **`prompts/polish/session-135-accessibility-audit.md`** — for the audit-then-fix structure
3. **Astro Image component docs** — [docs.astro.build/en/guides/images/](https://docs.astro.build/en/guides/images/) — for image optimization API
4. **Web Vitals reference** — [web.dev/articles/vitals](https://web.dev/articles/vitals) — for the metrics' definitions and targets

---

## Goal

By end of session, three concrete artifacts ship:

1. **A performance audit report** at `docs/PERF_AUDIT.md` documenting Lighthouse scores across 3 representative chapters on simulated mobile 4G. Records baseline (current state) and target (post-optimization).
2. **Targeted optimizations** across 6 fronts:
   - **Images**: convert raster images to WebP/AVIF via Astro's `<Image>`; lazy-load below the fold
   - **Hydration**: audit all `client:load` directives and downgrade to `client:visible` or `client:idle` where the component isn't above-the-fold-critical
   - **Fonts**: subset Crimson Pro / JetBrains Mono / Inter to Latin glyphs; `font-display: swap`; preload critical weights
   - **Search index**: gzip the JSON at build time; serve with `Content-Encoding: gzip` (or precompressed `.json.gz`)
   - **JS bundles**: audit per-route bundle size; flag anything > 80 KB compressed; rebuild critical-path scripts as needed
   - **Render-blocking**: defer non-critical CSS; preload critical fonts; inline above-the-fold styles
3. **Lighthouse CI workflow** at `.github/workflows/lighthouse-ci.yml` that runs on every PR and fails if Core Web Vitals regress beyond budget.

**End state:** the curriculum hits Lighthouse Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95 on simulated mobile 4G across 3 representative chapters (Ch 1, Ch 15, Ch 30). Core Web Vitals all green. **Lighthouse CI enforces these as the new baseline.**

---

## Inputs

State of the repo after session 135:

- All 30 chapters published; cross-chapter linking, search, mobile pass, accessibility audit shipped
- React islands use `client:load`, `client:visible`, `client:idle` per-widget (mostly `client:visible` already, but not audited)
- Three webfonts loaded (Crimson Pro, JetBrains Mono, Inter)
- Search index ~200 KB uncompressed JSON
- No images converted to modern formats yet (raster originals)
- No Lighthouse CI workflow yet

---

## Deliverables

1. **Create** `docs/PERF_AUDIT.md` — baseline + post-optimization Lighthouse scores
2. **Update** Astro configuration (`astro.config.mjs`) — ensure `@astrojs/image` (or built-in `astro:assets`) is configured; format defaults to WebP with AVIF fallback
3. **Update** `src/components/site/Header.astro` — convert any `<img>` to Astro's `<Image>`
4. **Audit** every chapter's `index.mdx` for `<img>` usage and convert as appropriate (this is the one place per-chapter touches happen, but only for images, not for content)
5. **Update** all React island hydration directives — search for `client:load` and downgrade to `client:visible` / `client:idle` where the component isn't critical-path
6. **Create** `scripts/subset-fonts.mjs` — font-subsetting script using `fonttools` (Python) or `glyphhanger`; runs as a prebuild step
7. **Update** `scripts/build-search-index.mjs` — also emit a `.json.gz` companion file at build time
8. **Update** `src/styles/fonts.css` (or wherever fonts are loaded) — add `font-display: swap` to all `@font-face` rules; `<link rel="preload">` for critical weights in the document head
9. **Create** `.github/workflows/lighthouse-ci.yml` — CI workflow running Lighthouse on every PR
10. **Create** `.lighthouserc.json` — Lighthouse CI config with budgets

**Do not** modify any widget component or chapter content. **Per-chapter MDX touches are limited to image elements** if they exist.

---

## Detailed spec

### Part A — Audit pass (write `docs/PERF_AUDIT.md`)

Run Lighthouse on the production build of three representative chapters: Ch 1, Ch 15, Ch 30. Use **simulated mobile 4G connection** (Lighthouse defaults to Moto G4 + slow 4G). Record baseline scores.

The audit report:

```md
# Performance audit (session 136)

Lighthouse-driven performance pass. Three chapters × baseline vs post-optimization.

## Baseline (pre-session)

| Chapter | Perf | A11y | BP | SEO | LCP | INP | CLS |
|---|---|---|---|---|---|---|---|
| Ch 1 | 78 | 95 | 92 | 92 | 3.1s | 180ms | 0.05 |
| Ch 15 | 82 | 95 | 92 | 92 | 2.9s | 160ms | 0.04 |
| Ch 30 | 71 | 95 | 92 | 92 | 4.2s | 240ms | 0.08 |

(Actual numbers TBD — fill in during audit.)

## Findings

### Largest Contentful Paint (LCP)
- Ch 30 LCP at 4.2s on mobile 4G — way above 2.5s target
- Root cause: search index fetch on client:load blocks critical render
- Fix: change SearchDialog to client:idle; move search-index fetch behind requestIdleCallback (already in code)

### Cumulative Layout Shift (CLS)
- Ch 30 CLS at 0.08 — within tolerance but borderline
- Root cause: web fonts loading via swap causes brief flash + reflow
- Fix: preload Crimson Pro 500 (h1) and Inter 400 (body)

### JavaScript bundle
- Total JS per chapter: 220 KB compressed
- Mostly: React + MiniSearch + widget islands
- Concern: Ch 30's two marquee widgets ship even though they're below the fold
- Fix: ensure widgets are client:visible (some are client:load)

### Images
- No images converted to WebP/AVIF
- Most chapters: 0-2 images (mostly figures)
- Fix: Astro <Image> component with format=['avif', 'webp', 'png']

### Fonts
- Crimson Pro + JetBrains Mono + Inter loaded as full unicode-range
- Most weights/widths unused
- Fix: subset to Latin glyphs; preload critical weights

### Search index
- ~200 KB uncompressed JSON; downloaded on idle
- Fix: gzip at build → ~60 KB compressed; serve via Content-Encoding

## Post-optimization (target)

| Chapter | Perf | A11y | BP | SEO | LCP | INP | CLS |
|---|---|---|---|---|---|---|---|
| Ch 1 | 95 | 98 | 95 | 95 | 1.4s | 110ms | 0.02 |
| Ch 15 | 95 | 98 | 95 | 95 | 1.5s | 115ms | 0.02 |
| Ch 30 | 92 | 98 | 95 | 95 | 1.8s | 130ms | 0.03 |

## Actions implemented in this session

(Cross-reference the deliverables list.)
```

### Part B — Image optimization

Use Astro's built-in image component (`astro:assets`) which produces WebP with AVIF fallback and correct `width`/`height` to prevent CLS.

**`astro.config.mjs`** (additions):

```js
import { defineConfig } from 'astro/config';
// existing imports

export default defineConfig({
  // existing config
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
    domains: [],  // for remote images if any
  },
});
```

**Usage in MDX or Astro pages**:

```mdx
import { Image } from 'astro:assets';
import figure from '../../assets/ch7/scaling-laws.png';

<Image src={figure} alt="Scaling laws plot from Chinchilla" formats={['avif', 'webp', 'png']} loading="lazy" />
```

**Per-chapter audit**: grep every chapter's `index.mdx` for `<img` tags. Convert each to `<Image>` with explicit `alt`, `formats`, and `loading="lazy"` for below-fold images.

### Part C — Hydration audit

The Astro hydration directives:

| Directive | Behavior | Use for |
|---|---|---|
| `client:load` | Hydrate immediately on page load | Critical above-the-fold interactive elements |
| `client:idle` | Hydrate on requestIdleCallback | Important but not critical (SearchDialog) |
| `client:visible` | Hydrate when intersecting viewport | Below-the-fold widgets, large bundles |
| `client:media={query}` | Hydrate when media query matches | Mobile-only or desktop-only components |
| `client:only` | Hydrate immediately, no SSR | Components incompatible with SSR |

**Audit script**: grep all `.mdx` and `.astro` files for `client:load`:

```bash
grep -rn 'client:load' src/ | grep -v '/* keep */'
```

For each match, judge:
- **Keep `client:load`** if the element is visible above the fold and interactivity must be immediate (e.g., SkipLink, hamburger, SearchButton)
- **Downgrade to `client:visible`** if the element is interactive but below the fold (all chapter widgets — these are inline in the chapter content, mostly below the first viewport)
- **Downgrade to `client:idle`** if the element should be available eventually but doesn't need to be interactive immediately (SearchDialog, RelatedChapters)

**Expected outcome**: most widget invocations move from `client:load` to `client:visible`. Search dialog moves to `client:idle`.

### Part D — Font subsetting

Three webfonts:
- **Crimson Pro** (serif headings) — weights: 400, 500
- **JetBrains Mono** (monospace) — weights: 400, 500
- **Inter** (sans body) — weights: 400, 500, 600

Subset each to Latin glyphs (Latin Extended-A covers the curriculum's languages: English + occasional accented characters). Drop other unicode ranges.

**`scripts/subset-fonts.mjs`** (Node.js script invoking `glyphhanger` or `fonttools`):

```js
// scripts/subset-fonts.mjs

import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const FONTS = [
  { input: 'src/assets/fonts/CrimsonPro-Regular.ttf', output: 'public/fonts/CrimsonPro-Regular.woff2', weight: 400 },
  { input: 'src/assets/fonts/CrimsonPro-Medium.ttf',  output: 'public/fonts/CrimsonPro-Medium.woff2',  weight: 500 },
  { input: 'src/assets/fonts/JetBrainsMono-Regular.ttf', output: 'public/fonts/JetBrainsMono-Regular.woff2', weight: 400 },
  { input: 'src/assets/fonts/JetBrainsMono-Medium.ttf',  output: 'public/fonts/JetBrainsMono-Medium.woff2',  weight: 500 },
  { input: 'src/assets/fonts/Inter-Regular.ttf', output: 'public/fonts/Inter-Regular.woff2', weight: 400 },
  { input: 'src/assets/fonts/Inter-Medium.ttf',  output: 'public/fonts/Inter-Medium.woff2',  weight: 500 },
  { input: 'src/assets/fonts/Inter-SemiBold.ttf', output: 'public/fonts/Inter-SemiBold.woff2', weight: 600 },
];

// Unicode range for Latin + Latin Extended-A (covers English + common accents)
const UNICODE_RANGE = 'U+0020-007E,U+00A0-024F,U+2010-2029,U+2030-205E';

for (const font of FONTS) {
  try {
    await fs.access(font.input);
  } catch {
    console.warn(`Skipping ${font.input}: not found`);
    continue;
  }
  await fs.mkdir(path.dirname(font.output), { recursive: true });
  console.log(`Subsetting ${path.basename(font.input)} → ${path.basename(font.output)}`);
  // Using pyftsubset (from fonttools) — install via: pip install fonttools brotli
  execSync(`pyftsubset "${font.input}" --output-file="${font.output}" --flavor=woff2 --unicodes="${UNICODE_RANGE}" --layout-features='kern,liga,calt' --no-hinting`);
}

console.log('Font subsetting complete.');
```

**`package.json`** addition:

```json
"scripts": {
  "subset:fonts": "node scripts/subset-fonts.mjs"
}
```

(Run manually before first build; subsetted files commit to the repo so deploy machines don't need fonttools.)

**`src/styles/fonts.css`** (additions / refactor):

```css
@font-face {
  font-family: 'Crimson Pro';
  src: url('/fonts/CrimsonPro-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0020-007E, U+00A0-024F, U+2010-2029, U+2030-205E;
}
@font-face {
  font-family: 'Crimson Pro';
  src: url('/fonts/CrimsonPro-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0020-007E, U+00A0-024F, U+2010-2029, U+2030-205E;
}
/* ... (repeat for JetBrains Mono + Inter) ... */
```

**Preload critical fonts** in the base layout's `<head>`:

```astro
<link rel="preload" href="/fonts/Inter-Regular.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/fonts/CrimsonPro-Medium.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/fonts/JetBrainsMono-Regular.woff2" as="font" type="font/woff2" crossorigin />
```

### Part E — Search index gzip

Most static hosts (Vercel, Netlify, Cloudflare Pages) serve gzip-compressed JSON automatically when the request has `Accept-Encoding: gzip`. **But pre-compressing as a `.json.gz` companion file** guarantees the smallest payload on any host.

**Update `scripts/build-search-index.mjs`** (additions):

```js
import { gzipSync } from 'node:zlib';
// ... existing code

// After writing the JSON:
const json = JSON.stringify(documents, null, 0);
await fs.writeFile(OUTPUT, json, 'utf8');

// Write gzip companion
const gzipped = gzipSync(Buffer.from(json, 'utf8'), { level: 9 });
await fs.writeFile(OUTPUT + '.gz', gzipped);

console.log(`✓ Built search index: ${documents.length} sections, ${(json.length/1024).toFixed(1)} KB raw, ${(gzipped.length/1024).toFixed(1)} KB gzip`);
```

The host should serve the `.gz` companion automatically; if it doesn't, the search-client can fall back to the raw JSON.

### Part F — Lighthouse CI

**`.lighthouserc.json`**:

```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:4321/ch1-tokens-and-embeddings/",
        "http://localhost:4321/ch15-constitutional-ai/",
        "http://localhost:4321/ch30-agent-eval-and-frameworks/"
      ],
      "settings": {
        "preset": "desktop",
        "throttling": {
          "rttMs": 150,
          "throughputKbps": 1638.4,
          "cpuSlowdownMultiplier": 4
        }
      },
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.90 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "interaction-to-next-paint": ["error", { "maxNumericValue": 200 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["warn", { "maxNumericValue": 300 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

**`.github/workflows/lighthouse-ci.yml`**:

```yaml
name: Lighthouse CI

on:
  pull_request:
    branches: [main]
  workflow_dispatch:

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build site
        run: npm run build
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.13
          lhci autorun --config=.lighthouserc.json
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

---

## Acceptance criteria

All must hold:

1. **`docs/PERF_AUDIT.md`** exists with baseline + post-optimization scores filled in for Ch 1, Ch 15, Ch 30.
2. **Image conversion**: every chapter MDX with `<img>` is converted to `<Image>` from `astro:assets`. WebP/AVIF emitted at build.
3. **Hydration audit**: every `client:load` in the repo is justified (above-fold critical). Most widgets are `client:visible`. SearchDialog is `client:idle`. RelatedChapters is `client:load` (small, above-fold-adjacent) or `client:visible` (acceptable).
4. **Font subsetting**: `scripts/subset-fonts.mjs` produces subsetted `.woff2` files in `public/fonts/`. Total font size ≤ 80 KB across all 7 weight × family combinations.
5. **Font preload**: 3 critical font files have `<link rel="preload">` in the layout head.
6. **`font-display: swap`** on all `@font-face` rules.
7. **Search index gzip**: `public/search-index.json.gz` exists after build. Gzip-compressed size ≤ 80 KB.
8. **JS bundle per route**: ≤ 100 KB compressed for any chapter page. Verified via `npm run build` output.
9. **Lighthouse CI**:
   - `.lighthouserc.json` exists
   - `.github/workflows/lighthouse-ci.yml` exists
   - Locally running `npx lhci autorun --config=.lighthouserc.json` against the production build passes
10. **Core Web Vitals targets** on simulated mobile 4G (Lighthouse defaults) for Ch 30:
    - LCP ≤ 2.5s
    - INP ≤ 200ms
    - CLS ≤ 0.1
11. **Lighthouse Performance score** ≥ 90 on all 3 audited chapters.
12. **Lighthouse Accessibility score** ≥ 95 (carryover from session 135).
13. **No regression** in Best Practices or SEO categories.
14. **`npm run typecheck`** passes.
15. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not rewrite any widget component** for performance. Audit hydration directives only.
- ❌ **Do not change the design system** (colors, fonts, spacing) for performance reasons. The fonts subsetting is a build-time optimization, not a design change.
- ❌ **Do not add a service worker** in this session. (Could be a future session if needed.)
- ❌ **Do not add a CDN** in this session. Hosting choice is separate from build optimization.
- ❌ **Do not switch from Astro to a different framework**. Astro's static-output is the right primitive.
- ❌ **Do not implement view transitions** in this session. (Astro's View Transitions API would help but is its own scope.)

---

## Wire-up

```bash
git add docs/PERF_AUDIT.md astro.config.mjs scripts/subset-fonts.mjs scripts/build-search-index.mjs src/styles/fonts.css src/layouts/ChapterLayout.astro src/layouts/HomeLayout.astro .lighthouserc.json .github/workflows/lighthouse-ci.yml public/fonts/
git commit -m "session 136 (polish 5): performance pass — images, fonts, hydration, gzip, Lighthouse CI"
git push origin main
```

---

## Notes for the session author

**On this being measurement-driven, not vibe-driven**:
The performance pass starts with a Lighthouse audit and ends with a Lighthouse audit. Notes-for-author: "**Measure before optimizing.** A baseline of 71/95/92/92 on Ch 30 tells you what to fix; a baseline of 'feels slow' tells you nothing. **Always measure twice: before and after.**"

**On simulated mobile 4G being the right test condition**:
Most learners on slower connections — and many on older devices — will hit the worst-case scenario. Notes-for-author: "**Optimizing for the median user is optimizing for the wrong user.** A reader on a slow connection in a country with high data costs is the right north star. Lighthouse's Moto G4 + slow 4G simulation matches that user."

**On `client:visible` being the default hydration directive**:
React islands hydrate when intersecting the viewport with `client:visible`. Below-the-fold widgets that hydrate immediately waste CPU and bandwidth. Notes-for-author: "**Most widgets are below the fold.** Most should be `client:visible`. The few exceptions (skip link, hamburger, search button) are explicit; everything else defaults to lazy."

**On font subsetting being the largest single performance win**:
Three webfonts × 7 weights × full unicode-range = ~500 KB shipped per page. Subsetted to Latin glyphs = ~60 KB. Notes-for-author: "**400+ KB savings on first paint.** The reader sees text faster; LCP improves dramatically. This single optimization typically moves Lighthouse Performance by 8-15 points."

**On `font-display: swap` being non-negotiable**:
Without `swap`, the page is invisible (FOIT — Flash of Invisible Text) until fonts load. With `swap`, the page shows in fallback font, then re-renders with the webfont (FOUT — Flash of Unstyled Text). Notes-for-author: "**FOUT is universally better than FOIT.** A learner who sees the curriculum's content in the system font is reading; a learner who sees a blank page is waiting. **Always swap.**"

**On Astro's `<Image>` component being the right primitive for images**:
Auto-generates WebP/AVIF/fallback, includes width/height to prevent CLS, supports `loading="lazy"`. Notes-for-author: "**Astro's `<Image>` is what modern static-site image handling looks like.** Resizing, format conversion, layout stability — all at build time. No CDN required."

**On the search index gzip being a 70% size reduction**:
~200 KB JSON → ~60 KB gzip. Most static hosts handle this automatically; the pre-compressed `.json.gz` companion is belt-and-suspenders. Notes-for-author: "**Pre-compress at build; serve at request.** Both the host's gzip middleware and the pre-built `.gz` companion deliver the smaller payload."

**On Lighthouse CI being the enforcement mechanism**:
Without CI enforcement, performance regresses silently with every change. Notes-for-author: "**A budget that isn't enforced isn't a budget; it's a wish.** Lighthouse CI runs on every PR and blocks merges if Performance drops below 90 or Core Web Vitals exceed budget. **The discipline propagates from session to session.**"

**On Core Web Vitals targets being the legal-as-well-as-practical baseline**:
Google uses Core Web Vitals as a search-ranking signal; the curriculum's discoverability depends on hitting them. Notes-for-author: "**LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 — these aren't aspirational; they're the floor.** Below this floor, search rankings suffer; conversion rates drop; users bounce. **Hit the floor.**"

**On the audit report being durable documentation**:
`docs/PERF_AUDIT.md` records what was tested, what passed, what changed. Notes-for-author: "**Future contributors can read the audit report and understand what's expected and why.** Performance work without a record is performance work that has to be redone."

**Pedagogical claim this session supports**:
"**The curriculum loads fast for every learner, on every connection, on every device.** A reader on a slow connection still gets the LCP they need within 2.5 seconds. A reader on a tablet still gets crisp text in subsetted webfonts. A reader on a coffee-shop wifi connection still gets the search index downloaded promptly. **Performance is an accessibility issue too**: a curriculum that takes 8 seconds to render excludes everyone who can't wait. **The bar is mobile-4G fast; the curriculum hits it.**"

---

## Polish phase progress after this session

- ✅ Session 132 — Cross-chapter linking
- ✅ Session 133 — Search integration
- ✅ Session 134 — Mobile pass
- ✅ Session 135 — Accessibility audit
- ✅ **Session 136 — Performance pass** (this)
- ⬜ Session 137 — Social meta and OG cards

**1 polish session remains.** The final polish session (137) handles discoverability: per-chapter OG cards, Twitter Card meta, structured data, sitemap. **The curriculum is one session from shipped-and-shareable.**

Build with care. **Performance is the difference between a curriculum readers reach and a curriculum readers bounce from.**

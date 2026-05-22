# Session 02 — Design system implementation

> Translates `context/DESIGN_SYSTEM.md` from spec into running code. The placeholder page from session 01 becomes a styled typography test page that visually confirms the design system works.

---

## Read first

Before writing any code, read these files:

- `context/PROJECT_OVERVIEW.md` — for the visual identity stance (dark mode only, single cyan accent, no light mode toggle)
- `context/DESIGN_SYSTEM.md` — **the primary spec for this session.** Every color, font, spacing rule, and base style comes from here.
- `context/TECH_STACK.md` — to confirm the Tailwind / CSS variable wiring approach
- `prompts/scaffolding/session-01-repo-init.md` — for what was done in session 01; this session continues from that state

If anything in this prompt contradicts `DESIGN_SYSTEM.md`, the design system wins — surface the contradiction as an open question.

---

## Goal

Implement the visual foundation: self-hosted fonts, CSS variables, base element styles, and a minimal `BaseLayout.astro`. Replace the placeholder index page with a typography test page that exercises every base style.

**End state:** the index page at `http://localhost:4321/` renders with the brand dark background (`#0a0a0a`), Inter typography, cyan accents on links, and proper rhythm on headings, paragraphs, lists, blockquotes, and code blocks. The page looks like it belongs to this project. No layout chrome yet (sidebar, TOC, footer come in session 04).

---

## Inputs

State of the repo after session 01:

```
darvinyi-llm-tutorial/
├── .gitignore, .nvmrc, README.md
├── astro.config.mjs                 ← already has tailwind() with applyBaseStyles: false
├── tailwind.config.mjs              ← already maps tokens to CSS variables (vars don't exist yet)
├── tsconfig.json
├── package.json, package-lock.json
├── BUILD_ORDER.md, MASTER_PLAN.md
├── context/, prompts/                (read-only context)
└── src/
    ├── env.d.ts
    └── pages/
        └── index.astro              ← placeholder; this session replaces it
```

Dev server (`npm run dev`) is working. The placeholder page renders unstyled.

---

## Deliverables

Create or modify exactly these files:

1. `public/fonts/inter/` — directory with Inter variable woff2 files
2. `public/fonts/jetbrains-mono/` — directory with JetBrains Mono variable woff2 files (or ttf fallback)
3. `public/favicon.svg` — simple cyan-on-dark placeholder favicon
4. `src/styles/fonts.css` — `@font-face` declarations
5. `src/styles/variables.css` — CSS custom properties (full palette + spacing + type tokens)
6. `src/styles/base.css` — base element styles
7. `src/styles/global.css` — imports the three above, plus Tailwind directives
8. `src/layouts/BaseLayout.astro` — minimal HTML shell with `<head>`, `<body>`, `<slot />`
9. `src/pages/index.astro` — **replace** with a typography test page that uses `BaseLayout`

---

## Detailed spec

### 1. Download fonts

Both fonts are self-hosted (per `DESIGN_SYSTEM.md`, no font CDN dependencies). Download the variable versions:

**Inter** (variable woff2):
- Source: `https://github.com/rsms/inter/releases` — grab the latest stable release zip
- Inside the zip, locate the variable woff2 files. Typical names: `InterVariable.woff2` and `InterVariable-Italic.woff2` (or in older releases, `Inter.var.woff2`).
- Copy them to `public/fonts/inter/`. Rename to:
  - `Inter-Variable.woff2`
  - `Inter-Variable-Italic.woff2`

**JetBrains Mono** (variable):
- Source: `https://github.com/JetBrains/JetBrainsMono/releases` — grab the latest stable release zip
- Inside the zip, the variable fonts live in `fonts/variable/`. Look for:
  - `JetBrainsMono[wght].ttf` (variable axis is `wght`)
  - `JetBrainsMono-Italic[wght].ttf`
- If WOFF2 versions are included in the release, prefer those. If not, the TTF files work fine in modern browsers and are acceptable; ship them as `.ttf`.
- Copy to `public/fonts/jetbrains-mono/`. Rename to:
  - `JetBrainsMono-Variable.woff2` (or `.ttf` if no woff2 was available)
  - `JetBrainsMono-Variable-Italic.woff2` (or `.ttf`)

If only TTF is available for JetBrains Mono, update the `@font-face` declarations in step 4 to reference `.ttf` and `format('truetype')` instead of `.woff2` and `format('woff2-variations')`.

### 2. `src/styles/fonts.css`

```css
/* Inter — variable, weights 100-900 */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter/Inter-Variable.woff2') format('woff2-variations'),
       url('/fonts/inter/Inter-Variable.woff2') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter/Inter-Variable-Italic.woff2') format('woff2-variations'),
       url('/fonts/inter/Inter-Variable-Italic.woff2') format('woff2');
  font-weight: 100 900;
  font-style: italic;
  font-display: swap;
}

/* JetBrains Mono — variable, weights 100-800 */
@font-face {
  font-family: 'JetBrains Mono';
  src: url('/fonts/jetbrains-mono/JetBrainsMono-Variable.woff2') format('woff2-variations'),
       url('/fonts/jetbrains-mono/JetBrainsMono-Variable.woff2') format('woff2');
  font-weight: 100 800;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'JetBrains Mono';
  src: url('/fonts/jetbrains-mono/JetBrainsMono-Variable-Italic.woff2') format('woff2-variations'),
       url('/fonts/jetbrains-mono/JetBrainsMono-Variable-Italic.woff2') format('woff2');
  font-weight: 100 800;
  font-style: italic;
  font-display: swap;
}
```

**If using TTF instead of WOFF2 for JetBrains Mono:** replace the `src:` lines for JetBrains Mono with:
```css
  src: url('/fonts/jetbrains-mono/JetBrainsMono-Variable.ttf') format('truetype-variations'),
       url('/fonts/jetbrains-mono/JetBrainsMono-Variable.ttf') format('truetype');
```

`font-display: swap` shows fallback fonts immediately while the variable file downloads, then swaps — better LCP than `block`.

### 3. `src/styles/variables.css`

Full content. Matches the palette in `context/DESIGN_SYSTEM.md` exactly:

```css
:root {
  /* Surface */
  --bg-primary:    #0a0a0a;
  --bg-elevated:   #111111;
  --bg-overlay:    #171717;
  --bg-inline:     #1f1f1f;

  /* Borders */
  --border-subtle: #1f1f1f;
  --border-default:#262626;
  --border-strong: #404040;

  /* Text */
  --text-primary:  #f5f5f5;
  --text-secondary:#a3a3a3;
  --text-tertiary: #737373;
  --text-disabled: #525252;

  /* Brand — true cyan */
  --cyan-300:      #67e8f9;
  --cyan-400:      #22d3ee;
  --cyan-500:      #06b6d4;
  --cyan-600:      #0891b2;
  --cyan-glow:     rgba(6, 182, 212, 0.18);

  /* Semantic */
  --amber-500:     #f59e0b;
  --rose-500:      #f43f5e;
  --emerald-500:   #10b981;

  /* Layout */
  --container-prose: 72ch;
  --container-wide:  1100px;
  --sidebar-width:   240px;
  --toc-width:       200px;

  /* Radii */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 10px;

  /* Z-index scale */
  --z-base:    1;
  --z-sticky:  100;
  --z-nav:     200;
  --z-modal:   300;
  --z-tooltip: 400;
}

/* Base page setup */
html {
  background: var(--bg-primary);
  color: var(--text-primary);
  color-scheme: dark;
  scroll-behavior: smooth;
  scroll-padding-top: 5rem;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-feature-settings: 'cv11', 'ss01', 'ss03';
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  min-height: 100vh;
}

/* Selection */
::selection {
  background: var(--cyan-600);
  color: var(--text-primary);
}

/* Subtle scrollbar (webkit) */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--bg-primary); }
::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--border-strong); }

/* Focus rings — visible only on keyboard focus */
*:focus-visible {
  outline: 2px solid var(--cyan-500);
  outline-offset: 2px;
  border-radius: 2px;
}
```

**Notes:**
- The Inter font features `cv11`, `ss01`, `ss03` enable: single-story `a` (cv11), open digits (ss01), curved-leg `R` (ss03). All three are documented in `DESIGN_SYSTEM.md`.
- `scroll-padding-top: 5rem` offsets anchor-link jumps so they don't land hidden behind the sticky chapter title bar (added in session 04).
- `color-scheme: dark` tells browsers to render dark-themed defaults for form controls, scrollbars, etc.

### 4. `src/styles/base.css`

Base element styles. This is the long file. It implements the typography rhythm and base element appearance from `DESIGN_SYSTEM.md`.

```css
/* Headings — name the thing; no acts-of-discussing-the-thing */
h1 {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 48px;
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--text-primary);
  margin-top: 0;
  margin-bottom: 1.5rem;
}

h2 {
  font-size: 36px;
  line-height: 1.25;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  margin-top: 4rem;
  margin-bottom: 1rem;
}

h3 {
  font-size: 28px;
  line-height: 1.3;
  font-weight: 600;
  letter-spacing: -0.015em;
  color: var(--text-primary);
  margin-top: 3rem;
  margin-bottom: 1rem;
}

h4 {
  font-size: 22px;
  line-height: 1.4;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}

h5, h6 {
  font-size: 18px;
  line-height: 1.5;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

/* Body */
p {
  font-size: 16px;
  line-height: 1.7;
  color: var(--text-primary);
  max-width: var(--container-prose);
  margin: 0;
}

p + p {
  margin-top: 1.5rem;
}

em { font-style: italic; }
strong { font-weight: 500; }    /* 500, not 600 — heavier reads heavier on dark */

/* Links */
a {
  color: var(--cyan-500);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: color 200ms cubic-bezier(0.22, 1, 0.36, 1),
              border-color 200ms cubic-bezier(0.22, 1, 0.36, 1);
}
a:hover {
  color: var(--cyan-300);
  border-bottom-color: currentColor;
}

/* Lists */
ul, ol {
  font-size: 16px;
  line-height: 1.7;
  color: var(--text-primary);
  max-width: var(--container-prose);
  padding-left: 1.5rem;
  margin: 1rem 0;
}
ul { list-style: disc; }
ol { list-style: decimal; }
li { margin: 0; }
li + li { margin-top: 0.5rem; }

/* Blockquote */
blockquote {
  border-left: 2px solid var(--cyan-500);
  background: var(--bg-elevated);
  padding: 1rem 1.25rem;
  margin: 1.5rem 0;
  color: var(--text-secondary);
  max-width: var(--container-prose);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}
blockquote p { color: inherit; }

/* Inline code */
:not(pre) > code {
  font-family: 'JetBrains Mono', 'SF Mono', Menlo, monospace;
  font-size: 0.92em;
  background: var(--bg-inline);
  color: var(--cyan-300);
  padding: 0.125em 0.4em;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

/* Code blocks */
pre {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 1rem;
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.55;
  margin: 1.5rem 0;
  max-width: var(--container-wide);
}
pre code {
  font-family: 'JetBrains Mono', 'SF Mono', Menlo, monospace;
  background: transparent;
  border: none;
  padding: 0;
  color: var(--text-primary);
  font-size: inherit;
}

/* Horizontal rule */
hr {
  border: none;
  border-top: 1px solid var(--border-default);
  margin: 3rem 0;
  max-width: var(--container-prose);
}

/* Images */
img {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-md);
}

/* Tables (used rarely; styled minimally) */
table {
  width: auto;
  max-width: var(--container-prose);
  border-collapse: collapse;
  margin: 1.5rem 0;
  font-size: 14px;
}
th, td {
  border: 1px solid var(--border-default);
  padding: 0.5rem 0.75rem;
  text-align: left;
}
th {
  background: var(--bg-elevated);
  font-weight: 600;
  color: var(--text-primary);
}
td {
  color: var(--text-secondary);
}

/* Skip link (accessibility) */
.skip-link {
  position: absolute;
  top: -100px;
  left: 1rem;
  background: var(--bg-elevated);
  color: var(--cyan-300);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--cyan-500);
  z-index: var(--z-tooltip);
}
.skip-link:focus {
  top: 1rem;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Notes:**
- `strong { font-weight: 500 }` — not 600. On dark backgrounds, 600 reads as "heading weight." 500 gives the right amount of emphasis.
- `letter-spacing` decreases at larger sizes — Inter at display sizes (h1, h2) feels loose without negative tracking.
- The `:not(pre) > code` selector applies inline-code styling only when the `<code>` is NOT inside a `<pre>` block. Code blocks (`<pre><code>`) get their own styling.
- Tables get minimal styling — they're rare in tutorial content but should render cleanly when they appear.
- `prefers-reduced-motion` neutralizes animations site-wide. Non-essential motion goes away; essential motion (loading indicators) is handled at the widget level.

### 5. `src/styles/global.css`

Top-level CSS imports. This is the only stylesheet referenced by `BaseLayout.astro`.

```css
/* Order matters: fonts → tokens → base → Tailwind */
@import './fonts.css';
@import './variables.css';
@import './base.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Order rationale:**
- Fonts load first so `@font-face` is declared before any element rule needs it
- Variables define the palette before base styles reference them
- Base styles set element defaults before Tailwind utilities load
- Tailwind's `@tailwind base;` is mostly empty since we set `applyBaseStyles: false` in `astro.config.mjs`, but the directive still needs to be present so utilities resolve correctly

### 6. `src/layouts/BaseLayout.astro`

Minimal layout. Future layouts (`ChapterLayout.astro`, session 04) wrap this. The `<head>` includes the canonical URL, OG metadata, and the favicon link.

```astro
---
import '@/styles/global.css';

export interface Props {
  title?: string;
  description?: string;
}

const {
  title = 'LLM Tutorial',
  description = 'A comprehensive tutorial from numpy primitives to LLM agent frameworks. By Darvin Yi.',
} = Astro.props;

const canonicalURL = new URL(Astro.url.pathname, Astro.site).toString();
const fullTitle = title === 'LLM Tutorial' ? title : `${title} · LLM Tutorial`;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="generator" content={Astro.generator} />
    <meta name="theme-color" content="#0a0a0a" />

    <title>{fullTitle}</title>
    <meta name="description" content={description} />

    <link rel="canonical" href={canonicalURL} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonicalURL} />
    <meta property="og:site_name" content="LLM Tutorial" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={fullTitle} />
    <meta name="twitter:description" content={description} />
  </head>
  <body>
    <a href="#main" class="skip-link">Skip to main content</a>
    <slot />
  </body>
</html>
```

**Notes:**
- The `import '@/styles/global.css';` in the frontmatter is what pulls all styles into the page bundle.
- `theme-color: #0a0a0a` tells iOS Safari and Android Chrome to use the brand background for the browser chrome.
- The `og:image` meta tag is intentionally omitted here; session 06 adds a generated OG image. Without it, social shares show no preview image — acceptable until session 06.
- The skip link is at the top of `<body>` so it's the first focusable element; styled to be visually hidden until focused (via `.skip-link` rule in `base.css`).
- Future layouts will pass `title` and `description` as props.

### 7. `src/pages/index.astro`

**Replace** the placeholder from session 01 with a typography test page. This page is temporary — session 04 replaces it with the real landing page. Its purpose is to exercise every base style so we can visually verify the design system works.

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
---
<BaseLayout title="Typography test" description="Temporary page to verify the design system renders correctly.">
  <main id="main" class="max-w-prose mx-auto px-6 py-16">
    <p class="text-fg-tertiary text-sm font-mono uppercase tracking-wider mb-3">
      Session 02 · Design system test
    </p>

    <h1>The Transformer architecture</h1>

    <p class="text-lg text-fg-secondary">
      A typography test page. Replace this with the real landing in session 04.
      Everything visible below is a base style coming directly from <code>base.css</code>.
    </p>

    <h2>Self-attention</h2>
    <p>
      Attention is the operation that lets a token look at every other token in the sequence
      and decide how much each contributes to its own representation. The math is unreasonably
      simple for how much it enables. Inline code looks like <code>softmax(QK^T / sqrt(d))V</code>,
      and links look like <a href="https://arxiv.org/abs/1706.03762">this one</a> to the
      original paper.
    </p>
    <p>
      A second paragraph follows the rhythm rule: <code>p + p</code> gets a top margin so
      consecutive paragraphs breathe. Inline <em>emphasis</em> and <strong>strong</strong>
      both use a 500 weight on dark backgrounds — 600 would feel like a heading.
    </p>

    <h3>A subsection</h3>
    <p>The third-level heading is smaller and tighter. Lists work too:</p>
    <ul>
      <li>Query, key, and value projections</li>
      <li>Scaled dot product, normalized by <code>sqrt(d_k)</code></li>
      <li>Softmax over the key dimension, not the query dimension</li>
    </ul>

    <h4>Notes on phrasing</h4>
    <p>Headings name the thing, not the act of discussing it.</p>
    <ol>
      <li>Multi-head attention</li>
      <li>RoPE</li>
      <li>Why √d scaling</li>
    </ol>

    <blockquote>
      The softmax in attention isn't there because it's the only way to get a probability
      distribution — it's there because exponentiating before normalizing makes the largest
      score dominate, which is what lets attention sharpen onto a single key when needed.
    </blockquote>

    <h3>A code block</h3>
    <p>Code blocks have monospace, an elevated background, and a thin border:</p>

    <pre><code>def attention(Q, K, V, mask=None):
    d_k = K.shape[-1]
    scores = Q @ K.swapaxes(-1, -2) / d_k ** 0.5
    if mask is not None:
        scores = scores + (1 - mask) * -1e9
    weights = softmax(scores, axis=-1)
    return weights @ V</code></pre>

    <p>
      Code-block syntax highlighting via Shiki gets fully wired up in session 03 alongside MDX.
      Right now this is a plain <code>&lt;pre&gt;&lt;code&gt;</code> block — monospace, but no
      color tokens.
    </p>

    <hr />

    <h4>A table, for completeness</h4>
    <table>
      <thead>
        <tr><th>Method</th><th>Year</th><th>Key idea</th></tr>
      </thead>
      <tbody>
        <tr><td>Sinusoidal PE</td><td>2017</td><td>Fixed encoding</td></tr>
        <tr><td>RoPE</td><td>2021</td><td>Rotation in 2D subspaces</td></tr>
        <tr><td>ALiBi</td><td>2022</td><td>Linear attention bias</td></tr>
      </tbody>
    </table>

    <p class="text-fg-tertiary text-sm mt-12">
      If everything above renders correctly — Inter for prose, JetBrains Mono for code,
      cyan links, cyan-bordered blockquote, elevated code block, proper heading rhythm —
      the design system is wired up. Move to session 03.
    </p>
  </main>
</BaseLayout>
```

### 8. `public/favicon.svg`

Simple cyan-on-dark placeholder. Session 06 may iterate; this is the working version through Phases 2–12.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0a0a0a"/>
  <path d="M 8 8 L 8 24 L 22 24" stroke="#06b6d4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>
```

A bold L shape (for "LLM") drawn in true cyan on the brand dark background. Rounded corners on the square, rounded line caps. 32×32 viewBox.

---

## Acceptance criteria

All of the following must be true before this session is considered complete:

1. **Fonts are physically present:** `public/fonts/inter/Inter-Variable.woff2` and `Inter-Variable-Italic.woff2` exist; `public/fonts/jetbrains-mono/JetBrainsMono-Variable.woff2` (or `.ttf`) and `-Italic` variant exist. Each file is > 100KB (sanity check; tiny files indicate a failed download).
2. **`npm run dev`** starts cleanly; no 404s for font files in the browser network tab.
3. **`http://localhost:4321/`** renders with:
   - Dark background `#0a0a0a` (verify in browser devtools that computed `background-color` matches)
   - Inter font for body and headings (verify in devtools "Computed" → `font-family` shows "Inter")
   - JetBrains Mono for inline code (`softmax(QK^T...)`) — visually monospaced, cyan-tinted on darker background
   - Links rendered in cyan; hover changes to brighter cyan with underline appearing
   - Blockquote with cyan left-border and elevated background
   - Code block in an elevated, bordered surface
   - h1 is large, bold, slightly tighter letter-spacing
   - Headings have visible top margin (clear section breaks)
4. **No FOUT (flash of unstyled text)** on first load — fonts should `swap` smoothly from system fallback to Inter without a heavy jump
5. **Selection (Cmd-A / Ctrl-A)** highlights in cyan-tinted blue (`#0891b2` against `#f5f5f5`)
6. **Focus rings on keyboard nav (Tab)** appear cyan with 2px offset
7. **`npm run typecheck`** passes with zero errors
8. **`npm run build`** completes; `dist/index.html` exists; `dist/_astro/` contains the bundled CSS
9. **Final repo structure** adds these files to what session 01 produced:

```
public/
├── favicon.svg
└── fonts/
    ├── inter/
    │   ├── Inter-Variable.woff2
    │   └── Inter-Variable-Italic.woff2
    └── jetbrains-mono/
        ├── JetBrainsMono-Variable.woff2 (or .ttf)
        └── JetBrainsMono-Variable-Italic.woff2 (or .ttf)
src/
├── layouts/
│   └── BaseLayout.astro
├── styles/
│   ├── base.css
│   ├── fonts.css
│   ├── global.css
│   └── variables.css
└── pages/
    └── index.astro    (replaced)
```

---

## Out of scope (do NOT do these)

- ❌ **Do not configure KaTeX or remark/rehype plugins.** Session 03 adds these to `astro.config.mjs`.
- ❌ **Do not create any MDX `.mdx` files.** Session 03 introduces MDX content components and a test MDX page.
- ❌ **Do not create the Callout, Equation, Figure, or WidgetFrame components.** Session 03 owns those.
- ❌ **Do not create `RunnableCode`.** Session 05.
- ❌ **Do not create `ChapterLayout.astro`, `Sidebar.astro`, or any nav components.** Session 04.
- ❌ **Do not finalize the favicon design.** The placeholder L is fine; session 06 may iterate.
- ❌ **Do not add `og-image.png`.** Session 06.
- ❌ **Do not customize Shiki theme colors.** The `github-dark-dimmed` default from session 01 is used as-is until session 03 wires up MDX-driven code blocks.
- ❌ **Do not write any React components.** The first React component (`RunnableCode`) is in session 05.

---

## Wire-up

After all acceptance criteria pass:

```bash
git add public/fonts/ public/favicon.svg src/styles/ src/layouts/ src/pages/index.astro
git commit -m "session 02: design system — fonts, CSS variables, base styles, BaseLayout, typography test"
git push origin main
```

Take a screenshot of the typography test page before pushing. Compare against `context/DESIGN_SYSTEM.md` mentally: do the colors feel right? Is the rhythm comfortable? Does inline code look distinct enough from body? Anything that feels off, surface it as an open question now — before sessions 03–06 build on this foundation.

The next session (`session-03-mdx-content-pipeline.md`) assumes:
- The dark background, cyan accent, Inter / JetBrains Mono typography are all working
- `BaseLayout.astro` exists and can be imported via `@/layouts/BaseLayout.astro`
- The four CSS files in `src/styles/` are linked via `global.css`
- The typography test page at `/` is the current landing (session 03 leaves it in place; session 04 replaces it)

---

## Notes for the session author

**If fonts don't load** (browser shows system fallback), check the Network tab: are requests for `/fonts/inter/Inter-Variable.woff2` returning 404? If so, the file isn't where the CSS expects. Verify the file names exactly match what's in `fonts.css`.

**If fonts load but feature settings don't apply** (Inter looks like the default, no curved `R`), the `font-feature-settings` may be on the wrong selector. It's on `body` in `variables.css` — verify it didn't get nested somewhere else.

**If the cyan accent looks too saturated or too dim**, sample the rendered hex in devtools. It should be `#06b6d4`. If it shows differently, the CSS variable is being overridden somewhere.

**If `prefers-reduced-motion` testing is needed**, in macOS: System Settings → Accessibility → Display → Reduce motion. Verify smooth-scroll becomes instant when toggled.

**If the typography test renders with default browser styles** (Times New Roman, etc.), the `global.css` import in `BaseLayout.astro` isn't connecting. Verify the path alias `@/styles/global.css` resolves — check `tsconfig.json` paths and `vite.config` (Astro's internal Vite should respect tsconfig paths by default).

This session is the first one that produces something visually identifiable. If the typography test page looks like the project's intended aesthetic — sparse, technical, calm dark with single cyan accent — the design system is locked. Subsequent sessions can build with confidence on what's here.

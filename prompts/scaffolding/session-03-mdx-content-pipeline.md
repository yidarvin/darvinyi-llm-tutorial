# Session 03 — MDX content pipeline

> Wires up the MDX authoring pipeline end-to-end. Math via KaTeX, syntax-highlighted code via Shiki with our cyan-on-dark palette, and a library of reusable MDX components (`Callout`, `Equation`, `EqRef`, `Figure`, `WidgetFrame`) that every chapter will use. End state: a test MDX page renders with math, code, and all custom components looking correct.

---

## Read first

Before writing any code, read these files:

- `context/PROJECT_OVERVIEW.md` — for the math/code/citation conventions
- `context/DESIGN_SYSTEM.md` — **especially the "Components" section.** Every component contract spec'd here is implemented in this session.
- `context/TECH_STACK.md` — for the rehype/remark plugin list, KaTeX macros, and Shiki config
- `prompts/scaffolding/session-02-design-system.md` — for the design system this session builds on; understand what `BaseLayout.astro`, the four CSS files, and the typography test page look like

If anything in this prompt contradicts the context files, the context files win — surface the contradiction.

---

## Goal

Make the project capable of authoring MDX content with math, code, and reusable structural components. By the end of this session, an MDX page can include:

- Inline math (`$E = mc^2$`) and display math (`$$...$$`) — rendered by KaTeX with the project's custom macros (`\softmax`, `\attn`, `\R`, `\E`, `\KL`, etc.)
- Syntax-highlighted code fences (` ```python `) — rendered by Shiki with `github-dark-dimmed`
- `<Callout type="note|warning|aside|insight">` — semantic emphasis blocks
- `<Equation label="...">` — labeled display equations with anchor IDs
- `<EqRef id="..." />` — inline equation cross-references
- `<Figure src caption alt wide />` — captioned images
- `<WidgetFrame title caption wide>...</WidgetFrame>` — the standard wrapper around interactive widgets

A test MDX page (`/test-mdx`) exercises every component visually so the next session (and the human running it) can verify the pipeline works.

---

## Inputs

State of the repo after session 02:

```
src/
├── layouts/BaseLayout.astro
├── pages/index.astro                  ← typography test page
├── styles/
│   ├── fonts.css
│   ├── variables.css
│   ├── base.css
│   └── global.css
└── env.d.ts
public/
├── favicon.svg
└── fonts/
    ├── inter/
    └── jetbrains-mono/
astro.config.mjs                       ← mdx() with no plugins yet
tailwind.config.mjs
package.json                           ← remark-gfm, remark-math, rehype-katex, rehype-slug, rehype-autolink-headings, katex already installed
```

The plugins (`remark-gfm`, `remark-math`, `rehype-katex`, `rehype-slug`, `rehype-autolink-headings`, `katex`) are already in `package.json` from session 01. This session activates them via `astro.config.mjs`.

---

## Deliverables

1. **Update** `astro.config.mjs` — add remark/rehype plugins with KaTeX macros and heading-anchor wrapping
2. **Create** `src/styles/content.css` — KaTeX overrides + heading-anchor styling
3. **Update** `src/styles/global.css` — add `@import './content.css';`
4. **Create** `src/components/content/Callout.astro`
5. **Create** `src/components/content/Equation.astro`
6. **Create** `src/components/content/EqRef.astro`
7. **Create** `src/components/content/Figure.astro`
8. **Create** `src/components/content/WidgetFrame.astro`
9. **Create** `src/components/content/index.ts` — barrel export
10. **Create** `public/test/placeholder-figure.svg` — placeholder SVG used by the MDX test page
11. **Create** `src/pages/test-mdx.mdx` — temporary test page (deleted in session 06)

**Do NOT modify** `src/styles/base.css`, `src/styles/fonts.css`, `src/styles/variables.css`, `src/layouts/BaseLayout.astro`, or `src/pages/index.astro`. Those are owned by session 02.

---

## Detailed spec

### 1. Update `astro.config.mjs`

Replace the existing config with the version that includes plugins. The KaTeX macros come from `context/DESIGN_SYSTEM.md` and `context/TECH_STACK.md` — keep them exact.

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

export default defineConfig({
  site: 'https://llm-tutorial.darvinyi.com',
  integrations: [
    mdx({
      remarkPlugins: [remarkGfm, remarkMath],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, {
          behavior: 'wrap',
          properties: { className: ['heading-anchor'] },
        }],
        [rehypeKatex, {
          strict: false,
          macros: {
            '\\R': '\\mathbb{R}',
            '\\N': '\\mathbb{N}',
            '\\Z': '\\mathbb{Z}',
            '\\E': '\\mathbb{E}',
            '\\Var': '\\operatorname{Var}',
            '\\Cov': '\\operatorname{Cov}',
            '\\softmax': '\\operatorname{softmax}',
            '\\attn': '\\operatorname{Attention}',
            '\\KL': '\\operatorname{KL}',
            '\\argmax': '\\operatorname*{arg\\,max}',
            '\\argmin': '\\operatorname*{arg\\,min}',
          },
        }],
      ],
    }),
    react(),
    tailwind({ applyBaseStyles: false }),
    sitemap(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: false,
    },
  },
  vite: {
    optimizeDeps: {
      exclude: ['pyodide'],
    },
  },
});
```

**Notes:**
- Plugin order matters in `rehypePlugins`: `rehypeSlug` runs first to assign IDs to headings, then `rehypeAutolinkHeadings` wraps each heading's text in an `<a href="#id">`, then `rehypeKatex` transforms math nodes into KaTeX HTML.
- `behavior: 'wrap'` means the entire heading text becomes the link content. The `<a>` gets `class="heading-anchor"`, which `content.css` styles to be visually transparent (no cyan, no underline by default) so headings still look like headings.
- `strict: false` on `rehypeKatex` means it warns rather than errors on unknown macros. Useful during development; chapter sessions can encounter unknown LaTeX without breaking the whole build.
- The `\\` prefix on each macro name is correct in JS strings (one `\` for the literal backslash, one for the escape).
- Macros are defined ONCE here. Do not let chapter MDX files redefine them.

### 2. `src/styles/content.css`

New file. Contains KaTeX overrides and heading-anchor styles.

```css
/* KaTeX core styles */
@import 'katex/dist/katex.min.css';

/* Display equations: cyan left-border to match the project's accent */
.katex-display {
  margin: 1.5rem auto !important;
  padding: 0.5rem 1rem;
  border-left: 2px solid var(--cyan-500);
  max-width: var(--container-prose);
  overflow-x: auto;
  overflow-y: hidden;
}

/* Use our text color, not KaTeX default white */
.katex { color: var(--text-primary); }

/* Sizing — inline math matches body, display is slightly larger */
.katex { font-size: 1em; }
.katex-display .katex { font-size: 1.1em; }

/* Heading anchors from rehype-autolink-headings:
   the heading TEXT itself is wrapped in <a class="heading-anchor">.
   We want headings to LOOK like headings (no cyan, no underline)
   while still being clickable for hash-link sharing. */
.heading-anchor {
  color: inherit;
  text-decoration: none;
  border-bottom: none;
}
.heading-anchor:hover {
  border-bottom: none;
  color: var(--cyan-400);
}
.heading-anchor:focus-visible {
  outline: 2px solid var(--cyan-500);
  outline-offset: 4px;
  border-radius: 2px;
}
```

**Notes:**
- `@import 'katex/dist/katex.min.css';` pulls KaTeX's font + glyph styles from `node_modules/katex/`. Astro's Vite bundler copies these into the build automatically.
- The `!important` on `.katex-display` margin is because KaTeX's own CSS sets a different margin we want to override.
- The `.heading-anchor:focus-visible` rule gives keyboard users a visible cyan outline when tabbing through headings.

### 3. Update `src/styles/global.css`

Add `content.css` to the imports. The file becomes:

```css
@import './fonts.css';
@import './variables.css';
@import './base.css';
@import './content.css';   /* NEW: added in session 03 */

@tailwind base;
@tailwind components;
@tailwind utilities;
```

Order matters: `content.css` after `base.css` so its `.heading-anchor` rule overrides the default `a` styling from `base.css`.

### 4. `src/components/content/Callout.astro`

Four types: `note`, `warning`, `aside`, `insight`. Each has its own border color, background tint, and label color. Uses Astro's scoped `<style>` block so CSS doesn't leak globally.

```astro
---
export interface Props {
  type?: 'note' | 'warning' | 'aside' | 'insight';
  title?: string;
}
const { type = 'note', title } = Astro.props;

const defaultLabels = {
  note:    'Note',
  warning: 'Warning',
  aside:   'Aside',
  insight: 'Insight',
};
const label = title ?? defaultLabels[type];
---
<aside class:list={['callout', `callout-${type}`]}>
  <div class="callout-label">{label}</div>
  <div class="callout-body">
    <slot />
  </div>
</aside>

<style>
  .callout {
    margin: 1.5rem 0;
    padding: 1rem 1.25rem;
    max-width: var(--container-prose);
    border-left: 2px solid;
    border-radius: 0 var(--radius-md) var(--radius-md) 0;
  }

  .callout-note    { border-color: var(--cyan-500);      background: rgba(6, 182, 212, 0.05); }
  .callout-warning { border-color: var(--amber-500);     background: rgba(245, 158, 11, 0.05); }
  .callout-aside   { border-color: var(--text-tertiary); background: var(--bg-elevated); }
  .callout-insight { border-color: var(--cyan-500);      background: rgba(6, 182, 212, 0.10); }

  .callout-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  .callout-note    .callout-label,
  .callout-insight .callout-label { color: var(--cyan-400); }
  .callout-warning .callout-label { color: var(--amber-500); }
  .callout-aside   .callout-label { color: var(--text-tertiary); }

  .callout-body {
    color: var(--text-primary);
    line-height: 1.65;
  }

  /* Slotted content — paragraphs inside a callout need adjusted margins */
  .callout-body :global(p) {
    margin: 0.5rem 0;
    max-width: none;
  }
  .callout-body :global(p:first-child) { margin-top: 0; }
  .callout-body :global(p:last-child)  { margin-bottom: 0; }
  .callout-body :global(code) {
    font-size: 0.92em;
  }
</style>
```

**Notes:**
- Inline RGB values are used for the tinted backgrounds (`rgba(6, 182, 212, 0.05)`) because the project's CSS variables are stored as `#hex`, which can't be opacity-modified directly. The numbers `6, 182, 212` are the RGB decomposition of `#06b6d4` (cyan-500); `245, 158, 11` is `#f59e0b` (amber-500). If the palette ever changes, these need to be updated to match — document this in a code comment.
- The `:global()` selectors target slotted content because Astro's CSS scoping doesn't reach into `<slot />` content otherwise.
- Two callout types (`note` and `insight`) share the cyan border but differ in background opacity (5% vs 10%) — `insight` is "stronger note" for chapter takeaways.

### 5. `src/components/content/Equation.astro`

Wraps a display equation (`$$...$$`) with an optional label. The display equation itself gets the cyan border from `content.css`; this component just adds the label and the anchor ID.

```astro
---
export interface Props {
  label?: string;
}
const { label } = Astro.props;
const id = label ? `eq-${label}` : undefined;
---
<div class="equation" id={id}>
  <div class="equation-content"><slot /></div>
  {label && <span class="equation-label">({label})</span>}
</div>

<style>
  .equation {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 1rem;
    margin: 1.5rem 0;
    max-width: var(--container-prose);
  }
  .equation-content {
    min-width: 0;
  }
  .equation-label {
    color: var(--text-tertiary);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.9rem;
    user-select: none;
    white-space: nowrap;
  }
</style>
```

**Important usage note:** `<Equation>` must contain a display equation (`$$...$$`), not inline math (`$...$`). The cyan left-border styling lives on `.katex-display`, which only appears for display math. Using `<Equation>` to wrap inline math will produce an empty wrapper.

### 6. `src/components/content/EqRef.astro`

Inline reference to a labeled equation. Renders as a cyan monospace `(label)` that links to `#eq-label`.

```astro
---
export interface Props {
  id: string;
}
const { id } = Astro.props;
---
<a href={`#eq-${id}`} class="eq-ref">({id})</a>

<style>
  .eq-ref {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.9em;
    color: var(--cyan-400);
    text-decoration: none;
    border-bottom: none;
  }
  .eq-ref:hover {
    color: var(--cyan-300);
    border-bottom: none;
  }
</style>
```

**Note:** the `border-bottom: none` overrides `base.css`'s default link styling so the equation reference doesn't pick up the hover underline that body-text links get.

### 7. `src/components/content/Figure.astro`

Captioned image. Defaults to prose-width; `wide` makes it span the wider container.

```astro
---
export interface Props {
  src: string;
  caption: string;
  alt?: string;
  wide?: boolean;
}
const { src, caption, alt, wide = false } = Astro.props;
---
<figure class:list={['figure', { 'figure-wide': wide }]}>
  <img src={src} alt={alt ?? caption} />
  <figcaption>{caption}</figcaption>
</figure>

<style>
  .figure {
    margin: 2rem 0;
    max-width: var(--container-prose);
  }
  .figure-wide { max-width: var(--container-wide); }
  .figure img {
    width: 100%;
    height: auto;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-default);
    display: block;
  }
  .figure figcaption {
    color: var(--text-tertiary);
    font-size: 0.9rem;
    margin-top: 0.75rem;
    line-height: 1.5;
  }
</style>
```

**Usage requirement:** `caption` is required. The reader scrolling past must be able to understand what the figure shows from the caption alone. `alt` defaults to `caption` for screen readers.

### 8. `src/components/content/WidgetFrame.astro`

The standard chrome around interactive widgets. Provides the header bar (title + "Interactive" tag), inset content area, and optional caption below.

```astro
---
export interface Props {
  title: string;
  caption?: string;
  wide?: boolean;
}
const { title, caption, wide = true } = Astro.props;
---
<div class:list={['widget-frame', { 'widget-frame-wide': wide }]}>
  <div class="widget-frame-card">
    <div class="widget-frame-header">
      <h4 class="widget-frame-title">{title}</h4>
      <span class="widget-frame-tag">Interactive</span>
    </div>
    <div class="widget-frame-body">
      <slot />
    </div>
  </div>
  {caption && <p class="widget-frame-caption">{caption}</p>}
</div>

<style>
  .widget-frame {
    margin: 3rem 0;
    max-width: var(--container-prose);
  }
  .widget-frame-wide { max-width: var(--container-wide); }

  .widget-frame-card {
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .widget-frame-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.25rem;
    border-bottom: 1px solid var(--border-subtle);
  }
  .widget-frame-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-primary);
    margin: 0;
  }
  .widget-frame-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .widget-frame-body {
    padding: 1.25rem;
  }

  .widget-frame-caption {
    color: var(--text-tertiary);
    font-size: 0.9rem;
    margin-top: 0.75rem;
    line-height: 1.5;
    max-width: var(--container-prose);
  }
</style>
```

**Notes:**
- `wide` defaults to `true` for `<WidgetFrame>` (vs `false` for `<Figure>`) because widgets are visually heavier and benefit from horizontal space.
- The header's `<h4>` is styled to look like the "Interactive" tag — small monospace uppercase — so it visually balances with the tag on the right. It is NOT styled like a heading element from `base.css`; the inline styles override.

### 9. `src/components/content/index.ts`

Barrel export so MDX files import cleanly:

```ts
// src/components/content/index.ts
export { default as Callout } from './Callout.astro';
export { default as Equation } from './Equation.astro';
export { default as EqRef } from './EqRef.astro';
export { default as Figure } from './Figure.astro';
export { default as WidgetFrame } from './WidgetFrame.astro';
```

MDX files use these via:
```mdx
import { Callout, Equation, EqRef, Figure, WidgetFrame } from '@components/content';
```

### 10. `public/test/placeholder-figure.svg`

A simple SVG used by the test MDX page. Replaced by real chapter figures later.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400">
  <rect width="800" height="400" fill="#111111" stroke="#262626" stroke-width="2" rx="6"/>
  <text x="400" y="180" font-family="JetBrains Mono, monospace" font-size="20" fill="#06b6d4" text-anchor="middle" dominant-baseline="middle">
    Placeholder figure
  </text>
  <text x="400" y="220" font-family="Inter, sans-serif" font-size="14" fill="#737373" text-anchor="middle" dominant-baseline="middle">
    Replaced by real diagrams in chapter sessions
  </text>
</svg>
```

### 11. `src/pages/test-mdx.mdx`

Temporary test page. Lives through Phases 2–4; session 06 deletes it before deploy.

Full content (note: the layout import path uses relative form because MDX frontmatter `layout` doesn't resolve `@/` aliases):

````mdx
---
layout: ../layouts/BaseLayout.astro
title: MDX pipeline test
description: Temporary page to verify math, code, and MDX components.
---

import { Callout, Equation, EqRef, Figure, WidgetFrame } from '@components/content';

<main id="main" class="max-w-prose mx-auto px-6 py-16">

<p class="text-fg-tertiary text-sm font-mono uppercase tracking-wider">
  Session 03 · MDX pipeline test
</p>

# MDX pipeline test

This page exercises every part of the MDX content pipeline added in session 03: math via KaTeX, syntax-highlighted code via Shiki, and the five custom components.

## Math

Inline math: $E = mc^2$, the softmax $\softmax(z)_i = e^{z_i} / \sum_j e^{z_j}$, and a Greek expression $\beta \, \KL(\pi \,\|\, \pi_{\text{ref}})$.

Display math:

$$
\attn(Q, K, V) = \softmax\!\left(\frac{QK^\top}{\sqrt{d_k}}\right) V
$$

A labeled equation:

<Equation label="4.1">
$$
\mathcal{L}_{\text{CE}} = -\sum_{i} y_i \log \hat{y}_i
$$
</Equation>

We can reference it later: <EqRef id="4.1" />.

## Code

Syntax-highlighted Python via Shiki:

```python
import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)
    e = np.exp(x)
    return e / e.sum(axis=axis, keepdims=True)

def attention(Q, K, V, mask=None):
    d_k = K.shape[-1]
    scores = Q @ K.swapaxes(-1, -2) / np.sqrt(d_k)
    if mask is not None:
        scores = np.where(mask, scores, -np.inf)
    return softmax(scores) @ V
```

Inline code reads like `softmax(x, axis=-1)`.

## Callouts — four types

<Callout type="note">The softmax is applied along the last axis so each query attends over all keys.</Callout>

<Callout type="warning">This implementation skips numerical stability tricks beyond max-subtraction.</Callout>

<Callout type="aside">Related: see Chapter 17 on KV caches.</Callout>

<Callout type="insight">Attention is a soft, differentiable form of key-value retrieval. The softmax sharpens onto a single key when one query-key dot-product dominates.</Callout>

## Figure

<Figure
  src="/test/placeholder-figure.svg"
  caption="Placeholder figure. Real diagrams are added in chapter sessions; this one verifies the Figure component renders correctly."
/>

## Widget frame

<WidgetFrame title="Placeholder widget" caption="Widget content will be filled by chapter-specific sessions. The frame just verifies the chrome.">
  <div style="aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center; color: var(--text-tertiary); font-family: 'JetBrains Mono', monospace; font-size: 0.875rem;">
    Widget content goes here
  </div>
</WidgetFrame>

## Linked headings

Hover any heading on this page. The text itself is a link to the heading's anchor — useful for sharing specific sections.

---

This page is temporary. Session 06 deletes it before deploy. Until then it serves as a visual regression target for Phases 2–4.

</main>
````

**Notes:**
- The MDX frontmatter `layout` uses the relative path `../layouts/BaseLayout.astro` because MDX's frontmatter parser doesn't resolve TypeScript path aliases.
- Imports inside the MDX body (for components) DO resolve `@components/content` aliases — that's a different code path.
- The `<main id="main">` matches the skip-link target from `BaseLayout.astro` (session 02).

---

## Acceptance criteria

All of the following must be true before this session is considered complete:

1. **`npm run dev`** starts cleanly; no console errors related to plugins or KaTeX.
2. **`http://localhost:4321/test-mdx`** renders the test MDX page with:
   - **Inline math** displays as proper math notation (not raw `$...$`): `E = mc²`, the softmax expression, the Greek beta-KL term
   - **Display equation** for attention shows the formula on its own line with a thin cyan left-border (from `.katex-display` styling in `content.css`)
   - **Labeled equation (4.1)** has the cyan left-border AND the `(4.1)` label aligned to the right in monospace
   - **`<EqRef id="4.1" />`** renders inline as a small monospace cyan `(4.1)` that scrolls to the equation when clicked
   - **Custom macros work**: `\softmax`, `\attn`, `\KL` render as proper operators
   - **Code block** is syntax-highlighted (keywords colored, strings colored) with the `github-dark-dimmed` palette
   - **Four callout types** render distinctly — note (subtle cyan), warning (subtle amber), aside (gray, elevated bg), insight (stronger cyan)
   - **Figure** renders the placeholder SVG with a thin border, rounded corners, and a `text-tertiary` caption below
   - **WidgetFrame** has the dark elevated card with a header bar containing "Placeholder widget" (monospace, uppercase) on the left and "Interactive" tag on the right
   - **Headings have hover affordance** — hovering an h2 or h3 changes its color subtly to cyan (or shows the anchor-link affordance)
3. **`/` (the typography test from session 02)** still renders correctly — this session didn't break it
4. **`npm run typecheck`** passes with zero errors
5. **`npm run build`** completes successfully. `dist/test-mdx/index.html` exists.
6. **Final repo additions** match:

```
src/
├── components/
│   └── content/
│       ├── Callout.astro
│       ├── Equation.astro
│       ├── EqRef.astro
│       ├── Figure.astro
│       ├── WidgetFrame.astro
│       └── index.ts
├── styles/
│   ├── ... (existing files)
│   └── content.css                ← new
└── pages/
    ├── index.astro                (unchanged)
    └── test-mdx.mdx               ← new
public/
└── test/
    └── placeholder-figure.svg     ← new
astro.config.mjs                   (updated)
src/styles/global.css              (updated)
```

---

## Out of scope (do NOT do these)

- ❌ **Do not build the `<RunnableCode>` component.** Session 05 owns Pyodide and the runnable code editor.
- ❌ **Do not customize Shiki transformers** (line highlighting, line numbers). Future polish session may add these; not now.
- ❌ **Do not add a copy-to-clipboard button** on code blocks. Polish.
- ❌ **Do not modify `base.css` or any other session-02-owned file.** New content-pipeline styles live in `content.css` only.
- ❌ **Do not extract table-of-contents.** Session 04 builds the TOC component.
- ❌ **Do not build any layouts beyond what already exists.** Session 04 adds `ChapterLayout.astro`.
- ❌ **Do not write any React components.** All five MDX components in this session are Astro components — they have no client-side interactivity. This is correct.
- ❌ **Do not delete `test-mdx.mdx`** at the end of this session. It stays through Phases 2–4 as a visual reference; session 06 deletes it.
- ❌ **Do not edit `src/pages/index.astro`** (the typography test). Session 04 replaces it with the real landing.

---

## Wire-up

After all acceptance criteria pass:

```bash
git add astro.config.mjs src/styles/content.css src/styles/global.css src/components/content/ src/pages/test-mdx.mdx public/test/
git commit -m "session 03: MDX pipeline — KaTeX macros, Shiki, Callout, Equation, EqRef, Figure, WidgetFrame"
git push origin main
```

Visit `/test-mdx` and screenshot it for visual reference. Sessions 04–06 (and every chapter session) inherit this pipeline; if anything looks off — math misaligned, callouts not distinct, code block colors wrong — flag it now.

The next session (`session-04-layout-and-navigation.md`) assumes:
- MDX content pages render with math, code, and the five components working
- `@components/content` resolves to the barrel export
- `content.css` is loaded via `global.css`
- The placeholder index page at `/` is still in place (session 04 replaces it)

---

## Notes for the session author

**If KaTeX math renders as raw `$...$` text**, the most likely cause is that `remark-math` isn't installed or wired into `astro.config.mjs`. Verify both. Restart the dev server after any `astro.config.mjs` change — Astro doesn't hot-reload config.

**If display equations don't have the cyan left-border**, the `.katex-display` rule in `content.css` may not be loading. Check the browser devtools "Sources" panel for `content.css` and confirm the rule is present.

**If custom macros (`\softmax`, `\attn`) render as undefined commands**, the `macros` object in `astro.config.mjs` may have a syntax error. Each macro name uses `\\` for the backslash in JS strings. Verify the exact form shown above.

**If Callout backgrounds appear wrong** (no tint visible, or the wrong color), the inline RGB values in the Astro `<style>` block reference cyan-500 = `rgb(6, 182, 212)` and amber-500 = `rgb(245, 158, 11)`. These must match `variables.css`. If `variables.css` ever changes, update Callout's inline RGB values to match.

**If linked headings look like underlined cyan body text** (instead of normal heading appearance), the `.heading-anchor` rule in `content.css` isn't overriding `base.css`'s `a` styling. Verify `content.css` is imported AFTER `base.css` in `global.css`.

**If TypeScript complains about `Astro.props.title`** in any component, the `export interface Props` declaration needs to be at the top of the frontmatter. Astro's TypeScript support reads this declaration to type the component.

**If `<EqRef id="4.1" />` doesn't scroll to the equation**, the `id` attribute on `<Equation>` is `eq-4.1` (prefixed with `eq-`). The link from `<EqRef>` must also use the `eq-` prefix. Both are spec'd above; if they drift, the link breaks silently.

This session is the foundation every chapter inherits. The five components here will appear in 30 chapters worth of MDX. Take the time to verify each one looks right.

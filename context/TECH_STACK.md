# TECH_STACK

> Every Claude Code session reads this file before installing packages, writing configs, or making framework-level decisions.
> The stack is locked. If a session believes a different tool would be better, it surfaces an open question rather than substituting.

---

## Stack at a glance

| Layer | Choice | Why |
|---|---|---|
| Framework | **Astro 5** | Content-first; ships zero JS by default; React only mounts where placed |
| Authoring | **MDX** (`@astrojs/mdx`) | Markdown plus first-class React components |
| Interactivity | **React 18** islands | Mature, library ecosystem; only loads on pages that need it |
| Styling | **Tailwind 3** + CSS variables | Utility-first ergonomics; CSS variables make the palette swappable in one file |
| Type system | **TypeScript** (strict) | Catches widget shape errors before runtime; required for `.tsx` |
| Math | **KaTeX** via `rehype-katex` | Server-rendered LaTeX, fastest math option |
| Code highlighting | **Shiki** (Astro built-in) | Server-rendered, no client JS, supports any TextMate grammar |
| Code editor | **CodeMirror 6** | Lighter than Monaco; sufficient for Python and Pyodide integration |
| Runnable code | **Pyodide** (lazy-loaded) | Real numpy in-browser via WebAssembly |
| Diagrams | **D3** (custom) + **Recharts** (standard) | D3 for bespoke widgets; Recharts when a stock chart suffices |
| Icons | **lucide-react** | One icon set, tree-shakes cleanly |
| Animation | CSS + `requestAnimationFrame` + **framer-motion** (rare) | Most state transitions are CSS; framer-motion only when layout animates |
| Search | **Pagefind** | Static-site full-text search, built post-build |
| Deployment | **Vercel** | Auto-deploys on `main`, no config needed; previews on PRs |

---

## Why Astro (versus Next.js, Docusaurus, plain SPA)

**Astro wins for content-heavy sites with sprinkled interactivity.** This tutorial is fundamentally a reading experience — text, math, code — with ~40–50 interactive widgets distributed across 30 chapters. Astro's "islands" architecture means each chapter page ships only the JS for the widgets it actually contains. A widget-free chapter ships 0 KB of client JS.

Alternatives considered and rejected:

- **Next.js** — heavier baseline, App Router complexity that buys us nothing here, ships React framework code even on prose-only pages.
- **Docusaurus** — purpose-built for docs but heavily opinionated; customizing the design system would fight the framework. Also React-only routing.
- **VitePress** — Vue-based; we want React for widget ecosystem reasons.
- **Plain SPA with Vite + React Router** — would need to reinvent MDX, routing, SSG. No reason to.
- **MkDocs Material** — beautiful for docs but Python-tooling-heavy and would require fighting it for our interactivity layer.

The cost of Astro: a slightly less common framework than Next.js, so AI-assistant familiarity is lower. Mitigated by writing context files (like this one) that ground every session.

---

## Versions

Pin major versions. Float minor/patch. Lockfile (`package-lock.json`) committed.

| Package | Major version | Notes |
|---|---|---|
| `astro` | `^5.0.0` | Astro 5 introduced container API improvements and stable Content Layer |
| `@astrojs/mdx` | `^4.0.0` | Pairs with Astro 5 |
| `@astrojs/react` | `^4.0.0` | Astro's React integration |
| `@astrojs/tailwind` | `^6.0.0` | Tailwind 3 integration |
| `@astrojs/sitemap` | `^3.0.0` | |
| `react` | `^18.3.0` | React 19 is stable but adds no features we need; stay on 18 for ecosystem maturity |
| `react-dom` | `^18.3.0` | |
| `tailwindcss` | `^3.4.0` | Tailwind 4 uses CSS-based config that would conflict with our `tailwind.config.mjs` token-mapping pattern; stay on 3.x |
| `typescript` | `^5.6.0` | |
| `katex` | `^0.16.0` | Last stable major; widely supported |
| `remark-gfm` | `^4.0.0` | GFM tables, task lists, autolinks |
| `remark-math` | `^6.0.0` | |
| `rehype-katex` | `^7.0.0` | |
| `rehype-slug` | `^6.0.0` | |
| `rehype-autolink-headings` | `^7.0.0` | |
| `codemirror` | `^6.0.0` | Modular CodeMirror 6 |
| `@codemirror/lang-python` | `^6.0.0` | |
| `@codemirror/state` | `^6.0.0` | |
| `@codemirror/view` | `^6.0.0` | |
| `pyodide` | `~0.26.0` | Tilde-pin; Pyodide minor versions can break APIs |
| `d3` | `^7.9.0` | |
| `recharts` | `^2.13.0` | |
| `lucide-react` | `^0.460.0` | |
| `framer-motion` | `^11.0.0` | |
| `clsx` | `^2.0.0` | |
| `tailwind-merge` | `^2.0.0` | |
| `mathjs` | `^13.0.0` | |
| `pagefind` | `^1.1.0` | devDependency; built post-build |

### Dev dependencies

```
@types/react ^18.3.0
@types/react-dom ^18.3.0
@types/d3 ^7.4.0
@types/node ^22.0.0
```

### `package.json`

```json
{
  "name": "darvinyi-llm-tutorial",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build && pagefind --site dist",
    "preview": "astro preview",
    "typecheck": "astro check",
    "astro": "astro"
  },
  "dependencies": { /* see versions table above */ },
  "devDependencies": { /* see dev dependencies above */ }
}
```

---

## Configuration files

### `astro.config.mjs`

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
      // Custom darvinyi-cyan theme defined inline; tokens map to the
      // design-system palette (see context/DESIGN_SYSTEM.md → Code
      // rendering). The same hex values live in the CodeMirror
      // HighlightStyle in src/components/code/RunnableCode.tsx.
      theme: { /* darvinyi-cyan inline theme object — see actual config */ },
      wrap: false,
    },
  },
  vite: {
    optimizeDeps: {
      exclude: ['pyodide'], // never pre-bundle; always dynamic-import
    },
  },
});
```

The `tailwind({ applyBaseStyles: false })` flag is critical — we import our own base styles in `global.css` so Tailwind's preflight doesn't fight our custom reset.

The `vite.optimizeDeps.exclude: ['pyodide']` line is critical — without it, Vite tries to bundle Pyodide into the initial chunk, blowing the JS budget.

### `tsconfig.json`

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@lib/*": ["src/lib/*"],
      "@styles/*": ["src/styles/*"]
    },
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  },
  "include": ["src/**/*", "*.config.*"],
  "exclude": ["dist", "node_modules", ".astro"]
}
```

`noUncheckedIndexedAccess` catches a common widget bug: indexing an array and treating the result as definitely-present when it could be `undefined`.

### `tailwind.config.mjs`

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          elevated: 'var(--bg-elevated)',
          overlay: 'var(--bg-overlay)',
          inline: 'var(--bg-inline)',
        },
        fg: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          disabled: 'var(--text-disabled)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)',
        },
        cyan: {
          300: 'var(--cyan-300)',
          400: 'var(--cyan-400)',
          500: 'var(--cyan-500)',
          600: 'var(--cyan-600)',
        },
        amber: { 500: 'var(--amber-500)' },
        rose:  { 500: 'var(--rose-500)' },
        emerald: { 500: 'var(--emerald-500)' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'SF Mono', 'Menlo', 'monospace'],
      },
      maxWidth: {
        prose: 'var(--container-prose)',
        wide:  'var(--container-wide)',
      },
    },
  },
  plugins: [],
};
```

No Tailwind plugins. Specifically, **no `@tailwindcss/typography`** — its prose styles would conflict with our custom prose rhythm in `base.css`. We style elements directly.

### `.nvmrc`

```
20
```

Node 20 LTS. CI runs the same.

### `.gitignore`

```
node_modules
dist
.astro
.env
.env.local
.DS_Store
*.log
.vercel
```

---

## Pyodide integration pattern

Pyodide is the largest engineering risk in the stack. Done wrong, it bloats every page to 10MB and blocks page render. Done right, it loads only on demand and shares one instance across all `<RunnableCode>` blocks on a page.

### The singleton

```ts
// src/lib/pyodide.ts

declare global {
  interface Window {
    __pyodide?: any;
    __pyodideLoading?: Promise<any>;
  }
}

const PYODIDE_VERSION = '0.26.4';
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

/**
 * Returns a singleton Pyodide instance, loading it lazily on first call.
 * Safe to call multiple times concurrently — all callers receive the same instance.
 *
 * @param packages - Pyodide packages to ensure are loaded (e.g., ['numpy'])
 */
export async function getPyodide(packages: string[] = []): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('Pyodide is client-only; do not call from Astro server context.');
  }

  // Already loaded
  if (window.__pyodide) {
    await ensurePackages(window.__pyodide, packages);
    return window.__pyodide;
  }

  // Load in progress — wait for the same Promise
  if (window.__pyodideLoading) {
    const py = await window.__pyodideLoading;
    await ensurePackages(py, packages);
    return py;
  }

  // First call — kick off the load
  window.__pyodideLoading = (async () => {
    // Dynamic import so Pyodide is never in the initial bundle
    const { loadPyodide } = await import(/* @vite-ignore */ `${PYODIDE_CDN}pyodide.mjs`);
    const py = await loadPyodide({ indexURL: PYODIDE_CDN });
    window.__pyodide = py;
    await ensurePackages(py, packages);
    return py;
  })();

  return await window.__pyodideLoading;
}

async function ensurePackages(py: any, packages: string[]) {
  if (packages.length === 0) return;
  // Pyodide is idempotent on already-loaded packages
  await py.loadPackage(packages);
}

/**
 * Run a Python snippet, capturing stdout. Returns { stdout, error }.
 */
export async function runPython(
  code: string,
  packages: string[] = []
): Promise<{ stdout: string; error?: string }> {
  const py = await getPyodide(packages);
  const stdout: string[] = [];
  py.setStdout({ batched: (s: string) => stdout.push(s) });
  py.setStderr({ batched: (s: string) => stdout.push(s) });
  try {
    await py.runPythonAsync(code);
    return { stdout: stdout.join('') };
  } catch (e: any) {
    return { stdout: stdout.join(''), error: String(e?.message ?? e) };
  }
}
```

### Why a CDN exception for Pyodide

The design system says "no CDN dependencies for fonts or code." Pyodide is the one documented exception. Reasoning:

- The Pyodide runtime is ~10MB (WASM + stdlib). Self-hosting would bloat the deploy.
- `cdn.jsdelivr.net` is Cloudflare-backed, stable, and used by major projects. Acceptable dependency.
- Pyodide's own loader (`pyodide.mjs`) expects to resolve adjacent files from `indexURL`; self-hosting requires copying the whole release tree.

If this trade-off ever shifts (e.g., jsdelivr deprecates, or Vercel adds Pyodide-friendly self-hosting tooling), revisit in a dedicated session.

### Rules — never violate

1. **Never `import` Pyodide at module top level.** Always dynamic `import()` inside the singleton.
2. **Never load Pyodide in `useEffect` on widget mount.** Load on first user-triggered Run.
3. **Never create more than one Pyodide instance per page.** The singleton enforces this — don't bypass it.
4. **Never block the main thread during Pyodide load.** It can take 3–8 seconds on first run; show a progress indicator.
5. **Always catch `PythonError`** when running user code. Format the traceback in the widget output area; never let it bubble to a generic error boundary.

### The `<RunnableCode>` component shape

```tsx
// src/components/code/RunnableCode.tsx (sketch — full impl in scaffolding session 05)
import { useState, useRef } from 'react';
import { EditorView } from '@codemirror/view';
import { python } from '@codemirror/lang-python';
import { runPython } from '@lib/pyodide';

interface Props {
  defaultCode: string;
  packages?: string[];
  height?: number;
  outputHeight?: number;
  title?: string;
  readonly?: boolean;
}

export default function RunnableCode({ defaultCode, packages = ['numpy'], /* ... */ }: Props) {
  const editorRef = useRef<EditorView | null>(null);
  const [output, setOutput] = useState<{ stdout: string; error?: string } | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'running' | 'done'>('idle');

  async function run() {
    setStatus('loading');
    const code = editorRef.current?.state.doc.toString() ?? defaultCode;
    setStatus('running');
    const result = await runPython(code, packages);
    setOutput(result);
    setStatus('done');
  }

  // ... CodeMirror init, Run button, output rendering
}
```

Full implementation in scaffolding session 05.

---

## File organization

```
darvinyi-llm-tutorial/
├── MASTER_PLAN.md
├── BUILD_ORDER.md
├── README.md
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
├── package-lock.json
├── .nvmrc
├── .gitignore
├── public/
│   ├── fonts/
│   │   ├── inter/
│   │   └── jetbrains-mono/
│   ├── favicon.svg
│   └── og-image.png
├── src/
│   ├── env.d.ts
│   ├── pages/
│   │   ├── index.astro                    # /
│   │   ├── about.astro                    # /about
│   │   ├── 404.astro
│   │   └── ch[NN]-[slug]/
│   │       └── index.mdx                  # /chXX-slug/
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── ChapterLayout.astro
│   ├── components/
│   │   ├── content/                       # Astro components for MDX content primitives
│   │   │   ├── Callout.astro
│   │   │   ├── Equation.astro
│   │   │   ├── EqRef.astro
│   │   │   ├── Figure.astro
│   │   │   ├── WidgetFrame.astro
│   │   │   └── index.ts
│   │   ├── code/                          # Code rendering components
│   │   │   ├── RunnableCode.tsx
│   │   │   ├── CopyButton.tsx
│   │   │   └── index.ts
│   │   ├── nav/                           # Navigation chrome
│   │   │   ├── Sidebar.astro
│   │   │   ├── MobileNav.astro
│   │   │   ├── MobileNavToggle.tsx
│   │   │   ├── TableOfContents.astro
│   │   │   ├── ChapterNav.astro
│   │   │   └── Footer.astro
│   │   └── widgets/                       # Interactive widgets — one folder per chapter
│   │       ├── ch01/
│   │       │   └── BackpropVisualizer.tsx
│   │       ├── ch04/
│   │       │   ├── AttentionHeatmap.tsx
│   │       │   └── CausalMaskExplainer.tsx
│   │       └── ...
│   ├── lib/                               # Pure logic, utilities, side-effects (not UI)
│   │   ├── pyodide.ts
│   │   ├── seeded-prng.ts
│   │   ├── chapters.ts
│   │   ├── constants.ts
│   │   └── math/                          # Math helpers used by widgets
│   │       ├── softmax.ts
│   │       └── linear-algebra.ts
│   └── styles/
│       ├── global.css                     # Imports all the below
│       ├── fonts.css                      # @font-face declarations
│       ├── variables.css                  # CSS custom properties
│       ├── base.css                       # Base element styles (h1, p, a, code, ...)
│       └── katex.css                      # KaTeX overrides
├── research/                              # Per-chapter pre-research (read by Claude Code at session start)
│   └── chNN-slug/
│       └── research.md
├── prompts/                               # Claude Code session prompts
│   ├── scaffolding/
│   ├── chapters/
│   │   └── chNN-slug/
│   └── polish/
└── context/                               # Read by every Claude Code session
    ├── PROJECT_OVERVIEW.md
    ├── DESIGN_SYSTEM.md
    ├── TECH_STACK.md
    └── CURRICULUM.md
```

### Where things live

| Type | Location | Examples |
|---|---|---|
| Astro components for MDX primitives | `src/components/content/` | Callout, Equation, Figure, WidgetFrame |
| Code-rendering components | `src/components/code/` | RunnableCode, CopyButton |
| Navigation chrome | `src/components/nav/` | Sidebar, MobileNav, TOC, Footer |
| Interactive widgets | `src/components/widgets/chNN/` | AttentionHeatmap, MoERoutingViz |
| Layouts | `src/layouts/` | BaseLayout, ChapterLayout |
| Pure logic (no React) | `src/lib/` | pyodide singleton, PRNG, math helpers |
| Constants | `src/lib/constants.ts` | Hardcoded paths, version strings |
| Chapter manifest | `src/lib/chapters.ts` | The 30-chapter typed list |
| Page routes | `src/pages/` | index.astro, chXX-slug/index.mdx |
| Static assets | `public/` | Fonts, images, favicon |
| Per-chapter assets | `public/chNN/` | Static SVGs for figures, OG images |

---

## Routing

Astro file-based routing. Chapter slugs are stable URLs that never change after publication.

```
src/pages/index.astro              → /
src/pages/about.astro              → /about
src/pages/404.astro                → /404
src/pages/ch01-neural-net-primitives/index.mdx  → /ch01-neural-net-primitives/
```

The chapter slug pattern is `chXX-short-slug` where `XX` is the two-digit chapter number. This matches the folder structure in `prompts/chapters/` and `research/`.

Internal links use Astro's `<a>` with absolute paths from site root: `<a href="/ch04-attention/#scaling">`. Never use relative paths between chapters.

---

## Build and deploy

### Build steps

```bash
npm run build
# Equivalent to: astro build && pagefind --site dist
```

1. Astro builds the static site to `dist/`
2. Pagefind indexes `dist/` and adds search assets to `dist/pagefind/`
3. Vercel detects `dist/` automatically and serves it

### Vercel configuration

No `vercel.json` needed for the default case. Vercel detects Astro and configures itself. If we ever need redirects or custom headers, add a minimal `vercel.json`.

The Vercel project is auto-deployed:
- Pushes to `main` deploy to `llm-tutorial.darvinyi.com`
- PRs deploy to `*.vercel.app` preview URLs

### DNS

Custom domain `llm-tutorial.darvinyi.com` configured in Vercel project settings, with a Namecheap CNAME `llm-tutorial.darvinyi.com → cname.vercel-dns.com`. No `www.` alias for subdomains.

---

## Performance budget

These are hard ceilings; chapter sessions that would blow them must surface the issue.

| Metric | Budget | Measured how |
|---|---|---|
| First-Load JS (prose-only chapter, no widgets) | < 30 KB gzipped | Lighthouse / `astro build` output |
| First-Load JS (chapter with 1 widget) | < 80 KB gzipped | |
| First-Load JS (chapter with 2 widgets) | < 120 KB gzipped | |
| Pyodide first-run total (cached after) | ~10 MB | Network tab on first run |
| Largest Contentful Paint (desktop, good connection) | < 1.5 s | Lighthouse |
| LCP (mobile, slow 4G) | < 3.0 s | Lighthouse |
| Lighthouse Performance | > 95 desktop, > 85 mobile | |
| Lighthouse Accessibility | 100 | Hard requirement |
| Lighthouse Best Practices | > 95 | |

### Optimization principles

- **Static everywhere possible.** Astro renders MDX to HTML at build time. No runtime React on prose-only pages.
- **Code-split per widget.** Each widget is its own React component; Astro's island architecture loads only the widgets present on the current page.
- **No client-side router.** Each page is a separate HTML document.
- **Aggressive caching.** Vercel sets sensible cache headers automatically. Fonts and Pyodide get 1-year cache.
- **No giant images.** Figures are SVG where possible; raster figures are WebP, sized to display dimensions.

---

## Code conventions

### Naming

- **React components** (`.tsx`): `PascalCase.tsx`
- **Astro components** (`.astro`): `PascalCase.astro`
- **Utilities** (`.ts`): `camelCase.ts`
- **Constants**: `SCREAMING_SNAKE_CASE` exported from `src/lib/constants.ts`
- **CSS classes**: Tailwind utilities; custom classes (rare) are `kebab-case`

### Imports

Order:

1. External (`react`, `astro`, third-party libs)
2. Internal aliased (`@components/...`, `@lib/...`, `@styles/...`)
3. Relative (`./Sibling.tsx`)
4. CSS imports last

```tsx
import { useState, useEffect } from 'react';
import * as d3 from 'd3';

import { seededPRNG } from '@lib/seeded-prng';
import WidgetFrame from '@components/content/WidgetFrame.astro';

import { localHelper } from './helpers';

import './widget.css'; // when a widget has its own CSS module
```

### Component structure

Standard React component shape:

```tsx
interface AttentionHeatmapProps {
  initialTokens?: string[];
  seed?: number;
}

export default function AttentionHeatmap({
  initialTokens = ['the', 'cat', 'sat', 'on', 'the', 'mat'],
  seed = 42,
}: AttentionHeatmapProps) {
  // 1. Hooks (state, refs)
  const [tokens, setTokens] = useState(initialTokens);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 2. Derived values
  const rng = useMemo(() => seededPRNG(seed), [seed]);

  // 3. Effects
  useEffect(() => {
    /* canvas drawing */
    return () => { /* cleanup */ };
  }, [tokens]);

  // 4. Handlers
  const handleTokenClick = (i: number) => { /* ... */ };

  // 5. Render
  return (
    <div className="...">
      <canvas ref={canvasRef} />
    </div>
  );
}
```

### State management

- **`useState`** for everything component-local.
- **`useRef`** for mutable values that don't trigger re-renders (DOM nodes, animation frame IDs, the Pyodide instance).
- **No global state.** No Redux, Zustand, Jotai, Context. Every widget is self-contained.
- **No cross-widget communication.** If two widgets need to share state, they're really one widget — combine them.

### Animation cleanup

Every `requestAnimationFrame` loop cancels on unmount. Every D3 transition cleans up. Every event listener registered on `window` removes itself.

```tsx
useEffect(() => {
  let raf: number;
  const tick = () => {
    /* draw */
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}, []);
```

---

## Critical implementation rules

These exist because violating them breaks the site in non-obvious ways. They are not negotiable.

1. **MDX files never contain `<script>` tags.** Interactivity goes in React components.
2. **All widget visuals are deterministic.** Seed every PRNG via `seededPRNG`. Never `Math.random()` or `Date.now()` for visual output.
3. **Pyodide is dynamic-import only.** Top-level `import 'pyodide'` is forbidden.
4. **No CDN fonts or icons** — self-host everything except Pyodide's WASM runtime.
5. **Code blocks are server-rendered by Shiki.** Never use a client-side highlighter (Prism, highlight.js, etc.).
6. **No `useEffect` without cleanup** if the effect starts a loop, listener, or subscription.
7. **No new third-party state-management libraries** beyond what's listed in this file.
8. **No conflicting CSS preflight.** `applyBaseStyles: false` on the Tailwind integration is required.
9. **No global side effects in widget files.** Components are pure; setup happens inside `useEffect`.
10. **Type safety is enforced.** `npm run typecheck` passes before any commit.

---

## What NOT to install

If a session would reach for any of these, stop and surface the question:

- **Next.js** — we're using Astro
- **MUI / Chakra / Radix beyond Pop / Tooltip** — Tailwind covers our component needs; introducing a component lib creates style conflicts
- **styled-components / emotion** — we're using Tailwind plus CSS variables
- **Lodash** — use native JS; if a specific lodash function is essential, import it individually (`import isEqual from 'lodash/isEqual'`)
- **jQuery** — obviously
- **Three.js / Babylon** — no 3D content planned; if a chapter ever needs it, raise it explicitly
- **Redux / Zustand / Jotai / Context** — widgets are self-contained
- **React Router** — Astro handles routing
- **react-query / SWR** — no remote data fetching at runtime (the one exception is Anthropic-API tool-use widgets in Ch 21+, which use raw `fetch`)
- **moment.js / day.js** — we don't render dates beyond a footer year
- **Axios** — `fetch` is fine
- **Babel plugins** — Astro and Vite handle transpilation
- **Webpack** — Astro uses Vite
- **`@tailwindcss/typography`** — would conflict with our custom prose styles

---

## Decision log

Things that have already been decided and don't need to be re-litigated:

- **Astro over Next.js** — content-first, ships less JS
- **MDX over plain Markdown** — first-class React in chapters is needed
- **React 18 over React 19** — 19 adds nothing this project needs; 18 has fuller ecosystem
- **Tailwind 3 over Tailwind 4** — 4's CSS-based config conflicts with our token-mapping pattern
- **CodeMirror 6 over Monaco** — lighter, sufficient for Python editing in Pyodide context
- **Pyodide over Skulpt / Brython / server-side Python** — only Pyodide runs real numpy in browser
- **D3 + Recharts (both)** — D3 for bespoke widgets, Recharts for stock charts (loss curves, bars)
- **Shiki over Prism / highlight.js** — server-rendered, no client JS
- **Pagefind over Algolia / Lunr** — Pagefind is static-site-friendly, self-hosted, no API limits
- **Vercel over Netlify / Cloudflare Pages** — Astro's first-class deploy target; auto-detects config
- **No analytics beyond Vercel's built-in** — privacy stance
- **Dark mode only** — design stance
- **Inter over Crimson Pro for this site** — engineering aesthetic; Crimson Pro is the textbook's voice

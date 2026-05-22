# Session 01 — Repo init & Astro setup

> First Claude Code session. Bootstraps the project from a near-empty repo to a working dev server with no styling and a placeholder index page. Subsequent sessions fill in the design system, MDX pipeline, layout, Pyodide, and deploy.

---

## Read first

Before writing any code, read these files:

- `MASTER_PLAN.md` — to understand the project's shape and where this session sits in the build arc
- `BUILD_ORDER.md` — to confirm this is the file expected next
- `context/PROJECT_OVERVIEW.md` — for tone and project identity
- `context/TECH_STACK.md` — **the primary spec for this session.** Versions, configs, and conventions all come from here.
- `context/DESIGN_SYSTEM.md` — skim only. Session 01 doesn't implement styling, but you need to know which Tailwind tokens will be wired up here.

If anything in this prompt contradicts the context files, the context files win — surface the contradiction as an open question rather than silently choosing.

---

## Goal

Bootstrap a working Astro 5 + MDX + React 18 + Tailwind 3 + TypeScript project with the full dependency set from `TECH_STACK.md` installed.

**End state:**
- `npm install` completes cleanly
- `npm run dev` serves a placeholder page at `http://localhost:4321/` showing "LLM Tutorial · Site under construction" with no styling
- `npm run build` produces a `dist/` folder containing a valid `index.html`
- `npm run typecheck` passes with zero errors

No design system applied yet. No content components. No layout chrome. Just the engineering scaffolding that every subsequent session builds on.

---

## Inputs

Repository state when this session starts:

```
darvinyi-llm-tutorial/
├── MASTER_PLAN.md
├── BUILD_ORDER.md
├── context/
│   ├── PROJECT_OVERVIEW.md
│   ├── DESIGN_SYSTEM.md
│   ├── TECH_STACK.md
│   └── CURRICULUM.md
└── prompts/
    └── scaffolding/
        ├── session-01-repo-init.md   (this file)
        └── session-02-... etc (as built)
```

The GitHub repo `github.com/yidarvin/darvinyi-llm-tutorial` exists. The local clone may or may not contain a default GitHub-generated `README.md` — overwrite it. Node 20 is installed (matches `.nvmrc`, which this session creates).

---

## Deliverables

Create exactly these nine files:

1. `package.json`
2. `astro.config.mjs`
3. `tsconfig.json`
4. `tailwind.config.mjs`
5. `.nvmrc`
6. `.gitignore`
7. `src/env.d.ts`
8. `src/pages/index.astro`
9. `README.md`

After file creation: run `npm install` and verify `npm run dev`, `npm run build`, and `npm run typecheck` all succeed.

**Do NOT create** any other files. No `src/styles/*`, `src/components/*`, `src/layouts/*`, `src/lib/*`, `public/fonts/*`, or anything else. Those belong to subsequent sessions.

---

## Detailed spec

### `package.json`

Versions match `context/TECH_STACK.md`. Full content:

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
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/mdx": "^4.0.0",
    "@astrojs/react": "^4.0.0",
    "@astrojs/sitemap": "^3.0.0",
    "@astrojs/tailwind": "^6.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "remark-gfm": "^4.0.0",
    "remark-math": "^6.0.0",
    "rehype-katex": "^7.0.0",
    "rehype-slug": "^6.0.0",
    "rehype-autolink-headings": "^7.0.0",
    "katex": "^0.16.0",
    "codemirror": "^6.0.0",
    "@codemirror/lang-python": "^6.0.0",
    "@codemirror/state": "^6.0.0",
    "@codemirror/view": "^6.0.0",
    "d3": "^7.9.0",
    "recharts": "^2.13.0",
    "lucide-react": "^0.460.0",
    "framer-motion": "^11.0.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "mathjs": "^13.0.0"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/d3": "^7.4.0",
    "@types/node": "^22.0.0",
    "typescript": "^5.6.0",
    "pagefind": "^1.1.0"
  }
}
```

**Notes:**
- `pyodide` is deliberately **not** in dependencies. Pyodide loads via dynamic import from a CDN, never from `node_modules`. Session 05 documents this; nothing to install for it now.
- `@astrojs/check` is the type-checking adapter that powers `npm run typecheck`.
- `pagefind` is a devDependency — it runs only at build time as the post-build step.

After writing this file, run `npm install`. The lockfile (`package-lock.json`) will be generated and must be committed.

### `astro.config.mjs`

Full content:

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://llm-tutorial.darvinyi.com',
  integrations: [
    mdx(),
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
      // Pyodide is dynamic-imported from a CDN — never pre-bundle it.
      // This entry is forward-looking; safe to include before Pyodide is in use.
      exclude: ['pyodide'],
    },
  },
});
```

**Notes:**
- `tailwind({ applyBaseStyles: false })` is **non-negotiable.** Session 02 writes custom base styles in `src/styles/base.css`; Tailwind's default preflight would conflict.
- `mdx()` is called with no options here. Session 03 will extend it with `remarkPlugins` and `rehypePlugins` for math and headings.
- The `shikiConfig` uses a single theme (`github-dark-dimmed`) — the site is dark-mode only per `DESIGN_SYSTEM.md`.
- `vite.optimizeDeps.exclude: ['pyodide']` is forward-looking but safe to include now. Vite ignores excludes for packages not in the dep tree; once Pyodide enters via dynamic import in session 05, this line prevents accidental pre-bundling.

### `tsconfig.json`

Full content:

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

**Notes:**
- Extends `astro/tsconfigs/strict` (not `strictest` — `strictest` adds `noUnusedLocals` and `noUnusedParameters` which are annoying during widget development where you often have temporarily-unused locals).
- `noUncheckedIndexedAccess: true` is added explicitly. It's part of `strictest` but not `strict`; we want it because it catches a common widget bug: indexing arrays and treating the result as definitely-present when it could be `undefined`.
- `noImplicitOverride: true` requires the `override` keyword on subclass methods.
- Path aliases match what `TECH_STACK.md` specifies. Every future session's imports use these.
- `*.config.*` is in `include` so `astro.config.mjs` and `tailwind.config.mjs` are type-checked.

### `tailwind.config.mjs`

Full content:

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
        amber:   { 500: 'var(--amber-500)' },
        rose:    { 500: 'var(--rose-500)' },
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

**Notes:**
- All color tokens reference CSS variables that **don't exist yet.** Session 02 creates them in `src/styles/variables.css`. Until then, any class like `bg-bg-primary` resolves to `var(--bg-primary)` which the browser falls back to its default. That's fine — the placeholder page doesn't use these classes anyway.
- No Tailwind plugins. Specifically, **no `@tailwindcss/typography`** — its prose styles conflict with our custom prose rhythm coming in session 02.
- The `fontFamily` references Inter and JetBrains Mono. The `@font-face` declarations come in session 02; until then the browser falls back to the next entries in the stack.

### `.nvmrc`

```
20
```

Single line. Node 20 LTS. CI and Vercel both use this.

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

Standard Astro/Node ignores plus `.vercel` for the Vercel CLI's local cache (session 06 may use this).

### `src/env.d.ts`

```ts
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
```

Astro's standard env reference file. The first line references types generated by Astro itself (in `.astro/`); the second pulls in Astro's ambient client-side types.

### `src/pages/index.astro`

Temporary placeholder. Session 02 will replace it with a typography test page; session 04 replaces that with the real landing page. For now:

```astro
---
// Placeholder index page.
// Replaced in session 02 (typography test), then again in session 04 (real landing page).
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="generator" content={Astro.generator} />
    <title>LLM Tutorial</title>
  </head>
  <body>
    <h1>LLM Tutorial</h1>
    <p>Site under construction.</p>
  </body>
</html>
```

Deliberately unstyled. The browser's default rendering is what we want at this stage — it confirms the toolchain works without depending on any custom styling.

### `README.md`

Overwrite any existing GitHub-default README. Content (the inner triple-backticks are literal — use a heredoc or copy carefully):

````markdown
# darvinyi-llm-tutorial

Comprehensive tutorial: from numpy primitives to modern LLM agent frameworks.

**Live site:** https://llm-tutorial.darvinyi.com

## Development

```bash
npm install
npm run dev
```

Dev server runs at http://localhost:4321

## Build

```bash
npm run build
```

Output goes to `dist/`. Vercel auto-deploys `main`.

## Structure

- `src/` — the Astro app
- `context/` — design system, tech stack, curriculum (read by Claude Code sessions)
- `prompts/` — Claude Code session prompts (the build's archaeological record)
- `research/` — per-chapter pre-research material

See `MASTER_PLAN.md` and `BUILD_ORDER.md` for the project's roadmap.

## Author

Darvin Yi · [darvinyi.com](https://darvinyi.com)
````

---

## Acceptance criteria

All of the following must be true before this session is considered complete:

1. **`npm install` completes** with zero errors. Some peer-dependency warnings (severity `warn`) are acceptable; severity `error` is not.
2. **`package-lock.json` is generated** and present in the repo root.
3. **`npm run dev`** starts the Astro dev server on port 4321 with no console errors. The "Watch mode" / "ready in Xms" message appears.
4. **Browsing to `http://localhost:4321/`** displays "LLM Tutorial" as an h1 and "Site under construction" as a paragraph, using browser default styling. White-on-black, serif font, etc. — whatever the browser's defaults are. Looks unstyled. That's correct.
5. **`npm run build`** completes successfully. `dist/index.html` exists and contains the placeholder content. The build may emit a warning that Pagefind found no content to index — that's expected.
6. **`npm run typecheck`** passes with **zero errors.** Astro's check output ends with something like `Result: 0 errors, 0 warnings, 0 hints.`
7. **Final repo structure** matches exactly:

```
darvinyi-llm-tutorial/
├── .gitignore
├── .nvmrc
├── BUILD_ORDER.md
├── MASTER_PLAN.md
├── README.md
├── astro.config.mjs
├── context/                  (already present from Phase 1)
├── package.json
├── package-lock.json
├── prompts/                  (already present)
├── src/
│   ├── env.d.ts
│   └── pages/
│       └── index.astro
├── tailwind.config.mjs
└── tsconfig.json
```

No `src/components/`, no `src/styles/`, no `src/layouts/`, no `src/lib/`. Those come in later sessions.

---

## Out of scope (do NOT do these)

Explicit non-deliverables. Each of these would conflict with a later session's work:

- ❌ **Do not create any CSS files.** No `src/styles/global.css`, no `variables.css`. Session 02 owns all styling setup.
- ❌ **Do not create `BaseLayout.astro` or any layout file.** Session 02 creates `BaseLayout.astro`; session 04 creates `ChapterLayout.astro`.
- ❌ **Do not configure KaTeX, remark plugins, or rehype plugins.** Session 03 adds these to `astro.config.mjs`.
- ❌ **Do not install Pyodide.** Session 05 documents the Pyodide pattern; it loads from a CDN at runtime, never from `node_modules`.
- ❌ **Do not download fonts.** Session 02 fetches Inter and JetBrains Mono into `public/fonts/`.
- ❌ **Do not create a favicon.** Session 02 creates a placeholder favicon; session 06 finalizes branding assets.
- ❌ **Do not configure Vercel or any deployment.** Session 06 handles this entirely.
- ❌ **Do not configure Pagefind beyond its presence in `package.json`.** Session 06 wires up search.
- ❌ **Do not create a 404 page.** Session 04 handles error pages.
- ❌ **Do not write any React components.** `@astrojs/react` is installed but unused at this stage. That's correct.
- ❌ **Do not commit to git on the session author's behalf.** The wire-up section below is for the human to run after verifying acceptance criteria.

If during this session you find yourself wanting to do any of the above, that's the signal that the work belongs in a later session. Stop and confirm.

---

## Wire-up

After all acceptance criteria pass, the human running this session should:

```bash
# From the repo root
git add .gitignore .nvmrc README.md astro.config.mjs package.json package-lock.json src/ tailwind.config.mjs tsconfig.json
git commit -m "session 01: bootstrap Astro 5 + MDX + React + Tailwind + TS"
git push origin main
```

Verify on GitHub that all files are present.

Run `npm run dev` one last time and confirm the placeholder page still renders.

The next session (`session-02-design-system.md`) assumes:
- A working dev server on port 4321
- `package-lock.json` is committed
- The placeholder `src/pages/index.astro` exists (will be replaced in session 02)

---

## Notes for the session author

This is the foundation that 170+ subsequent sessions build on. Take the time to verify every acceptance criterion. A bad bootstrap manifests as confusing errors many sessions later, often in places that look unrelated to the original mistake.

**If `npm install` produces unexpected peer-dependency errors** (not warnings), the version pins in `package.json` may have drifted since `TECH_STACK.md` was written. Check `context/TECH_STACK.md` for the canonical version list. If a genuine adjustment is required, surface it as an open question rather than silently changing versions — `TECH_STACK.md` is the source of truth and should be updated first if any package needs a different version than specified.

**If the Astro dev server starts but throws a runtime error** on the index page, the most common cause is a malformed `astro.config.mjs`. Re-check against the exact content specified above, paying attention to import paths and the integration callsites.

**If `npm run typecheck` fails with confusing errors** about missing types, ensure `src/env.d.ts` exists with the exact two reference directives shown above. Astro's type-generation depends on running `astro dev` or `astro check` once to populate `.astro/types.d.ts` — if you haven't run either yet, run `npm run dev` once (Ctrl-C immediately after the ready message) before re-running typecheck.

**Do not deviate from the specified file contents** without surfacing the deviation as an open question. The exact contents above are the contract every subsequent session inherits.

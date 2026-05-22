# Session 05 — Pyodide & RunnableCode

> The trickiest engineering session in the project. Wires up Python execution in the browser via Pyodide, with a clean React component (`RunnableCode`) wrapping a CodeMirror 6 editor. Also introduces the seeded PRNG utility every widget uses.

---

## Read first

Before writing any code, read these files:

- `context/PROJECT_OVERVIEW.md` — for the "runnable code earns its place" stance
- `context/DESIGN_SYSTEM.md` — **especially "Code rendering" and "Widget aesthetics."** The `<RunnableCode>` props and visual treatment come from here.
- `context/TECH_STACK.md` — **the primary spec.** Contains the Pyodide singleton pattern in full, the CDN exception rationale, and the critical rules ("never import Pyodide at module top level," "singleton per page," "lazy-load on Run click").
- `prompts/scaffolding/session-04-layout-and-navigation.md` — for the layout this session lives inside

If anything in this prompt contradicts `TECH_STACK.md`'s Pyodide pattern, `TECH_STACK.md` wins.

---

## Goal

Make Python executable in the browser, on demand, via Pyodide — without blowing the initial JS budget. Add the seeded PRNG utility that every widget will use for deterministic randomness. Verify both in the MDX test page.

**End state:**
- A user clicks **Run** on a `<RunnableCode>` block. The first time, a cyan progress bar shows "Loading Python environment…" for 3–8 seconds. Subsequent clicks (anywhere on the page) skip the load — the singleton is cached.
- numpy is available by default. Other Pyodide packages can be requested per-block via the `packages` prop.
- Python errors render as a red-bordered output block with the full traceback.
- The seeded PRNG (`mulberry32`) is importable at `@lib/seeded-prng` and produces deterministic sequences.
- `npm run build` does NOT bundle Pyodide into the initial JS. The Pyodide runtime loads from `cdn.jsdelivr.net` on first Run click only.

---

## Inputs

State of the repo after sessions 01–04:

- Working dev server with design system, MDX pipeline, layout chrome
- `astro.config.mjs` already has `vite.optimizeDeps.exclude: ['pyodide']` (from session 01)
- `@codemirror/state`, `@codemirror/view`, `@codemirror/lang-python` already installed (from session 01)
- `src/components/code/` does not yet exist
- `src/lib/` exists (contains `chapters.ts`); `pyodide.ts` and `seeded-prng.ts` not yet there
- `src/pages/test-mdx.mdx` exists and stays in place — session 05 adds a `<RunnableCode>` block to it

---

## Deliverables

1. `src/lib/pyodide.ts` — the Pyodide singleton + `runPython()` helper
2. `src/lib/seeded-prng.ts` — mulberry32 PRNG + helpers
3. `src/components/code/RunnableCode.tsx` — the React component
4. `src/components/code/RunnableCode.module.css` — scoped styles
5. `src/components/code/index.ts` — barrel export
6. **Update** `src/pages/test-mdx.mdx` — add a `<RunnableCode>` section so we can verify the pipeline end-to-end
7. **Update** `src/pages/ch01-neural-net-primitives/index.astro` — add a small `<RunnableCode>` block as a second verification point (and to confirm React islands work inside `ChapterLayout`)

**Do NOT modify** any file under `src/styles/`, `src/components/content/`, `src/components/nav/`, or any layout file. Those are owned by earlier sessions.

---

## Detailed spec

### 1. `src/lib/pyodide.ts`

The singleton. Implements the pattern from `context/TECH_STACK.md` with explicit race-safe handling, idempotent package loading, and stdout/stderr capture.

```ts
// src/lib/pyodide.ts

declare global {
  interface Window {
    __pyodide?: any;
    __pyodideLoading?: Promise<any>;
    loadPyodide?: (options: { indexURL: string }) => Promise<any>;
  }
}

const PYODIDE_VERSION = '0.26.4';
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

/**
 * Inject the Pyodide loader script (sets window.loadPyodide).
 * Idempotent: safe to call multiple times; only injects once.
 */
function injectPyodideScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Pyodide loader script can only be injected in the browser.'));
      return;
    }
    if (window.loadPyodide) { resolve(); return; }

    const existing = document.querySelector<HTMLScriptElement>('script[data-pyodide-loader]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Pyodide loader script failed to load')));
      return;
    }

    const script = document.createElement('script');
    script.src = `${PYODIDE_INDEX_URL}pyodide.js`;
    script.async = true;
    script.dataset.pyodideLoader = 'true';
    script.addEventListener('load', () => {
      if (window.loadPyodide) resolve();
      else reject(new Error('Pyodide script loaded but window.loadPyodide is undefined'));
    });
    script.addEventListener('error', () => reject(new Error('Failed to load Pyodide loader script from CDN')));
    document.head.appendChild(script);
  });
}

/**
 * Returns a singleton Pyodide instance, loading it lazily on first call.
 * Safe under concurrent first-callers: they all receive the same Promise.
 *
 * @param packages - Pyodide packages to ensure are loaded (idempotent if already loaded)
 */
export async function getPyodide(packages: string[] = []): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('Pyodide is client-only; do not call from Astro server context.');
  }

  // Case 1: already loaded
  if (window.__pyodide) {
    await ensurePackages(window.__pyodide, packages);
    return window.__pyodide;
  }

  // Case 2: load already in flight; share the same Promise
  if (window.__pyodideLoading) {
    const py = await window.__pyodideLoading;
    await ensurePackages(py, packages);
    return py;
  }

  // Case 3: cold start — kick off the load
  window.__pyodideLoading = (async () => {
    await injectPyodideScript();
    if (!window.loadPyodide) {
      throw new Error('Pyodide script loaded but loadPyodide is unavailable.');
    }
    const py = await window.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
    window.__pyodide = py;
    await ensurePackages(py, packages);
    return py;
  })();

  return window.__pyodideLoading;
}

async function ensurePackages(py: any, packages: string[]): Promise<void> {
  if (packages.length === 0) return;
  // loadPackage is idempotent — re-loading a package is a no-op
  await py.loadPackage(packages);
}

export interface RunResult {
  stdout: string;
  error?: string;
}

/**
 * Run a Python snippet, capturing stdout and stderr.
 * Returns the captured output and an optional error message.
 *
 * Does NOT throw on Python errors — returns them in the `error` field.
 * Throws only on infrastructure failures (Pyodide load failure, network errors).
 */
export async function runPython(code: string, packages: string[] = []): Promise<RunResult> {
  const py = await getPyodide(packages);

  const buffer: string[] = [];
  py.setStdout({ batched: (s: string) => buffer.push(s) });
  py.setStderr({ batched: (s: string) => buffer.push(s) });

  try {
    await py.runPythonAsync(code);
    return { stdout: buffer.join('') };
  } catch (e: any) {
    // PythonError has .message containing the traceback
    const errorMessage = String(e?.message ?? e);
    return { stdout: buffer.join(''), error: errorMessage };
  }
}
```

**Notes:**
- The `declare global { interface Window { ... } }` block extends the TypeScript type of `window` so we can attach `__pyodide`, `__pyodideLoading`, and `loadPyodide` without TS complaints.
- Script injection (rather than ES module dynamic import) is the recommended approach for bundler compatibility — Vite can be finicky about dynamic imports of remote URLs.
- The `data-pyodide-loader` attribute is checked before injecting, so even if multiple components race to inject, only one script tag ends up in the DOM.
- `loadPackage` is idempotent in Pyodide ≥ 0.24, so calling it on already-loaded packages is a no-op (no need to track which packages are already loaded ourselves).
- `runPython` swallows Python errors and returns them — caller code can render them inline without try/catch noise.

### 2. `src/lib/seeded-prng.ts`

Mulberry32 with a few convenience helpers. Every widget that displays random data uses this.

```ts
// src/lib/seeded-prng.ts

/**
 * Mulberry32 PRNG — deterministic, seedable, fast.
 * Returns a function that produces values in [0, 1).
 *
 * Use whenever a widget needs random values that should be reproducible.
 * Never use Math.random() for anything that affects visual output —
 * see DESIGN_SYSTEM.md "Widget aesthetics" section.
 *
 * Example:
 *   const rng = seededPRNG(42);
 *   const x = rng();  // ~0.7
 *   const y = rng();  // ~0.3 (deterministic given the seed)
 */
export function seededPRNG(seed: number): () => number {
  let state = seed >>> 0;
  return function rand(): number {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random integer in [min, max). */
export function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min)) + min;
}

/** Random float in [min, max). */
export function randFloat(rng: () => number, min: number, max: number): number {
  return rng() * (max - min) + min;
}

/** Pick a uniform-random element from an array. Throws on empty array. */
export function pick<T>(rng: () => number, arr: readonly T[]): T {
  if (arr.length === 0) throw new Error('Cannot pick from empty array');
  return arr[Math.floor(rng() * arr.length)]!;
}

/** Fisher-Yates shuffle using a seeded RNG. Returns a new array. */
export function shuffle<T>(rng: () => number, arr: readonly T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/**
 * Random normal via Box-Muller transform.
 * Useful for widgets that need Gaussian-distributed values (e.g., synthetic neural activations).
 */
export function randNormal(rng: () => number, mean = 0, std = 1): number {
  // Avoid log(0) by clamping u away from 0
  const u = 1 - rng();
  const v = rng();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return z * std + mean;
}
```

**Notes:**
- The `>>> 0` and `| 0` operators force 32-bit unsigned integer math, which is what mulberry32 requires for its bit-mixing to work.
- All helpers take an `rng` as their first argument rather than maintaining hidden state — keeps them pure and testable.
- `pick` and `shuffle` use the `!` non-null assertion because TypeScript's `noUncheckedIndexedAccess` (enabled in `tsconfig.json`) would otherwise flag the array access. The assertion is safe because we bounds-check the array length first.

### 3. `src/components/code/RunnableCode.tsx`

The React component. CodeMirror 6 editor with Python language support, Run button, output pane, status indicator.

```tsx
import { useEffect, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { runPython } from '@lib/pyodide';
import styles from './RunnableCode.module.css';

export interface RunnableCodeProps {
  defaultCode: string;
  packages?: string[];
  height?: number;
  outputHeight?: number;
  title?: string;
  readonly?: boolean;
}

type Status = 'idle' | 'loading' | 'running' | 'done' | 'error';

export default function RunnableCode({
  defaultCode,
  packages = ['numpy'],
  height = 240,
  outputHeight = 120,
  title,
  readonly = false,
}: RunnableCodeProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const cancelledRef = useRef(false);

  const [status, setStatus] = useState<Status>('idle');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string | undefined>(undefined);

  // Initialize CodeMirror editor on mount
  useEffect(() => {
    if (!editorContainerRef.current) return;

    const state = EditorState.create({
      doc: defaultCode.trim(),
      extensions: [
        lineNumbers(),
        history(),
        python(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          indentWithTab,
        ]),
        EditorView.editable.of(!readonly),
        EditorView.theme({
          '&': {
            fontSize: '14px',
            backgroundColor: 'transparent',
            color: 'var(--text-primary)',
          },
          '.cm-content': {
            fontFamily: '"JetBrains Mono", "SF Mono", Menlo, monospace',
            padding: '12px 0',
            caretColor: 'var(--cyan-400)',
          },
          '.cm-gutters': {
            backgroundColor: 'transparent',
            border: 'none',
            borderRight: '1px solid var(--border-subtle)',
            color: 'var(--text-tertiary)',
            fontSize: '12px',
            paddingRight: '8px',
          },
          '.cm-activeLineGutter': {
            backgroundColor: 'transparent',
            color: 'var(--cyan-400)',
          },
          '.cm-activeLine': { backgroundColor: 'rgba(255,255,255,0.02)' },
          '.cm-cursor': { borderLeftColor: 'var(--cyan-400)' },
          '.cm-selectionBackground, & .cm-content ::selection': {
            background: 'rgba(6, 182, 212, 0.25) !important',
          },
          '&.cm-focused': { outline: 'none' },
          '.cm-scroller': { fontFamily: 'inherit' },
        }, { dark: true }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorContainerRef.current,
    });
    viewRef.current = view;

    return () => {
      cancelledRef.current = true;
      view.destroy();
      viewRef.current = null;
    };
  }, [defaultCode, readonly]);

  async function handleRun() {
    if (status === 'loading' || status === 'running') return;

    const code = viewRef.current?.state.doc.toString() ?? defaultCode;
    cancelledRef.current = false;
    setOutput('');
    setError(undefined);
    setStatus('loading');

    try {
      // Status flips to 'running' after Pyodide is ready
      // We don't have a perfect signal for "loaded vs running" inside runPython,
      // so we approximate: if already loaded (no __pyodideLoading on window), skip the loading state
      const wasAlreadyLoaded = typeof window !== 'undefined' && !!window.__pyodide;
      if (wasAlreadyLoaded) setStatus('running');

      const result = await runPython(code, packages);
      if (cancelledRef.current) return;

      setOutput(result.stdout);
      setError(result.error);
      setStatus(result.error ? 'error' : 'done');
    } catch (e: any) {
      if (cancelledRef.current) return;
      setError(String(e?.message ?? e));
      setStatus('error');
    }
  }

  function handleReset() {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      changes: {
        from: 0,
        to: viewRef.current.state.doc.length,
        insert: defaultCode.trim(),
      },
    });
    setOutput('');
    setError(undefined);
    setStatus('idle');
  }

  const isBusy = status === 'loading' || status === 'running';
  const statusLabel: Record<Status, string> = {
    idle: 'Run',
    loading: 'Loading Python…',
    running: 'Running…',
    done: 'Run',
    error: 'Run',
  };

  const cssVars = {
    '--rc-editor-height': `${height}px`,
    '--rc-output-height': `${outputHeight}px`,
  } as React.CSSProperties;

  return (
    <div className={styles.runnableCode} style={cssVars}>
      {title && <div className={styles.title}>{title}</div>}

      {isBusy && status === 'loading' && <div className={styles.loadingBar} aria-hidden="true" />}

      <div className={styles.editorWrap}>
        <div ref={editorContainerRef} className={styles.editor} />
      </div>

      <div className={styles.toolbar}>
        <button
          type="button"
          onClick={handleRun}
          disabled={isBusy}
          className={styles.runButton}
          aria-label={isBusy ? statusLabel[status] : 'Run code'}
        >
          {isBusy && <span className={styles.spinner} aria-hidden="true" />}
          {statusLabel[status]}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={isBusy}
          className={styles.resetButton}
          aria-label="Reset code to original"
        >
          Reset
        </button>
      </div>

      {(output || error) && (
        <div className={`${styles.output} ${error ? styles.outputError : ''}`}>
          <pre className={styles.outputPre}>
            {output}
            {error && (output ? '\n' : '') + error}
          </pre>
        </div>
      )}
    </div>
  );
}
```

**Notes:**
- The component uses two refs: `editorContainerRef` (DOM node CodeMirror mounts into) and `viewRef` (CodeMirror's `EditorView` instance for reading the current code on Run).
- `cancelledRef` prevents `setState`-after-unmount warnings if the user navigates away during a Pyodide load.
- The CodeMirror theme uses CSS variables (e.g., `var(--cyan-400)`) so it inherits the design system's palette. No hardcoded colors.
- The status "loading" vs "running" distinction approximates from the page-level singleton: if Pyodide was already loaded (`window.__pyodide` exists), we skip the "Loading Python…" label and go straight to "Running…". First click on the page shows "Loading Python…"; subsequent clicks anywhere on the page show "Running…".
- `aria-label` on buttons ensures screen-reader announcement of state changes.

### 4. `src/components/code/RunnableCode.module.css`

CSS module — scoped to the component. References our global CSS variables.

```css
.runnableCode {
  margin: 1.5rem 0;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  overflow: hidden;
  font-family: 'JetBrains Mono', monospace;
  max-width: var(--container-wide);
  position: relative;
}

.title {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  border-bottom: 1px solid var(--border-subtle);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.loadingBar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    var(--cyan-500) 0%,
    var(--cyan-300) 50%,
    var(--cyan-500) 100%
  );
  background-size: 200% 100%;
  animation: loading-bar 1.4s linear infinite;
  z-index: 1;
}

@keyframes loading-bar {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.editorWrap {
  height: var(--rc-editor-height, 240px);
  overflow: auto;
  background: var(--bg-elevated);
}

.editor {
  height: 100%;
}

/* CodeMirror sets its own padding; override the outer container to give breathing room */
.editor :global(.cm-editor) {
  height: 100%;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-overlay);
}

.runButton {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--cyan-500);
  color: var(--bg-primary);
  border: none;
  border-radius: var(--radius-sm);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 200ms cubic-bezier(0.22, 1, 0.36, 1);
}
.runButton:hover:not(:disabled) {
  background: var(--cyan-400);
}
.runButton:disabled {
  background: var(--border-default);
  color: var(--text-tertiary);
  cursor: not-allowed;
}

.resetButton {
  padding: 0.5rem 1rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  cursor: pointer;
  transition: border-color 200ms, color 200ms;
}
.resetButton:hover:not(:disabled) {
  color: var(--cyan-300);
  border-color: var(--cyan-500);
}
.resetButton:disabled {
  color: var(--text-disabled);
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(10, 10, 10, 0.3);
  border-top-color: var(--bg-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.output {
  max-height: var(--rc-output-height, 120px);
  overflow: auto;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-subtle);
  padding: 0.75rem 1rem;
}

.outputError {
  border-top-color: var(--rose-500);
  background: rgba(244, 63, 94, 0.05);
}

.outputPre {
  margin: 0;
  padding: 0;
  background: transparent;
  border: none;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.outputError .outputPre {
  color: var(--text-secondary);
}

/* Reduced motion: kill the loading bar and spinner animations */
@media (prefers-reduced-motion: reduce) {
  .loadingBar { animation: none; background: var(--cyan-500); }
  .spinner { animation: none; }
}
```

**Notes:**
- `:global(.cm-editor)` reaches into CodeMirror's internal DOM since CSS modules scope by default; the `:global()` escape hatch is needed.
- The `--rc-editor-height` and `--rc-output-height` CSS custom properties are set inline on the component root via React's `style` prop. The CSS uses `var(--rc-editor-height, 240px)` as fallback.
- The loading bar uses a moving linear gradient — animated via `background-position`. Tames `prefers-reduced-motion` to a static cyan bar.
- Output background uses `--bg-primary` (darker than the editor's `--bg-elevated`) to visually distinguish output from input.
- Error state uses a rose-tinted background and rose top-border. Body text in output stays in `--text-secondary` for readability.

### 5. `src/components/code/index.ts`

```ts
// src/components/code/index.ts
export { default as RunnableCode } from './RunnableCode';
export type { RunnableCodeProps } from './RunnableCode';
```

MDX files import via:
```mdx
import { RunnableCode } from '@components/code';
```

### 6. Update `src/pages/test-mdx.mdx`

Add a `<RunnableCode>` section to verify the pipeline. Insert AFTER the existing "Code" section, BEFORE the "Callouts" section. The component needs the `client:load` directive so Astro hydrates it.

Add this MDX (and import) to the test-mdx.mdx file:

````mdx
import { RunnableCode } from '@components/code';

...existing content...

## Runnable code

A `<RunnableCode>` block. First click on "Run" anywhere on the page loads Pyodide (~3-8s);
subsequent runs anywhere on the page are instant.

<RunnableCode
  client:load
  defaultCode={`import numpy as np

# A tiny attention example
Q = np.array([[1.0, 0.0, 0.0, 0.0]])
K = np.array([[1.0, 0.0, 0.0, 0.0],
              [0.0, 1.0, 0.0, 0.0],
              [0.0, 0.0, 1.0, 0.0]])
V = np.array([[10.0, 20.0],
              [30.0, 40.0],
              [50.0, 60.0]])

scores = Q @ K.T / np.sqrt(4)
print("scores:", scores)

weights = np.exp(scores) / np.exp(scores).sum(axis=-1, keepdims=True)
print("weights:", weights.round(3))

print("output:", (weights @ V).round(2))
`}
  packages={["numpy"]}
/>

A `<RunnableCode>` with a deliberate error to verify error rendering:

<RunnableCode
  client:load
  defaultCode={`import numpy as np

# This will raise a ValueError
np.array([1, 2]) + np.array([1, 2, 3])
`}
  packages={["numpy"]}
/>
````

Replace `...existing content...` with the actual existing content; the modification is to add the import line near the top and the "Runnable code" section in the appropriate place.

### 7. Update `src/pages/ch01-neural-net-primitives/index.astro`

Add a small `<RunnableCode>` block to verify React islands work inside `ChapterLayout`. Insert it after the existing placeholder sections.

Modify the imports and content of the placeholder file:

```astro
---
import ChapterLayout from '@/layouts/ChapterLayout.astro';
import { RunnableCode } from '@components/code';
---
<ChapterLayout
  slug="ch01-neural-net-primitives"
  description="Placeholder. Real Chapter 1 content arrives in Phase 3 sessions 07–10."
>
  <p>This is a placeholder page used during Phase 2 to verify the chapter layout chrome works.</p>

  <h2>What this chapter will cover</h2>
  <p>Placeholder section heading. The TOC on the right (visible at &ge; 1280px) should show this heading and the others below.</p>

  <h2>A second section</h2>
  <p>Another placeholder. Stand-in content until the real Chapter 1 prose lands.</p>

  <h3>A subsection</h3>
  <p>Subsections appear indented in the TOC.</p>

  <h2>Runnable code test</h2>
  <p>This block verifies the <code>&lt;RunnableCode&gt;</code> component works inside a chapter layout. Click Run.</p>

  <RunnableCode
    client:load
    defaultCode={`import numpy as np
print("hello from numpy in the browser")
print("version:", np.__version__)
print("array shape:", np.zeros((3, 4)).shape)
`}
    packages={["numpy"]}
  />

  <h2>One more section</h2>
  <p>So the TOC has enough entries to be useful during testing.</p>
</ChapterLayout>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly; no errors.
2. **`/test-mdx`** renders. Both `<RunnableCode>` blocks appear with:
   - Title-less code editor block (~240px tall) with line numbers, Python syntax highlighting, dark background
   - Toolbar at the bottom with cyan "Run" button and outlined "Reset" button
   - Empty output area initially (no pane visible)
3. **First click on Run** in any `<RunnableCode>` block:
   - Cyan progress bar appears at the top of the component
   - Button label changes to "Loading Python…"
   - After 3–8 seconds: progress bar disappears, output pane appears showing the print() results
   - Button returns to "Run"
4. **Second click on Run** in the SAME or a DIFFERENT `<RunnableCode>` block on the same page:
   - No progress bar (Pyodide already loaded)
   - Button briefly shows "Running…"
   - Output appears almost instantly
5. **The error-block `<RunnableCode>`** on click:
   - Shows the ValueError traceback in the output pane
   - Output pane has a rose-tinted top border and tinted background
6. **Click Reset** in any block: code returns to the original; output pane clears.
7. **`/ch01-neural-net-primitives/`** also has a working `<RunnableCode>` block. Clicking Run shows numpy output. (If you ran one on `/test-mdx` first and Pyodide is still loaded in this tab, this loads instantly.) Note: Pyodide singleton is per-page, so navigating to a new chapter resets the load state.
8. **`npm run build`** completes. Inspect `dist/_astro/`:
   - The chunk for `RunnableCode` is small (< 100 KB gzipped)
   - There is NO `pyodide.js` or `pyodide.asm.wasm` in `dist/` (Pyodide stays on the CDN, never bundled)
9. **`npm run typecheck`** passes with zero errors.
10. **Reduced motion test:** with `prefers-reduced-motion: reduce` enabled, the loading bar shows as static cyan (no animation); the spinner doesn't rotate.
11. **Final repo additions:**

```
src/
├── lib/
│   ├── chapters.ts                     (unchanged)
│   ├── pyodide.ts                       ← new
│   └── seeded-prng.ts                   ← new
├── components/
│   └── code/                            ← new directory
│       ├── RunnableCode.tsx
│       ├── RunnableCode.module.css
│       └── index.ts
└── pages/
    ├── test-mdx.mdx                     (updated)
    └── ch01-neural-net-primitives/
        └── index.astro                  (updated)
```

---

## Out of scope

- ❌ **Do not install Pyodide as an npm dependency.** It loads from the CDN at runtime. The version is pinned in `pyodide.ts` (`PYODIDE_VERSION`).
- ❌ **Do not use Monaco editor.** CodeMirror 6 is the decision (TECH_STACK.md "Decision log").
- ❌ **Do not pre-load Pyodide on page mount or on `client:visible`.** It loads on first Run click only. Anything else blows the JS budget.
- ❌ **Do not write any chapter-specific widgets** — those come in chapter sessions.
- ❌ **Do not add Pyodide-side dependency management** (pip install, micropip). The `packages` prop covers what we need; specific packages get loaded per-block.
- ❌ **Do not handle JavaScript-disabled fallback.** Runnable code is opt-in interactivity; if JS is off, the editor just won't render. Acceptable.
- ❌ **Do not implement a copy-to-clipboard button on code blocks.** Polish phase if at all.

---

## Wire-up

After all acceptance criteria pass:

```bash
git add src/lib/pyodide.ts src/lib/seeded-prng.ts src/components/code/ src/pages/test-mdx.mdx src/pages/ch01-neural-net-primitives/
git commit -m "session 05: Pyodide singleton + RunnableCode component + seeded PRNG"
git push origin main
```

Open `/test-mdx` in a browser. Open devtools Network tab. Click Run on a `<RunnableCode>`. Verify:
- Requests go to `cdn.jsdelivr.net/pyodide/v0.26.4/full/`
- `pyodide.js` (~50 KB), `pyodide.asm.js` (~250 KB), `pyodide.asm.wasm` (~7 MB), and `pyodide_py.tar` (~600 KB) load
- numpy package fetch (~5 MB) happens on first run

Subsequent runs on the same page should make NO network requests — everything is cached in the singleton.

The next session (`session-06-deployment-and-domain.md`) assumes:
- `<RunnableCode>` works in production builds, not just dev
- The Pyodide runtime is reachable from `cdn.jsdelivr.net` (no firewall issues)
- Bundle size targets remain green (see `TECH_STACK.md` performance budget)

---

## Notes for the session author

**If Pyodide fails to load** with a CORS error, check that the script tag injection uses the correct URL (`https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js`). The CDN serves the appropriate CORS headers. If you see CORS issues, the URL might be wrong — verify the version exists at jsdelivr by visiting the URL directly.

**If the version `0.26.4` doesn't exist** (Pyodide may have moved on), pick the latest stable version from https://pyodide.org/en/stable/usage/downloading-and-deploying.html and update `PYODIDE_VERSION` in `pyodide.ts`. Verify `loadPackage(['numpy'])` works in your chosen version.

**If `import { python } from '@codemirror/lang-python'` fails**, the package may need installation: `npm install @codemirror/lang-python`. It should already be in `package.json` from session 01, but verify.

**If CodeMirror renders without styles** (text appears unformatted), the `EditorView.theme({}, { dark: true })` call may have a syntax error. The `{ dark: true }` option is needed to mark this as a dark theme so CodeMirror's selection logic works correctly.

**If the loading bar shows but the output never appears**, check the browser console for errors. The most common issue is that `runPython` throws (rather than returning `{ error }`) because Pyodide failed to load. The try/catch in `handleRun` should catch this, but verify the error path.

**If the run button stays disabled forever** after one click, the `cancelledRef.current = true` from a previous unmount may be sticky if the component never remounts. Refresh the page; this should reset state. If it persists, the cancellation logic has a bug.

**If `client:load` doesn't hydrate the component**, you may have forgotten the directive in the MDX file. Astro requires `client:load` (or `client:visible`, `client:idle`, etc.) on React components used in MDX, otherwise they render server-side only and produce no interactivity.

**If you see `setState on unmounted component` warnings** in the React devtools console during navigation, the cancellation pattern may be incomplete. Verify the cleanup function in the `useEffect` runs before any in-flight `setState` calls land.

This is the most complex single session in the project. The Pyodide singleton, the lazy-load pattern, and the React + CodeMirror integration each have failure modes that don't surface until the user tries to run code. Verify the full path (click Run → see output) in dev and in `npm run preview` before pushing.

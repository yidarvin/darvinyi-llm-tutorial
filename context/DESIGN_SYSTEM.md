# DESIGN_SYSTEM

> Every Claude Code session reads this file before writing any UI code, widget, or styled MDX content. If a visual question arises that this file doesn't answer, surface it as an open question — do not improvise.

The aesthetic target is **sparse, technical, calm.** Dark canvas, single accent color, restrained motion. The reader is here to learn, not to be entertained by the interface.

---

## Color

All colors are defined as CSS custom properties in `src/styles/variables.css` and mapped to Tailwind tokens in `tailwind.config.mjs`. Use the tokens — never raw hex in components — so a future palette change is a one-file edit.

### Full palette

```css
:root {
  /* Surface — what the page is built on */
  --bg-primary:    #0a0a0a;  /* page background; ~85% of pixels */
  --bg-elevated:   #111111;  /* code blocks, callout backgrounds, cards */
  --bg-overlay:    #171717;  /* hover, focus, dropdown surfaces */
  --bg-inline:     #1f1f1f;  /* inline code background */

  /* Borders */
  --border-subtle: #1f1f1f;  /* hairline separators inside elevated surfaces */
  --border-default:#262626;  /* default border on cards, code blocks */
  --border-strong: #404040;  /* emphasis (rare; usually cyan replaces this) */

  /* Text */
  --text-primary:  #f5f5f5;  /* body, headings; 17.4:1 contrast on bg-primary */
  --text-secondary:#a3a3a3;  /* lead paragraphs, captions; 7.6:1 */
  --text-tertiary: #737373;  /* metadata, footnote-y content; 4.7:1 */
  --text-disabled: #525252;  /* disabled controls; 3.1:1 — fails AA, never used for content */

  /* Brand — true cyan */
  --cyan-300:      #67e8f9;  /* hover state for links */
  --cyan-400:      #22d3ee;  /* active TOC entries, highlight */
  --cyan-500:      #06b6d4;  /* PRIMARY ACCENT — default link color, widget strokes, focus rings */
  --cyan-600:      #0891b2;  /* deep accent, pressed states */
  --cyan-glow:     rgba(6, 182, 212, 0.18); /* subtle radial glow behind widgets and hero */

  /* Semantic — used sparingly, never as backgrounds */
  --amber-500:     #f59e0b;  /* warning callouts */
  --rose-500:      #f43f5e;  /* error states (rare); never used for "danger" callouts in body content */
  --emerald-500:   #10b981;  /* success states in widgets only */
}
```

### Tailwind mapping

```js
// tailwind.config.mjs
theme: {
  extend: {
    colors: {
      bg:    { primary: 'var(--bg-primary)', elevated: 'var(--bg-elevated)', overlay: 'var(--bg-overlay)', inline: 'var(--bg-inline)' },
      fg:    { primary: 'var(--text-primary)', secondary: 'var(--text-secondary)', tertiary: 'var(--text-tertiary)', disabled: 'var(--text-disabled)' },
      border:{ subtle: 'var(--border-subtle)', DEFAULT: 'var(--border-default)', strong: 'var(--border-strong)' },
      cyan:  { 300: 'var(--cyan-300)', 400: 'var(--cyan-400)', 500: 'var(--cyan-500)', 600: 'var(--cyan-600)' },
      amber: { 500: 'var(--amber-500)' },
      rose:  { 500: 'var(--rose-500)' },
      emerald: { 500: 'var(--emerald-500)' },
    },
  },
}
```

### Where each color is used

| Color | Used for | Not used for |
|---|---|---|
| `bg-primary` | Page background | Cards or containers |
| `bg-elevated` | Code blocks, callouts, cards, widget interior | Page background |
| `bg-overlay` | Hover/focus surfaces, dropdown menus, mobile nav backdrop | Default state |
| `bg-inline` | Inline code background only | Block-level content |
| `cyan-500` | Default link, primary stroke in widgets, focus ring, active nav, code-block scrubber | Backgrounds, large surfaces |
| `cyan-400` | Active TOC entry, widget secondary highlight, hover on already-cyan elements | Default state |
| `cyan-300` | Link hover state, callout body text emphasis | Default state |
| `cyan-glow` | Radial glow behind landing hero, subtle widget aura on hover | Anything not requiring atmospheric emphasis |
| `amber-500` | Warning callout left border and label | Body text, backgrounds |
| `rose-500` | Inline error states in `<RunnableCode>` output, form validation | Callouts (use warning instead) |
| `emerald-500` | "Success" indicators in widget state machines (e.g., test pass) | Body content |
| `text-disabled` | Disabled controls only; sidebar items for `status: 'planned'` chapters | Any reader-facing content |

### When to use accent cyan

Use cyan as a *precision instrument*, not a wash. The accent earns its weight by being rare.

- Link text (default + hover)
- Active sidebar/nav item
- Focus rings on interactive elements
- Primary stroke/fill in diagrams, widgets, and chart accents
- Equation left-border on display equations
- Hero headline highlight (the second line of the landing page only)
- Buttons (primary only — there are very few)

**Never** use cyan as a background fill for large surfaces. The brand is dark with cyan as a scalpel.

### Contrast and accessibility

| Combination | Ratio | WCAG |
|---|---|---|
| `text-primary` on `bg-primary` | 17.4:1 | AAA |
| `text-secondary` on `bg-primary` | 7.6:1 | AAA |
| `text-tertiary` on `bg-primary` | 4.7:1 | AA |
| `cyan-500` on `bg-primary` | 6.4:1 | AA Large; for body links it just barely fails AA but is acceptable because adjacent context makes link targets unambiguous |
| `cyan-300` on `bg-primary` | 11.2:1 | AAA — used for hover so the contrast jump is a perceptible signal |

Body links pass AA for large text and meet WCAG 2.2 SC 1.4.11 (non-text contrast) for their interactive surface. We accept the borderline body-link case in exchange for the cyan accent that defines the brand.

---

## Typography

### Font stack

```css
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', Menlo, monospace;
```

Both are self-hosted in `public/fonts/` as variable woff2 files. **No CDN dependencies at runtime.** KaTeX fonts ship via the `katex` npm package and are referenced from `node_modules/katex/dist/fonts/` (Astro handles the copy).

### Font features (Inter)

Inter exposes several stylistic alternates we rely on:

```css
body {
  font-feature-settings: 'cv11', 'ss01', 'ss03';
}
```

- `cv11` — Single-story `a` (cleaner at small sizes)
- `ss01` — Open digits (better-distinguished 6, 9, 0)
- `ss03` — Curved-leg `R` (small but noticeable on heading caps)

Inter is also rendered with `-webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;`.

### JetBrains Mono

Used everywhere monospace is needed: inline code, code blocks, equation labels, table-of-contents headers, the "interactive" tag inside `<WidgetFrame>`. Ligatures are **enabled** (they're part of the type's character; disabling them defeats the choice) via the font's default `calt` feature.

### Type scale

| Token | Size | Line height | Letter-spacing | Use |
|---|---|---|---|---|
| `text-xs` | 12px | 1.5 | 0 | Metadata, footnotes, "interactive" tag |
| `text-sm` | 14px | 1.55 | 0 | Captions, sidebar entries, code blocks, TOC links |
| `text-base` | 16px | 1.7 | 0 | Body prose |
| `text-lg` | 18px | 1.65 | 0 | Lead paragraphs (one per chapter intro) |
| `text-xl` | 22px | 1.4 | -0.01em | h4 |
| `text-2xl` | 28px | 1.3 | -0.015em | h3 |
| `text-3xl` | 36px | 1.25 | -0.02em | h2, chapter title in nav |
| `text-4xl` | 48px | 1.15 | -0.025em | h1 (chapter title) |
| `text-5xl` | 64px | 1.05 | -0.03em | Landing hero |

Negative letter-spacing on large headings is a deliberate tuning for Inter at display sizes — without it, Inter at 48–64px feels loose. Don't use it on body text.

### Weight

On dark backgrounds, weights read heavier than on light. Calibration:

- Body: **400**
- Emphasis (`<em>`, `<strong>`): **500** — not 600; that's too heavy on dark
- Headings (h2–h6): **600**
- h1 / chapter title / landing hero: **700**
- Cyan link text inherits the surrounding weight

### Line length

- Body prose: `max-width: var(--container-prose)` = **72ch** (~700px at body size)
- Widgets and figures: `max-width: var(--container-wide)` = **1100px**

Anything wider than 72ch is harder to read for sustained prose. The wide container is reserved for visualizations and tables.

---

## Spacing & vertical rhythm

The base unit is Tailwind's 4px scale. Vertical rhythm inside chapter prose:

| Element | Top margin | Bottom margin |
|---|---|---|
| `h1` | 0 (first thing in chapter) | `mb-6` (24px) |
| `h2` | `mt-16` (64px) — strong section break | `mb-4` (16px) |
| `h3` | `mt-12` (48px) | `mb-4` (16px) |
| `h4` | `mt-8` (32px) | `mb-3` (12px) |
| `p` | 0 | `mb-6` (24px) — `p + p` selector adds 24px between consecutive paragraphs |
| `ul`, `ol` | `my-4` (16px) | `my-4` (16px) |
| `pre` (code block) | `my-6` (24px) | `my-6` (24px) |
| `<Equation>` | `my-6` | `my-6` |
| `<Callout>` | `my-6` | `my-6` |
| `<Figure>` | `my-8` (32px) — more breathing room | `my-8` |
| `<WidgetFrame>` | `my-12` (48px) — most breathing room; widgets are heavy | `my-12` |
| `<hr>` | `my-12` (48px) | `my-12` |

The pattern: bigger elements get more vertical breathing room. Widgets command the most space because the eye needs a clear before/after when transitioning between reading and interacting.

---

## Layout grid

### Desktop (≥ 1280px) — three columns

```
┌─────────────┬────────────────────────────────┬──────────┐
│             │                                │          │
│  sidebar    │       prose                    │   TOC    │
│  240px      │       max 72ch (~700px)        │  200px   │
│             │       centered in remaining    │  sticky  │
│  sticky     │       column                   │          │
│             │                                │          │
└─────────────┴────────────────────────────────┴──────────┘
```

- Sidebar: `width: 240px`, `position: sticky`, `top: 0`, `height: 100vh`, internally scrollable
- Prose column: fills available width; content `max-width: 72ch` centered; horizontal padding `px-6 lg:px-12`
- TOC: `width: 200px`, `position: sticky`, `top: 3rem`, `max-height: calc(100vh - 6rem)`, internally scrollable

### Tablet (1024–1279px)

- Sidebar visible, TOC hidden
- Prose centers in the remaining space; same `max-w-72ch` constraint

### Mobile (< 1024px)

- Sidebar hidden; hamburger button fixed top-right (40×40px, cyan border on hover)
- Tapping hamburger opens an overlay (full-screen, `bg-bg-primary/95 backdrop-blur-sm`) that slides in from the right; same sidebar content inside
- TOC collapses to a sticky pill at the top of the prose area showing "On this page" — tap to expand to dropdown
- Chapter title bar sticks at top after scrolling past h1

### Breakpoints

| Token | Min width | Used for |
|---|---|---|
| (default) | 0px | Mobile single-column |
| `md` | 768px | Two-column landing sections |
| `lg` | 1024px | Sidebar appears |
| `xl` | 1280px | TOC appears |

Use Tailwind's responsive prefixes (`md:`, `lg:`, `xl:`). Never write custom media queries in components.

---

## Math rendering

KaTeX with `rehype-katex`. Display equations use the project's left-border styling:

```css
.katex-display {
  margin: 1.5rem auto !important;
  padding: 0.5rem 1rem;
  border-left: 2px solid var(--cyan-500);
  max-width: var(--container-prose);
  overflow-x: auto;
}
```

### Custom macros (defined in `astro.config.mjs`)

```js
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
}
```

These are the only macros. If a chapter needs a new macro, add it here once — don't define it inline per chapter.

### Equation labels

Equations referenced later in the chapter use the `<Equation label="...">` component. Labels are **chapter-prefixed numerical**: `4.1`, `4.2`, `4.3` for Chapter 4. The author numbers manually.

```mdx
<Equation label="4.1">
$$
\attn(Q,K,V) = \softmax\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
$$
</Equation>
```

Reference inline with `<EqRef id="4.1" />` — renders as `(4.1)` in cyan, links to the equation.

### Inline vs display

- Inline math: short, fits in a sentence. `$E = mc^2$`, `$\softmax(z)$`.
- Display math: anything with a fraction, a sum, multiple lines, or material the reader needs to dwell on.
- Never put display math inside a sentence. Break the sentence and use a display block.

---

## Code rendering

### Static code blocks (Shiki)

Shiki theme: custom `darvinyi-cyan` defined inline in `astro.config.mjs`. Token colors map to design-system tokens: cyan-400 for keywords/control flow, cyan-300 for function and class names (matching inline code), emerald-500 for strings and docstrings, amber-500 for numbers and booleans, text-tertiary italic for comments, text-secondary for operators and punctuation, text-primary for identifiers. The same hex values are mirrored in the CodeMirror HighlightStyle in `src/components/code/RunnableCode.tsx` so RunnableCode editors render identically to Shiki-rendered fenced blocks.

Use markdown fences with optional language and metadata:

````mdx
```python title="src/attention.py" {3-5}
import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)
    e = np.exp(x)
    return e / e.sum(axis=axis, keepdims=True)
```
````

- `python` — language tag (required for syntax highlighting)
- `title="..."` — filename annotation rendered in a small monospace label above the code block
- `{3-5}` — line highlights (subtle cyan-tinted background on those lines)

### Inline code

`` `code` `` renders as cyan-tinted JetBrains Mono on `bg-inline`:

```css
:not(pre) > code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.92em;
  background: var(--bg-inline);
  color: var(--cyan-300);
  padding: 0.125em 0.4em;
  border-radius: 4px;
  border: 1px solid var(--border-subtle);
}
```

### Runnable code (Pyodide)

The `<RunnableCode>` React component renders an editable CodeMirror 6 editor with a "Run" button. On click, it lazy-loads Pyodide, executes the code, and shows stdout in an output pane below.

```mdx
<RunnableCode
  defaultCode={`import numpy as np
Q = np.random.randn(4, 8)
K = np.random.randn(4, 8)
scores = Q @ K.T / np.sqrt(8)
print(scores.round(2))`}
  packages={["numpy"]}
  height={240}
/>
```

Props:

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `defaultCode` | string | required | Initial code in the editor |
| `packages` | string[] | `["numpy"]` | Pyodide packages to load (numpy, scipy, etc.) |
| `height` | number | 240 | Editor height in px |
| `outputHeight` | number | 120 | Output area height in px (auto-expands up to 2× this on overflow) |
| `title` | string | undefined | Optional title shown above the editor |
| `readonly` | boolean | false | Disable editing (use for snippets readers shouldn't modify) |

Visual: editor surface uses `bg-elevated`, border `border-default`, "Run" button is cyan-filled in idle state. Loading state shows a thin cyan progress bar across the top. Error output appears in `rose-500` text with the full Python traceback monospaced.

**When to use** — only when running the code teaches something reading it doesn't. Examples:
- Tokenizing a weird string and seeing the byte-level output
- Watching attention scores update as you swap in different queries
- Stepping a gradient descent loop and seeing the loss curve
- Training a tiny model in 30 steps to see learning behavior

**When NOT to use** — for pure reference code, full production training scripts (too heavy for Pyodide), anything that needs PyTorch on the client (Pyodide can run small torch ops but it's slow; prefer a runnable numpy equivalent if possible).

---

## Component contracts

All content components live in `src/components/content/` (Astro) and `src/components/code/` (React for RunnableCode). Interactive widgets live in `src/components/widgets/` (React). MDX imports look like:

```mdx
import { Callout, Equation, EqRef, Figure, WidgetFrame } from '@components/content';
import { RunnableCode } from '@components/code';
import AttentionHeatmap from '@components/widgets/AttentionHeatmap';
```

### `<Callout>`

```mdx
<Callout type="note">The KV cache stores K and V projections, not Q.</Callout>
<Callout type="warning">This implementation skips numerical stability tricks.</Callout>
<Callout type="aside">Related: see §17.3 on speculative decoding.</Callout>
<Callout type="insight">Attention is a soft, differentiable form of key-value retrieval.</Callout>
```

Props: `type: 'note' | 'warning' | 'aside' | 'insight'`, `title?: string` (overrides the default label).

Rendering: 2px left border (color varies by type), tinted background, monospace uppercase label in the type's accent color, body content in `text-primary`.

| Type | Border / label color | Background |
|---|---|---|
| `note` | `cyan-500` | `cyan-500/5` |
| `warning` | `amber-500` | `amber-500/5` |
| `aside` | `text-tertiary` | `bg-elevated` |
| `insight` | `cyan-500` | `cyan-500/10` (stronger emphasis than note) |

Nested content inside a callout: paragraphs, inline code, and links are styled normally. Lists and headings are technically allowed but rare — if a callout needs a list, consider whether it should be promoted to a regular section.

### `<Equation>` and `<EqRef>`

```mdx
<Equation label="4.1">
$$
\attn(Q,K,V) = \softmax\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
$$
</Equation>

As shown in <EqRef id="4.1" />, attention is a weighted sum of values.
```

`<Equation>` wraps a display equation with the cyan left-border, adds the label `(4.1)` in monospace on the right, and assigns DOM id `eq-4.1` for anchor linking. `<EqRef>` renders an inline cyan link `(4.1)` that scrolls to the equation.

If an equation isn't referenced later, omit the label entirely and just use `$$...$$`.

### `<Figure>`

```mdx
<Figure src="/ch04/attention-pattern.svg" caption="Attention weights for the query token 'cat' across an 8-token sequence." alt="Attention heatmap" />
```

Props: `src`, `caption`, `alt?` (defaults to caption), `wide?: boolean` (uses wide container instead of prose container).

Always provide `caption`. The reader scrolling past should be able to understand what the figure shows from caption alone. Don't repeat the caption in body prose.

### `<WidgetFrame>`

```mdx
<WidgetFrame title="Attention heatmap" caption="Drag tokens to see attention weights update.">
  <AttentionHeatmap />
</WidgetFrame>
```

Props: `title` (required), `caption?`, `wide?: boolean` (default true).

Provides the standard chrome: header bar with monospace uppercase title on the left, "INTERACTIVE" label on the right, inset content area with consistent padding, optional caption below the frame.

The widget itself fills the inset area. Widgets must:
- Be `position: relative` and never break out of their container
- Be deterministic — seed any randomness with `seededPRNG(seed)` from `src/lib/seeded-prng.ts`
- Be self-contained — no global state, no cross-widget communication

---

## Widget aesthetics

### Frame & surface

- Background: `bg-elevated`
- Border: 1px `border-default`
- Border-radius: `var(--radius-lg)` (10px)
- Internal padding: 20px (`p-5`)
- Hover (only on widgets that respond to hover at the frame level): `box-shadow: 0 0 24px var(--cyan-glow)`

### Color usage inside widgets

- Primary stroke and fill: `cyan-500`
- Active/highlighted state: `cyan-400`
- Hover state: `cyan-300`
- Secondary data series: `text-secondary` (`#a3a3a3`) and `text-tertiary` (`#737373`)
- Grid lines, axes: `border-default` (`#262626`)
- Background fills (e.g., heatmap cells at zero): `bg-elevated` or transparent
- Success indicators (state machines): `emerald-500`
- Error indicators: `rose-500`

### Canvas vs SVG decision

- **SVG** by default for static diagrams, small interactive widgets (< 200 elements), anything where each visual element is independently interactive (clickable nodes, draggable points)
- **HTML Canvas** for high-element-count visualizations (attention heatmaps with > 100 cells, particle systems, scrollable timelines)
- **Don't** mix the two within one widget unless there's a compelling reason

### Animation

- Easing default: `cubic-bezier(0.22, 1, 0.36, 1)` (slight ease-out)
- Duration default: 200ms for state changes, up to 400ms for complex transitions
- Animation library: prefer CSS transitions and `requestAnimationFrame` for canvas. Only reach for `framer-motion` if state-driven layout animation is needed and CSS would be ugly.
- All RAF loops cancel on unmount:
  ```ts
  useEffect(() => {
    let raf;
    const tick = () => { /* ... */; raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  ```

### Determinism

Every widget that displays random data must seed it. A `seededPRNG(seed)` helper lives at `src/lib/seeded-prng.ts` (mulberry32). The seed is either:
- A constant in the widget (e.g., `42`) for fully deterministic visuals
- Derived from a user input (e.g., the index of a clicked token) so the same input always gives the same output

Never use `Math.random()` or `Date.now()` for anything that affects what the reader sees.

### Loading states

- **Pyodide first-run**: cyan progress bar across the top of the `<RunnableCode>` widget, text "Loading Python environment…" in `text-secondary`
- **Subsequent runs**: small spinner next to the Run button
- **Widget initial render**: 1px cyan top-border pulses for the first 600ms then settles. Implementation: a CSS animation on the `<WidgetFrame>` border-top that fades from `cyan-500` to `border-default`.
- **Slow API call** (Chapter 21+ tool-use widgets): inline cyan dot animation, 3-dot pulse

### Empty and error states

- **Empty** (e.g., no input yet): centered `text-tertiary` text describing what the widget will show once the reader interacts. Never a blank box.
- **Error**: `rose-500` left-border, monospace error message in `text-secondary`, "Reset" button to clear and try again.

---

## Iconography

Use `lucide-react` exclusively. No custom icon work.

Common icons and where they're used:

| Icon | Use |
|---|---|
| `ChevronRight`, `ChevronDown` | Sidebar expanders, accordion toggles |
| `Menu`, `X` | Mobile nav toggle (open / close) |
| `Search` | Search bar (Pagefind UI) |
| `Play`, `Pause`, `RotateCcw` | Widget playback controls |
| `Copy`, `Check` | Code block copy button (Check appears for 1.5s after copy) |
| `Github`, `ExternalLink` | Footer, external citations |
| `AlertCircle` | Warning callouts and error states |
| `Info` | Note callouts (used selectively; usually no icon) |

Icon sizes:

- `w-4 h-4` (16px) — inline with body text
- `w-5 h-5` (20px) — in buttons, sidebar entries
- `w-6 h-6` (24px) — nav-level affordances, mobile hamburger

Icons inherit `color: currentColor` so they take on the parent's text color naturally.

---

## Selection, focus, and scroll

```css
::selection {
  background: var(--cyan-600);
  color: var(--text-primary);
}

/* Focus rings — visible only on keyboard focus, not on click */
*:focus-visible {
  outline: 2px solid var(--cyan-500);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Smooth scroll for hash links */
html {
  scroll-behavior: smooth;
  scroll-padding-top: 5rem; /* offset for sticky chapter title bar on mobile */
}

/* Scrollbar (webkit) — subtle */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--bg-primary); }
::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--border-strong); }
```

---

## Accessibility — non-negotiable floors

- **Color contrast** — text-primary on bg-primary is 17.4:1 (AAA). All body text passes AA at minimum.
- **Focus rings** — every interactive element has a visible cyan focus ring on keyboard focus (`:focus-visible`).
- **Keyboard navigation** — all widgets must be operable by keyboard:
  - Sliders: arrow keys move by step, Home/End jump to extremes
  - Buttons: Enter and Space activate
  - Heatmaps with hoverable cells: Tab into the heatmap, arrow keys move the active cell
  - Code editors: Tab indents (not Tab-out); Escape returns focus to surrounding content
- **Reduced motion** — `prefers-reduced-motion: reduce` disables non-essential animations (widget pulses, the progress bar transitions, framer-motion entrances). Functional animations (Pyodide loading bar) stay because they communicate state.
- **Skip link** — `<a href="#main">Skip to main content</a>` as the first focusable element on every page; visually hidden until focused.
- **Heading order** — h1 once per chapter; h2/h3 nested correctly; never skip levels for visual weight.
- **Alt text** — every `<Figure>` requires `alt` or `caption` (caption is used as alt if alt absent). Decorative SVG markup uses `aria-hidden="true"`.

---

## What NOT to do

Hard rules. If a chapter session would do any of these, stop and surface an open question.

- **No gradients** beyond the single radial-glow effect used behind the landing hero and (subtly) behind widgets on hover.
- **No glassmorphism** / frosted glass / backdrop-blur surfaces, except the mobile nav overlay.
- **No drop shadows** on flat UI surfaces. The cyan glow is the only allowed shadow effect.
- **No emoji as design elements** in chrome (nav, buttons, headings). Emoji in body content is acceptable where natural (rare).
- **No Lottie animations** / animated illustrations / mascots.
- **No floating action buttons** (FABs).
- **No tooltips that obscure content.** Use callouts, sidenotes, or just inline parentheticals.
- **No light mode toggle.** Dark-only is intentional. If a reader needs light mode, they can use browser inverted-colors.
- **No custom fonts beyond Inter and JetBrains Mono.** Crimson Pro (the textbook's serif) is **not** used here.
- **No CDN dependencies** for fonts, icons, or code. Self-host everything.
- **No client-side syntax highlighters.** Shiki is server-rendered at build time.
- **No animation that loops indefinitely** unless the reader explicitly started it (e.g., a "Play" button on a state-machine widget).
- **No autoplay** of anything (video, audio, animation).

---

## Iterating on this file

If a chapter genuinely needs something this file doesn't cover — a new component, a new color, a new layout pattern — the right move is:

1. Surface the gap as an open question in the chapter session output
2. Defer the visual decision; build a placeholder
3. Update this file in a dedicated session before re-running the chapter

Never silently extend the design system. Drift across 30 chapters is the failure mode.

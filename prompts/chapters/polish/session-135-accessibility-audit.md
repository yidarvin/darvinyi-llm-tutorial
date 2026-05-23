# Session 135 — Accessibility audit — **POLISH PHASE 4 OF 6**

> **Fourth polish session.** Mobile pass (134) made the curriculum usable on every device; **accessibility audit makes it usable for every learner.** WCAG 2.2 AA conformance pass: skip links, focus indicators, semantic landmarks, ARIA patterns for interactive widgets, screen-reader announcements via live regions, color contrast verification, reduced-motion completion. **The session ships three artifacts**: (1) a small accessibility utility library (`<VisuallyHidden>`, `<FocusTrap>`, `<LiveRegion>`); (2) site-wide CSS additions (focus indicators, skip links); (3) an audit report. **No per-widget rewrites** — the existing widgets already have `aria-label` and `role` attributes from their build sessions; this session catches what was missed and ships the connective tissue.

---

## Read first (in this order)

1. **`context/PROJECT_OVERVIEW.md`** — for the design system colors (contrast verification depends on this)
2. **`prompts/polish/session-134-mobile-pass.md`** — the prerequisite this session builds on (touch targets, drawer patterns, reduced motion)
3. **WCAG 2.2 quick reference** — [w3.org/WAI/WCAG22/quickref](https://www.w3.org/WAI/WCAG22/quickref/) — the source of truth
4. **`src/components/search/SearchDialog.tsx`** — for the existing dialog pattern (modal dialog accessibility is one of the hardest cases; the search dialog already establishes the conventions)

---

## Goal

By end of session, three concrete artifacts ship:

1. **A small accessibility utility library** in `src/components/a11y/`:
   - `<VisuallyHidden>` — screen-reader-only text
   - `<FocusTrap>` — trap focus within a container (for dialogs)
   - `<LiveRegion>` — announce dynamic content updates to screen readers
   - `<SkipLink>` — keyboard shortcut to skip to main content
2. **Site-wide CSS additions** in `src/styles/a11y.css` (imported by global.css):
   - Universal focus indicators with proper contrast
   - Skip-link visible-on-focus styling
   - High-contrast mode tweaks (`@media (forced-colors: active)`)
3. **An audit report** at `docs/A11Y_AUDIT.md`:
   - Per-widget findings across 4 widget categories
   - WCAG 2.2 AA criteria checklist
   - Color contrast verification across the design system

**End state:** the curriculum meets WCAG 2.2 Level AA. Every interactive element is keyboard-reachable; every focus state is visible; every dynamic update is announced; every widget has appropriate ARIA semantics. **Screen-reader testing on at least one assistive technology (VoiceOver, NVDA, or JAWS) confirms the curriculum is navigable.**

**This is the polish-phase pattern continued**: single-place changes shipping to all 30 chapters. **No per-widget rewrites.**

---

## Inputs

State of the repo after session 134:

- All 30 chapters published
- Cross-chapter linking + search + mobile pass shipped
- `src/styles/responsive.css` exists
- Most widgets have `aria-label` and `role` attributes from their original build
- `prefers-reduced-motion` partially honored (global guard + most widgets)
- No `src/components/a11y/` directory yet

---

## Deliverables

1. **Create** `src/components/a11y/VisuallyHidden.tsx` — screen-reader-only text component
2. **Create** `src/components/a11y/FocusTrap.tsx` — focus-trap utility for modal dialogs
3. **Create** `src/components/a11y/LiveRegion.tsx` — `aria-live` announcement region
4. **Create** `src/components/a11y/SkipLink.tsx` — visible-on-focus skip-to-main link
5. **Create** `src/components/a11y/a11y.module.css` — shared scoped styles
6. **Update** `src/components/a11y/index.ts` — barrel export
7. **Create** `src/styles/a11y.css` — site-wide focus + accessibility rules
8. **Update** `src/styles/global.css` — import `a11y.css`
9. **Update** `src/layouts/ChapterLayout.astro` (and `HomeLayout.astro`) — render `<SkipLink />` as first child of body
10. **Update** `src/components/search/SearchDialog.tsx` — wrap content in `<FocusTrap>`; add `<LiveRegion>` for result count announcements
11. **Create** `docs/A11Y_AUDIT.md` — audit findings

**Do not** modify any chapter MDX file or any chapter widget component. **Their existing aria attributes stand.** Other interactive components (Sidebar, Header, TOC) may have minor a11y additions if the audit finds gaps; document each in the audit report.

---

## Detailed spec

### 1. `VisuallyHidden.tsx`

Screen-reader-only text. Visually hidden, but read by assistive technology.

```tsx
// src/components/a11y/VisuallyHidden.tsx

import { type ReactNode, type ElementType } from 'react';
import styles from './a11y.module.css';

interface VisuallyHiddenProps {
  as?: ElementType;
  children: ReactNode;
  /** If true, becomes visible on focus (for skip-link-like patterns). */
  focusable?: boolean;
}

export default function VisuallyHidden({
  as: Tag = 'span',
  children,
  focusable = false,
}: VisuallyHiddenProps) {
  return (
    <Tag className={focusable ? styles.visuallyHiddenFocusable : styles.visuallyHidden}>
      {children}
    </Tag>
  );
}
```

### 2. `FocusTrap.tsx`

Trap focus within a container (for modal dialogs). Returns focus to the previously-focused element when unmounted.

```tsx
// src/components/a11y/FocusTrap.tsx

import { useEffect, useRef, type ReactNode } from 'react';

interface FocusTrapProps {
  children: ReactNode;
  /** Whether the trap is active. */
  active?: boolean;
  /** Optional: element to focus on activation. Defaults to first focusable. */
  initialFocusRef?: React.RefObject<HTMLElement>;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'iframe',
  'object',
  'embed',
  '[contenteditable]',
  'audio[controls]',
  'video[controls]',
].join(', ');

export default function FocusTrap({ children, active = true, initialFocusRef }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Save the previously-focused element
    previouslyFocusedRef.current = document.activeElement as HTMLElement;

    // Focus the initial element or the first focusable inside the container
    const initial = initialFocusRef?.current ?? containerRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    initial?.focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const container = containerRef.current;
      if (!container) return;
      const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter(el => !el.hasAttribute('aria-hidden') && el.offsetParent !== null);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('keydown', handleKey);
      // Return focus to the previously-focused element
      previouslyFocusedRef.current?.focus();
    };
  }, [active, initialFocusRef]);

  return <div ref={containerRef}>{children}</div>;
}
```

### 3. `LiveRegion.tsx`

Announce dynamic content updates to screen readers. Uses `aria-live="polite"` by default; `aria-live="assertive"` for urgent messages.

```tsx
// src/components/a11y/LiveRegion.tsx

import styles from './a11y.module.css';

interface LiveRegionProps {
  message: string;
  /** 'polite' (default) waits for a pause; 'assertive' interrupts. */
  urgency?: 'polite' | 'assertive';
  /** Default 'all' or 'additions' — what screen reader announces from the region. */
  relevant?: 'additions' | 'removals' | 'all' | 'text';
}

export default function LiveRegion({
  message,
  urgency = 'polite',
  relevant = 'additions',
}: LiveRegionProps) {
  return (
    <div
      className={styles.visuallyHidden}
      role="status"
      aria-live={urgency}
      aria-atomic="true"
      aria-relevant={relevant}
    >
      {message}
    </div>
  );
}
```

### 4. `SkipLink.tsx`

Skip-to-main-content keyboard shortcut. Visible only on focus.

```tsx
// src/components/a11y/SkipLink.tsx

import styles from './a11y.module.css';

interface SkipLinkProps {
  /** ID of the element to skip to (default: 'main-content'). */
  targetId?: string;
}

export default function SkipLink({ targetId = 'main-content' }: SkipLinkProps) {
  return (
    <a href={`#${targetId}`} className={styles.skipLink}>
      Skip to main content
    </a>
  );
}
```

### 5. `a11y.module.css`

```css
/* Visually hidden but available to screen readers */
.visuallyHidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Same as above, but visible when focused */
.visuallyHiddenFocusable {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.visuallyHiddenFocusable:focus,
.visuallyHiddenFocusable:focus-within,
.visuallyHiddenFocusable:active {
  position: fixed;
  width: auto;
  height: auto;
  padding: 0.5rem 1rem;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
  border: auto;
}

/* Skip link — invisible until focused */
.skipLink {
  position: absolute;
  top: -100px;
  left: 0.85rem;
  z-index: 10000;
  padding: 0.65rem 1rem;
  background: var(--cyan-500);
  color: var(--bg-primary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.84rem;
  font-weight: 500;
  text-decoration: none;
  border-radius: var(--radius-sm);
  transition: top 200ms;
  outline: 2px solid var(--cyan-300);
  outline-offset: 2px;
}
.skipLink:focus {
  top: 0.85rem;
}

@media (prefers-reduced-motion: reduce) {
  .skipLink { transition: none; }
}
```

### 6. `a11y/index.ts`

```ts
export { default as VisuallyHidden } from './VisuallyHidden';
export { default as FocusTrap } from './FocusTrap';
export { default as LiveRegion } from './LiveRegion';
export { default as SkipLink } from './SkipLink';
```

### 7. `src/styles/a11y.css` — site-wide rules

```css
/* src/styles/a11y.css */

/* ──────────────────────────────────────────────────────────────────────────
 * Site-wide accessibility rules — session 135
 * 
 * Universal focus indicators, skip-link target, forced-colors mode support,
 * heading hierarchy, landmark regions.
 * ──────────────────────────────────────────────────────────────────────────
 */

/* 1. Universal focus indicators
 * --------------------------------
 * WCAG 2.4.7 (Focus Visible — AA): all focusable elements need a visible
 * focus state. WCAG 1.4.11 (Non-text Contrast — AA): 3:1 contrast against
 * the adjacent color. The cyan outline below provides ~5:1 contrast on the
 * dark background.
 */
*:focus {
  outline: none;
}
*:focus-visible {
  outline: 2px solid var(--cyan-400);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Buttons and links inside dark backgrounds: stronger outline */
button:focus-visible,
a:focus-visible {
  outline: 2px solid var(--cyan-300);
  outline-offset: 2px;
}

/* 2. Skip-link target
 * --------------------------------
 * Mark the main content with id="main-content" so the skip link can target it.
 * If the page doesn't have a #main-content, the skip link should be invisible
 * (fallback in component).
 */
#main-content {
  scroll-margin-top: 1rem;
}

/* 3. Forced colors mode (Windows High Contrast)
 * --------------------------------
 * Many UI elements (borders, backgrounds) become transparent in forced-colors mode.
 * Explicit border-color and color rules keep them visible.
 */
@media (forced-colors: active) {
  button, a {
    forced-color-adjust: none;
  }
  *:focus-visible {
    outline: 3px solid CanvasText;
  }
}

/* 4. Heading hierarchy
 * --------------------------------
 * Per-chapter h1 is the chapter title; h2 sections; h3 sub-sections.
 * No skipping levels. Scroll margin so the heading isn't hidden under the
 * sticky header when navigated to.
 */
h1, h2, h3, h4, h5, h6 {
  scroll-margin-top: 5rem;
}

/* 5. Landmark regions
 * --------------------------------
 * The layout should render proper landmark roles via semantic HTML.
 * Below: ensure header/nav/main/aside/footer have correct roles
 * (semantic elements imply roles, but explicit is fine for screen readers).
 */
.site-header[role="banner"],
.sidebar[role="navigation"],
.chapter-main[role="main"],
.toc[role="complementary"],
.chapter-nav[role="navigation"],
.related-chapters[role="complementary"],
.site-footer[role="contentinfo"] {
  /* Tag-style enforcement — selectors are no-ops if the role is correct */
}

/* 6. Reduced-motion completion
 * --------------------------------
 * The mobile-pass global rule already disables most animations; this entry
 * catches anything specific to interactive widget transitions that slipped through.
 */
@media (prefers-reduced-motion: reduce) {
  .karaoke,
  .typing-animation,
  .marquee,
  [data-animate] {
    animation: none !important;
    transition: none !important;
  }
  
  /* Smooth scroll fallback */
  html { scroll-behavior: auto; }
}
@media (prefers-reduced-motion: no-preference) {
  html { scroll-behavior: smooth; }
}

/* 7. Inputs with label-associated styling
 * --------------------------------
 * Inputs without explicit labels (only placeholders) fail WCAG 1.3.1.
 * Ensure all inputs in the curriculum have associated labels or aria-label.
 * Belt-and-suspenders: input without label gets a strong red outline in dev.
 */
@media (prefers-color-scheme: dark) {
  input:not([aria-label]):not([aria-labelledby]):not([id]) {
    /* warn — dev only; remove if false-positive */
  }
}
```

### 8. Update `global.css`

```css
@import './a11y.css';
@import './responsive.css';
/* ... other imports */
```

### 9. Update `ChapterLayout.astro` and `HomeLayout.astro`

Add `<SkipLink />` as the first child of `<body>`, add `id="main-content"` to the main content wrapper, and ensure landmark roles are explicit.

```astro
---
import SkipLink from '../components/a11y/SkipLink';
// ... other imports
---

<html lang="en">
  <head>...</head>
  <body>
    <SkipLink client:load />
    
    <div class="page-shell">
      <Sidebar slug={slug} client:load />
      
      <main id="main-content" class="chapter-main" role="main">
        <header class="site-header" role="banner">…</header>
        
        <article class="chapter-content">
          <slot />
        </article>
        
        <RelatedChapters slug={slug} client:load />
        
        <nav class="chapter-nav" role="navigation" aria-label="Chapter navigation">…</nav>
      </main>
      
      <aside class="toc" role="complementary" aria-label="Table of contents">…</aside>
    </div>
    
    <SearchDialog client:idle />
  </body>
</html>
```

### 10. Update `SearchDialog.tsx`

Wrap the dialog content in `<FocusTrap>` and add `<LiveRegion>` for result count announcements.

```tsx
import FocusTrap from '../a11y/FocusTrap';
import LiveRegion from '../a11y/LiveRegion';

// inside the component, replace the dialog div:
return (
  <div className={styles.overlay} onClick={close} role="presentation">
    <FocusTrap active={isOpen}>
      <div
        className={styles.dialog}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Search the curriculum"
        aria-modal="true"
      >
        {/* existing input + status + result list */}
        
        {/* Live region for result count announcements */}
        <LiveRegion
          message={
            isLoading
              ? 'Searching…'
              : results.length > 0
                ? `${results.length} results for ${query}`
                : query
                  ? `No results for ${query}`
                  : ''
          }
        />
      </div>
    </FocusTrap>
  </div>
);
```

### 11. `docs/A11Y_AUDIT.md`

The audit report. Written during the session by stepping through every widget category.

```md
# Accessibility audit (session 135)

WCAG 2.2 Level AA conformance pass for the 30-chapter curriculum.

## WCAG 2.2 AA criteria checklist

### Principle 1: Perceivable

- [x] **1.1.1 Non-text Content (A)** — all decorative SVG has aria-hidden; all informative SVG has aria-label or title
- [x] **1.3.1 Info and Relationships (A)** — semantic HTML throughout; landmark roles on layout regions
- [x] **1.3.2 Meaningful Sequence (A)** — reading order matches DOM order
- [x] **1.4.3 Contrast (Minimum) (AA)** — body text 4.5:1; large text 3:1 — see contrast table below
- [x] **1.4.10 Reflow (AA)** — content reflows at 320 px (session 134)
- [x] **1.4.11 Non-text Contrast (AA)** — focus indicators 3:1 against background; widget bars 3:1 against background
- [x] **1.4.12 Text Spacing (AA)** — line height ≥ 1.5; paragraph spacing ≥ 2×; letter spacing ≥ 0.12em where applied

### Principle 2: Operable

- [x] **2.1.1 Keyboard (A)** — all interactive elements keyboard-reachable
- [x] **2.1.2 No Keyboard Trap (A)** — focus trap in dialogs releases on close
- [x] **2.4.1 Bypass Blocks (A)** — skip link to #main-content
- [x] **2.4.3 Focus Order (A)** — logical focus order matches visual order
- [x] **2.4.7 Focus Visible (AA)** — `*:focus-visible` outline universal
- [x] **2.5.5 Target Size (AAA, treating as AA goal)** — 44×44 minimum (session 134)
- [x] **2.5.7 Dragging Movements (AA new in 2.2)** — no drag-only interactions in the curriculum
- [x] **2.5.8 Target Size (Minimum) (AA new in 2.2)** — 24×24 minimum; we exceed at 44×44

### Principle 3: Understandable

- [x] **3.1.1 Language of Page (A)** — `<html lang="en">`
- [x] **3.2.3 Consistent Navigation (AA)** — sidebar identical across chapters
- [x] **3.2.4 Consistent Identification (AA)** — Search button same icon + label everywhere
- [x] **3.3.7 Redundant Entry (AA new in 2.2)** — no forms requiring re-entry

### Principle 4: Robust

- [x] **4.1.2 Name, Role, Value (A)** — all widgets have role/aria-label/aria-* as appropriate
- [x] **4.1.3 Status Messages (AA)** — search results announced via LiveRegion

## Color contrast verification

Background pairs tested with WCAG AA threshold (4.5:1 normal, 3:1 large/UI):

| Color | Background | Contrast | Use | AA Pass? |
|---|---|---|---|---|
| `--text-primary` | `--bg-primary` | 14.8:1 | Body text | ✓ |
| `--text-secondary` | `--bg-primary` | 7.2:1 | Captions | ✓ |
| `--text-tertiary` | `--bg-primary` | 4.7:1 | Labels | ✓ |
| `--cyan-300` | `--bg-primary` | 8.4:1 | Active/highlights | ✓ |
| `--cyan-400` | `--bg-primary` | 6.8:1 | Borders/accents | ✓ |
| `--emerald-400` | `--bg-primary` | 6.2:1 | Success/positive | ✓ |
| `--rose-400` | `--bg-primary` | 5.4:1 | Warning/critic | ✓ |
| `--violet-400` | `--bg-primary` | 6.0:1 | Worker/sophisticated | ✓ |
| `--amber-400` | `--bg-primary` | 9.1:1 | Tool/intermediate | ✓ |

(Numbers approximate; verify with the actual values from the design system.)

## Widget audit (sample)

For each widget category, checked: keyboard reachability, focus visibility, aria-label completeness, announcement of state changes.

| Widget | Keyboard | Focus | ARIA | Announce |
|---|---|---|---|---|
| AgentBenchmarkExplorer | ✓ | ✓ | ✓ | n/a |
| FrameworkPicker | ✓ | ✓ | ✓ | needs LiveRegion for recommendation change |
| MultiAgentTopologyExplorer | ✓ | ✓ | ✓ | n/a |
| InterAgentConversationViewer | ✓ | ✓ | step button needs aria-label | n/a |
| RunnableCode | ✓ | ✓ | ✓ | output area needs role=status |
| (… continue for major widgets) |

## Findings and follow-ups

(Document any gaps that need follow-up beyond this session.)
```

The session author fills in actual values during the audit.

---

## Acceptance criteria

All must hold:

1. **`docs/A11Y_AUDIT.md`** exists with the WCAG 2.2 AA checklist filled in.
2. **`src/components/a11y/` directory** exists with VisuallyHidden, FocusTrap, LiveRegion, SkipLink, plus shared module CSS and barrel export.
3. **`src/styles/a11y.css`** exists and is imported from `global.css`.
4. **Skip link** is rendered as the first focusable element on every chapter page. Tabbing once shows it; activating it focuses `#main-content`.
5. **All focusable elements show a focus indicator** when navigated via keyboard (`:focus-visible` rule). Cyan outline at 2 px with 2 px offset.
6. **Search dialog**: focus is trapped within the dialog when open; on close, focus returns to the previously-focused element (typically the SearchButton); search result count is announced via LiveRegion.
7. **Landmark roles** on layout regions: `role="banner"` on header, `role="main"` on chapter-main, `role="navigation"` on sidebar and chapter-nav, `role="complementary"` on TOC and RelatedChapters, `role="contentinfo"` on footer.
8. **`<html lang="en">`** set in the base layout.
9. **`prefers-reduced-motion: reduce`** disables ALL animations and transitions globally; html `scroll-behavior` switches to `auto`.
10. **`forced-colors: active`** mode keeps interactive elements visible (no transparent borders).
11. **Color contrast**: every text/background pair in the design system meets WCAG AA (verified in the audit report).
12. **Screen reader spot-check on one AT** (VoiceOver, NVDA, or JAWS): the session author navigates Ch 30 with the screen reader enabled and confirms reasonable announcements for: skip link, sidebar links, h2 sections, widget controls, search dialog, related chapters.
13. **axe-core scan** (run manually via browser extension or DevTools) on Ch 1, Ch 15, Ch 30: zero critical issues; warnings documented in the audit report.
14. **`npm run typecheck`** passes.
15. **`npm run build`** completes; bundle size has not grown significantly (< 3 KB added).

---

## Out of scope

- ❌ **Do not modify chapter MDX files** or chapter widget components. The audit identifies gaps; those gaps either get fixed in the connective tissue (`SearchDialog`, layout) or get documented as follow-ups in the audit report.
- ❌ **Do not rewrite the design system colors** if contrast fails. Document the failure; the design-system change is a separate work item.
- ❌ **Do not add a separate "high contrast" theme**. The `forced-colors: active` media query handles this for users who need it.
- ❌ **Do not add a screen-reader-only navigation alternative**. The standard navigation must work for screen readers; that's the point of this session.
- ❌ **Do not add an accessibility statement page**. (Could be done in a future session; out of scope here.)

---

## Wire-up

```bash
git add docs/A11Y_AUDIT.md src/components/a11y/ src/styles/a11y.css src/styles/global.css src/layouts/ChapterLayout.astro src/layouts/HomeLayout.astro src/components/search/SearchDialog.tsx
git commit -m "session 135 (polish 4): accessibility audit — WCAG 2.2 AA conformance + utility library"
git push origin main
```

---

## Notes for the session author

**On this being conformance-driven, not aesthetic-driven**:
WCAG 2.2 AA is the legal baseline for most jurisdictions and the practical baseline for inclusive design. Notes-for-author: "**WCAG isn't optional and isn't a checkbox.** Each criterion exists because real users hit real failures. The audit confirms the curriculum meets the bar; the utility library makes it easy to maintain that bar."

**On `:focus-visible` being the right primitive**:
`:focus` shows for click as well as keyboard (annoying for mouse users); `:focus-visible` shows only when the focus comes from keyboard or assistive input. Notes-for-author: "**`:focus-visible` is the modern correct primitive.** Older sites used `:focus` and tried to suppress it for mouse — both bad. `:focus-visible` solves both problems."

**On the skip link being invisible-until-focused**:
A visible skip link clutters the design for mouse users; an always-hidden one is a WCAG fail. The visible-on-focus pattern is the right tradeoff. Notes-for-author: "**Keyboard users tabbing into the page see the skip link as the first focusable element**; mouse users never see it. Both groups get what they need."

**On the focus trap in dialogs being WCAG 2.1.2**:
Without a focus trap, a screen-reader user tabbing out of a dialog can end up in the underlying page — but the dialog is still visually showing, creating confusion. Notes-for-author: "**The trap doesn't just keep focus in — it returns focus when the dialog closes.** Both halves matter."

**On the LiveRegion for search**:
When the user types and search results update, a sighted user sees the results appear; a screen-reader user hears nothing without `aria-live`. The LiveRegion announces "5 results for attention" politely. Notes-for-author: "**Polite live regions wait for the user to finish their current screen-reader sentence**, then announce. Assertive interrupts — reserve for genuine emergencies (errors, urgent state changes)."

**On semantic HTML + explicit roles being belt-and-suspenders**:
`<main>` already has implied `role="main"`, but explicit `role="main"` doesn't hurt and helps a few legacy screen readers. Notes-for-author: "**Cost of explicit roles: zero. Benefit: works on every AT, including older ones.**"

**On the `forced-colors: active` media query being for Windows High Contrast users**:
A non-trivial population uses Windows High Contrast or other forced-colors modes. Without `forced-color-adjust: none` on buttons, those become invisible. Notes-for-author: "**A user with low vision relying on forced colors should be able to use the curriculum.** This is the rule that ensures it."

**On the audit being a written record**:
`docs/A11Y_AUDIT.md` documents the conformance state. Future contributors can verify the audit was done and what gaps were found. Notes-for-author: "**Audits without records are anecdotes.** Write down what was tested, what passed, what's a follow-up."

**On the WCAG 2.2 new criteria**:
2.5.7 (Dragging Movements), 2.5.8 (Target Size Minimum), 3.3.7 (Redundant Entry) are new in WCAG 2.2. The curriculum complies with all three without intentional effort because the design constraints already preclude drag-only interactions, tiny targets, and forms. Notes-for-author: "**Compliance can be incidental.** The curriculum's design earned WCAG 2.2 AA before WCAG 2.2 existed."

**On the screen-reader spot-check being mandatory but minimal**:
Test one chapter (Ch 30) with one screen reader (VoiceOver on Mac is easiest for most build authors). Notes-for-author: "**A 5-minute screen-reader test surfaces issues that 50 axe scans miss.** AT users have different navigation patterns; the test catches what automated tools can't."

**On axe-core being the automated tool of choice**:
axe-core (via @axe-core/cli or the browser extension) catches the highest-confidence issues automatically. Notes-for-author: "**axe is necessary but not sufficient.** It catches ~30% of WCAG violations automatically; the rest need human judgment. Both halves matter."

**Pedagogical claim this session supports**:
"**Every learner — using a keyboard, using a screen reader, in a high-contrast mode, with reduced motion preferences, with limited dexterity — can read and engage with all 30 chapters.** Accessibility isn't a checkbox; it's the consequence of taking the audience seriously. **A 30-chapter curriculum that excludes any of these users is 30 chapters wasted on the wrong audience.** The audit confirms the curriculum doesn't exclude."

---

## Polish phase progress after this session

- ✅ Session 132 — Cross-chapter linking
- ✅ Session 133 — Search integration
- ✅ Session 134 — Mobile pass
- ✅ **Session 135 — Accessibility audit** (this)
- ⬜ Session 136 — Performance pass
- ⬜ Session 137 — Social meta and OG cards

**2 polish sessions remain.** Accessibility audit + mobile pass are the inclusion foundation. Performance pass and social meta are the discoverability and quality finish.

Build with care. **Accessibility is the difference between a curriculum that exists and a curriculum that's usable.**

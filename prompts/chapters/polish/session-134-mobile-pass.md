# Session 134 — Mobile pass — **POLISH PHASE 3 OF 6**

> **Third polish session.** Cross-chapter linking (132) made connections visible; search (133) made content findable; **mobile pass** makes the curriculum read well on narrow viewports. Each chapter widget already has its own `@media (max-width: 720px)` breakpoint — but **site-wide concerns** (KaTeX overflow, table responsive containers, code block wrapping, TOC drawer behavior, navigation collapse, touch-target sizing, typography scale) need cross-cutting treatment that no single widget could provide. **This is an audit-then-fix session**: identify the gaps that 30 chapters of build-as-you-go accumulated; ship site-wide CSS additions and selective layout updates. **No per-widget rewrites.** No per-chapter MDX edits. **The polish-phase pattern holds: single-place changes that ship to all 30 chapters.**

---

## Read first (in this order)

1. **`context/PROJECT_OVERVIEW.md`** — for the design system and layout architecture
2. **`prompts/polish/session-132-cross-chapter-linking.md`** — the polish-phase pattern this session continues
3. **`src/styles/global.css`** (or equivalent root stylesheet) — the existing global rules to extend
4. **`src/layouts/ChapterLayout.astro`** — the layout where most cross-cutting concerns surface

---

## Goal

By end of session, three concrete artifacts ship:

1. **An audit report** (markdown file at `docs/MOBILE_AUDIT.md`) documenting findings across **3 representative chapters × 4 viewport widths**. Used as a record; not user-visible.
2. **Site-wide CSS additions** to `src/styles/global.css` (or a new `src/styles/responsive.css` imported by it) that fix the cross-cutting gaps identified by the audit.
3. **Selective layout updates** to `ChapterLayout.astro` for the TOC drawer pattern, navigation collapse, and footer adjustments.

**End state:** every chapter is comfortably readable on 320px-wide viewports (iPhone SE width) with no horizontal scroll, no truncated content, no touch targets smaller than 44×44 px, no math equations overflowing the screen, no code blocks producing unreadable horizontal-scroll-only output, and no sidebar/TOC blocking content access.

**This is an audit-then-fix session.** No new components, no widget rewrites, no per-chapter MDX edits.

---

## Inputs

State of the repo after session 133:

- All 30 chapters published
- Cross-chapter linking via `<RelatedChapters>` footer
- Client-side search via `<SearchDialog>`
- Each widget has its own mobile breakpoint at `(max-width: 720px)`
- Global stylesheet exists; some mobile rules but not comprehensive

---

## Deliverables

1. **Create** `docs/MOBILE_AUDIT.md` — the audit findings (markdown report)
2. **Update** `src/styles/global.css` (or create `src/styles/responsive.css` and import it from global.css) — site-wide responsive rules
3. **Update** `src/layouts/ChapterLayout.astro` — TOC drawer, mobile nav, footer adjustments
4. **Update** `src/components/site/Header.astro` if needed — mobile-friendly logo + actions cluster
5. **Update** `src/components/site/Sidebar.tsx` (or equivalent) — drawer behavior on mobile

**Do not** modify any chapter MDX file, any widget component, or any content component (CrossRef, Callout, Equation, etc.). **Their existing mobile breakpoints stand.**

---

## Detailed spec

### Part A — The audit pass (write `docs/MOBILE_AUDIT.md`)

The session author runs the dev server in browser dev tools' responsive mode and steps through this matrix. **3 representative chapters × 4 viewports.**

**Chapters to audit:**
- **Ch 1** (Tokens and embeddings) — heavy math, simple widgets
- **Ch 15** (Constitutional AI) — heavy prose, mid-curriculum reference patterns
- **Ch 30** (Agent eval and frameworks) — complex widgets, tables, code blocks

**Viewports:**
- **320 px** (iPhone SE — minimum credible width)
- **375 px** (iPhone 12/13/14 — most common)
- **414 px** (iPhone Plus / Pro Max)
- **768 px** (iPad portrait — the tablet boundary)

**For each chapter × viewport combination, check 8 categories:**

| Category | What to look for |
|---|---|
| **Horizontal scroll** | Page should never scroll horizontally. Anything wider than viewport is a bug. |
| **Touch targets** | Buttons, links, tappable areas ≥ 44×44 px (iOS HIG); ideally 48×48 (Material). |
| **Typography** | Body text 16+ px (never sub-14); line length 45-75 chars on mobile; readable line-height (1.55+); no orphaned single words. |
| **Math (KaTeX)** | Equations should fit horizontally OR get a horizontal scroll container with visual cue. Never overflow the page. |
| **Code blocks** | Prose code (inline `code`) should wrap. Code blocks should horizontally scroll within their container, with visible scroll indication. |
| **Tables** | Wrap in scrollable container with shadow/gradient indicating overflow. |
| **Widgets** | Each widget has its own breakpoint; spot-check 2-3 widgets per chapter at 320 px. |
| **Navigation** | Sidebar: should collapse to a drawer on mobile. TOC: collapsible. Prev/next: always tappable. Header: logo + search + menu, no overflow. |

**Audit report format** (write into `docs/MOBILE_AUDIT.md`):

```md
# Mobile audit (session 134)

Site-wide narrow-viewport audit. Three chapters × four viewports × eight categories.

## Test matrix

| Chapter | 320 px | 375 px | 414 px | 768 px |
|---|---|---|---|---|
| Ch 1 | … | … | … | … |
| Ch 15 | … | … | … | … |
| Ch 30 | … | … | … | … |

## Findings by category

### Horizontal scroll
- **Ch 1 @ 320 px**: long math equation in section 4 overflows by ~40 px — fix needed (Math overflow container)
- **Ch 30 @ 320 px**: Agent Benchmark Explorer comparison table forces 30 px overflow — already has @media but table is the culprit
- ...

### Touch targets
- **All chapters**: prev/next nav arrows ~36×36 px — below 44 px minimum
- **Search button @ 320 px**: now icon-only at this width — confirm ≥ 44 px
- ...

(continue category by category)

## Action items

Each finding maps to a fix in `responsive.css` or the layout update. Cross-reference by section in `docs/MOBILE_AUDIT.md` § "Findings".
```

This document is for the build session's record. It's not shipped to users; it's a working artifact.

### Part B — `responsive.css` (or additions to `global.css`)

The site-wide rules below address the categories above. **Order matters**: load this AFTER any per-widget styles so it can override where needed.

```css
/* src/styles/responsive.css */

/* ──────────────────────────────────────────────────────────────────────────
 * Site-wide mobile pass — session 134
 * 
 * Cross-cutting concerns that per-widget breakpoints don't address:
 *   1. Horizontal-scroll guarantee at the page level
 *   2. Touch-target minimum sizing
 *   3. KaTeX equation overflow handling
 *   4. Code block scroll containers
 *   5. Table responsive containers
 *   6. Typography scale on narrow viewports
 *   7. Header / nav / footer collapse
 * ──────────────────────────────────────────────────────────────────────────
 */

/* 1. Horizontal-scroll guarantee
 * --------------------------------
 * Nothing — not images, not code, not math, not widgets — should cause the
 * page to scroll horizontally. The html/body must not exceed viewport width.
 */
html, body {
  overflow-x: hidden;
  max-width: 100vw;
}

main, article, .chapter-content {
  max-width: 100%;
}

img, video, iframe, svg {
  max-width: 100%;
  height: auto;
}

/* 2. Touch-target minimum sizing
 * --------------------------------
 * iOS HIG: 44×44 pt minimum.
 * Material: 48×48 dp ideal.
 * Apply to: buttons, links inside nav, prev/next arrows.
 */
@media (max-width: 720px) {
  button,
  .chapter-nav a,
  .chapter-nav button,
  nav a {
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  /* Inline links in prose are exempt — they're not standalone targets */
  .chapter-content p a,
  .chapter-content li a {
    min-height: 0;
    min-width: 0;
    display: inline;
  }
}

/* 3. KaTeX equation overflow handling
 * --------------------------------
 * Display equations can be very wide. Wrap them in a horizontal-scroll
 * container with a subtle gradient indicating overflow.
 */
.katex-display {
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 0.25rem;
  max-width: 100%;
}
@media (max-width: 720px) {
  .katex-display {
    font-size: 0.92em;  /* slightly shrink to fit more */
  }
  .katex-display > .katex {
    white-space: nowrap;  /* don't break equation across lines */
  }
}
/* Overflow gradient cue */
.katex-display {
  position: relative;
}
.katex-display::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 8px;
  width: 24px;
  background: linear-gradient(to right, transparent, var(--bg-primary));
  pointer-events: none;
  opacity: 0;
  transition: opacity 200ms;
}
.katex-display:has(.katex:not(:only-child))::after,
.katex-display.is-overflowing::after {
  opacity: 1;
}

/* 4. Code block scroll containers
 * --------------------------------
 * pre > code horizontal scroll within container; visible scroll indication.
 * Inline `code` should wrap, not overflow.
 */
pre {
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100%;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}
pre code {
  white-space: pre;  /* preserve formatting; the parent handles scrolling */
}
p code, li code, td code {
  white-space: normal;
  word-break: break-word;
}
@media (max-width: 720px) {
  pre {
    font-size: 0.82rem;  /* shrink slightly for narrow viewports */
    padding: 0.7rem 0.85rem;
    border-radius: var(--radius-sm);
  }
}

/* 5. Table responsive containers
 * --------------------------------
 * Wrap data tables in a scrollable container that signals overflow via
 * an inset shadow at the right edge.
 */
.chapter-content table {
  display: block;  /* allow overflow-x */
  overflow-x: auto;
  white-space: nowrap;
  max-width: 100%;
  border-collapse: collapse;
  -webkit-overflow-scrolling: touch;
}
.chapter-content table th,
.chapter-content table td {
  white-space: normal;  /* cell contents still wrap */
}
@media (max-width: 720px) {
  .chapter-content table {
    font-size: 0.84rem;
  }
}
/* Overflow shadow cue */
.chapter-content .table-wrapper {
  position: relative;
  box-shadow: inset -16px 0 12px -12px color-mix(in srgb, var(--text-primary) 14%, transparent);
}

/* 6. Typography scale on narrow viewports
 * --------------------------------
 * Body text stays 16 px+; headings shrink modestly; line height holds.
 */
@media (max-width: 720px) {
  html {
    font-size: 15px;  /* root downscale from 16 — preserves rhythm but tightens slightly */
  }
  .chapter-content p,
  .chapter-content li {
    font-size: 1rem;          /* 15 px effective */
    line-height: 1.62;
    margin-bottom: 1rem;
  }
  h1 { font-size: 2rem; line-height: 1.2; }
  h2 { font-size: 1.55rem; line-height: 1.25; margin-top: 2rem; }
  h3 { font-size: 1.25rem; line-height: 1.3; margin-top: 1.5rem; }
  h4 { font-size: 1.08rem; }
}
@media (max-width: 380px) {
  html { font-size: 14.5px; }
  h1 { font-size: 1.8rem; }
  h2 { font-size: 1.4rem; }
}

/* 7. Header / nav / footer collapse
 * --------------------------------
 * Header: brand + search + menu on mobile; secondary actions hidden.
 * TOC: collapsible drawer pattern (see layout updates in Part C).
 * Sidebar: hidden by default on mobile; revealed via menu button.
 */
@media (max-width: 720px) {
  .site-header {
    padding: 0.55rem 0.85rem;
  }
  .site-header .secondary-action {
    display: none;  /* hide secondary actions (e.g., theme toggle) — surface in menu instead */
  }
  
  /* Sidebar drawer */
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(82vw, 360px);
    background: var(--bg-elevated);
    border-right: 1px solid var(--border-default);
    z-index: 999;
    transform: translateX(-100%);
    transition: transform 220ms ease-out;
    overflow-y: auto;
    box-shadow: 4px 0 24px color-mix(in srgb, black 40%, transparent);
  }
  .sidebar.is-open {
    transform: translateX(0);
  }
  
  /* Sidebar overlay (dim background when open) */
  .sidebar-overlay {
    display: none;
  }
  .sidebar.is-open + .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: color-mix(in srgb, black 50%, transparent);
    z-index: 998;
  }
  
  /* Hamburger button — visible only on mobile */
  .hamburger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
  }
  @media (min-width: 721px) {
    .hamburger { display: none; }
  }
  
  /* Chapter prev/next nav */
  .chapter-nav {
    flex-direction: column;
    gap: 0.5rem;
  }
  .chapter-nav > a,
  .chapter-nav > button {
    width: 100%;
    padding: 0.85rem 1rem;
  }
}

/* 8. Reduce motion globally
 * --------------------------------
 * Already done in individual components, but a global guard is cheap.
 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Part C — `ChapterLayout.astro` updates

Two structural changes:

1. **Hamburger button** in the header that toggles the sidebar's `.is-open` class on mobile
2. **TOC drawer pattern** — on mobile, the TOC sidebar becomes a drawer triggered by a "Contents" button placed just below the chapter h1; it slides in from the right (mirroring the sidebar's left drawer)

```astro
---
import Sidebar from '../components/site/Sidebar';
import SearchDialog from '../components/search/SearchDialog';
// ... other imports
const { slug } = Astro.props;
---

<div class="page-shell">
  <!-- Sidebar (chapter list) — drawer on mobile, fixed on desktop -->
  <Sidebar slug={slug} client:load />
  
  <!-- Sidebar overlay (mobile only) -->
  <div class="sidebar-overlay" id="sidebar-overlay"></div>
  
  <main class="chapter-main">
    <!-- Header with hamburger on mobile -->
    <header class="site-header">
      <button class="hamburger" aria-label="Open chapters menu" id="sidebar-toggle">
        ☰
      </button>
      <a href="/" class="brand">…</a>
      <div class="header-actions">
        <SearchButton client:load />
      </div>
    </header>
    
    <!-- Eyebrow + h1 -->
    <div class="chapter-header">
      <div class="eyebrow">Chapter {n}</div>
      <h1>{title}</h1>
      <p class="description">{description}</p>
      
      <!-- Mobile-only TOC drawer trigger -->
      <button class="toc-mobile-toggle" aria-label="Open table of contents">
        Contents
      </button>
    </div>
    
    <article class="chapter-content">
      <slot />
    </article>
    
    <!-- Related chapters footer (session 132) -->
    <RelatedChapters slug={slug} client:load />
    
    <!-- Prev/next nav -->
    <nav class="chapter-nav">…</nav>
  </main>
  
  <!-- TOC drawer (mobile) / sidebar (desktop) -->
  <aside class="toc" id="chapter-toc">…</aside>
</div>

<SearchDialog client:idle />

<script>
  // Sidebar toggle (mobile)
  const sidebar = document.querySelector('.sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  
  function openSidebar() {
    sidebar?.classList.add('is-open');
  }
  function closeSidebar() {
    sidebar?.classList.remove('is-open');
  }
  
  sidebarToggle?.addEventListener('click', openSidebar);
  sidebarOverlay?.addEventListener('click', closeSidebar);
  
  // Close sidebar when a chapter link is clicked
  sidebar?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) {
      setTimeout(closeSidebar, 50);
    }
  });
  
  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar?.classList.contains('is-open')) {
      closeSidebar();
    }
  });
  
  // TOC drawer (mobile)
  const tocToggle = document.querySelector('.toc-mobile-toggle');
  const toc = document.getElementById('chapter-toc');
  
  tocToggle?.addEventListener('click', () => {
    toc?.classList.toggle('is-open');
  });
  
  // Close TOC when a section link is clicked
  toc?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) {
      setTimeout(() => toc.classList.remove('is-open'), 50);
    }
  });
</script>

<style>
  /* Mobile TOC drawer */
  @media (max-width: 1024px) {
    .toc {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: min(82vw, 320px);
      background: var(--bg-elevated);
      border-left: 1px solid var(--border-default);
      z-index: 999;
      transform: translateX(100%);
      transition: transform 220ms ease-out;
      overflow-y: auto;
      box-shadow: -4px 0 24px color-mix(in srgb, black 40%, transparent);
      padding: 4rem 1rem 2rem 1rem;
    }
    .toc.is-open {
      transform: translateX(0);
    }
    .toc-mobile-toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      margin-top: 1rem;
      padding: 0.55rem 0.85rem;
      background: var(--bg-elevated);
      color: var(--text-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.82rem;
      cursor: pointer;
    }
  }
  @media (min-width: 1025px) {
    .toc-mobile-toggle { display: none; }
  }
  
  @media (prefers-reduced-motion: reduce) {
    .sidebar, .toc { transition: none; }
  }
</style>
```

(Exact integration depends on the existing `ChapterLayout.astro` structure — the session author adapts.)

### Part D — Table-wrapping helper (optional but recommended)

If the curriculum has many tables in MDX, wrap them in a responsive container via a remark plugin or via the layout's content slot post-processing. **Simpler alternative**: rely on the CSS rule above (`.chapter-content table { display: block; overflow-x: auto; }`) which doesn't require an HTML structure change.

The CSS-only approach is preferred for this session — no MDX modifications.

---

## Acceptance criteria

All must hold:

1. **`docs/MOBILE_AUDIT.md`** exists with the audit findings filled in (3 chapters × 4 viewports × 8 categories).
2. **`npm run dev`** starts cleanly. No CSS errors.
3. **At 320 px viewport** (iPhone SE):
   - No horizontal scroll on any chapter page (verified on Ch 1, Ch 15, Ch 30)
   - All KaTeX display equations fit OR scroll within their container with a visual gradient cue
   - All code blocks scroll within their container, not the page
   - All tables scroll within a container, not the page
   - Touch targets in nav and header are ≥ 44 px
   - Body text is ≥ 14 px (15 px effective via the root font-size scale)
4. **At 375 px viewport** (iPhone 12-14):
   - Layout breathes appropriately
   - Sidebar is collapsed (drawer)
   - TOC is collapsed (drawer with "Contents" button)
5. **At 768 px viewport** (iPad portrait):
   - Sidebar visible? Acceptable to remain a drawer at this width to preserve content area
   - TOC visible? Acceptable either way
   - Chapter content has comfortable margins
6. **Hamburger menu** toggles sidebar open/closed; overlay dims background; click outside closes; Escape closes.
7. **TOC drawer** toggles open/closed via the "Contents" button; click on a link closes it; Escape closes.
8. **No new build dependencies** introduced (no remark plugins, no PostCSS additions).
9. **`prefers-reduced-motion: reduce`** disables all drawer transitions.
10. **`npm run typecheck`** passes.
11. **`npm run build`** completes; bundle size has not grown significantly (< 5 KB added).
12. **Lighthouse mobile audit** on Ch 30 scores ≥ 90 for Accessibility, ≥ 85 for Performance (session 136 will optimize further).

---

## Out of scope

- ❌ **Do not modify any chapter MDX file**. The existing content stands.
- ❌ **Do not modify any widget component**. Their per-widget breakpoints stand.
- ❌ **Do not modify any content component** (CrossRef, Callout, Equation, RunnableCode, WidgetFrame, etc.). Their internal mobile behavior stands.
- ❌ **Do not rewrite the sidebar from scratch.** Add the drawer behavior atop existing styles.
- ❌ **Do not add new dependencies** (no PostCSS plugins, no remark plugins).
- ❌ **Do not implement a separate mobile theme**. The design system stays unified across viewports.

---

## Wire-up

```bash
git add docs/MOBILE_AUDIT.md src/styles/global.css src/styles/responsive.css src/layouts/ChapterLayout.astro src/components/site/Header.astro src/components/site/Sidebar.tsx
git commit -m "session 134 (polish 3): mobile pass — site-wide responsive rules + drawer patterns"
git push origin main
```

---

## Notes for the session author

**On this being an audit-then-fix session**:
Each chapter widget already has its own `@media (max-width: 720px)` block. **This session does NOT touch those.** It catches what those individual breakpoints couldn't address: cross-cutting concerns like KaTeX overflow (no widget knows about math), table containers (tables are MDX, not components), sidebar drawer pattern (no widget knows about the sidebar). Notes-for-author: "**Per-widget breakpoints are necessary but not sufficient.** The page is the integration of components; the page-level concerns need page-level rules."

**On the 3 chapters × 4 viewports × 8 categories audit matrix being deliberate**:
3 chapters span the curriculum (foundations, mid, final); 4 viewports span device classes (smallest credible, common, plus-size, tablet); 8 categories cover what actually breaks. Notes-for-author: "**More chapters wouldn't reveal more issues — the same patterns repeat.** Fewer viewports would miss device-class-specific failures (320 vs 375 looks different). The 8 categories are the lessons of years of mobile-web work distilled."

**On 320 px being the floor, not iPhone SE specifically**:
Even smaller screens exist (smartwatches, foldable phones in narrow mode), but 320 is the conservative floor at which production sites must work. Notes-for-author: "**Pass at 320; everything wider Just Works.** If you only test one width, test 320."

**On touch-target sizing being non-negotiable**:
44×44 (iOS) / 48×48 (Material) is the floor for tappable elements. Sub-44 targets cause real harm on small screens. Notes-for-author: "**The cost of larger touch targets is mild (slightly more whitespace); the cost of small targets is real (mis-taps, frustration, accessibility failure for users with motor differences).** Always size up."

**On the KaTeX overflow gradient cue**:
Math equations that need horizontal scrolling get a subtle gradient on the right edge signaling "more content this way." Notes-for-author: "**Without the gradient, readers don't know they can scroll.** With it, the affordance is discoverable."

**On the table CSS-only responsive container**:
`display: block; overflow-x: auto` on the table itself avoids any MDX modification. Notes-for-author: "**A remark plugin would auto-wrap tables in a div with an overflow class. Cleaner HTML but more dependencies.** The CSS-only approach is the right tradeoff for this polish session."

**On code block wrapping vs scrolling**:
Inline `code` wraps (`word-break: break-word`); code blocks scroll (`overflow-x: auto` with `white-space: pre`). Notes-for-author: "**Inline code shouldn't break the layout when a long identifier appears mid-sentence; code blocks shouldn't reformat lines because that changes their meaning.** The two cases get different treatment intentionally."

**On the sidebar drawer being a fixed-position pattern**:
On mobile, the sidebar slides in from the left over the content (fixed-position translateX). On desktop, it returns to its inline position. The transition is governed by a single `@media (max-width: 720px)` rule. Notes-for-author: "**One pattern, two manifestations.** Same component; different layout context."

**On the TOC drawer being right-side**:
The chapter sidebar is left; the TOC is right. They don't overlap; either can be open without conflict. Notes-for-author: "**Mirroring the layout** (sidebar left, TOC right) keeps spatial reasoning intact. Reader who has used the sidebar-left pattern intuits the TOC-right pattern immediately."

**On the global `prefers-reduced-motion` guard being a cheap belt-and-suspenders**:
Individual components already respect the preference; the global rule catches anything that slipped through. Notes-for-author: "**Defense in depth.** A reduced-motion user shouldn't ever see an animation just because a single CSS file forgot the media query."

**On the Lighthouse threshold being a sanity check, not the goal**:
Accessibility ≥ 90, Performance ≥ 85 confirms the mobile pass didn't regress; session 136 (Performance pass) will push further. Notes-for-author: "**This session optimizes for usability, not raw scores.** Lighthouse is a sanity check that the responsive rules didn't introduce regressions."

**Pedagogical claim this session supports**:
"**The curriculum reads well on every device a learner has access to.** Phone on the bus, tablet at a desk, laptop at a desk — same content, same affordances, no apologetic mobile-only stripped-down version. **The chapter widgets, the math, the code, the tables, the navigation: all behave correctly at 320 px.** Accessibility isn't a separate feature; it's the consequence of good responsive practice. **Mobile-first thinking + per-widget breakpoints + site-wide cross-cutting rules = a curriculum every learner can actually use.**"

---

## Polish phase progress after this session

- ✅ Session 132 — Cross-chapter linking
- ✅ Session 133 — Search integration
- ✅ **Session 134 — Mobile pass** (this)
- ⬜ Session 135 — Accessibility audit
- ⬜ Session 136 — Performance pass
- ⬜ Session 137 — Social meta and OG cards

**3 polish sessions remain.** The mobile pass is the prerequisite for the accessibility audit (session 135): touch targets, keyboard navigation, screen reader behavior all build on the responsive foundation.

Build with care. **Mobile pass is what turns "works in dev mode at 1440 px" into "works for every learner who has a phone."**

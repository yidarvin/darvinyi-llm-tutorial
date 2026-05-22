# Session 04 — Layout, navigation, and landing

> Largest scaffolding session. Builds the chrome that surrounds every chapter: typed chapter manifest, sidebar with all 30 chapters, mobile hamburger nav, table-of-contents with active-section highlighting, prev/next chapter cards, footer, and the three-column `ChapterLayout`. Also replaces the typography-test landing with the real one and adds a 404 page.

---

## Read first

Before writing any code, read these files:

- `context/PROJECT_OVERVIEW.md` — for site identity, naming the project in copy, the "no marketing, no CTAs except next chapter" stance
- `context/DESIGN_SYSTEM.md` — **especially "Layout grid" and "Iconography" sections.** This session implements that grid.
- `context/CURRICULUM.md` — **the source of truth for the 30-chapter list.** The chapter manifest in this session must match it exactly.
- `context/TECH_STACK.md` — for the `lucide-react` icon set and the file-organization conventions
- `prompts/scaffolding/session-02-design-system.md` and `session-03-mdx-content-pipeline.md` — for what already exists; this session builds on both

---

## Goal

Give the site its navigation chrome and replace the typography test landing with the real one.

**End state:**
- `/` shows the real landing page: hero with subtle cyan glow, "What you'll learn" + "Who this is for" sections, curriculum grid with 9 Parts, author byline, footer
- `/ch01-neural-net-primitives/` shows a placeholder chapter inside the three-column `ChapterLayout` (sidebar with all 30 chapters, prose in the middle, TOC on the right)
- The sidebar correctly marks Ch 1 as the active chapter; all other chapters render as disabled (`status: 'planned'`)
- At < 1280px the TOC collapses; at < 1024px the sidebar collapses to a hamburger button
- Tapping the hamburger opens a slide-in overlay containing the same sidebar content
- Prev/next chapter cards appear at the bottom of every chapter page
- `/404` shows a clean error page

---

## Inputs

State of the repo after sessions 01–03:

- Working dev server with design system, MDX pipeline, and content components
- `src/pages/index.astro` is the typography test page (will be replaced)
- `src/pages/test-mdx.mdx` exists and stays in place (deleted in session 06)
- No `src/lib/`, no `src/components/nav/`, no `ChapterLayout.astro` yet

---

## Deliverables

1. `src/lib/chapters.ts` — typed manifest of all 30 chapters grouped by Part
2. `src/components/nav/Sidebar.astro` — desktop sidebar with full chapter index
3. `src/components/nav/MobileNav.astro` — mobile hamburger button + slide-in overlay (pure Astro + small inline script; no React needed)
4. `src/components/nav/TableOfContents.astro` — right-rail TOC with active-section highlighting
5. `src/components/nav/ChapterNav.astro` — prev/next chapter cards at bottom of chapter
6. `src/components/nav/Footer.astro` — site footer
7. `src/layouts/ChapterLayout.astro` — three-column layout wrapping `BaseLayout`
8. `src/pages/index.astro` — **replace** typography test with the real landing page
9. `src/pages/404.astro` — error page
10. `src/pages/ch01-neural-net-primitives/index.astro` — placeholder chapter to verify the chrome

**Do NOT modify** `src/layouts/BaseLayout.astro`, any file under `src/styles/`, any file under `src/components/content/`, or `astro.config.mjs`. Those are owned by earlier sessions.

---

## Detailed spec

### 1. `src/lib/chapters.ts`

The chapter manifest. **This must match `context/CURRICULUM.md` exactly** in chapter numbering, slugs, titles, and Part grouping.

```ts
// src/lib/chapters.ts

export type ChapterStatus = 'planned' | 'draft' | 'published';

export interface Chapter {
  num: number;
  slug: string;
  title: string;
  partNum: number;
  status: ChapterStatus;
}

export interface Part {
  num: number;
  title: string;
  chapters: Chapter[];
}

export const PARTS: Part[] = [
  {
    num: 1,
    title: 'Foundations',
    chapters: [
      { num: 1, slug: 'ch01-neural-net-primitives', title: 'Neural network primitives', partNum: 1, status: 'planned' },
      { num: 2, slug: 'ch02-embeddings', title: 'Embeddings & representation', partNum: 1, status: 'planned' },
      { num: 3, slug: 'ch03-tokenization', title: 'Tokenization', partNum: 1, status: 'planned' },
    ],
  },
  {
    num: 2,
    title: 'The Transformer',
    chapters: [
      { num: 4, slug: 'ch04-attention', title: 'Attention mechanism', partNum: 2, status: 'planned' },
      { num: 5, slug: 'ch05-multihead-and-block', title: 'Multi-head attention & the transformer block', partNum: 2, status: 'planned' },
      { num: 6, slug: 'ch06-positional-encoding', title: 'Positional encoding', partNum: 2, status: 'planned' },
    ],
  },
  {
    num: 3,
    title: 'Pre-training',
    chapters: [
      { num: 7,  slug: 'ch07-pretraining-data',    title: 'Pre-training data',                  partNum: 3, status: 'planned' },
      { num: 8,  slug: 'ch08-building-small-llm',  title: 'Building a small LLM',               partNum: 3, status: 'planned' },
      { num: 9,  slug: 'ch09-scaling-and-distributed', title: 'Scaling laws & distributed training', partNum: 3, status: 'planned' },
      { num: 10, slug: 'ch10-training-infra',      title: 'Training infrastructure',            partNum: 3, status: 'planned' },
    ],
  },
  {
    num: 4,
    title: 'Alternative Architectures',
    chapters: [
      { num: 11, slug: 'ch11-moe',           title: 'Mixture of Experts',         partNum: 4, status: 'planned' },
      { num: 12, slug: 'ch12-ssm-and-mamba', title: 'State-space models & Mamba', partNum: 4, status: 'planned' },
    ],
  },
  {
    num: 5,
    title: 'Post-training',
    chapters: [
      { num: 13, slug: 'ch13-sft',          title: 'Supervised fine-tuning',                  partNum: 5, status: 'planned' },
      { num: 14, slug: 'ch14-alignment',    title: 'Alignment (RLHF, DPO, RLVR, CAI)',        partNum: 5, status: 'planned' },
      { num: 15, slug: 'ch15-peft',         title: 'Parameter-efficient fine-tuning',         partNum: 5, status: 'planned' },
      { num: 16, slug: 'ch16-distillation', title: 'Distillation',                            partNum: 5, status: 'planned' },
    ],
  },
  {
    num: 6,
    title: 'Inference',
    chapters: [
      { num: 17, slug: 'ch17-inference-optimization', title: 'Inference optimization',  partNum: 6, status: 'planned' },
      { num: 18, slug: 'ch18-quantization',           title: 'Quantization & compression', partNum: 6, status: 'planned' },
      { num: 19, slug: 'ch19-sampling',               title: 'Sampling & decoding',      partNum: 6, status: 'planned' },
    ],
  },
  {
    num: 7,
    title: 'Modern Capabilities',
    chapters: [
      { num: 20, slug: 'ch20-reasoning',         title: 'Reasoning & test-time compute', partNum: 7, status: 'planned' },
      { num: 21, slug: 'ch21-tool-use',          title: 'Tool use',                      partNum: 7, status: 'planned' },
      { num: 22, slug: 'ch22-retrieval-and-rag', title: 'Retrieval & RAG',               partNum: 7, status: 'planned' },
      { num: 23, slug: 'ch23-multimodal',        title: 'Multimodal',                    partNum: 7, status: 'planned' },
    ],
  },
  {
    num: 8,
    title: 'Safety, Interpretability & Evaluation',
    chapters: [
      { num: 24, slug: 'ch24-safety',           title: 'Guardrails & safety', partNum: 8, status: 'planned' },
      { num: 25, slug: 'ch25-interpretability', title: 'Interpretability',    partNum: 8, status: 'planned' },
      { num: 26, slug: 'ch26-evaluation',       title: 'Evaluation',          partNum: 8, status: 'planned' },
    ],
  },
  {
    num: 9,
    title: 'Agents',
    chapters: [
      { num: 27, slug: 'ch27-agent-foundations',          title: 'Agent foundations',               partNum: 9, status: 'planned' },
      { num: 28, slug: 'ch28-agent-from-scratch',         title: 'Building an agent from scratch',  partNum: 9, status: 'planned' },
      { num: 29, slug: 'ch29-multi-agent',                title: 'Multi-agent systems',             partNum: 9, status: 'planned' },
      { num: 30, slug: 'ch30-agent-eval-and-frameworks',  title: 'Agent evaluation & frameworks',   partNum: 9, status: 'planned' },
    ],
  },
];

export const ALL_CHAPTERS: Chapter[] = PARTS.flatMap(p => p.chapters);

export function getChapter(slug: string): Chapter | undefined {
  return ALL_CHAPTERS.find(c => c.slug === slug);
}

export function getAdjacentChapters(slug: string): { prev?: Chapter; next?: Chapter } {
  const idx = ALL_CHAPTERS.findIndex(c => c.slug === slug);
  if (idx === -1) return {};
  return {
    prev: idx > 0 ? ALL_CHAPTERS[idx - 1] : undefined,
    next: idx < ALL_CHAPTERS.length - 1 ? ALL_CHAPTERS[idx + 1] : undefined,
  };
}

export function getFirstPublishedChapter(): Chapter | undefined {
  return ALL_CHAPTERS.find(c => c.status === 'published');
}
```

**Notes:**
- All chapters start with `status: 'planned'`. As chapters complete in Phases 3–12, their status flips. The CTA on the landing and the disabled-state in the sidebar both read from this.
- Slugs match the folder naming in `prompts/chapters/` and `research/`. Same slug, same chapter, everywhere in the project.
- Chapter titles match `context/CURRICULUM.md` exactly. If `CURRICULUM.md` updates a title, this file must update in sync.

### 2. `src/components/nav/Sidebar.astro`

Desktop sidebar. 240px wide, sticky to viewport top, internally scrollable. Lists all 30 chapters grouped by Part. Current chapter highlighted with cyan left-border; planned chapters dimmed and non-interactive.

```astro
---
import { PARTS } from '@lib/chapters';

const currentPath = Astro.url.pathname;
const currentSlug = currentPath.replace(/^\//, '').replace(/\/$/, '');
---
<aside class="sidebar">
  <div class="sidebar-header">
    <a href="/" class="sidebar-brand">LLM Tutorial</a>
    <p class="sidebar-tagline">From numpy to agents</p>
  </div>

  <nav class="sidebar-nav" aria-label="Chapter index">
    {PARTS.map(part => (
      <div class="sidebar-part">
        <h3 class="sidebar-part-title">
          Part {part.num} · {part.title}
        </h3>
        <ul class="sidebar-chapter-list">
          {part.chapters.map(ch => {
            const href = `/${ch.slug}/`;
            const isCurrent = currentSlug === ch.slug;
            const isDisabled = ch.status === 'planned';
            const numLabel = String(ch.num).padStart(2, '0');
            return (
              <li>
                {isDisabled ? (
                  <span class="sidebar-chapter sidebar-chapter-disabled" aria-disabled="true">
                    <span class="sidebar-chapter-num">{numLabel}</span>
                    <span class="sidebar-chapter-title">{ch.title}</span>
                  </span>
                ) : (
                  <a href={href} class:list={['sidebar-chapter', { 'sidebar-chapter-current': isCurrent }]} aria-current={isCurrent ? 'page' : undefined}>
                    <span class="sidebar-chapter-num">{numLabel}</span>
                    <span class="sidebar-chapter-title">{ch.title}</span>
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    ))}
  </nav>
</aside>

<style>
  .sidebar {
    display: none;
    width: var(--sidebar-width);
    flex-shrink: 0;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
    border-right: 1px solid var(--border-default);
    background: var(--bg-primary);
  }
  @media (min-width: 1024px) {
    .sidebar { display: block; }
  }

  .sidebar-header {
    padding: 1.5rem 1.25rem;
    border-bottom: 1px solid var(--border-default);
  }
  .sidebar-brand {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--cyan-500);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    text-decoration: none;
    border-bottom: none;
  }
  .sidebar-brand:hover { color: var(--cyan-300); border-bottom: none; }
  .sidebar-tagline {
    font-size: 0.75rem;
    color: var(--text-tertiary);
    margin: 0.25rem 0 0 0;
    max-width: none;
  }

  .sidebar-nav {
    padding: 1rem 0.5rem 4rem 0.5rem;
  }

  .sidebar-part { margin-bottom: 1.5rem; }
  .sidebar-part-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-tertiary);
    padding: 0 0.75rem;
    margin: 0 0 0.5rem 0;
    font-weight: 500;
  }

  .sidebar-chapter-list {
    list-style: none;
    padding: 0;
    margin: 0;
    max-width: none;
  }
  .sidebar-chapter-list li { margin: 0; }

  .sidebar-chapter {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    padding: 0.4rem 0.75rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
    text-decoration: none;
    border-left: 2px solid transparent;
    border-bottom: none;
    transition: color 200ms cubic-bezier(0.22, 1, 0.36, 1),
                background 200ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .sidebar-chapter:hover {
    color: var(--cyan-300);
    background: var(--bg-elevated);
    border-bottom: none;
  }
  .sidebar-chapter-current {
    color: var(--text-primary);
    font-weight: 500;
    border-left-color: var(--cyan-500);
    background: rgba(6, 182, 212, 0.05);
  }
  .sidebar-chapter-current:hover {
    color: var(--text-primary);
    background: rgba(6, 182, 212, 0.08);
  }
  .sidebar-chapter-disabled {
    cursor: not-allowed;
    color: var(--text-disabled);
  }
  .sidebar-chapter-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    color: var(--text-tertiary);
    flex-shrink: 0;
  }
  .sidebar-chapter-disabled .sidebar-chapter-num { color: var(--text-disabled); }
  .sidebar-chapter-title {
    line-height: 1.35;
  }
</style>
```

### 3. `src/components/nav/MobileNav.astro`

Hamburger button + slide-in overlay. Pure Astro + small inline script — no React needed because the state is just "open/closed" toggled via a class on a single element.

```astro
---
import { PARTS } from '@lib/chapters';
const currentPath = Astro.url.pathname;
const currentSlug = currentPath.replace(/^\//, '').replace(/\/$/, '');
---
<button id="mobile-nav-toggle" class="mobile-nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav-overlay">
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <line x1="3" y1="6"  x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
</button>

<div id="mobile-nav-overlay" class="mobile-nav-overlay" hidden>
  <div class="mobile-nav-panel">
    <div class="mobile-nav-header">
      <a href="/" class="mobile-nav-brand">LLM Tutorial</a>
      <button id="mobile-nav-close" class="mobile-nav-close" aria-label="Close menu">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="6" y1="6"  x2="18" y2="18" />
          <line x1="18" y1="6" x2="6"  y2="18" />
        </svg>
      </button>
    </div>
    <nav class="mobile-nav-list" aria-label="Chapter index">
      {PARTS.map(part => (
        <div class="mobile-nav-part">
          <h3 class="mobile-nav-part-title">Part {part.num} · {part.title}</h3>
          <ul>
            {part.chapters.map(ch => {
              const href = `/${ch.slug}/`;
              const isCurrent = currentSlug === ch.slug;
              const isDisabled = ch.status === 'planned';
              return (
                <li>
                  {isDisabled ? (
                    <span class="mobile-nav-chapter mobile-nav-chapter-disabled">
                      <span class="mobile-nav-chapter-num">{String(ch.num).padStart(2, '0')}</span>
                      {ch.title}
                    </span>
                  ) : (
                    <a href={href} class:list={['mobile-nav-chapter', { 'mobile-nav-chapter-current': isCurrent }]}>
                      <span class="mobile-nav-chapter-num">{String(ch.num).padStart(2, '0')}</span>
                      {ch.title}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  </div>
</div>

<script is:inline>
  (() => {
    const toggle  = document.getElementById('mobile-nav-toggle');
    const overlay = document.getElementById('mobile-nav-overlay');
    const close   = document.getElementById('mobile-nav-close');
    if (!toggle || !overlay || !close) return;

    const open = () => {
      overlay.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };
    const closeNav = () => {
      overlay.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    toggle.addEventListener('click', open);
    close.addEventListener('click', closeNav);

    // Close on backdrop click (clicking the overlay itself, not the panel)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeNav();
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !overlay.hidden) closeNav();
    });

    // Close when navigating to a new page (clicking a chapter link)
    overlay.querySelectorAll('a[href]').forEach(a => {
      a.addEventListener('click', () => setTimeout(closeNav, 50));
    });
  })();
</script>

<style>
  .mobile-nav-toggle {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: var(--z-nav);
    width: 40px;
    height: 40px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 200ms;
  }
  .mobile-nav-toggle:hover {
    border-color: var(--cyan-500);
  }
  @media (min-width: 1024px) {
    .mobile-nav-toggle { display: none; }
  }

  .mobile-nav-overlay {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal);
    background: rgba(10, 10, 10, 0.85);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: flex-end;
  }
  .mobile-nav-overlay[hidden] { display: none; }

  .mobile-nav-panel {
    width: min(360px, 90vw);
    height: 100%;
    background: var(--bg-primary);
    border-left: 1px solid var(--border-default);
    overflow-y: auto;
    padding-bottom: 4rem;
  }

  .mobile-nav-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--border-default);
  }
  .mobile-nav-brand {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--cyan-500);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    text-decoration: none;
    border-bottom: none;
  }
  .mobile-nav-close {
    background: transparent;
    border: 1px solid transparent;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: var(--radius-sm);
  }
  .mobile-nav-close:hover { color: var(--cyan-300); }

  .mobile-nav-list { padding: 1rem 0.5rem; }
  .mobile-nav-part { margin-bottom: 1.5rem; }
  .mobile-nav-part-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-tertiary);
    padding: 0 0.75rem;
    margin: 0 0 0.5rem 0;
    font-weight: 500;
  }
  .mobile-nav-list ul {
    list-style: none;
    padding: 0;
    margin: 0;
    max-width: none;
  }
  .mobile-nav-chapter {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
    color: var(--text-secondary);
    text-decoration: none;
    border-left: 2px solid transparent;
    border-bottom: none;
  }
  .mobile-nav-chapter-current {
    color: var(--text-primary);
    font-weight: 500;
    border-left-color: var(--cyan-500);
    background: rgba(6, 182, 212, 0.05);
  }
  .mobile-nav-chapter-disabled { color: var(--text-disabled); cursor: not-allowed; }
  .mobile-nav-chapter-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    color: var(--text-tertiary);
  }
</style>
```

**Notes:**
- Pure Astro + vanilla JS via `<script is:inline>`. No React island needed for this state ("open" or "closed" is a single boolean).
- `document.body.style.overflow = 'hidden'` prevents the page underneath from scrolling while the overlay is open.
- The script uses an IIFE so its variables don't leak to global scope.
- The hamburger button uses an inline SVG (three horizontal lines). Could be `lucide-react`'s `Menu`, but since we're avoiding React in this component, inline SVG is simpler and identical visually.

### 4. `src/components/nav/TableOfContents.astro`

Right-rail TOC. Extracts h2 and h3 from the rendered page at runtime via a small inline script. IntersectionObserver highlights the section currently in view. Hidden below `xl` (1280px) breakpoint.

```astro
---
// No frontmatter logic needed; everything is client-side.
---
<aside class="toc" aria-label="On this page">
  <h4 class="toc-title">On this page</h4>
  <nav id="toc-nav" class="toc-nav"></nav>
</aside>

<script is:inline>
  (() => {
    const tocNav = document.getElementById('toc-nav');
    const main   = document.querySelector('main.chapter-content');
    if (!tocNav || !main) return;

    const headings = main.querySelectorAll('h2, h3');
    if (headings.length === 0) return;

    headings.forEach((h) => {
      if (!h.id) return;
      const link = document.createElement('a');
      link.href = '#' + h.id;
      link.textContent = h.textContent || '';
      link.className = h.tagName === 'H2' ? 'toc-link toc-link-h2' : 'toc-link toc-link-h3';
      tocNav.appendChild(link);
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const id = e.target.id;
        if (!id) return;
        tocNav.querySelectorAll('a').forEach((a) => a.classList.remove('toc-link-active'));
        const link = tocNav.querySelector(`a[href="#${id}"]`);
        if (link) link.classList.add('toc-link-active');
      });
    }, { rootMargin: '-20% 0px -60% 0px' });

    headings.forEach((h) => { if (h.id) observer.observe(h); });
  })();
</script>

<style>
  .toc {
    display: none;
    width: var(--toc-width);
    flex-shrink: 0;
    position: sticky;
    top: 3rem;
    height: fit-content;
    max-height: calc(100vh - 6rem);
    overflow-y: auto;
    padding-left: 1.5rem;
  }
  @media (min-width: 1280px) {
    .toc { display: block; }
  }

  .toc-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-tertiary);
    margin: 0 0 0.75rem 0;
    font-weight: 500;
  }

  .toc-nav {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.85rem;
  }

  .toc-nav :global(a.toc-link) {
    color: var(--text-secondary);
    text-decoration: none;
    border-bottom: none;
    line-height: 1.4;
    transition: color 200ms;
  }
  .toc-nav :global(a.toc-link:hover) {
    color: var(--cyan-300);
    border-bottom: none;
  }
  .toc-nav :global(a.toc-link-h3) {
    padding-left: 0.75rem;
    font-size: 0.8rem;
    color: var(--text-tertiary);
  }
  .toc-nav :global(a.toc-link-active) {
    color: var(--cyan-400);
    font-weight: 500;
  }
</style>
```

**Notes:**
- The script depends on `main.chapter-content` existing as a selector. `ChapterLayout.astro` (next section) gives the prose `<main>` this class.
- Headings already have IDs from `rehype-slug` (added in session 03). No need to assign IDs here.
- `IntersectionObserver` `rootMargin: '-20% 0px -60% 0px'` means a heading is considered "in view" when it's in the top 20-40% of the viewport — feels right for reading.
- `:global()` selectors are used for the dynamically-inserted `<a>` elements (script adds them at runtime, so Astro's scoping doesn't reach them).

### 5. `src/components/nav/ChapterNav.astro`

Prev/next chapter cards at bottom of every chapter.

```astro
---
import { getAdjacentChapters } from '@lib/chapters';

export interface Props {
  currentSlug: string;
}
const { currentSlug } = Astro.props;
const { prev, next } = getAdjacentChapters(currentSlug);
---
<nav class="chapter-nav" aria-label="Chapter navigation">
  {prev ? (
    prev.status === 'planned' ? (
      <div class="chapter-nav-card chapter-nav-disabled" aria-disabled="true">
        <div class="chapter-nav-direction">← Previous</div>
        <div class="chapter-nav-title">{prev.title}</div>
      </div>
    ) : (
      <a href={`/${prev.slug}/`} class="chapter-nav-card">
        <div class="chapter-nav-direction">← Previous</div>
        <div class="chapter-nav-title">{prev.title}</div>
      </a>
    )
  ) : (
    <div class="chapter-nav-spacer"></div>
  )}

  {next ? (
    next.status === 'planned' ? (
      <div class="chapter-nav-card chapter-nav-disabled chapter-nav-right" aria-disabled="true">
        <div class="chapter-nav-direction">Next →</div>
        <div class="chapter-nav-title">{next.title}</div>
      </div>
    ) : (
      <a href={`/${next.slug}/`} class="chapter-nav-card chapter-nav-right">
        <div class="chapter-nav-direction">Next →</div>
        <div class="chapter-nav-title">{next.title}</div>
      </a>
    )
  ) : (
    <div class="chapter-nav-spacer"></div>
  )}
</nav>

<style>
  .chapter-nav {
    display: flex;
    gap: 1rem;
    margin-top: 4rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border-default);
    max-width: var(--container-prose);
  }

  .chapter-nav-spacer { flex: 1; }

  .chapter-nav-card {
    flex: 1;
    display: block;
    padding: 1rem 1.25rem;
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    text-decoration: none;
    transition: border-color 200ms, background 200ms;
  }
  .chapter-nav-card:hover {
    border-color: rgba(6, 182, 212, 0.4);
    background: rgba(6, 182, 212, 0.03);
    border-bottom: 1px solid rgba(6, 182, 212, 0.4);
    color: var(--text-primary);
  }
  .chapter-nav-card.chapter-nav-right {
    text-align: right;
  }

  .chapter-nav-direction {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-tertiary);
    margin-bottom: 0.25rem;
  }
  .chapter-nav-title {
    color: var(--text-primary);
    font-size: 0.95rem;
    font-weight: 500;
  }
  .chapter-nav-card:hover .chapter-nav-title {
    color: var(--cyan-300);
  }

  .chapter-nav-disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  .chapter-nav-disabled:hover {
    border-color: var(--border-default);
    background: transparent;
  }
  .chapter-nav-disabled .chapter-nav-title {
    color: var(--text-disabled);
  }
</style>
```

### 6. `src/components/nav/Footer.astro`

Site footer. Lives at the bottom of every page.

```astro
---
const year = new Date().getFullYear();
---
<footer class="footer">
  <div class="footer-inner">
    <div class="footer-col">
      <div class="footer-brand">LLM Tutorial</div>
      <p class="footer-tagline">From numpy to agents.</p>
    </div>
    <div class="footer-col">
      <div class="footer-heading">Related</div>
      <ul>
        <li><a href="https://darvinyi.com">darvinyi.com</a></li>
        <li><a href="https://textbook.darvinyi.com">Textbook</a></li>
        <li><a href="https://github.com/yidarvin/darvinyi-llm-tutorial">GitHub repo</a></li>
      </ul>
    </div>
    <div class="footer-col footer-col-right">
      <div class="footer-heading">© {year} Darvin Yi</div>
      <p class="footer-tagline">Built with Astro, MDX, and a lot of coffee.</p>
    </div>
  </div>
</footer>

<style>
  .footer {
    margin-top: 8rem;
    border-top: 1px solid var(--border-default);
    padding: 2.5rem 1.5rem;
  }
  .footer-inner {
    max-width: var(--container-wide);
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    font-size: 0.875rem;
    color: var(--text-tertiary);
  }
  @media (min-width: 768px) {
    .footer-inner { grid-template-columns: repeat(3, 1fr); }
  }

  .footer-brand {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--cyan-500);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 0.5rem;
  }
  .footer-tagline {
    margin: 0;
    color: var(--text-tertiary);
    max-width: none;
  }
  .footer-heading {
    color: var(--text-secondary);
    font-weight: 500;
    margin-bottom: 0.5rem;
  }
  .footer-col ul {
    list-style: none;
    padding: 0;
    margin: 0;
    max-width: none;
  }
  .footer-col li { margin: 0.25rem 0; }
  .footer-col-right { text-align: left; }
  @media (min-width: 768px) {
    .footer-col-right { text-align: right; }
  }
</style>
```

### 7. `src/layouts/ChapterLayout.astro`

Three-column layout for chapter pages. Wraps `BaseLayout`. Shows sidebar (`lg+`), prose (always), TOC (`xl+`), prev/next at chapter bottom, footer.

```astro
---
import BaseLayout from './BaseLayout.astro';
import Sidebar from '@components/nav/Sidebar.astro';
import MobileNav from '@components/nav/MobileNav.astro';
import TableOfContents from '@components/nav/TableOfContents.astro';
import ChapterNav from '@components/nav/ChapterNav.astro';
import Footer from '@components/nav/Footer.astro';
import { getChapter } from '@lib/chapters';

export interface Props {
  slug: string;
  description?: string;
}
const { slug, description } = Astro.props;
const chapter = getChapter(slug);
const pageTitle = chapter ? `${chapter.num}. ${chapter.title}` : 'Chapter';
---
<BaseLayout title={pageTitle} description={description}>
  <div class="chapter-layout">
    <Sidebar />
    <MobileNav />

    <div class="chapter-layout-main">
      <main id="main" class="chapter-content">
        {chapter && (
          <header class="chapter-header">
            <div class="chapter-eyebrow">Chapter {chapter.num}</div>
            <h1 class="chapter-title">{chapter.title}</h1>
            {description && <p class="chapter-description">{description}</p>}
          </header>
        )}

        <slot />

        <ChapterNav currentSlug={slug} />
      </main>

      <TableOfContents />
    </div>
  </div>

  <Footer />
</BaseLayout>

<style>
  .chapter-layout {
    display: flex;
    min-height: 100vh;
  }

  .chapter-layout-main {
    flex: 1;
    min-width: 0;
    display: flex;
    justify-content: center;
    padding: 0 1.5rem;
  }
  @media (min-width: 1024px) {
    .chapter-layout-main { padding: 0 2.5rem; }
  }

  .chapter-content {
    flex: 1;
    min-width: 0;
    max-width: calc(var(--container-prose) + 4rem);
    padding: 4rem 0;
  }

  .chapter-header {
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--border-default);
  }
  .chapter-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--cyan-500);
    margin-bottom: 0.75rem;
    font-weight: 500;
  }
  .chapter-title {
    margin-top: 0;
    margin-bottom: 0.75rem;
  }
  .chapter-description {
    font-size: 1.125rem;
    color: var(--text-secondary);
    margin: 0;
    max-width: var(--container-prose);
  }
</style>
```

**Notes:**
- `main.chapter-content` is the selector `TableOfContents.astro`'s script queries for headings.
- The `<header class="chapter-header">` renders the "Chapter N" eyebrow + h1 + optional description automatically. Chapter MDX files don't need to repeat this.

### 8. `src/pages/index.astro` (replace)

The real landing page. Replaces the typography test.

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import Footer from '@components/nav/Footer.astro';
import { PARTS, ALL_CHAPTERS, getFirstPublishedChapter } from '@lib/chapters';

const totalChapters = ALL_CHAPTERS.length;
const startHere = getFirstPublishedChapter();
---
<BaseLayout>
  <main id="main">
    <section class="hero">
      <div class="hero-glow" aria-hidden="true"></div>
      <div class="hero-content">
        <p class="hero-eyebrow">LLM Tutorial</p>
        <h1 class="hero-title">
          Build a modern LLM.<br />
          <span class="hero-title-accent">From numpy to agents.</span>
        </h1>
        <p class="hero-subtitle">
          A comprehensive tutorial in {totalChapters} chapters covering every aspect of how modern language models actually work.
        </p>
        <div class="hero-actions">
          {startHere ? (
            <a href={`/${startHere.slug}/`} class="hero-cta">Start with Chapter {startHere.num} →</a>
          ) : (
            <span class="hero-cta hero-cta-disabled">Chapters coming soon</span>
          )}
          <a href="#curriculum" class="hero-link">View curriculum</a>
        </div>
      </div>
    </section>

    <section class="info">
      <div class="info-grid">
        <div>
          <h2>What you'll learn</h2>
          <ul>
            <li>Numpy implementations of every primitive — attention, transformers, RoPE, MoE routing, selective scan</li>
            <li>The transformer end-to-end, plus alternative architectures (Mamba, state-space models)</li>
            <li>Pre-training: data, training infrastructure, distributed training, scaling laws</li>
            <li>Post-training: SFT, RLHF, DPO, RLVR, Constitutional AI, LoRA, distillation</li>
            <li>Inference: KV caches, FlashAttention, PagedAttention, quantization, speculative decoding</li>
            <li>Agents: tool use, retrieval, reasoning, building harnesses and frameworks from scratch</li>
          </ul>
        </div>
        <div>
          <h2>Who this is for</h2>
          <ul>
            <li>ML engineers who want to go from "I use the model" to "I understand the model"</li>
            <li>Students past intro ML who want comprehensive, current LLM knowledge</li>
            <li>Builders working on agentic systems who want first-principles depth</li>
          </ul>
        </div>
      </div>
    </section>

    <section id="curriculum" class="curriculum">
      <h2>Curriculum</h2>
      <div class="curriculum-grid">
        {PARTS.map(part => {
          const firstAvailable = part.chapters.find(c => c.status !== 'planned');
          const partHref = firstAvailable ? `/${firstAvailable.slug}/` : undefined;
          return (
            partHref ? (
              <a href={partHref} class="part-card">
                <div class="part-card-eyebrow">Part {part.num}</div>
                <div class="part-card-title">{part.title}</div>
                <div class="part-card-meta">{part.chapters.length} chapter{part.chapters.length === 1 ? '' : 's'}</div>
              </a>
            ) : (
              <div class="part-card part-card-disabled">
                <div class="part-card-eyebrow">Part {part.num}</div>
                <div class="part-card-title">{part.title}</div>
                <div class="part-card-meta">{part.chapters.length} chapter{part.chapters.length === 1 ? '' : 's'} · planned</div>
              </div>
            )
          );
        })}
      </div>
    </section>

    <section class="author">
      <h2>Written by Darvin Yi</h2>
      <p>Director of Machine Learning at Upwork. Stanford PhD in Biomedical Informatics. Adjunct faculty at UIC.</p>
      <div class="author-links">
        <a href="https://darvinyi.com">darvinyi.com</a>
        <a href="https://textbook.darvinyi.com">textbook</a>
        <a href="https://github.com/yidarvin/darvinyi-llm-tutorial">github</a>
      </div>
    </section>
  </main>

  <Footer />
</BaseLayout>

<style>
  /* Hero */
  .hero {
    position: relative;
    padding: 8rem 1.5rem;
    text-align: center;
    overflow: hidden;
  }
  .hero-glow {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(circle at 50% 30%, var(--cyan-glow), transparent 60%);
  }
  .hero-content {
    position: relative;
    max-width: 1000px;
    margin: 0 auto;
  }
  .hero-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--cyan-500);
    margin: 0 0 1.5rem 0;
    max-width: none;
  }
  .hero-title {
    font-size: clamp(2.5rem, 6vw, 4rem);
    line-height: 1.1;
    font-weight: 700;
    letter-spacing: -0.03em;
    margin: 0 0 1.5rem 0;
  }
  .hero-title-accent { color: var(--cyan-400); }
  .hero-subtitle {
    font-size: 1.125rem;
    color: var(--text-secondary);
    max-width: 600px;
    margin: 0 auto 2.5rem auto;
    line-height: 1.5;
  }
  .hero-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  .hero-cta {
    display: inline-block;
    padding: 0.875rem 1.5rem;
    background: var(--cyan-500);
    color: var(--bg-primary);
    font-weight: 500;
    border-radius: var(--radius-md);
    border-bottom: none;
    transition: background 200ms;
  }
  .hero-cta:hover {
    background: var(--cyan-400);
    color: var(--bg-primary);
    border-bottom: none;
  }
  .hero-cta-disabled {
    background: var(--bg-elevated);
    color: var(--text-tertiary);
    cursor: not-allowed;
    border: 1px solid var(--border-default);
  }
  .hero-cta-disabled:hover { background: var(--bg-elevated); color: var(--text-tertiary); }
  .hero-link {
    display: inline-block;
    padding: 0.875rem 1.5rem;
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    color: var(--text-primary);
  }
  .hero-link:hover {
    border-color: rgba(6, 182, 212, 0.5);
    color: var(--cyan-300);
    border-bottom: 1px solid rgba(6, 182, 212, 0.5);
  }

  /* Info section */
  .info {
    padding: 5rem 1.5rem;
    max-width: var(--container-wide);
    margin: 0 auto;
  }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 3rem;
  }
  @media (min-width: 768px) {
    .info-grid { grid-template-columns: 1fr 1fr; }
  }

  /* Curriculum */
  .curriculum {
    padding: 5rem 1.5rem;
    max-width: var(--container-wide);
    margin: 0 auto;
  }
  .curriculum-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  @media (min-width: 640px) { .curriculum-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .curriculum-grid { grid-template-columns: repeat(3, 1fr); } }

  .part-card {
    display: block;
    padding: 1.25rem;
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    text-decoration: none;
    color: var(--text-primary);
    transition: border-color 200ms, background 200ms;
  }
  .part-card:hover {
    border-color: rgba(6, 182, 212, 0.5);
    background: rgba(6, 182, 212, 0.03);
    border-bottom: 1px solid rgba(6, 182, 212, 0.5);
    color: var(--text-primary);
  }
  .part-card-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--cyan-500);
    margin-bottom: 0.5rem;
  }
  .part-card-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }
  .part-card:hover .part-card-title { color: var(--cyan-300); }
  .part-card-meta {
    font-size: 0.85rem;
    color: var(--text-tertiary);
  }
  .part-card-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .part-card-disabled:hover {
    border-color: var(--border-default);
    background: transparent;
  }

  /* Author */
  .author {
    padding: 5rem 1.5rem;
    max-width: var(--container-prose);
    margin: 0 auto;
    text-align: center;
  }
  .author p { margin: 0 auto; max-width: none; }
  .author-links {
    display: flex;
    gap: 1.5rem;
    justify-content: center;
    margin-top: 1.5rem;
    font-size: 0.9rem;
  }
</style>
```

### 9. `src/pages/404.astro`

Simple error page.

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import Footer from '@components/nav/Footer.astro';
---
<BaseLayout title="Not found" description="The page you're looking for doesn't exist.">
  <main id="main" class="error-page">
    <p class="error-code">404</p>
    <h1>Not found</h1>
    <p>The page you're looking for doesn't exist, or it hasn't been written yet.</p>
    <a href="/" class="error-back">← Back to home</a>
  </main>
  <Footer />
</BaseLayout>

<style>
  .error-page {
    max-width: var(--container-prose);
    margin: 0 auto;
    padding: 8rem 1.5rem;
    text-align: center;
  }
  .error-code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--cyan-500);
    margin-bottom: 1rem;
    max-width: none;
  }
  .error-back {
    display: inline-block;
    margin-top: 2rem;
    padding: 0.75rem 1.25rem;
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    border-bottom: 1px solid var(--border-default);
  }
  .error-back:hover {
    border-color: rgba(6, 182, 212, 0.5);
    border-bottom: 1px solid rgba(6, 182, 212, 0.5);
  }
</style>
```

### 10. `src/pages/ch01-neural-net-primitives/index.astro`

Placeholder Ch 1 page. Verifies the chapter layout chrome works. Will be replaced in Phase 3 by `index.mdx`.

```astro
---
import ChapterLayout from '@/layouts/ChapterLayout.astro';
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

  <h2>One more section</h2>
  <p>So the TOC has enough entries to be useful during testing.</p>
</ChapterLayout>
```

**Important:** while this file has `status: 'planned'` in `chapters.ts`, you (the session author) should NOT change the status to `'published'`. The chapter is genuinely not built yet; this placeholder exists only to test the layout chrome. The status will flip to `'published'` at the end of Phase 3 when real Ch 1 content lands.

This produces an interesting state during Phase 2: the placeholder page exists at `/ch01-neural-net-primitives/` and works, but the sidebar shows Ch 1 as disabled, and the landing's CTA appears as "Chapters coming soon" because no chapter is published. That's expected behavior — visit the URL directly to test the chrome.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly; no console errors.
2. **`/` (landing page)** renders with:
   - Hero with subtle cyan radial glow visible behind the title
   - Title in two lines: "Build a modern LLM." (white) then "From numpy to agents." (cyan)
   - "Chapters coming soon" CTA (disabled-looking because Ch 1 is `planned`)
   - "What you'll learn" + "Who this is for" two-column section
   - 9-Part curriculum grid (all part cards show `planned` state and are non-interactive)
   - Author byline section
   - Footer
3. **`/ch01-neural-net-primitives/`** (direct URL navigation) renders inside `ChapterLayout` with:
   - Sidebar visible on the left (≥1024px) showing all 30 chapters; Ch 1 is highlighted as current (cyan left-border)
   - Other chapters in the sidebar appear disabled (dimmed)
   - "Chapter 1" eyebrow + "Neural network primitives" h1 + description at top of prose
   - Placeholder prose content
   - TOC visible on the right at ≥1280px, showing "What this chapter will cover", "A second section", "A subsection" (indented), "One more section"
   - Prev/next nav at the bottom — no prev (Ch 1 is first), next is "Embeddings & representation" (disabled because planned)
   - Footer below the chapter
4. **`/404`** renders the error page with the 404 indicator, heading, message, and back link
5. **Resize to 1100px width:** TOC disappears, sidebar remains
6. **Resize to 900px:** sidebar disappears, hamburger button visible in top-right corner
7. **Tap hamburger:** overlay slides in from right; backdrop is semi-transparent dark; close button (X) in top-right of panel works; Escape key closes; clicking outside the panel closes
8. **Page scrolling is disabled** while the mobile overlay is open
9. **TOC active-section highlight** works as you scroll through the placeholder Ch 1 page (the entries highlight in cyan as their corresponding sections enter the viewport)
10. **`npm run typecheck`** passes with zero errors
11. **`npm run build`** completes; `dist/` contains `index.html`, `404.html`, and `ch01-neural-net-primitives/index.html`
12. **Final repo additions:**

```
src/
├── lib/
│   └── chapters.ts                                     ← new
├── components/
│   ├── content/                                        (unchanged)
│   └── nav/                                            ← new directory
│       ├── Sidebar.astro
│       ├── MobileNav.astro
│       ├── TableOfContents.astro
│       ├── ChapterNav.astro
│       └── Footer.astro
├── layouts/
│   ├── BaseLayout.astro                                (unchanged)
│   └── ChapterLayout.astro                             ← new
└── pages/
    ├── index.astro                                     (replaced)
    ├── 404.astro                                       ← new
    ├── test-mdx.mdx                                    (unchanged)
    └── ch01-neural-net-primitives/
        └── index.astro                                 ← new (placeholder)
```

---

## Out of scope

- ❌ **Do not delete `src/pages/test-mdx.mdx`.** It stays through Phases 2–4 as a visual reference; session 06 deletes it.
- ❌ **Do not write any chapter content beyond the placeholder.** Real Ch 1 prose lands in Phase 3 session 07.
- ❌ **Do not flip Ch 1's status to 'published'.** It remains `'planned'` until Phase 3 completes.
- ❌ **Do not add Pagefind search UI.** Session 06 handles search integration and UI.
- ❌ **Do not build `<RunnableCode>` or any Pyodide-related component.** Session 05.
- ❌ **Do not add an "About" page.** Not needed for v1; author info is in the landing footer.
- ❌ **Do not add a comment system / Giscus / Disqus.** Documented decision in `MASTER_PLAN.md`.
- ❌ **Do not add a "What's new" / changelog page.** Same.
- ❌ **Do not modify `astro.config.mjs`** or any earlier-session file.

---

## Wire-up

After all acceptance criteria pass:

```bash
git add src/lib src/components/nav src/layouts/ChapterLayout.astro src/pages/index.astro src/pages/404.astro src/pages/ch01-neural-net-primitives/
git commit -m "session 04: layout chrome — chapter manifest, sidebar, mobile nav, TOC, ChapterNav, Footer, ChapterLayout, real landing"
git push origin main
```

Take screenshots of: landing at desktop, landing at mobile, Ch 1 placeholder at desktop with TOC visible, Ch 1 placeholder at mobile with hamburger open.

The next session (`session-05-pyodide-runnable-code.md`) assumes:
- `ChapterLayout` exists and renders correctly
- `chapters.ts` is importable via `@lib/chapters`
- The placeholder Ch 1 page exists (session 05 will use it for a small Pyodide test, then it gets replaced by real content in Phase 3)

---

## Notes for the session author

**If the sidebar shows the wrong chapter as current**, the path-matching logic in `Sidebar.astro` may be off. The component computes `currentSlug` by stripping leading and trailing slashes from `Astro.url.pathname`. Verify this works for paths like `/ch01-neural-net-primitives/` (with trailing slash, as Astro emits).

**If the TOC doesn't populate**, the script depends on `main.chapter-content` existing as a selector with `<h2>` and `<h3>` children that have `id` attributes. The IDs come from `rehype-slug` (added in session 03). On the placeholder Ch 1 page, the headings are written in plain HTML (`<h2>What this chapter...`) — Astro's processing should give them IDs via the `rehype-slug` plugin even for `.astro` files. If not, the TOC script will find no headings to display.

**If the TOC active highlight doesn't work**, check that `IntersectionObserver` is observing the right elements. The script queries `h2, h3` inside `main.chapter-content`. The `rootMargin: '-20% 0px -60% 0px'` may need tuning for shorter pages — the placeholder Ch 1 has few sections.

**If the mobile overlay doesn't close on backdrop click**, the click target check `e.target === overlay` is strict — clicking the panel (which is a child of `overlay`) doesn't trigger close. Verify the DOM structure matches.

**If `aria-current` errors in TypeScript**, the value must be one of `'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false' | undefined`. Using `undefined` instead of `false` when not current is intentional — `false` is valid but renders the attribute as `aria-current="false"`, which is technically different from "no aria-current."

**If chapter title styles look heavy**, check that `ChapterLayout`'s `.chapter-title` is inheriting from `base.css`'s `h1` rule. The layout's `<style>` block adds `.chapter-title { margin-top: 0 }` but leaves the rest to inheritance.

This session adds the most chrome at once. Take it slowly. The chapter layout in particular has many interacting pieces (sidebar width, prose max-width, TOC width, padding); verify at 1024px and 1280px breakpoints specifically.

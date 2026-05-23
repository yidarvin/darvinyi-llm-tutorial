# Session 132 — Cross-chapter linking — **POLISH PHASE BEGINS**

> **First polish session.** The curriculum's 30 chapters are specified and published (sessions 1-131). The polish phase now ships final UX: cross-chapter linking, search, mobile pass, accessibility audit, performance pass, social/OG meta. **This session covers cross-chapter linking** — making the connections between chapters visible and navigable. **Two complementary mechanisms**: (1) an auto-rendered **"Related chapters" footer** on every chapter, driven by a manifest, injected via `ChapterLayout.astro` so it ships to all 30 chapters from a single modification; (2) an inline **`<CrossRef>` component** for selective callout placement when chapters reference each other in prose. **The polish phase's working principle**: layout-driven changes that touch the whole site from one place. **No per-chapter MDX edits in this session.**

---

## Read first (in this order)

1. **`context/PROJECT_OVERVIEW.md`** — for the site's overall structure and the layout architecture
2. **`prompts/scaffolding/session-009-chapter-layout.md`** (or wherever ChapterLayout was originally specced) — for how the chapter layout is currently structured
3. **The curriculum's connections paragraph** — every chapter's research file has a "Connections to other chapters" section listing what it references; **these are the source data for the manifest**
4. **`prompts/chapters/ch30-agent-eval-and-frameworks/session-128-page-structure.md`** — section 8 of Ch 30 is itself a curriculum-wide cross-reference and serves as the gold standard

---

## Goal

By end of session, **two things change in the repo**:

1. **A "Related chapters" footer renders on every chapter page**, automatically driven by a manifest. Touching the manifest once updates all 30 chapters. The footer shows 3-5 related chapters, each as a navigable card.
2. **A new `<CrossRef>` inline component exists** for selective MDX use — though this session does NOT modify any MDX file. The component is shipped ready for future use; insertions remain for later polish work or one-off needs.

**End state:** every chapter has a "Related chapters" footer block at the bottom (between content and prev/next nav). No MDX changes; layout-driven only. **All cross-chapter links travel through the manifest** for centralized maintenance.

---

## Inputs

State of the repo after session 131 (curriculum complete):

- All 30 chapters `'published'` in `src/lib/chapters.ts`
- `src/layouts/ChapterLayout.astro` exists and renders eyebrow + h1 + description + slot + prev/next nav
- No `src/components/content/CrossRef.tsx` yet
- No `src/lib/related-chapters.ts` yet

---

## Deliverables

1. **Create** `src/lib/related-chapters.ts` — the manifest mapping every chapter slug → array of related chapter slugs (with relationship type)
2. **Create** `src/components/content/RelatedChapters.tsx` — the auto-rendered footer component
3. **Create** `src/components/content/RelatedChapters.module.css` — scoped styles
4. **Create** `src/components/content/CrossRef.tsx` — the inline cross-reference component (selective use)
5. **Create** `src/components/content/CrossRef.module.css` — scoped styles
6. **Update** `src/components/content/index.ts` — add `CrossRef` export (not RelatedChapters; that one renders via layout, not MDX)
7. **Update** `src/layouts/ChapterLayout.astro` — render `<RelatedChapters slug={...} />` between content and prev/next nav

**Do not modify** any MDX file. The cross-references travel through the manifest.

---

## Detailed spec

### 1. `related-chapters.ts` (the manifest)

The single source of truth for which chapters relate to which. Each entry has:
- `slug`: the related chapter
- `relationship`: short label (e.g., "foundation", "extension", "discipline", "alternative", "callback")

```ts
// src/lib/related-chapters.ts

export type RelationshipType =
  | 'foundation'    // this chapter builds on the related one
  | 'extension'     // the related chapter extends this one's ideas
  | 'discipline'    // related discipline (safety, interp, eval)
  | 'alternative'   // related architecture or approach
  | 'callback'      // explicit callback in prose (e.g., Ch 30 § 8)
  | 'cross-phase';  // bridges two parts of the curriculum

export interface RelatedChapter {
  slug: string;
  relationship: RelationshipType;
  /** Short reason this chapter is related (1 sentence). */
  reason: string;
}

/**
 * Per-chapter related-chapter manifest.
 * Keep each list to 3-5 entries — the most pedagogically valuable connections,
 * not exhaustive cross-references. Order: most-relevant first.
 *
 * Source: each chapter's `research/{chN}/research.md` has a "Connections to
 * other chapters" section. The manifest below distills those into the highest-
 * signal links.
 */

export const RELATED_CHAPTERS: Record<string, RelatedChapter[]> = {
  // Part I — Foundations
  'ch1-tokens-and-embeddings': [
    { slug: 'ch2-attention-intuition', relationship: 'extension', reason: 'Attention operates on the embeddings introduced here.' },
    { slug: 'ch4-the-transformer-block', relationship: 'extension', reason: 'The full transformer block consumes these embeddings.' },
    { slug: 'ch20-reasoning', relationship: 'cross-phase', reason: 'Reasoning traces flow through the same embedding space.' },
  ],
  'ch2-attention-intuition': [
    { slug: 'ch1-tokens-and-embeddings', relationship: 'foundation', reason: 'Embeddings are the inputs that attention operates on.' },
    { slug: 'ch3-multi-head-attention', relationship: 'extension', reason: 'Multi-head attention extends single-head attention.' },
    { slug: 'ch4-the-transformer-block', relationship: 'extension', reason: 'The transformer block embeds attention as one of its layers.' },
  ],
  'ch3-multi-head-attention': [
    { slug: 'ch2-attention-intuition', relationship: 'foundation', reason: 'Multi-head attention is multiple parallel single-head attentions.' },
    { slug: 'ch4-the-transformer-block', relationship: 'extension', reason: 'Multi-head attention slots into the full transformer block.' },
    { slug: 'ch17-kv-caching', relationship: 'cross-phase', reason: 'KV-caching is what makes multi-head attention efficient at inference.' },
  ],

  // Part II — The Transformer
  'ch4-the-transformer-block': [
    { slug: 'ch3-multi-head-attention', relationship: 'foundation', reason: 'Multi-head attention is the core sub-layer.' },
    { slug: 'ch5-positional-encoding-and-normalization', relationship: 'extension', reason: 'Positional encoding and normalization wrap the attention block.' },
    { slug: 'ch7-training-objectives', relationship: 'cross-phase', reason: 'The transformer block is what training optimizes.' },
  ],
  'ch5-positional-encoding-and-normalization': [
    { slug: 'ch4-the-transformer-block', relationship: 'foundation', reason: 'The block uses positional encoding and normalization.' },
    { slug: 'ch6-the-full-transformer', relationship: 'extension', reason: 'Stacked blocks form the full model.' },
  ],
  'ch6-the-full-transformer': [
    { slug: 'ch4-the-transformer-block', relationship: 'foundation', reason: 'The full model stacks N transformer blocks.' },
    { slug: 'ch7-training-objectives', relationship: 'extension', reason: 'Training this model is the next step.' },
    { slug: 'ch11-mixture-of-experts', relationship: 'alternative', reason: 'MoE replaces the dense FFN with sparse experts.' },
  ],

  // Part III — Pre-training
  'ch7-training-objectives': [
    { slug: 'ch6-the-full-transformer', relationship: 'foundation', reason: 'Training operates on the full transformer.' },
    { slug: 'ch8-scaling-laws', relationship: 'extension', reason: 'Scaling laws describe how training scales with compute.' },
    { slug: 'ch13-supervised-fine-tuning', relationship: 'cross-phase', reason: 'SFT is post-training, using the same objective family.' },
  ],
  'ch8-scaling-laws': [
    { slug: 'ch7-training-objectives', relationship: 'foundation', reason: 'Scaling laws are derived from training loss.' },
    { slug: 'ch9-data-curation', relationship: 'extension', reason: 'Data curation determines what scaling laws apply to.' },
    { slug: 'ch10-distributed-training', relationship: 'extension', reason: 'Scaling requires distributed training infrastructure.' },
  ],
  'ch9-data-curation': [
    { slug: 'ch7-training-objectives', relationship: 'foundation', reason: 'Data curation shapes the training distribution.' },
    { slug: 'ch8-scaling-laws', relationship: 'extension', reason: 'Data quality interacts with scaling laws.' },
    { slug: 'ch24-safety', relationship: 'cross-phase', reason: 'Data curation is the first line of safety.' },
  ],
  'ch10-distributed-training': [
    { slug: 'ch8-scaling-laws', relationship: 'foundation', reason: 'Distributed training is how scaling happens in practice.' },
    { slug: 'ch17-kv-caching', relationship: 'cross-phase', reason: 'Distributed inference inherits patterns from distributed training.' },
  ],

  // Part IV — Alternate Architectures
  'ch11-mixture-of-experts': [
    { slug: 'ch6-the-full-transformer', relationship: 'foundation', reason: 'MoE replaces the dense FFN in transformer blocks.' },
    { slug: 'ch12-state-space-models', relationship: 'alternative', reason: 'Both are alternatives to dense transformers.' },
    { slug: 'ch10-distributed-training', relationship: 'extension', reason: 'MoE introduces routing-induced distributed-training complexity.' },
  ],
  'ch12-state-space-models': [
    { slug: 'ch3-multi-head-attention', relationship: 'alternative', reason: 'SSMs offer a different sequence-mixing primitive than attention.' },
    { slug: 'ch11-mixture-of-experts', relationship: 'alternative', reason: 'Both are alternatives to dense transformer architectures.' },
  ],

  // Part V — Post-training
  'ch13-supervised-fine-tuning': [
    { slug: 'ch7-training-objectives', relationship: 'foundation', reason: 'SFT extends pre-training to instruction-following.' },
    { slug: 'ch14-rlhf-and-dpo', relationship: 'extension', reason: 'RLHF and DPO build on SFT.' },
    { slug: 'ch26-evaluation', relationship: 'discipline', reason: 'Evaluating SFT requires the discipline of Ch 26.' },
  ],
  'ch14-rlhf-and-dpo': [
    { slug: 'ch13-supervised-fine-tuning', relationship: 'foundation', reason: 'RLHF and DPO start from SFT models.' },
    { slug: 'ch15-constitutional-ai', relationship: 'extension', reason: 'Constitutional AI is a variant of RLHF.' },
    { slug: 'ch24-safety', relationship: 'discipline', reason: 'Alignment via RLHF is core to safety.' },
  ],
  'ch15-constitutional-ai': [
    { slug: 'ch14-rlhf-and-dpo', relationship: 'foundation', reason: 'Constitutional AI is RLAIF-flavored alignment.' },
    { slug: 'ch24-safety', relationship: 'discipline', reason: 'Constitutional methods are safety methods.' },
  ],
  'ch16-post-training-recap': [
    { slug: 'ch13-supervised-fine-tuning', relationship: 'foundation', reason: 'Recap of the post-training stack.' },
    { slug: 'ch14-rlhf-and-dpo', relationship: 'foundation', reason: 'Recap of preference learning.' },
    { slug: 'ch15-constitutional-ai', relationship: 'foundation', reason: 'Recap of constitutional methods.' },
  ],

  // Part VI — Inference
  'ch17-kv-caching': [
    { slug: 'ch3-multi-head-attention', relationship: 'foundation', reason: 'KV-caching makes multi-head attention efficient at inference.' },
    { slug: 'ch18-speculative-decoding', relationship: 'extension', reason: 'Speculative decoding builds on cached attention state.' },
    { slug: 'ch19-sampling-strategies', relationship: 'extension', reason: 'Sampling depends on efficient inference.' },
  ],
  'ch18-speculative-decoding': [
    { slug: 'ch17-kv-caching', relationship: 'foundation', reason: 'Speculative decoding uses the KV cache.' },
    { slug: 'ch19-sampling-strategies', relationship: 'extension', reason: 'Speculative decoding interacts with sampling decisions.' },
  ],
  'ch19-sampling-strategies': [
    { slug: 'ch17-kv-caching', relationship: 'foundation', reason: 'Sampling happens during cached inference.' },
    { slug: 'ch20-reasoning', relationship: 'extension', reason: 'Reasoning often uses specific sampling configurations.' },
  ],

  // Part VII — Capabilities
  'ch20-reasoning': [
    { slug: 'ch19-sampling-strategies', relationship: 'foundation', reason: 'Reasoning interacts with sampling.' },
    { slug: 'ch21-tool-use', relationship: 'extension', reason: 'Tool use composes with reasoning.' },
    { slug: 'ch27-agent-foundations', relationship: 'cross-phase', reason: 'Reasoning is a core agent primitive.' },
  ],
  'ch21-tool-use': [
    { slug: 'ch20-reasoning', relationship: 'foundation', reason: 'Tool use builds on reasoning.' },
    { slug: 'ch28-agents-from-scratch', relationship: 'cross-phase', reason: 'Tool use is foundational for agents.' },
  ],
  'ch22-retrieval-augmented-generation': [
    { slug: 'ch21-tool-use', relationship: 'foundation', reason: 'Retrieval is a form of tool use.' },
    { slug: 'ch20-reasoning', relationship: 'extension', reason: 'RAG composes with reasoning.' },
  ],
  'ch23-multimodal-models': [
    { slug: 'ch1-tokens-and-embeddings', relationship: 'foundation', reason: 'Multimodal models extend tokenization to images, audio, etc.' },
    { slug: 'ch20-reasoning', relationship: 'extension', reason: 'Multimodal reasoning combines vision and language.' },
  ],

  // Part VIII — Discipline
  'ch24-safety': [
    { slug: 'ch14-rlhf-and-dpo', relationship: 'foundation', reason: 'Alignment is the technical basis of safety.' },
    { slug: 'ch15-constitutional-ai', relationship: 'foundation', reason: 'Constitutional methods are safety methods.' },
    { slug: 'ch25-interpretability', relationship: 'discipline', reason: 'Interpretability and safety are mutually-reinforcing disciplines.' },
    { slug: 'ch30-agent-eval-and-frameworks', relationship: 'cross-phase', reason: 'Agent safety extends Ch 24 to agent systems.' },
  ],
  'ch25-interpretability': [
    { slug: 'ch24-safety', relationship: 'discipline', reason: 'Interpretability serves safety.' },
    { slug: 'ch26-evaluation', relationship: 'discipline', reason: 'Both are disciplines for understanding model behavior.' },
    { slug: 'ch28-agents-from-scratch', relationship: 'cross-phase', reason: 'Agent observability extends interpretability.' },
  ],
  'ch26-evaluation': [
    { slug: 'ch24-safety', relationship: 'discipline', reason: 'Safety evaluation extends evaluation discipline.' },
    { slug: 'ch25-interpretability', relationship: 'discipline', reason: 'Interpretability is a complementary discipline.' },
    { slug: 'ch30-agent-eval-and-frameworks', relationship: 'cross-phase', reason: 'Ch 30 extends Ch 26\'s discipline to agent systems.' },
  ],

  // Part IX — Agents
  'ch27-agent-foundations': [
    { slug: 'ch20-reasoning', relationship: 'foundation', reason: 'Reasoning is the agent\'s think step.' },
    { slug: 'ch21-tool-use', relationship: 'foundation', reason: 'Tool use is the agent\'s act step.' },
    { slug: 'ch28-agents-from-scratch', relationship: 'extension', reason: 'Engineering builds on these foundations.' },
    { slug: 'ch29-multi-agent', relationship: 'extension', reason: 'Multi-agent composes single-agent loops.' },
  ],
  'ch28-agents-from-scratch': [
    { slug: 'ch27-agent-foundations', relationship: 'foundation', reason: 'Engineering builds on the conceptual loop.' },
    { slug: 'ch21-tool-use', relationship: 'foundation', reason: 'Tool design is the chapter\'s 80%.' },
    { slug: 'ch25-interpretability', relationship: 'cross-phase', reason: 'Observability extends interpretability.' },
    { slug: 'ch30-agent-eval-and-frameworks', relationship: 'extension', reason: 'Evaluating these agents is Ch 30.' },
  ],
  'ch29-multi-agent': [
    { slug: 'ch27-agent-foundations', relationship: 'foundation', reason: 'Multi-agent composes single-agent loops.' },
    { slug: 'ch28-agents-from-scratch', relationship: 'foundation', reason: 'Multi-agent engineering builds on single-agent engineering.' },
    { slug: 'ch30-agent-eval-and-frameworks', relationship: 'extension', reason: 'Evaluating multi-agent is harder than evaluating single-agent.' },
  ],
  'ch30-agent-eval-and-frameworks': [
    { slug: 'ch26-evaluation', relationship: 'foundation', reason: 'Agent eval extends Ch 26\'s discipline to agent systems.' },
    { slug: 'ch27-agent-foundations', relationship: 'callback', reason: 'Phase 15 retrospective; section 8.' },
    { slug: 'ch28-agents-from-scratch', relationship: 'callback', reason: 'Observability extends Ch 28\'s trace inspector.' },
    { slug: 'ch29-multi-agent', relationship: 'callback', reason: 'Multi-agent evaluation is harder.' },
    { slug: 'ch24-safety', relationship: 'discipline', reason: 'Agent safety extends Ch 24.' },
  ],
};

/** Relationship label for display. */
export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  'foundation':  'builds on',
  'extension':   'extends to',
  'discipline':  'paired discipline',
  'alternative': 'alternative approach',
  'callback':    'callback reference',
  'cross-phase': 'cross-phase link',
};

/** Relationship color for the related-chapter card border. */
export const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  'foundation':  'var(--cyan-400)',
  'extension':   'var(--emerald-400)',
  'discipline':  'var(--violet-400)',
  'alternative': 'var(--amber-400)',
  'callback':    'var(--rose-400)',
  'cross-phase': 'var(--text-secondary)',
};
```

### 2. `RelatedChapters.tsx`

Render a card grid showing 3-5 related chapters. Each card shows:
- The related chapter's number and title
- A relationship badge (with color)
- The one-sentence reason
- Hover-to-highlight; click to navigate

```tsx
// src/components/content/RelatedChapters.tsx

import {
  RELATED_CHAPTERS, RELATIONSHIP_LABELS, RELATIONSHIP_COLORS,
} from '../../lib/related-chapters';
import { CHAPTERS } from '../../lib/chapters';
import styles from './RelatedChapters.module.css';

interface RelatedChaptersProps {
  /** Current chapter's slug (e.g., 'ch7-training-objectives'). */
  slug: string;
}

export default function RelatedChapters({ slug }: RelatedChaptersProps) {
  const related = RELATED_CHAPTERS[slug];
  if (!related || related.length === 0) return null;

  return (
    <aside className={styles.relatedChapters} aria-label="Related chapters">
      <div className={styles.heading}>Related chapters</div>
      <div className={styles.cardGrid}>
        {related.map(r => {
          const chapter = CHAPTERS.find(c => c.slug === r.slug);
          if (!chapter || chapter.status !== 'published') return null;
          const color = RELATIONSHIP_COLORS[r.relationship];
          return (
            <a
              key={r.slug}
              href={`/${r.slug}/`}
              className={styles.card}
              style={{ borderLeftColor: color }}
            >
              <div className={styles.cardHeader}>
                <span className={styles.cardChapterNum}>Ch {chapter.num}</span>
                <span
                  className={styles.cardBadge}
                  style={{
                    background: `color-mix(in srgb, ${color} 18%, transparent)`,
                    color,
                    borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
                  }}
                >
                  {RELATIONSHIP_LABELS[r.relationship]}
                </span>
              </div>
              <div className={styles.cardTitle}>{chapter.title}</div>
              <div className={styles.cardReason}>{r.reason}</div>
            </a>
          );
        })}
      </div>
    </aside>
  );
}
```

### 3. `RelatedChapters.module.css`

```css
.relatedChapters {
  margin-top: 3rem;
  margin-bottom: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-subtle);
}

.heading {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 500;
  margin-bottom: 0.85rem;
}

.cardGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.7rem;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.7rem 0.85rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-left: 3px solid;
  border-radius: var(--radius-md);
  text-decoration: none;
  color: inherit;
  transition: background 200ms, border-color 200ms, transform 150ms;
}
.card:hover {
  background: color-mix(in srgb, var(--cyan-500) 4%, var(--bg-elevated));
  border-color: var(--border-default);
  transform: translateY(-1px);
}
.card:focus-visible {
  outline: 2px solid var(--cyan-500);
  outline-offset: 2px;
}

.cardHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}
.cardChapterNum {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 500;
}
.cardBadge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.66rem;
  padding: 0.12rem 0.45rem;
  border-radius: 999px;
  border: 1px solid;
  text-transform: lowercase;
  font-weight: 500;
}

.cardTitle {
  font-family: 'Crimson Pro', serif;
  font-size: 1rem;
  color: var(--text-primary);
  font-weight: 500;
  line-height: 1.3;
}

.cardReason {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

@media (max-width: 720px) {
  .cardGrid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .card { transition: none; }
  .card:hover { transform: none; }
}
```

### 4. `CrossRef.tsx` (inline component)

Selective inline use — when a chapter wants to drop a one-liner pointer to another chapter in prose. **Not used by this session**; shipped ready for selective polish work.

```tsx
// src/components/content/CrossRef.tsx

import { CHAPTERS } from '../../lib/chapters';
import styles from './CrossRef.module.css';

interface CrossRefProps {
  /** Target chapter slug. */
  slug: string;
  /** Optional override label (e.g., 'see also' vs 'cross-reference'). Default 'see'. */
  label?: string;
  /** Optional inline note. */
  note?: string;
}

export default function CrossRef({ slug, label = 'see', note }: CrossRefProps) {
  const chapter = CHAPTERS.find(c => c.slug === slug);
  if (!chapter) {
    console.warn(`CrossRef: chapter '${slug}' not found`);
    return null;
  }

  return (
    <a
      href={`/${slug}/`}
      className={styles.crossRef}
      title={chapter.title}
    >
      <span className={styles.crossRefLabel}>{label}</span>
      <span className={styles.crossRefChapter}>Ch {chapter.num}: {chapter.title}</span>
      {note && <span className={styles.crossRefNote}> — {note}</span>}
    </a>
  );
}
```

### 5. `CrossRef.module.css`

```css
.crossRef {
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  padding: 0.05rem 0.45rem 0.1rem 0.45rem;
  background: color-mix(in srgb, var(--cyan-500) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--cyan-500) 25%, transparent);
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--cyan-300);
  text-decoration: none;
  transition: background 150ms, border-color 150ms;
  white-space: nowrap;
}
.crossRef:hover {
  background: color-mix(in srgb, var(--cyan-500) 14%, transparent);
  border-color: color-mix(in srgb, var(--cyan-500) 50%, transparent);
}

.crossRefLabel {
  color: var(--text-tertiary);
  text-transform: uppercase;
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  font-weight: 500;
}

.crossRefChapter {
  color: var(--cyan-300);
  font-weight: 500;
}

.crossRefNote {
  color: var(--text-secondary);
  font-family: 'Inter', sans-serif;
  font-size: 0.82rem;
  font-weight: 400;
  white-space: normal;
}
```

### 6. Update `src/components/content/index.ts`

```ts
// ... earlier exports ...
export { default as CrossRef } from './CrossRef';
// RelatedChapters is NOT exported here — it's rendered by the layout, not by MDX
```

### 7. Update `src/layouts/ChapterLayout.astro`

Find the section that renders the chapter content + prev/next nav. Inject `<RelatedChapters>` between them.

```astro
---
// existing frontmatter
import RelatedChapters from '../components/content/RelatedChapters';

const { slug } = Astro.props;
// existing prev/next logic
---

<!-- existing header / eyebrow / h1 / description -->

<main class="chapter-content">
  <slot />
</main>

<!-- INSERT: related-chapters footer -->
<RelatedChapters slug={slug} client:load />

<!-- existing prev/next nav -->
<nav class="chapter-nav">
  ...
</nav>
```

The exact insertion details depend on the existing `ChapterLayout.astro` shape; the session author adjusts to match. **Render `<RelatedChapters>` AFTER `<slot />` (the chapter content) and BEFORE the prev/next nav.**

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript or build errors.
2. **Every chapter page renders a "Related chapters" footer** between its content and the prev/next nav.
3. **The footer is hidden if no related chapters are listed** (defensive — covers any chapter accidentally missing from the manifest).
4. **Related chapters with `status !== 'published'`** are filtered out (defensive — covers chapters in draft state, if any).
5. **Card grid**: 1-column on mobile (< 720px), 2-3 columns on desktop (auto-fill at 280px min).
6. **Each card**: chapter number eyebrow + relationship badge in the header; chapter title in serif; one-sentence reason in sans.
7. **Relationship colors**: foundation (cyan), extension (emerald), discipline (violet), alternative (amber), callback (rose), cross-phase (neutral).
8. **Hover effect**: subtle translateY + background tint; respects `prefers-reduced-motion`.
9. **Click navigates** to the related chapter's page.
10. **Focus-visible outline** for keyboard users.
11. **`<CrossRef>` component** is exported from `@components/content` and works in MDX (test by rendering one in a scratch MDX page during dev — DO NOT commit any MDX changes).
12. **`<CrossRef>` falls back gracefully** if `slug` doesn't match any chapter (logs warning, renders nothing).
13. **`npm run typecheck`** passes.
14. **`npm run build`** completes.
15. **Build verification**: spot-check three chapters (Ch 1, Ch 15, Ch 30) and confirm the Related-chapters footer appears with appropriate links.

---

## Out of scope

- ❌ **Do not modify any MDX file** in this session. The cross-references travel through the manifest and the layout. **Future polish sessions may insert `<CrossRef>` inline; this session does not.**
- ❌ **Do not add backlinks** (showing every chapter that references this one). The forward-only direction is enough.
- ❌ **Do not implement a "Map of the curriculum"** visualization. Out of scope for this polish slot.
- ❌ **Do not flip any chapter's status.** All 30 are already published.

---

## Wire-up

```bash
git add src/lib/related-chapters.ts src/components/content/RelatedChapters.tsx src/components/content/RelatedChapters.module.css src/components/content/CrossRef.tsx src/components/content/CrossRef.module.css src/components/content/index.ts src/layouts/ChapterLayout.astro
git commit -m "session 132 (polish 1): cross-chapter linking — Related chapters footer + CrossRef inline"
git push origin main
```

---

## Notes for the session author

**On this being the polish phase's first session**:
The curriculum's 30 chapters are specified and published. **Polish now ships final UX**: cross-chapter linking (this), search integration (next), mobile pass, accessibility audit, performance pass, social/OG meta. Notes-for-author: "**The polish phase's working principle**: layout-driven changes that touch the whole site from one place. **No per-chapter MDX edits in this session.**"

**On manifest design over per-chapter MDX edits**:
The naive approach to cross-chapter linking is to scatter `<CrossRef>` callouts throughout 30 MDX files. **This session takes the layout-driven approach instead**: one manifest, one component, one layout modification → cross-chapter linking ships to all 30 chapters. Notes-for-author: "**The manifest is the working artifact.** Adding a new connection between chapters is a one-line edit to the manifest, not an MDX edit. **Centralized maintenance for what would otherwise become 30 scattered touch points.**"

**On the 3-5 related-chapter cap per chapter being deliberate**:
More relations would dilute signal; fewer would miss key connections. **The cap forces curation.** Notes-for-author: "**Curate, don't enumerate.** Every chapter's research file has a 'Connections to other chapters' section listing 5-8 references. **The manifest distills to the highest-signal 3-5.** Reader who scans the footer should see the most-pedagogically-valuable links, not an exhaustive bibliography."

**On the 6 relationship types being semantically distinct**:
- **foundation** — current chapter builds on it (look backward)
- **extension** — related chapter extends current ideas (look forward)
- **discipline** — paired discipline at the same level (lateral)
- **alternative** — different approach to the same problem (lateral, contrastive)
- **callback** — explicit textual callback (e.g., Ch 30 § 8)
- **cross-phase** — bridges two parts of the curriculum

Notes-for-author: "**The relationship labels tell the reader what kind of connection it is.** A 'foundation' card invites going back; an 'extension' card invites going forward; a 'discipline' card invites looking sideways. **Visual differentiation via the relationship badge.**"

**On the inline `<CrossRef>` being ready but unused**:
Future polish sessions or one-off edits may want to drop inline cross-references in prose (e.g., 'For more on this, see Ch 26'). **This session ships the component but does not insert any uses.** Notes-for-author: "**Shipping the component without uses is fine.** It costs nothing to have it ready. Future selective insertions can use it without re-implementing."

**On the color palette continuity with chapter content**:
Cards use the same color vocabulary as the widgets across the curriculum: cyan (foundation, the LLM-controller / agent / proposer role), emerald (extension, success / output), violet (discipline / worker), amber (alternative / tool), rose (callback / critic / warning), neutral (cross-phase). Notes-for-author: "**The color vocabulary carries through.** Reader who has internalized cyan = foundational from chapter widgets recognizes the same meaning in the related-chapters card."

**On respecting `prefers-reduced-motion`**:
The card hover effect uses translateY; the media query disables it. Notes-for-author: "**Reduced-motion users get the same content without the bounce.** Accessibility from session 1 of the polish phase."

**On a graceful fallback for missing chapters**:
The component filters out related chapters with `status !== 'published'` and silently skips slugs that don't match a known chapter. Notes-for-author: "**Defensive coding.** A typo in the manifest doesn't break the page; the affected card just doesn't render. The `<CrossRef>` component logs a console warning but renders nothing if the slug is unknown. **Polish-phase work shouldn't introduce build failures.**"

**On the test of three spot-checked chapters in acceptance #15**:
Ch 1 (early, foundational), Ch 15 (mid-curriculum), Ch 30 (final). Notes-for-author: "**Three spot checks across the curriculum cover the common cases**: early chapters with mostly-forward links (Ch 1 → Ch 2, 4, 20); mid chapters with bidirectional links (Ch 15 → 14, 24); final chapters with retrospective links (Ch 30 → 26, 27, 28, 29, 24)."

**Pedagogical claim this session supports**:
"**The curriculum's connections are visible.** Reader at the end of Ch 7 (Training objectives) sees that Ch 13 (SFT) extends it; reader at the end of Ch 30 sees the curriculum's retrospective links to Ch 26, 27, 28, 29, 24. **Navigation between chapters becomes a first-class affordance**, not just prev/next sequential. **The 30-chapter curriculum is a graph, not just a list** — and the related-chapters footer makes that visible without overwhelming the reader."

---

## Polish phase progress after this session

- ✅ **Session 132 — Cross-chapter linking** (this)
- ⬜ Session 133 — Search integration
- ⬜ Session 134 — Mobile pass
- ⬜ Session 135 — Accessibility audit
- ⬜ Session 136 — Performance pass
- ⬜ Session 137 — Social meta and OG cards

**The polish phase will ship the curriculum to its final shape.** This session is its first step.

Build with care. **Cross-chapter linking is what turns 30 isolated pages into a connected curriculum.**

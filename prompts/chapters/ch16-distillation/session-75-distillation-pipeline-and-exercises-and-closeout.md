# Session 75 — Ch 16 distillation pipeline + exercises + closeout

> **The Chapter 16 closeout — and the session that closes Phase 11.** Three deliverables: (1) implement the **Distillation Pipeline** secondary widget — an interactive 5-stage flow (teacher → generate → filter → train → student) with click-to-explore details, showing the modern hard-distillation recipe used by R1-Distill, Phi, and Orca; (2) add an **Exercises section** with 4 problems (temperature softmax, KL divergence, full distillation loss, hard distillation pipeline simulation); (3) flip Ch 16's status from `'draft'` to `'published'`. **Closes Ch 16. Closes Phase 11.** After this session, the entire post-training arc is on production.

This is a **single-topic chapter** (4-file cadence). The secondary widget gets combined with exercises in this final session — the standard closeout pattern.

---

## Read first (in this order)

1. **`research/ch16-distillation/research.md`** — concepts 4-9 (hard vs soft distillation, student architecture, modern recipes, method selection)
2. **`prompts/chapters/ch16-distillation/session-73-page-structure.md`** — for the section-7 widget placeholder and exercise placement
3. **`prompts/chapters/ch16-distillation/session-74-temperature-scaling-widget.md`** — for the Ch 16 widget conventions
4. **`prompts/chapters/ch14-alignment/session-64-preference-pipeline-widget.md`** — for the pipeline-stages-with-details pattern (the PreferenceLearningPipeline widget is the closest precedent)
5. **`prompts/chapters/ch15-peft/session-69-parameter-budget-calculator-and-exercises-and-closeout.md`** — for the recent Phase 11 closeout pattern (secondary widget + exercises + status flip)

---

## Goal

By end of session, three things change in the repo:

1. **`DistillationPipeline` widget** is implemented and wired into section 7 of Ch 16. Replaces the existing `<WidgetFrame>` placeholder.
2. **An "Exercises" section** is inserted into `index.mdx`. Per the section structure, this goes between section 7 ("Modern recipes") and section 8 ("When to use distillation"). Four exercises with hints + runnable starter code.
3. **Ch 16's status flips from `'draft'` to `'published'`** in `src/lib/chapters.ts`. **Ch 16 is the sixteenth published chapter — and the last of Phase 11.**

After this session: **Ch 16 complete. Phase 11 complete.** Phase 12 (inference) opens next.

---

## Inputs

State of the repo after session 74:

- Section 2's `TemperatureScaling` marquee widget is wired
- Section 7's widget is still stubbed
- All 3 runnable code blocks from session 73 are in place
- `src/lib/chapters.ts` has Ch 1-15 `'published'`, Ch 16 `'draft'`
- `src/components/widgets/ch16/` exists with one widget already

---

## Deliverables

1. **Create** `src/components/widgets/ch16/DistillationPipeline.tsx` — the React widget
2. **Create** `src/components/widgets/ch16/DistillationPipeline.module.css` — scoped styles
3. **Create** `src/components/widgets/ch16/pipeline-stages-data.ts` — stage definitions
4. **Update** `src/components/widgets/index.ts` — add `DistillationPipeline` export
5. **Update** `src/pages/ch16-distillation/index.mdx`:
   - Replace section-7's `<WidgetFrame>` interior with `<DistillationPipeline client:visible />`
   - Insert new `## Exercises` section between section 7 ("Modern recipes") and section 8 ("When to use distillation")
6. **Update** `src/lib/chapters.ts` — change Ch 16's `status` from `'draft'` to `'published'`

**Do not modify** any other file. Earlier chapters and widgets are sealed. Ch 16's marquee widget is sealed.

---

## Detailed spec

### Part A — `DistillationPipeline` widget

#### A.1 `pipeline-stages-data.ts`

```ts
// src/components/widgets/ch16/pipeline-stages-data.ts

export interface PipelineStage {
  id: string;
  title: string;
  shortLabel: string;
  what: string;
  inputs: string[];
  outputs: string;
  details: string;
  realWorld: string;   // example from a real recipe (R1-Distill / Phi / Orca)
}

export const STAGES: PipelineStage[] = [
  {
    id: 'teacher',
    title: 'Teacher (frozen, capable)',
    shortLabel: 'Teacher',
    what: 'A fully-trained, capable model. The source of behavior to be distilled.',
    inputs: ['Already trained via pre-training + SFT + preference optimization (+ optional RLVR)'],
    outputs: 'A capable model that can answer queries well — but is too big/expensive to deploy at scale.',
    details: 'The teacher is the entire output of Phase 11 chapters 13-15 (and optionally Ch 14 RLVR for reasoning). For DeepSeek-R1-Distill, the teacher is DeepSeek-R1 (a frontier reasoning model). For Phi, the teacher is GPT-4-class. The teacher is frozen — never updated during distillation. Its role is purely to generate training data for the student.',
    realWorld: 'R1-Distill teacher: DeepSeek-R1 (~700B+ MoE). Phi teacher: GPT-4-class. Orca teacher: GPT-4.',
  },
  {
    id: 'prompts',
    title: 'Diverse prompt set',
    shortLabel: 'Prompts',
    what: 'A large collection of diverse queries that elicit the teacher\'s desired behaviors.',
    inputs: ['Curated query collection covering target capabilities (instruction following, reasoning, code, math, etc.)'],
    outputs: 'A list of prompts (often 100K to 10M+) to send to the teacher.',
    details: 'Prompt diversity matters more than prompt count. Cover all behaviors the student should inherit: instruction following, multi-turn dialogue, math problems, code generation, reasoning chains. Often combine: existing instruction datasets + synthetic prompt expansion + targeted-capability prompts. Quality of prompts determines what the student can learn.',
    realWorld: 'R1-Distill: 800K reasoning-heavy prompts (math, coding, science). Phi: textbook-quality educational prompts. Orca: GPT-4-generated explanation prompts.',
  },
  {
    id: 'generate',
    title: 'Teacher generates responses',
    shortLabel: 'Generate',
    what: 'Run the teacher on each prompt to produce a response.',
    inputs: ['Prompts (from previous stage)', 'Teacher (frozen)'],
    outputs: 'Raw (prompt, response) pairs — typically 1M+ examples.',
    details: 'For reasoning distillation: the teacher generates not just answers but full chain-of-thought traces. The student learns to imitate the reasoning, not just the conclusion. For preference distillation: the teacher generates multiple responses per prompt (for diversity). For instruction distillation: a single high-quality response per prompt.',
    realWorld: 'R1-Distill: R1 generates full <think>...</think> reasoning traces + final answers. Phi: GPT-4 generates textbook-quality explanations. Computational cost: significant — this stage dominates the distillation budget.',
  },
  {
    id: 'filter',
    title: 'Filter for quality',
    shortLabel: 'Filter',
    what: 'Score and filter the teacher\'s outputs; reject low-quality examples.',
    inputs: ['Raw teacher outputs', 'Quality criteria (verifier, scoring model, or rubric)'],
    outputs: 'Filtered high-quality (prompt, response) pairs — typically 30-70% of raw outputs survive.',
    details: 'Quality filtering is critical — the student inherits whatever quality level survives this stage. Common criteria: correctness verification (for math/code with verifiable rewards), length filters (reject pathological short/long), self-consistency (teacher gives the same answer when re-sampled), heuristic rubrics (formatting, completeness, no refusals). Modern recipes lean heavily on rejection sampling: generate many candidates per prompt, keep only the best.',
    realWorld: 'R1-Distill: rule-based correctness verification on math + code; rejection sampling for general reasoning. Phi: quality classification + manual review. Orca: GPT-4 self-grading.',
  },
  {
    id: 'train',
    title: 'Student SFT',
    shortLabel: 'Train',
    what: 'Train the student model via standard SFT on the filtered data.',
    inputs: ['Filtered (prompt, response) pairs', 'Student model architecture (smaller than teacher)'],
    outputs: 'A trained student that has learned to imitate the teacher\'s behaviors.',
    details: 'This stage is exactly Ch 13\'s SFT training loop — no special "distillation loss" needed. Token-level cross-entropy on the response tokens; mask the loss on prompt tokens. Standard learning rate, standard optimizer, standard training. The "distillation" is implicit: the data source is the teacher, not humans. Run for several epochs; the smaller student fits the data well.',
    realWorld: 'R1-Distill: SFT on student architectures from 1.5B to 32B. Phi: training from scratch on filtered synthetic data. Orca: SFT on top of Llama-class base models. Training compute much smaller than the teacher\'s original training.',
  },
  {
    id: 'student',
    title: 'Student (deployable)',
    shortLabel: 'Student',
    what: 'The compressed result: small enough to serve cheaply, capable enough to be useful.',
    inputs: ['Trained student from the SFT stage'],
    outputs: 'A model ready for production deployment — possibly followed by further PEFT for task specialization.',
    details: 'The student inherits most of the teacher\'s capabilities at a fraction of the cost. For R1-Distill-Qwen-32B: matches o1-mini on math and coding despite being far smaller than R1. For Phi-3-mini (3.8B): approaches GPT-3.5 on many benchmarks. For DistilBERT: 97% of BERT\'s GLUE score at 40% the size. The deployment cost difference is typically 5-20× cheaper per request.',
    realWorld: 'R1-Distill-Qwen-32B: matches o1-mini on math/code; 32B params vs R1\'s 671B. Phi-3-mini: 3.8B, deploys on consumer hardware. Gemma 2 9B: matches Llama 2 70B on benchmarks at 8× smaller.',
  },
];
```

#### A.2 Visual layout

```
ViewBox: 0 0 800 760

┌────────────────────────────────────────────────────────────────┐
│ Hard distillation pipeline (the modern recipe)                   │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │                                                                ││
│ │   ┌──────────┐    ┌──────────┐    ┌──────────┐               ││
│ │   │ Teacher  │ →  │ Prompts  │ →  │ Generate │ →             ││
│ │   │ (frozen) │    │  diverse │    │  teacher │               ││
│ │   │ ~700B    │    │   query  │    │  outputs │               ││
│ │   └──────────┘    │   set    │    └──────────┘               ││
│ │                   └──────────┘                                ││
│ │                                                                ││
│ │                       ┌──────────┐    ┌──────────┐           ││
│ │                  → →  │ Filter   │ →  │  Train   │ →         ││
│ │                       │ rejection│    │  student │           ││
│ │                       │ sampling │    │ via SFT  │           ││
│ │                       └──────────┘    └──────────┘           ││
│ │                                                                ││
│ │                                            ┌──────────┐      ││
│ │                                       →    │ Student  │      ││
│ │                                            │ ~32B     │      ││
│ │                                            │deployable│      ││
│ │                                            └──────────┘      ││
│ │                                                                ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ Click any stage for details ↑                                    │
│                                                                  │
│ Selected stage details:                                           │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ Teacher (frozen, capable)                                      ││
│ │                                                                ││
│ │ What: A fully-trained, capable model...                        ││
│ │ Inputs: Already trained via pre-training + SFT + preference   ││
│ │   optimization (+ optional RLVR)                              ││
│ │ Outputs: A capable model that can answer queries well...       ││
│ │                                                                ││
│ │ The teacher is the entire output of Phase 11 chapters 13-15...││
│ │                                                                ││
│ │ Real-world examples: R1-Distill teacher: DeepSeek-R1 (~700B+) ││
│ │   Phi teacher: GPT-4-class. Orca teacher: GPT-4.              ││
│ └──────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click any stage box → details panel below updates with that stage's info
- Default selection: "Teacher" (the starting stage)
- Each stage box is color-coded:
  - **Teacher**: rose (warm — the source)
  - **Prompts, Generate, Filter, Train**: amber → emerald (intermediate stages, getting cooler/closer to the goal)
  - **Student**: cyan (the goal — the project's signature color)
- Arrows between stages show direction
- Hover any stage → subtle border lift
- Selected stage has visible selection ring

#### A.3 `DistillationPipeline.tsx`

```tsx
import { useState } from 'react';
import { STAGES, type PipelineStage } from './pipeline-stages-data';
import styles from './DistillationPipeline.module.css';

export default function DistillationPipeline() {
  const [selectedId, setSelectedId] = useState<string>(STAGES[0]!.id);
  const selected = STAGES.find(s => s.id === selectedId) ?? STAGES[0]!;

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Hard distillation pipeline (the modern recipe)</div>
        <div className={styles.titleSubLabel}>
          The end-to-end flow used by R1-Distill, Phi, and Orca.
        </div>
      </div>

      {/* Pipeline diagram */}
      <div className={styles.pipelinePanel}>
        <PipelineSvg
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <div className={styles.pipelineNote}>
          Click any stage for details ↑
        </div>
      </div>

      {/* Selected stage details */}
      <div className={styles.detailsPanel}>
        <div className={styles.detailsTitleRow}>
          <span className={styles.detailsBadge}>STAGE</span>
          <span className={styles.detailsTitle}>{selected.title}</span>
        </div>
        <div className={styles.detailsBody}>
          <DetailRow label="What" value={selected.what} />
          <DetailRow label="Inputs" value={selected.inputs.join('; ')} />
          <DetailRow label="Outputs" value={selected.outputs} />
          <div className={styles.detailsParagraph}>{selected.details}</div>
          <div className={styles.realWorldRow}>
            <span className={styles.realWorldLabel}>Real-world examples:</span>
            <span className={styles.realWorldText}>{selected.realWorld}</span>
          </div>
        </div>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        This pipeline is what powers modern distillation. The teacher is expensive to train but generates
        data only once. The student inherits behavior via <strong>standard SFT on teacher outputs</strong> —
        no soft labels, no KL divergence, no special loss. The "distillation" is in the <strong>data source</strong>,
        not the training algorithm. R1-Distill, Phi, Orca — all use this recipe.
      </div>
    </div>
  );
}

interface PipelineSvgProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

function PipelineSvg({ selectedId, onSelect }: PipelineSvgProps) {
  const WIDTH = 740;
  const HEIGHT = 350;

  // Lay stages out in a 2-row "S" pattern: top row left-to-right, bottom row left-to-right
  const positions: Record<string, { x: number; y: number; tier: string }> = {
    teacher:  { x:  60, y:  60, tier: 'source' },
    prompts:  { x: 240, y:  60, tier: 'intermediate' },
    generate: { x: 420, y:  60, tier: 'intermediate' },
    filter:   { x: 240, y: 220, tier: 'intermediate' },
    train:    { x: 420, y: 220, tier: 'intermediate' },
    student:  { x: 600, y: 220, tier: 'goal' },
  };
  const boxW = 120;
  const boxH = 80;

  // Arrows: teacher→prompts→generate→filter→train→student
  // generate→filter wraps from top-right to bottom-left
  const arrows: { from: string; to: string; wrap?: boolean }[] = [
    { from: 'teacher',  to: 'prompts' },
    { from: 'prompts',  to: 'generate' },
    { from: 'generate', to: 'filter',  wrap: true },
    { from: 'filter',   to: 'train' },
    { from: 'train',    to: 'student' },
  ];

  function center(id: string) {
    const p = positions[id]!;
    return { x: p.x + boxW / 2, y: p.y + boxH / 2 };
  }

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.svg} role="img" aria-label="Distillation pipeline">
      <defs>
        <marker id="arrow-head" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-secondary)" />
        </marker>
      </defs>

      {/* Arrows */}
      {arrows.map(({ from, to, wrap }, i) => {
        const f = center(from);
        const t = center(to);
        if (wrap) {
          // The wrap arrow goes from generate (top-right) down + leftward to filter (bottom-left)
          // Use a curved path
          const path = `M ${positions[from]!.x + boxW / 2} ${positions[from]!.y + boxH} ` +
                       `C ${positions[from]!.x + boxW / 2} ${(f.y + t.y) / 2 + 20}, ` +
                       `${positions[to]!.x + boxW / 2} ${(f.y + t.y) / 2 - 20}, ` +
                       `${positions[to]!.x + boxW / 2} ${positions[to]!.y}`;
          return (
            <path
              key={`arrow-${i}`}
              d={path}
              fill="none"
              className={styles.arrow}
              markerEnd="url(#arrow-head)"
            />
          );
        }
        // Straight arrow
        const startX = positions[from]!.x + boxW;
        const endX = positions[to]!.x;
        return (
          <line
            key={`arrow-${i}`}
            x1={startX} y1={f.y}
            x2={endX} y2={t.y}
            className={styles.arrow}
            markerEnd="url(#arrow-head)"
          />
        );
      })}

      {/* Stage boxes */}
      {STAGES.map(s => {
        const p = positions[s.id]!;
        const isSelected = selectedId === s.id;
        const tierClass = styles[`tier_${p.tier}`];
        return (
          <g
            key={s.id}
            onClick={() => onSelect(s.id)}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x={p.x} y={p.y}
              width={boxW} height={boxH}
              className={`${styles.stageBox} ${tierClass} ${isSelected ? styles.stageBoxSelected : ''}`}
              rx={4}
            />
            <text
              x={p.x + boxW / 2}
              y={p.y + boxH / 2 - 6}
              className={styles.stageLabel}
              textAnchor="middle"
            >
              {s.shortLabel}
            </text>
            <text
              x={p.x + boxW / 2}
              y={p.y + boxH / 2 + 10}
              className={styles.stageSubLabel}
              textAnchor="middle"
            >
              {s.id === 'teacher' && '~700B'}
              {s.id === 'prompts' && 'diverse'}
              {s.id === 'generate' && 'long traces'}
              {s.id === 'filter' && 'rejection'}
              {s.id === 'train' && 'standard SFT'}
              {s.id === 'student' && 'deployable'}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}:</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  );
}
```

#### A.4 `DistillationPipeline.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.titlePanel {
  padding: 0.7rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 0.85rem;
}
.titleLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.86rem;
  color: var(--text-primary);
  font-weight: 500;
}
.titleSubLabel {
  font-size: 0.76rem;
  color: var(--text-tertiary);
  margin-top: 0.2rem;
}

.pipelinePanel {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 0.85rem;
}
.svg { width: 100%; height: auto; }
.pipelineNote {
  margin-top: 0.5rem;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  font-style: italic;
}

/* Stage boxes */
.stageBox {
  fill: var(--bg-primary);
  stroke: var(--border-default);
  stroke-width: 1.5;
  transition: all 200ms;
}
.tier_source { stroke: color-mix(in srgb, var(--rose-400) 40%, var(--border-default)); }
.tier_intermediate { stroke: color-mix(in srgb, var(--amber-400) 30%, var(--border-default)); }
.tier_goal { stroke: color-mix(in srgb, var(--cyan-500) 60%, var(--border-default)); }

.stageBox:hover { stroke-width: 2; }
.stageBoxSelected {
  stroke-width: 2.5;
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--cyan-500) 60%, transparent));
}
.tier_source.stageBoxSelected      { stroke: var(--rose-400); }
.tier_intermediate.stageBoxSelected { stroke: var(--amber-400); }
.tier_goal.stageBoxSelected         { stroke: var(--cyan-500); fill: color-mix(in srgb, var(--cyan-500) 8%, var(--bg-primary)); }

.stageLabel {
  fill: var(--text-primary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 500;
}
.stageSubLabel {
  fill: var(--text-tertiary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-style: italic;
}

.arrow {
  stroke: var(--text-secondary);
  stroke-width: 1.5;
  fill: none;
}

/* Details panel */
.detailsPanel {
  padding: 0.85rem 1rem;
  background: color-mix(in srgb, var(--cyan-500) 4%, var(--bg-elevated));
  border: 1px solid var(--cyan-500);
  border-radius: var(--radius-md);
  margin-bottom: 0.85rem;
}
.detailsTitleRow {
  display: flex;
  gap: 0.6rem;
  align-items: baseline;
  margin-bottom: 0.6rem;
}
.detailsBadge {
  padding: 0.15rem 0.45rem;
  background: var(--cyan-500);
  color: var(--bg-primary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  font-weight: 500;
  border-radius: 3px;
  letter-spacing: 0.06em;
}
.detailsTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.92rem;
  color: var(--cyan-300);
  font-weight: 500;
}
.detailsBody { display: flex; flex-direction: column; gap: 0.3rem; }
.detailRow {
  display: flex;
  gap: 0.55rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
}
.detailLabel {
  color: var(--text-tertiary);
  min-width: 60px;
}
.detailValue { color: var(--text-primary); flex: 1; line-height: 1.5; }

.detailsParagraph {
  margin-top: 0.6rem;
  padding-top: 0.5rem;
  border-top: 1px solid color-mix(in srgb, var(--cyan-500) 25%, transparent);
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.55;
}

.realWorldRow {
  margin-top: 0.55rem;
  padding-top: 0.45rem;
  border-top: 1px solid color-mix(in srgb, var(--cyan-500) 25%, transparent);
}
.realWorldLabel {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.2rem;
}
.realWorldText {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.76rem;
  color: var(--emerald-400);
  line-height: 1.5;
}

.caption {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.55;
}
.caption strong { color: var(--cyan-300); font-weight: 500; }
```

#### A.5 Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as TemperatureScaling } from './ch16/TemperatureScaling';
export { default as DistillationPipeline } from './ch16/DistillationPipeline';
```

#### A.6 Update `src/pages/ch16-distillation/index.mdx`

**Edit A: Add widget import:**

```mdx
import { TemperatureScaling, DistillationPipeline } from '@components/widgets';
```

**Edit B: Replace section-7's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Distillation pipeline" caption="The end-to-end hard-distillation pipeline used by R1-Distill, Phi, and Orca. Teacher → diverse prompts → teacher generates responses → filter for quality → student SFT → deployable student. Click any stage for details on what happens, what's needed, and real-world examples. No soft labels; no KL divergence; just standard SFT on teacher-generated data.">
  <DistillationPipeline client:visible />
</WidgetFrame>
```

### Part B — Exercises section

Insert between section 7 ("Modern recipes") and section 8 ("When to use distillation"). Use this structure:

````mdx
## Exercises

Four exercises that lock in the chapter's machinery. Each is a self-contained problem with a starting template; hints are collapsed by default — try the problem first.

### Exercise 1 (easy) — Temperature softmax

Implement the temperature-scaled softmax and verify the qualitative behavior: at $T = 1$, the distribution is peaked; at $T = \infty$, it's uniform.

<details>
<summary>Hint</summary>

The temperature-scaled softmax is:
$$p_i = \frac{\exp(z_i / T)}{\sum_j \exp(z_j / T)}$$

Numerical stability tip: subtract `logits.max()` from logits before exponentiating.

For verification:
- At $T = 1$: largest logit should get most of the probability mass
- At $T \to \infty$: distribution approaches uniform (1/n for each of n classes)
- At $T = 0^+$: distribution approaches a one-hot at the max logit (winner-take-all)

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def softmax_with_temperature(logits, T=1.0):
    """
    Compute the temperature-scaled softmax of logits.
    Numerical stability: subtract the max logit before exponentiating.
    """
    # TODO: implement
    pass

# Test on a peaked distribution
logits = np.array([4.0, 1.2, 0.8, 0.5, 0.3, 0.1, -0.5, -1.0, -1.5, -2.0])

# TODO: compute probs at T=1, T=4, T=16
# probs_t1 = softmax_with_temperature(logits, T=1)
# probs_t4 = softmax_with_temperature(logits, T=4)
# probs_t16 = softmax_with_temperature(logits, T=16)

# Verify:
# 1. At T=1, the top class should dominate (~0.9+)
# 2. At T=4, top class should still win but less dominantly
# 3. At T=16, distribution should be much more uniform
# 4. Each distribution should sum to 1.0

# print(f"At T=1:  top prob = {probs_t1.max():.3f}, sum = {probs_t1.sum():.3f}")
# print(f"At T=4:  top prob = {probs_t4.max():.3f}, sum = {probs_t4.sum():.3f}")
# print(f"At T=16: top prob = {probs_t16.max():.3f}, sum = {probs_t16.sum():.3f}")
# print(f"\\nObservation: as T grows, the top probability shrinks toward 1/10 = 0.1 (uniform).")
`}
  packages={["numpy"]}
/>

### Exercise 2 (medium) — KL divergence

Implement KL divergence between two probability distributions and verify its properties:
- $\text{KL}(p \| p) = 0$ (identical distributions)
- $\text{KL}(p \| q) \geq 0$ (always non-negative)
- $\text{KL}(p \| q) \neq \text{KL}(q \| p)$ in general (asymmetric)

<details>
<summary>Hint</summary>

The KL divergence:
$$\text{KL}(p \,\|\, q) = \sum_i p_i \log \frac{p_i}{q_i}$$

Or equivalently: $\sum_i p_i (\log p_i - \log q_i)$

Numerical stability: add a small epsilon (1e-9) inside the logarithms to avoid $\log 0$.

To verify asymmetry: take $p = [0.5, 0.5]$ and $q = [0.9, 0.1]$. Then:
- $\text{KL}(p \| q)$ is one value
- $\text{KL}(q \| p)$ is a different value

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def kl_divergence(p, q, eps=1e-9):
    """
    KL divergence KL(p || q) along the last axis.
    p, q: probability distributions (each row sums to 1)
    """
    # TODO: implement KL(p || q) with numerical stability
    pass

# Test
p = np.array([0.5, 0.3, 0.2])
q = np.array([0.4, 0.4, 0.2])

# Property 1: KL(p || p) = 0
# kl_pp = kl_divergence(p, p)
# print(f"KL(p || p) = {kl_pp:.6f} (should be ~0)")

# Property 2: KL(p || q) > 0 for p != q
# kl_pq = kl_divergence(p, q)
# kl_qp = kl_divergence(q, p)
# print(f"KL(p || q) = {kl_pq:.6f}")
# print(f"KL(q || p) = {kl_qp:.6f}")

# Property 3: asymmetric
# print(f"\\nAsymmetric: KL(p || q) != KL(q || p): {abs(kl_pq - kl_qp) > 1e-6}")

# In distillation, we use KL(teacher || student) — minimize the student's KL FROM the teacher.
# This means: we want student to match teacher's distribution shape, even on rare classes.
`}
  packages={["numpy"]}
/>

### Exercise 3 (medium) — Full distillation loss

Implement the full Hinton distillation loss: $(1-\alpha) L_{\text{hard}} + \alpha T^2 L_{\text{soft}}$. Verify that the $T^2$ multiplier is necessary — without it, the soft loss becomes negligible at high $T$.

<details>
<summary>Hint</summary>

The full loss has two parts:

**Soft loss** (with $T^2$ multiplier):
$$L_{\text{soft}} = T^2 \cdot \text{KL}(\sigma(z_T / T) \,\|\, \sigma(z_S / T))$$

**Hard loss** (standard cross-entropy with true labels):
$$L_{\text{hard}} = -\sum_i \mathbb{1}[i = y] \log \sigma(z_S)_i$$

**Combined**:
$$L = (1 - \alpha) L_{\text{hard}} + \alpha L_{\text{soft}}$$

For the verification:
- Compute $L_{\text{soft}}$ with the $T^2$ multiplier at $T = 1, 4, 16$
- Compute $L_{\text{soft}}$ *without* the $T^2$ multiplier at the same $T$ values
- Observe: at high $T$, the no-$T^2$ version shrinks to nearly zero; the with-$T^2$ version stays meaningful

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def softmax_with_temperature(logits, T=1.0):
    logits = logits / T
    logits = logits - logits.max(axis=-1, keepdims=True)
    exp = np.exp(logits)
    return exp / exp.sum(axis=-1, keepdims=True)

def kl_divergence(p, q, eps=1e-9):
    return (p * (np.log(p + eps) - np.log(q + eps))).sum(axis=-1)

def distillation_loss(student_logits, teacher_logits, true_labels, T=4.0, alpha=0.7, use_T2=True):
    """
    Full Hinton distillation loss.
    
    use_T2: if True, multiply soft loss by T^2. If False, omit the multiplier (to demonstrate why it matters).
    """
    # Soft loss
    p_teacher = softmax_with_temperature(teacher_logits, T)
    p_student = softmax_with_temperature(student_logits, T)
    L_soft_raw = kl_divergence(p_teacher, p_student).mean()
    L_soft = (T ** 2) * L_soft_raw if use_T2 else L_soft_raw
    
    # Hard loss
    p_student_raw = softmax_with_temperature(student_logits, T=1.0)
    one_hot = np.eye(p_student_raw.shape[-1])[true_labels]
    L_hard = -(one_hot * np.log(p_student_raw + 1e-9)).sum(axis=-1).mean()
    
    return (1 - alpha) * L_hard + alpha * L_soft, L_hard, L_soft

# Setup
np.random.seed(0)
batch, classes = 8, 10
teacher_logits = np.random.normal(0, 2, (batch, classes))
true_labels = np.random.randint(0, classes, batch)
for i, c in enumerate(true_labels):
    teacher_logits[i, c] += 5

student_logits = np.random.normal(0, 1, (batch, classes))

# TODO: compute losses at T=1, 4, 16 with and without T^2
# Show that without T^2, the soft loss becomes very small at high T

# print(f"{'T':>4} | {'L_soft (w/ T^2)':>17} | {'L_soft (no T^2)':>16}")
# print("-" * 50)
# for T in [1, 4, 16]:
#     _, _, soft_with = distillation_loss(student_logits, teacher_logits, true_labels, T=T, alpha=0.7, use_T2=True)
#     _, _, soft_without = distillation_loss(student_logits, teacher_logits, true_labels, T=T, alpha=0.7, use_T2=False)
#     print(f"T={T:>3} | {soft_with:>17.4f} | {soft_without:>16.4f}")
# 
# print("\\nWithout T^2, the soft loss shrinks dramatically at high T.")
# print("The T^2 multiplier keeps the gradient magnitudes comparable to the hard loss.")
# print("Don't forget the T^2 — it's not a heuristic, it's mathematical necessity.")
`}
  packages={["numpy"]}
/>

### Exercise 4 (hard) — Hard distillation pipeline simulation

Simulate the modern hard-distillation pipeline used by R1-Distill, Phi, and Orca. Generate teacher outputs on a prompt set; filter for quality; "train" the student on the filtered data; evaluate.

<details>
<summary>Hint</summary>

Pseudo-pipeline:

1. **Prompts**: a list of diverse queries (e.g., 100 prompts covering math, code, instruction following).
2. **Generate**: for each prompt, the teacher produces a response. (In real life: an LLM call. Here: a mock function.)
3. **Filter**: score each (prompt, response) pair. Drop low-quality.
4. **Train**: "train" the student on the filtered data. (In real life: SFT. Here: just count the filtered examples.)
5. **Evaluate**: report stats — how many prompts, how many filtered examples, what survival rate.

The point of this exercise is to internalize that **hard distillation is just SFT with teacher-generated data**. The "distillation" is in the data source, not the training algorithm.

</details>

<RunnableCode
  client:visible
  defaultCode={`import random
import numpy as np

random.seed(42)
np.random.seed(42)

# Mock teacher: returns a response of varying quality based on a simulated "skill" parameter
def mock_teacher_generate(prompt, skill=0.85):
    """Pseudo: in production, this is a real teacher LLM call."""
    # Simulate generating a response of variable quality
    quality = np.random.beta(skill * 10, (1 - skill) * 10)
    length = random.randint(20, 200)
    return {"text": f"[teacher response to: {prompt[:30]}] ({length} chars)", "quality": quality}

def filter_response(response, threshold=0.5):
    """
    Filter teacher outputs for quality.
    
    In production:
    - Use a reward model to score
    - Use rule-based correctness checks (math, code)
    - Reject too-short or too-long responses
    - Self-consistency checks
    
    Here: simple threshold on the simulated quality.
    """
    # TODO: return True if response passes, False otherwise
    pass

# Step 1: Define a diverse prompt set
prompts = [
    "Solve: 2x + 5 = 17",
    "Explain photosynthesis in 3 sentences.",
    "Write a Python function that reverses a string.",
    "What's the capital of Japan?",
    "Prove that the sum of two even numbers is even.",
    "Describe the water cycle.",
    "Write a haiku about autumn.",
    "What causes earthquakes?",
] * 20   # 160 total prompts

# Step 2-3: Generate teacher outputs and filter
synthetic_data = []
total_generated = 0
filtered_count = 0

# TODO: for each prompt:
#   - Generate teacher response
#   - Filter for quality
#   - Add to synthetic_data if passes filter

# for prompt in prompts:
#     response = mock_teacher_generate(prompt)
#     total_generated += 1
#     if filter_response(response, threshold=0.5):
#         filtered_count += 1
#         synthetic_data.append({"prompt": prompt, "response": response["text"]})

# Step 4: "Train" the student (mock — would be Ch 13's SFT loop in production)
# Just count examples
# student_training_examples = len(synthetic_data)

# Step 5: Report stats
# print(f"Pipeline stats:")
# print(f"  Prompts in set:         {len(prompts)}")
# print(f"  Teacher responses:      {total_generated}")
# print(f"  Filtered (kept):        {filtered_count} ({100*filtered_count/total_generated:.0f}%)")
# print(f"  Student training data:  {student_training_examples} examples")
# 
# print(f"\\nIn production: train student via SFT (Ch 13's machinery) on the filtered data.")
# print(f"No soft labels. No KL divergence. Just SFT on teacher-generated data.")
# print(f"This is the recipe used by R1-Distill, Phi, and Orca.")
`}
  packages={["numpy"]}
/>

````

### Part C — Flip Ch 16's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 16, slug: 'ch16-distillation', title: 'Distillation', partNum: 5, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript or MDX errors.
2. **Sections 1-7** of Ch 16 still render correctly (no changes to existing sections).
3. **Section 2's** `TemperatureScaling` marquee widget still renders correctly.
4. **Section 7** now renders the working `DistillationPipeline` widget.
5. **Default state (pipeline)**: "Teacher" stage selected; details panel shows teacher description. Diagram shows 6 stage boxes arranged in 2-row "S" pattern with arrows.
6. **Stage boxes**:
   - **Teacher**: rose border
   - **Prompts, Generate, Filter, Train**: amber border (intermediate)
   - **Student**: cyan border + cyan glow when selected
7. **Click any stage** → details panel updates with that stage's full info (what, inputs, outputs, details paragraph, real-world examples).
8. **Hover any stage** → border thickens.
9. **Selected stage** has visible selection indicator (thicker border, drop shadow).
10. **Wrap arrow** from "Generate" (top row) curves down to "Filter" (bottom row).
11. **New "## Exercises" section** is between section 7 ("Modern recipes") and section 8 ("When to use distillation"). Contains 4 sub-exercises with collapsible hints and runnable starter code.
12. **Section 8** ("When to use distillation") still renders correctly after the insert.
13. **Sidebar:** Ch 1-16 all active (published); Ch 17-30 still dimmed.
14. **Prev/next at bottom of Ch 16:** prev = Ch 15 (active); next = Ch 17 (disabled).
15. **TOC on Ch 16** includes Exercises as h2 between section 7 and section 8, plus 4 h3 sub-entries.
16. **Exercise starter code** runs (placeholders return `pass`; reader can fill in).
17. **Mobile:** SVG scales; details panel readable.
18. **`npm run typecheck`** passes.
19. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not provide exercise solutions.** Hints only.
- ❌ **Do not flip any other chapter's status.** Only Ch 16 flips.
- ❌ **Do not modify Ch 1-15.** Sealed.
- ❌ **Do not modify Ch 16's marquee widget.** Sealed.
- ❌ **Do not modify Ch 16 prose sections 1-8.** Sealed. (Only insert the new Exercises section between sections 7 and 8.)
- ❌ **Do not implement soft-label distillation in the pipeline widget.** Hard distillation only — that's the modern recipe.

---

## Wire-up

```bash
git add src/components/widgets/ch16/DistillationPipeline.tsx src/components/widgets/ch16/DistillationPipeline.module.css src/components/widgets/ch16/pipeline-stages-data.ts src/components/widgets/index.ts src/pages/ch16-distillation/index.mdx src/lib/chapters.ts
git commit -m "session 75: Ch 16 closeout — distillation pipeline + exercises + status: published. Phase 11 COMPLETE."
git push origin main
```

---

## Ch 16 closeout — Phase 11 complete

Chapter 16 is now the sixteenth complete chapter on production. **Phase 11 (Post-training) is now complete.** All four chapters published:

- ✅ Ch 13 (Supervised Fine-Tuning)
- ✅ Ch 14 (Preference Optimization: RLHF, DPO, RLVR)
- ✅ Ch 15 (Parameter-Efficient Fine-Tuning)
- ✅ Ch 16 (Distillation)

**Phase 11 took 4 chapters × ~4-5 files each = ~17 files**. The full post-training arc is on production.

Confirm before declaring Ch 16 and Phase 11 done:

- ✅ BUILD_ORDER.md shows files 93-96 ✅
- ✅ File 97 marked ⏭️ (absorbed; would have been a separate exercise file in 5-file cadence; absorbed into closeout for 4-file cadence)
- ✅ Ch 16 status is `'published'`
- ✅ Both Ch 16 widgets work in production
- ✅ All 4 Ch 16 exercises render with their starter code

**Cadence check across 16 chapters:**

| Chapter | Topic shape | Widgets | Files |
|---|---|---|---|
| Ch 1 | Math + code-heavy | 3 | 5 |
| Ch 2 | Concept-heavy | 2 | 4 |
| Ch 3 | Algorithm-heavy | 2 | 4 |
| Ch 4 | Math + visual | 2 | 4 |
| Ch 5 | Two-topic | 2 | 5 |
| Ch 6 | Variants | 2 | 4 |
| Ch 7 | Data engineering | 2 | 4 |
| Ch 8 | Two-topic | 2 | 5 |
| Ch 9 | Two-topic | 2 | 5 |
| Ch 10 | Engineering | 2 | 4 |
| Ch 11 | Architectural variant | 2 | 4 |
| Ch 12 | Architectural variant | 2 | 4 |
| Ch 13 | Practical engineering | 2 | 4 |
| Ch 14 | Two-topic (RLHF + DPO/RLVR) | 2 | 5 |
| Ch 15 | Practical engineering | 2 | 4 |
| Ch 16 | Practical engineering | 2 | 4 |

**4-file cadence holds for 11 single-topic chapters** (Ch 2, 3, 4, 6, 7, 10, 11, 12, 13, 15, **16**).
**5-file cadence holds for 5 two-topic chapters** (Ch 1, 5, 8, 9, 14).

**16-chapter pattern stable across the entire first half.**

**Phase 11 (Post-training) summary:**

The full post-training arc on production. Reader now understands:
1. **SFT (Ch 13)**: teaching the model *format* — chat templates, masked loss, response-only training
2. **Preference optimization (Ch 14)**: teaching the model *quality* — RLHF, DPO derivation, RLVR for reasoning
3. **PEFT (Ch 15)**: making it *affordable* — LoRA, QLoRA, fitting 70B fine-tuning on a single GPU
4. **Distillation (Ch 16)**: making it *deployable* — Hinton's soft labels, the modern hard-distillation recipe, R1-Distill

**The full pipeline used in production**: pre-train (Ch 7-10) → SFT (Ch 13) → preference (Ch 14) → PEFT (Ch 15) → distill (Ch 16). Every major production team uses some form of this stack.

**What's next — Phase 12: Inference.** Where Phase 11 covered *training*, Phase 12 covers *serving*:
- **Ch 17**: Inference optimization (KV cache, batching, speculative decoding, prefill vs decode)
- **Ch 18**: Quantization for inference (INT8, INT4, NF4, AWQ, GPTQ)
- **Ch 19**: Sampling algorithms (top-k, top-p, beam search, temperature, constrained decoding)

After Phase 12, the back half of the tutorial — capabilities (Ch 20-23), safety (Ch 24-26), agents (Ch 27-30) — completes the journey.

---

## Notes for the session author

**On the symbolic weight of closing Phase 11:**
This session isn't just closing a chapter — it's closing the entire post-training arc. **The reader who reaches this point has the full toolkit** for taking a pre-trained model and producing a deployable, useful, aligned chatbot. **Acknowledge that in the closeout.** The cadence retrospective and Phase 11 summary should feel like a milestone.

**On the pipeline widget being click-to-explore:**
The PreferenceLearningPipeline widget from Ch 14 established this pattern: stages laid out spatially, click any one for details. The DistillationPipeline widget follows the same pattern. **Consistency across Phase 11 widgets** reinforces the reader's mental model of "these are all related algorithmic pipelines."

**On the 5-stage pipeline being the chapter's operational claim:**
Section 7 of the prose talked about modern recipes (DistilBERT, Phi, R1-Distill, Orca). The widget makes the **shared pipeline structure** concrete: all of them use teacher → prompts → generate → filter → train → student. **The widget shows what these recipes have in common**, not what makes them different.

**On real-world examples in each stage's details:**
Every stage's details panel includes a "Real-world examples" line at the bottom: R1-Distill, Phi, Orca, Gemma 2. **Reader sees that this isn't abstract** — these are real recipes used by real teams shipping real models.

**On the wrap arrow being a design challenge:**
Six stages don't fit in one row. The widget uses an "S" pattern: top row (teacher → prompts → generate), wrap, bottom row (filter → train → student). The wrap arrow is a curved Bezier path. Implementor: pay attention to the geometry — it should look natural, not awkward.

**On the four exercises being a difficulty progression:**
- **Ex 1 (easy) — Temperature softmax**: implements the chapter's central mechanism. Two-line function. Verifies qualitative behavior at three temperatures.
- **Ex 2 (medium) — KL divergence**: implements the loss component. Three properties to verify. Locks in section 3.
- **Ex 3 (medium) — Full distillation loss with $T^2$ verification**: the chapter's signature equation. Crucially, **also verifies that $T^2$ is necessary** — without it, the soft loss vanishes at high $T$.
- **Ex 4 (hard) — Hard distillation pipeline**: simulate the modern recipe. Reader builds the conceptual pipeline. Reinforces section 4 (hard vs soft) and section 7 (modern recipes).

Difficulty: easy → medium → medium → hard. Same progression as Ch 14 and Ch 15. Pattern stable.

**On Ex 3 being pedagogically critical:**
The $T^2$ verification is the chapter's most pedagogically important exercise. Many tutorials skip $T^2$; readers come away thinking it's an arbitrary scaling factor. **By computing the soft loss with and without $T^2$ at multiple temperatures, the reader sees the multiplier is necessary, not optional.** Notes-for-author for the reader: "Don't forget the $T^2$ — it's not a heuristic, it's mathematical necessity."

**On the exercises serving the 8 outcomes:**

| Outcome | Exercise |
|---|---|
| 1. Why distillation matters | (chapter prose + opening) |
| 2. Soft labels, dark knowledge, temperature | Ex 1 |
| 3. Compute the distillation loss | Ex 2, Ex 3 |
| 4. Hard vs soft distillation | Ex 3, Ex 4 |
| 5. Student architecture | (chapter prose) |
| 6. Modern recipes | Ex 4 + widget |
| 7. Reasoning distillation | (chapter prose) |
| 8. Method selection | (chapter prose + section 8) |

Outcomes 2, 3, 4, 6 served by exercises directly. Outcomes 1, 5, 7, 8 served by chapter prose and widgets.

**On the closeout being celebratory but not overblown:**
**Phase 11 complete is genuinely a milestone.** Honor it in the closeout — readers have completed half the curriculum and the full post-training arc. **But don't over-dramatize.** The tone should be: "well done; we've covered a lot of ground; there's still half the journey to go."

**Pedagogical claim of the chapter (revisited):**
"Distillation transfers capabilities from a large teacher to a small student. The Hinton 2015 framework uses soft labels with temperature scaling to reveal 'dark knowledge.' Modern recipes mostly use simpler hard distillation: teacher generates synthetic data, filter for quality, train student via standard SFT. The most exciting recent development is reasoning distillation (R1-Distill matching o1-mini at 32B). The chapter's exercises lock in the mechanics (Ex 1 temperature, Ex 2 KL, Ex 3 full loss with $T^2$ verification) and the modern recipe (Ex 4 pipeline simulation). **Distillation closes Phase 11 — and is what makes frontier-quality models cheap to deploy at scale.**"

**Phase 11 progress after this session**: Ch 13 ✅, Ch 14 ✅, Ch 15 ✅, **Ch 16 ✅. Phase 11 COMPLETE.**

**Phase 12 (Inference) opens next.** Three chapters: inference optimization (Ch 17), quantization (Ch 18), sampling (Ch 19). After Phase 12, the back half of the curriculum — capabilities, safety, agents — completes the journey.

**This session closes the post-training arc.** Build with care.

# Session 88 — Ch 19 constrained decoding + exercises + closeout

> **The Chapter 19 closeout — and the session that closes Phase 12.** Three deliverables: (1) implement the **Constrained Decoding Visualizer** secondary widget — step-by-step FSM masking for a small JSON grammar; reader walks token-by-token through a generation, seeing which tokens are valid vs masked at each state; (2) add an **Exercises section** with 4 problems (basic samplers, top-p implementation, repetition penalty, FSM masking); (3) flip Ch 19's status from `'draft'` to `'published'`. **Closes Ch 19. Closes Phase 12. Closes the inference-engineering arc.** After this session, all three Phase 12 chapters are on production: Ch 17 (inference optimization), Ch 18 (quantization), Ch 19 (sampling).

This is a **single-topic chapter** (4-file cadence). The secondary widget gets combined with exercises in this final session — the standard closeout pattern.

---

## Read first (in this order)

1. **`research/ch19-sampling/research.md`** — concept 8 (constrained decoding) is the source material
2. **`prompts/chapters/ch19-sampling/session-86-page-structure.md`** — for the section-8 widget placeholder and exercise placement
3. **`prompts/chapters/ch19-sampling/session-87-sampling-distribution-widget.md`** — for the Ch 19 widget conventions
4. **`prompts/chapters/ch18-quantization/session-84-granularity-visualizer-and-exercises-and-closeout.md`** — for the recent Phase 12 closeout pattern
5. **`prompts/chapters/ch17-inference-optimization/session-78-kv-cache-animation-widget.md`** — for the step-through-states pattern (KVCacheAnimation is the closest precedent for "walk through discrete states")

---

## Goal

By end of session, three things change in the repo:

1. **`ConstrainedDecoding` widget** is implemented and wired into section 8 of Ch 19. Replaces the existing `<WidgetFrame>` placeholder.
2. **An "Exercises" section** is inserted into `index.mdx`. Per the section structure, this goes between section 7 ("Beam search") and section 8 ("Constrained decoding and modern recipes"). Four exercises with hints + runnable starter code.
3. **Ch 19's status flips from `'draft'` to `'published'`** in `src/lib/chapters.ts`. **Ch 19 is the nineteenth published chapter — and the last of Phase 12.**

After this session: **Ch 19 is complete. Phase 12 is complete.** Phase 13 (Capabilities) opens next.

---

## Inputs

State of the repo after session 87:

- Section 4's `SamplingDistribution` marquee widget is wired
- Section 8's widget is still stubbed
- All 3 runnable code blocks from session 86 are in place
- `src/lib/chapters.ts` has Ch 1-18 `'published'`, Ch 19 `'draft'`
- `src/components/widgets/ch19/` exists with one widget already

---

## Deliverables

1. **Create** `src/components/widgets/ch19/ConstrainedDecoding.tsx` — the React widget
2. **Create** `src/components/widgets/ch19/ConstrainedDecoding.module.css` — scoped styles
3. **Create** `src/components/widgets/ch19/fsm-data.ts` — FSM definitions and step transitions
4. **Update** `src/components/widgets/index.ts` — add `ConstrainedDecoding` export
5. **Update** `src/pages/ch19-sampling/index.mdx`:
   - Replace section-8's `<WidgetFrame>` interior with `<ConstrainedDecoding client:visible />`
   - Insert new `## Exercises` section between section 7 ("Beam search") and section 8
6. **Update** `src/lib/chapters.ts` — change Ch 19's `status` from `'draft'` to `'published'`

**Do not modify** any other file. Earlier chapters and widgets are sealed. Ch 19's marquee widget is sealed.

---

## Detailed spec

### Part A — `ConstrainedDecoding` widget

#### A.1 `fsm-data.ts`

```ts
// src/components/widgets/ch19/fsm-data.ts

/**
 * Pedagogical vocabulary — 16 hand-picked tokens that illustrate JSON FSM behavior.
 * Tokens are intentionally chosen so each step has a clear set of valid/invalid distinctions.
 */
export const VOCAB = [
  { id: 0,  label: '{',        kind: 'json-struct' as const },
  { id: 1,  label: '}',        kind: 'json-struct' as const },
  { id: 2,  label: '"',        kind: 'json-struct' as const },
  { id: 3,  label: ':',        kind: 'json-struct' as const },
  { id: 4,  label: ',',        kind: 'json-struct' as const },
  { id: 5,  label: 'name',     kind: 'json-key' as const },
  { id: 6,  label: 'age',      kind: 'json-key' as const },
  { id: 7,  label: 'Alice',    kind: 'json-value-str' as const },
  { id: 8,  label: 'Bob',      kind: 'json-value-str' as const },
  { id: 9,  label: '25',       kind: 'json-value-num' as const },
  { id: 10, label: '30',       kind: 'json-value-num' as const },
  { id: 11, label: 'true',     kind: 'json-value-other' as const },
  { id: 12, label: 'null',     kind: 'json-value-other' as const },
  { id: 13, label: '[',        kind: 'json-bracket' as const },
  { id: 14, label: ']',        kind: 'json-bracket' as const },
  { id: 15, label: 'random',   kind: 'noise' as const },
];

/**
 * FSM states for the grammar: { "name" : "VALUE" }
 * 
 * State diagram:
 *   START → AFTER_BRACE → KEY_OPENED → KEY_NAME → KEY_CLOSED → COLON
 *      → VALUE_OPENED → VALUE_NAME → VALUE_CLOSED → CLOSE_BRACE → DONE
 */
export type FsmState =
  | 'START'
  | 'AFTER_BRACE'
  | 'KEY_OPENED'
  | 'KEY_NAME'
  | 'KEY_CLOSED'
  | 'COLON'
  | 'VALUE_OPENED'
  | 'VALUE_NAME'
  | 'VALUE_CLOSED'
  | 'DONE';

export interface Step {
  state: FsmState;
  description: string;
  validVocabIds: number[];
  modelPreferredId: number;   // the token the model would pick WITHOUT constraints
  chosenId: number;            // the token actually chosen WITH constraints (max prob among valid)
  emittedSoFar: string;
}

/**
 * Pre-computed step sequence for generating `{"name": "Alice"}`.
 * Each step shows:
 *  - which vocab tokens are valid at the current FSM state
 *  - what the model would prefer without constraints (often invalid — like "random")
 *  - what gets chosen with constraints (highest-prob valid token)
 */
export const STEPS: Step[] = [
  {
    state: 'START',
    description: 'Expecting object open `{`',
    validVocabIds: [0],  // only `{`
    modelPreferredId: 15,   // "random" — would be wrong
    chosenId: 0,
    emittedSoFar: '',
  },
  {
    state: 'AFTER_BRACE',
    description: 'Expecting key open `"`',
    validVocabIds: [2],
    modelPreferredId: 5,   // "name" — would be wrong (skips quote)
    chosenId: 2,
    emittedSoFar: '{',
  },
  {
    state: 'KEY_OPENED',
    description: 'Expecting key name',
    validVocabIds: [5, 6],  // "name" or "age"
    modelPreferredId: 5,
    chosenId: 5,
    emittedSoFar: '{"',
  },
  {
    state: 'KEY_NAME',
    description: 'Expecting key close `"`',
    validVocabIds: [2],
    modelPreferredId: 3,   // ":" — would be wrong (skips quote)
    chosenId: 2,
    emittedSoFar: '{"name',
  },
  {
    state: 'KEY_CLOSED',
    description: 'Expecting `:`',
    validVocabIds: [3],
    modelPreferredId: 7,   // "Alice" — would be wrong (no colon)
    chosenId: 3,
    emittedSoFar: '{"name"',
  },
  {
    state: 'COLON',
    description: 'Expecting value open `"`',
    validVocabIds: [2],
    modelPreferredId: 7,   // "Alice" — would be wrong (no quote)
    chosenId: 2,
    emittedSoFar: '{"name":',
  },
  {
    state: 'VALUE_OPENED',
    description: 'Expecting string value',
    validVocabIds: [7, 8],  // "Alice" or "Bob"
    modelPreferredId: 7,
    chosenId: 7,
    emittedSoFar: '{"name":"',
  },
  {
    state: 'VALUE_NAME',
    description: 'Expecting value close `"`',
    validVocabIds: [2],
    modelPreferredId: 1,   // "}" — would be wrong (no closing quote)
    chosenId: 2,
    emittedSoFar: '{"name":"Alice',
  },
  {
    state: 'VALUE_CLOSED',
    description: 'Expecting object close `}`',
    validVocabIds: [1],
    modelPreferredId: 4,   // "," — would extend the object
    chosenId: 1,
    emittedSoFar: '{"name":"Alice"',
  },
  {
    state: 'DONE',
    description: 'Generation complete',
    validVocabIds: [],
    modelPreferredId: 15,
    chosenId: -1,
    emittedSoFar: '{"name":"Alice"}',
  },
];

export const TARGET_GRAMMAR = '{"name": "<string>"}';
```

#### A.2 Visual layout

```
ViewBox: 0 0 800 700

┌────────────────────────────────────────────────────────────────┐
│ Constrained decoding (FSM masking)                               │
│                                                                  │
│ Target grammar: {"name": "<string>"}                             │
│                                                                  │
│ Step 6 of 10:  state = VALUE_OPENED                              │
│                                                                  │
│ [◀ Prev]   [Next ▶]   [↻ Reset]                                  │
│                                                                  │
│ Currently expecting:                                              │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Expecting value open `"`                                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Generated so far:                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ {"name":                                                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Vocabulary candidates (16 tokens):                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  [{]       [}]       ["]       [:]       [,]                  │ │
│ │   ✗ masked  ✗ masked  ✓ valid  ✗ masked  ✗ masked              │ │
│ │                                                                │ │
│ │  [name]    [age]     [Alice]   [Bob]     [25]     [30]        │ │
│ │   ✗ masked  ✗ masked  ✗ masked  ✗ masked  ✗ masked  ✗ masked   │ │
│ │                                                                │ │
│ │  [true]    [null]    [[]       []]       [random]              │ │
│ │   ✗ masked  ✗ masked  ✗ masked  ✗ masked  ✗ masked              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Model's preferred token (without constraints):                    │
│  • "Alice"  ← model wanted to skip the opening quote!             │
│                                                                  │
│ Token chosen (with constraints):                                  │
│  • "  ← highest-probability VALID token                           │
│                                                                  │
│ ⚠ Without constrained decoding, the model would have generated    │
│   {"name":"Alice"  — missing the opening quote, breaking JSON.   │
│                                                                  │
│ Insight:                                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Constrained decoding guarantees the output satisfies the      │ │
│ │ grammar. The model still uses its full probability distribution│ │
│ │ — it just gets restricted to valid options.                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- **Prev / Next buttons**: step through the 10 generation states
- **Reset**: back to step 0
- **Auto-Play** (optional): not required; manual stepping is clearer for this widget
- Vocabulary grid: each token shows label and ✓ / ✗ status
- Color coding:
  - **Valid (kept)**: cyan, full opacity
  - **Masked (invalid)**: rose, low opacity
  - **Chosen this step**: extra cyan highlight border
  - **Model's preferred (without constraints)**: amber dot/marker

**Visual details:**
- Vocabulary grid in a 4×4 or 3×6 layout (depending on whitespace)
- Status indicator (✓/✗) below each token
- "Chosen" token gets an extra cyan ring
- "Model's preferred" gets an amber asterisk or small badge

#### A.3 `ConstrainedDecoding.tsx`

```tsx
import { useState } from 'react';
import { VOCAB, STEPS, TARGET_GRAMMAR } from './fsm-data';
import styles from './ConstrainedDecoding.module.css';

export default function ConstrainedDecoding() {
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx]!;
  const isLast = stepIdx === STEPS.length - 1;
  const isFirst = stepIdx === 0;

  const validSet = new Set(step.validVocabIds);
  const wouldBeWrong =
    step.modelPreferredId !== step.chosenId &&
    !validSet.has(step.modelPreferredId);

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Constrained decoding (FSM masking)</div>
        <div className={styles.titleSubLabel}>
          Target grammar: <code className={styles.grammarCode}>{TARGET_GRAMMAR}</code>
        </div>
      </div>

      {/* Step controls */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlsRow}>
          <button
            className={styles.button}
            onClick={() => setStepIdx(i => Math.max(0, i - 1))}
            disabled={isFirst}
          >◀ Prev</button>
          <button
            className={styles.button}
            onClick={() => setStepIdx(i => Math.min(STEPS.length - 1, i + 1))}
            disabled={isLast}
          >Next ▶</button>
          <button
            className={styles.button}
            onClick={() => setStepIdx(0)}
          >↻ Reset</button>
          <span className={styles.stepCounter}>
            Step {stepIdx + 1} of {STEPS.length} · state = <strong>{step.state}</strong>
          </span>
        </div>
      </div>

      {/* Currently expecting */}
      <div className={styles.expectingPanel}>
        <div className={styles.expectingLabel}>Currently expecting</div>
        <div className={styles.expectingText}>{step.description}</div>
      </div>

      {/* Generated so far */}
      <div className={styles.generatedPanel}>
        <div className={styles.generatedLabel}>Generated so far</div>
        <div className={styles.generatedText}>
          {step.emittedSoFar || <em className={styles.empty}>(nothing yet)</em>}
        </div>
      </div>

      {/* Vocabulary grid */}
      <div className={styles.vocabPanel}>
        <div className={styles.vocabTitle}>Vocabulary candidates (16 tokens)</div>
        <div className={styles.vocabGrid}>
          {VOCAB.map(tok => {
            const isValid = validSet.has(tok.id);
            const isChosen = tok.id === step.chosenId;
            const isModelPref = tok.id === step.modelPreferredId;
            return (
              <div
                key={tok.id}
                className={`${styles.tokenCell} ${isValid ? styles.tokenValid : styles.tokenMasked} ${isChosen ? styles.tokenChosen : ''}`}
              >
                <div className={styles.tokenLabel}>{tok.label}</div>
                <div className={styles.tokenStatus}>
                  {isValid ? '✓ valid' : '✗ masked'}
                </div>
                {isModelPref && (
                  <div className={styles.modelPrefBadge} title="Model's preferred token (without constraints)">★</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Model preferred vs chosen */}
      {!isLast && (
        <div className={styles.comparePanel}>
          <div className={styles.compareRow}>
            <span className={styles.compareLabel}>★ Model's preferred (no constraints):</span>
            <span className={`${styles.compareValue} ${wouldBeWrong ? styles.compareWrong : ''}`}>
              "{VOCAB[step.modelPreferredId]!.label}"
              {wouldBeWrong && <span className={styles.warningTag}> ← would break grammar!</span>}
            </span>
          </div>
          <div className={styles.compareRow}>
            <span className={styles.compareLabel}>✓ Chosen (with constraints):</span>
            <span className={styles.compareChoice}>
              "{VOCAB[step.chosenId]!.label}" ← highest-prob valid token
            </span>
          </div>
        </div>
      )}

      {isLast && (
        <div className={styles.comparePanel}>
          <div className={styles.compareLabel}>Generation complete.</div>
          <div className={styles.compareChoice}>
            Final output: <code className={styles.grammarCode}>{step.emittedSoFar}</code>
          </div>
        </div>
      )}

      {/* Insight */}
      <div className={styles.insightPanel}>
        <div className={styles.insightLabel}>Insight</div>
        <div className={styles.insightText}>
          Constrained decoding guarantees the output satisfies the grammar. The model still uses its
          full probability distribution — it just gets restricted to valid options. Without it, the
          model often picks tokens that break the format (★ markers above).
        </div>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        Click <strong>Next ▶</strong> to walk through generating <code>&#123;"name": "Alice"&#125;</code>.
        At each step, watch which tokens are <strong>valid (cyan ✓)</strong> vs <strong>masked (rose ✗)</strong>.
        The ★ marks the model's <em>preferred</em> token without constraints — often invalid! Constrained
        decoding picks the highest-probability valid token instead. <strong>This is how JSON mode and tool-calling
        APIs guarantee structured output.</strong>
      </div>
    </div>
  );
}
```

#### A.4 `ConstrainedDecoding.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.titlePanel, .controlsPanel, .expectingPanel, .generatedPanel, .vocabPanel, .comparePanel, .insightPanel, .caption {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 0.85rem;
}
.titlePanel { padding: 0.7rem 1rem; }
.titleLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.86rem;
  color: var(--text-primary);
  font-weight: 500;
}
.titleSubLabel {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
  font-family: 'JetBrains Mono', monospace;
}
.grammarCode {
  font-family: 'JetBrains Mono', monospace;
  background: var(--bg-primary);
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  color: var(--cyan-300);
  font-size: 0.78rem;
}

/* Controls */
.controlsRow {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}
.button {
  padding: 0.4rem 0.85rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 200ms;
}
.button:hover:not(:disabled) {
  border-color: var(--cyan-500);
  color: var(--cyan-300);
}
.button:disabled { opacity: 0.35; cursor: not-allowed; }
.stepCounter {
  margin-left: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
}
.stepCounter strong { color: var(--cyan-300); }

/* Expecting panel */
.expectingLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.3rem;
}
.expectingText {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.92rem;
  color: var(--cyan-300);
  font-weight: 500;
}

/* Generated panel */
.generatedLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.3rem;
}
.generatedText {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1rem;
  color: var(--text-primary);
  background: var(--bg-primary);
  padding: 0.5rem 0.8rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  letter-spacing: 0.02em;
}
.empty { color: var(--text-tertiary); font-style: italic; font-size: 0.85rem; }

/* Vocab grid */
.vocabTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.55rem;
  font-weight: 500;
}
.vocabGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}
.tokenCell {
  position: relative;
  padding: 0.55rem 0.5rem;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--border-default);
  background: var(--bg-primary);
  font-family: 'JetBrains Mono', monospace;
  text-align: center;
  transition: all 200ms;
}
.tokenLabel {
  font-size: 0.82rem;
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 0.2rem;
}
.tokenStatus {
  font-size: 0.68rem;
  color: var(--text-tertiary);
}
.tokenValid {
  background: color-mix(in srgb, var(--cyan-500) 10%, var(--bg-primary));
  border-color: var(--cyan-500);
}
.tokenValid .tokenLabel { color: var(--cyan-300); }
.tokenValid .tokenStatus { color: var(--cyan-400); }
.tokenMasked {
  opacity: 0.4;
  background: color-mix(in srgb, var(--rose-400) 6%, var(--bg-primary));
}
.tokenMasked .tokenLabel { color: var(--rose-400); }
.tokenMasked .tokenStatus { color: var(--rose-400); }
.tokenChosen {
  outline: 2.5px solid var(--cyan-500);
  outline-offset: 1px;
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--cyan-500) 50%, transparent));
}
.modelPrefBadge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: var(--amber-400);
  color: var(--bg-primary);
  font-size: 0.72rem;
  width: 18px; height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

/* Compare panel */
.comparePanel {
  background: color-mix(in srgb, var(--amber-400) 4%, var(--bg-elevated));
}
.compareRow {
  display: flex;
  gap: 0.6rem;
  align-items: baseline;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.84rem;
  padding: 0.2rem 0;
}
.compareLabel {
  color: var(--text-secondary);
  min-width: 280px;
}
.compareValue { color: var(--text-primary); font-weight: 500; }
.compareWrong { color: var(--rose-400); }
.warningTag {
  font-style: italic;
  font-size: 0.78rem;
  color: var(--rose-400);
  margin-left: 0.3rem;
}
.compareChoice { color: var(--emerald-400); font-weight: 500; }

/* Insight */
.insightPanel {
  background: color-mix(in srgb, var(--cyan-500) 4%, var(--bg-elevated));
  border: 1px solid var(--cyan-500);
}
.insightLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--cyan-300);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.3rem;
}
.insightText {
  font-size: 0.85rem;
  color: var(--text-primary);
  line-height: 1.5;
}

/* Caption */
.caption {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.55;
}
.caption strong { color: var(--cyan-300); font-weight: 500; }
.caption code {
  font-family: 'JetBrains Mono', monospace;
  background: var(--bg-primary);
  padding: 0.05rem 0.35rem;
  border-radius: 2px;
  color: var(--cyan-300);
  font-size: 0.78rem;
}

@media (max-width: 720px) {
  .vocabGrid { grid-template-columns: repeat(3, 1fr); }
  .compareRow { flex-direction: column; gap: 0.1rem; }
  .compareLabel { min-width: 0; }
  .controlsRow { gap: 0.3rem; }
  .stepCounter { font-size: 0.7rem; }
}
```

#### A.5 Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as SamplingDistribution } from './ch19/SamplingDistribution';
export { default as ConstrainedDecoding } from './ch19/ConstrainedDecoding';
```

#### A.6 Update `src/pages/ch19-sampling/index.mdx`

**Edit A: Update widget import:**

```mdx
import { SamplingDistribution, ConstrainedDecoding } from '@components/widgets';
```

**Edit B: Replace section-8's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Constrained decoding" caption="Step-by-step generation of valid JSON. At each FSM state, only certain vocabulary tokens are valid; invalid tokens are masked (rose). The ★ marks the model's *preferred* token without constraints — often invalid! Constrained decoding picks the highest-probability valid token instead. The widget makes 'how does JSON mode work' concrete.">
  <ConstrainedDecoding client:visible />
</WidgetFrame>
```

### Part B — Exercises section

Insert between section 7 ("Beam search") and section 8 ("Constrained decoding and modern recipes"). Use this structure:

````mdx
## Exercises

Four exercises that lock in the chapter's machinery. Each is a self-contained problem with a starting template; hints are collapsed by default — try the problem first.

### Exercise 1 (easy) — Greedy and temperature

Implement greedy decoding and temperature-scaled sampling. Verify the qualitative behavior: greedy is deterministic; low temperature is conservative; high temperature is noisy.

<details>
<summary>Hint</summary>

**Greedy**: `np.argmax(logits)`.

**Temperature**: scale logits by $1/T$ before softmax; then sample with probability proportional to the result.

Use `np.random.choice(len(probs), p=probs)` to sample. Use a fixed seed for reproducibility.

Numerical stability: subtract `logits.max()` before exponentiating to avoid overflow.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def softmax(z):
    z = z - z.max()
    e = np.exp(z)
    return e / e.sum()

def greedy(logits):
    """Emit argmax."""
    # TODO: return the index of the highest-probability token
    pass

def temperature_sample(logits, T=1.0, rng=None):
    """Sample from softmax(logits / T)."""
    # TODO:
    # 1. Scale logits by 1/T
    # 2. Apply softmax
    # 3. Sample using rng.choice
    pass

# Test on logits with one clear winner
np.random.seed(0)
logits = np.random.normal(0, 1, 50)
logits[5] = 4.0   # clear winner

rng = np.random.RandomState(42)
# print(f"Greedy: always {greedy(logits)}")
# 
# for T in [0.3, 1.0, 2.0]:
#     samples = [temperature_sample(logits, T=T, rng=rng) for _ in range(10)]
#     print(f"T = {T}: samples = {samples}")
# 
# # Observations:
# # - Greedy: always token 5
# # - T = 0.3: mostly token 5 (sharp)
# # - T = 1.0: balanced — 5 dominant with some variety
# # - T = 2.0: scattered across many tokens (too noisy)
`}
  packages={["numpy"]}
/>

### Exercise 2 (medium) — Top-p sampling

Implement top-p (nucleus) sampling. Verify the nucleus size adapts to distribution shape — small for peaked, large for flat.

<details>
<summary>Hint</summary>

Top-p algorithm:
1. Compute softmax probabilities.
2. Sort by probability (descending).
3. Find the smallest $k$ such that $\sum_{i=1}^{k} p_i \geq p$.
4. Keep those $k$ tokens; mask the rest with $-\infty$.
5. Renormalize and sample.

Use `np.argsort(probs)[::-1]` for descending sort. Use `np.searchsorted` to find the cutoff index.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def softmax(z):
    z = z - z.max()
    e = np.exp(z)
    return e / e.sum()

def top_p_indices(probs, p=0.95):
    """
    Return the set of indices in the top-p nucleus and the nucleus size.
    
    Algorithm:
    1. Sort by probability descending
    2. Cumulative sum
    3. Find smallest k with cumsum[k-1] >= p
    """
    # TODO: implement
    pass

def top_p_sample(logits, p=0.95, T=1.0, rng=None):
    """Apply top-p truncation and sample."""
    # TODO:
    # 1. Apply temperature
    # 2. Compute softmax
    # 3. Find nucleus indices
    # 4. Mask non-nucleus tokens with -inf
    # 5. Renormalize and sample
    pass

# Test adaptive behavior across distribution shapes
np.random.seed(0)

def make_distribution(shape='peaked', V=50):
    np.random.seed(0)
    z = np.random.normal(0, 1, V)
    if shape == 'peaked':
        z[0] += 5.0
    elif shape == 'bimodal':
        z[0] += 3.0
        z[1] += 2.5
    return softmax(z)

# print(f"{'Shape':<10} | nucleus size at p=0.5, p=0.9, p=0.95")
# print("-" * 50)
# for shape in ['peaked', 'bimodal', 'flat']:
#     probs = make_distribution(shape)
#     sizes = []
#     for p in [0.5, 0.9, 0.95]:
#         _, n = top_p_indices(probs, p)
#         sizes.append(n)
#     print(f"{shape:<10} | {sizes}")
# 
# # Observations:
# # - Peaked: nucleus is small (~1-3 even at p=0.95)
# # - Bimodal: nucleus naturally includes both peaks
# # - Flat: nucleus is large (need many tokens to reach 95% mass)
# # This is why top-p is the modern default — it adapts.
`}
  packages={["numpy"]}
/>

### Exercise 3 (medium) — Repetition penalty

Implement a frequency penalty: each token's logit is reduced proportional to how many times it has appeared in the generation so far. Verify the effect on a token that has been repeated.

<details>
<summary>Hint</summary>

Frequency penalty: $z'_i = z_i - \alpha \cdot \text{count}_i$.

Track token counts as you sample. After sampling each token, increment its count.

For the demo: generate a sequence of 20 tokens with and without penalty. Compare how often the highest-probability token gets repeated.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def softmax(z):
    z = z - z.max()
    e = np.exp(z)
    return e / e.sum()

def apply_frequency_penalty(logits, token_counts, alpha=0.5):
    """Reduce logits by alpha * count for each token seen."""
    # TODO: return logits - alpha * token_counts
    pass

def sample_with_penalty(logits, T=1.0, alpha=0.0, n=20, rng=None):
    """
    Sample n tokens with frequency penalty alpha.
    Returns the list of sampled token indices.
    """
    if rng is None: rng = np.random
    V = len(logits)
    token_counts = np.zeros(V)
    samples = []
    for _ in range(n):
        # TODO:
        # 1. Apply frequency penalty (if alpha > 0)
        # 2. Sample with temperature T
        # 3. Update token_counts
        # 4. Append to samples
        pass
    return samples

# Demo: logits where token 5 is very preferred
np.random.seed(0)
logits = np.random.normal(0, 1, 30)
logits[5] = 4.0   # strong preference

# Without penalty: token 5 dominates
# With penalty: variety increases as count grows
rng_no_pen = np.random.RandomState(42)
rng_pen = np.random.RandomState(42)

# samples_no_penalty = sample_with_penalty(logits, T=1.0, alpha=0.0, n=20, rng=rng_no_pen)
# samples_with_penalty = sample_with_penalty(logits, T=1.0, alpha=0.5, n=20, rng=rng_pen)
# 
# print(f"Without penalty: {samples_no_penalty}")
# print(f"With penalty:    {samples_with_penalty}")
# 
# from collections import Counter
# print(f"\\nToken 5 count:")
# print(f"  Without penalty: {Counter(samples_no_penalty)[5]} / 20")
# print(f"  With penalty:    {Counter(samples_with_penalty)[5]} / 20")
# 
# # Observation: penalty reduces repetition of token 5
# # but at high alpha can prevent natural repetition.
# # Production: alpha = 0.1 is usually sufficient.
`}
  packages={["numpy"]}
/>

### Exercise 4 (hard) — FSM masking for constrained decoding

Implement constrained decoding via FSM masking for a tiny JSON-like grammar. At each step, mask out tokens that would violate the current FSM state.

<details>
<summary>Hint</summary>

Define a small grammar via state transitions. For each state, list the valid token IDs. At each decode step:

1. Get current FSM state
2. Determine valid token set
3. Mask out invalid tokens (set logits to $-\infty$)
4. Sample from masked distribution
5. Update state based on emitted token

Use a dict: `{state: {token_id: next_state}}`.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def softmax(z):
    z = z - z.max()
    e = np.exp(z)
    return e / e.sum()

# Tiny vocabulary
VOCAB = ['{', '}', '"', ':', 'name', 'Alice', 'random']
# IDs:      0    1    2    3    4       5         6

# FSM transitions: {state: {token_id: next_state}}
# Grammar: { "name" : "Alice" }   (slightly simplified)
TRANSITIONS = {
    'START':         {0: 'AFTER_BRACE'},                # only '{' valid
    'AFTER_BRACE':   {2: 'KEY_OPENED'},                 # only '"'
    'KEY_OPENED':    {4: 'KEY_NAME'},                   # only 'name'
    'KEY_NAME':      {2: 'KEY_CLOSED'},                 # only '"'
    'KEY_CLOSED':    {3: 'COLON'},                      # only ':'
    'COLON':         {2: 'VALUE_OPENED'},               # only '"'
    'VALUE_OPENED':  {5: 'VALUE_NAME'},                 # only 'Alice'
    'VALUE_NAME':    {2: 'VALUE_CLOSED'},               # only '"'
    'VALUE_CLOSED':  {1: 'DONE'},                       # only '}'
    'DONE':          {},
}

def valid_tokens(state):
    """Return list of valid token IDs at the given state."""
    return list(TRANSITIONS.get(state, {}).keys())

def constrained_decode(logits_fn, state, rng=None):
    """
    Greedily decode under constraints.
    
    logits_fn(state) → logits (here we just use random logits for demo)
    Returns the emitted sequence and final state.
    """
    if rng is None: rng = np.random
    emitted = []
    
    while state != 'DONE':
        logits = logits_fn(state)
        # TODO:
        # 1. Get valid tokens at current state
        # 2. Mask invalid tokens to -inf
        # 3. Take argmax of masked logits (or sample with softmax)
        # 4. Append the token; update state
        pass
    
    return emitted, state

# Demo: simulated "model preferences" (random logits)
def fake_logits(state):
    rng_state = sum(ord(c) for c in state) % 100
    np.random.seed(rng_state)
    z = np.random.normal(0, 1, len(VOCAB))
    # Often the model would prefer 'random' (token 6) — invalid!
    z[6] += 1.5
    return z

# emitted, final_state = constrained_decode(fake_logits, 'START')
# emitted_str = ' '.join(VOCAB[i] for i in emitted)
# print(f"Emitted: {emitted_str}")
# print(f"Joined:  {''.join(VOCAB[i] for i in emitted)}")
# print(f"Final state: {final_state}")
# print(f"\\nWithout constraints, the model would have picked 'random' often.")
# print(f"FSM masking guarantees the output follows the grammar.")
`}
  packages={["numpy"]}
/>

````

### Part C — Flip Ch 19's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 19, slug: 'ch19-sampling', title: 'Sampling', partNum: 6, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript or MDX errors.
2. **Sections 1-7** of Ch 19 still render correctly (no changes to existing sections).
3. **Section 4's** `SamplingDistribution` marquee widget still renders correctly.
4. **Section 8** now renders the working `ConstrainedDecoding` widget.
5. **Default state**: step 0 (START). Only the `{` token shows as valid (cyan); all others rose-faded. The amber ★ marks "random" as the model's preferred (wrong) token. The chosen token is `{`.
6. **Step controls**: Prev disabled at step 0; Next disabled at last step (DONE). Reset works at any step.
7. **Step counter**: shows "Step N of 10 · state = STATE_NAME" with state in cyan.
8. **Vocabulary grid**: 4×4 layout of 16 tokens. Each cell shows label, status (✓ valid / ✗ masked), and amber ★ on the model's preferred token.
9. **Chosen token**: has an outline + drop-shadow effect (extra cyan ring).
10. **Compare panel**: shows the model's preferred token vs the chosen token. If they differ AND the preferred is invalid, shows "← would break grammar!" in rose.
11. **Walking through all 10 steps**:
   - Step 1: only `{` valid; model prefers "random" (wrong)
   - Step 2: only `"` valid; model prefers "name" (wrong — skips quote)
   - Step 3: `name` and `age` valid; model picks `name`
   - ... (continue through steps 4-9)
   - Step 10 (DONE): generation complete; final output `{"name":"Alice"}` shown
12. **Generated-so-far panel**: shows progressively `""` → `{` → `{"` → `{"name` → ... → `{"name":"Alice"}`
13. **New "## Exercises" section** is between section 7 and section 8. Contains 4 sub-exercises with collapsible hints and runnable starter code.
14. **Sidebar**: Ch 1-19 all active (published); Ch 20-30 still dimmed.
15. **Prev/next at bottom of Ch 19**: prev = Ch 18 (active); next = Ch 20 (disabled).
16. **TOC**: includes Exercises as h2 between section 7 and section 8.
17. **Mobile**: vocab grid switches to 3 columns; compare panel rows stack.
18. **`npm run typecheck`** passes.
19. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not provide exercise solutions.** Hints only.
- ❌ **Do not implement an actual JSON parser**. The FSM is hand-built for pedagogy.
- ❌ **Do not animate auto-play**. Manual stepping is clearer for this widget.
- ❌ **Do not flip any other chapter's status.** Only Ch 19 flips.
- ❌ **Do not modify Ch 1-18.** Sealed.
- ❌ **Do not modify Ch 19's marquee widget.** Sealed.
- ❌ **Do not modify Ch 19 prose sections 1-8.** Sealed. (Only insert the new Exercises section between sections 7 and 8.)
- ❌ **Do not implement context-free grammars** — too complex for this widget. Linear FSM only.

---

## Wire-up

```bash
git add src/components/widgets/ch19/ConstrainedDecoding.tsx src/components/widgets/ch19/ConstrainedDecoding.module.css src/components/widgets/ch19/fsm-data.ts src/components/widgets/index.ts src/pages/ch19-sampling/index.mdx src/lib/chapters.ts
git commit -m "session 88: Ch 19 closeout — constrained decoding visualizer + exercises + status: published. Phase 12 COMPLETE."
git push origin main
```

---

## Ch 19 closeout — Phase 12 complete

Chapter 19 is now the nineteenth complete chapter on production. **Phase 12 (Inference) is now complete.** All three chapters published:

- ✅ Ch 17 (Inference Optimization)
- ✅ Ch 18 (Quantization)
- ✅ Ch 19 (Sampling)

**Phase 12 took 3 chapters × 4 files each = 12 files** (with absorbed slots for cadence consolidation). **The full inference-engineering arc is on production.**

Confirm before declaring Ch 19 and Phase 12 done:

- ✅ BUILD_ORDER.md shows files 109-112 ✅
- ✅ Ch 19 status is `'published'`
- ✅ Both Ch 19 widgets work in production
- ✅ All 4 Ch 19 exercises render with their starter code

**Cadence check across 19 chapters:**

**4-file cadence** holds for **14 single-topic chapters** (Ch 2, 3, 4, 6, 7, 10, 11, 12, 13, 15, 16, 17, 18, **19**).
**5-file cadence** holds for **5 two-topic chapters** (Ch 1, 5, 8, 9, 14).

**19-chapter pattern stable.**

**Phase 12 (Inference) summary:**

The full inference-engineering arc on production. Reader now understands:

1. **Ch 17 — Inference Optimization**: KV cache (~700× speedup), prefill vs decode phases, continuous batching, Flash Attention (memory-aware kernels), speculative decoding (Leviathan 2023), PagedAttention (vLLM)
2. **Ch 18 — Quantization**: INT8 with LLM.int8 outlier handling, INT4 + per-group, NF4 (the QLoRA format unpacked), GPTQ + AWQ (modern PTQ), activation quantization
3. **Ch 19 — Sampling**: greedy, temperature, top-k, top-p (modern default), repetition penalties, beam search, constrained decoding

**Combined: 10-20× throughput on the same hardware vs naive inference**, with full control over output behavior, with structured-output guarantees via FSM masking.

**What's next — Phase 13: Capabilities.** Where Phase 11 trained the model and Phase 12 made it deployable, Phase 13 makes it useful:
- **Ch 20**: Reasoning (CoT, deliberation, o1 / R1 reasoning models)
- **Ch 21**: Tool use (function calling, agents-as-libraries)
- **Ch 22**: Retrieval-augmented generation (RAG)
- **Ch 23**: Multimodal (vision-language models, audio)

After Phase 13, Phase 14 (Safety, Interpretability, Evaluation) and Phase 15 (Agents) complete the journey.

---

## Notes for the session author

**On the symbolic weight of closing Phase 12:**
This session isn't just closing a chapter — it's closing the entire inference-engineering arc. **The reader who reaches this point has the full toolkit** for deploying a trained model: fast forward passes (Ch 17), compact weights (Ch 18), controlled output (Ch 19). **Acknowledge that in the closeout.** The cadence retrospective and Phase 12 summary should feel like a milestone.

**On the FSM widget being the right pedagogical fit:**
Constrained decoding is conceptually clean: at each state, some tokens are valid; others aren't; the model samples from the masked subset. **The widget makes this visible** by walking through 10 generation steps for a small JSON grammar.

The 16-token vocabulary is hand-picked: a few JSON-structural tokens (`{`, `}`, `"`, `:`, `,`), a few keys (`name`, `age`), a few values (`Alice`, `Bob`, `25`, `30`, `true`, `null`), a few bracket tokens (`[`, `]`), and one obvious wrong-choice token (`random`). **The "random" token motivates the story**: without constraints, the model would pick it often; with constraints, it's masked.

**On the model's preferred vs constrained-chosen distinction:**
This is the widget's most important teaching device. At each step, the widget shows:
- **★ Model's preferred** (yellow badge): what the model would emit *without* constraints
- **✓ Chosen** (cyan ring): what gets emitted *with* constraints

When these differ — which is often — the widget tags it as "would break grammar!" in rose. **Reader sees the constraints earning their keep.**

**On the four exercises being a sampling-pipeline progression:**

| Ex | Difficulty | Topic | Outcome Hit |
|----|-----------|-------|-------------|
| 1 | easy | Greedy and temperature | 2 |
| 2 | medium | Top-p with adaptive nucleus | 3 |
| 3 | medium | Frequency repetition penalty | 5 |
| 4 | hard | FSM masking for JSON | 7 |

Each exercise builds on the previous. By the end, the reader has implemented the full sampling pipeline: from greedy at the simplest end, through nucleus + penalty for production chat, to FSM masking for constrained outputs.

**On Ex 4 being the chapter's most integrative exercise:**
FSM masking combines:
- Vocabulary management (which tokens are valid)
- State transitions (how the FSM advances)
- Logit masking (setting invalid tokens to -∞)
- Sampling from masked distribution

**Reader builds the entire constrained-decoding pipeline from scratch.** This is the chapter's "you understand it if you can implement it" exercise.

**On the exercises serving the 8 outcomes:**

| Outcome | Exercise |
|---|---|
| 1. Why sampling matters | (chapter prose) |
| 2. Temperature scaling | Ex 1 |
| 3. Top-k vs top-p | Ex 2 + marquee widget |
| 4. Combining strategies | (chapter prose + recipes table) |
| 5. Repetition penalties | Ex 3 |
| 6. Beam search | (chapter prose) |
| 7. Constrained decoding | Ex 4 + secondary widget |
| 8. Modern recipes | (chapter prose + recipes table) |

Outcomes 2, 3, 5, 7 served by exercises directly. Outcomes 1, 4, 6, 8 served by chapter prose and widgets.

**Pedagogical claim of the chapter (revisited):**
"Sampling is the post-forward-pass step that turns logits into emitted tokens. The algorithms are short; the impact is huge. Top-p (nucleus) is the modern default because it adapts to distribution shape. Production recipes vary by use case — chat ($T=0.7$, top-p=0.95), code ($T=0.2$), creative ($T=1.0-1.2$). Constrained decoding via FSM masking enables structured outputs for agents. The chapter's exercises lock in the mechanics (Ex 1 greedy/temperature, Ex 2 top-p, Ex 3 repetition penalty, Ex 4 FSM masking). **With Ch 19 complete, Phase 12 is complete and the full inference-engineering arc is in place.**"

**Phase 12 progress after this session**: Ch 17 ✅, Ch 18 ✅, **Ch 19 ✅. Phase 12 COMPLETE.**

**Phase 13 (Capabilities) opens next.** Four chapters: reasoning (Ch 20), tools (Ch 21), RAG (Ch 22), multimodal (Ch 23). After Phase 13, Phase 14 (Safety/Interp/Eval) and Phase 15 (Agents) complete the journey.

**This session closes the inference-engineering arc.** The reader who finishes here has everything they need to deploy a trained model in production. **Honor the moment in the closeout.**

Build with care.

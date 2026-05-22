# Session 34 — Quality filter widget + exercises + Ch 7 closeout

> Final Chapter 7 session. Three deliverables: the **QualityFilter** widget for section 5 (10 text samples with toggleable filter rules — length, language, repetition, classifier — and per-text pass/fail indicators), an **Exercises section** with 4 problems (MinHash, LSH banding, quality filter combination, decontamination), and the **status flip** from `'draft'` to `'published'`. Chapter 7 — the first non-architectural chapter — joins production.

---

## Read first (in this order)

1. **`research/ch07-pretraining-data/research.md`** — sections on quality filtering and decontamination are the reference
2. **`prompts/chapters/ch07-pretraining-data/session-32-page-structure.md`** — for the section-5 widget placeholder and where the Exercises section goes
3. **`prompts/chapters/ch07-pretraining-data/session-33-dedup-interactive-widget.md`** — for the widget conventions established by Ch 7's marquee (sample list + toggleable controls + summary line)
4. **`prompts/chapters/ch06-positional-encoding/session-30-rope-rotation-and-exercises.md`** — for the closeout template (exercises + status flip)

---

## Goal

By end of session:

1. **Section 5's `<WidgetFrame>` placeholder is filled** with `<QualityFilter client:visible />` — a widget showing 10 text samples and 4 toggleable filter rules; per-text pass/fail indicators update as filters are toggled
2. **An "Exercises" section is appended** to `index.mdx`, between section 8 ("Bridge — from corpus to model") and the final chapter close paragraph, containing 4 exercises with hints and runnable starter code
3. **Ch 7's status flips from `'draft'` to `'published'`** — Ch 7 is the seventh published chapter
4. **The chapter renders end-to-end as a complete deliverable**

After this session, Chapter 7 is the seventh complete chapter — the first non-architectural chapter — on production.

---

## Inputs

State of the repo after session 33:

- Section 4's marquee widget (`DedupInteractive`) is wired
- Section 5's widget is still stubbed
- `src/lib/chapters.ts` has Ch 1-6 `'published'`, Ch 7 `'draft'`

---

## Deliverables

1. **Create** `src/components/widgets/ch07/QualityFilter.tsx` — the React widget
2. **Create** `src/components/widgets/ch07/QualityFilter.module.css` — scoped styles
3. **Create** `src/components/widgets/ch07/quality-data.ts` — 10 text samples + hand-computed per-filter results
4. **Update** `src/components/widgets/index.ts` — add `QualityFilter` export
5. **Update** `src/pages/ch07-pretraining-data/index.mdx`:
   - Replace section 5's `<WidgetFrame>` interior with `<QualityFilter client:visible />`
   - Add new `## Exercises` section between section 8 and the final chapter close paragraph
6. **Update** `src/lib/chapters.ts` — change Ch 7's `status` from `'draft'` to `'published'`

---

## Detailed spec

### Part A — Quality Filter widget

#### A1. `quality-data.ts` — the data layer

Ten text samples spanning the quality spectrum, plus hand-computed filter results for each.

```ts
// src/components/widgets/ch07/quality-data.ts

export interface QualitySample {
  id: number;
  text: string;
  /** True quality category — for color coding, not algorithm. */
  trueCategory: 'clean' | 'spam' | 'repetitive' | 'short' | 'placeholder' | 'non-english';
  /** Per-filter results (hand-computed for pedagogical clarity). */
  filters: {
    lengthOk: boolean;       // length > 100 chars
    languageOk: boolean;     // > 60% ASCII letters
    repetitionOk: boolean;   // unique/total word ratio > 0.3
  };
  /** Quality classifier score in [0, 1] — higher is better. */
  qualityScore: number;
}

export const SAMPLES: QualitySample[] = [
  {
    id: 1,
    text: "A clear explanation of how photosynthesis converts sunlight into chemical energy used by plants on Earth for survival.",
    trueCategory: 'clean',
    filters: { lengthOk: true, languageOk: true, repetitionOk: true },
    qualityScore: 0.92,
  },
  {
    id: 2,
    text: "Tokyo is the capital of Japan and one of the most populous metropolitan areas in the world, home to over 37 million people.",
    trueCategory: 'clean',
    filters: { lengthOk: true, languageOk: true, repetitionOk: true },
    qualityScore: 0.89,
  },
  {
    id: 3,
    text: "the the the the the the the the the the the the the the the the the the the the the the the the the the the",
    trueCategory: 'repetitive',
    filters: { lengthOk: true, languageOk: true, repetitionOk: false },
    qualityScore: 0.04,
  },
  {
    id: 4,
    text: "buy buy buy BUY click here free shipping BUY NOW act now BUY BUY click here BUY",
    trueCategory: 'spam',
    filters: { lengthOk: false, languageOk: true, repetitionOk: false },   // 78 chars, fails length
    qualityScore: 0.08,
  },
  {
    id: 5,
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.",
    trueCategory: 'placeholder',
    filters: { lengthOk: true, languageOk: true, repetitionOk: true },
    qualityScore: 0.22,
  },
  {
    id: 6,
    text: "短いテキスト日本語のサンプル",
    trueCategory: 'non-english',
    filters: { lengthOk: false, languageOk: false, repetitionOk: true },
    qualityScore: 0.40,   // text quality unclear; classifier sees non-English chars
  },
  {
    id: 7,
    text: "Hi.",
    trueCategory: 'short',
    filters: { lengthOk: false, languageOk: true, repetitionOk: true },
    qualityScore: 0.30,
  },
  {
    id: 8,
    text: "Quantum entanglement is a phenomenon where particles become correlated such that the quantum state of each particle cannot be described independently.",
    trueCategory: 'clean',
    filters: { lengthOk: true, languageOk: true, repetitionOk: true },
    qualityScore: 0.95,
  },
  {
    id: 9,
    text: "FREE FREE FREE FREE FREE FREE CLICK HERE NOW NOW NOW WINNER WINNER CLICK CLICK WINNER FREE FREE",
    trueCategory: 'spam',
    filters: { lengthOk: true, languageOk: true, repetitionOk: false },
    qualityScore: 0.05,
  },
  {
    id: 10,
    text: "Photo: cat. Photo: cat. Photo: cat. Photo: cat. Photo: cat. Photo: cat. Photo: cat. Photo: cat.",
    trueCategory: 'repetitive',
    filters: { lengthOk: false, languageOk: true, repetitionOk: false },  // 96 chars, just under 100
    qualityScore: 0.10,
  },
];

/** Color for the true-category indicator. */
export function categoryColor(cat: QualitySample['trueCategory']): string {
  switch (cat) {
    case 'clean':       return 'var(--emerald-400)';
    case 'spam':        return 'var(--rose-400)';
    case 'repetitive':  return 'var(--amber-400)';
    case 'short':       return 'var(--text-tertiary)';
    case 'placeholder': return 'var(--violet-400)';
    case 'non-english': return 'var(--sky-400)';
  }
}

/** Filter categories enabled in the widget. */
export type FilterKey = 'length' | 'language' | 'repetition' | 'classifier';

/** Compute whether a sample passes the enabled filters. */
export function passesFilters(
  sample: QualitySample,
  enabled: Record<FilterKey, boolean>,
  classifierThreshold: number,
): { passes: boolean; perFilter: Record<FilterKey, boolean> } {
  const perFilter: Record<FilterKey, boolean> = {
    length: sample.filters.lengthOk,
    language: sample.filters.languageOk,
    repetition: sample.filters.repetitionOk,
    classifier: sample.qualityScore >= classifierThreshold,
  };
  const passes = (Object.keys(enabled) as FilterKey[]).every(
    f => !enabled[f] || perFilter[f]
  );
  return { passes, perFilter };
}

/** Number of samples that filter X *alone* would drop (others disabled). */
export function dropsAlone(filter: FilterKey, classifierThreshold: number): number {
  const isolated: Record<FilterKey, boolean> = { length: false, language: false, repetition: false, classifier: false };
  isolated[filter] = true;
  return SAMPLES.filter(s => !passesFilters(s, isolated, classifierThreshold).passes).length;
}
```

#### A2. Visual layout

```
┌────────────────────────────────────────────────────────────────────┐
│  Quality filters                                                   │
│                                                                    │
│  Enable filters:                                                   │
│   ☑ Length (>100 chars)      [drops 3 alone]                       │
│   ☑ Language (>60% ASCII)    [drops 1 alone]                       │
│   ☑ Repetition (unique>0.3)  [drops 3 alone]                       │
│   ☑ Classifier (score ≥ 0.5) [drops 6 alone]                       │
│                                                                    │
│  Classifier threshold: [────●────────] 0.50                        │
│                                                                    │
│  Result: 4 of 10 samples pass all enabled filters                  │
│                                                                    │
│  Samples:                                                          │
│  ┌────┬──────────────────────────────────────┬──────────────────┐ │
│  │ ID │ Text                                  │ L  Lg Rp Cl  ✓?  │ │
│  ├────┼──────────────────────────────────────┼──────────────────┤ │
│  │ 1  │ "A clear explanation of how photo..."│ ✓  ✓  ✓  ✓   ✓   │ │
│  │ 2  │ "Tokyo is the capital of Japan..."   │ ✓  ✓  ✓  ✓   ✓   │ │
│  │ 3  │ "the the the the the the the the..." │ ✓  ✓  ✗  ✗   ✗   │ │
│  │ 4  │ "buy buy buy BUY click here free..." │ ✗  ✓  ✗  ✗   ✗   │ │
│  │ 5  │ "Lorem ipsum dolor sit amet, conse..."│ ✓  ✓  ✓  ✗   ✗   │ │
│  │ 6  │ "短いテキスト日本語のサンプル"           │ ✗  ✗  ✓  ✗   ✗   │ │
│  │ 7  │ "Hi."                                 │ ✗  ✓  ✓  ✗   ✗   │ │
│  │ 8  │ "Quantum entanglement is a pheno..."  │ ✓  ✓  ✓  ✓   ✓   │ │
│  │ 9  │ "FREE FREE FREE FREE FREE CLICK..."   │ ✓  ✓  ✗  ✗   ✗   │ │
│  │ 10 │ "Photo: cat. Photo: cat. Photo:..."   │ ✗  ✓  ✗  ✗   ✗   │ │
│  └────┴──────────────────────────────────────┴──────────────────┘ │
│                                                                    │
│  Try: disable "Classifier" — see how many more samples pass        │
│  (and how some obvious junk slips through with just heuristics)    │
└────────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Toggle individual filters → table updates per-cell + final pass column + summary line
- Move classifier threshold slider → "Cl" column and final pass column update
- Hover any sample row → highlight that row

#### A3. `QualityFilter.tsx`

```tsx
import { useState, useMemo } from 'react';
import {
  SAMPLES, type FilterKey, passesFilters, dropsAlone, categoryColor,
} from './quality-data';
import styles from './QualityFilter.module.css';

const DEFAULT_ENABLED: Record<FilterKey, boolean> = {
  length: true,
  language: true,
  repetition: true,
  classifier: true,
};

const DEFAULT_CLASSIFIER_THRESHOLD = 0.5;

const FILTER_LABELS: Record<FilterKey, { short: string; full: string }> = {
  length:     { short: 'L',  full: 'Length (>100 chars)' },
  language:   { short: 'Lg', full: 'Language (>60% ASCII letters)' },
  repetition: { short: 'Rp', full: 'Repetition (unique/total > 0.3)' },
  classifier: { short: 'Cl', full: 'Quality classifier' },
};

export default function QualityFilter() {
  const [enabled, setEnabled] = useState(DEFAULT_ENABLED);
  const [threshold, setThreshold] = useState(DEFAULT_CLASSIFIER_THRESHOLD);

  // Per-sample results
  const results = useMemo(
    () => SAMPLES.map(s => ({ sample: s, ...passesFilters(s, enabled, threshold) })),
    [enabled, threshold]
  );

  const keptCount = results.filter(r => r.passes).length;

  function toggleFilter(key: FilterKey) {
    setEnabled(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function reset() {
    setEnabled(DEFAULT_ENABLED);
    setThreshold(DEFAULT_CLASSIFIER_THRESHOLD);
  }

  return (
    <div className={styles.widget}>
      {/* Filter toggles */}
      <div className={styles.panelTitle}>Enable filters</div>
      <div className={styles.toggleList}>
        {(Object.keys(FILTER_LABELS) as FilterKey[]).map(key => (
          <label key={key} className={styles.toggleRow}>
            <input
              type="checkbox"
              checked={enabled[key]}
              onChange={() => toggleFilter(key)}
              className={styles.checkbox}
            />
            <span className={styles.toggleLabel}>{FILTER_LABELS[key].full}</span>
            <span className={styles.dropsAlone}>
              [drops {dropsAlone(key, threshold)} alone]
            </span>
          </label>
        ))}
      </div>

      {/* Classifier threshold (only meaningful if classifier filter enabled) */}
      <div className={styles.thresholdRow}>
        <label className={styles.controlLabel}>
          Classifier threshold: <span className={styles.controlValue}>{threshold.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={threshold}
          onChange={e => setThreshold(Number(e.target.value))}
          className={styles.slider}
          aria-label="Classifier threshold"
          disabled={!enabled.classifier}
        />
        <button onClick={reset} className={styles.resetButton}>Reset</button>
      </div>

      {/* Summary */}
      <div className={styles.summary}>
        Result: <strong>{keptCount}</strong> of {SAMPLES.length} samples pass all enabled filters
        {keptCount === 0 && <span className={styles.summaryWarn}> (none pass — try loosening)</span>}
      </div>

      {/* Samples table */}
      <div className={styles.panelTitle}>Samples</div>
      <div className={styles.table}>
        {/* Header */}
        <div className={styles.tableHeader}>
          <div className={styles.colId}>ID</div>
          <div className={styles.colText}>Text</div>
          {(Object.keys(FILTER_LABELS) as FilterKey[]).map(key => (
            <div key={key} className={`${styles.colFilter} ${!enabled[key] ? styles.colDisabled : ''}`} title={FILTER_LABELS[key].full}>
              {FILTER_LABELS[key].short}
            </div>
          ))}
          <div className={styles.colPass}>Pass?</div>
        </div>

        {/* Rows */}
        {results.map(({ sample, passes, perFilter }) => (
          <div key={sample.id} className={`${styles.tableRow} ${passes ? styles.rowPasses : styles.rowFails}`}>
            <div className={styles.colId}>
              <span
                className={styles.catIndicator}
                style={{ backgroundColor: categoryColor(sample.trueCategory) }}
                title={`Category: ${sample.trueCategory}`}
              />
              {sample.id}
            </div>
            <div className={styles.colText} title={sample.text}>
              {sample.text.length > 50 ? sample.text.slice(0, 50) + '…' : sample.text}
            </div>
            {(Object.keys(FILTER_LABELS) as FilterKey[]).map(key => (
              <div key={key} className={`${styles.colFilter} ${!enabled[key] ? styles.colDisabled : ''}`}>
                {perFilter[key] ? <span className={styles.passMark}>✓</span> : <span className={styles.failMark}>✗</span>}
              </div>
            ))}
            <div className={`${styles.colPass} ${passes ? styles.passText : styles.failText}`}>
              {passes ? '✓' : '✗'}
            </div>
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <div className={styles.footerHint}>
        Try disabling individual filters to see what each catches alone. Quality classifier is the most aggressive — without it, some obvious junk (placeholders, mild spam) slips through heuristics.
      </div>
    </div>
  );
}
```

#### A4. `QualityFilter.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.panelTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin: 1rem 0 0.5rem;
  font-weight: 500;
}
.panelTitle:first-child { margin-top: 0; }

.toggleList {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0.75rem;
}
.toggleRow {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
}
.checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--cyan-500);
  cursor: pointer;
}
.toggleLabel { color: var(--text-secondary); flex: 1; }
.dropsAlone {
  font-size: 0.7rem;
  color: var(--text-tertiary);
  font-style: italic;
}

.thresholdRow {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin: 0.85rem 0;
}
.controlLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  white-space: nowrap;
  min-width: 200px;
}
.controlValue { color: var(--cyan-300); font-weight: 500; }
.slider { flex: 1; }
.slider:disabled { opacity: 0.4; }
.resetButton {
  padding: 0.4rem 0.85rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.76rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.resetButton:hover { color: var(--cyan-300); border-color: var(--cyan-500); }

.summary {
  padding: 0.65rem 0.9rem;
  background: color-mix(in srgb, var(--cyan-500) 8%, transparent);
  border: 1px solid var(--cyan-500);
  border-radius: var(--radius-sm);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}
.summary strong { color: var(--cyan-300); }
.summaryWarn { color: var(--amber-400); margin-left: 0.5rem; }

.table {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.tableHeader,
.tableRow {
  display: grid;
  grid-template-columns: 60px 1fr 36px 36px 36px 36px 50px;
  gap: 0;
  align-items: center;
  padding: 0.45rem 0.6rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
}
.tableHeader {
  background: var(--bg-primary);
  color: var(--text-tertiary);
  font-size: 0.72rem;
  border-bottom: 1px solid var(--border-default);
}
.tableRow {
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
  transition: background 100ms;
}
.tableRow:last-child { border-bottom: none; }
.tableRow:hover { background: var(--bg-primary); }
.rowPasses { /* base styling */ }
.rowFails { opacity: 0.7; }

.colId {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.catIndicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.colText { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 0.5rem; font-size: 0.74rem; }
.colFilter { text-align: center; font-size: 0.82rem; }
.colDisabled { opacity: 0.3; }
.colPass { text-align: center; font-size: 1rem; font-weight: 500; }

.passMark { color: var(--emerald-400); }
.failMark { color: var(--rose-400); }
.passText { color: var(--emerald-400); }
.failText { color: var(--rose-400); }

.footerHint {
  margin-top: 0.85rem;
  font-size: 0.78rem;
  color: var(--text-tertiary);
  font-style: italic;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .tableHeader,
  .tableRow {
    grid-template-columns: 40px 1fr 28px 28px 28px 28px 40px;
    font-size: 0.7rem;
  }
  .colText { font-size: 0.68rem; }
  .thresholdRow { flex-wrap: wrap; }
}
```

#### A5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as DedupInteractive } from './ch07/DedupInteractive';
export { default as QualityFilter } from './ch07/QualityFilter';
```

#### A6. Update `index.mdx` — section 5 widget

```mdx
import { DedupInteractive, QualityFilter } from '@components/widgets';
```

```mdx
<WidgetFrame title="Quality filters" caption="Ten text samples spanning the quality spectrum. Toggle each filter (length, language, repetition, classifier) on or off to see which samples are kept. The 'drops alone' count shows how many samples that filter would catch by itself — informative for seeing what each filter catches that others miss.">
  <QualityFilter client:visible />
</WidgetFrame>
```

### Part B — Exercises section

Insert between section 8 ("Bridge — from corpus to model") and the final chapter close paragraph:

````mdx
## Exercises

The exercises build on the chapter. Each is a self-contained problem with a starting template. Hints are collapsed by default — try the problem first.

### Exercise 1 (medium) — Implement MinHash and verify the Jaccard estimate

Implement MinHash from scratch and verify its accuracy as a Jaccard similarity estimator. Compare the MinHash estimate to true Jaccard for several pairs of documents; verify the standard error decreases with more hash functions (k).

<details>
<summary>Hint</summary>

A MinHash function is parameterized by random coefficients `a, b` and a prime `p`: `h(x) = (a*x + b) mod p`. For `k` hash functions, generate `k` independent (a, b) pairs. The signature of a document is the min hash value over its shingle set for each hash function. Estimate Jaccard as the fraction of matching signature positions.

</details>

<RunnableCode
  client:visible
  defaultCode={`import hashlib
import numpy as np

def shingle(text, k=5):
    return {text[i:i+k] for i in range(len(text) - k + 1)} if len(text) >= k else {text}

def true_jaccard(a, b):
    return len(a & b) / len(a | b)

def minhash_signature(shingles, num_hashes=200, seed=42):
    # TODO: implement
    # 1. Generate num_hashes random (a, b) coefficient pairs
    # 2. For each shingle: hash with MD5, take first 16 hex chars as integer x
    # 3. For each of num_hashes hash functions: compute (a*x + b) mod p where p = 2^61 - 1
    # 4. Track per-function minimum across all shingles
    pass

def estimate_jaccard(sig_a, sig_b):
    # TODO: return fraction of matching positions
    pass

# Verify
text_a = "The capital of France is Paris."
text_b = "The capital of France is paris."
text_c = "Quantum mechanics is hard."

# shingles_a = shingle(text_a); shingles_b = shingle(text_b); shingles_c = shingle(text_c)
# sig_a = minhash_signature(shingles_a); sig_b = minhash_signature(shingles_b); sig_c = minhash_signature(shingles_c)

# print(f"True J(a,b) = {true_jaccard(shingles_a, shingles_b):.3f}")
# print(f"MinHash J(a,b) ≈ {estimate_jaccard(sig_a, sig_b):.3f}")
# print(f"True J(a,c) = {true_jaccard(shingles_a, shingles_c):.3f}")
# print(f"MinHash J(a,c) ≈ {estimate_jaccard(sig_a, sig_c):.3f}")

# Standard error should be ≈ 1/sqrt(num_hashes)
# Try with num_hashes = 50 vs 500 — error should be smaller with more hashes
`}
  packages={["numpy"]}
/>

### Exercise 2 (medium) — LSH banding S-curve

Implement LSH banding: divide a MinHash signature into `b` bands of `r` rows, hash each band, and use bucket collisions to find candidate near-duplicates. Plot the S-curve: probability of being a candidate vs true similarity, for several choices of `(b, r)`.

<details>
<summary>Hint</summary>

For chosen (b, r), the probability that two documents become candidates given true similarity `s` is approximately `1 - (1 - s^r)^b`. This is an S-curve — flat near 0 for low similarity, sharp transition near `s ≈ (1/b)^(1/r)`, flat near 1 for high similarity. Plot the curve for (b=50, r=4), (b=20, r=10), and (b=100, r=2) to see how (b, r) shapes the cutoff.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def lsh_candidate_prob(similarity, b, r):
    """Probability of being an LSH candidate at given true Jaccard similarity."""
    # TODO: implement P = 1 - (1 - s^r)^b
    pass

# Plot S-curves for several (b, r) choices
similarities = np.linspace(0, 1, 50)

configs = [
    (50, 4),    # transition near s ≈ 0.38
    (20, 10),   # transition near s ≈ 0.74
    (100, 2),   # transition near s ≈ 0.10
]

print(f"{'sim':>5} {'(50,4)':>8} {'(20,10)':>8} {'(100,2)':>8}")
print("-" * 32)
for s in [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]:
    # row = [lsh_candidate_prob(s, b, r) for b, r in configs]
    # print(f"{s:>5.2f} {row[0]:>8.3f} {row[1]:>8.3f} {row[2]:>8.3f}")
    pass

# Interpretation:
# - (50, 4) — good for finding moderately similar pairs (threshold ~0.4)
# - (20, 10) — only finds very similar pairs (threshold ~0.74)
# - (100, 2) — too permissive — flags weakly similar as candidates
`}
  packages={["numpy"]}
/>

### Exercise 3 (medium) — Build a multi-filter quality pipeline

Combine multiple quality heuristics (length, language, repetition, profanity) into a single pipeline. Apply to a small corpus; report per-filter rejection counts and the final kept set.

<details>
<summary>Hint</summary>

Each filter is a function `Document -> bool`. Compose them: a document passes the pipeline if it passes *all* filters. Track per-filter rejection counts to identify which filter does the most work. In practice, you'd order filters cheapest-first (length check before classifier inference).

</details>

<RunnableCode
  client:visible
  defaultCode={`def length_filter(text, min_len=100, max_len=10000):
    return min_len < len(text) < max_len

def language_filter(text, min_ascii_ratio=0.6):
    if not text:
        return False
    ascii_letters = sum(1 for c in text if c.isascii() and c.isalpha())
    return ascii_letters / len(text) > min_ascii_ratio

def repetition_filter(text, min_unique_ratio=0.3):
    words = text.split()
    if not words:
        return False
    return len(set(words)) / len(words) > min_unique_ratio

def profanity_filter(text, profanity_words={'spam', 'click', 'buy', 'free', 'now'}):
    """Drop documents with too high profanity/spam-word density."""
    words = text.lower().split()
    if not words:
        return False
    profanity_count = sum(1 for w in words if w in profanity_words)
    return profanity_count / len(words) < 0.3

def quality_pipeline(text):
    """Return (passes, per_filter_results)."""
    # TODO: run all 4 filters
    # TODO: return overall pass status + dict of which each filter said
    pass

# Test corpus
corpus = [
    "A normal sentence about training data quality and pretraining.",
    "buy buy buy click here free now click click click",
    "短いテキスト",
    "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore.",
    "the the the the the the the the the the the the the the",
    "Quantum entanglement is a phenomenon where particles share correlated quantum states.",
]

# TODO: apply pipeline to each, count per-filter rejections, print summary
`}
  packages={[]}
/>

### Exercise 4 (hard) — Decontamination and its limitations

Implement n-gram-based decontamination: given benchmark text, identify training documents containing matching n-grams. Then demonstrate the limitation: paraphrased versions of the benchmark question slip through.

<details>
<summary>Hint</summary>

Build a set of all `n`-grams (default n=13 words) from the benchmark text. For each training document, compute its n-gram set and check for intersection. To demonstrate the limitation: paraphrase the benchmark question (rearrange words, substitute synonyms) and verify the paraphrased version doesn't match the original's n-gram fingerprints.

</details>

<RunnableCode
  client:visible
  defaultCode={`def ngrams(text, n=13):
    """Word-level n-grams."""
    words = text.split()
    if len(words) < n:
        return {tuple(words)}
    return {tuple(words[i:i+n]) for i in range(len(words) - n + 1)}

def contains_benchmark(doc, benchmark_ngrams, n=13):
    """Check if doc contains any n-gram from benchmark."""
    return len(ngrams(doc, n) & benchmark_ngrams) > 0

# Original benchmark question
benchmark = "What is the chemical symbol for gold ? Answer : The chemical symbol for gold is Au"
benchmark_ngrams_set = ngrams(benchmark, n=13)

# Training corpus — some clean, some contaminated, some paraphrased
training_docs = [
    "Gold is a precious metal used in jewelry for thousands of years.",                          # safe
    "What is the chemical symbol for gold ? Answer : The chemical symbol for gold is Au — atomic number 79.",  # contaminated (exact)
    "The chemical symbol for gold, denoted Au from Latin 'aurum', appears on the periodic table.",  # PARAPHRASE
]

# TODO: check each document against benchmark
# Expected: doc 0 = safe; doc 1 = contaminated; doc 2 = MISSED (paraphrase)

# After: explain why the paraphrase wasn't caught
# - Different word order
# - "denoted Au from Latin 'aurum'" vs "the chemical symbol for gold is Au"
# - Even though semantically equivalent, the 13-gram overlap is zero
`}
  packages={[]}
/>
````

### Part C — Flip Ch 7's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 7, slug: 'ch07-pretraining-data', title: 'Pre-training data', partNum: 3, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 5 of Ch 7** renders with the working `QualityFilter` widget. Section 4's marquee still works.
3. **Default state:** all 4 filters enabled, threshold = 0.5. Summary shows "4 of 10 samples pass" (samples 1, 2, 8, and possibly 5 depending on classifier threshold). Verify the exact count by walking through `passesFilters` for the default settings.
4. **Filter toggles work:** unchecking a filter immediately updates per-cell indicators (the toggled column dims), pass column, and summary.
5. **Classifier threshold slider:** dragging the slider updates the "Cl" column and pass column. At threshold 0.0, classifier passes everything; at 1.0, classifier passes nothing.
6. **"Drops alone" counts** update correctly as the classifier threshold changes (only affects the classifier's drops-alone count).
7. **Per-row category indicators:** each sample shows a colored dot for its true category (emerald for clean, rose for spam, amber for repetitive, etc.).
8. **The Exercises section** is below section 8 and above the chapter close paragraph; contains 4 sub-exercises with collapsible hints and runnable starter code.
9. **Sidebar:** Ch 1-7 all active (published); Ch 8-30 still dimmed.
10. **Landing page CTA:** still reads "Start with Chapter 1 →".
11. **Prev/next at bottom of Ch 7:** prev = Ch 6 (active); next = Ch 8 (disabled).
12. **TOC on Ch 7** includes Exercises as h2 plus 4 h3 sub-entries.
13. **Mobile:** table column widths shrink; text gets truncated with ellipsis; checkboxes still tappable.
14. **`npm run typecheck`** passes.
15. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not implement live filter computation.** The per-sample filter results are hand-computed and stored in `quality-data.ts`. The chapter's section 5 has the `<RunnableCode>` for the actual filter logic.
- ❌ **Do not let the user edit samples.** Fixed 10 samples.
- ❌ **Do not add additional filters beyond the 4.** Length, language, repetition, classifier — chapter scope.
- ❌ **Do not provide exercise solutions.** Hints only.
- ❌ **Do not flip any other chapter's status.** Only Ch 7 flips.
- ❌ **Do not modify Ch 1-6.** Sealed.

---

## Wire-up

```bash
git add src/components/widgets/ch07/QualityFilter.tsx src/components/widgets/ch07/QualityFilter.module.css src/components/widgets/ch07/quality-data.ts src/components/widgets/index.ts src/lib/chapters.ts src/pages/ch07-pretraining-data/index.mdx
git commit -m "session 34: quality filter widget + Ch 7 exercises + status: published"
git push origin main
```

After deploy:
- Both Ch 7 widgets work
- All 4 exercises render with working starter code
- Sidebar shows Ch 1-7 active

---

## Ch 7 closeout

Chapter 7 is now the seventh complete chapter on production. **The first non-architectural chapter — the transition from "what is the model" to "how do we train it" — is complete.**

Confirm before declaring Ch 7 done:

- ✅ BUILD_ORDER.md shows files 43-46 ✅
- ✅ File 47 marked ⏭️ (absorbed)
- ✅ Ch 7 status is `'published'`
- ✅ Both Ch 7 widgets work in production
- ✅ All 4 Ch 7 exercises render
- ✅ Ch 7 total word count is in the 4500-5500 range

**Cadence check across 7 chapters:**

| Chapter | Topic shape | Widgets | Files |
|---|---|---|---|
| Ch 1 | Math + code-heavy | 3 | 5 |
| Ch 2 | Concept-heavy | 2 | 4 |
| Ch 3 | Algorithm-heavy | 2 | 4 |
| Ch 4 | Math + visual-heavy | 2 | 4 |
| Ch 5 | Two-topic | 2 | 5 |
| Ch 6 | Variants | 2 | 4 |
| Ch 7 | Data engineering | 2 | 4 |

The 4-file cadence remains stable. Ch 7 fits it cleanly despite being the first non-mathematical chapter — the topic structure (one main topic + sub-areas + variants) is similar to Ch 6.

---

## Notes for the session author

**On hand-computed filter results:**
The per-sample filter results in `quality-data.ts` are hand-set, not computed at widget runtime. This is for pedagogical clarity — the values are deterministic, the test passes are visually identifiable, and the chapter prose's `<RunnableCode>` in section 5 covers the actual filter implementation. The widget shows *what filters produce*; the runnable shows *how filters work*.

**On choosing the 10 samples:**
Each sample represents a category of real-world quality issue:
- Sample 1, 2, 8: clean — high quality
- Sample 3, 10: repetitive — pass length but fail repetition
- Sample 4, 9: spam — fail multiple
- Sample 5: placeholder (Lorem ipsum) — passes heuristics but fails classifier (subtle case)
- Sample 6: non-English — fails length AND language
- Sample 7: too short — fails length

Sample 5 (placeholder) is pedagogically interesting: it passes all *heuristic* filters (length, language, repetition) but fails the classifier. Demonstrates the value of classifiers — heuristics alone miss this.

**On the "drops alone" count:**
This is the count of samples that filter X *alone* would drop (with all other filters disabled). It's pedagogically valuable because it shows what each filter catches independently. A filter that drops 0 alone is useless; a filter that drops everything alone is too aggressive. The interesting filters are those that catch unique cases.

**On the classifier threshold:**
The slider lets the user dial the classifier from "very lenient" (threshold 0.0, accepts all) to "very strict" (threshold 1.0, accepts nothing). The default 0.5 is a reasonable middle ground. Watching the kept count change with threshold makes the trade-off visceral: low threshold = high recall, more junk; high threshold = high precision, more loss.

**On the "rowFails" dim styling:**
Failed rows are at 70% opacity. Visible but de-emphasized. The reader's attention is drawn to the passing rows (the "kept set") while still being able to inspect why the failed rows failed.

**On the 4 exercises:**
- Exercise 1 (MinHash) — the chapter's central algorithm. Reader implements and verifies.
- Exercise 2 (LSH S-curve) — extends MinHash to LSH; reader computes the S-curve for several (b, r) configurations and sees the trade-off.
- Exercise 3 (multi-filter pipeline) — composes the heuristic filters into a real pipeline. Practical engineering exercise.
- Exercise 4 (decontamination + paraphrase miss) — the hardest exercise. The pedagogical reveal: n-gram-based decontamination misses paraphrases. The exercise *demonstrates* the chapter's MC6 ("decontamination is solved" — wrong).

**Pedagogical claim this widget supports:** "Quality filtering combines multiple rules; some catch specific failure modes others miss. Heuristic filters are cheap and obvious; classifiers are more expensive but catch subtle cases (like placeholder text) that heuristics miss. The kept set is the intersection of all filters' pass sets." After 30 seconds of toggling, the reader should viscerally understand that quality filtering is *composition*, not any single rule.

Chapter 7 is now complete — the first chapter of training-side material. Next: Ch 8 (Building a small LLM) — the actual training loop on this corpus.

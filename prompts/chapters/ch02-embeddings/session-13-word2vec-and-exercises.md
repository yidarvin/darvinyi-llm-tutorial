# Session 13 — Word2vec dynamics widget + exercises + Ch 2 closeout

> Final Chapter 2 session. Three deliverables: the **Word2VecDynamics** widget for section 4 (a 15-word corpus trained with skip-gram negative sampling in 2D, animated through training so the reader watches positive pairs converge and negative pairs separate), an **Exercises section** at chapter end with 4 problems, and the **status flip** from `'draft'` to `'published'`. **End of Phase 4.**

---

## Read first (in this order)

1. **`research/ch02-embeddings/research.md`** — for the SGNS objective (Derivation 1) and the toy skip-gram code
2. **`prompts/chapters/ch02-embeddings/session-11-page-structure.md`** — for the section-4 widget placeholder and where the Exercises section goes
3. **`prompts/chapters/ch02-embeddings/session-12-embedding-space-widget.md`** — for the widget conventions established by Ch 2's marquee
4. **`prompts/chapters/ch01-neural-net-primitives/session-10-autograd-and-exercises.md`** — for the chapter-closeout template (Ch 1's exact analogue of this session)
5. **`src/lib/seeded-prng.ts`** — for `mulberry32` and `randNormal`; this widget uses them for deterministic initial weights

---

## Goal

By end of session:

1. **Section 4's `<WidgetFrame>` placeholder is filled** with `<Word2VecDynamics client:visible />` — an animated 2D training visualization showing skip-gram negative sampling dynamics over ~200 training steps
2. **An "Exercises" section is appended** to `index.mdx`, between section 8 and the chapter close, containing 4 exercises with hints and starter `<RunnableCode>` blocks
3. **Ch 2's `status` flips from `'draft'` to `'published'`** — adding the second published chapter to the site (sidebar shows Ch 1 + Ch 2 active; the landing CTA still points to Ch 1 as the first published chapter)
4. **The chapter renders end-to-end as a complete deliverable**

After this session, Chapter 2 is the second complete chapter on production. Phase 4 closes.

---

## Inputs

State of the repo after session 12:

- `src/components/widgets/ch02/EmbeddingSpace.{tsx,module.css}` and `embedding-data.ts` exist (session 12)
- `src/components/widgets/index.ts` exports `EmbeddingSpace`
- Section 5's marquee widget is wired in `index.mdx`
- Section 4's widget is still stubbed
- `src/lib/chapters.ts` has Ch 1 as `'published'`, Ch 2 as `'draft'`, others `'planned'`

---

## Deliverables

1. **Create** `src/components/widgets/ch02/Word2VecDynamics.tsx` — the React widget
2. **Create** `src/components/widgets/ch02/Word2VecDynamics.module.css` — scoped styles
3. **Create** `src/components/widgets/ch02/word2vec-training.ts` — the SGNS training simulation (pure data)
4. **Update** `src/components/widgets/index.ts` — add `Word2VecDynamics` export
5. **Update** `src/pages/ch02-embeddings/index.mdx`:
   - Replace section 4's `<WidgetFrame>` interior with `<Word2VecDynamics client:visible />`
   - Add new `## Exercises` section between section 8 (closing) and the final chapter close paragraph
6. **Update** `src/lib/chapters.ts` — change Ch 2's `status` from `'draft'` to `'published'`

---

## Detailed spec

### Part A — `word2vec-training.ts` (data layer)

A 15-word toy corpus with three clear categories. Skip-gram negative sampling trained in 2D directly (so the 2D positions are themselves the trained embeddings — no projection step needed). Pre-computed at component mount; the widget animates through saved snapshots.

```ts
// src/components/widgets/ch02/word2vec-training.ts

import { seededPRNG, randNormal } from '@lib/seeded-prng';

export type WordCategory = 'animal' | 'vehicle' | 'food';

export interface WordInfo {
  word: string;
  category: WordCategory;
}

// 15 words; 4 animals, 4 vehicles, 4 foods, plus 3 connector verbs
// The connector verbs co-occur with all categories, so they don't cleanly cluster
export const VOCAB: WordInfo[] = [
  { word: 'cat',    category: 'animal' },
  { word: 'dog',    category: 'animal' },
  { word: 'fish',   category: 'animal' },
  { word: 'bird',   category: 'animal' },
  { word: 'car',    category: 'vehicle' },
  { word: 'truck',  category: 'vehicle' },
  { word: 'boat',   category: 'vehicle' },
  { word: 'plane',  category: 'vehicle' },
  { word: 'pizza',  category: 'food' },
  { word: 'salad',  category: 'food' },
  { word: 'soup',   category: 'food' },
  { word: 'bread',  category: 'food' },
  // Connectors that co-occur across categories — they shouldn't cluster
  { word: 'liked',  category: 'animal' as WordCategory },  // arbitrary; coloring N/A
  { word: 'saw',    category: 'animal' as WordCategory },
  { word: 'wanted', category: 'animal' as WordCategory },
];

// Mini-corpus: each line is a 3-word "sentence." Skip-gram pairs are built
// from co-occurrence within each line.
const CORPUS_LINES: string[][] = [
  ['cat',   'liked',  'fish'],
  ['cat',   'wanted', 'fish'],
  ['dog',   'liked',  'bread'],
  ['dog',   'saw',    'cat'],
  ['fish',  'liked',  'soup'],
  ['bird',  'liked',  'bread'],
  ['bird',  'saw',    'cat'],
  ['cat',   'liked',  'salad'],
  ['dog',   'wanted', 'pizza'],

  ['car',   'liked',  'truck'],
  ['truck', 'saw',    'car'],
  ['boat',  'liked',  'plane'],
  ['plane', 'saw',    'boat'],
  ['car',   'wanted', 'truck'],
  ['truck', 'liked',  'plane'],

  ['pizza', 'liked',  'salad'],
  ['salad', 'wanted', 'soup'],
  ['soup',  'liked',  'bread'],
  ['bread', 'saw',    'pizza'],
  ['pizza', 'liked',  'bread'],
];

// Hyperparameters (calibrated so 200 steps produce visible clustering)
const DIM = 2;             // embedding dim — 2 so we can visualize directly
const TOTAL_STEPS = 200;
const SNAPSHOT_EVERY = 5;  // 40 snapshots total
const K = 3;               // negatives per positive
const LR = 0.05;

export interface TrainingSnapshot {
  step: number;
  positions: number[][];   // length V; each entry [x, y]
}

export interface TrainingTrace {
  vocab: WordInfo[];
  snapshots: TrainingSnapshot[];   // includes step 0 and final
}

// Helper: 1 / (1 + e^{-x}) with clipping for numerical stability
function sigmoid(x: number): number {
  if (x > 30) return 1;
  if (x < -30) return 0;
  return 1 / (1 + Math.exp(-x));
}

export function computeTrainingTrace(): TrainingTrace {
  const V = VOCAB.length;
  const wordToId: Record<string, number> = {};
  for (let i = 0; i < V; i++) wordToId[VOCAB[i]!.word] = i;

  // Initialize two embedding matrices (input/center and output/context)
  const initRng = seededPRNG(7);
  const U: number[][] = Array.from({ length: V }, () => [randNormal(initRng) * 0.5, randNormal(initRng) * 0.5]);
  const W: number[][] = Array.from({ length: V }, () => [randNormal(initRng) * 0.5, randNormal(initRng) * 0.5]);

  // Build all positive (center, context) pairs from the corpus
  // Within each sentence, every pair of distinct words is a co-occurrence
  const pairs: [number, number][] = [];
  for (const line of CORPUS_LINES) {
    for (let i = 0; i < line.length; i++) {
      for (let j = 0; j < line.length; j++) {
        if (i !== j) {
          pairs.push([wordToId[line[i]!]!, wordToId[line[j]!]!]);
        }
      }
    }
  }

  // Noise distribution: unigram^0.75
  const counts = new Array(V).fill(0);
  for (const [a, b] of pairs) { counts[a]++; counts[b]++; }
  const counts075 = counts.map(c => Math.pow(c, 0.75));
  const totalC = counts075.reduce((a, b) => a + b, 0);
  const noise = counts075.map(c => c / totalC);
  const noiseCum = noise.reduce<number[]>((acc, p, i) => { acc.push((acc[i-1] ?? 0) + p); return acc; }, []);

  function sampleNegative(rng: () => number, excludeIds: Set<number>): number {
    for (let tries = 0; tries < 20; tries++) {
      const r = rng();
      let lo = 0, hi = V - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (noiseCum[mid]! < r) lo = mid + 1; else hi = mid;
      }
      if (!excludeIds.has(lo)) return lo;
    }
    return Math.floor(rng() * V);
  }

  // Training rng — separate seed so reordering of pairs is deterministic
  const trainRng = seededPRNG(42);

  // Helper: produce snapshot of current U (just U; W is auxiliary)
  const snapshot = (step: number): TrainingSnapshot => ({
    step,
    positions: U.map(row => [row[0]!, row[1]!]),
  });

  const snapshots: TrainingSnapshot[] = [snapshot(0)];

  // Shuffled list of pair indices; rebuild each "epoch"
  const indices = pairs.map((_, i) => i);

  for (let step = 1; step <= TOTAL_STEPS; step++) {
    // Pick a random positive pair
    const pairIdx = Math.floor(trainRng() * indices.length);
    const [wId, cId] = pairs[indices[pairIdx]!]!;
    const u = U[wId]!;
    const v = W[cId]!;
    const exclude = new Set<number>([wId, cId]);

    // Sample k negatives
    const negIds: number[] = [];
    for (let n = 0; n < K; n++) {
      negIds.push(sampleNegative(trainRng, exclude));
    }

    // Forward
    const posLogit = u[0]! * v[0]! + u[1]! * v[1]!;
    const negLogits = negIds.map(nid => u[0]! * W[nid]![0]! + u[1]! * W[nid]![1]!);

    // Gradients
    const posGrad = sigmoid(posLogit) - 1;
    const negGrads = negLogits.map(l => sigmoid(l));

    // Gradient w.r.t. u
    let gU0 = posGrad * v[0]!;
    let gU1 = posGrad * v[1]!;
    for (let n = 0; n < K; n++) {
      gU0 += negGrads[n]! * W[negIds[n]!]![0]!;
      gU1 += negGrads[n]! * W[negIds[n]!]![1]!;
    }

    // Gradient w.r.t. v
    const gV0 = posGrad * u[0]!;
    const gV1 = posGrad * u[1]!;

    // Gradient w.r.t. each neg w
    const gNegs = negIds.map(nid => [negGrads[negIds.indexOf(nid)]! * u[0]!, negGrads[negIds.indexOf(nid)]! * u[1]!]);

    // SGD updates
    u[0]! -= LR * gU0;
    u[1]! -= LR * gU1;
    v[0]! -= LR * gV0;
    v[1]! -= LR * gV1;
    for (let n = 0; n < K; n++) {
      W[negIds[n]!]![0]! -= LR * gNegs[n]![0]!;
      W[negIds[n]!]![1]! -= LR * gNegs[n]![1]!;
    }

    if (step % SNAPSHOT_EVERY === 0) snapshots.push(snapshot(step));
  }

  return { vocab: VOCAB, snapshots };
}

export function computeTraceForRange() {
  return {
    totalSteps: TOTAL_STEPS,
    snapshotEvery: SNAPSHOT_EVERY,
    expectedSnapshots: Math.floor(TOTAL_STEPS / SNAPSHOT_EVERY) + 1,
  };
}
```

**Notes:**
- Training in 2D directly is unusual for production word2vec (which uses 100-300 dims), but for *visualization* of dynamics, 2D is ideal — no projection step, no axis-flip ambiguity, the positions on screen ARE the embeddings. The chapter prose already established that real word2vec uses high dimensions; this widget shows the dynamics in a maximally legible form.
- The corpus has 9 animal-sentences, 6 vehicle-sentences, 5 food-sentences. After training, animals, vehicles, and foods should cluster; the connector words (liked, saw, wanted) end up somewhere in the middle — co-occurring with everything, so not cleanly clustered.
- All 200 training steps + 41 snapshots compute in < 50ms on modern hardware. No need for a sustained loading state, though a brief one keeps the UI honest.

### Part B — Visual layout

```
ViewBox: 0 0 700 600

┌──────────────────────────────────────────────────────────────────┐
│ Step ●━━━━━━━━━━━━━━━━━━ 90 / 200    [▶ Play] [Reset]            │
│                                                                  │
│   ┌────────────────────────────────────────────────────────┐    │
│   │                                                        │    │
│   │       • cat                       • truck              │    │
│   │           • dog                                        │    │
│   │      • fish                  • car  • plane            │    │
│   │   • bird                       • boat                  │    │
│   │                                                        │    │
│   │            • liked    • saw    • wanted                │    │
│   │                                                        │    │
│   │                  • pizza                               │    │
│   │              • salad        • soup                     │    │
│   │                  • bread                               │    │
│   └────────────────────────────────────────────────────────┘    │
│                                                                  │
│ [animals●] [vehicles●] [foods●] [connectors●]                    │
│                                                                  │
│ Description: At step 90, animals are starting to cluster…       │
└──────────────────────────────────────────────────────────────────┘
```

**Coordinate transform:** the SGNS-trained 2D positions don't have a fixed range — they drift from ~(0, 0) initial Gaussian to typically [-3, 3] after training. **Don't hardcode a viewport**; instead, compute the visible bounds from all snapshots (across all steps and all words) and add 15% padding, then map to SVG space. This way the camera "frames" the whole trajectory regardless of the specific evolution.

```ts
function computeVisibleBounds(snapshots: TrainingSnapshot[]): { xMin: number; xMax: number; yMin: number; yMax: number } {
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  for (const s of snapshots) {
    for (const [x, y] of s.positions) {
      if (x < xMin) xMin = x;
      if (x > xMax) xMax = x;
      if (y < yMin) yMin = y;
      if (y > yMax) yMax = y;
    }
  }
  const padX = (xMax - xMin) * 0.15;
  const padY = (yMax - yMin) * 0.15;
  return { xMin: xMin - padX, xMax: xMax + padX, yMin: yMin - padY, yMax: yMax + padY };
}
```

**Map to SVG:** plot area is `[60, 640] × [80, 540]` (same margins as session 12's widget for consistency).

### Part C — `Word2VecDynamics.tsx`

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type TrainingTrace,
  type TrainingSnapshot,
  type WordCategory,
  computeTrainingTrace,
  computeTraceForRange,
  VOCAB,
} from './word2vec-training';
import styles from './Word2VecDynamics.module.css';

const VIEWBOX_W = 700;
const VIEWBOX_H = 600;
const PLOT_X_MIN = 60;
const PLOT_X_MAX = 640;
const PLOT_Y_MIN = 80;
const PLOT_Y_MAX = 540;

const CATEGORY_COLORS: Record<WordCategory, string> = {
  animal:  'var(--cyan-400)',
  vehicle: 'var(--amber-500)',
  food:    'var(--rose-500)',
};
const CONNECTOR_COLOR = 'var(--text-tertiary)';
const CONNECTOR_WORDS = new Set(['liked', 'saw', 'wanted']);
const PLAY_FPS = 12;     // 12 snapshots/sec at 1×

export default function Word2VecDynamics() {
  const [trace, setTrace] = useState<TrainingTrace | null>(null);
  const [step, setStep] = useState(0);                  // index into snapshots
  const [isPlaying, setIsPlaying] = useState(false);
  const [enabledCategories, setEnabledCategories] = useState<Set<string>>(
    new Set(['animal', 'vehicle', 'food', 'connector'])
  );
  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute training trace on mount (deferred briefly to allow UI to render loading)
  useEffect(() => {
    const t = setTimeout(() => {
      if (cancelledRef.current) return;
      setTrace(computeTrainingTrace());
    }, 30);
    return () => clearTimeout(t);
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !trace) return;
    const maxStep = trace.snapshots.length - 1;
    if (step >= maxStep) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      setStep(s => s + 1);
    }, 1000 / PLAY_FPS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, step, trace]);

  // Cleanup
  useEffect(() => () => {
    cancelledRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // Visible bounds — only computed once trace is ready
  const bounds = useMemo(() => {
    if (!trace) return null;
    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
    for (const s of trace.snapshots) {
      for (const [x, y] of s.positions) {
        if (x < xMin) xMin = x;
        if (x > xMax) xMax = x;
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
      }
    }
    const padX = (xMax - xMin) * 0.15;
    const padY = (yMax - yMin) * 0.15;
    return { xMin: xMin - padX, xMax: xMax + padX, yMin: yMin - padY, yMax: yMax + padY };
  }, [trace]);

  if (!trace || !bounds) {
    return (
      <div className={styles.widget}>
        <div className={styles.loading}>
          <div className={styles.loadingBar} />
          Training skip-gram negative sampling on toy corpus…
        </div>
      </div>
    );
  }

  const totalSteps = trace.snapshots.length - 1;
  const currentSnapshot = trace.snapshots[step]!;
  const realStep = currentSnapshot.step;

  function toSvgX(x: number) { return PLOT_X_MIN + (x - bounds!.xMin) / (bounds!.xMax - bounds!.xMin) * (PLOT_X_MAX - PLOT_X_MIN); }
  function toSvgY(y: number) { return PLOT_Y_MAX - (y - bounds!.yMin) / (bounds!.yMax - bounds!.yMin) * (PLOT_Y_MAX - PLOT_Y_MIN); }

  function getCategory(wordIdx: number): 'animal' | 'vehicle' | 'food' | 'connector' {
    const word = VOCAB[wordIdx]!.word;
    if (CONNECTOR_WORDS.has(word)) return 'connector';
    return VOCAB[wordIdx]!.category;
  }

  function getDescription(): string {
    if (realStep === 0) return 'Step 0: All embeddings start at small random positions near the origin.';
    if (realStep < 50)  return `Step ${realStep}: Words are beginning to drift. Positive pairs pull together; negatives push apart.`;
    if (realStep < 120) return `Step ${realStep}: Category structure is emerging. Animals, vehicles, and foods are separating into distinct regions.`;
    return `Step ${realStep}: Clusters are well-formed. Connector words ("liked", "saw", "wanted") sit between categories — they co-occur with everything.`;
  }

  return (
    <div className={styles.widget}>
      <svg viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`} className={styles.svg} role="img" aria-label="2D scatter showing skip-gram training over time">
        {/* Bounding box */}
        <rect x={PLOT_X_MIN} y={PLOT_Y_MIN} width={PLOT_X_MAX - PLOT_X_MIN} height={PLOT_Y_MAX - PLOT_Y_MIN}
              className={styles.plotBox} />

        {/* Word points */}
        {currentSnapshot.positions.map(([x, y], i) => {
          const cat = getCategory(i);
          if (!enabledCategories.has(cat)) return null;
          const cx = toSvgX(x), cy = toSvgY(y);
          const color = cat === 'connector' ? CONNECTOR_COLOR : CATEGORY_COLORS[cat as WordCategory];
          return (
            <g key={i} className={styles.point}>
              <circle cx={cx} cy={cy} r={6} className={styles.pointDot} style={{ fill: color }} />
              <text x={cx + 9} y={cy + 4} className={styles.pointLabel}>{VOCAB[i]!.word}</text>
            </g>
          );
        })}
      </svg>

      <div className={styles.controls}>
        <button onClick={() => { setStep(0); setIsPlaying(false); }} className={styles.controlSecondary}>
          Reset
        </button>
        <button onClick={() => step >= totalSteps ? (setStep(0), setIsPlaying(true)) : setIsPlaying(p => !p)} className={styles.controlPrimary}>
          {isPlaying ? 'Pause' : step >= totalSteps ? 'Replay' : 'Play'}
        </button>
        <input
          type="range"
          min={0}
          max={totalSteps}
          value={step}
          onChange={e => { setIsPlaying(false); setStep(Number(e.target.value)); }}
          className={styles.scrubber}
          aria-label="Training step"
        />
        <span className={styles.stepLabel} aria-live="polite">Step {realStep} / 200</span>
      </div>

      <div className={styles.categoryBar}>
        {(['animal', 'vehicle', 'food', 'connector'] as const).map(cat => {
          const isOn = enabledCategories.has(cat);
          const color = cat === 'connector' ? CONNECTOR_COLOR : CATEGORY_COLORS[cat];
          return (
            <button
              key={cat}
              onClick={() => setEnabledCategories(prev => {
                const next = new Set(prev);
                if (next.has(cat)) next.delete(cat); else next.add(cat);
                return next;
              })}
              className={`${styles.chip} ${isOn ? styles.chipOn : ''}`}
              style={{ '--chip-color': color } as React.CSSProperties}
              aria-pressed={isOn}
            >
              <span className={styles.chipSwatch} />
              {cat}{cat !== 'connector' ? 's' : 's'}
            </button>
          );
        })}
      </div>

      <div className={styles.description} aria-live="polite">
        {getDescription()}
      </div>
    </div>
  );
}
```

### Part D — `Word2VecDynamics.module.css`

Follow the conventions established in `TrainingCurves.module.css` (session 09) and `EmbeddingSpace.module.css` (session 12). Specifically:

- `.loading` with shimmer bar (same pattern as `TrainingCurves`)
- `.scrubber` styled as a `<input type="range">` with cyan thumb (same pattern as `TrainingCurves`)
- `.controlPrimary` / `.controlSecondary` buttons matching the established widget control style
- `.chip` / `.chipOn` matching `EmbeddingSpace`'s chip pattern
- `.point`, `.pointDot`, `.pointLabel` matching `EmbeddingSpace`'s point styling
- `.plotBox`: subtle border, no fill, sets visible plot region
- `.description`: same styling as `EmbeddingSpace`'s `.infoBar`

You can copy substantial portions from those existing CSS modules. Keep the design consistent across Ch 2's two widgets.

### Part E — Update `src/components/widgets/index.ts`

```ts
export { default as BackpropVisualizer } from './ch01/BackpropVisualizer';
export { default as TrainingCurves } from './ch01/TrainingCurves';
export { default as AutogradGraph } from './ch01/AutogradGraph';
export { default as EmbeddingSpace } from './ch02/EmbeddingSpace';
export { default as Word2VecDynamics } from './ch02/Word2VecDynamics';
```

### Part F — Update `src/pages/ch02-embeddings/index.mdx`

Three edits:

**Edit F1: Update the widget imports**

```mdx
import { EmbeddingSpace, Word2VecDynamics } from '@components/widgets';
```

**Edit F2: Replace section 4's `<WidgetFrame>` interior**

Find the `<WidgetFrame title="Skip-gram dynamics">` placeholder. Replace its `<div>` interior:

```mdx
<WidgetFrame title="Skip-gram dynamics" caption="A 15-word corpus trained with skip-gram negative sampling in 2D. Drag the scrubber or hit Play to watch the embeddings evolve. Categories separate; connector words stay in the middle.">
  <Word2VecDynamics client:visible />
</WidgetFrame>
```

**Edit F3: Add the Exercises section**

Insert the following new section BETWEEN section 8 ("From token to context") and the final chapter close paragraph. The close paragraph from session 11 stays at the end of the file; Exercises goes immediately before.

````mdx
## Exercises

The exercises below build on the chapter. Each is a self-contained problem with a starting template. Hints are collapsed by default — try the problem first.

### Exercise 1 (easy) — Verify category separation by cosine similarity

Train the toy skip-gram model from section 4 (the 12-word corpus). Then compute cosine similarities for several pairs: within-category (e.g., `cat ↔ dog`), across-category (e.g., `cat ↔ rug`), and to connector words (e.g., `cat ↔ sat`). Report which pairs are most/least similar.

<details>
<summary>Hint</summary>

After training, the `U` matrix has the word embeddings. Compute `cos(a, b) = (a @ b) / (|a| * |b|)`. Same-category words should have higher cosine than cross-category. Connector words (`sat`, `on`, `the`) should be moderately similar to many words — they co-occur with everything.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

# Re-create the toy SGNS setup from section 4 (or copy your trained U from that block)
# Then compute cosine similarity matrix for a subset of words.

def cos(a, b):
    return (a @ b) / (np.linalg.norm(a) * np.linalg.norm(b))

# TODO: train the toy SGNS model (or use the trained U from section 4's code block)
# TODO: compute cosine similarity for these pairs:
#       (cat, dog), (cat, mat), (cat, the), (mat, rug), (dog, mat)
# TODO: report which pair is most similar and which is least
`}
  packages={["numpy"]}
/>

### Exercise 2 (medium) — Intruder detection

Given a list of 4 words, identify the one that doesn't belong using only embedding similarities. For example, in `[cat, dog, fish, car]`, the intruder is `car`. The basic approach: compute the average pairwise similarity within the list, then check which word has the lowest average similarity to the others.

<details>
<summary>Hint</summary>

For each candidate word $w$ in the list, compute its average cosine similarity to all other words in the list. The word with the LOWEST average similarity is the intruder. (This works because the other three words mutually reinforce each other's "category-ness.")

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

# Assume you have a trained embedding matrix E and word_to_id dict from section 4 or 6.

def find_intruder(words, E, word_to_id):
    """Return the word in the list with lowest avg similarity to the others."""
    # TODO: for each word, compute its average cosine similarity to the other words
    # TODO: return the word with the lowest avg
    pass

# Test cases — train embeddings first, then test:
# find_intruder(['cat', 'dog', 'fish', 'car'], E, word_to_id)  → 'car'
# find_intruder(['red', 'blue', 'green', 'cat'], E, word_to_id) → 'cat'
`}
  packages={["numpy"]}
/>

### Exercise 3 (medium) — Implement CBOW

CBOW (Continuous Bag of Words) is word2vec's other variant. Instead of predicting context from a center word, CBOW predicts the center word from the *average* of its context word embeddings. Implement CBOW with negative sampling. Compare the resulting embeddings to skip-gram on the same toy corpus.

<details>
<summary>Hint</summary>

For each (center, context_set) pair: average the context-word embeddings into a single vector $\bar{u}$. Then run the SGNS-style update with $\bar{u}$ in place of a single word embedding, predicting the *center* word as positive and random negatives. Gradient w.r.t. $\bar{u}$ distributes equally back to each context word.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def sigmoid(x): return 1 / (1 + np.exp(-np.clip(x, -30, 30)))

# Use the same toy corpus as section 4. Then implement CBOW negative sampling.

def cbow_step(U, W, center_id, context_ids, neg_ids, lr=0.05):
    """
    U: (vocab, dim) — context-word embeddings (this is what CBOW averages)
    W: (vocab, dim) — center-word embeddings (predicted)
    center_id: int — the true center word
    context_ids: list of ints — the surrounding context words
    neg_ids: list of ints — negative samples
    """
    # TODO: average the context word embeddings into u_bar
    # TODO: compute positive and negative logits
    # TODO: compute gradients w.r.t. u_bar, W[center_id], W[neg_ids]
    # TODO: distribute the u_bar gradient back to each U[context_ids[i]]
    pass

# Compare to skip-gram: train both on the same corpus, then report
# which produces tighter category clusters (by within-vs-cross-category cosine similarity).
`}
  packages={["numpy"]}
/>

### Exercise 4 (hard) — Linear analogy search

Given three words $a$, $b$, $c$, find the word $d$ such that $\vec{d} - \vec{c} \approx \vec{b} - \vec{a}$, i.e., $d$ completes the analogy "$a$ is to $b$ as $c$ is to ?". Implement this search using your trained embeddings.

<details>
<summary>Hint</summary>

Compute the target vector $t = b - a + c$. Then search the vocabulary for the word whose embedding is closest to $t$ (excluding $a$, $b$, $c$ themselves — they often score highest by accident). Use cosine similarity. With a tiny corpus, the results may be noisy; with real word2vec on Wikipedia, the king/queen result emerges.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def find_analogy(a, b, c, E, word_to_id, vocab):
    """
    Solve "a is to b as c is to ?"
    Returns the word whose embedding is most similar to (E[b] - E[a] + E[c]).
    Excludes a, b, c from candidates.
    """
    # TODO: compute target = E[word_to_id[b]] - E[word_to_id[a]] + E[word_to_id[c]]
    # TODO: compute cosine similarity from target to every word in vocab
    # TODO: exclude a, b, c, return the highest-scoring word
    pass

# Test:
# find_analogy('cat', 'dog', 'fish', E, word_to_id, vocab)
# (On the toy corpus, the result may not be meaningful — that's fine.
# The point is to implement the algorithm; with real word2vec on 6B words,
# 'king' / 'man' / 'woman' produces 'queen'.)
`}
  packages={["numpy"]}
/>

If you finish Exercise 4 with a working implementation and want to see it succeed on real data, download a pre-trained GloVe or word2vec model from [nlp.stanford.edu/projects/glove](https://nlp.stanford.edu/projects/glove/), load the vectors with numpy, and run your analogy search on a 6-billion-word vocabulary. With real embeddings, `king - man + woman` returns `queen` with high probability — the empirical result that put word vectors on the map.
````

### Part G — Flip Ch 2's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 2, slug: 'ch02-embeddings', title: 'Embeddings & representation', partNum: 1, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

Note: `getFirstPublishedChapter()` will continue to return Ch 1 since it's earlier in the array. The landing page CTA stays "Start with Chapter 1 →". This is correct behavior — the landing always points to the FIRST published chapter, and Ch 1 is and remains that.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 4 of Ch 2** renders with the Word2VecDynamics widget. Section 5's marquee widget still works as it did after session 12.
3. **Initial state of Word2VecDynamics:** loading state visible briefly (~30ms); then the 15 word points appear at step 0 near the origin in a small initial cluster.
4. **Click Play:** the animation advances at ~12 snapshots/sec; words drift apart over the 40 snapshots (~3.5 seconds total). By the end, three clusters (animals top-ish, vehicles right-ish, foods bottom-ish; connector words in middle) are visible.
5. **Scrubber works:** dragging the scrubber updates the visualization instantly. Disabling categories hides those points.
6. **Description text at the bottom** updates with the current step (different message for early/mid/late training).
7. **The four exercise blocks render** with collapsible hints and runnable starter code.
8. **Exercise 1's hint reveals on click** (native `<details>` element). Exercises render in the correct order.
9. **Chapter close paragraph** is the final content in the file, AFTER the Exercises section.
10. **Landing page:** the CTA still reads "Start with Chapter 1 →" (because Ch 1 is the *first* published chapter; Ch 2 being published doesn't change which chapter is "first").
11. **Sidebar:** Ch 1 active (published), Ch 2 active (now published), Ch 3-30 still dimmed.
12. **Prev/next nav at bottom of Ch 2:** prev = Ch 1 (active); next = Ch 3 (disabled).
13. **TOC on Ch 2** includes Exercises as an h2 entry plus 4 h3 entries.
14. **Mobile:** widget scales correctly; scrubber tappable; exercise hints work.
15. **`prefers-reduced-motion`:** loading shimmer is static; the animation still plays (it's the point of the widget) but per-snapshot transitions don't add motion.
16. **`npm run typecheck`** passes.
17. **`npm run build`** completes.
18. **Final repo additions:**

```
src/
├── components/
│   └── widgets/
│       └── ch02/
│           ├── EmbeddingSpace.{tsx,module.css}     (session 12, unchanged)
│           ├── embedding-data.ts                    (session 12, unchanged)
│           ├── Word2VecDynamics.tsx                 ← new
│           ├── Word2VecDynamics.module.css          ← new
│           └── word2vec-training.ts                 ← new
├── lib/
│   └── chapters.ts                                  (Ch 2 status flipped)
└── pages/
    └── ch02-embeddings/
        └── index.mdx                                (widget + exercises + close)
```

---

## Out of scope

- ❌ **Do not implement live SGNS training while the user watches.** Pre-compute at mount, then animate snapshots. Live training would tank performance and be non-deterministic.
- ❌ **Do not provide a way for the user to modify the corpus.** That's a different (much larger) project.
- ❌ **Do not show the loss curve.** The 2D positions ARE the visualization; adding a loss curve would clutter. The reader's intuition for "is training working?" is "are clusters forming?" — answerable from the scatter alone.
- ❌ **Do not show solutions to the exercises.** Hints only.
- ❌ **Do not flip any other chapter's status.** Only Ch 2 flips to `'published'`. Chapters 3-30 stay `'planned'`.
- ❌ **Do not add new MDX components.** Exercises use native `<details><summary>` and existing `<RunnableCode>`.
- ❌ **Do not modify Ch 1.** It's sealed.
- ❌ **Do not modify the embedding-space widget** from session 12.

---

## Wire-up

```bash
git add src/components/widgets/ch02/Word2VecDynamics.tsx src/components/widgets/ch02/Word2VecDynamics.module.css src/components/widgets/ch02/word2vec-training.ts src/components/widgets/index.ts src/lib/chapters.ts src/pages/ch02-embeddings/index.mdx
git commit -m "session 13: word2vec dynamics widget + Ch 2 exercises + status: published"
git push origin main
```

After deploy, verify on production:
1. Both Ch 2 widgets render correctly
2. The 4 exercises display with working hints and runnable code
3. Landing page CTA still points to Ch 1
4. Sidebar shows Ch 1 and Ch 2 active

---

## Phase 4 closeout

This session closes **Phase 4** per `MASTER_PLAN.md`. **Chapter 2 is the second complete chapter on production.**

Confirm before declaring Phase 4 complete:

- ✅ `BUILD_ORDER.md` shows files 17-20 (Phase 4) all ✅
- ✅ Ch 2 status is `'published'`
- ✅ Both Ch 2 widgets work in production
- ✅ All 4 Ch 2 exercises have working starter code
- ✅ Ch 2 total word count is in the 6000-7500 range (5000-5500 of base prose + 800-1200 from exercises)
- ✅ Lighthouse scores remain green on `/ch02-embeddings/`
- ✅ Bundle size for Ch 2's chunk is reasonable (< 200 KB including both widgets)

If anything is unchecked, return and fix before Phase 5 (Chapter 3).

**Phase 4 retrospective notes** (for the human running these sessions):

The Ch 2 chapter used a 3-session model (page structure + marquee widget + secondary-widget-with-exercises) vs Ch 1's 4-session model (page structure + 3 widget sessions, with exercises in the last). The 3-session model is denser:
- Session 11 = session 7 + scope (page structure)
- Session 12 = sessions 8 (marquee widget)
- Session 13 = sessions 9 + 10 combined (secondary widget + exercises + status flip)

This works because Ch 2 has 2 widgets, not 3. **Future chapters should follow the 3-session model UNLESS they need 3+ widgets.** Most chapters won't.

The five-session recipe from Ch 1's closeout overstated the typical case. Revised recommendation: most chapters fit comfortably in 4 sessions (research + page structure + marquee widget + secondary widget with exercises). Particularly visual / interactive chapters may add a third widget session.

**Cadence update:**
- Ch 1: 5 files (research + 4 sessions)
- Ch 2: 4 files (research + 3 sessions)
- Future chapters: target 4 files unless visual complexity demands a third widget

That's 28 × 4 = 112 more chapter files + research + polish, vs. the 145 originally projected. Significant scope reduction.

---

## Notes for the session author

**On the corpus design:** the 20 three-word sentences are deliberately limited. With more variety in the sentences (say, 50 sentences of varying length), training would produce richer embeddings — but also messier 2D positions that don't fit the clean "three clusters" narrative. The chapter prose's section 4 already shows a 12-word corpus; this widget uses a slightly different 15-word setup with cleaner sentence structure. Both are pedagogically valid.

**On the training rng vs init rng split:** the `initRng` (seeded 7) controls initial embedding positions; the `trainRng` (seeded 42) controls negative sampling and pair shuffling. Separating them means you can vary one without affecting the other — useful if a future polish session adds different initial conditions.

**On the 2D direct training:** SGNS in 2D loses the analogy-friendly structure that arises in 100-300d. That's fine — this widget shows DYNAMICS, not the final geometric beauty. The marquee widget (session 12) shows the structural claim; this one shows the training process. Both pieces are needed.

**On the 12 fps playback speed:** ~12 snapshots per second × 40 snapshots = 3.3 seconds total. Slow enough to follow the movement; fast enough to not be tedious. Don't speed up — the dynamics are what the widget shows; rushing them defeats the purpose.

**On the connector words:** "liked", "saw", "wanted" all co-occur with words from every category, so SGNS pushes them toward the centroid (high cosine with everyone = mediocre similarity to anyone in particular). The widget should show this drift toward middle — it's actually pedagogically interesting that "function words" end up in a different geometric region from "content words." Subtle but worth noticing.

**On the exercises:**
- Exercise 1 reuses the section-4 toy code. Reader copies it in, computes a few similarities. Confirms the chapter's claims.
- Exercise 2 extends to a small algorithmic task (intruder detection). Pedagogically: shows that embedding similarity has practical uses.
- Exercise 3 (CBOW) is a meaningful algorithmic extension. Most readers will struggle; the hint is essential.
- Exercise 4 (linear analogy search) is the famous demo. With the toy corpus it may not work well; the note at the end points to using real GloVe vectors for real results.

If a reader works through all four, they've extended the chapter materially. That's the point of exercises.

**On the chapter being complete:** Chapter 2 is now the second complete chapter on the production site. Take a moment to look at it as a reader — open `/ch02-embeddings/`, scroll from top to bottom, read each section, click through each widget, read an exercise. Does the chapter teach what it claims to teach? If yes, the Phase 4 work is done.

The pattern is now validated at TWO chapters of different shapes:
- Ch 1: math-heavy, code-heavy, 3 widgets
- Ch 2: concept-heavy, less math, 2 widgets

Chapters 3-30 will be variations on these two shapes. The next chapter session (file #21) starts Chapter 3 with the tokenization research file.

Phase 4 closeout. Phase 5 begins on the next file.

# Session 15 — BPE training marquee widget

> The marquee Chapter 3 widget: an animated visualization of BPE training step-by-step. Shows the corpus broken into tokens (evolving as merges accumulate), the top-5 adjacent pair counts (with the chosen merge highlighted), and the growing list of learned merges. The reader watches "th" become a token, then "the", then "the_cat", and so on — the algorithm's logic made visible. Replaces the section-3 `<WidgetFrame>` placeholder.

---

## Read first (in this order)

1. **`research/ch03-tokenization/research.md`** — for the BPE training algorithm (Algorithm 1) and the toy corpus pattern
2. **`prompts/chapters/ch03-tokenization/session-14-page-structure.md`** — for the section-3 widget placeholder this session fills
3. **`prompts/chapters/ch02-embeddings/session-13-word2vec-and-exercises.md`** — for the precompute-trace-then-animate pattern; this widget follows it
4. **`prompts/chapters/ch02-embeddings/session-12-embedding-space-widget.md`** — for the chip/category interaction patterns

---

## Goal

Replace the `<WidgetFrame title="BPE training">` placeholder in section 3 with a working interactive widget that:

- Trains BPE on a small fixed corpus (~10 sentences, ~50 word-units), pre-computing the full training trace at component mount
- Animates through **25 merge steps**, each showing: the corpus state, the top 5 pair counts, and the running vocab list
- The chosen merge at each step is visually highlighted in the pair-counts panel
- The newly-introduced token glows briefly in the corpus when first created
- Play/pause/reset controls plus a time scrubber

**End state:** section 3 of Chapter 3 has a working marquee widget. The reader can see the BPE algorithm executing: pair counts ranked, top pair chosen, corpus updated, vocab grown. After ~25 steps, common letter combinations have become single tokens (e.g., "th", "the", "_th" if leading-space convention used).

---

## Inputs

State of the repo after session 14:

- `src/pages/ch03-tokenization/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 3 and 8)
- `src/lib/chapters.ts` has Ch 3 as `'draft'`
- `src/components/widgets/index.ts` exports widgets for Ch 1 and Ch 2
- No `src/components/widgets/ch03/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch03/BPETraining.tsx` — the React widget
2. **Create** `src/components/widgets/ch03/BPETraining.module.css` — scoped styles
3. **Create** `src/components/widgets/ch03/bpe-corpus.ts` — fixed corpus + BPE training algorithm + trace computation
4. **Update** `src/components/widgets/index.ts` — add `BPETraining` export
5. **Update** `src/pages/ch03-tokenization/index.mdx` — replace section-3's `<WidgetFrame>` interior with `<BPETraining client:visible />`

**Do NOT modify:** Ch 1's or Ch 2's widget files, any layout, styling, or scaffolding file. Do NOT modify Ch 3's section-8 placeholder (session 16 owns it).

---

## Detailed spec

### Architecture overview

```
src/components/widgets/
├── ch01/...                       (sealed)
├── ch02/...                       (sealed)
└── ch03/
    ├── BPETraining.tsx            ← new
    ├── BPETraining.module.css     ← new
    └── bpe-corpus.ts              ← new
```

Same pure-data-then-view pattern as Ch 2's widgets.

### 1. `bpe-corpus.ts` — the data layer

Provides:
- A fixed corpus (~10 short sentences)
- A `trainBPE` function that returns the complete training trace
- A `precomputeTrace` function called once at component mount

```ts
// src/components/widgets/ch03/bpe-corpus.ts

/**
 * BPE training widget data layer.
 *
 * Corpus is intentionally small (~10 short sentences) so 25 merge steps produce
 * pedagogically interesting results in <50ms of in-browser compute.
 *
 * No pre-tokenization regex — we just split on whitespace and operate on chars
 * (not bytes) for visual clarity. The chapter prose explicitly discusses why
 * real BPE uses bytes; this widget chooses character-level for readability.
 */

export const CORPUS_SENTENCES: string[] = [
  "the cat sat on the mat",
  "the dog sat on the rug",
  "the cat ran fast",
  "the dog ran slow",
  "the bird sang in the tree",
  "the cat and the dog",
  "the cat slept on the mat",
  "the dog slept on the rug",
  "the bird flew over the tree",
  "the cat watched the bird",
];

/** Top-5 adjacent pair counts at a given training step */
export interface PairCount {
  pair: [string, string];
  count: number;
}

/** A single training step in the trace */
export interface MergeStep {
  /** Step number, starting at 1 */
  stepNum: number;
  /** The pair chosen to merge */
  chosenPair: [string, string];
  /** Its count */
  chosenCount: number;
  /** The new token formed by concatenation */
  newToken: string;
  /** Top 5 pair counts BEFORE this merge was applied (includes the chosen one) */
  topPairs: PairCount[];
  /** Corpus state AFTER this merge: array of word-tuples, each a list of tokens */
  corpusAfter: string[][];
  /** Running vocabulary size after this step */
  vocabSize: number;
}

export interface TrainingTrace {
  /** Initial corpus: each word as array of single chars */
  initialCorpus: string[][];
  /** Each merge step in order */
  steps: MergeStep[];
}

/**
 * Train BPE on the corpus for `numMerges` steps; return the complete trace.
 * Uses character-level base tokens (not bytes), for visual clarity.
 */
export function precomputeTrace(numMerges: number = 25): TrainingTrace {
  // Build initial word frequency table
  // word_tuple → count (frequency in corpus)
  const wordFreq = new Map<string, number>();
  const wordTuples: string[][] = [];

  for (const sentence of CORPUS_SENTENCES) {
    for (const word of sentence.split(/\s+/)) {
      if (word === '') continue;
      const tup = Array.from(word);   // char array
      const key = tup.join('\x00');   // null-separated key
      wordFreq.set(key, (wordFreq.get(key) ?? 0) + 1);
    }
  }

  // Snapshot the initial corpus (one entry per unique word, sorted alphabetically for stability)
  const initialCorpus: string[][] = Array.from(wordFreq.keys())
    .sort()
    .map(k => k.split('\x00'));

  // Mutable corpus representation: Map<key, count> where key is null-joined word tuple
  // We'll mutate this map as merges happen
  let corpus = new Map(wordFreq);

  // Initial vocab: set of all characters seen
  const vocab = new Set<string>();
  for (const key of corpus.keys()) {
    for (const ch of key.split('\x00')) vocab.add(ch);
  }
  const initialVocabSize = vocab.size;

  const steps: MergeStep[] = [];

  for (let step = 1; step <= numMerges; step++) {
    // 1. Count adjacent pair frequencies
    const pairCounts = new Map<string, number>();   // key: "a\x00b"
    for (const [wordKey, count] of corpus) {
      const tokens = wordKey.split('\x00');
      for (let i = 0; i < tokens.length - 1; i++) {
        const pairKey = `${tokens[i]}\x00${tokens[i + 1]}`;
        pairCounts.set(pairKey, (pairCounts.get(pairKey) ?? 0) + count);
      }
    }

    if (pairCounts.size === 0) break;

    // 2. Find top 5 pairs (sorted by count desc, then lexicographic for stability)
    const sorted = Array.from(pairCounts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const top5: PairCount[] = sorted.slice(0, 5).map(([pairKey, count]) => {
      const [a, b] = pairKey.split('\x00') as [string, string];
      return { pair: [a, b], count };
    });

    // 3. Choose the top pair
    const [chosenPairKey, chosenCount] = sorted[0]!;
    const [a, b] = chosenPairKey.split('\x00') as [string, string];
    const newToken = a + b;
    vocab.add(newToken);

    // 4. Update corpus: replace every adjacent (a, b) with newToken
    const nextCorpus = new Map<string, number>();
    for (const [wordKey, count] of corpus) {
      const tokens = wordKey.split('\x00');
      const newTokens: string[] = [];
      let i = 0;
      while (i < tokens.length) {
        if (i < tokens.length - 1 && tokens[i] === a && tokens[i + 1] === b) {
          newTokens.push(newToken);
          i += 2;
        } else {
          newTokens.push(tokens[i]!);
          i += 1;
        }
      }
      const newKey = newTokens.join('\x00');
      nextCorpus.set(newKey, (nextCorpus.get(newKey) ?? 0) + count);
    }
    corpus = nextCorpus;

    // 5. Build corpus snapshot — alphabetically sorted unique words for stable rendering
    const corpusAfter: string[][] = Array.from(corpus.keys())
      .sort()
      .map(k => k.split('\x00'));

    steps.push({
      stepNum: step,
      chosenPair: [a, b],
      chosenCount,
      newToken,
      topPairs: top5,
      corpusAfter,
      vocabSize: vocab.size,
    });
  }

  return { initialCorpus, steps };
}
```

**Notes:**
- The corpus has 10 sentences (~30 word-tokens, ~12 unique words after dedup). 25 merges should produce visible whole-word tokens by mid-training (e.g., "the" emerges around step 4-6, "cat" around step 10-15).
- Using `\x00` (null) as a separator inside Map keys is a pragmatic choice — none of our text data contains null bytes.
- The trace computes in <30ms for 25 merges on this corpus. No need for async chunking.
- Returns the corpus snapshot AFTER each merge, sorted alphabetically by word-tuple for stable rendering across steps.

### 2. Visual layout

ViewBox / layout: the widget renders in HTML+SVG (not pure SVG), using flex/grid for the panels.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Step ●━━━━━━━━━━━━━━━━━━━━━━━━━ 12 / 25     [▶ Play] [Reset]           │
│                                                                         │
│  Just merged:  "t" + "h"  →  "th"   (count: 42)                         │
│                                                                         │
│  ┌────────────────────────────────┐   ┌────────────────────────────┐    │
│  │ Top adjacent pairs (this step) │   │ Vocabulary growth          │    │
│  │ ────────────────────────────── │   │ ────────────────────────── │    │
│  │ ████████████████ 42  "t"+"h"   │   │ Step 12: "th"  (32 chars   │    │
│  │ ███████████ 28      "h"+"e"    │   │           +12 merges)      │    │
│  │ ████████ 21         "a"+"t"    │   │ Step 11: "th"+"e" = "the"  │    │
│  │ ██████ 18           "th"+"e"   │   │ Step 10: "e"+"_" = "e_"    │    │
│  │ █████ 15            "o"+"n"    │   │ Step 9:  "n"+"_" = "n_"    │    │
│  └────────────────────────────────┘   │ Step 8:  "i"+"n" = "in"    │    │
│                                       │ ...                        │    │
│                                       └────────────────────────────┘    │
│                                                                         │
│  Corpus (each word as token sequence):                                  │
│                                                                         │
│   the    ─────────  ⬡the⬡                                                │
│   cat    ─────────  c a t                                                │
│   sat    ─────────  s a t                                                │
│   on     ─────────  o n                                                  │
│   mat    ─────────  m a t                                                │
│   dog    ─────────  d o g                                                │
│   ran    ─────────  r a n                                                │
│   ...                                                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

The new token (most recently created at this step) gets a brief glow effect (cyan border + slight scale-up) to draw attention to where in the corpus the new merge is visible.

### 3. `BPETraining.tsx`

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { type TrainingTrace, type MergeStep, precomputeTrace, CORPUS_SENTENCES } from './bpe-corpus';
import styles from './BPETraining.module.css';

const NUM_MERGES = 25;
const PLAY_FPS = 2;     // 2 steps/sec; slow enough to follow

export default function BPETraining() {
  const [trace, setTrace] = useState<TrainingTrace | null>(null);
  const [stepIdx, setStepIdx] = useState(0);   // 0 = initial state (no merges); 1..NUM_MERGES = after that step
  const [isPlaying, setIsPlaying] = useState(false);
  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-compute trace at mount
  useEffect(() => {
    const t = setTimeout(() => {
      if (cancelledRef.current) return;
      setTrace(precomputeTrace(NUM_MERGES));
    }, 30);
    return () => clearTimeout(t);
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !trace) return;
    if (stepIdx >= trace.steps.length) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      setStepIdx(s => s + 1);
    }, 1000 / PLAY_FPS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, stepIdx, trace]);

  // Cleanup
  useEffect(() => () => {
    cancelledRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  if (!trace) {
    return (
      <div className={styles.widget}>
        <div className={styles.loading}>
          <div className={styles.loadingBar} />
          Training BPE on the toy corpus…
        </div>
      </div>
    );
  }

  const totalSteps = trace.steps.length;
  const currentCorpus = stepIdx === 0 ? trace.initialCorpus : trace.steps[stepIdx - 1]!.corpusAfter;
  const currentStep: MergeStep | null = stepIdx === 0 ? null : trace.steps[stepIdx - 1]!;
  const newToken = currentStep?.newToken ?? null;

  // Last 5 merges (oldest at bottom in the panel)
  const recentMerges = stepIdx === 0 ? [] : trace.steps.slice(Math.max(0, stepIdx - 5), stepIdx).reverse();

  // Max count among current top pairs — for bar normalization
  const maxCount = currentStep?.topPairs[0]?.count ?? 1;

  return (
    <div className={styles.widget}>
      {/* Controls */}
      <div className={styles.controls}>
        <button onClick={() => { setStepIdx(0); setIsPlaying(false); }} className={styles.controlSecondary}>
          Reset
        </button>
        <button onClick={() => stepIdx >= totalSteps ? (setStepIdx(0), setIsPlaying(true)) : setIsPlaying(p => !p)} className={styles.controlPrimary}>
          {isPlaying ? 'Pause' : stepIdx >= totalSteps ? 'Replay' : 'Play'}
        </button>
        <input
          type="range"
          min={0}
          max={totalSteps}
          value={stepIdx}
          onChange={e => { setIsPlaying(false); setStepIdx(Number(e.target.value)); }}
          className={styles.scrubber}
          aria-label="BPE training step"
        />
        <span className={styles.stepLabel} aria-live="polite">Step {stepIdx} / {totalSteps}</span>
      </div>

      {/* Just-merged callout */}
      <div className={styles.justMerged} aria-live="polite">
        {currentStep ? (
          <>
            Just merged:{' '}
            <code className={styles.tokenChip}>{escapeWs(currentStep.chosenPair[0])}</code>
            {' '}+{' '}
            <code className={styles.tokenChip}>{escapeWs(currentStep.chosenPair[1])}</code>
            {' '}→{' '}
            <code className={`${styles.tokenChip} ${styles.tokenChipNew}`}>{escapeWs(currentStep.newToken)}</code>
            {' '}(count: <strong>{currentStep.chosenCount}</strong>)
          </>
        ) : (
          <>Initial corpus — no merges yet. Press Play to start training.</>
        )}
      </div>

      {/* Two panels: pair counts + vocab growth */}
      <div className={styles.panels}>
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Top adjacent pairs (this step)</div>
          {currentStep ? (
            <ul className={styles.pairList}>
              {currentStep.topPairs.map((pc, i) => {
                const isChosen = pc.pair[0] === currentStep.chosenPair[0] && pc.pair[1] === currentStep.chosenPair[1];
                const widthPct = (pc.count / maxCount) * 100;
                return (
                  <li key={i} className={isChosen ? styles.pairItemChosen : styles.pairItem}>
                    <span className={styles.pairBar} style={{ width: `${widthPct}%` }} />
                    <span className={styles.pairLabel}>
                      <code className={styles.tokenChip}>{escapeWs(pc.pair[0])}</code>
                      {'+'}
                      <code className={styles.tokenChip}>{escapeWs(pc.pair[1])}</code>
                    </span>
                    <span className={styles.pairCount}>{pc.count}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={styles.emptyPanel}>Counts will appear when training begins.</div>
          )}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTitle}>Recent merges</div>
          {recentMerges.length > 0 ? (
            <ul className={styles.mergeList}>
              {recentMerges.map((m) => (
                <li key={m.stepNum} className={styles.mergeItem}>
                  <span className={styles.mergeStepNum}>{m.stepNum}.</span>{' '}
                  <code className={styles.tokenChip}>{escapeWs(m.chosenPair[0])}</code>
                  {' + '}
                  <code className={styles.tokenChip}>{escapeWs(m.chosenPair[1])}</code>
                  {' → '}
                  <code className={`${styles.tokenChip} ${m.stepNum === stepIdx ? styles.tokenChipNew : ''}`}>{escapeWs(m.newToken)}</code>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.emptyPanel}>Merges will appear here as they're learned.</div>
          )}
          <div className={styles.vocabSize}>
            Vocab size: <strong>{(currentStep?.vocabSize ?? trace.initialCorpus.flat().reduce((s, _) => s + 0, 0) || initialVocabSize(trace))}</strong>
          </div>
        </div>
      </div>

      {/* Corpus panel */}
      <div className={styles.corpusPanel}>
        <div className={styles.panelTitle}>Corpus state — each word as token sequence</div>
        <div className={styles.corpusGrid}>
          {currentCorpus.map((wordTokens, wIdx) => (
            <div key={wIdx} className={styles.corpusWord}>
              {wordTokens.map((tok, tIdx) => (
                <code
                  key={tIdx}
                  className={`${styles.tokenChip} ${tok === newToken ? styles.tokenChipGlow : ''}`}
                >
                  {escapeWs(tok)}
                </code>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Render whitespace visibly (e.g., space as "␣") so chips don't look empty
function escapeWs(s: string): string {
  return s.replace(/ /g, '␣').replace(/\n/g, '↵').replace(/\t/g, '⇥');
}

// Compute initial vocab size from initial corpus chars
function initialVocabSize(trace: TrainingTrace): number {
  const set = new Set<string>();
  for (const word of trace.initialCorpus) {
    for (const tok of word) set.add(tok);
  }
  return set.size;
}
```

### 4. `BPETraining.module.css`

Match the typographic and chromatic conventions established in `Word2VecDynamics.module.css` (session 13) and `EmbeddingSpace.module.css` (session 12). Specifically:

- **`.loading`** with shimmer bar (copy pattern from `Word2VecDynamics`)
- **`.controls`** row matching `Word2VecDynamics`
- **`.scrubber`** matching `Word2VecDynamics`'s range slider style
- **`.tokenChip`** is a small monospace pill with a subtle border and background, for displaying each token; `tokenChipNew` adds a brief cyan glow animation when first introduced; `tokenChipGlow` is a longer-lived highlight applied to corpus tokens that match the most recent merge
- **`.panels`** is a flex row containing two `.panel` divs side by side; collapses to column on mobile
- **`.pairList`** uses bar overlays under the labels (similar visual to a horizontal bar chart inside list items)
- **`.pairItemChosen`** has a cyan accent (matches the chosen-merge highlight)
- **`.mergeList`** is a tight list; each item is a single line of monospace text
- **`.corpusGrid`** is `display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));` so words wrap into a responsive grid

The `tokenChipGlow` keyframe animation:

```css
@keyframes tokenGlow {
  0%   { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0); }
  20%  { box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.7); }
  100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0); }
}
.tokenChipGlow { animation: tokenGlow 800ms cubic-bezier(0.22, 1, 0.36, 1); }
@media (prefers-reduced-motion: reduce) {
  .tokenChipGlow { animation: none; outline: 2px solid var(--cyan-500); }
}
```

The token chip itself:

```css
.tokenChip {
  display: inline-block;
  padding: 1px 6px;
  margin: 1px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 3px;
}
.tokenChipNew {
  color: var(--cyan-300);
  border-color: var(--cyan-500);
  background: color-mix(in srgb, var(--cyan-500) 12%, var(--bg-elevated));
}
```

Adapt the rest from the existing widget CSS modules; the styling should feel consistent across all chapter widgets.

### 5. Update `src/components/widgets/index.ts`

```ts
export { default as BackpropVisualizer } from './ch01/BackpropVisualizer';
export { default as TrainingCurves } from './ch01/TrainingCurves';
export { default as AutogradGraph } from './ch01/AutogradGraph';
export { default as EmbeddingSpace } from './ch02/EmbeddingSpace';
export { default as Word2VecDynamics } from './ch02/Word2VecDynamics';
export { default as BPETraining } from './ch03/BPETraining';
// Session 16 will add:
// export { default as TokenizerComparison } from './ch03/TokenizerComparison';
```

### 6. Update `src/pages/ch03-tokenization/index.mdx`

Two edits:

**Edit A: Add widget import at top:**

```mdx
import { BPETraining } from '@components/widgets';
```

**Edit B: Replace section-3's `<WidgetFrame>` interior:**

Find:

```mdx
<WidgetFrame title="BPE training" caption="...">
  <div style={{ ... }}>
    Widget content — session 15 (marquee)
  </div>
</WidgetFrame>
```

Replace the `<div>` with:

```mdx
<WidgetFrame title="BPE training" caption="Watch BPE learn merges step by step on a small corpus. Each merge picks the most frequent adjacent pair; the vocabulary grows by one token each step.">
  <BPETraining client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 3 of Ch 3** renders with the working widget. Section 8's widget placeholder is still stubbed.
3. **Initial state (step 0):** the "Just merged" line reads "Initial corpus — no merges yet"; the pair-counts panel is empty; the recent-merges panel is empty; the corpus panel shows every word as a sequence of single-character chips.
4. **Click Play:** the widget advances through 25 merge steps at ~2 steps/sec (~12.5 seconds total). After each step:
   - The "Just merged" line updates with the chosen pair and the new token
   - The pair-counts panel shows the top 5 pairs with the chosen one highlighted in cyan
   - The recent-merges panel scrolls (newest at top); shows last 5 merges
   - The corpus panel updates: words containing the new merge are visibly shorter (fewer chips); the new token gets a brief cyan glow
   - The vocab size counter increments
5. **Scrubber works:** dragging the scrubber jumps to any step and re-renders all panels.
6. **By step ~5:** "th" and/or "the" should appear in the recent-merges panel and in the corpus's "the" entries. By step ~15: words like "cat", "dog", "sat" should be merged into single tokens.
7. **Token chips render whitespace visibly** (none expected in our corpus, but the `escapeWs` helper guards against it).
8. **Mobile (< 640px):** the two side-by-side panels stack vertically; corpus grid wraps to a single column; scrubber remains tappable.
9. **`prefers-reduced-motion: reduce`:** the cyan glow animation is replaced with a static cyan outline; transitions don't introduce motion.
10. **`npm run typecheck`** passes.
11. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not implement BPE encoding** (using trained merges to tokenize new text). That's the secondary widget's job (session 16).
- ❌ **Do not allow the user to edit the corpus.** Adding "type your own corpus" doubles complexity for marginal benefit.
- ❌ **Do not use byte-level BPE in this widget.** Character-level is more visually legible. The chapter prose (section 4) covers byte-level conceptually.
- ❌ **Do not implement pre-tokenization with the GPT-2 regex.** Whitespace splitting is enough for the widget; the chapter's section 6 covers the regex separately.
- ❌ **Do not modify Ch 1, Ch 2, or Ch 3's section-8 placeholder.**
- ❌ **Do not flip Ch 3's status.** Stays `'draft'` until session 16.

---

## Wire-up

```bash
git add src/components/widgets/ch03/ src/components/widgets/index.ts src/pages/ch03-tokenization/index.mdx
git commit -m "session 15: BPE training marquee widget — 10-sentence corpus, 25 merge steps"
git push origin main
```

Visit production. Verify the BPE widget runs end-to-end on Chapter 3.

---

## Notes for the session author

**On the 2-steps-per-second pace:** BPE merges are conceptually dense — each step involves looking at top pairs, identifying the chosen merge, watching the corpus update. 12 fps (used by Ch 2's `Word2VecDynamics`) would be too fast for this kind of step-by-step logic. 2 steps/sec gives the reader time to process each merge. Don't speed it up.

**On character-level vs byte-level:** real BPE uses bytes. This widget uses characters. The pedagogical trade-off is clear: bytes are necessary for production correctness but visually noisy in a widget (`b'\xe1\x84'` is not a friendly chip label). The chapter's prose section 4 establishes the byte-level concept in full; this widget shows the *algorithm's logic* clearly. Both are necessary; both are honest.

**On the corpus selection:** 10 sentences with heavy "the" repetition is intentional. It guarantees "th" emerges early as the highest-frequency pair, then "the", then word-level merges like "cat" and "dog". With a more varied corpus, the early merges would be less visually predictable; pedagogical clarity wins.

**On token chip styling:** the chip style (small monospace pill, subtle border) appears in three places (the "just merged" line, the pair-counts panel, the corpus panel). Consistency matters — the same visual element shows in different contexts. The `tokenChipNew` variant uses a cyan accent for the new token; `tokenChipGlow` adds a brief animation when first introduced.

**On the `escapeWs` helper:** the toy corpus has no whitespace inside word-tuples, so this never fires. But: a future polish session might extend the widget to use the GPT-2 regex with leading-space convention. In that case, tokens like `" the"` need a visible whitespace representation; `␣` (U+2423) is the standard. The helper is forward-compatible.

**On the recent-merges panel:** showing only the last 5 (not all 25) keeps the panel compact. Late in training, the reader can still see what's been learned recently. The full history is implicit in the corpus state (which has accumulated all merges).

**On the visual feedback for the chosen pair:** the chosen pair gets a cyan-accented row in the pair-counts panel. This makes the connection between "this pair has highest count" and "this is the merge we apply" immediate. Without the highlight, the reader has to manually correlate the top-of-list pair with the "Just merged" line — extra cognitive work.

**Pedagogical claim this widget supports:** "BPE training is a count-merge-update loop. At each step, the most frequent adjacent pair becomes a new token, and the corpus is updated to reflect that. The algorithm is mechanical; the results are interpretable." If the reader spends 30 seconds with this widget and walks away believing both halves of that claim, the widget has succeeded.

This is Chapter 3's marquee. Like Ch 2's `EmbeddingSpace`, it will be the most-shared visual from the chapter. Make it look right.

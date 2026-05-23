# Session 91 — Self-consistency aggregator secondary widget

> The secondary Chapter 20 widget. **An interactive demonstration of self-consistency** (Wang et al. 2022) — the simplest test-time compute technique that works. **Three pre-generated math problems**, each with **20 mock CoT traces** showing realistic answer variation (most correct, some wrong). **Slider for N (1 to 20)**: reader watches answer histogram grow and the majority winner stabilize as more traces accumulate. **The widget that makes "wisdom of crowds applied to a single model sampled N times" concrete** — and that motivates why test-time compute scaling works.

---

## Read first (in this order)

1. **`research/ch20-reasoning/research.md`** — concepts 2 (CoT) and 3 (self-consistency) are the source material
2. **`prompts/chapters/ch20-reasoning/session-89-page-structure.md`** — for the section-3 widget placeholder this session fills
3. **`prompts/chapters/ch20-reasoning/session-90-test-time-compute-curves-widget.md`** — for the Ch 20 widget conventions just established
4. **`prompts/chapters/ch19-sampling/session-87-sampling-distribution-widget.md`** — for the recent slider + histogram visualization pattern

---

## Goal

Replace the `<WidgetFrame title="Self-consistency aggregator">` placeholder in section 3 with a working interactive widget that:

- Offers **three pre-generated math problems** the user can switch between (each with a hidden correct answer revealed after sampling)
- For each problem, has **20 pre-generated mock CoT traces** with realistic variation (most arrive at the correct answer; ~20-30% are wrong with various plausible wrong answers)
- **Slider for N** (1 to 20): how many traces to include in the vote
- Renders the **first N traces** as cards showing brief reasoning + final answer
- Renders the **answer histogram** for just those N traces, with the winning answer highlighted
- **Result readout**: "Majority answer = X (confidence Y%)" with ✓ Correct or ✗ Wrong indicator
- **Comparison panel**: single-trace accuracy (probability a random single trace is correct) vs majority-vote accuracy at the current N
- Shows the **wisdom-of-crowds effect**: as N grows, majority vote stabilizes on the correct answer even when individual traces vary

**End state:** section 3 of Chapter 20 has a working secondary widget. After 30 seconds of interaction, the reader should be able to articulate: (a) **individual CoT traces vary** — some are wrong; (b) **as N grows, majority vote stabilizes** on the correct answer; (c) **the gain from N=1 to N=10 is the largest** (~20+ points typically); (d) **gains diminish past N=10-15** — the classic test-time compute saturation pattern.

---

## Inputs

State of the repo after session 90:

- `src/pages/ch20-reasoning/index.mdx` exists with prose; section 6's `TestTimeComputeCurves` widget is wired
- Section 3's widget is still stubbed
- `src/lib/chapters.ts` has Ch 20 as `'draft'`
- `src/components/widgets/ch20/` exists with `TestTimeComputeCurves` already

---

## Deliverables

1. **Create** `src/components/widgets/ch20/SelfConsistencyAggregator.tsx` — the React widget
2. **Create** `src/components/widgets/ch20/SelfConsistencyAggregator.module.css` — scoped styles
3. **Create** `src/components/widgets/ch20/self-consistency-data.ts` — three problems with 20 pre-generated traces each
4. **Update** `src/components/widgets/index.ts` — add `SelfConsistencyAggregator` export
5. **Update** `src/pages/ch20-reasoning/index.mdx` — replace section-3's `<WidgetFrame>` interior with `<SelfConsistencyAggregator client:visible />`

---

## Detailed spec

### 1. `self-consistency-data.ts` — three problems with 20 traces each

```ts
// src/components/widgets/ch20/self-consistency-data.ts

export interface MockTrace {
  reasoning: string;
  answer: number;
  isCorrect: boolean;
}

export interface MockProblem {
  id: string;
  question: string;
  correctAnswer: number;
  traces: MockTrace[];
}

/**
 * Three hand-curated problems with 20 pre-generated CoT traces each.
 * Traces are written to look like realistic model outputs:
 *  - Most arrive at the correct answer via varied reasoning paths
 *  - A minority make plausible mistakes (off-by-one, wrong operation, missed step)
 *  - Wrong answers are pedagogically realistic — what a real model might produce
 */
export const PROBLEMS: MockProblem[] = [
  {
    id: 'train',
    question: 'A train travels 60 miles in 2 hours. What is its speed in miles per hour?',
    correctAnswer: 30,
    traces: [
      { reasoning: 'Speed = distance / time = 60 / 2 = 30 mph.', answer: 30, isCorrect: true },
      { reasoning: '60 miles in 2 hours means 30 miles per hour.', answer: 30, isCorrect: true },
      { reasoning: 'Divide 60 by 2: 60/2 = 30. Speed is 30 mph.', answer: 30, isCorrect: true },
      { reasoning: 'Half of 60 is 30, so 30 mph.', answer: 30, isCorrect: true },
      { reasoning: 'In 1 hour the train covers 30 miles. So 30 mph.', answer: 30, isCorrect: true },
      { reasoning: 'Distance/time = 60/2 = 30. The answer is 30.', answer: 30, isCorrect: true },
      { reasoning: '60 miles / 2 hours = 30 mph. Final answer: 30.', answer: 30, isCorrect: true },
      { reasoning: 'I think we multiply: 60 × 2 = 120 mph.', answer: 120, isCorrect: false },
      { reasoning: 'Speed = distance + time = 60 + 2 = 62? No, that\'s wrong. Speed = 60/2 = 30.', answer: 30, isCorrect: true },
      { reasoning: 'rate × time = distance, so rate = 60/2 = 30 mph.', answer: 30, isCorrect: true },
      { reasoning: 'Speed = 60 ÷ 2 hours = 30 miles per hour.', answer: 30, isCorrect: true },
      { reasoning: 'Maybe it\'s 60 - 2 = 58? Hmm, that doesn\'t make sense. Use 60/2 = 30.', answer: 30, isCorrect: true },
      { reasoning: 'Hmm, 60 miles, 2 hours, so 60/2... let me think... 30 mph.', answer: 30, isCorrect: true },
      { reasoning: '2 hours for 60 miles. 60÷2 = 30 mph.', answer: 30, isCorrect: true },
      { reasoning: 'I\'ll just say 60. The train went 60 miles.', answer: 60, isCorrect: false },
      { reasoning: 'speed = 60/2 = 30 mph.', answer: 30, isCorrect: true },
      { reasoning: 'Each hour covers 30 miles. So 30 mph.', answer: 30, isCorrect: true },
      { reasoning: 'Wait, is it 30 or 40? Let me redo. 60/2 = 30. OK, 30 mph.', answer: 30, isCorrect: true },
      { reasoning: '120 mph since 60 + 60 = 120 in 2 hours? No wait, that\'s distance. Speed is 30.', answer: 30, isCorrect: true },
      { reasoning: 'I think it\'s 25 mph.', answer: 25, isCorrect: false },
    ],
  },
  {
    id: 'apples',
    question: 'The cafeteria had 23 apples. They used 20 for lunch and then bought 6 more. How many do they have now?',
    correctAnswer: 9,
    traces: [
      { reasoning: '23 - 20 = 3, then 3 + 6 = 9. The answer is 9.', answer: 9, isCorrect: true },
      { reasoning: 'Start: 23. Used 20: 23-20=3 left. Bought 6: 3+6=9.', answer: 9, isCorrect: true },
      { reasoning: '23 apples minus 20 = 3. Plus 6 = 9 apples.', answer: 9, isCorrect: true },
      { reasoning: '23 - 20 + 6 = 9.', answer: 9, isCorrect: true },
      { reasoning: 'Subtract 20 from 23: 3. Add 6: 9. Answer: 9.', answer: 9, isCorrect: true },
      { reasoning: '23 + 6 - 20 = 9 (rearranging doesn\'t change the result).', answer: 9, isCorrect: true },
      { reasoning: '23-20=3. 3+6=9. Final: 9.', answer: 9, isCorrect: true },
      { reasoning: '23 - 20 = 3. Wait, then minus 6? No, plus 6. So 9.', answer: 9, isCorrect: true },
      { reasoning: 'They had 23, gave 20 away, got 6. 23-20+6 = 9.', answer: 9, isCorrect: true },
      { reasoning: 'I forget the steps. Let me try: 23 + 20 - 6 = 37? Hmm, no. Actually 23-20+6=9.', answer: 9, isCorrect: true },
      { reasoning: 'started 23, used 20: 3. bought 6: 9.', answer: 9, isCorrect: true },
      { reasoning: 'They had 29 apples after all the transactions.', answer: 29, isCorrect: false },
      { reasoning: '23 - 20 = 3. 3 + 6 = 9.', answer: 9, isCorrect: true },
      { reasoning: 'After lunch: 23-20=3. After buying: 9. Answer: 9.', answer: 9, isCorrect: true },
      { reasoning: 'They have 9 left.', answer: 9, isCorrect: true },
      { reasoning: 'Total apples: 23+6=29, minus the 20 used = 9. Answer: 9.', answer: 9, isCorrect: true },
      { reasoning: 'Hmm, I subtract 26 from 23? That\'s negative. Let me redo. 23-20=3, +6=9.', answer: 9, isCorrect: true },
      { reasoning: '23 plus 6 is 29. Then minus 20 is 9.', answer: 9, isCorrect: true },
      { reasoning: 'I\'ll say 3 (the leftover after lunch).', answer: 3, isCorrect: false },
      { reasoning: '23 minus 20 plus 6 equals 9.', answer: 9, isCorrect: true },
    ],
  },
  {
    id: 'bookshelf',
    question: 'A bookshelf has 5 shelves with 12 books each. If 8 books are removed, how many books remain?',
    correctAnswer: 52,
    traces: [
      { reasoning: '5 × 12 = 60. 60 - 8 = 52.', answer: 52, isCorrect: true },
      { reasoning: 'Total: 5*12=60 books. Remove 8: 60-8=52.', answer: 52, isCorrect: true },
      { reasoning: '5 shelves × 12 books = 60 total. Minus 8 removed = 52.', answer: 52, isCorrect: true },
      { reasoning: '60 - 8 = 52.', answer: 52, isCorrect: true },
      { reasoning: 'Five times twelve is sixty. Subtract eight: fifty-two.', answer: 52, isCorrect: true },
      { reasoning: '5×12 = 60. After removal: 60-8 = 52 books.', answer: 52, isCorrect: true },
      { reasoning: '12 books per shelf, 5 shelves. 12*5 = 60. 60 - 8 = 52. Answer: 52.', answer: 52, isCorrect: true },
      { reasoning: 'If we remove 8, we have 12 books on 4 shelves plus 4 books on one shelf? Let me redo. Total was 60, now 52.', answer: 52, isCorrect: true },
      { reasoning: 'Total 60, minus 8 = 52.', answer: 52, isCorrect: true },
      { reasoning: 'I might forget: 5*12 = 60. 60 - 8 = 52.', answer: 52, isCorrect: true },
      { reasoning: 'Removing 8: starting from 60 → 52.', answer: 52, isCorrect: true },
      { reasoning: 'I think 5+12-8 = 9 books. Wait that doesn\'t make sense. Let me redo. 5*12=60, 60-8=52.', answer: 52, isCorrect: true },
      { reasoning: '60 books minus 8 = 52.', answer: 52, isCorrect: true },
      { reasoning: 'Hmm, 5*12 = 60. Then subtract 8 = 52.', answer: 52, isCorrect: true },
      { reasoning: '5 × 12 = 60. 60 - 8 = 52 books.', answer: 52, isCorrect: true },
      { reasoning: 'There are 5*12-8 = 60-8 = 52 books.', answer: 52, isCorrect: true },
      { reasoning: 'I\'ll guess 48.', answer: 48, isCorrect: false },
      { reasoning: 'Five times twelve is fifty, then minus eight is forty-two. Hmm wait, 5×12=60, not 50. So 60-8=52.', answer: 52, isCorrect: true },
      { reasoning: '5*12 = 60, total. Remove 8 = 52 remain.', answer: 52, isCorrect: true },
      { reasoning: 'Without thinking carefully: 12 - 8 = 4 books per shelf × 5 = 20.', answer: 20, isCorrect: false },
    ],
  },
];

/** Aggregate the first N traces; return the majority answer + counts. */
export interface AggregateResult {
  counts: Map<number, number>;     // answer → count
  sortedAnswers: { answer: number; count: number }[];
  majorityAnswer: number;
  majorityCount: number;
  confidence: number;               // majorityCount / N
}

export function aggregate(traces: MockTrace[], n: number): AggregateResult {
  const sampled = traces.slice(0, n);
  const counts = new Map<number, number>();
  for (const t of sampled) {
    counts.set(t.answer, (counts.get(t.answer) ?? 0) + 1);
  }
  const sortedAnswers = Array.from(counts.entries())
    .map(([answer, count]) => ({ answer, count }))
    .sort((a, b) => b.count - a.count);
  const top = sortedAnswers[0]!;
  return {
    counts,
    sortedAnswers,
    majorityAnswer: top.answer,
    majorityCount: top.count,
    confidence: top.count / n,
  };
}

/** Single-trace accuracy: fraction of traces that are correct. */
export function singleTraceAccuracy(problem: MockProblem): number {
  return problem.traces.filter(t => t.isCorrect).length / problem.traces.length;
}

/** Insight text based on N and confidence. */
export function insightFor(n: number, isCorrect: boolean, confidence: number): string {
  if (n === 1) {
    return isCorrect
      ? 'Single trace happened to be right — but with only N=1, we have no way to know if we got lucky.'
      : 'Single trace is wrong. With N=1, there is no error correction.';
  }
  if (n <= 3) {
    return isCorrect
      ? 'Small N — majority vote works but confidence is low. Need more traces for reliability.'
      : 'Wrong traces are still outvoting correct ones. Increase N to let the majority emerge.';
  }
  if (n <= 8) {
    return isCorrect
      ? `Mid-range N gives a stable majority. Confidence ${(confidence * 100).toFixed(0)}% — getting reliable.`
      : 'Even at mid-range N, wrong answers can still cluster. Rare, but possible.';
  }
  return isCorrect
    ? `Large N stabilizes the result. Confidence ${(confidence * 100).toFixed(0)}%. Diminishing returns past here — extra traces add little.`
    : 'Even with large N, majority vote can fail if the model has systematic biases.';
}
```

### 2. Visual layout

```
ViewBox: 0 0 800 720

┌────────────────────────────────────────────────────────────────┐
│ Self-consistency aggregator                                      │
│                                                                  │
│ Problem:                                                         │
│   [ Train speed ]  [ Apple count ]  [ Bookshelf ]                │
│                                                                  │
│ A train travels 60 miles in 2 hours. What is its speed?          │
│ (correct answer revealed below)                                  │
│                                                                  │
│ Number of traces (N):  [─────────●──────────]  N = 7             │
│                                                                  │
│ Sampled traces (first N of 20):                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Trace 1  ✓  "Speed = distance / time = 60 / 2 = 30."  → 30   │ │
│ │ Trace 2  ✓  "60 miles in 2 hours means 30 mph."       → 30   │ │
│ │ Trace 3  ✓  "Divide 60 by 2: 60/2 = 30."              → 30   │ │
│ │ Trace 4  ✓  "Half of 60 is 30."                       → 30   │ │
│ │ Trace 5  ✓  "In 1 hour the train covers 30 miles."    → 30   │ │
│ │ Trace 6  ✓  "Distance/time = 60/2 = 30."              → 30   │ │
│ │ Trace 7  ✓  "60 miles / 2 hours = 30 mph."            → 30   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Answer distribution (N = 7):                                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  30  ███████████████  7 votes  ★ winner                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Result:                                                           │
│   Majority answer: 30  (confidence 100%)                          │
│   Correct answer: 30 — ✓ Match                                    │
│                                                                  │
│ Single-trace vs majority-vote:                                    │
│   Single trace correct ~80% of the time (in this problem's pool)  │
│   Majority vote at N = 7: 100% correct                            │
│                                                                  │
│ Insight:                                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Mid-range N gives a stable majority. Confidence 100% — getting│ │
│ │ reliable.                                                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click problem button → switches problem; resets N to current value
- Drag slider → reveals more / fewer traces; histogram and result update instantly
- Trace cards show: trace number, ✓/✗ indicator, brief reasoning excerpt, final answer
- Histogram bars: cyan for the majority winner, gray for other answers
- Result panel: ✓ Correct if majority matches correct answer; ✗ Wrong otherwise

**Visual encoding:**
- Correct-trace cards: subtle cyan border + ✓ icon
- Wrong-trace cards: subtle rose border + ✗ icon
- Majority bar: cyan, with ★ winner marker
- Other answer bars: gray, faded

### 3. `SelfConsistencyAggregator.tsx`

```tsx
import { useState, useMemo } from 'react';
import {
  PROBLEMS, aggregate, singleTraceAccuracy, insightFor,
} from './self-consistency-data';
import styles from './SelfConsistencyAggregator.module.css';

export default function SelfConsistencyAggregator() {
  const [problemIdx, setProblemIdx] = useState(0);
  const [n, setN] = useState(7);
  const problem = PROBLEMS[problemIdx]!;
  
  const result = useMemo(() => aggregate(problem.traces, n), [problem, n]);
  const singleAcc = useMemo(() => singleTraceAccuracy(problem), [problem]);
  const isCorrect = result.majorityAnswer === problem.correctAnswer;
  const insight = insightFor(n, isCorrect, result.confidence);
  const maxCount = result.sortedAnswers[0]?.count ?? 1;

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Self-consistency aggregator</div>
        <div className={styles.titleSubLabel}>
          N independent CoT traces · majority vote
        </div>
      </div>

      {/* Problem selector */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Problem:</span>
          <div className={styles.problemButtons}>
            {PROBLEMS.map((p, i) => (
              <button
                key={p.id}
                className={`${styles.problemButton} ${problemIdx === i ? styles.problemButtonActive : ''}`}
                onClick={() => setProblemIdx(i)}
              >{p.id}</button>
            ))}
          </div>
        </div>
        <div className={styles.questionRow}>
          {problem.question}
        </div>
      </div>

      {/* N slider */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Number of traces (N):</span>
          <span className={styles.controlValue}>N = {n}</span>
          <input
            type="range"
            min={1} max={20} step={1}
            value={n}
            onChange={e => setN(Number(e.target.value))}
            className={styles.slider}
            aria-label="Number of traces"
          />
        </div>
      </div>

      {/* Sampled traces */}
      <div className={styles.tracesPanel}>
        <div className={styles.tracesTitle}>
          Sampled traces (first {n} of {problem.traces.length})
        </div>
        <div className={styles.tracesList}>
          {problem.traces.slice(0, n).map((t, i) => (
            <div
              key={i}
              className={`${styles.traceRow} ${t.isCorrect ? styles.traceCorrect : styles.traceWrong}`}
            >
              <span className={styles.traceIdx}>#{i + 1}</span>
              <span className={styles.traceStatus}>{t.isCorrect ? '✓' : '✗'}</span>
              <span className={styles.traceReasoning}>{t.reasoning}</span>
              <span className={styles.traceAnswer}>→ {t.answer}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Answer distribution */}
      <div className={styles.histogramPanel}>
        <div className={styles.histogramTitle}>Answer distribution (N = {n})</div>
        <div className={styles.histogramBars}>
          {result.sortedAnswers.map(({ answer, count }, i) => {
            const widthPct = (count / maxCount) * 100;
            const isWinner = i === 0;
            const isCorrectAnswer = answer === problem.correctAnswer;
            return (
              <div key={answer} className={styles.histRow}>
                <span className={styles.histAnswerLabel}>{answer}</span>
                <div className={styles.histBarTrack}>
                  <div
                    className={`${styles.histBar} ${isWinner ? styles.histBarWinner : ''} ${isCorrectAnswer ? styles.histBarCorrectAnswer : ''}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className={styles.histCount}>
                  {count} vote{count !== 1 ? 's' : ''}
                  {isWinner && ' ★'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Result */}
      <div className={`${styles.resultPanel} ${isCorrect ? styles.resultCorrect : styles.resultWrong}`}>
        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>Majority answer:</span>
          <span className={styles.resultValue}>
            {result.majorityAnswer} (confidence {(result.confidence * 100).toFixed(0)}%)
          </span>
        </div>
        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>Correct answer:</span>
          <span className={styles.resultValue}>
            {problem.correctAnswer} {isCorrect ? '— ✓ Match' : '— ✗ Mismatch'}
          </span>
        </div>
      </div>

      {/* Comparison */}
      <div className={styles.comparisonPanel}>
        <div className={styles.comparisonTitle}>Single-trace vs majority-vote</div>
        <div className={styles.comparisonBody}>
          <div className={styles.comparisonRow}>
            <span className={styles.compLabel}>Single trace accuracy (pool average):</span>
            <span className={styles.compValue}>{(singleAcc * 100).toFixed(0)}%</span>
          </div>
          <div className={styles.comparisonRow}>
            <span className={styles.compLabel}>Majority vote at N = {n}:</span>
            <span className={`${styles.compValue} ${isCorrect ? styles.compValueCorrect : styles.compValueWrong}`}>
              {isCorrect ? '100% (correct)' : '0% (wrong)'}
            </span>
          </div>
        </div>
      </div>

      {/* Insight */}
      <div className={styles.insightPanel}>
        <div className={styles.insightLabel}>Insight</div>
        <div className={styles.insightText}>{insight}</div>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        Drag the slider from <strong>N=1</strong> upward. At <strong>N=1</strong>, you get whatever the
        first trace says — sometimes right, sometimes wrong. As <strong>N grows</strong>, wrong traces
        get outvoted; the correct answer emerges as the majority. <strong>Gains are largest from N=1 to N=10</strong>;
        past N=10-15, additional traces add little. This is self-consistency — the simplest test-time compute
        technique that works, and the conceptual ancestor of best-of-N+PRM and modern reasoning models.
      </div>
    </div>
  );
}
```

### 4. `SelfConsistencyAggregator.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.titlePanel, .controlsPanel, .tracesPanel, .histogramPanel, .resultPanel, .comparisonPanel, .insightPanel, .caption {
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

/* Controls */
.controlRow {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.controlLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
  min-width: 175px;
}
.controlValue {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--cyan-300);
  font-weight: 500;
  min-width: 70px;
}
.slider { flex: 1; min-width: 200px; }
.problemButtons { display: flex; gap: 0.3rem; flex-wrap: wrap; }
.problemButton {
  padding: 0.35rem 0.85rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 200ms;
}
.problemButton:hover {
  border-color: var(--cyan-500);
  color: var(--cyan-300);
}
.problemButtonActive {
  background: color-mix(in srgb, var(--cyan-500) 10%, var(--bg-primary));
  border-color: var(--cyan-500);
  color: var(--cyan-300);
  font-weight: 500;
}
.questionRow {
  margin-top: 0.5rem;
  padding: 0.5rem 0.7rem;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  font-size: 0.85rem;
  color: var(--text-primary);
  line-height: 1.5;
}

/* Traces */
.tracesTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.55rem;
  font-weight: 500;
}
.tracesList {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 240px;
  overflow-y: auto;
}
.traceRow {
  display: grid;
  grid-template-columns: 40px 22px 1fr 60px;
  gap: 0.5rem;
  align-items: center;
  padding: 0.35rem 0.6rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  background: var(--bg-primary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
}
.traceCorrect {
  border-color: color-mix(in srgb, var(--cyan-500) 35%, var(--border-subtle));
}
.traceWrong {
  border-color: color-mix(in srgb, var(--rose-400) 35%, var(--border-subtle));
  background: color-mix(in srgb, var(--rose-400) 3%, var(--bg-primary));
}
.traceIdx { color: var(--text-tertiary); font-size: 0.72rem; }
.traceStatus {
  text-align: center;
  font-weight: 700;
}
.traceCorrect .traceStatus { color: var(--cyan-300); }
.traceWrong .traceStatus { color: var(--rose-400); }
.traceReasoning {
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.traceAnswer {
  font-weight: 500;
  color: var(--text-primary);
  text-align: right;
}

/* Histogram */
.histogramTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.55rem;
  font-weight: 500;
}
.histogramBars { display: flex; flex-direction: column; gap: 0.35rem; }
.histRow {
  display: grid;
  grid-template-columns: 60px 1fr 120px;
  gap: 0.6rem;
  align-items: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
}
.histAnswerLabel {
  text-align: right;
  color: var(--text-primary);
  font-weight: 500;
}
.histBarTrack {
  height: 22px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 3px;
  overflow: hidden;
}
.histBar {
  height: 100%;
  background: var(--text-tertiary);
  opacity: 0.5;
  transition: width 250ms ease-out;
}
.histBarWinner {
  background: linear-gradient(90deg, var(--cyan-600, #0891b2), var(--cyan-400));
  opacity: 1;
}
.histBarCorrectAnswer:not(.histBarWinner) {
  background: color-mix(in srgb, var(--cyan-400) 50%, var(--text-tertiary));
  opacity: 0.7;
}
.histCount {
  color: var(--text-secondary);
  font-size: 0.78rem;
}

/* Result */
.resultPanel {
  background: color-mix(in srgb, var(--cyan-500) 4%, var(--bg-elevated));
  border: 1px solid var(--cyan-500);
}
.resultWrong {
  background: color-mix(in srgb, var(--rose-400) 4%, var(--bg-elevated));
  border-color: var(--rose-400);
}
.resultRow {
  display: flex;
  justify-content: space-between;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.88rem;
  padding: 0.2rem 0;
}
.resultLabel { color: var(--text-secondary); }
.resultValue { color: var(--text-primary); font-weight: 500; }
.resultCorrect .resultValue { color: var(--cyan-300); }
.resultWrong .resultValue { color: var(--rose-400); }

/* Comparison */
.comparisonTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.4rem;
  font-weight: 500;
}
.comparisonBody { display: flex; flex-direction: column; gap: 0.3rem; }
.comparisonRow {
  display: flex;
  justify-content: space-between;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
}
.compLabel { color: var(--text-secondary); }
.compValue { color: var(--text-primary); font-weight: 500; }
.compValueCorrect { color: var(--cyan-300); }
.compValueWrong { color: var(--rose-400); }

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

@media (max-width: 720px) {
  .controlRow { flex-direction: column; align-items: flex-start; }
  .controlLabel, .controlValue { min-width: 0; }
  .traceRow {
    grid-template-columns: 30px 18px 1fr 50px;
    gap: 0.3rem;
    font-size: 0.72rem;
  }
  .histRow { grid-template-columns: 45px 1fr 80px; gap: 0.4rem; font-size: 0.78rem; }
  .resultRow, .comparisonRow { font-size: 0.76rem; flex-direction: column; gap: 0.1rem; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as TestTimeComputeCurves } from './ch20/TestTimeComputeCurves';
export { default as SelfConsistencyAggregator } from './ch20/SelfConsistencyAggregator';
```

### 6. Update `src/pages/ch20-reasoning/index.mdx`

**Edit A: Update widget import:**

```mdx
import { TestTimeComputeCurves, SelfConsistencyAggregator } from '@components/widgets';
```

**Edit B: Replace section-3's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Self-consistency aggregator" caption="Three math problems, each with 20 pre-generated CoT traces (most correct, some wrong). Adjust N from 1 to 20; watch traces accumulate; majority vote emerges as N grows. Gains from N=1 to N=10 are large; past N=10-15, additional traces add little. The simplest test-time compute technique that works — and the conceptual ancestor of modern reasoning.">
  <SelfConsistencyAggregator client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 3 of Ch 20** renders with the working widget. Section 6's marquee widget still works.
3. **Default state**: problem = "train", N = 7. Traces shown, majority emerging.
4. **Three problem buttons**: train / apples / bookshelf. Active button highlighted in cyan.
5. **Slider**: N from 1 to 20. Live value displayed.
6. **Question panel** shows the chosen problem's question.
7. **Sampled traces list**: shows first N traces. Each row has #, ✓/✗, reasoning (truncated), → answer.
8. **Correct traces**: subtle cyan border. **Wrong traces**: subtle rose border + rose tint.
9. **Histogram**: shows answer counts. Winner bar is cyan (gradient); others gray. Each bar has answer + count + ★ for winner.
10. **Result panel**: shows majority answer + confidence + correct-answer + ✓/✗. Cyan background if correct; rose if wrong.
11. **Comparison panel**: shows single-trace pool average vs majority-vote outcome.
12. **Insight text** changes with N — different message at N=1, N=3, N=8, N=15+.
13. **At N=1**: histogram has 1 bar. Result reflects whichever trace was first.
14. **At N=20**: full pool used. Majority should match correct answer for all three problems.
15. **Scrollable trace list**: if N > ~8, list scrolls (max-height 240px).
16. **Switch problems**: works; resets the displayed traces; histogram updates.
17. **Mobile**: layout stacks; trace cards remain readable.
18. **`npm run typecheck`** passes.
19. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not call a real LLM**. Traces are pre-written for pedagogy.
- ❌ **Do not implement temperature controls**. The pool variation simulates sampling diversity.
- ❌ **Do not implement PRM scoring**. That's a different technique (section 5).
- ❌ **Do not animate trace-by-trace accumulation**. Slider drag is sufficient.
- ❌ **Do not allow user-provided problems**. Three fixed problems.
- ❌ **Do not flip Ch 20's status**. Session 117 owns.

---

## Wire-up

```bash
git add src/components/widgets/ch20/SelfConsistencyAggregator.tsx src/components/widgets/ch20/SelfConsistencyAggregator.module.css src/components/widgets/ch20/self-consistency-data.ts src/components/widgets/index.ts src/pages/ch20-reasoning/index.mdx
git commit -m "session 91: self-consistency aggregator secondary widget"
git push origin main
```

---

## Notes for the session author

**On the three problems being a difficulty gradient:**
- **Train** (60/2): single-step arithmetic; should converge fast
- **Apples** (23-20+6): two-step; slight risk of order-of-operations confusion
- **Bookshelf** (5×12-8): multi-step with multiplication; more chances for error

Notes-for-author: "**The three problems span a small difficulty gradient** so the reader can see how the pool-correctness rate varies. Train ~80% correct; apples ~85%; bookshelf ~85%. The widget doesn't make a big deal of this — it's just realistic variation."

**On the pre-written traces being pedagogically realistic:**
Real model traces vary in *reasoning style* but cluster on a small set of *final answers*. The mock traces capture this:
- Multiple traces arrive at the correct answer via different reasoning (some terse, some verbose, some with redundant verification)
- Wrong traces make *plausible* mistakes (wrong operation, off-by-one, premature conclusion)
- Some traces *self-correct* mid-reasoning ("Wait, let me redo that")

Notes-for-author: "**The traces should feel like real model outputs**, not artificial mock data. Self-correction, hesitation, terseness, verbosity — all included."

**On the wisdom-of-crowds being visible in two interactions:**
The widget's pedagogical power comes from:
1. **Drag N from 1 to 20**: watch the histogram grow; the majority stabilize
2. **Compare single-trace accuracy** (~80%) **to majority-vote accuracy** (100% at sufficient N)

Notes-for-author: "**The 'aha' moment is the comparison panel**: single trace is 80% reliable; majority vote at N=7 is 100%. That gap is the wisdom-of-crowds effect made numeric."

**On the histogram colors carrying meaning:**
- **Winner**: cyan gradient (the chosen answer)
- **Correct answer if not winner**: dimmer cyan (so even when wrong, reader sees where the correct answer is in the distribution)
- **Other answers**: gray, low opacity

Notes-for-author: "If the majority is wrong (rare at N=20 but possible at low N), the histogram should still show *where the correct answer is* in cyan-dim. **This makes the failure mode visible.**"

**On the insight text adapting across N:**
Four message ranges:
- N=1: "Single trace — no error correction"
- N=2-3: "Small N — majority works but unreliable"
- N=4-8: "Mid-range — stable majority emerging"
- N=9-20: "Large N stabilizes; diminishing returns past here"

Notes-for-author: "**The insight messages tell the reader what they're seeing.** Without them, the slider feels arbitrary. With them, each N has pedagogical context."

**On the wrong-trace styling:**
Wrong traces get a rose-tinted background and rose ✗ marker. **Visually clear which traces are dragging the wrong answer**. Notes-for-author: "When the reader sees rose cards, they think 'these are the noise'. Cyan cards = 'this is the signal'. The visual contrast makes the wisdom-of-crowds story tangible."

**On the "single trace accuracy" being the pool average:**
The "single-trace accuracy" panel shows the *pool* probability that a randomly chosen trace is correct (e.g., 80% for train). This is a stable number per problem. **At sufficient N, majority vote dominates this** — the comparison panel makes the gain explicit.

**On the diminishing-returns story:**
The caption explicitly says "gains are largest from N=1 to N=10; past N=10-15, additional traces add little." **This is the test-time compute scaling story in miniature** — and previews section 6's curves. Notes-for-author: "The self-consistency widget previews the test-time compute curves widget. Same story, single technique."

**Pedagogical claim this widget supports:**
"Self-consistency works because the *correct* answer tends to appear more often across independent reasoning traces than any specific wrong answer. Even when individual traces vary (some wrong), the majority vote recovers the truth — provided N is large enough. Gains are largest from N=1 to N=10; past N=10-15, returns diminish. **This is the simplest test-time compute technique that works**, and the conceptual ancestor of more sophisticated methods (best-of-N+PRM, modern reasoning models)."

After 30 seconds of interaction (one slider drag + maybe one problem switch), the reader has internalized: (a) individual traces vary; (b) majority vote stabilizes; (c) gains saturate around N=10-15; (d) self-consistency is the simplest form of test-time compute.

**This widget pairs with the marquee** (section 6's compute curves): self-consistency is *one* of the curves there. The aggregator shows how *that specific curve* arises. Together they form a complete picture.

Build with care.

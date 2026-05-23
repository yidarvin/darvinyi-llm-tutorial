# Session 79 — Ch 17 speculative decoding + exercises + closeout

> **The Chapter 17 closeout.** Three deliverables: (1) implement the **Speculative Decoding** secondary widget — animated draft+verify pattern with adjustable $k$ and acceptance rate $\alpha$, showing token-by-token acceptance/rejection and computing live speedup; (2) add an **Exercises section** with 4 problems (KV cache memory, naive vs cached decoding, speculative speedup formula, continuous batching simulator); (3) flip Ch 17's status from `'draft'` to `'published'`. **Closes Ch 17 — the chapter that opens Phase 12.**

This is a **single-topic chapter** (4-file cadence). The secondary widget gets combined with exercises in this final session — the standard closeout pattern.

---

## Read first (in this order)

1. **`research/ch17-inference-optimization/research.md`** — concept 6 (speculative decoding) and the speedup formula
2. **`prompts/chapters/ch17-inference-optimization/session-77-page-structure.md`** — for the section-6 widget placeholder and exercise placement
3. **`prompts/chapters/ch17-inference-optimization/session-78-kv-cache-animation-widget.md`** — for the Ch 17 widget conventions
4. **`prompts/chapters/ch16-distillation/session-75-distillation-pipeline-and-exercises-and-closeout.md`** — for the recent secondary-widget + exercises + closeout pattern

---

## Goal

By end of session, three things change in the repo:

1. **`SpeculativeDecoding` widget** is implemented and wired into section 6 of Ch 17. Replaces the existing `<WidgetFrame>` placeholder.
2. **An "Exercises" section** is inserted into `index.mdx`. Per the section structure, this goes between section 7 ("PagedAttention and modern stacks") and section 8 ("The full inference picture"). Four exercises with hints + runnable starter code.
3. **Ch 17's status flips from `'draft'` to `'published'`** in `src/lib/chapters.ts`. Ch 17 is the seventeenth published chapter — and the first of Phase 12.

After this session: **Ch 17 is complete.** Phase 12 is 1/3 done; Ch 18 (quantization) and Ch 19 (sampling) remain.

---

## Inputs

State of the repo after session 78:

- Section 3's `KVCacheAnimation` marquee widget is wired
- Section 6's widget is still stubbed
- All 2 runnable code blocks from session 77 are in place
- `src/lib/chapters.ts` has Ch 1-16 `'published'`, Ch 17 `'draft'`
- `src/components/widgets/ch17/` exists with one widget already

---

## Deliverables

1. **Create** `src/components/widgets/ch17/SpeculativeDecoding.tsx` — the React widget
2. **Create** `src/components/widgets/ch17/SpeculativeDecoding.module.css` — scoped styles
3. **Create** `src/components/widgets/ch17/speculative-data.ts` — speedup math and simulation
4. **Update** `src/components/widgets/index.ts` — add `SpeculativeDecoding` export
5. **Update** `src/pages/ch17-inference-optimization/index.mdx`:
   - Replace section-6's `<WidgetFrame>` interior with `<SpeculativeDecoding client:visible />`
   - Insert new `## Exercises` section between section 7 ("PagedAttention and modern stacks") and section 8 ("The full inference picture")
6. **Update** `src/lib/chapters.ts` — change Ch 17's `status` from `'draft'` to `'published'`

**Do not modify** any other file. Earlier chapters and widgets are sealed. Ch 17's marquee widget is sealed.

---

## Detailed spec

### Part A — `SpeculativeDecoding` widget

#### A.1 `speculative-data.ts`

```ts
// src/components/widgets/ch17/speculative-data.ts

/** Seeded PRNG for deterministic simulation. */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type TokenStatus = 'accepted' | 'rejected' | 'corrected' | 'discarded' | 'pending';

export interface RoundToken {
  index: number;          // position in the draft (0-indexed)
  status: TokenStatus;
  label: string;          // shown on the token box
}

/**
 * Simulate one round of speculative decoding.
 * @param k          draft length (number of tokens proposed)
 * @param alpha      acceptance rate (per-token probability of agreement)
 * @param seed       random seed
 */
export function simulateRound(k: number, alpha: number, seed: number): {
  tokens: RoundToken[];
  accepted: number;
  corrected: boolean;
  totalEmitted: number;
} {
  const rand = mulberry32(seed);
  const tokens: RoundToken[] = [];
  let firstReject = -1;

  // Phase 1: per-token accept/reject simulation
  for (let i = 0; i < k; i++) {
    if (firstReject >= 0) {
      tokens.push({ index: i, status: 'discarded', label: `t${i+1}` });
      continue;
    }
    if (rand() < alpha) {
      tokens.push({ index: i, status: 'accepted', label: `t${i+1}` });
    } else {
      tokens.push({ index: i, status: 'rejected', label: `t${i+1}` });
      firstReject = i;
    }
  }

  // If there was a rejection, big model emits a corrected token at that position
  const corrected = firstReject >= 0;
  if (corrected) {
    tokens.push({
      index: firstReject,
      status: 'corrected',
      label: `t${firstReject+1}'`,
    });
  }

  const accepted = tokens.filter(t => t.status === 'accepted').length;
  const totalEmitted = accepted + (corrected ? 1 : 0);

  return { tokens, accepted, corrected, totalEmitted };
}

/** Theoretical expected speedup. */
export function expectedSpeedup(k: number, alpha: number, draftCost = 0.02, overhead = 0.05): {
  expectedAccepted: number;
  expectedEmitted: number;
  costPerRound: number;
  speedup: number;
} {
  // Expected accepted tokens before first rejection (geometric-like)
  const expectedAccepted = alpha < 1
    ? (1 - Math.pow(alpha, k + 1)) / (1 - alpha) - 1
    : k;
  // Each round emits expected_accepted (drafts) + 1 (corrected from big model)
  const expectedEmitted = expectedAccepted + 1;
  // Cost: 1 big pass + k draft passes + overhead
  const costPerRound = 1 + k * draftCost + overhead;
  const speedup = expectedEmitted / costPerRound;

  return { expectedAccepted, expectedEmitted, costPerRound, speedup };
}
```

#### A.2 Visual layout

```
ViewBox: 0 0 800 720

┌────────────────────────────────────────────────────────────────┐
│ Speculative decoding                                              │
│                                                                  │
│ Controls:                                                         │
│   k (draft length):   [───●──]  k = 5                            │
│   α (acceptance):     [────●─]  α = 0.7                           │
│   [↻ Resample]                                                    │
│                                                                  │
│ One round of speculative decoding:                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 1. Draft model proposes k = 5 tokens (cheap, fast):          │ │
│ │                                                                │ │
│ │     [t1] [t2] [t3] [t4] [t5]                                  │ │
│ │                                                                │ │
│ │ 2. Big model verifies all 5 in ONE forward pass:              │ │
│ │                                                                │ │
│ │     [t1 ✓] [t2 ✓] [t3 ✓] [t4 ✗] [t5 –]                       │ │
│ │     accept  accept  accept  REJECT discarded                  │ │
│ │                                                                │ │
│ │ 3. Big model emits corrected token at position 4:              │ │
│ │                                                                │ │
│ │     [t4']                                                      │ │
│ │                                                                │ │
│ │ Net per round:                                                 │ │
│ │   • 3 draft tokens accepted                                   │ │
│ │   • 1 big-model correction                                    │ │
│ │   • Total: 4 tokens emitted per 1 big-model pass              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Expected (analytical at α = 0.7, k = 5):                         │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Expected accepted:     2.33 draft tokens                       │ │
│ │ Expected emitted:      3.33 tokens per round                   │ │
│ │ Cost per round:        1.15 big-model-equivalents              │ │
│ │ → Speedup:             3.33 / 1.15 = 2.9× per round            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Speedup landscape:                                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │      α=0.3   α=0.5   α=0.7   α=0.9                            │ │
│ │ k=1   1.25×   1.40×   1.60×   1.81×                           │ │
│ │ k=3   1.51×   1.91×   2.41×   2.84×                           │ │
│ │ k=5   1.58×   2.10×   2.86×   3.62×  ← current setting        │ │
│ │ k=7   1.59×   2.16×   3.11×   4.20×                           │ │
│ │ k=10  1.59×   2.18×   3.30×   4.94×                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- **k slider**: range 1-10, integer steps. Adjusts draft length.
- **α slider**: range 0.1-0.95 (in 0.05 steps). Adjusts acceptance rate.
- **↻ Resample button**: generates a new simulation round with a different random seed (same k and α).
- **One round visualization** updates immediately when sliders change. Draft tokens render as boxes; verification results show acceptance/rejection markers; corrected token appears in cyan.
- **Expected analytical readout** updates live with current k and α.
- **Speedup landscape table**: shows speedup across 5 ranks (k = 1, 3, 5, 7, 10) and 4 acceptance rates (α = 0.3, 0.5, 0.7, 0.9). Current cell is highlighted.

#### A.3 `SpeculativeDecoding.tsx`

```tsx
import { useState, useMemo } from 'react';
import { simulateRound, expectedSpeedup, type RoundToken } from './speculative-data';
import styles from './SpeculativeDecoding.module.css';

const K_VALUES = [1, 3, 5, 7, 10];
const ALPHA_VALUES = [0.3, 0.5, 0.7, 0.9];

export default function SpeculativeDecoding() {
  const [k, setK] = useState(5);
  const [alpha, setAlpha] = useState(0.7);
  const [seed, setSeed] = useState(42);

  const round = useMemo(() => simulateRound(k, alpha, seed), [k, alpha, seed]);
  const expected = useMemo(() => expectedSpeedup(k, alpha), [k, alpha]);

  return (
    <div className={styles.widget}>
      {/* Controls */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>k (draft length):</span>
          <span className={styles.controlValue}>k = {k}</span>
          <input
            type="range"
            min={1} max={10} step={1}
            value={k}
            onChange={e => setK(Number(e.target.value))}
            className={styles.slider}
            aria-label="draft length k"
          />
        </div>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>α (acceptance):</span>
          <span className={styles.controlValue}>α = {alpha.toFixed(2)}</span>
          <input
            type="range"
            min={0.1} max={0.95} step={0.05}
            value={alpha}
            onChange={e => setAlpha(Number(e.target.value))}
            className={styles.slider}
            aria-label="acceptance rate alpha"
          />
        </div>
        <div className={styles.controlRow}>
          <button
            className={styles.resampleButton}
            onClick={() => setSeed(s => s + 1)}
          >↻ Resample</button>
          <span className={styles.controlHint}>
            (re-runs the simulation with a new random seed)
          </span>
        </div>
      </div>

      {/* One round visualization */}
      <div className={styles.roundPanel}>
        <div className={styles.roundTitle}>One round of speculative decoding</div>
        <RoundVisualization round={round} k={k} />
      </div>

      {/* Expected analytical */}
      <div className={styles.expectedPanel}>
        <div className={styles.expectedTitle}>
          Expected (analytical, at α = {alpha.toFixed(2)}, k = {k})
        </div>
        <ExpectedReadout {...expected} />
      </div>

      {/* Speedup landscape */}
      <div className={styles.landscapePanel}>
        <div className={styles.landscapeTitle}>Speedup landscape (sweep k and α)</div>
        <SpeedupTable currentK={k} currentAlpha={alpha} />
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        Speculative decoding uses a small draft model to propose $k$ tokens in parallel; the big model verifies
        them in <strong>one forward pass</strong>. Accepted tokens are kept; the first rejection triggers a
        correction from the big model. <strong>Net result: more than 1 token per big-model pass.</strong> Speedup
        depends on $k$ (draft length) and $\alpha$ (acceptance rate). Typical sweet spot: $k = 5$, $\alpha = 0.7$
        → ~2-3× speedup.
      </div>
    </div>
  );
}

interface RoundVisualizationProps {
  round: ReturnType<typeof simulateRound>;
  k: number;
}

function RoundVisualization({ round, k }: RoundVisualizationProps) {
  const draftTokens = round.tokens.filter(t => t.status !== 'corrected').slice(0, k);
  const correctedToken = round.tokens.find(t => t.status === 'corrected');

  return (
    <div className={styles.roundContent}>
      {/* Step 1: draft proposes */}
      <div className={styles.stepRow}>
        <div className={styles.stepNumber}>1.</div>
        <div className={styles.stepContent}>
          <div className={styles.stepLabel}>Draft model proposes k = {k} tokens (cheap, fast):</div>
          <div className={styles.tokenRow}>
            {draftTokens.map(t => (
              <TokenBox key={`draft-${t.index}`} status="pending" label={t.label} />
            ))}
          </div>
        </div>
      </div>

      {/* Step 2: big model verifies */}
      <div className={styles.stepRow}>
        <div className={styles.stepNumber}>2.</div>
        <div className={styles.stepContent}>
          <div className={styles.stepLabel}>Big model verifies all {k} in ONE forward pass:</div>
          <div className={styles.tokenRow}>
            {draftTokens.map(t => (
              <TokenBox key={`verify-${t.index}`} status={t.status} label={t.label} />
            ))}
          </div>
          <div className={styles.verifyAnnotations}>
            {draftTokens.map(t => (
              <span key={`anno-${t.index}`} className={`${styles.anno} ${styles[`anno_${t.status}`]}`}>
                {t.status === 'accepted' && 'accept'}
                {t.status === 'rejected' && 'REJECT'}
                {t.status === 'discarded' && 'discarded'}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Step 3: corrected token (if any) */}
      {correctedToken && (
        <div className={styles.stepRow}>
          <div className={styles.stepNumber}>3.</div>
          <div className={styles.stepContent}>
            <div className={styles.stepLabel}>Big model emits the corrected token:</div>
            <div className={styles.tokenRow}>
              <TokenBox status="corrected" label={correctedToken.label} />
            </div>
          </div>
        </div>
      )}

      {/* Net summary */}
      <div className={styles.netSummary}>
        <div className={styles.netSummaryRow}>
          <span className={styles.summaryDot} style={{ background: 'var(--emerald-400)' }} />
          <span className={styles.summaryText}>{round.accepted} draft tokens accepted</span>
        </div>
        {round.corrected && (
          <div className={styles.netSummaryRow}>
            <span className={styles.summaryDot} style={{ background: 'var(--cyan-400)' }} />
            <span className={styles.summaryText}>1 big-model correction</span>
          </div>
        )}
        <div className={styles.netSummaryRow}>
          <strong className={styles.summaryText}>
            Total: {round.totalEmitted} token{round.totalEmitted === 1 ? '' : 's'} emitted per 1 big-model pass
          </strong>
        </div>
      </div>
    </div>
  );
}

function TokenBox({ status, label }: { status: RoundToken['status']; label: string }) {
  return (
    <div className={`${styles.tokenBox} ${styles[`tokenBox_${status}`]}`}>
      <span className={styles.tokenLabel}>{label}</span>
      {status === 'accepted' && <span className={styles.tokenMark}>✓</span>}
      {status === 'rejected' && <span className={styles.tokenMark}>✗</span>}
      {status === 'discarded' && <span className={styles.tokenMark}>–</span>}
      {status === 'corrected' && <span className={styles.tokenMark}>✓</span>}
    </div>
  );
}

interface ExpectedReadoutProps {
  expectedAccepted: number;
  expectedEmitted: number;
  costPerRound: number;
  speedup: number;
}
function ExpectedReadout({ expectedAccepted, expectedEmitted, costPerRound, speedup }: ExpectedReadoutProps) {
  return (
    <div className={styles.expectedBody}>
      <div className={styles.expectedRow}>
        <span className={styles.expectedLabel}>Expected accepted:</span>
        <span className={styles.expectedValue}>{expectedAccepted.toFixed(2)} draft tokens</span>
      </div>
      <div className={styles.expectedRow}>
        <span className={styles.expectedLabel}>Expected emitted:</span>
        <span className={styles.expectedValue}>{expectedEmitted.toFixed(2)} tokens per round</span>
      </div>
      <div className={styles.expectedRow}>
        <span className={styles.expectedLabel}>Cost per round:</span>
        <span className={styles.expectedValue}>{costPerRound.toFixed(2)} big-model-equivalents</span>
      </div>
      <div className={styles.expectedDivider} />
      <div className={`${styles.expectedRow} ${styles.expectedHighlight}`}>
        <span className={styles.expectedLabel}>Speedup:</span>
        <span className={styles.expectedValue}>
          {expectedEmitted.toFixed(2)} / {costPerRound.toFixed(2)} = <strong>{speedup.toFixed(2)}×</strong>
        </span>
      </div>
    </div>
  );
}

function SpeedupTable({ currentK, currentAlpha }: { currentK: number; currentAlpha: number }) {
  return (
    <table className={styles.landscapeTable}>
      <thead>
        <tr>
          <th></th>
          {ALPHA_VALUES.map(a => (
            <th key={a}>α = {a}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {K_VALUES.map(rowK => (
          <tr key={rowK}>
            <td className={styles.rowLabel}>k = {rowK}</td>
            {ALPHA_VALUES.map(colAlpha => {
              const sp = expectedSpeedup(rowK, colAlpha).speedup;
              const isCurrent = rowK === currentK && Math.abs(colAlpha - currentAlpha) < 0.05;
              return (
                <td
                  key={`${rowK}-${colAlpha}`}
                  className={`${styles.cell} ${isCurrent ? styles.cellCurrent : ''}`}
                >
                  {sp.toFixed(2)}×{isCurrent && <span className={styles.currentMarker}> ← here</span>}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

#### A.4 `SpeculativeDecoding.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.controlsPanel, .roundPanel, .expectedPanel, .landscapePanel {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 0.85rem;
}

.controlRow {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.4rem;
  font-family: 'JetBrains Mono', monospace;
  flex-wrap: wrap;
}
.controlRow:last-child { margin-bottom: 0; }
.controlLabel {
  font-size: 0.82rem;
  color: var(--text-secondary);
  min-width: 130px;
}
.controlValue {
  font-size: 0.82rem;
  color: var(--cyan-300);
  font-weight: 500;
  min-width: 65px;
}
.slider { flex: 1; min-width: 180px; }
.controlHint {
  font-size: 0.7rem;
  color: var(--text-tertiary);
  font-style: italic;
}
.resampleButton {
  padding: 0.3rem 0.85rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  background: var(--bg-primary);
  color: var(--cyan-300);
  border: 1px solid var(--cyan-500);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 200ms;
}
.resampleButton:hover { background: color-mix(in srgb, var(--cyan-500) 8%, var(--bg-primary)); }

/* Round visualization */
.roundTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.7rem;
  font-weight: 500;
}
.roundContent { display: flex; flex-direction: column; gap: 0.85rem; }

.stepRow {
  display: flex;
  gap: 0.7rem;
  align-items: flex-start;
}
.stepNumber {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: var(--cyan-300);
  font-weight: 600;
  min-width: 20px;
}
.stepContent { flex: 1; }
.stepLabel {
  font-size: 0.84rem;
  color: var(--text-primary);
  margin-bottom: 0.45rem;
}
.tokenRow {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  align-items: center;
}
.tokenBox {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 50px;
  padding: 0.4rem 0.5rem;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--border-default);
  background: var(--bg-primary);
  font-family: 'JetBrains Mono', monospace;
  transition: all 200ms;
}
.tokenLabel { font-size: 0.78rem; font-weight: 500; }
.tokenMark { font-size: 0.95rem; line-height: 1; margin-top: 0.15rem; font-weight: 600; }

.tokenBox_pending {
  color: var(--text-secondary);
  border-color: var(--border-default);
}
.tokenBox_accepted {
  background: color-mix(in srgb, var(--emerald-400) 10%, var(--bg-primary));
  border-color: var(--emerald-400);
  color: var(--emerald-400);
}
.tokenBox_rejected {
  background: color-mix(in srgb, var(--rose-400) 10%, var(--bg-primary));
  border-color: var(--rose-400);
  color: var(--rose-400);
}
.tokenBox_discarded {
  background: var(--bg-primary);
  border-color: var(--border-subtle);
  color: var(--text-tertiary);
  opacity: 0.5;
}
.tokenBox_corrected {
  background: color-mix(in srgb, var(--cyan-500) 12%, var(--bg-primary));
  border-color: var(--cyan-500);
  color: var(--cyan-300);
}

.verifyAnnotations {
  display: flex;
  gap: 0.35rem;
  margin-top: 0.25rem;
}
.anno {
  min-width: 50px;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  letter-spacing: 0.04em;
}
.anno_accepted  { color: var(--emerald-400); }
.anno_rejected  { color: var(--rose-400); font-weight: 600; }
.anno_discarded { color: var(--text-tertiary); font-style: italic; }

/* Net summary */
.netSummary {
  margin-top: 0.6rem;
  padding-top: 0.7rem;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.netSummaryRow {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
}
.summaryDot {
  display: inline-block;
  width: 8px; height: 8px;
  border-radius: 50%;
}
.summaryText { color: var(--text-primary); }
.summaryText strong { color: var(--cyan-300); }

/* Expected analytical */
.expectedTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.expectedBody { display: flex; flex-direction: column; gap: 0.3rem; }
.expectedRow {
  display: flex;
  justify-content: space-between;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
}
.expectedLabel { color: var(--text-secondary); }
.expectedValue { color: var(--text-primary); font-weight: 500; }
.expectedDivider {
  height: 1px;
  background: var(--border-subtle);
  margin: 0.35rem 0;
}
.expectedHighlight .expectedValue { color: var(--cyan-300); font-weight: 600; }
.expectedHighlight .expectedValue strong { color: var(--cyan-300); font-size: 1rem; }

/* Speedup landscape table */
.landscapeTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.landscapeTable {
  width: 100%;
  border-collapse: collapse;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
}
.landscapeTable th, .landscapeTable td {
  padding: 0.4rem 0.6rem;
  text-align: center;
  border-bottom: 1px solid var(--border-subtle);
}
.landscapeTable th {
  color: var(--text-tertiary);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}
.rowLabel {
  color: var(--text-tertiary);
  text-align: right;
  font-weight: 500;
}
.cell { color: var(--text-secondary); }
.cellCurrent {
  background: color-mix(in srgb, var(--cyan-500) 12%, transparent);
  color: var(--cyan-300);
  font-weight: 600;
}
.currentMarker {
  font-size: 0.7rem;
  font-style: italic;
  font-weight: normal;
  color: var(--cyan-300);
}

/* Caption */
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

@media (max-width: 720px) {
  .controlRow { flex-direction: column; align-items: stretch; }
  .controlLabel { min-width: 0; }
  .tokenBox { min-width: 40px; padding: 0.3rem 0.4rem; }
  .anno { min-width: 40px; font-size: 0.6rem; }
  .landscapeTable { font-size: 0.7rem; }
}
```

#### A.5 Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as KVCacheAnimation } from './ch17/KVCacheAnimation';
export { default as SpeculativeDecoding } from './ch17/SpeculativeDecoding';
```

#### A.6 Update `src/pages/ch17-inference-optimization/index.mdx`

**Edit A: Update widget import:**

```mdx
import { KVCacheAnimation, SpeculativeDecoding } from '@components/widgets';
```

**Edit B: Replace section-6's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Speculative decoding" caption="The draft model proposes k tokens; the big model verifies them in one parallel forward pass. Accepted tokens (emerald) are kept; first rejection (rose) triggers a correction (cyan). Sliders for k and α. Speedup landscape table shows how the speedup varies. At k=5, α=0.7: ~2.9× speedup per round.">
  <SpeculativeDecoding client:visible />
</WidgetFrame>
```

### Part B — Exercises section

Insert between section 7 ("PagedAttention and modern stacks") and section 8 ("The full inference picture"). Use this structure:

````mdx
## Exercises

Four exercises that lock in the chapter's machinery. Each is a self-contained problem with a starting template; hints are collapsed by default — try the problem first.

### Exercise 1 (easy) — KV cache memory calculator

Implement the KV cache memory formula and compute the cache size for various model sizes and context lengths.

<details>
<summary>Hint</summary>

The KV cache memory formula:
$$\text{KV cache size} = 2 \times L \times H \times d_{\text{head}} \times N \times \text{batch} \times \text{dtype bytes}$$

- $L$ = number of layers
- $H$ = number of heads
- $d_{\text{head}}$ = head dimension
- $N$ = current sequence length
- batch = batch size
- dtype bytes = 2 for BF16, 4 for FP32

The factor of 2 is for K and V (two stored tensors per position).

Compute for Llama-7B (32 layers, 32 heads, head_dim=128), Llama-13B (40, 40, 128), Llama-70B (80, 64, 128).

</details>

<RunnableCode
  client:visible
  defaultCode={`def kv_cache_size_gb(seq_len, n_layers, n_heads, head_dim, batch=1, dtype_bytes=2):
    """
    Compute KV cache memory in GB.
    Formula: 2 * layers * heads * head_dim * seq_len * batch * dtype_bytes
    """
    # TODO: implement
    pass

MODELS = {
    "Llama-7B":  {"layers": 32, "heads": 32, "head_dim": 128},
    "Llama-13B": {"layers": 40, "heads": 40, "head_dim": 128},
    "Llama-70B": {"layers": 80, "heads": 64, "head_dim": 128},
}

contexts = [1024, 4096, 32768, 131072]

# print(f"{'Model':<12} | {'1K':>10} {'4K':>10} {'32K':>10} {'128K':>10}")
# print("-" * 60)
# for name, spec in MODELS.items():
#     sizes = [kv_cache_size_gb(c, spec["layers"], spec["heads"], spec["head_dim"]) for c in contexts]
#     row = ' '.join(f'{s:>7.2f} GB' for s in sizes)
#     print(f"{name:<12} | {row}")

# At 128K context:
# - Llama-7B:  ~4 GB
# - Llama-13B: ~7 GB
# - Llama-70B: ~22 GB
# 
# This is per sequence. Batch 16: multiply by 16.
# This is why long-context serving is expensive — memory dominates.
`}
  packages={[]}
/>

### Exercise 2 (medium) — Naive vs cached decoding

Implement naive decoding (recompute everything per token) and cached decoding (reuse stored K, V). Compare timing.

<details>
<summary>Hint</summary>

**Naive**: at each decode step, run the *entire sequence* through the model. Cost per step: $O(N^2)$ for attention.

**Cached**: at each decode step, run only the *new token* through the model. Append its K, V to the cache. Cost per step: $O(N)$ for attention.

For mock model: each "layer" is a single matmul. Run for both modes on a sequence of length 100 + 50 generated tokens. Time both.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np
import time

np.random.seed(0)
d_model = 256
n_layers = 4
W = [np.random.normal(0, 0.02, (d_model, d_model)) for _ in range(n_layers)]

def naive_decode_step(all_tokens, weights):
    """Process ALL tokens through all layers — no cache."""
    # TODO: simulate naive forward; cost O(seq^2)
    pass

def cached_decode_step(new_token, kv_cache, weights):
    """Process ONLY the new token; append to cache."""
    # TODO: simulate cached forward; cost O(seq) per layer
    pass

# Setup: 100-token prompt, decode 50 tokens
prompt = np.random.normal(0, 1, (100, d_model))

# Naive timing
naive_start = time.time()
running = prompt
for _ in range(50):
    new = np.random.normal(0, 1, (1, d_model))
    running = np.concatenate([running, new], axis=0)
    # naive_decode_step(running, W)
naive_time = time.time() - naive_start

# Cached timing
kv_cache = [[] for _ in range(n_layers)]
# Prefill
# for tok in prompt:
#     cached_decode_step(tok, kv_cache, W)
cached_start = time.time()
for _ in range(50):
    new_token = np.random.normal(0, 1, (d_model,))
    # cached_decode_step(new_token, kv_cache, W)
cached_time = time.time() - cached_start

# Compare
# print(f"Naive decoding:  {naive_time*1000:.0f} ms")
# print(f"Cached decoding: {cached_time*1000:.0f} ms")
# print(f"Speedup: {naive_time/cached_time:.1f}×")
`}
  packages={["numpy"]}
/>

### Exercise 3 (medium) — Speculative speedup formula

Implement the speculative decoding speedup formula and verify it matches the widget's behavior.

<details>
<summary>Hint</summary>

Expected accepted tokens per round (geometric-like): if each token has probability $\alpha$ of being accepted and a rejection truncates the round, the expected number of consecutive acceptances before the first failure is:
$$E[\text{accepted}] = \sum_{i=1}^{k} \alpha^i = \frac{\alpha(1 - \alpha^k)}{1 - \alpha}$$

Or equivalently: $\frac{1 - \alpha^{k+1}}{1 - \alpha} - 1$.

**Each round always emits one "corrected" token from the big model** (either the corrected mismatch, or the next-token continuation if all $k$ are accepted). So expected emitted = expected accepted + 1.

**Cost per round** = 1 big-model pass + $k$ draft passes + framework overhead.

Speedup = expected emitted / cost per round.

</details>

<RunnableCode
  client:visible
  defaultCode={`def speculative_speedup(k, alpha, draft_cost=0.02, overhead=0.05):
    """
    Compute speculative decoding speedup.
    
    k: draft length
    alpha: acceptance rate
    draft_cost: draft inference cost / big inference cost
    overhead: framework overhead per round
    
    Returns: (expected_accepted, expected_emitted, cost_per_round, speedup)
    """
    # TODO: implement
    pass

# Verify behavior across k and alpha
K_VALUES = [1, 3, 5, 7, 10]
ALPHA_VALUES = [0.3, 0.5, 0.7, 0.9]

# print(f"{'k':>3} | " + ' '.join(f'α={a:.1f}' for a in ALPHA_VALUES))
# print("-" * 50)
# for k in K_VALUES:
#     speedups = []
#     for alpha in ALPHA_VALUES:
#         _, _, _, sp = speculative_speedup(k, alpha)
#         speedups.append(f'{sp:.2f}x')
#     print(f"k={k:>3} | " + ' '.join(s.rjust(6) for s in speedups))

# Observations:
# - At low acceptance (α=0.3), speedup is marginal at any k
# - At high acceptance (α=0.7-0.9), k=5-7 gives 2-3x speedup
# - Speedup plateaus past k=10 because of:
#   1. Accumulated draft cost (linear in k)
#   2. Diminishing acceptance over long horizons (geometric-like)
# - Choose draft model and k jointly: high acceptance + moderate k is the sweet spot
`}
  packages={[]}
/>

### Exercise 4 (hard) — Continuous batching simulator

Simulate continuous batching: a fixed-size batch of decode requests where each request finishes at a different time. Track GPU utilization vs naive batching (wait for the longest request to finish before starting a new batch).

<details>
<summary>Hint</summary>

Setup:
- Batch size B = 16 (slots)
- Each decode step processes one token for each active slot
- Sequences have varying remaining lengths; when a sequence finishes (length 0), its slot becomes free
- New requests arrive at random times with random lengths
- Track: throughput (tokens/step) and slot utilization (% of slots active)

Continuous batching: when a slot frees, fill it immediately with a waiting request.

Naive batching: wait for all current sequences to finish; then start a new batch of 16.

Compare throughput over time.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np
import random

random.seed(42)
np.random.seed(42)

BATCH_SIZE = 16
SIMULATION_STEPS = 200
ARRIVAL_RATE = 0.4   # probability of new request per step
LENGTH_RANGE = (20, 80)   # request lengths

class Request:
    def __init__(self, req_id, length):
        self.id = req_id
        self.remaining = length
        self.total = length

def generate_requests(n=100):
    """Pre-generate requests with random lengths."""
    return [Request(i, random.randint(*LENGTH_RANGE)) for i in range(n)]

def continuous_batching(requests):
    """
    Continuous batching: when a slot frees, fill it immediately.
    Returns: throughput per step, utilization per step
    """
    pending = list(requests)
    active = []      # currently in batch (max BATCH_SIZE)
    completed = 0
    
    throughputs = []
    utilizations = []
    
    for step in range(SIMULATION_STEPS):
        # Fill empty slots from pending queue
        # TODO: while there's room and pending requests, move them to active
        
        # Decode one token for each active sequence
        tokens_this_step = len(active)
        # TODO: decrement each active sequence's remaining by 1
        # TODO: remove finished sequences (remaining == 0)
        
        throughputs.append(tokens_this_step)
        utilizations.append(len(active) / BATCH_SIZE)
    
    return throughputs, utilizations

def naive_batching(requests):
    """
    Naive batching: wait for entire batch to finish; then start next batch.
    """
    pending = list(requests)
    active = []
    throughputs = []
    utilizations = []
    
    for step in range(SIMULATION_STEPS):
        # If batch is empty, fill it with next BATCH_SIZE requests from pending
        if not active and pending:
            # TODO: move BATCH_SIZE requests from pending to active
            pass
        
        # Decode tokens for active
        tokens_this_step = len(active)
        # TODO: decrement and remove finished
        
        throughputs.append(tokens_this_step)
        utilizations.append(len(active) / BATCH_SIZE)
    
    return throughputs, utilizations

# Run both
# requests = generate_requests(200)
# cont_throughput, cont_util = continuous_batching(requests)
# naive_throughput, naive_util = naive_batching(generate_requests(200))   # fresh requests
# 
# print(f"Continuous batching:")
# print(f"  Avg throughput: {np.mean(cont_throughput):.1f} tokens/step")
# print(f"  Avg utilization: {np.mean(cont_util)*100:.0f}%")
# print(f"\\nNaive batching:")
# print(f"  Avg throughput: {np.mean(naive_throughput):.1f} tokens/step")
# print(f"  Avg utilization: {np.mean(naive_util)*100:.0f}%")
# 
# print(f"\\nContinuous batching wins on both throughput and utilization.")
# print(f"This is why vLLM, TGI, and SGLang all use continuous batching.")
`}
  packages={["numpy"]}
/>

````

### Part C — Flip Ch 17's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 17, slug: 'ch17-inference-optimization', title: 'Inference Optimization', partNum: 6, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript or MDX errors.
2. **Sections 1-7** of Ch 17 still render correctly (no changes to existing sections).
3. **Section 3's** `KVCacheAnimation` marquee widget still renders correctly.
4. **Section 6** now renders the working `SpeculativeDecoding` widget.
5. **Default state**: k=5, α=0.7, seed=42. Round visualization shows 5 draft tokens; verification result depends on seed.
6. **k slider**: range 1-10 (integer); changes number of draft tokens.
7. **α slider**: range 0.1-0.95 (0.05 steps); changes acceptance rate. Higher α → more tokens typically accepted.
8. **Resample button**: changes seed; re-runs simulation with same k and α; different acceptance pattern.
9. **One round visualization**:
   - **Step 1**: 5 (or k) gray boxes labeled t1...tk (draft proposed)
   - **Step 2**: boxes colored — emerald for accepted, rose for first reject, gray-faded for discarded
   - **Step 3**: cyan box appears with corrected token (only if there was a rejection)
   - **Net summary**: lists accepted count + corrected, with cyan-highlighted total
10. **Expected analytical readout**: 4 values (expected accepted, expected emitted, cost per round, speedup). Speedup is highlighted in cyan.
11. **Speedup landscape table**: 5 rows (k=1, 3, 5, 7, 10) × 4 columns (α=0.3, 0.5, 0.7, 0.9). Current k+α cell highlighted in cyan with "← here" marker.
12. **At k=5, α=0.7**: expected accepted ≈ 2.33; speedup ≈ 2.9×.
13. **At k=10, α=0.9**: speedup ≈ 4.9× (best case in table).
14. **At k=1, α=0.3**: speedup ≈ 1.25× (worst case in table).
15. **New "## Exercises" section** is between section 7 and section 8. Contains 4 sub-exercises with collapsible hints and runnable starter code.
16. **Section 8** still renders correctly after the insert.
17. **Sidebar**: Ch 1-17 all active (published); Ch 18-30 still dimmed.
18. **Prev/next at bottom of Ch 17**: prev = Ch 16 (active); next = Ch 18 (disabled).
19. **TOC**: includes Exercises as h2 between section 7 and section 8.
20. **Mobile**: controls stack; tables horizontally scrollable if needed.
21. **`npm run typecheck`** passes.
22. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not provide exercise solutions.** Hints only.
- ❌ **Do not animate the speculative round.** Static + interactive (no playback).
- ❌ **Do not flip any other chapter's status.** Only Ch 17 flips.
- ❌ **Do not modify Ch 1-16.** Sealed.
- ❌ **Do not modify Ch 17's marquee widget.** Sealed.
- ❌ **Do not modify Ch 17 prose sections 1-8.** Sealed.
- ❌ **Do not show the actual draft/big model architectures.** The widget is about the pattern, not the models.

---

## Wire-up

```bash
git add src/components/widgets/ch17/SpeculativeDecoding.tsx src/components/widgets/ch17/SpeculativeDecoding.module.css src/components/widgets/ch17/speculative-data.ts src/components/widgets/index.ts src/pages/ch17-inference-optimization/index.mdx src/lib/chapters.ts
git commit -m "session 79: Ch 17 closeout — speculative decoding visualizer + exercises + status: published"
git push origin main
```

---

## Ch 17 closeout

Chapter 17 is now the seventeenth complete chapter on production. **Phase 12 is 1/3 done** — Ch 18 (quantization) and Ch 19 (sampling) remain.

Confirm before declaring Ch 17 done:

- ✅ BUILD_ORDER.md shows files 98-101 ✅
- ✅ Files 102-103 marked ⏭️ (absorbed; would have been separate widget + exercise files in 6-file allocation; absorbed into closeout for 4-file cadence)
- ✅ Ch 17 status is `'published'`
- ✅ Both Ch 17 widgets work in production
- ✅ All 4 Ch 17 exercises render with their starter code

**Cadence check across 17 chapters:**

**4-file cadence** holds for **12 single-topic chapters** (Ch 2, 3, 4, 6, 7, 10, 11, 12, 13, 15, 16, **17**).
**5-file cadence** holds for **5 two-topic chapters** (Ch 1, 5, 8, 9, 14).

**17-chapter pattern stable.**

**Phase 12 (Inference) status:**
- ✅ Ch 17 (Inference Optimization)
- ⬜ Ch 18 (Quantization for inference) — next, single-topic, 4-file
- ⬜ Ch 19 (Sampling) — single-topic, 4-file

**What's next — Ch 18: Quantization.** Where Ch 17 reduced *wasted computation*, Ch 18 reduces the *bits per parameter*. INT8, INT4, NF4 (already touched in Ch 15's QLoRA), AWQ, GPTQ. **Combines multiplicatively with Ch 17's optimizations** for further serving cost reduction. After Ch 18: Ch 19 (sampling algorithms) and Phase 12 completes.

---

## Notes for the session author

**On the secondary widget being decision-support + visualization:**
The Speculative Decoding widget combines two pedagogical modes:
1. **Visualization** (the round panel): reader sees the per-token accept/reject pattern for one specific round
2. **Analytical** (the expected readout): reader sees the theoretical speedup at chosen k, α
3. **Landscape** (the table): reader sees how speedup varies across the parameter space

The three together give a complete mental model: **the round shows what happens; the analytical shows what to expect on average; the landscape shows where to operate.**

**On the seeded randomness:**
The round simulation uses a seeded PRNG so the user can re-roll without losing reproducibility. Each click of "Resample" advances the seed; same k, α + different seed = different specific outcome but same expected behavior. **This matches reality**: speculative decoding's per-round outcome is stochastic; only the expectation is deterministic.

**On the four token states:**
- **Pending** (gray border): draft proposed but not yet verified
- **Accepted** (emerald): draft + verifier agree; kept
- **Rejected** (rose): draft + verifier disagree; first mismatch
- **Discarded** (gray faded): after first rejection, remaining drafts are thrown away
- **Corrected** (cyan): big model's chosen token at the rejection position

The colors form a clear narrative: amber→cyan in the marquee (phase = optimization); emerald/rose/cyan in the secondary (accept/reject/correct).

**On the speedup landscape table:**
The table makes the relationship between k, α, and speedup **scannable at a glance.** Reader can see:
- At α=0.3, increasing k barely helps (acceptance is too low)
- At α=0.9, increasing k helps a lot (high acceptance compounds)
- The sweet spot for typical setups (α=0.7, k=5) is in the middle of the table

The "← here" marker on the current cell anchors the user's position in the landscape.

**On the four exercises:**

| Ex | Difficulty | Topic | Outcome Hit |
|----|-----------|-------|-------------|
| 1 | easy | KV cache memory formula | 2, 7 |
| 2 | medium | Naive vs cached decoding | 2 |
| 3 | medium | Speculative speedup formula | 6 |
| 4 | hard | Continuous batching simulator | 4 |

Difficulty: easy → medium → medium → hard. Standard progression.

**On Ex 4 being the hardest:**
Continuous batching is the chapter's most operationally important concept (it's what makes vLLM/TGI/SGLang work), but it's also the most abstract — there's no formula, just a scheduling pattern. **The exercise lets the reader implement the scheduling logic directly** and compare it to naive batching.

Reader builds: queue of pending requests; active slots; per-step "decode one token + remove finished + fill slots." Reader sees that continuous batching keeps utilization high while naive batching drops to 0 between batches.

**On the exercises serving the 8 outcomes:**

| Outcome | Exercise |
|---|---|
| 1. Prefill vs decode | (chapter prose + marquee widget) |
| 2. KV cache | Ex 1, Ex 2 |
| 3. Memory-bound vs compute-bound | (chapter prose) |
| 4. Continuous batching | Ex 4 |
| 5. Flash Attention | (chapter prose) |
| 6. Speculative speedup | Ex 3 + secondary widget |
| 7. PagedAttention | (chapter prose) |
| 8. Modern inference stacks | (chapter prose) |

Outcomes 2, 4, 6 served by exercises directly. Outcomes 1, 3, 5, 7, 8 served by chapter prose and widgets.

**Pedagogical claim of the chapter (revisited):**
"Inference optimization is what makes deployed models cheap to serve. The KV cache eliminates redundant computation across decoding steps. Prefill and decode have fundamentally different bottlenecks. Continuous batching maximizes GPU utilization. Flash Attention enables long context. Speculative decoding amortizes the big model's pass. PagedAttention manages cache memory like an OS. The chapter's exercises lock in the mechanics (Ex 1 memory math, Ex 2 KV cache implementation, Ex 3 speculative formula, Ex 4 continuous batching). **Combined: 5-10× throughput vs naive on the same hardware.**"

**Phase 12 progress after this session**: Ch 17 ✅. Ch 18 and Ch 19 remain. Pace through them.

**This chapter is the foundation of Phase 12.** Ch 18 (quantization) and Ch 19 (sampling) build on it. Build with care.

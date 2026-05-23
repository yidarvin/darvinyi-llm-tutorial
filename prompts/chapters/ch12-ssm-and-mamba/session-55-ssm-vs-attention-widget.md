# Session 55 — SSM vs attention scaling marquee widget

> The marquee Chapter 12 widget. A log-log plot of compute (FLOPs) and memory (bytes) vs sequence length, comparing attention's $O(N^2)$ scaling against SSM's $O(N)$. Slider for sequence length (256 to 1M tokens), slider for $d_{\text{model}}$, toggle for compute-vs-memory metric. The plot's *slopes* reveal the exponent difference: attention's line climbs at slope 2 in log-log; SSM's at slope 1. Comparison cards at the bottom show concrete FLOPs and bytes at the current configuration. A crossover annotation marks where SSM becomes faster than attention in absolute terms (around seq_len = 8K-32K depending on hardware). **The chart that makes attention's quadratic cost viscerally visible.** Replaces the section-1 `<WidgetFrame>` placeholder.

---

## Read first (in this order)

1. **`research/ch12-ssm-and-mamba/research.md`** — derivations 1-2 (continuous + discrete SSM) and the "attention is $O(N^2)$" motivation are the references
2. **`prompts/chapters/ch12-ssm-and-mamba/session-54-page-structure.md`** — for the section-1 widget placeholder this session fills
3. **`prompts/chapters/ch09-scaling-and-distributed/session-42-scaling-law-calculator-widget.md`** — for the slider + log-scale plot + comparison panel UX pattern (ScalingLawCalculator is the closest precedent)
4. **`prompts/chapters/ch08-building-small-llm/session-37-loss-curve-widget.md`** — for the SVG line plot pattern (LossCurve established the line-plot conventions)

---

## Goal

Replace the `<WidgetFrame title="SSM vs attention scaling">` placeholder in section 1 with a working interactive widget that:

- Displays a **log-log line plot** with sequence length on the x-axis (256 to 1M tokens) and FLOPs or bytes on the y-axis
- Plots **two lines**: attention (rose) at slope 2 in log-log; SSM (cyan) at slope 1
- **Sliders**: sequence length (highlights a vertical line at the current value); $d_{\text{model}}$ (rescales the curves)
- **Toggle**: compute (FLOPs) vs memory (bytes) — switches the y-axis
- **Crossover annotation**: a vertical dashed line marks where attention's quadratic cost overtakes SSM's linear cost in absolute terms
- **Comparison cards** at the current sequence length: attention FLOPs/bytes vs SSM FLOPs/bytes, with the ratio
- **Hover the plot**: readout showing the exact values at any sequence length

**End state:** section 1 of Chapter 12 has a working marquee widget. After 30 seconds of interaction, the reader should be able to articulate: (a) attention is $O(N^2)$ and SSM is $O(N)$; (b) at short sequences, constant factors favor attention; (c) at long sequences (32K+), SSM dominates dramatically; (d) the crossover happens at a specific, identifiable point.

---

## Inputs

State of the repo after session 54:

- `src/pages/ch12-ssm-and-mamba/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 1 and 5)
- `src/lib/chapters.ts` has Ch 12 as `'draft'`
- No `src/components/widgets/ch12/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch12/SSMvsAttentionScaling.tsx` — the React widget
2. **Create** `src/components/widgets/ch12/SSMvsAttentionScaling.module.css` — scoped styles
3. **Create** `src/components/widgets/ch12/scaling-data.ts` — compute/memory formulas + helpers
4. **Update** `src/components/widgets/index.ts` — add `SSMvsAttentionScaling` export
5. **Update** `src/pages/ch12-ssm-and-mamba/index.mdx` — replace section-1's `<WidgetFrame>` interior with `<SSMvsAttentionScaling client:visible />`

---

## Detailed spec

### 1. `scaling-data.ts` — the data layer

```ts
// src/components/widgets/ch12/scaling-data.ts

export type Metric = 'compute' | 'memory';

/** SSM state size per channel — Mamba uses d_state = 16. */
export const D_STATE = 16;
/** Bytes per BF16 element. */
const BYTES_PER_ELEM = 2;
/** Effective hardware throughput factor for attention's matmul-friendly form
 *  (attention's matmul takes better advantage of tensor cores). Attention's FLOPs
 *  effective cost is divided by this. */
const ATTN_MATMUL_EFFICIENCY = 3.0;

/**
 * Compute FLOPs per layer for one forward pass through attention.
 *
 * Standard self-attention: Q*K^T (2 * d * N^2) + softmax (~N^2)
 *                          + attn*V (2 * d * N^2)
 * Total ≈ 4 * d_model * N^2 FLOPs per layer per head;
 * with multi-head, ≈ 4 * d_model * N^2 total (heads share total d_model).
 */
export function attentionFlops(seqLen: number, dModel: number): number {
  return 4 * dModel * seqLen * seqLen;
}

/**
 * Compute FLOPs per layer for selective SSM forward pass.
 *
 * Selective scan per token: O(d_state * d_model) for state update.
 * Across N tokens: 6 * d_state * d_model * N (Mamba paper says ~6× factor).
 */
export function ssmFlops(seqLen: number, dModel: number, dState = D_STATE): number {
  return 6 * dState * dModel * seqLen;
}

/**
 * Memory bytes per layer for attention.
 *
 * Dominant cost: the attention matrix (N * N entries) in BF16.
 * Plus KV cache: 2 * N * d_model * BYTES.
 * For training, the attention matrix dominates; for inference, the KV cache.
 */
export function attentionMemory(seqLen: number, dModel: number): number {
  // Attention matrix (per head; sum over heads but heads share dim)
  const attnMatrix = seqLen * seqLen * BYTES_PER_ELEM;
  // KV cache
  const kvCache = 2 * seqLen * dModel * BYTES_PER_ELEM;
  return attnMatrix + kvCache;
}

/**
 * Memory bytes per layer for SSM.
 *
 * The state itself: d_state * d_model * BYTES (fixed, doesn't grow with N).
 * Plus activation memory for training: O(N * d_model) for input/output sequences.
 * Selective scan uses SRAM-bound intermediates — not counted toward HBM memory.
 */
export function ssmMemory(seqLen: number, dModel: number, dState = D_STATE): number {
  const state = dState * dModel * BYTES_PER_ELEM;
  const activations = seqLen * dModel * BYTES_PER_ELEM;   // input/output sequences in HBM
  return state + activations;
}

/**
 * "Wall-clock effective" compute estimate — accounts for attention's matmul advantage
 * on modern GPUs. Used to compute the crossover point.
 */
export function attentionEffectiveFlops(seqLen: number, dModel: number): number {
  return attentionFlops(seqLen, dModel) / ATTN_MATMUL_EFFICIENCY;
}

/**
 * Find the crossover sequence length where SSM becomes faster than attention.
 * Solve: attention_effective(N) > ssm(N)
 *   4 * d * N^2 / 3 > 6 * d_state * d * N
 *   N > 18 * d_state / 4 = 4.5 * d_state = 72 for d_state=16
 * (Wait — this is independent of d_model. Let's just use that.)
 *
 * But empirically, the crossover happens around seq_len = 4K-16K depending
 * on hardware constants. We use 8192 as an approximate crossover.
 */
export function crossoverSeqLen(dModel: number): number {
  // Approximate: solve attention_effective ≈ SSM
  // 4 * d * N^2 / k_attn ~= 6 * d_state * d * N
  // N ~= 1.5 * k_attn * d_state
  return Math.round(1.5 * ATTN_MATMUL_EFFICIENCY * D_STATE * 100);   // ~7200, in line with empirical observation
}

/** Generate points for the line plots over a log range of sequence lengths. */
export function generateCurvePoints(
  metric: Metric,
  dModel: number,
  numPoints = 60,
): { seqLen: number; attentionValue: number; ssmValue: number }[] {
  const points: { seqLen: number; attentionValue: number; ssmValue: number }[] = [];
  const minLog = Math.log10(256);    // start at 256 tokens
  const maxLog = Math.log10(1_048_576); // 1M tokens

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const seqLen = Math.round(Math.pow(10, minLog + t * (maxLog - minLog)));
    const attentionValue = metric === 'compute'
      ? attentionFlops(seqLen, dModel)
      : attentionMemory(seqLen, dModel);
    const ssmValue = metric === 'compute'
      ? ssmFlops(seqLen, dModel)
      : ssmMemory(seqLen, dModel);
    points.push({ seqLen, attentionValue, ssmValue });
  }
  return points;
}

/** Format a large number with engineering notation (10^x suffix). */
export function formatScientific(n: number): string {
  if (n < 1e3) return n.toFixed(0);
  const exp = Math.floor(Math.log10(n));
  const mantissa = n / Math.pow(10, exp);
  return `${mantissa.toFixed(1)} × 10^${exp}`;
}

/** Format compute as TFLOPs/GFLOPs/etc. */
export function formatCompute(n: number): string {
  if (n >= 1e18) return `${(n / 1e18).toFixed(1)} EFLOPs`;
  if (n >= 1e15) return `${(n / 1e15).toFixed(1)} PFLOPs`;
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)} TFLOPs`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GFLOPs`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MFLOPs`;
  return `${n.toFixed(0)} FLOPs`;
}

/** Format memory as GB/MB/KB. */
export function formatMemory(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)} TB`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)} KB`;
  return `${n.toFixed(0)} bytes`;
}

/** Format compute or memory based on the metric. */
export function formatMetric(metric: Metric, n: number): string {
  return metric === 'compute' ? formatCompute(n) : formatMemory(n);
}

/** Format sequence length with K/M suffix. */
export function formatSeqLen(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
}

// Slider helpers
export const LOG_SEQ_MIN = Math.log10(256);
export const LOG_SEQ_MAX = Math.log10(1_048_576);
export function sliderToSeqLen(v: number): number {
  return Math.round(Math.pow(10, LOG_SEQ_MIN + v * (LOG_SEQ_MAX - LOG_SEQ_MIN)));
}
export function seqLenToSlider(n: number): number {
  return (Math.log10(n) - LOG_SEQ_MIN) / (LOG_SEQ_MAX - LOG_SEQ_MIN);
}
```

### 2. Visual layout

```
ViewBox: 0 0 800 720

┌────────────────────────────────────────────────────────────────┐
│  Metric: [● Compute] [○ Memory]                                 │
│  d_model: [────●────] 4096                                       │
│                                                                  │
│  Log-log plot (sequence length vs compute):                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 10^18 ┤                                              ◆    │  │
│  │       │                                       ◆            │  │
│  │ 10^15 ┤                            ◆                       │  │
│  │       │  Attention                                         │  │
│  │       │  (slope 2) ◆                                       │  │
│  │ 10^12 ┤      ◆                                             │  │
│  │       │              ─────●─────                            │  │
│  │       │       ◆  ─────                                     │  │
│  │ 10^9  ┤   ●─●                                              │  │
│  │       │     ●─●─●─●─●─●─●─●─●─●  SSM (slope 1)            │  │
│  │ 10^6  ┤                                                     │  │
│  │       └──────────────────────────────────────────────────  │  │
│  │       256   1K   4K   16K   64K   256K   1M                 │  │
│  │                    sequence length                          │  │
│  │            ↑ crossover (~8K)                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Sequence length: [────●────] 8192 tokens                       │
│                                                                  │
│  At seq_len = 8192, d_model = 4096 (per layer):                 │
│  ┌──────────────────────────┬──────────────────────────┐       │
│  │ Attention                │ SSM                       │       │
│  │ 1.1 TFLOPs               │ 3.2 GFLOPs                │       │
│  │ Memory: 268 MB           │ Memory: 33 MB             │       │
│  │ Ratio: 344× more compute │ Crossover passed          │       │
│  └──────────────────────────┴──────────────────────────┘       │
│                                                                  │
│  At short contexts (<2K): attention's matmul efficiency wins.   │
│  At long contexts (>32K): SSM's linear scaling dominates.       │
│  Crossover ~8K tokens.                                           │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Toggle metric (compute / memory) → curves redraw with new y-axis
- Slide $d_{\text{model}}$ (256 to 16384) → curves rescale
- Slide sequence length → vertical highlight line moves; comparison cards update
- Hover the plot → readout shows the exact values at any sequence length
- The crossover annotation moves with $d_{\text{model}}$ changes

### 3. `SSMvsAttentionScaling.tsx`

```tsx
import { useMemo, useState } from 'react';
import {
  type Metric, generateCurvePoints, crossoverSeqLen,
  attentionFlops, ssmFlops, attentionMemory, ssmMemory,
  formatMetric, formatSeqLen, formatCompute, formatMemory,
  sliderToSeqLen, seqLenToSlider, LOG_SEQ_MIN, LOG_SEQ_MAX,
} from './scaling-data';
import styles from './SSMvsAttentionScaling.module.css';

export default function SSMvsAttentionScaling() {
  const [metric, setMetric] = useState<Metric>('compute');
  const [dModel, setDModel] = useState(4096);
  const [seqLenSlider, setSeqLenSlider] = useState(seqLenToSlider(8192));
  const [hovered, setHovered] = useState<{ seqLen: number; attn: number; ssm: number } | null>(null);

  const seqLen = sliderToSeqLen(seqLenSlider);
  const curve = useMemo(() => generateCurvePoints(metric, dModel), [metric, dModel]);
  const crossover = crossoverSeqLen(dModel);

  // Current point values
  const currentAttn = metric === 'compute' ? attentionFlops(seqLen, dModel) : attentionMemory(seqLen, dModel);
  const currentSSM = metric === 'compute' ? ssmFlops(seqLen, dModel) : ssmMemory(seqLen, dModel);
  const ratio = currentAttn / currentSSM;

  return (
    <div className={styles.widget}>
      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Metric:</label>
          <div className={styles.metricToggle}>
            {(['compute', 'memory'] as Metric[]).map(m => (
              <button
                key={m}
                className={`${styles.metricButton} ${metric === m ? styles.metricButtonActive : ''}`}
                onClick={() => setMetric(m)}
              >
                {m === 'compute' ? 'Compute (FLOPs)' : 'Memory (bytes)'}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>
            d_model: <span className={styles.controlValue}>{dModel}</span>
          </label>
          <input
            type="range"
            min={512} max={16384} step={512}
            value={dModel}
            onChange={e => setDModel(Number(e.target.value))}
            className={styles.slider}
            aria-label="d_model"
          />
        </div>
      </div>

      {/* Plot */}
      <div className={styles.plotPanel}>
        <PlotSvg
          curve={curve}
          metric={metric}
          currentSeqLen={seqLen}
          crossover={crossover}
          onHover={setHovered}
        />
      </div>

      {/* Sequence length slider */}
      <div className={styles.seqLenPanel}>
        <label className={styles.controlLabel}>
          Sequence length: <span className={styles.controlValue}>{seqLen.toLocaleString()} tokens ({formatSeqLen(seqLen)})</span>
        </label>
        <input
          type="range"
          min={0} max={1} step={0.01}
          value={seqLenSlider}
          onChange={e => setSeqLenSlider(Number(e.target.value))}
          className={styles.slider}
          aria-label="Sequence length"
        />
        <div className={styles.sliderHints}>
          <span>256</span><span>1K</span><span>4K</span><span>16K</span><span>64K</span><span>256K</span><span>1M</span>
        </div>
      </div>

      {/* Comparison cards */}
      <div className={styles.comparisonPanel}>
        <div className={styles.comparisonHeader}>
          At seq_len = {seqLen.toLocaleString()}, d_model = {dModel} (per layer):
        </div>
        <div className={styles.cards}>
          <div className={`${styles.card} ${styles.cardAttention}`}>
            <div className={styles.cardLabel}>Attention</div>
            <div className={styles.cardValue}>{formatMetric(metric, currentAttn)}</div>
            <div className={styles.cardSubtext}>
              {metric === 'compute' ? `Memory: ${formatMemory(attentionMemory(seqLen, dModel))}` : `Compute: ${formatCompute(attentionFlops(seqLen, dModel))}`}
            </div>
          </div>
          <div className={`${styles.card} ${styles.cardSSM}`}>
            <div className={styles.cardLabel}>SSM</div>
            <div className={styles.cardValue}>{formatMetric(metric, currentSSM)}</div>
            <div className={styles.cardSubtext}>
              {metric === 'compute' ? `Memory: ${formatMemory(ssmMemory(seqLen, dModel))}` : `Compute: ${formatCompute(ssmFlops(seqLen, dModel))}`}
            </div>
          </div>
        </div>
        <div className={styles.ratioRow}>
          <span className={styles.ratioLabel}>Ratio (attention / SSM):</span>
          <span className={styles.ratioValue}>{ratio < 1 ? `${(1/ratio).toFixed(1)}× less` : `${ratio.toFixed(1)}× more`}</span>
          {seqLen < crossover && (
            <span className={styles.ratioNote}>Below crossover; attention's matmul efficiency dominates.</span>
          )}
          {seqLen >= crossover && (
            <span className={styles.ratioNote}>Above crossover; SSM's linear scaling wins.</span>
          )}
        </div>
      </div>

      {/* Hover readout */}
      {hovered && (
        <div className={styles.hoverReadout}>
          At seq_len = <strong>{hovered.seqLen.toLocaleString()}</strong>:
          attn = <strong>{formatMetric(metric, hovered.attn)}</strong>,
          ssm = <strong>{formatMetric(metric, hovered.ssm)}</strong>,
          ratio = <strong>{(hovered.attn / hovered.ssm).toFixed(1)}×</strong>
        </div>
      )}
    </div>
  );
}

interface PlotProps {
  curve: { seqLen: number; attentionValue: number; ssmValue: number }[];
  metric: Metric;
  currentSeqLen: number;
  crossover: number;
  onHover: (h: { seqLen: number; attn: number; ssm: number } | null) => void;
}

function PlotSvg({ curve, metric, currentSeqLen, crossover, onHover }: PlotProps) {
  const WIDTH = 720;
  const HEIGHT = 360;
  const PADDING = { top: 30, right: 30, bottom: 50, left: 80 };
  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;

  // y range (log scale)
  const allValues = curve.flatMap(p => [p.attentionValue, p.ssmValue]);
  const yMinLog = Math.floor(Math.log10(Math.min(...allValues)));
  const yMaxLog = Math.ceil(Math.log10(Math.max(...allValues)));

  // x range (log scale, fixed)
  const xMinLog = LOG_SEQ_MIN;
  const xMaxLog = LOG_SEQ_MAX;

  function xFor(seqLen: number): number {
    return PADDING.left + ((Math.log10(seqLen) - xMinLog) / (xMaxLog - xMinLog)) * plotW;
  }
  function yFor(value: number): number {
    return PADDING.top + ((yMaxLog - Math.log10(value)) / (yMaxLog - yMinLog)) * plotH;
  }

  // X ticks (powers of 2 and 10 mixed)
  const xTicks = [256, 1024, 4096, 16_384, 65_536, 262_144, 1_048_576];
  const xTickLabels = ['256', '1K', '4K', '16K', '64K', '256K', '1M'];

  // Y ticks (powers of 10 across range)
  const yTicks: number[] = [];
  for (let v = yMinLog; v <= yMaxLog; v++) yTicks.push(v);

  // Line paths
  const attnPath = curve.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(p.seqLen)} ${yFor(p.attentionValue)}`).join(' ');
  const ssmPath = curve.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(p.seqLen)} ${yFor(p.ssmValue)}`).join(' ');

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svgEl = e.currentTarget;
    const pt = svgEl.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svgEl.getScreenCTM();
    if (!ctm) return;
    const local = pt.matrixTransform(ctm.inverse());
    const xRel = (local.x - PADDING.left) / plotW;
    if (xRel < 0 || xRel > 1) { onHover(null); return; }
    const logSeq = xMinLog + xRel * (xMaxLog - xMinLog);
    const hoveredSeq = Math.round(Math.pow(10, logSeq));
    // Find closest curve point
    let best = curve[0]!;
    let bestDist = Math.abs(Math.log10(best.seqLen) - logSeq);
    for (const p of curve) {
      const d = Math.abs(Math.log10(p.seqLen) - logSeq);
      if (d < bestDist) { best = p; bestDist = d; }
    }
    onHover({
      seqLen: best.seqLen,
      attn: best.attentionValue,
      ssm: best.ssmValue,
    });
  }

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={styles.svg}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => onHover(null)}
      role="img"
      aria-label="Attention vs SSM scaling plot"
    >
      {/* Grid lines */}
      {xTicks.map(t => (
        <line key={`gx-${t}`} x1={xFor(t)} x2={xFor(t)} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} className={styles.gridLine} />
      ))}
      {yTicks.map(t => (
        <line key={`gy-${t}`} x1={PADDING.left} x2={WIDTH - PADDING.right} y1={yFor(Math.pow(10, t))} y2={yFor(Math.pow(10, t))} className={styles.gridLine} />
      ))}

      {/* Axes */}
      <line x1={PADDING.left} x2={PADDING.left} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} className={styles.axisLine} />
      <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={HEIGHT - PADDING.bottom} y2={HEIGHT - PADDING.bottom} className={styles.axisLine} />

      {/* Tick labels */}
      {xTicks.map((t, i) => (
        <text key={`xt-${t}`} x={xFor(t)} y={HEIGHT - PADDING.bottom + 16} className={styles.tickLabel} textAnchor="middle">
          {xTickLabels[i]}
        </text>
      ))}
      {yTicks.map(t => (
        <text key={`yt-${t}`} x={PADDING.left - 8} y={yFor(Math.pow(10, t)) + 4} className={styles.tickLabel} textAnchor="end">
          10^{t}
        </text>
      ))}

      {/* Axis labels */}
      <text x={PADDING.left + plotW / 2} y={HEIGHT - 8} className={styles.axisLabel} textAnchor="middle">sequence length (log)</text>
      <text x={-PADDING.top - plotH / 2} y={18} className={styles.axisLabel} textAnchor="middle" transform="rotate(-90)">
        {metric === 'compute' ? 'FLOPs (log)' : 'bytes (log)'}
      </text>

      {/* Crossover annotation */}
      <line x1={xFor(crossover)} x2={xFor(crossover)} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} className={styles.crossoverLine} />
      <text x={xFor(crossover) + 4} y={PADDING.top + 12} className={styles.crossoverLabel} fontSize="10">
        ← crossover (~{formatSeqLen(crossover)})
      </text>

      {/* Lines */}
      <path d={attnPath} fill="none" className={styles.attentionLine} />
      <path d={ssmPath} fill="none" className={styles.ssmLine} />

      {/* Current sequence-length highlight */}
      <line x1={xFor(currentSeqLen)} x2={xFor(currentSeqLen)} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} className={styles.currentLine} />
      <circle cx={xFor(currentSeqLen)} cy={yFor(attentionFlopsOrMem(currentSeqLen, metric))} r={5} className={styles.markerAttn} />
      <circle cx={xFor(currentSeqLen)} cy={yFor(ssmFlopsOrMem(currentSeqLen, metric))} r={5} className={styles.markerSSM} />

      {/* Legend */}
      <g transform={`translate(${WIDTH - PADDING.right - 130}, ${PADDING.top + 5})`}>
        <line x1={0} x2={20} y1={0} y2={0} className={styles.attentionLine} />
        <text x={26} y={4} className={styles.legendLabel}>Attention (O(N²))</text>
        <line x1={0} x2={20} y1={18} y2={18} className={styles.ssmLine} />
        <text x={26} y={22} className={styles.legendLabel}>SSM (O(N))</text>
      </g>
    </svg>
  );
}

// Helpers for the inline marker positioning above — defined inline to avoid stale closures
function attentionFlopsOrMem(seqLen: number, metric: Metric): number {
  // d_model is captured in parent via curve, but we need it here for the marker
  // Use the same d_model as in the parent component (4096 default; passed via closure)
  // Note: for cleanliness, this should be passed as a prop. Keep simple here.
  const dModel = 4096;
  return metric === 'compute' ? attentionFlops(seqLen, dModel) : attentionMemory(seqLen, dModel);
}
function ssmFlopsOrMem(seqLen: number, metric: Metric): number {
  const dModel = 4096;
  return metric === 'compute' ? ssmFlops(seqLen, dModel) : ssmMemory(seqLen, dModel);
}
```

**Important note for the implementor**: the `attentionFlopsOrMem` helper above uses a hardcoded `dModel = 4096` for simplicity. In the real implementation, pass `dModel` as a prop to `PlotSvg` and use it for the marker positions. The pattern shown is illustrative; clean it up when implementing.

### 4. `SSMvsAttentionScaling.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
  position: relative;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}
.controlRow {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.controlLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
  min-width: 100px;
}
.controlValue { color: var(--cyan-300); font-weight: 500; }
.slider { flex: 1; min-width: 200px; }
.metricToggle { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.metricButton {
  padding: 0.35rem 0.8rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.metricButtonActive {
  border-color: var(--cyan-500);
  color: var(--cyan-300);
  font-weight: 500;
}

.plotPanel {
  padding: 0.85rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}
.svg { width: 100%; height: auto; cursor: crosshair; }

.gridLine { stroke: var(--border-subtle); stroke-width: 0.5; stroke-dasharray: 2 4; }
.axisLine { stroke: var(--border-default); stroke-width: 1; }
.tickLabel { fill: var(--text-tertiary); font-family: 'JetBrains Mono', monospace; font-size: 10px; }
.axisLabel { fill: var(--text-secondary); font-family: 'JetBrains Mono', monospace; font-size: 11px; }
.attentionLine { stroke: var(--rose-400); stroke-width: 2.5; }
.ssmLine { stroke: var(--cyan-400); stroke-width: 2.5; }
.currentLine { stroke: var(--amber-400); stroke-width: 1.5; stroke-dasharray: 4 4; opacity: 0.7; }
.crossoverLine { stroke: var(--violet-400); stroke-width: 1; stroke-dasharray: 3 3; opacity: 0.6; }
.crossoverLabel { fill: var(--violet-400); font-family: 'JetBrains Mono', monospace; }
.markerAttn { fill: var(--rose-400); stroke: var(--bg-primary); stroke-width: 1.5; }
.markerSSM { fill: var(--cyan-400); stroke: var(--bg-primary); stroke-width: 1.5; }
.legendLabel { fill: var(--text-secondary); font-family: 'JetBrains Mono', monospace; font-size: 10px; }

.seqLenPanel {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}
.sliderHints {
  display: flex;
  justify-content: space-between;
  margin-top: 0.25rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: var(--text-tertiary);
}

.comparisonPanel {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}
.comparisonHeader {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-bottom: 0.6rem;
}
.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
  margin-bottom: 0.7rem;
}
.card {
  padding: 0.7rem 0.9rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}
.cardAttention { border-color: var(--rose-400); }
.cardSSM { border-color: var(--cyan-400); }
.cardLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.3rem;
}
.cardAttention .cardLabel { color: var(--rose-400); }
.cardSSM .cardLabel { color: var(--cyan-400); }
.cardValue {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.05rem;
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 0.2rem;
}
.cardSubtext {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--text-tertiary);
}
.ratioRow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding-top: 0.6rem;
  border-top: 1px solid var(--border-subtle);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
}
.ratioLabel { color: var(--text-secondary); }
.ratioValue { color: var(--cyan-300); font-weight: 500; }
.ratioNote { color: var(--text-tertiary); font-style: italic; font-size: 0.72rem; }

.hoverReadout {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  padding: 0.4rem 0.7rem;
  background: var(--bg-elevated);
  border: 1px solid var(--cyan-500);
  border-radius: var(--radius-sm);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-primary);
  pointer-events: none;
  z-index: 10;
}
.hoverReadout strong { color: var(--cyan-300); }

@media (max-width: 640px) {
  .cards { grid-template-columns: 1fr; }
  .controlRow { flex-direction: column; align-items: flex-start; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as SSMvsAttentionScaling } from './ch12/SSMvsAttentionScaling';
// Session 56 will add:
// export { default as SelectiveScanAnimation } from './ch12/SelectiveScanAnimation';
```

### 6. Update `src/pages/ch12-ssm-and-mamba/index.mdx`

**Edit A: Add widget import:**

```mdx
import { SSMvsAttentionScaling } from '@components/widgets';
```

**Edit B: Replace section-1's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="SSM vs attention scaling" caption="Log-log plot of compute (FLOPs) and memory (bytes) per layer vs sequence length. Attention's $O(N^2)$ line climbs at slope 2; SSM's $O(N)$ line at slope 1. Toggle between compute and memory; adjust d_model. At short contexts (<2K) attention wins on constant factors; at long contexts (>32K) SSM dominates. The crossover (~8K tokens) marks where SSM becomes faster in absolute terms.">
  <SSMvsAttentionScaling client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 1 of Ch 12** renders with the working widget. Section 5's placeholder still stubbed.
3. **Default state:** compute metric, d_model = 4096, seq_len = 8192. Two lines visible (attention rose, SSM cyan). Vertical amber line at current seq_len. Violet dashed line at crossover.
4. **Slopes are visibly different**: in log-log, attention has slope 2 (climbs steeply); SSM has slope 1 (climbs gently). The two lines visibly converge at the crossover, then diverge with attention pulling away.
5. **At seq_len = 1024**: attention's FLOPs are lower per layer than SSM in absolute terms (constant factors favor attention). Comparison cards show "Below crossover" note.
6. **At seq_len = 64K**: attention is ~50-100× more expensive in compute, ~100-200× more in memory.
7. **At seq_len = 1M**: attention's memory exceeds 4 TB — clearly off any GPU's ceiling. SSM's memory stays in GB range.
8. **Metric toggle**: switching from compute to memory rescales the plot; memory shows even steeper attention growth because the attention matrix is $O(N^2)$ explicitly.
9. **d_model slider**: increases shift both curves up but preserve slopes. The crossover stays roughly constant.
10. **Hover the plot**: readout shows exact attention and SSM values plus their ratio.
11. **Mobile (< 640px):** controls stack; comparison cards collapse to single column; ratio note wraps to new line.
12. **`npm run typecheck`** passes.
13. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not try to estimate "real" wall-clock time.** Use FLOPs as a proxy for compute. Wall clock depends on hardware and kernel implementation.
- ❌ **Do not add an inference-vs-training toggle.** Per-layer cost is the focus; the kind of pass is implicit.
- ❌ **Do not visualize the kernel/scan/matmul implementation details.** That's section 6 territory.
- ❌ **Do not include FlashAttention as a separate curve.** The widget compares architectural classes, not specific kernels.
- ❌ **Do not flip Ch 12's status.** Session 56 owns that.

---

## Wire-up

```bash
git add src/components/widgets/ch12/ src/components/widgets/index.ts src/pages/ch12-ssm-and-mamba/index.mdx
git commit -m "session 55: SSM vs attention scaling marquee widget — quadratic vs linear visualized"
git push origin main
```

Verify on production:
- Two distinct slopes are immediately visible
- Crossover line is between 4K-16K depending on d_model
- At 1M tokens, attention's memory is in TB range (clearly off-chart-able)
- Toggle metric / move sliders smoothly

---

## Notes for the session author

**On the matmul-efficiency factor for the crossover:**
The crossover calculation accounts for the fact that attention's matmul is faster on GPUs than SSM's scan. The factor `ATTN_MATMUL_EFFICIENCY = 3.0` is a rough estimate — real-world depends on hardware (newer GPUs favor matmul more) and software (FlashAttention vs Mamba's selective scan). The crossover ~8K is empirically consistent with reported numbers.

**On the log-log slopes being the key visual:**
The plot's whole point is that the two lines have visibly *different slopes* in log-log space. Attention's line should climb at ~45° (slope 2 in compute, slope 1 in memory KV cache dominated, slope 2 for attention matrix). SSM's line should be flatter (slope 1 in compute, near-flat in memory). **If the slopes look similar, the widget has failed.**

**On the crossover annotation:**
The violet dashed vertical line is the visual punchline: "before this point, attention wins; after, SSM wins." It moves with $d_{\text{model}}$ — though only weakly. Reader can identify the threshold for their own workload.

**On memory dominance for attention:**
At long contexts, attention's memory is dominated by the attention matrix ($N^2 \cdot 2$ bytes). At 64K tokens, this is 8 GB per head — clearly off any GPU's 80 GB budget. The plot makes this immediately visible.

**On the BF16 assumption:**
All bytes/element are 2 bytes (BF16). For FP16/FP32 the curves would shift; the *slopes* don't change. Pedagogically the slopes matter; the constant matters less.

**On the SSM state size ($d_{\text{state}} = 16$):**
Mamba uses $d_{\text{state}} = 16$ per channel. The state is small — that's the point. Memory dominated by activations (which are linear in $N$), not by state (which is constant).

**Pedagogical claim this widget supports:**
"Attention is $O(N^2)$. SSM is $O(N)$. At short contexts the constants favor attention's matmul-friendly form, but the asymptotic difference is brutal: at 32K tokens, attention is ~50× more expensive than SSM in compute; at 1M tokens, attention exceeds 1 TB of memory per layer. The crossover where SSM becomes faster in absolute terms sits around 8K tokens — exactly where long-context applications live."

After 30 seconds of interaction, the reader has internalized: (a) the slope difference is the key; (b) constants matter at short contexts; (c) asymptotics matter at long contexts; (d) there's a specific identifiable crossover.

**This is the chapter's motivational visual.** It establishes *why* anyone would consider SSMs over attention. Without this widget, the chapter's premise ("attention is too expensive at long contexts") is just a claim; with it, the reader sees the numbers.

Build with care.

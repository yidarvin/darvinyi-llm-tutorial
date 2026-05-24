import { useState, useMemo } from 'react';
import {
  DISTRIBUTIONS,
  VOCAB_SIZE,
  applyPipeline,
  insightFor,
  type DistributionShape,
} from './sampling-data';
import styles from './SamplingDistribution.module.css';

export default function SamplingDistribution() {
  const [shape, setShape] = useState<DistributionShape>('peaked');
  const [T, setT] = useState(1.0);
  const [topP, setTopP] = useState(0.95);
  const [topK, setTopK] = useState(VOCAB_SIZE);

  const logits = DISTRIBUTIONS[shape];
  const result = useMemo(
    () => applyPipeline(logits, T, topP, topK),
    [logits, T, topP, topK],
  );
  const insight = insightFor(shape, topP, result.nucleusSize);

  return (
    <div className={styles.widget}>
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Sampling distribution explorer</div>
        <div className={styles.titleSubLabel}>
          Watch how temperature + top-p + top-k transform the distribution
        </div>
      </div>

      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Distribution shape:</span>
          <div className={styles.shapeButtons}>
            {(['peaked', 'bimodal', 'flat'] as DistributionShape[]).map((s) => (
              <button
                key={s}
                className={`${styles.shapeButton} ${shape === s ? styles.shapeButtonActive : ''}`}
                onClick={() => setShape(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.controlsPanel}>
        <SliderRow
          label="Temperature (T):"
          value={T}
          display={`T = ${T.toFixed(2)}`}
          min={0.3}
          max={2.0}
          step={0.05}
          onChange={setT}
        />
        <SliderRow
          label="Top-p:"
          value={topP}
          display={`p = ${topP.toFixed(2)}${topP >= 0.999 ? ' (off)' : ''}`}
          min={0.1}
          max={1.0}
          step={0.05}
          onChange={setTopP}
        />
        <SliderRow
          label="Top-k:"
          value={topK}
          display={`k = ${topK}${topK >= VOCAB_SIZE ? ' (off)' : ''}`}
          min={1}
          max={VOCAB_SIZE}
          step={1}
          onChange={setTopK}
        />
      </div>

      <div className={styles.chartPanel}>
        <div className={styles.chartTitle}>Original distribution (after softmax)</div>
        <Histogram
          probs={result.originalProbs}
          keptIndices={null}
          maxProb={Math.max(...result.originalProbs)}
        />
      </div>

      <div className={styles.chartPanel}>
        <div className={styles.chartTitle}>Post-pipeline (after T + top-p + top-k)</div>
        <Histogram
          probs={result.postPipelineProbs}
          keptIndices={result.keptIndices}
          maxProb={Math.max(0.01, Math.max(...result.postPipelineProbs))}
        />
      </div>

      <div className={styles.statsPanel}>
        <div className={styles.statsTitle}>Stats</div>
        <div className={styles.statsBody}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Nucleus size:</span>
            <span className={styles.statValue}>
              {result.nucleusSize} tokens (out of {VOCAB_SIZE})
            </span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Truncation by:</span>
            <span className={styles.statValue}>
              {result.truncationKind === 'none' && 'none (no truncation active)'}
              {result.truncationKind === 'top-p' && 'top-p (smaller than top-k cut)'}
              {result.truncationKind === 'top-k' && 'top-k (smaller than top-p cut)'}
              {result.truncationKind === 'both' && 'both (top-p and top-k coincide)'}
            </span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Top probability:</span>
            <span className={styles.statValue}>{result.topProbability.toFixed(3)}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Entropy:</span>
            <span className={styles.statValue}>{result.entropy.toFixed(3)} bits</span>
          </div>
        </div>
      </div>

      <div className={styles.insightPanel}>
        <div className={styles.insightLabel}>Insight</div>
        <div className={styles.insightText}>{insight}</div>
      </div>

      <div className={styles.caption}>
        Try this sequence: <strong>peaked</strong> with p=0.95 (nucleus is 1-3 tokens — the model is confident);
        switch to <strong>flat</strong> (nucleus grows to 20+ tokens — the model is uncertain). <strong>Top-p adapts;
        top-k stays fixed</strong>. Then raise temperature to 1.5 and watch the distribution flatten — even the peaked
        shape now has a wider nucleus. <strong>This adaptive behavior is what makes nucleus sampling the modern default.</strong>
      </div>
    </div>
  );
}

interface SliderRowProps {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}
function SliderRow({ label, value, display, min, max, step, onChange }: SliderRowProps) {
  return (
    <div className={styles.controlRow}>
      <span className={styles.controlLabel}>{label}</span>
      <span className={styles.controlValue}>{display}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={styles.slider}
        aria-label={label}
      />
    </div>
  );
}

interface HistogramProps {
  probs: number[];
  keptIndices: Set<number> | null;
  maxProb: number;
}
function Histogram({ probs, keptIndices, maxProb }: HistogramProps) {
  const W = 720;
  const H = 130;
  const barW = W / probs.length;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={styles.chartSvg}
      role="img"
      aria-label="probability histogram"
    >
      {probs.map((p, i) => {
        const h = (p / maxProb) * (H - 22);
        const x = i * barW;
        const inNucleus = keptIndices === null ? null : keptIndices.has(i);
        const className =
          inNucleus === null
            ? styles.barOriginal
            : inNucleus
              ? styles.barKept
              : styles.barMasked;
        return (
          <rect
            key={`bar-${i}`}
            x={x + 0.5}
            y={H - 14 - h}
            width={barW - 1}
            height={Math.max(1, h)}
            className={className}
          />
        );
      })}
      <line x1={0} y1={H - 14} x2={W} y2={H - 14} className={styles.axis} />
      {probs.map((_, i) => {
        if (i % 5 !== 0) return null;
        return (
          <text
            key={`xlabel-${i}`}
            x={i * barW + barW / 2}
            y={H - 3}
            className={styles.axisLabel}
            textAnchor="middle"
          >
            {i}
          </text>
        );
      })}
    </svg>
  );
}

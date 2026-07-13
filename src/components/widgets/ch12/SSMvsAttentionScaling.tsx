import { useMemo, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import {
  type Metric,
  generateCurvePoints,
  crossoverSeqLen,
  attentionFlops,
  ssmFlops,
  attentionMemory,
  ssmMemory,
  formatMetric,
  formatSeqLen,
  formatCompute,
  formatMemory,
  sliderToSeqLen,
  seqLenToSlider,
  LOG_SEQ_MIN,
  LOG_SEQ_MAX,
} from './scaling-data';
import styles from './SSMvsAttentionScaling.module.css';

type HoverState = { seqLen: number; attn: number; ssm: number };

export default function SSMvsAttentionScaling() {
  const [metric, setMetric] = useState<Metric>('compute');
  const [dModel, setDModel] = useState(4096);
  const [seqLenSlider, setSeqLenSlider] = useState(seqLenToSlider(8192));
  const [hovered, setHovered] = useState<HoverState | null>(null);

  const seqLen = sliderToSeqLen(seqLenSlider);
  const curve = useMemo(() => generateCurvePoints(metric, dModel), [metric, dModel]);
  const crossover = crossoverSeqLen(dModel);

  const currentAttn = metric === 'compute'
    ? attentionFlops(seqLen, dModel)
    : attentionMemory(seqLen, dModel);
  const currentSSM = metric === 'compute'
    ? ssmFlops(seqLen, dModel)
    : ssmMemory(seqLen, dModel);
  const ratio = currentAttn / currentSSM;

  return (
    <div className={styles.widget}>
      <div className={styles.controls}>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Metric:</label>
          <div className={styles.metricToggle}>
            {(['compute', 'memory'] as Metric[]).map(m => (
              <button
                key={m}
                type="button"
                className={`${styles.metricButton} ${metric === m ? styles.metricButtonActive : ''}`}
                onClick={() => setMetric(m)}
                aria-pressed={metric === m}
              >
                {m === 'compute' ? 'Compute (FLOPs)' : 'Memory (bytes)'}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel} htmlFor="ssm-dmodel-slider">
            d_model: <span className={styles.controlValue}>{dModel}</span>
          </label>
          <input
            id="ssm-dmodel-slider"
            type="range"
            min={512}
            max={16384}
            step={512}
            value={dModel}
            onChange={e => setDModel(Number(e.target.value))}
            className={styles.slider}
            aria-label="d_model"
          />
        </div>
      </div>

      <div className={styles.plotPanel}>
        <PlotSvg
          curve={curve}
          metric={metric}
          dModel={dModel}
          currentSeqLen={seqLen}
          crossover={crossover}
          onHover={setHovered}
        />
      </div>

      <div className={styles.seqLenPanel}>
        <label className={styles.controlLabel} htmlFor="ssm-seqlen-slider">
          Sequence length:{' '}
          <span className={styles.controlValue}>
            {seqLen.toLocaleString()} tokens ({formatSeqLen(seqLen)})
          </span>
        </label>
        <input
          id="ssm-seqlen-slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={seqLenSlider}
          onChange={e => setSeqLenSlider(Number(e.target.value))}
          className={styles.slider}
          aria-label="Sequence length"
        />
        <div className={styles.sliderHints}>
          <span>256</span>
          <span>1K</span>
          <span>4K</span>
          <span>16K</span>
          <span>64K</span>
          <span>256K</span>
          <span>1M</span>
        </div>
      </div>

      <div className={styles.comparisonPanel}>
        <div className={styles.comparisonHeader}>
          At seq_len = {seqLen.toLocaleString()}, d_model = {dModel} (per layer):
        </div>
        <div className={styles.cards}>
          <div className={`${styles.card} ${styles.cardAttention}`}>
            <div className={styles.cardLabel}>Attention</div>
            <div className={styles.cardValue}>{formatMetric(metric, currentAttn)}</div>
            <div className={styles.cardSubtext}>
              {metric === 'compute'
                ? `Memory: ${formatMemory(attentionMemory(seqLen, dModel))}`
                : `Compute: ${formatCompute(attentionFlops(seqLen, dModel))}`}
            </div>
          </div>
          <div className={`${styles.card} ${styles.cardSSM}`}>
            <div className={styles.cardLabel}>SSM</div>
            <div className={styles.cardValue}>{formatMetric(metric, currentSSM)}</div>
            <div className={styles.cardSubtext}>
              {metric === 'compute'
                ? `Memory: ${formatMemory(ssmMemory(seqLen, dModel))}`
                : `Compute: ${formatCompute(ssmFlops(seqLen, dModel))}`}
            </div>
          </div>
        </div>
        <div className={styles.ratioRow}>
          <span className={styles.ratioLabel}>Ratio (attention / SSM):</span>
          <span className={styles.ratioValue}>
            {ratio < 1 ? `${(1 / ratio).toFixed(1)}× less` : `${ratio.toFixed(1)}× more`}
          </span>
          <span className={styles.ratioNote}>
            {seqLen < crossover
              ? "Below the wall-clock crossover: attention's matmul efficiency still wins on real hardware, even though the curves above already show SSM using fewer raw FLOPs/bytes here."
              : "Above the wall-clock crossover: SSM wins both on the raw FLOPs/bytes plotted above and on wall-clock time."}
          </span>
        </div>
      </div>

      {hovered && (
        <div className={styles.hoverReadout}>
          At seq_len = <strong>{hovered.seqLen.toLocaleString()}</strong>: attn ={' '}
          <strong>{formatMetric(metric, hovered.attn)}</strong>, ssm ={' '}
          <strong>{formatMetric(metric, hovered.ssm)}</strong>, ratio ={' '}
          <strong>{(hovered.attn / hovered.ssm).toFixed(1)}×</strong>
        </div>
      )}
    </div>
  );
}

interface PlotProps {
  curve: { seqLen: number; attentionValue: number; ssmValue: number }[];
  metric: Metric;
  dModel: number;
  currentSeqLen: number;
  crossover: number;
  onHover: (h: HoverState | null) => void;
}

function PlotSvg({ curve, metric, dModel, currentSeqLen, crossover, onHover }: PlotProps) {
  const WIDTH = 720;
  const HEIGHT = 360;
  const PADDING = { top: 30, right: 30, bottom: 50, left: 80 };
  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;

  const allValues = curve.flatMap(p => [p.attentionValue, p.ssmValue]);
  const yMinLog = Math.floor(Math.log10(Math.min(...allValues)));
  const yMaxLog = Math.ceil(Math.log10(Math.max(...allValues)));

  const xMinLog = LOG_SEQ_MIN;
  const xMaxLog = LOG_SEQ_MAX;

  function xFor(seqLen: number): number {
    return PADDING.left + ((Math.log10(seqLen) - xMinLog) / (xMaxLog - xMinLog)) * plotW;
  }
  function yFor(value: number): number {
    return PADDING.top + ((yMaxLog - Math.log10(value)) / (yMaxLog - yMinLog)) * plotH;
  }

  const xTicks = [256, 1024, 4096, 16_384, 65_536, 262_144, 1_048_576];
  const xTickLabels = ['256', '1K', '4K', '16K', '64K', '256K', '1M'];

  const yTicks: number[] = [];
  for (let v = yMinLog; v <= yMaxLog; v++) yTicks.push(v);

  const attnPath = curve
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(p.seqLen)} ${yFor(p.attentionValue)}`)
    .join(' ');
  const ssmPath = curve
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(p.seqLen)} ${yFor(p.ssmValue)}`)
    .join(' ');

  // Marker values track the live dModel + metric, not the closure of helper functions.
  const markerAttnValue = metric === 'compute'
    ? attentionFlops(currentSeqLen, dModel)
    : attentionMemory(currentSeqLen, dModel);
  const markerSSMValue = metric === 'compute'
    ? ssmFlops(currentSeqLen, dModel)
    : ssmMemory(currentSeqLen, dModel);

  function handleMouseMove(e: ReactMouseEvent<SVGSVGElement>) {
    const svgEl = e.currentTarget;
    const pt = svgEl.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svgEl.getScreenCTM();
    if (!ctm) return;
    const local = pt.matrixTransform(ctm.inverse());
    const xRel = (local.x - PADDING.left) / plotW;
    if (xRel < 0 || xRel > 1) {
      onHover(null);
      return;
    }
    const logSeq = xMinLog + xRel * (xMaxLog - xMinLog);
    let best = curve[0]!;
    let bestDist = Math.abs(Math.log10(best.seqLen) - logSeq);
    for (const p of curve) {
      const d = Math.abs(Math.log10(p.seqLen) - logSeq);
      if (d < bestDist) {
        best = p;
        bestDist = d;
      }
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
      aria-label="Attention vs SSM scaling plot: log-log compute or memory cost per layer against sequence length"
    >
      {xTicks.map(t => (
        <line
          key={`gx-${t}`}
          x1={xFor(t)}
          x2={xFor(t)}
          y1={PADDING.top}
          y2={HEIGHT - PADDING.bottom}
          className={styles.gridLine}
        />
      ))}
      {yTicks.map(t => (
        <line
          key={`gy-${t}`}
          x1={PADDING.left}
          x2={WIDTH - PADDING.right}
          y1={yFor(Math.pow(10, t))}
          y2={yFor(Math.pow(10, t))}
          className={styles.gridLine}
        />
      ))}

      <line
        x1={PADDING.left}
        x2={PADDING.left}
        y1={PADDING.top}
        y2={HEIGHT - PADDING.bottom}
        className={styles.axisLine}
      />
      <line
        x1={PADDING.left}
        x2={WIDTH - PADDING.right}
        y1={HEIGHT - PADDING.bottom}
        y2={HEIGHT - PADDING.bottom}
        className={styles.axisLine}
      />

      {xTicks.map((t, i) => (
        <text
          key={`xt-${t}`}
          x={xFor(t)}
          y={HEIGHT - PADDING.bottom + 16}
          className={styles.tickLabel}
          textAnchor="middle"
        >
          {xTickLabels[i]}
        </text>
      ))}
      {yTicks.map(t => (
        <text
          key={`yt-${t}`}
          x={PADDING.left - 8}
          y={yFor(Math.pow(10, t)) + 4}
          className={styles.tickLabel}
          textAnchor="end"
        >
          10^{t}
        </text>
      ))}

      <text
        x={PADDING.left + plotW / 2}
        y={HEIGHT - 8}
        className={styles.axisLabel}
        textAnchor="middle"
      >
        sequence length (log)
      </text>
      <text
        x={-(PADDING.top + plotH / 2)}
        y={18}
        className={styles.axisLabel}
        textAnchor="middle"
        transform="rotate(-90)"
      >
        {metric === 'compute' ? 'FLOPs (log)' : 'bytes (log)'}
      </text>

      <line
        x1={xFor(crossover)}
        x2={xFor(crossover)}
        y1={PADDING.top}
        y2={HEIGHT - PADDING.bottom}
        className={styles.crossoverLine}
      />
      <text
        x={xFor(crossover) + 4}
        y={PADDING.top + 12}
        className={styles.crossoverLabel}
      >
        ← wall-clock crossover (~{formatSeqLen(crossover)})
      </text>

      <path d={attnPath} fill="none" className={styles.attentionLine} />
      <path d={ssmPath} fill="none" className={styles.ssmLine} />

      <line
        x1={xFor(currentSeqLen)}
        x2={xFor(currentSeqLen)}
        y1={PADDING.top}
        y2={HEIGHT - PADDING.bottom}
        className={styles.currentLine}
      />
      <circle
        cx={xFor(currentSeqLen)}
        cy={yFor(markerAttnValue)}
        r={5}
        className={styles.markerAttn}
      />
      <circle
        cx={xFor(currentSeqLen)}
        cy={yFor(markerSSMValue)}
        r={5}
        className={styles.markerSSM}
      />

      <g transform={`translate(${WIDTH - PADDING.right - 150}, ${PADDING.top + 5})`}>
        <line x1={0} x2={20} y1={0} y2={0} className={styles.attentionLine} />
        <text x={26} y={4} className={styles.legendLabel}>
          Attention (O(N²))
        </text>
        <line x1={0} x2={20} y1={18} y2={18} className={styles.ssmLine} />
        <text x={26} y={22} className={styles.legendLabel}>
          SSM (O(N))
        </text>
      </g>
    </svg>
  );
}

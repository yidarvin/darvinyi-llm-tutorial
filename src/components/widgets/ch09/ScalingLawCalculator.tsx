import { useMemo, useState } from 'react';
import {
  STRATEGIES,
  type Strategy,
  allocateByRatio,
  chinchillaLoss,
  sampleLossCurve,
  formatLargeNumber,
  sliderToCompute,
  computeToSlider,
} from './chinchilla-data';
import styles from './ScalingLawCalculator.module.css';

type CurvePoint = { r: number; N: number; D: number; loss: number };
type StrategyResult = Strategy & { N: number; D: number; loss: number };

export default function ScalingLawCalculator() {
  const [sliderValue, setSliderValue] = useState(computeToSlider(6e23));
  const [focusedKey, setFocusedKey] = useState<Strategy['key']>('chinchilla');
  const [hovered, setHovered] = useState<CurvePoint | null>(null);

  const C = sliderToCompute(sliderValue);
  const curve = useMemo(() => sampleLossCurve(C), [C]);
  const strategyResults: StrategyResult[] = useMemo(
    () =>
      STRATEGIES.map(s => {
        const { N, D } = allocateByRatio(C, s.ratio);
        return { ...s, N, D, loss: chinchillaLoss(N, D) };
      }),
    [C],
  );
  const focused = strategyResults.find(s => s.key === focusedKey)!;

  return (
    <div className={styles.widget}>
      <div className={styles.controls}>
        <label className={styles.controlLabel}>
          Compute budget:{' '}
          <span className={styles.controlValue}>{C.toExponential(1)} FLOPs</span>
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={sliderValue}
          onChange={e => setSliderValue(Number(e.target.value))}
          className={styles.slider}
          aria-label="Compute budget"
        />
        <div className={styles.sliderHints}>
          <span>10²¹ (small experiment)</span>
          <span>10²³ (GPT-3-class)</span>
          <span>10²⁶ (frontier)</span>
        </div>
      </div>

      <div className={styles.plotPanel}>
        <div className={styles.panelTitle}>
          Loss along iso-compute curve — varying D/N at fixed C
        </div>
        <LossCurvePlot
          curve={curve}
          strategies={strategyResults}
          focusedKey={focusedKey}
          onHover={setHovered}
        />
      </div>

      <div className={styles.panelTitle}>Three strategies at this compute budget</div>
      <div className={styles.cardsGrid}>
        {strategyResults.map(s => {
          const isFocused = s.key === focusedKey;
          return (
            <div
              key={s.key}
              className={`${styles.strategyCard} ${isFocused ? styles.cardFocused : ''}`}
              onClick={() => setFocusedKey(s.key)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setFocusedKey(s.key);
                }
              }}
              style={{ borderColor: isFocused ? s.color : undefined }}
              role="button"
              tabIndex={0}
              aria-pressed={isFocused}
            >
              <div className={styles.cardHeader} style={{ color: s.color }}>
                {s.shortLabel}
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>D/N</span>
                <span className={styles.cardValue}>{s.ratio}</span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>N (params)</span>
                <span className={styles.cardValue}>{formatLargeNumber(s.N)}</span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>D (tokens)</span>
                <span className={styles.cardValue}>{formatLargeNumber(s.D)}</span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>loss</span>
                <span className={styles.cardLossValue} style={{ color: s.color }}>
                  {s.loss.toFixed(3)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.description} aria-live="polite">
        <div className={styles.descriptionHeader} style={{ color: focused.color }}>
          {focused.label}
        </div>
        <div className={styles.descriptionBody}>{focused.description}</div>
      </div>

      {hovered && (
        <div className={styles.hoverReadout}>
          D/N = <strong>{hovered.r.toFixed(1)}</strong> &nbsp;|&nbsp; N ={' '}
          <strong>{formatLargeNumber(hovered.N)}</strong> &nbsp;|&nbsp; D ={' '}
          <strong>{formatLargeNumber(hovered.D)}</strong> &nbsp;|&nbsp; loss ={' '}
          <strong>{hovered.loss.toFixed(3)}</strong>
        </div>
      )}
    </div>
  );
}

interface PlotProps {
  curve: CurvePoint[];
  strategies: StrategyResult[];
  focusedKey: Strategy['key'];
  onHover: (h: CurvePoint | null) => void;
}

const WIDTH = 800;
const HEIGHT = 320;
const PADDING = { top: 24, right: 24, bottom: 44, left: 60 };
const PLOT_W = WIDTH - PADDING.left - PADDING.right;
const PLOT_H = HEIGHT - PADDING.top - PADDING.bottom;
const R_MIN_LOG = Math.log10(0.1);
const R_MAX_LOG = Math.log10(2000);

function LossCurvePlot({ curve, strategies, focusedKey, onHover }: PlotProps) {
  const lossValues = curve.map(p => p.loss);
  const lossMin = Math.min(...lossValues);
  const lossMax = Math.max(...lossValues);
  const yMin = Math.floor(lossMin * 10) / 10 - 0.1;
  const yMax = Math.ceil(lossMax * 10) / 10 + 0.1;

  function xFor(r: number): number {
    return (
      PADDING.left + ((Math.log10(r) - R_MIN_LOG) / (R_MAX_LOG - R_MIN_LOG)) * PLOT_W
    );
  }
  function yFor(loss: number): number {
    return PADDING.top + ((yMax - loss) / (yMax - yMin)) * PLOT_H;
  }

  const xTicks = [0.1, 1, 10, 100, 1000];
  const yTickStep = 0.5;
  const yTicks: number[] = [];
  for (let v = Math.ceil(yMin / yTickStep) * yTickStep; v <= yMax; v += yTickStep) {
    yTicks.push(parseFloat(v.toFixed(2)));
  }

  const pathD = curve
    .map(
      (pt, i) => `${i === 0 ? 'M' : 'L'} ${xFor(pt.r).toFixed(2)} ${yFor(pt.loss).toFixed(2)}`,
    )
    .join(' ');

  function handleSvgMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svgEl = e.currentTarget;
    const pt = svgEl.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svgEl.getScreenCTM();
    if (!ctm) return;
    const local = pt.matrixTransform(ctm.inverse());
    const xRel = (local.x - PADDING.left) / PLOT_W;
    if (xRel < 0 || xRel > 1) {
      onHover(null);
      return;
    }
    const logR = R_MIN_LOG + xRel * (R_MAX_LOG - R_MIN_LOG);
    let best = curve[0]!;
    let bestDist = Math.abs(Math.log10(best.r) - logR);
    for (const p of curve) {
      const d = Math.abs(Math.log10(p.r) - logR);
      if (d < bestDist) {
        best = p;
        bestDist = d;
      }
    }
    onHover(best);
  }

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={styles.svg}
      onMouseMove={handleSvgMouseMove}
      onMouseLeave={() => onHover(null)}
      role="img"
      aria-label="Loss along iso-compute curve"
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
          y1={yFor(t)}
          y2={yFor(t)}
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

      {xTicks.map(t => (
        <text
          key={`xt-${t}`}
          x={xFor(t)}
          y={HEIGHT - PADDING.bottom + 18}
          className={styles.tickLabel}
          textAnchor="middle"
        >
          {t}
        </text>
      ))}
      {yTicks.map(t => (
        <text
          key={`yt-${t}`}
          x={PADDING.left - 8}
          y={yFor(t) + 4}
          className={styles.tickLabel}
          textAnchor="end"
        >
          {t.toFixed(1)}
        </text>
      ))}

      <text
        x={PADDING.left + PLOT_W / 2}
        y={HEIGHT - 6}
        className={styles.axisLabel}
        textAnchor="middle"
      >
        tokens per parameter (D / N), log scale
      </text>
      <text
        x={16}
        y={PADDING.top + PLOT_H / 2}
        className={styles.axisLabel}
        textAnchor="middle"
        transform={`rotate(-90 16 ${PADDING.top + PLOT_H / 2})`}
      >
        predicted loss
      </text>

      <path d={pathD} fill="none" className={styles.curvePath} />

      {strategies.map(s => {
        const isFocused = s.key === focusedKey;
        return (
          <g key={s.key}>
            <line
              x1={xFor(s.ratio)}
              x2={xFor(s.ratio)}
              y1={yFor(s.loss)}
              y2={HEIGHT - PADDING.bottom}
              stroke={s.color}
              strokeWidth={1}
              strokeDasharray="2 3"
              opacity={isFocused ? 0.7 : 0.35}
            />
            <circle
              cx={xFor(s.ratio)}
              cy={yFor(s.loss)}
              r={isFocused ? 7 : 5}
              fill={s.color}
              stroke="var(--bg-primary)"
              strokeWidth={2}
            />
            <text
              x={xFor(s.ratio)}
              y={yFor(s.loss) - 12}
              fill={s.color}
              className={styles.strategyLabel}
              textAnchor="middle"
              fontWeight={isFocused ? 500 : 400}
            >
              {s.shortLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

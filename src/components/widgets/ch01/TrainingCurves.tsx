import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  type OptimizerName,
  type TrainingData,
  type GridSnapshot,
  computeTrainingData,
  NUM_STEPS,
  GRID_SIZE,
} from './training-data';
import styles from './TrainingCurves.module.css';

const PLAY_FPS = 20;
const SPEED_PRESETS = [0.5, 1, 2] as const;
const OPTIMIZERS: OptimizerName[] = ['sgd', 'momentum', 'adam'];
const OPTIMIZER_LABELS: Record<OptimizerName, string> = {
  sgd: 'SGD',
  momentum: 'Momentum',
  adam: 'Adam',
};
const OPTIMIZER_COLORS: Record<OptimizerName, string> = {
  sgd: 'var(--text-secondary)',
  momentum: 'var(--amber-500)',
  adam: 'var(--cyan-500)',
};

const CLASS_FILL = [
  'rgba(6, 182, 212, 0.18)',
  'rgba(245, 158, 11, 0.18)',
  'rgba(244, 63, 94, 0.18)',
  'rgba(16, 185, 129, 0.18)',
];
const CLASS_DOT = [
  'var(--cyan-500)',
  'var(--amber-500)',
  'var(--rose-500)',
  'var(--emerald-500)',
];

const MAX_STEP = NUM_STEPS - 1;

export default function TrainingCurves() {
  const [data, setData] = useState<TrainingData | null>(null);
  const [step, setStep] = useState(0);
  const [activeOpt, setActiveOpt] = useState<OptimizerName>('adam');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEED_PRESETS)[number]>(1);

  const cancelledRef = useRef(false);
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (cancelledRef.current) return;
      const computed = computeTrainingData();
      if (!cancelledRef.current) setData(computed);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isPlaying || !data) return;
    const intervalMs = 1000 / (PLAY_FPS * speed);
    const tick = () => {
      if (cancelledRef.current) return;
      setStep(s => {
        if (s >= MAX_STEP) {
          setIsPlaying(false);
          return s;
        }
        return s + 1;
      });
      animationRef.current = setTimeout(tick, intervalMs);
    };
    animationRef.current = setTimeout(tick, intervalMs);
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, [isPlaying, speed, data]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, []);

  if (!data) {
    return (
      <div className={styles.widget}>
        <div className={styles.loading}>
          <div className={styles.loadingBar} />
          Running 1500 training steps in JavaScript…
        </div>
      </div>
    );
  }

  const snapshots = data.runs[activeOpt].snapshots;
  const snapshot = snapshots.reduce<GridSnapshot>(
    (best, curr) =>
      Math.abs(curr.step - step) < Math.abs(best.step - step) ? curr : best,
    snapshots[0]!,
  );

  return (
    <div className={styles.widget}>
      <div className={styles.optBar}>
        <span className={styles.optLabel}>Decision boundary for:</span>
        {OPTIMIZERS.map(o => (
          <button
            key={o}
            type="button"
            onClick={() => setActiveOpt(o)}
            className={`${styles.optButton} ${o === activeOpt ? styles.optActive : ''}`}
            style={{ ['--swatch' as string]: OPTIMIZER_COLORS[o] } as CSSProperties}
            aria-pressed={o === activeOpt}
          >
            <span className={styles.optSwatch} />
            {OPTIMIZER_LABELS[o]}
          </button>
        ))}
      </div>

      <div className={styles.panels}>
        <LossPanel data={data} currentStep={step} />
        <DecisionPanel data={data} snapshot={snapshot} activeOpt={activeOpt} />
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          onClick={() => { setStep(0); setIsPlaying(false); }}
          className={styles.controlSecondary}
          aria-label="Reset to step 0"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => {
            if (step >= MAX_STEP) setStep(0);
            setIsPlaying(p => !p);
          }}
          className={styles.controlPrimary}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? 'Pause' : step >= MAX_STEP ? 'Replay' : 'Play'}
        </button>
        <input
          type="range"
          min={0}
          max={MAX_STEP}
          value={step}
          onChange={e => { setIsPlaying(false); setStep(Number(e.target.value)); }}
          className={styles.scrubber}
          aria-label="Training step"
        />
        <span className={styles.stepLabel} aria-live="polite">
          Step {step.toString().padStart(3, ' ')} / {MAX_STEP}
        </span>
      </div>

      <div className={styles.speedBar}>
        <span className={styles.speedLabel}>Speed:</span>
        {SPEED_PRESETS.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setSpeed(s)}
            className={`${styles.speedButton} ${s === speed ? styles.speedActive : ''}`}
            aria-pressed={s === speed}
          >
            {s}×
          </button>
        ))}
        <div className={styles.legend}>
          {OPTIMIZERS.map(o => (
            <span key={o} className={styles.legendItem}>
              <span className={styles.legendSwatch} style={{ background: OPTIMIZER_COLORS[o] }} />
              {OPTIMIZER_LABELS[o]} {data.runs[o].losses[step]!.toFixed(2)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Loss panel
// =============================================================================

interface LossPanelProps {
  data: TrainingData;
  currentStep: number;
}

const LOSS_VB_W = 400;
const LOSS_VB_H = 280;
const LOSS_MARGIN = { top: 24, right: 16, bottom: 36, left: 44 };
const LOSS_PLOT_W = LOSS_VB_W - LOSS_MARGIN.left - LOSS_MARGIN.right;
const LOSS_PLOT_H = LOSS_VB_H - LOSS_MARGIN.top - LOSS_MARGIN.bottom;

function LossPanel({ data, currentStep }: LossPanelProps) {
  const { yMin, yMax, polylines } = useMemo(() => {
    let yMin = Infinity;
    let yMax = -Infinity;
    for (const opt of OPTIMIZERS) {
      for (const v of data.runs[opt].losses) {
        const y = Math.log10(Math.max(v, 1e-6));
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
      }
    }
    // Add a little padding
    const pad = (yMax - yMin) * 0.05 || 0.1;
    yMin -= pad;
    yMax += pad;

    const xOf = (step: number) =>
      LOSS_MARGIN.left + (step / MAX_STEP) * LOSS_PLOT_W;
    const yOf = (logLoss: number) =>
      LOSS_MARGIN.top + (1 - (logLoss - yMin) / (yMax - yMin)) * LOSS_PLOT_H;

    const polylines: Record<OptimizerName, string> = {
      sgd: '',
      momentum: '',
      adam: '',
    };
    for (const opt of OPTIMIZERS) {
      const losses = data.runs[opt].losses;
      const pts: string[] = [];
      for (let i = 0; i < losses.length; i++) {
        const x = xOf(i);
        const y = yOf(Math.log10(Math.max(losses[i]!, 1e-6)));
        pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      polylines[opt] = pts.join(' ');
    }
    return { yMin, yMax, polylines };
  }, [data]);

  const scrubX =
    LOSS_MARGIN.left + (currentStep / MAX_STEP) * LOSS_PLOT_W;

  // Y-axis tick values — choose powers of 10 within the visible range
  const tickValues: number[] = [];
  for (let k = Math.ceil(yMin); k <= Math.floor(yMax); k++) tickValues.push(k);
  if (tickValues.length === 0) tickValues.push((yMin + yMax) / 2);

  const xTicks = [0, Math.round(MAX_STEP / 4), Math.round(MAX_STEP / 2), Math.round((3 * MAX_STEP) / 4), MAX_STEP];

  const yOfTick = (k: number) =>
    LOSS_MARGIN.top + (1 - (k - yMin) / (yMax - yMin)) * LOSS_PLOT_H;
  const xOfTick = (s: number) =>
    LOSS_MARGIN.left + (s / MAX_STEP) * LOSS_PLOT_W;

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeading}>Training loss (log scale)</div>
      <svg
        viewBox={`0 0 ${LOSS_VB_W} ${LOSS_VB_H}`}
        className={styles.svg}
        role="img"
        aria-label="Training loss curves for SGD, Momentum, and Adam"
      >
        {/* Gridlines + y-axis ticks */}
        {tickValues.map(k => {
          const y = yOfTick(k);
          return (
            <g key={`yt-${k}`}>
              <line
                x1={LOSS_MARGIN.left}
                x2={LOSS_MARGIN.left + LOSS_PLOT_W}
                y1={y}
                y2={y}
                className={styles.gridline}
              />
              <text
                x={LOSS_MARGIN.left - 6}
                y={y + 3}
                className={styles.axisLabel}
                textAnchor="end"
              >
                10^{k}
              </text>
            </g>
          );
        })}

        {/* x-axis ticks */}
        {xTicks.map(s => {
          const x = xOfTick(s);
          return (
            <g key={`xt-${s}`}>
              <line
                x1={x}
                x2={x}
                y1={LOSS_MARGIN.top + LOSS_PLOT_H}
                y2={LOSS_MARGIN.top + LOSS_PLOT_H + 4}
                className={styles.gridline}
              />
              <text
                x={x}
                y={LOSS_MARGIN.top + LOSS_PLOT_H + 16}
                className={styles.axisLabel}
                textAnchor="middle"
              >
                {s}
              </text>
            </g>
          );
        })}

        {/* axis labels */}
        <text
          x={LOSS_MARGIN.left + LOSS_PLOT_W / 2}
          y={LOSS_VB_H - 4}
          className={styles.axisTitle}
          textAnchor="middle"
        >
          step
        </text>
        <text
          x={12}
          y={LOSS_MARGIN.top + LOSS_PLOT_H / 2}
          className={styles.axisTitle}
          textAnchor="middle"
          transform={`rotate(-90 12 ${LOSS_MARGIN.top + LOSS_PLOT_H / 2})`}
        >
          loss
        </text>

        {/* Plot frame */}
        <rect
          x={LOSS_MARGIN.left}
          y={LOSS_MARGIN.top}
          width={LOSS_PLOT_W}
          height={LOSS_PLOT_H}
          className={styles.frame}
        />

        {/* Loss curves */}
        {OPTIMIZERS.map(opt => (
          <polyline
            key={opt}
            points={polylines[opt]}
            fill="none"
            stroke={OPTIMIZER_COLORS[opt]}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.95}
          />
        ))}

        {/* Scrubber line */}
        <line
          x1={scrubX}
          x2={scrubX}
          y1={LOSS_MARGIN.top}
          y2={LOSS_MARGIN.top + LOSS_PLOT_H}
          className={styles.scrubLine}
        />

        {/* Current-step markers */}
        {OPTIMIZERS.map(opt => {
          const loss = data.runs[opt].losses[currentStep]!;
          const y =
            LOSS_MARGIN.top +
            (1 - (Math.log10(Math.max(loss, 1e-6)) - yMin) / (yMax - yMin)) *
              LOSS_PLOT_H;
          return (
            <circle
              key={opt}
              cx={scrubX}
              cy={y}
              r={3.5}
              fill={OPTIMIZER_COLORS[opt]}
              stroke="var(--bg-primary)"
              strokeWidth={1.25}
            />
          );
        })}
      </svg>
    </div>
  );
}

// =============================================================================
// Decision boundary panel
// =============================================================================

interface DecisionPanelProps {
  data: TrainingData;
  snapshot: GridSnapshot;
  activeOpt: OptimizerName;
}

const DEC_VB_W = 400;
const DEC_VB_H = 400;
const DEC_MARGIN = { top: 24, right: 24, bottom: 36, left: 36 };
const DEC_PLOT_W = DEC_VB_W - DEC_MARGIN.left - DEC_MARGIN.right;
const DEC_PLOT_H = DEC_VB_H - DEC_MARGIN.top - DEC_MARGIN.bottom;

function DecisionPanel({ data, snapshot, activeOpt }: DecisionPanelProps) {
  const cellW = DEC_PLOT_W / GRID_SIZE;
  const cellH = DEC_PLOT_H / GRID_SIZE;

  const cells: React.ReactElement[] = [];
  for (let iy = 0; iy < GRID_SIZE; iy++) {
    for (let ix = 0; ix < GRID_SIZE; ix++) {
      const cls = snapshot.predictions[iy * GRID_SIZE + ix]!;
      const x = DEC_MARGIN.left + ix * cellW;
      // y axis flipped in screen space
      const y = DEC_MARGIN.top + (GRID_SIZE - 1 - iy) * cellH;
      cells.push(
        <rect
          key={`c-${ix}-${iy}`}
          x={x}
          y={y}
          width={cellW + 0.5}
          height={cellH + 0.5}
          fill={CLASS_FILL[cls]}
          shapeRendering="crispEdges"
        />,
      );
    }
  }

  // Axis lines (x=0 and y=0)
  const xZero = DEC_MARGIN.left + (0 - (-data.grid_x[0]!)) / (data.grid_x[GRID_SIZE - 1]! - data.grid_x[0]!) * DEC_PLOT_W;
  const yZero = DEC_MARGIN.top + (1 - (0 - data.grid_y[0]!) / (data.grid_y[GRID_SIZE - 1]! - data.grid_y[0]!)) * DEC_PLOT_H;

  const xOf = (vx: number) =>
    DEC_MARGIN.left + ((vx - data.grid_x[0]!) / (data.grid_x[GRID_SIZE - 1]! - data.grid_x[0]!)) * DEC_PLOT_W;
  const yOf = (vy: number) =>
    DEC_MARGIN.top + (1 - (vy - data.grid_y[0]!) / (data.grid_y[GRID_SIZE - 1]! - data.grid_y[0]!)) * DEC_PLOT_H;

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeading}>
        {OPTIMIZER_LABELS[activeOpt]} decision boundary
        <span className={styles.snapshotStep}> · snapshot @ step {snapshot.step}</span>
      </div>
      <svg
        viewBox={`0 0 ${DEC_VB_W} ${DEC_VB_H}`}
        className={styles.svg}
        role="img"
        aria-label={`Decision boundary plot for ${OPTIMIZER_LABELS[activeOpt]} at training step ${snapshot.step}`}
      >
        {/* Frame */}
        <rect
          x={DEC_MARGIN.left}
          y={DEC_MARGIN.top}
          width={DEC_PLOT_W}
          height={DEC_PLOT_H}
          className={styles.frame}
        />

        {/* Background grid: predicted class fills */}
        {cells}

        {/* Zero lines */}
        <line
          x1={xZero}
          x2={xZero}
          y1={DEC_MARGIN.top}
          y2={DEC_MARGIN.top + DEC_PLOT_H}
          className={styles.zeroLine}
        />
        <line
          x1={DEC_MARGIN.left}
          x2={DEC_MARGIN.left + DEC_PLOT_W}
          y1={yZero}
          y2={yZero}
          className={styles.zeroLine}
        />

        {/* Scatter training points */}
        {data.scatter_idx.map(i => {
          const px = data.x_data[i]!;
          const cls = data.y_data[i]!;
          const cx = xOf(px[0]!);
          const cy = yOf(px[1]!);
          if (cx < DEC_MARGIN.left || cx > DEC_MARGIN.left + DEC_PLOT_W) return null;
          if (cy < DEC_MARGIN.top || cy > DEC_MARGIN.top + DEC_PLOT_H) return null;
          return (
            <circle
              key={`p-${i}`}
              cx={cx}
              cy={cy}
              r={2.6}
              fill={CLASS_DOT[cls]}
              opacity={0.95}
              stroke="var(--bg-primary)"
              strokeWidth={0.6}
            />
          );
        })}

        {/* Axis labels */}
        <text
          x={DEC_MARGIN.left + DEC_PLOT_W / 2}
          y={DEC_VB_H - 8}
          className={styles.axisTitle}
          textAnchor="middle"
        >
          x[0]
        </text>
        <text
          x={12}
          y={DEC_MARGIN.top + DEC_PLOT_H / 2}
          className={styles.axisTitle}
          textAnchor="middle"
          transform={`rotate(-90 12 ${DEC_MARGIN.top + DEC_PLOT_H / 2})`}
        >
          x[1]
        </text>

        {/* x-axis tick labels at -3, 0, 3 */}
        {[-3, 0, 3].map(v => (
          <text
            key={`xtl-${v}`}
            x={xOf(v)}
            y={DEC_MARGIN.top + DEC_PLOT_H + 14}
            className={styles.axisLabel}
            textAnchor="middle"
          >
            {v}
          </text>
        ))}
        {[-3, 0, 3].map(v => (
          <text
            key={`ytl-${v}`}
            x={DEC_MARGIN.left - 6}
            y={yOf(v) + 3}
            className={styles.axisLabel}
            textAnchor="end"
          >
            {v}
          </text>
        ))}

        {/* Class legend in corner */}
        <g transform={`translate(${DEC_MARGIN.left + 8}, ${DEC_MARGIN.top + 8})`}>
          {[0, 1, 2, 3].map((c, idx) => (
            <g key={`leg-${c}`} transform={`translate(0, ${idx * 13})`}>
              <rect width={9} height={9} fill={CLASS_DOT[c]} rx={1.5} />
              <text x={14} y={8} className={styles.legendText}>
                class {c}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

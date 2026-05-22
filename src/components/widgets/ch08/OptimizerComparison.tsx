import { useEffect, useRef, useState } from 'react';
import {
  N_STEPS, START, MINIMUM, OPTIMIZERS,
  type OptimizerKey,
} from './optimizer-data';
import styles from './OptimizerComparison.module.css';

const PLAY_STEP_PER_FRAME = 1;
const FRAME_INTERVAL_MS = 80;

const DEFAULT_VISIBLE: Record<OptimizerKey, boolean> = { sgd: true, adam: true, adamw: true };

export default function OptimizerComparison() {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visible, setVisible] = useState<Record<OptimizerKey, boolean>>(DEFAULT_VISIBLE);
  const [focusedOpt, setFocusedOpt] = useState<OptimizerKey>('adamw');
  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isPlaying) return;
    if (step >= N_STEPS) {
      setIsPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      setStep(s => Math.min(s + PLAY_STEP_PER_FRAME, N_STEPS));
    }, FRAME_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, step]);

  useEffect(() => () => {
    cancelledRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function toggleVisible(key: OptimizerKey) {
    setVisible(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const focused = OPTIMIZERS.find(o => o.key === focusedOpt)!;

  return (
    <div className={styles.widget}>
      <div className={styles.controls}>
        <button
          onClick={() => {
            if (step >= N_STEPS) {
              setStep(0);
              setIsPlaying(true);
            } else {
              setIsPlaying(p => !p);
            }
          }}
          className={styles.controlPrimary}
        >
          {isPlaying ? 'Pause' : step >= N_STEPS ? 'Replay' : 'Play'}
        </button>
        <button
          onClick={() => { setStep(0); setIsPlaying(false); }}
          className={styles.controlSecondary}
        >
          Reset
        </button>
        <input
          type="range"
          min={0}
          max={N_STEPS}
          value={step}
          onChange={e => { setIsPlaying(false); setStep(Number(e.target.value)); }}
          className={styles.scrubber}
          aria-label="Optimizer step"
        />
        <span className={styles.stepLabel}>step {step} / {N_STEPS}</span>
      </div>

      <div className={styles.toggleRow}>
        <span className={styles.toggleLabel}>Show:</span>
        {OPTIMIZERS.map(opt => (
          <label
            key={opt.key}
            className={styles.toggleItem}
            style={{ color: visible[opt.key] ? opt.color : 'var(--text-tertiary)' }}
          >
            <input
              type="checkbox"
              checked={visible[opt.key]}
              onChange={() => toggleVisible(opt.key)}
              className={styles.checkbox}
              style={{ accentColor: opt.color }}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>

      <div className={styles.plotPanel}>
        <div className={styles.panelTitle}>
          Loss landscape — f(x, y) = 10(x − 3)² + (y − 1)²  (ill-conditioned: x curvature 10×)
        </div>
        <LandscapePlot step={step} visible={visible} focusedOpt={focusedOpt} />
      </div>

      <div className={styles.statsGrid}>
        {OPTIMIZERS.map(opt => {
          const pt = opt.trajectory[step]!;
          const isFocused = opt.key === focusedOpt;
          const isVisible = visible[opt.key];
          return (
            <div
              key={opt.key}
              className={`${styles.statCard} ${isFocused ? styles.statCardFocused : ''} ${!isVisible ? styles.statCardHidden : ''}`}
              onClick={() => setFocusedOpt(opt.key)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFocusedOpt(opt.key); } }}
              style={{ borderColor: isVisible && isFocused ? opt.color : undefined }}
              role="button"
              tabIndex={0}
            >
              <div className={styles.statHeader} style={{ color: opt.color }}>{opt.label}</div>
              <div className={styles.statValueRow}>
                <span className={styles.statLabel}>pos</span>
                <span className={styles.statValue}>({pt.x.toFixed(2)}, {pt.y.toFixed(2)})</span>
              </div>
              <div className={styles.statValueRow}>
                <span className={styles.statLabel}>loss</span>
                <span className={styles.statValue}>{pt.loss.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.description} aria-live="polite">
        <strong style={{ color: focused.color }}>{focused.label}:</strong> {focused.description}
      </div>
    </div>
  );
}

interface PlotProps {
  step: number;
  visible: Record<OptimizerKey, boolean>;
  focusedOpt: OptimizerKey;
}

function LandscapePlot({ step, visible, focusedOpt }: PlotProps) {
  const WIDTH = 720;
  const HEIGHT = 420;
  const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };

  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;

  const X_MIN = -5, X_MAX = 6;
  const Y_MIN = -2, Y_MAX = 5;

  function xPx(x: number): number {
    return PADDING.left + ((x - X_MIN) / (X_MAX - X_MIN)) * plotW;
  }
  function yPx(y: number): number {
    return PADDING.top + ((Y_MAX - y) / (Y_MAX - Y_MIN)) * plotH;
  }

  const contourValues = [5, 20, 50, 100];
  const xTicks = [-4, -2, 0, 2, 4, 6];
  const yTicks = [-2, 0, 2, 4];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={styles.svg}
      role="img"
      aria-label="2D loss landscape with optimizer trajectories"
    >
      {xTicks.map(t => (
        <line
          key={`gx-${t}`}
          x1={xPx(t)} x2={xPx(t)}
          y1={PADDING.top} y2={HEIGHT - PADDING.bottom}
          className={styles.gridLine}
        />
      ))}
      {yTicks.map(t => (
        <line
          key={`gy-${t}`}
          x1={PADDING.left} x2={WIDTH - PADDING.right}
          y1={yPx(t)} y2={yPx(t)}
          className={styles.gridLine}
        />
      ))}

      {contourValues.map(c => {
        const rxData = Math.sqrt(c / 10);
        const ryData = Math.sqrt(c);
        const rxPx = (rxData / (X_MAX - X_MIN)) * plotW;
        const ryPx = (ryData / (Y_MAX - Y_MIN)) * plotH;
        return (
          <ellipse
            key={`contour-${c}`}
            cx={xPx(MINIMUM.x)}
            cy={yPx(MINIMUM.y)}
            rx={rxPx}
            ry={ryPx}
            className={styles.contour}
          />
        );
      })}

      <line
        x1={PADDING.left} x2={PADDING.left}
        y1={PADDING.top} y2={HEIGHT - PADDING.bottom}
        className={styles.axisLine}
      />
      <line
        x1={PADDING.left} x2={WIDTH - PADDING.right}
        y1={HEIGHT - PADDING.bottom} y2={HEIGHT - PADDING.bottom}
        className={styles.axisLine}
      />

      {xTicks.map(t => (
        <text
          key={`xt-${t}`}
          x={xPx(t)} y={HEIGHT - PADDING.bottom + 18}
          className={styles.tickLabel}
          textAnchor="middle"
        >
          {t}
        </text>
      ))}
      {yTicks.map(t => (
        <text
          key={`yt-${t}`}
          x={PADDING.left - 8} y={yPx(t) + 4}
          className={styles.tickLabel}
          textAnchor="end"
        >
          {t}
        </text>
      ))}
      <text
        x={PADDING.left + plotW / 2} y={HEIGHT - 6}
        className={styles.axisLabel}
        textAnchor="middle"
      >
        x
      </text>
      <text
        x={-PADDING.top - plotH / 2} y={14}
        className={styles.axisLabel}
        textAnchor="middle"
        transform="rotate(-90)"
      >
        y
      </text>

      <g className={styles.minimumMarker}>
        <line
          x1={xPx(MINIMUM.x) - 6} x2={xPx(MINIMUM.x) + 6}
          y1={yPx(MINIMUM.y) - 6} y2={yPx(MINIMUM.y) + 6}
        />
        <line
          x1={xPx(MINIMUM.x) + 6} x2={xPx(MINIMUM.x) - 6}
          y1={yPx(MINIMUM.y) - 6} y2={yPx(MINIMUM.y) + 6}
        />
      </g>
      <text
        x={xPx(MINIMUM.x) + 10} y={yPx(MINIMUM.y) - 8}
        className={styles.minimumLabel}
      >
        min
      </text>

      <circle cx={xPx(0)} cy={yPx(0)} r={3} className={styles.originDot} />
      <text x={xPx(0) + 8} y={yPx(0) - 4} className={styles.originLabel}>origin</text>

      {OPTIMIZERS.map(opt => {
        if (!visible[opt.key]) return null;
        const isFocused = opt.key === focusedOpt;
        const pts = opt.trajectory.slice(0, step + 1);
        const pathD = pts
          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPx(p.x)} ${yPx(p.y)}`)
          .join(' ');
        const currentPt = pts[pts.length - 1]!;
        return (
          <g key={opt.key}>
            <path
              d={pathD}
              fill="none"
              stroke={opt.color}
              strokeWidth={isFocused ? 2.5 : 1.5}
              opacity={isFocused ? 1 : 0.65}
            />
            <circle
              cx={xPx(currentPt.x)}
              cy={yPx(currentPt.y)}
              r={isFocused ? 6 : 4}
              fill={opt.color}
              stroke="var(--bg-primary)"
              strokeWidth={1.5}
            />
          </g>
        );
      })}

      <circle cx={xPx(START.x)} cy={yPx(START.y)} r={4} className={styles.startMarker} />
      <text x={xPx(START.x) + 10} y={yPx(START.y) + 4} className={styles.startLabel}>start</text>
    </svg>
  );
}

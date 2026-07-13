import { useEffect, useRef, useState } from 'react';
import { TOTAL_STEPS, LOSS_CURVE, VOCAB_SIZE, nearestSnapshot, curveAt } from './training-data';
import styles from './LossCurve.module.css';

const PLAY_STEP_PER_FRAME = 10;
const FRAME_INTERVAL_MS = 40;

export default function LossCurve() {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isPlaying) return;
    if (step >= TOTAL_STEPS) {
      setIsPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      setStep(s => Math.min(s + PLAY_STEP_PER_FRAME, TOTAL_STEPS));
    }, FRAME_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, step]);

  useEffect(() => () => {
    cancelledRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const { loss, lr } = curveAt(step);
  const snapshot = nearestSnapshot(step);

  const onPlayClick = () => {
    if (step >= TOTAL_STEPS) {
      setStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(p => !p);
    }
  };

  return (
    <div className={styles.widget}>
      <div className={styles.controls}>
        <button
          type="button"
          onClick={onPlayClick}
          className={styles.controlPrimary}
          aria-label={isPlaying ? 'Pause training playback' : 'Play training playback'}
        >
          {isPlaying ? 'Pause' : step >= TOTAL_STEPS ? 'Replay' : 'Play'}
        </button>
        <button
          type="button"
          onClick={() => { setStep(0); setIsPlaying(false); }}
          className={styles.controlSecondary}
          aria-label="Reset to step 0"
        >
          Reset
        </button>
        <input
          type="range"
          min={0}
          max={TOTAL_STEPS}
          step={50}
          value={step}
          onChange={e => { setIsPlaying(false); setStep(Number(e.target.value)); }}
          className={styles.scrubber}
          aria-label="Training step"
        />
        <span className={styles.stepLabel}>step {step.toLocaleString()}</span>
      </div>

      <div className={styles.curvePanel}>
        <div className={styles.panelTitle}>Loss curve: Tiny Shakespeare, char-level, ~10M params</div>
        <LossCurvePlot currentStep={step} />
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCell}>
          <div className={styles.statLabel}>step</div>
          <div className={styles.statValue}>{step.toLocaleString()}</div>
        </div>
        <div className={styles.statCell}>
          <div className={styles.statLabel}>loss</div>
          <div className={styles.statValue}>{loss.toFixed(2)}</div>
        </div>
        <div className={styles.statCell}>
          <div className={styles.statLabel}>learning rate</div>
          <div className={styles.statValue}>{lr.toExponential(2)}</div>
        </div>
      </div>

      <div className={styles.samplePanel}>
        <div className={styles.sampleHeader}>
          <span className={styles.sampleTitle}>
            Sample generation at step {snapshot.step.toLocaleString()}
          </span>
          <span className={styles.sampleDescription}>↳ {snapshot.description}</span>
        </div>
        <pre className={styles.sampleText}>{snapshot.text}</pre>
      </div>
    </div>
  );
}

interface PlotProps {
  currentStep: number;
}

const WIDTH = 720;
const HEIGHT = 280;
const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };
const PLOT_W = WIDTH - PADDING.left - PADDING.right;
const PLOT_H = HEIGHT - PADDING.top - PADDING.bottom;
const LOSS_MIN = 0;
const LOSS_MAX = 5;

function xFor(step: number): number {
  return PADDING.left + (step / TOTAL_STEPS) * PLOT_W;
}
function yFor(loss: number): number {
  return PADDING.top + ((LOSS_MAX - loss) / (LOSS_MAX - LOSS_MIN)) * PLOT_H;
}

function LossCurvePlot({ currentStep }: PlotProps) {
  const pathD = LOSS_CURVE.map((pt, i) =>
    `${i === 0 ? 'M' : 'L'} ${xFor(pt.step).toFixed(2)} ${yFor(pt.loss).toFixed(2)}`,
  ).join(' ');

  const { loss: currentLoss } = curveAt(currentStep);
  const markerX = xFor(currentStep);
  const markerY = yFor(currentLoss);

  const xTicks = [0, 1000, 2000, 3000, 4000, 5000];
  const yTicks = [0, 1, 2, 3, 4, 5];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={styles.curveSvg}
      role="img"
      aria-label={`Loss curve at training step ${currentStep}`}
    >
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

      {yTicks.map(t => (
        <text
          key={`yt-${t}`}
          x={PADDING.left - 8}
          y={yFor(t) + 4}
          className={styles.tickLabel}
          textAnchor="end"
        >
          {t}
        </text>
      ))}

      {xTicks.map(t => (
        <text
          key={`xt-${t}`}
          x={xFor(t)}
          y={HEIGHT - PADDING.bottom + 20}
          className={styles.tickLabel}
          textAnchor="middle"
        >
          {t.toLocaleString()}
        </text>
      ))}

      <text
        x={PADDING.left + PLOT_W / 2}
        y={HEIGHT - 6}
        className={styles.axisLabel}
        textAnchor="middle"
      >
        training step
      </text>
      <text
        x={14}
        y={PADDING.top + PLOT_H / 2}
        className={styles.axisLabel}
        textAnchor="middle"
        transform={`rotate(-90 14 ${PADDING.top + PLOT_H / 2})`}
      >
        loss
      </text>

      <line
        x1={PADDING.left}
        x2={WIDTH - PADDING.right}
        y1={yFor(4.4)}
        y2={yFor(4.4)}
        className={styles.baselineRef}
      />
      <text
        x={WIDTH - PADDING.right - 4}
        y={yFor(4.4) - 4}
        className={styles.baselineLabel}
        textAnchor="end"
      >
        random baseline = log({VOCAB_SIZE})
      </text>

      <path d={pathD} className={styles.curvePath} fill="none" />

      <line
        x1={markerX}
        x2={markerX}
        y1={PADDING.top}
        y2={HEIGHT - PADDING.bottom}
        className={styles.markerLine}
      />
      <circle
        cx={markerX}
        cy={markerY}
        r={5}
        className={styles.markerDot}
      />
    </svg>
  );
}

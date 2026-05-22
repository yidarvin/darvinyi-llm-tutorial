import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type TrainingTrace,
  type WordCategory,
  computeTrainingTrace,
  VOCAB,
} from './word2vec-training';
import styles from './Word2VecDynamics.module.css';

const VIEWBOX_W = 700;
const VIEWBOX_H = 600;
const PLOT_X_MIN = 60;
const PLOT_X_MAX = 640;
const PLOT_Y_MIN = 80;
const PLOT_Y_MAX = 540;

const CATEGORY_COLORS: Record<WordCategory, string> = {
  animal:  'var(--cyan-400)',
  vehicle: 'var(--amber-500)',
  food:    'var(--rose-500)',
};
const CONNECTOR_COLOR = 'var(--text-tertiary)';
const CONNECTOR_WORDS = new Set(['liked', 'saw', 'wanted']);
const PLAY_FPS = 12;

type DisplayCategory = 'animal' | 'vehicle' | 'food' | 'connector';

export default function Word2VecDynamics() {
  const [trace, setTrace] = useState<TrainingTrace | null>(null);
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [enabledCategories, setEnabledCategories] = useState<Set<DisplayCategory>>(
    new Set<DisplayCategory>(['animal', 'vehicle', 'food', 'connector'])
  );
  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (cancelledRef.current) return;
      setTrace(computeTrainingTrace());
    }, 30);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isPlaying || !trace) return;
    const maxStep = trace.snapshots.length - 1;
    if (step >= maxStep) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      setStep(s => s + 1);
    }, 1000 / PLAY_FPS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, step, trace]);

  useEffect(() => () => {
    cancelledRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const bounds = useMemo(() => {
    if (!trace) return null;
    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
    for (const s of trace.snapshots) {
      for (const [x, y] of s.positions) {
        if (x! < xMin) xMin = x!;
        if (x! > xMax) xMax = x!;
        if (y! < yMin) yMin = y!;
        if (y! > yMax) yMax = y!;
      }
    }
    const padX = (xMax - xMin) * 0.15;
    const padY = (yMax - yMin) * 0.15;
    return { xMin: xMin - padX, xMax: xMax + padX, yMin: yMin - padY, yMax: yMax + padY };
  }, [trace]);

  if (!trace || !bounds) {
    return (
      <div className={styles.widget}>
        <div className={styles.loading}>
          <div className={styles.loadingBar} />
          Training skip-gram negative sampling on toy corpus…
        </div>
      </div>
    );
  }

  const totalSteps = trace.snapshots.length - 1;
  const currentSnapshot = trace.snapshots[step]!;
  const realStep = currentSnapshot.step;

  function toSvgX(x: number) {
    return PLOT_X_MIN + (x - bounds!.xMin) / (bounds!.xMax - bounds!.xMin) * (PLOT_X_MAX - PLOT_X_MIN);
  }
  function toSvgY(y: number) {
    return PLOT_Y_MAX - (y - bounds!.yMin) / (bounds!.yMax - bounds!.yMin) * (PLOT_Y_MAX - PLOT_Y_MIN);
  }

  function getCategory(wordIdx: number): DisplayCategory {
    const word = VOCAB[wordIdx]!.word;
    if (CONNECTOR_WORDS.has(word)) return 'connector';
    return VOCAB[wordIdx]!.category;
  }

  function getDescription(): string {
    if (realStep === 0) return 'Step 0: All embeddings start at small random positions near the origin.';
    if (realStep < 50)  return `Step ${realStep}: Words are beginning to drift. Positive pairs pull together; negatives push apart.`;
    if (realStep < 120) return `Step ${realStep}: Category structure is emerging. Animals, vehicles, and foods are separating into distinct regions.`;
    return `Step ${realStep}: Clusters are well-formed. Connector words ("liked", "saw", "wanted") sit between categories — they co-occur with everything.`;
  }

  return (
    <div className={styles.widget}>
      <svg
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        className={styles.svg}
        role="img"
        aria-label="2D scatter showing skip-gram training over time"
      >
        <rect
          x={PLOT_X_MIN}
          y={PLOT_Y_MIN}
          width={PLOT_X_MAX - PLOT_X_MIN}
          height={PLOT_Y_MAX - PLOT_Y_MIN}
          className={styles.plotBox}
        />

        {currentSnapshot.positions.map(([x, y], i) => {
          const cat = getCategory(i);
          if (!enabledCategories.has(cat)) return null;
          const cx = toSvgX(x!);
          const cy = toSvgY(y!);
          const color = cat === 'connector' ? CONNECTOR_COLOR : CATEGORY_COLORS[cat as WordCategory];
          return (
            <g key={i} className={styles.point}>
              <circle cx={cx} cy={cy} r={6} className={styles.pointDot} style={{ fill: color }} />
              <text x={cx + 9} y={cy + 4} className={styles.pointLabel}>{VOCAB[i]!.word}</text>
            </g>
          );
        })}
      </svg>

      <div className={styles.controls}>
        <button
          onClick={() => { setStep(0); setIsPlaying(false); }}
          className={styles.controlSecondary}
        >
          Reset
        </button>
        <button
          onClick={() => {
            if (step >= totalSteps) {
              setStep(0);
              setIsPlaying(true);
            } else {
              setIsPlaying(p => !p);
            }
          }}
          className={styles.controlPrimary}
        >
          {isPlaying ? 'Pause' : step >= totalSteps ? 'Replay' : 'Play'}
        </button>
        <input
          type="range"
          min={0}
          max={totalSteps}
          value={step}
          onChange={e => { setIsPlaying(false); setStep(Number(e.target.value)); }}
          className={styles.scrubber}
          aria-label="Training step"
        />
        <span className={styles.stepLabel} aria-live="polite">Step {realStep} / 200</span>
      </div>

      <div className={styles.categoryBar}>
        {(['animal', 'vehicle', 'food', 'connector'] as const).map(cat => {
          const isOn = enabledCategories.has(cat);
          const color = cat === 'connector' ? CONNECTOR_COLOR : CATEGORY_COLORS[cat];
          return (
            <button
              key={cat}
              onClick={() => setEnabledCategories(prev => {
                const next = new Set(prev);
                if (next.has(cat)) next.delete(cat); else next.add(cat);
                return next;
              })}
              className={`${styles.chip} ${isOn ? styles.chipOn : ''}`}
              style={{ '--chip-color': color } as React.CSSProperties}
              aria-pressed={isOn}
            >
              <span className={styles.chipSwatch} />
              {cat === 'connector' ? 'connectors' : `${cat}s`}
            </button>
          );
        })}
      </div>

      <div className={styles.description} aria-live="polite">
        {getDescription()}
      </div>
    </div>
  );
}

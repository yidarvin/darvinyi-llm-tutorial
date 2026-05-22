import { useEffect, useRef, useState } from 'react';
import {
  TOKENS,
  X,
  Q,
  K,
  V,
  RAW_SCORES,
  SCALED_SCORES,
  ATTENTION_WEIGHTS,
  OUTPUT,
  STAGES,
  D_K,
  type Stage,
} from './attention-data';
import styles from './AttentionHeatmap.module.css';

const PLAY_FPS = 0.6;

type MatrixKey = 'X' | 'Q' | 'K' | 'V' | 'scores' | 'scaled' | 'weights' | 'output';

interface MatrixSpec {
  key: MatrixKey;
  label: string;
  data: number[][];
  colorScale: 'diverging' | 'sequential-cyan';
  rowLabels: string[];
  colLabels: string[];
}

interface HoverState {
  matrix: string;
  i: number;
  j: number;
  v: number;
}

export default function AttentionHeatmap() {
  const [stageIdx, setStageIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hovered, setHovered] = useState<HoverState | null>(null);

  useEffect(() => {
    if (!isPlaying) return;
    if (stageIdx >= STAGES.length - 1) {
      setIsPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      setStageIdx(s => s + 1);
    }, 1000 / PLAY_FPS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, stageIdx]);

  useEffect(
    () => () => {
      cancelledRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const stage: Stage = STAGES[stageIdx]!;
  const isHighlighted = (k: MatrixKey) => stage.highlight.includes(k);

  const matrices: MatrixSpec[] = [
    { key: 'X', label: 'X (input)', data: X, colorScale: 'diverging', rowLabels: TOKENS, colLabels: ['d0', 'd1', 'd2', 'd3', 'd4', 'd5'] },
    { key: 'Q', label: 'Q (queries)', data: Q, colorScale: 'diverging', rowLabels: TOKENS, colLabels: ['q0', 'q1', 'q2', 'q3'] },
    { key: 'K', label: 'K (keys)', data: K, colorScale: 'diverging', rowLabels: TOKENS, colLabels: ['k0', 'k1', 'k2', 'k3'] },
    { key: 'V', label: 'V (values)', data: V, colorScale: 'diverging', rowLabels: TOKENS, colLabels: ['v0', 'v1', 'v2', 'v3'] },
    { key: 'scores', label: 'Raw scores Q·Kᵀ', data: RAW_SCORES, colorScale: 'diverging', rowLabels: TOKENS, colLabels: TOKENS },
    { key: 'scaled', label: `Scaled ÷ √${D_K}`, data: SCALED_SCORES, colorScale: 'diverging', rowLabels: TOKENS, colLabels: TOKENS },
    { key: 'weights', label: 'Attention weights', data: ATTENTION_WEIGHTS, colorScale: 'sequential-cyan', rowLabels: TOKENS, colLabels: TOKENS },
    { key: 'output', label: 'Output (= weights · V)', data: OUTPUT, colorScale: 'diverging', rowLabels: TOKENS, colLabels: ['o0', 'o1', 'o2', 'o3'] },
  ];

  return (
    <div className={styles.widget}>
      <div className={styles.controls}>
        <button
          onClick={() => {
            setStageIdx(0);
            setIsPlaying(false);
          }}
          className={styles.controlSecondary}
        >
          Reset
        </button>
        <button
          onClick={() => {
            if (stageIdx >= STAGES.length - 1) {
              setStageIdx(0);
              setIsPlaying(true);
            } else {
              setIsPlaying(p => !p);
            }
          }}
          className={styles.controlPrimary}
        >
          {isPlaying ? 'Pause' : stageIdx >= STAGES.length - 1 ? 'Replay' : 'Play'}
        </button>
        <input
          type="range"
          min={0}
          max={STAGES.length - 1}
          value={stageIdx}
          onChange={e => {
            setIsPlaying(false);
            setStageIdx(Number(e.target.value));
          }}
          className={styles.scrubber}
          aria-label="Attention computation stage"
        />
        <span className={styles.stepLabel} aria-live="polite">
          Stage {stageIdx + 1} / {STAGES.length}
        </span>
      </div>

      <div className={styles.stageTitle}>{stage.title}</div>

      <div className={styles.matrixRow}>
        {matrices.slice(0, 4).map(m => (
          <Matrix key={m.key} spec={m} isHighlighted={isHighlighted(m.key)} setHovered={setHovered} />
        ))}
      </div>

      <div className={styles.matrixRow}>
        {matrices.slice(4, 6).map(m => (
          <Matrix key={m.key} spec={m} isHighlighted={isHighlighted(m.key)} setHovered={setHovered} />
        ))}
      </div>

      <div className={styles.matrixRow}>
        {matrices.slice(6, 8).map(m => (
          <Matrix key={m.key} spec={m} isHighlighted={isHighlighted(m.key)} setHovered={setHovered} />
        ))}
      </div>

      <div className={styles.description} aria-live="polite">
        {stage.description}
      </div>

      {hovered && (
        <div className={styles.hoverReadout}>
          {hovered.matrix}[{hovered.i},{hovered.j}] ={' '}
          <strong>{hovered.v.toFixed(3)}</strong>
        </div>
      )}
    </div>
  );
}

interface MatrixProps {
  spec: MatrixSpec;
  isHighlighted: boolean;
  setHovered: (h: HoverState | null) => void;
}

function Matrix({ spec, isHighlighted, setHovered }: MatrixProps) {
  const flat = spec.data.flat();
  const min = Math.min(...flat);
  const max = Math.max(...flat);
  const absMax = Math.max(Math.abs(min), Math.abs(max)) || 1;

  function cellColor(v: number): string {
    if (spec.colorScale === 'sequential-cyan') {
      const t = Math.max(0, Math.min(1, v));
      return `rgba(34, 211, 238, ${t.toFixed(3)})`;
    }
    const t = v / absMax;
    if (t >= 0) return `rgba(239, 68, 68, ${t.toFixed(3)})`;
    return `rgba(59, 130, 246, ${Math.abs(t).toFixed(3)})`;
  }

  return (
    <div
      className={`${styles.matrixContainer} ${
        isHighlighted ? styles.matrixHighlighted : styles.matrixDimmed
      }`}
    >
      <div className={styles.matrixLabel}>{spec.label}</div>
      <div
        className={styles.matrixGrid}
        style={{ gridTemplateColumns: `auto repeat(${spec.colLabels.length}, var(--cell-size))` }}
      >
        <div></div>
        {spec.colLabels.map((cl, j) => (
          <div key={`ch-${j}`} className={styles.colLabel}>
            {cl}
          </div>
        ))}

        {spec.data.map((row, i) => (
          <RowFragment
            key={i}
            rowLabel={spec.rowLabels[i]!}
            row={row}
            matrixLabel={spec.label}
            i={i}
            cellColor={cellColor}
            setHovered={setHovered}
          />
        ))}
      </div>
    </div>
  );
}

interface RowProps {
  rowLabel: string;
  row: number[];
  matrixLabel: string;
  i: number;
  cellColor: (v: number) => string;
  setHovered: (h: HoverState | null) => void;
}

function RowFragment({ rowLabel, row, matrixLabel, i, cellColor, setHovered }: RowProps) {
  return (
    <>
      <div className={styles.rowLabel}>{rowLabel}</div>
      {row.map((v, j) => (
        <div
          key={j}
          className={styles.cell}
          style={{ backgroundColor: cellColor(v) }}
          onMouseEnter={() => setHovered({ matrix: matrixLabel, i, j, v })}
          onMouseLeave={() => setHovered(null)}
          title={`${matrixLabel}[${i},${j}] = ${v.toFixed(3)}`}
        />
      ))}
    </>
  );
}

import { useEffect, useMemo, useState } from 'react';
import {
  TOKENS, STATE_DIM, STATE_LABELS,
  simulateStateEvolution, getMaxStateMagnitude,
} from './selective-scan-data';
import styles from './SelectiveScanAnimation.module.css';

export default function SelectiveScanAnimation() {
  const T = TOKENS.length;
  const { states, deltas } = useMemo(() => simulateStateEvolution(), []);
  const maxMagnitude = useMemo(() => getMaxStateMagnitude(states), [states]);

  const [currentT, setCurrentT] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const id = setTimeout(() => {
      setCurrentT(t => {
        if (t >= T - 1) {
          setIsPlaying(false);
          return T - 1;
        }
        return t + 1;
      });
    }, 800);
    return () => clearTimeout(id);
  }, [isPlaying, currentT, T]);

  function handlePlayPause() {
    if (currentT >= T - 1) {
      setCurrentT(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(p => !p);
    }
  }

  const currentToken = TOKENS[currentT]!;
  const currentDelta = deltas[currentT]!;

  return (
    <div className={styles.widget}>
      <div className={styles.diagramPanel}>
        <ScanSvg
          states={states}
          deltas={deltas}
          maxMagnitude={maxMagnitude}
          currentT={currentT}
        />
      </div>

      <div className={styles.controls}>
        <button
          className={styles.playButton}
          onClick={handlePlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸ Pause' : currentT >= T - 1 ? '↻ Replay' : '▶ Play'}
        </button>
        <div className={styles.sliderGroup}>
          <label className={styles.sliderLabel}>
            Time step: <span className={styles.sliderValue}>{currentT + 1} / {T}</span>
          </label>
          <input
            type="range"
            min={0} max={T - 1} step={1}
            value={currentT}
            onChange={e => { setCurrentT(Number(e.target.value)); setIsPlaying(false); }}
            className={styles.slider}
          />
        </div>
      </div>

      <div className={styles.detailsPanel}>
        <div className={styles.detailsRow}>
          <span className={styles.detailsLabel}>Current step:</span>
          <span className={styles.detailsValue}>
            t = {currentT}, token "<strong>{currentToken.text}</strong>" ({currentToken.importance})
          </span>
        </div>
        <div className={styles.detailsRow}>
          <span className={styles.detailsLabel}>Δ_t:</span>
          <span className={styles.detailsValue}>
            <strong>{currentDelta.toFixed(2)}</strong>
            {currentToken.importance === 'important'
              ? ' → state updates STRONGLY on this important token'
              : ' → state barely changes on this filler token'}
          </span>
        </div>
        <div className={styles.detailsRow}>
          <span className={styles.detailsLabel}>State values:</span>
          <span className={styles.detailsValueSmall}>
            {states[currentT]!.map((v, i) => `${STATE_LABELS[i]!.split(' ')[0]}=${v.toFixed(2)}`).join(', ')}
          </span>
        </div>
      </div>

      <div className={styles.caption}>
        Watch how state components light up on important tokens (large Δ_t) and fade on filler tokens
        (small Δ_t). <strong>Fast-decay components</strong> (h₀, h₁) capture only the most recent
        update; they're effectively short-term memory. <strong>Slow-decay components</strong>
        (h₆, h₇) retain information across many tokens; they're long-term memory.
        This is Mamba's selectivity in action: the model dynamically allocates state updates to
        important content while letting filler pass through.
      </div>
    </div>
  );
}

interface ScanSvgProps {
  states: number[][];
  deltas: number[];
  maxMagnitude: number;
  currentT: number;
}

function ScanSvg({ states, deltas, maxMagnitude, currentT }: ScanSvgProps) {
  const T = TOKENS.length;
  const WIDTH = 760;
  const HEIGHT = 410;
  const LEFT_LABELS = 130;
  const TOP_TOKENS = 24;
  const TOP_DELTAS = 56;
  const TOP_HEATMAP = 100;
  const CELL_W = (WIDTH - LEFT_LABELS - 20) / T;
  const CELL_H = (HEIGHT - TOP_HEATMAP - 20) / STATE_DIM;

  function cellX(t: number): number {
    return LEFT_LABELS + t * CELL_W;
  }
  function cellY(i: number): number {
    return TOP_HEATMAP + i * CELL_H;
  }

  function magnitudeToColor(v: number): string {
    const norm = Math.min(1.0, Math.abs(v) / maxMagnitude);
    return `color-mix(in srgb, var(--cyan-500) ${norm * 90}%, transparent)`;
  }

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.svg} role="img" aria-label="State evolution heatmap">
      {TOKENS.map((tok, t) => (
        <text
          key={`tok-${t}`}
          x={cellX(t) + CELL_W / 2}
          y={TOP_TOKENS - 4}
          className={`${styles.tokenLabel} ${tok.importance === 'important' ? styles.tokenLabelImportant : styles.tokenLabelFiller}`}
          textAnchor="middle"
          fontSize="9"
          transform={`rotate(-30 ${cellX(t) + CELL_W / 2} ${TOP_TOKENS - 4})`}
        >
          {tok.text}
        </text>
      ))}

      {deltas.map((dt, t) => {
        const barH = dt * 30;
        return (
          <g key={`delta-${t}`}>
            <rect
              x={cellX(t) + 3}
              y={TOP_DELTAS - barH + 30}
              width={CELL_W - 6}
              height={barH}
              fill={dt > 0.3 ? 'var(--cyan-400)' : 'var(--text-tertiary)'}
              opacity={t <= currentT ? 0.8 : 0.2}
            />
          </g>
        );
      })}
      <text x={LEFT_LABELS - 6} y={TOP_DELTAS + 22} className={styles.axisLabel} textAnchor="end" fontSize="10">Δ_t</text>

      {states.map((row, t) =>
        row.map((v, i) => {
          const dimmed = t > currentT;
          return (
            <rect
              key={`cell-${t}-${i}`}
              x={cellX(t) + 0.5}
              y={cellY(i) + 0.5}
              width={CELL_W - 1}
              height={CELL_H - 1}
              fill={dimmed ? 'var(--bg-primary)' : magnitudeToColor(v)}
              stroke="var(--bg-primary)"
              strokeWidth={1}
              opacity={dimmed ? 0.25 : 1}
            />
          );
        })
      )}

      {STATE_LABELS.map((label, i) => (
        <text
          key={`row-${i}`}
          x={LEFT_LABELS - 6}
          y={cellY(i) + CELL_H / 2 + 4}
          className={styles.rowLabel}
          textAnchor="end"
          fontSize="10"
        >
          {label}
        </text>
      ))}

      <line
        x1={cellX(currentT) + CELL_W / 2}
        x2={cellX(currentT) + CELL_W / 2}
        y1={TOP_DELTAS - 6}
        y2={cellY(STATE_DIM - 1) + CELL_H + 4}
        className={styles.currentLine}
      />
    </svg>
  );
}

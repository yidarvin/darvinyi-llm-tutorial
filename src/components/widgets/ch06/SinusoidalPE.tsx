import { useState, useMemo, useEffect } from 'react';
import { sinusoidalPE, waveForDimension, periodForDimension, formatPeriod } from './sinusoidal-pe';
import styles from './SinusoidalPE.module.css';

const DEFAULT_MAX_LEN = 50;
const DEFAULT_D_MODEL = 32;
const DEFAULT_SELECTED_DIM = 4;

export default function SinusoidalPE() {
  const [maxLen, setMaxLen] = useState(DEFAULT_MAX_LEN);
  const [dModel, setDModel] = useState(DEFAULT_D_MODEL);
  const [selectedDim, setSelectedDim] = useState(DEFAULT_SELECTED_DIM);
  const [hovered, setHovered] = useState<{ p: number; d: number; v: number } | null>(null);

  const pe = useMemo(() => sinusoidalPE(maxLen, dModel), [maxLen, dModel]);

  useEffect(() => {
    if (selectedDim >= dModel) setSelectedDim(dModel - 1);
  }, [dModel, selectedDim]);

  const wave = useMemo(
    () => waveForDimension(selectedDim, dModel, maxLen),
    [selectedDim, dModel, maxLen]
  );
  const period = periodForDimension(selectedDim, dModel);
  const isSin = selectedDim % 2 === 0;
  const pairIdx = Math.floor(selectedDim / 2);

  function reset() {
    setMaxLen(DEFAULT_MAX_LEN);
    setDModel(DEFAULT_D_MODEL);
    setSelectedDim(DEFAULT_SELECTED_DIM);
  }

  return (
    <div className={styles.widget}>
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            max_len: <span className={styles.controlValue}>{maxLen}</span>
          </label>
          <input
            type="range"
            min={10}
            max={200}
            step={10}
            value={maxLen}
            onChange={e => setMaxLen(Number(e.target.value))}
            className={styles.slider}
            aria-label="Maximum sequence length"
          />
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            d_model: <span className={styles.controlValue}>{dModel}</span>
          </label>
          <input
            type="range"
            min={8}
            max={128}
            step={8}
            value={dModel}
            onChange={e => setDModel(Number(e.target.value))}
            className={styles.slider}
            aria-label="Model dimension"
          />
        </div>
        <button onClick={reset} className={styles.resetButton}>Reset</button>
      </div>

      <div className={styles.panelTitle}>
        PE matrix — position (rows) × dimension (columns)
      </div>
      <Heatmap
        pe={pe}
        selectedDim={selectedDim}
        onSelectDim={setSelectedDim}
        onHover={setHovered}
      />

      <div className={styles.selectedInfo}>
        Selected dimension <strong>d{selectedDim}</strong> (pair {pairIdx}, {isSin ? 'sin' : 'cos'}) — period {formatPeriod(period)}
      </div>

      <WavePlot wave={wave} selectedDim={selectedDim} />

      {hovered && (
        <div className={styles.hoverReadout}>
          PE[p={hovered.p}, d={hovered.d}] = <strong>{hovered.v.toFixed(3)}</strong>
        </div>
      )}
    </div>
  );
}

interface HeatmapProps {
  pe: number[][];
  selectedDim: number;
  onSelectDim: (d: number) => void;
  onHover: (h: { p: number; d: number; v: number } | null) => void;
}

function Heatmap({ pe, selectedDim, onSelectDim, onHover }: HeatmapProps) {
  const maxLen = pe.length;
  const dModel = pe[0]?.length ?? 0;

  return (
    <div className={styles.heatmapContainer}>
      <div
        className={styles.heatmapGrid}
        style={{
          gridTemplateColumns: `repeat(${dModel}, 1fr)`,
          gridTemplateRows: `repeat(${maxLen}, 1fr)`,
          aspectRatio: `${dModel} / ${maxLen}`,
        }}
      >
        {pe.map((row, p) =>
          row.map((v, d) => (
            <div
              key={`${p}-${d}`}
              className={`${styles.heatmapCell} ${d === selectedDim ? styles.cellInSelectedColumn : ''}`}
              style={{ backgroundColor: cellColor(v) }}
              onClick={() => onSelectDim(d)}
              onMouseEnter={() => onHover({ p, d, v })}
              onMouseLeave={() => onHover(null)}
              role="button"
              aria-label={`PE position ${p} dimension ${d}: ${v.toFixed(3)}`}
            />
          ))
        )}
      </div>
    </div>
  );
}

function cellColor(v: number): string {
  if (v > 0) return `rgba(239, 68, 68, ${Math.min(v, 1).toFixed(3)})`;
  return `rgba(59, 130, 246, ${Math.min(-v, 1).toFixed(3)})`;
}

interface WavePlotProps {
  wave: number[];
  selectedDim: number;
}

function WavePlot({ wave, selectedDim }: WavePlotProps) {
  const WIDTH = 700;
  const HEIGHT = 200;
  const PADDING = { top: 20, right: 20, bottom: 30, left: 40 };

  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;

  const n = wave.length;
  if (n === 0) return null;

  const points = wave.map((v, p) => ({
    x: PADDING.left + (n === 1 ? 0 : (p / (n - 1)) * plotW),
    y: PADDING.top + ((1 - v) / 2) * plotH,
  }));

  const pathD = points.map((pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`)).join(' ');

  const xTicks = Array.from(new Set([0, Math.floor(n / 4), Math.floor(n / 2), Math.floor((3 * n) / 4), n - 1]));
  const yTicks = [-1, 0, 1];

  return (
    <div className={styles.wavePanel}>
      <div className={styles.panelTitle}>Wave at dimension d{selectedDim}</div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.waveSvg} role="img">
        <line
          x1={PADDING.left}
          x2={WIDTH - PADDING.right}
          y1={PADDING.top + plotH / 2}
          y2={PADDING.top + plotH / 2}
          className={styles.axisLine}
        />
        <line
          x1={PADDING.left}
          x2={WIDTH - PADDING.right}
          y1={HEIGHT - PADDING.bottom}
          y2={HEIGHT - PADDING.bottom}
          className={styles.axisLine}
        />
        <line
          x1={PADDING.left}
          x2={PADDING.left}
          y1={PADDING.top}
          y2={HEIGHT - PADDING.bottom}
          className={styles.axisLine}
        />

        {yTicks.map(t => (
          <text
            key={`yt-${t}`}
            x={PADDING.left - 8}
            y={PADDING.top + ((1 - t) / 2) * plotH + 4}
            className={styles.tickLabel}
            textAnchor="end"
          >
            {t}
          </text>
        ))}

        {xTicks.map(t => (
          <text
            key={`xt-${t}`}
            x={PADDING.left + (n === 1 ? 0 : (t / (n - 1)) * plotW)}
            y={HEIGHT - PADDING.bottom + 18}
            className={styles.tickLabel}
            textAnchor="middle"
          >
            {t}
          </text>
        ))}

        <text
          x={PADDING.left + plotW / 2}
          y={HEIGHT - 4}
          className={styles.axisLabel}
          textAnchor="middle"
        >
          position
        </text>

        <path d={pathD} className={styles.wavePath} fill="none" />
      </svg>
    </div>
  );
}

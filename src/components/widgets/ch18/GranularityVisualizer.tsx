import { useState, useMemo } from 'react';
import {
  WEIGHT_MATRIX, ROWS, COLS, N_BITS,
  quantizeMatrix, perRowMSE, overallMSE, effectiveBits,
  type Granularity,
} from './granularity-data';
import styles from './GranularityVisualizer.module.css';

const GROUP_SIZES = [16, 32, 64];

export default function GranularityVisualizer() {
  const [granularity, setGranularity] = useState<Granularity>('per-tensor');
  const [groupSize, setGroupSize] = useState(32);

  const result = useMemo(
    () => quantizeMatrix(WEIGHT_MATRIX, granularity, groupSize, N_BITS),
    [granularity, groupSize]
  );
  const rowMSEs = useMemo(() => perRowMSE(WEIGHT_MATRIX, result.quantized), [result.quantized]);
  const totalMSE = useMemo(() => overallMSE(WEIGHT_MATRIX, result.quantized), [result.quantized]);
  const totalWeights = ROWS * COLS;
  const effBits = effectiveBits(result.numScales, totalWeights, N_BITS);

  function valueToColor(v: number, absMax: number): string {
    const norm = Math.max(-1, Math.min(1, v / absMax));
    if (norm > 0) {
      const intensity = Math.min(255, Math.round(norm * 255));
      return `rgb(${Math.round(intensity * 0.3)}, ${Math.round(intensity * 0.85)}, ${intensity})`;
    } else {
      const intensity = Math.min(255, Math.round(-norm * 255));
      return `rgb(${intensity}, ${Math.round(intensity * 0.35)}, ${Math.round(intensity * 0.45)})`;
    }
  }

  const matrixAbsMax = Math.max(...WEIGHT_MATRIX.flat().map(Math.abs));

  return (
    <div className={styles.widget}>
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Granularity visualizer</div>
        <div className={styles.titleSubLabel}>
          <strong>{ROWS} × {COLS}</strong> matrix, one outlier row (10× amplitude); quantized at <strong>INT{N_BITS}</strong>
        </div>
      </div>

      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Granularity:</span>
          <div className={styles.granularityButtons}>
            {(['per-tensor', 'per-channel', 'per-group'] as Granularity[]).map(g => (
              <button
                key={g}
                className={`${styles.granularityButton} ${granularity === g ? styles.granularityButtonActive : ''}`}
                onClick={() => setGranularity(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Group size:</span>
          <div className={styles.groupButtons}>
            {GROUP_SIZES.map(g => (
              <button
                key={g}
                className={`${styles.groupButton} ${groupSize === g && granularity === 'per-group' ? styles.groupButtonActive : ''}`}
                onClick={() => setGroupSize(g)}
                disabled={granularity !== 'per-group'}
              >G = {g}</button>
            ))}
          </div>
          <span className={styles.controlHint}>
            (only active for per-group)
          </span>
        </div>
      </div>

      <div className={styles.matrixPanel}>
        <div className={styles.matrixTitle}>Original matrix</div>
        <Heatmap matrix={WEIGHT_MATRIX} absMax={matrixAbsMax} colorFn={valueToColor} />
        <div className={styles.outlierNote}>
          ▲ Row 0 is the outlier (10× larger weights)
        </div>
      </div>

      <div className={styles.matrixPanel}>
        <div className={styles.matrixTitle}>Quantized matrix ({granularity})</div>
        <Heatmap matrix={result.quantized} absMax={matrixAbsMax} colorFn={valueToColor} />
      </div>

      <div className={styles.msePanel}>
        <div className={styles.mseTitle}>Per-row MSE</div>
        <div className={styles.mseBars}>
          {rowMSEs.map((mse, r) => {
            const maxMSE = Math.max(...rowMSEs);
            const widthPct = maxMSE > 0 ? (mse / maxMSE) * 100 : 0;
            const isOutlier = r === 0;
            return (
              <div key={r} className={styles.mseRow}>
                <span className={styles.mseRowLabel}>row {r}</span>
                <div className={styles.mseBarTrack}>
                  <div
                    className={`${styles.mseBar} ${isOutlier ? styles.mseBarOutlier : ''}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className={styles.mseValue}>{mse.toExponential(2)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.metricsPanel}>
        <div className={styles.metricsTitle}>Metrics</div>
        <div className={styles.metricsBody}>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Number of scales:</span>
            <span className={styles.metricValue}>{result.numScales.toLocaleString()}</span>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Scale storage:</span>
            <span className={styles.metricValue}>{result.scaleStorageBytes} bytes</span>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Effective bits/weight:</span>
            <span className={styles.metricValue}>{effBits.toFixed(3)}</span>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Overall MSE:</span>
            <span className={styles.metricValue}>{totalMSE.toExponential(2)}</span>
          </div>
        </div>
      </div>

      <div className={styles.caption}>
        Watch the granularity progression: <strong>per-tensor</strong> uses one scale, destroyed by the outlier row;
        non-outlier rows lose almost all resolution. <strong>Per-channel</strong> gives each row its own scale:
        the outlier row is fine, and the rest are well-preserved. <strong>Per-group</strong> goes further: even
        within-row variation gets its own scale, recovering quality further at the cost of more scale storage.
        At INT4 with per-group + G=32: <strong>essentially the production recipe.</strong>
      </div>
    </div>
  );
}

interface HeatmapProps {
  matrix: number[][];
  absMax: number;
  colorFn: (v: number, absMax: number) => string;
}
function Heatmap({ matrix, absMax, colorFn }: HeatmapProps) {
  const rows = matrix.length;
  const cols = matrix[0]!.length;
  const W = 720;
  const H = 100;
  const cellW = W / cols;
  const cellH = H / rows;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.heatmapSvg} role="img" aria-label="Weight matrix heatmap">
      {matrix.map((row, r) =>
        row.map((v, c) => (
          <rect
            key={`${r}-${c}`}
            x={c * cellW} y={r * cellH}
            width={cellW + 0.3} height={cellH + 0.3}
            fill={colorFn(v, absMax)}
          />
        ))
      )}
    </svg>
  );
}

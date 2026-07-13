import { useMemo, useState } from 'react';
import {
  WEIGHTS,
  quantizeAll,
  computeMetrics,
  buildHistogram,
  insightFor,
  effectiveBits,
  type Format,
} from './quantization-data';
import styles from './QuantizationExplorer.module.css';

const BIT_WIDTHS = [16, 8, 4, 3, 2];

export default function QuantizationExplorer() {
  const [nBits, setNBits] = useState(8);
  const [format, setFormat] = useState<Format>('INT');

  const effectiveFormat: Format = nBits === 4 ? format : 'INT';

  const { quantized, gridLevels, numLevels } = useMemo(
    () => quantizeAll(WEIGHTS, nBits, effectiveFormat),
    [nBits, effectiveFormat],
  );
  const metrics = useMemo(
    () => computeMetrics(WEIGHTS, quantized),
    [quantized],
  );
  const insight = insightFor(nBits, effectiveFormat);
  const effBits = effectiveBits(nBits);

  const valMin = -0.4;
  const valMax = 0.4;
  const nBins = 40;
  const histCounts = useMemo(
    () => buildHistogram(WEIGHTS, nBins, valMin, valMax),
    [],
  );
  const maxCount = Math.max(...histCounts);

  const errorValues = useMemo(
    () => WEIGHTS.map((w, i) => w - quantized[i]!),
    [quantized],
  );
  const errMax = Math.max(0.001, metrics.maxErr) * 1.1;
  const errMin = -errMax;
  const errCounts = useMemo(
    () => buildHistogram(errorValues, nBins, errMin, errMax),
    [errorValues, errMin, errMax],
  );
  const errMaxCount = Math.max(1, ...errCounts);

  const W = 740;
  const H = 200;
  const ErrH = 90;

  function xForVal(v: number, vMin: number, vMax: number): number {
    return ((v - vMin) / (vMax - vMin)) * W;
  }

  const drawGridLines = gridLevels.length > 0 && gridLevels.length <= 64;

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Quantization explorer</div>
        <div className={styles.titleSubLabel}>
          Weight distribution: 1000 samples from <strong>N(0, 0.1)</strong>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Bit width:</span>
          <div className={styles.bitButtons}>
            {BIT_WIDTHS.map((b) => (
              <button
                key={b}
                className={`${styles.bitButton} ${nBits === b ? styles.bitButtonActive : ''}`}
                onClick={() => setNBits(b)}
                aria-pressed={nBits === b}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Format (4-bit only):</span>
          <div className={styles.formatButtons}>
            <button
              className={`${styles.formatButton} ${nBits === 4 && format === 'INT' ? styles.formatButtonActive : ''}`}
              onClick={() => setFormat('INT')}
              disabled={nBits !== 4}
              aria-pressed={nBits === 4 && format === 'INT'}
            >
              INT4
            </button>
            <button
              className={`${styles.formatButton} ${nBits === 4 && format === 'NF' ? styles.formatButtonActive : ''}`}
              onClick={() => setFormat('NF')}
              disabled={nBits !== 4}
              aria-pressed={nBits === 4 && format === 'NF'}
            >
              NF4
            </button>
          </div>
        </div>
      </div>

      {/* Distribution + quantization grid */}
      <div className={styles.chartPanel}>
        <div className={styles.chartTitle}>
          Distribution + quantization grid
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className={styles.chartSvg}
          role="img"
          aria-label="Weight distribution with quantization grid"
        >
          {/* Original distribution: gray bars */}
          {histCounts.map((count, i) => {
            const binW = W / nBins;
            const x = i * binW;
            const h = (count / maxCount) * (H - 20);
            return (
              <rect
                key={`bar-${i}`}
                x={x + 0.5}
                y={H - 10 - h}
                width={binW - 1}
                height={h}
                className={styles.histBar}
              />
            );
          })}
          {/* Quantization grid: amber (INT) or emerald (NF) vertical lines */}
          {drawGridLines &&
            gridLevels.map((level, i) => {
              if (level < valMin || level > valMax) return null;
              const x = xForVal(level, valMin, valMax);
              return (
                <line
                  key={`grid-${i}`}
                  x1={x}
                  y1={4}
                  x2={x}
                  y2={H - 10}
                  className={`${styles.gridLine} ${effectiveFormat === 'NF' ? styles.gridLineNF : ''}`}
                />
              );
            })}
          {/* Axis */}
          <line
            x1={0}
            y1={H - 10}
            x2={W}
            y2={H - 10}
            className={styles.axis}
          />
          <text x={5} y={H - 1} className={styles.axisLabel}>
            {valMin.toFixed(2)}
          </text>
          <text x={W / 2 - 5} y={H - 1} className={styles.axisLabel}>
            0
          </text>
          <text x={W - 25} y={H - 1} className={styles.axisLabel}>
            {valMax.toFixed(2)}
          </text>
        </svg>
        <div className={styles.chartLegend}>
          <span className={styles.legendItem}>
            <span className={styles.legendBar} /> original weights
          </span>
          {drawGridLines && (
            <span className={styles.legendItem}>
              <span
                className={`${styles.legendLine} ${effectiveFormat === 'NF' ? styles.legendLineNF : ''}`}
              />
              {effectiveFormat === 'NF' ? 'NF4 levels' : `INT${nBits} levels`} (
              {numLevels})
            </span>
          )}
          {!drawGridLines && gridLevels.length > 0 && (
            <span className={styles.legendItem}>
              {numLevels.toLocaleString()} levels (too dense to draw)
            </span>
          )}
          {gridLevels.length === 0 && (
            <span className={styles.legendItem}>
              FP16 baseline, no quantization grid
            </span>
          )}
        </div>
      </div>

      {/* Error histogram */}
      <div className={styles.chartPanel}>
        <div className={styles.chartTitle}>
          Quantization error (original – quantized)
        </div>
        <svg
          viewBox={`0 0 ${W} ${ErrH}`}
          className={styles.chartSvg}
          role="img"
          aria-label="Quantization error histogram"
        >
          {errCounts.map((count, i) => {
            const binW = W / nBins;
            const x = i * binW;
            const h = (count / errMaxCount) * (ErrH - 20);
            return (
              <rect
                key={`err-${i}`}
                x={x + 0.5}
                y={ErrH - 10 - h}
                width={binW - 1}
                height={h}
                className={styles.errorBar}
              />
            );
          })}
          {/* Zero line */}
          <line
            x1={xForVal(0, errMin, errMax)}
            y1={4}
            x2={xForVal(0, errMin, errMax)}
            y2={ErrH - 10}
            className={styles.zeroLine}
          />
          <line
            x1={0}
            y1={ErrH - 10}
            x2={W}
            y2={ErrH - 10}
            className={styles.axis}
          />
          <text x={5} y={ErrH - 1} className={styles.axisLabel}>
            {errMin.toFixed(3)}
          </text>
          <text x={W / 2 - 5} y={ErrH - 1} className={styles.axisLabel}>
            0
          </text>
          <text x={W - 35} y={ErrH - 1} className={styles.axisLabel}>
            {errMax.toFixed(3)}
          </text>
        </svg>
      </div>

      {/* Metrics */}
      <div className={styles.metricsPanel}>
        <div className={styles.metricsTitle}>Metrics</div>
        <div className={styles.metricsBody}>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>MSE:</span>
            <span className={styles.metricValue}>
              {metrics.mse === 0 ? '0' : metrics.mse.toExponential(2)}
            </span>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Max error:</span>
            <span className={styles.metricValue}>
              {metrics.maxErr.toFixed(5)}
            </span>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Distinct levels:</span>
            <span className={styles.metricValue}>
              {numLevels.toLocaleString()} (
              {nBits >= 16
                ? 'FP16'
                : `${nBits}-bit ${effectiveFormat === 'NF' ? 'NF' : 'signed'}`}
              )
            </span>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Storage per weight:</span>
            <span className={styles.metricValue}>{nBits} bits</span>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Effective bits/weight:</span>
            <span className={styles.metricValue}>
              {effBits.toFixed(2)} (incl. per-tensor scale)
            </span>
          </div>
        </div>
      </div>

      {/* Insight */}
      <div className={styles.insightPanel}>
        <div className={styles.insightLabel}>Insight</div>
        <div className={styles.insightText}>{insight}</div>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        Try the sequence <strong>16 → 8 → 4 → 3 → 2</strong>: watch the
        quantization grid get coarser and the error grow. At 4 bits, toggle
        between <strong>INT4</strong> (uniform spacing) and <strong>NF4</strong>{' '}
        (denser near zero); NF4 visibly reduces error on this
        normally-distributed weight set.{' '}
        <strong>
          INT8 is the production default; INT4 with NF4/GPTQ/AWQ is the
          production frontier; sub-INT4 is research.
        </strong>
      </div>
    </div>
  );
}

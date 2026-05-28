import { useMemo, useState } from 'react';
import styles from './PPOClipExplorer.module.css';

const R_MIN = 0.5;
const R_MAX = 1.5;

function clippedSurrogate(r: number, A: number, eps: number): number {
  const clipped = Math.max(1 - eps, Math.min(1 + eps, r));
  return Math.min(r * A, clipped * A);
}

function gradientFlat(r: number, A: number, eps: number): boolean {
  if (A > 0) return r > 1 + eps;
  if (A < 0) return r < 1 - eps;
  return true;
}

const W = 520;
const H = 240;
const PAD_L = 38;
const PAD_R = 14;
const PAD_T = 16;
const PAD_B = 30;

export default function PPOClipExplorer() {
  const [eps, setEps] = useState(0.2);
  const [A, setA] = useState(1.0);
  const [r, setR] = useState(1.0);

  const samples = useMemo(() => {
    const points: { r: number; L: number }[] = [];
    const N = 96;
    for (let i = 0; i <= N; i++) {
      const ri = R_MIN + ((R_MAX - R_MIN) * i) / N;
      points.push({ r: ri, L: clippedSurrogate(ri, A, eps) });
    }
    return points;
  }, [A, eps]);

  const L = clippedSurrogate(r, A, eps);
  const flat = gradientFlat(r, A, eps);
  const ratioClipped = Math.max(1 - eps, Math.min(1 + eps, r));

  const yAbs = Math.max(0.5, Math.abs(A) * (1 + eps)) + 0.05;
  const y0 = -yAbs;
  const y1 = yAbs;

  const xToPx = (x: number) =>
    PAD_L + ((x - R_MIN) / (R_MAX - R_MIN)) * (W - PAD_L - PAD_R);
  const yToPx = (y: number) =>
    PAD_T + ((y1 - y) / (y1 - y0)) * (H - PAD_T - PAD_B);

  const linePath = samples
    .map(
      (p, i) =>
        `${i === 0 ? 'M' : 'L'}${xToPx(p.r).toFixed(1)},${yToPx(p.L).toFixed(1)}`,
    )
    .join(' ');

  const xClipLo = xToPx(1 - eps);
  const xClipHi = xToPx(1 + eps);
  const yAxis = yToPx(0);

  const flatLeft = A < 0;
  const flatRight = A > 0;

  return (
    <div className={styles.widget}>
      <div className={styles.plotPanel}>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} aria-hidden>
          {flatRight && (
            <rect
              x={xClipHi}
              y={PAD_T}
              width={W - PAD_R - xClipHi}
              height={H - PAD_T - PAD_B}
              className={styles.zoneFlat}
            />
          )}
          {flatLeft && (
            <rect
              x={PAD_L}
              y={PAD_T}
              width={xClipLo - PAD_L}
              height={H - PAD_T - PAD_B}
              className={styles.zoneFlat}
            />
          )}
          <rect
            x={flatLeft ? xClipLo : PAD_L}
            y={PAD_T}
            width={
              flatLeft
                ? W - PAD_R - xClipLo
                : flatRight
                ? xClipHi - PAD_L
                : W - PAD_L - PAD_R
            }
            height={H - PAD_T - PAD_B}
            className={styles.zoneActive}
          />

          <line
            x1={PAD_L}
            x2={W - PAD_R}
            y1={yAxis}
            y2={yAxis}
            className={styles.axisLine}
          />
          <line
            x1={xToPx(1)}
            x2={xToPx(1)}
            y1={PAD_T}
            y2={H - PAD_B}
            className={styles.guideLine}
          />
          <line
            x1={xClipLo}
            x2={xClipLo}
            y1={PAD_T}
            y2={H - PAD_B}
            className={styles.clipBoundary}
          />
          <line
            x1={xClipHi}
            x2={xClipHi}
            y1={PAD_T}
            y2={H - PAD_B}
            className={styles.clipBoundary}
          />

          <path d={linePath} className={styles.curve} />

          <line
            x1={xToPx(r)}
            x2={xToPx(r)}
            y1={PAD_T}
            y2={H - PAD_B}
            className={styles.currentX}
          />
          <circle
            cx={xToPx(r)}
            cy={yToPx(L)}
            r={5.5}
            className={styles.currentPointOuter}
          />
          <circle
            cx={xToPx(r)}
            cy={yToPx(L)}
            r={2.5}
            className={styles.currentPointInner}
          />

          {[0.5, 0.75, 1.0, 1.25, 1.5].map((t) => (
            <text
              key={t}
              x={xToPx(t)}
              y={H - PAD_B + 14}
              textAnchor="middle"
              className={styles.tickLabel}
            >
              {t.toFixed(2)}
            </text>
          ))}

          <text
            x={xClipLo - 4}
            y={PAD_T + 11}
            textAnchor="end"
            className={styles.axisLabel}
          >
            1−ε
          </text>
          <text
            x={xClipHi + 4}
            y={PAD_T + 11}
            textAnchor="start"
            className={styles.axisLabel}
          >
            1+ε
          </text>
          <text
            x={W - PAD_R - 2}
            y={H - PAD_B + 14}
            textAnchor="end"
            className={styles.axisLabel}
          >
            r_t(θ)
          </text>
          <text
            x={PAD_L - 4}
            y={PAD_T + 8}
            textAnchor="end"
            className={styles.axisLabel}
          >
            L_CLIP
          </text>
        </svg>
      </div>

      <div className={styles.readoutPanel}>
        <Readout label="L_CLIP" value={L.toFixed(3)} highlight />
        <Readout
          label="Gradient"
          value={flat ? 'ZERO' : 'ACTIVE'}
          tag={flat ? 'zero' : 'active'}
        />
        <Readout label="Clipped ratio" value={ratioClipped.toFixed(2)} />
        <Readout
          label="Flat region"
          value={
            A > 0
              ? `r > ${(1 + eps).toFixed(2)}`
              : A < 0
              ? `r < ${(1 - eps).toFixed(2)}`
              : 'none (A=0)'
          }
        />
      </div>

      <div className={styles.controlRow}>
        <label className={styles.controlLabel}>
          ε (clip range):{' '}
          <span className={styles.controlValue}>{eps.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0.05}
          max={0.5}
          step={0.01}
          value={eps}
          onChange={(e) => setEps(Number(e.target.value))}
          className={styles.slider}
          aria-label="epsilon"
        />
      </div>
      <div className={styles.controlRow}>
        <label className={styles.controlLabel}>
          A_t (advantage):{' '}
          <span className={styles.controlValueA}>
            {A >= 0 ? '+' : ''}
            {A.toFixed(2)}
          </span>
        </label>
        <input
          type="range"
          min={-2}
          max={2}
          step={0.1}
          value={A}
          onChange={(e) => setA(Number(e.target.value))}
          className={styles.slider}
          aria-label="advantage"
        />
      </div>
      <div className={styles.controlRow}>
        <label className={styles.controlLabel}>
          r_t(θ):{' '}
          <span className={styles.controlValue}>{r.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={R_MIN}
          max={R_MAX}
          step={0.01}
          value={r}
          onChange={(e) => setR(Number(e.target.value))}
          className={styles.slider}
          aria-label="ratio"
        />
      </div>
    </div>
  );
}

function Readout({
  label,
  value,
  highlight,
  tag,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  tag?: 'zero' | 'active';
}) {
  const cls = [
    styles.readout,
    highlight ? styles.readoutHighlight : '',
    tag === 'zero' ? styles.readoutZero : '',
    tag === 'active' ? styles.readoutActive : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls}>
      <div className={styles.readoutLabel}>{label}</div>
      <div className={styles.readoutValue}>{value}</div>
    </div>
  );
}

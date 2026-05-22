import { useState, useMemo } from 'react';
import {
  BASE_Q, N_PAIRS, MAX_POSITION,
  PAIR_FREQUENCIES, PAIR_PERIODS,
  rotateQ, rotationAngle, formatAngle, formatPeriod,
} from './rope-data';
import styles from './RoPERotation.module.css';

const CIRCLE_SIZE = 140;
const VEC_LENGTH = 50;

export default function RoPERotation() {
  const [position, setPosition] = useState(12);

  const rotatedQ = useMemo(() => rotateQ(position), [position]);

  return (
    <div className={styles.widget}>
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            Position p: <span className={styles.controlValue}>{position}</span>
          </label>
          <input
            type="range"
            min={0}
            max={MAX_POSITION}
            value={position}
            onChange={e => setPosition(Number(e.target.value))}
            className={styles.slider}
            aria-label="Position"
          />
        </div>
        <button onClick={() => setPosition(12)} className={styles.resetButton}>Reset</button>
      </div>

      <div className={styles.pairsRow}>
        {Array.from({ length: N_PAIRS }, (_, k) => {
          const omega = PAIR_FREQUENCIES[k]!;
          const period = PAIR_PERIODS[k]!;
          const theta = rotationAngle(k, position);
          const originalX = BASE_Q[2 * k]!;
          const originalY = BASE_Q[2 * k + 1]!;
          const rotatedX = rotatedQ[2 * k]!;
          const rotatedY = rotatedQ[2 * k + 1]!;

          return (
            <PairCircle
              key={k}
              pairIdx={k}
              omega={omega}
              period={period}
              theta={theta}
              originalX={originalX}
              originalY={originalY}
              rotatedX={rotatedX}
              rotatedY={rotatedY}
            />
          );
        })}
      </div>

      <div className={styles.description}>
        <strong>RoPE rotates each pair of dimensions by an angle proportional to position × frequency.</strong>{' '}
        Low pairs (e.g. pair 0) rotate quickly — full revolution every ~6 positions. High pairs (e.g. pair 3) rotate slowly — full revolution every ~200 positions. The original Q vector at position 0 is shown dimmed; the rotated Q at the current position is highlighted in cyan. RoPE has no learned parameters — the rotation is fully determined by position and dimension.
      </div>
    </div>
  );
}

interface PairCircleProps {
  pairIdx: number;
  omega: number;
  period: number;
  theta: number;
  originalX: number;
  originalY: number;
  rotatedX: number;
  rotatedY: number;
}

function PairCircle({ pairIdx, omega, period, theta, originalX, originalY, rotatedX, rotatedY }: PairCircleProps) {
  const cx = CIRCLE_SIZE / 2;
  const cy = CIRCLE_SIZE / 2;

  const originalScreenX = cx + originalX * VEC_LENGTH;
  const originalScreenY = cy - originalY * VEC_LENGTH;
  const rotatedScreenX = cx + rotatedX * VEC_LENGTH;
  const rotatedScreenY = cy - rotatedY * VEC_LENGTH;

  return (
    <div className={styles.pairCard}>
      <div className={styles.pairHeader}>
        <div className={styles.pairTitle}>Pair {pairIdx}</div>
        <div className={styles.pairSubtitle}>d{2 * pairIdx}, d{2 * pairIdx + 1}</div>
        <div className={styles.pairFreq}>ω = {omega.toFixed(3)}</div>
      </div>

      <svg viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`} className={styles.pairSvg} role="img">
        <circle cx={cx} cy={cy} r={VEC_LENGTH} className={styles.unitCircle} />
        <line x1={0} x2={CIRCLE_SIZE} y1={cy} y2={cy} className={styles.axis} />
        <line x1={cx} x2={cx} y1={0} y2={CIRCLE_SIZE} className={styles.axis} />

        <line
          x1={cx} y1={cy}
          x2={originalScreenX} y2={originalScreenY}
          className={styles.originalVector}
        />
        <circle cx={originalScreenX} cy={originalScreenY} r={3} className={styles.originalDot} />

        <line
          x1={cx} y1={cy}
          x2={rotatedScreenX} y2={rotatedScreenY}
          className={styles.rotatedVector}
        />
        <circle cx={rotatedScreenX} cy={rotatedScreenY} r={4} className={styles.rotatedDot} />
      </svg>

      <div className={styles.pairFooter}>
        <div>θ = {formatAngle(theta)}</div>
        <div>period: {formatPeriod(period)}</div>
      </div>
    </div>
  );
}

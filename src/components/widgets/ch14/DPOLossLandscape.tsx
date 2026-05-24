import { useMemo, useState } from 'react';
import {
  buildLossGrid,
  dpoLoss,
  dpoGradient,
  lossToColor,
} from './loss-landscape-data';
import styles from './DPOLossLandscape.module.css';

const DOMAIN_MIN = -3;
const DOMAIN_MAX = 3;
const RESOLUTION = 25;

export default function DPOLossLandscape() {
  const [rChosen, setRChosen] = useState(0.5);
  const [rRejected, setRRejected] = useState(-0.5);
  const [beta, setBeta] = useState(0.1);

  const grid = useMemo(
    () => buildLossGrid(DOMAIN_MIN, DOMAIN_MAX, RESOLUTION),
    [],
  );

  const currentLoss = dpoLoss(rChosen, rRejected);
  const gradient = dpoGradient(rChosen, rRejected);
  const policyState =
    rChosen > rRejected ? 'GOOD' : rChosen < rRejected ? 'BAD' : 'TIED';

  return (
    <div className={styles.widget}>
      <div className={styles.controlRow}>
        <label className={styles.controlLabel}>
          β (temperature): <span className={styles.controlValue}>{beta.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0.01}
          max={1.0}
          step={0.01}
          value={beta}
          onChange={(e) => setBeta(Number(e.target.value))}
          className={styles.slider}
          aria-label="beta"
        />
      </div>

      <div className={styles.landscapePanel}>
        <LandscapeSvg
          grid={grid}
          rChosen={rChosen}
          rRejected={rRejected}
          gradient={gradient}
          onCellClick={(rc, rr) => {
            setRChosen(rc);
            setRRejected(rr);
          }}
        />
      </div>

      <div className={styles.readoutPanel}>
        <Readout label="DPO loss" value={currentLoss.toFixed(3)} highlight />
        <Readout
          label="∂L/∂r_chosen"
          value={`${gradient.dChosen >= 0 ? '+' : ''}${gradient.dChosen.toFixed(2)}`}
          note="descent → increase r_chosen"
        />
        <Readout
          label="∂L/∂r_rejected"
          value={`${gradient.dRejected >= 0 ? '+' : ''}${gradient.dRejected.toFixed(2)}`}
          note="descent → decrease r_rejected"
        />
        <Readout label="Policy state" value={policyState} tag={policyState.toLowerCase()} />
      </div>

      <div className={styles.controlRow}>
        <label className={styles.controlLabel}>
          r_chosen: <span className={styles.controlValueChosen}>{rChosen.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={DOMAIN_MIN}
          max={DOMAIN_MAX}
          step={0.05}
          value={rChosen}
          onChange={(e) => setRChosen(Number(e.target.value))}
          className={styles.slider}
          aria-label="r_chosen"
        />
      </div>
      <div className={styles.controlRow}>
        <label className={styles.controlLabel}>
          r_rejected: <span className={styles.controlValueRejected}>{rRejected.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={DOMAIN_MIN}
          max={DOMAIN_MAX}
          step={0.05}
          value={rRejected}
          onChange={(e) => setRRejected(Number(e.target.value))}
          className={styles.slider}
          aria-label="r_rejected"
        />
      </div>

      <div className={styles.caption}>
        The DPO loss is <strong>−log σ(r_chosen − r_rejected)</strong> — it depends only on the difference.
        Below the diagonal: chosen has higher reward; loss is low; <strong>the policy correctly prefers chosen</strong>.
        Above the diagonal: rejected has higher reward; loss is high; the policy has it backwards.
        The gradient always points "down and right": <strong>increase r_chosen, decrease r_rejected</strong> — this is
        how DPO drives the policy toward correct preferences during training.
      </div>
    </div>
  );
}

interface LandscapeProps {
  grid: ReturnType<typeof buildLossGrid>;
  rChosen: number;
  rRejected: number;
  gradient: { dChosen: number; dRejected: number };
  onCellClick: (rChosen: number, rRejected: number) => void;
}

function LandscapeSvg({ grid, rChosen, rRejected, gradient, onCellClick }: LandscapeProps) {
  const WIDTH = 720;
  const HEIGHT = 460;
  const PADDING = { top: 30, right: 30, bottom: 50, left: 70 };
  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;
  const cellSize = plotW / RESOLUTION;

  function xFor(rc: number): number {
    return PADDING.left + ((rc - DOMAIN_MIN) / (DOMAIN_MAX - DOMAIN_MIN)) * plotW;
  }
  function yFor(rr: number): number {
    return PADDING.top + ((DOMAIN_MAX - rr) / (DOMAIN_MAX - DOMAIN_MIN)) * plotH;
  }

  const descentX = -gradient.dChosen;
  const descentY = -gradient.dRejected;
  const descentMag = Math.sqrt(descentX * descentX + descentY * descentY);
  const arrowScale = 40;
  const arrowDX = (descentX / Math.max(descentMag, 1e-9)) * arrowScale;
  const arrowDY = -(descentY / Math.max(descentMag, 1e-9)) * arrowScale;

  const cx = xFor(rChosen);
  const cy = yFor(rRejected);

  const xTicks = [-3, -2, -1, 0, 1, 2, 3];
  const yTicks = [-3, -2, -1, 0, 1, 2, 3];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={styles.svg}
      role="img"
      aria-label="DPO loss landscape"
    >
      {grid.cells.map((cell) => (
        <rect
          key={`cell-${cell.i}-${cell.j}`}
          x={xFor(cell.rChosen) - cellSize / 2}
          y={yFor(cell.rRejected) - cellSize / 2}
          width={cellSize + 0.5}
          height={cellSize + 0.5}
          fill={lossToColor(cell.loss, grid.minLoss, grid.maxLoss)}
          opacity={0.7}
          style={{ cursor: 'pointer' }}
          onClick={() => onCellClick(cell.rChosen, cell.rRejected)}
        />
      ))}

      <line
        x1={xFor(DOMAIN_MIN)}
        y1={yFor(DOMAIN_MIN)}
        x2={xFor(DOMAIN_MAX)}
        y2={yFor(DOMAIN_MAX)}
        className={styles.diagonal}
      />
      <text
        x={xFor(2.5)}
        y={yFor(2.5) - 5}
        className={styles.diagonalLabel}
        fontSize="9"
        textAnchor="end"
        transform={`rotate(-45 ${xFor(2.5)} ${yFor(2.5) - 5})`}
      >
        tied: r_c = r_r
      </text>

      <text x={xFor(-2)} y={yFor(2)} className={styles.regionLabel} fontSize="11" textAnchor="middle">
        ABOVE DIAGONAL: BAD
      </text>
      <text x={xFor(-2)} y={yFor(2) + 14} className={styles.regionLabelDim} fontSize="9" textAnchor="middle">
        (rejected has higher reward)
      </text>
      <text x={xFor(2)} y={yFor(-2)} className={styles.regionLabel} fontSize="11" textAnchor="middle">
        BELOW DIAGONAL: GOOD
      </text>
      <text x={xFor(2)} y={yFor(-2) + 14} className={styles.regionLabelDim} fontSize="9" textAnchor="middle">
        (chosen has higher reward)
      </text>

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

      {xTicks.map((t) => (
        <text
          key={`xt-${t}`}
          x={xFor(t)}
          y={HEIGHT - PADDING.bottom + 14}
          className={styles.tickLabel}
          textAnchor="middle"
        >
          {t}
        </text>
      ))}
      {yTicks.map((t) => (
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

      <text
        x={PADDING.left + plotW / 2}
        y={HEIGHT - 8}
        className={styles.axisLabel}
        textAnchor="middle"
      >
        r_chosen (implicit reward for chosen response)
      </text>
      <text
        x={-PADDING.top - plotH / 2}
        y={18}
        className={styles.axisLabel}
        textAnchor="middle"
        transform="rotate(-90)"
      >
        r_rejected
      </text>

      <defs>
        <marker
          id="dpo-landscape-arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="var(--cyan-300)" />
        </marker>
      </defs>
      <line
        x1={cx}
        y1={cy}
        x2={cx + arrowDX}
        y2={cy + arrowDY}
        className={styles.gradientArrow}
        markerEnd="url(#dpo-landscape-arrowhead)"
      />

      <circle cx={cx} cy={cy} r={7} className={styles.currentPointOuter} />
      <circle cx={cx} cy={cy} r={4} className={styles.currentPointInner} />
    </svg>
  );
}

function Readout({
  label,
  value,
  highlight,
  note,
  tag,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  note?: string;
  tag?: string;
}) {
  const tagClass = tag ? styles[`readoutTag_${tag}` as keyof typeof styles] : '';
  return (
    <div className={`${styles.readout} ${highlight ? styles.readoutHighlight : ''}`}>
      <div className={styles.readoutLabel}>{label}</div>
      <div className={`${styles.readoutValue} ${tagClass ?? ''}`}>{value}</div>
      {note && <div className={styles.readoutNote}>{note}</div>}
    </div>
  );
}

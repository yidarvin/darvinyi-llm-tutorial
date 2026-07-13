import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  type NetworkState,
  D_IN,
  D_H,
  D_OUT,
  initialWeights,
  computeState,
  PRESETS,
} from './network-state';
import styles from './BackpropVisualizer.module.css';

const STAGE_DURATION_MS = 600;
const TOTAL_STAGES = 10;
const NODE_R = 28;

const COL_X = { input: 100, hidden: 380, output: 660, loss: 820 };
const ROW_Y = {
  input: [190, 290],
  hidden: [80, 180, 280, 380],
  output: [130, 230, 330],
};
const LOSS = { cx: 820, cy: 230, r: 28 };

type HoverKey =
  | { kind: 'node-x'; idx: number }
  | { kind: 'node-hidden'; idx: number }
  | { kind: 'node-output'; idx: number }
  | { kind: 'node-loss' }
  | { kind: 'edge-W1'; i: number; h: number }
  | { kind: 'edge-W2'; h: number; o: number }
  | { kind: 'edge-loss'; o: number };

type Hovered = HoverKey | null;

function fmt(v: number, digits = 3): string {
  return v.toFixed(digits);
}
function fmtTerm(v: number, digits = 3): string {
  return v < 0 ? `(${v.toFixed(digits)})` : v.toFixed(digits);
}

function edgeEndpoints(x1: number, y1: number, x2: number, y2: number, r: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;
  return {
    x1: x1 + ux * r,
    y1: y1 + uy * r,
    x2: x2 - ux * r,
    y2: y2 - uy * r,
  };
}

function strokeForWeight(w: number, maxAbs: number): number {
  const t = Math.min(1, Math.abs(w) / maxAbs);
  return 0.5 + t * 2.5; // 0.5 to 3 px
}

function classForWeight(w: number): string {
  return w >= 0 ? 'edge-positive' : 'edge-negative';
}

export default function BackpropVisualizer() {
  const [presetIdx, setPresetIdx] = useState(0);
  const [stage, setStage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hovered, setHovered] = useState<Hovered>(null);

  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const state: NetworkState = useMemo(() => {
    const { W1, b1, W2, b2 } = initialWeights(42);
    const preset = PRESETS[presetIdx]!;
    return computeState(preset.x, preset.y_target, W1, b1, W2, b2);
  }, [presetIdx]);

  const maxAbsW1 = useMemo(() => {
    let m = 0;
    for (const row of state.W1) for (const v of row) m = Math.max(m, Math.abs(v));
    return m || 1;
  }, [state.W1]);
  const maxAbsW2 = useMemo(() => {
    let m = 0;
    for (const row of state.W2) for (const v of row) m = Math.max(m, Math.abs(v));
    return m || 1;
  }, [state.W2]);

  useEffect(() => {
    if (!isPlaying) return;
    if (stage >= TOTAL_STAGES) {
      setIsPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      setStage((s) => s + 1);
    }, STAGE_DURATION_MS);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, stage]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handlePlay() {
    if (stage >= TOTAL_STAGES) {
      setStage(0);
      setHovered(null);
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
  }

  function handleStep() {
    if (stage >= TOTAL_STAGES) return;
    setIsPlaying(false);
    setStage((s) => s + 1);
  }

  function handleReset() {
    setIsPlaying(false);
    setStage(0);
    setHovered(null);
  }

  function handlePreset(i: number) {
    handleReset();
    setPresetIdx(i);
  }

  const phaseLabel =
    stage === 0
      ? 'idle'
      : stage <= 5
      ? `forward · ${stage}/5`
      : stage <= 9
      ? `backward · ${stage - 5}/4`
      : 'done';
  const phaseClass =
    stage >= 1 && stage <= 5
      ? styles.phaseFwd
      : stage >= 6 && stage <= 10
      ? styles.phaseBwd
      : '';

  return (
    <div className={styles.widget}>
      <div className={styles.presetBar}>
        {PRESETS.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handlePreset(i)}
            className={`${styles.presetButton} ${
              i === presetIdx ? styles.presetActive : ''
            }`}
            aria-pressed={i === presetIdx}
          >
            {p.label}
          </button>
        ))}
        <span className={`${styles.phaseLabel} ${phaseClass}`}>{phaseLabel}</span>
      </div>

      <NetworkSVG
        state={state}
        stage={stage}
        hovered={hovered}
        setHovered={setHovered}
        maxAbsW1={maxAbsW1}
        maxAbsW2={maxAbsW2}
      />

      <Tooltip hovered={hovered} state={state} stage={stage} />

      <div className={styles.controls}>
        <button
          type="button"
          onClick={handlePlay}
          className={styles.controlPrimary}
          aria-label="Play or pause animation"
        >
          {isPlaying
            ? 'Pause'
            : stage >= TOTAL_STAGES
            ? 'Replay'
            : stage === 0
            ? 'Play'
            : 'Resume'}
        </button>
        <button
          type="button"
          onClick={handleStep}
          className={styles.controlSecondary}
          disabled={stage >= TOTAL_STAGES || isPlaying}
          aria-label="Step forward one stage"
        >
          Step
        </button>
        <button
          type="button"
          onClick={handleReset}
          className={styles.controlSecondary}
          aria-label="Reset to initial state"
        >
          Reset
        </button>
        <span className={styles.stageLabel} aria-live="polite">
          Stage {stage} / {TOTAL_STAGES}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// SVG
// =============================================================================

interface SVGProps {
  state: NetworkState;
  stage: number;
  hovered: Hovered;
  setHovered: (h: Hovered) => void;
  maxAbsW1: number;
  maxAbsW2: number;
}

function NetworkSVG({ state, stage, hovered, setHovered, maxAbsW1, maxAbsW2 }: SVGProps) {
  // ----- edges -----
  // Layer 1: input -> hidden
  const edges1 = [];
  for (let i = 0; i < D_IN; i++) {
    for (let h = 0; h < D_H; h++) {
      const e = edgeEndpoints(COL_X.input, ROW_Y.input[i]!, COL_X.hidden, ROW_Y.hidden[h]!, NODE_R);
      const w = state.W1[i]![h]!;
      const flowFwd = stage === 1;
      const flowBwd = stage === 9;
      const isHovered =
        hovered?.kind === 'edge-W1' && hovered.i === i && hovered.h === h;
      const classes = [
        'edge',
        classForWeight(w),
        flowFwd ? 'flowing-fwd' : '',
        flowBwd ? 'flowing-bwd' : '',
        isHovered ? 'hovered' : '',
      ]
        .filter(Boolean)
        .join(' ');
      edges1.push(
        <line
          key={`e1-${i}-${h}`}
          x1={e.x1}
          y1={e.y1}
          x2={e.x2}
          y2={e.y2}
          className={classes}
          strokeWidth={strokeForWeight(w, maxAbsW1)}
          onMouseEnter={() => setHovered({ kind: 'edge-W1', i, h })}
          onMouseLeave={() => setHovered(null)}
          style={{ cursor: 'pointer' }}
        />
      );
    }
  }

  // Layer 2: hidden -> output
  const edges2 = [];
  for (let h = 0; h < D_H; h++) {
    for (let o = 0; o < D_OUT; o++) {
      const e = edgeEndpoints(
        COL_X.hidden,
        ROW_Y.hidden[h]!,
        COL_X.output,
        ROW_Y.output[o]!,
        NODE_R
      );
      const w = state.W2[h]![o]!;
      const flowFwd = stage === 4;
      const flowBwd = stage === 7;
      const isHovered =
        hovered?.kind === 'edge-W2' && hovered.h === h && hovered.o === o;
      const classes = [
        'edge',
        classForWeight(w),
        flowFwd ? 'flowing-fwd' : '',
        flowBwd ? 'flowing-bwd' : '',
        isHovered ? 'hovered' : '',
      ]
        .filter(Boolean)
        .join(' ');
      edges2.push(
        <line
          key={`e2-${h}-${o}`}
          x1={e.x1}
          y1={e.y1}
          x2={e.x2}
          y2={e.y2}
          className={classes}
          strokeWidth={strokeForWeight(w, maxAbsW2)}
          onMouseEnter={() => setHovered({ kind: 'edge-W2', h, o })}
          onMouseLeave={() => setHovered(null)}
          style={{ cursor: 'pointer' }}
        />
      );
    }
  }

  // Edges to loss bubble
  const edgesLoss = [];
  for (let o = 0; o < D_OUT; o++) {
    const e = edgeEndpoints(
      COL_X.output,
      ROW_Y.output[o]!,
      LOSS.cx,
      LOSS.cy,
      NODE_R
    );
    const visible = stage >= 5;
    const isHovered = hovered?.kind === 'edge-loss' && hovered.o === o;
    const classes = ['edge', isHovered ? 'hovered' : '']
      .filter(Boolean)
      .join(' ');
    edgesLoss.push(
      <line
        key={`el-${o}`}
        x1={e.x1}
        y1={e.y1}
        x2={e.x2}
        y2={e.y2}
        className={classes}
        strokeWidth={1.5}
        stroke={visible ? 'var(--cyan-500)' : 'var(--border-default)'}
        opacity={visible ? 0.6 : 0.25}
        onMouseEnter={() => setHovered({ kind: 'edge-loss', o })}
        onMouseLeave={() => setHovered(null)}
        style={{ cursor: 'pointer' }}
      />
    );
  }

  // ----- input nodes -----
  const inputNodes = state.x.map((v, i) => {
    const cx = COL_X.input;
    const cy = ROW_Y.input[i]!;
    const isHovered = hovered?.kind === 'node-x' && hovered.idx === i;
    const fwdActive = stage >= 1;
    const bwdActive = stage === 9;
    const circleClass = [
      'node-circle',
      fwdActive ? 'active-fwd' : '',
      bwdActive ? 'active-bwd' : '',
      isHovered ? 'hovered' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return (
      <g
        key={`x-${i}`}
        className="node"
        onMouseEnter={() => setHovered({ kind: 'node-x', idx: i })}
        onMouseLeave={() => setHovered(null)}
      >
        <circle cx={cx} cy={cy} r={NODE_R} className={circleClass} />
        <text x={cx} y={cy} className="node-value">
          {fmt(v, 2)}
        </text>
        <text x={cx} y={cy + NODE_R + 14} className="node-label">
          x[{i}]
        </text>
      </g>
    );
  });

  // ----- hidden nodes -----
  // Value rules:
  //   stage 0,1: empty
  //   stage 2:   z1 (cyan)
  //   stage 3-7: a1 (white)
  //   stage 8-10: dz1 (amber)
  const hiddenNodes = state.z1.map((_, h) => {
    const cx = COL_X.hidden;
    const cy = ROW_Y.hidden[h]!;
    const isHovered = hovered?.kind === 'node-hidden' && hovered.idx === h;
    const fwdActive = stage === 2 || stage === 3;
    const bwdActive = stage === 8;
    const circleClass = [
      'node-circle',
      fwdActive ? 'active-fwd' : '',
      bwdActive ? 'active-bwd' : '',
      isHovered ? 'hovered' : '',
    ]
      .filter(Boolean)
      .join(' ');

    let value: string;
    let valueClass: string;
    let secondLine: string | null = null;
    if (stage <= 1) {
      value = '';
      valueClass = 'node-value faded';
    } else if (stage === 2) {
      value = fmt(state.z1[h]!, 2);
      valueClass = 'node-value fwd';
    } else if (stage <= 7) {
      value = fmt(state.a1[h]!, 2);
      valueClass = 'node-value';
    } else {
      value = fmt(state.dz1[h]!, 2);
      valueClass = 'node-value bwd';
      // Also show a1 in faded text above so the reader keeps the forward value visible
      secondLine = fmt(state.a1[h]!, 2);
    }

    return (
      <g
        key={`h-${h}`}
        className="node"
        onMouseEnter={() => setHovered({ kind: 'node-hidden', idx: h })}
        onMouseLeave={() => setHovered(null)}
      >
        <circle cx={cx} cy={cy} r={NODE_R} className={circleClass} />
        {secondLine !== null && (
          <text x={cx} y={cy - 7} className="node-value faded" style={{ fontSize: 10 }}>
            {secondLine}
          </text>
        )}
        <text
          x={cx}
          y={secondLine !== null ? cy + 8 : cy}
          className={valueClass}
        >
          {value}
        </text>
        <text x={cx} y={cy + NODE_R + 14} className="node-label">
          {stage === 2 ? `z1[${h}]` : stage >= 8 ? `dz1[${h}]` : `a1[${h}]`}
        </text>
      </g>
    );
  });

  // ----- output nodes -----
  // Value rules:
  //   stage 0-4: empty
  //   stage 5:   p (white)
  //   stage 6-10: dz2 (amber), with p faded above
  const outputNodes = state.p.map((_, o) => {
    const cx = COL_X.output;
    const cy = ROW_Y.output[o]!;
    const isHovered = hovered?.kind === 'node-output' && hovered.idx === o;
    const fwdActive = stage === 5;
    const bwdActive = stage === 6 || stage === 7;
    const circleClass = [
      'node-circle',
      fwdActive ? 'active-fwd' : '',
      bwdActive ? 'active-bwd' : '',
      isHovered ? 'hovered' : '',
    ]
      .filter(Boolean)
      .join(' ');

    let value: string;
    let valueClass: string;
    let secondLine: string | null = null;
    if (stage <= 4) {
      value = '';
      valueClass = 'node-value faded';
    } else if (stage === 5) {
      value = fmt(state.p[o]!, 2);
      valueClass = 'node-value fwd';
    } else {
      value = fmt(state.dz2[o]!, 2);
      valueClass = 'node-value bwd';
      secondLine = fmt(state.p[o]!, 2);
    }

    const isTarget = o === state.y_target;

    return (
      <g
        key={`o-${o}`}
        className="node"
        onMouseEnter={() => setHovered({ kind: 'node-output', idx: o })}
        onMouseLeave={() => setHovered(null)}
      >
        <circle cx={cx} cy={cy} r={NODE_R} className={circleClass} />
        {secondLine !== null && (
          <text x={cx} y={cy - 7} className="node-value faded" style={{ fontSize: 10 }}>
            {secondLine}
          </text>
        )}
        <text
          x={cx}
          y={secondLine !== null ? cy + 8 : cy}
          className={valueClass}
        >
          {value}
        </text>
        <text x={cx} y={cy + NODE_R + 14} className="node-label">
          {stage >= 6 ? `dz2[${o}]` : `p[${o}]`}
        </text>
        {isTarget && (
          <text x={cx + NODE_R + 8} y={cy + 4} className="target-label" textAnchor="start">
            ← target
          </text>
        )}
      </g>
    );
  });

  // ----- loss bubble -----
  const lossVisible = stage >= 5;
  const lossActive = stage === 5 || stage === 6;
  const lossHovered = hovered?.kind === 'node-loss';
  const lossClass = [
    'loss-bubble',
    lossVisible ? '' : 'faded',
    lossActive ? 'active-fwd' : '',
    lossHovered ? 'hovered' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const lossBubble = (
    <g
      className="node"
      onMouseEnter={() => setHovered({ kind: 'node-loss' })}
      onMouseLeave={() => setHovered(null)}
    >
      <circle cx={LOSS.cx} cy={LOSS.cy} r={LOSS.r} className={lossClass} />
      <text x={LOSS.cx} y={LOSS.cy} className="loss-bubble-value">
        {lossVisible ? fmt(state.loss, 2) : '–'}
      </text>
      <text x={LOSS.cx} y={LOSS.cy + LOSS.r + 14} className="loss-bubble-label">
        L
      </text>
    </g>
  );

  // ----- column labels -----
  const columnLabels = (
    <>
      <text x={COL_X.input} y={40} className="column-label">
        input
      </text>
      <text x={COL_X.hidden} y={40} className="column-label">
        hidden (W₁, b₁ → ReLU)
      </text>
      <text x={COL_X.output} y={40} className="column-label">
        output (W₂, b₂ → softmax)
      </text>
      <text x={LOSS.cx} y={40} className="column-label">
        loss
      </text>
    </>
  );

  const svgStyle: CSSProperties = { aspectRatio: '880 / 460' };

  return (
    <svg
      viewBox="0 0 880 460"
      className={styles.svg}
      style={svgStyle}
      role="img"
      aria-label="Two-layer MLP with forward and backward pass animation"
    >
      {columnLabels}
      {edges1}
      {edges2}
      {edgesLoss}
      {inputNodes}
      {hiddenNodes}
      {outputNodes}
      {lossBubble}
    </svg>
  );
}

// =============================================================================
// Tooltip
// =============================================================================

interface TooltipProps {
  hovered: Hovered;
  state: NetworkState;
  stage: number;
}

function Tooltip({ hovered, state, stage }: TooltipProps) {
  if (!hovered) {
    return (
      <div className={styles.tooltipBox}>
        Hover any node or edge for the math at that point. Click Play to animate the forward
        (cyan) and backward (amber) pass.
      </div>
    );
  }

  const isBwd =
    (hovered.kind === 'node-hidden' && stage >= 8) ||
    (hovered.kind === 'node-output' && stage >= 6) ||
    (hovered.kind === 'edge-W1' && stage >= 9) ||
    (hovered.kind === 'edge-W2' && stage >= 7);
  const kindLabel = tooltipKindLabel(hovered);

  return (
    <div className={styles.tooltipBox}>
      <span
        className={`${styles.tooltipKind} ${isBwd ? styles.tooltipKindBwd : ''}`}
      >
        {kindLabel}
      </span>
      {renderTooltipLines(hovered, state, stage)}
    </div>
  );
}

function tooltipKindLabel(h: HoverKey): string {
  switch (h.kind) {
    case 'node-x':
      return `x[${h.idx}]`;
    case 'node-hidden':
      return `hidden[${h.idx}]`;
    case 'node-output':
      return `output[${h.idx}]`;
    case 'node-loss':
      return 'loss';
    case 'edge-W1':
      return `W1[${h.i}][${h.h}]`;
    case 'edge-W2':
      return `W2[${h.h}][${h.o}]`;
    case 'edge-loss':
      return `p[${h.o}] → L`;
  }
}

function renderTooltipLines(h: HoverKey, s: NetworkState, stage: number) {
  const lines: JSX.Element[] = [];
  let lineKey = 0;
  const line = (content: string, sub = false) => {
    lines.push(
      <span
        key={lineKey++}
        className={sub ? styles.tooltipSubLine : styles.tooltipLine}
      >
        {content}
      </span>
    );
  };

  switch (h.kind) {
    case 'node-x': {
      const i = h.idx;
      line(`x[${i}] = ${fmt(s.x[i]!)}`);
      line('input feature, passed unchanged into the first affine map.', true);
      break;
    }
    case 'node-hidden': {
      const hi = h.idx;
      // Always show z1
      const terms = Array.from(
        { length: D_IN },
        (_, i) => `${fmtTerm(s.W1[i]![hi]!)}·${fmtTerm(s.x[i]!)}`
      );
      line(`z1[${hi}] = W1[*][${hi}]·x + b1[${hi}]`);
      line(`= ${terms.join(' + ')} + ${fmtTerm(s.b1[hi]!)}`, true);
      line(`= ${fmt(s.z1[hi]!)}`, true);
      if (stage >= 3) {
        line(
          `a1[${hi}] = ReLU(z1[${hi}]) = max(0, ${fmt(s.z1[hi]!)}) = ${fmt(s.a1[hi]!)}`
        );
      }
      if (stage >= 8) {
        const mask = s.z1[hi]! > 0 ? 1 : 0;
        line(
          `dz1[${hi}] = da1[${hi}] · 1[z1[${hi}] > 0] = ${fmt(s.da1[hi]!)} · ${mask} = ${fmt(
            s.dz1[hi]!
          )}`
        );
      }
      break;
    }
    case 'node-output': {
      const o = h.idx;
      const terms = Array.from(
        { length: D_H },
        (_, hi) => `${fmtTerm(s.a1[hi]!)}·${fmtTerm(s.W2[hi]![o]!)}`
      );
      line(`z2[${o}] = a1·W2[*][${o}] + b2[${o}]`);
      line(`= ${terms.join(' + ')} + ${fmtTerm(s.b2[o]!)}`, true);
      line(`= ${fmt(s.z2[o]!)}`, true);
      if (stage >= 5) {
        line(`p[${o}] = softmax(z2)[${o}] = ${fmt(s.p[o]!)}`);
      }
      if (stage >= 6) {
        line(
          `dz2[${o}] = p[${o}] − y[${o}] = ${fmt(s.p[o]!)} − ${s.y_onehot[o]!} = ${fmt(
            s.dz2[o]!
          )}`
        );
      }
      break;
    }
    case 'node-loss': {
      const t = s.y_target;
      line(`L = −log p[${t}] = −log ${fmt(s.p[t]!)} = ${fmt(s.loss)}`);
      line('Cross-entropy on a one-hot target reduces to the negative log of the true-class probability.', true);
      break;
    }
    case 'edge-W1': {
      const w = s.W1[h.i]![h.h]!;
      line(`W1[${h.i}][${h.h}] = ${fmt(w)}`);
      line(
        `Contributes ${fmtTerm(w)}·x[${h.i}] = ${fmtTerm(w)}·${fmtTerm(s.x[h.i]!)} = ${fmt(
          w * s.x[h.i]!
        )} to z1[${h.h}].`,
        true
      );
      if (stage >= 9) {
        const grad = s.x[h.i]! * s.dz1[h.h]!;
        line(
          `dW1[${h.i}][${h.h}] = x[${h.i}] · dz1[${h.h}] = ${fmtTerm(s.x[h.i]!)} · ${fmtTerm(
            s.dz1[h.h]!
          )} = ${fmt(grad)}`
        );
      }
      break;
    }
    case 'edge-W2': {
      const w = s.W2[h.h]![h.o]!;
      line(`W2[${h.h}][${h.o}] = ${fmt(w)}`);
      line(
        `Contributes ${fmtTerm(s.a1[h.h]!)}·${fmtTerm(w)} = ${fmt(
          s.a1[h.h]! * w
        )} to z2[${h.o}].`,
        true
      );
      if (stage >= 7) {
        const grad = s.a1[h.h]! * s.dz2[h.o]!;
        line(
          `dW2[${h.h}][${h.o}] = a1[${h.h}] · dz2[${h.o}] = ${fmtTerm(s.a1[h.h]!)} · ${fmtTerm(
            s.dz2[h.o]!
          )} = ${fmt(grad)}`
        );
      }
      break;
    }
    case 'edge-loss': {
      line(`p[${h.o}] = ${fmt(s.p[h.o]!)} feeds into L = −Σᵢ yᵢ log pᵢ.`);
      line(
        `For one-hot y with target t = ${s.y_target}, only p[${s.y_target}] = ${fmt(
          s.p[s.y_target]!
        )} contributes to L.`,
        true
      );
      break;
    }
  }

  return lines;
}

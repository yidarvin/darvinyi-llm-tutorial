import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { TRACE, TOTAL_STAGES, stateAtStage, type ValueNode } from './autograd-trace';
import styles from './AutogradGraph.module.css';

const STAGE_DURATION_MS = 900;
const NODE_W = 100;
const NODE_H = 60;

type Direction = 'forward' | 'backward' | 'idle';

function fmt(v: number): string {
  if (Number.isNaN(v)) return '—';
  return v.toFixed(2);
}

function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.max(40, (x2 - x1) * 0.5);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

export default function AutogradGraph() {
  const [stage, setStage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isPlaying) return;
    if (stage >= TOTAL_STAGES) {
      setIsPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      if (!cancelledRef.current) setStage((s) => s + 1);
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

  const state = stateAtStage(stage);
  const stageInfo = TRACE.stages[stage]!;
  const direction: Direction = stageInfo.showsForward
    ? 'forward'
    : stageInfo.showsBackward
    ? 'backward'
    : 'idle';

  const phaseLabel =
    stage === 0
      ? 'idle'
      : stage <= 3
      ? `forward · ${stage}/3`
      : stage <= 7
      ? `backward · ${stage - 3}/4`
      : 'done';
  const phaseClass =
    direction === 'forward'
      ? styles.phaseFwd
      : direction === 'backward'
      ? styles.phaseBwd
      : '';

  const svgStyle: CSSProperties = { aspectRatio: '850 / 460' };

  return (
    <div className={styles.widget}>
      <div className={styles.headerBar}>
        <span className={`${styles.phaseLabel} ${phaseClass}`}>{phaseLabel}</span>
        <span className={styles.stageLabel} aria-live="polite">
          Stage {stage} / {TOTAL_STAGES}
        </span>
      </div>

      <div className={styles.description} aria-live="polite">
        {stageInfo.description}
      </div>

      <svg
        viewBox="0 0 850 460"
        className={styles.svg}
        style={svgStyle}
        role="img"
        aria-label="Autograd computational graph: forward and backward pass animation"
      >
        {/* Edges drawn first, behind nodes */}
        {TRACE.edges.map((e) => {
          const from = TRACE.nodes.find((n) => n.id === e.from)!;
          const to = TRACE.nodes.find((n) => n.id === e.to)!;
          const edgeId = `${e.from}-${e.to}`;
          const isActive = stageInfo.highlightedEdges?.includes(edgeId) ?? false;
          const edgeDir: Direction = isActive ? direction : 'idle';
          const classes = ['edge', isActive ? `edge-${edgeDir}` : 'edge-idle']
            .filter(Boolean)
            .join(' ');
          return (
            <path
              key={edgeId}
              d={bezierPath(from.x + NODE_W, from.y + NODE_H / 2, to.x, to.y + NODE_H / 2)}
              className={classes}
            />
          );
        })}

        {/* Nodes */}
        {TRACE.nodes.map((n) => (
          <NodeView
            key={n.id}
            node={n}
            data={state.data[n.id]!}
            grad={state.grads[n.id]!}
            isHovered={hovered === n.id}
            isActive={stageInfo.highlightedNode === n.id}
            direction={direction}
            onHover={setHovered}
          />
        ))}
      </svg>

      <Tooltip nodeId={hovered} />

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
      </div>
    </div>
  );
}

interface NodeViewProps {
  node: ValueNode;
  data: number;
  grad: number;
  isHovered: boolean;
  isActive: boolean;
  direction: Direction;
  onHover: (id: string | null) => void;
}

function NodeView({ node, data, grad, isHovered, isActive, direction, onHover }: NodeViewProps) {
  const stateClass = isActive
    ? direction === 'forward'
      ? 'node-forward'
      : direction === 'backward'
      ? 'node-backward'
      : ''
    : '';
  const gradClass = grad !== 0 ? 'node-grad node-grad-nonzero' : 'node-grad';
  const gClass = ['node', stateClass, isHovered ? 'node-hovered' : ''].filter(Boolean).join(' ');

  return (
    <g
      className={gClass}
      transform={`translate(${node.x}, ${node.y})`}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(node.id)}
      onBlur={() => onHover(null)}
      tabIndex={0}
    >
      <text className="node-op" x={NODE_W / 2} y={-8}>
        {node.label}
      </text>
      <rect className="node-rect" width={NODE_W} height={NODE_H} rx={6} />
      <line className="node-divider" x1={0} y1={NODE_H / 2} x2={NODE_W} y2={NODE_H / 2} />
      <text className="node-data" x={NODE_W / 2} y={NODE_H / 4 + 2}>
        {fmt(data)}
      </text>
      <text className={gradClass} x={NODE_W / 2} y={(3 * NODE_H) / 4 + 1}>
        g: {fmt(grad)}
      </text>
    </g>
  );
}

function Tooltip({ nodeId }: { nodeId: string | null }) {
  if (!nodeId) {
    return (
      <div className={styles.tooltipBox}>
        Hover any node to see its <code>_backward</code> closure. Play to animate the forward
        (cyan) and backward (amber) pass.
      </div>
    );
  }
  const node = TRACE.nodes.find((n) => n.id === nodeId)!;
  const opLabel = node.op === 'leaf' ? 'leaf node' : `${node.op} op`;
  return (
    <div className={styles.tooltipBox}>
      <div className={styles.tooltipTitle}>
        {node.label} — {opLabel}
      </div>
      <pre className={styles.tooltipCode}>{node.backwardCode}</pre>
    </div>
  );
}

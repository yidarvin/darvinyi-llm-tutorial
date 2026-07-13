import { useEffect, useRef, useState } from 'react';
import { TOKENS, STAGES, type BlockStage } from './block-flow-data';
import styles from './TransformerBlockFlow.module.css';

const PLAY_FPS = 0.7;

export default function TransformerBlockFlow() {
  const [stageIdx, setStageIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const stage = STAGES[stageIdx]!;

  function handlePlayPause() {
    if (stageIdx >= STAGES.length - 1) {
      setStageIdx(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(p => !p);
    }
  }

  return (
    <div className={styles.widget}>
      <div className={styles.controls}>
        <button
          type="button"
          onClick={() => {
            setStageIdx(0);
            setIsPlaying(false);
          }}
          className={styles.controlSecondary}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handlePlayPause}
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
          aria-label="Block stage"
        />
        <span className={styles.stepLabel}>
          Stage {stageIdx + 1} / {STAGES.length}
        </span>
      </div>

      <div className={styles.stageTitle}>{stage.label}</div>

      <BlockDiagram activeVia={stage.via} />

      <div className={styles.dataPanel}>
        <div className={styles.panelTitle}>Current state: 6 tokens × 6 features</div>
        <DataMatrix data={stage.data} />
      </div>

      <div className={styles.description} aria-live="polite">
        {stage.description}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// SVG block diagram with arched residual arrows
// -----------------------------------------------------------------------------

interface DiagramProps {
  activeVia: BlockStage['via'];
}

const DIAGRAM_W = 800;
const DIAGRAM_H = 220;

const BOXES = {
  X:    { x:  40, y: 100, w: 60, h: 40, label: 'X (in)' },
  LN1:  { x: 140, y: 100, w: 70, h: 40, label: 'LN₁' },
  MHA:  { x: 240, y: 100, w: 80, h: 40, label: 'MHA' },
  SUM1: { x: 350, y: 100, w: 40, h: 40, label: '⊕' },
  LN2:  { x: 430, y: 100, w: 70, h: 40, label: 'LN₂' },
  FFN:  { x: 530, y: 100, w: 70, h: 40, label: 'FFN' },
  SUM2: { x: 630, y: 100, w: 40, h: 40, label: '⊕' },
  OUT:  { x: 710, y: 100, w: 60, h: 40, label: 'out' },
} as const;

type BoxKey = keyof typeof BOXES;
type Box = (typeof BOXES)[BoxKey];

const STAGE_ORDER: BlockStage['via'][] = [
  'input',
  'layer-norm-1',
  'mha',
  'residual-1',
  'layer-norm-2',
  'ffn',
  'residual-2',
];

const BOX_STAGE_IDX: Record<BoxKey, number> = {
  X: 0,
  LN1: 1,
  MHA: 2,
  SUM1: 3,
  LN2: 4,
  FFN: 5,
  SUM2: 6,
  OUT: 6,
};

function getBoxState(
  boxKey: BoxKey,
  activeVia: BlockStage['via']
): 'completed' | 'active' | 'pending' {
  const activeIdx = STAGE_ORDER.indexOf(activeVia);
  const boxIdx = BOX_STAGE_IDX[boxKey];
  if (boxIdx < activeIdx) return 'completed';
  if (boxIdx === activeIdx) return 'active';
  return 'pending';
}

function BlockDiagram({ activeVia }: DiagramProps) {
  return (
    <svg
      viewBox={`0 0 ${DIAGRAM_W} ${DIAGRAM_H}`}
      className={styles.svgDiagram}
      role="img"
      aria-label="Pre-LN transformer block"
    >
      <defs>
        <marker
          id="block-arrowhead"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 Z" fill="var(--text-secondary)" />
        </marker>
        <marker
          id="block-arrowhead-residual"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 Z" fill="var(--cyan-400)" />
        </marker>
      </defs>

      <FlowArrow from={BOXES.X} to={BOXES.LN1} />
      <FlowArrow from={BOXES.LN1} to={BOXES.MHA} />
      <FlowArrow from={BOXES.MHA} to={BOXES.SUM1} />
      <FlowArrow from={BOXES.SUM1} to={BOXES.LN2} />
      <FlowArrow from={BOXES.LN2} to={BOXES.FFN} />
      <FlowArrow from={BOXES.FFN} to={BOXES.SUM2} />
      <FlowArrow from={BOXES.SUM2} to={BOXES.OUT} />

      <ResidualArrow
        startX={BOXES.X.x + BOXES.X.w / 2}
        startY={BOXES.X.y}
        endX={BOXES.SUM1.x + BOXES.SUM1.w / 2}
        endY={BOXES.SUM1.y}
        label="residual₁"
        highlight={activeVia === 'residual-1'}
      />
      <ResidualArrow
        startX={BOXES.SUM1.x + BOXES.SUM1.w / 2}
        startY={BOXES.SUM1.y}
        endX={BOXES.SUM2.x + BOXES.SUM2.w / 2}
        endY={BOXES.SUM2.y}
        label="residual₂"
        highlight={activeVia === 'residual-2'}
      />

      {(Object.keys(BOXES) as BoxKey[]).map(key => {
        const box = BOXES[key];
        const state = getBoxState(key, activeVia);
        return <OpBox key={key} box={box} state={state} />;
      })}
    </svg>
  );
}

function OpBox({
  box,
  state,
}: {
  box: Box;
  state: 'completed' | 'active' | 'pending';
}) {
  const fillClass =
    state === 'active'
      ? styles.boxActive
      : state === 'completed'
      ? styles.boxCompleted
      : styles.boxPending;
  return (
    <g className={`${styles.opBox} ${fillClass}`}>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={6} />
      <text
        x={box.x + box.w / 2}
        y={box.y + box.h / 2 + 5}
        textAnchor="middle"
        className={styles.boxLabel}
      >
        {box.label}
      </text>
    </g>
  );
}

function FlowArrow({ from, to }: { from: Box; to: Box }) {
  const x1 = from.x + from.w;
  const y1 = from.y + from.h / 2;
  const x2 = to.x;
  const y2 = to.y + to.h / 2;
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      className={styles.flowArrow}
      markerEnd="url(#block-arrowhead)"
    />
  );
}

function ResidualArrow({
  startX,
  startY,
  endX,
  endY,
  label,
  highlight,
}: {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  label: string;
  highlight: boolean;
}) {
  const archHeight = 70;
  const midX = (startX + endX) / 2;
  const archY = startY - archHeight;
  const path = `M ${startX} ${startY} Q ${midX} ${archY}, ${endX} ${endY}`;
  return (
    <g
      className={`${styles.residualArrow} ${
        highlight ? styles.residualArrowHighlight : ''
      }`}
    >
      <path d={path} fill="none" markerEnd="url(#block-arrowhead-residual)" />
      <text
        x={midX}
        y={archY - 6}
        textAnchor="middle"
        className={styles.residualLabel}
      >
        {label}
      </text>
    </g>
  );
}

// -----------------------------------------------------------------------------
// Data matrix display
// -----------------------------------------------------------------------------

function DataMatrix({ data }: { data: number[][] }) {
  const absMax = Math.max(...data.flat().map(Math.abs), 1);

  function cellColor(v: number): string {
    const t = v / absMax;
    const alpha = Math.min(Math.abs(t), 1).toFixed(3);
    if (t >= 0) return `rgba(239, 68, 68, ${alpha})`;
    return `rgba(59, 130, 246, ${alpha})`;
  }

  return (
    <div
      className={styles.dataGrid}
      style={{ gridTemplateColumns: `auto repeat(${data[0]!.length}, 32px)` }}
    >
      <div />
      {data[0]!.map((_, j) => (
        <div key={`ch-${j}`} className={styles.colLabel}>
          d{j}
        </div>
      ))}
      {data.map((row, i) => (
        <RowFragment key={i} rowLabel={TOKENS[i]!}>
          {row.map((v, j) => (
            <div
              key={j}
              className={styles.dataCell}
              style={{ backgroundColor: cellColor(v) }}
              title={`${TOKENS[i]}[d${j}] = ${v.toFixed(2)}`}
            />
          ))}
        </RowFragment>
      ))}
    </div>
  );
}

function RowFragment({
  rowLabel,
  children,
}: {
  rowLabel: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className={styles.rowLabel}>{rowLabel}</div>
      {children}
    </>
  );
}

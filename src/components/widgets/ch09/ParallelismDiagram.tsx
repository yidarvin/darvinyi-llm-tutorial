import { useState } from 'react';
import {
  STRATEGIES, getStrategy,
  type StrategyKey, type ParallelismStrategy, type LayerState, type CommArrow,
} from './parallelism-data';
import styles from './ParallelismDiagram.module.css';

const N_GPUS = 4;
const N_LAYERS = 4;

export default function ParallelismDiagram() {
  const [activeKey, setActiveKey] = useState<StrategyKey>('dp');
  const strategy = getStrategy(activeKey);

  return (
    <div className={styles.widget}>
      <div className={styles.tabs} role="tablist">
        {STRATEGIES.map(s => (
          <button
            key={s.key}
            role="tab"
            aria-selected={s.key === activeKey}
            className={`${styles.tab} ${s.key === activeKey ? styles.tabActive : ''}`}
            style={{
              borderColor: s.key === activeKey ? s.color : undefined,
              color: s.key === activeKey ? s.color : undefined,
            }}
            onClick={() => setActiveKey(s.key)}
          >
            {s.shortLabel}
          </button>
        ))}
      </div>

      <div className={styles.diagramPanel}>
        <div className={styles.panelTitle} style={{ color: strategy.color }}>
          {strategy.label}
        </div>
        <DiagramSvg strategy={strategy} />
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCell}>
          <div className={styles.statLabel}>Memory per GPU</div>
          <div className={styles.statValue}>{strategy.memoryPerGPU}</div>
        </div>
        <div className={styles.statCell}>
          <div className={styles.statLabel}>Comm cost</div>
          <div className={styles.statValue}>{strategy.commCost}</div>
        </div>
        <div className={styles.statCell}>
          <div className={styles.statLabel}>Scaling limit</div>
          <div className={styles.statValue}>{strategy.scalingLimit}</div>
        </div>
      </div>

      <div className={styles.description} aria-live="polite">
        <div className={styles.descriptionBody}>{strategy.description}</div>
      </div>
    </div>
  );
}

function DiagramSvg({ strategy }: { strategy: ParallelismStrategy }) {
  const WIDTH = 760;
  const HEIGHT = 460;

  const TOP_DATA_Y = 30;
  const TOP_DATA_HEIGHT = 22;
  const ARROW_DOWN_TOP = 60;
  const ARROW_DOWN_BOTTOM = 90;
  const GPU_TOP = 100;
  const GPU_BOTTOM = 360;
  const GPU_HEIGHT = GPU_BOTTOM - GPU_TOP;
  const COMM_Y = 410;

  const GPU_WIDTH = 130;
  const GPU_GAP = 30;
  const TOTAL_GPU_WIDTH = N_GPUS * GPU_WIDTH + (N_GPUS - 1) * GPU_GAP;
  const GPU_START_X = (WIDTH - TOTAL_GPU_WIDTH) / 2;

  const LAYER_HEIGHT = (GPU_HEIGHT - 60) / N_LAYERS;
  const LAYER_PADDING = 4;
  const LAYER_LABEL_OFFSET = 30;

  function gpuX(idx: number): number {
    return GPU_START_X + idx * (GPU_WIDTH + GPU_GAP);
  }
  function layerY(layerIdx: number): number {
    return GPU_TOP + LAYER_LABEL_OFFSET + layerIdx * LAYER_HEIGHT;
  }

  function CommunicationArrow({ comm }: { comm: CommArrow }) {
    const allGpuLeft = gpuX(0);
    const allGpuRight = gpuX(N_GPUS - 1) + GPU_WIDTH;
    const allGpuCenter = (allGpuLeft + allGpuRight) / 2;

    if (comm.kind === 'all_reduce') {
      return (
        <g>
          <line
            x1={allGpuLeft + 30} x2={allGpuRight - 30}
            y1={COMM_Y} y2={COMM_Y}
            className={styles.commLineAllReduce}
            style={{ stroke: strategy.color }}
            markerStart="url(#leftArrow)"
            markerEnd="url(#rightArrow)"
          />
          <text x={allGpuCenter} y={COMM_Y + 22} className={styles.commLabel} textAnchor="middle" fill={strategy.color}>
            {comm.label}
          </text>
        </g>
      );
    }

    if (comm.kind === 'peer_to_peer') {
      return (
        <g>
          {Array.from({ length: N_GPUS - 1 }, (_, i) => {
            const x1 = gpuX(i) + GPU_WIDTH;
            const x2 = gpuX(i + 1);
            return (
              <line
                key={i}
                x1={x1 + 4} x2={x2 - 4}
                y1={COMM_Y} y2={COMM_Y}
                className={styles.commLinePeerToPeer}
                style={{ stroke: strategy.color }}
                markerEnd="url(#rightArrow)"
              />
            );
          })}
          <text x={allGpuCenter} y={COMM_Y + 22} className={styles.commLabel} textAnchor="middle" fill={strategy.color}>
            {comm.label}
          </text>
        </g>
      );
    }

    if (comm.kind === 'all_gather') {
      return (
        <g>
          <line
            x1={allGpuLeft + 30} x2={allGpuRight - 30}
            y1={COMM_Y} y2={COMM_Y}
            className={styles.commLineGather}
            style={{ stroke: strategy.color }}
            markerStart="url(#leftArrow)"
            markerEnd="url(#rightArrow)"
          />
          <text x={allGpuCenter} y={COMM_Y + 22} className={styles.commLabel} textAnchor="middle" fill={strategy.color}>
            {comm.label}
          </text>
        </g>
      );
    }

    // reduce_scatter
    return (
      <g>
        <line
          x1={allGpuLeft + 30} x2={allGpuRight - 30}
          y1={COMM_Y + 16} y2={COMM_Y + 16}
          className={styles.commLineScatter}
          style={{ stroke: strategy.color }}
          markerStart="url(#leftArrow)"
          markerEnd="url(#rightArrow)"
        />
        <text x={allGpuCenter} y={COMM_Y + 38} className={styles.commLabel} textAnchor="middle" fill={strategy.color}>
          {comm.label}
        </text>
      </g>
    );
  }

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.svg} role="img" aria-label={`${strategy.label} diagram`}>
      <defs>
        <marker id="rightArrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <polygon points="0 0, 8 4, 0 8" fill={strategy.color} />
        </marker>
        <marker id="leftArrow" markerWidth="8" markerHeight="8" refX="2" refY="4" orient="auto">
          <polygon points="8 0, 0 4, 8 8" fill={strategy.color} />
        </marker>
      </defs>

      {strategy.gpuColumns.map((col, idx) => (
        <g key={`data-${idx}`}>
          <rect
            x={gpuX(idx) + 10}
            y={TOP_DATA_Y}
            width={GPU_WIDTH - 20}
            height={TOP_DATA_HEIGHT}
            className={styles.dataBlock}
            fill={col.data === 'full'
              ? `color-mix(in srgb, ${strategy.color} 35%, transparent)`
              : `color-mix(in srgb, ${strategy.color} 20%, transparent)`}
            stroke={strategy.color}
          />
          <text x={gpuX(idx) + GPU_WIDTH / 2} y={TOP_DATA_Y + 15} className={styles.dataLabel} textAnchor="middle">
            {col.dataLabel}
          </text>
          <line
            x1={gpuX(idx) + GPU_WIDTH / 2} x2={gpuX(idx) + GPU_WIDTH / 2}
            y1={ARROW_DOWN_TOP} y2={ARROW_DOWN_BOTTOM}
            className={styles.dataArrow}
            stroke={strategy.color}
            markerEnd="url(#rightArrow)"
          />
        </g>
      ))}

      {strategy.gpuColumns.map((col, idx) => (
        <g key={`gpu-${idx}`}>
          <rect
            x={gpuX(idx)} y={GPU_TOP}
            width={GPU_WIDTH} height={GPU_HEIGHT}
            rx={6}
            className={styles.gpuBox}
          />
          <text x={gpuX(idx) + GPU_WIDTH / 2} y={GPU_TOP + 20} className={styles.gpuLabel} textAnchor="middle">
            GPU {idx}
          </text>

          {col.layers.map((state, layerIdx) => (
            <LayerBlock
              key={layerIdx}
              x={gpuX(idx) + LAYER_PADDING}
              y={layerY(layerIdx)}
              width={GPU_WIDTH - 2 * LAYER_PADDING}
              height={LAYER_HEIGHT - 4}
              state={state}
              layerIdx={layerIdx}
              gpuIdx={idx}
              color={strategy.color}
            />
          ))}
        </g>
      ))}

      {strategy.comms.map((comm, idx) => (
        <CommunicationArrow key={idx} comm={comm} />
      ))}
    </svg>
  );
}

interface LayerBlockProps {
  x: number;
  y: number;
  width: number;
  height: number;
  state: LayerState;
  layerIdx: number;
  gpuIdx: number;
  color: string;
}

function LayerBlock({ x, y, width, height, state, layerIdx, gpuIdx, color }: LayerBlockProps) {
  const labelX = x + width / 2;
  const labelY = y + height / 2 + 4;

  if (state === 'empty') {
    return (
      <g>
        <rect
          x={x} y={y}
          width={width} height={height}
          rx={3}
          className={styles.layerEmpty}
        />
        <text x={labelX} y={labelY} className={styles.layerLabelEmpty} textAnchor="middle">
          —
        </text>
      </g>
    );
  }

  if (state === 'shard') {
    return (
      <g>
        {Array.from({ length: 4 }, (_, i) => {
          const stripeW = (width - 4) / 4;
          const stripeX = x + 2 + i * stripeW;
          const isMyShard = i === gpuIdx;
          return (
            <rect
              key={i}
              x={stripeX} y={y + 2}
              width={stripeW - 1} height={height - 4}
              fill={isMyShard ? color : `color-mix(in srgb, ${color} 15%, transparent)`}
              opacity={isMyShard ? 0.85 : 0.3}
            />
          );
        })}
        <text x={labelX} y={labelY} className={styles.layerLabel} textAnchor="middle">
          L{layerIdx} (1/4)
        </text>
      </g>
    );
  }

  // state === 'full'
  return (
    <g>
      <rect
        x={x} y={y}
        width={width} height={height}
        rx={3}
        fill={color}
        opacity={0.85}
      />
      <text x={labelX} y={labelY} className={styles.layerLabel} textAnchor="middle">
        L{layerIdx}
      </text>
    </g>
  );
}

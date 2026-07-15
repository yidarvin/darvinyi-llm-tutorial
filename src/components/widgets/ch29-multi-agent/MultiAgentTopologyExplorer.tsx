import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  MATURITY,
  ROLE_COLORS,
  TOPOLOGIES,
  type AgentTopology,
  type DiagramEdge,
  type DiagramNode,
} from './topology-data';
import styles from './MultiAgentTopologyExplorer.module.css';

const VIEW_W = 700;
const VIEW_H = 320;
const NODE_W = 92;
const NODE_H = 42;

function nodeX(node: DiagramNode): number { return node.x * VIEW_W; }
function nodeY(node: DiagramNode): number { return node.y * VIEW_H; }

interface EdgePath {
  d: string;
  labelX: number;
  labelY: number;
  isLoop: boolean;
  label?: string;
}

function buildEdgePath(edge: DiagramEdge, nodeMap: Map<string, DiagramNode>): EdgePath | null {
  const from = nodeMap.get(edge.from);
  const to = nodeMap.get(edge.to);
  if (!from || !to) return null;

  const x1 = nodeX(from);
  const y1 = nodeY(from);
  const x2 = nodeX(to);
  const y2 = nodeY(to);

  if (edge.loop) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const offsetX = (-dy / len) * 40;
    const offsetY = (dx / len) * 40;
    const cx = midX + offsetX;
    const cy = midY + offsetY;
    return {
      d: `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`,
      labelX: cx,
      labelY: cy,
      isLoop: true,
      label: edge.label,
    };
  }
  return {
    d: `M ${x1} ${y1} L ${x2} ${y2}`,
    labelX: (x1 + x2) / 2,
    labelY: (y1 + y2) / 2 - 6,
    isLoop: false,
    label: edge.label,
  };
}

function TopologyDiagram({ topology }: { topology: AgentTopology }) {
  const nodeMap = useMemo(() => {
    const m = new Map<string, DiagramNode>();
    topology.diagram.nodes.forEach(n => m.set(n.id, n));
    return m;
  }, [topology]);

  const edgePaths = useMemo(() => {
    return topology.diagram.edges
      .map(e => buildEdgePath(e, nodeMap))
      .filter((p): p is EdgePath => p !== null);
  }, [topology, nodeMap]);

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={styles.diagramSvg}
      role="img"
      aria-label={`Diagram of ${topology.label}`}
    >
      <defs>
        <marker
          id="ch29-topology-arrowhead"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-secondary)" />
        </marker>
      </defs>

      {edgePaths.map((ep, i) => (
        <g key={i}>
          <path
            d={ep.d}
            className={ep.isLoop ? styles.edgeLoop : styles.edge}
            markerEnd="url(#ch29-topology-arrowhead)"
          />
          {ep.label && (
            <text x={ep.labelX} y={ep.labelY} className={styles.edgeLabel}>
              {ep.label}
            </text>
          )}
        </g>
      ))}

      {topology.diagram.nodes.map(node => {
        const x = nodeX(node);
        const y = nodeY(node);
        const color = ROLE_COLORS[node.role];
        const lines = node.label.split('\n');
        return (
          <g key={node.id}>
            <rect
              x={x - NODE_W / 2}
              y={y - NODE_H / 2}
              width={NODE_W}
              height={NODE_H}
              rx={6}
              fill={`color-mix(in srgb, ${color} 14%, var(--bg-elevated))`}
              stroke={color}
              strokeWidth={1.5}
            />
            {lines.map((line, i) => (
              <text
                key={i}
                x={x}
                y={y + (i - (lines.length - 1) / 2) * 13 + 4}
                className={styles.nodeLabel}
                textAnchor="middle"
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function complexityFor(id: string): string {
  switch (id) {
    case 'single-agent-baseline': return 'low';
    case 'manager-worker':        return 'medium';
    case 'peer-to-peer':          return 'high';
    case 'hierarchical':          return 'very high';
    case 'proposer-critic-judge': return 'medium';
    default:                      return 'N/A';
  }
}

function useWhenFor(id: string): string {
  switch (id) {
    case 'single-agent-baseline': return 'most tasks (the default)';
    case 'manager-worker':        return 'task decomposition';
    case 'peer-to-peer':          return 'debate / adversarial';
    case 'hierarchical':          return 'research; rare in production';
    case 'proposer-critic-judge': return 'adversarial role specialization';
    default:                      return 'N/A';
  }
}

export default function MultiAgentTopologyExplorer() {
  const [idx, setIdx] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const tabIdPrefix = useId();
  const panelId = useId();
  const topology = TOPOLOGIES[idx]!;
  const maturity = MATURITY[topology.maturity];

  function selectTopology(nextIdx: number) {
    setIdx(nextIdx);
  }

  function handleTopologyKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentIdx: number) {
    let nextIdx: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
        nextIdx = (currentIdx + 1) % TOPOLOGIES.length;
        break;
      case 'ArrowLeft':
        nextIdx = (currentIdx - 1 + TOPOLOGIES.length) % TOPOLOGIES.length;
        break;
      case 'Home':
        nextIdx = 0;
        break;
      case 'End':
        nextIdx = TOPOLOGIES.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    selectTopology(nextIdx);
    requestAnimationFrame(() => tabRefs.current[nextIdx]?.focus());
  }

  return (
    <div className={styles.widget}>
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Multi-agent topology explorer</div>
        <div className={styles.titleSubLabel}>
          {TOPOLOGIES.length} architectures · single-agent baseline first · pick for detail
        </div>
      </div>

      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Pick an architecture:</span>
          <div className={styles.topologyButtons} role="tablist" aria-label="Agent architectures">
            {TOPOLOGIES.map((t, i) => (
              <button
                key={t.id}
                ref={element => { tabRefs.current[i] = element; }}
                id={`${tabIdPrefix}-${t.id}`}
                role="tab"
                aria-selected={idx === i}
                aria-controls={panelId}
                tabIndex={idx === i ? 0 : -1}
                className={`${styles.topologyButton} ${idx === i ? styles.topologyButtonActive : ''}`}
                style={{ borderLeftColor: MATURITY[t.maturity].color }}
                onClick={() => selectTopology(i)}
                onKeyDown={event => handleTopologyKeyDown(event, i)}
              >
                {t.shortLabel}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        id={panelId}
        className={styles.detailPanel}
        role="tabpanel"
        aria-labelledby={`${tabIdPrefix}-${topology.id}`}
        tabIndex={0}
      >
        <div className={styles.detailHeader}>
          <div className={styles.detailTitle}>{topology.label.toUpperCase()}</div>
          <div
            className={styles.maturityBadge}
            style={{
              background: `color-mix(in srgb, ${maturity.color} 18%, transparent)`,
              color: maturity.color,
              borderColor: `color-mix(in srgb, ${maturity.color} 40%, transparent)`,
            }}
          >
            {maturity.label}
          </div>
        </div>

        <div className={styles.descriptionText}>{topology.description}</div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Diagram</div>
          <div className={styles.diagramContainer}>
            <TopologyDiagram topology={topology} />
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Use cases</div>
          <ul className={styles.useCases}>
            {topology.useCases.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Tradeoffs</div>
          <div className={styles.tradeoffs}>
            <div className={styles.tradeoffColumn}>
              <div className={styles.tradeoffHeader}>Pros</div>
              <ul className={`${styles.tradeoffList} ${styles.tradeoffPros}`}>
                {topology.tradeoffs.pros.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
            <div className={styles.tradeoffColumn}>
              <div className={styles.tradeoffHeader}>Cons</div>
              <ul className={`${styles.tradeoffList} ${styles.tradeoffCons}`}>
                {topology.tradeoffs.cons.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Example task</div>
          <div className={styles.exampleTaskBox}>{topology.exampleTask}</div>
        </div>
      </div>

      <div className={styles.comparisonPanel}>
        <div className={styles.sectionLabel}>Quick comparison</div>
        <table className={styles.comparisonTable}>
          <thead>
            <tr>
              <th>Topology</th>
              <th>Maturity</th>
              <th>Complexity</th>
              <th>Use it when...</th>
            </tr>
          </thead>
          <tbody>
            {TOPOLOGIES.map((t, i) => (
              <tr
                key={t.id}
                className={i === idx ? styles.comparisonRowActive : ''}
                onClick={() => setIdx(i)}
              >
                <td>{t.shortLabel}</td>
                <td>
                  <span
                    className={styles.maturityDot}
                    style={{ background: MATURITY[t.maturity].color }}
                  />
                  {MATURITY[t.maturity].label}
                </td>
                <td>{complexityFor(t.id)}</td>
                <td>{useWhenFor(t.id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.caption}>
        <strong>Single-agent baseline is the chapter's recommended default</strong>, listed first
        deliberately. Most "I want multi-agent" instincts are better served by a well-designed
        single-agent ReAct loop with the right tools. <strong>Manager-worker</strong> earns its
        place when task decomposition is the main value-add. <strong>Peer-to-peer</strong> shines
        in debate / adversarial workflows (Du et al. 2023 showed measurable accuracy gains).{' '}
        <strong>Hierarchical</strong> is mostly research demos.{' '}
        <strong>Proposer-critic-judge</strong> is the most useful pure multi-agent pattern in
        practice: adversarial role specialization with measurable quality gains.{' '}
        <strong>The widget's framing reflects the chapter's central honest claim</strong>:
        multi-agent is real and useful in narrow cases, dramatically overused everywhere else.
      </div>
    </div>
  );
}

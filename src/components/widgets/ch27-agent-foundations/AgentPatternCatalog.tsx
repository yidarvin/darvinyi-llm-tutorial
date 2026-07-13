import { useMemo, useState } from 'react';
import {
  MATURITY,
  PATTERNS,
  ROLE_COLORS,
  type AgentPattern,
  type DiagramEdge,
  type DiagramNode,
} from './pattern-data';
import styles from './AgentPatternCatalog.module.css';

const VIEW_W = 700;
const VIEW_H = 300;
const NODE_W = 90;
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
    const offsetX = (-dy / len) * 38;
    const offsetY = (dx / len) * 38;
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

function PatternDiagram({ pattern }: { pattern: AgentPattern }) {
  const nodeMap = useMemo(() => {
    const m = new Map<string, DiagramNode>();
    pattern.diagram.nodes.forEach(n => m.set(n.id, n));
    return m;
  }, [pattern]);

  const edgePaths = useMemo(() => {
    return pattern.diagram.edges
      .map(e => buildEdgePath(e, nodeMap))
      .filter((p): p is EdgePath => p !== null);
  }, [pattern, nodeMap]);

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={styles.diagramSvg}
      role="img"
      aria-label={`Diagram of ${pattern.label}`}
    >
      <defs>
        <marker
          id="agent-pattern-arrowhead"
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
            markerEnd="url(#agent-pattern-arrowhead)"
          />
          {ep.label && (
            <text x={ep.labelX} y={ep.labelY} className={styles.edgeLabel}>
              {ep.label}
            </text>
          )}
        </g>
      ))}

      {pattern.diagram.nodes.map(node => {
        const x = nodeX(node);
        const y = nodeY(node);
        const color = ROLE_COLORS[node.role];
        const lines = node.label.split('\\n');
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

const COMPLEXITY: Record<string, string> = {
  'single-linear':   'simple',
  'react-iterative': 'medium',
  'hierarchical':    'high',
  'reflexion':       'high',
  'multi-agent':     'very high',
};

const USE_WHEN: Record<string, string> = {
  'single-linear':   'one-shot tasks',
  'react-iterative': 'multi-step tasks',
  'hierarchical':    'complex workflows',
  'reflexion':       'iterative on failure',
  'multi-agent':     'specialized teams',
};

export default function AgentPatternCatalog() {
  const [idx, setIdx] = useState(1);
  const pattern = PATTERNS[idx]!;
  const maturity = MATURITY[pattern.maturity];

  return (
    <div className={styles.widget}>
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Agent pattern catalog</div>
        <div className={styles.titleSubLabel}>
          {PATTERNS.length} patterns · pick one for full detail
        </div>
      </div>

      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Pick a pattern:</span>
          <div className={styles.patternButtons}>
            {PATTERNS.map((p, i) => (
              <button
                key={p.id}
                className={`${styles.patternButton} ${idx === i ? styles.patternButtonActive : ''}`}
                style={{ borderLeftColor: MATURITY[p.maturity].color }}
                onClick={() => setIdx(i)}
              >
                {p.shortLabel}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.detailPanel}>
        <div className={styles.detailHeader}>
          <div className={styles.detailTitle}>{pattern.label.toUpperCase()}</div>
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

        <div className={styles.descriptionText}>{pattern.description}</div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Diagram</div>
          <div className={styles.diagramContainer}>
            <PatternDiagram pattern={pattern} />
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Use cases</div>
          <ul className={styles.useCases}>
            {pattern.useCases.map((u, i) => (
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
                {pattern.tradeoffs.pros.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
            <div className={styles.tradeoffColumn}>
              <div className={styles.tradeoffHeader}>Cons</div>
              <ul className={`${styles.tradeoffList} ${styles.tradeoffCons}`}>
                {pattern.tradeoffs.cons.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Example task</div>
          <div className={styles.exampleTaskBox}>{pattern.exampleTask}</div>
        </div>
      </div>

      <div className={styles.comparisonPanel}>
        <div className={styles.sectionLabel}>Quick comparison</div>
        <table className={styles.comparisonTable}>
          <thead>
            <tr>
              <th>Pattern</th>
              <th>Maturity</th>
              <th>Complexity</th>
              <th>Use it when...</th>
            </tr>
          </thead>
          <tbody>
            {PATTERNS.map((p, i) => (
              <tr
                key={p.id}
                className={i === idx ? styles.comparisonRowActive : ''}
                onClick={() => setIdx(i)}
                style={{ cursor: 'pointer' }}
              >
                <td>{p.shortLabel}</td>
                <td>
                  <span
                    className={styles.maturityDot}
                    style={{ background: MATURITY[p.maturity].color }}
                  />
                  {MATURITY[p.maturity].label}
                </td>
                <td>{COMPLEXITY[p.id]}</td>
                <td>{USE_WHEN[p.id]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.caption}>
        <strong>"Agent" isn't one architecture</strong>, it's a family of them. <strong>Linear</strong>{' '}
        for simple one-shots; <strong>ReAct</strong> as the modern default for multi-step tasks;{' '}
        <strong>Hierarchical</strong> when planning matters; <strong>Reflexion</strong> when you can
        get failure signal; <strong>Multi-agent</strong> when specialization helps. <strong>Most
        production agents are single-agent (linear or ReAct)</strong>; multi-agent earns its keep
        only when the task truly decomposes. Chapter 28 builds these in real code; Chapter 29 dives
        deep into multi-agent.
      </div>
    </div>
  );
}

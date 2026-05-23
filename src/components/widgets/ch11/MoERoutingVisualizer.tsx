import { useMemo, useState } from 'react';
import {
  EXPERTS, TOKENS, routeAllTokens, type RoutingDecision,
} from './routing-data';
import styles from './MoERoutingVisualizer.module.css';

export default function MoERoutingVisualizer() {
  const [k, setK] = useState(2);
  const [hoveredToken, setHoveredToken] = useState<number | null>(null);
  const [hoveredExpert, setHoveredExpert] = useState<number | null>(null);
  const [pinnedToken, setPinnedToken] = useState<number | null>(2);

  const { decisions, expertLoads } = useMemo(() => routeAllTokens(TOKENS, k), [k]);

  const activeTokenIdx = hoveredToken ?? pinnedToken;
  const activeDecision = activeTokenIdx !== null ? decisions[activeTokenIdx] : null;
  const activeToken = activeTokenIdx !== null ? TOKENS[activeTokenIdx] : null;
  const activeExpert = hoveredExpert;

  function isHighlighted(tokenIdx: number, expertIdx: number): boolean {
    if (activeExpert !== null) return expertIdx === activeExpert;
    if (activeTokenIdx !== null) return tokenIdx === activeTokenIdx;
    return true;
  }

  function isDimmed(tokenIdx: number, expertIdx: number): boolean {
    if (activeExpert !== null) return expertIdx !== activeExpert;
    if (activeTokenIdx !== null) return tokenIdx !== activeTokenIdx;
    return false;
  }

  return (
    <div className={styles.widget}>
      <div className={styles.kToggle}>
        <span className={styles.kToggleLabel}>Top-k routing:</span>
        {[1, 2, 4].map(kv => (
          <button
            key={kv}
            className={`${styles.kButton} ${k === kv ? styles.kButtonActive : ''}`}
            onClick={() => setK(kv)}
          >
            Top-{kv}
          </button>
        ))}
      </div>

      <div className={styles.diagramPanel}>
        <DiagramSvg
          decisions={decisions}
          k={k}
          isHighlighted={isHighlighted}
          isDimmed={isDimmed}
          activeExpert={activeExpert}
          onTokenHover={setHoveredToken}
          onTokenClick={i => setPinnedToken(i)}
          onExpertHover={setHoveredExpert}
        />
      </div>

      <div className={styles.loadPanel}>
        <div className={styles.loadTitle}>Load distribution (tokens routed per expert at top-{k})</div>
        {EXPERTS.map(e => {
          const load = expertLoads[e.index]!;
          const totalAssignments = TOKENS.length * k;
          const pct = (load / totalAssignments) * 100;
          const isUnused = load === 0;
          return (
            <div key={e.index} className={styles.loadRow}>
              <span className={styles.loadLabel}>E{e.index}</span>
              <div className={styles.loadBarTrack}>
                <div
                  className={`${styles.loadBarFill} ${isUnused ? styles.loadBarFillUnused : ''}`}
                  style={{ width: `${Math.max(pct, 1)}%` }}
                />
              </div>
              <span className={styles.loadCount}>{load}</span>
              {isUnused && <span className={styles.loadUnusedBadge}>✗ under-utilized</span>}
            </div>
          );
        })}
      </div>

      {activeDecision && activeToken && (
        <div className={styles.selectedPanel}>
          <div className={styles.selectedTitle}>
            {hoveredToken !== null ? 'Hovered' : 'Selected'} token: <strong>{activeToken.text}</strong>
            <span className={styles.selectedCategory}>({activeToken.category})</span>
          </div>
          <div className={styles.selectedRouting}>
            Top-{k} routing: experts{' '}
            <strong>[{activeDecision.topKIndices.join(', ')}]</strong>
            {' '}with gates{' '}
            <strong>[{activeDecision.gates.map(g => g.toFixed(2)).join(', ')}]</strong>
          </div>
          <div className={styles.selectedExplanation}>
            Expert {activeDecision.topKIndices[0]} ({EXPERTS[activeDecision.topKIndices[0]!]!.shortDescription}) is primary.
            {activeDecision.topKIndices.length > 1 && (
              <> Expert {activeDecision.topKIndices[1]} ({EXPERTS[activeDecision.topKIndices[1]!]!.shortDescription}) is secondary.</>
            )}
            {' '}Expert specialization emerged from training, not explicit assignment.
          </div>
        </div>
      )}
    </div>
  );
}

interface DiagramProps {
  decisions: RoutingDecision[];
  k: number;
  isHighlighted: (tokenIdx: number, expertIdx: number) => boolean;
  isDimmed: (tokenIdx: number, expertIdx: number) => boolean;
  activeExpert: number | null;
  onTokenHover: (idx: number | null) => void;
  onTokenClick: (idx: number) => void;
  onExpertHover: (idx: number | null) => void;
}

function DiagramSvg(props: DiagramProps) {
  const { decisions, isHighlighted, isDimmed, onTokenHover, onTokenClick, onExpertHover } = props;

  const WIDTH = 760;
  const HEIGHT = 540;
  const TOKEN_COL_X = 80;
  const EXPERT_COL_X = 600;
  const TOKEN_ROW_GAP = 30;
  const EXPERT_ROW_GAP = 56;
  const TOKEN_TOP = 30;
  const EXPERT_TOP = 50;

  function tokenY(idx: number): number {
    return TOKEN_TOP + idx * TOKEN_ROW_GAP;
  }
  function expertY(idx: number): number {
    return EXPERT_TOP + idx * EXPERT_ROW_GAP;
  }

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.svg} role="img" aria-label="MoE routing visualizer">
      {decisions.map((d, tokenIdx) =>
        d.topKIndices.map((expertIdx, j) => {
          const gate = d.gates[j]!;
          const tY = tokenY(tokenIdx);
          const eY = expertY(expertIdx);
          const cx1 = TOKEN_COL_X + 200;
          const cx2 = EXPERT_COL_X - 200;
          const pathD = `M ${TOKEN_COL_X + 50} ${tY} C ${cx1} ${tY}, ${cx2} ${eY}, ${EXPERT_COL_X - 5} ${eY}`;

          const highlighted = isHighlighted(tokenIdx, expertIdx);
          const dimmed = isDimmed(tokenIdx, expertIdx);

          return (
            <path
              key={`curve-${tokenIdx}-${expertIdx}`}
              d={pathD}
              className={`${styles.routingCurve} ${highlighted ? styles.curveHighlighted : ''} ${dimmed ? styles.curveDimmed : ''}`}
              style={{
                strokeWidth: 1 + gate * 3,
                stroke: dimmed ? 'var(--border-subtle)' : 'var(--cyan-400)',
                opacity: dimmed ? 0.15 : 0.4 + gate * 0.5,
              }}
            />
          );
        })
      )}

      {TOKENS.map((token, idx) => (
        <g key={`token-${idx}`}
           className={styles.tokenGroup}
           onMouseEnter={() => onTokenHover(idx)}
           onMouseLeave={() => onTokenHover(null)}
           onClick={() => onTokenClick(idx)}
           style={{ cursor: 'pointer' }}
        >
          <rect
            x={TOKEN_COL_X - 50} y={tokenY(idx) - 10}
            width={100} height={20}
            rx={3}
            className={styles.tokenBox}
          />
          <text
            x={TOKEN_COL_X} y={tokenY(idx) + 4}
            className={styles.tokenLabel}
            textAnchor="middle"
          >
            {token.text}
          </text>
        </g>
      ))}

      {EXPERTS.map((expert, idx) => {
        const eY = expertY(idx);
        const expertLoad = decisions.filter(d => d.topKIndices.includes(idx)).length;
        const isUnused = expertLoad === 0;
        return (
          <g key={`expert-${idx}`}
             className={styles.expertGroup}
             onMouseEnter={() => onExpertHover(idx)}
             onMouseLeave={() => onExpertHover(null)}
             style={{ cursor: 'pointer' }}
          >
            <rect
              x={EXPERT_COL_X} y={eY - 22}
              width={140} height={44}
              rx={5}
              className={`${styles.expertBox} ${isUnused ? styles.expertBoxUnused : ''}`}
            />
            <text x={EXPERT_COL_X + 70} y={eY - 5} className={styles.expertLabel} textAnchor="middle">
              {expert.label}
            </text>
            <text x={EXPERT_COL_X + 70} y={eY + 12} className={styles.expertSubLabel} textAnchor="middle">
              {expert.shortDescription}
            </text>
            {isUnused && (
              <text x={EXPERT_COL_X + 145} y={eY} className={styles.expertUnusedFlag} fontSize="14">
                ✗
              </text>
            )}
          </g>
        );
      })}

      <text x={TOKEN_COL_X} y={HEIGHT - 10} className={styles.colHeader} textAnchor="middle">Tokens</text>
      <text x={EXPERT_COL_X + 70} y={HEIGHT - 10} className={styles.colHeader} textAnchor="middle">Experts</text>
    </svg>
  );
}

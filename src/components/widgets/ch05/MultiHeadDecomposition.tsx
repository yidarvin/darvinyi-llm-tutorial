import { useState } from 'react';
import {
  TOKENS,
  HEADS,
  PER_HEAD_OUTPUT_SUMMARY,
  COMBINED_OUTPUT_SUMMARY,
} from './multihead-data';
import styles from './MultiHeadDecomposition.module.css';

interface HoverState {
  matrix: string;
  i: number;
  j: number;
  v: number;
}

export default function MultiHeadDecomposition() {
  const [focusedHeadId, setFocusedHeadId] = useState<string | null>(null);
  const [hovered, setHovered] = useState<HoverState | null>(null);

  function toggleHead(id: string) {
    setFocusedHeadId(prev => (prev === id ? null : id));
  }

  const focusedHead = focusedHeadId ? HEADS.find(h => h.id === focusedHeadId) ?? null : null;

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <div className={styles.title}>
          {focusedHead ? `Focused: ${focusedHead.label}` : 'All 4 heads — click any to focus'}
        </div>
        {focusedHead && (
          <button
            onClick={() => setFocusedHeadId(null)}
            className={styles.showAllButton}
            type="button"
          >
            Show all heads
          </button>
        )}
      </div>

      <div className={styles.inputRow}>
        <span className={styles.inputLabel}>Input:</span>
        {TOKENS.map((t, i) => (
          <code key={i} className={styles.tokenChip}>{t}</code>
        ))}
      </div>

      <div className={styles.headGrid}>
        {HEADS.map(head => {
          const isFocused = focusedHead?.id === head.id;
          const isOtherFocused = focusedHead !== null && focusedHead.id !== head.id;
          return (
            <div
              key={head.id}
              className={`${styles.headCell} ${isFocused ? styles.headCellFocused : ''} ${isOtherFocused ? styles.headCellDimmed : ''}`}
              onClick={() => toggleHead(head.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleHead(head.id);
                }
              }}
              role="button"
              tabIndex={0}
              aria-pressed={isFocused}
            >
              <div className={styles.headLabel}>{head.label}</div>
              <AttentionGrid
                weights={head.attention}
                tokens={TOKENS}
                matrixLabel={head.shortLabel}
                setHovered={setHovered}
              />
            </div>
          );
        })}
      </div>

      <div className={styles.compositeRow}>
        <div className={styles.compositePanel}>
          <div className={styles.panelTitle}>Per-head outputs (concatenated)</div>
          <div
            className={styles.outputTable}
            style={{ gridTemplateColumns: `auto repeat(${HEADS.length}, 1fr)` }}
          >
            <div className={styles.outputCellHeader}></div>
            {HEADS.map(h => (
              <div key={h.id} className={styles.outputCellHeader}>{h.shortLabel}</div>
            ))}
            {TOKENS.map((token, i) => (
              <RowFragment key={i} rowLabel={token}>
                {PER_HEAD_OUTPUT_SUMMARY[i]!.map((v, j) => (
                  <div
                    key={j}
                    className={styles.outputCell}
                    style={{ backgroundColor: `rgba(34, 211, 238, ${v.toFixed(3)})` }}
                    onMouseEnter={() => setHovered({ matrix: 'per-head', i, j, v })}
                    onMouseLeave={() => setHovered(null)}
                    title={`Token "${token}", ${HEADS[j]!.shortLabel}: ${v.toFixed(3)}`}
                  />
                ))}
              </RowFragment>
            ))}
          </div>
          <div className={styles.panelHint}>
            shape: (6 tokens) × (4 heads × d_v) → flattened to (6, d_model)
          </div>
        </div>
        <div className={styles.arrow}>
          ↓ W<sup>O</sup>
        </div>
        <div className={styles.compositePanel}>
          <div className={styles.panelTitle}>Final output (after projection)</div>
          <div
            className={styles.outputTable}
            style={{ gridTemplateColumns: 'auto 1fr' }}
          >
            <div className={styles.outputCellHeader}></div>
            <div className={styles.outputCellHeader}>summary</div>
            {TOKENS.map((token, i) => (
              <RowFragment key={i} rowLabel={token}>
                <div
                  className={styles.outputCell}
                  style={{ backgroundColor: `rgba(34, 211, 238, ${COMBINED_OUTPUT_SUMMARY[i]!.toFixed(3)})` }}
                  onMouseEnter={() => setHovered({ matrix: 'final', i, j: 0, v: COMBINED_OUTPUT_SUMMARY[i]! })}
                  onMouseLeave={() => setHovered(null)}
                  title={`Token "${token}", final: ${COMBINED_OUTPUT_SUMMARY[i]!.toFixed(3)}`}
                />
              </RowFragment>
            ))}
          </div>
          <div className={styles.panelHint}>shape: (6, d_model)</div>
        </div>
      </div>

      <div className={styles.description} aria-live="polite">
        {focusedHead ? (
          <>
            <strong>{focusedHead.label}:</strong> {focusedHead.description}
          </>
        ) : (
          <>
            <strong>Four parallel attention heads.</strong> Each head has its own learned{' '}
            <code>W<sup>Q</sup></code>, <code>W<sup>K</sup></code>, <code>W<sup>V</sup></code>{' '}
            projections, so each produces a different attention pattern from the same input. Click
            any head to inspect it. After per-head attention, the outputs are concatenated along
            the feature dim and projected through <code>W<sup>O</sup></code>.
          </>
        )}
      </div>

      {hovered && (
        <div className={styles.hoverReadout}>
          {hovered.matrix === 'per-head' ? (
            <>
              {HEADS[hovered.j]!.shortLabel}[{TOKENS[hovered.i]}] ={' '}
              <strong>{hovered.v.toFixed(3)}</strong>
            </>
          ) : hovered.matrix === 'final' ? (
            <>
              final[{TOKENS[hovered.i]}] = <strong>{hovered.v.toFixed(3)}</strong>
            </>
          ) : (
            <>
              {hovered.matrix}[{TOKENS[hovered.i]}, {TOKENS[hovered.j]}] ={' '}
              <strong>{hovered.v.toFixed(3)}</strong>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AttentionGrid({
  weights,
  tokens,
  matrixLabel,
  setHovered,
}: {
  weights: number[][];
  tokens: string[];
  matrixLabel: string;
  setHovered: (h: HoverState | null) => void;
}) {
  return (
    <div
      className={styles.gridContainer}
      style={{ gridTemplateColumns: `auto repeat(${tokens.length}, 1fr)` }}
    >
      <div></div>
      {tokens.map((t, j) => (
        <div key={j} className={styles.colLabel}>{t}</div>
      ))}
      {weights.map((row, i) => (
        <RowFragment key={i} rowLabel={tokens[i]!}>
          {row.map((v, j) => (
            <div
              key={j}
              className={styles.attCell}
              style={{ backgroundColor: `rgba(34, 211, 238, ${v.toFixed(3)})` }}
              onMouseEnter={() => setHovered({ matrix: matrixLabel, i, j, v })}
              onMouseLeave={() => setHovered(null)}
              title={`${matrixLabel}: ${tokens[i]} → ${tokens[j]} = ${v.toFixed(3)}`}
            />
          ))}
        </RowFragment>
      ))}
    </div>
  );
}

function RowFragment({ rowLabel, children }: { rowLabel: string; children: React.ReactNode }) {
  return (
    <>
      <div className={styles.rowLabel}>{rowLabel}</div>
      {children}
    </>
  );
}

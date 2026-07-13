import { useState } from 'react';
import {
  TOKENS,
  ATTENTION_WEIGHTS,
  MASKED_ATTENTION_WEIGHTS,
  CAUSAL_MASK_DISPLAY,
} from './attention-data';
import styles from './CausalMask.module.css';

type MaskMode = 'bidirectional' | 'causal';

type Hovered = { matrix: string; i: number; j: number; v: number } | null;

export default function CausalMask() {
  const [mode, setMode] = useState<MaskMode>('bidirectional');
  const [hovered, setHovered] = useState<Hovered>(null);

  return (
    <div className={styles.widget}>
      <div className={styles.toggleRow}>
        <span className={styles.toggleLabel}>Attention mode:</span>
        <button
          onClick={() => setMode('bidirectional')}
          className={`${styles.toggleButton} ${mode === 'bidirectional' ? styles.toggleButtonActive : ''}`}
          aria-pressed={mode === 'bidirectional'}
        >
          Bidirectional (no mask)
        </button>
        <button
          onClick={() => setMode('causal')}
          className={`${styles.toggleButton} ${mode === 'causal' ? styles.toggleButtonActive : ''}`}
          aria-pressed={mode === 'causal'}
        >
          Causal masked
        </button>
      </div>

      <div className={`${styles.maskPanel} ${mode === 'causal' ? styles.maskPanelActive : styles.maskPanelDimmed}`}>
        <div className={styles.panelTitle}>Mask matrix (lower-triangular)</div>
        <MaskMatrixView
          tokens={TOKENS}
          mask={CAUSAL_MASK_DISPLAY}
          setHovered={setHovered}
        />
        <div className={styles.panelHint}>
          0 = allow attention · ⊥ (-∞) = blocked
        </div>
      </div>

      <div className={styles.attentionRow}>
        <div className={`${styles.attentionPanel} ${mode === 'bidirectional' ? styles.panelActive : styles.panelDimmed}`}>
          <div className={styles.panelTitle}>Bidirectional</div>
          <AttentionMatrixView
            tokens={TOKENS}
            weights={ATTENTION_WEIGHTS}
            label="bidirectional"
            setHovered={setHovered}
          />
          <div className={styles.panelHint}>
            Every row sums to 1; every position attends to all positions
          </div>
        </div>

        <div className={`${styles.attentionPanel} ${mode === 'causal' ? styles.panelActive : styles.panelDimmed}`}>
          <div className={styles.panelTitle}>Causal masked</div>
          <AttentionMatrixView
            tokens={TOKENS}
            weights={MASKED_ATTENTION_WEIGHTS}
            label="causal"
            setHovered={setHovered}
          />
          <div className={styles.panelHint}>
            Each row sums to 1; only positions ≤ row index get non-zero weight
          </div>
        </div>
      </div>

      <div className={styles.description} aria-live="polite">
        {mode === 'bidirectional' ? (
          <>
            <strong>Bidirectional attention:</strong> every position attends to every other position. Used in encoder models like BERT, where the model sees the entire sequence at once. Inappropriate for autoregressive generation: the model would "see" tokens it's supposed to predict.
          </>
        ) : (
          <>
            <strong>Causal-masked attention:</strong> position i may only attend to positions j ≤ i. Implemented by adding -∞ to the upper triangle of the scaled scores before softmax. exp(-∞) = 0, so blocked positions contribute exactly 0 weight. Required for autoregressive generation (GPT-style models).
          </>
        )}
      </div>

      {hovered && (
        <div className={styles.hoverReadout}>
          {hovered.matrix}[{hovered.i},{hovered.j}] = <strong>{hovered.v === -Infinity ? '-∞' : hovered.v.toFixed(3)}</strong>
        </div>
      )}
    </div>
  );
}

function MaskMatrixView({ tokens, mask, setHovered }: {
  tokens: string[];
  mask: number[][];
  setHovered: (h: Hovered) => void;
}) {
  return (
    <div className={styles.matrixGrid} style={{ gridTemplateColumns: `auto repeat(${tokens.length}, 32px)` }}>
      <div></div>
      {tokens.map((t, j) => <div key={j} className={styles.colLabel}>{t}</div>)}
      {mask.map((row, i) => (
        <RowFragment key={i} rowLabel={tokens[i]!}>
          {row.map((v, j) => (
            <div
              key={j}
              className={styles.maskCell}
              style={{
                backgroundColor: v === 0
                  ? 'color-mix(in srgb, var(--emerald-500) 25%, transparent)'
                  : 'color-mix(in srgb, var(--rose-500) 25%, transparent)',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={() => setHovered({ matrix: 'mask', i, j, v: v === 0 ? 0 : -Infinity })}
              onMouseLeave={() => setHovered(null)}
              title={v === 0 ? `allow [${i},${j}]` : `block [${i},${j}] (-∞)`}
            >
              {v === 0 ? '0' : '⊥'}
            </div>
          ))}
        </RowFragment>
      ))}
    </div>
  );
}

function AttentionMatrixView({ tokens, weights, label, setHovered }: {
  tokens: string[];
  weights: number[][];
  label: string;
  setHovered: (h: Hovered) => void;
}) {
  return (
    <div className={styles.matrixGrid} style={{ gridTemplateColumns: `auto repeat(${tokens.length}, 32px)` }}>
      <div></div>
      {tokens.map((t, j) => <div key={j} className={styles.colLabel}>{t}</div>)}
      {weights.map((row, i) => (
        <RowFragment key={i} rowLabel={tokens[i]!}>
          {row.map((v, j) => (
            <div
              key={j}
              className={styles.cell}
              style={{ backgroundColor: `rgba(34, 211, 238, ${v.toFixed(3)})` }}
              onMouseEnter={() => setHovered({ matrix: label, i, j, v })}
              onMouseLeave={() => setHovered(null)}
              title={`${label}[${i},${j}] = ${v.toFixed(3)}`}
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

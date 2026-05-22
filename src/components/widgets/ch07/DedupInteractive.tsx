import { useState, useMemo } from 'react';
import { DOCS, SIMILARITY, clusterByThreshold, groupColor } from './dedup-data';
import styles from './DedupInteractive.module.css';

const DEFAULT_THRESHOLD = 0.5;

export default function DedupInteractive() {
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [hovered, setHovered] = useState<{ i: number; j: number; v: number } | null>(null);

  const clusters = useMemo(() => clusterByThreshold(threshold), [threshold]);
  const totalKept = clusters.length;
  const totalDiscarded = DOCS.length - totalKept;

  return (
    <div className={styles.widget}>
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            Similarity threshold: <span className={styles.controlValue}>{threshold.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={threshold}
            onChange={e => setThreshold(Number(e.target.value))}
            className={styles.slider}
            aria-label="Similarity threshold"
          />
          <div className={styles.sliderHints}>
            <span>0.0 (everything dups)</span>
            <span>1.0 (only exact)</span>
          </div>
        </div>
        <button onClick={() => setThreshold(DEFAULT_THRESHOLD)} className={styles.resetButton}>Reset</button>
      </div>

      <div className={styles.summary}>
        At threshold <strong>{threshold.toFixed(2)}</strong>: kept <strong>{totalKept}</strong> of {DOCS.length} documents ({totalDiscarded} discarded)
      </div>

      <div className={styles.panelTitle}>Documents (8 samples)</div>
      <div className={styles.docsList}>
        {DOCS.map(doc => (
          <div key={doc.id} className={styles.docRow}>
            <span
              className={styles.docGroupIndicator}
              style={{ backgroundColor: groupColor(doc.trueGroup) }}
              title={`True group: ${doc.trueGroup}`}
            />
            <span className={styles.docId}>ID {doc.id}</span>
            <span className={styles.docText}>{doc.text}</span>
          </div>
        ))}
      </div>

      <div className={styles.panelTitle}>Pairwise Jaccard similarity</div>
      <SimilarityMatrix threshold={threshold} onHover={setHovered} />

      <div className={styles.panelTitle}>Clusters at threshold {threshold.toFixed(2)}</div>
      <div className={styles.clustersList}>
        {clusters.map((cluster, idx) => (
          <ClusterRow key={idx} cluster={cluster} />
        ))}
      </div>

      {hovered && (
        <div className={styles.hoverReadout}>
          Jaccard({hovered.i + 1}, {hovered.j + 1}) = <strong>{hovered.v.toFixed(3)}</strong>
        </div>
      )}
    </div>
  );
}

function SimilarityMatrix({ threshold, onHover }: { threshold: number; onHover: (h: { i: number; j: number; v: number } | null) => void }) {
  const n = DOCS.length;
  return (
    <div className={styles.matrixWrapper}>
      <div
        className={styles.matrix}
        style={{ gridTemplateColumns: `auto repeat(${n}, 36px)` }}
      >
        <div></div>
        {DOCS.map(doc => (
          <div key={`ch-${doc.id}`} className={styles.matrixLabel}>{doc.id}</div>
        ))}
        {SIMILARITY.map((row, i) => (
          <RowFragment key={i} rowLabel={DOCS[i]!.id}>
            {row.map((v, j) => {
              const aboveThreshold = i !== j && v >= threshold;
              return (
                <div
                  key={j}
                  className={`${styles.matrixCell} ${aboveThreshold ? styles.matrixCellAboveThreshold : ''} ${i === j ? styles.matrixCellDiagonal : ''}`}
                  style={{ backgroundColor: cellColor(v) }}
                  onMouseEnter={() => onHover({ i, j, v })}
                  onMouseLeave={() => onHover(null)}
                  title={`J(${DOCS[i]!.id}, ${DOCS[j]!.id}) = ${v.toFixed(3)}`}
                >
                  {v >= 0.05 ? v.toFixed(2) : ''}
                </div>
              );
            })}
          </RowFragment>
        ))}
      </div>
    </div>
  );
}

function RowFragment({ rowLabel, children }: { rowLabel: number; children: React.ReactNode }) {
  return (
    <>
      <div className={styles.matrixLabel}>{rowLabel}</div>
      {children}
    </>
  );
}

function ClusterRow({ cluster }: { cluster: number[] }) {
  const keepId = cluster[0]!;
  const discardIds = cluster.slice(1);

  return (
    <div className={styles.clusterRow}>
      <span className={styles.clusterKeep}>
        ✓ Keep: <strong>ID {keepId}</strong>
      </span>
      {discardIds.length > 0 && (
        <span className={styles.clusterDiscard}>
          — discard: {discardIds.map(id => `ID ${id}`).join(', ')}
        </span>
      )}
    </div>
  );
}

function cellColor(v: number): string {
  return `rgba(34, 211, 238, ${(v * 0.85).toFixed(3)})`;
}

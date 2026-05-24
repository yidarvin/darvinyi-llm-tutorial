import { useState, useMemo } from 'react';
import type { JSX } from 'react';
import {
  DOCUMENT, STRATEGIES,
  chunkFixedSize, chunkSentences, chunkParagraphs, chunkParentDoc,
  computeStats, CHUNK_COLORS,
  type Chunk,
} from './chunking-data';
import styles from './ChunkingVisualizer.module.css';

export default function ChunkingVisualizer() {
  const [strategyIdx, setStrategyIdx] = useState(0);
  const strategy = STRATEGIES[strategyIdx]!;

  const { displayChunks, smallChunks } = useMemo(() => {
    switch (strategy.id) {
      case 'fixed-size': {
        const c = chunkFixedSize(DOCUMENT, 80, 15);
        return { displayChunks: c, smallChunks: null as Chunk[] | null };
      }
      case 'sentence': {
        const c = chunkSentences(DOCUMENT);
        return { displayChunks: c, smallChunks: null as Chunk[] | null };
      }
      case 'paragraph': {
        const c = chunkParagraphs(DOCUMENT);
        return { displayChunks: c, smallChunks: null as Chunk[] | null };
      }
      case 'parent-doc': {
        const { small, parents } = chunkParentDoc(DOCUMENT);
        return { displayChunks: parents, smallChunks: small };
      }
    }
  }, [strategy]);

  const stats = useMemo(
    () => computeStats(displayChunks, DOCUMENT.length),
    [displayChunks],
  );

  return (
    <div className={styles.widget}>
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Chunking visualizer</div>
        <div className={styles.titleSubLabel}>
          Same document · four chunking strategies · color-coded boundaries
        </div>
      </div>

      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Strategy:</span>
          <div className={styles.strategyButtons}>
            {STRATEGIES.map((s, i) => (
              <button
                key={s.id}
                className={`${styles.strategyButton} ${strategyIdx === i ? styles.strategyButtonActive : ''}`}
                onClick={() => setStrategyIdx(i)}
              >{s.label}</button>
            ))}
          </div>
        </div>
        <div className={styles.strategyDescription}>{strategy.description}</div>
      </div>

      <div className={styles.docPanel}>
        <div className={styles.docTitle}>
          Document {strategy.id === 'parent-doc' ? '(colored by parent paragraph)' : '(colored by chunk)'}
        </div>
        <div className={styles.docBody}>
          {renderDocument(DOCUMENT, displayChunks, strategy.id === 'fixed-size')}
        </div>
      </div>

      {smallChunks && (
        <div className={styles.smallChunksPanel}>
          <div className={styles.smallChunksTitle}>
            What gets embedded ({smallChunks.length} small chunks)
          </div>
          <div className={styles.smallChunksList}>
            {smallChunks.slice(0, 8).map(chunk => (
              <div
                key={chunk.id}
                className={styles.smallChunkRow}
                style={{
                  borderLeftColor: CHUNK_COLORS[chunk.parentId! % CHUNK_COLORS.length],
                }}
              >
                <span className={styles.smallChunkLabel}>
                  #{chunk.id} (parent #{chunk.parentId})
                </span>
                <span className={styles.smallChunkText}>{chunk.text.trim()}</span>
              </div>
            ))}
            {smallChunks.length > 8 && (
              <div className={styles.smallChunkMore}>
                ... and {smallChunks.length - 8} more small chunks (omitted for display)
              </div>
            )}
          </div>
        </div>
      )}

      <div className={styles.statsPanel}>
        <div className={styles.statsTitle}>Statistics</div>
        <div className={styles.statsGrid}>
          <div className={styles.statCell}>
            <div className={styles.statLabel}>Chunks</div>
            <div className={styles.statValue}>{stats.count}</div>
          </div>
          <div className={styles.statCell}>
            <div className={styles.statLabel}>Avg size (tokens)</div>
            <div className={styles.statValue}>{stats.avgTokens}</div>
          </div>
          <div className={styles.statCell}>
            <div className={styles.statLabel}>Size range</div>
            <div className={styles.statValue}>{stats.minTokens}–{stats.maxTokens}</div>
            <div className={styles.statSubValue}>σ {stats.stdDev}</div>
          </div>
          <div className={styles.statCell}>
            <div className={styles.statLabel}>Coverage</div>
            <div className={styles.statValue}>{(stats.totalCoverage * 100).toFixed(0)}%</div>
            {stats.totalCoverage > 1.01 && (
              <div className={styles.statSubValue}>
                +{((stats.totalCoverage - 1) * 100).toFixed(0)}% overlap
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.insightPanel}>
        <div className={styles.insightLabel}>Insight</div>
        <div className={styles.insightText}>{strategy.insight}</div>
      </div>

      <div className={styles.caption}>
        Toggle between strategies to see the trade-offs. <strong>Chunk count</strong> drives
        retrieval precision (more chunks → more fine-grained matches). <strong>Chunk size variance</strong>
        affects embedding quality (uniform sizes embed more consistently). <strong>Overlap</strong>
        preserves context at boundaries but inflates index size. <strong>The chunking decision
        affects retrieval more than the embedding model choice</strong> — and is the most common
        source of "RAG isn't working" debugging.
      </div>
    </div>
  );
}

/**
 * Render the document with background-color spans for each chunk.
 * For fixed-size: chunks may overlap; we color per-character based on the
 * latest chunk that owns each position, so adjacent chunks alternate colors.
 * For other strategies: chunks are contiguous and rendered as one span each.
 */
function renderDocument(doc: string, chunks: Chunk[], showOverlap: boolean): JSX.Element {
  if (chunks.length === 0) return <span>{doc}</span>;

  if (!showOverlap) {
    return (
      <>
        {chunks.map((chunk, i) => (
          <span
            key={chunk.id}
            className={styles.chunkSpan}
            style={{
              backgroundColor: `color-mix(in srgb, ${CHUNK_COLORS[i % CHUNK_COLORS.length]} 20%, transparent)`,
              borderLeft: `2px solid ${CHUNK_COLORS[i % CHUNK_COLORS.length]}`,
            }}
            title={`Chunk ${i + 1} · ${chunk.tokenCount} tokens`}
          >
            {chunk.text}
          </span>
        ))}
      </>
    );
  }

  const charColors: string[] = new Array(doc.length).fill('transparent');
  chunks.forEach((chunk, i) => {
    const color = CHUNK_COLORS[i % CHUNK_COLORS.length]!;
    for (let j = chunk.start; j < chunk.end; j++) {
      charColors[j] = color;
    }
  });

  const parts: JSX.Element[] = [];
  let curStart = 0;
  for (let i = 1; i <= doc.length; i++) {
    if (i === doc.length || charColors[i] !== charColors[curStart]) {
      const text = doc.slice(curStart, i);
      const color = charColors[curStart]!;
      parts.push(
        <span
          key={curStart}
          className={styles.chunkSpan}
          style={{
            backgroundColor:
              color === 'transparent'
                ? 'transparent'
                : `color-mix(in srgb, ${color} 22%, transparent)`,
          }}
        >
          {text}
        </span>,
      );
      curStart = i;
    }
  }
  return <>{parts}</>;
}

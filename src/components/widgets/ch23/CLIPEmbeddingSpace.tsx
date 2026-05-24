import { useMemo, useState } from 'react';
import {
  ITEMS,
  QUERIES,
  topKNearest,
} from './clip-data';
import styles from './CLIPEmbeddingSpace.module.css';

const PLOT_W = 720;
const PLOT_H = 400;
const PAD = 30;

export default function CLIPEmbeddingSpace() {
  const [queryIdx, setQueryIdx] = useState(0);
  const query = QUERIES[queryIdx]!;
  const topNeighbors = useMemo(() => topKNearest(query, ITEMS, 3), [query]);
  const neighborIds = new Set(topNeighbors.map(n => n.item.id));

  const toX = (x: number) => PAD + x * (PLOT_W - 2 * PAD);
  const toY = (y: number) => PAD + (1 - y) * (PLOT_H - 2 * PAD);

  return (
    <div className={styles.widget}>
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>CLIP embedding space</div>
        <div className={styles.titleSubLabel}>
          Shared image-text embedding space · 12 items, 4 content clusters
        </div>
      </div>

      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Pick a query:</span>
          <div className={styles.queryButtons}>
            {QUERIES.map((q, i) => (
              <button
                key={q.id}
                className={`${styles.queryButton} ${queryIdx === i ? styles.queryButtonActive : ''}`}
                onClick={() => setQueryIdx(i)}
              >{q.text}</button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.legendPanel}>
        <div className={styles.legendItem}>
          <span className={styles.legendImageMarker}>🐱</span>
          <span className={styles.legendText}>image marker</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendTextMarker}>📄</span>
          <span className={styles.legendText}>text marker</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendQueryMarker}>◆</span>
          <span className={styles.legendText}>query</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendRingMarker}>○</span>
          <span className={styles.legendText}>top-3 nearest</span>
        </div>
      </div>

      <div className={styles.plotPanel}>
        <svg
          viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}
          className={styles.plotSvg}
          role="img"
          aria-label="2D projection of CLIP embedding space"
        >
          <rect
            x={PAD}
            y={PAD}
            width={PLOT_W - 2 * PAD}
            height={PLOT_H - 2 * PAD}
            className={styles.plotFrame}
          />

          <text x={toX(0.10)} y={toY(0.95)} className={styles.clusterLabel}>cats</text>
          <text x={toX(0.10)} y={toY(0.05) + 16} className={styles.clusterLabel}>dogs</text>
          <text x={toX(0.85)} y={toY(0.95)} className={styles.clusterLabel}>cars</text>
          <text x={toX(0.85)} y={toY(0.05) + 16} className={styles.clusterLabel}>boats</text>

          {topNeighbors.map(({ item }) => (
            <line
              key={`line-${item.id}`}
              x1={toX(query.x)}
              y1={toY(query.y)}
              x2={toX(item.x)}
              y2={toY(item.y)}
              className={styles.connectionLine}
            />
          ))}

          {ITEMS.map(item => {
            const isNeighbor = neighborIds.has(item.id);
            const isImage = item.kind === 'image';
            return (
              <g key={item.id}>
                <circle
                  cx={toX(item.x)}
                  cy={toY(item.y)}
                  r={isImage ? 18 : 16}
                  className={`${styles.itemBg} ${isImage ? styles.itemBgImage : styles.itemBgText} ${isNeighbor ? styles.itemBgNeighbor : ''}`}
                />
                {isNeighbor && (
                  <circle
                    cx={toX(item.x)}
                    cy={toY(item.y)}
                    r={isImage ? 22 : 20}
                    className={styles.itemHighlightRing}
                  />
                )}
                <text
                  x={toX(item.x)}
                  y={toY(item.y)}
                  className={`${styles.itemLabel} ${isNeighbor ? styles.itemLabelNeighbor : ''}`}
                >{item.label}</text>
              </g>
            );
          })}

          <g>
            <polygon
              points={`${toX(query.x)},${toY(query.y) - 14} ${toX(query.x) + 12},${toY(query.y)} ${toX(query.x)},${toY(query.y) + 14} ${toX(query.x) - 12},${toY(query.y)}`}
              className={styles.queryMarker}
            />
            <text
              x={toX(query.x)}
              y={toY(query.y) + 28}
              className={styles.queryLabel}
            >query</text>
          </g>
        </svg>
      </div>

      <div className={styles.queryReadoutPanel}>
        <span className={styles.queryReadoutLabel}>Query:</span>
        <span className={styles.queryReadoutText}>{query.text}</span>
      </div>

      <div className={styles.neighborsPanel}>
        <div className={styles.neighborsTitle}>Top-3 nearest items</div>
        <ol className={styles.neighborsList}>
          {topNeighbors.map(({ item, similarity }, i) => (
            <li key={item.id} className={styles.neighborItem}>
              <span className={styles.neighborRank}>{i + 1}.</span>
              <span className={styles.neighborMarker}>{item.label}</span>
              <span className={styles.neighborKind}>[{item.kind}]</span>
              <span className={styles.neighborCaption}>&ldquo;{item.caption}&rdquo;</span>
              <span className={styles.neighborSim}>sim: {similarity.toFixed(2)}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.insightPanel}>
        <div className={styles.insightLabel}>Insight</div>
        <div className={styles.insightText}>{query.insight}</div>
      </div>

      <div className={styles.caption}>
        Click through the queries. Watch where the query lands in the 2D embedding space, and which items
        light up as its nearest neighbors. <strong>Notice that images and texts both appear</strong> — the
        shared embedding space doesn&apos;t separate by modality, only by meaning. <strong>This is what CLIP
        gives you</strong>: cosine similarity that bridges modalities. It is the foundational technique
        behind every modern vision-language model (LLaVA, GPT-4V, Claude vision, Gemini) and behind
        multimodal RAG.
      </div>
    </div>
  );
}

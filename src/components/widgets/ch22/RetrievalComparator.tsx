import { useState, useMemo } from 'react';
import {
  CORPUS, QUERIES, buildRankings, firstCorrectRank, insightFor,
} from './retrieval-data';
import styles from './RetrievalComparator.module.css';

const TOP_K = 5;

export default function RetrievalComparator() {
  const [queryIdx, setQueryIdx] = useState(0);
  const query = QUERIES[queryIdx]!;
  const rankings = useMemo(() => buildRankings(query, CORPUS), [query]);
  const insight = insightFor(query);

  const bm25FirstCorrect = firstCorrectRank(rankings.bm25, query.correctDocIds, TOP_K);
  const denseFirstCorrect = firstCorrectRank(rankings.dense, query.correctDocIds, TOP_K);
  const hybridFirstCorrect = firstCorrectRank(rankings.hybrid, query.correctDocIds, TOP_K);

  return (
    <div className={styles.widget}>
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Retrieval comparator</div>
        <div className={styles.titleSubLabel}>
          BM25 vs Dense vs Hybrid · on a hand-curated 10-doc corpus
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
              >{q.label}</button>
            ))}
          </div>
        </div>
        <div className={styles.queryText}>
          <span className={styles.queryTextLabel}>Query:</span>
          <span className={styles.queryTextValue}>"{query.text}"</span>
        </div>
        <div className={styles.queryNote}>
          Correct docs are highlighted with ✓ in the rankings below.
        </div>
      </div>

      <div className={styles.rankingsGrid}>
        <RankingColumn
          title="BM25"
          subtitle="sparse · exact match"
          colorClass={styles.colBM25}
          ranking={rankings.bm25}
          correctDocIds={query.correctDocIds}
          scoreLabel="score"
          scoreFormat={(s) => s.toFixed(2)}
        />
        <RankingColumn
          title="Dense"
          subtitle="embedding similarity"
          colorClass={styles.colDense}
          ranking={rankings.dense}
          correctDocIds={query.correctDocIds}
          scoreLabel="sim"
          scoreFormat={(s) => s.toFixed(3)}
        />
        <RankingColumn
          title="Hybrid"
          subtitle="RRF combination"
          colorClass={styles.colHybrid}
          ranking={rankings.hybrid}
          correctDocIds={query.correctDocIds}
          scoreLabel="rrf"
          scoreFormat={(s) => s.toFixed(4)}
        />
      </div>

      <div className={styles.summaryPanel}>
        <div className={styles.summaryTitle}>Rank of first correct doc (top-{TOP_K})</div>
        <div className={styles.summaryGrid}>
          <FirstCorrectBadge label="BM25" rank={bm25FirstCorrect} />
          <FirstCorrectBadge label="Dense" rank={denseFirstCorrect} />
          <FirstCorrectBadge label="Hybrid" rank={hybridFirstCorrect} />
        </div>
      </div>

      <div className={styles.insightPanel}>
        <div className={styles.insightLabel}>Insight</div>
        <div className={styles.insightText}>{insight}</div>
      </div>

      <div className={styles.caption}>
        Click through the four queries. <strong>BM25 wins on keyword-heavy queries</strong>;
        <strong> Dense wins on semantic and paraphrased queries</strong>; <strong>Hybrid (RRF) is
        robust across all types</strong>, never losing badly to either alone. <strong>This is why
        hybrid retrieval is the production default</strong> in mature RAG systems — it handles the
        full diversity of real user queries.
      </div>
    </div>
  );
}

interface RankingColumnProps {
  title: string;
  subtitle: string;
  colorClass: string | undefined;
  ranking: Array<{ docId: number; score: number; rank: number }>;
  correctDocIds: number[];
  scoreLabel: string;
  scoreFormat: (s: number) => string;
}
function RankingColumn({
  title, subtitle, colorClass, ranking, correctDocIds, scoreLabel, scoreFormat,
}: RankingColumnProps) {
  return (
    <div className={`${styles.rankingColumn} ${colorClass ?? ''}`}>
      <div className={styles.columnHeader}>
        <div className={styles.columnTitle}>{title}</div>
        <div className={styles.columnSubtitle}>{subtitle}</div>
      </div>
      <ol className={styles.rankList}>
        {ranking.slice(0, TOP_K).map(({ docId, score, rank }) => {
          const doc = CORPUS[docId]!;
          const isCorrect = correctDocIds.includes(docId);
          return (
            <li
              key={docId}
              className={`${styles.rankItem} ${isCorrect ? styles.rankItemCorrect : ''}`}
            >
              <span className={styles.rankNumber}>{rank}.</span>
              <span className={styles.rankCorrectMarker}>{isCorrect ? '✓' : ' '}</span>
              <span className={styles.rankTitle}>{doc.title}</span>
              <span className={styles.rankScore}>
                <span className={styles.scoreLabel}>{scoreLabel}:</span> {scoreFormat(score)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

interface FirstCorrectBadgeProps {
  label: string;
  rank: number | null;
}
function FirstCorrectBadge({ label, rank }: FirstCorrectBadgeProps) {
  let className = styles.badge;
  let display: string;
  if (rank === null) {
    className += ' ' + styles.badgeFail;
    display = '✗ not in top-5';
  } else if (rank === 1) {
    className += ' ' + styles.badgeBest;
    display = '★ 1';
  } else {
    display = `${rank}`;
  }
  return (
    <div className={className}>
      <div className={styles.badgeLabel}>{label}:</div>
      <div className={styles.badgeValue}>{display}</div>
    </div>
  );
}

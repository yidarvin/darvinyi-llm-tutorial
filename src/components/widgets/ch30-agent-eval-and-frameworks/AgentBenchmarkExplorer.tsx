import { Fragment, useState } from 'react';
import {
  BENCHMARKS, CATEGORY_COLORS, MATURITY,
  type AgentBenchmark,
} from './benchmark-data';
import styles from './AgentBenchmarkExplorer.module.css';


/** Convert `**bold**` markers in a string to <strong> JSX nodes. */
function renderInlineBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const m = part.match(/^\*\*(.+)\*\*$/);
    if (m) return <strong key={i}>{m[1]}</strong>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}


function ScoreBar({ score, label, color }: { score: number; label: string; color: string }) {
  const pct = Math.round(score * 100);
  return (
    <div className={styles.scoreBarRow}>
      <div className={styles.scoreBarLabel}>{label}</div>
      <div className={styles.scoreBarTrack}>
        <div
          className={styles.scoreBarFill}
          style={{ width: `${pct}%`, background: color }}
        >
          <span className={styles.scoreBarValue}>{pct}%</span>
        </div>
      </div>
    </div>
  );
}


function ScoreChart({ benchmark }: { benchmark: AgentBenchmark }) {
  const gap = benchmark.frontierScore - benchmark.humanScore;
  const gapPct = Math.round(gap * 100);
  const gapColor = gap >= 0 ? 'var(--emerald-400)' : 'var(--text-secondary)';

  return (
    <div className={styles.scoreChart}>
      <ScoreBar score={benchmark.frontierScore} label="Frontier agent" color="var(--cyan-400)" />
      <ScoreBar score={benchmark.humanScore} label="Human baseline" color="var(--emerald-400)" />

      <div className={styles.gapLabel}>
        <span style={{ color: gapColor, fontWeight: 600 }}>
          {gap >= 0 ? '↑ ' : ''}
          {gap >= 0 ? '+' : ''}{gapPct} pp
        </span>
        <span className={styles.gapDescription}>
          {gap >= 0 ? 'agents exceed human baseline' : 'agents below human baseline'}
        </span>
      </div>

      {benchmark.levels && (
        <div className={styles.levelsSection}>
          <div className={styles.levelsLabel}>By difficulty level:</div>
          {benchmark.levels.map(level => {
            const levelGap = level.frontierScore - level.humanScore;
            return (
              <div key={level.label} className={styles.levelRow}>
                <div className={styles.levelName}>{level.label}</div>
                <div className={styles.levelBars}>
                  <div className={styles.levelMiniBar}>
                    <div
                      className={styles.levelMiniBarFill}
                      style={{
                        width: `${level.frontierScore * 100}%`,
                        background: 'var(--cyan-400)',
                      }}
                    />
                    <span className={styles.levelMiniBarValue}>{Math.round(level.frontierScore * 100)}%</span>
                  </div>
                  <div className={styles.levelMiniBar}>
                    <div
                      className={styles.levelMiniBarFill}
                      style={{
                        width: `${level.humanScore * 100}%`,
                        background: 'var(--emerald-400)',
                      }}
                    />
                    <span className={styles.levelMiniBarValue}>{Math.round(level.humanScore * 100)}%</span>
                  </div>
                  <span className={styles.levelGap}>
                    {Math.round(levelGap * 100)} pp
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


export default function AgentBenchmarkExplorer() {
  const [idx, setIdx] = useState(0);
  const benchmark = BENCHMARKS[idx]!;
  const categoryColor = CATEGORY_COLORS[benchmark.category];
  const maturity = MATURITY[benchmark.maturity];

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Agent benchmark explorer</div>
        <div className={styles.titleSubLabel}>
          {BENCHMARKS.length} 2025 agent benchmarks · pick one for detail
        </div>
      </div>

      {/* Picker */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Pick a benchmark:</span>
          <div className={styles.benchmarkButtons}>
            {BENCHMARKS.map((b, i) => (
              <button
                key={b.id}
                className={`${styles.benchmarkButton} ${idx === i ? styles.benchmarkButtonActive : ''}`}
                style={{ borderLeftColor: CATEGORY_COLORS[b.category] }}
                onClick={() => setIdx(i)}
              >{b.shortLabel}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail */}
      <div className={styles.detailPanel}>
        <div className={styles.detailHeader}>
          <div className={styles.detailTitle}>{benchmark.label.toUpperCase()}</div>
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

        {/* Meta row */}
        <div className={styles.metaRow}>
          <div className={styles.metaItem}>
            <span
              className={styles.categoryDot}
              style={{ background: categoryColor }}
            />
            <span className={styles.metaText}>{benchmark.category}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Released:</span>
            <span className={styles.metaText}>{benchmark.year}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Tasks:</span>
            <span className={styles.metaText}>{benchmark.taskCount.toLocaleString()}</span>
          </div>
        </div>

        <div className={styles.descriptionText}>{renderInlineBold(benchmark.description)}</div>

        {/* Score chart */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Score (early 2025)</div>
          <div className={styles.chartContainer}>
            <ScoreChart benchmark={benchmark} />
          </div>
        </div>

        {/* What it measures */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>What it measures</div>
          <div className={styles.measuresBox}>{renderInlineBold(benchmark.whatItMeasures)}</div>
        </div>

        {/* Example task */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Example task (paraphrased)</div>
          <div className={styles.exampleTaskBox}>{benchmark.exampleTask}</div>
        </div>

        {/* Characteristics */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Characteristics</div>
          <ul className={styles.characteristicsList}>
            {benchmark.characteristics.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Quick comparison */}
      <div className={styles.comparisonPanel}>
        <div className={styles.sectionLabel}>Quick comparison (frontier vs human, early 2025)</div>
        <table className={styles.comparisonTable}>
          <thead>
            <tr>
              <th>Benchmark</th>
              <th>Category</th>
              <th>Tasks</th>
              <th>Frontier</th>
              <th>Human</th>
              <th>Gap</th>
            </tr>
          </thead>
          <tbody>
            {BENCHMARKS.map((b, i) => {
              const gap = b.frontierScore - b.humanScore;
              const gapPct = Math.round(gap * 100);
              return (
                <tr
                  key={b.id}
                  className={i === idx ? styles.comparisonRowActive : ''}
                  onClick={() => setIdx(i)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{b.shortLabel}</td>
                  <td>
                    <span
                      className={styles.categoryDot}
                      style={{ background: CATEGORY_COLORS[b.category] }}
                    />
                    {b.category}
                  </td>
                  <td>{b.taskCount.toLocaleString()}</td>
                  <td style={{ color: 'var(--cyan-300)' }}>
                    {Math.round(b.frontierScore * 100)}%
                  </td>
                  <td style={{ color: 'var(--emerald-400)' }}>
                    {Math.round(b.humanScore * 100)}%
                  </td>
                  <td
                    style={{
                      color: gap >= 0 ? 'var(--emerald-400)' : 'var(--text-secondary)',
                      fontWeight: 600,
                    }}
                  >
                    {gap >= 0 ? '↑ +' : ''}{gapPct} pp
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        <strong>The 2025 agent benchmark landscape</strong>: coding (SWE-bench, ~50%), general
        assistance (GAIA, ~65% Level 1), computer use (OSWorld, ~14%), tool-use reliability (τ-bench
        pass^4, ~51%), and complex web research (BrowseComp, ~42%, above human baseline).{' '}
        <strong>The gaps to human performance</strong> are real: 35 pp on SWE-bench, 58 pp on OSWorld.{' '}
        <strong>The widest gap is OSWorld</strong> (computer use): embodied desktop interaction
        remains the hardest agent regime. <strong>BrowseComp's positive gap</strong> shows where
        agents already exceed humans: tireless browsing capacity.{' '}
        <strong>Benchmarks measure narrow things</strong>; production readiness requires more (cost,
        latency, safety, reliability, observability, sections 3–6 of this chapter).{' '}
        <strong>This is the discipline Ch 26 established, extended to the agent layer.</strong>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import {
  BENCHMARKS, MODELS, CATEGORIES, sortModels, isSaturated, scoreColor, scoreTextColor,
  type SortKey,
} from './benchmark-data';
import styles from './BenchmarkHeatmap.module.css';

export default function BenchmarkHeatmap() {
  const [sortKey, setSortKey] = useState<SortKey>('overall');
  const [hoveredCell, setHoveredCell] = useState<{ modelId: string; benchmarkId: string } | null>(null);

  const sortedModels = useMemo(() => sortModels(MODELS, sortKey), [sortKey]);

  // Group benchmarks by category for the header band
  const categoryGroups = useMemo(() => {
    const groups: Array<{ category: keyof typeof CATEGORIES; benchmarks: typeof BENCHMARKS }> = [];
    let currentGroup: typeof groups[number] | null = null;
    for (const b of BENCHMARKS) {
      if (!currentGroup || currentGroup.category !== b.category) {
        currentGroup = { category: b.category, benchmarks: [] };
        groups.push(currentGroup);
      }
      currentGroup.benchmarks.push(b);
    }
    return groups;
  }, []);

  const saturationMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const b of BENCHMARKS) {
      map[b.id] = isSaturated(b.id, MODELS);
    }
    return map;
  }, []);

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Benchmark heatmap</div>
        <div className={styles.titleSubLabel}>
          {MODELS.length} models · {BENCHMARKS.length} benchmarks · sort by any column
        </div>
      </div>

      {/* Disclaimer */}
      <div className={styles.disclaimerPanel}>
        <span className={styles.disclaimerLabel}>Note:</span>{' '}
        Scores are <strong>illustrative ballparks</strong> drawn from mid-2024 to 2025 reports.
        They're chosen for pedagogical clarity, not authoritative reproduction of any specific leaderboard.
        Real benchmark rankings shift with each model release.
      </div>

      {/* Sort controls */}
      <div className={styles.controlsPanel}>
        <span className={styles.controlsLabel}>Sort by:</span>
        <div className={styles.sortButtons}>
          {(['overall', 'capability', 'safety', 'agentic'] as const).map(key => (
            <button
              key={key}
              className={`${styles.sortButton} ${sortKey === key ? styles.sortButtonActive : ''}`}
              onClick={() => setSortKey(key)}
            >
              {key === 'overall' ? 'Overall' : key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap table */}
      <div className={styles.tableWrapper}>
        <table className={styles.heatmapTable}>
          <thead>
            {/* Category band */}
            <tr className={styles.categoryRow}>
              <th className={styles.cornerCell}></th>
              {categoryGroups.map(group => (
                <th
                  key={group.category}
                  colSpan={group.benchmarks.length}
                  className={styles.categoryHeader}
                  style={{
                    background: `color-mix(in srgb, ${CATEGORIES[group.category].color} 16%, transparent)`,
                    color: CATEGORIES[group.category].color,
                    borderColor: `color-mix(in srgb, ${CATEGORIES[group.category].color} 40%, transparent)`,
                  }}
                >
                  {CATEGORIES[group.category].label} ({group.benchmarks.length})
                </th>
              ))}
            </tr>
            {/* Benchmark headers */}
            <tr>
              <th className={styles.modelLabelHeader}>Model</th>
              {BENCHMARKS.map(b => {
                const isActive = sortKey === b.id;
                const saturated = saturationMap[b.id];
                return (
                  <th
                    key={b.id}
                    className={`${styles.benchmarkHeader} ${isActive ? styles.benchmarkHeaderActive : ''}`}
                    onClick={() => setSortKey(b.id)}
                    title={b.description}
                  >
                    <div className={styles.benchmarkLabelStack}>
                      <span className={styles.benchmarkLabel}>{b.shortLabel}</span>
                      {saturated && (
                        <span className={styles.saturationBadge}>SAT</span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedModels.map((model, mIdx) => (
              <tr key={model.id} className={mIdx === 0 ? styles.topRow : ''}>
                <th className={styles.modelLabel}>{model.label}</th>
                {BENCHMARKS.map(b => {
                  const score = model.scores[b.id] ?? 0;
                  const bg = scoreColor(score);
                  const fg = scoreTextColor(score);
                  const isHovered = hoveredCell?.modelId === model.id && hoveredCell?.benchmarkId === b.id;
                  return (
                    <td
                      key={b.id}
                      className={`${styles.scoreCell} ${isHovered ? styles.scoreCellHovered : ''}`}
                      style={{ background: bg, color: fg }}
                      onMouseEnter={() => setHoveredCell({ modelId: model.id, benchmarkId: b.id })}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={`${model.label} on ${b.label}: ${score}%`}
                    >
                      {score}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hover detail */}
      <div className={styles.hoverPanel}>
        {hoveredCell ? (() => {
          const m = MODELS.find(x => x.id === hoveredCell.modelId);
          const b = BENCHMARKS.find(x => x.id === hoveredCell.benchmarkId);
          if (!m || !b) return null;
          return (
            <>
              <div className={styles.hoverHeader}>
                <span className={styles.hoverModel}>{m.label}</span>
                <span className={styles.hoverArrow}>·</span>
                <span className={styles.hoverBenchmark}>{b.label}</span>
                <span className={styles.hoverScore}>{m.scores[b.id]}%</span>
              </div>
              <div className={styles.hoverDescription}>{b.description}</div>
            </>
          );
        })() : (
          <span className={styles.hoverPlaceholder}>
            Hover a cell for detail · click a column header to sort
          </span>
        )}
      </div>

      {/* Caption */}
      <div className={styles.caption}>
        Try sorting by different columns. <strong>The ranking changes substantially</strong> depending
        on what you measure. <strong>Saturated benchmarks</strong> (marked SAT) have a whole column clustered
        near the top — they no longer distinguish frontier models. Only HellaSwag earns the badge in this
        snapshot; MMLU, HumanEval, and MATH are trending the same way but don't yet clear it.{' '}
        <strong>Agentic benchmarks</strong>{' '}
        (SWE-bench, GAIA, OSWorld) show the most spread — they're where models still discriminate, and
        where Part IX's coverage matters most. <strong>This is the chapter's central claim made visceral</strong>:
        modern AI eval is a dashboard, not a number.
      </div>
    </div>
  );
}

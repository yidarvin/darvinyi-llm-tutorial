import { useMemo, useState } from 'react';
import {
  WORDS,
  CATEGORIES,
  ANALOGIES,
  ANALOGY_COLORS,
  type Category,
  type WordPoint,
  findWord,
} from './embedding-data';
import styles from './EmbeddingSpace.module.css';

const VIEWBOX_W = 700;
const VIEWBOX_H = 600;
const PLOT_X_MIN = 60;
const PLOT_X_MAX = 640;
const PLOT_Y_MIN = 80;
const PLOT_Y_MAX = 540;

function toSvgX(dataX: number): number {
  return PLOT_X_MIN + ((dataX + 10) * (PLOT_X_MAX - PLOT_X_MIN)) / 20;
}
function toSvgY(dataY: number): number {
  return PLOT_Y_MAX - ((dataY + 10) * (PLOT_Y_MAX - PLOT_Y_MIN)) / 20;
}

export default function EmbeddingSpace() {
  const [enabledCategories, setEnabledCategories] = useState<Set<Category>>(
    new Set(CATEGORIES.map(c => c.id))
  );
  const [enabledAnalogies, setEnabledAnalogies] = useState<Set<string>>(new Set(['gender']));
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  function toggleCategory(c: Category) {
    setEnabledCategories(prev => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }

  function toggleAnalogy(id: string) {
    setEnabledAnalogies(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function resetFilters() {
    setEnabledCategories(new Set(CATEGORIES.map(c => c.id)));
    setEnabledAnalogies(new Set(['gender']));
    setSelected(null);
    setHovered(null);
  }

  const visibleWords = useMemo(
    () => WORDS.filter(w => enabledCategories.has(w.category)),
    [enabledCategories]
  );

  const visibleArrows = useMemo(() => {
    const out: Array<{ from: WordPoint; to: WordPoint; color: string; groupId: string }> = [];
    for (const group of ANALOGIES) {
      if (!enabledAnalogies.has(group.id)) continue;
      const color = ANALOGY_COLORS[group.id]!;
      for (const [src, dst] of group.pairs) {
        const a = findWord(src);
        const b = findWord(dst);
        if (!a || !b) continue;
        if (!enabledCategories.has(a.category) || !enabledCategories.has(b.category)) continue;
        out.push({ from: a, to: b, color, groupId: group.id });
      }
    }
    return out;
  }, [enabledAnalogies, enabledCategories]);

  return (
    <div className={styles.widget}>
      <div className={styles.chipRow}>
        <span className={styles.chipLabel}>Categories:</span>
        {CATEGORIES.map(c => {
          const isOn = enabledCategories.has(c.id);
          return (
            <button
              key={c.id}
              onClick={() => toggleCategory(c.id)}
              className={`${styles.chip} ${isOn ? styles.chipOn : ''}`}
              style={{ '--chip-color': c.color } as React.CSSProperties}
              aria-pressed={isOn}
            >
              <span className={styles.chipSwatch} />
              {c.label}
            </button>
          );
        })}
        <button onClick={resetFilters} className={styles.resetButton}>
          Reset
        </button>
      </div>

      <svg
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        className={styles.svg}
        role="img"
        aria-label="2D scatter plot of word embeddings"
      >
        <defs>
          {ANALOGIES.map(g => (
            <marker
              key={`arrow-marker-${g.id}`}
              id={`arrowhead-${g.id}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 Z" style={{ fill: ANALOGY_COLORS[g.id] }} />
            </marker>
          ))}
        </defs>

        <g className={styles.axes}>
          <line
            x1={PLOT_X_MIN}
            y1={(PLOT_Y_MIN + PLOT_Y_MAX) / 2}
            x2={PLOT_X_MAX}
            y2={(PLOT_Y_MIN + PLOT_Y_MAX) / 2}
          />
          <line
            x1={(PLOT_X_MIN + PLOT_X_MAX) / 2}
            y1={PLOT_Y_MIN}
            x2={(PLOT_X_MIN + PLOT_X_MAX) / 2}
            y2={PLOT_Y_MAX}
          />
          <text
            x={PLOT_X_MAX - 8}
            y={(PLOT_Y_MIN + PLOT_Y_MAX) / 2 - 6}
            className={styles.axisLabel}
          >
            x
          </text>
          <text
            x={(PLOT_X_MIN + PLOT_X_MAX) / 2 + 6}
            y={PLOT_Y_MIN + 14}
            className={styles.axisLabel}
          >
            y
          </text>
        </g>

        {visibleArrows.map((a, i) => {
          const x1 = toSvgX(a.from.x);
          const y1 = toSvgY(a.from.y);
          const x2 = toSvgX(a.to.x);
          const y2 = toSvgY(a.to.y);
          return (
            <line
              key={`arrow-${a.groupId}-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              className={styles.arrow}
              style={{ stroke: a.color }}
              markerEnd={`url(#arrowhead-${a.groupId})`}
            />
          );
        })}

        {visibleWords.map(w => {
          const cx = toSvgX(w.x);
          const cy = toSvgY(w.y);
          const isHovered = hovered === w.word;
          const isSelected = selected === w.word;
          const isDimmed = selected !== null && !isSelected;
          const category = CATEGORIES.find(c => c.id === w.category)!;
          return (
            <g
              key={w.word}
              className={`${styles.point} ${isDimmed ? styles.pointDimmed : ''}`}
              onMouseEnter={() => setHovered(w.word)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelected(prev => (prev === w.word ? null : w.word))}
            >
              <circle
                cx={cx}
                cy={cy}
                r={isSelected || isHovered ? 7 : 5}
                className={styles.pointDot}
                style={{ fill: category.color }}
              />
              <text
                x={cx + 9}
                y={cy + 4}
                className={`${styles.pointLabel} ${isSelected ? styles.pointLabelSelected : ''}`}
              >
                {w.word}
              </text>
            </g>
          );
        })}
      </svg>

      <div className={styles.chipRow}>
        <span className={styles.chipLabel}>Analogies:</span>
        {ANALOGIES.map(g => {
          const isOn = enabledAnalogies.has(g.id);
          return (
            <button
              key={g.id}
              onClick={() => toggleAnalogy(g.id)}
              className={`${styles.chip} ${isOn ? styles.chipOn : ''}`}
              style={{ '--chip-color': ANALOGY_COLORS[g.id] } as React.CSSProperties}
              aria-pressed={isOn}
              title={g.description}
            >
              <span className={styles.chipSwatch} />
              {g.label}
            </button>
          );
        })}
      </div>

      <div className={styles.infoBar} aria-live="polite">
        {hovered ? (
          <>
            Hovered: <strong>{hovered}</strong> ({findWord(hovered)?.category})
          </>
        ) : selected ? (
          <>
            Selected: <strong>{selected}</strong> — click again or press Reset to deselect
          </>
        ) : enabledAnalogies.size > 0 ? (
          <>
            Showing {enabledAnalogies.size} analogy group{enabledAnalogies.size === 1 ? '' : 's'}.
            Notice how arrows within a group are approximately parallel.
          </>
        ) : (
          <>Toggle an analogy group below to see how vector differences encode relationships.</>
        )}
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import {
  TECHNIQUES,
  buildAllCurves,
  insightFor,
  type Difficulty,
} from './compute-curves-data';
import styles from './TestTimeComputeCurves.module.css';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

const COLOR_MAP: Record<string, string> = {
  'gray': 'var(--text-tertiary)',
  'amber': 'var(--amber-400)',
  'cyan': 'var(--cyan-400)',
  'emerald': 'var(--emerald-400)',
  'violet': 'var(--violet-400)',
  'cyan-bright': 'var(--cyan-200)',
};

export default function TestTimeComputeCurves() {
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const curves = useMemo(() => buildAllCurves(difficulty), [difficulty]);
  const insight = insightFor(difficulty);

  const W = 740, H = 360;
  const pad = { l: 60, r: 110, t: 30, b: 50 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  function xFor(compute: number) {
    const t = Math.log10(compute) / Math.log10(1000);
    return pad.l + t * plotW;
  }
  function yFor(accuracy: number) {
    return pad.t + (1 - accuracy / 100) * plotH;
  }

  return (
    <div className={styles.widget}>
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Test-time compute scaling</div>
        <div className={styles.titleSubLabel}>
          Six reasoning techniques · accuracy vs inference compute
        </div>
      </div>

      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Problem difficulty:</span>
          <div className={styles.diffButtons}>
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                className={`${styles.diffButton} ${difficulty === d ? styles.diffButtonActive : ''}`}
                onClick={() => setDifficulty(d)}
              >{d}</button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.plotPanel}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className={styles.plotSvg}
          role="img"
          aria-label="Accuracy vs compute for six reasoning techniques"
        >
          {[0, 20, 40, 60, 80, 100].map(y => (
            <g key={`grid-y-${y}`}>
              <line
                x1={pad.l} x2={pad.l + plotW}
                y1={yFor(y)} y2={yFor(y)}
                className={styles.gridLine}
              />
              <text
                x={pad.l - 6} y={yFor(y) + 4}
                textAnchor="end"
                className={styles.axisLabel}
              >{y}</text>
            </g>
          ))}

          {[1, 10, 100, 1000].map(c => (
            <g key={`xtick-${c}`}>
              <line
                x1={xFor(c)} x2={xFor(c)}
                y1={pad.t + plotH} y2={pad.t + plotH + 4}
                className={styles.gridLine}
              />
              <text
                x={xFor(c)} y={pad.t + plotH + 18}
                textAnchor="middle"
                className={styles.axisLabel}
              >{c}×</text>
            </g>
          ))}

          <line
            x1={pad.l} x2={pad.l + plotW}
            y1={pad.t + plotH} y2={pad.t + plotH}
            className={styles.axis}
          />
          <line
            x1={pad.l} x2={pad.l}
            y1={pad.t} y2={pad.t + plotH}
            className={styles.axis}
          />

          <text
            x={pad.l + plotW / 2} y={H - 8}
            textAnchor="middle"
            className={styles.axisTitle}
          >Inference compute (log scale)</text>
          <text
            x={14} y={pad.t + plotH / 2}
            textAnchor="middle"
            transform={`rotate(-90, 14, ${pad.t + plotH / 2})`}
            className={styles.axisTitle}
          >Accuracy (%)</text>

          {TECHNIQUES.map(tech => {
            const pts = curves[tech.id].filter(p => p.defined);
            if (pts.length === 0) return null;
            const color = COLOR_MAP[tech.color] ?? 'var(--text-tertiary)';

            if (tech.id === 'direct') {
              const p = pts[0]!;
              return (
                <g key={tech.id}>
                  <circle
                    cx={xFor(p.compute)} cy={yFor(p.accuracy)}
                    r={5}
                    fill={color}
                    className={styles.endpointDot}
                  />
                  <text
                    x={xFor(p.compute) + 10} y={yFor(p.accuracy) + 4}
                    className={styles.curveLabel}
                    fill={color}
                  >{tech.shortLabel}</text>
                </g>
              );
            }

            if (tech.id === 'zero-shot-cot') {
              const p1 = pts[0]!;
              const p2 = pts[pts.length - 1]!;
              return (
                <g key={tech.id}>
                  <line
                    x1={xFor(p1.compute)} y1={yFor(p1.accuracy)}
                    x2={xFor(p2.compute)} y2={yFor(p2.accuracy)}
                    stroke={color}
                    strokeWidth={2.5}
                  />
                  <text
                    x={xFor(p2.compute) + 8} y={yFor(p2.accuracy) + 4}
                    className={styles.curveLabel}
                    fill={color}
                  >{tech.shortLabel}</text>
                </g>
              );
            }

            const path = pts.map((p, i) =>
              `${i === 0 ? 'M' : 'L'} ${xFor(p.compute)} ${yFor(p.accuracy)}`
            ).join(' ');
            const last = pts[pts.length - 1]!;
            return (
              <g key={tech.id}>
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth={tech.id === 'modern-reasoning' ? 3.0 : 2.0}
                />
                <circle cx={xFor(last.compute)} cy={yFor(last.accuracy)} r={3.5} fill={color} />
                <text
                  x={xFor(last.compute) + 8} y={yFor(last.accuracy) + 4}
                  className={tech.id === 'modern-reasoning' ? styles.curveLabelEmph : styles.curveLabel}
                  fill={color}
                >{tech.shortLabel}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className={styles.insightPanel}>
        <div className={styles.insightLabel}>
          Insight · <strong>{insight.difficulty}</strong> difficulty
        </div>
        <div className={styles.insightTitle}>{insight.title}</div>
        <div className={styles.insightBody}>{insight.body}</div>
        <div className={styles.insightNumbers}>{insight.numbers}</div>
      </div>

      <div className={styles.legendPanel}>
        <div className={styles.legendTitle}>Techniques</div>
        <div className={styles.legendGrid}>
          {TECHNIQUES.map(tech => (
            <div key={tech.id} className={styles.legendRow}>
              <span
                className={styles.legendSwatch}
                style={{ background: COLOR_MAP[tech.color] }}
              />
              <span className={styles.legendName}>{tech.label}</span>
              <span className={styles.legendDesc}>{tech.description}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.caption}>
        Try the sequence <strong>easy → medium → hard</strong>. On <strong>easy</strong>, all curves
        converge fast, extra compute is wasted. On <strong>medium</strong>, the spread grows; reasoning
        models pull ahead. On <strong>hard</strong>, the gap is dramatic: <strong>direct generation
        plateaus near 12%; modern reasoning models reach ~73%</strong> at 1000× compute. This is
        Snell 2024's central insight, and the economic foundation of o1/R1: for hard problems,
        thinking longer beats thinking with more parameters.
      </div>
    </div>
  );
}

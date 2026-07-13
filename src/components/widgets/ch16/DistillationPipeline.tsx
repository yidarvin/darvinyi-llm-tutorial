import { useState } from 'react';
import { STAGES } from './pipeline-stages-data';
import styles from './DistillationPipeline.module.css';

export default function DistillationPipeline() {
  const [selectedId, setSelectedId] = useState<string>(STAGES[0]!.id);
  const selected = STAGES.find((s) => s.id === selectedId) ?? STAGES[0]!;

  return (
    <div className={styles.widget}>
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Hard distillation pipeline (the modern recipe)</div>
        <div className={styles.titleSubLabel}>
          The end-to-end flow used by R1-Distill, Phi, and Orca.
        </div>
      </div>

      <div className={styles.pipelinePanel}>
        <PipelineSvg selectedId={selectedId} onSelect={setSelectedId} />
        <div className={styles.pipelineNote}>Click any stage for details ↑</div>
      </div>

      <div className={styles.detailsPanel}>
        <div className={styles.detailsTitleRow}>
          <span className={styles.detailsBadge}>STAGE</span>
          <span className={styles.detailsTitle}>{selected.title}</span>
        </div>
        <div className={styles.detailsBody}>
          <DetailRow label="What" value={selected.what} />
          <DetailRow label="Inputs" value={selected.inputs.join('; ')} />
          <DetailRow label="Outputs" value={selected.outputs} />
          <div className={styles.detailsParagraph}>{selected.details}</div>
          <div className={styles.realWorldRow}>
            <span className={styles.realWorldLabel}>Real-world examples</span>
            <span className={styles.realWorldText}>{selected.realWorld}</span>
          </div>
        </div>
      </div>

      <div className={styles.caption}>
        This pipeline is what powers modern distillation. The teacher is expensive to train but
        generates data only once. The student inherits behavior via{' '}
        <strong>standard SFT on teacher outputs</strong>, no soft labels, no KL divergence, no
        special loss. The "distillation" is in the <strong>data source</strong>, not the training
        algorithm. R1-Distill, Phi, Orca all use this recipe.
      </div>
    </div>
  );
}

interface PipelineSvgProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

interface Position {
  x: number;
  y: number;
  tier: 'source' | 'intermediate' | 'goal';
}

const POSITIONS: Record<string, Position> = {
  teacher: { x: 60, y: 60, tier: 'source' },
  prompts: { x: 240, y: 60, tier: 'intermediate' },
  generate: { x: 420, y: 60, tier: 'intermediate' },
  filter: { x: 240, y: 220, tier: 'intermediate' },
  train: { x: 420, y: 220, tier: 'intermediate' },
  student: { x: 600, y: 220, tier: 'goal' },
};

const BOX_W = 120;
const BOX_H = 80;

const SUBLABELS: Record<string, string> = {
  teacher: '~700B',
  prompts: 'diverse',
  generate: 'long traces',
  filter: 'rejection',
  train: 'standard SFT',
  student: 'deployable',
};

const ARROWS: { from: string; to: string; wrap?: boolean }[] = [
  { from: 'teacher', to: 'prompts' },
  { from: 'prompts', to: 'generate' },
  { from: 'generate', to: 'filter', wrap: true },
  { from: 'filter', to: 'train' },
  { from: 'train', to: 'student' },
];

function PipelineSvg({ selectedId, onSelect }: PipelineSvgProps) {
  const WIDTH = 740;
  const HEIGHT = 350;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={styles.svg}
      role="img"
      aria-label="Distillation pipeline: teacher, prompts, generate, filter, train, student"
    >
      <defs>
        <marker
          id="distill-arrow-head"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-secondary)" />
        </marker>
      </defs>

      {ARROWS.map(({ from, to, wrap }, i) => {
        const fromPos = POSITIONS[from]!;
        const toPos = POSITIONS[to]!;
        if (wrap) {
          const startX = fromPos.x + BOX_W / 2;
          const startY = fromPos.y + BOX_H;
          const endX = toPos.x + BOX_W / 2;
          const endY = toPos.y;
          const midY = (startY + endY) / 2;
          const path =
            `M ${startX} ${startY} ` +
            `C ${startX} ${midY + 20}, ` +
            `${endX} ${midY - 20}, ` +
            `${endX} ${endY}`;
          return (
            <path
              key={`arrow-${i}`}
              d={path}
              fill="none"
              className={styles.arrow}
              markerEnd="url(#distill-arrow-head)"
            />
          );
        }
        const startX = fromPos.x + BOX_W;
        const endX = toPos.x;
        const y = fromPos.y + BOX_H / 2;
        return (
          <line
            key={`arrow-${i}`}
            x1={startX}
            y1={y}
            x2={endX}
            y2={y}
            className={styles.arrow}
            markerEnd="url(#distill-arrow-head)"
          />
        );
      })}

      {STAGES.map((s) => {
        const p = POSITIONS[s.id]!;
        const isSelected = selectedId === s.id;
        const tierClass =
          p.tier === 'source'
            ? styles.tier_source
            : p.tier === 'goal'
              ? styles.tier_goal
              : styles.tier_intermediate;
        return (
          <g
            key={s.id}
            onClick={() => onSelect(s.id)}
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(s.id);
              }
            }}
            aria-label={`Stage: ${s.title}`}
          >
            <rect
              x={p.x}
              y={p.y}
              width={BOX_W}
              height={BOX_H}
              className={`${styles.stageBox} ${tierClass} ${isSelected ? styles.stageBoxSelected : ''}`}
              rx={4}
            />
            <text
              x={p.x + BOX_W / 2}
              y={p.y + BOX_H / 2 - 6}
              className={styles.stageLabel}
              textAnchor="middle"
            >
              {s.shortLabel}
            </text>
            <text
              x={p.x + BOX_W / 2}
              y={p.y + BOX_H / 2 + 12}
              className={styles.stageSubLabel}
              textAnchor="middle"
            >
              {SUBLABELS[s.id]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}:</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  );
}

# Session 64 — Preference learning pipeline marquee widget

> The marquee Chapter 14 widget. **Side-by-side comparison of the RLHF and DPO pipelines** using the same preference data as input. RLHF takes the multi-stage path: train reward model → run PPO with KL constraint → trained policy. DPO takes the direct path: skip RM, skip RL, apply DPO loss directly to preference pairs → trained policy. Click any step to see its details (what's trained, what's frozen, what data is needed). Comparison summary at the bottom shows what each pipeline needs: RLHF needs RM + policy + ref + optimizer; DPO needs policy + ref + optimizer. **The visualization that makes the DPO simplification concrete** — readers see *exactly* which steps DPO eliminates. Replaces the section-3 `<WidgetFrame>` placeholder.

---

## Read first (in this order)

1. **`research/ch14-alignment/research.md`** — derivations 2-3 (RLHF objective and DPO derivation) are the source material
2. **`prompts/chapters/ch14-alignment/session-63-page-structure.md`** — for the section-3 widget placeholder this session fills
3. **`prompts/chapters/ch10-training-infrastructure/session-46-parallelism-diagram-widget.md`** — for the static-diagram-with-interactive-details pattern (ParallelismDiagram is the closest precedent)
4. **`prompts/chapters/ch12-ssm-and-mamba/session-55-ssm-vs-attention-widget.md`** — for the side-by-side comparison pattern

---

## Goal

Replace the `<WidgetFrame title="Preference learning pipeline">` placeholder in section 3 with a working interactive widget that:

- Shows a **shared preference pair** at the top (prompt + chosen + rejected response)
- Displays **two parallel columns** below: RLHF (left) and DPO (right)
- Each column shows the pipeline steps as labeled boxes connected by arrows
- **Click any step** → details panel below updates with explanation of that step
- Each column ends with a **components summary**: what models, data, and infrastructure each path needs
- A **bottom-row comparison** highlights the key differences (RM needed? RL loop? Cost?)

**End state:** section 3 of Chapter 14 has a working marquee widget. After 30 seconds of interaction, the reader should be able to articulate: (a) RLHF has 2 distinct training stages (RM + PPO); (b) DPO collapses both into a single stage; (c) both pipelines end at the same destination (trained policy); (d) DPO's simplification comes from a mathematical equivalence, not from skipping the optimization; (e) the cost/complexity gap is significant.

---

## Inputs

State of the repo after session 63:

- `src/pages/ch14-alignment/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 3 and 5)
- `src/lib/chapters.ts` has Ch 14 as `'draft'`
- No `src/components/widgets/ch14/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch14/PreferenceLearningPipeline.tsx` — the React widget
2. **Create** `src/components/widgets/ch14/PreferenceLearningPipeline.module.css` — scoped styles
3. **Create** `src/components/widgets/ch14/pipeline-data.ts` — step definitions for both pipelines
4. **Update** `src/components/widgets/index.ts` — add `PreferenceLearningPipeline` export
5. **Update** `src/pages/ch14-alignment/index.mdx` — replace section-3's `<WidgetFrame>` interior with `<PreferenceLearningPipeline client:visible />`

---

## Detailed spec

### 1. `pipeline-data.ts` — pipeline definitions

```ts
// src/components/widgets/ch14/pipeline-data.ts

export type PipelineId = 'rlhf' | 'dpo';

export interface PipelineStep {
  id: string;
  title: string;
  shortLabel: string;     // displayed inside the box
  stage: string;          // displayed above the title (e.g. "Stage 1")
  what: string;           // 1-sentence "what this step does"
  trains: string;         // what's being trained
  frozen: string;         // what's kept frozen
  inputs: string[];       // data inputs
  outputs: string;        // what comes out
  details: string;        // longer pedagogical explanation
}

export interface Pipeline {
  id: PipelineId;
  label: string;
  description: string;
  steps: PipelineStep[];
  components: string[];        // what you need to run this pipeline
  cost: 'low' | 'medium' | 'high';
  stability: 'low' | 'medium' | 'high';
  costNote: string;
  stabilityNote: string;
}

// Shared preference example used at the top of the widget
export const PREFERENCE_EXAMPLE = {
  prompt: 'What is the capital of France?',
  chosen: 'The capital of France is Paris, located in the north-central region.',
  rejected: 'France has a capital city.',
};

export const RLHF_PIPELINE: Pipeline = {
  id: 'rlhf',
  label: 'RLHF (classical)',
  description: 'The InstructGPT recipe. Two distinct training stages.',
  steps: [
    {
      id: 'rlhf_rm',
      title: 'Train reward model',
      shortLabel: 'Reward model',
      stage: 'Stage 1',
      what: 'Train a reward function r_φ(x, y) to predict human preferences.',
      trains: 'r_φ (a separate model, often initialized from the SFT model)',
      frozen: 'π_SFT (the SFT model)',
      inputs: ['Preference pairs (x, y_w, y_l)'],
      outputs: 'Reward function r_φ : (x, y) → ℝ',
      details: "Optimize the Bradley-Terry loss: -log σ(r_φ(x, y_w) - r_φ(x, y_l)). The reward model learns to assign higher scores to chosen responses than to rejected ones. After training, it's frozen and serves as the reward signal for stage 2. Typical accuracy on held-out preferences: 65-75%.",
    },
    {
      id: 'rlhf_ppo',
      title: 'PPO loop',
      shortLabel: 'PPO (RL)',
      stage: 'Stage 2',
      what: 'Use RL (PPO) to optimize the policy against the reward model, constrained by KL to the reference.',
      trains: 'π_θ (policy weights)',
      frozen: 'π_ref (= π_SFT), r_φ (reward model from stage 1)',
      inputs: ['Prompts x', 'On-policy generations from π_θ', 'Reward r_φ(x, y)', 'KL penalty vs π_ref'],
      outputs: 'Aligned policy π_θ',
      details: 'For each batch: sample responses y from π_θ, score them with r_φ, compute advantages, apply PPO\'s clipped surrogate update. The KL constraint to π_ref prevents reward hacking. Three forward passes per step (policy, ref, reward); on-policy generation is slow. The expensive but historically dominant alignment method.',
    },
  ],
  components: [
    'Policy π_θ (being trained)',
    'Reference π_ref (frozen, = π_SFT)',
    'Reward model r_φ (frozen, from stage 1)',
    'Optimizer (AdamW)',
    'Rollout generator (samples from π_θ)',
  ],
  cost: 'high',
  stability: 'medium',
  costNote: 'Three models in memory; on-policy sampling slow; specialized RL infra.',
  stabilityNote: 'Sensitive to hyperparameters; reward hacking common; needs careful tuning.',
};

export const DPO_PIPELINE: Pipeline = {
  id: 'dpo',
  label: 'DPO (direct)',
  description: 'The supervised loss derived from the KL-regularized RL objective.',
  steps: [
    {
      id: 'dpo_loss',
      title: 'DPO loss',
      shortLabel: 'DPO loss',
      stage: 'Single stage',
      what: 'Apply the DPO loss directly to preference pairs. No reward model. No RL.',
      trains: 'π_θ (policy weights)',
      frozen: 'π_ref (= π_SFT)',
      inputs: ['Preference pairs (x, y_w, y_l)', 'Log-probs under both π_θ and π_ref'],
      outputs: 'Aligned policy π_θ',
      details: "The loss is -log σ(β·log(π_θ(y_w)/π_ref(y_w)) - β·log(π_θ(y_l)/π_ref(y_l))). It's a binary classification objective on policy log-ratios. The 'implicit reward' is the policy log-ratio itself. Standard supervised training: two forward passes (π_θ and π_ref), one backward pass through π_θ. The DPO derivation proves this is mathematically equivalent to RLHF.",
    },
  ],
  components: [
    'Policy π_θ (being trained)',
    'Reference π_ref (frozen, = π_SFT)',
    'Optimizer (AdamW)',
  ],
  cost: 'low',
  stability: 'high',
  costNote: 'Two models in memory; no on-policy sampling; standard fine-tuning infra.',
  stabilityNote: 'Stable; easy to tune; standard supervised training behavior.',
};

export const PIPELINES: Record<PipelineId, Pipeline> = {
  rlhf: RLHF_PIPELINE,
  dpo: DPO_PIPELINE,
};
```

### 2. Visual layout

```
ViewBox: 0 0 800 850

┌────────────────────────────────────────────────────────────────┐
│  Shared input: preference pair                                  │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Prompt   "What is the capital of France?"                   ││
│  │ Chosen   "The capital of France is Paris, located in..."   ││
│  │ Rejected "France has a capital city."                       ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────┐    ┌─────────────────────────┐   │
│  │ RLHF (classical)        │    │ DPO (direct)            │   │
│  │ The InstructGPT recipe. │    │ Math-derived from RLHF. │   │
│  │                          │    │                         │   │
│  │ ┌─────────────────────┐ │    │ ┌─────────────────────┐ │   │
│  │ │ Stage 1              │ │    │ │     (no RM stage)   │ │   │
│  │ │ Train reward model   │ │    │ │   skipped via the   │ │   │
│  │ │ Bradley-Terry loss   │ │    │ │   DPO derivation    │ │   │
│  │ └─────────────────────┘ │    │ └─────────────────────┘ │   │
│  │           ↓              │    │                         │   │
│  │ ┌─────────────────────┐ │    │ ┌─────────────────────┐ │   │
│  │ │ Stage 2              │ │    │ │ Single stage         │ │   │
│  │ │ PPO loop             │ │    │ │ DPO loss             │ │   │
│  │ │ Sample → score → KL  │ │    │ │ log σ(β·Δr)          │ │   │
│  │ │ → update             │ │    │ │ supervised           │ │   │
│  │ └─────────────────────┘ │    │ └─────────────────────┘ │   │
│  │           ↓              │    │           ↓              │   │
│  │ ┌─────────────────────┐ │    │ ┌─────────────────────┐ │   │
│  │ │ Aligned policy π_θ   │ │    │ │ Aligned policy π_θ   │ │   │
│  │ └─────────────────────┘ │    │ └─────────────────────┘ │   │
│  │                          │    │                         │   │
│  │ Components:              │    │ Components:             │   │
│  │  • Policy π_θ            │    │  • Policy π_θ            │   │
│  │  • Reference π_ref       │    │  • Reference π_ref       │   │
│  │  • Reward model r_φ      │    │  • Optimizer            │   │
│  │  • Optimizer            │    │                         │   │
│  │  • Rollout generator     │    │                         │   │
│  │                          │    │                         │   │
│  │ Cost: HIGH               │    │ Cost: LOW               │   │
│  │ Stability: medium        │    │ Stability: high         │   │
│  └─────────────────────────┘    └─────────────────────────┘   │
│                                                                  │
│  Click any step for details ↑                                   │
│                                                                  │
│  Selected step:                                                 │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ STAGE 1 — Train reward model                                ││
│  │ Trains: r_φ (separate model, often init from SFT)           ││
│  │ Frozen: π_SFT                                               ││
│  │ Inputs: Preference pairs (x, y_w, y_l)                      ││
│  │ Outputs: Reward function r_φ : (x, y) → ℝ                    ││
│  │ Details: Optimize the Bradley-Terry loss: -log σ(...) ...   ││
│  └────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- The preference example is static at the top (illustrative; same for both pipelines)
- The two pipelines render side-by-side. RLHF on the left (rose/amber for "more steps"); DPO on the right (cyan for "preferred default")
- Click any step box → details panel below updates with that step's information
- Default selection: first step of the RLHF pipeline (so reader sees the "starting point" of the more complex path)
- Hover any step → subtle highlight (cursor pointer; border lifts slightly)
- The "(skipped)" placeholder in the DPO column visually preserves alignment with RLHF's stage-1 row, making the *omission* obvious

### 3. `PreferenceLearningPipeline.tsx`

```tsx
import { useState } from 'react';
import {
  PIPELINES, PREFERENCE_EXAMPLE, type PipelineId, type PipelineStep,
} from './pipeline-data';
import styles from './PreferenceLearningPipeline.module.css';

export default function PreferenceLearningPipeline() {
  const [selected, setSelected] = useState<{ pipeline: PipelineId; step: string }>({
    pipeline: 'rlhf',
    step: 'rlhf_rm',
  });

  const selectedPipeline = PIPELINES[selected.pipeline];
  const selectedStep = selectedPipeline.steps.find(s => s.id === selected.step) ?? selectedPipeline.steps[0]!;

  return (
    <div className={styles.widget}>
      {/* Shared preference data */}
      <div className={styles.dataPanel}>
        <div className={styles.dataTitle}>Shared input: preference pair</div>
        <div className={styles.dataRow}>
          <span className={styles.dataLabel}>Prompt</span>
          <span className={styles.dataValue}>"{PREFERENCE_EXAMPLE.prompt}"</span>
        </div>
        <div className={`${styles.dataRow} ${styles.chosenRow}`}>
          <span className={styles.dataLabel}>Chosen</span>
          <span className={styles.dataValue}>"{PREFERENCE_EXAMPLE.chosen}"</span>
        </div>
        <div className={`${styles.dataRow} ${styles.rejectedRow}`}>
          <span className={styles.dataLabel}>Rejected</span>
          <span className={styles.dataValue}>"{PREFERENCE_EXAMPLE.rejected}"</span>
        </div>
      </div>

      {/* Side-by-side pipelines */}
      <div className={styles.pipelinesGrid}>
        <PipelineColumn
          id="rlhf"
          isSelected={selected.pipeline === 'rlhf'}
          selectedStepId={selected.step}
          onSelectStep={(stepId) => setSelected({ pipeline: 'rlhf', step: stepId })}
        />
        <PipelineColumn
          id="dpo"
          isSelected={selected.pipeline === 'dpo'}
          selectedStepId={selected.step}
          onSelectStep={(stepId) => setSelected({ pipeline: 'dpo', step: stepId })}
        />
      </div>

      {/* Selected step details */}
      <div className={styles.detailsPanel}>
        <div className={styles.detailsTitle}>
          <span className={styles.detailsBadge}>{selectedStep.stage}</span>
          <span className={styles.detailsHeading}>{selectedStep.title}</span>
          <span className={styles.detailsPipelineLabel}>
            ({selectedPipeline.label})
          </span>
        </div>
        <div className={styles.detailsBody}>
          <div className={styles.detailsRow}>
            <span className={styles.detailsLabel}>What:</span>
            <span className={styles.detailsValue}>{selectedStep.what}</span>
          </div>
          <div className={styles.detailsRow}>
            <span className={styles.detailsLabel}>Trains:</span>
            <span className={styles.detailsValue}>{selectedStep.trains}</span>
          </div>
          <div className={styles.detailsRow}>
            <span className={styles.detailsLabel}>Frozen:</span>
            <span className={styles.detailsValue}>{selectedStep.frozen}</span>
          </div>
          <div className={styles.detailsRow}>
            <span className={styles.detailsLabel}>Inputs:</span>
            <span className={styles.detailsValue}>
              {selectedStep.inputs.join(', ')}
            </span>
          </div>
          <div className={styles.detailsRow}>
            <span className={styles.detailsLabel}>Outputs:</span>
            <span className={styles.detailsValue}>{selectedStep.outputs}</span>
          </div>
          <div className={styles.detailsParagraph}>{selectedStep.details}</div>
        </div>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        Both pipelines start with the same preference data and end with an aligned policy. <strong>RLHF</strong>{' '}
        takes a two-stage path: train a reward model from preferences, then optimize the policy with PPO against
        the reward (with a KL constraint). <strong>DPO</strong> uses the closed-form solution of the RLHF
        objective to collapse everything into a single supervised step — no reward model, no RL loop. <strong>The
        math is equivalent; the algorithm is different.</strong>
      </div>
    </div>
  );
}

interface PipelineColumnProps {
  id: PipelineId;
  isSelected: boolean;
  selectedStepId: string;
  onSelectStep: (stepId: string) => void;
}

function PipelineColumn({ id, isSelected, selectedStepId, onSelectStep }: PipelineColumnProps) {
  const pipeline = PIPELINES[id];
  const columnClass = id === 'rlhf' ? styles.columnRLHF : styles.columnDPO;

  return (
    <div className={`${styles.pipelineColumn} ${columnClass}`}>
      {/* Column header */}
      <div className={styles.columnHeader}>
        <div className={styles.columnTitle}>{pipeline.label}</div>
        <div className={styles.columnDescription}>{pipeline.description}</div>
      </div>

      {/* Steps */}
      <div className={styles.stepsContainer}>
        {/* For DPO, insert a "skipped" placeholder so the columns align */}
        {id === 'dpo' && (
          <>
            <div className={styles.skippedBox}>
              <div className={styles.skippedLabel}>(no RM stage)</div>
              <div className={styles.skippedSubtext}>skipped via the DPO derivation</div>
            </div>
            <div className={styles.arrowSpacer} />
          </>
        )}

        {pipeline.steps.map((step, index) => (
          <div key={step.id}>
            <StepBox
              step={step}
              isSelected={isSelected && selectedStepId === step.id}
              onClick={() => onSelectStep(step.id)}
            />
            {index < pipeline.steps.length - 1 && <StepArrow />}
          </div>
        ))}

        {/* Final arrow + destination */}
        <StepArrow />
        <div className={styles.destinationBox}>
          <div className={styles.destinationLabel}>Aligned policy π_θ</div>
        </div>
      </div>

      {/* Components summary */}
      <div className={styles.componentsPanel}>
        <div className={styles.componentsTitle}>Components</div>
        <ul className={styles.componentsList}>
          {pipeline.components.map((c, i) => (
            <li key={i} className={styles.componentItem}>{c}</li>
          ))}
        </ul>
      </div>

      {/* Cost + stability summary */}
      <div className={styles.summaryRow}>
        <Tag label="Cost" value={pipeline.cost} note={pipeline.costNote} />
        <Tag label="Stability" value={pipeline.stability} note={pipeline.stabilityNote} />
      </div>
    </div>
  );
}

function StepBox({ step, isSelected, onClick }: { step: PipelineStep; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      className={`${styles.stepBox} ${isSelected ? styles.stepBoxSelected : ''}`}
      onClick={onClick}
      type="button"
    >
      <div className={styles.stepStage}>{step.stage}</div>
      <div className={styles.stepLabel}>{step.shortLabel}</div>
      <div className={styles.stepWhat}>{step.what}</div>
    </button>
  );
}

function StepArrow() {
  return <div className={styles.stepArrow} aria-hidden="true">↓</div>;
}

function Tag({ label, value, note }: { label: string; value: 'low' | 'medium' | 'high'; note: string }) {
  return (
    <div className={`${styles.tag} ${styles[`tag_${value}`]}`} title={note}>
      <span className={styles.tagLabel}>{label}:</span>
      <span className={styles.tagValue}>{value.toUpperCase()}</span>
    </div>
  );
}
```

### 4. `PreferenceLearningPipeline.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

/* === Shared data panel === */
.dataPanel {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}
.dataTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 0.6rem;
}
.dataRow {
  display: flex;
  gap: 0.75rem;
  font-size: 0.82rem;
  padding: 0.3rem 0;
  align-items: baseline;
}
.dataLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  min-width: 70px;
}
.dataValue {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  color: var(--text-secondary);
  flex: 1;
}
.chosenRow .dataLabel { color: var(--emerald-400); }
.chosenRow .dataValue { color: var(--text-primary); }
.rejectedRow .dataLabel { color: var(--rose-400); }

/* === Pipelines grid === */
.pipelinesGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.pipelineColumn {
  padding: 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.columnRLHF { border-color: color-mix(in srgb, var(--amber-400) 30%, var(--border-subtle)); }
.columnDPO  { border-color: color-mix(in srgb, var(--cyan-500) 30%, var(--border-subtle)); }

.columnHeader {
  padding-bottom: 0.6rem;
  border-bottom: 1px solid var(--border-subtle);
}
.columnTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.95rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}
.columnRLHF .columnTitle { color: var(--amber-400); }
.columnDPO  .columnTitle { color: var(--cyan-300); }

.columnDescription {
  font-size: 0.78rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* === Steps === */
.stepsContainer { display: flex; flex-direction: column; align-items: stretch; gap: 0.3rem; }

.stepBox {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.65rem 0.85rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 200ms;
  font-family: 'Inter', sans-serif;
}
.stepBox:hover {
  border-color: var(--text-secondary);
  transform: translateY(-1px);
}
.stepBoxSelected {
  border-color: var(--cyan-500);
  background: color-mix(in srgb, var(--cyan-500) 6%, var(--bg-primary));
  box-shadow: 0 0 0 1px var(--cyan-500);
}
.stepStage {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 0.2rem;
}
.stepLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.88rem;
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 0.25rem;
}
.columnRLHF .stepBoxSelected .stepLabel { color: var(--cyan-300); }
.stepWhat {
  font-size: 0.74rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.stepArrow {
  font-family: 'JetBrains Mono', monospace;
  text-align: center;
  font-size: 1.1rem;
  color: var(--text-tertiary);
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.skippedBox {
  padding: 0.65rem 0.85rem;
  background: var(--bg-primary);
  border: 1px dashed var(--border-default);
  border-radius: var(--radius-sm);
  opacity: 0.55;
  text-align: center;
}
.skippedLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-tertiary);
  font-style: italic;
}
.skippedSubtext {
  font-size: 0.7rem;
  color: var(--text-tertiary);
  margin-top: 0.15rem;
}
.arrowSpacer { height: 22px; }

.destinationBox {
  padding: 0.7rem 1rem;
  background: color-mix(in srgb, var(--cyan-500) 8%, var(--bg-primary));
  border: 1px solid var(--cyan-500);
  border-radius: var(--radius-sm);
  text-align: center;
}
.destinationLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: var(--cyan-300);
  font-weight: 500;
}

/* === Components panel === */
.componentsPanel {
  padding: 0.6rem 0.85rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}
.componentsTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.35rem;
}
.componentsList { list-style: none; margin: 0; padding: 0; }
.componentItem {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: var(--text-secondary);
  padding: 0.15rem 0;
  padding-left: 0.85rem;
  position: relative;
}
.componentItem::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--text-tertiary);
}

/* === Summary tags === */
.summaryRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
}
.tag {
  padding: 0.35rem 0.6rem;
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  font-family: 'JetBrains Mono', monospace;
  cursor: default;
}
.tagLabel { font-size: 0.62rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.06em; }
.tagValue { font-size: 0.8rem; font-weight: 500; }
.tag_low    { background: color-mix(in srgb, var(--emerald-400) 10%, transparent); }
.tag_low .tagValue    { color: var(--emerald-400); }
.tag_medium { background: color-mix(in srgb, var(--amber-400) 10%, transparent); }
.tag_medium .tagValue { color: var(--amber-400); }
.tag_high   { background: color-mix(in srgb, var(--rose-400) 10%, transparent); }
.tag_high .tagValue   { color: var(--rose-400); }

/* === Details panel === */
.detailsPanel {
  padding: 0.85rem 1rem;
  background: color-mix(in srgb, var(--cyan-500) 5%, var(--bg-elevated));
  border: 1px solid var(--cyan-500);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}
.detailsTitle {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.7rem;
  flex-wrap: wrap;
}
.detailsBadge {
  padding: 0.15rem 0.45rem;
  background: var(--cyan-500);
  color: var(--bg-primary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  font-weight: 500;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.detailsHeading {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9rem;
  color: var(--cyan-300);
  font-weight: 500;
}
.detailsPipelineLabel {
  font-size: 0.78rem;
  color: var(--text-tertiary);
  font-style: italic;
}
.detailsBody { display: flex; flex-direction: column; gap: 0.35rem; }
.detailsRow {
  display: flex;
  gap: 0.6rem;
  font-size: 0.8rem;
  font-family: 'JetBrains Mono', monospace;
}
.detailsLabel { color: var(--text-tertiary); min-width: 70px; }
.detailsValue { color: var(--text-primary); flex: 1; }
.detailsParagraph {
  padding-top: 0.6rem;
  margin-top: 0.4rem;
  border-top: 1px solid color-mix(in srgb, var(--cyan-500) 25%, transparent);
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.55;
}

/* === Caption === */
.caption {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.55;
}
.caption strong { color: var(--cyan-300); font-weight: 500; }

@media (max-width: 720px) {
  .pipelinesGrid { grid-template-columns: 1fr; }
  .dataRow { flex-direction: column; gap: 0.15rem; }
  .dataLabel { min-width: 0; }
  .summaryRow { grid-template-columns: 1fr; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as PreferenceLearningPipeline } from './ch14/PreferenceLearningPipeline';
// Session 65 will add:
// export { default as DPOLossLandscape } from './ch14/DPOLossLandscape';
```

### 6. Update `src/pages/ch14-alignment/index.mdx`

**Edit A: Add widget import:**

```mdx
import { PreferenceLearningPipeline } from '@components/widgets';
```

**Edit B: Replace section-3's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Preference learning pipeline" caption="The data flow from a preference pair to a trained policy, comparing classical RLHF and DPO pipelines side-by-side. Same preference data; two algorithmic paths. RLHF has a two-stage pipeline (reward model + PPO); DPO collapses to one stage (direct loss). Click any step for details on what it trains, what's frozen, and what's needed.">
  <PreferenceLearningPipeline client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 3 of Ch 14** renders with the working widget. Section 5's placeholder still stubbed.
3. **Default state:** RLHF column's "Train reward model" step is selected; details panel shows its description.
4. **Shared preference data panel** at top renders the prompt + chosen + rejected:
   - Chosen label colored emerald (good outcome)
   - Rejected label colored rose (negative outcome)
5. **Two columns side-by-side**:
   - **RLHF column**: amber-tinted border; "RLHF (classical)" title in amber
   - **DPO column**: cyan-tinted border; "DPO (direct)" title in cyan
6. **RLHF column shows two step boxes**: "Train reward model" (Stage 1) → "PPO loop" (Stage 2). Down arrow between them.
7. **DPO column shows**: a dashed "(no RM stage) — skipped via DPO derivation" placeholder (visually aligned with RLHF's Stage 1), then a single "DPO loss" step box (visually aligned with RLHF's Stage 2). **The skipped placeholder is the visual punchline.**
8. **Both columns end with**: down arrow → "Aligned policy π_θ" destination box (cyan-bordered, same in both — emphasizes both arrive at the same destination).
9. **Components panel** beneath each pipeline lists what's needed:
   - **RLHF**: 5 components (policy, ref, RM, optimizer, rollout generator)
   - **DPO**: 3 components (policy, ref, optimizer)
10. **Summary tags**:
    - **RLHF**: Cost = HIGH (rose), Stability = MEDIUM (amber)
    - **DPO**: Cost = LOW (emerald), Stability = HIGH (emerald)
11. **Click any step box** → details panel updates with step's full data (what, trains, frozen, inputs, outputs, details paragraph).
12. **Hover any step box** → border lifts (translateY -1px), border color brightens.
13. **Selected step has visible "selected" indicator**: cyan border + cyan-tinted background + box-shadow ring.
14. **Mobile (< 720px)**: pipelines stack vertically; data rows wrap; summary tags stack.
15. **`npm run typecheck`** passes.
16. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not animate the pipelines** (no step-by-step playback). Static + interactive selection only.
- ❌ **Do not implement actual training** in the widget. It's a static diagram of the conceptual flow.
- ❌ **Do not add a third "RLVR" column** here. RLVR is conceptually adjacent but has different inputs (verifiable rewards instead of preference pairs). Out of scope for this widget.
- ❌ **Do not visualize KL constraint mechanics** in the diagram. That's section-4 territory.
- ❌ **Do not show the DPO loss landscape** — that's session 65's secondary widget.
- ❌ **Do not flip Ch 14's status.** Session 66 owns that.

---

## Wire-up

```bash
git add src/components/widgets/ch14/ src/components/widgets/index.ts src/pages/ch14-alignment/index.mdx
git commit -m "session 64: preference learning pipeline marquee — RLHF vs DPO side-by-side"
git push origin main
```

Verify on production:
- Side-by-side columns at default
- Skipped placeholder visible in DPO column (visually dashed, dimmed)
- Click each step → details update
- Both pipelines end at the same destination box (cyan)
- Mobile: columns stack vertically

---

## Notes for the session author

**On the "(skipped)" placeholder being the visual punchline:**
The DPO column's stage-1 row is a *dashed, dimmed* box labeled "(no RM stage) — skipped via the DPO derivation." This is **critical** — it preserves vertical alignment with RLHF's stage 1, making the *absence* obvious. Without it, DPO's column would just be shorter; with it, the reader sees the explicit *omission*. This is the chapter's pedagogical centerpiece visualized.

**On the column color coding:**
- **RLHF = amber**: warmer, suggests "the more complex path"; the historical default
- **DPO = cyan**: the project default; the "preferred for open-source" indicator
- **Destination box (in both columns) = cyan**: same color emphasizes that both arrive at the same destination

**On the cost/stability tags using emerald/amber/rose:**
- **Cost LOW → emerald**, MEDIUM → amber, HIGH → rose: standard traffic-light coloring
- **Stability HIGH → emerald**, MEDIUM → amber, LOW → rose: matched semantics
- DPO's profile (Cost LOW + Stability HIGH) gets two emerald tags — visual reinforcement of "this is the easier path"
- RLHF's profile (Cost HIGH + Stability MEDIUM) gets rose + amber — "harder path, more carefully tuned"

**On the selected-step details being comprehensive:**
The details panel shows 5 rows + 1 paragraph for each step:
- What (1-sentence summary)
- Trains (which model gets gradient)
- Frozen (which models are kept fixed)
- Inputs (what data the step needs)
- Outputs (what comes out)
- Details paragraph (longer pedagogical explanation)

This structure makes every step legible at a glance. Reader can click through all 3 steps (RLHF stage 1, RLHF stage 2, DPO loss) and build a complete mental model.

**On the components count being explicit:**
RLHF's component list (5 items) vs DPO's (3 items) makes the simplification concrete. **DPO needs fewer things** — fewer models in memory, no rollout generator, no separate RM training run. Engineers reading this internalize the practical implications.

**Pedagogical claim this widget supports:**
"RLHF and DPO are not opposing approaches — they're two algorithmic paths to the same destination. RLHF takes the multi-stage path: train a reward model, then run PPO with KL constraint. DPO takes the direct path: a clever derivation shows you can collapse both stages into a single supervised loss. The math is equivalent; the algorithm is different. DPO needs fewer components, costs less, is more stable to train. RLHF gets used by frontier labs because it sometimes achieves higher peak performance; DPO dominates open-source because it's easier to make work."

After 30 seconds of interaction, the reader has internalized: (a) both pipelines start with preference data and end with an aligned policy; (b) RLHF's stage 1 (reward modeling) is *skipped* in DPO via the derivation; (c) RLHF's stage 2 (PPO) is *replaced* by DPO's direct loss; (d) DPO needs fewer components; (e) the choice between them is operational, not mathematical.

**This widget is the chapter's central visual.** No equation makes the algorithmic-family relationship as clear as the side-by-side view.

Build with care.

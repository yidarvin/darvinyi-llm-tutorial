import { useState } from 'react';
import {
  PIPELINES,
  PREFERENCE_EXAMPLE,
  type PipelineId,
  type PipelineStep,
} from './pipeline-data';
import styles from './PreferenceLearningPipeline.module.css';

export default function PreferenceLearningPipeline() {
  const [selected, setSelected] = useState<{ pipeline: PipelineId; step: string }>({
    pipeline: 'rlhf',
    step: 'rlhf_rm',
  });

  const selectedPipeline = PIPELINES[selected.pipeline];
  const selectedStep =
    selectedPipeline.steps.find((s) => s.id === selected.step) ?? selectedPipeline.steps[0]!;

  return (
    <div className={styles.widget}>
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

      <div className={styles.detailsPanel}>
        <div className={styles.detailsTitle}>
          <span className={styles.detailsBadge}>{selectedStep.stage}</span>
          <span className={styles.detailsHeading}>{selectedStep.title}</span>
          <span className={styles.detailsPipelineLabel}>({selectedPipeline.label})</span>
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
            <span className={styles.detailsValue}>{selectedStep.inputs.join(', ')}</span>
          </div>
          <div className={styles.detailsRow}>
            <span className={styles.detailsLabel}>Outputs:</span>
            <span className={styles.detailsValue}>{selectedStep.outputs}</span>
          </div>
          <div className={styles.detailsParagraph}>{selectedStep.details}</div>
        </div>
      </div>

      <div className={styles.caption}>
        Both pipelines start with the same preference data and end with an aligned policy.{' '}
        <strong>RLHF</strong> takes a two-stage path: train a reward model from preferences, then
        optimize the policy with PPO against the reward (with a KL constraint).{' '}
        <strong>DPO</strong> uses the closed-form solution of the RLHF objective to collapse
        everything into a single supervised step: no reward model, no RL loop.{' '}
        <strong>The math is equivalent; the algorithm is different.</strong>
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
      <div className={styles.columnHeader}>
        <div className={styles.columnTitle}>{pipeline.label}</div>
        <div className={styles.columnDescription}>{pipeline.description}</div>
      </div>

      <div className={styles.stepsContainer}>
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

        <StepArrow />
        <div className={styles.destinationBox}>
          <div className={styles.destinationLabel}>Aligned policy π_θ</div>
        </div>
      </div>

      <div className={styles.componentsPanel}>
        <div className={styles.componentsTitle}>Components</div>
        <ul className={styles.componentsList}>
          {pipeline.components.map((c, i) => (
            <li key={i} className={styles.componentItem}>
              {c}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.summaryRow}>
        <Tag label="Cost" value={pipeline.cost} note={pipeline.costNote} />
        <Tag label="Stability" value={pipeline.stability} note={pipeline.stabilityNote} />
      </div>
    </div>
  );
}

function StepBox({
  step,
  isSelected,
  onClick,
}: {
  step: PipelineStep;
  isSelected: boolean;
  onClick: () => void;
}) {
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
  return (
    <div className={styles.stepArrow} aria-hidden="true">
      ↓
    </div>
  );
}

function Tag({
  label,
  value,
  note,
}: {
  label: string;
  value: 'low' | 'medium' | 'high';
  note: string;
}) {
  const tagToneClass =
    value === 'low' ? styles.tagLow : value === 'medium' ? styles.tagMedium : styles.tagHigh;
  return (
    <div className={`${styles.tag} ${tagToneClass}`} title={note}>
      <span className={styles.tagLabel}>{label}:</span>
      <span className={styles.tagValue}>{value.toUpperCase()}</span>
    </div>
  );
}

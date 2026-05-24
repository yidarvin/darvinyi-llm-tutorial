export type PipelineId = 'rlhf' | 'dpo';

export interface PipelineStep {
  id: string;
  title: string;
  shortLabel: string;
  stage: string;
  what: string;
  trains: string;
  frozen: string;
  inputs: string[];
  outputs: string;
  details: string;
}

export interface Pipeline {
  id: PipelineId;
  label: string;
  description: string;
  steps: PipelineStep[];
  components: string[];
  cost: 'low' | 'medium' | 'high';
  stability: 'low' | 'medium' | 'high';
  costNote: string;
  stabilityNote: string;
}

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
      details:
        "Optimize the Bradley-Terry loss: -log σ(r_φ(x, y_w) - r_φ(x, y_l)). The reward model learns to assign higher scores to chosen responses than to rejected ones. After training, it's frozen and serves as the reward signal for stage 2. Typical accuracy on held-out preferences: 65-75%.",
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
      details:
        "For each batch: sample responses y from π_θ, score them with r_φ, compute advantages, apply PPO's clipped surrogate update. The KL constraint to π_ref prevents reward hacking. Three forward passes per step (policy, ref, reward); on-policy generation is slow. The expensive but historically dominant alignment method.",
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
      details:
        "The loss is -log σ(β·log(π_θ(y_w)/π_ref(y_w)) - β·log(π_θ(y_l)/π_ref(y_l))). It's a binary classification objective on policy log-ratios. The 'implicit reward' is the policy log-ratio itself. Standard supervised training: two forward passes (π_θ and π_ref), one backward pass through π_θ. The DPO derivation proves this is mathematically equivalent to RLHF.",
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

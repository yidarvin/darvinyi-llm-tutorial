export interface PipelineStage {
  id: string;
  title: string;
  shortLabel: string;
  what: string;
  inputs: string[];
  outputs: string;
  details: string;
  realWorld: string;
}

export const STAGES: PipelineStage[] = [
  {
    id: 'teacher',
    title: 'Teacher (frozen, capable)',
    shortLabel: 'Teacher',
    what: 'A fully-trained, capable model. The source of behavior to be distilled.',
    inputs: ['Already trained via pre-training + SFT + preference optimization (+ optional RLVR)'],
    outputs: 'A capable model that can answer queries well — but is too big/expensive to deploy at scale.',
    details:
      'The teacher is the entire output of Phase 11 chapters 13-15 (and optionally Ch 14 RLVR for reasoning). For DeepSeek-R1-Distill, the teacher is DeepSeek-R1 (a frontier reasoning model). For Phi, the teacher is GPT-4-class. The teacher is frozen — never updated during distillation. Its role is purely to generate training data for the student.',
    realWorld: 'R1-Distill teacher: DeepSeek-R1 (~700B+ MoE). Phi teacher: GPT-4-class. Orca teacher: GPT-4.',
  },
  {
    id: 'prompts',
    title: 'Diverse prompt set',
    shortLabel: 'Prompts',
    what: "A large collection of diverse queries that elicit the teacher's desired behaviors.",
    inputs: [
      'Curated query collection covering target capabilities (instruction following, reasoning, code, math, etc.)',
    ],
    outputs: 'A list of prompts (often 100K to 10M+) to send to the teacher.',
    details:
      'Prompt diversity matters more than prompt count. Cover all behaviors the student should inherit: instruction following, multi-turn dialogue, math problems, code generation, reasoning chains. Often combine: existing instruction datasets + synthetic prompt expansion + targeted-capability prompts. Quality of prompts determines what the student can learn.',
    realWorld:
      'R1-Distill: 800K reasoning-heavy prompts (math, coding, science). Phi: textbook-quality educational prompts. Orca: GPT-4-generated explanation prompts.',
  },
  {
    id: 'generate',
    title: 'Teacher generates responses',
    shortLabel: 'Generate',
    what: 'Run the teacher on each prompt to produce a response.',
    inputs: ['Prompts (from previous stage)', 'Teacher (frozen)'],
    outputs: 'Raw (prompt, response) pairs — typically 1M+ examples.',
    details:
      'For reasoning distillation: the teacher generates not just answers but full chain-of-thought traces. The student learns to imitate the reasoning, not just the conclusion. For preference distillation: the teacher generates multiple responses per prompt (for diversity). For instruction distillation: a single high-quality response per prompt.',
    realWorld:
      'R1-Distill: R1 generates full <think>...</think> reasoning traces + final answers. Phi: GPT-4 generates textbook-quality explanations. Computational cost: significant — this stage dominates the distillation budget.',
  },
  {
    id: 'filter',
    title: 'Filter for quality',
    shortLabel: 'Filter',
    what: "Score and filter the teacher's outputs; reject low-quality examples.",
    inputs: ['Raw teacher outputs', 'Quality criteria (verifier, scoring model, or rubric)'],
    outputs: 'Filtered high-quality (prompt, response) pairs — typically 30-70% of raw outputs survive.',
    details:
      'Quality filtering is critical — the student inherits whatever quality level survives this stage. Common criteria: correctness verification (for math/code with verifiable rewards), length filters (reject pathological short/long), self-consistency (teacher gives the same answer when re-sampled), heuristic rubrics (formatting, completeness, no refusals). Modern recipes lean heavily on rejection sampling: generate many candidates per prompt, keep only the best.',
    realWorld:
      'R1-Distill: rule-based correctness verification on math + code; rejection sampling for general reasoning. Phi: quality classification + manual review. Orca: GPT-4 self-grading.',
  },
  {
    id: 'train',
    title: 'Student SFT',
    shortLabel: 'Train',
    what: 'Train the student model via standard SFT on the filtered data.',
    inputs: ['Filtered (prompt, response) pairs', 'Student model architecture (smaller than teacher)'],
    outputs: "A trained student that has learned to imitate the teacher's behaviors.",
    details:
      "This stage is exactly Ch 13's SFT training loop — no special \"distillation loss\" needed. Token-level cross-entropy on the response tokens; mask the loss on prompt tokens. Standard learning rate, standard optimizer, standard training. The \"distillation\" is implicit: the data source is the teacher, not humans. Run for several epochs; the smaller student fits the data well.",
    realWorld:
      "R1-Distill: SFT on student architectures from 1.5B to 32B. Phi: training from scratch on filtered synthetic data. Orca: SFT on top of Llama-class base models. Training compute much smaller than the teacher's original training.",
  },
  {
    id: 'student',
    title: 'Student (deployable)',
    shortLabel: 'Student',
    what: 'The compressed result: small enough to serve cheaply, capable enough to be useful.',
    inputs: ['Trained student from the SFT stage'],
    outputs: 'A model ready for production deployment — possibly followed by further PEFT for task specialization.',
    details:
      "The student inherits most of the teacher's capabilities at a fraction of the cost. For R1-Distill-Qwen-32B: matches o1-mini on math and coding despite being far smaller than R1. For Phi-3-mini (3.8B): approaches GPT-3.5 on many benchmarks. For DistilBERT: 97% of BERT's GLUE score at 40% the size. The deployment cost difference is typically 5-20× cheaper per request.",
    realWorld:
      "R1-Distill-Qwen-32B: matches o1-mini on math/code; 32B params vs R1's 671B. Phi-3-mini: 3.8B, deploys on consumer hardware. Gemma 2 9B: matches Llama 2 70B on benchmarks at 8× smaller.",
  },
];

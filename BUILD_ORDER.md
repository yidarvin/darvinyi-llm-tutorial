# BUILD_ORDER

> **Historical build record, completed 2026-07-15.** This completed file inventory is retained as an
> archaeological record. Use [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md) for active work.

The full file list for `darvinyi-llm-tutorial`, in the order each file should be created. Each entry is one focused Claude chat message — say **"continue to the next file"** to trigger the next.

**Total files:** 177 (5 foundation + 6 scaffolding prompts + 30 chapter research files + 130 chapter session prompts + 6 polish prompts)

Status legend: ⬜ pending · 🔄 in progress · ✅ created

---

## Phase 1 — Foundation (5 files)

Read by every downstream Claude Code session. Highest leverage; write with full care.

| # | Status | Path |
|---|---|---|
| 1 | ✅ | `context/PROJECT_OVERVIEW.md` |
| 2 | ✅ | `context/DESIGN_SYSTEM.md` |
| 3 | ✅ | `context/TECH_STACK.md` |
| 4 | ✅ | `context/CURRICULUM.md` |
| 5 | ✅ | `MASTER_PLAN.md` |

**Phase exit:** commit all 5 to git. Phase 2 begins.

---

## Phase 2 — Scaffolding prompts (6 files)

Site infrastructure. After Claude Code runs these, the site is live with no chapter content.

| # | Status | Path |
|---|---|---|
| 6  | ✅ | `prompts/scaffolding/session-01-repo-init.md` |
| 7  | ✅ | `prompts/scaffolding/session-02-design-system.md` |
| 8  | ✅ | `prompts/scaffolding/session-03-mdx-content-pipeline.md` |
| 9  | ✅ | `prompts/scaffolding/session-04-layout-and-navigation.md` |
| 10 | ✅ | `prompts/scaffolding/session-05-pyodide-runnable-code.md` |
| 11 | ✅ | `prompts/scaffolding/session-06-deployment-and-domain.md` |

**Phase exit:** hand prompts to Claude Code, build through session 06, verify deployment is live at `llm-tutorial.darvinyi.com` (empty landing page is fine for now).

---

## Phase 3 — Chapter 1 end-to-end (5 files) · validation point

First real chapter. Validates the chapter prompt format before scaling to 29 more.

| # | Status | Path |
|---|---|---|
| 12 | ✅ | `research/ch01-neural-net-primitives/research.md` |
| 13 | ✅ | `prompts/chapters/ch01-neural-net-primitives/session-07-page-structure.md` |
| 14 | ✅ | `prompts/chapters/ch01-neural-net-primitives/session-08-backprop-visualizer.md` |
| 15 | ✅ | `prompts/chapters/ch01-neural-net-primitives/session-09-mlp-runnable.md` |
| 16 | ✅ | `prompts/chapters/ch01-neural-net-primitives/session-10-autograd-and-exercises.md` |

**Phase exit · VALIDATION:** build Ch 1 in Claude Code. If it comes out well, the pattern is locked. If not, tune the prompt template before scaling.

---

## Phase 4 — Part I remaining (9 files)

| # | Status | Path |
|---|---|---|
| 17 | ✅ | `research/ch02-embeddings/research.md` |
| 18 | ✅ | `prompts/chapters/ch02-embeddings/session-11-page-structure.md` |
| 19 | ✅ | `prompts/chapters/ch02-embeddings/session-12-embedding-space-widget.md` |
| 20 | ✅ | `prompts/chapters/ch02-embeddings/session-13-word2vec-and-exercises.md` |
| 21 | ✅ | `research/ch03-tokenization/research.md` |
| 22 | ✅ | `prompts/chapters/ch03-tokenization/session-14-page-structure.md` |
| 23 | ✅ | `prompts/chapters/ch03-tokenization/session-15-bpe-training-widget.md` |
| 24 | ✅ | `prompts/chapters/ch03-tokenization/session-16-tokenizer-comparison-and-exercises.md` |
| 25 | ⏭️ | _(absorbed into file 24 — 4-session cadence per Phase 4 retrospective)_ |

---

## Phase 5 — Part II: The Transformer (17 files)

| # | Status | Path |
|---|---|---|
| 26 | ✅ | `research/ch04-attention/research.md` |
| 27 | ✅ | `prompts/chapters/ch04-attention/session-18-page-structure.md` |
| 28 | ✅ | `prompts/chapters/ch04-attention/session-19-attention-heatmap-widget.md` |
| 29 | ✅ | `prompts/chapters/ch04-attention/session-20-causal-mask-and-exercises.md` |
| 30 | ⏭️ | _(absorbed into file 29 — 4-session cadence)_ |
| 31 | ⏭️ | _(absorbed into file 29 — 4-session cadence)_ |
| 32 | ✅ | `research/ch05-multihead-and-block/research.md` |
| 33 | ✅ | `prompts/chapters/ch05-multihead-and-block/session-23-page-structure.md` |
| 34 | ✅ | `prompts/chapters/ch05-multihead-and-block/session-24-multihead-decomposition-widget.md` |
| 35 | ✅ | `prompts/chapters/ch05-multihead-and-block/session-25-transformer-block-flow-widget.md` |
| 36 | ✅ | `prompts/chapters/ch05-multihead-and-block/session-26-exercises-and-closeout.md` |
| 37 | ⏭️ | _(absorbed into file 36 — 5-file cadence for Ch 5 instead of original 6)_ |
| 38 | ✅ | `research/ch06-positional-encoding/research.md` |
| 39 | ✅ | `prompts/chapters/ch06-positional-encoding/session-28-page-structure.md` |
| 40 | ✅ | `prompts/chapters/ch06-positional-encoding/session-29-sinusoidal-pe-visualizer.md` |
| 41 | ✅ | `prompts/chapters/ch06-positional-encoding/session-30-rope-rotation-and-exercises.md` |
| 42 | ⏭️ | _(absorbed into file 41 — 4-file cadence for Ch 6)_ |

---

## Phase 6 — Part III: Pre-training (22 files)

| # | Status | Path |
|---|---|---|
| 43 | ✅ | `research/ch07-pretraining-data/research.md` |
| 44 | ✅ | `prompts/chapters/ch07-pretraining-data/session-32-page-structure.md` |
| 45 | ✅ | `prompts/chapters/ch07-pretraining-data/session-33-dedup-interactive-widget.md` |
| 46 | ✅ | `prompts/chapters/ch07-pretraining-data/session-34-quality-filter-and-exercises.md` |
| 47 | ⏭️ | _(absorbed into file 46 — 4-file cadence for Ch 7)_ |
| 48 | ✅ | `research/ch08-building-small-llm/research.md` |
| 49 | ✅ | `prompts/chapters/ch08-building-small-llm/session-36-page-structure.md` |
| 50 | ✅ | `prompts/chapters/ch08-building-small-llm/session-37-loss-curve-widget.md` |
| 51 | ✅ | `prompts/chapters/ch08-building-small-llm/session-38-optimizer-comparison-widget.md` |
| 52 | ✅ | `prompts/chapters/ch08-building-small-llm/session-39-exercises-and-closeout.md` |
| 53 | ⏭️ | _(absorbed into file 52 — 5-file cadence for Ch 8)_ |
| 54 | ✅ | `research/ch09-scaling-and-distributed/research.md` |
| 55 | ✅ | `prompts/chapters/ch09-scaling-and-distributed/session-41-page-structure.md` |
| 56 | ✅ | `prompts/chapters/ch09-scaling-and-distributed/session-42-scaling-law-calculator-widget.md` |
| 57 | ✅ | `prompts/chapters/ch09-scaling-and-distributed/session-43-parallelism-diagram-widget.md` |
| 58 | ✅ | `prompts/chapters/ch09-scaling-and-distributed/session-44-exercises-and-closeout.md` |
| 59 | ⏭️ | _(absorbed into file 58 — 5-file cadence for Ch 9)_ |
| 60 | ✅ | `research/ch10-training-infra/research.md` |
| 61 | ✅ | `prompts/chapters/ch10-training-infra/session-46-page-structure.md` |
| 62 | ✅ | `prompts/chapters/ch10-training-infra/session-47-training-stack-picker-widget.md` |
| 63 | ✅ | `prompts/chapters/ch10-training-infra/session-48-step-timeline-exercises-and-closeout.md` |
| 64 | ⏭️ | _(absorbed into file 63 — 4-file cadence for Ch 10)_ |

---

## Phase 7 — Part IV: Alternative Architectures (10 files)

| # | Status | Path |
|---|---|---|
| 65 | ✅ | `research/ch11-moe/research.md` |
| 66 | ✅ | `prompts/chapters/ch11-moe/session-50-page-structure.md` |
| 67 | ✅ | `prompts/chapters/ch11-moe/session-51-moe-routing-visualizer-widget.md` |
| 68 | ✅ | `prompts/chapters/ch11-moe/session-52-active-vs-total-exercises-and-closeout.md` |
| 69 | ⏭️ | _(absorbed into file 68 — 4-file cadence for Ch 11)_ |
| 70 | ✅ | `research/ch12-ssm-and-mamba/research.md` |
| 71 | ✅ | `prompts/chapters/ch12-ssm-and-mamba/session-54-page-structure.md` |
| 72 | ✅ | `prompts/chapters/ch12-ssm-and-mamba/session-55-ssm-vs-attention-widget.md` |
| 73 | ✅ | `prompts/chapters/ch12-ssm-and-mamba/session-56-selective-scan-exercises-and-closeout.md` |
| 74 | ⏭️ | _(absorbed into file 73 — 4-file cadence for Ch 12)_ |
| 75 | ⏭️ | _(absorbed into file 73 — 4-file cadence for Ch 12)_ |

*Note: Ch 12 has 2 widgets + 2 runnable modules, so it gets 5 sessions total. CURRICULUM will be updated to reflect this during its Phase 1 revision. Session 58 (selective-scan-and-exercises) lives in Phase 8.*

---

## Phase 8 — Part V: Post-training (22 files)

| # | Status | Path |
|---|---|---|
| 76 | ✅ | `research/ch13-sft/research.md` |
| 77 | ✅ | `prompts/chapters/ch13-sft/session-59-page-structure.md` |
| 78 | ✅ | `prompts/chapters/ch13-sft/session-60-sft-loss-masking-widget.md` |
| 79 | ✅ | `prompts/chapters/ch13-sft/session-61-chat-template-comparison-exercises-and-closeout.md` |
| 80 | ⏭️ | _(absorbed into file 79 — 4-file cadence for Ch 13)_ |
| 81 | ✅ | `research/ch14-alignment/research.md` |
| 82 | ✅ | `prompts/chapters/ch14-alignment/session-63-page-structure.md` |
| 83 | ✅ | `prompts/chapters/ch14-alignment/session-64-preference-pipeline-widget.md` |
| 84 | ✅ | `prompts/chapters/ch14-alignment/session-65-dpo-loss-landscape-widget.md` |
| 85 | ✅ | `prompts/chapters/ch14-alignment/session-66-exercises-and-closeout.md` |
| 86 | ⏭️ | _(absorbed into file 85 — 5-file cadence for Ch 14)_ |
| 87 | ⏭️ | _(absorbed into file 85 — 5-file cadence for Ch 14)_ |
| 88 | ✅ | `research/ch15-peft/research.md` |
| 89 | ✅ | `prompts/chapters/ch15-peft/session-67-page-structure.md` |
| 90 | ✅ | `prompts/chapters/ch15-peft/session-68-lora-architecture-widget.md` |
| 91 | ✅ | `prompts/chapters/ch15-peft/session-69-parameter-budget-calculator-and-exercises-and-closeout.md` |
| 92 | ⏭️ | _(absorbed into file 91 — 4-file cadence for Ch 15)_ |
| 93 | ✅ | `research/ch16-distillation/research.md` |
| 94 | ✅ | `prompts/chapters/ch16-distillation/session-73-page-structure.md` |
| 95 | ✅ | `prompts/chapters/ch16-distillation/session-74-temperature-scaling-widget.md` |
| 96 | ✅ | `prompts/chapters/ch16-distillation/session-75-distillation-pipeline-and-exercises-and-closeout.md` |
| 97 | ⏭️ | _(absorbed into file 96 — 4-file cadence for Ch 16)_ |

---

## Phase 9 — Part VI: Inference (15 files)

| # | Status | Path |
|---|---|---|
| 98  | ✅ | `research/ch17-inference-optimization/research.md` |
| 99  | ✅ | `prompts/chapters/ch17-inference-optimization/session-77-page-structure.md` |
| 100 | ✅ | `prompts/chapters/ch17-inference-optimization/session-78-kv-cache-animation-widget.md` |
| 101 | ✅ | `prompts/chapters/ch17-inference-optimization/session-79-speculative-decoding-and-exercises-and-closeout.md` |
| 102 | ⏭️ | _(absorbed into file 101 — 4-file cadence for Ch 17)_ |
| 103 | ⏭️ | _(absorbed into file 101 — 4-file cadence for Ch 17)_ |
| 104 | ✅ | `research/ch18-quantization/research.md` |
| 105 | ✅ | `prompts/chapters/ch18-quantization/session-82-page-structure.md` |
| 106 | ✅ | `prompts/chapters/ch18-quantization/session-83-quantization-explorer-widget.md` |
| 107 | ✅ | `prompts/chapters/ch18-quantization/session-84-granularity-visualizer-and-exercises-and-closeout.md` |
| 108 | ⏭️ | _(absorbed into file 107 — 4-file cadence for Ch 18)_ |
| 109 | ✅ | `research/ch19-sampling/research.md` |
| 110 | ✅ | `prompts/chapters/ch19-sampling/session-86-page-structure.md` |
| 111 | ✅ | `prompts/chapters/ch19-sampling/session-87-sampling-distribution-widget.md` |
| 112 | ✅ | `prompts/chapters/ch19-sampling/session-88-constrained-decoding-and-exercises-and-closeout.md` |

---

## Phase 10 — Part VII: Modern Capabilities (22 files)

| # | Status | Path |
|---|---|---|
| 113 | ✅ | `research/ch20-reasoning/research.md` |
| 114 | ✅ | `prompts/chapters/ch20-reasoning/session-89-page-structure.md` |
| 115 | ✅ | `prompts/chapters/ch20-reasoning/session-90-test-time-compute-curves-widget.md` |
| 116 | ✅ | `prompts/chapters/ch20-reasoning/session-91-self-consistency-aggregator-widget.md` |
| 117 | ✅ | `prompts/chapters/ch20-reasoning/session-92-exercises-and-closeout.md` |
| 118 | ⏭️ | _(absorbed into file 117 — 5-file cadence for Ch 20 two-topic)_ |
| 119 | ✅ | `research/ch21-tool-use/research.md` |
| 120 | ✅ | `prompts/chapters/ch21-tool-use/session-94-page-structure.md` |
| 121 | ✅ | `prompts/chapters/ch21-tool-use/session-95-tool-call-trace-widget.md` |
| 122 | ✅ | `prompts/chapters/ch21-tool-use/session-96-tool-schema-validator-and-exercises-and-closeout.md` |
| 123 | ⏭️ | _(absorbed into file 122 — 4-file cadence for Ch 21)_ |
| 124 | ✅ | `research/ch22-retrieval-and-rag/research.md` |
| 125 | ✅ | `prompts/chapters/ch22-retrieval-and-rag/session-98-page-structure.md` |
| 126 | ✅ | `prompts/chapters/ch22-retrieval-and-rag/session-99-retrieval-comparator-widget.md` |
| 127 | ✅ | `prompts/chapters/ch22-retrieval-and-rag/session-100-chunking-visualizer-and-exercises-and-closeout.md` |
| 128 | ⏭️ | _(absorbed into file 127 — 4-file cadence for Ch 22)_ |
| 129 | ⏭️ | _(absorbed into file 127 — 4-file cadence for Ch 22)_ |
| 130 | ✅ | `research/ch23-multimodal/research.md` |
| 131 | ✅ | `prompts/chapters/ch23-multimodal/session-103-page-structure.md` |
| 132 | ✅ | `prompts/chapters/ch23-multimodal/session-104-clip-embedding-space-widget.md` |
| 133 | ✅ | `prompts/chapters/ch23-multimodal/session-105-vit-patch-tokenizer-and-exercises-and-closeout.md` |
| 134 | ⏭️ | _(absorbed into file 133 — 4-file cadence for Ch 23)_ |

---

## Phase 11 — Part VIII: Safety, Interpretability & Eval (15 files)

| # | Status | Path |
|---|---|---|
| 135 | ✅ | `research/ch24-safety/research.md` |
| 136 | ✅ | `prompts/chapters/ch24-safety/session-107-page-structure.md` |
| 137 | ✅ | `prompts/chapters/ch24-safety/session-108-jailbreak-taxonomy-widget.md` |
| 138 | ✅ | `prompts/chapters/ch24-safety/session-109-prompt-injection-classifier-and-exercises-and-closeout.md` |
| 139 | ⏭️ | _(absorbed into file 138 — 4-file cadence for Ch 24)_ |
| 140 | ✅ | `research/ch25-interpretability/research.md` |
| 141 | ✅ | `prompts/chapters/ch25-interpretability/session-111-page-structure.md` |
| 142 | ✅ | `prompts/chapters/ch25-interpretability/session-112-sae-feature-explorer-widget.md` |
| 143 | ✅ | `prompts/chapters/ch25-interpretability/session-113-linear-probing-and-exercises-and-closeout.md` |
| 144 | ⏭️ | _(absorbed into file 143 — 4-file cadence for Ch 25)_ |
| 145 | ✅ | `research/ch26-evaluation/research.md` |
| 146 | ✅ | `prompts/chapters/ch26-evaluation/session-115-page-structure.md` |
| 147 | ✅ | `prompts/chapters/ch26-evaluation/session-116-benchmark-heatmap-widget.md` |
| 148 | ✅ | `prompts/chapters/ch26-evaluation/session-117-llm-judge-bias-demo-and-exercises-and-closeout.md` |
| 149 | ⏭️ | _(absorbed into file 148 — 4-file cadence for Ch 26)_ |

---

## Phase 12 — Part IX: Agents (22 files)

| # | Status | Path |
|---|---|---|
| 150 | ✅ | `research/ch27-agent-foundations/research.md` |
| 151 | ✅ | `prompts/chapters/ch27-agent-foundations/session-118-page-structure.md` |
| 152 | ✅ | `prompts/chapters/ch27-agent-foundations/session-119-agentic-loop-visualizer-widget.md` |
| 153 | ✅ | `prompts/chapters/ch27-agent-foundations/session-120-pattern-catalog-and-exercises-and-closeout.md` |
| 154 | ⏭️ | _(absorbed into file 153 — 4-file cadence for Ch 27)_ |
| 155 | ✅ | `research/ch28-agent-from-scratch/research.md` |
| 156 | ✅ | `prompts/chapters/ch28-agent-from-scratch/session-121-page-structure.md` |
| 157 | ✅ | `prompts/chapters/ch28-agent-from-scratch/session-122-tool-schema-builder-widget.md` |
| 158 | ✅ | `prompts/chapters/ch28-agent-from-scratch/session-123-agent-trace-inspector-and-exercises-and-closeout.md` |
| 159 | ⏭️ | _(absorbed into file 158 — 4-file cadence for Ch 28)_ |
| 160 | ⏭️ | _(absorbed into file 158 — 4-file cadence for Ch 28)_ |
| 161 | ✅ | `research/ch29-multi-agent/research.md` |
| 162 | ✅ | `prompts/chapters/ch29-multi-agent/session-124-page-structure.md` |
| 163 | ✅ | `prompts/chapters/ch29-multi-agent/session-125-multi-agent-topology-explorer-widget.md` |
| 164 | ✅ | `prompts/chapters/ch29-multi-agent/session-126-inter-agent-conversation-viewer-widget.md` |
| 165 | ✅ | `prompts/chapters/ch29-multi-agent/session-127-exercises-and-closeout.md` |
| 166 | ⏭️ | _(absorbed into file 165 — 5-file cadence for Ch 29)_ |
| 167 | ✅ | `research/ch30-agent-eval-and-frameworks/research.md` |
| 168 | ✅ | `prompts/chapters/ch30-agent-eval-and-frameworks/session-128-page-structure.md` |
| 169 | ✅ | `prompts/chapters/ch30-agent-eval-and-frameworks/session-129-agent-benchmark-explorer-widget.md` |
| 170 | ✅ | `prompts/chapters/ch30-agent-eval-and-frameworks/session-130-framework-picker-widget.md` |
| 171 | ✅ | `prompts/chapters/ch30-agent-eval-and-frameworks/session-131-exercises-and-closeout.md` |

---

## Phase 13 — Polish & QA (6 files)

| # | Status | Path |
|---|---|---|
| 172 | ✅ | `prompts/polish/session-132-cross-chapter-linking.md` |
| 173 | ✅ | `prompts/polish/session-133-search-integration.md` |
| 174 | ✅ | `prompts/polish/session-134-mobile-pass.md` |
| 175 | ✅ | `prompts/polish/session-135-accessibility-audit.md` |
| 176 | ✅ | `prompts/polish/session-136-performance-pass.md` |
| 177 | ✅ | `prompts/polish/session-137-social-meta-and-og.md` |

---

## Conventions

**Chapter session pattern:**
- First session of each chapter is always `session-NN-page-structure.md` — prose, math, sections, static code references, equation labels, callouts. Sets up the chapter scaffold.
- Following sessions build widgets and runnable modules, one per session.
- Final session of each chapter typically includes exercises.

**Pre-research files** (`research/chXX-slug/research.md`) contain:
- Key papers cited with arxiv IDs, links, and 1-paragraph summaries
- Critical equations rendered in LaTeX (ready to paste into MDX)
- Glossary of terms used in the chapter
- Reference implementations linked (gist, repo, or arxiv html version)
- Pedagogical analogies and tricky-spot warnings

These are read at the start of every chapter session so Claude Code starts with strong material instead of re-deriving context.

**Session prompt pattern:**
Every chapter session prompt has the same sections: Read first / Goal / Inputs / Deliverables / Detailed spec / Acceptance criteria / Out of scope / Wire-up.

**File naming:**
- Chapter folders: `chXX-short-slug` (e.g. `ch14-alignment`, not `ch14-rlhf-dpo-rlvr-cai`)
- Session files: `session-NN-short-slug.md`, NN is globally unique 01–142
- Research files: always `research.md` inside `research/chXX-slug/`

---

## How to use this doc

1. Each "continue to the next file" message triggers creation of the next ⬜ file.
2. Status updates to ✅ once created (I'll keep this doc in sync).
3. Validation pauses happen at:
   - **End of Phase 1** (foundation locked) — commit & review
   - **End of Phase 2** (scaffolding prompts ready) — hand to Claude Code, deploy
   - **End of Phase 3** (Ch 1 end-to-end) — build in Claude Code, validate the chapter pattern works before scaling
4. If at any point you want to skip ahead, jump back, or restructure — just say so. This doc is editable.

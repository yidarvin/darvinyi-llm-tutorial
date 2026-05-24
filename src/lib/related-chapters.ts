export type RelationshipType =
  | 'foundation'
  | 'extension'
  | 'discipline'
  | 'alternative'
  | 'callback'
  | 'cross-phase';

export interface RelatedChapter {
  slug: string;
  relationship: RelationshipType;
  reason: string;
}

export const RELATED_CHAPTERS: Record<string, RelatedChapter[]> = {
  'ch01-neural-net-primitives': [
    { slug: 'ch04-attention',         relationship: 'extension',   reason: 'The softmax + cross-entropy gradient derivation reappears in the attention backward pass.' },
    { slug: 'ch08-building-small-llm', relationship: 'extension',  reason: 'The full training loop with AdamW sketched here scales to GPT-2-small territory.' },
    { slug: 'ch14-alignment',         relationship: 'cross-phase', reason: 'Policy-gradient methods reuse the gradient framing — descend loss, ascend reward.' },
    { slug: 'ch25-interpretability',  relationship: 'cross-phase', reason: 'The computational-graph view is the foundation for activation patching and circuits.' },
  ],

  'ch02-embeddings': [
    { slug: 'ch03-tokenization',     relationship: 'foundation',  reason: 'Tokenizer vocab size determines the embedding table size.' },
    { slug: 'ch04-attention',        relationship: 'extension',   reason: 'Attention operates on embedded sequences via the Q/K/V projections.' },
    { slug: 'ch22-retrieval-and-rag', relationship: 'cross-phase', reason: 'Retrieval systems index passages by learned embeddings in the same geometric setup.' },
    { slug: 'ch23-multimodal',       relationship: 'extension',   reason: 'Multimodal models share a vector space across text, images, and audio.' },
  ],

  'ch03-tokenization': [
    { slug: 'ch02-embeddings',         relationship: 'extension',   reason: 'Tokens are the IDs that index the embedding table.' },
    { slug: 'ch04-attention',          relationship: 'extension',   reason: 'Sequence length — and attention\'s O(n²) cost — is set by tokenization.' },
    { slug: 'ch17-inference-optimization', relationship: 'cross-phase', reason: 'Token count drives KV-cache size at inference.' },
    { slug: 'ch22-retrieval-and-rag',  relationship: 'cross-phase', reason: 'Chunking decisions in RAG depend on what "1000 tokens" actually means.' },
  ],

  'ch04-attention': [
    { slug: 'ch02-embeddings',         relationship: 'foundation', reason: 'Embedded sequences are the input to attention.' },
    { slug: 'ch05-multihead-and-block', relationship: 'extension', reason: 'Multi-head attention is this operation run h times in parallel.' },
    { slug: 'ch06-positional-encoding', relationship: 'extension', reason: 'Attention is position-blind; positional encoding is the fix.' },
    { slug: 'ch12-ssm-and-mamba',      relationship: 'alternative', reason: 'SSMs achieve O(n) sequence mixing instead of attention\'s O(n²).' },
    { slug: 'ch17-inference-optimization', relationship: 'cross-phase', reason: 'The KV cache is the central inference optimization built on attention\'s structure.' },
  ],

  'ch05-multihead-and-block': [
    { slug: 'ch04-attention',           relationship: 'foundation', reason: 'Single-head attention is the unit that multi-head replicates.' },
    { slug: 'ch06-positional-encoding', relationship: 'extension',  reason: 'The block needs positional information injected before or within attention.' },
    { slug: 'ch08-building-small-llm',  relationship: 'extension',  reason: 'The block stacks N times to form the full LLM trained in Ch 8.' },
    { slug: 'ch12-ssm-and-mamba',       relationship: 'alternative', reason: 'Mamba replaces this entire block with an SSM-based equivalent.' },
    { slug: 'ch25-interpretability',    relationship: 'cross-phase', reason: 'Mech interp lives at head granularity — induction heads, name-mover heads.' },
  ],

  'ch06-positional-encoding': [
    { slug: 'ch04-attention',           relationship: 'foundation', reason: 'Attention\'s permutation-equivariance is what positional encoding repairs.' },
    { slug: 'ch05-multihead-and-block', relationship: 'foundation', reason: 'The transformer block depends on positional information being present.' },
    { slug: 'ch08-building-small-llm',  relationship: 'extension',  reason: 'Choosing learned vs. RoPE is a concrete design decision when building the model.' },
    { slug: 'ch17-inference-optimization', relationship: 'cross-phase', reason: 'RoPE-rotated keys are cached pre-rotation, affecting how the KV cache is reused.' },
  ],

  'ch07-pretraining-data': [
    { slug: 'ch03-tokenization',        relationship: 'foundation', reason: 'The corpus is the input to BPE training before models see a single token.' },
    { slug: 'ch08-building-small-llm',  relationship: 'extension',  reason: 'Curated data feeds directly into the training loop.' },
    { slug: 'ch09-scaling-and-distributed', relationship: 'extension', reason: 'Scaling laws assume quality-controlled data; DCLM shows quality shifts the curve.' },
    { slug: 'ch13-sft',                 relationship: 'cross-phase', reason: 'Post-training data is curated very differently — depth over breadth.' },
    { slug: 'ch26-evaluation',          relationship: 'discipline',  reason: 'Eval contamination during pretraining is a recurring discipline-level concern.' },
  ],

  'ch08-building-small-llm': [
    { slug: 'ch05-multihead-and-block', relationship: 'foundation', reason: 'The transformer block from Ch 5 is the unit this chapter stacks and trains.' },
    { slug: 'ch07-pretraining-data',    relationship: 'foundation', reason: 'The corpus the training loop consumes.' },
    { slug: 'ch09-scaling-and-distributed', relationship: 'extension', reason: 'The same loop, scaled across data + model + pipeline parallelism.' },
    { slug: 'ch10-training-infra',      relationship: 'extension',  reason: 'The systems engineering that makes the loop run on real GPU clusters.' },
    { slug: 'ch13-sft',                 relationship: 'cross-phase', reason: 'SFT is this loop run again with a response-masked loss.' },
  ],

  'ch09-scaling-and-distributed': [
    { slug: 'ch08-building-small-llm',  relationship: 'foundation', reason: 'Same loop body; DP/FSDP wrap it for distributed training.' },
    { slug: 'ch07-pretraining-data',    relationship: 'foundation', reason: 'Scaling laws are derived assuming quality-controlled training data.' },
    { slug: 'ch10-training-infra',      relationship: 'extension',  reason: 'How parallelism is actually executed on real hardware.' },
    { slug: 'ch11-moe',                 relationship: 'alternative', reason: 'MoE is sparse scaling — more parameters that are not all activated per token.' },
    { slug: 'ch17-inference-optimization', relationship: 'cross-phase', reason: 'Llama-3\'s over-trained 8B is partly justified by inference-cost arithmetic.' },
  ],

  'ch10-training-infra': [
    { slug: 'ch08-building-small-llm',  relationship: 'foundation', reason: 'Same training loop body; this chapter is the infra under it.' },
    { slug: 'ch09-scaling-and-distributed', relationship: 'foundation', reason: 'Strategy lives in Ch 9; execution lives here.' },
    { slug: 'ch04-attention',           relationship: 'foundation', reason: 'FlashAttention is the high-performance implementation of the Ch 4 operation.' },
    { slug: 'ch17-inference-optimization', relationship: 'cross-phase', reason: 'Inference has its own infra, but reuses kernels and memory-hierarchy ideas.' },
  ],

  'ch11-moe': [
    { slug: 'ch05-multihead-and-block', relationship: 'foundation', reason: 'The MoE block replaces the FFN inside the standard transformer block.' },
    { slug: 'ch09-scaling-and-distributed', relationship: 'extension', reason: 'Expert parallelism is a fourth dimension alongside DP/TP/PP.' },
    { slug: 'ch10-training-infra',      relationship: 'extension',  reason: 'All-to-all collectives are the MoE-specific communication pattern.' },
    { slug: 'ch12-ssm-and-mamba',       relationship: 'alternative', reason: 'Both depart from dense transformers; Jamba even stacks the two.' },
    { slug: 'ch17-inference-optimization', relationship: 'cross-phase', reason: 'Routing changes per token, so MoE inference engines need MoE-aware optimizations.' },
  ],

  'ch12-ssm-and-mamba': [
    { slug: 'ch04-attention',           relationship: 'alternative', reason: 'SSMs target attention\'s O(n²) compute + memory directly.' },
    { slug: 'ch05-multihead-and-block', relationship: 'alternative', reason: 'A Mamba block replaces the transformer block as the architectural unit.' },
    { slug: 'ch11-moe',                 relationship: 'alternative', reason: 'Both are non-dense departures from the standard transformer.' },
    { slug: 'ch17-inference-optimization', relationship: 'cross-phase', reason: 'Fixed state size means no growing KV cache — the killer feature at long context.' },
  ],

  'ch13-sft': [
    { slug: 'ch08-building-small-llm',  relationship: 'foundation', reason: 'SFT is the training loop with a smaller LR and a response-masked loss.' },
    { slug: 'ch14-alignment',           relationship: 'extension',  reason: 'Preference optimization runs after SFT, with the SFT model as the reference policy.' },
    { slug: 'ch15-peft',                relationship: 'extension',  reason: 'Most production SFT is LoRA-based rather than full fine-tuning.' },
    { slug: 'ch16-distillation',        relationship: 'extension',  reason: 'Synthetic SFT data is the simplest form of teacher distillation.' },
    { slug: 'ch26-evaluation',          relationship: 'discipline', reason: 'Evaluating SFT requires the discipline of Ch 26 — overfitting and reward hacking show up.' },
  ],

  'ch14-alignment': [
    { slug: 'ch13-sft',                 relationship: 'foundation', reason: 'SFT produces the reference policy that preference methods anchor to.' },
    { slug: 'ch08-building-small-llm',  relationship: 'foundation', reason: 'PPO and DPO are training loops with different losses and rollouts.' },
    { slug: 'ch15-peft',                relationship: 'extension',  reason: 'Most production DPO is LoRA on top of an SFT model.' },
    { slug: 'ch20-reasoning',           relationship: 'cross-phase', reason: 'RLVR (the GRPO family) is how reasoning models like o1 and R1 are trained.' },
    { slug: 'ch24-safety',              relationship: 'discipline', reason: 'Alignment is the technical substrate of safety; the same mechanics, different framing.' },
  ],

  'ch15-peft': [
    { slug: 'ch13-sft',                 relationship: 'foundation', reason: 'Production SFT is overwhelmingly LoRA; the masked-loss machinery flows through PEFT params.' },
    { slug: 'ch14-alignment',           relationship: 'extension',  reason: 'DPO with LoRA on a (possibly LoRA-trained) SFT model is a common stack.' },
    { slug: 'ch08-building-small-llm',  relationship: 'foundation', reason: 'Same training loop; freeze most parameters so the optimizer sees the trainable subset.' },
    { slug: 'ch18-quantization',        relationship: 'extension',  reason: 'QLoRA combines PEFT with NF4 quantization for memory-bounded training.' },
    { slug: 'ch17-inference-optimization', relationship: 'extension', reason: 'Multi-LoRA serving (vLLM, TGI) makes adapters first-class at inference time.' },
  ],

  'ch16-distillation': [
    { slug: 'ch13-sft',                 relationship: 'foundation', reason: 'Hard distillation is SFT with teacher-generated data — same loop, different data source.' },
    { slug: 'ch18-quantization',        relationship: 'extension',  reason: 'Distillation reduces parameter count; quantization reduces bits per parameter — multiplicative.' },
    { slug: 'ch17-inference-optimization', relationship: 'extension', reason: 'Smaller distilled models compound with inference-time tricks for cheaper serving.' },
    { slug: 'ch20-reasoning',           relationship: 'cross-phase', reason: 'Reasoning distillation (Orca, R1-Distill) is how strong reasoning lands in small models.' },
    { slug: 'ch15-peft',                relationship: 'extension',  reason: 'LoRA-distill trains a student adapter while keeping the base frozen.' },
  ],

  'ch17-inference-optimization': [
    { slug: 'ch04-attention',           relationship: 'foundation', reason: 'KV caching exploits attention\'s structure — Q changes per step, K and V are cached.' },
    { slug: 'ch18-quantization',        relationship: 'extension',  reason: 'Quantized weights plus cached KV plus speculative decoding compound at inference.' },
    { slug: 'ch16-distillation',        relationship: 'extension',  reason: 'Distillation compresses parameters; combines multiplicatively with inference tricks.' },
    { slug: 'ch19-sampling',            relationship: 'extension',  reason: 'Sampling sits atop the forward pass and interacts with speculative decoding.' },
    { slug: 'ch27-agent-foundations',   relationship: 'cross-phase', reason: 'Agent loops do many forward passes per task; inference cost adds up fast.' },
  ],

  'ch18-quantization': [
    { slug: 'ch15-peft',                relationship: 'foundation', reason: 'NF4 from QLoRA is the bridge between this chapter and PEFT training.' },
    { slug: 'ch17-inference-optimization', relationship: 'extension', reason: 'KV-cache quantization is another 2-4× memory win on top of weight quantization.' },
    { slug: 'ch16-distillation',        relationship: 'extension',  reason: 'Distilled-then-quantized models are the smallest deployable artifacts.' },
    { slug: 'ch04-attention',           relationship: 'foundation', reason: 'Quantization applies to attention\'s W_Q/W_K/W_V/W_O matrices and to the KV cache itself.' },
    { slug: 'ch26-evaluation',          relationship: 'discipline', reason: 'Quantization quality is measured by perplexity drift and task-level accuracy.' },
  ],

  'ch19-sampling': [
    { slug: 'ch17-inference-optimization', relationship: 'foundation', reason: 'Sampling happens after each forward pass during cached inference.' },
    { slug: 'ch20-reasoning',           relationship: 'extension',  reason: 'Chain-of-thought generation uses sampling heavily; T=0.6 is a reasoning-model default.' },
    { slug: 'ch21-tool-use',            relationship: 'extension',  reason: 'Constrained decoding (FSM-masked sampling) is how tool calls stay valid JSON.' },
    { slug: 'ch14-alignment',           relationship: 'foundation', reason: 'RLHF sharpens the output distribution; aligned models tolerate less aggressive sampling.' },
    { slug: 'ch26-evaluation',          relationship: 'discipline', reason: 'Temperature affects benchmark variance; deterministic decoding is needed for reproducibility.' },
  ],

  'ch20-reasoning': [
    { slug: 'ch19-sampling',            relationship: 'foundation', reason: 'Reasoning interacts directly with sampling — temperature and constrained decoding.' },
    { slug: 'ch14-alignment',           relationship: 'foundation', reason: 'RLVR / GRPO is the post-training stack for modern reasoning models.' },
    { slug: 'ch21-tool-use',            relationship: 'extension',  reason: 'ReAct is the direct bridge — reasoning interleaved with tool calls.' },
    { slug: 'ch17-inference-optimization', relationship: 'cross-phase', reason: 'Reasoning traces are thousands of tokens; KV cache + PagedAttention are essential.' },
    { slug: 'ch27-agent-foundations',   relationship: 'cross-phase', reason: 'Reasoning is the "Thought" component of the ReAct agent loop.' },
  ],

  'ch21-tool-use': [
    { slug: 'ch20-reasoning',           relationship: 'foundation', reason: 'ReAct interleaves reasoning with tool calls — Thought, then Action.' },
    { slug: 'ch19-sampling',            relationship: 'foundation', reason: 'Constrained decoding is what keeps tool calls valid JSON.' },
    { slug: 'ch22-retrieval-and-rag',   relationship: 'extension',  reason: 'Retrieval is a tool — the most common one in practice.' },
    { slug: 'ch24-safety',              relationship: 'discipline', reason: 'Tool use is the highest-risk capability — incorrect calls have real-world effects.' },
    { slug: 'ch28-agent-from-scratch',  relationship: 'cross-phase', reason: 'Tool engineering is the 80% of building production agents.' },
  ],

  'ch22-retrieval-and-rag': [
    { slug: 'ch21-tool-use',            relationship: 'foundation', reason: 'Retrieval is itself a tool — RAG is a tool-use pattern with one specific tool.' },
    { slug: 'ch02-embeddings',          relationship: 'foundation', reason: 'Retrieval indexes passages by learned embeddings.' },
    { slug: 'ch20-reasoning',           relationship: 'extension',  reason: 'Agentic RAG composes retrieval with reasoning over the retrieved context.' },
    { slug: 'ch26-evaluation',          relationship: 'discipline', reason: 'RAG-specific evals (RAGAS, BEIR, MTEB) measure faithfulness and attribution.' },
    { slug: 'ch27-agent-foundations',   relationship: 'cross-phase', reason: 'Production agent systems are RAG-heavy — vector DBs serve as agent memory.' },
  ],

  'ch23-multimodal': [
    { slug: 'ch02-embeddings',          relationship: 'foundation', reason: 'Multimodal models extend the embedding space to images, audio, and video.' },
    { slug: 'ch04-attention',           relationship: 'foundation', reason: 'ViT uses the same transformer blocks; only the embedding layer changes.' },
    { slug: 'ch21-tool-use',            relationship: 'extension',  reason: 'Computer-use is the canonical multimodal tool — screenshots become tool inputs.' },
    { slug: 'ch20-reasoning',           relationship: 'extension',  reason: 'VLMs reason — CoT works on visual inputs too.' },
    { slug: 'ch24-safety',              relationship: 'discipline', reason: 'VLM jailbreaks ride in via images; bias propagates from visual training data.' },
  ],

  'ch24-safety': [
    { slug: 'ch14-alignment',           relationship: 'foundation', reason: 'RLHF and SFT are the technical mechanics this chapter applies to safety.' },
    { slug: 'ch25-interpretability',    relationship: 'discipline', reason: 'Interpretability is the verification arm of safety; the immediate sequel.' },
    { slug: 'ch26-evaluation',          relationship: 'discipline', reason: 'Safety evaluation (HarmBench, TruthfulQA) is how claims become measurable.' },
    { slug: 'ch21-tool-use',            relationship: 'extension',  reason: 'Tool-using systems face indirect injection as a primary attack surface.' },
    { slug: 'ch30-agent-eval-and-frameworks', relationship: 'cross-phase', reason: 'Agent safety extends this chapter into multi-step, autonomous settings.' },
  ],

  'ch25-interpretability': [
    { slug: 'ch24-safety',              relationship: 'discipline', reason: 'Interpretability is the microscope for verifying alignment claims.' },
    { slug: 'ch26-evaluation',          relationship: 'discipline', reason: 'Interp without measurement is not actionable; the immediate sequel.' },
    { slug: 'ch04-attention',           relationship: 'foundation', reason: 'The residual stream, attention heads, and MLPs are the substrate interp examines.' },
    { slug: 'ch01-neural-net-primitives', relationship: 'foundation', reason: 'The computational-graph view is the basis for activation patching and circuits.' },
    { slug: 'ch28-agent-from-scratch',  relationship: 'cross-phase', reason: 'Agent observability extends interpretability into multi-step traces.' },
  ],

  'ch26-evaluation': [
    { slug: 'ch24-safety',              relationship: 'discipline', reason: 'Safety evaluation extends this chapter\'s discipline into the safety domain.' },
    { slug: 'ch25-interpretability',    relationship: 'discipline', reason: 'Interpretability complements evaluation — internal vs. external probes of behavior.' },
    { slug: 'ch07-pretraining-data',    relationship: 'foundation', reason: 'Eval-data contamination during pretraining is what this discipline guards against.' },
    { slug: 'ch14-alignment',           relationship: 'foundation', reason: 'Reward hacking and training-on-eval-data are evaluation-discipline failure modes.' },
    { slug: 'ch30-agent-eval-and-frameworks', relationship: 'cross-phase', reason: 'Ch 30 extends this discipline to agent systems where per-step metrics break down.' },
  ],

  'ch27-agent-foundations': [
    { slug: 'ch20-reasoning',           relationship: 'foundation', reason: 'Chain-of-thought is the "Thought" component of the ReAct loop.' },
    { slug: 'ch21-tool-use',            relationship: 'foundation', reason: 'Tool use is the "Action" component — the substrate for everything an agent does.' },
    { slug: 'ch24-safety',              relationship: 'discipline', reason: 'Agentic safety — bounded autonomy, oversight, manipulation resistance — sits here.' },
    { slug: 'ch28-agent-from-scratch',  relationship: 'extension',  reason: 'Engineering builds on these conceptual foundations.' },
    { slug: 'ch29-multi-agent',         relationship: 'extension',  reason: 'Multi-agent composes single-agent loops.' },
  ],

  'ch28-agent-from-scratch': [
    { slug: 'ch27-agent-foundations',   relationship: 'foundation', reason: 'The conceptual loop this chapter\'s engineering operationalizes.' },
    { slug: 'ch21-tool-use',            relationship: 'foundation', reason: 'Tool design and error handling are the chapter\'s 80%.' },
    { slug: 'ch26-evaluation',          relationship: 'discipline', reason: 'SWE-bench, GAIA, and OSWorld evaluate agents built with these techniques.' },
    { slug: 'ch25-interpretability',    relationship: 'cross-phase', reason: 'Trace observability is how interpretability extends to agentic behaviors.' },
    { slug: 'ch30-agent-eval-and-frameworks', relationship: 'extension', reason: 'Evaluating these hand-built agents is the next step.' },
  ],

  'ch29-multi-agent': [
    { slug: 'ch27-agent-foundations',   relationship: 'foundation', reason: 'Multi-agent composes the single-agent loop; the foundations carry through.' },
    { slug: 'ch28-agent-from-scratch',  relationship: 'foundation', reason: 'Tool design, error handling, and scaffolding amplify in multi-agent systems.' },
    { slug: 'ch30-agent-eval-and-frameworks', relationship: 'extension', reason: 'Multi-agent evaluation is harder still — emergent behaviors evade per-step metrics.' },
    { slug: 'ch26-evaluation',          relationship: 'discipline', reason: 'The evaluation discipline strains under multi-agent emergent behavior.' },
    { slug: 'ch25-interpretability',    relationship: 'cross-phase', reason: 'Multi-agent traces are higher-dimensional; interpretability scales accordingly.' },
  ],

  'ch30-agent-eval-and-frameworks': [
    { slug: 'ch26-evaluation',          relationship: 'foundation', reason: 'Agent evaluation extends Ch 26\'s discipline to agent systems.' },
    { slug: 'ch27-agent-foundations',   relationship: 'callback',   reason: 'The agent loop being evaluated; section 8 explicitly revisits this.' },
    { slug: 'ch28-agent-from-scratch',  relationship: 'callback',   reason: 'Observability builds on Ch 28\'s structured logging and trace inspector.' },
    { slug: 'ch29-multi-agent',         relationship: 'callback',   reason: 'Multi-agent evaluation is the hardest case discussed here.' },
    { slug: 'ch24-safety',              relationship: 'discipline', reason: 'Agent safety extends Ch 24 into multi-step autonomous settings.' },
  ],
};

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  'foundation':  'builds on',
  'extension':   'extends to',
  'discipline':  'paired discipline',
  'alternative': 'alternative approach',
  'callback':    'callback reference',
  'cross-phase': 'cross-phase link',
};

export const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  'foundation':  'var(--cyan-400)',
  'extension':   'var(--emerald-500)',
  'discipline':  '#a78bfa',
  'alternative': 'var(--amber-500)',
  'callback':    'var(--rose-500)',
  'cross-phase': 'var(--text-secondary)',
};

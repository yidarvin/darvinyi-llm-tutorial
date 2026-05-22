export type ChapterStatus = 'planned' | 'draft' | 'published';

export interface Chapter {
  num: number;
  slug: string;
  title: string;
  partNum: number;
  status: ChapterStatus;
}

export interface Part {
  num: number;
  title: string;
  chapters: Chapter[];
}

export const PARTS: Part[] = [
  {
    num: 1,
    title: 'Foundations',
    chapters: [
      { num: 1, slug: 'ch01-neural-net-primitives', title: 'Neural network primitives', partNum: 1, status: 'published' },
      { num: 2, slug: 'ch02-embeddings', title: 'Embeddings & representation', partNum: 1, status: 'published' },
      { num: 3, slug: 'ch03-tokenization', title: 'Tokenization', partNum: 1, status: 'published' },
    ],
  },
  {
    num: 2,
    title: 'The Transformer',
    chapters: [
      { num: 4, slug: 'ch04-attention', title: 'Attention mechanism', partNum: 2, status: 'published' },
      { num: 5, slug: 'ch05-multihead-and-block', title: 'Multi-head attention & the transformer block', partNum: 2, status: 'published' },
      { num: 6, slug: 'ch06-positional-encoding', title: 'Positional encoding', partNum: 2, status: 'planned' },
    ],
  },
  {
    num: 3,
    title: 'Pre-training',
    chapters: [
      { num: 7,  slug: 'ch07-pretraining-data',    title: 'Pre-training data',                  partNum: 3, status: 'planned' },
      { num: 8,  slug: 'ch08-building-small-llm',  title: 'Building a small LLM',               partNum: 3, status: 'planned' },
      { num: 9,  slug: 'ch09-scaling-and-distributed', title: 'Scaling laws & distributed training', partNum: 3, status: 'planned' },
      { num: 10, slug: 'ch10-training-infra',      title: 'Training infrastructure',            partNum: 3, status: 'planned' },
    ],
  },
  {
    num: 4,
    title: 'Alternative Architectures',
    chapters: [
      { num: 11, slug: 'ch11-moe',           title: 'Mixture of Experts',         partNum: 4, status: 'planned' },
      { num: 12, slug: 'ch12-ssm-and-mamba', title: 'State-space models & Mamba', partNum: 4, status: 'planned' },
    ],
  },
  {
    num: 5,
    title: 'Post-training',
    chapters: [
      { num: 13, slug: 'ch13-sft',          title: 'Supervised fine-tuning',                  partNum: 5, status: 'planned' },
      { num: 14, slug: 'ch14-alignment',    title: 'Alignment (RLHF, DPO, RLVR, CAI)',        partNum: 5, status: 'planned' },
      { num: 15, slug: 'ch15-peft',         title: 'Parameter-efficient fine-tuning',         partNum: 5, status: 'planned' },
      { num: 16, slug: 'ch16-distillation', title: 'Distillation',                            partNum: 5, status: 'planned' },
    ],
  },
  {
    num: 6,
    title: 'Inference',
    chapters: [
      { num: 17, slug: 'ch17-inference-optimization', title: 'Inference optimization',  partNum: 6, status: 'planned' },
      { num: 18, slug: 'ch18-quantization',           title: 'Quantization & compression', partNum: 6, status: 'planned' },
      { num: 19, slug: 'ch19-sampling',               title: 'Sampling & decoding',      partNum: 6, status: 'planned' },
    ],
  },
  {
    num: 7,
    title: 'Modern Capabilities',
    chapters: [
      { num: 20, slug: 'ch20-reasoning',         title: 'Reasoning & test-time compute', partNum: 7, status: 'planned' },
      { num: 21, slug: 'ch21-tool-use',          title: 'Tool use',                      partNum: 7, status: 'planned' },
      { num: 22, slug: 'ch22-retrieval-and-rag', title: 'Retrieval & RAG',               partNum: 7, status: 'planned' },
      { num: 23, slug: 'ch23-multimodal',        title: 'Multimodal',                    partNum: 7, status: 'planned' },
    ],
  },
  {
    num: 8,
    title: 'Safety, Interpretability & Evaluation',
    chapters: [
      { num: 24, slug: 'ch24-safety',           title: 'Guardrails & safety', partNum: 8, status: 'planned' },
      { num: 25, slug: 'ch25-interpretability', title: 'Interpretability',    partNum: 8, status: 'planned' },
      { num: 26, slug: 'ch26-evaluation',       title: 'Evaluation',          partNum: 8, status: 'planned' },
    ],
  },
  {
    num: 9,
    title: 'Agents',
    chapters: [
      { num: 27, slug: 'ch27-agent-foundations',          title: 'Agent foundations',               partNum: 9, status: 'planned' },
      { num: 28, slug: 'ch28-agent-from-scratch',         title: 'Building an agent from scratch',  partNum: 9, status: 'planned' },
      { num: 29, slug: 'ch29-multi-agent',                title: 'Multi-agent systems',             partNum: 9, status: 'planned' },
      { num: 30, slug: 'ch30-agent-eval-and-frameworks',  title: 'Agent evaluation & frameworks',   partNum: 9, status: 'planned' },
    ],
  },
];

export const ALL_CHAPTERS: Chapter[] = PARTS.flatMap(p => p.chapters);

export function getChapter(slug: string): Chapter | undefined {
  return ALL_CHAPTERS.find(c => c.slug === slug);
}

export function getAdjacentChapters(slug: string): { prev?: Chapter; next?: Chapter } {
  const idx = ALL_CHAPTERS.findIndex(c => c.slug === slug);
  if (idx === -1) return {};
  return {
    prev: idx > 0 ? ALL_CHAPTERS[idx - 1] : undefined,
    next: idx < ALL_CHAPTERS.length - 1 ? ALL_CHAPTERS[idx + 1] : undefined,
  };
}

export function getFirstPublishedChapter(): Chapter | undefined {
  return ALL_CHAPTERS.find(c => c.status === 'published');
}

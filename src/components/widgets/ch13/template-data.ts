export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type TemplateId = 'chatml' | 'llama3' | 'mistral' | 'gemma';

export const CONVERSATION: Message[] = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'What is the capital of France?' },
  { role: 'assistant', content: 'The capital of France is Paris.' },
];

export interface TemplateInfo {
  id: TemplateId;
  label: string;
  description: string;
  specialTokens: string[];
  hasSystemRole: boolean;
  models: string[];
}

export const TEMPLATES: Record<TemplateId, TemplateInfo> = {
  chatml: {
    id: 'chatml',
    label: 'ChatML',
    description:
      'Clean, system-prompt-aware. The most widely-used template, popularized by OpenAI and adopted by many open models.',
    specialTokens: ['<|im_start|>', '<|im_end|>'],
    hasSystemRole: true,
    models: ['GPT-3.5/4 (internal format)', 'Mistral (via tokenizer)', 'Qwen', 'Hermes'],
  },
  llama3: {
    id: 'llama3',
    label: 'Llama-3',
    description:
      "Meta's format. More verbose with distinct header IDs; uses end-of-turn (eot) tokens distinct from end-of-sequence.",
    specialTokens: [
      '<|begin_of_text|>',
      '<|start_header_id|>',
      '<|end_header_id|>',
      '<|eot_id|>',
    ],
    hasSystemRole: true,
    models: ['Llama-3-Instruct (8B, 70B, 405B)', 'Llama-3.1, 3.2, 3.3'],
  },
  mistral: {
    id: 'mistral',
    label: 'Mistral',
    description:
      "Mistral's original [INST] format. Simpler but lacks a native system role — system messages get prepended to the first user turn.",
    specialTokens: ['[INST]', '[/INST]', '<s>', '</s>'],
    hasSystemRole: false,
    models: ['Mistral-7B-Instruct', 'Mixtral-8x7B-Instruct'],
  },
  gemma: {
    id: 'gemma',
    label: 'Gemma',
    description:
      "Google's format. Like ChatML in spirit but different syntax; also lacks a system role (system messages prepended to first user turn).",
    specialTokens: ['<start_of_turn>', '<end_of_turn>'],
    hasSystemRole: false,
    models: ['Gemma-2-9B, 27B', 'Gemma-3', 'CodeGemma'],
  },
};

export interface FormattedSegment {
  text: string;
  type: 'special' | 'role' | 'content' | 'newline';
}

export function formatConversation(
  template: TemplateId,
  msgs: Message[] = CONVERSATION,
): FormattedSegment[] {
  switch (template) {
    case 'chatml':
      return formatChatML(msgs);
    case 'llama3':
      return formatLlama3(msgs);
    case 'mistral':
      return formatMistral(msgs);
    case 'gemma':
      return formatGemma(msgs);
  }
}

function seg(text: string, type: FormattedSegment['type']): FormattedSegment {
  return { text, type };
}

function formatChatML(msgs: Message[]): FormattedSegment[] {
  const out: FormattedSegment[] = [];
  for (const m of msgs) {
    out.push(seg('<|im_start|>', 'special'));
    out.push(seg(m.role, 'role'));
    out.push(seg('\n', 'newline'));
    out.push(seg(m.content, 'content'));
    out.push(seg('<|im_end|>', 'special'));
    out.push(seg('\n', 'newline'));
  }
  return out;
}

function formatLlama3(msgs: Message[]): FormattedSegment[] {
  const out: FormattedSegment[] = [];
  out.push(seg('<|begin_of_text|>', 'special'));
  for (const m of msgs) {
    out.push(seg('<|start_header_id|>', 'special'));
    out.push(seg(m.role, 'role'));
    out.push(seg('<|end_header_id|>', 'special'));
    out.push(seg('\n\n', 'newline'));
    out.push(seg(m.content, 'content'));
    out.push(seg('<|eot_id|>', 'special'));
  }
  return out;
}

function formatMistral(msgs: Message[]): FormattedSegment[] {
  const out: FormattedSegment[] = [];
  out.push(seg('<s>', 'special'));
  let pendingSystem = '';
  for (const m of msgs) {
    if (m.role === 'system') {
      pendingSystem = m.content + '\n\n';
    } else if (m.role === 'user') {
      out.push(seg('[INST] ', 'special'));
      if (pendingSystem) {
        out.push(seg(pendingSystem, 'content'));
        pendingSystem = '';
      }
      out.push(seg(m.content, 'content'));
      out.push(seg(' [/INST]', 'special'));
    } else {
      out.push(seg(' ', 'newline'));
      out.push(seg(m.content, 'content'));
      out.push(seg('</s>', 'special'));
    }
  }
  return out;
}

function formatGemma(msgs: Message[]): FormattedSegment[] {
  const out: FormattedSegment[] = [];
  let pendingSystem = '';
  for (const m of msgs) {
    if (m.role === 'system') {
      pendingSystem = m.content + '\n\n';
    } else if (m.role === 'user') {
      out.push(seg('<start_of_turn>', 'special'));
      out.push(seg('user', 'role'));
      out.push(seg('\n', 'newline'));
      if (pendingSystem) {
        out.push(seg(pendingSystem, 'content'));
        pendingSystem = '';
      }
      out.push(seg(m.content, 'content'));
      out.push(seg('<end_of_turn>', 'special'));
      out.push(seg('\n', 'newline'));
    } else {
      out.push(seg('<start_of_turn>', 'special'));
      out.push(seg('model', 'role'));
      out.push(seg('\n', 'newline'));
      out.push(seg(m.content, 'content'));
      out.push(seg('<end_of_turn>', 'special'));
      out.push(seg('\n', 'newline'));
    }
  }
  return out;
}

# Session 61 — Chat Template Comparison widget + Ch 13 exercises + closeout

> **The Chapter 13 grand closeout.** Three deliverables in one session: the **Chat Template Comparison** secondary widget (tabbed selector between ChatML, Llama-3, Mistral, and Gemma rendering the same conversation; with a feature comparison table at the bottom), an **Exercises section** with 4 problems (response-only loss masking, chat template formatting, multi-turn masking, synthetic data quality filter), and the **status flip** from `'draft'` to `'published'`. **Closes Ch 13.** After this session, the SFT chapter is on production. Ch 14 (RLHF / DPO / RLVR) begins next.

---

## Read first (in this order)

1. **`research/ch13-sft/research.md`** — pedagogical outcomes 2-5 (loss masking, templates, datasets) are the exercises' focus; the reference implementations section has working code that adapts directly
2. **`prompts/chapters/ch13-sft/session-59-page-structure.md`** — for the section-4 widget placeholder
3. **`prompts/chapters/ch13-sft/session-60-sft-loss-masking-widget.md`** — for the Ch 13 widget conventions established by the marquee
4. **`prompts/chapters/ch12-ssm-and-mamba/session-56-selective-scan-exercises-and-closeout.md`** — for the closeout template (Ch 12's closeout established the secondary-widget + exercises + status-flip pattern)

---

## Goal

By end of session, three things change in the repo:

1. **`<ChatTemplateComparison />`** widget replaces the section-4 `<WidgetFrame>` placeholder. The widget has a 4-button tab selector (ChatML / Llama-3 / Mistral / Gemma); below, the same 3-turn conversation is rendered in the selected template with special tokens highlighted; below that, a comparison table summarizes the four templates side-by-side.
2. **An "Exercises" section** is appended to `index.mdx`, between section 8 ("Pitfalls — format brittleness, capability tax") and the final chapter close paragraph. Four exercises with hints + runnable starter code.
3. **Ch 13's status flips from `'draft'` to `'published'`** in `src/lib/chapters.ts`. Ch 13 is the thirteenth published chapter.

After this session: **Ch 13 is complete.** Phase 11 is 1/4 done (3 chapters remaining: Ch 14 RLHF/DPO/RLVR, Ch 15 PEFT, Ch 16 distillation).

---

## Inputs

State of the repo after session 60:

- Section 3's `SFTLossMasking` marquee widget is wired
- Section 4's widget is still stubbed
- All 3 runnable code blocks from session 59 are in place
- `src/lib/chapters.ts` has Ch 1-12 `'published'`, Ch 13 `'draft'`

---

## Deliverables

1. **Create** `src/components/widgets/ch13/ChatTemplateComparison.tsx` — the React widget
2. **Create** `src/components/widgets/ch13/ChatTemplateComparison.module.css` — scoped styles
3. **Create** `src/components/widgets/ch13/template-data.ts` — the four templates and a shared conversation
4. **Update** `src/components/widgets/index.ts` — add `ChatTemplateComparison` export
5. **Update** `src/pages/ch13-sft/index.mdx`:
   - Replace section-4's `<WidgetFrame>` interior with `<ChatTemplateComparison client:visible />`
   - Add new `## Exercises` section between section 8 and the final chapter close paragraph
6. **Update** `src/lib/chapters.ts` — change Ch 13's `status` from `'draft'` to `'published'`

---

## Detailed spec

### Part A — Chat Template Comparison widget

#### A1. `template-data.ts` — shared conversation + four templates

```ts
// src/components/widgets/ch13/template-data.ts

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type TemplateId = 'chatml' | 'llama3' | 'mistral' | 'gemma';

/**
 * Shared conversation used across all templates. Short and clear for
 * pedagogical comparison.
 */
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
  models: string[];   // example models using this template
}

export const TEMPLATES: Record<TemplateId, TemplateInfo> = {
  chatml: {
    id: 'chatml',
    label: 'ChatML',
    description: "Clean, system-prompt-aware. The most widely-used template, popularized by OpenAI and adopted by many open models.",
    specialTokens: ['<|im_start|>', '<|im_end|>'],
    hasSystemRole: true,
    models: ['GPT-3.5/4 (internal format)', 'Mistral (via tokenizer)', 'Qwen', 'Hermes'],
  },
  llama3: {
    id: 'llama3',
    label: 'Llama-3',
    description: "Meta's format. More verbose with distinct header IDs; uses end-of-turn (eot) tokens distinct from end-of-sequence.",
    specialTokens: ['<|begin_of_text|>', '<|start_header_id|>', '<|end_header_id|>', '<|eot_id|>'],
    hasSystemRole: true,
    models: ['Llama-3-Instruct (8B, 70B, 405B)', 'Llama-3.1, 3.2, 3.3'],
  },
  mistral: {
    id: 'mistral',
    label: 'Mistral',
    description: "Mistral's original [INST] format. Simpler but lacks a native system role — system messages get prepended to the first user turn.",
    specialTokens: ['[INST]', '[/INST]', '<s>', '</s>'],
    hasSystemRole: false,
    models: ['Mistral-7B-Instruct', 'Mixtral-8x7B-Instruct'],
  },
  gemma: {
    id: 'gemma',
    label: 'Gemma',
    description: "Google's format. Like ChatML in spirit but different syntax; also lacks a system role (system messages prepended to first user turn).",
    specialTokens: ['<start_of_turn>', '<end_of_turn>'],
    hasSystemRole: false,
    models: ['Gemma-2-9B, 27B', 'Gemma-3', 'CodeGemma'],
  },
};

/** Segment of formatted output: text + whether it's a special token. */
export interface FormattedSegment {
  text: string;
  type: 'special' | 'role' | 'content' | 'newline';
}

/**
 * Format the conversation in the given template. Returns segments so
 * we can highlight special tokens differently from content.
 */
export function formatConversation(template: TemplateId, msgs: Message[] = CONVERSATION): FormattedSegment[] {
  switch (template) {
    case 'chatml':       return formatChatML(msgs);
    case 'llama3':       return formatLlama3(msgs);
    case 'mistral':      return formatMistral(msgs);
    case 'gemma':        return formatGemma(msgs);
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
```

#### A2. Visual layout

```
ViewBox: 0 0 800 760

┌──────────────────────────────────────────────────────────────────┐
│ Template:  [● ChatML]  [○ Llama-3]  [○ Mistral]  [○ Gemma]        │
│                                                                    │
│ Description:                                                       │
│ Clean, system-prompt-aware. The most widely-used template,        │
│ popularized by OpenAI and adopted by many open models.            │
│                                                                    │
│ Formatted conversation:                                            │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ <|im_start|>system                                            │ │
│ │ You are a helpful assistant.                                  │ │
│ │ <|im_end|>                                                     │ │
│ │ <|im_start|>user                                               │ │
│ │ What is the capital of France?                                │ │
│ │ <|im_end|>                                                     │ │
│ │ <|im_start|>assistant                                          │ │
│ │ The capital of France is Paris.                               │ │
│ │ <|im_end|>                                                     │ │
│ └──────────────────────────────────────────────────────────────┘ │
│ Special tokens: <|im_start|>, <|im_end|>                          │
│ Models using this: GPT-3.5/4, Mistral (via tokenizer),            │
│                    Qwen, Hermes                                    │
│                                                                    │
│ Feature comparison across all four:                                │
│ ┌─────────────────┬─────────┬──────────┬─────────┬─────────┐    │
│ │ Feature         │ ChatML  │ Llama-3  │ Mistral │ Gemma   │    │
│ │ System role     │   ✓     │   ✓      │   ✗     │   ✗     │    │
│ │ # special toks  │   2     │   4      │   4     │   2     │    │
│ │ End-of-turn     │ im_end  │ eot_id   │ </s>    │ end_o_t │    │
│ │ Role marker     │ im_start│ header_id│ [INST]  │ start_t │    │
│ └─────────────────┴─────────┴──────────┴─────────┴─────────┘    │
│                                                                    │
│ The same conversation, four different formats. Mixing them up     │
│ — using ChatML tokens with a Llama-3 model — produces broken      │
│ output. Always use the model's intended template via              │
│ tokenizer.apply_chat_template().                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click any template tab to switch the formatted-conversation view
- Description, special-token list, and example-models update with the selected template
- Hover any highlighted special token in the formatted output for a tooltip explaining what it does

#### A3. `ChatTemplateComparison.tsx`

```tsx
import { useState } from 'react';
import { TEMPLATES, CONVERSATION, formatConversation, type TemplateId } from './template-data';
import styles from './ChatTemplateComparison.module.css';

export default function ChatTemplateComparison() {
  const [selected, setSelected] = useState<TemplateId>('chatml');
  const info = TEMPLATES[selected];
  const segments = formatConversation(selected, CONVERSATION);

  return (
    <div className={styles.widget}>
      {/* Template selector */}
      <div className={styles.tabs}>
        <span className={styles.tabsLabel}>Template:</span>
        {(['chatml', 'llama3', 'mistral', 'gemma'] as TemplateId[]).map(id => (
          <button
            key={id}
            className={`${styles.tab} ${selected === id ? styles.tabActive : ''}`}
            onClick={() => setSelected(id)}
          >
            {TEMPLATES[id].label}
          </button>
        ))}
      </div>

      {/* Description */}
      <div className={styles.descriptionPanel}>
        <div className={styles.descriptionTitle}>{info.label}</div>
        <div className={styles.descriptionBody}>{info.description}</div>
      </div>

      {/* Formatted output */}
      <div className={styles.outputPanel}>
        <div className={styles.outputTitle}>Formatted conversation</div>
        <pre className={styles.outputBlock}>
          {segments.map((seg, i) => {
            if (seg.type === 'special') return <span key={i} className={styles.segSpecial}>{seg.text}</span>;
            if (seg.type === 'role') return <span key={i} className={styles.segRole}>{seg.text}</span>;
            if (seg.type === 'newline') return seg.text;
            return <span key={i} className={styles.segContent}>{seg.text}</span>;
          })}
        </pre>
        <div className={styles.outputMeta}>
          <div className={styles.outputMetaRow}>
            <span className={styles.outputMetaLabel}>Special tokens:</span>
            <span className={styles.outputMetaValue}>
              {info.specialTokens.map((t, i) => (
                <code key={i} className={styles.tokenChip}>{t}</code>
              ))}
            </span>
          </div>
          <div className={styles.outputMetaRow}>
            <span className={styles.outputMetaLabel}>Used by:</span>
            <span className={styles.outputMetaValue}>{info.models.join(', ')}</span>
          </div>
        </div>
      </div>

      {/* Feature comparison */}
      <div className={styles.compareTable}>
        <div className={styles.compareTitle}>Feature comparison</div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Feature</th>
              <th>ChatML</th>
              <th>Llama-3</th>
              <th>Mistral</th>
              <th>Gemma</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>System role</td>
              <Yes ok={TEMPLATES.chatml.hasSystemRole} />
              <Yes ok={TEMPLATES.llama3.hasSystemRole} />
              <Yes ok={TEMPLATES.mistral.hasSystemRole} />
              <Yes ok={TEMPLATES.gemma.hasSystemRole} />
            </tr>
            <tr>
              <td>Special tokens</td>
              <td>{TEMPLATES.chatml.specialTokens.length}</td>
              <td>{TEMPLATES.llama3.specialTokens.length}</td>
              <td>{TEMPLATES.mistral.specialTokens.length}</td>
              <td>{TEMPLATES.gemma.specialTokens.length}</td>
            </tr>
            <tr>
              <td>End-of-turn marker</td>
              <td><code>{'<|im_end|>'}</code></td>
              <td><code>{'<|eot_id|>'}</code></td>
              <td><code>{'</s>'}</code></td>
              <td><code>{'<end_of_turn>'}</code></td>
            </tr>
            <tr>
              <td>Role marker</td>
              <td><code>{'<|im_start|>'}</code></td>
              <td><code>{'<|start_header_id|>'}</code></td>
              <td><code>[INST]</code></td>
              <td><code>{'<start_of_turn>'}</code></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        The same conversation, four different formats. <strong>Each model expects its specific template</strong> —
        the special tokens were learned during pre-training. Using ChatML tokens with a Llama-3 model produces
        broken output: the model doesn't recognize the role markers. <strong>Always use the model's intended template</strong>
        via <code>tokenizer.apply_chat_template()</code>, which ships the right format in every modern tokenizer.
      </div>
    </div>
  );
}

function Yes({ ok }: { ok: boolean }) {
  return (
    <td className={ok ? styles.yes : styles.no}>{ok ? '✓' : '✗'}</td>
  );
}
```

#### A4. `ChatTemplateComparison.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.tabs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.tabsLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-right: 0.5rem;
}
.tab {
  padding: 0.4rem 0.9rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 200ms;
}
.tab:hover { border-color: var(--border-strong); color: var(--text-primary); }
.tabActive {
  border-color: var(--cyan-500);
  color: var(--cyan-300);
  background: color-mix(in srgb, var(--cyan-500) 6%, transparent);
  font-weight: 500;
}

.descriptionPanel {
  padding: 0.7rem 1rem;
  background: color-mix(in srgb, var(--cyan-500) 5%, var(--bg-elevated));
  border: 1px solid var(--cyan-500);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}
.descriptionTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--cyan-300);
  font-weight: 500;
  margin-bottom: 0.35rem;
}
.descriptionBody {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.55;
}

.outputPanel {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}
.outputTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-bottom: 0.6rem;
  font-weight: 500;
}
.outputBlock {
  margin: 0 0 0.85rem 0;
  padding: 0.85rem 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  line-height: 1.55;
  color: var(--text-secondary);
  white-space: pre-wrap;
  overflow-x: auto;
}
.segSpecial {
  color: var(--cyan-300);
  font-weight: 500;
  background: color-mix(in srgb, var(--cyan-500) 12%, transparent);
  padding: 0.05rem 0.2rem;
  border-radius: 2px;
}
.segRole {
  color: var(--amber-400);
  font-weight: 500;
}
.segContent {
  color: var(--text-primary);
}

.outputMeta {
  padding-top: 0.7rem;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.outputMetaRow {
  display: flex;
  gap: 0.6rem;
  align-items: baseline;
  flex-wrap: wrap;
  font-size: 0.78rem;
}
.outputMetaLabel {
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-tertiary);
  min-width: 110px;
}
.outputMetaValue {
  color: var(--text-secondary);
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  align-items: center;
}
.tokenChip {
  display: inline-block;
  padding: 0.1rem 0.4rem;
  background: color-mix(in srgb, var(--cyan-500) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--cyan-500) 40%, transparent);
  border-radius: 3px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--cyan-300);
}

.compareTable {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
  overflow-x: auto;
}
.compareTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-bottom: 0.6rem;
  font-weight: 500;
}
.table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
}
.table th, .table td {
  padding: 0.45rem 0.6rem;
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
}
.table th {
  color: var(--text-tertiary);
  font-weight: 500;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.table td { color: var(--text-secondary); }
.table td code {
  font-size: 0.7rem;
  background: var(--bg-primary);
  padding: 0.1rem 0.35rem;
  border-radius: 2px;
}
.yes { color: var(--emerald-400); font-weight: 500; }
.no  { color: var(--rose-400); font-weight: 500; }

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
.caption code {
  font-family: 'JetBrains Mono', monospace;
  background: var(--bg-primary);
  padding: 0.1rem 0.35rem;
  border-radius: 2px;
  font-size: 0.78rem;
  color: var(--cyan-300);
}

@media (max-width: 720px) {
  .tabs { gap: 0.3rem; }
  .tab { padding: 0.3rem 0.6rem; font-size: 0.72rem; }
  .table { font-size: 0.68rem; }
  .table th, .table td { padding: 0.3rem 0.4rem; }
}
```

#### A5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as SFTLossMasking } from './ch13/SFTLossMasking';
export { default as ChatTemplateComparison } from './ch13/ChatTemplateComparison';
```

#### A6. Update section-4's WidgetFrame in `index.mdx`

```mdx
import { SFTLossMasking, ChatTemplateComparison } from '@components/widgets';
```

```mdx
<WidgetFrame title="Chat template comparison" caption="The same 3-turn conversation rendered in ChatML, Llama-3, Mistral, and Gemma templates. Switch tabs to see each format. Note: ChatML and Llama-3 have native system roles; Mistral and Gemma don't (system messages get prepended to the first user turn). Each model is trained with its specific tokens; mismatched templates produce broken output. Always use tokenizer.apply_chat_template() in practice.">
  <ChatTemplateComparison client:visible />
</WidgetFrame>
```

### Part B — Exercises section

Insert between section 8 ("Pitfalls — format brittleness, capability tax") and the final chapter close paragraph:

````mdx
## Exercises

Four exercises that build on the chapter's machinery. Each is a self-contained problem with a starting template; hints are collapsed by default — try the problem first.

### Exercise 1 (easy) — Response-only loss masking

Implement SFT loss with response-only masking. Verify it produces a different (typically larger or smaller, depending on the mask) value than the unmasked loss.

<details>
<summary>Hint</summary>

The masked loss is:
$$\mathcal{L}_{\text{SFT}} = \frac{\sum_t m_t \cdot \mathcal{L}_{\text{CE}}(y_t, p_t)}{\sum_t m_t}$$

Implementation:
1. Compute per-position cross-entropy (no reduction)
2. Multiply by the mask
3. Sum and divide by mask sum (avoid divide-by-zero by clamping)

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def cross_entropy(logits, labels):
    """Per-position cross-entropy."""
    max_logit = logits.max(axis=-1, keepdims=True)
    log_z = np.log(np.exp(logits - max_logit).sum(axis=-1, keepdims=True)) + max_logit
    label_logits = np.take_along_axis(logits, labels[..., None], axis=-1).squeeze(-1)
    return log_z.squeeze(-1) - label_logits

def sft_loss(logits, labels, response_mask):
    """
    Response-only masked loss.
    
    logits:        (T, V) — model output
    labels:        (T,)   — target tokens
    response_mask: (T,)   — 1 where token is assistant response, 0 elsewhere
    """
    # TODO: compute per-position cross-entropy
    # TODO: multiply by response_mask and average over masked positions
    pass

# Demo
np.random.seed(0)
T, V = 12, 100
logits = np.random.normal(0, 1, (T, V))
labels = np.random.randint(0, V, T)

# Pretend first 6 tokens are user prompt; last 6 are assistant response
response_mask = np.zeros(T)
response_mask[6:] = 1.0

# Unmasked loss
unmasked = cross_entropy(logits, labels).mean()

# Masked loss
# masked = sft_loss(logits, labels, response_mask)

# print(f"Unmasked loss: {unmasked:.3f}")
# print(f"Masked loss:   {masked:.3f}")
# print(f"\\nThe masked loss is computed over only the response tokens.")
# print(f"In training, this means gradient only flows through assistant tokens.")
`}
  packages={["numpy"]}
/>

### Exercise 2 (medium) — Chat template formatter

Implement a chat template formatter for ChatML. Given a list of messages, produce the formatted prompt string. Then write a helper that identifies which character ranges in the output correspond to assistant content (for downstream loss masking).

<details>
<summary>Hint</summary>

For each message:
1. Append the opening special token `<|im_start|>` followed by the role
2. Append a newline + the content
3. Append the closing special token `<|im_end|>`
4. Append another newline for readability

To track assistant ranges, record the start index *before* writing the content and the end index *after*. The result is a list of `(start, end)` tuples — these would be used to build the loss mask after tokenization.

</details>

<RunnableCode
  client:visible
  defaultCode={`def format_chatml(messages):
    """
    Format a multi-turn conversation in ChatML.
    
    messages: list of {"role": str, "content": str}
    
    Returns: (formatted_string, assistant_ranges)
    where assistant_ranges is [(start_char, end_char), ...] for each assistant content.
    """
    # TODO: build the output string and record assistant content character ranges
    # output = ""
    # ranges = []
    # for m in messages:
    #     output += f"<|im_start|>{m['role']}\\n"
    #     if m["role"] == "assistant":
    #         start = len(output)
    #         output += m["content"]
    #         end = len(output)
    #         ranges.append((start, end))
    #     else:
    #         output += m["content"]
    #     output += "<|im_end|>\\n"
    # return output, ranges
    pass

# Test
messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "What is 2+2?"},
    {"role": "assistant", "content": "2+2 equals 4."},
    {"role": "user", "content": "And 3+3?"},
    {"role": "assistant", "content": "3+3 equals 6."},
]

# formatted, ranges = format_chatml(messages)
# print("=== Formatted conversation ===")
# print(formatted)
# print(f"\\n=== Assistant content ranges ({len(ranges)} responses) ===")
# for start, end in ranges:
#     print(f"  chars [{start}:{end}] = {repr(formatted[start:end])}")
# print(f"\\nThese ranges become the response mask after tokenization.")
`}
  packages={[]}
/>

### Exercise 3 (medium) — Multi-turn loss mask construction

Given a tokenized multi-turn conversation, construct the response mask such that all assistant tokens (including end-of-turn markers) are 1 and everything else is 0.

<details>
<summary>Hint</summary>

In a real implementation, you'd use the tokenizer's special-token IDs to find role boundaries. For this exercise, work with role labels per token (provided in the starter code).

Walk through the tokens. Track the "current role." Mark all tokens between the assistant's `<|im_start|>` and the assistant's `<|im_end|>` (inclusive of the `<|im_end|>` — model must learn to stop). User and system tokens get 0.

Note: the `<|im_start|>` and `assistant` role marker tokens at the *start* of the assistant turn are NOT in loss — those are context telling the model "now respond." Content + final `<|im_end|>` are in loss.

</details>

<RunnableCode
  client:visible
  defaultCode={`# Simulated tokenized conversation. Each entry: (text, role)
# Role can be 'system', 'user', 'assistant', or 'special'
tokens = [
    ('<|im_start|>', 'special'),
    ('system',       'special'),
    ('You',          'system'),
    ('are',          'system'),
    ('helpful.',     'system'),
    ('<|im_end|>',   'special'),
    ('<|im_start|>', 'special'),
    ('user',         'special'),
    ('What',         'user'),
    ('is',           'user'),
    ('2+2?',         'user'),
    ('<|im_end|>',   'special'),
    ('<|im_start|>', 'special'),
    ('assistant',    'special'),
    ('2+2',          'assistant'),
    ('equals',       'assistant'),
    ('4.',           'assistant'),
    ('<|im_end|>',   'special'),    # assistant end-of-turn — MUST be in loss
    ('<|im_start|>', 'special'),
    ('user',         'special'),
    ('And',          'user'),
    ('3+3?',         'user'),
    ('<|im_end|>',   'special'),
    ('<|im_start|>', 'special'),
    ('assistant',    'special'),
    ('3+3',          'assistant'),
    ('equals',       'assistant'),
    ('6.',           'assistant'),
    ('<|im_end|>',   'special'),    # assistant end-of-turn — MUST be in loss
]

def build_response_mask(tokens):
    """
    Build response mask. Returns list of 0/1 same length as tokens.
    1 = contributes to loss; 0 = doesn't.
    
    Rules:
    - All system / user tokens: 0
    - All special tokens that introduce a NON-assistant turn: 0
    - Special tokens that introduce an assistant turn (<|im_start|>, role marker): 0
    - Assistant content tokens: 1
    - Final <|im_end|> of an assistant turn: 1 (model learns to stop)
    """
    # TODO: walk through tokens, track state, build mask
    pass

# mask = build_response_mask(tokens)
# print(f"{'idx':>4} {'role':>10} {'text':>15} mask")
# for i, ((text, role), m) in enumerate(zip(tokens, mask)):
#     marker = "█" if m == 1 else "░"
#     print(f"{i:>4} {role:>10} {text:>15}   {marker} {m}")
# 
# # Verify
# in_loss = sum(mask)
# print(f"\\nTotal tokens: {len(mask)}, in loss: {in_loss} ({in_loss / len(mask) * 100:.0f}%)")
# print(f"Both assistant turns + their <|im_end|> markers contribute.")
# print(f"User, system, and assistant-turn opening markers do not.")
`}
  packages={[]}
/>

### Exercise 4 (hard) — Synthetic data quality filter

Build a multi-stage quality filter for synthetic SFT data. Apply it to a small dataset and report what fraction is retained. Real systems combine length checks, AI-self-reference detection, reward-model scoring, deduplication, and more.

<details>
<summary>Hint</summary>

A practical filter stacks multiple checks. Examples:
- **Length**: too-short responses (< 20 chars) or too-long (> 2000 chars) are suspect
- **AI self-reference**: "As an AI language model" is a red flag
- **Repetition**: highly repetitive responses (padded) are bad
- **Empty / placeholder**: "I don't know.", "N/A" are bad
- **Instruction echo**: response that contains the instruction verbatim is suspect
- **Length ratio**: response much shorter or much longer than expected is suspect

Each check returns a 0/1 (or weight). Combine multiplicatively (any check fails → 0) or additively. Tune thresholds empirically.

</details>

<RunnableCode
  client:visible
  defaultCode={`import re

# Synthetic dataset — some good, some bad
dataset = [
    {"instruction": "What is the capital of France?",
     "response": "The capital of France is Paris."},
    {"instruction": "Explain quantum entanglement.",
     "response": "OK"},
    {"instruction": "Write a poem about clouds.",
     "response": "As an AI language model, I cannot truly experience clouds, but here is a poem..."},
    {"instruction": "What's 2 + 2?",
     "response": "2 + 2 equals 4."},
    {"instruction": "Tell me about photosynthesis.",
     "response": "Photosynthesis is the process by which plants convert light energy into chemical energy, producing glucose and oxygen."},
    {"instruction": "Describe the moon.",
     "response": " ".join(["The moon is large."] * 50)},   # padded/repetitive
    {"instruction": "What is the capital of Spain?",
     "response": "What is the capital of Spain? The capital of Spain is Madrid."},   # echoes instruction
    {"instruction": "Hi!",
     "response": "Hello! How can I help you today?"},
    {"instruction": "Define entropy.",
     "response": "I don't know."},
    {"instruction": "What's the chemical formula for water?",
     "response": "H2O is the chemical formula for water. It consists of two hydrogen atoms and one oxygen atom."},
]

def filter_length(ex):
    """Reject too-short or too-long responses."""
    n = len(ex["response"])
    # TODO: return True if length is in acceptable range
    pass

def filter_ai_reference(ex):
    """Reject responses with 'as an AI' phrasing."""
    # TODO: return True if no AI self-reference
    pass

def filter_repetition(ex):
    """Reject responses where one short phrase repeats many times."""
    # TODO: split into words; check if any 3-word sequence appears too often
    pass

def filter_placeholder(ex):
    """Reject empty / placeholder responses."""
    # TODO: reject "I don't know.", "N/A", "OK", etc.
    pass

def filter_echo(ex):
    """Reject responses that echo the instruction verbatim."""
    # TODO: reject if instruction is a prefix of the response
    pass

def passes_all_filters(ex):
    """Apply all filters. Return True iff ex passes every check."""
    # return all(f(ex) for f in [filter_length, filter_ai_reference, filter_repetition, filter_placeholder, filter_echo])
    pass

# Apply filters
# results = []
# for ex in dataset:
#     keeps = passes_all_filters(ex)
#     results.append((ex["instruction"][:40], keeps))
# 
# print(f"{'instruction':>42} | keep?")
# print("-" * 55)
# for inst, keep in results:
#     marker = "✓" if keep else "✗"
#     print(f"{inst:>42} | {marker}")
# 
# kept = sum(1 for _, k in results if k)
# print(f"\\nKept: {kept}/{len(dataset)} ({kept / len(dataset) * 100:.0f}%)")
# print(f"\\nReal systems combine many filters + reward-model scoring + dedup.")
# print(f"A 50-80% retention rate is common for raw synthetic data.")
`}
  packages={[]}
/>

````

### Part C — Flip Ch 13's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 13, slug: 'ch13-sft', title: 'Supervised Fine-Tuning (SFT)', partNum: 5, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 3's** `SFTLossMasking` widget still renders correctly.
3. **Section 4** now renders the working `ChatTemplateComparison` widget.
4. **Default state:** ChatML tab selected; conversation rendered in ChatML format; description shows ChatML notes.
5. **Tab switching**: clicking Llama-3 tab → description updates to Llama-3 text; formatted output uses `<|begin_of_text|>`, `<|start_header_id|>`, etc.; meta-info updates to show Llama-3 special tokens and models.
6. **Mistral tab**: shows no system role (system content prepended to first user turn); uses `[INST]` and `[/INST]`.
7. **Gemma tab**: shows no system role; uses `<start_of_turn>` and `<end_of_turn>`; assistant role rendered as `model`.
8. **Special tokens highlighted** in the formatted output (cyan-tinted background).
9. **Role markers highlighted** in amber (distinct from special tokens but visually grouped).
10. **Feature comparison table** shows all four templates side-by-side with consistent data.
11. **System role row**: ChatML ✓, Llama-3 ✓, Mistral ✗, Gemma ✗ (cyan checkmarks and rose ✗).
12. **Exercises section** is below section 8 and above chapter close; contains 4 sub-exercises with collapsible hints and runnable starter code.
13. **Sidebar:** Ch 1-13 all active (published); Ch 14-30 still dimmed.
14. **Prev/next at bottom of Ch 13:** prev = Ch 12 (active); next = Ch 14 (disabled).
15. **TOC on Ch 13** includes Exercises as h2 plus 4 h3 sub-entries.
16. **Mobile (< 720px):** tabs wrap; comparison table scrolls horizontally if needed.
17. **`npm run typecheck`** passes.
18. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not provide exercise solutions.** Hints only.
- ❌ **Do not flip any other chapter's status.** Only Ch 13 flips.
- ❌ **Do not modify Ch 1-12.** Sealed.
- ❌ **Do not modify Ch 13 marquee widget.** Only section 4's WidgetFrame gets updated.
- ❌ **Do not modify Ch 13 prose sections 1-8.** Sealed.
- ❌ **Do not implement a real BPE tokenizer.** Conversation is treated at word/special-token level.
- ❌ **Do not enumerate every chat template.** Four (ChatML, Llama-3, Mistral, Gemma) is sufficient.
- ❌ **Do not include a "what if you mix templates" demo.** It's mentioned in prose; the widget visualizes one template at a time.

---

## Wire-up

```bash
git add src/pages/ch13-sft/index.mdx src/lib/chapters.ts src/components/widgets/ch13/ChatTemplateComparison.tsx src/components/widgets/ch13/ChatTemplateComparison.module.css src/components/widgets/ch13/template-data.ts src/components/widgets/index.ts
git commit -m "session 61: Ch 13 chat template comparison + exercises + status: published"
git push origin main
```

---

## Ch 13 closeout

Chapter 13 is now the thirteenth complete chapter on production. **Phase 11 is 1/4 done** — three chapters remaining (Ch 14 RLHF/DPO, Ch 15 PEFT, Ch 16 distillation).

Confirm before declaring Ch 13 done:

- ✅ BUILD_ORDER.md shows files 76-79 ✅
- ✅ File 80 marked ⏭️ (absorbed)
- ✅ Ch 13 status is `'published'`
- ✅ Both Ch 13 widgets work in production
- ✅ All 4 Ch 13 exercises render

**Cadence check across 13 chapters:**

| Chapter | Topic shape | Widgets | Files |
|---|---|---|---|
| Ch 1 | Math + code-heavy | 3 | 5 |
| Ch 2 | Concept-heavy | 2 | 4 |
| Ch 3 | Algorithm-heavy | 2 | 4 |
| Ch 4 | Math + visual | 2 | 4 |
| Ch 5 | Two-topic | 2 | 5 |
| Ch 6 | Variants | 2 | 4 |
| Ch 7 | Data engineering | 2 | 4 |
| Ch 8 | Two-topic | 2 | 5 |
| Ch 9 | Two-topic | 2 | 5 |
| Ch 10 | Engineering | 2 | 4 |
| Ch 11 | Architectural variant | 2 | 4 |
| Ch 12 | Architectural variant | 2 | 4 |
| Ch 13 | Practical engineering | 2 | 4 |

**4-file cadence holds for single-topic chapters (Ch 2, 3, 4, 6, 7, 10, 11, 12, 13 — 9 chapters now).**
**5-file cadence holds for two-topic chapters (Ch 1, 5, 8, 9 — 4 chapters).**
**13-chapter pattern stable.**

**Phase 11 (Post-training) status:**
- ✅ Ch 13 (Supervised Fine-Tuning) — complete
- ⬜ Ch 14 (RLHF / DPO / RLVR) — next
- ⬜ Ch 15 (PEFT — LoRA, adapters)
- ⬜ Ch 16 (Distillation)

**What's next — Ch 14: preference optimization.** This is Phase 11's algorithmic centerpiece. RLHF, DPO, RLVR — the family of methods that turn an instruction-following model (which SFT produces) into an aligned, helpful one. Ch 14 will likely be a **two-topic chapter** (RLHF + DPO are distinct enough to warrant separate treatment), so expect the **5-file cadence**.

---

## Notes for the session author

**On the four templates being the canonical four:**
ChatML, Llama-3, Mistral, and Gemma cover the dominant open-source templates of 2024. There are others (Phi, Qwen, Yi, etc.) but most either use ChatML directly or are minor variants. Four is enough to make the diversity tangible without becoming an enumeration.

**On the visual highlighting of special tokens:**
The formatted output uses three color tiers:
- **Cyan tinted background** for special tokens (`<|im_start|>`, `<|eot_id|>`, etc.) — these are the chrome
- **Amber text** for role markers when they're plain text (`system`, `user`, `assistant`, `model`) — visually grouped but distinct
- **Primary text color** for content — the actual data

The reader's eye is drawn to the cyan special tokens first — exactly the right pedagogical focus.

**On Mistral/Gemma lacking system role:**
This is a *real architectural difference*, not just a stylistic choice. Mistral and Gemma were trained without a distinct system role; system prompts get prepended to the first user turn. **This affects how reliably system prompts steer behavior** — Mistral models often follow system prompts less reliably than ChatML models because the model wasn't trained to weight a distinct system role.

**On the comparison table:**
The 4-row × 4-column table makes differences scannable at a glance. The System role row's ✓✓✗✗ pattern is the headline difference; the rest of the rows show that even the *syntax* varies (different special tokens, different role marker styles).

**On the exercise sequence:**
- Ex 1 (easy) — response-only loss: locks in the masking math
- Ex 2 (medium) — chat template formatter: implements the ChatML formatting + tracks assistant char ranges (for downstream tokenization-and-masking)
- Ex 3 (medium) — multi-turn mask construction: synthesizes the multi-turn case; reader sees that masking is per-token logic, not per-turn
- Ex 4 (hard) — synthetic data quality filter: practical engineering — multi-stage filters, retention rate analysis

**On the 4 exercises serving the 8 outcomes:**

| Outcome | Exercise |
|---|---|
| 1. SFT recipe summary | (chapter prose) |
| 2. Response-only loss masking | Ex 1, Ex 3 |
| 3. Chat templates | Ex 2 + widget |
| 4. LIMA / quality > quantity | Ex 4 + chapter prose |
| 5. SFT datasets | (chapter prose + Ex 4) |
| 6. Capability tax | (chapter prose) |
| 7. SFT in pipeline | (chapter prose) |
| 8. Pitfalls and mitigations | (chapter prose + Ex 4) |

Outcomes 2, 3 served by exercises directly. Outcomes 4, 5, 8 served by Ex 4. Outcomes 1, 6, 7 served by chapter prose.

**On Mistral's pendingSystem pattern in formatting code:**
The formatter treats Mistral and Gemma similarly — both lack a system role, so the code accumulates system content and prepends it to the next user turn. This is the *correct* behavior matching the actual templates (consult the Mistral and Gemma docs to verify).

**On the chapter's closing claim:**
"You now have the mechanics of SFT. Response-only masked loss + a chat template + curated data = a chatbot. The math is unchanged from Ch 8; the work is in data and operations. Most modern production models go through this step. What comes next — preference optimization (Ch 14) — addresses what SFT *can't* teach: quality and alignment. SFT teaches the model to respond; DPO/RLHF teaches it to respond *well*."

**Phase 11 progress:**
After this session, Ch 13 is done. Phase 11 has three chapters remaining, more sequential than Phase 10's independent chapters:
- Ch 14 (RLHF/DPO) builds on Ch 13 (SFT) — preference optimization sits on top of SFT
- Ch 15 (PEFT) is an optimization that applies to *any* fine-tuning, but is often paired with SFT and DPO
- Ch 16 (distillation) is a downstream technique applied to fully-trained models

Pace through Ch 14 with care — it's the algorithmic centerpiece of Phase 11.

**This chapter closes the foundation of post-training.** The reader now has the cheap-and-cheerful start of the pipeline. Build with care.

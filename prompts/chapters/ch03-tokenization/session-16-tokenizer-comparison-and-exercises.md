# Session 16 — Tokenizer comparison + exercises + Ch 3 closeout

> Final Chapter 3 session. Three deliverables: the **TokenizerComparison** widget for section 8 (compares how GPT-2, GPT-4, and SentencePiece tokenize the same text across 12 carefully chosen examples — English, multilingual, numbers, code, the famous SolidGoldMagikarp), an **Exercises section** at chapter end with 4 problems, and the **status flip** from `'draft'` to `'published'`. **End of Phase 5.**

---

## Read first (in this order)

1. **`research/ch03-tokenization/research.md`** — for the BPE algorithm, the language-asymmetry argument, and the SolidGoldMagikarp anecdote
2. **`prompts/chapters/ch03-tokenization/session-14-page-structure.md`** — for the section-8 widget placeholder and where the Exercises section goes
3. **`prompts/chapters/ch03-tokenization/session-15-bpe-training-widget.md`** — for the widget conventions established by Ch 3's marquee (especially the token-chip styling)
4. **`prompts/chapters/ch02-embeddings/session-13-word2vec-and-exercises.md`** — for the chapter-closeout template (Ch 2's analogous closeout session)

---

## Goal

By end of session:

1. **Section 8's `<WidgetFrame>` placeholder is filled** with `<TokenizerComparison client:visible />` — a comparison widget showing how the same text breaks into different tokens under three production tokenizers
2. **An "Exercises" section is appended** to `index.mdx`, between section 9 and the chapter close, containing 4 exercises with hints and starter `<RunnableCode>` blocks
3. **Ch 3's status flips from `'draft'` to `'published'`** — adding the third published chapter to the site (sidebar shows Ch 1 + Ch 2 + Ch 3 active; landing CTA still points to Ch 1)
4. **The chapter renders end-to-end as a complete deliverable**

After this session, Chapter 3 is the third complete chapter on production. **Phase 5 closes.**

---

## Inputs

State of the repo after session 15:

- `src/components/widgets/ch03/BPETraining.{tsx,module.css}` and `bpe-corpus.ts` exist (session 15)
- `src/components/widgets/index.ts` exports `BPETraining`
- Section 3's marquee widget is wired in `index.mdx`
- Section 8's widget is still stubbed
- `src/lib/chapters.ts` has Ch 1 + Ch 2 `'published'`, Ch 3 `'draft'`, others `'planned'`

---

## Deliverables

1. **Create** `src/components/widgets/ch03/TokenizerComparison.tsx` — the React widget
2. **Create** `src/components/widgets/ch03/TokenizerComparison.module.css` — scoped styles
3. **Create** `src/components/widgets/ch03/tokenizer-data.json` — pre-computed tokenizations from real tokenizers (generated offline; see Part B below)
4. **Create** `scripts/generate-tokenizer-data.py` — the offline script that produces `tokenizer-data.json`. Document in a comment that it's run once and the output committed.
5. **Update** `src/components/widgets/index.ts` — add `TokenizerComparison` export
6. **Update** `src/pages/ch03-tokenization/index.mdx`:
   - Replace section 8's `<WidgetFrame>` interior with `<TokenizerComparison client:visible />`
   - Add new `## Exercises` section between section 9 (closing) and the final chapter close paragraph
7. **Update** `src/lib/chapters.ts` — change Ch 3's `status` from `'draft'` to `'published'`

---

## Detailed spec

### Part A — `tokenizer-data.json` schema

The widget consumes a pre-computed JSON file with tokenizations for 12 carefully chosen example texts. We pre-compute because:
- Real GPT-2/GPT-4 tokenizer data is ~1-2 MB (too heavy for an inline widget)
- Pre-computed data lets the user explore *real* tokenizer behavior, not toy approximations
- Deterministic; no in-browser tokenizer needed

JSON schema:

```ts
// Used at runtime
interface TokenizerData {
  generatedAt: string;          // ISO date
  tokenizers: TokenizerInfo[];
  examples: Example[];
}

interface TokenizerInfo {
  id: string;                   // 'gpt2', 'gpt4', 'sentencepiece-t5'
  name: string;                 // 'GPT-2 (BPE)', 'GPT-4 (cl100k_base)', 'SentencePiece (T5)'
  vocabSize: number;            // ~50257 / ~100k / 32k
  description: string;          // 1-sentence explanation
}

interface Example {
  id: string;                   // 'english-short', 'korean', 'numbers-long', etc.
  text: string;                 // the original string
  category: 'english' | 'multilingual' | 'numbers' | 'code' | 'special';
  label: string;                // human-readable label, e.g. 'English: simple greeting'
  tokenizations: {
    [tokenizerId: string]: {
      tokens: string[];         // display strings; whitespace converted to '␣' for visibility
      tokenIds: number[];       // raw token IDs (informational)
      tokenCount: number;
      bytesPerToken: number;    // len(text.encode('utf-8')) / tokenCount
    };
  };
}
```

### Part B — `scripts/generate-tokenizer-data.py` (offline script)

```python
#!/usr/bin/env python3
"""
Generate tokenizer-data.json for the TokenizerComparison widget.

Dependencies: tiktoken, transformers (for SentencePiece via T5 tokenizer).
Install with:  pip install tiktoken transformers sentencepiece

Run this once; commit the resulting JSON. Re-run if examples change.
"""
import json
import sys
from datetime import datetime

# Try imports with friendly errors
try:
    import tiktoken
except ImportError:
    sys.exit("Install tiktoken:  pip install tiktoken")

try:
    from transformers import AutoTokenizer
except ImportError:
    sys.exit("Install transformers:  pip install transformers sentencepiece")


# ---------------------------------------------------------------------------
# The 12 example texts — curated to highlight tokenizer differences
# ---------------------------------------------------------------------------
EXAMPLES = [
    # English baseline
    {
        'id': 'english-short',
        'text': "Hello, world!",
        'category': 'english',
        'label': "English: simple greeting",
    },
    {
        'id': 'english-medium',
        'text': "The quick brown fox jumps over the lazy dog.",
        'category': 'english',
        'label': "English: pangram",
    },
    # Multilingual
    {
        'id': 'korean',
        'text': "안녕하세요. 만나서 반갑습니다.",
        'category': 'multilingual',
        'label': "Korean: greeting",
    },
    {
        'id': 'chinese',
        'text': "你好，世界！这是一段中文。",
        'category': 'multilingual',
        'label': "Chinese: hello world + sentence",
    },
    {
        'id': 'hindi',
        'text': "नमस्ते दुनिया",
        'category': 'multilingual',
        'label': "Hindi: hello world",
    },
    {
        'id': 'russian',
        'text': "Привет, мир!",
        'category': 'multilingual',
        'label': "Russian: hello world",
    },
    # Numbers
    {
        'id': 'numbers-short',
        'text': "I have 12 apples and 345 oranges.",
        'category': 'numbers',
        'label': "Numbers: short",
    },
    {
        'id': 'numbers-long',
        'text': "Pi is approximately 3.14159265358979323846.",
        'category': 'numbers',
        'label': "Numbers: long (pi)",
    },
    # Code
    {
        'id': 'python-code',
        'text': "def hello():\n    print('world')\nhello()",
        'category': 'code',
        'label': "Code: Python function",
    },
    {
        'id': 'json-like',
        'text': '{"name": "cat", "age": 7, "colors": ["black", "white"]}',
        'category': 'code',
        'label': "Code: JSON-like structure",
    },
    # Special cases
    {
        'id': 'emoji',
        'text': "🐱 🪑 🛏",
        'category': 'special',
        'label': "Emoji: three emoji",
    },
    {
        'id': 'solidgoldmagikarp',
        'text': " SolidGoldMagikarp",
        'category': 'special',
        'label': "Glitch token: SolidGoldMagikarp",
    },
]


# ---------------------------------------------------------------------------
# Tokenizer initialization
# ---------------------------------------------------------------------------
gpt2_tok = tiktoken.get_encoding("gpt2")
gpt4_tok = tiktoken.get_encoding("cl100k_base")
# T5 uses SentencePiece (Unigram LM variant)
sp_tok = AutoTokenizer.from_pretrained("t5-small")


def tokenize_with_gpt(tok, text):
    """Tokenize and return display-friendly tokens + ids."""
    ids = tok.encode(text)
    # Decode each token individually for display
    tokens = []
    for tid in ids:
        s = tok.decode_single_token_bytes(tid).decode('utf-8', errors='replace')
        # Convert whitespace to visible glyphs
        s = s.replace(' ', '\u2423').replace('\n', '\u21B5').replace('\t', '\u21E5')
        tokens.append(s)
    return tokens, ids


def tokenize_with_sentencepiece(tok, text):
    """Tokenize a string with the T5 SentencePiece tokenizer."""
    ids = tok.encode(text, add_special_tokens=False)
    raw_tokens = tok.convert_ids_to_tokens(ids)
    # SentencePiece uses '▁' (U+2581) for word-initial; convert to '␣' for visual consistency
    tokens = [t.replace('\u2581', '\u2423') for t in raw_tokens]
    return tokens, ids


def main():
    out_tokenizers = [
        {
            'id': 'gpt2',
            'name': 'GPT-2 (BPE)',
            'vocabSize': gpt2_tok.n_vocab,
            'description': 'Byte-level BPE trained on WebText (~40GB). Used by GPT-2.',
        },
        {
            'id': 'gpt4',
            'name': 'GPT-4 (cl100k_base)',
            'vocabSize': gpt4_tok.n_vocab,
            'description': 'Byte-level BPE with improved number handling. Used by GPT-3.5+ and GPT-4.',
        },
        {
            'id': 'sentencepiece-t5',
            'name': 'SentencePiece (T5)',
            'vocabSize': sp_tok.vocab_size,
            'description': 'Unigram LM tokenizer (Kudo 2018). Used by T5, mT5, ALBERT.',
        },
    ]

    out_examples = []
    for ex in EXAMPLES:
        text = ex['text']
        byte_len = len(text.encode('utf-8'))
        tokenizations = {}

        for tok_id, tok in [('gpt2', gpt2_tok), ('gpt4', gpt4_tok)]:
            tokens, ids = tokenize_with_gpt(tok, text)
            tokenizations[tok_id] = {
                'tokens': tokens,
                'tokenIds': ids,
                'tokenCount': len(tokens),
                'bytesPerToken': byte_len / max(len(tokens), 1),
            }

        sp_tokens, sp_ids = tokenize_with_sentencepiece(sp_tok, text)
        tokenizations['sentencepiece-t5'] = {
            'tokens': sp_tokens,
            'tokenIds': sp_ids,
            'tokenCount': len(sp_tokens),
            'bytesPerToken': byte_len / max(len(sp_tokens), 1),
        }

        out_examples.append({**ex, 'tokenizations': tokenizations})

    out = {
        'generatedAt': datetime.utcnow().isoformat() + 'Z',
        'tokenizers': out_tokenizers,
        'examples': out_examples,
    }

    out_path = 'src/components/widgets/ch03/tokenizer-data.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"Wrote {out_path}")


if __name__ == '__main__':
    main()
```

**Run once:**

```bash
pip install tiktoken transformers sentencepiece
python scripts/generate-tokenizer-data.py
```

The resulting JSON is committed to the repo. No runtime dependency on tiktoken or transformers — the widget reads pre-computed data.

**File size estimate:** ~12 examples × 3 tokenizers × ~20 tokens each = ~720 token entries plus metadata. JSON should be 30-60 KB. Acceptable for shipping.

### Part C — Visual layout

The widget renders as HTML (no SVG). Layout:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Example: [English: simple greeting              ▼]                 │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Original text                                               │    │
│  │ ─────────────────                                           │    │
│  │ "Hello, world!"                                             │    │
│  │ 13 chars, 13 UTF-8 bytes                                    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ GPT-2 (BPE)                                                 │    │
│  │ ─────────                                                   │    │
│  │  [Hello] [,] [␣world] [!]                                    │    │
│  │ 4 tokens · 3.3 bytes/token                                  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ GPT-4 (cl100k_base)                                         │    │
│  │ ────────                                                    │    │
│  │  [Hello] [,] [␣world] [!]                                    │    │
│  │ 4 tokens · 3.3 bytes/token                                  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ SentencePiece (T5)                                          │    │
│  │ ────────                                                    │    │
│  │  [␣Hello] [,] [␣world] [!]                                    │    │
│  │ 4 tokens · 3.3 bytes/token                                  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  Category chips: [English] [Multilingual] [Numbers] [Code]         │
│  [Special]                                                          │
└─────────────────────────────────────────────────────────────────────┘
```

Each token is rendered as a chip (same styling as session 15's `BPETraining` widget). Alternating chip backgrounds (slight bg-elevated vs bg-elevated-2) make adjacent token boundaries visible at a glance.

### Part D — `TokenizerComparison.tsx`

```tsx
import { useMemo, useState } from 'react';
import tokenizerData from './tokenizer-data.json';
import styles from './TokenizerComparison.module.css';

interface Tokenization {
  tokens: string[];
  tokenIds: number[];
  tokenCount: number;
  bytesPerToken: number;
}

interface Example {
  id: string;
  text: string;
  category: string;
  label: string;
  tokenizations: Record<string, Tokenization>;
}

interface TokenizerInfo {
  id: string;
  name: string;
  vocabSize: number;
  description: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  english: 'English',
  multilingual: 'Multilingual',
  numbers: 'Numbers',
  code: 'Code',
  special: 'Special',
};

const CATEGORY_COLORS: Record<string, string> = {
  english: 'var(--cyan-400)',
  multilingual: 'var(--amber-500)',
  numbers: 'var(--rose-500)',
  code: 'var(--emerald-500)',
  special: 'var(--text-secondary)',
};

export default function TokenizerComparison() {
  const data = tokenizerData as { tokenizers: TokenizerInfo[]; examples: Example[] };
  const [selectedId, setSelectedId] = useState(data.examples[0]!.id);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const filteredExamples = useMemo(() => {
    if (!filterCategory) return data.examples;
    return data.examples.filter(e => e.category === filterCategory);
  }, [filterCategory, data.examples]);

  // If filtering hides the current selection, switch to the first visible example
  const effectiveSelectedId = filteredExamples.find(e => e.id === selectedId)
    ? selectedId
    : (filteredExamples[0]?.id ?? selectedId);
  const selected = data.examples.find(e => e.id === effectiveSelectedId)!;

  const textCharCount = Array.from(selected.text).length;
  const textByteCount = new TextEncoder().encode(selected.text).length;

  return (
    <div className={styles.widget}>
      {/* Example selector */}
      <div className={styles.selectorRow}>
        <label className={styles.selectorLabel} htmlFor="example-select">Example:</label>
        <select
          id="example-select"
          className={styles.selector}
          value={effectiveSelectedId}
          onChange={e => setSelectedId(e.target.value)}
        >
          {filteredExamples.map(e => (
            <option key={e.id} value={e.id}>{e.label}</option>
          ))}
        </select>
      </div>

      {/* Original text panel */}
      <div className={styles.originalPanel}>
        <div className={styles.panelTitle}>Original text</div>
        <div className={styles.originalText}>{selected.text}</div>
        <div className={styles.panelStats}>
          {textCharCount} chars · {textByteCount} UTF-8 bytes
        </div>
      </div>

      {/* One panel per tokenizer */}
      {data.tokenizers.map(tok => {
        const t = selected.tokenizations[tok.id];
        if (!t) return null;
        return (
          <div key={tok.id} className={styles.tokenizerPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>{tok.name}</span>
              <span className={styles.panelVocab}>vocab {(tok.vocabSize).toLocaleString()}</span>
            </div>
            <div className={styles.tokenList}>
              {t.tokens.map((token, i) => (
                <code
                  key={i}
                  className={`${styles.tokenChip} ${i % 2 === 0 ? styles.tokenChipEven : styles.tokenChipOdd}`}
                  title={`Token ID: ${t.tokenIds[i]}`}
                >
                  {token}
                </code>
              ))}
            </div>
            <div className={styles.panelStats}>
              <strong>{t.tokenCount}</strong> tokens · <strong>{t.bytesPerToken.toFixed(2)}</strong> bytes/token
            </div>
          </div>
        );
      })}

      {/* Category filter chips */}
      <div className={styles.chipRow}>
        <span className={styles.chipLabel}>Filter by category:</span>
        {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
          const isOn = filterCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(isOn ? null : cat)}
              className={`${styles.chip} ${isOn ? styles.chipOn : ''}`}
              style={{ '--chip-color': CATEGORY_COLORS[cat] } as React.CSSProperties}
              aria-pressed={isOn}
            >
              {label}
            </button>
          );
        })}
        {filterCategory && (
          <button onClick={() => setFilterCategory(null)} className={styles.resetButton}>
            Clear filter
          </button>
        )}
      </div>

      {/* Helpful prose */}
      <div className={styles.helpBar}>
        Whitespace is shown as <code className={styles.tokenChipInline}>␣</code>; line breaks as <code className={styles.tokenChipInline}>↵</code>. Hover any token chip to see its numeric ID.
      </div>
    </div>
  );
}
```

### Part E — `TokenizerComparison.module.css`

Follow conventions from `BPETraining.module.css` and earlier widgets. Token-chip styling should match session 15's (consistency across Ch 3 widgets); panel layout matches the multi-panel pattern from `BPETraining`.

Key new styles:

```css
.selectorRow {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.selectorLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
}
.selector {
  flex: 1;
  padding: 0.4rem 0.6rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
}

.originalPanel,
.tokenizerPanel {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 0.65rem;
}
.originalText {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: var(--text-primary);
  white-space: pre-wrap;
  margin: 0.4rem 0;
}

.tokenList {
  margin: 0.5rem 0;
  line-height: 1.9;     /* extra leading so multi-line chip rows breathe */
}

.tokenChip {
  display: inline-block;
  padding: 2px 6px;
  margin: 1px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  border-radius: 3px;
  white-space: nowrap;
}
.tokenChipEven {
  background: var(--bg-elevated-2, color-mix(in srgb, var(--bg-elevated) 70%, var(--bg-primary)));
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
}
.tokenChipOdd {
  background: color-mix(in srgb, var(--cyan-500) 8%, var(--bg-elevated));
  color: var(--cyan-300);
  border: 1px solid color-mix(in srgb, var(--cyan-500) 30%, var(--border-default));
}

.panelHeader {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.panelVocab {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--text-tertiary);
}
.panelStats {
  margin-top: 0.4rem;
  font-size: 0.78rem;
  color: var(--text-tertiary);
}
.panelStats strong { color: var(--text-secondary); font-weight: 500; }
.panelTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.helpBar {
  margin-top: 0.5rem;
  padding: 0.6rem 0.85rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: 0.78rem;
  color: var(--text-tertiary);
  line-height: 1.5;
}
.tokenChipInline {
  display: inline-block;
  padding: 0 4px;
  font-family: 'JetBrains Mono', monospace;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 3px;
}

/* Chip row, chips, reset button — copy from session 12 / session 15 patterns */
.chipRow { /* ... matches session 12 */ }
.chipLabel { /* ... matches session 12 */ }
.chip, .chipOn { /* ... matches session 12 */ }
.resetButton { /* ... matches session 12 */ }
```

### Part F — Update `src/components/widgets/index.ts`

```ts
export { default as BackpropVisualizer } from './ch01/BackpropVisualizer';
export { default as TrainingCurves } from './ch01/TrainingCurves';
export { default as AutogradGraph } from './ch01/AutogradGraph';
export { default as EmbeddingSpace } from './ch02/EmbeddingSpace';
export { default as Word2VecDynamics } from './ch02/Word2VecDynamics';
export { default as BPETraining } from './ch03/BPETraining';
export { default as TokenizerComparison } from './ch03/TokenizerComparison';
```

### Part G — Update `src/pages/ch03-tokenization/index.mdx`

Three edits:

**Edit G1: Update widget imports**

```mdx
import { BPETraining, TokenizerComparison } from '@components/widgets';
```

**Edit G2: Replace section 8's `<WidgetFrame>` interior**

Find:

```mdx
<WidgetFrame title="Compare tokenizers" caption="...">
  <div style={{ ... }}>
    Widget content — session 16
  </div>
</WidgetFrame>
```

Replace its `<div>` interior with:

```mdx
<WidgetFrame title="Compare tokenizers" caption="See how the same text breaks into tokens under three real tokenizers — GPT-2 (byte-level BPE), GPT-4 (cl100k_base), and SentencePiece (T5). Notice how token counts differ across languages and content types.">
  <TokenizerComparison client:visible />
</WidgetFrame>
```

**Edit G3: Add the Exercises section**

Insert between section 9 ("From tokens to attention") and the final chapter close paragraph:

````mdx
## Exercises

The exercises build on the chapter. Each is a self-contained problem with a starting template. Hints are collapsed by default — try the problem first.

### Exercise 1 (easy) — Examine BPE merges on a custom corpus

Train BPE on a small corpus of your choice (5-10 sentences) and examine the first 10 merges learned. Confirm that high-frequency character pairs in the corpus appear in the first few merges.

<details>
<summary>Hint</summary>

Use the `train_bpe` function structure from section 3's runnable code. Print each merge along with its frequency count. The first merge should be the highest-frequency adjacent character pair in your corpus.

</details>

<RunnableCode
  client:visible
  defaultCode={`from collections import Counter, defaultdict

# Copy the train_bpe function from section 3 of this chapter, or write your own.

def train_bpe(words, vocab_size=270):
    # TODO: implement BPE training (or copy from section 3)
    # Return (merges, vocab)
    pass

# TODO: choose a corpus of 5-10 sentences (English or otherwise) and split into words
my_corpus = [
    # e.g. "the cat sat on the mat",
    # ...
]
words = []
for sentence in my_corpus:
    words.extend(sentence.split())

# TODO: train BPE and print the first 10 merges
# merges, vocab = train_bpe(words, vocab_size=...)
# for i, ((a, b), merged) in enumerate(merges[:10]):
#     print(f"Merge {i+1}: {a!r} + {b!r} -> {merged!r}")
`}
  packages={["collections"]}
/>

### Exercise 2 (medium) — Implement BPE encoding

After training BPE (exercise 1), implement the encoding function: given a new string, apply the learned merges in priority order to produce a sequence of tokens.

<details>
<summary>Hint</summary>

The key idea: at each step, look for the available merge with the lowest *learned* index (i.e., the merge learned earliest during training). Apply it. Repeat until no more learned merges are present in the token sequence.

</details>

<RunnableCode
  client:visible
  defaultCode={`def encode_bpe(word, merges):
    """
    Encode a word using a trained BPE tokenizer.
    word: a string
    merges: list of ((a, b), merged) tuples from training
    
    Returns: list of tokens (bytes)
    """
    # TODO: convert word to bytes, split into list of single bytes
    # TODO: build a merge priority map: {(a, b): index_learned_at}
    # TODO: while there's an applicable merge, find the lowest-priority one and apply it
    pass

# Test (assuming you've trained merges via exercise 1):
# encoded = encode_bpe("hello", merges)
# print(encoded)
`}
  packages={["collections"]}
/>

### Exercise 3 (medium) — Quantify language asymmetry

Take the same BPE tokenizer (trained on English text in exercise 1) and tokenize three short sentences: one in English, one in Korean (use Google Translate if needed), and one in Russian. Report bytes-per-token for each. Comment on the result.

<details>
<summary>Hint</summary>

Convert each sentence to UTF-8 bytes, then run it through your BPE tokenizer. `bytes_per_token = byte_count / token_count`. Expect English to be ~2-3 bytes/token, Korean ~1 byte/token (because each Korean character is 3 bytes and gets split), Russian somewhere in between.

</details>

<RunnableCode
  client:visible
  defaultCode={`# Assuming you have a trained BPE tokenizer from exercise 1
# (the one trained on English text).

sentences = {
    'English': "the cat sat on the mat",
    'Korean':  "고양이가 매트 위에 앉았다",
    'Russian': "Кошка сидит на коврике",
}

# TODO: for each sentence:
#   - compute byte count
#   - tokenize with your trained tokenizer
#   - compute token count
#   - report bytes/token
# TODO: comment on the asymmetry — which language is most "expensive" per character?
`}
  packages={["numpy"]}
/>

### Exercise 4 (hard) — Implement WordPiece

WordPiece is BPE's likelihood-based cousin (used by BERT). Instead of merging the most *frequent* pair, WordPiece merges the pair that most increases the unigram language model's likelihood. Implement a simple version: at each step, score each candidate pair by `count(a, b) / (count(a) * count(b))` and merge the highest-scoring pair.

<details>
<summary>Hint</summary>

WordPiece's scoring function approximates the "lift" from merging. The numerator is the joint count; the denominator is what you'd expect under independence. Pairs that co-occur more than chance get high scores. The first merges will be different from BPE on the same corpus.

</details>

<RunnableCode
  client:visible
  defaultCode={`from collections import Counter, defaultdict

def train_wordpiece(words, vocab_size=270):
    """
    Train a WordPiece-like tokenizer. The merge criterion is likelihood-based:
      score(a, b) = count(a, b) / (count(a) * count(b))
    Higher score = more likely to merge.
    """
    # TODO: similar structure to BPE training, but with the new merge criterion
    # 1. Build initial word_freq
    # 2. Loop until vocab full:
    #    a. Count pair frequencies AND single-token frequencies
    #    b. Score each pair: count(a,b) / (count(a) * count(b))
    #    c. Pick highest-scoring pair, create new token
    #    d. Update word_freq
    pass

# Compare BPE and WordPiece on the same corpus.
# Print the first 10 merges of each. They should differ.
`}
  packages={["collections"]}
/>
````

### Part H — Flip Ch 3's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 3, slug: 'ch03-tokenization', title: 'Tokenization', partNum: 1, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

`getFirstPublishedChapter()` still returns Ch 1; the landing CTA stays "Start with Chapter 1 →".

---

## Acceptance criteria

All must hold:

1. **`scripts/generate-tokenizer-data.py` runs successfully** on the chapter author's machine and produces `src/components/widgets/ch03/tokenizer-data.json`. The file size is between 20 and 100 KB.
2. **`npm run dev`** starts cleanly. No TypeScript errors.
3. **Section 8 of Ch 3** renders with the working `TokenizerComparison` widget. Section 3's marquee widget still works.
4. **Initial state:** dropdown shows "English: simple greeting" selected. Original text panel reads "Hello, world!". Three tokenizer panels each show ~4 tokens.
5. **Switch example via dropdown:** all three tokenizer panels update simultaneously.
6. **Verify language asymmetry visually:** switch to "Korean: greeting" — token counts in all three tokenizers jump substantially (often 2-3× the English equivalent). Bytes/token drops dramatically.
7. **Verify number tokenization:** switch to "Numbers: long (pi)" — GPT-2 and GPT-4 split the digits differently. GPT-4 typically keeps shorter runs of digits as single tokens.
8. **Verify glitch token:** switch to "Glitch token: SolidGoldMagikarp" — in GPT-2's tokenizer, the entire string is a single token. In GPT-4's tokenizer, it's typically 4-5 tokens (the glitch token isn't in the cl100k_base vocab).
9. **Category filter chips:** click "Multilingual" — dropdown narrows to 4 multilingual examples. Click again to clear.
10. **Token chip hover** shows the numeric token ID in a tooltip.
11. **Whitespace rendered as `␣`** in tokens that contain spaces.
12. **The four exercise blocks render** with collapsible hints and runnable starter code.
13. **Chapter close paragraph** is the final content in the file, AFTER the Exercises section.
14. **Landing page:** CTA still reads "Start with Chapter 1 →".
15. **Sidebar:** Ch 1, Ch 2, Ch 3 all active (published); Ch 4-30 dimmed.
16. **Prev/next nav at bottom of Ch 3:** prev = Ch 2 (active); next = Ch 4 (disabled).
17. **TOC on Ch 3** includes Exercises as an h2 entry plus 4 h3 entries.
18. **Mobile:** dropdown is tappable; tokenizer panels stack vertically; chip rows wrap.
19. **`npm run typecheck`** passes.
20. **`npm run build`** completes; the JSON is included in the static bundle.
21. **Final repo additions:**

```
scripts/
└── generate-tokenizer-data.py                ← new

src/
├── components/
│   └── widgets/
│       └── ch03/
│           ├── BPETraining.{tsx,module.css}  (session 15, unchanged)
│           ├── bpe-corpus.ts                  (session 15, unchanged)
│           ├── TokenizerComparison.tsx        ← new
│           ├── TokenizerComparison.module.css ← new
│           └── tokenizer-data.json            ← new (generated)
├── lib/
│   └── chapters.ts                            (Ch 3 status flipped)
└── pages/
    └── ch03-tokenization/
        └── index.mdx                          (widget + exercises + close)
```

---

## Out of scope

- ❌ **Do not implement live tokenization at runtime.** The pre-computed JSON is the data; no in-browser BPE/SentencePiece.
- ❌ **Do not let the user paste arbitrary text for tokenization.** Adding live tokenization would require shipping tokenizer code (or making API calls). Out of scope for an inline widget.
- ❌ **Do not add more than 12 example texts.** Twelve is enough to demonstrate the phenomena; more clutters the dropdown.
- ❌ **Do not provide exercise solutions.** Hints only.
- ❌ **Do not include tokenizer-data.json in `git` via the script's output.** Run the script once; commit the JSON; subsequent runs only needed if examples change.
- ❌ **Do not flip any other chapter's status.** Only Ch 3 flips. Ch 4-30 stay `'planned'`.
- ❌ **Do not modify Ch 1 or Ch 2.** Sealed.

---

## Wire-up

```bash
# One-time: generate the tokenizer data (requires Python deps)
pip install tiktoken transformers sentencepiece
python scripts/generate-tokenizer-data.py

# Now commit everything
git add scripts/generate-tokenizer-data.py
git add src/components/widgets/ch03/TokenizerComparison.tsx
git add src/components/widgets/ch03/TokenizerComparison.module.css
git add src/components/widgets/ch03/tokenizer-data.json
git add src/components/widgets/index.ts
git add src/lib/chapters.ts
git add src/pages/ch03-tokenization/index.mdx
git commit -m "session 16: tokenizer comparison widget + Ch 3 exercises + status: published"
git push origin main
```

After deploy, verify on production:
1. Both Ch 3 widgets render correctly
2. The 4 exercises display with working hints
3. Landing page CTA still points to Ch 1
4. Sidebar shows Ch 1, Ch 2, Ch 3 active

---

## Phase 5 closeout

This session closes **Phase 5** per `MASTER_PLAN.md`. **Chapter 3 is the third complete chapter on production.**

Confirm before declaring Phase 5 complete:

- ✅ BUILD_ORDER.md shows files 21-24 (Phase 5) all ✅
- ✅ Ch 3 status is `'published'`
- ✅ Both Ch 3 widgets work in production
- ✅ All 4 Ch 3 exercises have working starter code
- ✅ Ch 3 total word count is in the 6000-7500 range
- ✅ tokenizer-data.json is generated, committed, and rendering correctly
- ✅ Lighthouse scores green on `/ch03-tokenization/`
- ✅ Bundle size for Ch 3's chunk is reasonable (< 250 KB including both widgets + JSON)

**Phase 5 retrospective notes** (for the human running these sessions):

Ch 3 fit cleanly into the **4-session model** established by Ch 2's retrospective. The chapter has more code-heavy content than Ch 1 or Ch 2 (BPE training and encoding algorithms, the GPT-2 regex, the comparison widget's pre-compute script) but the file count didn't grow accordingly — denser content per file, not more files.

The cadence is now validated at three chapters:
- Ch 1: math-heavy, 3 widgets, **5 files** (research + 4 chapter sessions)
- Ch 2: concept-heavy, 2 widgets, **4 files** (research + 3 chapter sessions)
- Ch 3: algorithm-heavy, 2 widgets, **4 files** (research + 3 chapter sessions)

**Generalization:** the 4-session model is the default. The 5-session model is for unusually-visual chapters that need 3+ widgets. Most of Chapters 4-30 will fit the 4-session model.

**Pre-research scripts:** Ch 3 introduced a new pattern — chapters where the widget data requires offline computation (`scripts/generate-tokenizer-data.py`). The chapter author runs the script once; the output is committed. Future chapters with similar needs (e.g., real model weights, real attention matrices, real RLHF reward data) should follow this pattern: include the offline script in `scripts/`, commit the generated data, do not depend on the script being re-run at build time.

**File count update:**
- Phase 1 (Foundation): 5 files ✅
- Phase 2 (Scaffolding): 6 files ✅
- Phase 3 (Ch 1): 5 files ✅ — anomaly (5-session model)
- Phase 4 (Ch 2): 4 files ✅
- Phase 5 (Ch 3): 4 files ✅
- Phases 6-29 (Chapters 4-30): ~27 chapters × 4 files = ~108 files
- Polish phases: ~20-30 files
- **Total projection: ~150 files** (down from original 177; per Ch 2's retrospective)

**24 of ~150 files done. ~84% remaining.**

---

## Notes for the session author

**On the choice of 3 tokenizers:** GPT-2 (the canonical "old" byte-level BPE), GPT-4 (the canonical "new" byte-level BPE with better number handling), and T5 SentencePiece (a different algorithm family). Adding more would clutter; fewer would miss the cross-algorithm comparison. Three is right.

**On the choice of 12 examples:** the categories (English, multilingual, numbers, code, special) match the chapter's section 8 themes exactly. Each example is chosen to highlight a specific phenomenon:
- "English: pangram" — establishes the English baseline (~4 chars/token)
- "Korean / Chinese / Hindi" — language asymmetry
- "Numbers: long (pi)" — number-tokenization quirks (GPT-2 vs GPT-4 differ here)
- "Code: Python function" — whitespace and indentation handling
- "Code: JSON-like" — structural punctuation tokenization
- "Emoji" — multi-byte UTF-8 emoji decomposition
- "SolidGoldMagikarp" — the famous glitch token (literally one token in GPT-2; many in GPT-4)

If the chapter author wants to extend the example set, the categories provide a natural taxonomy.

**On the pre-compute pattern:** `scripts/generate-tokenizer-data.py` is a one-time tool. It's committed to the repo so future maintainers can re-run if needed (e.g., adding new examples), but the output JSON is what the widget consumes. No runtime Python dependency.

**On alternating chip colors:** the `tokenChipEven` / `tokenChipOdd` styling alternates token chip backgrounds. This makes adjacent token boundaries visible at a glance — critical for the comparison widget where token-boundary differences across tokenizers are the entire point. Without alternation, a sequence of similar-looking chips blurs together.

**On the exercises:**
- Exercise 1 has the reader reuse section 3's code on a corpus of their choosing — applied practice.
- Exercise 2 implements encoding, which the chapter prose discusses but the runnable code in section 3 doesn't include (only training). Closes the loop.
- Exercise 3 quantifies language asymmetry — turns the prose observation into a measurable result.
- Exercise 4 implements WordPiece, providing direct contrast to BPE. Reader sees the algorithm difference make concrete tokenization differences.

If a reader works through all four, they've extended the chapter materially and understood both BPE and WordPiece at the implementation level.

**On the chapter being complete.** Chapter 3 is now the third complete chapter. Read it end-to-end as a reader: open `/ch03-tokenization/`, walk through all 9 sections, click both widgets, try an exercise. If after 25 minutes a reader walks away knowing what BPE does, why byte-level BPE matters, what pre-tokenization is for, and why GPT-4 is better at arithmetic than GPT-2 — Phase 5 has done its job.

**Phase 5 closeout. Phase 6 begins on the next file (Chapter 4 — Attention).**

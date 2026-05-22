# Session 14 — Chapter 3 page structure

> First chapter session for Chapter 3 ("Tokenization"). Takes the research file and produces the full MDX page: 9 sections, ~5200 words of prose, all equations and callouts in place, two widget placeholders (sessions 15 and 16 fill them), and four runnable code blocks demonstrating BPE training, encoding, byte-level handling, and number-tokenization quirks. Follows the 4-session chapter model established in Phase 4.

---

## Read first (in this order)

1. **`research/ch03-tokenization/research.md`** — the source material. Every algorithm, equation, code snippet, and misconception in this session traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`context/CURRICULUM.md`** — for Ch 3's locked scope
4. **`context/DESIGN_SYSTEM.md`** — for Callout types, Equation/EqRef usage
5. **`prompts/chapters/ch02-embeddings/session-11-page-structure.md`** — for the template; Ch 3 follows the same shape with one extra section
6. **`prompts/chapters/ch02-embeddings/session-13-word2vec-and-exercises.md`** — for the chapter-closeout pattern session 16 will follow

If anything contradicts the research file, the research file wins.

---

## Goal

Replace the placeholder `index.astro` (if present from scaffolding) with a full `index.mdx` Chapter 3 page. By end of session:

- `src/pages/ch03-tokenization/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch03-tokenization/index.astro` is **deleted** if it existed (scaffolding session 04 may or may not have created stubs for chapters beyond Ch 1; verify first)
- `src/lib/chapters.ts` has Ch 3's status flipped from `'planned'` to `'draft'` (full `'published'` flip happens in session 16)
- The chapter renders at `/ch03-tokenization/` with sidebar showing Ch 3 active, prev/next nav linking to Ch 2 (active) and Ch 4 (disabled)

The page won't be feature-complete — two `<WidgetFrame>` blocks await sessions 15 and 16. The acceptance bar: a reader could read the chapter and learn from it.

**Difference from Ch 2:** Ch 3 has **9 sections** instead of 8. The added section is "The long tail of consequences" (section 8 in this chapter), which warrants its own h2 because the consequences of tokenization choices — number-tokenization quirks, glitch tokens, language asymmetry — are pedagogically central and don't fit naturally elsewhere.

---

## Inputs

State of the repo after session 13:

- Ch 1 and Ch 2 are both `'published'` with full prose and widgets
- `research/ch03-tokenization/research.md` exists
- `src/lib/chapters.ts` has Ch 1 and Ch 2 as `'published'`, Ch 3-30 as `'planned'`
- Widget directories `src/components/widgets/ch01/` and `src/components/widgets/ch02/` exist; no `ch03/` yet

---

## Deliverables

1. **Create** `src/pages/ch03-tokenization/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch03-tokenization/index.astro` **if it exists** (scaffolding may not have created it)
3. **Update** `src/lib/chapters.ts` — change Ch 3's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Chapter layout, components, scaffolding, Ch 1, Ch 2, and the widgets directory are owned by earlier sessions and stay untouched.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch03-tokenization
description: How raw text becomes the integer IDs that Chapter 2's embedding layer looks up. Byte-pair encoding in depth, byte-level BPE for unicode safety, alternative tokenizers (WordPiece, Unigram LM), and the long tail of LLM quirks that tokenizer choices introduce.
---
```

### Imports

```mdx
import { Callout, Equation, EqRef, Figure, WidgetFrame } from '@components/content';
import { RunnableCode } from '@components/code';
```

(Widget imports added in sessions 15 and 16.)

### Chapter opening

`ChapterLayout` renders the eyebrow + h1 + description automatically. The MDX file's first content is 2-3 short paragraphs (~150 words) of opening.

**Sample opening** — the chapter author should rewrite in their voice but match the register:

> Chapter 2 turned token IDs into vectors. Where those token IDs come from was a question kicked down the road.
>
> Now we cash the check. A tokenizer is the bridge between raw text — bytes on disk, characters on a screen — and the integer IDs that a neural network's embedding layer can look up. Every modern language model has one of these somewhere upstream of the embedding table. The bridge looks innocuous: a few hundred lines of code, a few kilobytes of data on disk. It is also where most of the surprising behavior of LLMs lives.
>
> By the end of this chapter, the reader who has been wondering why GPT-4 is bad at arithmetic, why Korean costs more than English per character on the OpenAI API, or what " SolidGoldMagikarp" was all about will have answers. The answers are all the same: tokenization. We're going to spend the rest of the chapter understanding why.

### Section 1: Why tokenize

**Heading:** `## Why tokenize`
**Word target:** ~500

**Teaching beats:**
1. Neural networks take numerical vectors as input. Chapter 2 showed how to turn integer token IDs into vectors via the embedding lookup. But the chapter started with "given a sequence of token IDs" — we now need to fill in the upstream step: how does raw text become token IDs?
2. A tokenizer is a deterministic function from strings to lists of integers. It's offline-trained (once, on a corpus) and then frozen for the lifetime of the model.
3. The choice of tokenizer affects vocab size, sequence length, model efficiency, and a lot of downstream behavior. It's not a detail to skip.
4. **Forward reference:** the rest of this chapter explores tokenization algorithms, their consequences, and the empirical surface they create.

**Required equation:**

$$\text{string} \xrightarrow{\text{tokenizer}} \text{list of token IDs} \quad \in \quad \{0, 1, \dots, |V|-1\}^*$$

**Required callout** — type `note`: the same tokenizer is used both at training time (to turn the training corpus into IDs the model learns from) and at inference time (to turn user prompts into IDs the model reads). Mismatched tokenization between training and inference silently corrupts inputs. This is why HuggingFace's "tokenizer + model" pairing is taken seriously — they must always match.

**No code in this section.** Setup only.

**Connection forward:** the obvious approaches are character-level and word-level. Section 2 shows why both fail.

### Section 2: Naïve attempts — character-level and word-level

**Heading:** `## Naïve attempts — character-level and word-level`
**Word target:** ~600
**Sub-headings:** `### Character-level: too long`, `### Word-level: too brittle`

**Teaching beats:**

**Character-level:**
1. Map each unicode character to an integer. Vocab = ~150,000 (all unicode codepoints) or much smaller (~256 for ASCII).
2. **Pros:** never out-of-vocabulary; transparent; trivial to implement.
3. **Cons:** every character is a token, so sequences are very long. For a 4096-token context, you'd fit ~4000 English characters ≈ 700 words. Attention cost scales with $\text{seq}^2$, so 7× longer sequences = 50× more attention compute.
4. **Modern usage:** character-level tokenization is used in some specific domains (some music generation models, some DNA models) but not in production text LLMs.

**Word-level:**
1. Split text on whitespace; each word is a token. Vocab = the set of unique words in training data, often 100k-1M for any reasonable corpus.
2. **Pros:** intuitive; tokens have meaning.
3. **Cons:**
   - Vocabulary explosion (every new corpus has new words → unbounded vocab)
   - Out-of-vocabulary problem at inference time (any word not seen in training → unknown token)
   - Bad with morphologically-rich languages (Finnish words can have hundreds of inflections; word-level treats them as unrelated)
   - Bad with punctuation, code, and structured text (`{` and `}` and `def` and `return`?)
4. The OOV problem is the killer. Word-level tokenizers ship a `<UNK>` token; once a sentence has `<UNK>`, the model has no idea what it represented.

**The compromise:** subword tokenization. Split words into pieces. Frequent words become single tokens; rare words become multiple tokens (often along morpheme-like boundaries). The next section introduces the specific algorithm: BPE.

**Required code** — a small `<RunnableCode>` showing the OOV problem in word-level tokenization:

```python
# Word-level tokenizer
vocab = {'the': 0, 'cat': 1, 'sat': 2, 'on': 3, 'mat': 4, '<UNK>': 5}

def word_tokenize(text):
    return [vocab.get(w.lower(), vocab['<UNK>']) for w in text.split()]

print(word_tokenize("the cat sat on the mat"))   # All known
print(word_tokenize("the dog barked at the cat"))  # 'dog' and 'barked' and 'at' are OOV
```

**Required callout** — type `aside`: in early-2010s NLP, word-level tokenizers shipped a huge `<UNK>` problem. Pre-trained word embeddings (like word2vec) had the same issue. The subword revolution (2015 onward) solved it.

**Connection forward:** the next section introduces BPE, which threads the needle.

### Section 3: BPE — the algorithm

**Heading:** `## BPE — byte-pair encoding`
**Word target:** ~1000 (longest section)
**Sub-headings:** `### The merge-greedy idea`, `### Training: count, merge, repeat`, `### Encoding: greedy by learned order`, `### A toy example`

**Teaching beats:**

**Background and intuition:**
1. BPE was originally a 1994 compression algorithm (Philip Gage). Sennrich et al. 2015 adapted it to NLP. Same algorithm; different application.
2. The idea: start with individual characters as tokens. Repeatedly find the most frequent adjacent pair, merge them into a single new token. Repeat until you've grown the vocabulary to the desired size.
3. The intuition: frequent character sequences (like "th", "ing", "tion") become single tokens. Rare sequences (made-up words, unusual names) stay as many small tokens.

**Training algorithm:**
- State the algorithm from research.md Algorithm 1 in chapter prose
- The key loop: count adjacent pairs → find max → merge → update

**Encoding algorithm:**
- State the algorithm from research.md Algorithm 2
- The key idea: apply merges in *learned order* (lowest merge index first), not by local frequency

**Worked example:**
- Walk through training BPE on a tiny corpus: "low low low lower lowest"
- Show the first few merges step by step
- Show the resulting vocab includes "low" as a single token, "er" and "est" as suffixes

**Required equations** — the BPE training step's merge criterion:

$$(a^*, b^*) = \argmax_{(a, b) \text{ adjacent in corpus}} \text{count}(a, b)$$

And the resulting update: replace every $(a^*, b^*)$ pair with new token $a^* + b^*$ throughout the corpus.

**Required callout** — type `insight`: "BPE encoding applies merges in *learned order*, not in *local frequency order*. The merge learned first during training has the highest priority at encoding time. This sounds backward but is correct: the first merge produces the highest-utility token in the vocabulary, so applying it earliest gives the same segmentation that training produced."

**Required widget placeholder** — BPE training visualizer (marquee, session 15):

```mdx
<WidgetFrame title="BPE training" caption="Watch BPE learn merges step by step on a small corpus. Each merge picks the most frequent adjacent pair; the vocabulary grows by one token each step.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 15 (marquee)
  </div>
</WidgetFrame>
```

**Required code** — a `<RunnableCode>` with the BPE training implementation from research.md. Trim to the essentials; the chapter doesn't need every edge case:

```python
from collections import Counter, defaultdict

def train_bpe(words, vocab_size=270):
    """Train BPE on a list of words. Returns merges and final vocabulary."""
    # Initialize: each word as tuple of single bytes (we encode to UTF-8 then split)
    word_freq = Counter(tuple(bytes([b]) for b in w.encode('utf-8')) for w in words)

    # Initial vocab: 256 bytes
    vocab = {bytes([i]) for i in range(256)}
    merges = []

    while len(vocab) < vocab_size:
        # 1. Count adjacent pairs
        pair_counts = defaultdict(int)
        for word, count in word_freq.items():
            for i in range(len(word) - 1):
                pair_counts[(word[i], word[i+1])] += count

        if not pair_counts: break

        # 2. Find most frequent pair
        best = max(pair_counts, key=pair_counts.get)

        # 3. Merge
        new_token = best[0] + best[1]
        vocab.add(new_token)
        merges.append((best, new_token))

        # 4. Update word_freq: replace every (a, b) with merged token
        new_freq = {}
        for word, count in word_freq.items():
            new_word = []
            i = 0
            while i < len(word):
                if i < len(word) - 1 and (word[i], word[i+1]) == best:
                    new_word.append(new_token)
                    i += 2
                else:
                    new_word.append(word[i])
                    i += 1
            new_freq[tuple(new_word)] = count
        word_freq = new_freq

    return merges, vocab

# Train on a tiny corpus
corpus = "the cat sat on the mat the dog sat on the rug".split()
merges, vocab = train_bpe(corpus, vocab_size=270)

# Show the first few merges learned
for (pair, merged) in merges[:5]:
    print(f"  {pair[0]!r} + {pair[1]!r} → {merged!r}")
```

This runs in Pyodide in ~100ms; readers see the actual merges that emerge from the corpus.

**Connection forward:** BPE on characters has a problem — unseen unicode at inference time. Section 4 introduces the fix.

### Section 4: Byte-level BPE — handling all unicode

**Heading:** `## Byte-level BPE — handling all unicode`
**Word target:** ~600

**Teaching beats:**
1. The OOV problem returns at the character level: what if your training corpus is mostly English but a user inputs Japanese? The Japanese characters aren't in the character vocab — your tokenizer breaks.
2. **The fix (Radford et al. 2019, GPT-2):** operate on UTF-8 bytes, not characters. Every byte (0-255) is in the initial vocab; every string is convertible to bytes losslessly. **No OOV is possible.**
3. The trade-off: multi-byte unicode characters become multi-token sequences. The Korean character "한" is 3 bytes in UTF-8, so it becomes (at minimum) 3 tokens before any merges learn to combine them. English text gets ~1 byte per character → ~1 token; Korean gets ~3 bytes per character → ~3 tokens. **This is the structural reason English LLMs are cheaper per character than Korean LLMs.**
4. **BPE on bytes is otherwise identical** to BPE on characters. The training and encoding algorithms don't change; only the base alphabet does.
5. Modern tokenizers (GPT-2/3/4, LLaMA, Mistral) all use byte-level BPE in some form.

**Required equation** — none specifically, but the concept can be stated as:

$$\text{string} \xrightarrow{\text{UTF-8}} \text{bytes} \xrightarrow{\text{BPE merges}} \text{tokens}$$

**Required callout** — type `warning`: this is misconception MC6 (from research.md). "BPE handles all languages equally well" — no. BPE is highly biased toward whatever languages dominate the training corpus. If the corpus is 95% English, the tokenizer is efficient on English and inefficient on everything else. The OpenAI API's per-token pricing therefore charges Korean and Hindi users substantially more per character than English users. This isn't a moral judgment — it's a structural property of byte-level BPE.

**Required code** — `<RunnableCode>` demonstrating the multi-byte issue:

```python
# Show how UTF-8 byte length varies by language
samples = {
    'English': "the cat sat on the mat",
    'Korean':  "고양이가 매트 위에 앉았다",
    'Hindi':   "बिल्ली चटाई पर बैठी थी",
    'Emoji':   "🐱 🪑 🛏",
}

for lang, text in samples.items():
    chars = len(text)
    bytes_len = len(text.encode('utf-8'))
    print(f"{lang:8s} {chars:3d} chars, {bytes_len:3d} bytes  (avg {bytes_len/chars:.1f} bytes/char)")
```

Output shows English ~1.0 bytes/char, Korean ~3.0 bytes/char, etc. The implication for token counts is immediate.

**Connection forward:** BPE is one algorithm. There are others.

### Section 5: WordPiece and Unigram LM

**Heading:** `## Other tokenizers — WordPiece and Unigram LM`
**Word target:** ~600

**Teaching beats:**
1. BPE isn't the only subword algorithm. Two others are widely used in production: WordPiece (BERT family) and Unigram LM (T5, Mistral, ALBERT).
2. **WordPiece (Wu et al. 2016):** nearly identical to BPE, but the merge criterion is different. BPE merges the most *frequent* pair; WordPiece merges the pair that most increases the unigram language model's likelihood. The merge decisions sometimes differ; the resulting tokenizations are usually similar but not identical.
3. **Unigram LM (Kudo 2018, in SentencePiece):** a completely different approach. Build a large candidate vocab of subwords, score each as a unigram language model, then segment text greedily by likelihood. Multiple valid segmentations per word — used as regularization during training.
4. **How to tell them apart in practice:**
   - BPE / byte-level BPE: GPT-2, GPT-3, GPT-4, LLaMA, Code Llama
   - WordPiece: BERT, RoBERTa (sort of — uses byte-level BPE for RoBERTa), DistilBERT
   - Unigram LM: T5, mT5, ALBERT, XLNet, Mistral (with byte fallback)
5. They produce *different* segmentations of the same text. Switching between them requires re-training the model from scratch.

**Required callout** — type `aside`: this is the answer to the FAQ "why can't I take BERT's tokenizer and use it with LLaMA?" The vocabularies and merge rules are completely different. Each model is locked to its tokenizer.

**No code in this section.** Brief comparison; depth lives in the papers.

**Connection forward:** there's an upstream step we glossed over — pre-tokenization. Section 6 fixes that.

### Section 6: Pre-tokenization and the GPT-2/4 regex

**Heading:** `## Pre-tokenization — the regex before the algorithm`
**Word target:** ~500

**Teaching beats:**
1. So far, the BPE description assumed we have "a corpus split into words." But what does "split into words" mean? Whitespace? Punctuation? Apostrophes? Code structure?
2. **Pre-tokenization** is the regex-based step *before* BPE proper that splits text into "word-units" — atomic chunks BPE operates on. BPE merges within word-units, never across them.
3. **Why this matters:** without pre-tokenization, BPE could merge "the" + " world" → "the world" if that sequence appeared often enough. Pre-tokenization keeps word boundaries respected.
4. **The GPT-2 regex** (Radford et al. 2019) — quote it verbatim and break it down:
   ```python
   PAT = r"""'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+"""
   ```
   - `'s|'t|'re|'ve|'m|'ll|'d` — contractions
   - `' ?\p{L}+'` — optional leading space + letters (word)
   - `' ?\p{N}+'` — optional leading space + digits (number)
   - `' ?[^\s\p{L}\p{N}]+'` — optional leading space + punctuation
   - `\s+(?!\S)` / `\s+` — whitespace handling
5. **The leading-space convention.** Note the optional leading space in word matches. This means " the" (with space) is a different word-unit from "the" (without space). After BPE, these become distinct vocabulary entries. " the" appears at mid-sentence; "the" appears after newlines or at sentence start. The model sees these as different tokens — which is correct, because they're contextually different.
6. **GPT-4 uses a slightly different regex** (tiktoken's `cl100k_base`) that handles numbers more carefully (keeps 1-3 digit numbers as single units) and supports more languages.

**Required code** — `<RunnableCode>` running the GPT-2 regex on sample text:

```python
import re

# Note: Python's stdlib re doesn't fully support \p{L} and \p{N}.
# Use the third-party 'regex' library, or approximate with [a-zA-Z]+ / [0-9]+
import regex

PAT = regex.compile(r"""'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+""")

samples = [
    "Hello, world!",
    "The price is $1,234.56.",
    "I'm not gonna do it.",
    "def foo(x):\n    return x + 1",
]

for s in samples:
    units = PAT.findall(s)
    print(f"{s!r}")
    print(f"  → {units}\n")
```

Readers see how the regex chops text into word-units. Note especially " not", " gonna" — leading-space tokens.

**Required callout** — type `note`: most BPE implementations use Python's `regex` package (not the stdlib `re`) because it supports unicode property classes like `\p{L}` (any letter) and `\p{N}` (any number). The stdlib `re` would require a much messier regex.

**Connection forward:** there are tokens BPE doesn't learn — they're added by hand. Section 7 covers them.

### Section 7: Special tokens

**Heading:** `## Special tokens`
**Word target:** ~400

**Teaching beats:**
1. The BPE algorithm produces tokens from the training corpus. But models also need tokens for *meta-events* that aren't in the corpus: "this is where the text starts," "this is where it ends," "this is padding," etc.
2. **Common special tokens:**
   - `<|endoftext|>` (GPT-2/3) — marks the end of a document or boundary between documents in pre-training
   - `<bos>` / `<eos>` (beginning / end of sequence) — many models
   - `<pad>` — used to pad short sequences to a fixed length for batching
   - `<unk>` — for tokenizers that can produce OOV (not byte-level BPE)
   - `<|im_start|>` / `<|im_end|>` (ChatGPT/GPT-4) — message boundaries in chat format
   - `[CLS]` / `[SEP]` (BERT) — classifier head input / sequence separator
3. **Where they go in the vocabulary:** typically at the *start* of the vocab (lowest IDs) or *end*, by convention. The exact position is hardcoded in the tokenizer.
4. **Why this matters:** the model has to learn what each special token means. `<|im_start|>` doesn't have inherent meaning — its meaning comes from the training data showing it preceding chat turns. Fine-tuning a model with new special tokens requires either retraining from scratch or initializing the new tokens carefully.
5. **Modern chat formats** (ChatGPT, Claude, Gemini) define their own special-token vocabulary for system/user/assistant message boundaries. These tokens are NOT learnable from raw text — they're injected programmatically.

**Required callout** — type `aside`: this is the answer to "why does prompt formatting matter so much?" Special tokens carry meaning encoded during training. If your prompt's format doesn't match the format the model was trained on (e.g., wrong special tokens, wrong whitespace handling), the model is in a slightly off-distribution state and may behave unpredictably.

**No code in this section.** Conceptual.

**Connection forward:** with the algorithm and the pre-tokenization done, we can look at the empirical consequences.

### Section 8: The long tail of consequences

**Heading:** `## The long tail of consequences`
**Word target:** ~700
**Sub-headings:** `### Number tokenization and arithmetic`, `### Language asymmetry`, `### Glitch tokens`

**Teaching beats:**

**Number tokenization:**
1. GPT-2's tokenizer splits "100" into `[' 1', '00']`. GPT-3 splits "100000" into `[' 100', '000']`. The number's structural decomposition into tokens is essentially arbitrary — determined by BPE merge frequency during training.
2. This means the model doesn't see "1234" as a single unit; it sees it as two or three tokens whose joint interpretation requires attention.
3. **Empirical consequence:** GPT-2/3 were notably bad at arithmetic. GPT-4 improved partly by adopting a tokenizer that keeps 1-3 digit numbers as single tokens; longer numbers still split but more consistently.

**Language asymmetry:**
1. English text averages ~4 characters per token in GPT-4's tokenizer. Korean averages ~1.5 characters per token. **A Korean prompt costs ~2.5× more per character than the equivalent English prompt** on per-token pricing models.
2. The asymmetry exists because BPE training corpora are dominated by English. Mikheliev (sp?) tokenization research has shown this directly.
3. **Implication for international users:** non-English speakers effectively pay more for the same service. This is not malicious; it's a structural property of byte-level BPE trained on English-heavy data.

**Glitch tokens:**
1. "SolidGoldMagikarp" was a Reddit username that appeared frequently in GPT-2/3's BPE training corpus. The BPE algorithm assigned it a dedicated token ID.
2. But by the time the model itself was trained (on a different, more curated text corpus), the username had been filtered out. The model had a vocab entry it never saw used.
3. The embedding row for " SolidGoldMagikarp" was therefore random — never updated by training. Prompting GPT-2/3 with that token caused unpredictable, often garbled output.
4. There are hundreds of such "glitch tokens" in GPT-2/3 — orphaned vocabulary entries from gaming jargon and rare usernames. Modern tokenizer training is more careful about this.

**Required callout** — type `warning`: misconception MC8 (research.md). "The tokenizer never matters once the model is good enough." Wrong. Tokenization shapes the model's expressive surface in ways that persist regardless of model scale. GPT-4 is large; it's still constrained by what's in its tokenizer.

**Required widget placeholder** — Tokenizer comparison widget (session 16):

```mdx
<WidgetFrame title="Compare tokenizers" caption="See how the same text breaks into tokens under different tokenizers. Notice the differences for numbers, non-English text, and code.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 16
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` showing number tokenization (using the toy BPE from section 3):

```python
# Reuse the trained BPE from section 3 (or train a fresh one on a number-heavy corpus)

# Train a tokenizer where numbers don't get clean treatment
import re
corpus_with_numbers = ["I bought 12 apples and 345 oranges and 6789 grapes"] * 10
words = []
for sentence in corpus_with_numbers:
    words.extend(sentence.split())

# Quick BPE train (using the function from section 3's code block)
merges, vocab = train_bpe(words, vocab_size=300)

# Now show how some numbers tokenize
def encode_naive(word, merges):
    """Naive encoder — just for demo. Real impl is in research.md."""
    tokens = [bytes([b]) for b in word.encode('utf-8')]
    # Apply merges in order
    for (a, b), merged in merges:
        new_tokens = []
        i = 0
        while i < len(tokens):
            if i < len(tokens) - 1 and (tokens[i], tokens[i+1]) == (a, b):
                new_tokens.append(merged)
                i += 2
            else:
                new_tokens.append(tokens[i])
                i += 1
        tokens = new_tokens
    return tokens

for n in ['12', '99', '345', '999', '6789', '12345']:
    tokens = encode_naive(n, merges)
    print(f"{n:>6s} → {len(tokens)} tokens: {[t.decode('utf-8', errors='replace') for t in tokens]}")
```

The exact split depends on the corpus. The point is that BPE tokenization of numbers is arbitrary — driven by training-data frequency, not by mathematical structure.

**Connection forward:** the bridge to attention (Ch 4).

### Section 9: Bridge to Chapter 4

**Heading:** `## From tokens to attention`
**Word target:** ~300

**Teaching beats:**
1. We now have a complete picture of how text enters a model: text → tokenizer → token IDs → embeddings.
2. The next step is the transformer: each layer operates on the sequence of embedded tokens. Chapter 4 introduces attention — the operation that lets each position in the sequence look at every other position and refine its representation accordingly.
3. **Sequence length matters.** Tokenization determines how long the sequence is. Better tokenization (fewer tokens per character) → shorter sequences → less attention compute. This is one reason why English-optimized tokenizers feel faster than multilingual tokenizers on the same content.

**Sample close** (rewrite in chapter voice):

> Tokenization is the bridge from text to integers. We've now walked across it. The integers feed Chapter 2's embeddings, which feed Chapter 4's transformer.
>
> By this point in the tutorial, you should have a fairly complete mental model of the input pipeline of an LLM: text in, tokenizer splits, embedding lookup, sequence of vectors out. What happens to those vectors next is the rest of the tutorial. Chapter 4 starts there.

---

### Update `src/lib/chapters.ts`

Find the Ch 3 entry:

```ts
{ num: 3, slug: 'ch03-tokenization', title: 'Tokenization', partNum: 1, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`. (Session 16 flips to `'published'` after the secondary widget and exercises are added.)

### Delete the placeholder

```bash
test -f src/pages/ch03-tokenization/index.astro && rm src/pages/ch03-tokenization/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch03-tokenization/`** renders with:
   - Chapter eyebrow ("Chapter 3") + h1 ("Tokenization") + description
   - 9 h2 sections in the order specified above
   - All equations render via KaTeX (no raw `$...$`)
   - 4 `<RunnableCode>` blocks (sections 2, 3, 4, 6 minimum; section 8 also has one)
   - 2 `<WidgetFrame>` placeholders (sections 3 and 8)
   - At least 6 callouts spread through the chapter (mix of note/warning/aside/insight)
3. **Sidebar:** Ch 1 published; Ch 2 published; Ch 3 newly active (draft); Ch 4-30 still dimmed.
4. **Landing page CTA:** still "Start with Chapter 1 →" (because Ch 1 is the first published chapter).
5. **Prev/next nav at bottom of Ch 3:** prev = Ch 2 (active link); next = Ch 4 (disabled).
6. **TOC on Ch 3** populates with all 9 sections plus subsections.
7. **Word count:** chapter prose between 5000 and 6500 words.
8. **`npm run typecheck`** passes.
9. **`npm run build`** completes; `dist/ch03-tokenization/index.html` exists.

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 15 and 16 own them.
- ❌ **Do not write exercises.** Session 16 owns.
- ❌ **Do not flip Ch 3's status to `'published'`.** Session 16 owns.
- ❌ **Do not modify Ch 1 or Ch 2.** Sealed.
- ❌ **Do not modify any layout, styling, or scaffolding file.**
- ❌ **Do not write content for Ch 4+.**
- ❌ **Do not add new MDX components.** Reuse what's available.

---

## Wire-up

```bash
git add src/pages/ch03-tokenization/index.mdx src/lib/chapters.ts
# Only if the placeholder existed:
git rm -f src/pages/ch03-tokenization/index.astro 2>/dev/null || true
git commit -m "session 14: Chapter 3 prose — 9 sections, BPE algorithm, byte-level handling, widget placeholders"
git push origin main
```

The next session (`session-15-bpe-training-widget.md`) assumes the section-3 `<WidgetFrame title="BPE training">` exists as specified.

---

## Notes for the session author

**On voice continuity:** the chapter opening's tone — "By the end of this chapter, the reader who has been wondering why GPT-4 is bad at arithmetic, why Korean costs more than English on the OpenAI API, or what ' SolidGoldMagikarp' was all about will have answers" — sets the chapter's promise. The chapter delivers in section 8. The setup-then-payoff structure is intentional; the chapter author should preserve it.

**On section 3 (BPE) length:** this is the longest section and the algorithmic centerpiece. Don't truncate to fit a word target — pace it correctly. The reader needs the training algorithm clearly explained, the encoding algorithm clearly explained, and a worked example walking through actual merges. ~1000 words of prose plus ~30 lines of runnable code is appropriate.

**On the regex section (6):** the GPT-2 regex is famous and intimidating. The chapter should *quote it verbatim* (it fits on one line, fortunately) and break it down piece by piece. Reading the regex literally is intellectually rewarding for the reader — it reveals design choices that propagate through every model that uses it.

**On the "long tail" section (8):** the three concrete examples (number tokenization, language asymmetry, glitch tokens) are pedagogically essential. Each is vivid; each is sticky; each makes the abstract claim "tokenization has consequences" feel concrete. Don't water them down.

**On code blocks:** Ch 3 has 4-5 runnable code blocks (more than Ch 2's 4). The chapter is more code-heavy because the algorithms are inherently code-shaped. Don't try to convert all the algorithms to prose-only descriptions.

**On widget placeholders:** both `<WidgetFrame>` placeholders should look 95% complete (real WidgetFrame with title and caption). Sessions 15 and 16 swap the interior `<div>` for the real React component.

**On forward references:** the chapter mentions Ch 4 (attention) prominently. The bridge in section 9 is short — just enough to set up Ch 4 starting "given a sequence of embedded tokens." Don't preview Ch 4's content.

**Pedagogical outcomes for the reader.** By the end of Ch 3, the reader should be able to:
1. Explain the BPE training algorithm at a high level
2. Explain why byte-level BPE handles unicode safely
3. Describe what pre-tokenization is and why it exists
4. Give two examples of how tokenization affects model behavior (number arithmetic, language asymmetry)
5. State which tokenizer family is used by GPT-4 vs BERT vs T5

If after reading the chapter, the reader can do these five things, the chapter has done its job.

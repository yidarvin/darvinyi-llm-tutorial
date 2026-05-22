# Chapter 3 — Tokenization: research

> Curated source material for Chapter 3's build sessions (sessions 14–16, files 22–24 in BUILD_ORDER). Tokenization is unusually consequential — many LLM "quirks" (poor math on certain numbers, bias against low-resource languages, subtle prompt-formatting effects) trace directly to tokenizer decisions made years before the model was trained. This research file goes deep on the algorithm (BPE) and broad on the consequences.

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Tokenization

**Premise:** How raw text becomes the integer IDs that downstream models consume. The bridge between human-readable strings and the embedding layer's lookup table. BPE in depth, byte-level BPE for unicode safety, the WordPiece and SentencePiece alternatives, and the long tail of quirks that tokenizer choices introduce.

**Out of scope (other chapters):**
- The embedding lookup itself (Ch 2 already covered)
- Attention over sequences of tokens (Ch 4)
- How vocab size interacts with model parameters (Ch 8)
- Multimodal tokenization — patches, audio codes (Ch 23)

**In scope and locked:**
- Why naïve tokenization (word-level, character-level) fails
- BPE training algorithm in detail (count pairs → merge → repeat)
- BPE encoding algorithm (greedy left-to-right merging)
- Byte-level BPE (GPT-2/3/4): why bytes, not characters
- WordPiece (BERT) and SentencePiece Unigram LM (T5, Mistral) — brief comparisons
- Pre-tokenization: the regex split that comes before BPE
- Special tokens: BOS, EOS, PAD, UNK, etc.
- The long tail of quirks: number tokenization, language asymmetry, prompt-format sensitivity, "Solid GoldMagikarp" — the empirical surface of why tokenization matters

**Suggested chapter structure:**

1. Why tokenize — the bridge from text to integers (~500 words)
2. Naïve attempts — character-level and word-level, and why they fall short (~600 words)
3. BPE: the algorithm (~1000 words — longest section)
4. Byte-level BPE: handling all unicode (~600 words)
5. The other contenders: WordPiece and Unigram LM (~600 words)
6. Pre-tokenization and the GPT-2/4 regex (~500 words)
7. Special tokens (~400 words)
8. The long tail of consequences (~700 words)
9. Bridge to Ch 4 (~300 words)

Target total: ~5200 words plus 2 widgets and 3-4 runnable code blocks.

---

## Key papers and references

### Sennrich, Haddow, Birch 2015 — "Neural Machine Translation of Rare Words with Subword Units"
- **arXiv:** [1508.07909](https://arxiv.org/abs/1508.07909)
- **What it contributed:** First adaptation of Gage's 1994 BPE compression algorithm to NLP. Showed BPE solves the rare-word problem in machine translation. Demonstrated empirically that splitting rare words into frequent subwords helped models translate and generate them.
- **For the chapter:** the foundational BPE-for-NLP citation. The algorithm in this paper is what GPT-2, GPT-3, and LLaMA all run a variant of. Cite when introducing BPE.

### Radford et al. 2019 — "Language Models are Unsupervised Multitask Learners" (GPT-2)
- **paper:** [openai.com/research/language-unsupervised](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf)
- **What it contributed for this chapter:** introduced **byte-level BPE** — operating on UTF-8 bytes rather than unicode characters. The pre-tokenization regex (described below) was also documented here. Vocab size of 50,257 became the de facto standard for English-centric LMs.
- **For the chapter:** central reference for byte-level BPE and pre-tokenization. The regex is worth quoting verbatim (it's surprisingly readable and has shaped the field).

### Wu et al. 2016 — "Google's Neural Machine Translation System"
- **arXiv:** [1609.08144](https://arxiv.org/abs/1609.08144)
- **What it contributed:** WordPiece tokenization, used by BERT. Same iterative-merging idea as BPE, but the merge criterion is likelihood-based (does this merge improve the unigram language model's likelihood?) rather than frequency-based.
- **For the chapter:** brief mention as the BERT family's tokenizer. The conceptual point: BPE and WordPiece are nearly the same algorithm with different scoring functions. Don't derive WordPiece in full; cite for completeness.

### Kudo 2018 — "Subword Regularization: Improving Neural Network Translation Models with Multiple Subword Candidates" + "SentencePiece"
- **arXiv:** [1804.10959](https://arxiv.org/abs/1804.10959) (regularization) and [1808.06226](https://arxiv.org/abs/1808.06226) (SentencePiece toolkit)
- **What it contributed:** the **Unigram LM tokenizer**, used in SentencePiece. Builds a vocabulary of subwords, scores each as a unigram language model, and segments greedily by likelihood. Multiple valid segmentations per word — used as regularization during training.
- **For the chapter:** brief mention. Unigram LM is what T5, ALBERT, XLNet, and Mistral use. Sennrich/BPE and Kudo/Unigram are the two dominant families; mentioning both lets the reader know "what tokenizer does X use" maps to one or the other.

### Karpathy — `minbpe`
- **GitHub:** [github.com/karpathy/minbpe](https://github.com/karpathy/minbpe)
- **YouTube:** "Let's build the GPT Tokenizer" (2024)
- **What it contributed:** The cleanest pedagogical reference implementation of BPE. ~150 lines of code; reproduces GPT-2/4-style tokenization end-to-end. The companion video is essentially this chapter, in long form.
- **For the chapter:** the canonical modern reference. The runnable code in the chapter should be a stripped version of minbpe's training + encoding logic.

### `tiktoken`
- **GitHub:** [github.com/openai/tiktoken](https://github.com/openai/tiktoken)
- **What it is:** OpenAI's open-source tokenizer for GPT-2, GPT-3.5, GPT-4. Includes pre-computed merge tables; encoding is constant-time-per-token (no learning needed).
- **For the chapter:** mention as the production tokenizer for the GPT family. A reader who's curious about real-world token counts can install it and play.

---

## Core derivations / algorithm specs (paste-ready)

### Algorithm 1: BPE training

**Inputs:**
- Corpus $C$ (a large body of text)
- Target vocabulary size $V$
- Initial vocabulary $V_0$ (typically 256 bytes for byte-level BPE, or all unique characters for character-level BPE)

**Output:** an ordered list of merge operations $[(a_1, b_1) \to c_1, (a_2, b_2) \to c_2, \dots, (a_m, b_m) \to c_m]$, where $m = V - |V_0|$.

**Algorithm:**

```
1. Pre-tokenize C into a list of word-units (see Algorithm 3 below for the regex split).
   Within each word-unit, split into base tokens (bytes or characters).
   Example: "hello world" → [["h","e","l","l","o"], ["w","o","r","l","d"]]

2. Build a frequency table: {word_tuple: count}
   Counting word-tuples (rather than per-occurrence) is essential for speed.

3. For i = 1 to m:
   a. Count adjacent pair frequencies across all word-tuples:
      pair_counts = defaultdict(int)
      for word_tuple, count in freq_table.items():
          for j in range(len(word_tuple) - 1):
              pair_counts[(word_tuple[j], word_tuple[j+1])] += count

   b. If pair_counts is empty, stop (no merges remain).

   c. Find the most frequent pair (a_i, b_i):
      best_pair = max(pair_counts, key=pair_counts.get)

   d. Create new token c_i = a_i + b_i.
      Add c_i to the vocabulary.
      Record (a_i, b_i, c_i) in the merges list.

   e. Update every word_tuple in freq_table: replace every occurrence of (a_i, b_i)
      with c_i. (Order-preserving: leftmost match first.)

4. Return the merges list.
```

**Worth noting:** ties on most-frequent pair are common early in training. Most implementations break ties by some deterministic rule (lexicographic on the pair's bytes). The choice affects reproducibility but not asymptotic behavior.

### Algorithm 2: BPE encoding (using the trained merges)

**Inputs:**
- Text $T$ (a string to tokenize)
- Trained merges (the ordered list from Algorithm 1)

**Output:** a list of token IDs.

**Algorithm:**

```
1. Pre-tokenize T into word-units using the same regex as training.

2. For each word-unit:
   a. Split into base tokens (bytes or characters).
   b. Repeat until no more merges apply:
      i.   Find all adjacent pairs in the current token list.
      ii.  Among those pairs, find the one with the lowest merge index
           (i.e., learned first during training).
      iii. If no learned pair is present, stop.
      iv.  Apply that merge.

3. Concatenate the per-word-unit token lists into a single sequence of token IDs.
```

**Why "lowest merge index" and not "most frequent"?** During training, the most frequent pair was merged first — so that merge produced the highest-utility token in the vocabulary. At encoding time, we want to apply merges in the *order they were learned*, which guarantees the same segmentation that training produced. This is sometimes called "greedy BPE" but the greediness is over the merge-priority ranking, not the local pair frequency.

### Algorithm 3: GPT-2 pre-tokenization regex

GPT-2/3/4 all use a regex to split text into "word-units" before BPE proper. From the GPT-2 paper:

```python
PAT = r"""'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+"""
```

**Breakdown:**
- `'s|'t|'re|'ve|'m|'ll|'d` — English contractions (always their own token)
- `' ?\p{L}+'` — a word (optional leading space + sequence of letters)
- `' ?\p{N}+'` — a number (optional leading space + sequence of digits)
- `' ?[^\s\p{L}\p{N}]+'` — punctuation/symbols (optional leading space + non-letter/non-digit/non-space)
- `\s+(?!\S)` — trailing whitespace before line end
- `\s+` — runs of whitespace

**Why pre-tokenize at all?** It prevents BPE from merging across word boundaries. Without pre-tokenization, "hello world" could in principle merge into "helloworld" if that bigram appeared often enough — losing the word boundary. Pre-tokenization keeps words atomic *as the unit BPE operates on*, then BPE finds subword patterns within each word.

**The leading space convention** — note that `' ?\p{L}+'` matches an OPTIONAL leading space. So "Hello world" becomes `["Hello", " world"]` (with the second token including its leading space). The space-prefix-token pattern is why GPT-2/3/4 tokens like " the" and "the" are distinct vocabulary entries. The chapter should note this — it's surprising to readers used to whitespace-stripping tokenizers.

### Algorithm 4: Byte-level BPE (GPT-2+)

Standard BPE on characters has a problem: unseen unicode characters at inference time can't be tokenized. Byte-level BPE solves this by operating on UTF-8 bytes — 256 possible base tokens, each in the vocabulary by construction.

```
1. Convert each input string to UTF-8 bytes (a sequence of integers 0-255).
2. Run BPE training/encoding as in Algorithms 1-2, but with byte values as base tokens.
3. The final vocabulary contains:
   - 256 base byte tokens
   - V - 256 merged tokens
4. No string is ever OOV — every byte is in the vocab.
```

**Trade-off:** byte-level BPE is slightly less efficient than character-level BPE on languages with multi-byte UTF-8 characters. A Korean character like "한" takes 3 bytes; "the" takes 3 bytes. So GPT-2 tokenizes "the" as 1 token but "한" as 3 tokens. This is the structural reason English is cheaper per-byte than Korean in GPT-family pricing.

---

## Glossary

- **Token:** a discrete unit produced by tokenization. Could be a character, a subword piece, a word, or anything in between depending on the tokenizer.
- **Token ID:** an integer in `[0, vocab_size)` uniquely identifying a token.
- **Vocabulary / vocab:** the set of all possible tokens. Typical sizes: 32k (LLaMA), 50k (GPT-2), 100k (GPT-4), 200k (modern multilingual).
- **Subword:** a token that's smaller than a word but larger than a character. The default unit in modern LMs.
- **BPE (Byte-Pair Encoding):** a tokenization algorithm that iteratively merges the most frequent adjacent token pairs. Originally from compression (Gage 1994); adapted to NLP (Sennrich et al. 2015).
- **Byte-level BPE:** BPE operating on UTF-8 bytes (not characters). Guarantees no OOV. Used by GPT-2/3/4, LLaMA, most modern LMs.
- **WordPiece:** BPE-like algorithm with a likelihood-based merge criterion. Used by BERT and its descendants.
- **Unigram LM (SentencePiece):** a tokenizer that builds a vocab of subword candidates, scores each as a unigram LM, and segments greedily by likelihood. Used by T5, Mistral, ALBERT.
- **Pre-tokenization:** the step before BPE proper — splitting text into "word-units" via a regex. Prevents BPE from crossing word boundaries.
- **Special tokens:** tokens added to the vocabulary that aren't produced by BPE. Examples: `<bos>` (begin of sequence), `<eos>` (end), `<pad>` (padding), `<unk>` (unknown), `<sep>` (separator), `<cls>` (classifier head input).
- **OOV (Out-of-vocabulary):** a token or character not in the vocabulary. Byte-level BPE eliminates OOV by construction.
- **Vocab size:** $|V|$, the number of distinct token IDs. Directly determines the embedding table size ($|V| \times d$) and the output projection's parameter count.
- **Tokenization rate / compression ratio:** average bytes per token (or tokens per character). For GPT-4 on English: roughly 4 chars/token = 1.3 tokens/word. Lower is better for inference cost.
- **Encoding:** turning text into token IDs.
- **Decoding:** turning token IDs back into text. Should be lossless (BPE is invertible if no truncation occurred).

---

## Pedagogical analogies

### 1. Tokenization as compression
BPE was originally a compression algorithm — replace frequent byte pairs with single new codes. Applied to NLP, the "compression" is conceptual: frequent character sequences become single tokens, rare sequences stay as many. The model sees a more compressed representation of text — fewer tokens per word on average — at the cost of having to learn a larger vocabulary.

**Best used for:** introducing BPE in section 3. The compression framing makes the merge criterion ("most frequent pair") feel motivated rather than arbitrary.

### 2. Subwords as approximate morphemes
Linguistic morphology breaks words into meaningful units: "unhappiness" = "un-" + "happy" + "-ness". BPE doesn't know morphology, but it often discovers approximations: high-frequency suffixes like "-ing", "-ed", "-ness", "-tion" usually become single tokens. The model can then represent "creating", "starting", "predicting" with shared "-ing" semantics.

**Best used for:** explaining why BPE works as well as it does. The morphology connection is approximate but pedagogically useful.

### 3. Pre-tokenization as a "don't cross this line" instruction
Without pre-tokenization, BPE could merge "the" + "_world" into "the_world", crossing the word boundary. Pre-tokenization is the upstream regex that says: "you can merge within words, never across them." It's the chaperone for BPE's greedy compressor.

**Best used for:** motivating why pre-tokenization exists at all (which surprises many readers).

### 4. Tokenizer choices as path-dependent
Once a model is trained with a particular tokenizer, you can't change tokenizers without retraining. Every embedding row, every output projection column, every position in the sequence is tied to the original tokenizer's vocabulary. So a tokenizer chosen in 2018 (with 2018 assumptions about what text the model would see) is still shaping 2025 model behavior.

**Best used for:** the long-tail consequences section. Sets up why tokenizer decisions are unusually consequential.

---

## Common misconceptions

### MC1: "Tokens are words."
**Reality:** in modern LLMs, tokens are subword pieces — usually smaller than words. "Tokenization" was synonymous with "word splitting" in pre-2015 NLP; that's no longer accurate. A single English word like "tokenization" typically becomes 2-3 tokens. "Antidisestablishmentarianism" might become 5-7. The mental model "1 word = 1 token" is wrong; it's a useful upper bound at most.

### MC2: "More tokens means a smarter model."
**Reality:** vocabulary size affects model behavior in non-monotonic ways. A larger vocab means:
- More embedding parameters (one row per token)
- Fewer tokens per text (so sequences are shorter, attention is cheaper)
- Coarser representations (each token covers more, but is also less compositional)

The Pareto-optimal vocab size depends on the training corpus, model size, and target languages. Modern LMs range from 32k (LLaMA) to 200k+ (multilingual models). Bigger isn't strictly better.

### MC3: "All tokenizers are the same."
**Reality:** GPT-2's BPE, BERT's WordPiece, and T5's Unigram LM produce *different* segmentations of the same text. Even within BPE, GPT-2 and GPT-4 use different training corpora and merges, so their tokenizations of "hello world" can differ. When you load a model, you must load its specific tokenizer; mixing them silently corrupts inputs.

### MC4: "Tokenizers are trained jointly with the model."
**Reality:** tokenizers are trained offline, *before* model training begins, on a representative sample of the training corpus. Once frozen, they're fixed for the entire model lifecycle. Changing the tokenizer requires retraining the model from scratch.

### MC5: "Vocab size doesn't affect anything outside the tokenizer."
**Reality:** vocab size directly determines:
- The embedding table size: $|V| \times d$ parameters
- The output projection size: $d \times |V|$ parameters (or shared with input via tying)
- Computation in the final softmax: $O(d \cdot |V|)$ per token
- Memory for the logits tensor: $O(\text{batch} \cdot \text{seq} \cdot |V|)$
For a 7B model with $|V| = 32k$, vocab parameters are ~262M (4% of total). For $|V| = 200k$, it's ~1.6B (23%). Vocab size is a serious parameter budget decision.

### MC6: "BPE handles all languages equally well."
**Reality:** BPE training favors high-frequency patterns in the training corpus. If the corpus is 95% English, the tokenizer will be highly efficient on English (low tokens-per-character) and inefficient on Korean, Hindi, Arabic, etc. (high tokens-per-character). This translates to:
- Higher inference cost for non-English text (more tokens = more compute)
- Shorter effective context windows for non-English text
- Possibly worse model performance on tasks in those languages

The asymmetry has measurable real-world consequences for API pricing and accessibility.

### MC7: "Numbers tokenize cleanly."
**Reality:** GPT-2 tokenizes "100" as `[' 1', '00']` (or similar split depending on context). This is the structural reason GPT-2 was bad at arithmetic — it had to compose "1" and "00" into a single quantity through attention, rather than starting from a unified "100" token. Modern tokenizers handle this better (GPT-4's tiktoken keeps multi-digit numbers as single tokens up to certain lengths), but the issue isn't fully solved. Tokenization is a constant source of arithmetic-related LLM mistakes.

### MC8: "The tokenizer never matters once the model is good enough."
**Reality:** there's a category of empirical LLM bugs called "tokenizer hauntings" or "glitch tokens." The famous example: " SolidGoldMagikarp" — a Reddit username that ended up as a single token in GPT-2/3's vocab (because it appeared frequently in the training data). The model never learned what it meant, so prompting with that token caused erratic behavior. There are hundreds of glitch tokens in GPT-2/3, mostly orphaned vocabulary entries from rare Reddit usernames and gaming jargon. Tokenization shapes the model's expressivity in ways that don't show up in benchmarks.

---

## Tricky implementation details

### TID1: Pair frequency ties during training
Multiple pairs can have the same frequency, especially early in training when most pairs have count 1. Implementations break ties by some deterministic rule (alphabetical on the byte strings is common). The choice matters for reproducibility — if you reseed training, you may get a slightly different tokenizer.

### TID2: Pre-tokenization regex matters more than you think
The GPT-2 regex isn't arbitrary — small changes have surprising consequences. The leading-space convention (`" the"` is a different token from `"the"`) was a specific design choice; tokenizers that strip leading whitespace make the model deal with "is this start-of-line or mid-sentence?" elsewhere. The regex is roughly a contract between the tokenizer and the rest of the pipeline.

### TID3: Greedy encoding can produce non-optimal segmentations
BPE encoding applies merges in learned order. This isn't always the lexicographically-best segmentation. Example: if the merge "lo" was learned at step 5 and "low" at step 200, encoding "lower" produces `["low", "er"]` (using the lower-index merge "lo" first, then later "low") — even if a from-scratch search might find `["lower"]` is in the vocab. This is *fine* in practice (the model learns to handle the standard greedy segmentation) but is a subtle point about what BPE encoding actually computes.

### TID4: Whitespace handling differs across tokenizers
GPT-2/3/4 keep whitespace as part of the next token (" world", " the"). BERT strips whitespace and uses `##` to mark continuation pieces (`token`, `##ization`). SentencePiece uses `▁` (U+2581) to mark whitespace. Same text, three different downstream representations. Switching tokenizers requires switching how prompts handle whitespace.

### TID5: Unicode normalization
Most tokenizers apply Unicode normalization (NFC, NFD, or NFKC) before BPE. Without it, "é" (single codepoint U+00E9) and "e" + "́" (combining acute accent, U+0065 + U+0301) would tokenize differently despite displaying identically. NFC normalization unifies them. Worth mentioning briefly; not central to the chapter.

### TID6: Byte fallback in SentencePiece
SentencePiece (Unigram LM) optionally includes a "byte fallback" mode: if a subword can't be segmented from learned vocab, fall back to individual bytes. This is similar in spirit to byte-level BPE but bolted onto a Unigram tokenizer. Mistral and LLaMA-3 use this.

### TID7: Counting tokens — surprising results
A 4096-token context window for GPT-4 sounds like a lot. In Korean, it might be ~1500 characters of text. In English, ~16,000 characters. In code (with deep indentation creating lots of whitespace tokens), often ~10,000 characters. "What does this token budget actually buy me?" depends entirely on the tokenizer + language + content type.

### TID8: Glitch tokens
Some vocabulary entries are essentially "orphaned" — they appeared frequently in BPE training but rarely in actual model training (because the model's training data was filtered differently). The model has an embedding row for them but never learned what they mean. Prompting with these tokens causes unpredictable behavior. There are public lists for GPT-2/3 (~100s of glitch tokens). Tokenizer choices that filter the BPE training corpus carefully prevent these.

---

## Reference implementations

### Minimal BPE training (numpy / pure Python)

```python
from collections import Counter, defaultdict

def train_bpe(corpus: list[str], vocab_size: int, special_tokens: list[str] = None):
    """
    corpus: list of strings (the training text)
    vocab_size: target final vocab size
    special_tokens: list of strings to add as fixed vocabulary entries
    
    Returns:
      merges: list of (token_a, token_b, merged_token) tuples in training order
      vocab: dict[int -> bytes] mapping IDs to their token bytes
    """
    special_tokens = special_tokens or []

    # 1. Pre-tokenize: for the minimal version, split by whitespace
    #    (real tokenizers use the GPT-2 regex; left as exercise)
    word_units = []
    for text in corpus:
        for word in text.split():
            # Encode as bytes, then represent as a tuple of single bytes
            byte_tuple = tuple(bytes([b]) for b in word.encode('utf-8'))
            word_units.append(byte_tuple)

    # 2. Build frequency table over distinct word-tuples
    word_freq = Counter(word_units)

    # 3. Initial vocab: 256 bytes + special tokens
    vocab = {i: bytes([i]) for i in range(256)}
    for tok in special_tokens:
        vocab[len(vocab)] = tok.encode('utf-8')
    
    merges = []
    target_merges = vocab_size - len(vocab)

    for merge_idx in range(target_merges):
        # 3a. Count adjacent pairs
        pair_counts = defaultdict(int)
        for word_tuple, count in word_freq.items():
            for i in range(len(word_tuple) - 1):
                pair_counts[(word_tuple[i], word_tuple[i+1])] += count

        if not pair_counts:
            break

        # 3b. Find the most frequent pair (tiebreak: lexicographic)
        best_pair = max(pair_counts, key=lambda p: (pair_counts[p], p))

        # 3c. Create the new token
        new_token = best_pair[0] + best_pair[1]
        new_id = len(vocab)
        vocab[new_id] = new_token

        # 3d. Update word_freq: replace (a, b) with merged token in every word_tuple
        new_word_freq = {}
        for word_tuple, count in word_freq.items():
            new_word = []
            i = 0
            while i < len(word_tuple):
                if i < len(word_tuple) - 1 and (word_tuple[i], word_tuple[i+1]) == best_pair:
                    new_word.append(new_token)
                    i += 2
                else:
                    new_word.append(word_tuple[i])
                    i += 1
            new_word_freq[tuple(new_word)] = count

        word_freq = new_word_freq
        merges.append((best_pair[0], best_pair[1], new_token))

    return merges, vocab


# Demo
corpus = ["the cat sat on the mat",
          "the dog sat on the rug",
          "a cat or a dog purred on the mat"]
merges, vocab = train_bpe(corpus, vocab_size=270)
print(f"Vocab size: {len(vocab)}")
print(f"First 5 merges learned: {merges[:5]}")
```

### Encoding with trained BPE

```python
def encode(text: str, merges: list, vocab: dict, vocab_inv: dict = None):
    """
    Encode a string into token IDs using a trained BPE tokenizer.
    """
    if vocab_inv is None:
        vocab_inv = {v: k for k, v in vocab.items()}

    # Build merge priority map: lower index = learned earlier
    merge_priority = {(a, b): i for i, (a, b, _) in enumerate(merges)}

    out_ids = []
    for word in text.split():
        tokens = [bytes([b]) for b in word.encode('utf-8')]

        # Apply merges in learned order
        while len(tokens) >= 2:
            # Find the lowest-priority merge available in current tokens
            best_priority = float('inf')
            best_idx = -1
            for i in range(len(tokens) - 1):
                priority = merge_priority.get((tokens[i], tokens[i+1]), float('inf'))
                if priority < best_priority:
                    best_priority = priority
                    best_idx = i
            if best_idx == -1:
                break
            merged = tokens[best_idx] + tokens[best_idx + 1]
            tokens = tokens[:best_idx] + [merged] + tokens[best_idx + 2:]

        for tok in tokens:
            out_ids.append(vocab_inv[tok])

    return out_ids
```

### Comparing tokenizations

```python
# After training above, encode the same text
print(encode("the cat", merges, vocab))
print(encode("the dog", merges, vocab))
print(encode("a unicorn",  merges, vocab))   # likely many tokens — "unicorn" wasn't in training
```

The toy implementation shows: text from the training distribution tokenizes efficiently; out-of-distribution text fragments into many small tokens.

---

## Connections to other chapters

- **Ch 2 (Embeddings):** tokenizer's vocab size determines embedding table size. The "what do token IDs index?" question Ch 2 answered is answered in detail here.
- **Ch 4 (Attention):** sequence length is the number of tokens. Better tokenization (fewer tokens per text) = shorter sequences = cheaper attention. This is one reason why English LLMs are faster than equivalent-quality Korean LLMs.
- **Ch 5 (Multi-head + Transformer Block):** the chapter implicitly assumes "we have a sequence of token embeddings"; Ch 3 explains where that sequence comes from.
- **Ch 6 (Positional encoding):** position is along the token axis. The mapping between text position and token position is mediated by the tokenizer.
- **Ch 8 (Building a small LLM):** when you build a model from scratch, you train the tokenizer first, on a representative corpus.
- **Ch 17 (Inference optimization):** KV cache size = $\text{seq\_len} \times \text{n\_layers} \times d_{\text{head}} \times 2$. Tokenization affects $\text{seq\_len}$.
- **Ch 22 (Retrieval & RAG):** retrieval systems compute embeddings over chunks. Tokenization affects chunk size and what "1000 tokens" means.

---

## Open questions for the chapter author

### Q1: How much WordPiece and Unigram LM to cover?
**Recommendation:** brief — one paragraph each in section 5. The pedagogical depth is on BPE; the other algorithms are name-checked and high-level. A reader wanting depth can read the papers.

### Q2: Should we cover Karpathy's minbpe in the chapter?
**Recommendation:** absolutely. Cite minbpe in section 3 (alongside Sennrich 2015) and in the chapter's further-reading footer. Karpathy's video is the single best 2-hour deep dive on this material; pointing readers there is a service.

### Q3: How deep on the "long tail of consequences" (section 8)?
**Recommendation:** medium — 700 words. Cover the highlights (number tokenization, language asymmetry, glitch tokens, leading-space convention) without becoming exhaustive. The pedagogical claim is "tokenizer choices are unusually consequential"; supporting examples should be vivid (SolidGoldMagikarp) rather than comprehensive.

### Q4: Should we have a runnable code block in section 8?
**Recommendation:** yes, ideally one that lets readers see number tokenization quirks. Show how GPT-2's tokenizer fragments "1234567" into multiple tokens, then contrast with GPT-4's tiktoken (which keeps it whole up to certain lengths). This requires shipping pre-computed tokenizers; the simplest route is via tiktoken-ish JS port or shipping a small JSON of merges. Or: pure-Python BPE in `<RunnableCode>` on a moderately-large corpus, simulating the same behaviors at a smaller scale.

### Q5: Widget candidates
1. **BPE training visualizer (marquee)** — on a tiny corpus (~5 sentences), animate the merge process. Show pair counts, the chosen merge, the updated vocab. ~30 merge steps; visible vocab growing. Recommended marquee.
2. **Tokenizer comparison playground** — type any text, see how 3 different tokenizers (GPT-2, GPT-4, a SentencePiece variant) tokenize it. Requires shipping pre-computed tokenizer data; non-trivial but high-value. Recommended secondary if buildable; could be replaced with a static "compare these examples" view if tokenizer data is too heavy.
3. **Token visualizer for a sentence** — small inline widget showing one sentence broken into colored token blocks with IDs underneath. Could be inline rather than a full `<WidgetFrame>` slot.

Recommend: (1) marquee, (2) secondary if feasible, otherwise replace with the BPE encoding visualizer showing how a trained tokenizer encodes new text (with the learned merges visible).

---

## Pre-research notes (for the human running these sessions)

Differences from Ch 1's and Ch 2's research files:

- **Algorithm-heavy.** Ch 3 has three full algorithm specs (BPE train, BPE encode, GPT-2 regex), plus byte-level handling. More pseudocode and less math than Ch 1 (which was derivation-heavy).
- **Misconception-heavy.** Eight misconceptions, more than either Ch 1 (7) or Ch 2 (7), because tokenization has more "common wisdom that's actually wrong" surfaces. The chapter prose should give these meaningful space.
- **Wide range of consequences.** The chapter teaches an algorithm but also a lot of practical implications. Section 8 (long-tail consequences) is unusually rich for what could be a dry algorithmic chapter — make sure the chapter author lands these.
- **Code-heavy but not math-heavy.** The reference implementations here total ~80 lines; readers will copy this code or close variations of it. Mathematical content is minimal (BPE has no real math — it's a count-and-merge loop).

The 4-session chapter model (research + page structure + marquee widget + secondary widget with exercises) fits Ch 3 well. The marquee should be the BPE training animation; the secondary should be tokenizer comparison or a similar interactive that lets readers explore tokenizer quirks.

This is the third research file. The template has now produced three documents that share structure but adapt substantially to content:
- Ch 1: derivation-heavy, math-rendered, 6000 words
- Ch 2: concept-heavy, MC-heavy, 5000 words
- Ch 3: algorithm-heavy, code-heavy, consequence-heavy, 5500 words

The template is more flexible than a rigid template; think of it as a *shape*. Most chapters will continue to fit one of these three flavors.

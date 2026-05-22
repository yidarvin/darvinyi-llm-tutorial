# Session 32 — Chapter 7 page structure

> First chapter session for Chapter 7 ("Pre-training data"). The first **non-architectural** chapter in the tutorial — focus shifts from "what the model is" to "what we train it on." Tone shifts from mathematical (derive equations) to **empirical** (cite results). Covers web data, deduplication, quality filtering, decontamination, and modern datasets (Pile → RedPajama → FineWeb → DCLM). Produces the full MDX page: 8 sections, ~4700 words, four runnable code blocks (exact dedup, MinHash, quality classifier, decontamination), and two widget placeholders.

---

## Read first (in this order)

1. **`research/ch07-pretraining-data/research.md`** — the source material. Every derivation, formula, code snippet, and misconception in this session traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`prompts/chapters/ch06-positional-encoding/session-28-page-structure.md`** — for the 8-section chapter template
4. **`prompts/chapters/ch03-tokenization/session-14-page-structure.md`** — for the "engineering-flavored" chapter template (Ch 3 had a similar empirical tone)

If anything contradicts the research file, the research file wins.

---

## Goal

Produce a full `index.mdx` Chapter 7 page. By end of session:

- `src/pages/ch07-pretraining-data/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch07-pretraining-data/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 7's status flipped from `'planned'` to `'draft'` (full `'published'` flip happens in session 34)
- The chapter renders at `/ch07-pretraining-data/` with sidebar showing Ch 7 active, prev/next nav linking to Ch 6 (active) and Ch 8 (disabled)

**Note on tonal shift:** Ch 7 is the first non-architectural chapter. Where Ch 1-6 derived equations, Ch 7 cites results. The chapter still has math (MinHash, Jaccard) but it's algorithmic engineering, not mathematical reasoning. The voice should be that of a careful data engineer explaining trade-offs, not a theorist explaining proofs.

**Chapter cadence:** Ch 7 uses the **4-file cadence** (research + 3 chapter sessions). Single topic (pretraining data) with sub-areas. Files 33-34 are the marquee widget and the closeout (secondary widget + exercises + status flip). File 47 from the original BUILD_ORDER is absorbed.

---

## Inputs

State of the repo after session 30 (Ch 6 complete):

- Ch 1-6 all `'published'`
- `research/ch07-pretraining-data/research.md` exists
- `src/lib/chapters.ts` has Ch 1-6 `'published'`, Ch 7-30 `'planned'`
- No `src/pages/ch07-pretraining-data/index.mdx` yet

---

## Deliverables

1. **Create** `src/pages/ch07-pretraining-data/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch07-pretraining-data/index.astro` if it exists
3. **Update** `src/lib/chapters.ts` — change Ch 7's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Earlier chapters and widgets are sealed.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch07-pretraining-data
description: Modern LLMs are trained on trillions of tokens of web text, but raw web data is mostly low-quality. This chapter covers how the training corpus gets built — sourcing from CommonCrawl, deduplicating with MinHash and LSH, filtering with quality classifiers, and decontaminating against benchmarks. Major datasets from The Pile (2020) to DCLM (2024).
---
```

### Imports

```mdx
import { Callout, Equation, EqRef, Figure, WidgetFrame } from '@components/content';
import { RunnableCode } from '@components/code';
```

### Chapter opening

`ChapterLayout` renders the eyebrow + h1 + description automatically. The MDX file's first content is 2-3 short paragraphs (~200 words) of opening.

**Sample opening** — rewrite in chapter voice:

> Six chapters in, the architecture is complete: tokens go in, embeddings get added to positions, attention happens, blocks stack, and probabilities come out. Random initial weights, though. The model is the inert before training. What turns it into a working LLM is data — trillions of tokens of text, drawn mostly from the web, carefully curated to weed out the worst of what's online while keeping the good.
>
> This chapter is the unglamorous half of LLM training. The model architecture is what gets papers; data engineering is what gets results. The empirical story from 2020-2024 is unambiguous: **data quality dominates over quantity at scale**. Apple's DCLM result is the canonical example — a 7B model trained on their carefully filtered 3.8T-token corpus outperforms Llama-3 8B trained on 15T tokens.
>
> What follows is the modern data pipeline. Start with CommonCrawl (petabytes of raw web text); dedupe (exact, then near-duplicate via MinHash); filter for quality (heuristics, then classifiers); decontaminate against benchmarks; mix sources with weights. After Chapter 8 builds the training loop, this corpus is what we feed it.

### Section 1: The setup — why data matters as much as architecture

**Heading:** `## The setup — why data matters as much as architecture`
**Word target:** ~500

**Teaching beats:**
1. **The empirical claim:** data quality dominates over data quantity at scale.
2. **The canonical evidence:** DCLM result — Apple's 7B model on 3.8T filtered tokens outperforms Llama-3 8B on 15T tokens. SlimPajama result — Cerebras showed that aggressively-deduped RedPajama (49% smaller) produces better models than the original.
3. **Why this is non-obvious:** the field's intuition for years was "more is better." Scaling laws (Hoffmann et al. 2022, Chinchilla) suggested ~20 tokens per parameter as optimal — emphasis on tokens. The realization that *quality* tokens matter even more came late.
4. **What "quality" means:** absence of junk (boilerplate, broken HTML, spam), presence of value (educational content, reasoning, code), no near-duplicates (or the model overfits to them), no benchmark contamination (or evaluations lie).
5. **What the chapter covers:** the modern pipeline from "raw web text" to "training-ready corpus."

**Required callout** — type `warning`: MC1 from research.md. "More data is always better." Wrong — at scale, data quality dominates. The DCLM result is the canonical demonstration. Past a certain point, low-quality data hurts more than it helps.

**No code in this section.** Setup and motivation.

**Connection forward:** section 2 looks at where the data starts.

### Section 2: Web data — CommonCrawl and what's in it

**Heading:** `## Web data — CommonCrawl and what's in it`
**Word target:** ~600

**Teaching beats:**
1. **CommonCrawl** is a public, nonprofit web crawl. Petabytes of HTML across 250+ monthly snapshots since 2008.
2. **What's in a CommonCrawl snapshot:** ~3B web pages, ~250 TB compressed, every domain you've heard of plus billions you haven't.
3. **File formats:** WARC (raw HTTP responses), WET (plain text extracted via standard heuristics), WAT (HTML metadata).
4. **What's *in* the text:** a long tail. The good 1% (educational sites, technical blogs, Wikipedia-likes); the mediocre 80% (social media noise, listicles, SEO bait); the bad 19% (spam, broken HTML, machine-translated content, low-quality auto-generated text).
5. **Why CommonCrawl despite the noise:** scale. The high-quality fraction alone is enormous — far larger than dedicated curated sources. Modern data pipelines extract this fraction.
6. **The shift toward custom crawls:** GPT-4-era models reportedly use custom proprietary crawls rather than CommonCrawl alone. The methodology is similar; the source is private.

**Required callout** — type `warning`: MC2 from research.md. "Web data is mostly junk." Refined: raw web data is mostly low-quality, but the *high-quality fraction* is enormous. The job of data curation is to *find* it. FineWeb-Edu retained ~9% of FineWeb after educational classification, and that 9% produces dramatically better models than the same volume of random sampling.

**Required code** — `<RunnableCode>` showing a basic line-count and language distribution analysis. Use a stubbed corpus inline (the chapter author can include a small representative sample):

```python
# A toy "corpus" of 5 simulated documents — for demonstration only.
corpus = [
    "The capital of France is Paris. It is the largest city in France.",
    "buy buy buy click here free shipping limited time act now act now",
    "Photosynthesis is the process by which plants convert light energy into chemical energy.",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
    "The quick brown fox jumps over the lazy dog. The lazy dog jumps over the brown fox.",
]

print(f"Total documents: {len(corpus)}")
print(f"Total characters: {sum(len(d) for d in corpus)}")
print(f"Total words: {sum(len(d.split()) for d in corpus)}")

# Per-document statistics
print("\nPer-document statistics:")
for i, d in enumerate(corpus):
    words = d.split()
    unique_words = set(words)
    print(f"  [{i}] {len(d):>4d} chars, {len(words):>2d} words, {len(unique_words):>2d} unique ({len(unique_words)/len(words):.2f} ratio)")
```

**Connection forward:** raw data has duplicates. Section 3 starts the cleanup.

### Section 3: Exact deduplication

**Heading:** `## Exact deduplication`
**Word target:** ~500

**Teaching beats:**
1. **Exact dedup** removes byte-identical documents. The simplest cleanup.
2. **The algorithm:** hash each document; group by hash; keep one document per hash group.
3. **What it catches:** exact reposts, mirror sites, syndicated articles with identical text.
4. **What it misses:** the much larger near-duplicate problem — boilerplate variations, paraphrases, slight reformatting. Modern pipelines remove ~5-10% of raw CommonCrawl via exact dedup, vs ~30-50% via near-dup.
5. **Hash choice:** fast non-cryptographic hash (xxhash, MurmurHash). SHA-256 is overkill and 10× slower.
6. **Document-level vs line-level dedup:** modern pipelines do both. Document-level removes whole copies; line-level removes common headers/footers across documents.

**Required code** — `<RunnableCode>` with exact dedup:

```python
import hashlib
from collections import defaultdict

def doc_hash(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()

# Toy corpus with intentional duplicates and near-duplicates
corpus = [
    "The capital of France is Paris.",
    "The capital of France is Paris.",                # exact duplicate of [0]
    "The capital of France is paris.",                # near-duplicate (capitalization)
    "Photosynthesis is the process by which plants...",
    "The capital of France is Paris.",                # exact duplicate of [0] again
]

# Group by hash
hash_to_docs = defaultdict(list)
for i, d in enumerate(corpus):
    hash_to_docs[doc_hash(d)].append(i)

print("Hash groups (sets of identical documents):")
for h, indices in hash_to_docs.items():
    print(f"  {h[:8]}...: {indices}")

# Keep one document per hash group
deduped_indices = sorted(indices[0] for indices in hash_to_docs.values())
deduped = [corpus[i] for i in deduped_indices]
print(f"\nOriginal: {len(corpus)} docs → Exact-deduped: {len(deduped)} docs")
print(f"Note: doc 2 ('paris' with lowercase p) was NOT deduped — exact match only.")
```

**Required callout** — type `warning`: MC3 from research.md. "Dedup is just removing exact duplicates." Wrong — **near-duplicates are the bigger issue.** Exact dedup removes 5-10% of CommonCrawl; aggressive MinHash near-dup removes 30-50%. The removed near-duplicates are scraping artifacts, boilerplate variations, and quote-paraphrase patterns. Section 4 covers the harder problem.

**Connection forward:** section 4 introduces MinHash for near-dup.

### Section 4: Near-duplicate dedup — MinHash and LSH

**Heading:** `## Near-duplicate dedup — MinHash and LSH`
**Word target:** ~900 (longest section)
**Sub-headings:** `### Jaccard similarity and shingling`, `### MinHash`, `### Locality-sensitive hashing (LSH)`, `### Implementation`

**Teaching beats:**

**Jaccard similarity and shingling:**
1. **Jaccard similarity** of two sets: $J(A, B) = |A \cap B| / |A \cup B|$. Standard measure for set similarity.
2. **Shingling** turns text into sets. Character 5-grams are standard: "The quick" becomes {"The q", "he qu", "e qui", " quic", "quick"}.
3. Two documents with high Jaccard on their shingle sets are near-duplicates.
4. **The naive problem:** computing $J$ for all document pairs is $O(N^2)$ — infeasible for billions of documents.

**MinHash** (label this equation `7.minhash` for reference):

```mdx
<Equation label="7.minhash">
$$\Pr[\min(h(A)) = \min(h(B))] = J(A, B)$$
</Equation>
```

5. **The clever observation** (Broder 1997): for a random hash function $h$, the probability that $\min(h(A)) = \min(h(B))$ equals $J(A, B)$.
6. **The estimator:** use $k$ independent hash functions. The MinHash signature for document $A$ is a vector of $k$ mins. Estimate Jaccard as the fraction of matching positions: $\hat{J}(A, B) = \frac{1}{k}\sum_{i=1}^k \mathbb{1}[h_i^{\min}(A) = h_i^{\min}(B)]$.
7. **Why it's fast:** comparing two MinHash signatures is $O(k)$, not $O(\bar{n})$ where $\bar{n}$ is shingle count. For $k=200$, signatures are tiny.

**Locality-sensitive hashing:**
8. MinHash gives a fast similarity *estimator*; LSH gives a fast similarity *search*.
9. **The recipe:** divide each $k$-length signature into $b$ bands of $r$ rows ($b \cdot r = k$). Hash each band of each signature to a bucket. Documents sharing any band are *candidate* near-duplicates.
10. **The S-curve:** $\Pr[\text{candidate}] \approx 1 - (1 - s^r)^b$ where $s$ is true similarity. Choose $b, r$ so the curve transitions near your similarity threshold. Common choice: $k=200, b=50, r=4$ — transitions around $s \approx 0.38$.
11. **Sublinear scaling:** candidates are O(N) total instead of O(N²).

**Required widget placeholder** — Dedup interactive (marquee, session 33):

```mdx
<WidgetFrame title="MinHash near-duplicate detection" caption="A small corpus with some intentional near-duplicates. Each document is fingerprinted via MinHash; documents with similar fingerprints get grouped as near-duplicates. Adjust the similarity threshold to see how aggressive dedup affects the kept set.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 33 (marquee)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` with the MinHash implementation:

```python
import hashlib
import numpy as np

def shingle(text, k=5):
    """Character k-shingles."""
    return {text[i:i+k] for i in range(len(text) - k + 1)} if len(text) >= k else {text}

def minhash_signature(shingles, num_hashes=200, seed=42):
    """Compute MinHash signature."""
    rng = np.random.default_rng(seed)
    a = rng.integers(1, 2**32, size=num_hashes, dtype=np.uint64)
    b = rng.integers(0, 2**32, size=num_hashes, dtype=np.uint64)
    p = (1 << 61) - 1   # Mersenne prime

    signature = np.full(num_hashes, p, dtype=np.uint64)
    for sh in shingles:
        x = int(hashlib.md5(sh.encode()).hexdigest()[:16], 16)
        hashes = (a * x + b) % p
        signature = np.minimum(signature, hashes)
    return signature

def estimate_jaccard(sig_a, sig_b):
    return np.mean(sig_a == sig_b)

def true_jaccard(a, b):
    return len(a & b) / len(a | b)

# Test pair: near-duplicate
a = "The capital of France is Paris."
b = "The capital of France is Paris!"   # different punctuation

shingles_a = shingle(a)
shingles_b = shingle(b)

sig_a = minhash_signature(shingles_a)
sig_b = minhash_signature(shingles_b)

print(f"True Jaccard:    {true_jaccard(shingles_a, shingles_b):.3f}")
print(f"MinHash estimate: {estimate_jaccard(sig_a, sig_b):.3f}")
print(f"(MinHash has standard error ~{1/np.sqrt(200):.3f} with 200 hash functions)")

# Test pair: dissimilar
c = "Photosynthesis converts light into chemical energy."
shingles_c = shingle(c)
sig_c = minhash_signature(shingles_c)
print(f"\nDissimilar pair:")
print(f"True Jaccard:    {true_jaccard(shingles_a, shingles_c):.3f}")
print(f"MinHash estimate: {estimate_jaccard(sig_a, sig_c):.3f}")
```

**Required callout** — type `insight`: MinHash converts an $O(N^2 \cdot \bar{n})$ similarity computation into $O(N \cdot k)$ — for $N = 10^9$ documents and $k = 200$, this is the difference between "infeasible on any cluster" and "runs overnight." The combination of MinHash + LSH is what makes massive-scale dedup possible.

**Connection forward:** dedup is one half of cleanup. Quality filtering is the other half.

### Section 5: Quality filtering

**Heading:** `## Quality filtering`
**Word target:** ~800
**Sub-headings:** `### Heuristic filters`, `### Classifier-based filters`, `### Model-based filters`

**Teaching beats:**

**Heuristic filters:**
1. **Length filters**: drop too-short (< 100 chars) or anomalously long documents
2. **Language detection**: drop non-target-language documents (fastText language classifier is standard)
3. **Repetition filters**: drop documents with high n-gram repetition (spam/autogenerated marker)
4. **Symbol-to-word ratio**: filter code, tables, or formulae depending on intent
5. **Profanity filters**: drop high-profanity documents (carefully — over-filtering removes legitimate content)

**Classifier-based filters:**
6. **Wikipedia-likeness**: train a binary classifier on Wikipedia (positive) and random web (negative). Score web data by classifier confidence. Used by early curated datasets.
7. **FineWeb-Edu's educational quality**: train a classifier on LLM-judged "is this educational content?" labels. **The big innovation of 2024.** Retains ~9% of FineWeb; that 9% trains dramatically better models.
8. **Perplexity filtering**: score documents with a small reference model. Keep documents in a "Goldilocks" range — too-low perplexity = boilerplate; too-high = noise.

**Model-based filters (most expensive):**
9. Use an LLM to score document quality directly. Used in DCLM's curation pipeline.
10. **Trade-off:** higher quality cost per token, but pays off in final model quality.

**Required widget placeholder** — Quality filter classifier (secondary, session 34):

```mdx
<WidgetFrame title="Quality filtering in action" caption="A panel of sample texts with various properties. Toggle filter rules on and off (length, language, repetition, classifier) to see which texts get kept. Each filter alone catches a different problem; together they produce a curated subset.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 34 (secondary)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` with a heuristic quality classifier:

```python
def quality_score(text):
    """Compute heuristic quality features for a document."""
    if not text:
        return {"overall_ok": False, "reason": "empty"}

    length = len(text)
    words = text.split()
    word_count = len(words)
    unique_words = len(set(words))

    length_ok = 100 < length < 1_000_000
    ascii_letters = sum(1 for c in text if c.isascii() and c.isalpha())
    lang_ok = ascii_letters / length > 0.6
    repetition_ratio = unique_words / max(word_count, 1)
    repetition_ok = repetition_ratio > 0.3

    overall_ok = length_ok and lang_ok and repetition_ok
    reason = "ok" if overall_ok else (
        "too short/long" if not length_ok else
        "wrong language" if not lang_ok else
        "too repetitive"
    )

    return {
        "length": length, "word_count": word_count, "unique_ratio": round(repetition_ratio, 2),
        "ascii_ratio": round(ascii_letters / length, 2),
        "overall_ok": overall_ok, "reason": reason,
    }

# Demo with diverse samples
samples = [
    ("A normal sentence about training data quality.", "expected ✓"),
    ("the the the the the the the the the the the the the the the the the", "expected ✗"),
    ("buy viagra now BUY NOW BUY VIAGRA buy buy buy click here free shipping", "expected ✗"),
    ("短いテキスト", "expected ✗ (wrong language)"),
    ("a", "expected ✗ (too short)"),
]

print(f"{'Sample':<50} {'OK?':<5} {'Reason':<20}")
print("-" * 75)
for text, label in samples:
    s = quality_score(text)
    mark = "✓" if s["overall_ok"] else "✗"
    print(f"{text[:48]!r:<50} {mark:<5} {s['reason']:<20}")
```

**Required callout** — type `aside`: MC5 from research.md. Quality filtering isn't just removing bad — modern pipelines also **upweight good**. FineWeb-Edu is essentially filter-to-keep-only-educational; the result is a 9× smaller dataset that produces better models. The "filtering" framing implies subtractive cleanup; the modern reality is more like curation toward target quality.

**Connection forward:** section 6 covers the most subtle filter.

### Section 6: Decontamination

**Heading:** `## Decontamination — removing benchmark leaks`
**Word target:** ~400

**Teaching beats:**
1. **The problem:** if benchmark questions appear in training data, the model memorizes them rather than learning to solve. Reported benchmark scores are inflated.
2. **The fix:**
   - Take benchmark text (e.g., MMLU questions)
   - Construct n-gram fingerprints (typically 13-grams)
   - Search training corpus for these fingerprints
   - Remove or flag documents containing matches
3. **Why 13-grams:** balance between false positives (short n-grams like "the answer is A" are everywhere) and false negatives (long n-grams miss paraphrases).
4. **Practical challenges:**
   - **Coverage**: must check against all benchmarks of interest (MMLU, HumanEval, GSM8K, ARC, MATH, ...)
   - **Paraphrases evade**: "What is the capital of France?" and "France's capital city is what?" are different 13-grams
   - **Translations evade**: benchmark text in a different language won't match
5. **The honest admission:** even with careful decontamination, some leak. Reported scores in 2024+ are increasingly distrusted at face value.

**Required code** — `<RunnableCode>` with n-gram-based decontamination:

```python
def ngrams(text, n=13):
    words = text.split()
    if len(words) < n:
        return {tuple(words)}
    return {tuple(words[i:i+n]) for i in range(len(words) - n + 1)}

# Pretend "benchmark text" — a question from a quiz
benchmark = "Question: What is the chemical symbol for gold ? Answer: The chemical symbol for gold is Au."
benchmark_grams = ngrams(benchmark, n=13)

# Training corpus to check
documents = [
    "Gold is a precious metal used in jewelry and electronics for centuries.",
    "Question: What is the chemical symbol for gold ? Answer: The chemical symbol for gold is Au.",   # contains benchmark!
    "The atomic number of gold is 79, and its symbol Au comes from Latin 'aurum'.",
    "Au stands for gold on the periodic table.",
]

print(f"Checking {len(documents)} documents for benchmark contamination...")
for i, d in enumerate(documents):
    doc_grams = ngrams(d, n=13)
    if doc_grams & benchmark_grams:
        print(f"  ⚠ DOC {i}: CONTAMINATED")
    else:
        print(f"  ✓ DOC {i}: safe")
```

**Required callout** — type `warning`: MC6 from research.md. "Decontamination is solved." Wrong — it's *approximate*. Paraphrased benchmark questions, translated versions, and partial overlaps all slip through n-gram matching. Modern public datasets publish their decontamination procedures, but raw benchmark scores almost certainly include some residual contamination. This is partly why "raw benchmark scores" are increasingly distrusted in 2024+.

**Connection forward:** section 7 traces how the field's data practice has evolved.

### Section 7: Modern datasets — a timeline

**Heading:** `## Modern datasets — a timeline`
**Word target:** ~700

**Teaching beats:**
1. **Pre-2020**: GPT-2 used WebText (40GB from Reddit-linked pages); proprietary. GPT-3 used CommonCrawl + WebText2 + Books + Wikipedia; weights documented in Brown et al. 2020 but data itself not public.
2. **The Pile (2020):** EleutherAI's open 800GB dataset. 22 sub-datasets: CommonCrawl, ArXiv, GitHub, Books3, PubMed, StackExchange, etc. First major *open* curated mixture. Set the template.
3. **RedPajama (2023):** Together AI's open 1.2T-token recipe to reproduce LLaMA's training data. Same source mix; first public LLaMA-grade dataset.
4. **SlimPajama (2023):** Cerebras's aggressively-deduped RedPajama. 1.2T → 627B tokens (49% reduction). Demonstrated empirically that dedup quality matters more than dataset size. Models trained on SlimPajama outperformed equivalent models on RedPajama.
5. **FineWeb (2024):** HuggingFace's 15T-token open dataset, with detailed curation ablations. **FineWeb-Edu** is the educational-classifier-filtered subset (1.3T tokens, ~9% of FineWeb).
6. **DCLM (2024):** Apple's DataComp-LM. The headline result: 7B model on DCLM-Baseline (3.8T tokens) outperforms LLaMA-3 8B on 15T tokens. **The empirical demonstration that quality > quantity at scale.**

**The arc of the field's learning:**
- 2020 era: scale matters most
- 2022 era (Chinchilla): match parameters to tokens
- 2023 era (SlimPajama): dedup quality matters as much as raw size
- 2024 era (DCLM): aggressive filtering beats large unfiltered

**Required mention** — synthetic data: brief paragraph noting that post-2024, the highest-performing models increasingly mix in LLM-generated synthetic data for specific domains (math, code, reasoning). DCLM and similar use carefully-prompted synthetic data alongside filtered web. Don't go deep — synthetic data for training is an evolving frontier; Ch 13 covers instruction-tuning data construction.

**Connection forward:** the corpus is built. Time to train on it.

### Section 8: Bridge to training

**Heading:** `## Bridge — from corpus to model`
**Word target:** ~300

**Teaching beats:**
1. **Recap what we have:** raw web → cleaned of exact duplicates → cleaned of near-duplicates (MinHash + LSH) → quality-filtered (heuristics + classifiers) → decontaminated against benchmarks → mixed across sources with weights. The result: a curated, dedupelicated, filtered, decontaminated multi-trillion-token training corpus.
2. **What we don't have yet:** the model. Random initial weights, ready to be trained.
3. **Where Chapter 8 picks up:** the training loop. Cross-entropy loss, AdamW optimizer, learning rate schedules, data loading, training stability. After Ch 8, the reader has a working trainer that produces a working LLM from this corpus.
4. **The lesson of Ch 7:** the data pipeline is half the work of LLM training. Modern pretraining is as much data engineering as it is machine learning. The papers focus on architecture; the leaderboards reflect data quality.

**Sample close** (rewrite in chapter voice):

> What you have at the end of Chapter 7 is a training-ready corpus. CommonCrawl filtered for English; near-duplicates removed via MinHash + LSH; low-quality documents discarded via heuristics and educational classifiers; benchmark contamination caught via 13-gram matching; sources mixed with intentional weights. Trillions of tokens of actual high-value text.
>
> What you don't yet have is a trained model. The architecture from Chapters 1-6 has random initial weights — it produces uniform-noise probability distributions. The next chapter wires this corpus into a training loop and turns those random weights into something that can predict text. After Ch 8, the architecture and the data are joined; what comes out is a small but real LLM.

---

### Update `src/lib/chapters.ts`

Find:

```ts
{ num: 7, slug: 'ch07-pretraining-data', title: 'Pre-training data', partNum: 3, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`.

### Delete the placeholder

```bash
test -f src/pages/ch07-pretraining-data/index.astro && rm src/pages/ch07-pretraining-data/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch07-pretraining-data/`** renders with:
   - Chapter eyebrow ("Chapter 7") + h1 + description
   - 8 h2 sections in the order specified
   - Equations render via KaTeX; labeled equation `<Equation label="7.minhash">` is present
   - 4 `<RunnableCode>` blocks (sections 2, 3, 4, 5, 6 — five blocks total)
   - 2 `<WidgetFrame>` placeholders (sections 4 and 5)
   - At least 5 callouts spread through the chapter
3. **Sidebar:** Ch 1-6 published; Ch 7 active (draft); Ch 8-30 dimmed
4. **Landing page CTA:** still "Start with Chapter 1 →"
5. **Prev/next nav at bottom of Ch 7:** prev = Ch 6 (active); next = Ch 8 (disabled)
6. **TOC on Ch 7** populates with all 8 sections plus subsections
7. **Word count:** chapter prose between 4500 and 5500 words
8. **`npm run typecheck`** passes
9. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 33 and 34 own them.
- ❌ **Do not write exercises.** Session 34 owns.
- ❌ **Do not flip Ch 7's status to `'published'`.** Session 34 owns.
- ❌ **Do not derive the LSH S-curve in full math.** State the formula and parameter guidance; don't derive.
- ❌ **Do not cover the actual training loop.** Ch 8 owns.
- ❌ **Do not modify Ch 1-6.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch07-pretraining-data/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch07-pretraining-data/index.astro 2>/dev/null || true
git commit -m "session 32: Ch 7 prose — pretraining data, 8 sections, exact dedup + MinHash + quality filtering + decontamination"
git push origin main
```

---

## Notes for the session author

**On the tonal shift:**
This is the first non-architectural chapter. The voice should be that of a careful data engineer explaining trade-offs, not a theorist explaining proofs. State results empirically: "DCLM showed that..." rather than "we can prove that..." When math appears (MinHash, Jaccard), present it as algorithmic engineering rather than mathematical derivation.

**On the empirical anchors:**
The chapter has three "pillar" empirical results that should be visible throughout:
1. DCLM (Apple 2024): quality > quantity demonstrated
2. SlimPajama (Cerebras 2023): dedup quality matters
3. FineWeb-Edu (HuggingFace 2024): classifier-based filtering works

These should be mentioned by name multiple times across the chapter. They're the foundation of every claim about modern data practice.

**On the MinHash section being the most mathematical part:**
MinHash IS algorithmic — there's a probability claim ($\Pr[\min(h(A)) = \min(h(B))] = J(A, B)$) that's worth labeling as an equation. But the chapter shouldn't *prove* this property; it should state it, give the intuition (smallest hash element is uniformly distributed in the union), and move to implementation. The widget in session 33 visualizes the algorithm; the runnable code lets the reader verify it numerically.

**On synthetic data:**
Mention briefly in section 7 — modern (2024+) high-end pretraining mixes filtered web with LLM-generated synthetic data for specific high-value domains. The chapter doesn't go deep — synthetic data is its own topic (Ch 13's purview). One paragraph noting "this is increasingly a thing" suffices.

**On widget placements:**
Section 4 (MinHash) gets the marquee — the algorithmic heart of the chapter, and the section that benefits most from visualization (clustering near-duplicates is inherently visual). Section 5 (quality filtering) gets the secondary — the toggle-able filter visualization is informative but less central than the dedup algorithm.

**Pedagogical outcomes for the reader.** After Ch 7, the reader should be able to:
1. State why data quality matters at scale (DCLM result)
2. Describe CommonCrawl and the web data landscape
3. Compute MinHash signatures and use them to estimate Jaccard similarity
4. Explain how LSH makes near-dup detection scalable
5. List quality-filter categories (heuristic, classifier, model-based) with examples
6. Explain decontamination and its limitations
7. Name the major public pretraining datasets (Pile, RedPajama, SlimPajama, FineWeb, DCLM) with distinguishing features

Seven outcomes. The exercises in session 34 will explicitly serve outcomes 3, 4, 5, and 6.

This chapter shifts the tutorial's center of gravity. Ch 1-6 was "what the model is"; Ch 7+ is "how we train it." Build with care.

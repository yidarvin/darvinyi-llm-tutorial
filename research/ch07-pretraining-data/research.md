# Chapter 7 — Pre-training data: research

> Curated source material for Chapter 7's build sessions. After six chapters on architecture, Chapter 7 is the first chapter on **training** — but it tackles the part that comes *before* training begins: building the training corpus. Modern LLM pretraining stands or falls on data quality. The chapter covers web data realities (CommonCrawl), deduplication (exact + MinHash), quality filtering (heuristics + classifiers), decontamination, the major public datasets (The Pile, RedPajama, FineWeb, DCLM), and data mixing.

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Pre-training data

**Premise:** A transformer architecture is a recipe. Pre-training data is the ingredients. With great data, a small model can be remarkable; with bad data, a huge model is mediocre. The empirical lesson from 2020-2024: **data quality dominates at scale.** The DCLM result (a 7B model trained on filtered DCLM data outperforming much larger models on less-curated data) is the canonical demonstration. This chapter is about constructing the corpus.

**Out of scope (other chapters):**
- The neural network training loop itself — loss, optimizer, schedule (Ch 8)
- Scaling laws, parallelism, training infrastructure (Ch 9-10)
- Post-training: SFT, RLHF, DPO (Ch 13-15)
- Evaluation (Ch 26)

**In scope and locked:**
- Why data quality matters (the Chinchilla and beyond)
- **Web data sources**: CommonCrawl, what it is, what's in it
- **Exact deduplication**: hashing, line-level vs document-level
- **Near-duplicate deduplication**: MinHash, Locality-Sensitive Hashing (LSH)
- **Quality filtering**:
  - Heuristic filters (length, language, repetition, profanity)
  - Classifier-based filters (Wikipedia-likeness, "FastText quality")
  - Model-based filters (perplexity scoring)
- **Decontamination**: removing test-set leaks
- **Major public datasets** (timeline):
  - The Pile (EleutherAI 2020)
  - RedPajama (Together 2023)
  - SlimPajama (Cerebras 2023)
  - FineWeb (HuggingFace 2024)
  - DCLM (Apple 2024) — the current state of the art
- **Data mixing**: source weights, when to mix
- **Tokens, not documents**: the unit of measurement in training is tokens

**Suggested chapter structure** (8 sections):

1. The setup — why data matters as much as architecture (~500 words)
2. Web data: CommonCrawl and what's in it (~600 words)
3. Exact deduplication (~500 words)
4. Near-duplicate dedup: MinHash and LSH (~900 words — algorithmic heart)
5. Quality filtering (~800 words)
6. Decontamination (~400 words)
7. Modern datasets: a timeline (~700 words)
8. Bridge to training (~300 words)

Target: ~4700 words plus 2 widgets and 3-4 runnable code blocks.

---

## Key papers and references

### Brown et al. 2020 — "Language Models are Few-Shot Learners" (GPT-3)
- **arXiv:** [2005.14165](https://arxiv.org/abs/2005.14165)
- **What it contributed for this chapter:** Section 2.2 (Training Data) documents GPT-3's mix: 60% CommonCrawl (filtered), 22% WebText2, 16% Books1+Books2, 3% Wikipedia. Total ~570B tokens. The data-mixing weights were upweighted toward higher-quality sources during training.
- **For the chapter:** historical reference for "what GPT-3 trained on" — but note that *most* of the data was raw CommonCrawl, with light filtering. Modern practice has moved far beyond this.

### Gao et al. 2020 — "The Pile: An 800GB Dataset of Diverse Text for Language Modeling"
- **arXiv:** [2101.00027](https://arxiv.org/abs/2101.00027)
- **What it contributed:** **The Pile** — the first large-scale open dataset specifically curated for LLM training. 22 sub-datasets (CommonCrawl, ArXiv, Books3, GitHub, PubMed, etc.). Set the template for "diverse curated text mixture." Used by EleutherAI's models (GPT-Neo, Pythia) and many subsequent models.
- **For the chapter:** central reference for "open pretraining datasets." Cite when discussing curated mixtures.

### Together AI 2023 — "RedPajama-Data: An Open Source Recipe to Reproduce LLaMA training dataset"
- **GitHub:** [github.com/togethercomputer/RedPajama-Data](https://github.com/togethercomputer/RedPajama-Data)
- **What it contributed:** the first attempt to reproduce LLaMA's training data publicly. 1.2T tokens across CommonCrawl, C4, Wikipedia, GitHub, Books, ArXiv, StackExchange. Set the bar for "public LLaMA-grade dataset."
- **For the chapter:** named example in the dataset timeline.

### Soboleva et al. 2023 — "SlimPajama: A 627B token cleaned and deduplicated version of RedPajama"
- **Blog:** [cerebras.ai](https://www.cerebras.ai/blog/slimpajama-a-627b-token-cleaned-and-deduplicated-version-of-redpajama)
- **What it contributed:** showed that aggressive dedup of RedPajama removed 49% of tokens (1.2T → 627B) while improving downstream model quality. Demonstrated that *quantity isn't everything* — quality dedup matters.
- **For the chapter:** cite as the empirical evidence that dedup quality matters.

### Penedo et al. 2024 — "The FineWeb Datasets: Decanting the Web for the Finest Text Data at Scale"
- **arXiv:** [2406.17557](https://arxiv.org/abs/2406.17557)
- **What it contributed:** **FineWeb** (15T tokens) and **FineWeb-Edu** (1.3T tokens, filtered for educational content). Detailed ablations of every filtering and dedup decision. Showed that classifier-based filtering ("educational quality" classifier) substantially improves downstream model quality.
- **For the chapter:** central reference for modern data curation. Use as the "best public data" example.

### Li et al. 2024 — "DataComp-LM: In search of the next generation of training sets for language models"
- **arXiv:** [2406.11794](https://arxiv.org/abs/2406.11794)
- **What it contributed:** **DCLM** — a benchmark and dataset for studying data curation. The DCLM-Baseline (3.8T tokens) result: a 7B model trained on it outperforms Llama-3 8B trained on 15T tokens. **Data curation can outweigh raw scale.**
- **For the chapter:** central reference for "quality beats quantity at scale."

### Broder 1997 — "On the resemblance and containment of documents"
- **Citation:** Broder, A. Z. (1997). On the resemblance and containment of documents. Proceedings of the Compression and Complexity of Sequences.
- **What it contributed:** the **MinHash** algorithm. Estimates Jaccard similarity between sets in $O(k)$ time using $k$ hash functions, instead of $O(n)$ exact comparison.
- **For the chapter:** central technical reference for Section 4. Cite when introducing MinHash.

### Indyk & Motwani 1998 — "Approximate Nearest Neighbors: Towards Removing the Curse of Dimensionality"
- **What it contributed:** **Locality-Sensitive Hashing (LSH)** — a framework for finding near-neighbors in sublinear time. Used in conjunction with MinHash to find near-duplicate documents in massive corpora.
- **For the chapter:** brief mention in section 4 as the technique that makes MinHash dedup scalable.

### Lee et al. 2022 — "Deduplicating Training Data Makes Language Models Better"
- **arXiv:** [2107.06499](https://arxiv.org/abs/2107.06499)
- **What it contributed:** showed empirically that deduplication reduces memorization and improves perplexity on held-out data. Quantified what "more dedup → better model" looks like.
- **For the chapter:** cite when explaining *why* dedup matters (not just how).

---

## Core derivations and concepts

### Derivation 1: Jaccard similarity and MinHash

**Jaccard similarity** of two sets $A$ and $B$:

$$J(A, B) = \frac{|A \cap B|}{|A \cup B|}$$

For text documents, the "set" is typically the set of n-grams (e.g., 5-shingles — overlapping 5-character substrings). Two documents that share many shingles are likely near-duplicates.

**The naive approach** to finding near-duplicates: compute $J(A, B)$ for all pairs. For $N$ documents, this is $O(N^2 \cdot \bar{n})$ where $\bar{n}$ is the average shingle count. Infeasible at scale.

**MinHash's insight:** for a random permutation $\pi$ of the universe, the probability that $\min(\pi(A)) = \min(\pi(B))$ equals $J(A, B)$.

**Why:** the element with the smallest hash in the union $A \cup B$ is equally likely to be any element. It's in $A \cap B$ with probability $J(A, B)$, and the test "is it in $A$ AND in $B$" gives us $J(A, B)$.

**The estimator:** use $k$ independent hash functions. Compute the min-hash signature for each document (vector of $k$ minimums). Estimate Jaccard similarity as the fraction of matching positions:

$$\hat{J}(A, B) = \frac{1}{k} \sum_{i=1}^{k} \mathbb{1}[h_i^{\min}(A) = h_i^{\min}(B)]$$

**Trade-off:** $k$ controls precision. $k = 64$ gives ~12.5% standard error on the estimate; $k = 200$ gives ~7%.

### Derivation 2: Locality-Sensitive Hashing (LSH) for fast dedup

MinHash gives a similarity estimator. LSH gives a way to *find* high-similarity pairs in sublinear time.

**The recipe:**
1. Compute MinHash signatures (length $k$) for all documents
2. Divide each signature into $b$ "bands" of $r$ rows each ($b \cdot r = k$)
3. Hash each band of each signature to a bucket
4. Documents that collide in any bucket are *candidates* for being similar
5. Verify candidates exactly (compute true MinHash signatures' agreement, or true Jaccard)

**The trick:** documents with high Jaccard have many matching MinHash positions → likely to share at least one full band → likely to collide. Documents with low Jaccard rarely share a full band → unlikely to collide.

**The "S-curve":** for chosen $b, r$, the probability of being a candidate as a function of true similarity is approximately $1 - (1 - s^r)^b$. This is a sigmoid-shaped curve with steep transition around $s \approx (1/b)^{1/r}$. Choose $b, r$ such that the transition is near the desired similarity threshold (e.g., $s = 0.85$ for strong near-duplicates).

### Derivation 3: Why exact dedup isn't enough

**Exact dedup** removes documents with byte-identical content. Easy: hash each document, group by hash, keep one.

**Why it's insufficient:**
1. **Trivial variations** evade exact match: "The quick brown fox" vs "The Quick Brown Fox" vs "The quick brown fox " (trailing space)
2. **Repeated boilerplate** is a bigger problem: navigation menus, copyright notices, scraping artifacts. These appear in millions of documents with slight variations
3. **Quote-and-paraphrase patterns** are pervasive in web data

Lee et al. 2022 showed that *near-dup* removal (MinHash) reduces test-set memorization much more than *exact-dup* removal alone. The "long tail" of near-duplicates is large.

### Concept: Quality filtering taxonomy

**Heuristic filters** (cheap, deterministic):
- **Language detection**: drop non-target-language documents (fastText language classifier)
- **Length filters**: drop too-short (< 100 chars) or anomalously long documents
- **Repetition filters**: drop documents with high n-gram repetition (often indicates spam, autogenerated content)
- **Symbol-to-word ratio**: high ratios indicate code, tables, formulae — keep or drop depending on intent
- **Profanity filters**: drop documents with > X% profanity (use cautiously — over-filtering removes legitimate adult content)

**Classifier-based filters** (more expensive, learned):
- **Wikipedia-likeness**: train a binary classifier "is this Wikipedia-like prose?" using Wikipedia (positive) and random web (negative). Filter web data by classifier score.
- **FineWeb-Edu's "educational quality" classifier**: trained on LLM-judged "is this educational content?" labels. The big innovation in FineWeb.
- **Perplexity filtering**: score each document with a small reference model. Keep documents in a "Goldilocks" perplexity range — too-low perplexity = boilerplate; too-high = noise.

**Model-based filters** (most expensive):
- Use a trained LLM to score document quality directly
- Used in DCLM's curation pipeline

### Concept: Decontamination

**The problem:** if benchmark questions and answers appear in training data, the model "remembers" them rather than learning to solve them. Reported benchmark scores are inflated.

**The fix:**
1. Take benchmark text (e.g., MMLU questions)
2. Construct n-gram fingerprints (e.g., 13-grams)
3. Search training corpus for these fingerprints
4. Remove or flag documents containing matches

**Practical challenges:**
- **n-gram length**: too short → false positives ("the answer is A" is everywhere); too long → false negatives (paraphrased answers slip through)
- **Coverage**: must check against all benchmarks of interest (MMLU, HumanEval, GSM8K, ARC, etc.)
- **Imperfect by design**: paraphrases and translations can leak

DCLM and FineWeb both publish decontamination details.

### Concept: Data mixing

**Different sources, different weights.** In GPT-3, CommonCrawl was 60% of tokens but received lower training emphasis than higher-quality sources (Wikipedia, Books). The standard pattern:
- Determine token counts per source
- Determine training mixture weights (might be different from token proportions)
- During training, sample batches according to mixture weights
- Higher weight → that source is "seen" more times per epoch

**Why upweight high-quality sources?** Higher-quality data is rarer; without upweighting, the model spends most of its training time on lower-quality web text. Upweighting trades off "see good data more often" against "see overall less data."

**Modern practice:** mixture weights are often hyperparameters, tuned by ablation. DCLM's "DCLM-Baseline" is mostly filtered CommonCrawl with some specific high-quality additions.

---

## Glossary

- **CommonCrawl:** a public dataset of web crawls, ~250+ snapshots since 2008. Each snapshot is petabytes of raw HTML. The starting point for most LLM data pipelines.
- **WARC files:** the file format CommonCrawl uses for crawl data. WET files are "WARC Encapsulated Text" — extracted plain text.
- **Shingle / n-gram:** a contiguous sequence of $n$ characters (or words) in a document. Used as set elements for Jaccard similarity.
- **Jaccard similarity:** $|A \cap B| / |A \cup B|$. Standard set-similarity measure.
- **MinHash:** a probabilistic data structure estimating Jaccard similarity in $O(k)$ time using $k$ hash functions.
- **LSH (Locality-Sensitive Hashing):** technique for finding near-neighbors in sublinear time. Used with MinHash for fast dedup.
- **Banding / banding signature:** dividing MinHash signatures into bands of $r$ rows, used by LSH.
- **Quality classifier:** a learned binary classifier that scores documents on a quality dimension. FineWeb-Edu's educational classifier is the canonical example.
- **Perplexity filter:** drop documents whose perplexity (under a reference model) is too high or too low.
- **Decontamination:** removing documents that contain benchmark text from the training corpus.
- **Data mixture / blend:** the weights assigned to different data sources during training.
- **Tokens:** the unit of measurement for training data size. A "1T token dataset" means 1 trillion tokens after tokenization, not 1 trillion words or characters.
- **The Pile (EleutherAI 2020):** the first large open curated LLM dataset.
- **RedPajama (Together 2023):** the first public LLaMA-grade dataset.
- **SlimPajama (Cerebras 2023):** aggressively-deduped RedPajama; demonstrated dedup quality matters.
- **FineWeb (HuggingFace 2024):** modern reference dataset with detailed curation.
- **FineWeb-Edu:** the educational-classifier-filtered subset of FineWeb.
- **DCLM (Apple 2024):** the state-of-the-art curated dataset; showed quality > quantity.

---

## Pedagogical analogies

### 1. Data quality vs quantity as "ingredients vs amount of food"
You can make a great meal from a few high-quality ingredients, or a mediocre meal from a huge amount of low-quality ingredients. LLM training data is the same: a filtered, deduplicated 3T-token corpus can produce a better model than a raw 15T-token corpus. DCLM-Baseline (3.8T) outperforming Llama-3 (15T) is the empirical demonstration.

**Best used for:** section 1 motivation.

### 2. Dedup as "deleting duplicate photos from your phone"
Everyone with too many photos has thought about deduplication. The phone might find exact duplicates trivially (same file). The harder problem is the "almost-same" duplicates: same scene, slightly different angle. That's the near-duplicate problem MinHash solves.

**Best used for:** section 4 motivation for MinHash.

### 3. MinHash signatures as "compressed fingerprints"
Each document becomes a fixed-length fingerprint (e.g., 200 numbers). Two documents with similar fingerprints are similar. The fingerprint is much smaller than the document — you can compare millions of fingerprints in the time it would take to compare a few full documents.

**Best used for:** section 4 introducing MinHash signatures.

### 4. Quality filters as "spam filters at scale"
Email spam filters used heuristics (this email has too many capital letters) plus classifiers (the model says this looks like spam). Modern LLM data filters do the same — heuristics for cheap obvious cases, classifiers for harder judgments.

**Best used for:** section 5 introducing quality filters.

---

## Common misconceptions

### MC1: "More data is always better."
**Reality:** at scale, **data quality dominates over data quantity**. The DCLM result (a 7B model trained on filtered DCLM data outperforming much larger models on less-curated data) is the canonical demonstration. Past a certain point, low-quality data hurts more than it helps — wasted training compute, increased memorization of junk, reduced reasoning capability.

### MC2: "Web data is mostly junk."
**Reality:** raw web data is *mostly* low-quality, but the high-quality portion is enormous — far larger than dedicated curated sources. The job of data curation is to *find* the high-quality fraction. Modern pipelines achieve this: FineWeb-Edu kept ~9% of FineWeb after educational classification, and that 9% produces dramatically better models than random sampling.

### MC3: "Dedup is just removing exact duplicates."
**Reality:** **near-duplicates are the bigger issue.** Exact dedup removes maybe 5-10% of CommonCrawl; aggressive near-dup (MinHash) removes 30-50%. The removed near-duplicates are typically scraping artifacts, boilerplate variations, and quote-paraphrase patterns. Lee et al. 2022 showed near-dup removal substantially reduces memorization and improves perplexity.

### MC4: "All tokens count equally during training."
**Reality:** training samples are *drawn with replacement* from the dataset according to mixture weights. Some tokens are seen many times; others few. Quality matters more than quantity because *seeing a junk token once still costs the training budget*. The cleaner your data, the better each token-of-training-compute pays off.

### MC5: "Filtering is just removing bad stuff."
**Reality:** modern data curation includes *upweighting good stuff*. Quality classifiers identify high-value documents; pipelines can include "high-quality boost" by upsampling these documents. FineWeb-Edu is essentially this: filter to keep only educational content, then train on it.

### MC6: "Decontamination is solved."
**Reality:** decontamination is *approximate*. Paraphrased benchmark questions, translated versions, and partial overlaps all slip through n-gram matching. Most modern public datasets publish decontamination procedures, but the actual benchmark scores almost certainly include some residual contamination effects. This is part of why "raw benchmark scores" are increasingly distrusted in 2024+.

### MC7: "MinHash gives you exact Jaccard."
**Reality:** MinHash is **probabilistic**. With $k$ hash functions, the estimate has standard error $\approx 1/\sqrt{k}$. For $k = 200$, expect ~7% error. For dedup, this is fine — you set a slightly conservative similarity threshold and accept some imprecision.

---

## Tricky implementation details

### TID1: Shingling choice (character vs word, length)
**Character 5-shingles** are the standard for fuzzy near-dup detection. Word-level shingles are faster but less robust to small textual variations. Shingle length is a hyperparameter — short shingles → more sensitive to small changes; long shingles → more discriminative. Most pipelines use character 5-grams or word 13-grams.

### TID2: Hash function choice for MinHash
Use **fast non-cryptographic hashes** (xxhash, MurmurHash). Generate $k$ independent hash functions by varying the seed. Don't use SHA-256 — slow, overkill for set-membership.

### TID3: LSH banding parameter choice
For target threshold $s^*$, choose $b, r$ such that the S-curve transition is near $s^*$. A common choice: $b = 50$, $r = 4$, $k = 200$. Transition near $s \approx (1/50)^{1/4} \approx 0.38$ — finds documents with similarity ≥ 0.5 reliably.

### TID4: Decontamination n-gram length
Standard choice: **13-grams** (words). Short enough to find paraphrases; long enough to avoid false positives. Some pipelines use stricter (longer) n-grams for safety.

### TID5: Data storage at scale
Raw CommonCrawl is petabytes. Filtered CommonCrawl is still 10-100+ TB. Storage formats:
- **Parquet** for structured data with compression
- **TFRecord** / **WebDataset** for streaming during training
- **Hugging Face Datasets** for distribution

### TID6: Tokenization-stage filtering
After tokenization, additional filters apply:
- Drop documents with too many out-of-vocab tokens (signals encoding issues)
- Drop documents with too few unique tokens (signals repetition)
- Drop documents whose average tokens-per-character is anomalous (signals weird content)

---

## Reference implementations

### MinHash signature computation

```python
import hashlib
import numpy as np
from typing import Set

def shingle(text: str, k: int = 5) -> Set[str]:
    """Return set of character k-shingles from text."""
    if len(text) < k:
        return {text}
    return {text[i:i+k] for i in range(len(text) - k + 1)}

def minhash_signature(shingles: Set[str], num_hashes: int = 200, seed: int = 42) -> np.ndarray:
    """Compute MinHash signature (num_hashes integers) for a set of shingles."""
    rng = np.random.default_rng(seed)
    # Generate num_hashes hash function "seeds"
    a = rng.integers(1, 2**32, size=num_hashes, dtype=np.uint64)
    b = rng.integers(0, 2**32, size=num_hashes, dtype=np.uint64)
    p = (1 << 61) - 1   # Mersenne prime for hash space

    # For each shingle, hash with each function; track min per function
    signature = np.full(num_hashes, p, dtype=np.uint64)
    for sh in shingles:
        # Map shingle to integer
        x = int(hashlib.md5(sh.encode()).hexdigest()[:16], 16)
        # Compute (a * x + b) mod p for all hash functions
        hashes = (a * x + b) % p
        signature = np.minimum(signature, hashes)
    return signature

def estimate_jaccard(sig_a: np.ndarray, sig_b: np.ndarray) -> float:
    """Estimate Jaccard similarity from two MinHash signatures."""
    assert len(sig_a) == len(sig_b)
    return np.mean(sig_a == sig_b)

# Demo
text_a = "The quick brown fox jumps over the lazy dog."
text_b = "The quick brown fox jumps over the sleeping dog."   # one word changed
text_c = "Lorem ipsum dolor sit amet, consectetur adipiscing elit."

shingles_a = shingle(text_a)
shingles_b = shingle(text_b)
shingles_c = shingle(text_c)

sig_a = minhash_signature(shingles_a)
sig_b = minhash_signature(shingles_b)
sig_c = minhash_signature(shingles_c)

# True Jaccard for reference
def true_jaccard(a, b):
    return len(a & b) / len(a | b)

print(f"True J(a, b) = {true_jaccard(shingles_a, shingles_b):.3f}")
print(f"MinHash J(a, b) ≈ {estimate_jaccard(sig_a, sig_b):.3f}")
print(f"True J(a, c) = {true_jaccard(shingles_a, shingles_c):.3f}")
print(f"MinHash J(a, c) ≈ {estimate_jaccard(sig_a, sig_c):.3f}")
```

### A simple quality classifier (heuristic)

```python
import re

def quality_score(text: str) -> dict:
    """Compute heuristic quality features for a document."""
    if not text:
        return {"length_ok": False, "lang_ok": False, "repetition_ok": False, "overall_ok": False}

    length = len(text)
    words = text.split()
    word_count = len(words)
    unique_words = len(set(words))

    # Length filter
    length_ok = 100 < length < 1_000_000

    # Approximate language filter (English heuristic: % ASCII letters)
    ascii_letters = sum(1 for c in text if c.isascii() and c.isalpha())
    lang_ok = ascii_letters / max(length, 1) > 0.6

    # Repetition filter
    repetition_ratio = unique_words / max(word_count, 1)
    repetition_ok = repetition_ratio > 0.3

    # Combined
    overall_ok = length_ok and lang_ok and repetition_ok

    return {
        "length": length,
        "word_count": word_count,
        "unique_words": unique_words,
        "repetition_ratio": round(repetition_ratio, 3),
        "ascii_letter_ratio": round(ascii_letters / max(length, 1), 3),
        "length_ok": length_ok,
        "lang_ok": lang_ok,
        "repetition_ok": repetition_ok,
        "overall_ok": overall_ok,
    }

# Demo
samples = [
    "This is a normal English sentence about pretraining data quality.",
    "the the the the the the the the the the the the the the the the the the",
    "Lorem ipsum dolor sit amet consectetur adipiscing elit",
    "短い",   # too short / wrong language
    "buy viagra now click here BUY NOW BUY NOW BUY VIAGRA",  # spam-like
]

for s in samples:
    score = quality_score(s)
    print(f"{'✓' if score['overall_ok'] else '✗'}  {s[:50]!r}")
    print(f"   length={score['length']}, repetition={score['repetition_ratio']}, ascii={score['ascii_letter_ratio']}")
```

### Decontamination (n-gram matching)

```python
def ngrams(text: str, n: int = 13) -> set:
    """Return set of word-level n-grams."""
    words = text.split()
    if len(words) < n:
        return {tuple(words)}
    return {tuple(words[i:i+n]) for i in range(len(words) - n + 1)}

def contains_benchmark(document: str, benchmark_ngrams: set, n: int = 13) -> bool:
    """Check if document contains any benchmark n-gram."""
    doc_ngrams = ngrams(document, n)
    return len(doc_ngrams & benchmark_ngrams) > 0

# Demo: 13-gram contamination check
benchmark_q = "What is the capital of France ? It is located in western Europe and is famous"
benchmark_ngrams_set = ngrams(benchmark_q, n=13)

documents = [
    "The capital of France is Paris. This is general knowledge.",   # safe
    "What is the capital of France ? It is located in western Europe and is famous for its art.",   # contaminated (subset matches)
    "Berlin is the capital of Germany, not France or Italy.",   # safe
]

for d in documents:
    is_contaminated = contains_benchmark(d, benchmark_ngrams_set)
    print(f"{'⚠ CONTAMINATED' if is_contaminated else '✓ safe'}: {d[:60]}...")
```

---

## Connections to other chapters

- **Ch 3 (Tokenization):** dataset construction precedes tokenization. The training corpus is the input to the BPE training algorithm.
- **Ch 8 (Building a small LLM):** the data pipeline feeds the training loop. Where Ch 7 builds the corpus, Ch 8 builds the trainer.
- **Ch 9 (Scaling laws):** the Chinchilla scaling law (Hoffmann et al. 2022) implicitly assumes a quality-controlled training set. Scaling laws derived on different-quality data have different slopes — DCLM's results suggest the Chinchilla "20 tokens per parameter" rule may be too conservative for high-quality data.
- **Ch 13 (SFT):** post-training data is curated very differently from pretraining data. Pretraining wants breadth (15T tokens of varied text); SFT wants depth (high-quality instruction-following examples, maybe 10K-1M).
- **Ch 26 (Evaluation):** decontamination is the bridge between this chapter and benchmark reliability.

---

## Open questions for the chapter author

### Q1: How deep on LSH banding math?
**Recommendation:** medium. State the S-curve formula and parameter-choosing guidance ($b=50, r=4, k=200$ as a concrete example) but don't derive the S-curve in full. The pedagogical claim is "MinHash + LSH gives fast near-dup detection" — the parameter math is operational detail.

### Q2: Should we cover the specific data mixes used by GPT-3, LLaMA, etc.?
**Recommendation:** yes, briefly, in section 7. A table comparing GPT-3, The Pile, RedPajama, FineWeb, DCLM mix breakdowns. Helps the reader see how the field has evolved.

### Q3: Synthetic data?
**Recommendation:** brief mention in section 7 — modern datasets (especially post-2024) increasingly use LLM-generated synthetic data for specific high-value domains (math, code, reasoning). Don't go deep; this is a Ch 13+ topic.

### Q4: Crawl vs CommonCrawl?
**Recommendation:** brief note that CommonCrawl is one (popular) public crawl; modern labs increasingly run their own crawls with custom filters. Not deep.

### Q5: Widget candidates
1. **Dedup interactive (marquee, session 33):** show 8-10 short text samples, some near-duplicates of each other. The widget computes pairwise Jaccard similarity (both true and MinHash-estimated), and clusters near-duplicates. The user can see which texts get grouped and adjust the similarity threshold. **Recommended marquee.**
2. **Quality filter classifier (secondary, session 34):** show a list of text samples and visualize which pass which filters (length, language, repetition). Toggle individual filters on/off; see how the kept-set changes. **Recommended secondary.**
3. **Data mixing slider (alternative):** sliders for source weights; show the resulting effective dataset. Less pedagogically dense than the other two; skip for now.

Recommend (1) and (2).

---

## Pre-research notes

Ch 7 is a **single-topic chapter** (pretraining data) with several sub-areas. Like Ch 6, it fits the 4-file cadence (research + 3 chapter sessions, with the last absorbing exercises + closeout).

**Pedagogical outcomes for the reader.** After Ch 7, the reader should be able to:
1. State why data quality matters at scale (DCLM result)
2. Describe what CommonCrawl is and what's in it
3. Compute MinHash signatures and use them to estimate Jaccard similarity
4. Explain how LSH makes near-dup detection scalable to massive corpora
5. List common quality-filter categories (heuristic, classifier, model-based) and give an example of each
6. Explain decontamination and its limitations
7. Name the major public pretraining datasets (Pile, RedPajama, SlimPajama, FineWeb, DCLM) and their distinguishing features

Seven outcomes. This is a content-rich chapter — the prose will need to be tight to fit ~4700 words.

**This is the first "training-side" chapter.** After six chapters of architectural pieces, the focus shifts. Ch 7's tone is empirical (cite results) rather than mathematical (derive equations). Match that.

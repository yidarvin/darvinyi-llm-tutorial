# Chapter 2 — Embeddings & representation: research

> Curated source material for Chapter 2's build sessions (sessions 11–14, files 18–21 in BUILD_ORDER). Audience for this document: future Claude Code sessions writing Chapter 2. Same template as Chapter 1's research file; same dense / citation-heavy / editorial-voiced tone.

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Embeddings & representation

**Premise:** How discrete tokens become continuous vectors that a neural network can consume. Why the embedding layer is "just a lookup table that happens to be a learnable parameter." What word2vec did, why it isn't how modern LLMs work, and what it taught us anyway about the geometric structure of learned representations.

**Out of scope (other chapters):**
- Tokenization itself — what produces the token IDs (Ch 3)
- Positional encoding — adding "where" to "what" (Ch 6)
- Contextualized representations / BERT-style — embeddings at intermediate layers (Ch 5)
- Multimodal embeddings (Ch 23)

**In scope and locked:**
- One-hot vs distributed representations
- The embedding layer as a learnable lookup table
- Word2vec: skip-gram and CBOW, especially skip-gram with negative sampling
- Why linear analogies emerge (king − man + woman ≈ queen) — the PMI factorization view
- Embeddings in modern LLMs: trained end-to-end, not pre-trained-then-frozen
- Tied embeddings (input/output weight sharing)
- Sparse gradient updates for embedding tables

**Suggested chapter structure** (chapter session may diverge):

1. Why embeddings — tokens can't be inputs (~500 words)
2. One-hot vs distributed representations (~600 words)
3. The embedding layer as a lookup table (~600 words)
4. Word2vec: skip-gram with negative sampling (~1000 words)
5. The geometry of learned representations: linear analogies (~700 words)
6. Embeddings in modern LLMs (~800 words)
7. Tied input/output embeddings (~400 words)
8. From token to context — bridge to Ch 3 and Ch 4 (~500 words)

Target total: ~5100-5500 words plus 2-3 widgets and 3-4 runnable code blocks.

---

## Key papers and references

### Mikolov, Chen, Corrado, Dean 2013 — "Efficient Estimation of Word Representations in Vector Space" (word2vec original)
- **arXiv:** [1301.3781](https://arxiv.org/abs/1301.3781)
- **What it contributed:** Two architectures (CBOW and Skip-gram) for learning distributed word representations from raw text via self-supervised prediction. Training corpus ~6B words; embedding dimensions 100-300. Showed that the resulting vectors capture useful semantic relationships.
- **For the chapter:** the foundational reference. The CBOW vs skip-gram distinction matters less than the skip-gram + negative sampling combo (which is what people actually use). Mention both architectures; spend depth on skip-gram.

### Mikolov, Sutskever, Chen, Corrado, Dean 2013 — "Distributed Representations of Words and Phrases and their Compositionality" (negative sampling)
- **arXiv:** [1310.4546](https://arxiv.org/abs/1310.4546)
- **What it contributed:** Three crucial improvements to the original word2vec:
  1. **Negative sampling** — replaces the full vocabulary softmax with binary classification against random negatives. This is what makes word2vec tractable.
  2. **Subsampling of frequent words** — randomly drop common words like "the" during training, weighted by frequency. Improves rare-word signal.
  3. **Phrase vectors** — combine common bigrams ("New York") into single tokens. (Less central; the main contribution is negative sampling.)
- **Key result:** linear analogy demonstrations (king − man + woman ≈ queen, Paris − France + Italy ≈ Rome). The first time the academic community took "geometric structure of word vectors" seriously.
- **For the chapter:** the actual reference for skip-gram-with-negative-sampling. Cite this when introducing the SGNS objective. The linear analogy results are pedagogically essential — devote a full section to them.

### Levy & Goldberg 2014 — "Neural Word Embedding as Implicit Matrix Factorization"
- **paper:** [papers.nips.cc/paper/5477](https://papers.nips.cc/paper/2014/hash/feab05aa91085b7a8012516bc3533958-Abstract.html)
- **What it contributed:** A theoretical analysis showing that skip-gram with negative sampling (SGNS) is implicitly factorizing the shifted Pointwise Mutual Information (PMI) matrix:
  $$v_c^\top u_w \approx \text{PMI}(c, w) - \log k$$
  where $k$ is the number of negative samples.
- **Why this matters:** explains *why* word2vec embeddings have the geometric properties they do. PMI has additive structure for compositional pairs, which translates to linear structure in the embedding space.
- **For the chapter:** cite when discussing the geometric explanation of linear analogies. This is the "behind the scenes math" that justifies the empirical phenomenon. Don't go deep on the proof; cite the result.

### Pennington, Socher, Manning 2014 — "GloVe: Global Vectors for Word Representation"
- **paper:** [nlp.stanford.edu/projects/glove](https://nlp.stanford.edu/projects/glove/)
- **What it contributed:** Alternative to word2vec. Instead of local context windows, factorizes a global word-co-occurrence matrix. Different objective; similar embedding quality.
- **For the chapter:** brief mention only. One sentence: "GloVe is the other classic embedding method; it factorizes log co-occurrence counts directly. Mathematically related to SGNS per Levy & Goldberg."

### Press & Wolf 2017 — "Using the Output Embedding to Improve Language Models" (tied embeddings)
- **arXiv:** [1608.05859](https://arxiv.org/abs/1608.05859)
- **What it contributed:** Showed that sharing the input embedding matrix with the output projection matrix (i.e., using the same $W$ for both `embed(x)` and `softmax(hW^\top)`) improves perplexity AND saves $|V| \times d$ parameters.
- **Why it matters:** standard practice in modern LMs. GPT-2 ties; GPT-3/4 details vary; LLaMA and most open-source models tie. The parameter savings are substantial for small models — e.g., for a model with $|V| = 50000$, $d = 768$: 38M parameters saved (out of ~125M for GPT-2 small).
- **For the chapter:** dedicate a brief section. The technique is simple but the rationale is subtle (input space and output space should look the same when predicting the next token).

### Karpathy — `makemore` (character-level language modeling, embeddings end-to-end)
- **GitHub:** [github.com/karpathy/makemore](https://github.com/karpathy/makemore)
- **YouTube:** the "Neural Networks: Zero to Hero" series walks through embeddings end-to-end with bigram → MLP → Transformer
- **For the chapter:** the canonical modern reference for "embeddings are just learnable parameters of the model, not a separate pre-training step." The bigram MLP example (predicting the next character from a single previous character via a learned embedding table) is the cleanest pedagogical setup.

---

## Core derivations (LaTeX-ready)

### Derivation 1: Skip-gram with negative sampling — the objective

**Setup:** vocabulary $V$ of size $|V|$. For each word $w$ in the corpus, we observe context words within a window (typically 5-10 to either side). Each word has two embeddings: $u_w \in \R^d$ (when it's the "center" word) and $v_w \in \R^d$ (when it's a "context" word). After training, $u_w$ is typically the word embedding used downstream.

**Full softmax (intractable):**

$$P(c \mid w) = \frac{\exp(v_c^\top u_w)}{\sum_{c' \in V} \exp(v_{c'}^\top u_w)}$$

The denominator sums over all $|V|$ words — for vocab 50k+, this is ~50k dot products per training pair. Infeasible.

**Negative sampling approximation:**

Replace the multinomial classification "which word is the context?" with $k+1$ binary classifications: "is this pair real, or fake?" For each real (word, context) pair, draw $k$ negative samples $c'_1, \dots, c'_k$ from a noise distribution $P_n$.

The per-pair loss:

$$\boxed{L_{\text{SGNS}} = -\log \sigma(v_c^\top u_w) - \sum_{i=1}^{k} \log \sigma(-v_{c'_i}^\top u_w)}$$

where $\sigma(x) = 1/(1 + e^{-x})$.

**Interpretation:**
- First term: push the real context's embedding closer to the word's embedding (logit toward $+\infty$, sigmoid toward 1)
- Second term: push random negatives' embeddings further (logit toward $-\infty$, sigmoid of negative toward 1, i.e., classify as fake)

**Noise distribution:** Mikolov et al. empirically chose:

$$P_n(c) \propto p(c)^{3/4}$$

where $p(c)$ is the unigram probability. The 3/4 exponent balances frequent and rare words — more aggressive sampling than uniform, less aggressive than unigram. Typical $k$: 5-20 (smaller $k$ for larger datasets).

**Total loss over the corpus:** sum the per-pair loss over all observed (word, context) pairs. This is what we minimize via SGD or Adam.

### Derivation 2: Gradient through the embedding lookup

**Setup:** embedding matrix $E \in \R^{|V| \times d}$. Forward operation: given token ID $i$, return the vector $e = E[i] \in \R^d$. The forward pass is just array indexing.

**Question:** what's the gradient $\partial L / \partial E$?

**Answer:** only row $i$ has a non-zero gradient; all other rows get zero.

$$\frac{\partial L}{\partial E[j]} = \begin{cases} \dfrac{\partial L}{\partial e} & \text{if } j = i \\ \mathbf{0} & \text{otherwise} \end{cases}$$

**Why this matters in practice:**

For a batch of $B$ tokens (with possibly repeated IDs), the gradient is computed by *scattering* the per-token gradients into the matching rows of $E$. If two tokens in the batch have the same ID, their gradients accumulate at that row.

In code (numpy):

```python
# Forward
def embedding_forward(E, token_ids):
    return E[token_ids]   # shape: (B, d)

# Backward
def embedding_backward(token_ids, grad_out, vocab_size, dim):
    grad_E = np.zeros((vocab_size, dim))
    # Accumulate gradients into rows (handles repeated IDs)
    np.add.at(grad_E, token_ids, grad_out)
    return grad_E
```

**Sparsity:** for a batch of 1024 tokens drawn from vocab 50000, only ~1024 (and at most $\min(1024, 50000)$) rows of $E$ get non-zero gradients. Frameworks typically have a "sparse gradient" optimizer mode for embedding tables — only update rows with non-zero gradients.

### Derivation 3: Why linear analogies work — the PMI factorization view

The famous empirical result: $\vec{\text{king}} - \vec{\text{man}} + \vec{\text{woman}} \approx \vec{\text{queen}}$.

**Levy & Goldberg's argument** (sketched, not fully derived here):

At convergence, the SGNS objective is approximately solved when:

$$v_c^\top u_w \approx \text{PMI}(c, w) - \log k$$

where PMI (pointwise mutual information) is:

$$\text{PMI}(c, w) = \log \frac{p(c, w)}{p(c) \cdot p(w)}$$

**The compositional structure of PMI:**

For words that combine compositionally (e.g., "queen" ≈ "female monarch" ≈ "female + monarch" in some loose sense), PMI inherits the additive structure:

$$\text{PMI}(c, w_1) + \text{PMI}(c, w_2) \approx \text{PMI}(c, w_1 \cdot w_2)$$

(For some context $c$ that captures the shared semantic feature.)

**Translating to embeddings:**

If $v_c^\top u_w \approx \text{PMI}(c, w)$, then:

$$v_c^\top (u_{w_1} + u_{w_2}) \approx \text{PMI}(c, w_1) + \text{PMI}(c, w_2) \approx \text{PMI}(c, w_1 \cdot w_2)$$

So adding the word vectors $u_{w_1} + u_{w_2}$ produces a vector that, when dotted with context $c$, gives the PMI of the *composition*. This is the algebraic root of linear analogies.

**Caveat:** the argument is approximate and assumes idealized convergence. Real embeddings deviate. The fact that analogies *empirically* work as well as they do is somewhat surprising; the PMI-factorization view explains why they work at all but doesn't quantify why they work so well.

**For the chapter:** the chapter shouldn't reproduce this derivation in full — it's mostly hand-wavy. The pedagogical claim is: "linear analogies aren't magic; they're a consequence of the embedding objective being equivalent to factorizing a matrix that itself has compositional structure." Cite Levy & Goldberg; let interested readers go deeper.

---

## Glossary

- **Embedding:** continuous vector representation of a discrete token
- **Embedding matrix / table:** $E \in \R^{|V| \times d}$; row $i$ is the embedding of token $i$
- **Embedding dimension ($d$):** the size of each token's vector. Typical values: 64 (small models), 768 (GPT-2 small), 12288 (GPT-3). Larger = more expressive but more parameters.
- **Vocabulary size ($|V|$):** number of distinct tokens. Typical: 32k-100k for modern LMs.
- **Distributed representation:** information spread across many dimensions (vs concentrated in one)
- **One-hot encoding:** sparse vector of length $|V|$ with a single 1; mathematically equivalent to embedding-via-multiplication, never used in practice
- **Lookup operation:** the embedding "forward pass" — array indexing. Linear-algebra view: multiplication by a one-hot vector.
- **Skip-gram:** word2vec architecture that, given a center word, predicts each surrounding context word
- **CBOW (Continuous Bag of Words):** word2vec architecture that, given context words, predicts the center word. Faster than skip-gram on large datasets; produces slightly different embedding properties.
- **Negative sampling:** training technique replacing the full $|V|$-way softmax with binary classification against $k$ random negatives. Typically $k = 5$–$20$.
- **Noise distribution $P_n$:** the distribution from which negative samples are drawn. SGNS uses $p(c)^{3/4}$, the smoothed unigram.
- **PMI (pointwise mutual information):** $\log \frac{p(c, w)}{p(c)p(w)}$. Measures how much more often two tokens co-occur than would be expected by chance.
- **Tied embeddings:** input embedding matrix = output projection matrix (sharing weights between embed and softmax)
- **Cosine similarity:** $\cos(u, v) = \frac{u \cdot v}{||u|| \, ||v||}$. Bounded in $[-1, 1]$; invariant to magnitude.
- **Linear analogy:** the empirical property that $\text{vec}(a) - \text{vec}(b) + \text{vec}(c) \approx \text{vec}(d)$ for analogous pairs $(a:b :: c:d)$.
- **Context window:** the number of words around the center word considered as "context" in skip-gram. Typically 5-10.
- **Subsampling:** in word2vec training, randomly dropping occurrences of frequent words to lift the signal of rare ones.

---

## Pedagogical analogies and framings

### 1. Embeddings as fingerprints in semantic space

Every token gets a unique fingerprint in a $d$-dimensional space. Similar tokens (synonyms, related concepts, words that appear in similar contexts) have similar fingerprints — close to each other in the space. The neural network operates on fingerprints, not raw IDs. The fingerprints are *learned*: the network discovers what makes two tokens "similar" by adjusting the fingerprints during training.

**Best used for:** the opening "why embeddings" section. Sets the geometric intuition that runs through the chapter.

### 2. The embedding layer is a learnable dictionary

A Python dictionary `{token_id: vector}`. Initially, the vectors are random. During training, both the vectors in the dictionary AND every other parameter in the network update — they update *together*, end-to-end. The dictionary doesn't get filled in by a separate "pretrain embeddings" step; it grows useful gradually as the network learns its task.

**Best used for:** dispelling MC1 (the misconception that embeddings are a separate pretraining phase). Reinforces that modern LMs don't have a "word2vec stage."

### 3. One-hot = stamps; distributed = descriptions

One-hot encoding: every word gets a unique stamp. "Cat" gets stamp #6748; "dog" gets stamp #6749. No relationship; no overlap. The stamps are perfectly orthogonal — entirely uninformative beyond "this is word #N."

Distributed embeddings: every word gets a description. "Cat: small, furry, common, indoor, mammal, feline." "Dog: medium, furry, common, indoor, mammal, canine." Most adjectives shared; the differences are meaningful.

A neural network can do useful arithmetic with descriptions ("if I subtract 'feline' and add 'canine,' I get something like 'dog'"). It cannot do useful arithmetic with stamps.

**Best used for:** introducing the distinction in section 2. The metaphor extends naturally to the linear analogy section later.

### 4. Skip-gram as crosswords-in-reverse

In a crossword, you're given context (intersecting letters from other words) and you fill in the word. Skip-gram does the opposite: given the word, predict the likely context. Both reveal that word and context are statistically coupled. The crossword reader exploits the coupling to find the right word; skip-gram exploits it to learn what each word "expects" around it.

**Best used for:** introducing the skip-gram objective. The reversal framing makes "predicting context from word" feel less unmotivated.

### 5. Embedding dimensions are not features

A natural mistake when first encountering 768-dimensional embeddings: imagine dimension 0 is "gender," dimension 1 is "plurality," etc. Almost always wrong. The dimensions are entangled — useful "directions" in embedding space are linear combinations of many raw dimensions.

Probing studies have shown that linguistic features (gender, tense, sentiment) often DO have approximately-linear directions in embedding space, but these directions are not axis-aligned. You can find a "gender direction" by training a linear probe; you can't read it off the raw dimensions.

**Best used for:** the section on geometry / linear analogies. Honest about what "meaningful structure" does and doesn't look like.

---

## Common misconceptions (each one becomes a Callout-warning in the chapter)

### MC1: "Embeddings are pre-trained with word2vec, then frozen for the LLM."
**Reality:** Modern LLMs (GPT-2/3/4, LLaMA, Mistral, Claude family) train embeddings *end-to-end with the rest of the model*. The embedding table is just another learnable parameter — it updates via backprop along with attention weights, FFN weights, etc. Word2vec embeddings exist in the literature and are occasionally used as *initialization* for small models, but they are not "the" embeddings of any production LLM. The "embedding step" you sometimes see described as a separate phase is a holdover from the 2014-2018 era.

### MC2: "Each token has a single fixed embedding throughout the network."
**Reality:** at the *input* layer, yes — token ID $i$ maps to row $E[i]$, fixed per ID. But once the embedding enters the transformer, every layer transforms it based on context. The vector representing "bank" at layer 12 of a transformer is different in "river bank" vs "savings bank" — only the input-layer embedding is shared. Modern usage often calls the input embeddings "static" or "non-contextual" and the deeper-layer activations "contextual" or "contextualized."

### MC3: "Embedding dimension should be close to vocabulary size."
**Reality:** the embedding dimension is much smaller than the vocabulary. Typical ratios are 1/50 to 1/1000. GPT-2 small: vocab 50,257, embedding dim 768 → ratio 1/65. The *whole point* of distributed representations is that you don't need a separate dimension per word. The compression from $|V|$-dimensional one-hot to $d$-dimensional distributed is what makes neural language models tractable.

### MC4: "Cosine similarity is the canonical embedding distance metric."
**Reality:** cosine, Euclidean, dot product, and learned metrics are all used in different contexts. **Attention** uses raw dot product (no normalization). **Retrieval** typically uses cosine (invariance to magnitude is desirable when comparing across vectors of different scales). **Clustering** sometimes uses Euclidean. **Trained metric learners** learn custom distance functions for specific tasks. The "right" metric depends on what you're measuring; cosine is *common*, not canonical.

### MC5: "Word2vec is how all embeddings work."
**Reality:** word2vec is a specific approach trained on a specific objective (predict context from word) on specific data (web crawl text, no labels). Modern transformer embeddings are trained on a different objective (next-token prediction) on different data (curated text, sometimes with instructions). The resulting embedding spaces have *different* geometric properties. Cross-paper claims like "embeddings cluster by topic" can fail to generalize when the embedding source differs.

### MC6: "Individual embedding dimensions are interpretable."
**Reality:** they aren't. Specific linear *directions* (combinations of dimensions) often correspond to meaningful concepts — there's typically a "gender direction," a "country direction," etc., recoverable via linear probes. But the raw dimensions of $E$ are almost never axis-aligned with meaning. Treat embedding dimensions as a basis you can rotate freely, not as a fixed feature dictionary.

### MC7: "Linear analogies prove embeddings 'understand' language."
**Reality:** Linear analogies emerge from the statistical structure of co-occurrence, formalized by the PMI-factorization view (Levy & Goldberg). They show that embeddings inherit the compositional structure of language *in a statistical sense* — they do NOT show that embeddings have human-like understanding. Many critiques (Rogers et al. 2020, others) note that linear analogy success is partly an artifact of the evaluation methodology — restricting candidates, ignoring the actual nearest neighbors.

---

## Tricky implementation details

### TID1: Embedding initialization
Small Gaussian, typically $\mathcal{N}(0, 0.02)$ or $\mathcal{N}(0, 1/\sqrt{d})$. Don't use He init — that's calibrated for ReLU layers, and embedding lookups have no activation. Don't use Xavier — there's no fan-in/fan-out structure for a lookup operation. The relevant prior is just "small values that aren't degenerate." GPT-2 uses 0.02 std.

### TID2: Don't multiply one-hots by matrices
The mathematical identity $E^\top \cdot \text{one\_hot}(i) = E[i]$ holds, but never implement it that way. Computing the matrix-vector product for a one-hot input is 100-1000× slower than direct indexing on a typical CPU and even worse on GPU. Index, don't multiply.

### TID3: Padding token embeddings
If your tokenizer uses a pad token (often token 0), you have two options:
1. **Freeze its embedding:** never update row 0 of $E$ — set its gradient to zero before the optimizer step
2. **Mask it out in the loss:** include all tokens in the embedding lookup but compute loss only over non-padded positions
Option 2 is more common in modern training stacks. Option 1 is conceptually cleaner.

### TID4: Sparse gradient updates
For an embedding matrix with vocab 50k+, naively applying Adam (which maintains m and v per parameter) means updating 50k × d × 3 (params + m + v) numbers per step, even though only ~1% of rows actually changed. Most frameworks (PyTorch's `nn.Embedding(sparse=True)`, TensorFlow's `embedding_lookup_sparse`) have a sparse-gradient mode that only updates touched rows. Important at scale, irrelevant for toy models.

### TID5: Tied embeddings — optimizer state implications
When you tie the input embedding $E_{\text{in}}$ to the output projection $W_{\text{out}}^\top$, you share the parameter matrix. But Adam maintains $m$ and $v$ buffers per parameter — these are *also* tied. Gradients from both the input lookup AND the output projection accumulate into the same gradient buffer; Adam's moment estimates blend updates from both. Some implementations do this naturally (any framework that handles weight sharing correctly); others require careful code review.

### TID6: Vocabulary expansion
If you want to add new tokens to a pre-trained model (e.g., adding domain-specific terms), you need to expand the embedding matrix. Add new rows initialized from the same distribution as the original (small Gaussian). The new rows start unrelated to anything; fine-tuning teaches them their meaning. Sudden additions to a frozen model produce poor results.

### TID7: Output bias absorbs unigram probability
The output projection $z = h W_{\text{out}}^\top + b$ usually includes a bias term $b \in \R^{|V|}$. This bias absorbs the unigram (prior) probability of each token. Frequent tokens get a positive bias (probable a priori); rare tokens get negative bias. Without the bias, the model has to encode unigram statistics into the directions of $h$, wasting representational capacity. Tied-embedding implementations sometimes share the input embeddings but NOT the output bias — that's correct.

---

## Reference implementations

### Embedding lookup (forward + backward)

```python
import numpy as np

def embedding_forward(E, token_ids):
    """
    E: (vocab_size, dim)
    token_ids: (batch_size,) or (batch_size, seq_len)
    Returns: (batch_size, dim) or (batch_size, seq_len, dim)
    """
    return E[token_ids]

def embedding_backward(token_ids, grad_out, vocab_size, dim):
    """
    token_ids: same shape as forward input
    grad_out: same shape as forward output — gradient flowing back from downstream
    Returns: gradient w.r.t. the embedding matrix E, shape (vocab_size, dim)
    """
    grad_E = np.zeros((vocab_size, dim))
    flat_ids = token_ids.reshape(-1)
    flat_grads = grad_out.reshape(-1, dim)
    np.add.at(grad_E, flat_ids, flat_grads)
    return grad_E
```

`np.add.at` is the "unbuffered add" that handles repeated indices correctly — if two positions in the batch share a token ID, their gradients accumulate at that row of $E$.

### Skip-gram with negative sampling — training loop sketch

```python
import numpy as np

def sigmoid(x):
    return 1 / (1 + np.exp(-np.clip(x, -30, 30)))   # clipping for numerical safety

def sgns_step(U, V, w_id, c_id, neg_ids, lr=0.025):
    """
    One SGD step on a single (word, context) pair with negative samples.
    U: (vocab, dim) — word embeddings (used when token is "center")
    V: (vocab, dim) — context embeddings (used when token is "context")
    w_id: scalar — the center word's token ID
    c_id: scalar — the true context word's token ID
    neg_ids: (k,) — negative samples' token IDs
    """
    u_w = U[w_id]
    v_c = V[c_id]
    v_neg = V[neg_ids]    # shape (k, dim)

    # Positive logit + loss
    pos_logit = u_w @ v_c
    pos_grad = sigmoid(pos_logit) - 1     # d loss / d pos_logit

    # Negative logits + losses
    neg_logits = v_neg @ u_w              # shape (k,)
    neg_grad = sigmoid(neg_logits)        # d loss / d neg_logit (each)

    # Gradients w.r.t. U[w_id] and V[c_id], V[neg_ids]
    grad_u = pos_grad * v_c + (neg_grad[:, None] * v_neg).sum(axis=0)
    grad_v_c = pos_grad * u_w
    grad_v_neg = neg_grad[:, None] * u_w  # broadcasts to (k, dim)

    # SGD updates
    U[w_id] -= lr * grad_u
    V[c_id] -= lr * grad_v_c
    V[neg_ids] -= lr * grad_v_neg
```

### Tied embedding module

```python
class TiedEmbedding:
    """
    A single matrix W used both as input embedding and output projection.
    Saves vocab_size * dim parameters vs separate input/output matrices.
    """
    def __init__(self, vocab_size, dim, seed=42):
        rng = np.random.default_rng(seed)
        self.W = rng.normal(0, 0.02, (vocab_size, dim))

    def embed(self, token_ids):
        return self.W[token_ids]                    # (B, dim) or (B, T, dim)

    def project(self, hidden):
        return hidden @ self.W.T                    # (B, T, vocab) logits
```

### Toy skip-gram on a tiny corpus

A self-contained example to put in the chapter:

```python
import numpy as np

corpus = """the cat sat on the mat the dog sat on the rug
            the cat purred the dog barked the cat napped""".split()

# Build vocabulary
vocab = sorted(set(corpus))
word_to_id = {w: i for i, w in enumerate(vocab)}
V = len(vocab)
dim = 8
k = 3  # negatives per positive

# Build (center, context) pairs with window 2
pairs = []
for i, w in enumerate(corpus):
    for j in range(max(0, i-2), min(len(corpus), i+3)):
        if i != j:
            pairs.append((word_to_id[w], word_to_id[corpus[j]]))

# Initialize embeddings
rng = np.random.default_rng(42)
U = rng.normal(0, 0.1, (V, dim))   # center embeddings
V_emb = rng.normal(0, 0.1, (V, dim))  # context embeddings

# Train
unigram_p = np.bincount([w for w, _ in pairs], minlength=V).astype(float)
unigram_p **= 0.75
unigram_p /= unigram_p.sum()

for epoch in range(100):
    rng.shuffle(pairs)
    for w_id, c_id in pairs:
        neg_ids = rng.choice(V, size=k, replace=False, p=unigram_p)
        sgns_step(U, V_emb, w_id, c_id, neg_ids, lr=0.05)

# Cosine similarities
def cos(a, b): return (a @ b) / (np.linalg.norm(a) * np.linalg.norm(b))
print("cat ↔ dog:", cos(U[word_to_id['cat']], U[word_to_id['dog']]))
print("cat ↔ rug:", cos(U[word_to_id['cat']], U[word_to_id['rug']]))
```

This trains in ~1 second and (often) shows that "cat" and "dog" are more similar than "cat" and "rug" — the system learned they appear in similar contexts. Tiny scale but demonstrates the principle.

---

## Connections to other chapters

- **Ch 3 (Tokenization):** produces the token IDs that index the embedding table. The embedding table size is determined by the vocab the tokenizer produces.
- **Ch 4 (Attention):** attention operates on embedded sequences. The first thing attention does is take embedded inputs and project them via $W_Q$, $W_K$, $W_V$.
- **Ch 5 (Multi-head + Transformer Block):** the layer-by-layer evolution of representations starts from the input embeddings and produces increasingly contextualized vectors. The embedding $\to$ contextualized-embedding pipeline is the transformer's structural job.
- **Ch 6 (Positional encoding):** in many architectures, position embeddings are added to (or otherwise combined with) token embeddings at the input. Discussed in detail there.
- **Ch 8 (Building a small LLM):** the embedding table is typically one of the largest parameter groups in the model. For GPT-2 small: ~38M of 125M parameters live in the embedding (per side, if untied). Tied embeddings ~halve this.
- **Ch 22 (Retrieval & RAG):** uses learned embeddings (typically from a separate model — sentence transformers, OpenAI embeddings, etc.) for nearest-neighbor lookup in a corpus. The embedding objective there is "make semantically-similar passages have similar vectors," which is related to but distinct from word2vec's objective.
- **Ch 23 (Multimodal):** image, audio, video all get embedded into a vector space that's compatible with the text embedding space. The training objective there is contrastive (CLIP-style) — make matching image-text pairs close, mismatched pairs far.
- **Ch 25 (Interpretability):** probing classifiers reveal what's encoded in embeddings at various layers. The chapter touches probing methodology.

---

## Open questions for the chapter author

### Q1: How much word2vec to cover?
**Recommendation:** treat it as a historically important example, not as "how embeddings work today." Cover skip-gram with negative sampling in depth (section 4 in the suggested structure), include a runnable toy implementation, but reserve the modern-LLM section (6) to emphasize that *real* LLM embeddings are trained end-to-end. Don't oversell word2vec as if it's still state-of-the-art.

### Q2: GloVe?
**Recommendation:** one sentence. "GloVe is the other classic embedding method; per Levy & Goldberg, mathematically related to SGNS." Don't derive its objective. Readers wanting depth have the paper link.

### Q3: Tied embeddings — full section or aside?
**Recommendation:** short full section (~400 words). The technique is simple but the rationale rewards explanation. Mention the parameter savings concretely (numbers for GPT-2 small). Show the code pattern.

### Q4: Should we implement skip-gram, or just discuss?
**Recommendation:** include the runnable toy implementation (section 4). Training on a 20-word corpus for 100 epochs runs in ~1 second in Pyodide. The reader sees the numbers go up; "cat" and "dog" become similar. The intellectual payoff of "I made this happen" beats reading about it.

### Q5: Modern training objectives — next-token prediction, masked-LM, contrastive?
**Recommendation:** brief mention in section 6 (Embeddings in modern LLMs). Say: "in modern LLMs, the embedding objective is whatever the model's objective is — usually next-token prediction. The embedding emerges as a byproduct." Don't enumerate the BERT / RoBERTa / Sentence-BERT landscape; that belongs in Ch 5 or its own polish-phase chapter if at all.

### Q6: Widget candidates
1. **Embedding space explorer (marquee)** — interactive 2D scatter of pre-computed word2vec embeddings (PCA or t-SNE projection), color-coded by semantic category (animals / colors / countries / professions), with overlaid linear-analogy arrows showing "king − man + woman ≈ queen" and similar. Recommend this as the marquee.
2. **Lookup table animation** — token ID → row of $E$ → vector. Visually simple, pedagogically useful for section 3. Could be a smaller embedded SVG, not a full WidgetFrame.
3. **Skip-gram dynamics demo** — illustrate the negative-sampling objective: positive pairs pulling together, random negatives pushing apart, in 2D toy space animated over training steps. Strongest candidate for the secondary widget.

Recommend: (1) marquee, (3) secondary, (2) inline embedded SVG (not a full widget slot — could fit inside section 3's prose).

---

## Pre-research notes (for the human running these sessions)

Differences from the Ch 1 research file that may apply to other research files:

- **Less derivation-heavy.** Ch 2 has fewer formal derivations than Ch 1 (which had three full chain-rule walkthroughs). Most ML topics have this asymmetry — some chapters are math-driven, others are intuition-driven. Word count target accordingly: ~5000 here vs ~6000 for Ch 1.
- **Heavier on misconceptions.** Ch 2 has 7 misconceptions vs Ch 1's 7 — but they're more frequently *fundamental* (the "embeddings are pre-trained" myth is widespread). The chapter has correspondingly more space for warning-callouts.
- **Implementation code is shorter and simpler.** Ch 1 needed a full MLP class; Ch 2's centerpiece is a 30-line training loop. The chapter can afford more prose around the code, less code-heavy didactics.
- **Widgets lean visual, not algorithmic.** Ch 1's widgets all animated specific computations (backprop, training, autograd). Ch 2's marquee widget is a static-but-interactive scatter — different paradigm. Future chapters may have either flavor depending on what the material wants.

The chapter pattern remains: research file → page structure session → marquee widget session → secondary widget session → closeout session with exercises + status flip. The five-session recipe holds.

This is the second research file in the project. Whatever shape it converged to, future research files (Ch 3–30) should converge similarly — adjusted for chapter-specific content, but recognizable in shape.

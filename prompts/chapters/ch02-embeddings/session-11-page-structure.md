# Session 11 — Chapter 2 page structure

> First chapter session for Chapter 2 ("Embeddings & representation"). Takes the research file and produces the full MDX page: 8 sections, ~5500 words of prose, all equations and callouts in place, two widget placeholders (sessions 12 and 13 fill them), and three runnable code blocks demonstrating embedding lookup, skip-gram negative sampling, and tied embeddings. Chapter uses the denser 3-session model (this session + 2 widget sessions); the final widget session also handles exercises and the status flip.

---

## Read first (in this order)

1. **`research/ch02-embeddings/research.md`** — the source material. Every equation, code snippet, and misconception in this session traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`context/CURRICULUM.md`** — for Ch 2's locked scope
4. **`context/DESIGN_SYSTEM.md`** — for Callout types, Equation/EqRef usage
5. **`prompts/chapters/ch01-neural-net-primitives/session-07-page-structure.md`** — for the page-structure session template; Ch 2 follows the same shape with adjustments noted in this prompt
6. **`prompts/chapters/ch01-neural-net-primitives/session-10-autograd-and-exercises.md`** — for the chapter-closeout pattern that Ch 2's session 13 will follow

If anything contradicts the research file, the research file wins.

---

## Goal

Replace the placeholder `index.astro` (created in session 04's scaffolding) with a full `index.mdx` Chapter 2 page. By end of session:

- `src/pages/ch02-embeddings/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch02-embeddings/index.astro` is **deleted** (replaced)
- `src/lib/chapters.ts` has Ch 2's status flipped from `'planned'` to `'draft'` (full `'published'` flip happens in session 13)
- The chapter renders end-to-end at `/ch02-embeddings/`: sidebar shows Ch 2 active, TOC populates, prev/next nav shows Ch 1 (previous) and Ch 3 (next, disabled)

The page won't be feature-complete — two `<WidgetFrame>` blocks contain placeholders awaiting sessions 12-13. That's expected. The acceptance bar: a reader could read the chapter and learn from it.

**Important difference from Ch 1's structure:** Ch 2 has only **2 widget placeholders** (not 3 like Ch 1). Sessions 12 and 13 each own one widget; session 13 also handles the exercises and final status flip. This denser 3-session model fits Ch 2's more conceptual, less computation-heavy content.

---

## Inputs

State of the repo after session 10 (Ch 1 complete):

- `src/pages/ch02-embeddings/index.astro` is a placeholder using `ChapterLayout` with stub content (from scaffolding session 04 — same as Ch 1's pre-Phase-3 state)
- `src/lib/chapters.ts` has Ch 1 as `'published'`, all others as `'planned'`
- `research/ch02-embeddings/research.md` exists with curated source material
- Ch 1 is the only published chapter; landing-page CTA points to it

Wait — actually, session 04's scaffolding only created `ch01-neural-net-primitives/index.astro`, not `ch02-embeddings/index.astro`. Verify before deleting; if the directory and file don't exist yet, just create the new `.mdx`.

---

## Deliverables

1. **Create** `src/pages/ch02-embeddings/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch02-embeddings/index.astro` **if it exists**; otherwise skip this step
3. **Update** `src/lib/chapters.ts` — change Ch 2's `status` field from `'planned'` to `'draft'`

**Do not modify** any other file. The chapter layout, components, scaffolding, Ch 1, and the widgets directory are owned by earlier sessions and stay untouched.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch02-embeddings
description: How discrete tokens become continuous vectors that a neural network can consume. The embedding layer as a learnable lookup table, the word2vec story, why linear analogies emerge, and how modern LLMs train embeddings end-to-end.
---
```

### Imports

```mdx
import { Callout, Equation, EqRef, Figure, WidgetFrame } from '@components/content';
import { RunnableCode } from '@components/code';
```

(No widget imports yet — sessions 12 and 13 add `EmbeddingSpace` and `Word2VecDynamics` to this import line.)

### Chapter opening

`ChapterLayout` renders the eyebrow + h1 + description automatically. The MDX file's first content is 2-3 short paragraphs (~150 words) of opening.

**Target tone — the chapter author should rewrite in their voice but match the register:**

> Chapter 1 ended with a neural network that could classify 2D points by quadrant. Coordinates in, class label out. Both ends continuous. Both ends were always going to play nicely with backprop.
>
> Language is different. A word is not a coordinate. "Cat" is a token, an entry in a discrete vocabulary, and there is no obvious answer to "what is `cat` − `dog`?" The chain rule doesn't have anything to say about discrete IDs.
>
> This chapter is about the bridge: how we turn discrete tokens into continuous vectors that the network from Chapter 1 (or the transformer from Chapter 4) can consume. The bridge is one matrix and one array-indexing operation. It also happens to be where most of the parameters in a large language model live.

### Section 1: Why embeddings

**Heading:** `## Why embeddings`
**Word target:** ~500

**Teaching beats:**
1. Neural networks are continuous machines. They take real-valued vectors in, do affine maps and nonlinearities, produce real-valued vectors out. Backprop assumes continuous inputs.
2. Tokens are discrete. The text "the cat sat" becomes a sequence of integer IDs like `[12, 5847, 2391]`. We can't feed these to the MLP directly — what would `5847 - 12` even mean to the model?
3. The naive fix: one-hot encoding. Turn each ID into a length-$|V|$ vector with a single 1. Continuous-ish. But: $|V|$ is huge (50k+), so most computation would be multiplying matrices by mostly-zero vectors. Wasteful.
4. The actual fix: embeddings. Map each token ID to a dense vector in a much smaller space ($d \sim 100$-$10000$). Section 2 makes this rigorous.

**Required equation** (via `<Equation>`):

$$\text{token IDs} \in \{0, 1, \dots, |V| - 1\}^T \quad \longrightarrow \quad \text{embedded sequence} \in \mathbb{R}^{T \times d}$$

**Required callout** — type `note`, placed at end of section: the embedding step is where most of the parameters in a small language model live. For GPT-2 small (vocab 50,257, embedding dim 768): the embedding matrix is 38.6M parameters, out of ~125M total. Embeddings are not a minor detail.

**No code in this section.** Motivation first; mechanics in section 3.

**Connection forward:** the next two sections build the bridge.

### Section 2: One-hot versus distributed representations

**Heading:** `## One-hot versus distributed representations`
**Word target:** ~600

**Teaching beats:**
1. One-hot encoding (formal): token ID $i$ maps to vector $e_i \in \{0, 1\}^{|V|}$ with $(e_i)_j = [i = j]$.
2. Properties: orthogonal across tokens, magnitude 1, sparse (only one nonzero entry).
3. The "stamps" analogy from research.md: every word gets a unique stamp; nothing shared between words; no notion of "similar" words at this representation.
4. Distributed representation (informal): each word gets a $d$-dimensional dense vector. Different words can have similar vectors. Similar-meaning words tend to have similar vectors after training.
5. **The "description" framing:** distributed encoding is like a description rather than a stamp. "Cat" might encode {small, furry, indoor, mammal, feline}; "dog" might encode {medium, furry, common, indoor, mammal, canine}. Most features shared; the differences are meaningful.
6. **The linear-algebra equivalence.** Multiplying a one-hot vector $e_i$ by an embedding matrix $E^\top$ gives the $i$-th column of $E^\top$, which is the $i$-th row of $E$. So "lookup row $i$ of $E$" and "multiply $e_i$ by $E^\top$" are mathematically identical. In practice we always index.

**Required equation:**

$$E^\top \mathbf{e}_i = E[i, :] \in \mathbb{R}^d \quad \text{(one-hot lookup = row indexing)}$$

**Required callout** — type `aside`: never actually implement one-hot multiplication. The mathematical equivalence is useful for explaining gradients (section 3) but in practice you index. 1000× faster.

**No code in this section.** Mechanics in section 3.

**Connection forward:** so embeddings are dense vectors. Where do they live? In a lookup table.

### Section 3: The embedding layer as a lookup table

**Heading:** `## The embedding layer as a lookup table`
**Word target:** ~600
**Sub-headings:** `### Forward: array indexing`, `### Backward: sparse gradients`

**Teaching beats:**
1. The embedding matrix $E \in \R^{|V| \times d}$. One row per token in the vocabulary.
2. Forward: given a batch of token IDs, return the corresponding rows. In numpy: `E[token_ids]`.
3. **Initialization:** small Gaussian, typically $\mathcal{N}(0, 0.02)$. Don't use He or Xavier — those are calibrated for affine + activation layers; embedding lookups have no activation function.
4. **Backward:** the embedding "operation" is differentiable. Only the rows actually used in the batch get nonzero gradients; all other rows get zero. Section's `<RunnableCode>` shows this explicitly.
5. **Sparse gradient updates** at scale: for vocab 50k+, only ~1% of rows update per step. Most frameworks have a "sparse" optimizer mode for embedding tables.
6. **Why this is parameter-efficient.** Even though the embedding table has $|V| \times d$ parameters, only the rows for tokens seen in the batch are touched. The non-seen rows have zero gradient, so they don't move.

**Required equation:**

$$\frac{\partial L}{\partial E[j, :]} = \begin{cases} \dfrac{\partial L}{\partial e} & \text{if } j = i \\ \mathbf{0} & \text{otherwise} \end{cases}$$

(Where $e = E[i, :]$ is the embedding looked up for token $i$, and $\partial L / \partial e$ is the gradient flowing back from downstream.)

**Required code** — `<RunnableCode>` showing both forward and backward for an embedding layer:

```python
import numpy as np

class EmbeddingLayer:
    def __init__(self, vocab_size, dim, seed=42):
        rng = np.random.default_rng(seed)
        self.E = rng.normal(0, 0.02, (vocab_size, dim))
        self.last_ids = None

    def forward(self, token_ids):
        self.last_ids = token_ids
        return self.E[token_ids]

    def backward(self, grad_out):
        # grad_out has the same shape as forward output: (batch, dim) or (batch, seq, dim)
        grad_E = np.zeros_like(self.E)
        flat_ids = np.array(self.last_ids).reshape(-1)
        flat_grads = grad_out.reshape(-1, self.E.shape[1])
        np.add.at(grad_E, flat_ids, flat_grads)   # handles repeated IDs correctly
        return grad_E

# Demo
emb = EmbeddingLayer(vocab_size=5, dim=3, seed=0)
print("E (5x3 matrix):")
print(emb.E.round(3))

# Look up tokens 2 and 0
ids = np.array([2, 0])
vecs = emb.forward(ids)
print(f"\nLooked up rows for ids {ids.tolist()}:")
print(vecs.round(3))

# Pretend downstream sent back these gradients
grad_out = np.array([[1.0, 1.0, 1.0], [-0.5, -0.5, -0.5]])
grad_E = emb.backward(grad_out)
print(f"\nGradient w.r.t. E (note only rows 2 and 0 have non-zero gradients):")
print(grad_E.round(3))
```

**Required callout** — type `insight`: the embedding lookup is *the* operation that makes neural language modeling tractable. Without it (or its mathematically-equivalent one-hot × matrix), every forward pass would have to multiply by $|V|$ × $d$ matrices for every position; the embedding table replaces that with a constant-time index. Modern LMs do millions of these lookups per training step; doing it correctly is the difference between "trains in a week" and "trains in a year."

**Connection forward:** the embedding table is just a matrix of parameters. The question is how it gets its values. Section 4 introduces the historical answer (word2vec); section 6 introduces the modern answer (end-to-end).

### Section 4: Word2vec — skip-gram with negative sampling

**Heading:** `## Word2vec — skip-gram with negative sampling`
**Word target:** ~1000 (longest section)
**Sub-headings:** `### The self-supervised objective`, `### Why the full softmax is intractable`, `### Negative sampling`, `### A working implementation`

**Teaching beats:**
1. **Historical motivation:** before 2013, learned word representations existed but were expensive and unstable. Mikolov et al. 2013 changed this with a simple, scalable, self-supervised approach: word2vec.
2. **The skip-gram premise:** for each (word, context) co-occurrence in a corpus, train the model to predict context from word. Self-supervised — no labels needed; the corpus is the supervision.
3. **The full softmax (eq):** $P(c \mid w) = \exp(v_c^\top u_w) / \sum_{c'} \exp(v_{c'}^\top u_w)$. The denominator sums over all $|V|$ words. For vocab 50k, this is 50k dot products per training pair. Intractable.
4. **Negative sampling fix:** replace the $|V|$-way softmax with $k+1$ binary classifications. For each real (word, context) pair, draw $k$ random negatives from a noise distribution. Train the model to distinguish real pairs (label 1) from fake pairs (label 0).
5. **The SGNS objective** (from research.md Derivation 1): the boxed loss equation. Devote a paragraph to interpreting each term.
6. **The noise distribution:** $P_n(c) \propto p(c)^{3/4}$. The 3/4 exponent was empirically found to balance frequent and rare words.
7. **Typical hyperparameters:** $k = 5$-$20$ negatives, context window 5-10, dimension 100-300, lr ~ 0.025 starting and annealed.
8. **The toy implementation:** a `<RunnableCode>` showing skip-gram negative sampling on a tiny corpus. Train for 100 epochs in Pyodide (~1 second); show that "cat" and "dog" become more similar than "cat" and "rug."

**Required equations** (use `<Equation>` for the long ones):

Full softmax:
$$P(c \mid w) = \frac{\exp(v_c^\top u_w)}{\sum_{c' \in V} \exp(v_{c'}^\top u_w)}$$

SGNS loss (use `<Equation label="2.sgns">` so the geometry section can reference it):
$$\mathcal{L}_{\text{SGNS}} = -\log \sigma(v_c^\top u_w) - \sum_{i=1}^{k} \log \sigma(-v_{c'_i}^\top u_w)$$

Noise distribution:
$$P_n(c) \propto p(c)^{3/4}$$

**Required callout** — type `note`, after the SGNS equation: the loss has two parts that mirror each other. The first term wants the real word-context dot product to be large (sigmoid → 1). The second term wants random pairs' dot products to be small (sigmoid of negative → 1). Together, they pull real co-occurrences together and push random pairs apart. This is contrastive learning in a 2013 wrapper.

**Required widget placeholder** — Word2VecDynamics widget (session 13 fills this):

```mdx
<WidgetFrame title="Skip-gram dynamics" caption="A small vocabulary of 12 words trained with skip-gram negative sampling. Click through training steps to watch related words pull together and random negatives push apart in a 2D projection.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 13
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` with the toy skip-gram implementation from research.md (the 12-word corpus example):

```python
import numpy as np

def sigmoid(x):
    return 1 / (1 + np.exp(-np.clip(x, -30, 30)))

corpus = """the cat sat on the mat the dog sat on the rug
            the cat purred the dog barked the cat napped""".split()

# Build vocabulary
vocab = sorted(set(corpus))
word_to_id = {w: i for i, w in enumerate(vocab)}
V = len(vocab)
dim = 8
k = 3

# Build (center, context) pairs with window 2
pairs = []
for i, w in enumerate(corpus):
    for j in range(max(0, i-2), min(len(corpus), i+3)):
        if i != j:
            pairs.append((word_to_id[w], word_to_id[corpus[j]]))

rng = np.random.default_rng(42)
U = rng.normal(0, 0.1, (V, dim))    # center embeddings
W = rng.normal(0, 0.1, (V, dim))    # context embeddings (called V in the math; renamed here to avoid Python name collision)

# Build noise distribution: unigram^0.75
counts = np.bincount([w for w, _ in pairs], minlength=V).astype(float)
P_n = counts ** 0.75
P_n /= P_n.sum()

lr = 0.05
for epoch in range(100):
    rng.shuffle(pairs)
    for w_id, c_id in pairs:
        neg_ids = rng.choice(V, size=k, replace=False, p=P_n)
        u, v, neg = U[w_id], W[c_id], W[neg_ids]

        # Forward
        pos_logit = u @ v
        neg_logits = neg @ u

        # Gradients
        pos_grad = sigmoid(pos_logit) - 1            # dL/d(pos_logit)
        neg_grad = sigmoid(neg_logits)                # dL/d(each neg_logit)

        grad_u = pos_grad * v + (neg_grad[:, None] * neg).sum(axis=0)
        grad_v = pos_grad * u
        grad_neg = neg_grad[:, None] * u

        # SGD updates
        U[w_id]  -= lr * grad_u
        W[c_id]  -= lr * grad_v
        W[neg_ids] -= lr * grad_neg

# Inspect: cosine similarities of three pairs
def cos(a, b): return (a @ b) / (np.linalg.norm(a) * np.linalg.norm(b))
print(f"cat ↔ dog: {cos(U[word_to_id['cat']], U[word_to_id['dog']]):.3f}")
print(f"cat ↔ rug: {cos(U[word_to_id['cat']], U[word_to_id['rug']]):.3f}")
print(f"sat ↔ napped: {cos(U[word_to_id['sat']], U[word_to_id['napped']]):.3f}")
```

**Connection forward:** word2vec produces embeddings with surprising geometric structure. Section 5 explains what that structure is and why it exists.

### Section 5: The geometry of learned representations

**Heading:** `## The geometry of learned representations`
**Word target:** ~700

**Teaching beats:**
1. **The famous demo:** $\vec{\text{king}} - \vec{\text{man}} + \vec{\text{woman}} \approx \vec{\text{queen}}$. Mikolov et al. 2013 showed this on 6B-word-trained embeddings; it became the iconic result of the field.
2. **What it shows:** the embedding space has approximately *linear* structure for some semantic relationships. The "male-to-female" direction is roughly constant across analogous pairs (king/queen, uncle/aunt, brother/sister).
3. **Why it works** (sketched, not fully derived): Levy & Goldberg 2014 showed that SGNS implicitly factorizes the shifted PMI matrix. PMI has additive structure for compositional pairs. The PMI-factorization view gives a clean (though approximate) explanation.
4. **Connection to section 4:** the SGNS objective $v_c^\top u_w \approx \text{PMI}(c, w) - \log k$ at convergence (per Levy & Goldberg). This is the structural reason linear analogies emerge.
5. **Caveats:** Mikolov-style "linear analogies" have been heavily critiqued. Often the success rate depends on the evaluation protocol (whether the query word is excluded from candidates, whether nearest-neighbors-of-the-target are restricted to a particular set, etc.). Linear analogies are real but oversold.
6. **What the widget shows:** a 2D projection of pre-computed word2vec embeddings, colored by semantic category, with overlay arrows showing analogy pairs. Reader can see clusters (animals, colors, countries) and the approximate parallel-arrows pattern for analogies.

**Required equation** — the Levy-Goldberg result:

$$v_c^\top u_w \approx \text{PMI}(c, w) - \log k, \quad \text{where} \quad \text{PMI}(c, w) = \log \frac{p(c, w)}{p(c) \cdot p(w)}$$

**Required callout** — type `warning`: misconception MC7 from research.md. Linear analogies are *evidence* that embeddings encode compositional structure; they are NOT *proof* that embeddings "understand" language. Many critiques (e.g., Rogers et al. 2020) point out that analogy success depends on the evaluation methodology — restricting candidates, filtering nearest neighbors. Treat linear analogies as a real but limited phenomenon.

**Required widget placeholder** — Embedding Space marquee widget (session 12 fills this):

```mdx
<WidgetFrame title="Word2vec embedding space" caption="A 2D projection of pre-computed word2vec embeddings, colored by semantic category. Toggle the analogy overlays to see the approximate parallelism of vector pairs (king/queen vs man/woman vs uncle/aunt).">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 12 (marquee)
  </div>
</WidgetFrame>
```

**Reference**: use `<EqRef id="2.sgns" />` somewhere in this section to point back to section 4's SGNS equation.

**Connection forward:** word2vec is historically important. But it's not how modern LLMs train embeddings. Section 6 is the corrective.

### Section 6: Embeddings in modern LLMs

**Heading:** `## Embeddings in modern LLMs`
**Word target:** ~800
**Sub-headings:** `### End-to-end training`, `### What the embeddings learn`, `### Layer-by-layer contextualization`

**Teaching beats:**
1. **The corrective.** Word2vec is a 2013 algorithm trained on a single objective (predict context). Modern LLMs train embeddings *end-to-end with the rest of the model* on a different objective (predict the next token).
2. The embedding table $E$ is just a learnable parameter of the model — it updates via backprop along with attention weights, FFN weights, layer norms, everything. No separate "pretrain embeddings" phase.
3. **What does this look like in code?** Section 3's `EmbeddingLayer` is essentially the same. The difference is *what the rest of the network does* with the embeddings: a transformer, not a feedforward predictor of one context word.
4. **Karpathy makemore (worth mentioning):** trains character-level embeddings end-to-end with a tiny MLP that predicts the next character. Same embedding-as-lookup operation; different network. The embeddings that result are useful for the next-character-prediction task; they're not "general purpose" the way word2vec aimed to be.
5. **Layer-by-layer contextualization.** At the input, every occurrence of "bank" has the same vector (row of $E$). After layer 1 of a transformer, the "bank" in "river bank" and "savings bank" already differ — because attention has mixed in surrounding context. By layer 12, they're substantially different.
6. **Misconception MC2:** the "single fixed embedding per token" intuition is only true at the input. Inside the network, every layer produces a contextualized representation. The chapter doesn't go deep on this — it's covered in Ch 5.
7. **Implications for embedding interpretability:** modern LLM input embeddings are less directly interpretable than word2vec embeddings, partly because they're trained for a different objective. Probing studies still find meaningful structure, but the "king − man + woman" demo doesn't reliably reproduce on GPT-2's input embeddings.

**Required callout** — type `warning`: misconception MC1 from research.md. "Embeddings are pre-trained with word2vec, then frozen for the LLM" — wrong about every production LLM. Word2vec embeddings exist and occasionally seed small models, but no large LM treats embeddings as a separate pre-training step. They are learnable parameters of the model, trained end-to-end, full stop.

**Required code** — a small `<RunnableCode>` showing that embeddings + MLP + next-token-prediction is the same operation as section 3's embedding layer, just wired into a different downstream network. (Brief; section 3 already established the lookup mechanics.)

```python
import numpy as np

# Embedding-as-lookup, just like section 3, but now as part of a tiny next-character predictor
vocab = list("abcdefghijklmnopqrstuvwxyz ")
V = len(vocab)
char_to_id = {c: i for i, c in enumerate(vocab)}

class TinyLM:
    """Bigram predictor: char_{t-1} → char_t via a learned embedding + linear projection."""
    def __init__(self, vocab_size, dim, seed=42):
        rng = np.random.default_rng(seed)
        self.E = rng.normal(0, 0.02, (vocab_size, dim))   # embedding table
        self.W_out = rng.normal(0, 0.02, (dim, vocab_size))   # output projection

    def forward(self, char_id):
        embedded = self.E[char_id]                  # (dim,) — the embedding
        logits = embedded @ self.W_out              # (V,)   — scores over next-char
        return logits

lm = TinyLM(V, dim=16)
# Predict next-char distribution after 'a'
logits = lm.forward(char_to_id['a'])
print(f"Logits for char after 'a' (untrained, so ~uniform): shape {logits.shape}")
print(f"Most probable next char (random, untrained): '{vocab[logits.argmax()]}'")
# Both lm.E and lm.W_out would update during training. The embedding emerges as a
# byproduct of training the whole network for next-character prediction.
```

**Connection forward:** notice that the output projection `W_out` has shape `(dim, vocab_size)`, which is the same shape as $E$ transposed. Section 7 explores tying them.

### Section 7: Tied input/output embeddings

**Heading:** `## Tying input and output embeddings`
**Word target:** ~400

**Teaching beats:**
1. The setup: an LM has an input embedding $E \in \R^{|V| \times d}$ and an output projection $W_{\text{out}} \in \R^{d \times |V|}$. Both map between vocabulary space and embedding space.
2. **The idea (Press & Wolf 2017):** what if $W_{\text{out}} = E^\top$? Tie the matrices. Save $|V| \times d$ parameters.
3. **Why it makes sense:** the input space and output space should have the same structure — both represent "what word is this?" There's no a-priori reason the matrix to embed a word should differ from the matrix to predict it.
4. **Concrete savings:** for GPT-2 small (vocab 50,257, dim 768), tied embeddings save 38.6M parameters out of ~125M total. ~30% reduction. Plus a small perplexity improvement.
5. **Standard practice:** GPT-2 ties. LLaMA ties. Mistral ties. Most open-source LMs tie. Some larger models (GPT-3+, GPT-4) reportedly don't tie — the parameter budget is less binding at scale, and the geometric flexibility of separate matrices may be worth it.
6. **Output bias is usually NOT tied:** even with tied weights, the output projection typically adds a learnable bias $b \in \R^{|V|}$ (one per vocabulary entry). This absorbs unigram statistics. Tying the *bias* would mean tying a vector with no input-side counterpart — usually skipped.

**Required code** — a `<RunnableCode>` showing the tied embedding pattern:

```python
import numpy as np

class TiedEmbedding:
    """One matrix W, used both as input embedding and as the output projection."""
    def __init__(self, vocab_size, dim, seed=42):
        rng = np.random.default_rng(seed)
        self.W = rng.normal(0, 0.02, (vocab_size, dim))
        self.b_out = np.zeros(vocab_size)   # output bias is separate; absorbs unigram

    def embed(self, token_ids):
        return self.W[token_ids]                     # (batch, dim)

    def project(self, hidden):
        return hidden @ self.W.T + self.b_out        # (batch, vocab_size) logits

# Demo: tied embed for vocab=10, dim=4
te = TiedEmbedding(vocab_size=10, dim=4, seed=0)

# Embed token 3
emb = te.embed(np.array([3]))
print(f"Embedding of token 3: {emb[0].round(3)}")

# Project a hypothetical hidden state
hidden = np.array([[0.5, -0.2, 0.1, 0.3]])
logits = te.project(hidden)
print(f"Logits over vocab (10 entries): {logits[0].round(3)}")

# Sanity: the embedding of token i should produce the highest logit for token i
# (after sufficient training; not necessarily before)
```

**Required callout** — type `aside`: the parameter savings are dramatic at small scale (~30% for GPT-2-small) but diminish at large scale (where the embedding fraction of total parameters drops). For training a 7B-parameter model, tied vs untied is a ~1% parameter difference. Tying is still the default — costs nothing, occasionally helps.

### Section 8: From token to context

**Heading:** `## From token to context`
**Word target:** ~500 (closing bridge)

**Teaching beats:**
1. **Recap.** We turned discrete token IDs into continuous vectors via a learnable lookup table. The table is initialized small, trained end-to-end with the model, and produces representations with useful geometric properties (often, not always, linear-analogy-friendly).
2. **What's missing from the picture so far.** The chapter's embedding is *static* — every occurrence of "cat" maps to the same vector. But the meaning of "cat" depends on context: "the cat purred" vs "the cat in 'cat -lvf' is a flag for tar." The fix is the transformer: each layer takes the previous layer's representations and refines them with attention.
3. **Chapter 3 (Tokenization)** is the upstream piece. What ARE the token IDs that we've been looking up? Words? Characters? Something in between (BPE)? The next chapter shows that the choice of tokenization shapes the entire embedding table.
4. **Chapter 4 (Attention)** is the downstream piece. Once we have a sequence of embeddings, attention is the operation that lets each position look at every other position and refine itself based on what it sees.
5. **A teaser:** when Chapter 4 introduces attention, it works on the output of an embedding lookup. The first thing every transformer does is map token IDs → vectors via Chapter 2's machinery. Everything after is a refinement.

**Sample close** (rewrite in chapter voice):

> Static embeddings are a bridge — discrete IDs in, continuous vectors out. The transformer is what happens to those vectors next. Each transformer layer takes the previous layer's representations and refines them by attending to the surrounding context. By the time the network has run twelve layers (or seventy, or two hundred), the representation at position $t$ has absorbed information from every other position. It is no longer "the embedding of token $t$"; it is "what token $t$ means here, given everything around it."
>
> That's the transformer. We'll get there in Chapter 4. First, Chapter 3 zooms into the upstream side: where do the token IDs come from, and how does that choice shape everything downstream?

---

### Update `src/lib/chapters.ts`

Find the line for Ch 2:

```ts
{ num: 2, slug: 'ch02-embeddings', title: 'Embeddings & representation', partNum: 1, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`. (Session 13 will flip to `'published'` after the second widget and exercises are added.)

### Delete the placeholder

```bash
# If the placeholder exists from scaffolding session 04, delete it
test -f src/pages/ch02-embeddings/index.astro && rm src/pages/ch02-embeddings/index.astro || echo "No placeholder to delete"
```

(Scaffolding session 04 only created the placeholder for Ch 1. Ch 2's placeholder may or may not exist depending on whether subsequent sessions created stubs. Skip if not present.)

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch02-embeddings/`** renders with:
   - Chapter eyebrow ("Chapter 2") + h1 ("Embeddings & representation") + description
   - 8 h2 sections in the order specified
   - All equations render via KaTeX (no raw `$...$`)
   - 4 `<RunnableCode>` blocks (sections 3, 4, 6, 7) — verify each has a working Run button
   - 2 `<WidgetFrame>` placeholders (sections 4 and 5)
   - At least 5 callouts spread through the chapter
3. **Sidebar:** Ch 1 still active (and now published); Ch 2 newly active (draft); Ch 3-30 still dimmed.
4. **Landing page CTA:** still "Start with Chapter 1 →" (because Ch 2 is `'draft'`, not `'published'`).
5. **Prev/next nav at bottom of Ch 2:** prev = Ch 1 (active link); next = Ch 3 (disabled).
6. **TOC on Ch 2** populates with all 8 sections plus subsections.
7. **Word count:** chapter prose total between 5000 and 6500 words.
8. **`npm run typecheck`** passes.
9. **`npm run build`** completes; `dist/ch02-embeddings/index.html` exists.

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 12 and 13 own them.
- ❌ **Do not write exercises.** Session 13 adds them at chapter close.
- ❌ **Do not flip Ch 2's status to `'published'`.** Session 13 owns that.
- ❌ **Do not create new MDX components.** Reuse `@components/content` and `@components/code` only.
- ❌ **Do not modify any layout, styling, or scaffolding file.**
- ❌ **Do not modify Ch 1 in any way.** Its prose, widgets, and status are sealed.
- ❌ **Do not write content for Ch 3+.**
- ❌ **Do not add new components, libraries, or routes.**

---

## Wire-up

After acceptance criteria pass:

```bash
git add src/pages/ch02-embeddings/index.mdx src/lib/chapters.ts
# Only if the placeholder existed:
git rm -f src/pages/ch02-embeddings/index.astro 2>/dev/null || true
git commit -m "session 11: Chapter 2 prose — 8 sections, equations, code, widget placeholders"
git push origin main
```

Visit production. Read the chapter on desktop and mobile. Verify:
- Mobile: prose readable; runnable code works; widget placeholders don't break layout
- Desktop: TOC populates and follows scroll; sidebar shows Ch 2 active

The next session (`session-12-embedding-space-widget.md`) assumes the section-5 `<WidgetFrame title="Word2vec embedding space">` exists exactly as specified above.

---

## Notes for the session author

**On voice continuity with Ch 1:** the project voice is sparse, technical, calm. Match Ch 1's register. The opening's "Language is different. A word is not a coordinate." moment is the kind of contrast-setting beat that the project's tone supports. If your prose feels like a textbook chapter from 2010, you're missing the register.

**On section pacing:** section 4 (word2vec) is the longest single section in the chapter — give it room. The other long section is 5 (geometry), at 700 words. The remainder are 400-800 word units. Don't try to make every section equal.

**On code blocks:** Ch 2 has fewer code blocks than Ch 1 (4 vs 5+). The chapter is more conceptual. Don't pad with unnecessary code — when prose suffices, use prose.

**On widget placeholders:** both `<WidgetFrame>` placeholders should look 95% complete (real WidgetFrame with title and caption). The interior `<div>` is the stub. Sessions 12 and 13 swap that one element.

**On forward references:** the chapter mentions Ch 3, Ch 4, Ch 5, Ch 6 — many forward references. That's fine; this is a connective chapter. Each reference should be specific ("Ch 4 introduces attention, which operates on embedded sequences"), not generic ("you'll learn more later").

**On the misconception sections (MC1, MC2):** these are widespread misconceptions among readers who learned ML from older sources. The corrections are important for the reader's mental model. Treat them with the seriousness the topic deserves.

**On word2vec depth:** the chapter spends substantial time on word2vec (section 4 is the longest). This is justified: even though modern LLMs don't use word2vec, it's pedagogically the cleanest introduction to "learned embeddings." The chapter then explicitly corrects the "this is how modern LLMs work" misconception in section 6.

If after writing this chapter, the reader could:
1. Implement an embedding layer with forward/backward in numpy
2. Explain why one-hot is wasteful
3. Describe what SGNS does at a high level (with the equation roughly correct)
4. Distinguish word2vec from modern LLM embeddings
5. Explain what tied embeddings are and roughly why they help

— the chapter has done its job. These are the five pedagogical outcomes, even though the prose can't directly test for them.

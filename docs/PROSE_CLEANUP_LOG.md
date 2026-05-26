# Prose cleanup log

Per-chapter summary of the voice-cleanup edit pass. Scope: chapters 4–17.

**Operating rules confirmed by the author at the start of Ch 4:**
1. **Zero em dashes.** No em dash is preserved anywhere — including code comments, headings, captions, frontmatter descriptions, single em dashes used for emphasis or punchline.
2. **Calibration ≠ ceiling.** Even the chapter the author identified as reading well (Ch 4) gets the full aggressive pass.

The pass targets 16 specific patterns (em-dash asides, "Crucially/Importantly" openers, triadic-filler lists, empty closings, LLM vocabulary, throat-clearings, etc.) defined in the session prompt.

---

## Chapter 4 — Attention

**Baseline:** 7,414 words; 105 em dashes.
**After:**   7,169 words (−245, −3.3%); 0 em dashes.

### Removed

- **All 105 em dashes.** Every two-em-dash aside → parentheses or colons. Every single em dash → period, semicolon, comma, or colon, chosen by what the syntax wanted to be without the dash. Includes em dashes in code-block docstrings, widget captions, section/exercise headings, the frontmatter description, and the chapter-close signature line.
- **Section-ending recap paragraph (chapter close).** The 8-sentence "Scaled dot-product attention is the operation that defines the modern LLM. $Q$, $K$, $V$ are…" paragraph was a pure restatement of what the chapter just covered. Deleted. The forward-pointer paragraph immediately after now serves as the close.
- **Signature flourish closing.** "What we built in this chapter is what all of them start from." Deleted — the forward-pointer paragraph already does the work of saying "everything else is downstream."
- **3 throat-clearings.**
  - "The mental model is worth holding fixed before any equations land" → "Hold the mental model fixed before any equations land" (kept the substance, dropped the warm-up framing).
  - "The shapes are worth pinning down." → cut; section now starts at the substantive sentence.
  - "Temperature is worth a sentence." → cut.
  - "has a closed form worth knowing:" → "has a closed form:".
- **1 hedge variant.** "it is worth being clear that" → cut.
- **1 editorial flourish appended to a section opener.** "and it is one of the more satisfying design-justification arguments in deep learning" → cut. (The same opinion already appears in the line 211 callout, so there's no information loss.)
- **1 minor flourish in callout.** "and an instructive one to be wrong about" → cut; sentence restructured.
- **1 redundant transition sentence.** "What turns these three projections into a working operation is the formula that combines them — the central equation of the chapter, and the subject of section 3." → trimmed to a single short sentence with no forward-announcement; the section heading right below carries the announcement.

### Kept (intentional voice)

- **Q/K/V triadic structure** in the database-analogy section. Genuinely three things.
- **The four numbered softmax properties** (translation invariance, differentiable, emphasizes the max, valid distribution). Four genuine properties, not rhetorical padding.
- **All technical claims, equations, code logic, KaTeX macros, component props.**
- **Section transition sentences** that signal what's next ("That handles the denominator. The numerator's softmax has its own justification, which is the subject of the next section."). Structural, not throat-clearing.
- **Question-style section headers** that are answered immediately ("Why √d_k? The variance argument", "Why softmax? The normalization choice"). These follow the heading-style guidance in `PROJECT_OVERVIEW.md`.

### Flagged for author review (no auto-resolve)

- **Line ~313 callout vs. inline prose ~261.** The "causal masking is applied after attention is wrong" warning callout substantially overlaps the inline prose two paragraphs earlier. Same point, similar example. Neither was removed; author may want to merge or pick one.

### Sample biggest changes

**Opening paragraph:**

> Before: The transformer is mostly attention. The rest — embeddings, feedforward layers, normalizations, residuals — is supporting cast.
>
> After: The transformer is mostly attention. The rest is supporting cast: embeddings, feedforward layers, normalizations, residuals.

**Why √d_k section opener:**

> Before: The answer is a short, clean variance calculation — and it is one of the more satisfying design-justification arguments in deep learning.
>
> After: The answer is a short, clean variance calculation.

**Cost section listing (3 single em dashes in one paragraph):**

> Before: $QK^\top$ is $O(n^2 d)$ — $2 n^2 d$ FLOPs under the standard counting … The softmax … is $O(n^2)$ — a constant number of operations per entry. The multiplication $AV$ is $O(n^2 d)$ — another $2 n^2 d$ FLOPs.
>
> After: $QK^\top$ is $O(n^2 d)$, or $2 n^2 d$ FLOPs under the standard counting … The softmax … is $O(n^2)$, a constant number of operations per entry. The multiplication $AV$ is $O(n^2 d)$, another $2 n^2 d$ FLOPs.

**Chapter close:**

> Before (final 3 paragraphs):
>   - "Scaled dot-product attention is the operation that defines the modern LLM. $Q$, $K$, $V$ are three learned views of the same input. Dot product scores their similarity…" [8 sentences of recap]
>   - "Everything else in this tutorial is downstream of this. Chapter 5 stacks…" [forward-pointer]
>   - "What we built in this chapter is what all of them start from." [signature]
>
> After (final 1 paragraph):
>   - "Everything else in this tutorial is downstream of this. Chapter 5 stacks…" [forward-pointer alone]

### Net change

105 em dashes → 0. Word count down 3.3%. Three section closings restructured (recap deleted, flourish deleted, redundant transition trimmed). The chapter now ends on a forward-pointer rather than a backward-recap-plus-flourish.

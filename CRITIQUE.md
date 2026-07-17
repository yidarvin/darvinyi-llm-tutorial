# Critique: darvinyi-llm-tutorial

2026-07-16 · `818cc06` · reviewed by Claude Opus 4.8 via repo-critique

## Verdict

This is a genuinely strong, unusually disciplined 30-chapter LLM textbook — from numpy primitives to agent frameworks — and it very nearly earns its own claim of "truly high quality." The mathematical derivations are careful, the prose voice is enforced almost perfectly (0 em dashes and 0 forbidden phrases across 264,000 words), the factual reliability is high enough that a targeted adversarial fact-check of the fifteen riskiest claims turned up exactly one real error, and the frontend is clean in the places that usually rot (deterministic widgets, balanced effect cleanup, a properly-escaped search-snippet path). A prior 37-agent content audit (`docs/CONTENT_CRITIQUE.md`, 2026-07-13) found ~14 chapters with broken runnables and confident factual errors; spot-checking its "quickest wins" confirms the remediation was **real**, not claimed — Ch4 cross-refs, Ch13 BOS, Ch11 FFN arithmetic, Ch21 Toolformer, Ch3 WordPiece attribution, and a fabricated Ch29 citation are all actually fixed. So the foundation is not just worth building on; it is most of the way to finished.

What holds it back is a single structural weakness that this critique is largely about: **the validation gates pass green while under-covering the exact surfaces that carry the most risk.** All five gates (`check:content`, `check:runnables`, `check:widgets`, `typecheck`, `build`) pass on a clean checkout — yet the runnable checker verifies printed output on only 4 of 237 blocks (leaving 94 inline numeric claims ungated, which is precisely the defect class the prior audit spent enormous manual effort eliminating), the widget-data checker covers 3 of ~15 data modules, seven declared dependencies are entirely unused (one, `mathjs`, carrying a high-severity CVE), two load-bearing external citations 404, one real factual error sits in a chapter opening, and a CDN hiccup permanently bricks every runnable until page reload. None of these are deep. They are all mechanically findable and fixable, and the through-line is the same: the project's methodology rests on "programmatic checks before review," but the checks give false confidence on the highest-value content. Close that gap — make the gates actually gate the numbers, prose, and links they pretend to — and this becomes an excellent book.

## Scorecard

| Dimension | Score /10 | One-line justification |
|---|---|---|
| Accuracy | 8 | One Major error (Ch20 GSM8K) in a targeted sample; every attribution, constant, and mid-2026 model roster otherwise verified against primary sources. |
| Prose & voice | 9 | Voice contract enforced to a degree most published books don't reach; 0 em dashes, 0 forbidden phrases, low tic density. |
| Pedagogy | 8 | Worked-example-first, well-scaffolded exercises with verified printed values; one promised feature (live-API widgets) silently cut. |
| Correctness (code) | 7 | Determinism and cleanup clean; one real resilience bug bricks the Pyodide runtime with no recovery. |
| Architecture | 8 | Honest layout, island architecture used well, no god modules; one dead barrel the project's own policy forbids. |
| Testing / CI | 4 | Gates pass but under-cover: 4/237 runnable outputs asserted, 3/15 widget modules, no link/prose gate. This is the weak spot. |
| Security | 7 | No live exploit (search snippet properly escaped), but zero security headers and a high-sev CVE in an unused dep. |
| Accessibility | 7 | Real investment (18 aria-live usages, exemplary tab-pickers); one signature widget is mouse-only, contradicting the claimed Lighthouse-100. |
| Dependency hygiene | 5 | Seven unused runtime deps, two phantom (imported-but-undeclared) deps; documented stack has drifted from the real one. |
| Originality | 9 | The comprehensive-and-current-and-interactive-in-one-arc niche is real and unoccupied; the back half (post-training → agents) is genuinely underserved elsewhere. |

## What genuinely works

- **The voice contract is enforced, not aspirational.** `context/PROJECT_OVERVIEW.md` forbids em dashes, a list of filler phrases, and "announce-the-next-section" transitions. Measured across all 30 chapters: **0 em dashes, 0 occurrences** of "dive in / delve / it's important to note / as we can see / now that we understand," and low tic density over 264k words ("just" 208, "very" 70, "simply" 14). Most books that *claim* a style guide don't pass their own grep.
- **Factual reliability is high.** A web-verified adversarial pass on the fifteen highest-risk claims (attributions, Chinchilla constants, model rosters, hardware FLOPS) returned all-correct except one: RoPE=Su 2021, ALiBi=Press 2021, NTK=bloc97/community, DPO=Rafailov, GRPO=Shao, SAE=Bricken/Templeton, TransformerLens=Nanda are all right, and the Chinchilla treatment correctly flags the iso-FLOP-vs-parametric-optimum subtlety that most secondary sources botch (`ch09:78`).
- **Currency is actively maintained.** The book carries forward-dated mid-2026 model claims (DeepSeek-V4, GLM-5.2, Kimi K2.6 at `ch11:295`) that verify against current sources and are stamped "as of 2026-07-13." `ch30` hedges every benchmark number with an explicit "this will move" caveat — exemplary for a perishable topic.
- **The prior audit's remediation is real.** Spot-checking `docs/CONTENT_CRITIQUE.md`'s "quickest wins" against live source: Ch4 refs (7→5, 11→12), Ch13 `begin_of_text` IS-the-BOS correction, Ch11 `ffn_per_expert = 3 * d_model * d_ffn`, Ch21 Toolformer "five tools," Ch3 "five times" + Schuster & Nakajima 2012, and the removal of the fabricated Hoff & Anderson 1976 citation are all present. This team fixes what it finds.
- **The frontend is disciplined despite having no linter.** 0 `Math.random`/`Date.now` in widgets (determinism rule honored), balanced `addEventListener`/`removeEventListener`, ~42 real casts all at legitimate DOM/Pyodide boundaries, only 3 genuine `any`. The `dangerouslySetInnerHTML` in search results is safe: `search-client.ts` `escapeHtml()`s content before inserting `<mark>` and guards the query with `escapeRegExp`.
- **Internal links and metadata are spotless.** 30 folders ↔ 30 registry entries (exact), every frontmatter complete, all nav generated from the typed `chapters.ts` registry so internal links are correct *by construction*. 0 `arxiv.org/pdf` violations across 62 arxiv links.

## Findings

### Blockers

None. Nothing ships broken, harmful, or wrong in a way that fails the reader on load. This is the correct finding for a repo whose gates pass and whose content audit was genuinely closed — inflating a Major to a Blocker would cost the report its authority.

### Major

**M-01 · The runnable checker executes 237 blocks but asserts output on only 4 — 94 numeric claims are ungated** — `scripts/check-runnable-code.mjs` (~L159, L243–247); affects all 30 chapters
Evidence: The script runs ~234 blocks in real Pyodide and fails only if a block *throws*. Printed output is compared solely against the optional `expectedOutput={[...]}` attribute, which is present on **4 of 237 blocks**. Meanwhile the chapters carry **94 inline `# Observations:` / `# Expected` / `# =>` numeric claims** inside the code itself, none of which the checker parses. A block that narrates "attention entropy drops to 0.31" passes green while actually printing 1.9, as long as it doesn't raise.
Why it matters: This is exactly the prior audit's #1 CRITICAL theme (runnable output contradicting its own narration) — the class of defect the team hand-fixed across ~14 chapters — and it remains **structurally uncovered**. A one-character edit to a constant, a Pyodide/numpy version bump, or a copy-paste error will silently ship wrong numbers to readers while CI stays green and MAINTENANCE.md continues to report "no active remediation work remains." The gate that is supposed to protect the highest-risk surface is the one giving the most false confidence.
Fix: see task R-01.

**M-02 · Seven declared dependencies are unused; `mathjs` among them carries a high-severity CVE** — `package.json`, `context/TECH_STACK.md`
Evidence: `mathjs`, `d3` (+ `@types/d3`), `framer-motion`, `recharts`, `lucide-react`, `clsx`, and `tailwind-merge` produce **zero import statements anywhere in `src`** (verified: the only real library imports are `@codemirror/*`, `react`, `katex`, `minisearch`, `pyodide`, and `satori`/`resvg`/`wawoff2` in scripts). Charts are hand-rolled (`TrainingCurves.tsx` renders from its own `training-data.ts`, no recharts/d3); no `lucide` icon is used. `mathjs@^13` triggers `npm audit` **high**: GHSA-29qv-4j9f-fjw5 ("Unsafe object property setter"). `context/TECH_STACK.md`'s decision log actively justifies each of these ("D3 for bespoke widgets," "Recharts when a stock chart suffices," "lucide-react — one icon set") — so the documented stack and the real stack have diverged, and the divergence is carrying a needless advisory.
Why it matters: Dead dependencies inflate the install surface, mislead the next contributor about what the code uses, and — in `mathjs`'s case — attach a high-severity CVE to code that runs nowhere. Removing all seven makes the `npm audit` high finding disappear at zero functional cost.
Fix: see task R-02.

**M-03 · A failed Pyodide load permanently bricks every runnable until page reload** — `src/lib/pyodide.ts:61–72`
Evidence: The load promise is cached on `window.__pyodideLoading` and is **never reset on rejection** (no `__pyodideLoading = undefined/null` exists in the file; the only `catch` guards `runPython`, not the load path). If `cdn.jsdelivr.net` is momentarily unreachable on the reader's first "Run" click, the IIFE rejects; every subsequent Run — even after the network recovers — re-`await`s the same poisoned rejected promise and instantly fails. `RunnableCode` surfaces the error text but never tells the reader to reload, and the runtime is dead until they do.
Why it matters: Pyodide loads from a third-party CDN over a potentially flaky connection; a transient failure on first use is a realistic, common event, and its consequence is that the chapter's signature interactive feature is silently and permanently broken for that session with no recovery path shown.
Fix: see task R-03.

**M-04 · Ch20 states GPT-3's GSM8K direct-prompt score as ~5% and the CoT gain as "nine-fold" — both wrong, and it opens the chapter** — `src/pages/ch20-reasoning/index.mdx:24` and `:40`
Evidence: The chapter says GPT-3 on GSM8K "scores about **5%** with direct generation … chain-of-thought … reach roughly 46%, a **nine-fold improvement**," repeated in the summary at `:40`. Wei et al. 2022 (arxiv.org/abs/2201.11903), Table 2: GPT-3 175B standard prompting is **15.6%**, CoT **46.9%** — a ~3× gain, not 9×. The chapter's CoT figure (~46%) and its PaLM figures (17.9%→56.9%) are correct; only the GPT-3 *standard* baseline is wrong (5% looks like a confusion with LaMDA 137B's 6.5%).
Why it matters: This is load-bearing — it is the opening empirical hook for the entire reasoning chapter, and it is repeated. A reader who does the arithmetic (46.9 / 15.6 ≈ 3) will catch the internal inconsistency; a reader who trusts it carries away a wrong number about the single most-cited result in the CoT literature. It is also exactly the kind of confident quantitative error the book is otherwise excellent at avoiding.
Fix: see task R-04.

### Minor

**m-01 · Two load-bearing external citations return 404** — `src/pages/ch29-multi-agent/index.mdx:36`, `src/pages/ch02-embeddings/index.mdx:298`
Evidence: `anthropic.com/news/multi-agent-research-system` (the worked-example citation for Ch29) → 404; `papers.nips.cc/paper/2014/hash/feab05…Abstract.html` (Levy & Goldberg 2014, the SGNS-as-matrix-factorization source for Ch2) → 404. Verified replacements exist and return 200: `anthropic.com/engineering/multi-agent-research-system` and `papers.nips.cc/paper/5477-neural-word-embedding-as-implicit-matrix-factorization`.
Why it matters: Both are the primary source for a chapter's central example; readers who click hit a dead end on exactly the reference they'd most want. Fix: task R-05.

**m-02 · No CI gate for links, em dashes, or the arxiv `/abs` convention — these hold only by author discipline** — `scripts/check-content-integrity.mjs`
Evidence: The content checker guards 7 named classes (Phase-N leakage, same-page EqRef, an 8-topic landmark-citation allowlist, widget barrels, next-section teasers, cross-phase vocab) but validates no `href`/anchor, no external URL, not the CLAUDE.md "no em dashes" invariant, and not "/abs not /pdf." All three are clean *now* (0 em dashes, 0 /pdf) — but nothing enforces them, which is how the two dead links in m-01 shipped. The landmark check being an allowlist means any *other* miscited "(Chapter N)" passes silently. Fix: task R-06.

**m-03 · The widget-data regression check covers 3 of ~15 data modules** — `scripts/check-widget-data.mjs`
Evidence: Asserts internal consistency for only ch08 optimizer, ch09 Chinchilla, and ch11 MoE. Every other `*-data.ts` (ch04/05/06/07, ch09-parallelism, ch12/17/18/19, …) has zero coverage, and the check never verifies widget values against the surrounding prose. A numeric edit to any uncovered module can contradict its own chapter with no gate. Fix: task R-07.

**m-04 · No CSP or security headers, on a site that injects a third-party CDN script and renders raw HTML** — repo root (no `vercel.json`), `astro.config.mjs`
Evidence: Zero `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, or `Referrer-Policy`. The site injects `<script src="https://cdn.jsdelivr.net/…">` at runtime (`pyodide.ts:31`) and uses `dangerouslySetInnerHTML` (`SearchDialog.tsx:197`). No live exploit exists (the snippet path is properly escaped), so this is defense-in-depth, not an open hole — but a site that injects remote scripts and renders raw HTML is precisely the profile a CSP protects, and a *security-teaching* site (Ch24) modeling zero headers is a missed example. Rated Minor because the practical exposure on a static, escaped build is low. Fix: task R-08.

**m-05 · No ESLint/Prettier on ~44k LOC; a concrete leak is an unhandled `search()` rejection** — repo root; `src/components/search/SearchDialog.tsx:77–85`
Evidence: No `.eslintrc`/`.prettierrc`, no lint script. `astro check` catches type errors but not lint-class issues (`no-floating-promises`, `react-hooks/exhaustive-deps`). Concrete instance: the debounced search effect `await`s `search(query)` in `try { … } finally { setIsLoading(false) }` with **no `catch`**; if `/search-index.json` fetch rejects, it becomes an unhandled promise rejection and the spinner clears with no error state (`preloadIndex()` swallows the same failure silently). Fix: task R-09.

**m-06 · `related-chapters.ts` (144 hand-maintained slugs) has no referential-integrity gate** — `src/lib/related-chapters.ts`, consumed by `RelatedChapters.tsx:19–23`
Evidence: The component does `ALL_CHAPTERS.find(c => c.slug === r.slug)` and silently returns `null` on no match. `check-content-integrity.mjs` scans this file only for cross-phase vocabulary, not slug validity. A single typo or a chapter rename drops that related-chapter card with no build error — silent content loss no gate catches. Fix: task R-07 (same harness).

**m-07 · The signature Ch4 widget exposes per-cell values by mouse only, contradicting the claimed Lighthouse-a11y-100** — `src/components/widgets/ch04/AttentionHeatmap.tsx:227–240`
Evidence: Each matrix cell is a bare `<div>` with `onMouseEnter`/`title` and no `tabIndex`, `role`, or `onFocus`. The per-cell attention value — the widget's core detail — is unreachable by keyboard or screen reader. Lighthouse doesn't exercise hover-only content, so a "100" score coexists with this gap. The rest of the widget's a11y (labeled slider/buttons, aria-live) is good, so this is a localized fix. Fix: task R-10.

**m-08 · Two phantom dependencies: `@codemirror/commands` and `@codemirror/language` are imported but not declared** — `src/components/code/RunnableCode.tsx:5–6`
Evidence: Both are imported but neither is in `package.json` (only `@codemirror/lang-python`, `/state`, `/view`, and `codemirror` are). They resolve today because the `codemirror` meta-package depends on both and npm hoists them — verified. Rated Minor precisely because that guarantee holds; the real risk is a non-hoisting installer (pnpm) or independent version drift. Fix: task R-02 (same package.json pass).

**m-09 · Spec-vs-reality: the promised live Anthropic-API widgets were cut** — `context/PROJECT_OVERVIEW.md:243`, `context/TECH_STACK.md`
Evidence: The overview promises Ch21+ tool-use widgets that hit the Anthropic API with a reader-supplied key held in `localStorage`. Verified: **zero** `localStorage`/`fetch`/`anthropic` across all widgets; the Ch21 runnables use hardcoded `mock_model_response` dicts (`ch21:87,139`). A reader who read the overview expects live calls and gets mocks. This is a docs-accuracy problem, not a security one (there is no key-handling code to be unsafe). Fix: task R-11.

**m-10 · Large committed process-exhaust footprint, including a public catalog of the book's former errors** — `docs/`, `prompts/`, `research/`, `MASTER_PLAN.md`, `BUILD_ORDER.md`
Evidence: `prompts/` 110 files (4.1 MB), `research/` 30 files (1.1 MB), `docs/` 7 audit files (456 KB) — `CONTENT_CRITIQUE.md` alone is 388 KB / 55k words enumerating confidently-wrong states that are now fixed. All git-tracked and public. The README intentionally frames `prompts/` as an "archaeological record," so this is a judgment call, not a defect — but a cloner wades through 5 MB of process to reach the product, and `CONTENT_CRITIQUE.md` publicly documents the book's past mistakes with no "historical" marker. Fix: task R-12 (optional).

**m-11 · Residual dependency advisories (astro/esbuild/js-yaml) — informational** — `package.json`
Evidence: `npm audit` also flags `astro` (high, XSS/SSRF) but every advisory is SSR/`define:vars`/server-island gated; this is a fully static build, so real exposure is near-zero. `js-yaml` (moderate DoS), `esbuild` (dev-server, Windows), `@babel/core` (build-time file read) are similarly low-exposure. The `astro` fix is a breaking major (5→7) not worth forcing for a static site. Track, don't panic-upgrade. Fix: task R-13 (track only).

### Nits

- `src/components/widgets/index.ts` — a 62-line barrel imported nowhere (chapters import widgets directly, and `check-content-integrity.mjs` even *forbids* chapter-wide widget barrels); delete it.
- `src/pages/404.astro:5` passes no slug, so `SEO.astro` emits a canonical to the homepage and `robots: index,follow` for the not-found page; add a `noindex` path.
- `scripts/build-search-index.mjs:31` uses a local `slugify` that doesn't dedupe, while rendered ids come from `github-slugger` (`-1`/`-2` suffixes); a search hit on the second of two identically-named H2s deep-links to the first. Also segments by H2 only, so H3 sections aren't independently addressable.

## Claim verification

| # | Claim (quoted) | Location | Verdict | Source | Note |
|---|---|---|---|---|---|
| 1 | GPT-3 GSM8K "about 5%" direct, CoT "nine-fold improvement" | ch20:24,40 | **Wrong** | Wei 2022 Table 2 | Actual 15.6%→46.9% (~3×); 5% likely confused with LaMDA 6.5% |
| 2 | GLaM "roughly one-third the FLOPs" matching dense quality | ch11:281 | **Imprecise** | Du 2021 abstract | ⅓ training *energy*, ½ *inference* FLOPs; GLaM *exceeded* GPT-3 |
| 3 | Vera Rubin "announced at GTC 2026" | ch10:42 | **Likely wrong year** | NVIDIA Rubin reveal | First unveiled GTC 2025; para already hedges availability |
| 4 | Chinchilla E=1.69, A≈406, B≈410, α=0.34, β=0.28; ~20 tok/param is iso-FLOP | ch09:58,78 | Verified | Hoffmann 2022 | Nuance correctly hedged |
| 5 | RoPE=Su 2021, ALiBi=Press 2021, NTK=bloc97, YaRN=Peng 2023, PI=Chen 2023 | ch06 | Verified | arxiv abstracts | Community NTK attribution correct |
| 6 | Mixtral 8x7B 46.7B total / 12.9B active; DeepSeek-V3 671B / 37B | ch11:16,293 | Verified | model cards | |
| 7 | DeepSeek-V4 / GLM-5.2 / Kimi K2.6 mid-2026 rosters | ch11:295 | Verified | web (2026) | Date-stamped, hedged |
| 8 | DPO=Rafailov 2023, GRPO=Shao 2024, CAI=Bai 2022, Dr.GRPO=Liu 2025 | ch14 | Verified | papers | |
| 9 | PRM800K ~800K labels (Lightman 2023); Snell 2024 test-time compute | ch20:207,268 | Verified | papers | |
| 10 | SAEs Bricken 2023 / Templeton 2024; TransformerLens = Neel Nanda | ch25:14,368 | Verified | Anthropic; TransformerLens repo | |
| 11 | H100 989 TF BF16 / 1979 FP8; B200 ~9 PF FP4; Llama-3 405B ~31M H100-hrs, FP8 | ch10 | Verified | NVIDIA / Meta / DeepSeek | |
| 12 | BPE=Gage 1994/Sennrich 2015; WordPiece=Schuster & Nakajima 2012 | ch03:89,349 | Verified | arxiv / papers | Prior-audit fix confirmed |

Full detail and the ~15-claim methodology are in the workspace research log; the sample was chosen for maximum attribution/currency risk, so the near-clean result is meaningful calibration, not luck.

## Comparative analysis

The stated audience — a strong-Python, linear-algebra-comfortable reader who wants "the real thing" from numpy to agents — has four serious free alternatives, and the tutorial positions against them accurately in `PROJECT_OVERVIEW.md`.

**Karpathy's Zero-to-Hero / nanoGPT** is the canonical from-scratch transformer resource and is better than this tutorial on backprop intuition and the felt experience of building nanoGPT by hand, video-first. But it stops at the GPT-2 era and does not reach post-training, inference optimization, interpretability, or agents. **Sebastian Raschka's *Build an LLM from Scratch*** is the closest book-shaped competitor: seven chapters, PyTorch, meticulous — and confirmed by its own TOC to end at instruction fine-tuning + a LoRA appendix, with no RLHF/DPO/RLVR, MoE/Mamba, quantization, interpretability, multimodal, or agents. **Jay Alammar's illustrated guides** win decisively on visual intuition for a single concept but are not a course. **The HuggingFace NLP course / mlabonne's llm-course** are framework-led and applied — mlabonne is a roadmap of Colab notebooks, not a cohesive interactive textbook.

Where this tutorial beats all of them: **the back half.** Chapters 13–30 — SFT, the four alignment families (RLHF/DPO/GRPO/RLVR) with a DPO derivation, PEFT, distillation, inference optimization, quantization, sampling, reasoning/test-time-compute, tool use, RAG, multimodal, safety, interpretability, eval, and building an agent from scratch without LangChain — do not exist as one cohesive, current, *interactive* arc anywhere else that is free. The differentiated 20% is exactly this post-training-through-agents span delivered with in-browser runnable numpy and concept-specific widgets. That niche is real and, as of mid-2026, unoccupied. Where the alternatives still win: Karpathy on first-derivation intuition and Alammar on visuals — and the tutorial is right not to try to out-Karpathy Karpathy on backprop.

Patterns worth stealing from the field: Raschka ships a companion GitHub repo of standalone, runnable `.py` files per chapter (this tutorial's code lives only inside MDX and Pyodide); a parallel exported-code repo would let readers `git clone` the implementations. And Karpathy's habit of a single end-to-end capstone that threads all concepts is only partially realized here (Ch8 builds a small LLM; Ch28 builds an agent) — a stated "these two are the capstones, here's the thread" callout would sharpen the arc.

## Remediation plan

Execute top-to-bottom. Wave 1 fixes correctness and the false-confidence gap; Wave 2 clears the majors and dependency hygiene; Wave 3 is polish. Every task is written to be executed cold.

### Wave 1 — correctness & the gate that should have caught it

### R-01 · Make the runnable checker assert printed output, not just non-throwing  [L] deps: none
Files: `scripts/check-runnable-code.mjs`; touches chapter MDX only to add assertions.
Current: runs ~234 Pyodide blocks, fails only on throw; `expectedOutput` exists on 4/237 blocks; 94 inline `# Observations`/`# =>` numeric claims unparsed (finding M-01).
Desired: every runnable block that prints stdout is gated against a declared expected value; a mutated number fails the run.
Change sketch: extend the extractor to parse trailing `# Observations:` / `# => value` / `# Expected:` comment lines in each block's `defaultCode`, capture Pyodide stdout, and assert containment/numeric-equality with a tolerance. Where a block prints but declares nothing, fail with "block at ch:line emits output but declares no assertion." Print a coverage line: "N blocks print; M assert (M/N)."
Accept: `npm run check:runnables` prints an assertion-coverage count; editing one asserted constant in any chapter makes the run exit non-zero naming the block.

### R-04 · Fix the Ch20 GSM8K figures  [S] deps: none
Files: `src/pages/ch20-reasoning/index.mdx` (lines 24 and 40).
Current: "about 5%" direct and "nine-fold improvement" (finding M-04).
Desired: "about 16%" (15.6%) direct and "roughly a threefold improvement" (or "tripling"), both occurrences.
Change sketch: replace the two numbers and the "nine-fold" phrase; keep the correct ~46% CoT and PaLM 17.9%→56.9% figures.
Accept: `grep -n "nine-fold\|about 5%" src/pages/ch20-reasoning/index.mdx` returns nothing; the text's stated ratio (46.9/15.6 ≈ 3) is internally consistent.

### R-05 · Repair the two dead external citations  [S] deps: none
Files: `src/pages/ch29-multi-agent/index.mdx:36`, `src/pages/ch02-embeddings/index.mdx:298`.
Current: two 404 URLs (finding m-01).
Desired: `anthropic.com/engineering/multi-agent-research-system` and `papers.nips.cc/paper/5477-neural-word-embedding-as-implicit-matrix-factorization`.
Accept: `curl -sIL -o /dev/null -w '%{http_code}\n' <each-new-url>` returns 200.

### R-03 · Make a failed Pyodide load recoverable  [S] deps: none
Files: `src/lib/pyodide.ts` (~L61–72).
Current: rejected load promise cached on `window.__pyodideLoading`, never reset (finding M-03).
Desired: a subsequent Run after a transient failure retries a fresh load.
Change sketch: on the load IIFE, attach `.catch(err => { window.__pyodideLoading = undefined; throw err; })` before returning it (or try/catch in the async IIFE that nulls the cache on throw). Optionally, `RunnableCode` shows "retry" affordance on error.
Accept: unit test — stub `injectPyodideScript` to reject once then resolve; the second `getPyodide()` succeeds. Manual: throttle offline, Run fails; restore network, Run executes.

### Wave 2 — dependency hygiene, gate coverage, resilience

### R-02 · Remove unused deps and declare the phantom ones  [M] deps: none
Files: `package.json`, `context/TECH_STACK.md`.
Current: 7 unused runtime deps incl. high-CVE `mathjs`; 2 imported-but-undeclared `@codemirror/*` (findings M-02, m-08).
Desired: `mathjs`, `d3`, `@types/d3`, `framer-motion`, `recharts`, `lucide-react`, `clsx`, `tailwind-merge` removed; `@codemirror/commands` and `@codemirror/language` added with explicit `^6` versions; TECH_STACK decision log updated to describe the real (hand-rolled-charts, no-icon-lib) stack.
Change sketch: edit `package.json`, `npm install` to regenerate the lockfile, rebuild.
Accept: `for p in mathjs d3 framer-motion recharts lucide-react clsx tailwind-merge; do grep -rq "$p" src && echo "$p STILL USED"; done` prints nothing; `npm audit` no longer lists `mathjs`; both `@codemirror/commands` and `@codemirror/language` appear in `package.json`; `npm ci && npm run build` passes.

### R-06 · Add link + prose-invariant gates to `check:content`  [M] deps: none
Files: `scripts/check-content-integrity.mjs` (and/or a new `check-links.mjs`).
Current: no gate for hrefs/anchors, external URLs, em dashes, or arxiv `/abs` (finding m-02).
Desired: build fails on a dangling internal `#anchor`/`/slug`, an em dash in chapter prose, or an `arxiv.org/pdf/…` link.
Change sketch: use `github-slugger` (already a build dep via rehype-slug) to compute heading ids and resolve every internal href/anchor against on-disk pages; add two greps (em dash; `arxiv.org/pdf`). An offline external-liveness check can go behind a `--external` flag.
Accept: `npm run check:content` exits non-zero when a chapter is given an em dash, an `arxiv.org/pdf` link, or an `href="/chNN"` to a nonexistent slug; passes on the current tree after R-05.

### R-07 · Extend widget-data + related-chapters integrity checks  [M] deps: none
Files: `scripts/check-widget-data.mjs`.
Current: 3 of ~15 data modules covered; `related-chapters.ts` slugs unvalidated (findings m-03, m-06).
Desired: every `src/components/widgets/*/*-data.ts` loaded with at least finiteness + an invariant/monotonicity assertion; every `related-chapters.ts` slug asserted to exist in `ALL_CHAPTERS`.
Change sketch: glob the data modules, import each, assert; enumerate loaded modules in the pass line; add the slug-membership loop.
Accept: `npm run check:widgets` output lists every data module it loaded and the count equals `ls src/components/widgets/*/*-data.ts | wc -l`; a bogus slug in `related-chapters.ts` makes the check exit non-zero.

### R-09 · Add ESLint + Prettier and fix the unhandled search rejection  [M] deps: none
Files: new `eslint.config.js`, `.prettierrc`; `package.json` scripts; `src/components/search/SearchDialog.tsx`; `CLAUDE.md` gates list.
Current: no linter on 44k LOC; `search()` awaited with no `catch` (finding m-05).
Desired: `npm run lint` exists (with `@typescript-eslint`, `eslint-plugin-react-hooks`, `astro-eslint-parser`) and passes; the search effect has a `catch` that sets a visible "Search unavailable" state.
Accept: `npm run lint` passes; with `/search-index.json` forced to 500, the dialog shows an error message instead of an empty list.

### Wave 3 — polish

### R-08 · Add a CSP and security headers  [S] deps: none
Files: new `vercel.json`.
Current: no headers (finding m-04).
Desired: `Content-Security-Policy` (`script-src 'self' https://cdn.jsdelivr.net 'wasm-unsafe-eval'; worker-src blob:; frame-ancestors 'none'`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
Accept: `curl -sI https://<deployed-host>/ | grep -i content-security-policy` returns a policy; a `RunnableCode` widget still executes Python with no console CSP violation (Pyodide needs `wasm-unsafe-eval`).

### R-10 · Keyboard access for AttentionHeatmap cells  [S] deps: none
Files: `src/components/widgets/ch04/AttentionHeatmap.tsx` (~L227–240).
Current: cells are mouse-only (finding m-07).
Desired: each cell focusable (`tabIndex={0}`), `aria-label` per cell (e.g. `"X[0,2] = 0.153"`), `onFocus` mirroring `onMouseEnter` so keyboard focus reveals the readout.
Accept: Tab into the heatmap, move across cells, confirm the readout updates on focus and a screen reader announces each cell's coordinates and value.

### R-11 · Reconcile the live-API-widget promise with reality  [S] deps: none
Files: `context/PROJECT_OVERVIEW.md` (~L243), `context/TECH_STACK.md`.
Current: docs promise reader-supplied-key live Anthropic-API widgets that were never shipped (finding m-09).
Desired: the docs state that Ch21+ runnables are Pyodide-only and use illustrative mocked responses, and that the JS-bridge live-API capability was cut (or mark those lines as unshipped).
Accept: no doc claims a live Anthropic API call in any widget; `grep -rn "localStorage\|anthropic" src/components/widgets` still returns nothing (i.e., the docs now match the code).

### R-12 · (optional) Tidy the process-exhaust footprint  [S] deps: none  needs-design
Files: `docs/*`, `MASTER_PLAN.md`, `BUILD_ORDER.md`, README.
Open question for the maintainer: keep the "archaeological record" in-repo as-is (intentional per README), or move the completed-audit docs under `docs/archive/` with a one-line "historical — superseded by MAINTENANCE.md" header so a cloner isn't misled by `CONTENT_CRITIQUE.md`'s catalog of former errors. Skip if the in-repo record is a deliberate teaching artifact.
Accept: maintainer decision recorded; if archived, `docs/` top level contains only currently-true documents.

### R-13 · Track (do not force) residual advisories  [S] deps: none
Files: none (tracking).
Current: astro/esbuild/js-yaml/@babel advisories, all low-exposure on a static build (finding m-11). Note in MAINTENANCE.md that the `astro` 5→7 upgrade is deferred (breaking, near-zero static exposure) and revisit when a non-breaking fix lands.
Accept: MAINTENANCE.md records the deferral rationale.

### Nits (batch, one commit)
Delete `src/components/widgets/index.ts`; add `noindex` + drop the homepage canonical on `404.astro`; switch `build-search-index.mjs` to `github-slugger`. Accept: `rm` + `npm run typecheck && npm run build` pass; built `dist/404.html` has `noindex` and no `/` canonical; a duplicate-H2 chapter's index anchors match the built ids.

## Appendix

**Coverage.**
- *Read in full:* `README.md`, `CLAUDE.md`, `context/PROJECT_OVERVIEW.md`, `context/TECH_STACK.md`, `docs/MAINTENANCE.md`, `docs/CONTENT_CRITIQUE.md` (verdict + cross-cutting themes + quickest-wins), `src/lib/pyodide.ts`, `src/lib/chapters.ts`, `src/components/search/search-client.ts`, `scripts/build-search-index.mjs`, `src/pages/ch04-attention/index.mdx` (full), and the four cited chapters at the exact finding lines.
- *Sampled deeply (via subagents):* code/frontend layer (`src/components/{code,search,nav,content,a11y,seo}`, `src/lib`, ~8 widgets); technical accuracy of ch03/06/09/10/11/14/17/20/25 with web verification of ~15 claims; link integrity across all 118 source files and 71 external URLs; all four build scripts.
- *Sampled shallowly / by grep:* the remaining ~21 chapters' prose (tic/em-dash/forbidden-phrase counts across all 30), the other ~55 widget `.tsx` files, `prompts/` and `research/` (footprint only).
- *Not independently re-verified:* the prior audit's full per-chapter runnable/widget closure for all 30 chapters (spot-checked ~8 quickest-wins, all fixed) — see confidence note.

**Method.** Commands and exit codes: `npm run check:content` (0), `check:runnables` (0, 114 demos + 120 exercises + 3 static), `check:widgets` (0), `typecheck`/`astro check` (0 errors/0 warnings/0 hints), `npm run build` (0, 33 pages, 13.0s, dist 17 MB), `npm audit` (mathjs high; astro/esbuild/js-yaml/@babel), `npm outdated`. Inventory via `scripts/inventory.py`: 478 files, 12.4 MB, 189,795 lines, ~1.03M words in 186 docs, 172 commits (2026-05-22 → 2026-07-16). Web searches: ~25 (claim verification + comparative scan), logged in the workspace research log. Three parallel subagents (code, accuracy, links) returned findings in the standard format; all findings above were reconciled against source before inclusion.

**Confidence notes.**
- The runnable-output-drift risk (M-01) is asserted at high confidence about the *checker's coverage* (4/237 asserted, verified by reading the script), and at medium confidence that undetected drift *currently exists* — the prior audit fixed the known instances and the gates pass, so the finding is about the absent guardrail, not a proven live wrong number beyond M-04.
- The "seven unused deps" claim (M-02) was verified by exhaustive grep for import statements across `src` and `scripts`; confidence high. Charts-are-hand-rolled confirmed by reading `TrainingCurves.tsx`.
- Severity of m-04 (CSP) is deliberately held at Minor despite a subagent arguing Major: on a static, output-escaped build there is no live exploit, and inflating it would miscalibrate the ladder.
- Runtime behavior of M-03 (Pyodide poisoning) is asserted from reading the singleton logic, not from reproducing a CDN outage; the code path is unambiguous but the fix should still be validated with the offline test in R-03.

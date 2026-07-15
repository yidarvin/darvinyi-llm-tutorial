# MASTER_PLAN

**darvinyi-llm-tutorial** · the roadmap and decisions log

> **Historical build record, completed 2026-07-15.** The project now uses the Codex workflow in
> [`docs/CODEX_WORKFLOW.md`](docs/CODEX_WORKFLOW.md) and the rules in [`AGENTS.md`](AGENTS.md).
> References below to the prior build environment describe how the shipped textbook was made; they are not
> instructions for current work.

> This file is the project's 30,000-foot view: what we're building, in what sequence, with what locked decisions. It does NOT duplicate the four context files (`PROJECT_OVERVIEW.md`, `DESIGN_SYSTEM.md`, `TECH_STACK.md`, `CURRICULUM.md`) — it points to them and frames their relationship.

---

## The pitch

A comprehensive LLM tutorial that takes a technically-prepared reader from numpy primitives to building modern agent frameworks. **30 chapters, 9 parts, ~170 build sessions, one live site at `llm-tutorial.darvinyi.com`.**

What makes this distinct: comprehensive scope (numpy → agents), current topics (RLVR, R1, Mamba-2, modern MoE, mechanistic interpretability), and medium interactivity (40–50 widgets that visualize what static figures can't). Sibling to `textbook.darvinyi.com` — shared design language, distinct subject matter.

---

## Where the work lives

```
darvinyi-llm-tutorial/
├── MASTER_PLAN.md              ← this file (the roadmap)
├── BUILD_ORDER.md              ← every file in build order; the project's worklist
├── README.md                   ← public-facing project README (created in session 01)
├── context/                    ← read by every Claude Code session
│   ├── PROJECT_OVERVIEW.md     ← tone, voice, audience, identity
│   ├── DESIGN_SYSTEM.md        ← visual foundation, components, accessibility
│   ├── TECH_STACK.md           ← frameworks, versions, configs, conventions
│   └── CURRICULUM.md           ← 30-chapter spec; source of truth for content
├── prompts/                    ← Claude Code session prompts (the build instructions)
│   ├── scaffolding/            ← 6 prompts for site infrastructure
│   ├── chapters/               ← per-chapter prompts (130 total)
│   │   └── chNN-slug/
│   └── polish/                 ← 6 prompts for final QA
├── research/                   ← per-chapter pre-research, read by chapter sessions
│   └── chNN-slug/
│       └── research.md
├── src/                        ← the Astro app
├── public/
└── package.json
```

Everything outside `src/` and `public/` is build-time documentation that ships nowhere but lives in the repo. The Astro build only processes `src/pages/`; the rest is for human and AI authors of the site.

---

## Reading order for new sessions

If you (Claude Code, or a future human collaborator) are picking up this project, read in this order:

1. **`MASTER_PLAN.md`** (this file) — get the shape
2. **`BUILD_ORDER.md`** — see exactly what's done and what's next
3. **`context/PROJECT_OVERVIEW.md`** — tone, voice, audience
4. **`context/DESIGN_SYSTEM.md`** — visual contracts
5. **`context/TECH_STACK.md`** — engineering decisions
6. **`context/CURRICULUM.md`** — focus on your assigned chapter, skim adjacent chapters for context
7. **`research/chNN-slug/research.md`** if working on a chapter — the curated research material
8. **Your assigned session prompt** in `prompts/`

Every chapter session reads context files 3–6 explicitly. Every chapter session involving content also reads its research file.

---

## Build phases

The project follows 13 phases. Each phase ends at a natural commit point. Three phases have hard validation gates where we hand work to Claude Code and confirm before continuing.

| Phase | Files | Description |
|---|---|---|
| **0** — Reset | 0 | Clear outdated artifacts (already done) |
| **1** — Foundation | 5 | Context files + this plan; the "what and why" of the whole project |
| **2** — Scaffolding prompts | 6 | Repo init → design system → MDX pipeline → layout → Pyodide → deploy |
| **3** — Chapter 1 end-to-end | 5 | Pre-research + 4 chapter sessions for Ch 1 |
| **4** — Part I remaining | 9 | Ch 2 + Ch 3 |
| **5** — Part II: Transformer | 17 | Ch 4–6 (attention, multi-head + block, position) |
| **6** — Part III: Pre-training | 22 | Ch 7–10 (data, small LLM, scaling, infra) |
| **7** — Part IV: Alt architectures | 10 | Ch 11–12 (MoE, Mamba) |
| **8** — Part V: Post-training | 23 | Ch 12 finish + Ch 13–16 (SFT, alignment, PEFT, distillation) |
| **9** — Part VI: Inference | 15 | Ch 17–19 (KV/Flash, quantization, sampling) |
| **10** — Part VII: Capabilities | 22 | Ch 20–23 (reasoning, tools, RAG, multimodal) |
| **11** — Part VIII: Safety/Interp/Eval | 15 | Ch 24–26 |
| **12** — Part IX: Agents | 22 | Ch 27–30 (foundations, harness, multi-agent, eval) |
| **13** — Polish & QA | 6 | Cross-chapter linking, search, mobile, a11y, perf, social meta |

**Total: 177 files.** See `BUILD_ORDER.md` for the per-file listing.

---

## Validation pause points

Three hard checkpoints. At each, we stop generating prompts, commit work, and either build via Claude Code or review what we've produced before continuing.

### Checkpoint A — End of Phase 1 (foundation locked)

After: `MASTER_PLAN.md` + 4 context files exist.

- Commit all 5 files to `git`
- Review for tone, completeness, and internal consistency
- If anything is off, fix here before any session prompt is written

### Checkpoint B — End of Phase 2 (scaffolding prompts ready)

After: 6 scaffolding session prompts exist.

- Commit all 6 to `git`
- Hand sessions 01–06 to Claude Code, run them sequentially
- After session 06, the site is live at `llm-tutorial.darvinyi.com` with empty landing
- Verify deployment is working before any chapter work begins

### Checkpoint C — End of Phase 3 (Chapter 1 end-to-end)

After: Ch 1 research file + 4 chapter session prompts exist.

- Commit
- Hand to Claude Code: build Ch 1 end-to-end via sessions 07–10
- Inspect the built chapter on the live site
- **If the chapter is good, the pattern is locked and we scale.** If not, tune the prompt template and re-run before scaling to 29 more chapters.

After Checkpoint C, the rhythm settles: ~5 files per chapter (1 research + 3–6 sessions), one file per chat message, with commits between chapters.

---

## Locked decisions log

What's been decided, in chronological order, with the reasoning.

### Strategic

- **Project shape** — 30 chapters, 9 parts, comprehensive scope from numpy primitives to agent frameworks. Locked early because session count and curriculum coherence depend on it.
- **Sibling positioning** — distinct from `textbook.darvinyi.com` (which is broader / more academic). LLM tutorial is engineering-flavored, technically deeper on its narrower topic.
- **Reading model** — linear-first; the site supports lookup but doesn't optimize for randomized order. Each chapter assumes mastery of preceding chapters.

### Pedagogical

- **Numpy first, PyTorch second** — early chapters implement everything in numpy to make operations visible; PyTorch shows production form. The boundary shifts around Ch 8–10.
- **Math is shown, not hidden** — KaTeX-rendered derivations where math is non-obvious. Custom macros (`\softmax`, `\attn`, etc.) standardized in `astro.config.mjs`.
- **Runnable code earns its place** — Pyodide blocks only when execution teaches something reading doesn't.
- **Interactivity has a budget** — 1–2 widgets per chapter. No gamification.
- **Honest about open questions** — explicit treatment of contested topics (alignment, interpretability, eval methodology).
- **Pre-research per chapter** — every chapter has a `research/chNN-slug/research.md` file curated before chapter content is generated.

### Engineering

- **Astro 5 + MDX + React 18 islands** — content-first; ships zero JS by default; React only mounts where placed.
  - Considered: Next.js (too heavy, App Router buys nothing here), Docusaurus (opinionated; fighting it for design system), VitePress (Vue), plain SPA (would reinvent SSG).
- **Tailwind 3 (not 4)** — Tailwind 4's CSS-based config conflicts with our token-mapping pattern in `tailwind.config.mjs`. Stay on 3.x.
- **React 18 (not 19)** — React 19 is stable but adds no features this project needs; 18 has fuller ecosystem maturity.
- **CodeMirror 6 (not Monaco)** — lighter, sufficient for the Python editing context.
- **Pyodide (not Skulpt/Brython/server-side)** — only Pyodide runs real numpy in browser. Lazy-loaded singleton; CDN exception documented.
- **Shiki for code highlighting** — server-rendered, no client JS.
- **Pagefind for search** — static-site-friendly, self-hosted, no API limits.
- **Vercel for deploy** — first-class Astro target; auto-deploys on `main` push.
- **D3 + Recharts (both)** — D3 for bespoke widgets, Recharts when a stock chart suffices.
- **No CDN dependencies for fonts or icons** — self-hosted Inter, JetBrains Mono, KaTeX fonts. Pyodide CDN is the one documented exception.

### Visual

- **Dark mode only** — no light mode toggle. Aesthetic choice; readers can use browser inverted-colors if needed.
- **Cyan `#06b6d4` as the single accent** — visually distinct from `textbook.darvinyi.com` (teal `#2dd4bf`). Used as a precision instrument, never as a background fill.
- **Inter throughout (no Crimson Pro)** — engineering-flavored stack distinguishes this site from the textbook.
- **No emoji, gradients, glassmorphism, or drop shadows** beyond the single radial-glow effect. Sparse, technical aesthetic.

### Workflow

- **One file per Claude chat message** — every artifact (context file, prompt, research file) gets a focused message. Prevents the rushed-batching failure mode from earlier attempts.
- **`BUILD_ORDER.md` as the canonical worklist** — the file maintained as ⬜ → ✅ as each artifact is created. Single source of truth on progress.
- **Validation checkpoints (A, B, C above)** — explicit pauses where the rhythm slows and we verify before continuing.
- **No Notion or external tooling for this project** — everything lives in the repo (intentionally distinct from other Darvin projects that lean on Notion).

### Privacy & ethics

- **No analytics beyond Vercel's built-in** — no GA, no Plausible, no email capture.
- **API keys held client-side only** — tool-use chapters (Ch 21+) require the reader to supply their own Anthropic API key; stored in `localStorage`, never sent to any server we control.
- **Cite respectfully** — competing free resources (Karpathy, Raschka, Weng, Alammar) are linked and credited, never dismissed.

### Decisions deferred / considered but not yet resolved

- **Comment system** — none planned; could add Giscus or similar if reader feedback becomes desirable. Default: don't add.
- **Newsletter** — explicitly not doing. Stance: the reader is the user, not the product.
- **RSS feed** — possibly worth adding in Phase 13 polish. Trivial with `@astrojs/rss`.
- **i18n / translation** — not in scope. The audience reads English.
- **Mobile-first content** — secondary. Reading dense technical material on phone is suboptimal regardless of what we do. Mobile pass in Phase 13 ensures the site is *usable* on mobile but optimized for desktop.

---

## Session structure pattern

Every Claude Code session prompt — scaffolding, chapter, or polish — follows the same shape. This consistency is what makes the build scale.

```markdown
# Session NN — [Title]

## Read first
- (relevant context files)
- (relevant research file, for chapter sessions)
- (prerequisite sessions, if any)

## Goal
One paragraph. What this session accomplishes; what "done" looks like.

## Inputs
What to assume exists. The state of the repo before this session runs.

## Deliverables
Exact files to create or modify. Specific paths.

## Detailed spec
The actual instructions. Often the longest section.
Code samples for components / configs. Specific contracts for any reusable code.

## Acceptance criteria
Verifiable conditions. "npm run dev shows X." "The page renders Y."
Anything that's testable goes here, not in the spec.

## Out of scope
What NOT to do in this session. Prevents Claude Code from over-reaching into the next session's territory.

## Wire-up
The commit message, the `git add`, the `git push`. The exact next steps after the work is done.
```

Sessions are isolated. A session can be run by a Claude Code instance with no memory of previous sessions, given only:
- The session prompt
- Context files
- The current state of the repo

This is the scaling principle: every session is self-contained.

---

## Naming conventions

### Chapter folders

`chNN-short-slug` — two-digit chapter number, hyphenated short slug.

✅ `ch01-neural-net-primitives`, `ch14-alignment`, `ch28-agent-from-scratch`
❌ `chapter-1-mlps`, `ch14-rlhf-dpo-rlvr-cai`, `ch_01_neural_nets`

### Session prompt files

`session-NN-short-slug.md` — globally-unique two-digit session number, hyphenated slug.

✅ `session-07-page-structure.md`, `session-64-dpo-loss-landscape.md`
❌ `chapter-1-session-1.md`, `session-7-mlp.md`, `session_07_page_structure.md`

Session numbers are global, not per-chapter. Sessions 01–06 are scaffolding; 07–136 are chapter sessions; 137–142 are polish.

### Research files

Always `research.md` inside `research/chNN-slug/`.

✅ `research/ch01-neural-net-primitives/research.md`
❌ `research/ch01/notes.md`, `research/chapter-1.md`

### React components

PascalCase, descriptive enough that the file name tells you what it is.

✅ `AttentionHeatmap.tsx`, `TokenizerPlayground.tsx`, `MoERoutingVisualizer.tsx`
❌ `Widget.tsx`, `Chart.tsx`, `Interactive.tsx`

### Page routes

Chapter pages use the chapter slug as the URL: `/ch01-neural-net-primitives/`.

Internal links are absolute from site root, never relative between chapters.

---

## Quality bar

The tutorial is "done" when:

### Content
- All 30 chapters published, every chapter passing the per-chapter acceptance criteria in its `CURRICULUM.md` entry
- Every chapter has a working widget (or widgets) and runnable code where specified
- Cross-chapter references resolve to correct anchors
- Equation labels are consistent and `<EqRef>` works site-wide
- No "TODO" or placeholder content remains

### Engineering
- `npm run build` completes cleanly
- `npm run typecheck` passes with zero errors
- First-Load JS: < 30 KB on prose-only chapters; < 120 KB with two widgets
- LCP < 1.5s desktop, < 3.0s mobile
- Lighthouse Performance > 95 desktop, > 85 mobile
- Lighthouse Accessibility = 100 (hard requirement)
- Pagefind indexes all content; search returns reasonable results for chapter topics

### Reader experience
- Linear reading works: every chapter's prev/next nav points correctly
- Sidebar shows current chapter active; prior chapters look "read"
- Mobile: hamburger nav opens cleanly; chapter content is readable at 375px
- Dark mode is consistent; no light-mode bleed-through from defaults
- Keyboard navigation works for all widgets

### Maintainability
- `BUILD_ORDER.md` is fully ✅; matches reality
- Every chapter's research file exists and is non-trivial
- Per-session prompts are kept (in `prompts/`) as the build's archaeological record
- No silent extensions to the design system; visual decisions trace back to `DESIGN_SYSTEM.md`

---

## Risks and mitigations

Known risks to the project and what we do about them.

### Risk: chapter drift across 30 chapters

Different chapter sessions could produce subtly different tone, terminology, visual treatment.

**Mitigation:** the four context files set tight contracts that every session reads. Tone-calibration examples in `PROJECT_OVERVIEW.md` are explicit. Component contracts in `DESIGN_SYSTEM.md` are exhaustive. If a chapter session encounters something not covered, it surfaces an open question rather than improvising.

### Risk: rushed session prompts that compress multiple widgets or skip detail

This was the failure mode of earlier attempts.

**Mitigation:** one file per chat message. Every session prompt gets the full attention of a focused message. Validation checkpoints A/B/C force review pauses.

### Risk: outdated information on fast-moving topics

RLVR, R1, Mamba-2, MoE designs — these change quickly.

**Mitigation:** per-chapter research files are explicit about citations with arxiv IDs and dates. Future maintenance updates the research file, then re-runs the chapter's sessions. The architecture supports this.

### Risk: scope creep

A chapter session decides Chapter X "should really also cover Y."

**Mitigation:** `CURRICULUM.md` is the locked source of truth. Adding scope requires updating `CURRICULUM.md` first, in its own dedicated session. Sessions never silently expand scope.

### Risk: Pyodide breaks the JS budget

Pyodide's runtime is ~10MB. Loaded wrong, it kills page-load performance.

**Mitigation:** the singleton pattern in `src/lib/pyodide.ts` is dynamic-import only. `vite.optimizeDeps.exclude: ['pyodide']` in `astro.config.mjs` is non-negotiable. `<RunnableCode>` only triggers load on Run-button click. Performance budget enforced via Lighthouse in Phase 13.

### Risk: build complexity for the reader who wants to fork

If the local dev experience is fragile, contributions are unlikely.

**Mitigation:** stack is minimal (Astro + MDX + React + Tailwind + TS). No exotic build tools. `npm run dev` is the only command for development. Documented in `README.md`.

### Risk: agent-related chapters (Ch 21, 27–30) need API access

Reader must provide their own Anthropic API key for tool-use and agent widgets.

**Mitigation:** explicit in `PROJECT_OVERVIEW.md` and in the relevant chapter prose. Key handling is client-side `localStorage` only; never sent to a server we control. Documented in the widget UI itself.

---

## Pointers — where to find what

| Question | Where it's answered |
|---|---|
| What's the tone? What's the audience? | `context/PROJECT_OVERVIEW.md` |
| What color is X? How are equations rendered? | `context/DESIGN_SYSTEM.md` |
| What library should I install? What version? | `context/TECH_STACK.md` |
| What does Chapter X cover? What papers does it cite? | `context/CURRICULUM.md` |
| What's the next file to create? | `BUILD_ORDER.md` |
| What was decided about X? | This file (decisions log section) |
| What's the project's overall arc? | This file (build phases section) |
| How does a Claude Code session work? | This file (session structure pattern section) |
| What's the visual identity? | `context/DESIGN_SYSTEM.md` |
| How does the agent harness work? | `prompts/chapters/ch28-agent-from-scratch/...` (when written) |
| What's in research/chXX/? | Always `research.md`; scope defined in `CURRICULUM.md` per chapter |

When a question isn't answered by any of these, it's an open question — surface it in the session output rather than guessing.

---

## Open questions held for later

Things known to need a decision but not blocking right now:

- **Comment system** — Giscus or none. Default: none.
- **RSS feed** — likely yes, in Phase 13. Trivial.
- **OG image generation** — Phase 13. Need a per-chapter title-card template.
- **Translation / i18n** — out of scope for v1.
- **Newsletter** — explicit no.
- **"What's new" / changelog page** — possibly. Decide when there's a "what" to be "new."
- **Citation export** — could offer BibTeX export for cited papers. Low priority.
- **Print stylesheet** — not planned. Dark-mode-only tutorial doesn't print well; accept this.

These are not gating any current work. They become real decisions when their chapter or polish session arrives.

---

## The cadence going forward

After this file, the foundation is locked. From here, the rhythm is:

1. **`continue to the next file`** triggers the next ⬜ in `BUILD_ORDER.md`
2. Each file gets a focused chat message with full context budget
3. After Phase 2 (scaffolding) completes: pause, hand to Claude Code, deploy
4. After Phase 3 (Ch 1) completes: pause, hand to Claude Code, validate the chapter pattern
5. Continue through Phases 4–13 with steady cadence; Claude Code catches up in batches as we go

Reasonable estimate: 30–60 minutes per file in focused mode; 177 files total → significant calendar time but each piece individually small. The whole thing scales by the steady rhythm, not by sprints.

If the project succeeds, the reader who starts at Chapter 1 and finishes Chapter 30 has gone from "I've seen neural networks" to "I can build an LLM agent system from first principles." That's the only thing that matters.

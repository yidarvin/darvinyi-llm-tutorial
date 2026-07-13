#!/usr/bin/env node
// Content integrity guard.
//
// Catches three defect classes surfaced by the 2026-07 content critique
// (docs/CONTENT_CRITIQUE.md):
//
//   1. Internal build-process "Phase N" labels leaking into reader-facing
//      prose, headings, or frontmatter descriptions. The reader-facing
//      structure is "Part I"-"Part IX" (see src/lib/chapters.ts); "Phase N"
//      is BUILD_ORDER.md's internal session-planning vocabulary and means
//      nothing to a reader.
//   2. Dangling <EqRef id="X.Y" /> references: EqRef always renders a
//      same-page anchor (#eq-X.Y), so a cross-chapter EqRef silently links
//      to nothing. Every EqRef must have a matching <Equation label="X.Y">
//      on the SAME page.
//   3. A small set of known single-chapter "landmark" topics cited via the
//      "(Chapter N)" parenthetical pattern, checked against the chapter
//      that actually owns the topic. This is how ch04 ended up citing the
//      transformer block as "Chapter 7" (it's Chapter 5) and state-space
//      models as "Chapter 11" (they're Chapter 12) — both inherited from a
//      superseded chapter-numbering draft and never caught before ship.
//
// Run: node scripts/check-content-integrity.mjs

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const PAGES_DIR = join(ROOT, 'src/pages');

/** @type {string[]} */
const failures = [];

const chapterDirs = readdirSync(PAGES_DIR)
  .filter((d) => /^ch\d{2}-/.test(d))
  .sort();

// Topic -> the one chapter number that owns it, keyed to a regex that only
// matches this book's "<topic phrase> ... (Chapter N)" citation style, so it
// won't false-positive on ordinary topic mentions that aren't citing a chapter.
const LANDMARK_ANCHORS = [
  { topic: 'the transformer block', chapter: 5, re: /transformer block[^.(]{0,40}\(Chapter\s+(\d+)\)/gi },
  { topic: 'state-space models / Mamba', chapter: 12, re: /(?:state-space models?|Mamba)[^.(]{0,60}\(Chapter\s+(\d+)\)/gi },
  { topic: 'Mixture of Experts', chapter: 11, re: /Mixture of Experts[^.(]{0,40}\(Chapter\s+(\d+)\)/gi },
  { topic: 'Rotary Position(al) Embedding / RoPE', chapter: 6, re: /\bRoPE\b[^.(]{0,40}\(Chapter\s+(\d+)\)/gi },
  // Excludes "KV cache quantization", a compound topic legitimately covered in Chapter 18.
  { topic: 'the KV cache', chapter: 17, re: /KV cache(?!\s+quantization)[^.(]{0,40}\(Chapter\s+(\d+)\)/gi },
  { topic: 'quantization', chapter: 18, re: /\bquantization\b[^.(]{0,40}\(Chapter\s+(\d+)\)/gi },
  { topic: 'LoRA', chapter: 15, re: /\bLoRA\b[^.(]{0,40}\(Chapter\s+(\d+)\)/gi },
  { topic: 'distillation', chapter: 16, re: /\bdistillation\b[^.(]{0,40}\(Chapter\s+(\d+)\)/gi },
];

for (const dir of chapterDirs) {
  const mdxPath = join(PAGES_DIR, dir, 'index.mdx');
  if (!existsSync(mdxPath)) continue;
  const text = readFileSync(mdxPath, 'utf8');
  const lines = text.split('\n');

  // Check 1: no "Phase N" leakage.
  lines.forEach((line, i) => {
    const m = line.match(/\bPhase\s+\d+\b/);
    if (m) {
      failures.push(
        `${dir}/index.mdx:${i + 1}: internal "Phase N" label leaked into reader content: "${m[0]}"`
      );
    }
  });

  // Check 2: every EqRef must resolve to an Equation label on the same page.
  const definedLabels = new Set(
    [...text.matchAll(/<Equation\s+label="([^"]+)"/g)].map((m) => m[1])
  );
  for (const m of text.matchAll(/<EqRef\s+id="([^"]+)"/g)) {
    if (!definedLabels.has(m[1])) {
      failures.push(
        `${dir}/index.mdx: <EqRef id="${m[1]}" /> has no matching <Equation label="${m[1]}"> on this page (EqRef only supports same-page anchors — cross-chapter references must use prose, not EqRef)`
      );
    }
  }

  // Check 3: landmark-topic chapter citations must point at the owning chapter.
  for (const { topic, chapter, re } of LANDMARK_ANCHORS) {
    for (const m of text.matchAll(re)) {
      const cited = parseInt(m[1], 10);
      if (cited !== chapter) {
        const lineNum = text.slice(0, m.index).split('\n').length;
        failures.push(
          `${dir}/index.mdx:${lineNum}: cites "${topic}" as Chapter ${cited}, but it is Chapter ${chapter} — "${m[0]}"`
        );
      }
    }
  }
}

if (failures.length) {
  console.error(
    `Content integrity check FAILED (${failures.length} issue${failures.length === 1 ? '' : 's'}):\n`
  );
  failures.forEach((f) => console.error('  - ' + f));
  process.exit(1);
} else {
  console.log(
    `Content integrity check passed: ${chapterDirs.length} chapters, no Phase-N leakage, no dangling EqRefs, no landmark-anchor mismatches.`
  );
}

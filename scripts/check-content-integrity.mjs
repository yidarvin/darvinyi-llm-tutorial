#!/usr/bin/env node
// Content integrity guard.
//
// Catches six defect classes surfaced by the 2026-07 content critique
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
//   4. A chapter importing the `@components/widgets` barrel. Astro then
//      retains every widget in a shared client chunk, even though a chapter
//      renders only its own one or two widgets. Chapters must import their
//      widget islands directly so Rollup can emit page-specific chunks.
//   5. Same "Phase N" leakage as (1), but anywhere else under src/ — the
//      original Phase-N purge only swept src/pages/ch*/index.mdx. It missed
//      widget .tsx/.ts files with reader-facing captions or "echoes Phase N
//      conventions"-style code comments, AND it missed src/lib/related-
//      chapters.ts, where a `RelationshipType` union member was literally
//      named 'cross-phase' and rendered to readers as "cross-phase link" —
//      the same internal vocabulary leaking through a TypeScript literal
//      instead of prose. Check 6 below catches that specific compound-word
//      pattern, which a numeric "Phase N" regex can't (there's no number).
//   6. The "cross-phase" compound specifically, which the numeric check
//      above cannot catch because it has no number.
//
// Run: node scripts/check-content-integrity.mjs

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const PAGES_DIR = join(ROOT, 'src/pages');
const SRC_DIR = join(ROOT, 'src');

function walk(dir, extensions) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full, extensions));
    else if (extensions.some((ext) => entry.endsWith(ext))) out.push(full);
  }
  return out;
}

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

  // Check 4: chapter widgets must be direct imports, not the all-widgets barrel.
  // Direct paths such as @components/widgets/ch04/AttentionHeatmap are allowed.
  const barrelImport = /from\s+['"]@components\/widgets['"]/.exec(text);
  if (barrelImport) {
    const lineNum = text.slice(0, barrelImport.index).split('\n').length;
    failures.push(
      `${dir}/index.mdx:${lineNum}: imports the @components/widgets barrel; import each chapter widget directly so it can remain a page-specific client chunk`
    );
  }
}

// Check 5 + 6: everywhere else under src/ (components, lib, layouts, pages'
// own frontmatter is already covered by Check 1, so this walks all of src/
// and just skips src/pages/*/index.mdx to avoid double-reporting).
const allSrcFiles = walk(SRC_DIR, ['.tsx', '.ts', '.astro']).filter(
  (f) => !/src\/pages\/ch\d{2}-[^/]+\/index\.mdx?$/.test(f.replace(/\\/g, '/'))
);
for (const filePath of allSrcFiles) {
  const text = readFileSync(filePath, 'utf8');
  const rel = relative(ROOT, filePath);

  // Check 5: numeric "Phase N" leakage (same pattern as Check 1, wider scope).
  text.split('\n').forEach((line, i) => {
    const m = line.match(/\bPhase\s+\d+\b/);
    if (m) {
      failures.push(`${rel}:${i + 1}: internal "Phase N" label leaked into source: "${m[0]}"`);
    }
  });

  // Check 6: the "cross-phase" compound specifically (no number, so Check 5
  // can't catch it) — this exact pattern leaked through a TypeScript
  // RelationshipType literal in src/lib/related-chapters.ts. Case-insensitive
  // since it could appear as a string literal, object key, or CSS-ish token.
  text.split('\n').forEach((line, i) => {
    if (/cross-phase/i.test(line)) {
      failures.push(`${rel}:${i + 1}: internal "cross-phase" vocabulary leaked into source (rename to "cross-part"): "${line.trim()}"`);
    }
  });
}

if (failures.length) {
  console.error(
    `Content integrity check FAILED (${failures.length} issue${failures.length === 1 ? '' : 's'}):\n`
  );
  failures.forEach((f) => console.error('  - ' + f));
  process.exit(1);
} else {
  console.log(
    `Content integrity check passed: ${chapterDirs.length} chapters, ${allSrcFiles.length} other src/ files, no Phase-N leakage, no dangling EqRefs, no landmark-anchor mismatches, and no chapter-wide widget barrels.`
  );
}

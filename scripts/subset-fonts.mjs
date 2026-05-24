/**
 * Optional font-subsetting pass.
 *
 * The curriculum already ships variable webfonts (Inter as woff2, JetBrains
 * Mono as ttf) under public/fonts/. This script subsets them to Latin glyphs,
 * which typically halves the over-the-wire size on first paint.
 *
 * Run manually before a release; commit the subsetted files. Deploy machines
 * do not need fonttools installed.
 *
 *   pip install fonttools brotli zopfli
 *   node scripts/subset-fonts.mjs
 *
 * Outputs land alongside the originals with a `-subset` suffix. Update
 * src/styles/fonts.css to point at the `-subset` files once verified.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Basic Latin + Latin-1 Supplement + Latin Extended-A/B + common punctuation.
// Covers the curriculum's prose (English + occasional accents + smart quotes +
// em/en dashes + ellipsis).
const UNICODE_RANGE = 'U+0020-007E,U+00A0-024F,U+2010-2029,U+2030-205E';

const FONTS = [
  {
    input: 'public/fonts/inter/Inter-Variable.woff2',
    output: 'public/fonts/inter/Inter-Variable-subset.woff2',
    flavor: 'woff2',
  },
  {
    input: 'public/fonts/inter/Inter-Variable-Italic.woff2',
    output: 'public/fonts/inter/Inter-Variable-Italic-subset.woff2',
    flavor: 'woff2',
  },
  {
    input: 'public/fonts/jetbrains-mono/JetBrainsMono-Variable.ttf',
    output: 'public/fonts/jetbrains-mono/JetBrainsMono-Variable-subset.woff2',
    flavor: 'woff2',
  },
  {
    input: 'public/fonts/jetbrains-mono/JetBrainsMono-Variable-Italic.ttf',
    output: 'public/fonts/jetbrains-mono/JetBrainsMono-Variable-Italic-subset.woff2',
    flavor: 'woff2',
  },
];

// Quick check: pyftsubset on PATH? Bail loudly if not.
try {
  execSync('pyftsubset --help > /dev/null 2>&1');
} catch {
  console.error('pyftsubset not found. Install with: pip install fonttools brotli zopfli');
  process.exit(1);
}

for (const font of FONTS) {
  const inAbs = path.join(ROOT, font.input);
  const outAbs = path.join(ROOT, font.output);

  try {
    await fs.access(inAbs);
  } catch {
    console.warn(`Skipping ${font.input}: not found`);
    continue;
  }

  await fs.mkdir(path.dirname(outAbs), { recursive: true });
  console.log(`Subsetting ${path.basename(font.input)} → ${path.basename(font.output)}`);
  execSync(
    `pyftsubset "${inAbs}" --output-file="${outAbs}" --flavor=${font.flavor} ` +
      `--unicodes="${UNICODE_RANGE}" --layout-features='kern,liga,calt' --no-hinting`,
    { stdio: 'inherit' }
  );

  const inSize = (await fs.stat(inAbs)).size;
  const outSize = (await fs.stat(outAbs)).size;
  const reduction = (((inSize - outSize) / inSize) * 100).toFixed(1);
  console.log(`  ${(inSize / 1024).toFixed(1)} KB → ${(outSize / 1024).toFixed(1)} KB (-${reduction}%)`);
}

console.log('Font subsetting complete.');
console.log('Next: update src/styles/fonts.css to reference the -subset files.');

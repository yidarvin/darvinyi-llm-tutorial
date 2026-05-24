/**
 * Build-time generator for per-chapter Open Graph card PNGs.
 *
 * Renders one 1200x630 card per chapter into public/og/<slug>.png, plus
 * a home card at public/og/home.png. Cards visually mirror the curriculum
 * (dark background, cyan accent, Inter + JetBrains Mono typography).
 *
 * Pipeline:  JSX-like VDOM (satori-html)  →  SVG (satori)  →  PNG (resvg).
 * No headless browser; runs anywhere Node runs.
 *
 *   node scripts/build-og-cards.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { html as toReactNode } from 'satori-html';
import wawoff from 'wawoff2';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUTPUT_DIR = join(ROOT, 'public/og');
const EXPECTED_MIN_CHAPTERS = 30;

const PART_NAMES = {
  1: 'Foundations',
  2: 'The Transformer',
  3: 'Pre-training',
  4: 'Alternative Architectures',
  5: 'Post-training',
  6: 'Inference',
  7: 'Modern Capabilities',
  8: 'Safety, Interpretability & Evaluation',
  9: 'Agents',
};

function romanNumeral(n) {
  return ({ 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX' })[n] ?? String(n);
}

function loadChapters() {
  const src = readFileSync(join(ROOT, 'src/lib/chapters.ts'), 'utf8');
  const chapters = [];
  const regex = /\{\s*num:\s*(\d+)\s*,\s*slug:\s*'([^']+)'\s*,\s*title:\s*'([^']+)'\s*,\s*partNum:\s*(\d+)/g;
  let m;
  while ((m = regex.exec(src)) !== null) {
    chapters.push({
      num: parseInt(m[1], 10),
      slug: m[2],
      title: m[3],
      partNum: parseInt(m[4], 10),
    });
  }
  return chapters;
}

// Satori's opentype parser only handles static (non-variable) fonts, so we
// load weight-specific TTFs from @fontsource. woff2 decoding goes through
// the wawoff2 wasm decompressor.
async function loadStaticFont(pkgRelative) {
  const fullPath = join(ROOT, 'node_modules', pkgRelative);
  const buf = readFileSync(fullPath);
  const decoded = await wawoff.decompress(buf);
  return Buffer.from(decoded);
}

async function loadFonts() {
  // wawoff2 shares a wasm instance — serialize the decompresses.
  const specs = [
    ['Inter', 400, '@fontsource/inter/files/inter-latin-400-normal.woff2'],
    ['Inter', 500, '@fontsource/inter/files/inter-latin-500-normal.woff2'],
    ['Inter', 600, '@fontsource/inter/files/inter-latin-600-normal.woff2'],
    ['Inter', 700, '@fontsource/inter/files/inter-latin-700-normal.woff2'],
    ['JetBrains Mono', 400, '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2'],
    ['JetBrains Mono', 500, '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2'],
    ['JetBrains Mono', 600, '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff2'],
  ];
  const fonts = [];
  for (const [name, weight, pkgRelative] of specs) {
    const data = await loadStaticFont(pkgRelative);
    fonts.push({ name, data, weight, style: 'normal' });
  }
  return fonts;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function chapterTemplate({ chapterNum, chapterTitle, partName, partNum }) {
  return toReactNode(`
    <div style="
      width: 1200px;
      height: 630px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: linear-gradient(135deg, #0a0e1a 0%, #0d1421 100%);
      padding: 80px 90px;
      font-family: 'Inter';
      color: #e8eaed;
    ">
      <div style="display: flex; flex-direction: column;">
        <div style="font-family: 'JetBrains Mono'; font-size: 20px; color: #7dd3fc; text-transform: uppercase; letter-spacing: 3px; font-weight: 500; margin-bottom: 12px;">
          LLM Tutorial
        </div>
        <div style="font-family: 'JetBrains Mono'; font-size: 16px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px;">
          Part ${romanNumeral(partNum)} · ${escapeHtml(partName)}
        </div>
      </div>

      <div style="display: flex; flex-direction: column;">
        <div style="font-family: 'JetBrains Mono'; font-size: 30px; color: #06b6d4; font-weight: 500; letter-spacing: 1.5px; margin-bottom: 20px;">
          Chapter ${chapterNum}
        </div>
        <div style="font-family: 'Inter'; font-size: 78px; color: #ffffff; font-weight: 700; line-height: 1.05; letter-spacing: -1.5px; display: flex;">
          ${escapeHtml(chapterTitle)}
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #1e2a3a; padding-top: 28px;">
        <div style="font-family: 'Inter'; font-size: 22px; color: #94a3b8; display: flex;">
          Darvin Yi · llm-tutorial.darvinyi.com
        </div>
        <div style="
          width: 72px; height: 72px;
          background: linear-gradient(135deg, #06b6d4 0%, #0e7490 100%);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'JetBrains Mono'; font-size: 34px; font-weight: 600; color: #0a0e1a;
        ">
          ${chapterNum}
        </div>
      </div>
    </div>
  `);
}

function homeTemplate() {
  return toReactNode(`
    <div style="
      width: 1200px;
      height: 630px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: linear-gradient(135deg, #0a0e1a 0%, #0d1421 100%);
      padding: 80px 90px;
      font-family: 'Inter';
      color: #e8eaed;
    ">
      <div style="font-family: 'JetBrains Mono'; font-size: 22px; color: #7dd3fc; text-transform: uppercase; letter-spacing: 4px; font-weight: 500;">
        Darvin Yi
      </div>
      <div style="display: flex; flex-direction: column;">
        <div style="font-family: 'Inter'; font-size: 104px; color: #ffffff; font-weight: 700; line-height: 1.0; letter-spacing: -2px; margin-bottom: 24px;">
          LLM Tutorial
        </div>
        <div style="font-family: 'Inter'; font-size: 36px; color: #cbd5e1; line-height: 1.3; font-weight: 400; display: flex;">
          30 chapters · numpy primitives to agent systems
        </div>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #1e2a3a; padding-top: 28px;">
        <div style="font-family: 'Inter'; font-size: 22px; color: #94a3b8; display: flex;">
          llm-tutorial.darvinyi.com
        </div>
        <div style="
          width: 72px; height: 72px;
          background: linear-gradient(135deg, #06b6d4 0%, #0e7490 100%);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'JetBrains Mono'; font-size: 32px; font-weight: 600; color: #0a0e1a;
        ">
          30
        </div>
      </div>
    </div>
  `);
}

async function renderCard(node, outputPath, fonts) {
  const svg = await satori(node, {
    width: 1200,
    height: 630,
    fonts,
  });
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    background: '#0a0e1a',
  });
  const png = resvg.render().asPng();
  writeFileSync(outputPath, png);
  return png.length;
}

async function buildChapterCard(chapter, fonts) {
  const partName = PART_NAMES[chapter.partNum] ?? '';
  const node = chapterTemplate({
    chapterNum: chapter.num,
    chapterTitle: chapter.title,
    partName,
    partNum: chapter.partNum,
  });
  const outputPath = join(OUTPUT_DIR, `${chapter.slug}.png`);
  const bytes = await renderCard(node, outputPath, fonts);
  console.log(`  ✓ ${chapter.slug}.png (${(bytes / 1024).toFixed(1)} KB)`);
  return bytes;
}

async function buildHomeCard(fonts) {
  const outputPath = join(OUTPUT_DIR, 'home.png');
  const bytes = await renderCard(homeTemplate(), outputPath, fonts);
  console.log(`  ✓ home.png (${(bytes / 1024).toFixed(1)} KB)`);
  return bytes;
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const chapters = loadChapters();
  console.log(`Building OG cards for ${chapters.length} chapters + home...`);
  const fonts = await loadFonts();

  let totalBytes = 0;
  for (const ch of chapters) {
    totalBytes += await buildChapterCard(ch, fonts);
  }
  totalBytes += await buildHomeCard(fonts);

  const cardCount = chapters.length + 1;
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);
  console.log(`Built ${cardCount} OG cards · ${totalMb} MB total`);

  if (chapters.length < EXPECTED_MIN_CHAPTERS) {
    console.error(`Parsed only ${chapters.length} chapters from chapters.ts; expected at least ${EXPECTED_MIN_CHAPTERS}. Failing build.`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Failed to build OG cards:', err);
  process.exit(1);
});

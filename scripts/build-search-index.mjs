import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PAGES_DIR = path.join(ROOT, 'src/pages');
const OUTPUT = path.join(ROOT, 'public/search-index.json');
const EXPECTED_MIN_CHAPTERS = 30;

async function findChapterDirs() {
  const entries = await fs.readdir(PAGES_DIR, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory() && /^ch\d+-/.test(e.name))
    .map(e => path.join(PAGES_DIR, e.name))
    .sort();
}

async function loadChapterTitles() {
  const chaptersTs = await fs.readFile(path.join(ROOT, 'src/lib/chapters.ts'), 'utf8');
  const titles = {};
  const regex = /\{\s*num:\s*(\d+)\s*,\s*slug:\s*'([^']+)'\s*,\s*title:\s*'([^']+)'/g;
  let m;
  while ((m = regex.exec(chaptersTs)) !== null) {
    titles[m[2]] = { num: parseInt(m[1], 10), title: m[3] };
  }
  return titles;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function stripMdx(mdx) {
  let text = mdx;
  text = text.replace(/^---[\s\S]*?---\n/, '');
  text = text.replace(/^import .*?$/gm, '');
  text = text.replace(/```[\s\S]*?```/g, '');

  let prev;
  do {
    prev = text;
    text = text.replace(/<[A-Z][A-Za-z0-9]*\s*[^>]*\/>/g, '');
    text = text.replace(/<[A-Z][A-Za-z0-9]*\s*[^>]*>[\s\S]*?<\/[A-Z][A-Za-z0-9]*>/g, '');
  } while (text !== prev);

  text = text.replace(/`[^`]+`/g, '');
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

function segmentByH2(text) {
  const lines = text.split('\n');
  const segments = [];
  let current = { heading: 'Introduction', anchor: 'introduction', body: [] };

  for (const line of lines) {
    const h2Match = /^##\s+(.+?)\s*$/.exec(line);
    if (h2Match) {
      if (current.body.length > 0 || current.heading !== 'Introduction') {
        segments.push({
          heading: current.heading,
          anchor: current.anchor,
          body: current.body.join('\n').trim(),
        });
      }
      const heading = h2Match[1].replace(/^#+\s*/, '').trim();
      current = { heading, anchor: slugify(heading), body: [] };
      continue;
    }
    if (/^#{1,6}\s+/.test(line)) {
      current.body.push(line.replace(/^#{1,6}\s+/, ''));
      continue;
    }
    current.body.push(line);
  }

  if (current.body.length > 0) {
    segments.push({
      heading: current.heading,
      anchor: current.anchor,
      body: current.body.join('\n').trim(),
    });
  }

  return segments;
}

function trimBody(body, maxChars = 800) {
  return body.length > maxChars ? body.slice(0, maxChars) + '...' : body;
}

async function buildIndex() {
  const titles = await loadChapterTitles();
  const chapterDirs = await findChapterDirs();
  const documents = [];
  const seenChapters = new Set();

  for (const dir of chapterDirs) {
    const slug = path.basename(dir);
    const chapterInfo = titles[slug];
    if (!chapterInfo) {
      console.warn(`Skipping ${slug}: not in chapters manifest`);
      continue;
    }

    const mdxPath = path.join(dir, 'index.mdx');
    let mdxRaw;
    try {
      mdxRaw = await fs.readFile(mdxPath, 'utf8');
    } catch {
      console.warn(`Skipping ${slug}: no index.mdx found`);
      continue;
    }

    const stripped = stripMdx(mdxRaw);
    const segments = segmentByH2(stripped);
    let sectionCount = 0;

    for (const seg of segments) {
      if (!seg.body || seg.body.length < 50) continue;
      documents.push({
        id: `${slug}#${seg.anchor}`,
        chapter: chapterInfo.num,
        chapterSlug: slug,
        chapterTitle: chapterInfo.title,
        sectionTitle: seg.heading,
        sectionAnchor: seg.anchor,
        content: trimBody(seg.body),
      });
      sectionCount++;
    }

    if (sectionCount > 0) seenChapters.add(slug);
  }

  documents.sort((a, b) =>
    a.chapter !== b.chapter ? a.chapter - b.chapter : a.id.localeCompare(b.id)
  );

  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(OUTPUT, JSON.stringify(documents, null, 0), 'utf8');

  const sizeKb = ((await fs.stat(OUTPUT)).size / 1024).toFixed(1);
  const chapterCount = seenChapters.size;
  console.log(
    `Built search index: ${documents.length} sections across ${chapterCount} chapters (${sizeKb} KB)`
  );

  if (chapterCount < EXPECTED_MIN_CHAPTERS) {
    console.error(
      `Search index covers only ${chapterCount} chapters; expected at least ${EXPECTED_MIN_CHAPTERS}. Failing build.`
    );
    process.exit(1);
  }
}

buildIndex().catch(err => {
  console.error('Failed to build search index:', err);
  process.exit(1);
});

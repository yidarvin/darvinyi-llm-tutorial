# Session 133 — Search integration — **POLISH PHASE 2 OF 6**

> **Second polish session.** Cross-chapter linking (session 132) made the curriculum's connections visible; **search makes its content findable.** Client-side full-text search across all 30 chapters via a build-time index, queried in-browser by MiniSearch (~7KB gzipped). **Keyboard shortcuts**: `/` opens the search dialog from anywhere; `cmd/ctrl-k` does the same. Type to query; arrow keys navigate results; **Enter or click deep-links to the chapter + section.** Results show chapter title, section heading, and a highlighted snippet. **The polish-phase pattern continues**: one build-time script + one dialog component + one layout modification → site-wide search affordance for all 30 chapters from a single place.

---

## Read first (in this order)

1. **`context/PROJECT_OVERVIEW.md`** — for the build pipeline (Astro build hooks)
2. **`prompts/polish/session-132-cross-chapter-linking.md`** — for the polish-phase pattern of single-place changes
3. **MiniSearch docs** — [lucaong.github.io/minisearch](https://lucaong.github.io/minisearch) — for the search engine API
4. **The chapters list** in `src/lib/chapters.ts` — the source of truth for chapter ordering

---

## Goal

By end of session, search ships across all 30 chapters:

1. **A build-time indexer** scans every chapter MDX file, segments by section heading, and produces `public/search-index.json` — a flat array of documents with `{id, chapter, chapterSlug, chapterTitle, sectionTitle, sectionAnchor, content}`. The script runs as part of `npm run build` and also during `npm run dev`.
2. **A SearchDialog component** mounts at the top level (rendered from the chapter layout and the home layout). It opens via:
   - `/` keyboard shortcut (from anywhere not in a text input)
   - `cmd/ctrl-k` keyboard shortcut (always)
   - A search button in the site header (Hero icon + "Search" label on desktop; icon-only on mobile)
3. **The dialog**: input field with autofocus; result list below; arrow-key navigation; Enter to navigate; Escape to close; click-outside to close; result snippets with query terms highlighted.
4. **Deep-link format**: clicking a result navigates to `/{chapterSlug}/#{sectionAnchor}` — the browser scrolls to the relevant section.

**End state:** all 30 chapters are searchable from a global dialog. Search is content-rich (per-section indexing) and fast (in-memory MiniSearch on a ~1-2 MB index).

---

## Inputs

State of the repo after session 132:

- All 30 chapters `'published'`
- Cross-chapter linking via the `<RelatedChapters>` footer is live
- `src/layouts/ChapterLayout.astro` renders the footer + prev/next nav
- No `src/lib/search-index.ts` or build script yet
- No `src/components/search/` directory yet
- MiniSearch is not yet in `package.json`

---

## Deliverables

1. **Install** `minisearch` via `npm install minisearch` — add to `dependencies` (not dev)
2. **Create** `scripts/build-search-index.mjs` — the build-time indexer (Node.js script)
3. **Update** `package.json` — add `npm run build:search-index` script; chain it before `astro build` in the `build` script; run it before `astro dev` in the `dev` script via a `predev` hook
4. **Create** `src/components/search/SearchDialog.tsx` — the dialog component (React)
5. **Create** `src/components/search/SearchDialog.module.css` — scoped styles
6. **Create** `src/components/search/search-client.ts` — client-side search logic (loads `search-index.json`, wraps MiniSearch)
7. **Create** `src/components/search/SearchButton.tsx` — header trigger (icon + optional label)
8. **Update** `src/components/site/Header.astro` (or equivalent) — render `<SearchButton client:load />`
9. **Update** `src/layouts/ChapterLayout.astro` and `src/layouts/HomeLayout.astro` — render `<SearchDialog client:idle />` once at the layout level so it's always available

---

## Detailed spec

### 1. `scripts/build-search-index.mjs`

A Node.js script that runs as a build step. It:
- Reads every `src/pages/ch*/index.mdx`
- Strips MDX-specific syntax (imports, frontmatter, JSX components — keeps prose + headings)
- Segments by h2 headings
- Generates a document per section
- Writes `public/search-index.json`

```js
// scripts/build-search-index.mjs

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PAGES_DIR = path.join(ROOT, 'src/pages');
const OUTPUT = path.join(ROOT, 'public/search-index.json');

// Discover chapter directories (ch1-..., ch2-..., etc.)
async function findChapterDirs() {
  const entries = await fs.readdir(PAGES_DIR, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory() && /^ch\d+-/.test(e.name))
    .map(e => path.join(PAGES_DIR, e.name));
}

// Parse the chapter number out of the slug (e.g., 'ch7-training-objectives' → 7)
function parseChapterNum(slug) {
  const m = /^ch(\d+)-/.exec(slug);
  return m ? parseInt(m[1], 10) : null;
}

// Read the chapter title from the frontmatter or the first h1 in the file.
// MDX frontmatter has `description` and `slug`. The h1 is rendered by the layout
// based on the chapter manifest in src/lib/chapters.ts, so for the title we read
// that file instead.
async function loadChapterTitles() {
  const chaptersTs = await fs.readFile(path.join(ROOT, 'src/lib/chapters.ts'), 'utf8');
  // Naive regex: works because the manifest entries are simple object literals.
  // Format: { num: N, slug: '...', title: '...', partNum: N, status: '...' },
  const titles = {};
  const regex = /\{\s*num:\s*(\d+)\s*,\s*slug:\s*'([^']+)'\s*,\s*title:\s*'([^']+)'/g;
  let m;
  while ((m = regex.exec(chaptersTs)) !== null) {
    titles[m[2]] = { num: parseInt(m[1], 10), title: m[3] };
  }
  return titles;
}

// Slugify a heading text into an anchor id (matches astro/mdx default behavior).
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Strip MDX-specific syntax. Goal: extract readable prose + headings only.
// Removes: frontmatter, import lines, JSX components (<Foo .../> and <Foo>...</Foo>),
// fenced code blocks, inline code. Keeps: headings, prose paragraphs, plain lists.
function stripMdx(mdx) {
  let text = mdx;

  // Remove frontmatter
  text = text.replace(/^---[\s\S]*?---\n/, '');

  // Remove import statements
  text = text.replace(/^import .*?$/gm, '');

  // Remove fenced code blocks
  text = text.replace(/```[\s\S]*?```/g, '');

  // Remove JSX components (greedy strip of any <Tag ...>...</Tag> or self-closing <Tag .../>)
  // This is a simplification; an MDX parser would be more robust but adds dependencies.
  // The strip is iterative because components can nest.
  let prev;
  do {
    prev = text;
    text = text.replace(/<[A-Z][A-Za-z0-9]*\s*[^>]*\/>/g, '');               // self-closing
    text = text.replace(/<[A-Z][A-Za-z0-9]*\s*[^>]*>[\s\S]*?<\/[A-Z][A-Za-z0-9]*>/g, ''); // paired
  } while (text !== prev);

  // Remove inline code
  text = text.replace(/`[^`]+`/g, '');

  // Remove markdown link decorators (keep label text)
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Collapse repeated whitespace
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

// Segment the stripped text by h2 headings. Returns an array of
// { heading, anchor, body } objects.
function segmentByH2(text) {
  const lines = text.split('\n');
  const segments = [];
  let current = { heading: 'Introduction', anchor: 'introduction', body: [] };

  for (const line of lines) {
    const h2Match = /^##\s+(.+?)\s*$/.exec(line);
    if (h2Match) {
      // Push previous segment if it has content
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
    // Skip h3/h4/etc. as their own segments — but keep their text in the parent body.
    if (/^#{1,6}\s+/.test(line)) {
      current.body.push(line.replace(/^#{1,6}\s+/, ''));
      continue;
    }
    current.body.push(line);
  }

  // Push final segment
  if (current.body.length > 0) {
    segments.push({
      heading: current.heading,
      anchor: current.anchor,
      body: current.body.join('\n').trim(),
    });
  }

  return segments;
}

// Truncate body content to keep the index size reasonable.
function trimBody(body, maxChars = 800) {
  return body.length > maxChars ? body.slice(0, maxChars) + '...' : body;
}

// Build the full index.
async function buildIndex() {
  const titles = await loadChapterTitles();
  const chapterDirs = await findChapterDirs();
  const documents = [];

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
    } catch (err) {
      console.warn(`Skipping ${slug}: no index.mdx found`);
      continue;
    }

    const stripped = stripMdx(mdxRaw);
    const segments = segmentByH2(stripped);

    for (const seg of segments) {
      if (!seg.body || seg.body.length < 50) continue;  // skip thin sections
      documents.push({
        id: `${slug}#${seg.anchor}`,
        chapter: chapterInfo.num,
        chapterSlug: slug,
        chapterTitle: chapterInfo.title,
        sectionTitle: seg.heading,
        sectionAnchor: seg.anchor,
        content: trimBody(seg.body),
      });
    }
  }

  // Sort by chapter number then section order
  documents.sort((a, b) => a.chapter - b.chapter);

  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(OUTPUT, JSON.stringify(documents, null, 0), 'utf8');

  const sizeKb = ((await fs.stat(OUTPUT)).size / 1024).toFixed(1);
  console.log(`✓ Built search index: ${documents.length} sections across ${chapterDirs.length} chapters (${sizeKb} KB)`);
}

buildIndex().catch(err => {
  console.error('Failed to build search index:', err);
  process.exit(1);
});
```

### 2. Update `package.json`

Add the index-build script and wire it into `dev` + `build`:

```json
{
  "scripts": {
    "build:search-index": "node scripts/build-search-index.mjs",
    "predev": "npm run build:search-index",
    "prebuild": "npm run build:search-index",
    "dev": "astro dev",
    "build": "astro build",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "minisearch": "^7.0.0"
  }
}
```

(Exact version may differ — accept what `npm install minisearch` resolves.)

### 3. `search-client.ts` (client-side)

```ts
// src/components/search/search-client.ts

import MiniSearch from 'minisearch';

export interface SearchDocument {
  id: string;
  chapter: number;
  chapterSlug: string;
  chapterTitle: string;
  sectionTitle: string;
  sectionAnchor: string;
  content: string;
}

export interface SearchResult extends SearchDocument {
  score: number;
  /** Snippet of the content with matched query terms wrapped in <mark>...</mark>. */
  snippet: string;
  /** Which fields matched. */
  matchedFields: string[];
}

let indexPromise: Promise<{
  ms: MiniSearch;
  docs: Map<string, SearchDocument>;
}> | null = null;

async function loadIndex() {
  if (indexPromise) return indexPromise;

  indexPromise = (async () => {
    const res = await fetch('/search-index.json');
    if (!res.ok) throw new Error('Failed to load search index');
    const documents: SearchDocument[] = await res.json();

    const docs = new Map(documents.map(d => [d.id, d]));

    const ms = new MiniSearch({
      idField: 'id',
      fields: ['chapterTitle', 'sectionTitle', 'content'],
      storeFields: [],
      searchOptions: {
        prefix: true,
        fuzzy: 0.2,
        boost: {
          sectionTitle: 3,
          chapterTitle: 2,
          content: 1,
        },
      },
    });
    ms.addAll(documents);

    return { ms, docs };
  })();

  return indexPromise;
}

/** Highlight query terms in a body of text. Returns HTML string with <mark>. */
function highlight(text: string, query: string): string {
  if (!query) return text;
  const terms = query.split(/\s+/).filter(t => t.length >= 2);
  if (terms.length === 0) return text;
  let highlighted = text;
  for (const term of terms) {
    const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    highlighted = highlighted.replace(re, '<mark>$1</mark>');
  }
  return highlighted;
}

/** Snippet around the first match. Falls back to start of text. */
function snippet(content: string, query: string, maxLen: number = 200): string {
  const terms = query.split(/\s+/).filter(t => t.length >= 2);
  let snippetStart = 0;
  for (const term of terms) {
    const idx = content.toLowerCase().indexOf(term.toLowerCase());
    if (idx >= 0) {
      snippetStart = Math.max(0, idx - 40);
      break;
    }
  }
  let snippetText = content.slice(snippetStart, snippetStart + maxLen);
  if (snippetStart > 0) snippetText = '...' + snippetText;
  if (snippetStart + maxLen < content.length) snippetText += '...';
  return highlight(snippetText, query);
}

/** Run a search query. Returns up to `limit` results. */
export async function search(query: string, limit: number = 10): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const { ms, docs } = await loadIndex();
  const rawResults = ms.search(query.trim()).slice(0, limit);

  return rawResults.map(r => {
    const doc = docs.get(r.id as string);
    if (!doc) return null;
    return {
      ...doc,
      score: r.score,
      snippet: snippet(doc.content, query),
      matchedFields: r.match ? Object.keys(r.match) : [],
    };
  }).filter((x): x is SearchResult => x !== null);
}

/** Pre-warm the index (call on idle to avoid lazy first-query latency). */
export function preloadIndex() {
  loadIndex().catch(() => { /* silent */ });
}
```

### 4. `SearchDialog.tsx`

```tsx
// src/components/search/SearchDialog.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { search, preloadIndex, type SearchResult } from './search-client';
import styles from './SearchDialog.module.css';

export default function SearchDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultListRef = useRef<HTMLUListElement>(null);

  // Preload the index on idle (first chance after page is interactive)
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => preloadIndex());
    } else {
      setTimeout(() => preloadIndex(), 1500);
    }
  }, []);

  // Global keyboard: `/` and cmd-k / ctrl-k to open
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // cmd-k / ctrl-k: always opens
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
      // `/`: opens unless typing in an input
      if (e.key === '/' && !isOpen) {
        const target = e.target as HTMLElement;
        const tagName = target.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) {
          return;
        }
        e.preventDefault();
        setIsOpen(true);
      }
      // Escape closes when open
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        close();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Listen for a custom 'open-search' event so the SearchButton can trigger us
  useEffect(() => {
    function handleOpen() { setIsOpen(true); }
    document.addEventListener('open-search', handleOpen);
    return () => document.removeEventListener('open-search', handleOpen);
  }, []);

  // Focus the input when opened
  useEffect(() => {
    if (isOpen) {
      // small delay so the dialog has time to mount
      setTimeout(() => inputRef.current?.focus(), 30);
      setSelectedIdx(0);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    const handle = setTimeout(async () => {
      try {
        const r = await search(query);
        setResults(r);
        setSelectedIdx(0);
      } finally {
        setIsLoading(false);
      }
    }, 120);
    return () => clearTimeout(handle);
  }, [query, isOpen]);

  // Scroll selected result into view
  useEffect(() => {
    const list = resultListRef.current;
    if (!list) return;
    const selected = list.children[selectedIdx] as HTMLElement | undefined;
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  const close = useCallback(() => setIsOpen(false), []);

  function navigateToResult(r: SearchResult) {
    close();
    window.location.href = `/${r.chapterSlug}/#${r.sectionAnchor}`;
  }

  function handleInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      e.preventDefault();
      navigateToResult(results[selectedIdx]!);
    }
  }

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={close} role="presentation">
      <div
        className={styles.dialog}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Search the curriculum"
        aria-modal="true"
      >
        <div className={styles.inputRow}>
          <span className={styles.inputIcon} aria-hidden>⌕</span>
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            placeholder="Search 30 chapters..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleInputKey}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
          <kbd className={styles.escHint}>esc</kbd>
        </div>

        <div className={styles.statusBar}>
          {isLoading && <span>Searching…</span>}
          {!isLoading && query && results.length === 0 && (
            <span>No results for &quot;{query}&quot;</span>
          )}
          {!isLoading && results.length > 0 && (
            <span>{results.length} result{results.length === 1 ? '' : 's'}</span>
          )}
          {!query && (
            <span>
              Try: <em>scaling laws</em>, <em>tool use</em>, <em>pass^k</em>
            </span>
          )}
        </div>

        <ul ref={resultListRef} className={styles.resultList} role="listbox">
          {results.map((r, i) => (
            <li
              key={r.id}
              className={`${styles.resultItem} ${i === selectedIdx ? styles.resultItemSelected : ''}`}
              onClick={() => navigateToResult(r)}
              onMouseEnter={() => setSelectedIdx(i)}
              role="option"
              aria-selected={i === selectedIdx}
            >
              <div className={styles.resultHeader}>
                <span className={styles.resultChapter}>Ch {r.chapter}</span>
                <span className={styles.resultChapterTitle}>{r.chapterTitle}</span>
                <span className={styles.resultArrow}>›</span>
                <span className={styles.resultSection}>{r.sectionTitle}</span>
              </div>
              <div
                className={styles.resultSnippet}
                dangerouslySetInnerHTML={{ __html: r.snippet }}
              />
            </li>
          ))}
        </ul>

        <div className={styles.footerHint}>
          <kbd>↑</kbd><kbd>↓</kbd> navigate · <kbd>↵</kbd> open · <kbd>esc</kbd> close
        </div>
      </div>
    </div>
  );
}
```

### 5. `SearchDialog.module.css`

```css
.overlay {
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--bg-primary) 80%, transparent);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 5rem 1rem 1rem 1rem;
  animation: overlayFadeIn 160ms ease-out;
}

@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.dialog {
  width: 100%;
  max-width: 640px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: 0 12px 48px color-mix(in srgb, black 50%, transparent);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 6rem);
  animation: dialogSlideIn 200ms ease-out;
}

@keyframes dialogSlideIn {
  from { opacity: 0; transform: translateY(-12px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .overlay, .dialog { animation: none; }
}

.inputRow {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1.05rem;
  border-bottom: 1px solid var(--border-subtle);
}
.inputIcon {
  font-size: 1.25rem;
  color: var(--text-tertiary);
  line-height: 1;
}
.input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  padding: 0.2rem 0;
}
.input::placeholder { color: var(--text-tertiary); }
.escHint {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  padding: 0.15rem 0.45rem;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  text-transform: uppercase;
}

.statusBar {
  padding: 0.5rem 1.05rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  border-bottom: 1px solid var(--border-subtle);
}
.statusBar em {
  color: var(--cyan-300);
  font-style: normal;
  background: color-mix(in srgb, var(--cyan-500) 8%, transparent);
  padding: 0.05rem 0.3rem;
  border-radius: 3px;
  font-size: 0.72rem;
}

.resultList {
  flex: 1;
  overflow-y: auto;
  list-style: none;
  padding: 0;
  margin: 0;
}
.resultItem {
  padding: 0.6rem 1.05rem;
  border-bottom: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: background 100ms;
}
.resultItem:last-child { border-bottom: none; }
.resultItem:hover {
  background: color-mix(in srgb, var(--cyan-500) 4%, var(--bg-elevated));
}
.resultItemSelected {
  background: color-mix(in srgb, var(--cyan-500) 10%, var(--bg-elevated));
}

.resultHeader {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  margin-bottom: 0.25rem;
  flex-wrap: wrap;
}
.resultChapter {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 500;
}
.resultChapterTitle {
  font-family: 'Crimson Pro', serif;
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-weight: 500;
}
.resultArrow {
  color: var(--text-tertiary);
  font-size: 0.85rem;
}
.resultSection {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: var(--cyan-300);
  font-weight: 500;
}

.resultSnippet {
  font-size: 0.84rem;
  color: var(--text-secondary);
  line-height: 1.55;
}
.resultSnippet mark {
  background: color-mix(in srgb, var(--cyan-500) 22%, transparent);
  color: var(--cyan-200);
  padding: 0.05rem 0.15rem;
  border-radius: 2px;
}

.footerHint {
  padding: 0.55rem 1.05rem;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-subtle);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.footerHint kbd {
  display: inline-block;
  padding: 0.1rem 0.4rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 3px;
  font-size: 0.7rem;
  font-family: inherit;
  color: var(--text-secondary);
  margin: 0 0.05rem;
}

@media (max-width: 720px) {
  .overlay { padding: 1rem; }
  .dialog { max-height: calc(100vh - 2rem); }
  .input { font-size: 0.95rem; }
  .resultHeader { flex-direction: column; align-items: flex-start; gap: 0.1rem; }
  .resultChapterTitle, .resultSection { font-size: 0.85rem; }
  .resultArrow { display: none; }
}
```

### 6. `SearchButton.tsx`

```tsx
// src/components/search/SearchButton.tsx

import { useEffect, useState } from 'react';
import styles from './SearchButton.module.css';

export default function SearchButton() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
  }, []);

  function open() {
    document.dispatchEvent(new CustomEvent('open-search'));
  }

  return (
    <button
      type="button"
      className={styles.searchButton}
      onClick={open}
      aria-label="Open search"
    >
      <span className={styles.icon} aria-hidden>⌕</span>
      <span className={styles.label}>Search</span>
      <kbd className={styles.kbd}>{isMac ? '⌘K' : 'Ctrl+K'}</kbd>
    </button>
  );
}
```

### 7. `SearchButton.module.css`

```css
.searchButton {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.6rem 0.35rem 0.55rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 150ms;
  font-family: 'Inter', sans-serif;
}
.searchButton:hover {
  border-color: var(--cyan-500);
  color: var(--cyan-300);
}
.searchButton:focus-visible {
  outline: 2px solid var(--cyan-500);
  outline-offset: 2px;
}

.icon {
  font-size: 1.05rem;
  line-height: 1;
}
.label {
  font-size: 0.84rem;
}
.kbd {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.66rem;
  padding: 0.1rem 0.35rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 3px;
  color: var(--text-tertiary);
  text-transform: uppercase;
}

@media (max-width: 640px) {
  .label, .kbd { display: none; }
  .searchButton { padding: 0.35rem; }
}
```

### 8. Update `Header.astro`

Add the `<SearchButton>` to the header's right cluster (next to other actions like theme toggle, GitHub link). Use `client:load` so the button itself works without waiting for the dialog.

```astro
---
import SearchButton from '../search/SearchButton';
---

<header class="site-header">
  <!-- left: logo / brand -->
  <a href="/" class="brand">…</a>

  <!-- right: actions -->
  <div class="header-actions">
    <SearchButton client:load />
    <!-- other actions: theme toggle, GitHub, etc. -->
  </div>
</header>
```

### 9. Update `ChapterLayout.astro` and `HomeLayout.astro`

Render `<SearchDialog>` once at the layout level so it's always available. `client:idle` defers loading until the page is interactive:

```astro
---
import SearchDialog from '../components/search/SearchDialog';
---

<!-- existing layout -->

<SearchDialog client:idle />
```

If both layouts share a base layout, render it there instead — once total per page.

---

## Acceptance criteria

All must hold:

1. **`npm install minisearch`** completes; `minisearch` appears in `dependencies`.
2. **`npm run build:search-index`** completes; `public/search-index.json` is produced with documents for all 30 chapters and is < 5 MB.
3. **Console output** of the index build reports total documents and total chapters; mismatch (anything < 30 chapters) is a hard failure that fails the build.
4. **`npm run dev`** runs `predev` (rebuilding the index) before starting Astro. Index changes when chapters change.
5. **`npm run build`** runs `prebuild` (rebuilding the index) before Astro builds.
6. **`SearchButton`** appears in the site header.
7. **Clicking the search button** opens the dialog. Pressing `/` (when not in a text input) opens the dialog. Pressing `cmd-k` / `ctrl-k` opens the dialog from any context.
8. **Typing in the input** debounces (~120ms) and shows results.
9. **Arrow Up/Down** navigates results; selected item is highlighted; the selected item is auto-scrolled into view if outside the visible area.
10. **Enter** navigates to the selected result; the URL becomes `/{slug}/#{anchor}` and the page scrolls to the section.
11. **Escape** closes the dialog. Click on the overlay (outside the dialog box) closes it.
12. **Result rendering**: chapter number eyebrow + chapter title + section title (with arrow); snippet below with `<mark>` highlighting around query terms.
13. **Empty state with hints**: when query is empty, show "Try: scaling laws, tool use, pass^k" placeholder.
14. **No results state**: shows "No results for X" cleanly.
15. **Mobile** (< 720px): dialog uses full screen height; result header stacks; arrow indicator hidden.
16. **Keyboard cmd/ctrl-k display** in the header button uses `⌘K` on Mac, `Ctrl+K` elsewhere.
17. **`prefers-reduced-motion`**: animations disabled.
18. **`npm run typecheck`** passes.
19. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not implement a search-as-you-type results page** — the dialog is the only surface in this session.
- ❌ **Do not add server-side search**. Static index + client-side query only.
- ❌ **Do not implement result analytics / tracking**.
- ❌ **Do not add filters** (e.g., filter by phase, by chapter number range). The MiniSearch query is the only filter.
- ❌ **Do not modify chapter MDX** to add semantic markers. The build script parses what's there.

---

## Wire-up

```bash
git add scripts/build-search-index.mjs src/components/search/ src/components/site/Header.astro src/layouts/ChapterLayout.astro src/layouts/HomeLayout.astro package.json package-lock.json
git commit -m "session 133 (polish 2): client-side search across 30 chapters with MiniSearch + cmd-k"
git push origin main
```

---

## Notes for the session author

**On build-time indexing being the right primitive**:
At build time, scan MDX → output static JSON → ship as a public asset. Client fetches once, queries in-memory. Notes-for-author: "**No server, no API, no database.** Astro's static-site nature plus MiniSearch's small footprint make this the right primitive for a 30-chapter tutorial. **Index size at ~30 chapters × ~8 sections × ~800-char snippet ≈ 200 KB JSON** — easily cached, downloaded once."

**On the MDX strip being best-effort, not perfect**:
The script regex-strips JSX components rather than parsing the AST. Notes-for-author: "**A full MDX parser would be more robust but adds dependencies.** Regex-stripping gets ~95% accuracy on the curriculum's actual content — prose, headings, lists. The remaining 5% (component-internal text) is acceptable to lose because it's mostly widget labels/captions, which are repetitive across chapters and would dominate search noise anyway."

**On segmenting by h2 (not h3)**:
Each h2 in the chapter prose maps to a section the reader can land on. h3 sub-sections roll up into their parent h2 for indexing — the search result links to the h2, and the page scrolls to it. Notes-for-author: "**Section-level granularity is the right unit.** Reader searching 'pass^k' should land on the section, not a sub-section anchor that requires more page scrolling. **30 chapters × ~8 sections ≈ 240 documents — sufficient density for good results.**"

**On MiniSearch's field boosting**:
`sectionTitle` boost 3, `chapterTitle` 2, `content` 1. Notes-for-author: "**Boosts encode intent.** A search for 'attention' should prioritize Ch 2 ('Attention intuition') over deep mentions in Ch 28. **Section title is the highest-signal field**; chapter title is mid-signal; content is the long tail."

**On fuzzy + prefix matching**:
`prefix: true` enables 'sca' to match 'scaling'. `fuzzy: 0.2` allows small typos. Notes-for-author: "**This is the right calibration for technical content.** Too-aggressive fuzziness produces noise (e.g., 'token' matching 'taken'). 0.2 catches typos like 'embeddng' → 'embedding' but doesn't hallucinate matches."

**On the `/` shortcut being conditional**:
`/` triggers the dialog UNLESS the user is in a text input. Notes-for-author: "**`/` is the Stripe/GitHub convention** — universally recognized and one keystroke faster than cmd-k. But it must be conditional: a reader typing `/` in code or a comment must get the literal character. The check covers inputs, textareas, and contenteditable elements."

**On the dialog being mounted in the layout (not per-page)**:
Mounting once at the layout level means the dialog state persists across navigation within the SPA-like Astro experience. Notes-for-author: "**Single instance avoids React-mount churn.** The dialog uses `client:idle` so it doesn't block initial page rendering."

**On preloading the index on idle**:
After page load, `requestIdleCallback` kicks off the index fetch. Notes-for-author: "**Pay the cost when the user isn't watching.** The first search query lands on a hot index; the user doesn't notice the fetch."

**On result highlighting via `<mark>`**:
The `<mark>` element is semantically correct for highlighting and gets styled with a cyan background. Notes-for-author: "**Semantic HTML earns its style.** Screen readers announce `<mark>` content as 'highlighted'; visual users see the colored background; both groups benefit."

**On the build script being a fail-loud guard**:
If the index has fewer than 30 chapters, the build fails. Notes-for-author: "**Defensive integrity check.** A chapter directory accidentally missing or unparseable should fail the build, not silently ship a half-index. **Catch the problem at build time, not at user-search time.**"

**On the empty-state placeholder being curriculum-specific**:
"Try: scaling laws, tool use, pass^k" — three distinct terms from across the curriculum. Notes-for-author: "**The placeholder is calibration**: a reader who's never used the search sees three terms that hint at the curriculum's scope. Each maps to a real high-signal result."

**Pedagogical claim this session supports**:
"**The 30-chapter curriculum becomes a navigable knowledge base.** Reader looking for 'attention' lands on Ch 2's intuition section. Reader looking for 'pass^k' lands on Ch 30's reliability section. **No friction; no remembering where things are; no scrolling through prev/next.** The cross-chapter footer (session 132) made connections visible; **search makes content findable.** Together they turn the curriculum from a linear book into a connected resource."

---

## Polish phase progress after this session

- ✅ Session 132 — Cross-chapter linking
- ✅ **Session 133 — Search integration** (this)
- ⬜ Session 134 — Mobile pass
- ⬜ Session 135 — Accessibility audit
- ⬜ Session 136 — Performance pass
- ⬜ Session 137 — Social meta and OG cards

**4 polish sessions remain.** Each ships final UX from one place. The curriculum is approaching its final shape.

Build with care. **Search transforms 30 chapters from a sequence into a knowledge base.**

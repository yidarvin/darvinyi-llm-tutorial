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
  snippet: string;
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

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function highlight(text: string, query: string): string {
  const safe = escapeHtml(text);
  if (!query) return safe;
  const terms = query.split(/\s+/).filter(t => t.length >= 2);
  if (terms.length === 0) return safe;
  let highlighted = safe;
  for (const term of terms) {
    const re = new RegExp(`(${escapeRegExp(term)})`, 'gi');
    highlighted = highlighted.replace(re, '<mark>$1</mark>');
  }
  return highlighted;
}

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
  let prefix = snippetStart > 0 ? '...' : '';
  let suffix = snippetStart + maxLen < content.length ? '...' : '';
  return prefix + highlight(snippetText, query) + suffix;
}

export async function search(query: string, limit: number = 10): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const { ms, docs } = await loadIndex();
  const rawResults = ms.search(query.trim()).slice(0, limit);

  return rawResults
    .map(r => {
      const doc = docs.get(r.id as string);
      if (!doc) return null;
      return {
        ...doc,
        score: r.score,
        snippet: snippet(doc.content, query),
        matchedFields: r.match ? Object.keys(r.match) : [],
      };
    })
    .filter((x): x is SearchResult => x !== null);
}

export function preloadIndex() {
  loadIndex().catch(() => { /* silent */ });
}

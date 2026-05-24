import { useState, useEffect, useRef, useCallback } from 'react';
import { search, preloadIndex, type SearchResult } from './search-client';
import FocusTrap from '../a11y/FocusTrap';
import LiveRegion from '../a11y/LiveRegion';
import styles from './SearchDialog.module.css';

export default function SearchDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultListRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      (window as unknown as { requestIdleCallback: (cb: () => void) => void })
        .requestIdleCallback(() => preloadIndex());
    } else {
      setTimeout(() => preloadIndex(), 1500);
    }
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
      if (e.key === '/' && !isOpen) {
        const target = e.target as HTMLElement | null;
        if (target) {
          const tagName = target.tagName.toLowerCase();
          if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) {
            return;
          }
        }
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        close();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, close]);

  useEffect(() => {
    function handleOpen() { setIsOpen(true); }
    document.addEventListener('open-search', handleOpen);
    return () => document.removeEventListener('open-search', handleOpen);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 30);
      setSelectedIdx(0);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

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

  useEffect(() => {
    const list = resultListRef.current;
    if (!list) return;
    const selected = list.children[selectedIdx] as HTMLElement | undefined;
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

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
    } else if (e.key === 'Enter') {
      const target = results[selectedIdx];
      if (target) {
        e.preventDefault();
        navigateToResult(target);
      }
    }
  }

  if (!isOpen) return null;

  const announcement = isLoading
    ? 'Searching…'
    : query
      ? results.length > 0
        ? `${results.length} result${results.length === 1 ? '' : 's'} for ${query}`
        : `No results for ${query}`
      : '';

  return (
    <div className={styles.overlay} onClick={close} role="presentation">
      <FocusTrap active={isOpen} initialFocusRef={inputRef as React.RefObject<HTMLElement>}>
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
              aria-label="Search the curriculum"
              aria-controls="search-results-listbox"
              aria-activedescendant={results[selectedIdx] ? `search-result-${results[selectedIdx].id}` : undefined}
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

          <ul
            ref={resultListRef}
            className={styles.resultList}
            role="listbox"
            id="search-results-listbox"
            aria-label="Search results"
          >
            {results.map((r, i) => (
              <li
                key={r.id}
                id={`search-result-${r.id}`}
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

          <LiveRegion message={announcement} />
        </div>
      </FocusTrap>
    </div>
  );
}

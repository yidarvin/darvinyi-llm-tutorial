import { useEffect, useState } from 'react';
import styles from './SearchButton.module.css';

interface SearchButtonProps {
  /** When true, render an icon-only button suitable for tight spaces. */
  compact?: boolean;
}

export default function SearchButton({ compact = false }: SearchButtonProps) {
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
      className={`${styles.searchButton} ${compact ? styles.compact : ''}`}
      onClick={open}
      aria-label="Open search"
    >
      <span className={styles.icon} aria-hidden>⌕</span>
      {!compact && <span className={styles.label}>Search</span>}
      {!compact && <kbd className={styles.kbd}>{isMac ? '⌘K' : 'Ctrl+K'}</kbd>}
    </button>
  );
}

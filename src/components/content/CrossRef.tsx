import { ALL_CHAPTERS } from '../../lib/chapters';
import styles from './CrossRef.module.css';

interface CrossRefProps {
  slug: string;
  label?: string;
  note?: string;
}

export default function CrossRef({ slug, label = 'see', note }: CrossRefProps) {
  const chapter = ALL_CHAPTERS.find(c => c.slug === slug);
  if (!chapter) {
    if (typeof console !== 'undefined') {
      console.warn(`CrossRef: chapter '${slug}' not found`);
    }
    return null;
  }

  return (
    <a href={`/${slug}/`} className={styles.crossRef} title={chapter.title}>
      <span className={styles.crossRefLabel}>{label}</span>
      <span className={styles.crossRefChapter}>
        Ch {chapter.num}: {chapter.title}
      </span>
      {note && <span className={styles.crossRefNote}> — {note}</span>}
    </a>
  );
}

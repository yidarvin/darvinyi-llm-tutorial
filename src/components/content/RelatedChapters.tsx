import {
  RELATED_CHAPTERS,
  RELATIONSHIP_LABELS,
  RELATIONSHIP_COLORS,
} from '../../lib/related-chapters';
import { ALL_CHAPTERS } from '../../lib/chapters';
import styles from './RelatedChapters.module.css';

interface RelatedChaptersProps {
  slug: string;
}

export default function RelatedChapters({ slug }: RelatedChaptersProps) {
  const related = RELATED_CHAPTERS[slug];
  if (!related || related.length === 0) return null;

  const cards = related
    .map(r => {
      const chapter = ALL_CHAPTERS.find(c => c.slug === r.slug);
      if (!chapter || chapter.status !== 'published') return null;
      return { ...r, chapter };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (cards.length === 0) return null;

  return (
    <aside className={styles.relatedChapters} aria-label="Related chapters">
      <div className={styles.heading}>Related chapters</div>
      <div className={styles.cardGrid}>
        {cards.map(({ slug: rSlug, relationship, reason, chapter }) => {
          const color = RELATIONSHIP_COLORS[relationship];
          return (
            <a
              key={rSlug}
              href={`/${rSlug}/`}
              className={styles.card}
              style={{ borderLeftColor: color }}
            >
              <div className={styles.cardHeader}>
                <span className={styles.cardChapterNum}>Ch {chapter.num}</span>
                <span
                  className={styles.cardBadge}
                  style={{
                    background: `color-mix(in srgb, ${color} 18%, transparent)`,
                    color,
                    borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
                  }}
                >
                  {RELATIONSHIP_LABELS[relationship]}
                </span>
              </div>
              <div className={styles.cardTitle}>{chapter.title}</div>
              <div className={styles.cardReason}>{reason}</div>
            </a>
          );
        })}
      </div>
    </aside>
  );
}

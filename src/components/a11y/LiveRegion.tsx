import styles from './a11y.module.css';

interface LiveRegionProps {
  message: string;
  /** 'polite' (default) waits for a pause; 'assertive' interrupts. */
  urgency?: 'polite' | 'assertive';
  /** What the screen reader announces from the region. */
  relevant?: 'additions' | 'removals' | 'all' | 'text';
}

export default function LiveRegion({
  message,
  urgency = 'polite',
  relevant = 'additions',
}: LiveRegionProps) {
  return (
    <div
      className={styles.visuallyHidden}
      role="status"
      aria-live={urgency}
      aria-atomic="true"
      aria-relevant={relevant}
    >
      {message}
    </div>
  );
}

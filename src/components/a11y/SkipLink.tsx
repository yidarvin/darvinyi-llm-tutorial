import styles from './a11y.module.css';

interface SkipLinkProps {
  /** ID of the element to skip to. */
  targetId?: string;
  children?: React.ReactNode;
}

export default function SkipLink({
  targetId = 'main-content',
  children = 'Skip to main content',
}: SkipLinkProps) {
  return (
    <a href={`#${targetId}`} className={styles.skipLink}>
      {children}
    </a>
  );
}

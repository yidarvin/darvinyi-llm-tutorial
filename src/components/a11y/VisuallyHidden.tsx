import { type ReactNode, type ElementType, createElement } from 'react';
import styles from './a11y.module.css';

interface VisuallyHiddenProps {
  as?: ElementType;
  children: ReactNode;
  /** If true, becomes visible when focused (skip-link-style pattern). */
  focusable?: boolean;
}

export default function VisuallyHidden({
  as = 'span',
  children,
  focusable = false,
}: VisuallyHiddenProps) {
  return createElement(
    as,
    { className: focusable ? styles.visuallyHiddenFocusable : styles.visuallyHidden },
    children,
  );
}

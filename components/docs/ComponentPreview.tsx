'use client';

import { ReactNode } from 'react';
import styles from './ComponentPreview.module.css';

interface ComponentPreviewProps {
  children: ReactNode;
  title?: string;
  description?: string;
  variant?: 'default' | 'light' | 'dark';
}

export default function ComponentPreview({
  children,
  title,
  description,
  variant = 'default',
}: ComponentPreviewProps) {
  return (
    <div className={`${styles.previewContainer} ${styles[variant]}`}>
      {title && <div className={styles.previewTitle}>{title}</div>}
      {description && <p className={styles.previewDescription}>{description}</p>}

      <div className={styles.preview}>{children}</div>
    </div>
  );
}

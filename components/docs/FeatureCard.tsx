'use client';

import { type Feature } from '@/lib/docs/feature-catalog';
import { Badge } from '@/components/ui/Badge';
import styles from './FeatureCard.module.css';

export interface FeatureCardProps {
  feature: Feature;
  onClick?: (feature: Feature) => void;
}

const STATUS_VARIANTS: Record<Feature['status'], 'success' | 'info' | 'secondary'> = {
  implemented: 'success',
  'in-progress': 'info',
  planned: 'secondary',
};

const STATUS_LABELS: Record<Feature['status'], string> = {
  implemented: 'Implemented',
  'in-progress': 'In Progress',
  planned: 'Planned',
};

const CATEGORY_LABELS: Record<Feature['category'], string> = {
  security: 'Security',
  transfer: 'Transfer',
  network: 'Network',
  privacy: 'Privacy',
  ui: 'UI',
  chat: 'Chat',
  friends: 'Friends',
  settings: 'Settings',
  crypto: 'Crypto',
  performance: 'Performance',
};

export function FeatureCard({ feature, onClick }: FeatureCardProps) {
  const handleClick = () => {
    onClick?.(feature);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(feature);
    }
  };

  return (
    <div
      className={styles.card}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${feature.title} - ${STATUS_LABELS[feature.status]}`}
    >
      <div className={styles.header}>
        <div className={styles.icon} aria-hidden="true">
          {feature.icon}
        </div>
        <div className={styles.badges}>
          <Badge variant={STATUS_VARIANTS[feature.status]} size="sm">
            {STATUS_LABELS[feature.status]}
          </Badge>
        </div>
      </div>

      <h3 className={styles.title}>{feature.title}</h3>

      <p className={styles.description}>{feature.description}</p>

      <div className={styles.footer}>
        <Badge variant="outline" size="sm">
          {CATEGORY_LABELS[feature.category]}
        </Badge>
        {feature.relatedFiles && feature.relatedFiles.length > 0 && (
          <span className={styles.fileCount} aria-label={`${feature.relatedFiles.length} related files`}>
            {feature.relatedFiles.length} {feature.relatedFiles.length === 1 ? 'file' : 'files'}
          </span>
        )}
      </div>
    </div>
  );
}

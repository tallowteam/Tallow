'use client';

import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { type Feature } from '@/lib/docs/feature-catalog';
import styles from './FeatureDetailModal.module.css';

export interface FeatureDetailModalProps {
  feature: Feature | null;
  open: boolean;
  onClose: () => void;
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

export function FeatureDetailModal({ feature, open, onClose }: FeatureDetailModalProps) {
  if (!feature) {
    return null;
  }

  return (
    <Modal open={open} onClose={onClose} size="md" title={feature.title}>
      <ModalHeader>
        <div className={styles.header}>
          <div className={styles.iconLarge} aria-hidden="true">
            {feature.icon}
          </div>
          <div className={styles.headerContent}>
            <h2 className={styles.title}>{feature.title}</h2>
            <div className={styles.badges}>
              <Badge variant={STATUS_VARIANTS[feature.status]}>
                {STATUS_LABELS[feature.status]}
              </Badge>
              <Badge variant="outline">{CATEGORY_LABELS[feature.category]}</Badge>
            </div>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        <div className={styles.content}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Description</h3>
            <p className={styles.description}>{feature.description}</p>
          </div>

          {feature.details && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Details</h3>
              <p className={styles.details}>{feature.details}</p>
            </div>
          )}

          {feature.relatedFiles && feature.relatedFiles.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                Related Files ({feature.relatedFiles.length})
              </h3>
              <ul className={styles.fileList}>
                {feature.relatedFiles.map((file, index) => (
                  <li key={index} className={styles.fileItem}>
                    <code className={styles.filePath}>{file}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Feature ID</h3>
            <code className={styles.featureId}>{feature.id}</code>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button onClick={onClose} variant="primary">
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}

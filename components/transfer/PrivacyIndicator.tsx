'use client';

import { usePrivacyPipeline } from '@/lib/hooks/use-privacy-pipeline';
import { useSettingsStore } from '@/lib/stores/settings-store';
import styles from './PrivacyIndicator.module.css';

interface PrivacyIndicatorProps {
  showDetails?: boolean;
  compact?: boolean;
}

export function PrivacyIndicator({ showDetails = false, compact = false }: PrivacyIndicatorProps) {
  const { stripMetadata, ipLeakProtection, onionRoutingEnabled } = useSettingsStore();
  const { getPrivacyStatus, onionRouting } = usePrivacyPipeline();

  const status = getPrivacyStatus();
  const { level, activeCount, totalCount } = status;

  const getStatusColor = () => {
    switch (level) {
      case 'high':
        return 'var(--color-success)';
      case 'medium':
        return 'var(--color-warning)';
      case 'low':
        return 'var(--color-info)';
      default:
        return 'var(--color-text-secondary)';
    }
  };

  const getStatusLabel = () => {
    switch (level) {
      case 'high':
        return 'Maximum Privacy';
      case 'medium':
        return 'Enhanced Privacy';
      case 'low':
        return 'Basic Privacy';
      default:
        return 'Standard Mode';
    }
  };

  if (compact) {
    return (
      <div className={styles.compact} title={getStatusLabel()}>
        <ShieldIcon color={getStatusColor()} />
        <span className={styles.count} style={{ color: getStatusColor() }}>
          {activeCount}/{totalCount}
        </span>
      </div>
    );
  }

  return (
    <div className={styles.indicator}>
      <div className={styles.header}>
        <ShieldIcon color={getStatusColor()} />
        <div className={styles.headerText}>
          <h3 className={styles.title} style={{ color: getStatusColor() }}>
            {getStatusLabel()}
          </h3>
          <p className={styles.subtitle}>
            {activeCount} of {totalCount} privacy features active
          </p>
        </div>
      </div>

      {showDetails && (
        <div className={styles.features}>
          <FeatureItem
            active={stripMetadata}
            label="Metadata Stripping"
            description="EXIF and GPS data removed"
          />
          <FeatureItem
            active={ipLeakProtection}
            label="IP Leak Protection"
            description="Relay-only connections"
          />
          <FeatureItem
            active={onionRoutingEnabled && onionRouting.isAvailable}
            label="Onion Routing"
            description={
              onionRoutingEnabled
                ? onionRouting.isAvailable
                  ? '3-hop circuit active'
                  : 'Initializing relays...'
                : 'Disabled'
            }
          />
          <FeatureItem
            active={onionRoutingEnabled}
            label="Traffic Obfuscation"
            description="Protocol disguise enabled"
          />
        </div>
      )}
    </div>
  );
}

interface FeatureItemProps {
  active: boolean;
  label: string;
  description: string;
}

function FeatureItem({ active, label, description }: FeatureItemProps) {
  return (
    <div className={`${styles.feature} ${active ? styles.featureActive : ''}`}>
      <div className={styles.featureIcon}>
        {active ? <CheckIcon /> : <XIcon />}
      </div>
      <div className={styles.featureContent}>
        <div className={styles.featureLabel}>{label}</div>
        <div className={styles.featureDescription}>{description}</div>
      </div>
    </div>
  );
}

// Icons
function ShieldIcon({ color }: { color: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

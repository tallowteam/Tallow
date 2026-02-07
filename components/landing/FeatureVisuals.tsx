import styles from './featurevisuals.module.css';

export function TransferVisual() {
  return (
    <div className={styles.transferContainer}>
      <div className={styles.mainStat}>4.2 GB/s</div>
      <div className={styles.mainLabel}>Average transfer speed</div>
      <div className={styles.statRows}>
        <div className={styles.statRow}>WebRTC P2P · Direct Connection</div>
        <div className={styles.statRow}>Chunk-based streaming · Parallel channels</div>
        <div className={styles.statRow}>Auto-resume · Zero packet loss</div>
      </div>
    </div>
  );
}

export function SecurityVisual() {
  const specs = [
    { tech: 'ML-KEM-768', desc: 'Post-Quantum Key Exchange' },
    { tech: 'AES-256-GCM', desc: 'Authenticated Encryption' },
    { tech: 'BLAKE3', desc: 'Cryptographic Hashing' },
    { tech: 'Ed25519', desc: 'Digital Signatures' },
  ];

  return (
    <div className={styles.securityContainer}>
      {specs.map((spec) => (
        <div key={spec.tech} className={styles.specRow}>
          <div className={styles.specTech}>{spec.tech}</div>
          <div className={styles.specArrow}>→</div>
          <div className={styles.specDesc}>{spec.desc}</div>
        </div>
      ))}
    </div>
  );
}

function PlatformIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    macOS: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83" />
        <path d="M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11" />
      </svg>
    ),
    Windows: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="8" height="8" rx="1" />
        <rect x="13" y="3" width="8" height="8" rx="1" />
        <rect x="3" y="13" width="8" height="8" rx="1" />
        <rect x="13" y="13" width="8" height="8" rx="1" />
      </svg>
    ),
    Linux: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="5" />
        <path d="M12 13v8M8 21h8M9 18l-3 3M15 18l3 3" />
      </svg>
    ),
    iOS: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="2" width="10" height="20" rx="3" />
        <line x1="12" y1="18" x2="12" y2="18.01" />
      </svg>
    ),
    Android: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 6l-1-3M16 6l1-3M5 10a7 7 0 0 1 14 0" />
      </svg>
    ),
    Web: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  };
  return <>{icons[name] || null}</>;
}

export function PlatformVisual() {
  const platforms = ['macOS', 'Windows', 'Linux', 'iOS', 'Android', 'Web'];

  return (
    <div className={styles.platformGrid}>
      {platforms.map((name) => (
        <div key={name} className={styles.platformCard}>
          <div className={styles.platformIcon}>
            <PlatformIcon name={name} />
          </div>
          <div className={styles.platformName}>{name}</div>
        </div>
      ))}
    </div>
  );
}

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
      {specs.map((spec, index) => (
        <div key={spec.tech} className={styles.specRow}>
          <div className={styles.specTech}>{spec.tech}</div>
          <div className={styles.specArrow}>→</div>
          <div className={styles.specDesc}>{spec.desc}</div>
        </div>
      ))}
    </div>
  );
}

export function PlatformVisual() {
  const platforms = [
    { name: 'macOS', icon: '󰀵' },
    { name: 'Windows', icon: '󰖳' },
    { name: 'Linux', icon: '󰌽' },
    { name: 'iOS', icon: '󰀷' },
    { name: 'Android', icon: '󰀲' },
    { name: 'Web', icon: '󰖟' },
  ];

  return (
    <div className={styles.platformGrid}>
      {platforms.map((platform) => (
        <div key={platform.name} className={styles.platformCard}>
          <div className={styles.platformIcon}>{platform.icon}</div>
          <div className={styles.platformName}>{platform.name}</div>
        </div>
      ))}
    </div>
  );
}

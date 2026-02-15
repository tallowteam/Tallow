import styles from './loading.module.css';

export default function FeaturesLoading() {
  const featureBlocks = Array.from({ length: 5 }, (_, i) => i);

  return (
    <div
      className={styles.page}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className={styles.srOnly}>Loading features page...</span>

      {/* Header */}
      <div
        className={styles.streamStage}
        data-stream-stage="1"
        aria-hidden="true"
      >
        <div className={styles.header}>
          <div className={`${styles.skeleton} ${styles.label}`} />
          <div className={`${styles.skeleton} ${styles.title}`} />
          <div className={`${styles.skeleton} ${styles.subtitle}`} />
        </div>
      </div>

      {/* Feature blocks — alternating layout */}
      <div
        className={styles.streamStage}
        data-stream-stage="2"
        aria-hidden="true"
      >
        {featureBlocks.map((i) => (
          <div
            key={i}
            className={`${styles.featureBlock} ${i % 2 !== 0 ? styles.featureBlockReverse : ''}`}
          >
            <div className={styles.featureContent}>
              <div className={`${styles.skeleton} ${styles.featureLabel}`} />
              <div className={`${styles.skeleton} ${styles.featureTitle}`} />
              <div className={`${styles.skeleton} ${styles.featureDesc}`} />
              <div className={`${styles.skeleton} ${styles.featureDescShort}`} />
            </div>
            <div className={styles.featureVisual}>
              <div className={`${styles.skeleton} ${styles.visualCard}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Comparison section */}
      <div
        className={styles.streamStage}
        data-stream-stage="3"
        aria-hidden="true"
      >
        <div className={styles.comparisonSection}>
          <div className={styles.comparisonHeader}>
            <div className={`${styles.skeleton} ${styles.comparisonLabel}`} />
            <div className={`${styles.skeleton} ${styles.comparisonTitle}`} />
            <div className={`${styles.skeleton} ${styles.comparisonSubtitle}`} />
          </div>
          <div className={`${styles.skeleton} ${styles.comparisonTable}`} />
        </div>
      </div>

      {/* CTA */}
      <div
        className={styles.streamStage}
        data-stream-stage="4"
        aria-hidden="true"
      >
        <div className={styles.cta}>
          <div className={`${styles.skeleton} ${styles.ctaTitle}`} />
          <div className={`${styles.skeleton} ${styles.ctaButton}`} />
        </div>
      </div>
    </div>
  );
}

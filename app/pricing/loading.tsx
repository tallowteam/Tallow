import styles from './loading.module.css';

export default function PricingLoading() {
  const plans = Array.from({ length: 4 }, (_, i) => i);
  const features = Array.from({ length: 5 }, (_, i) => i);
  const supportCards = Array.from({ length: 3 }, (_, i) => i);

  return (
    <div
      className={styles.page}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className={styles.srOnly}>Loading pricing page...</span>

      <div className={styles.container}>
        {/* Hero */}
        <div
          className={styles.streamStage}
          data-stream-stage="1"
          aria-hidden="true"
        >
          <div className={styles.hero}>
            <div className={`${styles.skeleton} ${styles.heroLabel}`} />
            <div className={`${styles.skeleton} ${styles.heroTitle}`} />
          </div>
        </div>

        {/* Plan cards */}
        <div
          className={styles.streamStage}
          data-stream-stage="2"
          aria-hidden="true"
        >
          <div className={styles.planGrid}>
            {plans.map((i) => (
              <div key={i} className={styles.planCard}>
                <div className={`${styles.skeleton} ${styles.planName}`} />
                <div className={`${styles.skeleton} ${styles.planDesc}`} />
                <div className={`${styles.skeleton} ${styles.planPrice}`} />
                <div className={styles.planFeatures}>
                  {features.map((j) => (
                    <div key={j} className={styles.planFeature}>
                      <div className={`${styles.skeleton} ${styles.planCheck}`} />
                      <div className={`${styles.skeleton} ${styles.planFeatureText}`} />
                    </div>
                  ))}
                </div>
                <div className={`${styles.skeleton} ${styles.planCta}`} />
              </div>
            ))}
          </div>
          <div className={`${styles.skeleton} ${styles.billingNote}`} />
        </div>

        {/* Philosophy */}
        <div
          className={styles.streamStage}
          data-stream-stage="3"
          aria-hidden="true"
        >
          <div className={styles.philosophySection}>
            <div className={`${styles.skeleton} ${styles.philosophyTitle}`} />
            <div className={`${styles.skeleton} ${styles.philosophyLine}`} />
            <div className={`${styles.skeleton} ${styles.philosophyLine}`} />
            <div className={`${styles.skeleton} ${styles.philosophyLineShort}`} />
          </div>
        </div>

        {/* Support the Mission */}
        <div
          className={styles.streamStage}
          data-stream-stage="4"
          aria-hidden="true"
        >
          <div className={styles.supportSection}>
            <div className={styles.supportHeader}>
              <div className={`${styles.skeleton} ${styles.supportTitle}`} />
              <div className={`${styles.skeleton} ${styles.supportSubtitle}`} />
            </div>
            <div className={styles.supportGrid}>
              {supportCards.map((i) => (
                <div key={i} className={styles.supportCard}>
                  <div className={`${styles.skeleton} ${styles.supportIcon}`} />
                  <div className={`${styles.skeleton} ${styles.supportCardTitle}`} />
                  <div className={`${styles.skeleton} ${styles.supportCardDesc}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

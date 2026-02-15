import styles from './loading.module.css';

export default function SecurityLoading() {
  const overviewCards = Array.from({ length: 3 }, (_, i) => i);
  const journeySteps = Array.from({ length: 5 }, (_, i) => i);
  const specRows = Array.from({ length: 6 }, (_, i) => i);
  const threatCards = Array.from({ length: 6 }, (_, i) => i);
  const faqItems = Array.from({ length: 5 }, (_, i) => i);

  return (
    <div
      className={styles.page}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className={styles.srOnly}>Loading security page...</span>

      {/* Hero */}
      <div
        className={styles.streamStage}
        data-stream-stage="1"
        aria-hidden="true"
      >
        <div className={styles.hero}>
          <div className={`${styles.skeleton} ${styles.heroLabel}`} />
          <div className={`${styles.skeleton} ${styles.heroTitle}`} />
          <div className={`${styles.skeleton} ${styles.heroSubtitle}`} />
        </div>
      </div>

      {/* Overview cards */}
      <div
        className={styles.streamStage}
        data-stream-stage="2"
        aria-hidden="true"
      >
        <div className={styles.overviewSection}>
          <div className={styles.overviewGrid}>
            {overviewCards.map((i) => (
              <div key={i} className={styles.overviewCard}>
                <div className={`${styles.skeleton} ${styles.overviewIcon}`} />
                <div className={`${styles.skeleton} ${styles.overviewTitle}`} />
                <div className={`${styles.skeleton} ${styles.overviewDesc}`} />
                <div className={`${styles.skeleton} ${styles.overviewDescShort}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Encryption Journey steps */}
      <div
        className={styles.streamStage}
        data-stream-stage="3"
        aria-hidden="true"
      >
        <div className={styles.journeySection}>
          <div className={styles.sectionHeader}>
            <div className={`${styles.skeleton} ${styles.sectionTitle}`} />
            <div className={`${styles.skeleton} ${styles.sectionSubtitle}`} />
          </div>
          <div className={styles.stepsGrid}>
            {journeySteps.map((i) => (
              <div key={i} className={styles.stepCard}>
                <div className={`${styles.skeleton} ${styles.stepNumber}`} />
                <div className={styles.stepContent}>
                  <div className={`${styles.skeleton} ${styles.stepTitle}`} />
                  <div className={`${styles.skeleton} ${styles.stepDesc}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Specs + Threats */}
      <div
        className={styles.streamStage}
        data-stream-stage="4"
        aria-hidden="true"
      >
        <div className={styles.specsSection}>
          <div className={styles.sectionHeader}>
            <div className={`${styles.skeleton} ${styles.sectionTitle}`} />
            <div className={`${styles.skeleton} ${styles.sectionSubtitle}`} />
          </div>
          <div className={styles.specsCard}>
            {specRows.map((i) => (
              <div key={i} className={styles.specRow}>
                <div className={`${styles.skeleton} ${styles.specLabel}`} />
                <div className={`${styles.skeleton} ${styles.specValue}`} />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.threatSection}>
          <div className={styles.sectionHeader}>
            <div className={`${styles.skeleton} ${styles.sectionTitle}`} />
            <div className={`${styles.skeleton} ${styles.sectionSubtitle}`} />
          </div>
          <div className={styles.threatGrid}>
            {threatCards.map((i) => (
              <div key={i} className={styles.threatCard}>
                <div className={`${styles.skeleton} ${styles.threatCheck}`} />
                <div className={`${styles.skeleton} ${styles.threatTitle}`} />
                <div className={`${styles.skeleton} ${styles.threatDesc}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div
        className={styles.streamStage}
        data-stream-stage="5"
        aria-hidden="true"
      >
        <div className={styles.faqSection}>
          <div className={styles.sectionHeader}>
            <div className={`${styles.skeleton} ${styles.sectionTitle}`} />
            <div className={`${styles.skeleton} ${styles.sectionSubtitle}`} />
          </div>
          <div className={styles.faqList}>
            {faqItems.map((i) => (
              <div key={i} className={styles.faqItem}>
                <div className={`${styles.skeleton} ${styles.faqQuestion}`} />
                <div className={`${styles.skeleton} ${styles.faqAnswer}`} />
                <div className={`${styles.skeleton} ${styles.faqAnswerShort}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

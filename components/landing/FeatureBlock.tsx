import styles from './featureblock.module.css';

interface FeatureBlockProps {
  number: string;
  label: string;
  headline: string;
  description: string;
  reversed?: boolean;
  children: React.ReactNode;
}

export default function FeatureBlock({
  number,
  label,
  headline,
  description,
  reversed = false,
  children,
}: FeatureBlockProps) {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={`${styles.layout} ${reversed ? styles.reversed : ''}`}>
          <div className={styles.textSide}>
            <div className={styles.labelRow}>
              {number} — {label}
            </div>
            <h2 className={styles.headline}>{headline}</h2>
            <p className={styles.description}>{description}</p>
          </div>
          <div className={styles.visualSide}>
            <div className={styles.visualCard}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

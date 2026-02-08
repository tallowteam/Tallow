import styles from './loading.module.css';

export default function Loading() {
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.heroLabel} />
        <div className={styles.heroTitle} />
        <div className={styles.heroTitleSmall} />
        <div className={styles.heroDescription} />
        <div className={styles.heroDescriptionShort} />
        <div className={styles.heroCta}>
          <div className={styles.heroButton} />
          <div className={styles.heroButtonSecondary} />
        </div>
      </div>
    </div>
  );
}

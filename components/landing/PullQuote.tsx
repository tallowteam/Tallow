import styles from './pullquote.module.css';

export function PullQuote() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <blockquote className={styles.quote}>
          Privacy isn&rsquo;t a feature. It&rsquo;s a fundamental right.
        </blockquote>
        <p className={styles.attribution}>— TALLOW FOUNDATION</p>
      </div>
    </section>
  );
}

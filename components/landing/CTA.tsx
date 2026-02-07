import Link from 'next/link';
import styles from './cta.module.css';

export function CTA() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.heading}>Ready to send without compromise?</h2>
        <p className={styles.subtext}>
          Start transferring files with quantum-safe encryption. Free, forever.
        </p>
        <Link href="/transfer" className={styles.button}>
          Get Started — It&rsquo;s Free
        </Link>
      </div>
    </section>
  );
}

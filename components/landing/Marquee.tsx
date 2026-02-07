import styles from './marquee.module.css';

const MARQUEE_ITEMS = [
  'End-to-End Encrypted',
  'Zero Knowledge',
  'Open Source',
  'Post-Quantum Safe',
  'No File Limits',
  'WebRTC P2P',
];

export function Marquee() {
  return (
    <div className={styles.marqueeSection}>
      <div className={styles.marqueeContainer}>
        <div className={styles.marqueeContent}>
          {/* Render items twice for seamless loop */}
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, index) => (
            <div key={index} className={styles.marqueeItem}>
              <span className={styles.itemText}>{item}</span>
              {/* Don't show divider after the last item */}
              {index < MARQUEE_ITEMS.length * 2 - 1 && (
                <span className={styles.divider}>
                  <span className={styles.dot} />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

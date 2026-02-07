import styles from './stats.module.css';

export function Stats() {
  const stats = [
    { value: '256', label: 'BIT ENCRYPTION' },
    { value: '0', label: 'SERVERS TOUCHED' },
    { value: 'P2P', label: 'DIRECT CONNECTION' },
    { value: '∞', label: 'FILE SIZE LIMIT' },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.stats}>
          {stats.map((stat, index) => (
            <div key={index} className={styles.stat}>
              <div className={styles.value}>{stat.value}</div>
              <div className={styles.label}>{stat.label}</div>
              {index < stats.length - 1 && <div className={styles.divider} />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from 'next/link';
import styles from './howitworkspreview.module.css';

export default function HowItWorksPreview() {
  const steps = [
    {
      number: '01',
      title: 'Drop',
      description: 'Drag files into Tallow or browse to select.',
    },
    {
      number: '02',
      title: 'Connect',
      description: 'Devices discover each other automatically on your network.',
    },
    {
      number: '03',
      title: 'Send',
      description: 'Files transfer directly, encrypted end-to-end with post-quantum security.',
    },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <p className={styles.label}>HOW IT WORKS</p>
        <h2 className={styles.heading}>Three steps to freedom.</h2>

        <div className={styles.steps}>
          {steps.map((step) => (
            <div key={step.number} className={styles.card}>
              <div className={styles.number}>{step.number}</div>
              <h3 className={styles.title}>{step.title}</h3>
              <p className={styles.description}>{step.description}</p>
            </div>
          ))}
        </div>

        <div className={styles.linkWrapper}>
          <Link href="/how-it-works" className={styles.link}>
            Learn more →
          </Link>
        </div>
      </div>
    </section>
  );
}

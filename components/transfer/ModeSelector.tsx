'use client';

import styles from './modeselector.module.css';

interface ModeSelectorProps {
  onSelectMode: (mode: 'local' | 'internet' | 'friends') => void;
}

export default function ModeSelector({ onSelectMode }: ModeSelectorProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Choose your transfer mode</h1>
        <p className={styles.subtitle}>Select how you want to connect</p>
      </div>

      <div className={styles.cardsWrapper} role="group" aria-label="Transfer mode options">
        {/* Local Network Card */}
        <button
          className={styles.card}
          onClick={() => onSelectMode('local')}
          aria-label="Select Local Network mode"
        >
          <div className={styles.iconContainer}>
            <svg
              className={styles.icon}
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12.55a11 11 0 0 1 14.08 0" />
              <path d="M1.42 9a16 16 0 0 1 21.16 0" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
          </div>
          <h2 className={styles.cardTitle}>Local Network</h2>
          <p className={styles.cardDescription}>
            Transfer files to devices on the same network
          </p>
          <ul className={styles.featureList}>
            <li>
              <span className={styles.checkmark}>✓</span>
              Auto-discover nearby devices
            </li>
            <li>
              <span className={styles.checkmark}>✓</span>
              Manual IP connection
            </li>
            <li>
              <span className={styles.checkmark}>✓</span>
              Room codes
            </li>
            <li>
              <span className={styles.checkmark}>✓</span>
              Same network required
            </li>
          </ul>
        </button>

        {/* Internet P2P Card */}
        <button
          className={styles.card}
          onClick={() => onSelectMode('internet')}
          aria-label="Select Internet P2P mode"
        >
          <div className={styles.iconContainer}>
            <svg
              className={styles.icon}
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <h2 className={styles.cardTitle}>Internet P2P</h2>
          <p className={styles.cardDescription}>
            Send files to anyone, anywhere in the world
          </p>
          <ul className={styles.featureList}>
            <li>
              <span className={styles.checkmark}>✓</span>
              Share via link
            </li>
            <li>
              <span className={styles.checkmark}>✓</span>
              QR code sharing
            </li>
            <li>
              <span className={styles.checkmark}>✓</span>
              6-digit connection code
            </li>
            <li>
              <span className={styles.checkmark}>✓</span>
              Email invite
            </li>
          </ul>
        </button>

        {/* Friends Card */}
        <button
          className={styles.card}
          onClick={() => onSelectMode('friends')}
          aria-label="Select Friends mode"
        >
          <div className={styles.iconContainer}>
            <svg
              className={styles.icon}
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h2 className={styles.cardTitle}>Friends</h2>
          <p className={styles.cardDescription}>
            Send to saved contacts instantly
          </p>
          <ul className={styles.featureList}>
            <li>
              <span className={styles.checkmark}>✓</span>
              Saved contacts list
            </li>
            <li>
              <span className={styles.checkmark}>✓</span>
              Online/offline status
            </li>
            <li>
              <span className={styles.checkmark}>✓</span>
              Instant one-tap send
            </li>
            <li>
              <span className={styles.checkmark}>✓</span>
              Add via ID, link, or QR
            </li>
          </ul>
        </button>
      </div>
    </div>
  );
}

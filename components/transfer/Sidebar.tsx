'use client';

import styles from './Sidebar.module.css';

interface SidebarProps {
  activeMode: 'nearby' | 'remote';
  activePanel: string;
  onModeChange: (mode: 'nearby' | 'remote') => void;
  onPanelChange: (panel: string) => void;
  deviceName?: string;
}

export default function Sidebar(props: SidebarProps) {
  const { activeMode, activePanel, onModeChange, onPanelChange, deviceName } = props;

  return (
    <aside className={styles.sidebar}>
      {/* Mode Switcher */}
      <div className={styles.modeSwitch}>
        <button
          type="button"
          className={`${styles.modePill} ${activeMode === 'nearby' ? styles.active : ''}`}
          onClick={() => onModeChange('nearby')}
          aria-pressed={activeMode === 'nearby'}
          aria-label="Switch to nearby mode"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M10 2C7.87827 2 5.84344 2.84285 4.34315 4.34315C2.84285 5.84344 2 7.87827 2 10C2 12.1217 2.84285 14.1566 4.34315 15.6569C5.84344 17.1571 7.87827 18 10 18C12.1217 18 14.1566 17.1571 15.6569 15.6569C17.1571 14.1566 18 12.1217 18 10C18 7.87827 17.1571 5.84344 15.6569 4.34315C14.1566 2.84285 12.1217 2 10 2ZM10 4C11.5913 4 13.1174 4.63214 14.2426 5.75736C15.3679 6.88258 16 8.4087 16 10C16 11.5913 15.3679 13.1174 14.2426 14.2426C13.1174 15.3679 11.5913 16 10 16C8.4087 16 6.88258 15.3679 5.75736 14.2426C4.63214 13.1174 4 11.5913 4 10C4 8.4087 4.63214 6.88258 5.75736 5.75736C6.88258 4.63214 8.4087 4 10 4ZM10 6C9.20435 6 8.44129 6.31607 7.87868 6.87868C7.31607 7.44129 7 8.20435 7 9C7 9.79565 7.31607 10.5587 7.87868 11.1213C8.44129 11.6839 9.20435 12 10 12C10.7956 12 11.5587 11.6839 12.1213 11.1213C12.6839 10.5587 13 9.79565 13 9C13 8.20435 12.6839 7.44129 12.1213 6.87868C11.5587 6.31607 10.7956 6 10 6Z"
              fill="currentColor"
            />
          </svg>
          <span className={styles.label}>Nearby</span>
        </button>
        <button
          type="button"
          className={`${styles.modePill} ${activeMode === 'remote' ? styles.active : ''}`}
          onClick={() => onModeChange('remote')}
          aria-pressed={activeMode === 'remote'}
          aria-label="Switch to remote mode"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2ZM10 4C13.3374 4 16 6.66264 16 10C16 13.3374 13.3374 16 10 16C6.66264 16 4 13.3374 4 10C4 6.66264 6.66264 4 10 4ZM9 6V10.5858L12.7071 14.2929L14.1213 12.8787L11 9.75736V6H9Z"
              fill="currentColor"
            />
            <circle cx="10" cy="10" r="2.5" fill="currentColor" opacity="0.3" />
          </svg>
          <span className={styles.label}>Remote</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className={styles.nav} aria-label="Transfer navigation">
        <button
          type="button"
          className={`${styles.navLink} ${activePanel === 'dashboard' ? styles.active : ''}`}
          onClick={() => onPanelChange('dashboard')}
          aria-current={activePanel === 'dashboard' ? 'page' : undefined}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" />
            <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" />
            <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" />
            <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" />
          </svg>
          <span className={styles.label}>Dashboard</span>
        </button>
        <button
          type="button"
          className={`${styles.navLink} ${activePanel === 'history' ? styles.active : ''}`}
          onClick={() => onPanelChange('history')}
          aria-current={activePanel === 'history' ? 'page' : undefined}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2ZM10 4C13.3374 4 16 6.66264 16 10C16 13.3374 13.3374 16 10 16C6.66264 16 4 13.3374 4 10C4 6.66264 6.66264 4 10 4ZM9 6V10.4142L11.2929 12.7071L12.7071 11.2929L11 9.58579V6H9Z"
              fill="currentColor"
            />
          </svg>
          <span className={styles.label}>History</span>
        </button>
        <button
          type="button"
          className={`${styles.navLink} ${activePanel === 'clipboard' ? styles.active : ''}`}
          onClick={() => onPanelChange('clipboard')}
          aria-current={activePanel === 'clipboard' ? 'page' : undefined}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M7 2C6.73478 2 6.48043 2.10536 6.29289 2.29289C6.10536 2.48043 6 2.73478 6 3V4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V16C2 16.5304 2.21071 17.0391 2.58579 17.4142C2.96086 17.7893 3.46957 18 4 18H16C16.5304 18 17.0391 17.7893 17.4142 17.4142C17.7893 17.0391 18 16.5304 18 16V6C18 5.46957 17.7893 4.96086 17.4142 4.58579C17.0391 4.21071 16.5304 4 16 4H14V3C14 2.73478 13.8946 2.48043 13.7071 2.29289C13.5196 2.10536 13.2652 2 13 2H7ZM7 4H13V6H7V4ZM4 6H6V7C6 7.26522 6.10536 7.51957 6.29289 7.70711C6.48043 7.89464 6.73478 8 7 8H13C13.2652 8 13.5196 7.89464 13.7071 7.70711C13.8946 7.51957 14 7.26522 14 7V6H16V16H4V6Z"
              fill="currentColor"
            />
          </svg>
          <span className={styles.label}>Clipboard</span>
        </button>
      </nav>

      {/* Settings Button */}
      <div className={styles.bottomSection}>
        <button
          type="button"
          className={`${styles.navLink} ${activePanel === 'settings' ? styles.active : ''}`}
          onClick={() => onPanelChange('settings')}
          aria-current={activePanel === 'settings' ? 'page' : undefined}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M10 2L8.5 4.5H6L4 7V9.5L2 11L4 12.5V15L6 18H8.5L10 20L11.5 18H14L16 15V12.5L18 11L16 9.5V7L14 4.5H11.5L10 2ZM10 4.82843L10.8787 6.12132L11.1716 6.5H11.5H13.1716L14.3431 8.5V9.5V9.87868L14.6464 10.182L15.8284 11L14.6464 11.818L14.3431 12.1213V12.5V13.5L13.1716 15.5H11.5H11.1716L10.8787 15.8787L10 17.1716L9.12132 15.8787L8.82843 15.5H8.5H6.82843L5.65685 13.5V12.5V12.1213L5.35355 11.818L4.17157 11L5.35355 10.182L5.65685 9.87868V9.5V8.5L6.82843 6.5H8.5H8.82843L9.12132 6.12132L10 4.82843ZM10 7C8.34315 7 7 8.34315 7 10C7 11.6569 8.34315 13 10 13C11.6569 13 13 11.6569 13 10C13 8.34315 11.6569 7 10 7Z"
              fill="currentColor"
            />
          </svg>
          <span className={styles.label}>Settings</span>
        </button>

        {/* Device Info */}
        <div className={styles.deviceInfo}>
          <p className={styles.deviceLabel}>Your device</p>
          <p className={styles.deviceName} suppressHydrationWarning>{deviceName || 'Unknown Device'}</p>
        </div>
      </div>
    </aside>
  );
}

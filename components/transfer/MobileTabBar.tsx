'use client';

import styles from './MobileTabBar.module.css';
import type { MobileTab } from './transfer-types';

interface MobileTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  transferCount?: number;
}

export function MobileTabBar(props: MobileTabBarProps) {
  const { activeTab, onTabChange, transferCount = 0 } = props;

  return (
    <nav className={styles.tabBar} aria-label="Main navigation">
      <button
        type="button"
        className={`${styles.tab} ${activeTab === 'devices' ? styles.active : ''}`}
        onClick={() => onTabChange('devices')}
        aria-current={activeTab === 'devices' ? 'page' : undefined}
        aria-label={transferCount > 0 ? `Devices (${transferCount} active)` : 'Devices'}
      >
        <div className={styles.iconWrapper}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" />
            <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" />
            <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" />
            <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" />
          </svg>
          {transferCount > 0 && <span className={styles.badge} aria-hidden="true" />}
        </div>
        <span className={styles.label}>Devices</span>
      </button>

      <button
        type="button"
        className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
        onClick={() => onTabChange('history')}
        aria-current={activeTab === 'history' ? 'page' : undefined}
        aria-label="History"
      >
        <div className={styles.iconWrapper}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3ZM12 5C15.8898 5 19 8.11019 19 12C19 15.8898 15.8898 19 12 19C8.11019 19 5 15.8898 5 12C5 8.11019 8.11019 5 12 5ZM11 7V12.5858L14.1213 15.7071L15.5355 14.2929L13 11.7574V7H11Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <span className={styles.label}>History</span>
      </button>

      <button
        type="button"
        className={`${styles.tab} ${activeTab === 'clipboard' ? styles.active : ''}`}
        onClick={() => onTabChange('clipboard')}
        aria-current={activeTab === 'clipboard' ? 'page' : undefined}
        aria-label="Clipboard"
      >
        <div className={styles.iconWrapper}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M8 3C7.46957 3 6.96086 3.21071 6.58579 3.58579C6.21071 3.96086 6 4.46957 6 5V6H4C3.20435 6 2.44129 6.31607 1.87868 6.87868C1.31607 7.44129 1 8.20435 1 9V19C1 19.7956 1.31607 20.5587 1.87868 21.1213C2.44129 21.6839 3.20435 22 4 22H20C20.7956 22 21.5587 21.6839 22.1213 21.1213C22.6839 20.5587 23 19.7956 23 19V9C23 8.20435 22.6839 7.44129 22.1213 6.87868C21.5587 6.31607 20.7956 6 20 6H18V5C18 4.46957 17.7893 3.96086 17.4142 3.58579C17.0391 3.21071 16.5304 3 16 3H8ZM8 5H16V7H8V5ZM4 8H6V9C6 9.26522 6.10536 9.51957 6.29289 9.70711C6.48043 9.89464 6.73478 10 7 10H17C17.2652 10 17.5196 9.89464 17.7071 9.70711C17.8946 9.51957 18 9.26522 18 9V8H20C20.2652 8 20.5196 8.10536 20.7071 8.29289C20.8946 8.48043 21 8.73478 21 9V19C21 19.2652 20.8946 19.5196 20.7071 19.7071C20.5196 19.8946 20.2652 20 20 20H4C3.73478 20 3.48043 19.8946 3.29289 19.7071C3.10536 19.5196 3 19.2652 3 19V9C3 8.73478 3.10536 8.48043 3.29289 8.29289C3.48043 8.10536 3.73478 8 4 8Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <span className={styles.label}>Clipboard</span>
      </button>

      <button
        type="button"
        className={`${styles.tab} ${activeTab === 'settings' ? styles.active : ''}`}
        onClick={() => onTabChange('settings')}
        aria-current={activeTab === 'settings' ? 'page' : undefined}
        aria-label="Settings"
      >
        <div className={styles.iconWrapper}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3L10.2 6H7.5L5 9.5V12.5L3 14.5L5 16.5V19.5L7.5 23H10.2L12 26L13.8 23H16.5L19 19.5V16.5L21 14.5L19 12.5V9.5L16.5 6H13.8L12 3ZM12 6.24264L13.1515 8.18198L13.5858 8.9H14.5H16.6893L18.6893 11.5V13V13.5858L19.1036 14L20.5355 15L19.1036 16L18.6893 16.4142V17V18.5L16.6893 21.1H14.5H13.5858L13.1515 21.818L12 23.7574L10.8485 21.818L10.4142 21.1H9.5H7.31066L5.31066 18.5V17V16.4142L4.89645 16L3.46447 15L4.89645 14L5.31066 13.5858V13V11.5L7.31066 8.9H9.5H10.4142L10.8485 8.18198L12 6.24264ZM12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <span className={styles.label}>Settings</span>
      </button>
    </nav>
  );
}

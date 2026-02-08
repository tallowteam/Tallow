'use client';

import React from 'react';
import styles from './sidebar.module.css';

interface SidebarProps {
  activeMode: 'local' | 'internet' | 'friends';
  activePanel: string;
  onModeChange: (mode: 'local' | 'internet' | 'friends') => void;
  onPanelChange: (panel: string) => void;
}

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <rect x="2" y="2" width="5" height="5" rx="1" />
    <rect x="9" y="2" width="5" height="5" rx="1" />
    <rect x="2" y="9" width="5" height="5" rx="1" />
    <rect x="9" y="9" width="5" height="5" rx="1" />
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <circle cx="8" cy="8" r="6" />
    <path d="M8 4v4l2 2" />
  </svg>
);

const ChartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M2 12h12" />
    <path d="M4 12V8" />
    <path d="M8 12V4" />
    <path d="M12 12V6" />
  </svg>
);

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M12 6a4 4 0 0 0-8 0c0 4-2 5-2 5h12s-2-1-2-5" />
    <path d="M7 14a1 1 0 0 0 2 0" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <circle cx="8" cy="8" r="2" />
    <path d="M8 2v1M8 13v1M13.66 4.34l-.7.7M3.04 10.96l-.7.7M14 8h-1M3 8H2M13.66 11.66l-.7-.7M3.04 5.04l-.7-.7" />
  </svg>
);

export default function Sidebar({ activeMode, activePanel, onModeChange, onPanelChange }: SidebarProps) {
  const modes = [
    { id: 'local' as const, label: 'Local Network', icon: '🌐' },
    { id: 'internet' as const, label: 'Internet P2P', icon: '🔗' },
    { id: 'friends' as const, label: 'Friends', icon: '👥' },
  ];

  const panels = [
    { id: 'dashboard', label: 'Dashboard', icon: <GridIcon /> },
    { id: 'history', label: 'History', icon: <ClockIcon /> },
    { id: 'statistics', label: 'Statistics', icon: <ChartIcon /> },
    { id: 'notifications', label: 'Notifications', icon: <BellIcon /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={styles.sidebar}>
        {/* Transfer Modes Section */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>TRANSFER MODE</div>
          <div className={styles.modeList}>
            {modes.map((mode) => (
              <button
                key={mode.id}
                className={`${styles.modeButton} ${activeMode === mode.id ? styles.active : ''}`}
                onClick={() => onModeChange(mode.id)}
                aria-label={mode.label}
                aria-current={activeMode === mode.id ? 'true' : undefined}
              >
                <span className={styles.modeIcon}>{mode.icon}</span>
                <span className={styles.modeLabel}>{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.divider} />

        {/* Navigation Panels Section */}
        <nav className={styles.section} aria-label="Transfer panels">
          <div className={styles.panelList} role="tablist">
            {panels.map((panel) => (
              <button
                key={panel.id}
                className={`${styles.panelButton} ${activePanel === panel.id ? styles.active : ''}`}
                onClick={() => onPanelChange(panel.id)}
                aria-label={panel.label}
                aria-selected={activePanel === panel.id}
                role="tab"
              >
                <span className={styles.panelIcon}>{panel.icon}</span>
                <span className={styles.panelLabel}>{panel.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className={styles.bottom}>
          <div className={styles.divider} />
          <div className={styles.version}>Tallow v1.0</div>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className={styles.mobileTabBar}>
        {modes.map((mode) => (
          <button
            key={mode.id}
            className={`${styles.mobileTab} ${activeMode === mode.id ? styles.activeTab : ''}`}
            onClick={() => onModeChange(mode.id)}
            aria-label={mode.label}
            aria-current={activeMode === mode.id ? 'true' : undefined}
          >
            <span className={styles.mobileTabIcon}>{mode.icon}</span>
          </button>
        ))}
        <button
          className={`${styles.mobileTab} ${activePanel === 'dashboard' ? styles.activeTab : ''}`}
          onClick={() => onPanelChange('dashboard')}
          aria-label="Dashboard"
          aria-selected={activePanel === 'dashboard'}
          role="tab"
        >
          <span className={styles.mobileTabIcon}>
            <GridIcon />
          </span>
        </button>
        <button
          className={`${styles.mobileTab} ${activePanel === 'settings' ? styles.activeTab : ''}`}
          onClick={() => onPanelChange('settings')}
          aria-label="Settings"
          aria-selected={activePanel === 'settings'}
          role="tab"
        >
          <span className={styles.mobileTabIcon}>
            <SettingsIcon />
          </span>
        </button>
      </nav>
    </>
  );
}

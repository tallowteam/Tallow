'use client';

import React from 'react';
import styles from './dashboard.module.css';

interface DashboardProps {
  mode: 'local' | 'internet' | 'friends';
  children: React.ReactNode;
}

export function Dashboard({ mode, children }: DashboardProps) {
  const modeLabels = { local: 'Local Network', internet: 'Internet P2P', friends: 'Friends' };
  return (
    <section className={styles.dashboard} data-mode={mode} aria-label={`${modeLabels[mode]} Dashboard`}>
      <h1 className={styles.srOnly}>{modeLabels[mode]} Transfer Dashboard</h1>
      <div className={styles.grid}>
        {children}
      </div>
    </section>
  );
}

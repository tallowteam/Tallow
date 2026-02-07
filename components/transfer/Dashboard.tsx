'use client';

import React from 'react';
import styles from './dashboard.module.css';

interface DashboardProps {
  mode: 'local' | 'internet' | 'friends';
  children: React.ReactNode;
}

export function Dashboard({ mode, children }: DashboardProps) {
  return (
    <main className={styles.dashboard} data-mode={mode}>
      <div className={styles.grid}>
        {children}
      </div>
    </main>
  );
}

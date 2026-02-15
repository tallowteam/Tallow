import styles from './loading.module.css';

export default function TransferLoading() {
  const sidebarItems = Array.from({ length: 5 }, (_, index) => index);
  const modeTabs = Array.from({ length: 3 }, (_, index) => index);
  const deviceRows = Array.from({ length: 4 }, (_, index) => index);
  const transferRows = Array.from({ length: 3 }, (_, index) => index);

  return (
    <div
      className={styles.page}
      data-transfer-loading
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className={styles.srOnly}>Loading transfer workspace...</span>

      <div className={styles.appLayout}>
        <aside className={styles.sidebar} aria-hidden="true">
          <div className={`${styles.skeleton} ${styles.sidebarLogo}`} />
          <div className={styles.sidebarNav}>
            {sidebarItems.map((item) => (
              <div key={item} className={`${styles.skeleton} ${styles.sidebarItem}`} />
            ))}
          </div>
        </aside>

        <div className={styles.mainContent}>
          <section
            className={styles.streamStage}
            data-stream-stage="1"
            aria-hidden="true"
          >
            <div className={styles.trustStrip} data-skeleton="trust-strip">
              <div className={`${styles.skeleton} ${styles.trustBadge}`} />
              <div className={`${styles.skeleton} ${styles.trustText}`} />
            </div>

            <div className={styles.modeSelector} data-skeleton="mode-selector">
              {modeTabs.map((tab) => (
                <div key={tab} className={`${styles.skeleton} ${styles.modeTab}`} />
              ))}
            </div>
          </section>

          <section
            className={styles.streamStage}
            data-stream-stage="2"
            aria-hidden="true"
          >
            <div className={styles.powerActions} data-skeleton="power-actions">
              <div className={`${styles.skeleton} ${styles.commandPaletteButton}`} />
            </div>

            <div className={styles.connectionHeader} data-skeleton="connection-header">
              <div className={`${styles.skeleton} ${styles.connectionSummary}`} />
              <div className={`${styles.skeleton} ${styles.connectionButton}`} />
            </div>
          </section>

          <section
            className={styles.streamStage}
            data-stream-stage="3"
            aria-hidden="true"
          >
            <div className={styles.topRow} data-skeleton="top-row">
              <article className={styles.panel} data-skeleton="drop-zone">
                <div className={`${styles.skeleton} ${styles.dropIcon}`} />
                <div className={`${styles.skeleton} ${styles.dropLinePrimary}`} />
                <div className={`${styles.skeleton} ${styles.dropLineSecondary}`} />
                <div className={styles.dropButtons}>
                  <div className={`${styles.skeleton} ${styles.dropButton}`} />
                  <div className={`${styles.skeleton} ${styles.dropButton}`} />
                </div>
              </article>

              <article className={styles.panel} data-skeleton="device-list">
                <div className={`${styles.skeleton} ${styles.panelHeader}`} />
                <div className={styles.deviceRows}>
                  {deviceRows.map((row) => (
                    <div key={row} className={`${styles.skeleton} ${styles.deviceRow}`} />
                  ))}
                </div>
              </article>
            </div>

            <div className={styles.bottomRow} data-skeleton="bottom-row">
              <article className={styles.panel} data-skeleton="transfer-progress">
                <div className={`${styles.skeleton} ${styles.panelHeader}`} />
                <div className={styles.transferRows}>
                  {transferRows.map((row) => (
                    <div key={row} className={`${styles.skeleton} ${styles.transferRow}`} />
                  ))}
                </div>
              </article>

              <article className={styles.panel} data-skeleton="transfer-history">
                <div className={`${styles.skeleton} ${styles.panelHeader}`} />
                <div className={styles.transferRows}>
                  {transferRows.map((row) => (
                    <div key={`history-${row}`} className={`${styles.skeleton} ${styles.transferRow}`} />
                  ))}
                </div>
              </article>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

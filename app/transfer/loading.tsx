import styles from './loading.module.css';

export default function TransferLoading() {
  return (
    <div className={styles.container}>
      {/* Sidebar Skeleton */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarLogo} />
        <div className={styles.sidebarNav}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.sidebarItem} />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className={styles.main}>
        {/* Mode Selector */}
        <div className={styles.modeSelector}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.modeTab} />
          ))}
        </div>

        {/* Content Area */}
        <div className={styles.content}>
          {/* Drop Zone */}
          <div className={styles.dropZone}>
            <div className={styles.dropIcon} />
            <div className={styles.dropText} />
          </div>

          {/* Device List */}
          <div className={styles.deviceList}>
            <div className={styles.deviceListHeader} />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.deviceCard} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import styles from "./Dashboard.module.css";

export interface StatsSnapshot {
  totalSessions: number;
  totalCharsTyped: number;
  averageWpm: number;
  averageAccuracy: number;
  bestWpm: number;
}

export interface DashboardProps {
  /** Stats snapshot from tracker/session-log.ts */
  stats: StatsSnapshot;
}

/**
 * Dashboard tab — displays overall typing statistics.
 *
 * Shows session count, characters typed, average WPM, accuracy, and personal best.
 * When no sessions exist, displays an encouraging "get started" message.
 *
 * Data flows from tracker/session-log.ts → parent Options component → Dashboard.
 */
export function Dashboard(props: DashboardProps) {
  const { stats } = props;
  const isEmpty = stats.totalSessions === 0;

  return (
    <div className={styles.container}>
      <h2>Dashboard</h2>

      {isEmpty ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>✨</div>
          <p>No sessions yet</p>
          <p className={styles.emptySubtext}>
            Start a practice session to begin tracking your progress
          </p>
        </div>
      ) : (
        <div className={styles.statsGrid}>
          {/* Sessions Card */}
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Sessions</div>
            <div className={styles.statValue}>{stats.totalSessions}</div>
          </div>

          {/* Characters Card */}
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Characters</div>
            <div className={styles.statValue}>{stats.totalCharsTyped}</div>
          </div>

          {/* Average WPM Card */}
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Average WPM</div>
            <div className={styles.statValue}>
              {stats.averageWpm.toFixed(1)}
            </div>
          </div>

          {/* Accuracy Card */}
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Accuracy</div>
            <div className={styles.statValue}>
              {(stats.averageAccuracy * 100).toFixed(1)}%
            </div>
          </div>

          {/* Best WPM Card */}
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Best WPM</div>
            <div className={styles.statValue}>{stats.bestWpm}</div>
          </div>
        </div>
      )}
    </div>
  );
}

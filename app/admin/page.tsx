'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatsCard } from '@/components/admin/StatsCard';
import dynamic from 'next/dynamic';

const SimpleChart = dynamic(
  () => import('@/components/admin/SimpleChart').then((mod) => mod.SimpleChart),
  { loading: () => <div style={{ height: 200, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }} /> }
);
import { ConnectionsTable, type Connection } from '@/components/admin/ConnectionsTable';
import { UsageTracker } from '@/lib/analytics/usage-tracker';
import {
  Activity,
  Users,
  Upload,
  AlertCircle,
  Server,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
} from '@/components/icons';
import styles from './page.module.css';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [stats, setStats] = useState(UsageTracker.getStats(timeRange));
  const [refreshKey, setRefreshKey] = useState(0);

  // Mock active connections (in real app, this would come from connection manager)
  const [activeConnections] = useState<Connection[]>([
    {
      id: '1',
      peerId: 'peer_abc123',
      peerName: 'Alice\'s MacBook',
      type: 'local',
      connectedSince: Date.now() - 3600000,
      bytesTransferred: 1024 * 1024 * 45,
      status: 'transferring',
    },
    {
      id: '2',
      peerId: 'peer_def456',
      peerName: 'Bob\'s iPhone',
      type: 'internet',
      connectedSince: Date.now() - 7200000,
      bytesTransferred: 1024 * 1024 * 12,
      status: 'idle',
    },
    {
      id: '3',
      peerId: 'peer_ghi789',
      peerName: 'Charlie\'s PC',
      type: 'friend',
      connectedSince: Date.now() - 1800000,
      bytesTransferred: 1024 * 1024 * 89,
      status: 'connected',
    },
  ]);

  // Check authentication on mount
  useEffect(() => {
    const isAuth = sessionStorage.getItem('admin-authenticated') === 'true';
    setIsAuthenticated(isAuth);
  }, []);

  // Update stats when time range changes
  useEffect(() => {
    setStats(UsageTracker.getStats(timeRange));
  }, [timeRange, refreshKey]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Check against environment variable (in real app)
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

    if (password === adminPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin-authenticated', 'true');
      setError('');
    } else {
      setError('Invalid password');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin-authenticated');
    setPassword('');
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) {return '0 B/s';}
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return `${(bytesPerSecond / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.loginContainer}>
            <Card>
              <CardContent>
                <div className={styles.loginHeader}>
                  <div className={styles.lockIcon}>
                    <Lock />
                  </div>
                  <h1 className={styles.loginTitle}>Admin Dashboard</h1>
                  <p className={styles.loginDescription}>
                    Enter your admin password to access the dashboard
                  </p>
                </div>

                <form onSubmit={handleLogin} className={styles.loginForm}>
                  <div className={styles.passwordWrapper}>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter admin password"
                      error={error}
                      autoFocus
                    />
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                  {error && <p className={styles.error}>{error}</p>}
                  <Button type="submit" fullWidth>
                    Access Dashboard
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Dashboard screen
  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={`container ${styles.container}`}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <div className={styles.iconWrapper}>
                <Activity className={styles.headerIcon} />
              </div>
              <div>
                <h1 className={styles.title}>Admin Dashboard</h1>
                <p className={styles.description}>
                  Usage analytics and system monitoring
                </p>
              </div>
            </div>
            <div className={styles.headerActions}>
              <Button variant="ghost" onClick={handleRefresh} icon={<RefreshCw />}>
                Refresh
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className={styles.timeRangeSelector}>
            <button
              className={`${styles.timeRangeButton} ${timeRange === '24h' ? styles.active : ''}`}
              onClick={() => setTimeRange('24h')}
            >
              24 Hours
            </button>
            <button
              className={`${styles.timeRangeButton} ${timeRange === '7d' ? styles.active : ''}`}
              onClick={() => setTimeRange('7d')}
            >
              7 Days
            </button>
            <button
              className={`${styles.timeRangeButton} ${timeRange === '30d' ? styles.active : ''}`}
              onClick={() => setTimeRange('30d')}
            >
              30 Days
            </button>
          </div>

          {/* Stats Overview */}
          <div className={styles.statsGrid}>
            <StatsCard
              icon={<Upload />}
              label="Total Transfers"
              value={stats.transfers}
              trend={{ value: 12.5, direction: 'up' }}
              variant="default"
            />
            <StatsCard
              icon={<Users />}
              label="Active Users"
              value={activeConnections.length}
              trend={{ value: 3.2, direction: 'up' }}
              variant="success"
            />
            <StatsCard
              icon={<Activity />}
              label="Bandwidth Used"
              value={formatBytes(stats.totalBytes)}
              trend={{ value: 8.7, direction: 'up' }}
              variant="warning"
            />
            <StatsCard
              icon={<AlertCircle />}
              label="Error Rate"
              value={`${(stats.errorRate * 100).toFixed(1)}%`}
              trend={{ value: 2.3, direction: 'down' }}
              variant="error"
            />
          </div>

          {/* Charts */}
          <div className={styles.chartsGrid}>
            <Card>
              <CardHeader
                title="Transfer Volume"
                description="Number of transfers over time"
              />
              <CardContent>
                <SimpleChart
                  type="line"
                  data={stats.chartData.transferVolume.map((d) => ({
                    label: d.date,
                    value: d.count,
                  }))}
                  height={250}
                  color="#5e5ce6"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="File Types Distribution"
                description="Breakdown by file type"
              />
              <CardContent>
                <SimpleChart
                  type="donut"
                  data={stats.chartData.fileTypes.map((d) => ({
                    label: d.type,
                    value: d.percentage,
                  }))}
                  height={250}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="Connection Methods"
                description="Local vs Internet vs Friend"
              />
              <CardContent>
                <SimpleChart
                  type="bar"
                  data={stats.chartData.connectionMethods.map((d) => ({
                    label: d.method,
                    value: d.count,
                  }))}
                  height={250}
                  color="#22c55e"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="Error Rate Trend"
                description="Errors over time"
              />
              <CardContent>
                <SimpleChart
                  type="area"
                  data={stats.chartData.errorRate.map((d) => ({
                    label: d.date,
                    value: d.total > 0 ? (d.errors / d.total) * 100 : 0,
                  }))}
                  height={250}
                  color="#ef4444"
                />
              </CardContent>
            </Card>
          </div>

          {/* Active Connections Table */}
          <section className={styles.section}>
            <Card>
              <CardHeader
                title="Active Connections"
                description={`${activeConnections.length} active peer connections`}
              />
              <CardContent noPadding>
                <ConnectionsTable connections={activeConnections} />
              </CardContent>
            </Card>
          </section>

          {/* System Health */}
          <section className={styles.section}>
            <Card>
              <CardHeader
                title="System Health"
                description="Real-time system metrics"
              />
              <CardContent>
                <div className={styles.healthGrid}>
                  <div className={styles.healthItem}>
                    <div className={styles.healthLabel}>
                      <Server className={styles.healthIcon} />
                      <span>CPU Usage</span>
                    </div>
                    <div className={styles.healthValue}>
                      <Badge variant="success">12%</Badge>
                    </div>
                  </div>

                  <div className={styles.healthItem}>
                    <div className={styles.healthLabel}>
                      <Server className={styles.healthIcon} />
                      <span>Memory</span>
                    </div>
                    <div className={styles.healthValue}>
                      <Badge variant="warning">64%</Badge>
                    </div>
                  </div>

                  <div className={styles.healthItem}>
                    <div className={styles.healthLabel}>
                      <Server className={styles.healthIcon} />
                      <span>Disk Space</span>
                    </div>
                    <div className={styles.healthValue}>
                      <Badge variant="success">42%</Badge>
                    </div>
                  </div>

                  <div className={styles.healthItem}>
                    <div className={styles.healthLabel}>
                      <Activity className={styles.healthIcon} />
                      <span>Uptime</span>
                    </div>
                    <div className={styles.healthValue}>
                      <Badge variant="secondary">7d 14h</Badge>
                    </div>
                  </div>

                  <div className={styles.healthItem}>
                    <div className={styles.healthLabel}>
                      <Activity className={styles.healthIcon} />
                      <span>Avg Speed</span>
                    </div>
                    <div className={styles.healthValue}>
                      <Badge variant="secondary">{formatSpeed(stats.avgSpeed)}</Badge>
                    </div>
                  </div>

                  <div className={styles.healthItem}>
                    <div className={styles.healthLabel}>
                      <Users className={styles.healthIcon} />
                      <span>Connections</span>
                    </div>
                    <div className={styles.healthValue}>
                      <Badge variant="success">{activeConnections.length}/100</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

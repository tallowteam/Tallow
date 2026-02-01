'use client';

/**
 * TURN Server Health Check and Management
 *
 * Monitors TURN server availability and performance:
 * - Periodic health checks
 * - Automatic failover to backup servers
 * - Latency-based server selection
 * - Connection quality monitoring
 *
 * Ensures optimal TURN server selection for maximum P2P success.
 */

import secureLog from '../utils/secure-logger';
import { captureException, addBreadcrumb } from '../monitoring/sentry';

// ============================================================================
// Type Definitions
// ============================================================================

export interface TURNServer {
  urls: string | string[];
  username?: string;
  credential?: string;
  priority?: number; // Lower = higher priority
  region?: string; // Geographic region (e.g., 'us-east', 'eu-west')
}

export interface TURNServerHealth {
  server: TURNServer;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  latency: number; // Average RTT in milliseconds
  successRate: number; // 0-1
  lastCheck: number; // Timestamp
  failureCount: number;
  consecutiveFailures: number;
  totalChecks: number;
  bandwidth?: number; // Estimated bandwidth in kbps
  uptime?: number; // Uptime percentage
}

export interface HealthCheckResult {
  server: TURNServer;
  success: boolean;
  latency: number;
  error?: string;
  timestamp: number;
}

export interface TURNServerConfig {
  servers: TURNServer[];
  healthCheckInterval?: number; // ms, default 60000 (1 minute)
  healthCheckTimeout?: number; // ms, default 5000
  failureThreshold?: number; // consecutive failures before marking unhealthy
  unhealthyTimeout?: number; // ms to wait before retrying unhealthy server
  enableAutoFailover?: boolean;
  enableLatencyOptimization?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG = {
  healthCheckInterval: 60000, // 1 minute
  healthCheckTimeout: 5000, // 5 seconds
  failureThreshold: 3, // Mark unhealthy after 3 consecutive failures
  unhealthyTimeout: 300000, // Retry unhealthy servers after 5 minutes
  enableAutoFailover: true,
  enableLatencyOptimization: true,
};

const LATENCY_THRESHOLDS = {
  excellent: 50, // < 50ms
  good: 100, // < 100ms
  fair: 200, // < 200ms
  poor: 500, // < 500ms
  // > 500ms = very poor
};

const STATUS_THRESHOLDS = {
  healthy: 0.9, // 90% success rate
  degraded: 0.7, // 70% success rate
  // < 70% = unhealthy
};

// ============================================================================
// TURN Health Monitor
// ============================================================================

export class TURNHealthMonitor {
  private config: Required<TURNServerConfig>;
  private healthStatus: Map<string, TURNServerHealth> = new Map();
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private isMonitoring = false;
  private activeChecks = 0;

  constructor(config: TURNServerConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    // Initialize health status for all servers
    this.initializeHealthStatus();
  }

  /**
   * Start monitoring TURN server health
   */
  start(): void {
    if (this.isMonitoring) {
      secureLog.warn('[TURN Health] Already monitoring');
      return;
    }

    this.isMonitoring = true;

    // Perform initial health check
    this.performHealthChecks();

    // Schedule periodic checks
    this.checkInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);

    secureLog.log('[TURN Health] Monitoring started', {
      servers: this.config.servers.length,
      interval: `${this.config.healthCheckInterval}ms`,
    });

    addBreadcrumb('turn-health', 'TURN health monitoring started');
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isMonitoring = false;

    secureLog.log('[TURN Health] Monitoring stopped');
  }

  /**
   * Get the best available TURN server based on health and latency
   */
  getBestServer(): TURNServer | null {
    const healthyServers = Array.from(this.healthStatus.values())
      .filter(h => h.status === 'healthy' || h.status === 'degraded')
      .sort((a, b) => {
        // Sort by priority first (if available)
        const priorityA = a.server.priority ?? 999;
        const priorityB = b.server.priority ?? 999;
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        // Then by status
        if (a.status !== b.status) {
          return a.status === 'healthy' ? -1 : 1;
        }

        // Then by latency (if enabled)
        if (this.config.enableLatencyOptimization) {
          return a.latency - b.latency;
        }

        return 0;
      });

    const best = healthyServers[0];
    if (best) {
      secureLog.log('[TURN Health] Selected best server:', {
        status: best.status,
        latency: `${best.latency.toFixed(0)}ms`,
        successRate: `${(best.successRate * 100).toFixed(1)}%`,
      });
      return best.server;
    }

    // Fallback to first server if no healthy ones found
    if (this.config.servers.length > 0) {
      secureLog.warn('[TURN Health] No healthy servers, using fallback');
      return this.config.servers[0] ?? null;
    }

    return null;
  }

  /**
   * Get all TURN servers sorted by health
   */
  getAllServers(): TURNServer[] {
    return Array.from(this.healthStatus.values())
      .sort((a, b) => {
        // Healthy before degraded before unhealthy
        const statusOrder = { healthy: 0, degraded: 1, unhealthy: 2, unknown: 3 };
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        if (statusDiff !== 0) {return statusDiff;}

        // Lower latency first
        return a.latency - b.latency;
      })
      .map(h => h.server);
  }

  /**
   * Get health status for a specific server
   */
  getServerHealth(server: TURNServer): TURNServerHealth | null {
    const key = this.getServerKey(server);
    return this.healthStatus.get(key) ?? null;
  }

  /**
   * Get health status for all servers
   */
  getAllHealthStatus(): TURNServerHealth[] {
    return Array.from(this.healthStatus.values());
  }

  /**
   * Get servers by status
   */
  getServersByStatus(status: TURNServerHealth['status']): TURNServer[] {
    return Array.from(this.healthStatus.values())
      .filter(h => h.status === status)
      .map(h => h.server);
  }

  /**
   * Manually trigger a health check
   */
  async checkNow(): Promise<HealthCheckResult[]> {
    return this.performHealthChecks();
  }

  /**
   * Get monitoring statistics
   */
  getStatistics(): {
    totalServers: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    unknown: number;
    avgLatency: number;
    avgSuccessRate: number;
  } {
    const all = Array.from(this.healthStatus.values());
    const healthy = all.filter(h => h.status === 'healthy').length;
    const degraded = all.filter(h => h.status === 'degraded').length;
    const unhealthy = all.filter(h => h.status === 'unhealthy').length;
    const unknown = all.filter(h => h.status === 'unknown').length;

    const avgLatency = all.length > 0
      ? all.reduce((sum, h) => sum + h.latency, 0) / all.length
      : 0;

    const avgSuccessRate = all.length > 0
      ? all.reduce((sum, h) => sum + h.successRate, 0) / all.length
      : 0;

    return {
      totalServers: all.length,
      healthy,
      degraded,
      unhealthy,
      unknown,
      avgLatency,
      avgSuccessRate,
    };
  }

  /**
   * Add a new TURN server to monitor
   */
  addServer(server: TURNServer): void {
    const key = this.getServerKey(server);
    if (!this.healthStatus.has(key)) {
      this.config.servers.push(server);
      this.initializeServerHealth(server);
      secureLog.log('[TURN Health] Added new server:', this.extractServerUrl(server));
    }
  }

  /**
   * Remove a TURN server from monitoring
   */
  removeServer(server: TURNServer): void {
    const key = this.getServerKey(server);
    this.healthStatus.delete(key);
    this.config.servers = this.config.servers.filter(s => this.getServerKey(s) !== key);
    secureLog.log('[TURN Health] Removed server:', this.extractServerUrl(server));
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Initialize health status for all servers
   */
  private initializeHealthStatus(): void {
    this.config.servers.forEach(server => {
      this.initializeServerHealth(server);
    });
  }

  /**
   * Initialize health status for a single server
   */
  private initializeServerHealth(server: TURNServer): void {
    const key = this.getServerKey(server);
    this.healthStatus.set(key, {
      server,
      status: 'unknown',
      latency: 0,
      successRate: 0,
      lastCheck: 0,
      failureCount: 0,
      consecutiveFailures: 0,
      totalChecks: 0,
    });
  }

  /**
   * Perform health checks on all servers
   */
  private async performHealthChecks(): Promise<HealthCheckResult[]> {
    if (this.activeChecks > 0) {
      secureLog.log('[TURN Health] Health check already in progress');
      return [];
    }

    this.activeChecks++;
    const results: HealthCheckResult[] = [];

    try {
      // Check all servers in parallel
      const checks = this.config.servers.map(server => this.checkServer(server));
      const checkResults = await Promise.allSettled(checks);

      checkResults.forEach((result, index) => {
        const server = this.config.servers[index];
        if (!server) {return;}

        if (result.status === 'fulfilled') {
          results.push(result.value);
          this.updateHealthStatus(server, result.value);
        } else {
          // Promise rejected
          const errorResult: HealthCheckResult = {
            server,
            success: false,
            latency: 0,
            error: result.reason,
            timestamp: Date.now(),
          };
          results.push(errorResult);
          this.updateHealthStatus(server, errorResult);
        }
      });

      const stats = this.getStatistics();
      secureLog.log('[TURN Health] Check complete:', {
        healthy: stats.healthy,
        degraded: stats.degraded,
        unhealthy: stats.unhealthy,
        avgLatency: `${stats.avgLatency.toFixed(0)}ms`,
      });
    } finally {
      this.activeChecks--;
    }

    return results;
  }

  /**
   * Check a single TURN server
   */
  private async checkServer(server: TURNServer): Promise<HealthCheckResult> {
    const startTime = performance.now();

    try {
      // Skip unhealthy servers temporarily
      const health = this.getServerHealth(server);
      if (health?.status === 'unhealthy') {
        const timeSinceLastCheck = Date.now() - health.lastCheck;
        if (timeSinceLastCheck < this.config.unhealthyTimeout) {
          return {
            server,
            success: false,
            latency: 0,
            error: 'Server marked unhealthy, skipping check',
            timestamp: Date.now(),
          };
        }
      }

      // Perform actual health check using WebRTC
      const latency = await this.performWebRTCCheck(server);

      const result: HealthCheckResult = {
        server,
        success: true,
        latency,
        timestamp: Date.now(),
      };

      return result;
    } catch (error) {
      const result: HealthCheckResult = {
        server,
        success: false,
        latency: performance.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      };

      return result;
    }
  }

  /**
   * Perform WebRTC-based health check
   */
  private async performWebRTCCheck(server: TURNServer): Promise<number> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pc.close();
        reject(new Error('Health check timeout'));
      }, this.config.healthCheckTimeout);

      let startTime = performance.now();
      const pc = new RTCPeerConnection({
        iceServers: [server],
        iceCandidatePoolSize: 0,
      });

      let relayFound = false;

      pc.onicecandidate = (event) => {
        if (event.candidate?.type === 'relay') {
          relayFound = true;
          const latency = performance.now() - startTime;
          clearTimeout(timeout);
          pc.close();
          resolve(latency);
        }
      };

      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete') {
          clearTimeout(timeout);
          if (relayFound) {
            const latency = performance.now() - startTime;
            pc.close();
            resolve(latency);
          } else {
            pc.close();
            reject(new Error('No relay candidate found'));
          }
        }
      };

      // Create a data channel to trigger ICE gathering
      pc.createDataChannel('health-check');

      // Start ICE gathering
      startTime = performance.now();
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(error => {
          clearTimeout(timeout);
          pc.close();
          reject(error);
        });
    });
  }

  /**
   * Update health status based on check result
   */
  private updateHealthStatus(server: TURNServer, result: HealthCheckResult): void {
    const key = this.getServerKey(server);
    const health = this.healthStatus.get(key);
    if (!health) {return;}

    health.lastCheck = result.timestamp;
    health.totalChecks++;

    if (result.success) {
      // Successful check
      health.consecutiveFailures = 0;

      // Update latency (exponential moving average)
      health.latency = health.latency === 0
        ? result.latency
        : health.latency * 0.7 + result.latency * 0.3;

      // Update success rate
      const totalAttempts = health.failureCount + health.totalChecks;
      health.successRate = totalAttempts > 0
        ? (health.totalChecks - health.failureCount) / totalAttempts
        : 1;

      // Update status
      if (health.successRate >= STATUS_THRESHOLDS.healthy) {
        health.status = 'healthy';
      } else if (health.successRate >= STATUS_THRESHOLDS.degraded) {
        health.status = 'degraded';
      } else {
        health.status = 'unhealthy';
      }
    } else {
      // Failed check
      health.failureCount++;
      health.consecutiveFailures++;

      // Update success rate
      const totalAttempts = health.failureCount + health.totalChecks;
      health.successRate = totalAttempts > 0
        ? (health.totalChecks - health.failureCount) / totalAttempts
        : 0;

      // Mark as unhealthy after threshold
      if (health.consecutiveFailures >= this.config.failureThreshold) {
        health.status = 'unhealthy';

        secureLog.warn('[TURN Health] Server marked unhealthy:', {
          server: this.extractServerUrl(server),
          consecutiveFailures: health.consecutiveFailures,
          error: result.error,
        });

        // Report to monitoring
        captureException(new Error(`TURN server unhealthy: ${result.error}`), {
          tags: { module: 'turn-health', operation: 'health-check' },
          extra: {
            server: this.extractServerUrl(server),
            consecutiveFailures: health.consecutiveFailures,
            successRate: health.successRate,
          },
        });
      } else if (health.successRate < STATUS_THRESHOLDS.degraded) {
        health.status = 'degraded';
      }
    }
  }

  /**
   * Generate unique key for a server
   */
  private getServerKey(server: TURNServer): string {
    const urls = Array.isArray(server.urls) ? server.urls.join(',') : server.urls;
    return `${urls}|${server.username ?? ''}`;
  }

  /**
   * Extract readable URL from server config
   */
  private extractServerUrl(server: TURNServer): string {
    if (Array.isArray(server.urls)) {
      return server.urls[0] ?? 'unknown';
    }
    return server.urls;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let monitorInstance: TURNHealthMonitor | null = null;

export function getTURNHealthMonitor(config?: TURNServerConfig): TURNHealthMonitor {
  if (!monitorInstance && config) {
    monitorInstance = new TURNHealthMonitor(config);
  }
  if (!monitorInstance) {
    throw new Error('TURN health monitor not initialized. Provide config on first call.');
  }
  return monitorInstance;
}

/**
 * Initialize TURN health monitoring with configuration
 */
export function initializeTURNHealth(config: TURNServerConfig): TURNHealthMonitor {
  if (monitorInstance) {
    monitorInstance.stop();
  }
  monitorInstance = new TURNHealthMonitor(config);
  return monitorInstance;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get latency quality description
 */
export function getLatencyQuality(latency: number): string {
  if (latency < LATENCY_THRESHOLDS.excellent) {return 'excellent';}
  if (latency < LATENCY_THRESHOLDS.good) {return 'good';}
  if (latency < LATENCY_THRESHOLDS.fair) {return 'fair';}
  if (latency < LATENCY_THRESHOLDS.poor) {return 'poor';}
  return 'very_poor';
}

/**
 * Create default TURN server configuration from environment
 */
export function createDefaultTURNConfig(): TURNServerConfig {
  const servers: TURNServer[] = [];

  // Primary TURN server from environment
  const primaryServer = process.env['NEXT_PUBLIC_TURN_SERVER'];
  const primaryUsername = process.env['NEXT_PUBLIC_TURN_USERNAME'];
  const primaryCredential = process.env['NEXT_PUBLIC_TURN_CREDENTIAL'];

  if (primaryServer && primaryUsername && primaryCredential) {
    servers.push({
      urls: primaryServer,
      username: primaryUsername,
      credential: primaryCredential,
      priority: 1,
    });
  }

  // Backup TURN servers (if configured)
  const backupServer = process.env['NEXT_PUBLIC_TURN_BACKUP_SERVER'];
  const backupUsername = process.env['NEXT_PUBLIC_TURN_BACKUP_USERNAME'];
  const backupCredential = process.env['NEXT_PUBLIC_TURN_BACKUP_CREDENTIAL'];

  if (backupServer && backupUsername && backupCredential) {
    servers.push({
      urls: backupServer,
      username: backupUsername,
      credential: backupCredential,
      priority: 2,
    });
  }

  return {
    servers,
    healthCheckInterval: 60000,
    healthCheckTimeout: 5000,
    failureThreshold: 3,
    unhealthyTimeout: 300000,
    enableAutoFailover: true,
    enableLatencyOptimization: true,
  };
}

export default {
  TURNHealthMonitor,
  getTURNHealthMonitor,
  initializeTURNHealth,
  getLatencyQuality,
  createDefaultTURNConfig,
};

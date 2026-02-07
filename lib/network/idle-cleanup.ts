/**
 * Idle Connection Cleanup
 *
 * Monitors active P2P connections and automatically closes them
 * after a period of inactivity to conserve resources.
 *
 * Features:
 * - Tracks data activity per connection
 * - Sends warning message before disconnecting
 * - Configurable timeout (default 5 minutes)
 * - Manual timer reset on data activity
 *
 * @module network/idle-cleanup
 */

import { useDeviceStore } from '@/lib/stores/device-store';
import secureLog from '@/lib/utils/secure-logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ConnectionTimer {
  connectionId: string;
  peerId: string;
  peerName: string | null;
  timeoutId: NodeJS.Timeout;
  lastActivity: number;
  channel: RTCDataChannel | null;
}

interface IdleMonitorState {
  isMonitoring: boolean;
  timers: Map<string, ConnectionTimer>;
  defaultTimeout: number;
  checkIntervalId: NodeJS.Timeout | null;
}

// ============================================================================
// STATE
// ============================================================================

const state: IdleMonitorState = {
  isMonitoring: false,
  timers: new Map(),
  defaultTimeout: 5 * 60 * 1000, // 5 minutes default
  checkIntervalId: null,
};

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Send a warning message to the peer before disconnecting
 */
function sendDisconnectWarning(channel: RTCDataChannel | null, reason: string): void {
  if (!channel || channel.readyState !== 'open') {
    return;
  }

  try {
    const message = JSON.stringify({
      type: 'system-notification',
      message: reason,
      timestamp: Date.now(),
    });
    channel.send(message);
    secureLog.log('[IdleCleanup] Sent disconnect warning:', reason);
  } catch (error) {
    secureLog.error('[IdleCleanup] Failed to send warning:', error);
  }
}

/**
 * Close a connection and clean up resources
 */
function closeConnection(timer: ConnectionTimer): void {
  const { connectionId, peerId, peerName, channel } = timer;

  secureLog.log(
    `[IdleCleanup] Closing idle connection: ${peerName || peerId} (inactive for ${
      Date.now() - timer.lastActivity
    }ms)`
  );

  // Send warning before disconnecting
  sendDisconnectWarning(channel, 'Connection closed due to inactivity');

  // Use device store to disconnect
  const deviceStore = useDeviceStore.getState();
  if (deviceStore.connection.peerId === peerId) {
    deviceStore.disconnect();
  }

  // Remove timer from active timers
  state.timers.delete(connectionId);

  secureLog.log(`[IdleCleanup] Cleaned up connection ${connectionId}`);
}

/**
 * Create a timeout for a connection
 */
function createConnectionTimer(
  connectionId: string,
  peerId: string,
  peerName: string | null,
  channel: RTCDataChannel | null,
  timeoutMs: number
): ConnectionTimer {
  const timeoutId = setTimeout(() => {
    const timer = state.timers.get(connectionId);
    if (timer) {
      closeConnection(timer);
    }
  }, timeoutMs);

  return {
    connectionId,
    peerId,
    peerName,
    timeoutId,
    lastActivity: Date.now(),
    channel,
  };
}

/**
 * Check all active connections and register them for monitoring
 */
function checkActiveConnections(): void {
  const deviceStore = useDeviceStore.getState();
  const { connection } = deviceStore;

  // Only monitor connected peers
  if (connection.status !== 'connected' || !connection.peerId) {
    return;
  }

  const connectionId = `${connection.peerId}-${connection.timestamp}`;

  // Skip if already monitoring this connection
  if (state.timers.has(connectionId)) {
    return;
  }

  // Create new timer for this connection
  secureLog.log(
    `[IdleCleanup] Started monitoring connection: ${connection.peerName || connection.peerId}`
  );

  const timer = createConnectionTimer(
    connectionId,
    connection.peerId,
    connection.peerName,
    null, // Channel would need to be passed from connection hook
    state.defaultTimeout
  );

  state.timers.set(connectionId, timer);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Start monitoring all active connections for idle timeout
 *
 * @param timeoutMs - Inactivity timeout in milliseconds (default: 5 minutes)
 *
 * @example
 * ```ts
 * // Start monitoring with 3 minute timeout
 * startIdleMonitor(3 * 60 * 1000);
 * ```
 */
export function startIdleMonitor(timeoutMs: number = 5 * 60 * 1000): void {
  if (state.isMonitoring) {
    secureLog.warn('[IdleCleanup] Monitor already running');
    return;
  }

  state.defaultTimeout = timeoutMs;
  state.isMonitoring = true;

  secureLog.log(`[IdleCleanup] Started idle monitor (timeout: ${timeoutMs}ms)`);

  // Check for active connections immediately
  checkActiveConnections();

  // Check periodically for new connections (every 10 seconds)
  state.checkIntervalId = setInterval(() => {
    checkActiveConnections();
  }, 10_000);
}

/**
 * Stop monitoring all connections
 *
 * Clears all active timers and stops the monitoring interval.
 *
 * @example
 * ```ts
 * stopIdleMonitor();
 * ```
 */
export function stopIdleMonitor(): void {
  if (!state.isMonitoring) {
    return;
  }

  secureLog.log('[IdleCleanup] Stopping idle monitor');

  // Clear all timers
  state.timers.forEach((timer) => {
    clearTimeout(timer.timeoutId);
  });
  state.timers.clear();

  // Clear interval
  if (state.checkIntervalId) {
    clearInterval(state.checkIntervalId);
    state.checkIntervalId = null;
  }

  state.isMonitoring = false;
}

/**
 * Reset the idle timer for a specific connection
 *
 * Call this whenever data is transferred to prevent idle timeout.
 *
 * @param connectionId - Unique connection identifier
 *
 * @example
 * ```ts
 * // Reset timer when file chunk is sent/received
 * resetTimer(connectionId);
 * ```
 */
export function resetTimer(connectionId: string): void {
  const timer = state.timers.get(connectionId);
  if (!timer) {
    return;
  }

  // Clear old timeout
  clearTimeout(timer.timeoutId);

  // Create new timeout
  timer.timeoutId = setTimeout(() => {
    const currentTimer = state.timers.get(connectionId);
    if (currentTimer) {
      closeConnection(currentTimer);
    }
  }, state.defaultTimeout);

  // Update last activity timestamp
  timer.lastActivity = Date.now();

  secureLog.log(`[IdleCleanup] Reset timer for connection ${connectionId}`);
}

/**
 * Get the current monitoring state
 *
 * @returns Current state including active timers and configuration
 */
export function getMonitorState(): {
  isMonitoring: boolean;
  activeConnections: number;
  defaultTimeout: number;
  connections: Array<{
    connectionId: string;
    peerId: string;
    peerName: string | null;
    lastActivity: number;
    idleTime: number;
  }>;
} {
  return {
    isMonitoring: state.isMonitoring,
    activeConnections: state.timers.size,
    defaultTimeout: state.defaultTimeout,
    connections: Array.from(state.timers.values()).map((timer) => ({
      connectionId: timer.connectionId,
      peerId: timer.peerId,
      peerName: timer.peerName,
      lastActivity: timer.lastActivity,
      idleTime: Date.now() - timer.lastActivity,
    })),
  };
}

/**
 * Register a data channel for disconnect warnings
 *
 * Allows the monitor to send messages before closing the connection.
 *
 * @param connectionId - Connection identifier
 * @param channel - RTCDataChannel instance
 */
export function registerDataChannel(
  connectionId: string,
  channel: RTCDataChannel
): void {
  const timer = state.timers.get(connectionId);
  if (timer) {
    timer.channel = channel;
    secureLog.log(`[IdleCleanup] Registered data channel for ${connectionId}`);
  }
}

// ============================================================================
// CLEANUP
// ============================================================================

// Auto-cleanup on module unload (browser only)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    stopIdleMonitor();
  });
}

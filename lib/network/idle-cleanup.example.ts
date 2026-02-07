/**
 * Idle Connection Cleanup - Usage Examples
 *
 * Demonstrates how to use the idle cleanup utility in your application.
 */

import {
  startIdleMonitor,
  stopIdleMonitor,
  resetTimer,
  getMonitorState,
  registerDataChannel,
} from './idle-cleanup';

// ============================================================================
// EXAMPLE 1: Basic Usage
// ============================================================================

/**
 * Start monitoring connections with default 5 minute timeout
 */
export function example1_BasicUsage() {
  // Start monitoring with default timeout (5 minutes)
  startIdleMonitor();

  // Later, when done...
  // stopIdleMonitor();
}

// ============================================================================
// EXAMPLE 2: Custom Timeout
// ============================================================================

/**
 * Start monitoring with custom 3 minute timeout
 */
export function example2_CustomTimeout() {
  const THREE_MINUTES = 3 * 60 * 1000;
  startIdleMonitor(THREE_MINUTES);
}

// ============================================================================
// EXAMPLE 3: Integration with File Transfer
// ============================================================================

/**
 * Reset timer whenever data is transferred
 */
export function example3_FileTransferIntegration(
  connectionId: string,
  onChunkSent: () => void
) {
  // In your file transfer handler
  const handleChunkSent = () => {
    // Reset idle timer on each chunk
    resetTimer(connectionId);
    onChunkSent();
  };

  return handleChunkSent;
}

// ============================================================================
// EXAMPLE 4: Monitor State Inspection
// ============================================================================

/**
 * Check current monitoring state
 */
export function example4_InspectState() {
  const state = getMonitorState();

  console.log('Monitoring:', state.isMonitoring);
  console.log('Active connections:', state.activeConnections);
  console.log('Timeout:', state.defaultTimeout, 'ms');

  state.connections.forEach((conn) => {
    console.log(`Connection ${conn.peerId}:`);
    console.log(`  - Idle time: ${conn.idleTime}ms`);
    console.log(`  - Last activity: ${new Date(conn.lastActivity).toISOString()}`);
  });
}

// ============================================================================
// EXAMPLE 5: Integration with WebRTC Data Channel
// ============================================================================

/**
 * Register data channel for disconnect warnings
 */
export function example5_RegisterDataChannel(
  connectionId: string,
  channel: RTCDataChannel
) {
  // Register the channel so warnings can be sent before disconnect
  registerDataChannel(connectionId, channel);

  // Listen for data to reset timer
  channel.addEventListener('message', () => {
    resetTimer(connectionId);
  });
}

// ============================================================================
// EXAMPLE 6: Component Integration (React)
// ============================================================================

/**
 * Example React hook for idle monitoring
 */
export function useIdleMonitoring(enabled: boolean, timeoutMs: number = 5 * 60 * 1000) {
  // In a real React component:
  // useEffect(() => {
  //   if (enabled) {
  //     startIdleMonitor(timeoutMs);
  //   }
  //   return () => {
  //     stopIdleMonitor();
  //   };
  // }, [enabled, timeoutMs]);
}

// ============================================================================
// EXAMPLE 7: Cleanup on Page Unload
// ============================================================================

/**
 * Proper cleanup pattern
 */
export function example7_ProperCleanup() {
  // Start monitoring
  startIdleMonitor();

  // Setup cleanup
  const cleanup = () => {
    console.log('Cleaning up idle monitor...');
    stopIdleMonitor();
  };

  // In browser environment
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanup);
  }

  // Return cleanup function for manual use
  return cleanup;
}

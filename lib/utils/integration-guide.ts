/**
 * Utility Features Integration Guide
 *
 * Complete integration examples for all three utility features.
 * Copy these patterns into your components.
 */

import { useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDeviceStore } from '@/lib/stores/device-store';
import {
  startIdleMonitor,
  stopIdleMonitor,
  resetTimer,
  registerDataChannel,
} from '@/lib/network/idle-cleanup';
import { scheduleTask, cancelTask, getSchedulerStats } from '@/lib/scheduling/task-scheduler';

// ============================================================================
// INTEGRATION 1: Transfer Page with All Features
// ============================================================================

/**
 * Complete integration in a transfer page component
 */
export function TransferPageIntegration() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { devices, selectDeviceById } = useDeviceStore();

  // ===== FEATURE 1: Peer URL State =====
  const peerFromUrl = searchParams.get('peer');

  useEffect(() => {
    // Auto-select peer from URL when devices are discovered
    if (peerFromUrl && devices.length > 0) {
      const targetDevice = devices.find((d) => d.id === peerFromUrl);
      if (targetDevice) {
        selectDeviceById(peerFromUrl);
        console.log('[Integration] Auto-selected peer:', targetDevice.name);
      }
    }
  }, [peerFromUrl, devices, selectDeviceById]);

  const handleDeviceSelect = useCallback(
    (deviceId: string) => {
      // Update URL with peer parameter
      const params = new URLSearchParams(window.location.search);
      params.set('peer', deviceId);
      router.push(`/transfer?${params.toString()}`, { scroll: false });

      // Continue with device selection logic...
      selectDeviceById(deviceId);
    },
    [router, selectDeviceById]
  );

  // ===== FEATURE 2: Idle Connection Cleanup =====
  useEffect(() => {
    // Start monitoring connections with 5 minute timeout
    const FIVE_MINUTES = 5 * 60 * 1000;
    startIdleMonitor(FIVE_MINUTES);

    console.log('[Integration] Started idle connection monitoring');

    return () => {
      // Cleanup on unmount
      stopIdleMonitor();
      console.log('[Integration] Stopped idle connection monitoring');
    };
  }, []);

  const handleDataTransfer = useCallback((connectionId: string, data: ArrayBuffer) => {
    // Reset idle timer on data activity
    resetTimer(connectionId);

    // Process the data...
    console.log('[Integration] Data transferred, idle timer reset');
  }, []);

  // ===== FEATURE 3: Background Task Scheduler =====
  useEffect(() => {
    // Schedule periodic cleanup task
    const taskId = scheduleTask({
      id: 'periodic-cleanup',
      callback: async () => {
        console.log('[Integration] Running scheduled cleanup...');
        // Cleanup logic here
      },
      runAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      priority: 'low',
    });

    // Log scheduler stats
    const stats = getSchedulerStats();
    console.log('[Integration] Scheduler:', stats);

    return () => {
      // Cancel task on unmount
      cancelTask(taskId);
    };
  }, []);

  return null; // Your JSX here
}

// ============================================================================
// INTEGRATION 2: WebRTC Connection Hook
// ============================================================================

/**
 * Integration with P2P connection management
 */
export function useP2PConnectionWithUtilities() {
  const connectionIdRef = { current: null as string | null };

  const setupConnection = useCallback((channel: RTCDataChannel, peerId: string) => {
    const connectionId = `${peerId}-${Date.now()}`;
    connectionIdRef.current = connectionId;

    // Register data channel for idle cleanup warnings
    registerDataChannel(connectionId, channel);

    // Reset idle timer on any message
    channel.addEventListener('message', () => {
      resetTimer(connectionId);
    });

    console.log('[Integration] WebRTC connection utilities configured');
  }, []);

  const cleanupConnection = useCallback(() => {
    if (connectionIdRef.current) {
      // Connection will be cleaned up automatically by idle monitor
      console.log('[Integration] Connection cleanup initiated');
      connectionIdRef.current = null;
    }
  }, []);

  return { setupConnection, cleanupConnection };
}

// ============================================================================
// INTEGRATION 3: File Transfer with Activity Tracking
// ============================================================================

/**
 * File transfer with idle timer reset
 */
export function useFileTransferWithIdleReset(connectionId: string) {
  const sendChunk = useCallback(
    async (chunk: ArrayBuffer) => {
      // Reset idle timer before sending
      resetTimer(connectionId);

      // Send chunk...
      console.log('[Integration] Chunk sent, idle timer reset');
    },
    [connectionId]
  );

  const receiveChunk = useCallback(
    (chunk: ArrayBuffer) => {
      // Reset idle timer on receive
      resetTimer(connectionId);

      // Process chunk...
      console.log('[Integration] Chunk received, idle timer reset');
    },
    [connectionId]
  );

  return { sendChunk, receiveChunk };
}

// ============================================================================
// INTEGRATION 4: Background Tasks for Transfer Management
// ============================================================================

/**
 * Schedule background tasks for transfer lifecycle
 */
export function useTransferScheduling() {
  const scheduleTransferCleanup = useCallback((transferId: string, delayMs: number) => {
    const taskId = scheduleTask({
      id: `cleanup-transfer-${transferId}`,
      callback: async () => {
        console.log(`[Integration] Cleaning up transfer ${transferId}`);
        // Cleanup logic
      },
      runAt: new Date(Date.now() + delayMs),
      priority: 'low',
    });

    return taskId;
  }, []);

  const scheduleRetry = useCallback((transferId: string, retryCount: number) => {
    const taskId = scheduleTask({
      id: `retry-transfer-${transferId}`,
      callback: async () => {
        console.log(`[Integration] Retrying transfer ${transferId} (attempt ${retryCount})`);
        // Retry logic
      },
      runAt: new Date(Date.now() + retryCount * 5000), // Exponential backoff
      priority: retryCount > 3 ? 'low' : 'normal',
    });

    return taskId;
  }, []);

  return { scheduleTransferCleanup, scheduleRetry };
}

// ============================================================================
// INTEGRATION 5: URL State with Multiple Parameters
// ============================================================================

/**
 * Manage multiple URL parameters simultaneously
 */
export function useTransferUrlState() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateUrlParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(window.location.search);

      // Apply updates
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      // Update URL
      const search = params.toString();
      router.push(search ? `/transfer?${search}` : '/transfer', { scroll: false });

      console.log('[Integration] URL updated:', search);
    },
    [router]
  );

  // Example: Update peer and room simultaneously
  const selectPeerAndRoom = useCallback(
    (peerId: string, roomCode: string) => {
      updateUrlParams({
        peer: peerId,
        room: roomCode,
      });
    },
    [updateUrlParams]
  );

  return {
    peer: searchParams.get('peer'),
    room: searchParams.get('room'),
    view: searchParams.get('view'),
    updateUrlParams,
    selectPeerAndRoom,
  };
}

// ============================================================================
// INTEGRATION 6: Complete Connection Lifecycle
// ============================================================================

/**
 * Complete connection lifecycle with all utilities
 */
export function useCompleteConnectionLifecycle(peerId: string) {
  const connectionIdRef = { current: `${peerId}-${Date.now()}` };

  // Setup on mount
  useEffect(() => {
    console.log('[Integration] Connection lifecycle started for', peerId);

    // Schedule health check
    scheduleTask({
      id: `health-check-${peerId}`,
      callback: async () => {
        console.log(`[Integration] Health check for ${peerId}`);
        // Ping peer
      },
      runAt: new Date(Date.now() + 30_000), // 30 seconds
      priority: 'normal',
    });

    return () => {
      // Cleanup on unmount
      cancelTask(`health-check-${peerId}`);
      console.log('[Integration] Connection lifecycle ended for', peerId);
    };
  }, [peerId]);

  // Activity handler
  const onActivity = useCallback(() => {
    resetTimer(connectionIdRef.current);
  }, []);

  // Disconnect handler
  const disconnect = useCallback(() => {
    cancelTask(`health-check-${peerId}`);
    console.log('[Integration] Manually disconnected from', peerId);
  }, [peerId]);

  return { onActivity, disconnect };
}

// ============================================================================
// INTEGRATION 7: Monitoring Dashboard
// ============================================================================

/**
 * Get status of all utilities for a monitoring dashboard
 */
export function getUtilitiesStatus() {
  const schedulerStats = getSchedulerStats();
  // const idleState = getMonitorState(); // Uncomment when using

  return {
    scheduler: {
      totalTasks: schedulerStats.totalTasks,
      running: schedulerStats.runningTasks,
      queued: schedulerStats.queuedTasks,
      completed: schedulerStats.completedTasks,
      failed: schedulerStats.failedTasks,
    },
    // idle: {
    //   monitoring: idleState.isMonitoring,
    //   connections: idleState.activeConnections,
    //   timeout: idleState.defaultTimeout,
    // },
  };
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Complete usage example in a real component
 */
export function ExampleTransferComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { devices, selectDeviceById } = useDeviceStore();

  // 1. Peer URL State
  const peerFromUrl = searchParams.get('peer');

  useEffect(() => {
    if (peerFromUrl && devices.length > 0) {
      selectDeviceById(peerFromUrl);
    }
  }, [peerFromUrl, devices, selectDeviceById]);

  // 2. Idle Monitoring
  useEffect(() => {
    startIdleMonitor(5 * 60 * 1000);
    return () => stopIdleMonitor();
  }, []);

  // 3. Background Tasks
  useEffect(() => {
    const taskId = scheduleTask({
      id: 'example-cleanup',
      callback: async () => {
        console.log('Cleanup running...');
      },
      runAt: new Date(Date.now() + 60_000),
      priority: 'low',
    });

    return () => cancelTask(taskId);
  }, []);

  // Event handlers
  const handleSelectDevice = (deviceId: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('peer', deviceId);
    router.push(`/transfer?${params.toString()}`, { scroll: false });
  };

  const handleDataTransfer = (connectionId: string) => {
    resetTimer(connectionId);
  };

  return (
    <div>
      {/* Your component JSX */}
      <button onClick={() => handleSelectDevice('device-123')}>
        Select Device
      </button>
    </div>
  );
}

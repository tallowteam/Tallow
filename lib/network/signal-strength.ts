/**
 * Signal Strength Estimation and Proximity Detection
 *
 * Provides utilities for estimating network signal quality based on RTT
 * and packet loss, and sorting devices by estimated proximity.
 *
 * @module lib/network/signal-strength
 */

import type { Device } from '../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Signal strength levels (similar to WiFi bars)
 */
export type SignalLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';

/**
 * Proximity estimation based on RTT
 */
export type ProximityLevel = 'nearby' | 'local' | 'remote';

/**
 * RTT thresholds in milliseconds for signal quality
 */
const RTT_THRESHOLDS = {
  EXCELLENT: 20,   // < 20ms: same network, very close
  GOOD: 50,        // 20-50ms: same network, nearby
  FAIR: 100,       // 50-100ms: same network or nearby internet
  POOR: 200,       // 100-200ms: distant or congested
  // > 200ms: poor connection
} as const;

/**
 * Packet loss thresholds (percentage)
 */
const PACKET_LOSS_THRESHOLDS = {
  EXCELLENT: 0.5,  // < 0.5% packet loss
  GOOD: 2,         // < 2% packet loss
  FAIR: 5,         // < 5% packet loss
  POOR: 10,        // < 10% packet loss
  // > 10%: poor/disconnected
} as const;

/**
 * Proximity thresholds in milliseconds
 */
const PROXIMITY_THRESHOLDS = {
  NEARBY: 10,      // < 10ms: same device or very close (LAN)
  LOCAL: 50,       // < 50ms: local network
  // > 50ms: remote/internet
} as const;

// ============================================================================
// SIGNAL STRENGTH ESTIMATION
// ============================================================================

/**
 * Estimates signal strength level based on RTT and packet loss
 *
 * @param rttMs - Round-trip time in milliseconds
 * @param packetLoss - Packet loss percentage (0-100)
 * @returns Signal level indicator
 *
 * @example
 * ```typescript
 * const level = estimateSignalStrength(25, 1.2);
 * // Returns 'good' (RTT is good, low packet loss)
 * ```
 */
export function estimateSignalStrength(
  rttMs: number,
  packetLoss: number = 0
): SignalLevel {
  // Disconnected if RTT is invalid or extremely high
  if (rttMs <= 0 || rttMs > 2000 || packetLoss > 50) {
    return 'disconnected';
  }

  // Poor if packet loss is high regardless of RTT
  if (packetLoss > PACKET_LOSS_THRESHOLDS.POOR) {
    return 'poor';
  }

  // Excellent: low RTT and minimal packet loss
  if (rttMs < RTT_THRESHOLDS.EXCELLENT && packetLoss < PACKET_LOSS_THRESHOLDS.EXCELLENT) {
    return 'excellent';
  }

  // Good: decent RTT and low packet loss
  if (rttMs < RTT_THRESHOLDS.GOOD && packetLoss < PACKET_LOSS_THRESHOLDS.GOOD) {
    return 'good';
  }

  // Fair: moderate RTT or moderate packet loss
  if (rttMs < RTT_THRESHOLDS.FAIR && packetLoss < PACKET_LOSS_THRESHOLDS.FAIR) {
    return 'fair';
  }

  // Poor: high RTT or high packet loss
  if (rttMs < RTT_THRESHOLDS.POOR && packetLoss < PACKET_LOSS_THRESHOLDS.POOR) {
    return 'poor';
  }

  // Default to poor for anything above thresholds
  return 'poor';
}

/**
 * Converts signal level to number of bars (1-5)
 *
 * @param level - Signal strength level
 * @returns Number of signal bars to display
 *
 * @example
 * ```typescript
 * const bars = getSignalBars('good');
 * // Returns 4
 * ```
 */
export function getSignalBars(level: SignalLevel): 1 | 2 | 3 | 4 | 5 {
  switch (level) {
    case 'excellent':
      return 5;
    case 'good':
      return 4;
    case 'fair':
      return 3;
    case 'poor':
      return 2;
    case 'disconnected':
      return 1;
    default:
      return 1;
  }
}

/**
 * Gets color for signal level (CSS custom property name)
 *
 * @param level - Signal strength level
 * @returns CSS color variable name
 */
export function getSignalColor(level: SignalLevel): string {
  switch (level) {
    case 'excellent':
    case 'good':
      return 'var(--success-500, #0cce6b)';
    case 'fair':
      return 'var(--warning-500, #f5a623)';
    case 'poor':
      return 'var(--error-500, #ee0000)';
    case 'disconnected':
      return 'var(--text-secondary, #666666)';
    default:
      return 'var(--text-secondary, #666666)';
  }
}

// ============================================================================
// RTT MEASUREMENT
// ============================================================================

/**
 * Measures RTT (Round-Trip Time) using WebRTC peer connection stats
 *
 * @param peerConnection - Active RTCPeerConnection
 * @returns Promise resolving to RTT in milliseconds, or null if unavailable
 *
 * @example
 * ```typescript
 * const rtt = await measureRTT(peerConnection);
 * if (rtt !== null) {
 *   console.log(`RTT: ${rtt}ms`);
 * }
 * ```
 */
export async function measureRTT(
  peerConnection: RTCPeerConnection
): Promise<number | null> {
  try {
    const stats = await peerConnection.getStats();
    let rtt: number | null = null;

    // Iterate through stats to find RTT from candidate pairs
    stats.forEach((report) => {
      // Look for active candidate pair stats
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        // RTT is available on the candidate pair
        if (typeof report.currentRoundTripTime === 'number') {
          // Convert from seconds to milliseconds
          rtt = report.currentRoundTripTime * 1000;
        }
      }

      // Fallback: check remote-inbound-rtp stats
      if (report.type === 'remote-inbound-rtp' && typeof report.roundTripTime === 'number') {
        const currentRtt = report.roundTripTime * 1000;
        if (rtt === null || currentRtt < rtt) {
          rtt = currentRtt;
        }
      }
    });

    return rtt;
  } catch (error) {
    console.error('[SignalStrength] Failed to measure RTT:', error);
    return null;
  }
}

/**
 * Measures packet loss percentage using WebRTC stats
 *
 * @param peerConnection - Active RTCPeerConnection
 * @returns Promise resolving to packet loss percentage (0-100), or 0 if unavailable
 */
export async function measurePacketLoss(
  peerConnection: RTCPeerConnection
): Promise<number> {
  try {
    const stats = await peerConnection.getStats();
    let packetsLost = 0;
    let packetsReceived = 0;

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp') {
        if (typeof report.packetsLost === 'number') {
          packetsLost += report.packetsLost;
        }
        if (typeof report.packetsReceived === 'number') {
          packetsReceived += report.packetsReceived;
        }
      }
    });

    const totalPackets = packetsLost + packetsReceived;
    if (totalPackets === 0) {
      return 0;
    }

    return (packetsLost / totalPackets) * 100;
  } catch (error) {
    console.error('[SignalStrength] Failed to measure packet loss:', error);
    return 0;
  }
}

// ============================================================================
// PROXIMITY ESTIMATION
// ============================================================================

/**
 * Estimates device proximity based on RTT
 *
 * @param rttMs - Round-trip time in milliseconds
 * @returns Proximity level indicator
 *
 * @example
 * ```typescript
 * const proximity = estimateProximity(8);
 * // Returns 'nearby' (< 10ms)
 * ```
 */
export function estimateProximity(rttMs: number): ProximityLevel {
  if (rttMs < PROXIMITY_THRESHOLDS.NEARBY) {
    return 'nearby';
  }
  if (rttMs < PROXIMITY_THRESHOLDS.LOCAL) {
    return 'local';
  }
  return 'remote';
}

/**
 * Gets human-readable proximity description
 *
 * @param proximity - Proximity level
 * @returns Descriptive text
 */
export function getProximityDescription(proximity: ProximityLevel): string {
  switch (proximity) {
    case 'nearby':
      return 'Very close';
    case 'local':
      return 'Same network';
    case 'remote':
      return 'Remote';
    default:
      return 'Unknown';
  }
}

// ============================================================================
// DEVICE SORTING
// ============================================================================

/**
 * Sorts devices by proximity (nearest first) based on RTT measurements
 *
 * @param devices - Array of devices to sort
 * @param rtts - Map of device IDs to RTT measurements in milliseconds
 * @returns Sorted array of devices (original array is not modified)
 *
 * @example
 * ```typescript
 * const rttMap = new Map([
 *   ['device-1', 8],
 *   ['device-2', 45],
 *   ['device-3', 120],
 * ]);
 * const sorted = sortDevicesByProximity(devices, rttMap);
 * // Returns devices in order: device-1, device-2, device-3
 * ```
 */
export function sortDevicesByProximity(
  devices: Device[],
  rtts: Map<string, number>
): Device[] {
  // Create a shallow copy to avoid mutating original array
  const sortedDevices = [...devices];

  sortedDevices.sort((a, b) => {
    const rttA = rtts.get(a.id) ?? Infinity;
    const rttB = rtts.get(b.id) ?? Infinity;

    // Sort by RTT (lower is better/closer)
    if (rttA !== rttB) {
      return rttA - rttB;
    }

    // Tie-breaker: favorite devices first
    if (a.isFavorite !== b.isFavorite) {
      return a.isFavorite ? -1 : 1;
    }

    // Tie-breaker: online devices first
    if (a.isOnline !== b.isOnline) {
      return a.isOnline ? -1 : 1;
    }

    // Tie-breaker: alphabetical by name
    return a.name.localeCompare(b.name);
  });

  return sortedDevices;
}

/**
 * Groups devices by proximity level
 *
 * @param devices - Array of devices
 * @param rtts - Map of device IDs to RTT measurements
 * @returns Object with devices grouped by proximity
 */
export function groupDevicesByProximity(
  devices: Device[],
  rtts: Map<string, number>
): Record<ProximityLevel, Device[]> {
  const groups: Record<ProximityLevel, Device[]> = {
    nearby: [],
    local: [],
    remote: [],
  };

  devices.forEach((device) => {
    const rtt = rtts.get(device.id);
    if (rtt !== undefined) {
      const proximity = estimateProximity(rtt);
      groups[proximity].push(device);
    } else {
      // Devices without RTT measurement go to remote
      groups.remote.push(device);
    }
  });

  return groups;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Calculates jitter from an array of RTT measurements
 *
 * @param rttMeasurements - Array of RTT measurements in milliseconds
 * @returns Jitter in milliseconds (standard deviation of RTT)
 */
export function calculateJitter(rttMeasurements: number[]): number {
  if (rttMeasurements.length < 2) {
    return 0;
  }

  const mean = rttMeasurements.reduce((sum, rtt) => sum + rtt, 0) / rttMeasurements.length;
  const variance =
    rttMeasurements.reduce((sum, rtt) => sum + Math.pow(rtt - mean, 2), 0) /
    rttMeasurements.length;

  return Math.sqrt(variance);
}

/**
 * Smooths RTT measurements using exponential moving average
 *
 * @param currentRTT - Current RTT measurement
 * @param previousSmoothed - Previous smoothed RTT value
 * @param alpha - Smoothing factor (0-1, higher = more weight to current)
 * @returns Smoothed RTT value
 */
export function smoothRTT(
  currentRTT: number,
  previousSmoothed: number,
  alpha: number = 0.3
): number {
  return alpha * currentRTT + (1 - alpha) * previousSmoothed;
}

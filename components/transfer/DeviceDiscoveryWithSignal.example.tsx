'use client';

/**
 * Device Discovery with Signal Strength Example
 *
 * Demonstrates integration of signal strength monitoring with device discovery.
 * Shows how to use NetworkQualityMonitor with device cards.
 *
 * @module components/transfer/DeviceDiscoveryWithSignal
 */

import { useEffect, useState, useCallback } from 'react';
import { useDeviceStore } from '@/lib/stores/device-store';
import { NetworkQualityMonitor, type NetworkQualityMetrics } from '@/lib/network/network-quality';
import { sortDevicesByProximity, type SignalLevel } from '@/lib/network/signal-strength';
import { SignalIndicator, CompactSignalIndicator } from './SignalIndicator';
import type { Device } from '@/lib/types';

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/**
 * Example: Device Discovery with Signal Strength
 *
 * This example shows how to:
 * 1. Monitor network quality for all connected peers
 * 2. Display signal indicators on device cards
 * 3. Sort devices by proximity (RTT-based)
 * 4. React to quality changes
 */
export function DeviceDiscoveryWithSignalExample() {
  const { devices } = useDeviceStore();
  const [monitor] = useState(() => new NetworkQualityMonitor({ measurementInterval: 3000 }));
  const [metrics, setMetrics] = useState<Map<string, NetworkQualityMetrics>>(new Map());
  const [sortedDevices, setSortedDevices] = useState<Device[]>([]);

  // Initialize monitor and event handlers
  useEffect(() => {
    // Handle metrics updates
    const handleMetricsUpdate = ({ peerId, metrics }: { peerId: string; metrics: NetworkQualityMetrics }) => {
      setMetrics((prev) => new Map(prev).set(peerId, metrics));
    };

    // Handle quality changes
    const handleQualityChange = (event: any) => {
      console.log(
        `[Quality Change] ${event.peerId}: ${event.previousQuality} → ${event.newQuality}`
      );
    };

    // Handle signal changes
    const handleSignalChange = (event: any) => {
      console.log(
        `[Signal Change] ${event.peerId}: ${event.previousLevel} → ${event.newLevel}`
      );
    };

    // Register event listeners
    monitor.on('metrics-update', handleMetricsUpdate);
    monitor.on('quality-change', handleQualityChange);
    monitor.on('signal-change', handleSignalChange);

    // Cleanup
    return () => {
      monitor.off('metrics-update', handleMetricsUpdate);
      monitor.off('quality-change', handleQualityChange);
      monitor.off('signal-change', handleSignalChange);
      monitor.destroy();
    };
  }, [monitor]);

  // Sort devices by proximity whenever metrics change
  useEffect(() => {
    const rttMap = new Map<string, number>();

    metrics.forEach((metric, deviceId) => {
      if (metric.rtt > 0) {
        rttMap.set(deviceId, metric.rtt);
      }
    });

    const sorted = sortDevicesByProximity(devices, rttMap);
    setSortedDevices(sorted);
  }, [devices, metrics]);

  // Get signal level for a device
  const getDeviceSignalLevel = useCallback(
    (deviceId: string): SignalLevel => {
      const metric = metrics.get(deviceId);
      return metric?.signalLevel ?? 'disconnected';
    },
    [metrics]
  );

  // Get RTT for a device
  const getDeviceRTT = useCallback(
    (deviceId: string): number | null => {
      const metric = metrics.get(deviceId);
      return metric?.rtt ?? null;
    },
    [metrics]
  );

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ color: '#ededed', marginBottom: '24px' }}>
        Devices Sorted by Proximity
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {sortedDevices.map((device) => {
          const signalLevel = getDeviceSignalLevel(device.id);
          const rtt = getDeviceRTT(device.id);
          const metric = metrics.get(device.id);

          return (
            <div
              key={device.id}
              style={{
                padding: '20px',
                background: 'rgba(23, 23, 23, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Device header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#ededed',
                    }}
                  >
                    {device.name}
                  </h3>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: '12px',
                      color: '#a1a1a1',
                    }}
                  >
                    {device.platform}
                  </p>
                </div>

                {/* Compact signal indicator */}
                <CompactSignalIndicator level={signalLevel} />
              </div>

              {/* Signal details */}
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(10, 10, 10, 0.5)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#a1a1a1',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <span>Signal:</span>
                  <SignalIndicator level={signalLevel} showLabel size="sm" />
                </div>

                {metric && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>RTT:</span>
                      <span style={{ color: '#ededed', fontWeight: 500 }}>
                        {rtt !== null ? `${rtt.toFixed(1)}ms` : 'N/A'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Proximity:</span>
                      <span style={{ color: '#ededed', fontWeight: 500 }}>
                        {metric.proximity}
                      </span>
                    </div>

                    {metric.packetLoss > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Packet Loss:</span>
                        <span style={{ color: '#ededed', fontWeight: 500 }}>
                          {metric.packetLoss.toFixed(1)}%
                        </span>
                      </div>
                    )}

                    {metric.jitter > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Jitter:</span>
                        <span style={{ color: '#ededed', fontWeight: 500 }}>
                          {metric.jitter.toFixed(1)}ms
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Action button */}
              <button
                style={{
                  padding: '12px',
                  background: 'linear-gradient(135deg, #5E5CE6, #7B79FF)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Send File
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// INTEGRATION WITH PEER CONNECTION
// ============================================================================

/**
 * Hook to monitor network quality for a peer connection
 *
 * @example
 * ```tsx
 * const { signalLevel, rtt, quality } = useNetworkQuality(peerConnection, peerId);
 * ```
 */
export function useNetworkQuality(
  peerConnection: RTCPeerConnection | null,
  peerId: string
) {
  const [metrics, setMetrics] = useState<NetworkQualityMetrics | null>(null);
  const [monitor] = useState(() => new NetworkQualityMonitor({ measurementInterval: 2000 }));

  useEffect(() => {
    if (!peerConnection) {
      return;
    }

    // Add peer to monitor
    monitor.addPeer(peerId, peerConnection);

    // Handle metrics updates
    const handleUpdate = ({ peerId: updatedPeerId, metrics: updatedMetrics }: any) => {
      if (updatedPeerId === peerId) {
        setMetrics(updatedMetrics);
      }
    };

    monitor.on('metrics-update', handleUpdate);

    return () => {
      monitor.off('metrics-update', handleUpdate);
      monitor.removePeer(peerId);
    };
  }, [peerConnection, peerId, monitor]);

  return {
    signalLevel: metrics?.signalLevel ?? 'disconnected',
    rtt: metrics?.rtt ?? null,
    smoothedRtt: metrics?.smoothedRtt ?? null,
    packetLoss: metrics?.packetLoss ?? 0,
    jitter: metrics?.jitter ?? 0,
    proximity: metrics?.proximity ?? 'remote',
    quality: metrics?.quality ?? 'disconnected',
    metrics,
  };
}

// ============================================================================
// SIMPLE SIGNAL BADGE COMPONENT
// ============================================================================

/**
 * Simple signal badge for displaying on device cards
 */
export function DeviceSignalBadge({
  signalLevel,
  rtt,
  showRTT = true,
}: {
  signalLevel: SignalLevel;
  rtt: number | null;
  showRTT?: boolean;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        background: 'rgba(10, 10, 10, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
      }}
    >
      <CompactSignalIndicator level={signalLevel} />
      {showRTT && rtt !== null && (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 500,
            color: '#a1a1a1',
          }}
        >
          {rtt.toFixed(0)}ms
        </span>
      )}
    </div>
  );
}

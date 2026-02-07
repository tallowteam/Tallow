'use client';

import { useState, useEffect, type JSX } from 'react';
import {
  getNetworkInterfaceSelector,
  type NetworkInterface,
  type NetworkInterfaceType,
} from '@/lib/network/interface-selector';
import { getHotspotDetector, type HotspotStatus } from '@/lib/network/hotspot-mode';
import styles from './NetworkSelector.module.css';

// ============================================================================
// Types
// ============================================================================

interface NetworkSelectorProps {
  /** Callback when interface is selected */
  onSelect?: (interface_: NetworkInterface) => void;
  /** Currently active interface */
  activeInterface?: NetworkInterface | null;
  /** Compact mode for header */
  compact?: boolean;
  /** Auto-select preferred interface */
  autoSelect?: boolean;
  /** Additional CSS class */
  className?: string;
}

// ============================================================================
// NetworkSelector Component
// ============================================================================

/**
 * Network interface selector component
 */
export default function NetworkSelector({
  onSelect,
  activeInterface,
  compact = false,
  autoSelect = true,
  className = '',
}: NetworkSelectorProps) {
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [hotspotStatus, setHotspotStatus] = useState<HotspotStatus | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Scan for interfaces on mount
  useEffect(() => {
    scanInterfaces();
  }, []);

  // Auto-select preferred interface
  useEffect(() => {
    if (autoSelect && interfaces.length > 0 && !activeInterface) {
      const preferred = interfaces.find((i) => i.isPreferred);
      if (preferred && onSelect) {
        onSelect(preferred);
      }
    }
  }, [interfaces, activeInterface, autoSelect, onSelect]);

  /**
   * Scan for network interfaces
   */
  const scanInterfaces = async () => {
    setIsLoading(true);

    try {
      const selector = getNetworkInterfaceSelector();
      const detector = getHotspotDetector();

      // Get interfaces
      const ifaces = await selector.getNetworkInterfaces(true);
      setInterfaces(ifaces);

      // Check hotspot status
      const status = await detector.detect();
      setHotspotStatus(status);
    } catch (error) {
      console.error('Failed to scan interfaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle interface selection
   */
  const handleSelect = (interface_: NetworkInterface) => {
    if (onSelect) {
      onSelect(interface_);
    }
    setIsOpen(false);
  };

  /**
   * Get icon for interface type
   */
  const getInterfaceIcon = (type: NetworkInterfaceType): string => {
    const icons: Record<NetworkInterfaceType, string> = {
      wifi: '📶',
      ethernet: '🔌',
      hotspot: '📡',
      vpn: '🔒',
      unknown: '🌐',
    };
    return icons[type];
  };

  /**
   * Get signal indicator for interface
   */
  const getSignalIndicator = (interface_: NetworkInterface): JSX.Element => {
    if (interface_.type !== 'wifi') {
      return <></>;
    }

    const strength = interface_.signalStrength || 75;
    const bars = Math.ceil(strength / 25);

    return (
      <div className={styles.signalIndicator} aria-label={`Signal: ${strength}%`}>
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`${styles.signalBar} ${bar <= bars ? styles.active : ''}`}
            style={{ height: `${bar * 25}%` }}
          />
        ))}
      </div>
    );
  };

  // Compact mode - show only active interface
  if (compact) {
    const active = activeInterface || interfaces.find((i) => i.isPreferred);

    return (
      <div className={`${styles.compactSelector} ${className}`}>
        {active && (
          <button
            className={styles.compactButton}
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label="Select network interface"
          >
            <span className={styles.interfaceIcon}>{getInterfaceIcon(active.type)}</span>
            <span className={styles.interfaceName}>{active.name}</span>
            <span className={styles.interfaceIP}>{active.ip}</span>
          </button>
        )}

        {isOpen && (
          <div className={styles.dropdown}>
            <div className={styles.dropdownHeader}>
              <h3>Network Interfaces</h3>
              <button
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <InterfaceList
              interfaces={interfaces}
              activeInterface={active ?? null}
              hotspotStatus={hotspotStatus}
              onSelect={handleSelect}
              getInterfaceIcon={getInterfaceIcon}
              getSignalIndicator={getSignalIndicator}
            />
            <div className={styles.dropdownFooter}>
              <button className={styles.refreshButton} onClick={scanInterfaces}>
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full mode - show all interfaces as cards
  return (
    <div className={`${styles.networkSelector} ${className}`}>
      <div className={styles.header}>
        <h3>Network Interfaces</h3>
        <button
          className={styles.refreshButton}
          onClick={scanInterfaces}
          disabled={isLoading}
          aria-label="Refresh interfaces"
        >
          {isLoading ? 'Scanning...' : 'Refresh'}
        </button>
      </div>

      {hotspotStatus?.isActive && (
        <div className={styles.hotspotBanner}>
          <span className={styles.hotspotIcon}>📡</span>
          <div className={styles.hotspotInfo}>
            <strong>Hotspot Mode Active</strong>
            <span>
              {hotspotStatus.clientCount || 0} client
              {hotspotStatus.clientCount !== 1 ? 's' : ''} connected
            </span>
          </div>
        </div>
      )}

      <InterfaceList
        interfaces={interfaces}
        activeInterface={activeInterface ?? null}
        hotspotStatus={hotspotStatus}
        onSelect={handleSelect}
        getInterfaceIcon={getInterfaceIcon}
        getSignalIndicator={getSignalIndicator}
      />

      {interfaces.length === 0 && !isLoading && (
        <div className={styles.emptyState}>
          <p>No network interfaces found</p>
          <button className={styles.retryButton} onClick={scanInterfaces}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Interface List Component
// ============================================================================

interface InterfaceListProps {
  interfaces: NetworkInterface[];
  activeInterface?: NetworkInterface | null;
  hotspotStatus: HotspotStatus | null;
  onSelect: (interface_: NetworkInterface) => void;
  getInterfaceIcon: (type: NetworkInterfaceType) => string;
  getSignalIndicator: (interface_: NetworkInterface) => JSX.Element;
}

function InterfaceList({
  interfaces,
  activeInterface,
  hotspotStatus,
  onSelect,
  getInterfaceIcon,
  getSignalIndicator,
}: InterfaceListProps) {
  return (
    <div className={styles.interfaceList}>
      {interfaces.map((interface_) => {
        const isActive = activeInterface?.ip === interface_.ip;
        const isHotspot = hotspotStatus?.ip === interface_.ip;

        return (
          <button
            key={interface_.ip}
            className={`${styles.interfaceCard} ${isActive ? styles.active : ''}`}
            onClick={() => onSelect(interface_)}
            aria-pressed={isActive}
          >
            <div className={styles.interfaceHeader}>
              <span className={styles.interfaceIcon}>
                {getInterfaceIcon(interface_.type)}
              </span>
              <div className={styles.interfaceDetails}>
                <span className={styles.interfaceName}>{interface_.name}</span>
                <span className={styles.interfaceIP}>{interface_.ip}</span>
              </div>
              {getSignalIndicator(interface_)}
            </div>

            <div className={styles.interfaceBadges}>
              {interface_.isPreferred && (
                <span className={styles.badge} data-type="preferred">
                  Auto-detect
                </span>
              )}
              {interface_.isDefault && (
                <span className={styles.badge} data-type="default">
                  Default
                </span>
              )}
              {isHotspot && (
                <span className={styles.badge} data-type="hotspot">
                  Hotspot
                </span>
              )}
            </div>

            {isActive && (
              <div className={styles.activeIndicator} aria-label="Currently active">
                ✓
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

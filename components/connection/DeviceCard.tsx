'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Laptop, Smartphone, Tablet, Monitor, Wifi, WifiOff, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { deviceAppear, devicePing } from '@/lib/animations/hero';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type DeviceType = 'desktop' | 'laptop' | 'tablet' | 'phone' | 'unknown';
type DeviceConnectionStatus = 'available' | 'connecting' | 'connected' | 'disconnected';

interface Device {
  /** Unique device identifier */
  id: string;
  /** Device display name */
  name: string;
  /** Device type */
  type: DeviceType;
  /** Current connection status */
  status: DeviceConnectionStatus;
  /** Device platform (e.g., "Windows", "macOS", "iOS") */
  platform?: string;
  /** Last seen timestamp */
  lastSeen?: Date;
}

interface DeviceCardProps {
  /** Device information */
  device: Device;
  /** Whether this device is selected */
  selected?: boolean;
  /** Callback when device is clicked */
  onClick?: () => void;
  /** Whether the card is disabled */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getDeviceIcon(type: DeviceType): React.ReactNode {
  const iconClass = 'h-6 w-6';

  switch (type) {
    case 'desktop':
      return <Monitor className={iconClass} />;
    case 'laptop':
      return <Laptop className={iconClass} />;
    case 'tablet':
      return <Tablet className={iconClass} />;
    case 'phone':
      return <Smartphone className={iconClass} />;
    default:
      return <Monitor className={iconClass} />;
  }
}

function getStatusColor(status: DeviceConnectionStatus): string {
  switch (status) {
    case 'connected':
      return 'var(--color-success-500)';
    case 'connecting':
      return 'var(--color-warning-500)';
    case 'available':
      return 'var(--color-primary-500)';
    case 'disconnected':
    default:
      return 'var(--text-tertiary)';
  }
}

function getStatusText(status: DeviceConnectionStatus): string {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return 'Connecting...';
    case 'available':
      return 'Available';
    case 'disconnected':
    default:
      return 'Offline';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS INDICATOR
// ═══════════════════════════════════════════════════════════════════════════

interface StatusIndicatorProps {
  status: DeviceConnectionStatus;
}

const StatusIndicator = ({ status }: StatusIndicatorProps) => {
  const color = getStatusColor(status);
  const showPing = status === 'available' || status === 'connecting';

  return (
    <div className="relative flex h-3 w-3 items-center justify-center">
      {/* Ping animation for available/connecting */}
      {showPing && (
        <motion.div
          className="absolute h-3 w-3 rounded-full"
          style={{ backgroundColor: color }}
          variants={devicePing}
          animate="animate"
        />
      )}

      {/* Solid dot */}
      <div
        className="relative h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const DeviceCard = React.forwardRef<HTMLDivElement, DeviceCardProps>(
  ({ device, selected = false, onClick, disabled = false, className }, ref) => {
    const { name, type, status, platform } = device;
    const isInteractive = !disabled && onClick && status !== 'disconnected';

    // Motion props for interactive state
    const hoverProps = isInteractive
      ? { whileHover: { y: -2, borderColor: 'rgba(94, 92, 230, 0.4)', boxShadow: '0 0 20px rgba(94, 92, 230, 0.1)' } }
      : {};

    // Style props for selected state
    const styleProps = selected
      ? {
          style: {
            borderColor: 'rgba(94, 92, 230, 0.8)',
            boxShadow: '0 0 30px rgba(94, 92, 230, 0.2)',
          },
        }
      : {};

    return (
      <motion.div
        ref={ref}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onClick={isInteractive ? onClick : undefined}
        onKeyDown={(e) => {
          if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick?.();
          }
        }}
        className={cn(
          'relative flex items-center gap-4 rounded-xl p-4',
          'bg-[var(--bg-surface)] border border-[var(--border-default)]',
          isInteractive && 'cursor-pointer',
          disabled && 'cursor-not-allowed opacity-50',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-primary)]',
          className
        )}
        variants={deviceAppear}
        initial="initial"
        animate="animate"
        exit="exit"
        {...hoverProps}
        {...styleProps}
      >
        {/* Device icon */}
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
            'bg-[var(--bg-elevated)]',
            selected
              ? 'text-[var(--color-primary-500)]'
              : status === 'disconnected'
                ? 'text-[var(--text-tertiary)]'
                : 'text-[var(--text-secondary)]'
          )}
        >
          {getDeviceIcon(type)}
        </div>

        {/* Device info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-[var(--text-primary)]">
              {name}
            </p>
            {selected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Check className="h-4 w-4 text-[var(--color-primary-500)]" />
              </motion.div>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            {platform && <span>{platform}</span>}
            {platform && <span className="text-[var(--text-tertiary)]">•</span>}
            <span style={{ color: getStatusColor(status) }}>
              {getStatusText(status)}
            </span>
          </div>
        </div>

        {/* Status indicator */}
        <div className="shrink-0">
          <StatusIndicator status={status} />
        </div>

        {/* Connection icon overlay */}
        {status === 'connected' && (
          <motion.div
            className="absolute -right-1 -top-1"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-success-500)]">
              <Wifi className="h-3 w-3 text-white" />
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }
);

DeviceCard.displayName = 'DeviceCard';

// ═══════════════════════════════════════════════════════════════════════════
// DEVICE LIST
// ═══════════════════════════════════════════════════════════════════════════

interface DeviceListProps {
  /** List of devices */
  devices: Device[];
  /** Currently selected device ID */
  selectedId?: string | undefined;
  /** Callback when a device is selected */
  onSelect?: ((device: Device) => void) | undefined;
  /** Whether scanning for devices */
  scanning?: boolean | undefined;
  /** Additional className */
  className?: string | undefined;
}

const DeviceList = React.forwardRef<HTMLDivElement, DeviceListProps>(
  ({ devices, selectedId, onSelect, scanning = false, className }, ref) => {
    const availableDevices = devices.filter((d) => d.status !== 'disconnected');
    const offlineDevices = devices.filter((d) => d.status === 'disconnected');

    return (
      <div ref={ref} className={cn('flex flex-col gap-4', className)}>
        {/* Scanning indicator */}
        {scanning && (
          <motion.div
            className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="h-2 w-2 rounded-full bg-[var(--color-primary-500)]"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span>Scanning for devices...</span>
          </motion.div>
        )}

        {/* Available devices */}
        {availableDevices.length > 0 && (
          <div className="flex flex-col gap-2">
            {availableDevices.map((device) => {
              const clickProps = onSelect
                ? { onClick: () => onSelect(device) }
                : {};
              return (
                <DeviceCard
                  key={device.id}
                  device={device}
                  selected={device.id === selectedId}
                  {...clickProps}
                />
              );
            })}
          </div>
        )}

        {/* No devices found */}
        {!scanning && availableDevices.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <WifiOff className="h-8 w-8 text-[var(--text-tertiary)]" />
            <p className="text-sm text-[var(--text-secondary)]">
              No devices found nearby
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              Make sure other devices have Tallow open
            </p>
          </div>
        )}

        {/* Offline devices */}
        {offlineDevices.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="px-1 text-xs font-medium text-[var(--text-tertiary)]">
              Previously connected
            </p>
            {offlineDevices.map((device) => (
              <DeviceCard key={device.id} device={device} disabled />
            ))}
          </div>
        )}
      </div>
    );
  }
);

DeviceList.displayName = 'DeviceList';

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { DeviceCard, DeviceList, StatusIndicator };
export type { DeviceCardProps, Device, DeviceType, DeviceConnectionStatus, DeviceListProps };

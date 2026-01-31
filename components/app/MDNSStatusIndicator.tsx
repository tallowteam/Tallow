'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Radio, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MDNSStatusIndicatorProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

type DaemonStatus = 'checking' | 'connected' | 'disconnected' | 'discovering';

/**
 * MDNSStatusIndicator - Shows mDNS daemon connection status
 *
 * Displays the current state of the local mDNS discovery daemon:
 * - connected: Daemon is running and connected
 * - disconnected: Daemon is not available
 * - discovering: Actively discovering devices
 * - checking: Initial connection check in progress
 */
export function MDNSStatusIndicator({
  className,
  showLabel = true,
  size = 'md'
}: MDNSStatusIndicatorProps) {
  const [status, setStatus] = useState<DaemonStatus>('checking');
  const [deviceCount, setDeviceCount] = useState(0);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let mounted = true;

    const checkDaemon = async () => {
      if (typeof window === 'undefined') {
        setStatus('disconnected');
        return;
      }

      try {
        ws = new WebSocket('ws://localhost:53318');

        ws.onopen = () => {
          if (!mounted) return;
          setStatus('connected');
          // Request device list
          ws?.send(JSON.stringify({ type: 'get-devices' }));
        };

        ws.onmessage = (event) => {
          if (!mounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'device-list') {
              setDeviceCount(data.devices?.length || 0);
              setStatus('connected');
            } else if (data.type === 'device-found') {
              setDeviceCount(prev => prev + 1);
            } else if (data.type === 'device-lost') {
              setDeviceCount(prev => Math.max(0, prev - 1));
            } else if (data.type === 'status') {
              if (data.status === 'discovering') {
                setStatus('discovering');
              }
            }
          } catch {
            // Ignore parse errors
          }
        };

        ws.onerror = () => {
          if (!mounted) return;
          setStatus('disconnected');
        };

        ws.onclose = () => {
          if (!mounted) return;
          setStatus('disconnected');
        };
      } catch {
        setStatus('disconnected');
      }
    };

    checkDaemon();

    return () => {
      mounted = false;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const sizeClasses = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-1.5',
    lg: 'text-base gap-2',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const statusConfig = {
    checking: {
      icon: Loader2,
      label: 'Checking...',
      color: 'text-gray-400',
      animate: 'animate-spin',
    },
    connected: {
      icon: Wifi,
      label: `Local Discovery${deviceCount > 0 ? ` (${deviceCount})` : ''}`,
      color: 'text-green-500',
      animate: '',
    },
    disconnected: {
      icon: WifiOff,
      label: 'mDNS Offline',
      color: 'text-gray-500',
      animate: '',
    },
    discovering: {
      icon: Radio,
      label: 'Discovering...',
      color: 'text-blue-500',
      animate: 'animate-pulse',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      data-testid="mdns-status"
      className={cn(
        'inline-flex items-center',
        sizeClasses[size],
        config.color,
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={`mDNS status: ${config.label}`}
    >
      <Icon
        size={iconSizes[size]}
        className={config.animate}
        aria-hidden="true"
      />
      {showLabel && (
        <span className="whitespace-nowrap">{config.label}</span>
      )}
    </div>
  );
}

export default MDNSStatusIndicator;

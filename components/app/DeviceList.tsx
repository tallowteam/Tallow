'use client';

import { useCallback } from 'react';
import type { Device } from '@/lib/types';

interface DeviceListProps {
  devices: Device[];
  onDeviceClick?: (device: Device) => void;
  selectedDeviceId?: string | null;
  className?: string;
}

export function DeviceList({
  devices,
  onDeviceClick,
  selectedDeviceId,
  className = ''
}: DeviceListProps) {
  const handleDeviceClick = useCallback((device: Device) => {
    if (onDeviceClick) {
      onDeviceClick(device);
    }
  }, [onDeviceClick]);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'windows':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
          </svg>
        );
      case 'macos':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
        );
      case 'linux':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.84-.41 1.719-.183 2.639.242.978.988 1.64 1.897 1.953.27.093.573.157.897.175 1.699.093 2.186-.461 2.495-.906.574-.832.754-1.704.754-2.812 0-1.301-.287-2.145-.287-2.145s.716.856 1.306 1.673c.19.264.51.615.91.772.185.073.394.107.61.107.408 0 .83-.138 1.21-.39.79-.522 1.108-1.45 1.108-2.36 0-.963-.089-1.914-.267-2.847-.059-.31-.112-.616-.159-.919-.145-.95-.223-1.85-.096-2.707.136-.913.405-1.758.93-2.48.5-.686 1.168-1.199 1.95-1.535.678-.291 1.429-.438 2.186-.438.26 0 .52.014.78.042 2.083.226 3.818 1.491 4.615 3.374.89 2.098.96 4.46.185 6.642-.28.789-.62 1.547-1.017 2.267-.396.72-.846 1.407-1.347 2.05-.5.642-1.05 1.241-1.65 1.79-.602.549-1.25 1.051-1.95 1.495-.349.223-.715.429-1.097.615-.382.186-.782.346-1.197.48-.829.268-1.705.405-2.592.405-.887 0-1.764-.137-2.592-.405-.415-.134-.815-.294-1.197-.48-.382-.186-.748-.392-1.097-.615-.7-.444-1.348-.946-1.95-1.495-.6-.549-1.15-1.148-1.65-1.79-.501-.643-.951-1.33-1.347-2.05-.397-.72-.737-1.478-1.017-2.267-.775-2.182-.705-4.544.185-6.642.797-1.883 2.532-3.148 4.615-3.374.26-.028.52-.042.78-.042z" />
          </svg>
        );
      case 'android':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.523 15.341c-.759 0-1.383-.617-1.383-1.377s.624-1.378 1.383-1.378 1.382.618 1.382 1.378-.623 1.377-1.382 1.377m-11.046 0c-.759 0-1.382-.617-1.382-1.377s.623-1.378 1.382-1.378 1.383.618 1.383 1.378-.624 1.377-1.383 1.377m11.046-5.828c-.759 0-1.383-.618-1.383-1.377 0-.76.624-1.378 1.383-1.378s1.382.618 1.382 1.378c0 .759-.623 1.377-1.382 1.377m-11.046 0c-.759 0-1.382-.618-1.382-1.377 0-.76.623-1.378 1.382-1.378s1.383.618 1.383 1.378c0 .759-.624 1.377-1.383 1.377M22.46 6.88l-1.91-3.31c-.126-.221-.408-.295-.629-.166-.221.128-.295.406-.167.628l1.934 3.349c-1.373-.648-2.933-1.011-4.577-1.011-1.645 0-3.205.363-4.578 1.011l1.934-3.349c.128-.222.054-.5-.167-.628-.221-.129-.502-.055-.63.166l-1.908 3.31C9.443 8.184 8.019 10.076 8.019 12.264h16.44c0-2.188-1.424-4.08-3.743-5.384" />
          </svg>
        );
      case 'ios':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        );
    }
  };

  if (devices.length === 0) {
    return (
      <div className={`p-8 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white/40"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white/70 mb-2">No devices found</h3>
          <p className="text-sm text-white/40">
            Nearby devices will appear here when discovered
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {devices.map((device) => (
        <button
          key={device.id}
          onClick={() => handleDeviceClick(device)}
          className={`
            w-full p-4 rounded-lg
            border transition-all duration-200
            text-left group
            ${selectedDeviceId === device.id
              ? 'border-white/40 bg-white/10'
              : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
            }
          `}
          type="button"
        >
          <div className="flex items-center gap-4">
            {/* Device avatar/icon */}
            <div className={`
              flex-shrink-0 w-12 h-12 rounded-full
              flex items-center justify-center
              transition-colors duration-200
              ${device.isOnline
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/40'
              }
            `}>
              {device.avatar ? (
                <img
                  src={device.avatar}
                  alt={device.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getPlatformIcon(device.platform)
              )}
            </div>

            {/* Device info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium text-white truncate">
                  {device.name}
                </h4>

                {/* Online indicator */}
                <div className={`
                  flex-shrink-0 w-2 h-2 rounded-full
                  ${device.isOnline ? 'bg-green-400 animate-pulse' : 'bg-white/20'}
                `} />
              </div>

              <div className="flex items-center gap-2 text-xs text-white/50">
                <span className="capitalize">{device.platform}</span>
                {device.ip && (
                  <>
                    <span>•</span>
                    <span>{device.ip}</span>
                  </>
                )}
              </div>
            </div>

            {/* Favorite indicator */}
            {device.isFavorite && (
              <div className="flex-shrink-0">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-white/40"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            )}

            {/* Connect arrow */}
            <div className={`
              flex-shrink-0 transition-transform duration-200
              ${selectedDeviceId === device.id ? 'translate-x-0' : '-translate-x-1 group-hover:translate-x-0'}
            `}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white/40"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

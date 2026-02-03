'use client';

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnecting' | 'error';

interface StatusIndicatorProps {
  status: ConnectionStatus;
  peerName?: string | null;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusIndicator({
  status,
  peerName,
  showLabel = true,
  size = 'md',
  className = ''
}: StatusIndicatorProps) {
  const getStatusConfig = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return {
          color: 'bg-green-400',
          ringColor: 'ring-green-400/30',
          textColor: 'text-green-400',
          label: peerName ? `Connected to ${peerName}` : 'Connected',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ),
          animate: false
        };
      case 'connecting':
        return {
          color: 'bg-yellow-400',
          ringColor: 'ring-yellow-400/30',
          textColor: 'text-yellow-400',
          label: 'Connecting...',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ),
          animate: true
        };
      case 'disconnecting':
        return {
          color: 'bg-orange-400',
          ringColor: 'ring-orange-400/30',
          textColor: 'text-orange-400',
          label: 'Disconnecting...',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ),
          animate: false
        };
      case 'error':
        return {
          color: 'bg-red-400',
          ringColor: 'ring-red-400/30',
          textColor: 'text-red-400',
          label: 'Connection failed',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ),
          animate: false
        };
      default:
        return {
          color: 'bg-white/20',
          ringColor: 'ring-white/10',
          textColor: 'text-white/40',
          label: 'Disconnected',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
            </svg>
          ),
          animate: false
        };
    }
  };

  const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return {
          dot: 'w-2 h-2',
          icon: 'w-3 h-3',
          ring: 'w-4 h-4',
          text: 'text-xs',
          gap: 'gap-2'
        };
      case 'lg':
        return {
          dot: 'w-4 h-4',
          icon: 'w-5 h-5',
          ring: 'w-8 h-8',
          text: 'text-base',
          gap: 'gap-4'
        };
      default:
        return {
          dot: 'w-3 h-3',
          icon: 'w-4 h-4',
          ring: 'w-6 h-6',
          text: 'text-sm',
          gap: 'gap-3'
        };
    }
  };

  const config = getStatusConfig(status);
  const sizeClasses = getSizeClasses(size);

  return (
    <div className={`inline-flex items-center ${sizeClasses.gap} ${className}`}>
      {/* Status indicator */}
      <div className="relative flex items-center justify-center">
        {/* Pulsing ring for connecting state */}
        {config.animate && (
          <>
            <div className={`absolute ${sizeClasses.ring} rounded-full ${config.color} opacity-20 animate-ping`} />
            <div className={`absolute ${sizeClasses.ring} rounded-full ring-2 ${config.ringColor} animate-pulse`} />
          </>
        )}

        {/* Static ring for other states */}
        {!config.animate && status !== 'idle' && (
          <div className={`absolute ${sizeClasses.ring} rounded-full ring-2 ${config.ringColor}`} />
        )}

        {/* Icon or dot */}
        {status === 'idle' ? (
          <div className={`${sizeClasses.dot} rounded-full ${config.color}`} />
        ) : (
          <div className={`${sizeClasses.icon} ${config.textColor}`}>
            {config.icon}
          </div>
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <span className={`font-medium ${config.textColor} ${sizeClasses.text}`}>
          {config.label}
        </span>
      )}
    </div>
  );
}

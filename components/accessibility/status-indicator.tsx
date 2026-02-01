'use client';

/**
 * Accessible Status Indicator
 * WCAG 2.1 AA: Never rely on color alone to convey information
 * Combines color with icons and text for full accessibility
 */

import { Check, X, Clock, AlertCircle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'pending' | 'loading';

export interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  showIcon?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<StatusType, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  colorClass: string;
  bgClass: string;
}> = {
  success: {
    icon: Check,
    label: 'Success',
    colorClass: 'text-green-600 dark:text-green-400',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
  },
  error: {
    icon: X,
    label: 'Error',
    colorClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
  },
  warning: {
    icon: AlertCircle,
    label: 'Warning',
    colorClass: 'text-yellow-600 dark:text-yellow-400',
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  info: {
    icon: Info,
    label: 'Information',
    colorClass: 'text-white',
    bgClass: 'bg-white/10 dark:bg-white/10',
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    colorClass: 'text-gray-600 dark:text-gray-400',
    bgClass: 'bg-gray-100 dark:bg-gray-800',
  },
  loading: {
    icon: Loader2,
    label: 'Loading',
    colorClass: 'text-white',
    bgClass: 'bg-white/10 dark:bg-white/10',
  },
};

const sizeClasses = {
  sm: {
    icon: 'w-3 h-3',
    text: 'text-xs',
    padding: 'px-2 py-1',
  },
  md: {
    icon: 'w-4 h-4',
    text: 'text-sm',
    padding: 'px-3 py-1.5',
  },
  lg: {
    icon: 'w-5 h-5',
    text: 'text-base',
    padding: 'px-4 py-2',
  },
};

export function StatusIndicator({
  status,
  label,
  showIcon = true,
  showText = true,
  size = 'md',
  className = '',
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const sizeConfig = sizeClasses[size];
  const Icon = config.icon;
  const displayLabel = label || config.label;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.bgClass,
        config.colorClass,
        sizeConfig.padding,
        sizeConfig.text,
        className
      )}
      role="status"
      aria-label={`${displayLabel} status`}
    >
      {showIcon && (
        <Icon
          className={cn(
            sizeConfig.icon,
            status === 'loading' && 'animate-spin'
          )}
          aria-hidden="true"
        />
      )}
      {showText && (
        <span>{displayLabel}</span>
      )}
    </span>
  );
}

/**
 * Status Dot - Minimal status indicator
 * Still accessible with tooltip and aria-label
 */

export interface StatusDotProps {
  status: StatusType;
  label?: string;
  tooltip?: boolean;
  className?: string;
}

export function StatusDot({
  status,
  label,
  tooltip = true,
  className = '',
}: StatusDotProps) {
  const config = statusConfig[status];
  const displayLabel = label || config.label;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2',
        className
      )}
      role="status"
      aria-label={`${displayLabel} status`}
      title={tooltip ? displayLabel : undefined}
    >
      <span
        className={cn(
          'w-2 h-2 rounded-full',
          config.colorClass.replace('text-', 'bg-')
        )}
        aria-hidden="true"
      />
      <span className="text-sm">{displayLabel}</span>
    </span>
  );
}

'use client';

/**
 * Error State Components - Euveka Style
 * Reusable components for displaying errors in various contexts
 *
 * Design: Subtle, elegant error states with warm accents
 * - Dark card backgrounds (#242018 tone)
 * - Warm amber/terracotta error accents (#c9a066) - not harsh red
 * - Pill-shaped retry buttons
 * - Clear, helpful messaging
 * - Visible but not jarring
 */

import { forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw, XCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from './button';

// ============================================================================
// INLINE ERROR MESSAGE
// For form fields, input validation, etc.
// ============================================================================

interface InlineErrorProps {
  message: string;
  className?: string;
}

export const InlineError = forwardRef<HTMLParagraphElement, InlineErrorProps>(
  ({ message, className }, ref) => {
    return (
      <p
        ref={ref}
        role="alert"
        className={cn(
          'flex items-center gap-2 text-sm text-[#c9a066] mt-1.5 animate-fade-in',
          className
        )}
      >
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{message}</span>
      </p>
    );
  }
);
InlineError.displayName = 'InlineError';

// ============================================================================
// ERROR CARD
// For larger error displays within content areas
// ============================================================================

type ErrorSeverity = 'error' | 'warning' | 'info';

interface ErrorCardProps {
  title?: string;
  message: string;
  severity?: ErrorSeverity;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  children?: ReactNode;
}

const severityConfig = {
  error: {
    icon: XCircle,
    color: '#c9a066', // Warm amber/terracotta
    bgGlow: 'bg-[#c9a066]/20',
    borderColor: 'border-[#c9a066]/30',
  },
  warning: {
    icon: AlertTriangle,
    color: '#c9b066', // Warm gold
    bgGlow: 'bg-[#c9b066]/20',
    borderColor: 'border-[#c9b066]/30',
  },
  info: {
    icon: Info,
    color: '#a0a8c9', // Muted blue/slate
    bgGlow: 'bg-[#a0a8c9]/20',
    borderColor: 'border-[#a0a8c9]/30',
  },
};

export function ErrorCard({
  title,
  message,
  severity = 'error',
  onRetry,
  onDismiss,
  className,
  children,
}: ErrorCardProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={cn(
        'relative rounded-xl bg-[#1a1915] border border-[#2a2520]/60 p-5 shadow-lg',
        'animate-fade-in transition-all duration-300',
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon with subtle glow */}
        <div className="relative shrink-0">
          <div className={cn('absolute inset-0 blur-lg rounded-full', config.bgGlow)} />
          <div
            className={cn(
              'relative w-10 h-10 rounded-full bg-[#242018] flex items-center justify-center',
              config.borderColor
            )}
            style={{ borderWidth: '1px' }}
          >
            <Icon className="h-5 w-5" style={{ color: config.color }} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="text-[#fefefc] font-medium text-sm mb-1">{title}</h4>
          )}
          <p className="text-[#8a8580] text-sm leading-relaxed">{message}</p>
          {children}
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[#5a5550] hover:text-[#fefefc] hover:bg-[#242018] transition-all duration-200"
            aria-label="Dismiss"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Retry button */}
      {onRetry && (
        <div className="mt-4 pl-14">
          <Button
            onClick={onRetry}
            size="sm"
            className="h-9 rounded-full bg-[#fefefc] text-[#0a0a08] hover:bg-[#e5e5e0] font-medium transition-all duration-300 px-5"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ERROR BANNER
// For page-level or section-level error notifications
// ============================================================================

interface ErrorBannerProps {
  message: string;
  severity?: ErrorSeverity;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}

export function ErrorBanner({
  message,
  severity = 'error',
  onDismiss,
  onRetry,
  className,
}: ErrorBannerProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={cn(
        'relative flex items-center gap-3 px-4 py-3 rounded-xl',
        'bg-[#1a1915] border border-[#2a2520]/60',
        'animate-fade-in transition-all duration-300',
        className
      )}
    >
      {/* Icon */}
      <Icon className="w-5 h-5 shrink-0" style={{ color: config.color }} />

      {/* Message */}
      <p className="flex-1 text-sm text-[#a8a29e]">{message}</p>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {onRetry && (
          <Button
            onClick={onRetry}
            size="sm"
            variant="ghost"
            className="h-8 rounded-full text-[#8a8580] hover:text-[#fefefc] hover:bg-[#242018] font-medium transition-all duration-300 px-4"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#5a5550] hover:text-[#fefefc] hover:bg-[#242018] transition-all duration-200"
            aria-label="Dismiss"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY STATE WITH ERROR
// For when data fails to load or is unavailable
// ============================================================================

interface EmptyErrorStateProps {
  title?: string;
  message: string;
  icon?: React.ElementType;
  onRetry?: () => void;
  className?: string;
}

export function EmptyErrorState({
  title = 'Couldn\'t load',
  message,
  icon: CustomIcon,
  onRetry,
  className,
}: EmptyErrorStateProps) {
  const Icon = CustomIcon || AlertCircle;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6',
        className
      )}
    >
      {/* Icon with subtle glow */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-[#c9a066]/15 blur-2xl rounded-full scale-150" />
        <div className="relative w-16 h-16 rounded-full bg-[#242018] border border-[#c9a066]/30 flex items-center justify-center">
          <Icon className="h-7 w-7 text-[#c9a066]" />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-[#fefefc] font-light text-lg mb-2">{title}</h3>

      {/* Message */}
      <p className="text-[#8a8580] text-sm max-w-xs leading-relaxed">{message}</p>

      {/* Retry button */}
      {onRetry && (
        <Button
          onClick={onRetry}
          className="mt-6 h-10 rounded-full bg-[#fefefc] text-[#0a0a08] hover:bg-[#e5e5e0] font-medium transition-all duration-300 px-6"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// FORM FIELD ERROR WRAPPER
// Wraps form fields to show error state styling
// ============================================================================

interface FieldErrorWrapperProps {
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FieldErrorWrapper({
  error,
  children,
  className,
}: FieldErrorWrapperProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <div
        className={cn(
          'transition-all duration-200',
          error && '[&>input]:border-[#c9a066]/50 [&>textarea]:border-[#c9a066]/50 [&>select]:border-[#c9a066]/50'
        )}
      >
        {children}
      </div>
      {error && <InlineError message={error} />}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { InlineErrorProps, ErrorCardProps, ErrorBannerProps, EmptyErrorStateProps, FieldErrorWrapperProps };

/**
 * EUVEKA Toast Notification System
 *
 * Design Specifications:
 * - Border-radius: 60px (pill shape)
 * - Background: #191610 (dark) / #fefefc (light)
 * - Success: green accent
 * - Error: #ff4f4f
 * - Info: #fefefc
 * - Progress: green with smooth animation
 */

import { toast as sonnerToast, ExternalToast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Copy,
  Download,
  Upload,
  Trash2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { ReactNode } from 'react';

// EUVEKA color constants
const EUVEKA_COLORS = {
  success: '#22c55e', // green-500
  error: '#ff4f4f',   // EUVEKA error red
  warning: '#b2987d', // EUVEKA muted amber
  info: '#fefefc',    // EUVEKA info blue
  muted: '#b2987d',
  dark: '#191610',
  light: '#fefefc',
  border: {
    light: '#e5dac7',
    dark: '#544a36',
  },
} as const;

// Toast queue management
const toastQueue = new Map<string, string>();
const MAX_CONCURRENT_TOASTS = 3;

// Track persistent error toasts
const persistentToasts = new Set<string | number>();

// Track progress toasts
const progressToasts = new Map<string | number, { progress: number; message: string }>();

interface ToastAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
}

interface CustomToastOptions extends ExternalToast {
  action?: ToastAction;
  undo?: () => void;
  persist?: boolean;
  id?: string;
}

interface ProgressToastOptions extends CustomToastOptions {
  progress?: number;
  showPercentage?: boolean;
}

/**
 * Queue management to prevent toast spam
 */
function shouldShowToast(message: string, options?: CustomToastOptions): boolean {
  const existingId = toastQueue.get(message);

  if (existingId && !options?.persist) {
    return false; // Toast with same message already showing
  }

  return toastQueue.size < MAX_CONCURRENT_TOASTS;
}

function trackToast(message: string, id: string | number) {
  toastQueue.set(message, String(id));

  // Auto-cleanup after default duration
  setTimeout(() => {
    toastQueue.delete(message);
  }, 4000);
}

/**
 * Success Toast - EUVEKA green accent
 */
export function toastSuccess(
  message: string,
  options?: CustomToastOptions
) {
  if (!shouldShowToast(message, options)) {return;}

  const toastId = sonnerToast.success(message, {
    ...options,
    icon: <CheckCircle2 className="w-5 h-5" style={{ color: EUVEKA_COLORS.success }} />,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
    className: 'toast-success euveka-toast',
  });

  trackToast(message, toastId);
  return toastId;
}

/**
 * Error Toast - EUVEKA #ff4f4f
 */
export function toastError(
  message: string,
  options?: CustomToastOptions
) {
  const shouldPersist = options?.persist ?? true; // Errors persist by default

  const duration = shouldPersist ? Infinity : options?.duration;
  const action = options?.action ? {
    label: options.action.label,
    onClick: options.action.onClick,
  } : undefined;

  const toastId = sonnerToast.error(message, {
    ...options,
    ...(duration !== undefined ? { duration } : {}),
    icon: <XCircle className="w-5 h-5" style={{ color: EUVEKA_COLORS.error }} />,
    ...(action ? { action } : {}),
    className: 'toast-error euveka-toast',
  });

  if (shouldPersist) {
    persistentToasts.add(toastId);
  }

  return toastId;
}

/**
 * Warning Toast - EUVEKA warm amber
 */
export function toastWarning(
  message: string,
  options?: CustomToastOptions
) {
  if (!shouldShowToast(message, options)) {return;}

  const toastId = sonnerToast.warning(message, {
    ...options,
    icon: <AlertTriangle className="w-5 h-5" style={{ color: EUVEKA_COLORS.warning }} />,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
    className: 'toast-warning euveka-toast',
  });

  trackToast(message, toastId);
  return toastId;
}

/**
 * Info Toast - EUVEKA #fefefc
 */
export function toastInfo(
  message: string,
  options?: CustomToastOptions
) {
  if (!shouldShowToast(message, options)) {return;}

  const toastId = sonnerToast.info(message, {
    ...options,
    icon: <Info className="w-5 h-5" style={{ color: EUVEKA_COLORS.info }} />,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
    className: 'toast-info euveka-toast',
  });

  trackToast(message, toastId);
  return toastId;
}

/**
 * Loading Toast - EUVEKA muted spinner
 */
export function toastLoading(
  message: string,
  options?: CustomToastOptions
) {
  return sonnerToast.loading(message, {
    ...options,
    icon: <Loader2 className="w-5 h-5 animate-spin" style={{ color: EUVEKA_COLORS.muted }} />,
    className: 'toast-loading euveka-toast',
  });
}

/**
 * Progress Toast - EUVEKA styled with green progress bar
 * Use for file transfers, uploads, long-running operations
 */
export function toastProgress(
  message: string,
  progress: number,
  options?: ProgressToastOptions
) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const showPercentage = options?.showPercentage ?? true;
  const toastId = options?.id || `progress-${message}`;

  // Track progress for potential updates
  progressToasts.set(toastId, { progress: clampedProgress, message });

  const progressBar = (
    <div className="flex flex-col w-full gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{message}</span>
        {showPercentage && (
          <span className="text-xs tabular-nums" style={{ color: EUVEKA_COLORS.muted }}>
            {clampedProgress}%
          </span>
        )}
      </div>
      <div
        className="h-1.5 w-full rounded-full overflow-hidden"
        style={{ backgroundColor: EUVEKA_COLORS.border.dark }}
      >
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${clampedProgress}%`,
            backgroundColor: clampedProgress === 100 ? EUVEKA_COLORS.success : EUVEKA_COLORS.info,
          }}
        />
      </div>
    </div>
  );

  return sonnerToast.custom(
    () => progressBar,
    {
      id: toastId,
      duration: clampedProgress === 100 ? 2000 : Infinity,
      className: 'toast-progress euveka-toast',
      ...options,
    }
  );
}

/**
 * Update existing progress toast
 */
export function updateProgress(
  toastId: string | number,
  progress: number,
  message?: string
) {
  const existing = progressToasts.get(toastId);
  if (existing) {
    const newMessage = message || existing.message;
    toastProgress(newMessage, progress, { id: String(toastId) });
  }
}

/**
 * Toast with Undo Action - EUVEKA pill button
 */
export function toastWithUndo(
  message: string,
  onUndo: () => void,
  options?: Omit<CustomToastOptions, 'undo'>
) {
  if (!shouldShowToast(message)) {return;}

  const toastId = sonnerToast.success(message, {
    ...options,
    icon: <CheckCircle2 className="w-5 h-5" style={{ color: EUVEKA_COLORS.success }} />,
    duration: 5000, // Longer duration for undo
    action: {
      label: 'Undo',
      onClick: () => {
        onUndo();
        sonnerToast.dismiss(toastId);
        toastInfo('Action undone');
      },
    },
    className: 'toast-undo euveka-toast',
  });

  trackToast(message, toastId);
  return toastId;
}

/**
 * Specialized Toast Variants
 */

export const toast = {
  // File operation toasts
  fileCopied: (filename: string) =>
    toastSuccess(`Copied ${filename}`, {
      icon: <Copy className="w-5 h-5" style={{ color: EUVEKA_COLORS.success }} />
    }),

  fileDownloaded: (filename: string) =>
    toastSuccess(`Downloaded ${filename}`, {
      icon: <Download className="w-5 h-5" style={{ color: EUVEKA_COLORS.success }} />
    }),

  fileUploaded: (filename: string, count?: number) =>
    toastSuccess(
      count && count > 1
        ? `Uploaded ${count} files`
        : `Uploaded ${filename}`,
      {
        icon: <Upload className="w-5 h-5" style={{ color: EUVEKA_COLORS.success }} />
      }
    ),

  fileDeleted: (filename: string, onUndo?: () => void) => {
    if (onUndo) {
      return toastWithUndo(`Deleted ${filename}`, onUndo);
    }
    return toastSuccess(`Deleted ${filename}`, {
      icon: <Trash2 className="w-5 h-5" style={{ color: EUVEKA_COLORS.success }} />
    });
  },

  // Connection toasts
  connected: (deviceName: string) =>
    toastSuccess(`Connected to ${deviceName}`),

  disconnected: (deviceName?: string) =>
    toastInfo(deviceName ? `Disconnected from ${deviceName}` : 'Disconnected'),

  connectionError: (error: string) =>
    toastError(`Connection failed: ${error}`, {
      persist: true,
      action: {
        label: 'Retry',
        onClick: () => {
          // Retry logic should be provided by caller
        }
      }
    }),

  // Transfer toasts with progress
  transferStarted: (filename: string) =>
    toastInfo(`Sending ${filename}...`),

  transferProgress: (filename: string, progress: number, toastId?: string) =>
    toastProgress(`Transferring ${filename}`, progress, {
      id: toastId || `transfer-${filename}`,
    }),

  transferComplete: (filename: string, downloadAction?: () => void) => {
    const action = downloadAction ? {
      label: 'Download',
      onClick: downloadAction,
      icon: <Download className="w-4 h-4" />
    } : undefined;

    return toastSuccess(`Transfer complete: ${filename}`, {
      ...(action ? { action } : {})
    });
  },

  transferFailed: (error: string) =>
    toastError(`Transfer failed: ${error}`),

  // Upload progress
  uploadProgress: (filename: string, progress: number, toastId?: string) =>
    toastProgress(`Uploading ${filename}`, progress, {
      id: toastId || `upload-${filename}`,
    }),

  // Download progress
  downloadProgress: (filename: string, progress: number, toastId?: string) =>
    toastProgress(`Downloading ${filename}`, progress, {
      id: toastId || `download-${filename}`,
    }),

  // Clipboard toasts
  copiedToClipboard: (content?: string) =>
    toastSuccess(
      content ? `Copied: ${content.slice(0, 30)}${content.length > 30 ? '...' : ''}` : 'Copied to clipboard',
      { icon: <Copy className="w-5 h-5" style={{ color: EUVEKA_COLORS.success }} /> }
    ),

  // Settings toasts
  settingsSaved: () =>
    toastSuccess('Settings saved'),

  settingsReset: (onUndo?: () => void) => {
    if (onUndo) {
      return toastWithUndo('Settings reset to defaults', onUndo);
    }
    return toastWarning('Settings reset to defaults');
  },

  // Security toasts
  encryptionEnabled: () =>
    toastSuccess('Post-quantum encryption active', {
      icon: <CheckCircle2 className="w-5 h-5" style={{ color: EUVEKA_COLORS.success }} />
    }),

  securityWarning: (message: string) =>
    toastWarning(message, {
      icon: <AlertCircle className="w-5 h-5" style={{ color: EUVEKA_COLORS.warning }} />,
      duration: 8000
    }),

  // Generic variants
  success: toastSuccess,
  error: toastError,
  warning: toastWarning,
  info: toastInfo,
  loading: toastLoading,
  progress: toastProgress,
  updateProgress,
  withUndo: toastWithUndo,

  // Utility methods
  dismiss: (id?: string | number) => {
    if (id) {
      persistentToasts.delete(id);
      progressToasts.delete(id);
    }
    sonnerToast.dismiss(id);
  },

  dismissAll: () => {
    persistentToasts.clear();
    progressToasts.clear();
    toastQueue.clear();
    sonnerToast.dismiss();
  },

  promise: sonnerToast.promise as typeof sonnerToast.promise,
};

// Export EUVEKA colors for external use
export { EUVEKA_COLORS };

// Export original sonner toast for advanced usage
export { sonnerToast };

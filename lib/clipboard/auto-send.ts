/**
 * Auto-Send for Clipboard
 *
 * Automatically sends pasted files to configured target device.
 * Supports confirmation prompts and file type filtering.
 */

import { ClipboardMonitor, type ClipboardMonitorCallbacks } from './clipboard-monitor';

export interface AutoSendConfig {
  /** Enable auto-send feature */
  enabled: boolean;
  /** Target device ID to send to */
  targetDeviceId?: string;
  /** Show confirmation dialog before sending */
  confirmBeforeSend: boolean;
  /** Allowed file types (MIME patterns, e.g., 'image/*', 'application/pdf') */
  fileTypes: string[];
  /** Maximum file size in bytes (default: 100MB) */
  maxFileSize?: number;
  /** Enable auto-send for images */
  sendImages: boolean;
  /** Enable auto-send for documents */
  sendDocuments: boolean;
  /** Enable auto-send for text */
  sendText: boolean;
  /** Enable auto-send for all file types */
  sendAllTypes: boolean;
}

export interface AutoSendCallbacks {
  /** Called when files should be sent */
  onSend?: (files: File[], targetDeviceId?: string) => void;
  /** Called when confirmation is needed */
  onConfirmationRequired?: (files: File[], targetDeviceId?: string) => Promise<boolean>;
  /** Called when image blob should be sent */
  onSendImage?: (blob: Blob, targetDeviceId?: string) => void;
  /** Called when text should be sent */
  onSendText?: (text: string, targetDeviceId?: string) => void;
  /** Called on errors */
  onError?: (error: Error) => void;
}

const DEFAULT_CONFIG: AutoSendConfig = {
  enabled: false,
  confirmBeforeSend: true,
  fileTypes: ['image/*', 'application/pdf', 'text/*'],
  maxFileSize: 100 * 1024 * 1024, // 100MB
  sendImages: true,
  sendDocuments: false,
  sendText: false,
  sendAllTypes: false,
};

const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
];

/**
 * Setup auto-send functionality for clipboard
 */
export function setupAutoSend(
  config: Partial<AutoSendConfig> = {},
  callbacks: AutoSendCallbacks = {}
): ClipboardMonitor {
  const fullConfig: AutoSendConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const clipboardCallbacks: ClipboardMonitorCallbacks = {
    onFilePasted: (files: File[]) => {
      if (!fullConfig.enabled) {return;}

      handleFilePaste(files, fullConfig, callbacks);
    },

    onImagePasted: (blob: Blob, dataUrl?: string) => {
      if (!fullConfig.enabled || !fullConfig.sendImages) {return;}

      handleImagePaste(blob, dataUrl, fullConfig, callbacks);
    },

    onTextPasted: (text: string) => {
      if (!fullConfig.enabled || !fullConfig.sendText) {return;}

      handleTextPaste(text, fullConfig, callbacks);
    },

    onError: (error: Error) => {
      if (callbacks.onError) {
        callbacks.onError(error);
      } else {
        console.error('Auto-send error:', error);
      }
    },
  };

  const monitor = new ClipboardMonitor(clipboardCallbacks);
  monitor.start();

  return monitor;
}

/**
 * Handle file paste event
 */
async function handleFilePaste(
  files: File[],
  config: AutoSendConfig,
  callbacks: AutoSendCallbacks
): Promise<void> {
  try {
    // Filter files based on config
    const validFiles = filterFiles(files, config);

    if (validFiles.length === 0) {
      return;
    }

    // Check if confirmation is required
    if (config.confirmBeforeSend && callbacks.onConfirmationRequired) {
      const confirmed = await callbacks.onConfirmationRequired(
        validFiles,
        config.targetDeviceId
      );

      if (!confirmed) {
        return;
      }
    }

    // Send files
    if (callbacks.onSend) {
      callbacks.onSend(validFiles, config.targetDeviceId);
    }
  } catch (error) {
    if (callbacks.onError) {
      callbacks.onError(error as Error);
    }
  }
}

/**
 * Handle image paste event
 */
async function handleImagePaste(
  blob: Blob,
  _dataUrl: string | undefined,
  config: AutoSendConfig,
  callbacks: AutoSendCallbacks
): Promise<void> {
  try {
    // Check file size
    if (config.maxFileSize && blob.size > config.maxFileSize) {
      throw new Error(`Image size exceeds maximum (${formatBytes(config.maxFileSize)})`);
    }

    // Convert blob to file for consistency
    const file = new File([blob], `pasted-image-${Date.now()}.png`, {
      type: blob.type || 'image/png',
    });

    // Check if confirmation is required
    if (config.confirmBeforeSend && callbacks.onConfirmationRequired) {
      const confirmed = await callbacks.onConfirmationRequired(
        [file],
        config.targetDeviceId
      );

      if (!confirmed) {
        return;
      }
    }

    // Send image
    if (callbacks.onSendImage) {
      callbacks.onSendImage(blob, config.targetDeviceId);
    } else if (callbacks.onSend) {
      callbacks.onSend([file], config.targetDeviceId);
    }
  } catch (error) {
    if (callbacks.onError) {
      callbacks.onError(error as Error);
    }
  }
}

/**
 * Handle text paste event
 */
async function handleTextPaste(
  text: string,
  config: AutoSendConfig,
  callbacks: AutoSendCallbacks
): Promise<void> {
  try {
    // Skip empty text
    if (!text.trim()) {
      return;
    }

    // Create a text file
    const blob = new Blob([text], { type: 'text/plain' });
    const file = new File([blob], `pasted-text-${Date.now()}.txt`, {
      type: 'text/plain',
    });

    // Check file size
    if (config.maxFileSize && file.size > config.maxFileSize) {
      throw new Error(`Text size exceeds maximum (${formatBytes(config.maxFileSize)})`);
    }

    // Check if confirmation is required
    if (config.confirmBeforeSend && callbacks.onConfirmationRequired) {
      const confirmed = await callbacks.onConfirmationRequired(
        [file],
        config.targetDeviceId
      );

      if (!confirmed) {
        return;
      }
    }

    // Send text
    if (callbacks.onSendText) {
      callbacks.onSendText(text, config.targetDeviceId);
    } else if (callbacks.onSend) {
      callbacks.onSend([file], config.targetDeviceId);
    }
  } catch (error) {
    if (callbacks.onError) {
      callbacks.onError(error as Error);
    }
  }
}

/**
 * Filter files based on config settings
 */
function filterFiles(files: File[], config: AutoSendConfig): File[] {
  return files.filter(file => {
    // Check file size
    if (config.maxFileSize && file.size > config.maxFileSize) {
      return false;
    }

    // If sendAllTypes is enabled, allow all files
    if (config.sendAllTypes) {
      return true;
    }

    // Check if it's an image
    if (config.sendImages && isImageFile(file)) {
      return true;
    }

    // Check if it's a document
    if (config.sendDocuments && isDocumentFile(file)) {
      return true;
    }

    // Check against custom file types
    if (config.fileTypes.length > 0) {
      return matchesFileType(file, config.fileTypes);
    }

    return false;
  });
}

/**
 * Check if file is an image
 */
function isImageFile(file: File): boolean {
  return IMAGE_MIME_TYPES.includes(file.type) || file.type.startsWith('image/');
}

/**
 * Check if file is a document
 */
function isDocumentFile(file: File): boolean {
  return DOCUMENT_MIME_TYPES.includes(file.type) || file.type.startsWith('text/');
}

/**
 * Check if file matches any of the allowed types
 */
function matchesFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some(pattern => {
    if (pattern.endsWith('/*')) {
      const category = pattern.split('/')[0];
      return file.type.startsWith(category + '/');
    }
    return file.type === pattern;
  });
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) {return '0 Bytes';}
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Update auto-send configuration
 */
export function updateAutoSendConfig(
  monitor: ClipboardMonitor,
  config: Partial<AutoSendConfig>,
  callbacks: AutoSendCallbacks
): void {
  const fullConfig: AutoSendConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const clipboardCallbacks: ClipboardMonitorCallbacks = {
    onFilePasted: (files: File[]) => {
      if (!fullConfig.enabled) {return;}
      handleFilePaste(files, fullConfig, callbacks);
    },

    onImagePasted: (blob: Blob, dataUrl?: string) => {
      if (!fullConfig.enabled || !fullConfig.sendImages) {return;}
      handleImagePaste(blob, dataUrl, fullConfig, callbacks);
    },

    onTextPasted: (text: string) => {
      if (!fullConfig.enabled || !fullConfig.sendText) {return;}
      handleTextPaste(text, fullConfig, callbacks);
    },

    ...(callbacks.onError ? { onError: callbacks.onError } : {}),
  };

  monitor.updateCallbacks(clipboardCallbacks);
}

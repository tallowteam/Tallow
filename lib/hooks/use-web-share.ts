'use client';

import { useState, useCallback } from 'react';
import { secureLog } from '../utils/secure-logger';

export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

interface WebShareResult {
  share: (data: ShareData) => Promise<boolean>;
  canShare: boolean;
  canShareFiles: boolean;
  isSharing: boolean;
  error: Error | null;
}

/**
 * Hook to use the Web Share API with fallback support
 * Detects Web Share API availability and provides share functionality
 */
export function useWebShare(): WebShareResult {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Check if Web Share API is available
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  // Check if File sharing is supported
  const canShareFiles =
    canShare &&
    typeof navigator !== 'undefined' &&
    navigator.canShare !== undefined;

  const share = useCallback(async (data: ShareData): Promise<boolean> => {
    setError(null);
    setIsSharing(true);

    try {
      // Check if navigator.share is available
      if (!canShare) {
        throw new Error('Web Share API not available');
      }

      // Validate data
      if (!data.title && !data.text && !data.url && !data.files) {
        throw new Error('At least one share parameter must be provided');
      }

      // Check if we can share files
      if (data.files && data.files.length > 0) {
        if (!canShareFiles) {
          throw new Error('File sharing not supported on this browser');
        }

        // Check if these specific files can be shared
        if (navigator.canShare && !navigator.canShare({ files: data.files })) {
          throw new Error('These files cannot be shared');
        }
      }

      // Attempt to share
      await navigator.share(data);
      setIsSharing(false);
      return true;
    } catch (err) {
      // User cancelled or error occurred
      const shareError = err instanceof Error ? err : new Error('Share failed');

      // Don't treat user cancellation as an error
      if (shareError.name !== 'AbortError') {
        setError(shareError);
        secureLog.error('Share error:', shareError);
      }

      setIsSharing(false);
      return false;
    }
  }, [canShare, canShareFiles]);

  return {
    share,
    canShare,
    canShareFiles,
    isSharing,
    error,
  };
}

/**
 * Hook for sharing files with Web Share API
 */
export function useFileShare() {
  const { share, canShare, canShareFiles, isSharing, error } = useWebShare();

  const shareFiles = useCallback(async (files: File[], title?: string): Promise<boolean> => {
    if (!canShareFiles) {
      return false;
    }

    return share({
      title: title || `Sharing ${files.length} file${files.length > 1 ? 's' : ''}`,
      files,
    });
  }, [share, canShareFiles]);

  return {
    shareFiles,
    canShare,
    canShareFiles,
    isSharing,
    error,
  };
}

/**
 * Fallback copy-to-clipboard functionality when Web Share API is not available
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.setAttribute('aria-hidden', 'true');
    document.body.appendChild(textArea);
    textArea.select();

    try {
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch (_err) {
      document.body.removeChild(textArea);
      return false;
    }
  } catch (err) {
    secureLog.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Create a shareable link for a file
 */
export function createShareableLink(fileId: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/share/${fileId}`;
}

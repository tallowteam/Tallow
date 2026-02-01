/**
 * useMetadataStripper Hook
 *
 * React hook for integrating metadata stripping into file upload flows
 */

import { useState, useCallback } from 'react';
import { secureLog } from '../utils/secure-logger';
import {
  stripMetadata,
  extractMetadata,
  supportsMetadataStripping,
  MetadataInfo,
  getMetadataSummary,
} from '../privacy/metadata-stripper';
import {
  getPrivacySettings,
  shouldStripMetadata,
} from '../privacy/privacy-settings';

export interface UseMetadataStripperResult {
  // State
  isProcessing: boolean;
  progress: { current: number; total: number } | null;

  // Functions
  processFile: (file: File, recipientId?: string) => Promise<File>;
  processFiles: (files: File[], recipientId?: string) => Promise<File[]>;
  checkMetadata: (file: File) => Promise<MetadataInfo | null>;
  shouldProcess: (fileType: string, recipientId?: string) => Promise<boolean>;
}

export function useMetadataStripper(): UseMetadataStripperResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  /**
   * Check if a file should be processed based on settings
   */
  const shouldProcess = useCallback(
    async (fileType: string, recipientId?: string): Promise<boolean> => {
      if (!supportsMetadataStripping(fileType)) {
        return false;
      }

      return await shouldStripMetadata(fileType, recipientId);
    },
    []
  );

  /**
   * Check metadata in a file without stripping
   */
  const checkMetadata = useCallback(async (file: File): Promise<MetadataInfo | null> => {
    try {
      if (!supportsMetadataStripping(file.type)) {
        return null;
      }

      const metadata = await extractMetadata(file);
      return metadata;
    } catch (error) {
      secureLog.error('Failed to check metadata:', error);
      return null;
    }
  }, []);

  /**
   * Process a single file
   */
  const processFile = useCallback(
    async (file: File, recipientId?: string): Promise<File> => {
      try {
        // Check if processing is needed
        const shouldStrip = await shouldProcess(file.type, recipientId);

        if (!shouldStrip) {
          return file;
        }

        setIsProcessing(true);

        // Get settings
        const settings = await getPrivacySettings();

        // Check metadata first
        const metadata = await extractMetadata(file);

        // Log warning if sensitive data detected
        if (metadata.hasSensitiveData && settings.showMetadataWarnings) {
          const summary = getMetadataSummary(metadata);
          secureLog.warn('Sensitive metadata detected:', summary.join(', '));
        }

        // Require confirmation if enabled
        if (settings.requireConfirmationBeforeStrip && metadata.hasSensitiveData) {
          // This should trigger UI confirmation dialog
          // For now, we'll proceed automatically
          secureLog.log('Confirmation required for metadata stripping');
        }

        // Strip metadata
        const result = await stripMetadata(file, settings.preserveOrientation);

        if (!result.success || !result.strippedFile) {
          secureLog.warn('Metadata stripping failed, using original file');
          return file;
        }

        // Log success
        if (result.bytesRemoved && result.bytesRemoved > 0) {
          const summary = getMetadataSummary(metadata);
          secureLog.log('Metadata removed:', summary.join(', '), `(saved ${formatBytes(result.bytesRemoved)})`);
        }

        return result.strippedFile;
      } catch (error) {
        secureLog.error('Error processing file:', error);
        return file;
      } finally {
        setIsProcessing(false);
      }
    },
    [shouldProcess]
  );

  /**
   * Process multiple files
   */
  const processFiles = useCallback(
    async (files: File[], recipientId?: string): Promise<File[]> => {
      try {
        setIsProcessing(true);
        setProgress({ current: 0, total: files.length });

        const results: File[] = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file) {
            const processed = await processFile(file, recipientId);
            results.push(processed);
          }
          setProgress({ current: i + 1, total: files.length });
        }

        return results;
      } catch (error) {
        secureLog.error('Error processing files:', error);
        return files;
      } finally {
        setIsProcessing(false);
        setProgress(null);
      }
    },
    [processFile]
  );

  return {
    isProcessing,
    progress,
    processFile,
    processFiles,
    checkMetadata,
    shouldProcess,
  };
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) {return '0 B';}
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

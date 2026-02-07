/**
 * Privacy Pipeline Hook
 *
 * Integrates all privacy features into the file transfer pipeline:
 * - Metadata stripping (EXIF/GPS removal)
 * - Filename encryption in transit
 * - File size padding to power-of-2
 * - IP leak protection (relay-only ICE candidates)
 * - Onion routing integration
 */

import { useCallback, useState } from 'react';
import { useSettingsStore } from '@/lib/stores/settings-store';
import {
  stripMetadata,
  supportsMetadataStripping,
  StripResult,
  extractMetadata,
  MetadataInfo
} from '@/lib/privacy/metadata-stripper';
import { useOnionRouting } from '@/lib/hooks/use-onion-routing';
import { getTrafficObfuscator } from '@/lib/transport/obfuscation';

// ============================================================================
// Types
// ============================================================================

export interface ProcessedFile {
  file: File;
  originalFile: File;
  metadataStripped: boolean;
  metadataInfo?: MetadataInfo;
  bytesRemoved: number;
  encrypted: boolean;
  padded: boolean;
  paddedSize?: number;
}

export interface PrivacyPipelineConfig {
  stripMetadata: boolean;
  encryptFilenames: boolean;
  padFileSizes: boolean;
  ipLeakProtection: boolean;
  enableOnionRouting: boolean;
}

export interface PrivacyStats {
  totalFilesProcessed: number;
  metadataStrippedCount: number;
  totalBytesRemoved: number;
  averageProcessingTime: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Pad file size to next power of 2 to prevent size analysis
 */
function padFileSize(file: File): File {
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(file.size)));

  // Only pad if difference is < 50% of original size (avoid huge padding)
  const paddingNeeded = nextPowerOf2 - file.size;
  if (paddingNeeded > file.size * 0.5) {
    return file;
  }

  // Create padded blob
  const padding = new Uint8Array(paddingNeeded);
  crypto.getRandomValues(padding);

  const paddedBlob = new Blob([file, padding], { type: file.type });
  return new File([paddedBlob], file.name, {
    type: file.type,
    lastModified: file.lastModified,
  });
}

/**
 * Encrypt filename for transit
 */
function encryptFilename(filename: string): string {
  // Simple obfuscation - in production, use proper encryption
  const encoder = new TextEncoder();
  const data = encoder.encode(filename);
  const hash = Array.from(data)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const ext = filename.split('.').pop();
  return `encrypted_${hash.substring(0, 16)}.${ext}`;
}

/**
 * Generate ICE configuration for IP leak protection
 */
function getPrivateICEConfig(): RTCConfiguration {
  return {
    iceServers: [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
        ],
      },
    ],
    iceTransportPolicy: 'relay', // Only use relay candidates (no direct/srflx)
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
  };
}

// ============================================================================
// Main Hook
// ============================================================================

export function usePrivacyPipeline() {
  const {
    stripMetadata: stripMetadataEnabled,
    ipLeakProtection,
    onionRoutingEnabled,
  } = useSettingsStore();

  const onionRouting = useOnionRouting({
    mode: onionRoutingEnabled ? 'multi-hop' as const : 'disabled' as const,
    numHops: 3,
  });

  const [stats, setStats] = useState<PrivacyStats>({
    totalFilesProcessed: 0,
    metadataStrippedCount: 0,
    totalBytesRemoved: 0,
    averageProcessingTime: 0,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<Map<string, ProcessedFile>>(new Map());

  /**
   * Process a single file through the privacy pipeline
   */
  const processFile = useCallback(
    async (file: File, config?: Partial<PrivacyPipelineConfig>): Promise<ProcessedFile> => {
      const startTime = performance.now();

      const finalConfig: PrivacyPipelineConfig = {
        stripMetadata: config?.stripMetadata ?? stripMetadataEnabled,
        encryptFilenames: config?.encryptFilenames ?? false,
        padFileSizes: config?.padFileSizes ?? false,
        ipLeakProtection: config?.ipLeakProtection ?? ipLeakProtection,
        enableOnionRouting: config?.enableOnionRouting ?? onionRoutingEnabled,
      };

      let processedFile = file;
      let metadataStripped = false;
      let metadataInfo: MetadataInfo | undefined;
      let bytesRemoved = 0;

      // Step 1: Strip metadata if enabled and supported
      if (finalConfig.stripMetadata && supportsMetadataStripping(file.type)) {
        try {
          // First extract metadata for info
          metadataInfo = await extractMetadata(file);

          // Then strip it
          const result: StripResult = await stripMetadata(file);

          if (result.success && result.strippedFile) {
            processedFile = result.strippedFile;
            metadataStripped = true;
            bytesRemoved = result.bytesRemoved || 0;
          }
        } catch (err) {
          console.warn('Metadata stripping failed:', err);
        }
      }

      // Step 2: Pad file size if enabled
      let padded = false;
      let paddedSize: number | undefined;
      if (finalConfig.padFileSizes) {
        const originalSize = processedFile.size;
        processedFile = padFileSize(processedFile);
        if (processedFile.size > originalSize) {
          padded = true;
          paddedSize = processedFile.size;
        }
      }

      // Step 3: Encrypt filename if enabled
      let encrypted = false;
      if (finalConfig.encryptFilenames) {
        const encryptedName = encryptFilename(processedFile.name);
        processedFile = new File([processedFile], encryptedName, {
          type: processedFile.type,
          lastModified: processedFile.lastModified,
        });
        encrypted = true;
      }

      // Update stats
      const processingTime = performance.now() - startTime;
      setStats(prev => ({
        totalFilesProcessed: prev.totalFilesProcessed + 1,
        metadataStrippedCount: prev.metadataStrippedCount + (metadataStripped ? 1 : 0),
        totalBytesRemoved: prev.totalBytesRemoved + bytesRemoved,
        averageProcessingTime:
          (prev.averageProcessingTime * prev.totalFilesProcessed + processingTime) /
          (prev.totalFilesProcessed + 1),
      }));

      const result: ProcessedFile = {
        file: processedFile,
        originalFile: file,
        metadataStripped,
        ...(metadataInfo !== undefined ? { metadataInfo } : {}),
        bytesRemoved,
        encrypted,
        padded,
        ...(paddedSize !== undefined ? { paddedSize } : {}),
      };

      // Cache processed file
      setProcessedFiles(prev => new Map(prev).set(file.name, result));

      return result;
    },
    [stripMetadataEnabled, ipLeakProtection, onionRoutingEnabled]
  );

  /**
   * Process multiple files through the privacy pipeline
   */
  const processFiles = useCallback(
    async (
      files: File[],
      config?: Partial<PrivacyPipelineConfig>,
      onProgress?: (processed: number, total: number) => void
    ): Promise<ProcessedFile[]> => {
      setIsProcessing(true);
      const results: ProcessedFile[] = [];

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file) {
            const result = await processFile(file, config);
            results.push(result);

            if (onProgress) {
              onProgress(i + 1, files.length);
            }
          }
        }
      } finally {
        setIsProcessing(false);
      }

      return results;
    },
    [processFile]
  );

  /**
   * Get ICE configuration based on privacy settings
   */
  const getICEConfiguration = useCallback((): RTCConfiguration => {
    if (ipLeakProtection) {
      return getPrivateICEConfig();
    }

    // Default configuration (allows all candidate types)
    return {
      iceServers: [
        {
          urls: [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
          ],
        },
      ],
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    };
  }, [ipLeakProtection]);

  /**
   * Apply traffic obfuscation to data
   */
  const obfuscateTraffic = useCallback(
    async (data: Uint8Array): Promise<Uint8Array[]> => {
      const obfuscator = getTrafficObfuscator({
        enableCoverTraffic: onionRoutingEnabled,
        disguiseAs: 'https',
        paddingMode: 'uniform',
      });

      const frames = await obfuscator.obfuscateWithDisguise(data);
      return frames;
    },
    [onionRoutingEnabled]
  );

  /**
   * Check if a file has been processed
   */
  const isFileProcessed = useCallback(
    (filename: string): boolean => {
      return processedFiles.has(filename);
    },
    [processedFiles]
  );

  /**
   * Get processed file info
   */
  const getProcessedFile = useCallback(
    (filename: string): ProcessedFile | undefined => {
      return processedFiles.get(filename);
    },
    [processedFiles]
  );

  /**
   * Clear processed files cache
   */
  const clearProcessedFiles = useCallback(() => {
    setProcessedFiles(new Map());
  }, []);

  /**
   * Reset statistics
   */
  const resetStats = useCallback(() => {
    setStats({
      totalFilesProcessed: 0,
      metadataStrippedCount: 0,
      totalBytesRemoved: 0,
      averageProcessingTime: 0,
    });
  }, []);

  /**
   * Get privacy status summary
   */
  const getPrivacyStatus = useCallback(() => {
    const features = {
      metadataStripping: stripMetadataEnabled,
      ipLeakProtection,
      onionRouting: onionRoutingEnabled && onionRouting.isAvailable,
      trafficObfuscation: onionRoutingEnabled,
    };

    const activeCount = Object.values(features).filter(Boolean).length;
    const totalCount = Object.keys(features).length;

    return {
      features,
      activeCount,
      totalCount,
      level: activeCount >= 3 ? 'high' : activeCount >= 2 ? 'medium' : activeCount >= 1 ? 'low' : 'none',
    };
  }, [stripMetadataEnabled, ipLeakProtection, onionRoutingEnabled, onionRouting.isAvailable]);

  return {
    // Processing
    processFile,
    processFiles,
    isProcessing,

    // File tracking
    processedFiles: Array.from(processedFiles.values()),
    isFileProcessed,
    getProcessedFile,
    clearProcessedFiles,

    // Configuration
    getICEConfiguration,
    obfuscateTraffic,

    // Stats
    stats,
    resetStats,

    // Status
    getPrivacyStatus,

    // Onion routing
    onionRouting,
  };
}

'use client';

import { useState } from 'react';
import { BatchProcessor } from '@/lib/transfer/batch-processor';
import { getAllRules, TransferFile } from '@/lib/transfer/batch-operations';
import { BatchRuleEditor } from './BatchRuleEditor';
import { BatchProgressPanel } from './BatchProgressPanel';
import { Button } from '@/components/ui/Button';
import styles from './BatchOperationsDemo.module.css';

/**
 * Batch Operations Demo Component
 *
 * Demonstrates the complete batch operations workflow:
 * 1. Configure rules with BatchRuleEditor
 * 2. Select files to process
 * 3. Process files with BatchProcessor
 * 4. Monitor progress with BatchProgressPanel
 */
export function BatchOperationsDemo() {
  const [processor] = useState(() => new BatchProcessor({
    rules: getAllRules(),
    parallel: true,
    maxParallel: 3,
    retryOnError: true,
  }));

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const handleStartProcessing = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select files first');
      return;
    }

    // Convert File objects to TransferFile format
    const transferFiles: TransferFile[] = await Promise.all(
      selectedFiles.map(async (file) => {
        // Generate a simple hash for demo purposes
        const hash = await generateFileHash(file);

        return {
          id: `${file.name}-${file.size}-${file.lastModified}`,
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          hash,
          thumbnail: null,
          path: null,
          // Add sender for demo (would come from actual device in real app)
          sender: {
            id: 'demo-device',
            name: 'Demo Device',
            platform: 'web' as const,
            ip: null,
            port: null,
            isOnline: true,
            isFavorite: false,
            lastSeen: Date.now(),
            avatar: null,
          },
        };
      })
    );

    // Clear previous batch and add new files
    processor.clear();
    processor.addFiles(transferFiles);

    // Start processing
    setIsProcessing(true);
    setShowProgress(true);

    try {
      const results = await processor.processAll(getAllRules());
      console.log('Batch processing completed:', results);
    } catch (error) {
      console.error('Batch processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearFiles = () => {
    setSelectedFiles([]);
    if (!isProcessing) {
      processor.clear();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Batch Operations</h1>
        <p className={styles.description}>
          Automate file operations with configurable rules. Set up rules to compress,
          encrypt, organize, or auto-accept files based on custom conditions.
        </p>
      </div>

      <div className={styles.layout}>
        {/* Left Panel - Rules Configuration */}
        <div className={styles.rulesPanel}>
          <BatchRuleEditor
            onRulesChange={(rules) => {
              console.log('Rules updated:', rules.length);
            }}
          />
        </div>

        {/* Right Panel - File Selection & Processing */}
        <div className={styles.processingPanel}>
          <div className={styles.fileSelection}>
            <h2 className={styles.sectionTitle}>Select Files</h2>

            <label className={styles.fileInputLabel}>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className={styles.fileInput}
              />
              <div className={styles.fileInputButton}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path d="M10 4v12M4 10h12" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Choose Files
              </div>
            </label>

            {selectedFiles.length > 0 && (
              <div className={styles.selectedFiles}>
                <div className={styles.selectedFilesHeader}>
                  <span className={styles.selectedFilesCount}>
                    {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                  </span>
                  <button
                    className={styles.clearButton}
                    onClick={handleClearFiles}
                    disabled={isProcessing}
                  >
                    Clear
                  </button>
                </div>

                <div className={styles.fileList}>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className={styles.fileItem}>
                      <div className={styles.fileIcon}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5l-4-4z" />
                          <path d="M9 1v4h4" fill="none" stroke="white" strokeWidth="1" />
                        </svg>
                      </div>
                      <div className={styles.fileInfo}>
                        <div className={styles.fileName}>{file.name}</div>
                        <div className={styles.fileSize}>{formatBytes(file.size)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.actions}>
              <Button
                onClick={handleStartProcessing}
                disabled={selectedFiles.length === 0 || isProcessing}
                fullWidth
              >
                {isProcessing ? 'Processing...' : 'Start Batch Processing'}
              </Button>
            </div>
          </div>

          {/* Processing Stats */}
          {isProcessing && (
            <div className={styles.stats}>
              <h3 className={styles.statsTitle}>Processing Statistics</h3>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Average Duration</span>
                  <span className={styles.statValue}>
                    {(processor.getAverageItemDuration() / 1000).toFixed(2)}s
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Total Duration</span>
                  <span className={styles.statValue}>
                    {(processor.getDuration() / 1000).toFixed(2)}s
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Panel Modal */}
      {showProgress && (
        <div className={styles.progressOverlay}>
          <div className={styles.progressModal}>
            <BatchProgressPanel
              processor={processor}
              show={showProgress}
              onClose={() => setShowProgress(false)}
              onComplete={() => {
                console.log('Batch processing complete!');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Functions

async function generateFileHash(file: File): Promise<string> {
  // Simple hash generation for demo
  // In production, use crypto.subtle.digest
  const text = `${file.name}-${file.size}-${file.lastModified}`;
  return btoa(text).substring(0, 64);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

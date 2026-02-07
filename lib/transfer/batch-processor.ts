/**
 * Batch Processor Module
 *
 * Processes multiple files with configurable batch rules.
 * Supports progress tracking, cancellation, and error handling.
 */

import {
  BatchRule,
  TransferFile,
  evaluateRules,
  applyRuleActions,
} from './batch-operations';
import { generateUUID } from '../utils/uuid';
import secureLog from '../utils/secure-logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Status of a batch item
 */
export type BatchItemStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

/**
 * Individual file in a batch
 */
export interface BatchItem {
  /** Unique batch item ID */
  id: string;
  /** File being processed */
  file: TransferFile;
  /** Current status */
  status: BatchItemStatus;
  /** Applied rule IDs */
  appliedRules: string[];
  /** Success flag */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Modified file after rules applied */
  modifiedFile?: TransferFile;
  /** Start time */
  startTime?: number;
  /** End time */
  endTime?: number;
}

/**
 * Result of processing a batch
 */
export interface BatchResult {
  /** File ID */
  fileId: string;
  /** File name */
  fileName: string;
  /** Applied rule IDs */
  appliedRules: string[];
  /** Success flag */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Modified file if changed */
  modifiedFile?: TransferFile;
}

/**
 * Progress callback function
 */
export type ProgressCallback = (completed: number, total: number, currentItem?: BatchItem) => void;

/**
 * Batch processing options
 */
export interface BatchProcessorOptions {
  /** Rules to apply */
  rules: BatchRule[];
  /** Progress callback */
  onProgress?: ProgressCallback;
  /** Error callback */
  onError?: (item: BatchItem, error: Error) => void;
  /** Completion callback */
  onComplete?: (results: BatchResult[]) => void;
  /** Process items in parallel (default: false) */
  parallel?: boolean;
  /** Maximum parallel operations (default: 3) */
  maxParallel?: number;
  /** Retry failed items (default: false) */
  retryOnError?: boolean;
  /** Maximum retries (default: 2) */
  maxRetries?: number;
}

// ============================================================================
// BATCH PROCESSOR CLASS
// ============================================================================

export class BatchProcessor {
  private items: BatchItem[] = [];
  private rules: BatchRule[] = [];
  private options: BatchProcessorOptions;
  private isCancelled = false;
  private isProcessing = false;
  private completedCount = 0;
  private failedCount = 0;
  private cancelledCount = 0;

  constructor(options: BatchProcessorOptions) {
    this.options = {
      parallel: false,
      maxParallel: 3,
      retryOnError: false,
      maxRetries: 2,
      ...options,
    };
    this.rules = options.rules;
  }

  /**
   * Add files to the batch
   */
  addFiles(files: TransferFile[]): void {
    if (this.isProcessing) {
      throw new Error('Cannot add files while processing');
    }

    const newItems: BatchItem[] = files.map((file) => ({
      id: generateUUID(),
      file,
      status: 'pending' as BatchItemStatus,
      appliedRules: [],
      success: false,
    }));

    this.items.push(...newItems);
    secureLog.info('Added files to batch', { count: files.length });
  }

  /**
   * Get all batch items
   */
  getItems(): BatchItem[] {
    return [...this.items];
  }

  /**
   * Get batch statistics
   */
  getStats() {
    return {
      total: this.items.length,
      pending: this.items.filter((i) => i.status === 'pending').length,
      processing: this.items.filter((i) => i.status === 'processing').length,
      completed: this.completedCount,
      failed: this.failedCount,
      cancelled: this.cancelledCount,
    };
  }

  /**
   * Clear all batch items
   */
  clear(): void {
    if (this.isProcessing) {
      throw new Error('Cannot clear while processing');
    }
    this.items = [];
    this.completedCount = 0;
    this.failedCount = 0;
    this.cancelledCount = 0;
  }

  /**
   * Remove a specific batch item
   */
  removeItem(itemId: string): boolean {
    if (this.isProcessing) {
      throw new Error('Cannot remove items while processing');
    }

    const index = this.items.findIndex((item) => item.id === itemId);
    if (index === -1) return false;

    this.items.splice(index, 1);
    return true;
  }

  /**
   * Process all files in the batch
   */
  async processAll(rules?: BatchRule[]): Promise<BatchResult[]> {
    if (this.isProcessing) {
      throw new Error('Already processing');
    }

    if (rules) {
      this.rules = rules;
    }

    this.isProcessing = true;
    this.isCancelled = false;
    this.completedCount = 0;
    this.failedCount = 0;
    this.cancelledCount = 0;

    secureLog.info('Starting batch processing', {
      itemCount: this.items.length,
      ruleCount: this.rules.length,
    });

    try {
      const results = this.options.parallel
        ? await this.processParallel()
        : await this.processSequential();

      if (this.options.onComplete) {
        this.options.onComplete(results);
      }

      return results;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process items sequentially
   */
  private async processSequential(): Promise<BatchResult[]> {
    const results: BatchResult[] = [];

    for (const item of this.items) {
      if (this.isCancelled) {
        item.status = 'cancelled';
        this.cancelledCount++;
        continue;
      }

      const result = await this.processItem(item);
      results.push(result);

      this.notifyProgress();
    }

    return results;
  }

  /**
   * Process items in parallel with concurrency limit
   */
  private async processParallel(): Promise<BatchResult[]> {
    const results: BatchResult[] = [];
    const maxParallel = this.options.maxParallel || 3;
    const queue = [...this.items];
    const processing: Promise<void>[] = [];

    while (queue.length > 0 || processing.length > 0) {
      if (this.isCancelled) {
        // Cancel remaining items
        for (const item of queue) {
          item.status = 'cancelled';
          this.cancelledCount++;
        }
        break;
      }

      // Start new tasks up to maxParallel
      while (processing.length < maxParallel && queue.length > 0) {
        const item = queue.shift();
        if (!item) break;

        const task = this.processItem(item).then((result) => {
          results.push(result);
          this.notifyProgress(item);
        });

        processing.push(task);
      }

      // Wait for at least one task to complete
      if (processing.length > 0) {
        await Promise.race(processing);
        // Remove completed tasks
        const completed = processing.filter((p) => {
          // Check if promise is settled
          let isSettled = false;
          p.then(() => (isSettled = true)).catch(() => (isSettled = true));
          return isSettled;
        });
        processing.splice(0, completed.length);
      }
    }

    // Wait for all remaining tasks
    await Promise.all(processing);

    return results;
  }

  /**
   * Process a single batch item
   */
  private async processItem(
    item: BatchItem,
    retryCount = 0
  ): Promise<BatchResult> {
    item.status = 'processing';
    item.startTime = Date.now();

    try {
      // Evaluate rules
      const matchingActions = evaluateRules(item.file, this.rules);
      const matchingRules = this.rules.filter((rule) =>
        matchingActions.some((action) => rule.action === action)
      );

      item.appliedRules = matchingRules.map((rule) => rule.id);

      // Apply rule actions
      const actionResults = await applyRuleActions(
        item.file,
        matchingActions,
        this.rules
      );

      // Check if all actions succeeded
      const allSuccessful = actionResults.every((r) => r.success);

      if (allSuccessful) {
        item.status = 'completed';
        item.success = true;
        this.completedCount++;

        // Get the final modified file
        const lastResult = actionResults[actionResults.length - 1];
        item.modifiedFile = lastResult?.modifiedFile || item.file;
      } else {
        const failedAction = actionResults.find((r) => !r.success);
        throw new Error(failedAction?.error || 'Action failed');
      }

      item.endTime = Date.now();

      return {
        fileId: item.file.id,
        fileName: item.file.name,
        appliedRules: item.appliedRules,
        success: true,
        modifiedFile: item.modifiedFile,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Retry logic
      if (
        this.options.retryOnError &&
        retryCount < (this.options.maxRetries || 2)
      ) {
        secureLog.warn('Retrying batch item', {
          itemId: item.id,
          fileName: item.file.name,
          retryCount: retryCount + 1,
        });
        return this.processItem(item, retryCount + 1);
      }

      item.status = 'failed';
      item.success = false;
      item.error = errorMessage;
      item.endTime = Date.now();
      this.failedCount++;

      if (this.options.onError) {
        this.options.onError(item, error as Error);
      }

      secureLog.error('Failed to process batch item', {
        itemId: item.id,
        fileName: item.file.name,
        error: errorMessage,
      });

      return {
        fileId: item.file.id,
        fileName: item.file.name,
        appliedRules: item.appliedRules,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Cancel batch processing
   */
  cancel(): void {
    if (!this.isProcessing) {
      throw new Error('Not currently processing');
    }

    this.isCancelled = true;
    secureLog.info('Batch processing cancelled');
  }

  /**
   * Check if processing is cancelled
   */
  isCancelRequested(): boolean {
    return this.isCancelled;
  }

  /**
   * Check if currently processing
   */
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Notify progress callback
   */
  private notifyProgress(currentItem?: BatchItem): void {
    if (this.options.onProgress) {
      const completed = this.completedCount + this.failedCount + this.cancelledCount;
      this.options.onProgress(completed, this.items.length, currentItem);
    }
  }

  /**
   * Retry failed items
   */
  async retryFailed(): Promise<BatchResult[]> {
    const failedItems = this.items.filter((item) => item.status === 'failed');

    if (failedItems.length === 0) {
      return [];
    }

    secureLog.info('Retrying failed batch items', { count: failedItems.length });

    // Reset failed items
    for (const item of failedItems) {
      item.status = 'pending';
      item.success = false;
      item.error = undefined;
      this.failedCount--;
    }

    // Create a new processor with only failed items
    const retryProcessor = new BatchProcessor({
      ...this.options,
      rules: this.rules,
    });
    retryProcessor.items = failedItems;

    return retryProcessor.processAll();
  }

  /**
   * Get processing duration
   */
  getDuration(): number {
    const startTimes = this.items
      .map((i) => i.startTime)
      .filter((t): t is number => t !== undefined);
    const endTimes = this.items
      .map((i) => i.endTime)
      .filter((t): t is number => t !== undefined);

    if (startTimes.length === 0 || endTimes.length === 0) {
      return 0;
    }

    const start = Math.min(...startTimes);
    const end = Math.max(...endTimes);

    return end - start;
  }

  /**
   * Get average processing time per item
   */
  getAverageItemDuration(): number {
    const durations = this.items
      .filter((i) => i.startTime && i.endTime)
      .map((i) => (i.endTime! - i.startTime!));

    if (durations.length === 0) return 0;

    return durations.reduce((sum, d) => sum + d, 0) / durations.length;
  }
}

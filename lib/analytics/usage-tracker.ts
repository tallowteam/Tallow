/**
 * Usage Tracker - Analytics Singleton
 *
 * Tracks transfers, connections, and errors for admin analytics.
 * Data stored in localStorage with rolling 30-day window.
 *
 * CRITICAL: Plain module singleton pattern - safe for Turbopack.
 * DO NOT convert to hook or Zustand store.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TransferMetadata {
  id: string;
  fileType: string;
  fileSize: number;
  duration: number;
  speed: number;
  connectionMethod: 'local' | 'internet' | 'friend';
  success: boolean;
  timestamp: number;
}

export interface ConnectionEvent {
  type: 'local' | 'internet' | 'friend';
  timestamp: number;
  duration: number | null;
}

export interface ErrorEvent {
  category: string;
  message: string;
  timestamp: number;
}

export interface UsageStats {
  transfers: number;
  totalBytes: number;
  avgSpeed: number;
  errorRate: number;
  byMethod: Record<string, number>;
  byFileType: Record<string, number>;
  chartData: {
    transferVolume: Array<{ date: string; count: number; bytes: number }>;
    fileTypes: Array<{ type: string; count: number; percentage: number }>;
    connectionMethods: Array<{ method: string; count: number; percentage: number }>;
    errorRate: Array<{ date: string; errors: number; total: number }>;
  };
}

interface StoredData {
  transfers: TransferMetadata[];
  connections: ConnectionEvent[];
  errors: ErrorEvent[];
  lastCleanup: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'tallow-usage-analytics';
const MAX_AGE_DAYS = 30;
const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 1 day

// ============================================================================
// STORAGE HELPERS
// ============================================================================

function loadData(): StoredData {
  if (typeof window === 'undefined') {
    return {
      transfers: [],
      connections: [],
      errors: [],
      lastCleanup: Date.now(),
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        transfers: [],
        connections: [],
        errors: [],
        lastCleanup: Date.now(),
      };
    }

    const data = JSON.parse(stored) as StoredData;
    return data;
  } catch (error) {
    console.error('[UsageTracker] Failed to load data:', error);
    return {
      transfers: [],
      connections: [],
      errors: [],
      lastCleanup: Date.now(),
    };
  }
}

function saveData(data: StoredData): void {
  if (typeof window === 'undefined') {return;}

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[UsageTracker] Failed to save data:', error);
  }
}

function cleanupOldData(data: StoredData): StoredData {
  const now = Date.now();
  const cutoff = now - MAX_AGE_MS;

  return {
    transfers: data.transfers.filter((t) => t.timestamp > cutoff),
    connections: data.connections.filter((c) => c.timestamp > cutoff),
    errors: data.errors.filter((e) => e.timestamp > cutoff),
    lastCleanup: now,
  };
}

// ============================================================================
// USAGE TRACKER SINGLETON
// ============================================================================

class UsageTrackerClass {
  private data: StoredData;

  constructor() {
    this.data = loadData();
    this.maybeCleanup();
  }

  private maybeCleanup(): void {
    const now = Date.now();
    if (now - this.data.lastCleanup > CLEANUP_INTERVAL_MS) {
      this.data = cleanupOldData(this.data);
      saveData(this.data);
    }
  }

  /**
   * Track a completed transfer
   */
  trackTransfer(metadata: TransferMetadata): void {
    this.data.transfers.push(metadata);
    this.maybeCleanup();
    saveData(this.data);
  }

  /**
   * Track a connection event
   */
  trackConnection(type: 'local' | 'internet' | 'friend', duration: number | null = null): void {
    this.data.connections.push({
      type,
      timestamp: Date.now(),
      duration,
    });
    this.maybeCleanup();
    saveData(this.data);
  }

  /**
   * Track an error event
   */
  trackError(category: string, message: string): void {
    this.data.errors.push({
      category,
      message,
      timestamp: Date.now(),
    });
    this.maybeCleanup();
    saveData(this.data);
  }

  /**
   * Get usage statistics for a time range
   */
  getStats(timeRange: '24h' | '7d' | '30d' = '7d'): UsageStats {
    const now = Date.now();
    const ranges = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    const cutoff = now - ranges[timeRange];

    // Filter data by time range
    const transfers = this.data.transfers.filter((t) => t.timestamp > cutoff);
    const errors = this.data.errors.filter((e) => e.timestamp > cutoff);

    // Calculate basic stats
    const totalBytes = transfers.reduce((sum, t) => sum + t.fileSize, 0);
    const avgSpeed =
      transfers.length > 0
        ? transfers.reduce((sum, t) => sum + t.speed, 0) / transfers.length
        : 0;
    const totalEvents = transfers.length + errors.length;
    const errorRate = totalEvents > 0 ? errors.length / totalEvents : 0;

    // Group by method
    const byMethod: Record<string, number> = {};
    transfers.forEach((t) => {
      byMethod[t.connectionMethod] = (byMethod[t.connectionMethod] || 0) + 1;
    });

    // Group by file type
    const byFileType: Record<string, number> = {};
    transfers.forEach((t) => {
      const type = this.normalizeFileType(t.fileType);
      byFileType[type] = (byFileType[type] || 0) + 1;
    });

    // Generate chart data
    const chartData = {
      transferVolume: this.generateTransferVolumeData(transfers, timeRange),
      fileTypes: this.generateFileTypeData(byFileType, transfers.length),
      connectionMethods: this.generateConnectionMethodData(byMethod, transfers.length),
      errorRate: this.generateErrorRateData(transfers, errors, timeRange),
    };

    return {
      transfers: transfers.length,
      totalBytes,
      avgSpeed,
      errorRate,
      byMethod,
      byFileType,
      chartData,
    };
  }

  /**
   * Get all transfer data (for admin table)
   */
  getAllTransfers(limit: number = 100): TransferMetadata[] {
    return this.data.transfers.slice(-limit).reverse();
  }

  /**
   * Clear all analytics data
   */
  clearAll(): void {
    this.data = {
      transfers: [],
      connections: [],
      errors: [],
      lastCleanup: Date.now(),
    };
    saveData(this.data);
  }

  // Private helper methods

  private normalizeFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) {return 'Image';}
    if (mimeType.startsWith('video/')) {return 'Video';}
    if (mimeType.startsWith('audio/')) {return 'Audio';}
    if (mimeType.startsWith('text/')) {return 'Document';}
    if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('spreadsheet') ||
      mimeType.includes('presentation')
    ) {
      return 'Document';
    }
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) {
      return 'Archive';
    }
    return 'Other';
  }

  private generateTransferVolumeData(
    transfers: TransferMetadata[],
    timeRange: '24h' | '7d' | '30d'
  ): Array<{ date: string; count: number; bytes: number }> {
    const now = Date.now();
    const buckets = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
    const bucketSize =
      timeRange === '24h'
        ? 60 * 60 * 1000
        : timeRange === '7d'
          ? 24 * 60 * 60 * 1000
          : 24 * 60 * 60 * 1000;

    const data: Array<{ date: string; count: number; bytes: number }> = [];

    for (let i = buckets - 1; i >= 0; i--) {
      const bucketEnd = now - i * bucketSize;
      const bucketStart = bucketEnd - bucketSize;

      const bucketTransfers = transfers.filter(
        (t) => t.timestamp >= bucketStart && t.timestamp < bucketEnd
      );

      const date =
        timeRange === '24h'
          ? new Date(bucketEnd).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
          : new Date(bucketEnd).toLocaleDateString('en', { month: 'short', day: 'numeric' });

      data.push({
        date,
        count: bucketTransfers.length,
        bytes: bucketTransfers.reduce((sum, t) => sum + t.fileSize, 0),
      });
    }

    return data;
  }

  private generateFileTypeData(
    byFileType: Record<string, number>,
    total: number
  ): Array<{ type: string; count: number; percentage: number }> {
    return Object.entries(byFileType)
      .map(([type, count]) => ({
        type,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  private generateConnectionMethodData(
    byMethod: Record<string, number>,
    total: number
  ): Array<{ method: string; count: number; percentage: number }> {
    return Object.entries(byMethod)
      .map(([method, count]) => ({
        method,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  private generateErrorRateData(
    transfers: TransferMetadata[],
    errors: ErrorEvent[],
    timeRange: '24h' | '7d' | '30d'
  ): Array<{ date: string; errors: number; total: number }> {
    const now = Date.now();
    const buckets = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
    const bucketSize =
      timeRange === '24h'
        ? 60 * 60 * 1000
        : timeRange === '7d'
          ? 24 * 60 * 60 * 1000
          : 24 * 60 * 60 * 1000;

    const data: Array<{ date: string; errors: number; total: number }> = [];

    for (let i = buckets - 1; i >= 0; i--) {
      const bucketEnd = now - i * bucketSize;
      const bucketStart = bucketEnd - bucketSize;

      const bucketTransfers = transfers.filter(
        (t) => t.timestamp >= bucketStart && t.timestamp < bucketEnd
      );
      const bucketErrors = errors.filter(
        (e) => e.timestamp >= bucketStart && e.timestamp < bucketEnd
      );

      const date =
        timeRange === '24h'
          ? new Date(bucketEnd).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
          : new Date(bucketEnd).toLocaleDateString('en', { month: 'short', day: 'numeric' });

      data.push({
        date,
        errors: bucketErrors.length,
        total: bucketTransfers.length + bucketErrors.length,
      });
    }

    return data;
  }
}

// Export singleton instance
export const UsageTracker = new UsageTrackerClass();

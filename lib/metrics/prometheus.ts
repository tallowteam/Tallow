/**
 * Prometheus Metrics Registry
 *
 * Complete Prometheus-compatible metrics implementation with:
 * - Counter: increment-only metrics
 * - Gauge: up/down metrics
 * - Histogram: value distribution with buckets
 * - Summary: percentile tracking
 * - Text exposition format serialization
 *
 * All metrics follow Prometheus naming conventions and best practices.
 *
 * @see https://prometheus.io/docs/practices/naming/
 * @see https://prometheus.io/docs/instrumenting/exposition_formats/
 */

/**
 * Label map type for metric labels
 */
export type Labels = Record<string, string | number>;

/**
 * Counter - increment-only metric
 * Used for counting events (e.g., requests, errors, transfers)
 */
export class Counter {
  private values: Map<string, number> = new Map();

  constructor(
    private name: string,
    private help: string,
    _labelNames: string[] = []
  ) {}

  /**
   * Increment counter by specified amount (default: 1)
   */
  inc(labels?: Labels, amount: number = 1): void {
    if (amount < 0) {
      throw new Error('Counter can only be incremented by non-negative values');
    }

    const key = this.labelKey(labels);
    const current = this.values.get(key) || 0;
    this.values.set(key, current + amount);
  }

  /**
   * Get current value for labels
   */
  get(labels?: Labels): number {
    return this.values.get(this.labelKey(labels)) || 0;
  }

  /**
   * Reset counter to 0
   */
  reset(labels?: Labels): void {
    this.values.set(this.labelKey(labels), 0);
  }

  /**
   * Serialize to Prometheus text format
   */
  serialize(): string {
    const lines: string[] = [];
    lines.push(`# HELP ${this.name} ${this.help}`);
    lines.push(`# TYPE ${this.name} counter`);

    if (this.values.size === 0) {
      // Always export at least one sample, even if zero
      lines.push(`${this.name} 0`);
    } else {
      for (const [labelKey, value] of this.values.entries()) {
        const labelStr = labelKey ? `{${labelKey}}` : '';
        lines.push(`${this.name}${labelStr} ${value}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate label key for storage
   */
  private labelKey(labels?: Labels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }

    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${this.escapeLabel(String(v))}"`)
      .join(',');
  }

  /**
   * Escape label values according to Prometheus spec
   */
  private escapeLabel(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/"/g, '\\"');
  }
}

/**
 * Gauge - metric that can go up and down
 * Used for current values (e.g., active connections, memory usage)
 */
export class Gauge {
  private values: Map<string, number> = new Map();

  constructor(
    private name: string,
    private help: string,
    _labelNames: string[] = []
  ) {}

  /**
   * Set gauge to specified value
   */
  set(labels: Labels | undefined, value: number): void;
  set(value: number): void;
  set(labelsOrValue: Labels | number | undefined, value?: number): void {
    if (typeof labelsOrValue === 'number') {
      // set(value)
      this.values.set('', labelsOrValue);
    } else {
      // set(labels, value)
      const key = this.labelKey(labelsOrValue);
      this.values.set(key, value!);
    }
  }

  /**
   * Increment gauge by amount (default: 1)
   */
  inc(labels?: Labels, amount: number = 1): void {
    const key = this.labelKey(labels);
    const current = this.values.get(key) || 0;
    this.values.set(key, current + amount);
  }

  /**
   * Decrement gauge by amount (default: 1)
   */
  dec(labels?: Labels, amount: number = 1): void {
    const key = this.labelKey(labels);
    const current = this.values.get(key) || 0;
    this.values.set(key, current - amount);
  }

  /**
   * Get current value
   */
  get(labels?: Labels): number {
    return this.values.get(this.labelKey(labels)) || 0;
  }

  /**
   * Serialize to Prometheus text format
   */
  serialize(): string {
    const lines: string[] = [];
    lines.push(`# HELP ${this.name} ${this.help}`);
    lines.push(`# TYPE ${this.name} gauge`);

    if (this.values.size === 0) {
      lines.push(`${this.name} 0`);
    } else {
      for (const [labelKey, value] of this.values.entries()) {
        const labelStr = labelKey ? `{${labelKey}}` : '';
        lines.push(`${this.name}${labelStr} ${value}`);
      }
    }

    return lines.join('\n');
  }

  private labelKey(labels?: Labels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }

    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${this.escapeLabel(String(v))}"`)
      .join(',');
  }

  private escapeLabel(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/"/g, '\\"');
  }
}

/**
 * Histogram - tracks distribution of values in configurable buckets
 * Used for request durations, response sizes, etc.
 */
export class Histogram {
  private buckets: number[];
  private counts: Map<string, Map<number, number>> = new Map();
  private sums: Map<string, number> = new Map();

  constructor(
    private name: string,
    private help: string,
    buckets: number[] = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    _labelNames: string[] = []
  ) {
    // Ensure buckets are sorted and include +Inf
    this.buckets = [...buckets].sort((a, b) => a - b);
  }

  /**
   * Observe a value and update histogram buckets
   */
  observe(labels: Labels | undefined, value: number): void;
  observe(value: number): void;
  observe(labelsOrValue: Labels | number | undefined, value?: number): void {
    let actualLabels: Labels | undefined;
    let actualValue: number;

    if (typeof labelsOrValue === 'number') {
      actualLabels = undefined;
      actualValue = labelsOrValue;
    } else {
      actualLabels = labelsOrValue;
      actualValue = value!;
    }

    const key = this.labelKey(actualLabels);

    // Initialize bucket counts if needed
    if (!this.counts.has(key)) {
      const bucketMap = new Map<number, number>();
      for (const bucket of this.buckets) {
        bucketMap.set(bucket, 0);
      }
      bucketMap.set(Infinity, 0);
      this.counts.set(key, bucketMap);
      this.sums.set(key, 0);
    }

    // Update sum
    this.sums.set(key, (this.sums.get(key) || 0) + actualValue);

    // Update buckets
    const bucketMap = this.counts.get(key)!;
    for (const bucket of this.buckets) {
      if (actualValue <= bucket) {
        bucketMap.set(bucket, bucketMap.get(bucket)! + 1);
      }
    }
    // Always increment +Inf bucket
    bucketMap.set(Infinity, bucketMap.get(Infinity)! + 1);
  }

  /**
   * Serialize to Prometheus text format
   */
  serialize(): string {
    const lines: string[] = [];
    lines.push(`# HELP ${this.name} ${this.help}`);
    lines.push(`# TYPE ${this.name} histogram`);

    if (this.counts.size === 0) {
      // Export empty histogram
      for (const bucket of this.buckets) {
        lines.push(`${this.name}_bucket{le="${bucket}"} 0`);
      }
      lines.push(`${this.name}_bucket{le="+Inf"} 0`);
      lines.push(`${this.name}_sum 0`);
      lines.push(`${this.name}_count 0`);
    } else {
      for (const [labelKey, bucketMap] of this.counts.entries()) {
        const labelPrefix = labelKey ? labelKey + ',' : '';

        // Export buckets
        for (const bucket of this.buckets) {
          const count = bucketMap.get(bucket) || 0;
          const labelStr = labelPrefix + `le="${bucket}"`;
          lines.push(`${this.name}_bucket{${labelStr}} ${count}`);
        }

        // Export +Inf bucket
        const infCount = bucketMap.get(Infinity) || 0;
        const infLabelStr = labelPrefix + 'le="+Inf"';
        lines.push(`${this.name}_bucket{${infLabelStr}} ${infCount}`);

        // Export sum and count
        const sum = this.sums.get(labelKey) || 0;
        const count = infCount;
        const baseLabelStr = labelKey ? `{${labelKey}}` : '';
        lines.push(`${this.name}_sum${baseLabelStr} ${sum}`);
        lines.push(`${this.name}_count${baseLabelStr} ${count}`);
      }
    }

    return lines.join('\n');
  }

  private labelKey(labels?: Labels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }

    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${this.escapeLabel(String(v))}"`)
      .join(',');
  }

  private escapeLabel(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/"/g, '\\"');
  }
}

/**
 * Summary - similar to histogram but calculates percentiles
 * Less efficient but more flexible than histograms
 */
export class Summary {
  private observations: Map<string, number[]> = new Map();
  private sums: Map<string, number> = new Map();

  constructor(
    private name: string,
    private help: string,
    private percentiles: number[] = [0.5, 0.9, 0.99],
    _labelNames: string[] = []
  ) {}

  /**
   * Observe a value
   */
  observe(labels: Labels | undefined, value: number): void;
  observe(value: number): void;
  observe(labelsOrValue: Labels | number | undefined, value?: number): void {
    let actualLabels: Labels | undefined;
    let actualValue: number;

    if (typeof labelsOrValue === 'number') {
      actualLabels = undefined;
      actualValue = labelsOrValue;
    } else {
      actualLabels = labelsOrValue;
      actualValue = value!;
    }

    const key = this.labelKey(actualLabels);

    if (!this.observations.has(key)) {
      this.observations.set(key, []);
      this.sums.set(key, 0);
    }

    this.observations.get(key)!.push(actualValue);
    this.sums.set(key, (this.sums.get(key) || 0) + actualValue);
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(sorted: number[], percentile: number): number {
    if (sorted.length === 0) {return 0;}

    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[Math.max(0, index)] ?? 0;
  }

  /**
   * Serialize to Prometheus text format
   */
  serialize(): string {
    const lines: string[] = [];
    lines.push(`# HELP ${this.name} ${this.help}`);
    lines.push(`# TYPE ${this.name} summary`);

    if (this.observations.size === 0) {
      // Export empty summary
      for (const p of this.percentiles) {
        lines.push(`${this.name}{quantile="${p}"} 0`);
      }
      lines.push(`${this.name}_sum 0`);
      lines.push(`${this.name}_count 0`);
    } else {
      for (const [labelKey, values] of this.observations.entries()) {
        const sorted = [...values].sort((a, b) => a - b);
        const labelPrefix = labelKey ? labelKey + ',' : '';

        // Export quantiles
        for (const p of this.percentiles) {
          const value = this.calculatePercentile(sorted, p);
          const labelStr = labelPrefix + `quantile="${p}"`;
          lines.push(`${this.name}{${labelStr}} ${value}`);
        }

        // Export sum and count
        const sum = this.sums.get(labelKey) || 0;
        const count = values.length;
        const baseLabelStr = labelKey ? `{${labelKey}}` : '';
        lines.push(`${this.name}_sum${baseLabelStr} ${sum}`);
        lines.push(`${this.name}_count${baseLabelStr} ${count}`);
      }
    }

    return lines.join('\n');
  }

  private labelKey(labels?: Labels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }

    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${this.escapeLabel(String(v))}"`)
      .join(',');
  }

  private escapeLabel(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/"/g, '\\"');
  }
}

/**
 * Metrics Registry - singleton pattern
 * Central registry for all application metrics
 */
export class MetricsRegistry {
  private static instance: MetricsRegistry;
  private metrics: Map<string, Counter | Gauge | Histogram | Summary> = new Map();

  private constructor() {
    // Initialize core Tallow metrics
    this.initializeTallowMetrics();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): MetricsRegistry {
    if (!MetricsRegistry.instance) {
      MetricsRegistry.instance = new MetricsRegistry();
    }
    return MetricsRegistry.instance;
  }

  /**
   * Register a metric
   */
  register(metric: Counter | Gauge | Histogram | Summary, name: string): void {
    if (this.metrics.has(name)) {
      throw new Error(`Metric ${name} already registered`);
    }
    this.metrics.set(name, metric);
  }

  /**
   * Get a metric by name
   */
  get(name: string): Counter | Gauge | Histogram | Summary | undefined {
    return this.metrics.get(name);
  }

  /**
   * Serialize all metrics to Prometheus text format
   */
  serialize(): string {
    const lines: string[] = [];

    for (const metric of this.metrics.values()) {
      lines.push(metric.serialize());
      lines.push(''); // Empty line between metrics
    }

    return lines.join('\n');
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Initialize default Tallow metrics
   */
  private initializeTallowMetrics(): void {
    // Transfer metrics
    this.register(
      new Counter(
        'tallow_transfers_total',
        'Total number of file transfers',
        ['status']
      ),
      'transfers_total'
    );

    this.register(
      new Counter(
        'tallow_transfer_bytes_total',
        'Total bytes transferred',
        ['direction']
      ),
      'transfer_bytes_total'
    );

    this.register(
      new Histogram(
        'tallow_transfer_duration_seconds',
        'File transfer duration in seconds',
        [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300, 600],
        ['status', 'method']
      ),
      'transfer_duration'
    );

    this.register(
      new Gauge(
        'tallow_active_connections',
        'Number of currently active peer connections',
        ['type']
      ),
      'active_connections'
    );

    // Peer connection metrics
    this.register(
      new Counter(
        'tallow_peer_connections_total',
        'Total peer connections established',
        ['type']
      ),
      'peer_connections'
    );

    // Encryption metrics
    this.register(
      new Counter(
        'tallow_encryption_operations_total',
        'Total cryptographic operations performed',
        ['algorithm', 'operation']
      ),
      'encryption_operations'
    );

    this.register(
      new Histogram(
        'tallow_encryption_duration_seconds',
        'Cryptographic operation duration in seconds',
        [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
        ['algorithm', 'operation']
      ),
      'encryption_duration'
    );

    // Discovery metrics
    this.register(
      new Gauge(
        'tallow_discovery_devices_found',
        'Number of devices discovered on network',
        []
      ),
      'discovery_devices'
    );

    // Room metrics
    this.register(
      new Gauge(
        'tallow_rooms_active',
        'Number of currently active transfer rooms',
        []
      ),
      'rooms_active'
    );

    this.register(
      new Counter(
        'tallow_rooms_total',
        'Total transfer rooms created',
        ['status']
      ),
      'rooms_total'
    );

    // Error metrics
    this.register(
      new Counter(
        'tallow_errors_total',
        'Total errors encountered',
        ['type', 'severity']
      ),
      'errors_total'
    );

    // WebRTC metrics
    this.register(
      new Counter(
        'tallow_webrtc_connections_total',
        'Total WebRTC connections attempted',
        ['status', 'connection_type']
      ),
      'webrtc_connections'
    );

    this.register(
      new Histogram(
        'tallow_webrtc_connection_time_seconds',
        'Time to establish WebRTC connection',
        [0.1, 0.5, 1, 2, 5, 10, 30],
        ['connection_type']
      ),
      'webrtc_connection_time'
    );

    // File size distribution
    this.register(
      new Histogram(
        'tallow_file_size_bytes',
        'Distribution of file sizes',
        [
          1024, // 1 KB
          10240, // 10 KB
          102400, // 100 KB
          1048576, // 1 MB
          10485760, // 10 MB
          104857600, // 100 MB
          1073741824, // 1 GB
          10737418240, // 10 GB
        ],
        ['file_type']
      ),
      'file_size'
    );

    // Network metrics
    this.register(
      new Histogram(
        'tallow_network_latency_seconds',
        'Network round-trip latency',
        [0.001, 0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2],
        ['peer_type']
      ),
      'network_latency'
    );

    // Metadata stripping
    this.register(
      new Counter(
        'tallow_metadata_stripped_total',
        'Total files with metadata stripped',
        ['file_type']
      ),
      'metadata_stripped'
    );

    // Memory usage
    this.register(
      new Gauge(
        'tallow_memory_usage_bytes',
        'Current memory usage in bytes',
        ['type']
      ),
      'memory_usage'
    );
  }
}

/**
 * Get the global metrics registry singleton
 */
export function getRegistry(): MetricsRegistry {
  return MetricsRegistry.getInstance();
}

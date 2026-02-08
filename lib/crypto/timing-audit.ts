/**
 * Timing Analysis & Audit Utilities
 * Agent 013 — TIMING-PHANTOM
 *
 * Tools for detecting timing side-channels in cryptographic operations.
 * Measures execution time variance across different inputs to detect
 * data-dependent branching.
 *
 * SECURITY: Timing attacks can leak secret key material by measuring
 * how long operations take with different inputs. These utilities help
 * verify that crypto operations are constant-time.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TimingMeasurement {
  /** Operation name */
  operation: string;
  /** Number of samples collected */
  sampleCount: number;
  /** Mean execution time in microseconds */
  meanTime: number;
  /** Standard deviation in microseconds */
  stdDev: number;
  /** Min execution time */
  minTime: number;
  /** Max execution time */
  maxTime: number;
  /** Coefficient of variation (stdDev / mean) */
  cv: number;
  /** Whether the operation appears constant-time */
  isConstantTime: boolean;
}

export interface TimingAuditResult {
  /** Timestamp of the audit */
  timestamp: number;
  /** All measurements taken */
  measurements: TimingMeasurement[];
  /** Overall pass/fail */
  passed: boolean;
  /** Summary of findings */
  summary: string;
}

export interface TimingTestConfig {
  /** Number of warmup iterations (discarded) */
  warmupIterations?: number;
  /** Number of measurement iterations */
  sampleIterations?: number;
  /** Maximum acceptable coefficient of variation (0.0-1.0) */
  maxCV?: number;
  /** Maximum acceptable time difference ratio between inputs */
  maxTimeDiffRatio?: number;
}

const DEFAULT_CONFIG: Required<TimingTestConfig> = {
  warmupIterations: 100,
  sampleIterations: 1000,
  maxCV: 0.15,
  maxTimeDiffRatio: 1.05,
};

// ============================================================================
// TIMING MEASUREMENT
// ============================================================================

/**
 * Measure execution time of an async operation over many samples.
 */
export async function measureTiming(
  operation: string,
  fn: () => void | Promise<void>,
  config: TimingTestConfig = {}
): Promise<TimingMeasurement> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const times: number[] = [];

  // Warmup phase (allows JIT compilation to stabilize)
  for (let i = 0; i < cfg.warmupIterations; i++) {
    await fn();
  }

  // Measurement phase
  for (let i = 0; i < cfg.sampleIterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push((end - start) * 1000); // Convert to microseconds
  }

  const meanTime = times.reduce((a, b) => a + b, 0) / times.length;
  const variance = times.reduce((a, b) => a + (b - meanTime) ** 2, 0) / times.length;
  const stdDev = Math.sqrt(variance);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const cv = meanTime > 0 ? stdDev / meanTime : 0;

  return {
    operation,
    sampleCount: times.length,
    meanTime,
    stdDev,
    minTime,
    maxTime,
    cv,
    isConstantTime: cv < cfg.maxCV,
  };
}

/**
 * Compare timing of an operation with two different inputs.
 * Both should take approximately the same time for constant-time operations.
 */
export async function compareInputTiming(
  operation: string,
  fnA: () => void | Promise<void>,
  fnB: () => void | Promise<void>,
  config: TimingTestConfig = {}
): Promise<{
  measurementA: TimingMeasurement;
  measurementB: TimingMeasurement;
  timeDiffRatio: number;
  isConstantTime: boolean;
}> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const measurementA = await measureTiming(`${operation} (input A)`, fnA, config);
  const measurementB = await measureTiming(`${operation} (input B)`, fnB, config);

  const ratio = Math.max(measurementA.meanTime, measurementB.meanTime) /
    Math.min(measurementA.meanTime, measurementB.meanTime);

  return {
    measurementA,
    measurementB,
    timeDiffRatio: ratio,
    isConstantTime: ratio < cfg.maxTimeDiffRatio &&
      measurementA.isConstantTime &&
      measurementB.isConstantTime,
  };
}

// ============================================================================
// AUDIT
// ============================================================================

/**
 * Run a timing audit across multiple operations.
 */
export async function runTimingAudit(
  tests: Array<{
    name: string;
    fn: () => void | Promise<void>;
  }>,
  config: TimingTestConfig = {}
): Promise<TimingAuditResult> {
  const measurements: TimingMeasurement[] = [];

  for (const test of tests) {
    const measurement = await measureTiming(test.name, test.fn, config);
    measurements.push(measurement);
  }

  const allPassed = measurements.every(m => m.isConstantTime);
  const failures = measurements.filter(m => !m.isConstantTime);

  const summary = allPassed
    ? `All ${measurements.length} operations appear constant-time.`
    : `${failures.length}/${measurements.length} operations show timing variance: ${failures.map(f => f.operation).join(', ')}`;

  return {
    timestamp: Date.now(),
    measurements,
    passed: allPassed,
    summary,
  };
}

/**
 * Assert that an operation is constant-time.
 * Throws if timing variance exceeds threshold.
 */
export async function assertConstantTime(
  operation: string,
  fn: () => void | Promise<void>,
  config: TimingTestConfig = {}
): Promise<void> {
  const measurement = await measureTiming(operation, fn, config);
  if (!measurement.isConstantTime) {
    throw new Error(
      `Timing leak detected in "${operation}": CV=${measurement.cv.toFixed(4)} ` +
      `(threshold: ${(config.maxCV ?? DEFAULT_CONFIG.maxCV).toFixed(4)}), ` +
      `mean=${measurement.meanTime.toFixed(2)}μs, stdDev=${measurement.stdDev.toFixed(2)}μs`
    );
  }
}

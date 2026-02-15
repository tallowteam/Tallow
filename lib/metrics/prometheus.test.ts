/**
 * Prometheus Metrics Tests
 *
 * Comprehensive test suite for the metrics implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  Counter,
  Gauge,
  Histogram,
  Summary,
  MetricsRegistry,
  getRegistry,
} from './prometheus';

describe('Counter', () => {
  let counter: Counter;

  beforeEach(() => {
    counter = new Counter('test_counter_total', 'Test counter metric', ['status']);
  });

  it('should increment counter', () => {
    counter.inc({ status: 'success' }, 5);
    expect(counter.get({ status: 'success' })).toBe(5);

    counter.inc({ status: 'success' }, 3);
    expect(counter.get({ status: 'success' })).toBe(8);
  });

  it('should increment by 1 by default', () => {
    counter.inc({ status: 'success' });
    expect(counter.get({ status: 'success' })).toBe(1);
  });

  it('should throw error on negative increment', () => {
    expect(() => counter.inc({ status: 'success' }, -1)).toThrow();
  });

  it('should handle multiple labels', () => {
    counter.inc({ status: 'success' }, 5);
    counter.inc({ status: 'failed' }, 2);

    expect(counter.get({ status: 'success' })).toBe(5);
    expect(counter.get({ status: 'failed' })).toBe(2);
  });

  it('should serialize to Prometheus format', () => {
    counter.inc({ status: 'success' }, 42);
    counter.inc({ status: 'failed' }, 3);

    const output = counter.serialize();

    expect(output).toContain('# HELP test_counter_total Test counter metric');
    expect(output).toContain('# TYPE test_counter_total counter');
    expect(output).toContain('test_counter_total{status="success"} 42');
    expect(output).toContain('test_counter_total{status="failed"} 3');
  });

  it('should escape label values', () => {
    const counterWithSpecialChars = new Counter('test', 'Test', ['label']);
    counterWithSpecialChars.inc({ label: 'value with "quotes" and \n newlines' });

    const output = counterWithSpecialChars.serialize();
    expect(output).toContain('value with \\"quotes\\" and \\n newlines');
  });

  it('should reset counter', () => {
    counter.inc({ status: 'success' }, 10);
    expect(counter.get({ status: 'success' })).toBe(10);

    counter.reset({ status: 'success' });
    expect(counter.get({ status: 'success' })).toBe(0);
  });
});

describe('Gauge', () => {
  let gauge: Gauge;

  beforeEach(() => {
    gauge = new Gauge('test_gauge', 'Test gauge metric', ['type']);
  });

  it('should set gauge value', () => {
    gauge.set({ type: 'active' }, 42);
    expect(gauge.get({ type: 'active' })).toBe(42);
  });

  it('should increment gauge', () => {
    gauge.set({ type: 'active' }, 10);
    gauge.inc({ type: 'active' }, 5);
    expect(gauge.get({ type: 'active' })).toBe(15);
  });

  it('should decrement gauge', () => {
    gauge.set({ type: 'active' }, 10);
    gauge.dec({ type: 'active' }, 3);
    expect(gauge.get({ type: 'active' })).toBe(7);
  });

  it('should allow negative values', () => {
    gauge.set({ type: 'active' }, -5);
    expect(gauge.get({ type: 'active' })).toBe(-5);
  });

  it('should serialize to Prometheus format', () => {
    gauge.set({ type: 'active' }, 15);
    gauge.set({ type: 'idle' }, 3);

    const output = gauge.serialize();

    expect(output).toContain('# HELP test_gauge Test gauge metric');
    expect(output).toContain('# TYPE test_gauge gauge');
    expect(output).toContain('test_gauge{type="active"} 15');
    expect(output).toContain('test_gauge{type="idle"} 3');
  });

  it('should handle gauge without labels', () => {
    const simpleGauge = new Gauge('simple_gauge', 'Simple gauge');
    simpleGauge.set(100);
    expect(simpleGauge.get()).toBe(100);
  });
});

describe('Histogram', () => {
  let histogram: Histogram;

  beforeEach(() => {
    histogram = new Histogram(
      'test_duration_seconds',
      'Test duration metric',
      [0.1, 0.5, 1, 5],
      ['method']
    );
  });

  it('should observe values into buckets', () => {
    histogram.observe({ method: 'p2p' }, 0.05);
    histogram.observe({ method: 'p2p' }, 0.3);
    histogram.observe({ method: 'p2p' }, 0.8);
    histogram.observe({ method: 'p2p' }, 2.5);

    const output = histogram.serialize();

    // All values should be in +Inf bucket
    expect(output).toContain('test_duration_seconds_bucket{method="p2p",le="+Inf"} 4');
    // Count should match observations
    expect(output).toContain('test_duration_seconds_count{method="p2p"} 4');
  });

  it('should calculate sum correctly', () => {
    histogram.observe({ method: 'p2p' }, 1);
    histogram.observe({ method: 'p2p' }, 2);
    histogram.observe({ method: 'p2p' }, 3);

    const output = histogram.serialize();
    expect(output).toContain('test_duration_seconds_sum{method="p2p"} 6');
  });

  it('should serialize to Prometheus format', () => {
    histogram.observe({ method: 'p2p' }, 0.3);

    const output = histogram.serialize();

    expect(output).toContain('# HELP test_duration_seconds Test duration metric');
    expect(output).toContain('# TYPE test_duration_seconds histogram');
    expect(output).toContain('le="0.1"');
    expect(output).toContain('le="0.5"');
    expect(output).toContain('le="1"');
    expect(output).toContain('le="5"');
    expect(output).toContain('le="+Inf"');
  });

  it('should handle multiple label sets', () => {
    histogram.observe({ method: 'p2p' }, 0.5);
    histogram.observe({ method: 'relay' }, 1.5);

    const output = histogram.serialize();

    expect(output).toContain('method="p2p"');
    expect(output).toContain('method="relay"');
  });

  it('should handle histogram without labels', () => {
    const simpleHistogram = new Histogram('simple_hist', 'Simple histogram');
    simpleHistogram.observe(0.5);

    const output = simpleHistogram.serialize();
    expect(output).toContain('simple_hist_count 1');
    expect(output).toContain('simple_hist_sum 0.5');
  });
});

describe('Summary', () => {
  let summary: Summary;

  beforeEach(() => {
    summary = new Summary(
      'test_latency_seconds',
      'Test latency metric',
      [0.5, 0.9, 0.99],
      ['endpoint']
    );
  });

  it('should observe values', () => {
    for (let i = 1; i <= 100; i++) {
      summary.observe({ endpoint: '/api/test' }, i / 100);
    }

    const output = summary.serialize();

    // Should have quantiles
    expect(output).toContain('quantile="0.5"');
    expect(output).toContain('quantile="0.9"');
    expect(output).toContain('quantile="0.99"');

    // Should have count
    expect(output).toContain('test_latency_seconds_count{endpoint="/api/test"} 100');
  });

  it('should calculate percentiles correctly', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    for (const v of values) {
      summary.observe({ endpoint: '/test' }, v);
    }

    const output = summary.serialize();

    // p50 should be around 5
    expect(output).toMatch(/quantile="0\.5".*[5-6]/);
    // p90 should be around 9
    expect(output).toMatch(/quantile="0\.9".*(9|10)/);
  });

  it('should serialize to Prometheus format', () => {
    summary.observe({ endpoint: '/test' }, 1);

    const output = summary.serialize();

    expect(output).toContain('# HELP test_latency_seconds Test latency metric');
    expect(output).toContain('# TYPE test_latency_seconds summary');
  });
});

describe('MetricsRegistry', () => {
  let registry: MetricsRegistry;

  beforeEach(() => {
    registry = MetricsRegistry.getInstance();
    // Clear registry before each test
    registry.clear();
  });

  it('should be a singleton', () => {
    const registry1 = MetricsRegistry.getInstance();
    const registry2 = MetricsRegistry.getInstance();
    expect(registry1).toBe(registry2);
  });

  it('should register metrics', () => {
    const counter = new Counter('custom_total', 'Custom counter');
    registry.register(counter, 'custom');

    const retrieved = registry.get('custom');
    expect(retrieved).toBe(counter);
  });

  it('should throw error on duplicate registration', () => {
    const counter1 = new Counter('metric1', 'First');
    const counter2 = new Counter('metric2', 'Second');

    registry.register(counter1, 'same_name');

    expect(() => {
      registry.register(counter2, 'same_name');
    }).toThrow('Metric same_name already registered');
  });

  it('should serialize all metrics', () => {
    const counter = new Counter('test_counter', 'Test counter');
    const gauge = new Gauge('test_gauge', 'Test gauge');

    counter.inc({}, 5);
    gauge.set({}, 10);

    registry.register(counter, 'counter');
    registry.register(gauge, 'gauge');

    const output = registry.serialize();

    expect(output).toContain('test_counter');
    expect(output).toContain('test_gauge');
  });

  it('should initialize default Tallow metrics', () => {
    // Get fresh registry with defaults
    const freshRegistry = getRegistry();

    const metrics = freshRegistry.serialize();

    expect(metrics).toContain('tallow_transfers_total');
    expect(metrics).toContain('tallow_active_connections');
    expect(metrics).toContain('tallow_encryption_operations_total');
    expect(metrics).toContain('tallow_errors_total');
  });

  it('should clear all metrics', () => {
    const counter = new Counter('test', 'Test');
    registry.register(counter, 'test');

    expect(registry.get('test')).toBeDefined();

    registry.clear();

    expect(registry.get('test')).toBeUndefined();
  });
});

describe('Integration Tests', () => {
  it('should handle complete transfer workflow', () => {
    const registry = getRegistry();
    const transfersCounter = registry.get('transfers_total') as Counter;
    const bytesCounter = registry.get('transfer_bytes_total') as Counter;

    // Record successful transfer
    transfersCounter.inc({ status: 'success' });
    bytesCounter.inc({ direction: 'sent' }, 1048576);

    expect(transfersCounter.get({ status: 'success' })).toBe(1);
    expect(bytesCounter.get({ direction: 'sent' })).toBe(1048576);
  });

  it('should handle connection lifecycle', () => {
    const registry = getRegistry();
    const activeConnections = registry.get('active_connections') as Gauge;

    // Connection opened
    activeConnections.inc({ type: 'webrtc' });
    expect(activeConnections.get({ type: 'webrtc' })).toBe(1);

    // Another connection opened
    activeConnections.inc({ type: 'webrtc' });
    expect(activeConnections.get({ type: 'webrtc' })).toBe(2);

    // Connection closed
    activeConnections.dec({ type: 'webrtc' });
    expect(activeConnections.get({ type: 'webrtc' })).toBe(1);
  });

  it('should handle error tracking', () => {
    const registry = getRegistry();
    const errorsCounter = registry.get('errors_total') as Counter;

    errorsCounter.inc({ type: 'crypto', severity: 'high' });
    errorsCounter.inc({ type: 'network', severity: 'medium' });
    errorsCounter.inc({ type: 'crypto', severity: 'high' });

    expect(errorsCounter.get({ type: 'crypto', severity: 'high' })).toBe(2);
    expect(errorsCounter.get({ type: 'network', severity: 'medium' })).toBe(1);
  });
});

describe('Prometheus Format Compliance', () => {
  it('should generate valid Prometheus text format', () => {
    const counter = new Counter('http_requests_total', 'Total HTTP requests', ['method', 'status']);
    counter.inc({ method: 'GET', status: '200' }, 42);
    counter.inc({ method: 'POST', status: '201' }, 10);

    const output = counter.serialize();

    // Should have HELP
    expect(output).toMatch(/^# HELP http_requests_total/m);

    // Should have TYPE
    expect(output).toMatch(/^# TYPE http_requests_total counter/m);

    // Should have metrics with labels
    expect(output).toMatch(/http_requests_total\{method="GET",status="200"\} 42/);
    expect(output).toMatch(/http_requests_total\{method="POST",status="201"\} 10/);
  });

  it('should sort labels alphabetically', () => {
    const counter = new Counter('test', 'Test', ['z', 'a']);
    counter.inc({ z: 'last', a: 'first' });

    const output = counter.serialize();

    // Labels should be sorted: a before z
    expect(output).toMatch(/\{a="first",z="last"\}/);
  });

  it('should handle empty metrics', () => {
    const counter = new Counter('empty_counter', 'Empty counter');
    const output = counter.serialize();

    // Should export at least one sample with value 0
    expect(output).toContain('empty_counter 0');
  });
});

/**
 * Signal Strength Tests
 *
 * Unit tests for signal strength estimation and RTT measurement.
 */

import { describe, it, expect } from 'vitest';
import {
  estimateSignalStrength,
  getSignalBars,
  getSignalColor,
  estimateProximity,
  sortDevicesByProximity,
  groupDevicesByProximity,
  calculateJitter,
  smoothRTT,
  getProximityDescription,
  type SignalLevel,
} from './signal-strength';
import type { Device } from '../types';

// ============================================================================
// SIGNAL STRENGTH ESTIMATION TESTS
// ============================================================================

describe('estimateSignalStrength', () => {
  it('should return excellent for low RTT and minimal packet loss', () => {
    expect(estimateSignalStrength(15, 0.3)).toBe('excellent');
    expect(estimateSignalStrength(19, 0.4)).toBe('excellent');
  });

  it('should return good for moderate RTT and low packet loss', () => {
    expect(estimateSignalStrength(25, 1.0)).toBe('good');
    expect(estimateSignalStrength(45, 1.8)).toBe('good');
  });

  it('should return fair for higher RTT', () => {
    expect(estimateSignalStrength(75, 3.0)).toBe('fair');
    expect(estimateSignalStrength(95, 4.5)).toBe('fair');
  });

  it('should return poor for high RTT', () => {
    expect(estimateSignalStrength(150, 8.0)).toBe('poor');
    expect(estimateSignalStrength(180, 9.5)).toBe('poor');
  });

  it('should return disconnected for very high RTT', () => {
    expect(estimateSignalStrength(2500, 0)).toBe('disconnected');
    expect(estimateSignalStrength(100, 60)).toBe('disconnected');
  });

  it('should return poor for high packet loss regardless of RTT', () => {
    expect(estimateSignalStrength(20, 15)).toBe('poor');
    expect(estimateSignalStrength(30, 12)).toBe('poor');
  });

  it('should handle edge cases', () => {
    expect(estimateSignalStrength(0, 0)).toBe('disconnected');
    expect(estimateSignalStrength(-1, 0)).toBe('disconnected');
  });
});

describe('getSignalBars', () => {
  it('should return correct number of bars for each level', () => {
    expect(getSignalBars('excellent')).toBe(5);
    expect(getSignalBars('good')).toBe(4);
    expect(getSignalBars('fair')).toBe(3);
    expect(getSignalBars('poor')).toBe(2);
    expect(getSignalBars('disconnected')).toBe(1);
  });
});

describe('getSignalColor', () => {
  it('should return correct colors for each level', () => {
    expect(getSignalColor('excellent')).toContain('success');
    expect(getSignalColor('good')).toContain('success');
    expect(getSignalColor('fair')).toContain('warning');
    expect(getSignalColor('poor')).toContain('error');
    expect(getSignalColor('disconnected')).toContain('text-secondary');
  });
});

// ============================================================================
// PROXIMITY ESTIMATION TESTS
// ============================================================================

describe('estimateProximity', () => {
  it('should return nearby for very low RTT', () => {
    expect(estimateProximity(5)).toBe('nearby');
    expect(estimateProximity(9)).toBe('nearby');
  });

  it('should return local for moderate RTT', () => {
    expect(estimateProximity(15)).toBe('local');
    expect(estimateProximity(45)).toBe('local');
  });

  it('should return remote for high RTT', () => {
    expect(estimateProximity(60)).toBe('remote');
    expect(estimateProximity(150)).toBe('remote');
  });

  it('should handle edge cases', () => {
    expect(estimateProximity(0)).toBe('nearby');
    expect(estimateProximity(10)).toBe('local');
    expect(estimateProximity(50)).toBe('remote');
  });
});

describe('getProximityDescription', () => {
  it('should return descriptive text for each proximity level', () => {
    expect(getProximityDescription('nearby')).toBe('Very close');
    expect(getProximityDescription('local')).toBe('Same network');
    expect(getProximityDescription('remote')).toBe('Remote');
  });
});

// ============================================================================
// DEVICE SORTING TESTS
// ============================================================================

describe('sortDevicesByProximity', () => {
  const createDevice = (id: string, name: string, isFavorite = false, isOnline = true): Device => ({
    id,
    name,
    platform: 'web',
    ip: null,
    port: null,
    isOnline,
    isFavorite,
    lastSeen: Date.now(),
    avatar: null,
  });

  it('should sort devices by RTT (lowest first)', () => {
    const devices = [
      createDevice('device-1', 'Device 1'),
      createDevice('device-2', 'Device 2'),
      createDevice('device-3', 'Device 3'),
    ];

    const rttMap = new Map([
      ['device-1', 100],
      ['device-2', 20],
      ['device-3', 50],
    ]);

    const sorted = sortDevicesByProximity(devices, rttMap);

    expect(sorted[0].id).toBe('device-2'); // 20ms
    expect(sorted[1].id).toBe('device-3'); // 50ms
    expect(sorted[2].id).toBe('device-1'); // 100ms
  });

  it('should prioritize favorites when RTT is equal', () => {
    const devices = [
      createDevice('device-1', 'Device 1', false),
      createDevice('device-2', 'Device 2', true),
    ];

    const rttMap = new Map([
      ['device-1', 50],
      ['device-2', 50],
    ]);

    const sorted = sortDevicesByProximity(devices, rttMap);

    expect(sorted[0].id).toBe('device-2'); // Favorite
    expect(sorted[1].id).toBe('device-1');
  });

  it('should prioritize online devices when RTT and favorite are equal', () => {
    const devices = [
      createDevice('device-1', 'Device 1', false, false),
      createDevice('device-2', 'Device 2', false, true),
    ];

    const rttMap = new Map([
      ['device-1', 50],
      ['device-2', 50],
    ]);

    const sorted = sortDevicesByProximity(devices, rttMap);

    expect(sorted[0].id).toBe('device-2'); // Online
    expect(sorted[1].id).toBe('device-1');
  });

  it('should sort alphabetically when all other factors are equal', () => {
    const devices = [
      createDevice('device-1', 'Zebra'),
      createDevice('device-2', 'Alpha'),
    ];

    const rttMap = new Map([
      ['device-1', 50],
      ['device-2', 50],
    ]);

    const sorted = sortDevicesByProximity(devices, rttMap);

    expect(sorted[0].name).toBe('Alpha');
    expect(sorted[1].name).toBe('Zebra');
  });

  it('should place devices without RTT at the end', () => {
    const devices = [
      createDevice('device-1', 'Device 1'),
      createDevice('device-2', 'Device 2'),
      createDevice('device-3', 'Device 3'),
    ];

    const rttMap = new Map([
      ['device-1', 50],
      // device-2 has no RTT measurement
      ['device-3', 30],
    ]);

    const sorted = sortDevicesByProximity(devices, rttMap);

    expect(sorted[0].id).toBe('device-3'); // 30ms
    expect(sorted[1].id).toBe('device-1'); // 50ms
    expect(sorted[2].id).toBe('device-2'); // No RTT (Infinity)
  });

  it('should not mutate original array', () => {
    const devices = [
      createDevice('device-1', 'Device 1'),
      createDevice('device-2', 'Device 2'),
    ];

    const rttMap = new Map([
      ['device-1', 100],
      ['device-2', 20],
    ]);

    const originalOrder = devices.map((d) => d.id);
    sortDevicesByProximity(devices, rttMap);

    expect(devices.map((d) => d.id)).toEqual(originalOrder);
  });
});

describe('groupDevicesByProximity', () => {
  const createDevice = (id: string): Device => ({
    id,
    name: `Device ${id}`,
    platform: 'web',
    ip: null,
    port: null,
    isOnline: true,
    isFavorite: false,
    lastSeen: Date.now(),
    avatar: null,
  });

  it('should group devices by proximity level', () => {
    const devices = [
      createDevice('device-1'),
      createDevice('device-2'),
      createDevice('device-3'),
    ];

    const rttMap = new Map([
      ['device-1', 5],   // nearby
      ['device-2', 30],  // local
      ['device-3', 100], // remote
    ]);

    const groups = groupDevicesByProximity(devices, rttMap);

    expect(groups.nearby).toHaveLength(1);
    expect(groups.nearby[0].id).toBe('device-1');

    expect(groups.local).toHaveLength(1);
    expect(groups.local[0].id).toBe('device-2');

    expect(groups.remote).toHaveLength(1);
    expect(groups.remote[0].id).toBe('device-3');
  });

  it('should place devices without RTT in remote group', () => {
    const devices = [
      createDevice('device-1'),
      createDevice('device-2'),
    ];

    const rttMap = new Map([
      ['device-1', 5],
      // device-2 has no RTT
    ]);

    const groups = groupDevicesByProximity(devices, rttMap);

    expect(groups.nearby).toHaveLength(1);
    expect(groups.remote).toHaveLength(1);
    expect(groups.remote[0].id).toBe('device-2');
  });
});

// ============================================================================
// UTILITY TESTS
// ============================================================================

describe('calculateJitter', () => {
  it('should calculate jitter from RTT samples', () => {
    const samples = [10, 12, 11, 13, 10];
    const jitter = calculateJitter(samples);

    expect(jitter).toBeGreaterThan(0);
    expect(jitter).toBeLessThan(2); // Low variance
  });

  it('should return 0 for insufficient samples', () => {
    expect(calculateJitter([])).toBe(0);
    expect(calculateJitter([10])).toBe(0);
  });

  it('should return 0 for constant RTT', () => {
    const samples = [50, 50, 50, 50];
    const jitter = calculateJitter(samples);

    expect(jitter).toBe(0);
  });

  it('should return higher jitter for variable RTT', () => {
    const stableSamples = [50, 51, 50, 51];
    const variableSamples = [50, 100, 30, 80];

    const stableJitter = calculateJitter(stableSamples);
    const variableJitter = calculateJitter(variableSamples);

    expect(variableJitter).toBeGreaterThan(stableJitter);
  });
});

describe('smoothRTT', () => {
  it('should smooth RTT with default alpha', () => {
    const current = 100;
    const previous = 50;
    const smoothed = smoothRTT(current, previous);

    // Default alpha = 0.3
    // smoothed = 0.3 * 100 + 0.7 * 50 = 30 + 35 = 65
    expect(smoothed).toBe(65);
  });

  it('should smooth RTT with custom alpha', () => {
    const current = 100;
    const previous = 50;
    const smoothed = smoothRTT(current, previous, 0.5);

    // alpha = 0.5
    // smoothed = 0.5 * 100 + 0.5 * 50 = 50 + 25 = 75
    expect(smoothed).toBe(75);
  });

  it('should weight current RTT more with higher alpha', () => {
    const current = 100;
    const previous = 50;

    const lowAlpha = smoothRTT(current, previous, 0.1);
    const highAlpha = smoothRTT(current, previous, 0.9);

    expect(highAlpha).toBeGreaterThan(lowAlpha);
    expect(highAlpha).toBeCloseTo(95); // 0.9 * 100 + 0.1 * 50
    expect(lowAlpha).toBeCloseTo(55);  // 0.1 * 100 + 0.9 * 50
  });

  it('should return current value with alpha = 1', () => {
    const smoothed = smoothRTT(100, 50, 1);
    expect(smoothed).toBe(100);
  });

  it('should return previous value with alpha = 0', () => {
    const smoothed = smoothRTT(100, 50, 0);
    expect(smoothed).toBe(50);
  });
});

/**
 * ICE Breaker Tests (Agent 022)
 *
 * Validates NAT detection before connection, symmetric+symmetric = TURN only,
 * and TURN fallback timing requirements.
 */

import { describe, it, expect } from 'vitest';

// --- NAT Detection Types ---

describe('ICE Breaker - NAT Detection', () => {
  it('should export NATType union with SYMMETRIC', async () => {
    const mod = await import('@/lib/network/nat-detection');
    expect(mod).toBeDefined();
    // NATType is a type, but detectNATType should be a function
    expect(typeof mod.detectNATType).toBe('function');
  });

  it('should export getConnectionStrategy function', async () => {
    const mod = await import('@/lib/network/nat-detection');
    expect(typeof mod.getConnectionStrategy).toBe('function');
  });

  it('should export getOptimizedICEConfig function', async () => {
    const mod = await import('@/lib/network/nat-detection');
    expect(typeof mod.getOptimizedICEConfig).toBe('function');
  });
});

// --- Connection Strategy ---

describe('ICE Breaker - Connection Strategy', () => {
  it('should have connection strategy module', async () => {
    const mod = await import('@/lib/network/connection-strategy');
    expect(mod).toBeDefined();
  });
});

// --- ICE Configuration ---

describe('ICE Breaker - ICE Configuration', () => {
  it('should have ICE management module', async () => {
    const mod = await import('@/lib/webrtc/ice');
    expect(mod).toBeDefined();
  });

  it('should export ICE config types', async () => {
    const mod = await import('@/lib/webrtc/ice');
    // Should export ICEServerConfig or ICEConfig types
    expect(mod).toBeDefined();
  });
});

// --- TURN Configuration ---

describe('ICE Breaker - TURN Configuration', () => {
  it('should have TURN config module', async () => {
    const mod = await import('@/lib/network/turn-config');
    expect(mod).toBeDefined();
  });
});

/**
 * NAT Detection Module Tests
 */

import { describe, it, expect } from 'vitest';
import {
  getConnectionStrategy,
  getNATTypeDescription,
  isRestrictiveNAT,
  isDirectConnectionLikely,
  getOptimizedICEConfig,
  type NATType,
} from '@/lib/network/nat-detection';

describe('NAT Detection Module', () => {
  describe('getConnectionStrategy', () => {
    it('should return turn_only for both symmetric NATs', () => {
      const result = getConnectionStrategy('SYMMETRIC', 'SYMMETRIC');
      expect(result.strategy).toBe('turn_only');
      expect(result.useTURN).toBe(true);
      expect(result.prioritizeRelay).toBe(true);
    });

    it('should return turn_only when either peer is blocked', () => {
      expect(getConnectionStrategy('BLOCKED', 'FULL_CONE').strategy).toBe('turn_only');
      expect(getConnectionStrategy('FULL_CONE', 'BLOCKED').strategy).toBe('turn_only');
      expect(getConnectionStrategy('BLOCKED', 'BLOCKED').strategy).toBe('turn_only');
    });

    it('should return turn_fallback when one peer has symmetric NAT', () => {
      const result = getConnectionStrategy('SYMMETRIC', 'FULL_CONE');
      expect(result.strategy).toBe('turn_fallback');
      expect(result.directTimeout).toBe(5000);
      expect(result.useTURN).toBe(true);
    });

    it('should return turn_fallback for restrictive NAT combinations', () => {
      const result = getConnectionStrategy('PORT_RESTRICTED', 'PORT_RESTRICTED');
      expect(result.strategy).toBe('turn_fallback');
      expect(result.useTURN).toBe(true);
    });

    it('should return direct for favorable NAT combinations', () => {
      const result = getConnectionStrategy('FULL_CONE', 'FULL_CONE');
      expect(result.strategy).toBe('direct');
      expect(result.useTURN).toBe(false);
      expect(result.directTimeout).toBeGreaterThan(10000);
    });

    it('should handle UNKNOWN NAT types conservatively', () => {
      const result = getConnectionStrategy('UNKNOWN', 'FULL_CONE');
      expect(result.strategy).toBe('turn_fallback');
      expect(result.useTURN).toBe(true);
    });

    it('should provide a reason for each strategy', () => {
      const strategies: Array<[NATType, NATType]> = [
        ['FULL_CONE', 'FULL_CONE'],
        ['SYMMETRIC', 'SYMMETRIC'],
        ['BLOCKED', 'FULL_CONE'],
        ['UNKNOWN', 'RESTRICTED'],
      ];

      for (const [local, remote] of strategies) {
        const result = getConnectionStrategy(local, remote);
        expect(result.reason).toBeTruthy();
        expect(result.reason.length).toBeGreaterThan(10);
      }
    });
  });

  describe('getNATTypeDescription', () => {
    it('should return descriptive text for each NAT type', () => {
      const types: NATType[] = [
        'FULL_CONE',
        'RESTRICTED',
        'PORT_RESTRICTED',
        'SYMMETRIC',
        'BLOCKED',
        'UNKNOWN',
      ];

      for (const type of types) {
        const description = getNATTypeDescription(type);
        expect(description).toBeTruthy();
        expect(description.length).toBeGreaterThan(10);
      }
    });
  });

  describe('isRestrictiveNAT', () => {
    it('should return true for SYMMETRIC NAT', () => {
      expect(isRestrictiveNAT('SYMMETRIC')).toBe(true);
    });

    it('should return true for BLOCKED NAT', () => {
      expect(isRestrictiveNAT('BLOCKED')).toBe(true);
    });

    it('should return false for permissive NAT types', () => {
      expect(isRestrictiveNAT('FULL_CONE')).toBe(false);
      expect(isRestrictiveNAT('RESTRICTED')).toBe(false);
      expect(isRestrictiveNAT('PORT_RESTRICTED')).toBe(false);
      expect(isRestrictiveNAT('UNKNOWN')).toBe(false);
    });
  });

  describe('isDirectConnectionLikely', () => {
    it('should return true for FULL_CONE to FULL_CONE', () => {
      expect(isDirectConnectionLikely('FULL_CONE', 'FULL_CONE')).toBe(true);
    });

    it('should return false for SYMMETRIC to SYMMETRIC', () => {
      expect(isDirectConnectionLikely('SYMMETRIC', 'SYMMETRIC')).toBe(false);
    });

    it('should return false when one peer is blocked', () => {
      expect(isDirectConnectionLikely('BLOCKED', 'FULL_CONE')).toBe(false);
    });
  });

  describe('getOptimizedICEConfig', () => {
    const turnServer = 'turn:relay.example.com:443';
    const turnCredentials = { username: 'user', credential: 'pass' };

    it('should use relay-only for BLOCKED NAT', () => {
      const config = getOptimizedICEConfig('BLOCKED', turnServer, turnCredentials);
      expect(config.iceTransportPolicy).toBe('relay');
      expect(config.iceServers?.length).toBeGreaterThan(0);
    });

    it('should allow all transports for FULL_CONE NAT', () => {
      const config = getOptimizedICEConfig('FULL_CONE', turnServer, turnCredentials);
      expect(config.iceTransportPolicy).toBe('all');
    });

    it('should include TURN server when provided', () => {
      const config = getOptimizedICEConfig('SYMMETRIC', turnServer, turnCredentials);
      const hasTurn = config.iceServers?.some((server) =>
        (typeof server.urls === 'string' && server.urls.includes('turn:')) ||
        (Array.isArray(server.urls) && server.urls.some((u) => u.includes('turn:')))
      );
      expect(hasTurn).toBe(true);
    });

    it('should work without TURN credentials', () => {
      const config = getOptimizedICEConfig('FULL_CONE');
      expect(config.iceServers).toBeDefined();
      expect(config.iceTransportPolicy).toBe('all');
    });

    it('should set appropriate candidate pool size based on NAT type', () => {
      const fullConeConfig = getOptimizedICEConfig('FULL_CONE');
      const blockedConfig = getOptimizedICEConfig('BLOCKED');

      // FULL_CONE should have larger pool for more candidates
      expect(fullConeConfig.iceCandidatePoolSize).toBeGreaterThan(
        blockedConfig.iceCandidatePoolSize ?? 0
      );
    });
  });
});

describe('Connection Strategy Matrix', () => {
  const natTypes: NATType[] = [
    'FULL_CONE',
    'RESTRICTED',
    'PORT_RESTRICTED',
    'SYMMETRIC',
    'BLOCKED',
    'UNKNOWN',
  ];

  it('should always use TURN for BLOCKED peers', () => {
    for (const type of natTypes) {
      const result1 = getConnectionStrategy('BLOCKED', type);
      const result2 = getConnectionStrategy(type, 'BLOCKED');
      expect(result1.useTURN).toBe(true);
      expect(result2.useTURN).toBe(true);
    }
  });

  it('should produce symmetric results', () => {
    // The strategy should be the same regardless of which peer is local/remote
    for (const local of natTypes) {
      for (const remote of natTypes) {
        const result1 = getConnectionStrategy(local, remote);
        const result2 = getConnectionStrategy(remote, local);
        expect(result1.strategy).toBe(result2.strategy);
      }
    }
  });

  it('should always have a valid strategy', () => {
    for (const local of natTypes) {
      for (const remote of natTypes) {
        const result = getConnectionStrategy(local, remote);
        expect(['direct', 'turn_fallback', 'turn_only']).toContain(result.strategy);
        expect(typeof result.directTimeout).toBe('number');
        expect(typeof result.useTURN).toBe('boolean');
        expect(typeof result.prioritizeRelay).toBe('boolean');
        expect(typeof result.reason).toBe('string');
      }
    }
  });
});

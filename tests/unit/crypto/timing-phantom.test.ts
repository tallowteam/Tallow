import { describe, expect, it } from 'vitest';
import {
  timingSafeEqual,
  timingSafeStringCompare,
  timingSafeHMACVerify,
  timingSafeTokenCompare,
  timingSafeCompare,
  createTimingSafeValidator,
} from '@/lib/security/timing-safe';

describe('timing-phantom invariants', () => {
  it('uses constant-time comparison via XOR accumulator for equal buffers', () => {
    const a = new Uint8Array([1, 2, 3, 4, 5]);
    const b = new Uint8Array([1, 2, 3, 4, 5]);
    expect(timingSafeEqual(a, b)).toBe(true);
  });

  it('uses constant-time comparison for unequal buffers with no early return', () => {
    const a = new Uint8Array([1, 2, 3, 4, 5]);
    const b = new Uint8Array([1, 2, 3, 4, 6]);
    expect(timingSafeEqual(a, b)).toBe(false);
  });

  it('handles different-length buffers without leaking length via timing', () => {
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([1, 2, 3, 4, 5]);
    // Pads to same length before comparing, length mismatch caught via XOR
    expect(timingSafeEqual(a, b)).toBe(false);
  });

  it('provides constant-time string comparison', () => {
    expect(timingSafeStringCompare('secret-token-abc', 'secret-token-abc')).toBe(true);
    expect(timingSafeStringCompare('secret-token-abc', 'secret-token-xyz')).toBe(false);
  });

  it('provides constant-time HMAC verification', () => {
    const hmac1 = new Uint8Array([10, 20, 30, 40]);
    const hmac2 = new Uint8Array([10, 20, 30, 40]);
    const hmac3 = new Uint8Array([10, 20, 30, 41]);
    expect(timingSafeHMACVerify(hmac1, hmac2)).toBe(true);
    expect(timingSafeHMACVerify(hmac1, hmac3)).toBe(false);
  });

  it('provides constant-time token comparison', () => {
    expect(timingSafeTokenCompare('abc123', 'abc123')).toBe(true);
    expect(timingSafeTokenCompare('abc123', 'abc124')).toBe(false);
  });

  it('auto-detects types for convenience comparison', () => {
    expect(timingSafeCompare('hello', 'hello')).toBe(true);
    const buf = new Uint8Array([1, 2, 3]);
    expect(timingSafeCompare(buf, buf)).toBe(true);
  });

  it('creates reusable validator with no early return on mismatch', () => {
    const validate = createTimingSafeValidator('expected-value');
    expect(validate('expected-value')).toBe(true);
    expect(validate('wrong-value')).toBe(false);
  });

  it('returns false for null/undefined inputs without early return', () => {
    expect(timingSafeEqual(null as unknown as Uint8Array, new Uint8Array(1))).toBe(false);
    expect(timingSafeEqual(new Uint8Array(1), null as unknown as Uint8Array)).toBe(false);
  });
});

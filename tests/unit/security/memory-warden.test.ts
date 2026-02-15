import { describe, expect, it } from 'vitest';
import {
  secureWipeBuffer,
  secureWipeString,
  secureWipeBuffers,
  secureWipeObject,
  SecureWrapper,
  createSecureWrapper,
  compareAndWipe,
  createAutoWipeCleanup,
} from '@/lib/security/memory-wiper';

describe('memory-warden invariants', () => {
  it('every secret has a destructor: secureWipeBuffer zeros the buffer', () => {
    const secret = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    secureWipeBuffer(secret);
    // After wipe, all bytes should be zero (final pass)
    expect(Array.from(secret).every((b) => b === 0)).toBe(true);
  });

  it('wipes multiple buffers at once', () => {
    const a = new Uint8Array([10, 20, 30]);
    const b = new Uint8Array([40, 50, 60]);
    secureWipeBuffers([a, b]);
    expect(Array.from(a).every((b) => b === 0)).toBe(true);
    expect(Array.from(b).every((b) => b === 0)).toBe(true);
  });

  it('wipes object containing Uint8Array fields recursively', () => {
    const obj: Record<string, unknown> = {
      key: new Uint8Array([1, 2, 3]),
      nested: { secret: new Uint8Array([4, 5, 6]) },
    };
    secureWipeObject(obj);
    expect(Array.from(obj.key as Uint8Array).every((b) => b === 0)).toBe(true);
  });

  it('SecureWrapper provides auto-dispose destructor pattern', () => {
    const data = new Uint8Array([99, 88, 77]);
    const wrapper = createSecureWrapper(data);

    expect(wrapper.data).toBe(data);
    expect(wrapper.isDisposed).toBe(false);

    wrapper.dispose();
    expect(wrapper.isDisposed).toBe(true);
    expect(() => wrapper.data).toThrow('disposed');
    // Data should be zeroed
    expect(Array.from(data).every((b) => b === 0)).toBe(true);
  });

  it('SecureWrapper.use() auto-disposes after async callback', async () => {
    const data = new Uint8Array([11, 22, 33]);
    const wrapper = new SecureWrapper(data);

    const result = await wrapper.use(async (d) => {
      expect(d.length).toBe(3);
      return 'done';
    });

    expect(result).toBe('done');
    expect(wrapper.isDisposed).toBe(true);
  });

  it('SecureWrapper.useSync() auto-disposes after sync callback', () => {
    const data = new Uint8Array([44, 55, 66]);
    const wrapper = new SecureWrapper(data);

    const result = wrapper.useSync((d) => d.length);
    expect(result).toBe(3);
    expect(wrapper.isDisposed).toBe(true);
  });

  it('compareAndWipe performs constant-time comparison and wipes both buffers', () => {
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([1, 2, 3]);
    expect(compareAndWipe(a, b)).toBe(true);
    // Both should be wiped
    expect(Array.from(a).every((b) => b === 0)).toBe(true);
    expect(Array.from(b).every((b) => b === 0)).toBe(true);
  });

  it('createAutoWipeCleanup returns a cleanup function (destructor)', () => {
    const data = new Uint8Array([7, 8, 9]);
    const cleanup = createAutoWipeCleanup(data);
    expect(typeof cleanup).toBe('function');
    cleanup();
    expect(Array.from(data).every((b) => b === 0)).toBe(true);
  });

  it('secureWipeString creates buffer copy and wipes it', () => {
    const result = secureWipeString('sensitive-password');
    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result).every((b) => b === 0)).toBe(true);
  });
});

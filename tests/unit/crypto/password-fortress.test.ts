import { describe, expect, it } from 'vitest';
import {
  PASSWORD_FORTRESS_ARGON2_MIN,
  PASSWORD_FORTRESS_PBKDF2_MIN_ITERATIONS,
  PAKE_PROTOCOL_ASSIGNMENT,
  enforceArgon2Minimums,
  enforceSaltMinimum,
  enforcePBKDF2Minimum,
  generateFortressSalt,
  resolvePAKEProtocol,
  enforcePAKEProtocol,
  verifyArgon2DefaultsCompliant,
  verifyPBKDF2DefaultsCompliant,
} from '@/lib/crypto/password';

describe('password-fortress invariants', () => {
  it('enforces Argon2id memory cost >= 64 MiB (65536 KiB)', () => {
    expect(PASSWORD_FORTRESS_ARGON2_MIN.memory).toBeGreaterThanOrEqual(65536);
  });

  it('enforces Argon2id timeCost >= 3', () => {
    expect(PASSWORD_FORTRESS_ARGON2_MIN.timeCost).toBeGreaterThanOrEqual(3);
  });

  it('enforces Argon2id parallelism >= 4', () => {
    expect(PASSWORD_FORTRESS_ARGON2_MIN.parallelism).toBeGreaterThanOrEqual(4);
  });

  it('enforces PBKDF2 iterations >= 600000', () => {
    expect(PASSWORD_FORTRESS_PBKDF2_MIN_ITERATIONS).toBeGreaterThanOrEqual(600000);
  });

  it('rejects Argon2id params below minimums', () => {
    expect(() =>
      enforceArgon2Minimums({ memory: 1024, iterations: 3, parallelism: 4, hashLength: 32 })
    ).toThrow('memory must be');
  });

  it('enforces salt length >= 16 bytes', () => {
    const shortSalt = new Uint8Array(8);
    expect(() => enforceSaltMinimum(shortSalt)).toThrow('Salt must be >= 16');

    const validSalt = new Uint8Array(16);
    expect(() => enforceSaltMinimum(validSalt)).not.toThrow();
  });

  it('rejects PBKDF2 iterations below 600K floor', () => {
    expect(() => enforcePBKDF2Minimum(100000)).toThrow('600000');
  });

  it('generates CSPRNG salt of at least 16 bytes', () => {
    const salt = generateFortressSalt();
    expect(salt).toBeInstanceOf(Uint8Array);
    expect(salt.length).toBeGreaterThanOrEqual(16);
    // Salt should not be all zeros (CSPRNG check)
    expect(Array.from(salt).some((b) => b !== 0)).toBe(true);
  });

  it('assigns PAKE protocol: CLI -> cpace, web -> opaque', () => {
    expect(PAKE_PROTOCOL_ASSIGNMENT.cli).toBe('cpace');
    expect(PAKE_PROTOCOL_ASSIGNMENT.web).toBe('opaque');
    expect(resolvePAKEProtocol('cli')).toBe('cpace');
    expect(resolvePAKEProtocol('web')).toBe('opaque');
  });

  it('enforces correct PAKE protocol per transport context', () => {
    expect(() => enforcePAKEProtocol('cli', 'cpace')).not.toThrow();
    expect(() => enforcePAKEProtocol('web', 'opaque')).not.toThrow();
    expect(() => enforcePAKEProtocol('cli', 'opaque')).toThrow();
    expect(() => enforcePAKEProtocol('web', 'cpace')).toThrow();
  });

  it('verifies Argon2 defaults are compliant', () => {
    expect(verifyArgon2DefaultsCompliant()).toBe(true);
  });

  it('verifies PBKDF2 defaults are compliant', () => {
    expect(verifyPBKDF2DefaultsCompliant()).toBe(true);
  });
});

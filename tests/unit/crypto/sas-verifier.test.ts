import { describe, expect, it, vi } from 'vitest';
import {
  generateSASCode,
  verifySASMatch,
  handleSASMismatch,
  SAS_MISMATCH_TERMINATION_DEADLINE_MS,
  SAS_MINIMUM_ENTROPY_BITS,
  SAS_EMOJI_SET,
  SAS_EMOJI_TABLE,
  SAS_WORD_LIST,
} from '@/lib/crypto/sas';

describe('sas-verifier invariants', () => {
  it('generates deterministic SAS from identical shared secrets', async () => {
    const secret = new Uint8Array(32);
    crypto.getRandomValues(secret);

    const sas1 = await generateSASCode(secret, 'test-session');
    const sas2 = await generateSASCode(secret, 'test-session');

    expect(sas1.emoji).toBe(sas2.emoji);
    expect(sas1.words).toBe(sas2.words);
    expect(sas1.numeric).toBe(sas2.numeric);
    expect(verifySASMatch(sas1, sas2)).toBe(true);
  });

  it('produces different SAS for different secrets', async () => {
    const secret1 = new Uint8Array(32);
    const secret2 = new Uint8Array(32);
    crypto.getRandomValues(secret1);
    crypto.getRandomValues(secret2);

    const sas1 = await generateSASCode(secret1);
    const sas2 = await generateSASCode(secret2);

    expect(verifySASMatch(sas1, sas2)).toBe(false);
  });

  it('uses constant-time comparison for SAS raw bytes', async () => {
    const secret = new Uint8Array(32);
    crypto.getRandomValues(secret);
    const sas = await generateSASCode(secret);

    // verifySASMatch uses XOR-based constant-time comparison
    const fakeSas = { ...sas, rawBytes: new Uint8Array(sas.rawBytes.length) };
    expect(verifySASMatch(sas, fakeSas)).toBe(false);
  });

  it('enforces minimum entropy of 36 bits', async () => {
    expect(SAS_MINIMUM_ENTROPY_BITS).toBeGreaterThanOrEqual(36);
    expect(SAS_EMOJI_SET.length).toBe(64); // log2(64) = 6 bits per emoji

    const secret = new Uint8Array(32);
    crypto.getRandomValues(secret);
    const sas = await generateSASCode(secret);
    expect(sas.entropyBits).toBeGreaterThanOrEqual(36);
    expect(sas.emojis.length).toBe(6); // 6 * 6 = 36 bits
  });

  it('provides Signal-compatible emoji table with labels', () => {
    expect(SAS_EMOJI_TABLE.length).toBe(64);
    SAS_EMOJI_TABLE.forEach(([emoji, label]) => {
      expect(emoji.length).toBeGreaterThan(0);
      expect(label.length).toBeGreaterThan(0);
    });
    // Verify SAS_EMOJI_SET is derived from table
    SAS_EMOJI_TABLE.forEach(([emoji], i) => {
      expect(SAS_EMOJI_SET[i]).toBe(emoji);
    });
  });

  it('generates emoji entries with accessibility labels', async () => {
    const secret = new Uint8Array(32);
    crypto.getRandomValues(secret);
    const sas = await generateSASCode(secret);

    expect(sas.emojiEntries).toHaveLength(6);
    sas.emojiEntries.forEach(entry => {
      expect(entry.emoji).toBeTruthy();
      expect(entry.label).toBeTruthy();
    });
  });

  it('generates 6-digit numeric fallback', async () => {
    const secret = new Uint8Array(32);
    crypto.getRandomValues(secret);
    const sas = await generateSASCode(secret);

    expect(sas.numeric).toMatch(/^\d{6}$/);
  });

  it('derives SAS via HKDF producing 32-byte raw output', async () => {
    const secret = new Uint8Array(32);
    crypto.getRandomValues(secret);
    const sas = await generateSASCode(secret);

    // HKDF-SHA-256 output should be exactly 32 bytes
    expect(sas.rawBytes).toHaveLength(32);
  });

  it('handles SAS mismatch with immediate termination and warning', async () => {
    const termFn = vi.fn();
    const report = await handleSASMismatch(termFn, 'peer-1', 'session-abc', 'emoji');

    expect(termFn).toHaveBeenCalledOnce();
    expect(report.reason).toBe('SAS_MISMATCH_DETECTED');
    expect(report.peerId).toBe('peer-1');
    expect(report.sessionId).toBe('session-abc');
    expect(typeof report.terminationLatencyMs).toBe('number');
    expect(typeof report.withinDeadline).toBe('boolean');
  });

  it('reports withinDeadline correctly for fast termination', async () => {
    const fastTermFn = vi.fn(); // sync, instant
    const report = await handleSASMismatch(fastTermFn, 'peer-1', 'session-abc', 'emoji');

    expect(report.withinDeadline).toBe(true);
    expect(report.terminationLatencyMs).toBeLessThanOrEqual(SAS_MISMATCH_TERMINATION_DEADLINE_MS);
  });

  it('sets termination deadline to 100ms', () => {
    expect(SAS_MISMATCH_TERMINATION_DEADLINE_MS).toBe(100);
  });

  it('has 256 words in the SAS word list', () => {
    expect(SAS_WORD_LIST.length).toBe(256);
  });
});

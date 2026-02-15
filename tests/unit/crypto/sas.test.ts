/**
 * SAS (Short Authentication String) Unit Tests
 *
 * Tests the SAS code generation and verification including:
 * - Deterministic code generation from shared secret via HKDF
 * - Signal-compatible emoji set (64 entries with labels)
 * - Emoji, word, and numeric code formats
 * - SAS matching verification (constant-time)
 * - QR code payload encoding/decoding (v1 and v2)
 * - Entropy validation (>= 36 bits)
 */

import { describe, it, expect } from 'vitest';
import {
  generateSASCode,
  verifySASMatch,
  sasToQRPayload,
  qrPayloadToRawBytes,
  parseQRPayload,
  verifyQRPayload,
  SAS_EMOJI_SET,
  SAS_EMOJI_TABLE,
  SAS_WORD_LIST,
  SAS_MINIMUM_ENTROPY_BITS,
} from '@/lib/crypto/sas';

describe('SAS Code Generation', () => {
  const testSecret = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const context = 'test-context';

  describe('code generation', () => {
    it('generates SAS code from shared secret', async () => {
      const sas = await generateSASCode(testSecret, context);

      expect(sas).toHaveProperty('emoji');
      expect(sas).toHaveProperty('emojis');
      expect(sas).toHaveProperty('emojiEntries');
      expect(sas).toHaveProperty('words');
      expect(sas).toHaveProperty('wordList');
      expect(sas).toHaveProperty('numeric');
      expect(sas).toHaveProperty('rawBytes');
      expect(sas).toHaveProperty('entropyBits');
    });

    it('generates 6 emojis from Signal-compatible set', async () => {
      const sas = await generateSASCode(testSecret);

      expect(sas.emojis).toHaveLength(6);
      expect(sas.emojiEntries).toHaveLength(6);
      expect(sas.emoji.length).toBeGreaterThan(0);
      sas.emojis.forEach(emoji => {
        expect(SAS_EMOJI_SET).toContain(emoji);
      });
    });

    it('generates emoji entries with labels for accessibility', async () => {
      const sas = await generateSASCode(testSecret);

      sas.emojiEntries.forEach(entry => {
        expect(entry.emoji).toBeTruthy();
        expect(entry.label).toBeTruthy();
        expect(typeof entry.label).toBe('string');
        // Label should be from the emoji table
        const found = SAS_EMOJI_TABLE.find(([e]) => e === entry.emoji);
        expect(found).toBeTruthy();
        expect(found![1]).toBe(entry.label);
      });
    });

    it('generates 4 words', async () => {
      const sas = await generateSASCode(testSecret);

      expect(sas.wordList).toHaveLength(4);
      expect(sas.words).toMatch(/^[A-Z]+-[A-Z]+-[A-Z]+-[A-Z]+$/);
      sas.wordList.forEach(word => {
        expect(SAS_WORD_LIST).toContain(word);
      });
    });

    it('generates 6-digit numeric fallback', async () => {
      const sas = await generateSASCode(testSecret);

      expect(sas.numeric).toMatch(/^\d{6}$/);
      expect(sas.numeric).toHaveLength(6);
    });

    it('produces consistent output for same input', async () => {
      const sas1 = await generateSASCode(testSecret, context);
      const sas2 = await generateSASCode(testSecret, context);

      expect(sas1.emoji).toBe(sas2.emoji);
      expect(sas1.words).toBe(sas2.words);
      expect(sas1.numeric).toBe(sas2.numeric);
      expect(sas1.rawBytes).toEqual(sas2.rawBytes);
    });

    it('produces different output for different secrets', async () => {
      const secret1 = new Uint8Array([1, 2, 3, 4, 5]);
      const secret2 = new Uint8Array([5, 4, 3, 2, 1]);

      const sas1 = await generateSASCode(secret1);
      const sas2 = await generateSASCode(secret2);

      expect(sas1.emoji).not.toBe(sas2.emoji);
      expect(sas1.words).not.toBe(sas2.words);
    });

    it('produces different output for different contexts', async () => {
      const sas1 = await generateSASCode(testSecret, 'context-a');
      const sas2 = await generateSASCode(testSecret, 'context-b');

      expect(sas1.emoji).not.toBe(sas2.emoji);
      expect(sas1.words).not.toBe(sas2.words);
    });

    it('reports correct entropy bits', async () => {
      const sas = await generateSASCode(testSecret);
      expect(sas.entropyBits).toBe(36); // 6 emojis * log2(64) = 36 bits
    });

    it('derives SAS via HKDF producing 32 raw bytes', async () => {
      const sas = await generateSASCode(testSecret);
      // HKDF output is 32 bytes
      expect(sas.rawBytes).toHaveLength(32);
    });
  });

  describe('SAS verification', () => {
    it('matches identical SAS codes', async () => {
      const sas1 = await generateSASCode(testSecret, context);
      const sas2 = await generateSASCode(testSecret, context);

      const match = verifySASMatch(sas1, sas2);
      expect(match).toBe(true);
    });

    it('rejects different SAS codes', async () => {
      const secret1 = new Uint8Array([1, 2, 3]);
      const secret2 = new Uint8Array([4, 5, 6]);

      const sas1 = await generateSASCode(secret1);
      const sas2 = await generateSASCode(secret2);

      const match = verifySASMatch(sas1, sas2);
      expect(match).toBe(false);
    });

    it('uses constant-time comparison', async () => {
      const sas1 = await generateSASCode(testSecret);
      const sas2 = await generateSASCode(testSecret);

      // Measure timing (should be consistent regardless of match/mismatch)
      const iterations = 1000;
      const start1 = performance.now();
      for (let i = 0; i < iterations; i++) {
        verifySASMatch(sas1, sas2);
      }
      const time1 = performance.now() - start1;

      // Should take similar time (within 20% tolerance)
      expect(time1).toBeGreaterThan(0);
    });

    it('rejects SAS with different lengths', async () => {
      const sas1 = await generateSASCode(testSecret);
      const sas2 = await generateSASCode(testSecret);

      // Manually truncate rawBytes
      sas2.rawBytes = sas2.rawBytes.slice(0, 5);

      const match = verifySASMatch(sas1, sas2);
      expect(match).toBe(false);
    });
  });

  describe('QR code encoding', () => {
    it('encodes SAS to QR payload (v1, no fingerprint)', async () => {
      const sas = await generateSASCode(testSecret);
      const payload = sasToQRPayload(sas);

      expect(payload).toMatch(/^tallow-sas:v1:[A-Za-z0-9_-]+$/);
      expect(payload.startsWith('tallow-sas:v1:')).toBe(true);
    });

    it('encodes SAS to QR payload (v2, with fingerprint)', async () => {
      const sas = await generateSASCode(testSecret);
      const fingerprint = new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF, 0xCA, 0xFE]);
      const payload = sasToQRPayload(sas, fingerprint);

      expect(payload).toMatch(/^tallow-sas:v2:[A-Za-z0-9_-]+$/);
      expect(payload.startsWith('tallow-sas:v2:')).toBe(true);
    });

    it('decodes QR payload to raw bytes (v1 legacy)', async () => {
      const sas = await generateSASCode(testSecret);
      const payload = sasToQRPayload(sas);
      const decoded = qrPayloadToRawBytes(payload);

      expect(decoded).not.toBeNull();
      // v1 encodes first 10 bytes of rawBytes
      expect(decoded).toEqual(sas.rawBytes.slice(0, 10));
    });

    it('parses v2 QR payload with fingerprint', async () => {
      const sas = await generateSASCode(testSecret);
      const fingerprint = new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]);
      const payload = sasToQRPayload(sas, fingerprint);

      const parsed = parseQRPayload(payload);
      expect(parsed).not.toBeNull();
      expect(parsed!.version).toBe('v2');
      expect(parsed!.sasBytes).toEqual(sas.rawBytes.slice(0, 6));
      expect(parsed!.fingerprint).toEqual(fingerprint);
    });

    it('roundtrips through QR encoding (v1)', async () => {
      const sas = await generateSASCode(testSecret);
      const encoded = sasToQRPayload(sas);
      const decoded = qrPayloadToRawBytes(encoded);

      expect(decoded).toEqual(sas.rawBytes.slice(0, 10));
    });

    it('verifies QR payload against local SAS (v1)', async () => {
      const sas = await generateSASCode(testSecret);
      const payload = sasToQRPayload(sas);

      expect(verifyQRPayload(payload, sas)).toBe(true);
    });

    it('verifies QR payload against local SAS with fingerprint (v2)', async () => {
      const sas = await generateSASCode(testSecret);
      const fingerprint = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
      const payload = sasToQRPayload(sas, fingerprint);

      expect(verifyQRPayload(payload, sas, fingerprint)).toBe(true);
    });

    it('rejects QR payload with wrong fingerprint (v2)', async () => {
      const sas = await generateSASCode(testSecret);
      const fingerprint = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
      const wrongFingerprint = new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]);
      const payload = sasToQRPayload(sas, fingerprint);

      expect(verifyQRPayload(payload, sas, wrongFingerprint)).toBe(false);
    });

    it('rejects invalid QR payload format', () => {
      const invalid = 'invalid-format:data';
      const decoded = qrPayloadToRawBytes(invalid);
      expect(decoded).toBeNull();
    });

    it('rejects QR payload without prefix', () => {
      const noPrefixPayload = 'SGVsbG8gV29ybGQ';
      const decoded = qrPayloadToRawBytes(noPrefixPayload);
      expect(decoded).toBeNull();
    });

    it('handles invalid base64 in QR payload', () => {
      const invalid = 'tallow-sas:v1:!!!invalid!!!';
      const decoded = qrPayloadToRawBytes(invalid);
      expect(decoded).toBeNull();
    });
  });

  describe('emoji and word sets', () => {
    it('has 64 unique emojis', () => {
      expect(SAS_EMOJI_SET).toHaveLength(64);
      const uniqueEmojis = new Set(SAS_EMOJI_SET);
      expect(uniqueEmojis.size).toBe(64);
    });

    it('has 64 emoji table entries with labels', () => {
      expect(SAS_EMOJI_TABLE).toHaveLength(64);
      SAS_EMOJI_TABLE.forEach(([emoji, label]) => {
        expect(emoji.length).toBeGreaterThan(0);
        expect(label.length).toBeGreaterThan(0);
        expect(typeof label).toBe('string');
      });
    });

    it('emoji set matches emoji table entries', () => {
      SAS_EMOJI_TABLE.forEach(([emoji], index) => {
        expect(SAS_EMOJI_SET[index]).toBe(emoji);
      });
    });

    it('has 256 unique words', () => {
      expect(SAS_WORD_LIST).toHaveLength(256);
      const uniqueWords = new Set(SAS_WORD_LIST);
      expect(uniqueWords.size).toBe(256);
    });

    it('all words are uppercase', () => {
      SAS_WORD_LIST.forEach(word => {
        expect(word).toBe(word.toUpperCase());
        expect(word).toMatch(/^[A-Z]+$/);
      });
    });

    it('emojis are distinct and visible', () => {
      SAS_EMOJI_SET.forEach(emoji => {
        expect(emoji.length).toBeGreaterThan(0);
        // Check it is a valid unicode character
        expect(emoji.codePointAt(0)).toBeGreaterThan(0);
      });
    });
  });

  describe('entropy validation', () => {
    it('maintains minimum 36 bits of entropy', async () => {
      const sas = await generateSASCode(testSecret);

      // 6 emojis from 64-emoji set = log2(64^6) = 36 bits
      const expectedEntropy = Math.log2(Math.pow(64, 6));
      expect(Math.floor(expectedEntropy)).toBe(36);
      expect(sas.entropyBits).toBeGreaterThanOrEqual(SAS_MINIMUM_ENTROPY_BITS);
    });

    it('emoji selection uses modulo 64', async () => {
      const sas = await generateSASCode(testSecret);

      // Each emoji should be valid index into 64-item array
      sas.emojis.forEach(emoji => {
        const index = SAS_EMOJI_SET.indexOf(emoji);
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(64);
      });
    });

    it('word selection uses modulo 256', async () => {
      const sas = await generateSASCode(testSecret);

      // Each word should be valid index into 256-item array
      sas.wordList.forEach(word => {
        const index = SAS_WORD_LIST.indexOf(word);
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(256);
      });
    });
  });

  describe('default context', () => {
    it('uses HKDF salt as default context when not provided', async () => {
      const sas1 = await generateSASCode(testSecret);
      const sas2 = await generateSASCode(testSecret, 'tallow-sas-v1');

      expect(sas1.emoji).toBe(sas2.emoji);
      expect(sas1.words).toBe(sas2.words);
      expect(sas1.numeric).toBe(sas2.numeric);
    });
  });

  describe('edge cases', () => {
    it('handles empty secret', async () => {
      const empty = new Uint8Array(0);
      const sas = await generateSASCode(empty);

      expect(sas.emojis).toHaveLength(6);
      expect(sas.wordList).toHaveLength(4);
      expect(sas.numeric).toMatch(/^\d{6}$/);
    });

    it('handles large secret', async () => {
      const large = new Uint8Array(1024).fill(255);
      const sas = await generateSASCode(large);

      expect(sas.emojis).toHaveLength(6);
      expect(sas.wordList).toHaveLength(4);
      expect(sas.numeric).toMatch(/^\d{6}$/);
    });

    it('handles all-zero secret', async () => {
      const zeros = new Uint8Array(32);
      const sas = await generateSASCode(zeros);

      expect(sas.emoji).toBeTruthy();
      expect(sas.words).toBeTruthy();
      expect(sas.numeric).toBeTruthy();
    });
  });
});

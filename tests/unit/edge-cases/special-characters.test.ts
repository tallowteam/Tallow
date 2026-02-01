/**
 * Special Characters and Unicode Edge Case Tests
 * Tests handling of non-ASCII characters in filenames and content
 */

import { describe, it, expect, vi } from 'vitest';
import { encryptFile, decryptFile } from '@/lib/crypto/file-encryption-pqc';
import { encryptFileWithPassword, decryptFileWithPassword } from '@/lib/crypto/password-file-encryption';
import { pqCrypto } from '@/lib/crypto/pqc-crypto';

// Mock dependencies
vi.mock('@/lib/monitoring/sentry', () => ({
  captureException: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

vi.mock('@/lib/security/memory-wiper', () => ({
  secureWipeBuffer: vi.fn(),
}));

describe('Special Characters and Unicode', () => {
  describe('Unicode Filenames', () => {
    const unicodeFilenames = [
      { name: '文档.txt', description: 'Chinese characters' },
      { name: 'документ.pdf', description: 'Russian Cyrillic' },
      { name: 'مستند.docx', description: 'Arabic' },
      { name: 'दस्तावेज़.txt', description: 'Hindi Devanagari' },
      { name: 'ファイル.zip', description: 'Japanese Katakana' },
      { name: '파일.txt', description: 'Korean Hangul' },
      { name: 'αρχείο.txt', description: 'Greek' },
      { name: 'קובץ.txt', description: 'Hebrew' },
      { name: 'tệp.txt', description: 'Vietnamese' },
      { name: 'dosya.txt', description: 'Turkish' },
    ];

    for (const { name, description } of unicodeFilenames) {
      it(`should handle ${description} filename: ${name}`, async () => {
        const file = new File(['content'], name, { type: 'text/plain' });
        const key = crypto.getRandomValues(new Uint8Array(32));

        const encrypted = await encryptFile(file, key);
        const decryptedName = await decryptFile(encrypted, key, true);

        expect(decryptedName).toBe(name);
      });
    }

    it('should handle emoji in filename', async () => {
      const filename = 'file-🔒-secure-🚀-fast.txt';
      const file = new File(['content'], filename, { type: 'text/plain' });
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await encryptFile(file, key);
      const decryptedName = await decryptFile(encrypted, key, true);

      expect(decryptedName).toBe(filename);
    });

    it('should handle mixed scripts in filename', async () => {
      const filename = 'File-文档-Документ-🌍.txt';
      const file = new File(['content'], filename, { type: 'text/plain' });
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await encryptFile(file, key);
      const decryptedName = await decryptFile(encrypted, key, true);

      expect(decryptedName).toBe(filename);
    });

    it('should handle RTL (right-to-left) text in filename', async () => {
      const filename = 'ملف-مهم.txt'; // Arabic
      const file = new File(['content'], filename, { type: 'text/plain' });
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await encryptFile(file, key);
      const decryptedName = await decryptFile(encrypted, key, true);

      expect(decryptedName).toBe(filename);
    });

    it('should handle zero-width characters', async () => {
      const filename = 'file\u200Bwith\u200Bzero\u200Bwidth.txt';
      const file = new File(['content'], filename, { type: 'text/plain' });
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await encryptFile(file, key);
      const decryptedName = await decryptFile(encrypted, key, true);

      expect(decryptedName).toBe(filename);
    });
  });

  describe('Special Characters in Filenames', () => {
    const specialFilenames = [
      'file (copy).txt',
      'file [1].txt',
      'file {backup}.txt',
      'file-name_with-symbols.txt',
      'file.multiple.dots.txt',
      'file!@#$%^&*().txt',
      'file with spaces.txt',
      'file\twith\ttabs.txt',
      'file\'with\'quotes.txt',
      'file"with"double-quotes.txt',
      'file+plus+signs.txt',
      'file=equals=signs.txt',
      'file~tilde~marks.txt',
      'file`backtick`marks.txt',
    ];

    for (const filename of specialFilenames) {
      it(`should handle filename: ${filename}`, async () => {
        const file = new File(['content'], filename, { type: 'text/plain' });
        const key = crypto.getRandomValues(new Uint8Array(32));

        const encrypted = await encryptFile(file, key);
        const decryptedName = await decryptFile(encrypted, key, true);

        expect(decryptedName).toBe(filename);
      });
    }

    it('should handle filename with trailing dot', async () => {
      const filename = 'file.';
      const file = new File(['content'], filename, { type: 'text/plain' });
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await encryptFile(file, key);
      const decryptedName = await decryptFile(encrypted, key, true);

      expect(decryptedName).toBe(filename);
    });

    it('should handle filename starting with dot (hidden file)', async () => {
      const filename = '.hidden-file';
      const file = new File(['content'], filename, { type: 'text/plain' });
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await encryptFile(file, key);
      const decryptedName = await decryptFile(encrypted, key, true);

      expect(decryptedName).toBe(filename);
    });
  });

  describe('Unicode Content', () => {
    it('should preserve Chinese text content', async () => {
      const content = '这是一个测试文件。';
      const file = new File([content], 'test.txt', { type: 'text/plain' });
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await encryptFile(file, key);
      const decrypted = await decryptFile(encrypted, key);

      const decryptedText = await decrypted.text();
      expect(decryptedText).toBe(content);
    });

    it('should preserve Arabic text content', async () => {
      const content = 'هذا ملف اختبار.';
      const file = new File([content], 'test.txt', { type: 'text/plain' });
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await encryptFile(file, key);
      const decrypted = await decryptFile(encrypted, key);

      const decryptedText = await decrypted.text();
      expect(decryptedText).toBe(content);
    });

    it('should preserve emoji in content', async () => {
      const content = 'Hello 👋 World 🌍! Testing 🧪 encryption 🔒';
      const file = new File([content], 'test.txt', { type: 'text/plain' });
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await encryptFile(file, key);
      const decrypted = await decryptFile(encrypted, key);

      const decryptedText = await decrypted.text();
      expect(decryptedText).toBe(content);
    });

    it('should preserve mixed script content', async () => {
      const content = 'English, 中文, Русский, العربية, 日本語';
      const file = new File([content], 'test.txt', { type: 'text/plain' });
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await encryptFile(file, key);
      const decrypted = await decryptFile(encrypted, key);

      const decryptedText = await decrypted.text();
      expect(decryptedText).toBe(content);
    });

    it('should preserve complex emoji sequences', async () => {
      const content = '👨‍👩‍👧‍👦 👨‍💻 🏳️‍🌈 🏴󠁧󠁢󠁥󠁮󠁧󠁿'; // Family, programmer, flags
      const file = new File([content], 'test.txt', { type: 'text/plain' });
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await encryptFile(file, key);
      const decrypted = await decryptFile(encrypted, key);

      const decryptedText = await decrypted.text();
      expect(decryptedText).toBe(content);
    });

    it('should preserve zero-width joiner sequences', async () => {
      const content = 'Test\u200Dwith\u200DZWJ';
      const file = new File([content], 'test.txt', { type: 'text/plain' });
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await encryptFile(file, key);
      const decrypted = await decryptFile(encrypted, key);

      const decryptedText = await decrypted.text();
      expect(decryptedText).toBe(content);
    });
  });

  describe('Unicode Passwords', () => {
    it('should support Chinese password', async () => {
      const password = '密码123';
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const encrypted = await encryptFileWithPassword(file, password);
      const decrypted = await decryptFileWithPassword(encrypted, password);

      expect(decrypted).toBeDefined();
    });

    it('should support Arabic password', async () => {
      const password = 'كلمةالسر123';
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const encrypted = await encryptFileWithPassword(file, password);
      const decrypted = await decryptFileWithPassword(encrypted, password);

      expect(decrypted).toBeDefined();
    });

    it('should support emoji password', async () => {
      const password = '🔒secure🔑password🛡️';
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const encrypted = await encryptFileWithPassword(file, password);
      const decrypted = await decryptFileWithPassword(encrypted, password);

      expect(decrypted).toBeDefined();
    });

    it('should distinguish similar-looking passwords', async () => {
      const password1 = 'password'; // Latin
      const password2 = 'pаsswоrd'; // Cyrillic а and о
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const encrypted = await encryptFileWithPassword(file, password1);

      // Different password should fail
      await expect(
        decryptFileWithPassword(encrypted, password2)
      ).rejects.toThrow();
    });

    it('should handle combining diacriticals in password', async () => {
      const password = 'café'; // é as combining character
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const encrypted = await encryptFileWithPassword(file, password);
      const decrypted = await decryptFileWithPassword(encrypted, password);

      expect(decrypted).toBeDefined();
    });
  });

  describe('Control Characters', () => {
    it('should handle newline in content', async () => {
      const content = 'Line 1\nLine 2\nLine 3';
      const file = new File([content], 'test.txt', { type: 'text/plain' });
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await encryptFile(file, key);
      const decrypted = await decryptFile(encrypted, key);

      const decryptedText = await decrypted.text();
      expect(decryptedText).toBe(content);
    });

    it('should handle carriage return in content', async () => {
      const content = 'Line 1\r\nLine 2\r\nLine 3';
      const file = new File([content], 'test.txt', { type: 'text/plain' });
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await encryptFile(file, key);
      const decrypted = await decryptFile(encrypted, key);

      const decryptedText = await decrypted.text();
      expect(decryptedText).toBe(content);
    });

    it('should handle tab characters', async () => {
      const content = 'Column1\tColumn2\tColumn3';
      const file = new File([content], 'test.txt', { type: 'text/plain' });
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await encryptFile(file, key);
      const decrypted = await decryptFile(encrypted, key);

      const decryptedText = await decrypted.text();
      expect(decryptedText).toBe(content);
    });

    it('should handle null bytes in binary content', async () => {
      const content = new Uint8Array([0x48, 0x00, 0x65, 0x00, 0x6c, 0x00]);
      const file = new File([content], 'test.bin', {
        type: 'application/octet-stream',
      });
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await encryptFile(file, key);
      const decrypted = await decryptFile(encrypted, key);

      const buffer = await decrypted.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      expect(bytes).toEqual(content);
    });
  });

  describe('Edge Case Combinations', () => {
    it('should handle Unicode filename with Unicode content', async () => {
      const filename = '测试文档-📄.txt';
      const content = '这是测试内容 🧪';
      const file = new File([content], filename, { type: 'text/plain' });
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await encryptFile(file, key);
      const decryptedName = await decryptFile(encrypted, key, true);
      const decryptedContent = await decryptFile(encrypted, key);

      expect(decryptedName).toBe(filename);

      const text = await decryptedContent.text();
      expect(text).toBe(content);
    });

    it('should handle very long Unicode filename', async () => {
      const filename = '文'.repeat(100) + '.txt'; // 100 Chinese characters
      const file = new File(['content'], filename, { type: 'text/plain' });
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await encryptFile(file, key);
      const decryptedName = await decryptFile(encrypted, key, true);

      expect(decryptedName).toBe(filename);
    });

    it('should handle Unicode password with Unicode hint', async () => {
      const password = '密码123';
      const hint = '你的密码提示';
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const encrypted = await encryptFileWithPassword(file, password, hint);

      expect(encrypted.passwordProtection?.hint).toBe(hint);

      const decrypted = await decryptFileWithPassword(encrypted, password);
      expect(decrypted).toBeDefined();
    });
  });

  describe('Normalization', () => {
    it('should distinguish between composed and decomposed characters', async () => {
      const composed = 'é'; // Single character U+00E9
      const decomposed = 'é'; // e + combining acute U+0065 U+0301

      expect(composed).not.toBe(decomposed); // Different binary representation

      const key = crypto.getRandomValues(new Uint8Array(32));

      const file1 = new File([composed], composed, { type: 'text/plain' });
      const file2 = new File([decomposed], decomposed, {
        type: 'text/plain',
      });

      const encrypted1 = await encryptFile(file1, key);
      const encrypted2 = await encryptFile(file2, key);

      // Should preserve exact representation
      const decryptedName1 = await decryptFile(encrypted1, key, true);
      const decryptedName2 = await decryptFile(encrypted2, key, true);

      expect(decryptedName1).toBe(composed);
      expect(decryptedName2).toBe(decomposed);
    });
  });

  describe('Performance with Unicode', () => {
    it('should handle Unicode efficiently', async () => {
      const content = '测试内容'.repeat(1000); // 4000 Chinese characters
      const file = new File([content], 'test.txt', { type: 'text/plain' });
      const key = crypto.getRandomValues(new Uint8Array(32));

      const start = Date.now();
      const encrypted = await encryptFile(file, key);
      await decryptFile(encrypted, key);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000);
    });
  });
});

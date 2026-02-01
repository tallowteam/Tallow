import { describe, it, expect, beforeEach } from 'vitest';
import {
  secureDeleteBuffer,
  secureDeleteFile,
  secureDeleteBuffers,
  secureDeleteLocalStorage,
  secureDeleteLocalStorageKeys,
  secureDeleteLocalStoragePrefix,
  SecureDeletionManager,
  type DeletionMode,
} from '@/lib/privacy/secure-deletion';

describe('Secure Deletion', () => {
  describe('Buffer Deletion', () => {
    it('should delete buffer with quick mode (1 pass)', () => {
      const buffer = new Uint8Array(100).fill(0xFF);
      const result = secureDeleteBuffer(buffer, { mode: 'quick', verify: true });

      expect(result.success).toBe(true);
      expect(result.mode).toBe('quick');
      expect(result.passes).toBe(1);
      expect(result.bytesWiped).toBe(100);
      expect(result.verified).toBe(true);

      // Buffer should be all zeros after deletion
      expect(buffer.every(b => b === 0)).toBe(true);
    });

    it('should delete buffer with standard mode (DoD 3-pass)', () => {
      const buffer = new Uint8Array(100).fill(0xFF);
      const result = secureDeleteBuffer(buffer, { mode: 'standard', verify: true });

      expect(result.success).toBe(true);
      expect(result.mode).toBe('standard');
      expect(result.passes).toBe(3);
      expect(result.bytesWiped).toBe(100);
      expect(result.verified).toBe(true);

      // Buffer should be all zeros after deletion
      expect(buffer.every(b => b === 0)).toBe(true);
    });

    it('should delete buffer with paranoid mode (7-pass)', () => {
      const buffer = new Uint8Array(100).fill(0xFF);
      const result = secureDeleteBuffer(buffer, { mode: 'paranoid', verify: true });

      expect(result.success).toBe(true);
      expect(result.mode).toBe('paranoid');
      expect(result.passes).toBe(7);
      expect(result.bytesWiped).toBe(100);
      expect(result.verified).toBe(true);

      // Buffer should be all zeros after deletion
      expect(buffer.every(b => b === 0)).toBe(true);
    });

    it('should handle empty buffer gracefully', () => {
      const buffer = new Uint8Array(0);
      const result = secureDeleteBuffer(buffer, { mode: 'standard' });

      expect(result.success).toBe(false);
      expect(result.bytesWiped).toBe(0);
    });

    it('should report progress during deletion', () => {
      const buffer = new Uint8Array(1000).fill(0xFF);
      const progressUpdates: number[] = [];

      secureDeleteBuffer(buffer, {
        mode: 'standard',
        onProgress: (percent) => progressUpdates.push(percent),
      });

      // Should have progress updates
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
    });

    it('should delete large buffers (>65KB)', () => {
      const largeBuffer = new Uint8Array(100000).fill(0xAA);
      const result = secureDeleteBuffer(largeBuffer, { mode: 'quick', verify: true });

      expect(result.success).toBe(true);
      expect(result.bytesWiped).toBe(100000);
      expect(largeBuffer.every(b => b === 0)).toBe(true);
    });
  });

  describe('File Deletion', () => {
    it('should delete file data', async () => {
      const fileData = new Uint8Array([1, 2, 3, 4, 5]);
      const file = new File([fileData], 'test.txt', { type: 'text/plain' });

      const result = await secureDeleteFile(file, { mode: 'standard', verify: true });

      expect(result.success).toBe(true);
      expect(result.bytesWiped).toBe(5);
      expect(result.mode).toBe('standard');
    });

    it('should handle empty file', async () => {
      const file = new File([], 'empty.txt', { type: 'text/plain' });
      const result = await secureDeleteFile(file, { mode: 'standard' });

      expect(result.success).toBe(false);
      expect(result.bytesWiped).toBe(0);
    });
  });

  describe('Multiple Buffer Deletion', () => {
    it('should delete multiple buffers', () => {
      const buffers = [
        new Uint8Array(100).fill(0xFF),
        new Uint8Array(200).fill(0xAA),
        new Uint8Array(150).fill(0x55),
      ];

      const results = secureDeleteBuffers(buffers, { mode: 'quick' });

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(results[0]!.bytesWiped).toBe(100);
      expect(results[1]!.bytesWiped).toBe(200);
      expect(results[2]!.bytesWiped).toBe(150);

      // All buffers should be zeroed
      expect(buffers[0]!.every(b => b === 0)).toBe(true);
      expect(buffers[1]!.every(b => b === 0)).toBe(true);
      expect(buffers[2]!.every(b => b === 0)).toBe(true);
    });

    it('should report total progress for multiple buffers', () => {
      const buffers = [
        new Uint8Array(100),
        new Uint8Array(100),
        new Uint8Array(100),
      ];

      const progressUpdates: number[] = [];

      secureDeleteBuffers(buffers, {
        mode: 'quick',
        onProgress: (percent) => progressUpdates.push(percent),
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
    });
  });

  describe('localStorage Deletion', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
    });

    it('should securely delete localStorage entry', () => {
      const key = 'test-key';
      const sensitiveData = 'secret-password-123';
      localStorage.setItem(key, sensitiveData);

      const result = secureDeleteLocalStorage(key, { mode: 'standard' });

      expect(result.success).toBe(true);
      expect(result.passes).toBe(3);
      expect(result.verified).toBe(true);
      expect(localStorage.getItem(key)).toBeNull();
    });

    it('should handle non-existent key gracefully', () => {
      const result = secureDeleteLocalStorage('nonexistent-key', { mode: 'quick' });

      expect(result.success).toBe(true);
      expect(result.bytesWiped).toBe(0);
    });

    it('should delete multiple localStorage keys', () => {
      localStorage.setItem('key1', 'data1');
      localStorage.setItem('key2', 'data2');
      localStorage.setItem('key3', 'data3');

      const results = secureDeleteLocalStorageKeys(['key1', 'key2', 'key3'], { mode: 'quick' });

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(localStorage.getItem('key1')).toBeNull();
      expect(localStorage.getItem('key2')).toBeNull();
      expect(localStorage.getItem('key3')).toBeNull();
    });

    it('should delete all keys with specific prefix', () => {
      localStorage.setItem('temp_file_1', 'data1');
      localStorage.setItem('temp_file_2', 'data2');
      localStorage.setItem('temp_file_3', 'data3');
      localStorage.setItem('other_key', 'keep-this');

      const results = secureDeleteLocalStoragePrefix('temp_file_', { mode: 'quick' });

      expect(results).toHaveLength(3);
      expect(localStorage.getItem('temp_file_1')).toBeNull();
      expect(localStorage.getItem('temp_file_2')).toBeNull();
      expect(localStorage.getItem('temp_file_3')).toBeNull();
      expect(localStorage.getItem('other_key')).toBe('keep-this');
    });
  });

  describe('Secure Deletion Manager', () => {
    it('should delete multiple items with progress tracking', async () => {
      const buffer1 = new Uint8Array(100).fill(0xFF);
      const buffer2 = new Uint8Array(200).fill(0xAA);

      const progressUpdates: number[] = [];
      const manager = new SecureDeletionManager((percent) => {
        progressUpdates.push(percent);
      });

      const results = await manager.deleteMultiple([buffer1, buffer2], { mode: 'quick' });

      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBeCloseTo(100, 0);
    });

    it('should delete mixed types (buffers, files, localStorage)', async () => {
      localStorage.setItem('test-key', 'test-data');

      const buffer = new Uint8Array(100).fill(0xFF);
      const file = new File([new Uint8Array([1, 2, 3])], 'test.txt');

      const manager = new SecureDeletionManager();
      const results = await manager.deleteMultiple(
        [
          buffer,
          file,
          { type: 'localStorage', key: 'test-key' },
        ],
        { mode: 'quick' }
      );

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(localStorage.getItem('test-key')).toBeNull();
    });
  });

  describe('Deletion Modes', () => {
    it('should use different pass counts for different modes', () => {
      const modes: DeletionMode[] = ['quick', 'standard', 'paranoid'];
      const expectedPasses = [1, 3, 7];

      for (let i = 0; i < modes.length; i++) {
        const buffer = new Uint8Array(100).fill(0xFF);
        const mode = modes[i];
        if (mode) {
          const result = secureDeleteBuffer(buffer, { mode });
          expect(result.passes).toBe(expectedPasses[i]);
        }
      }
    });

    it('should report timing for deletions', () => {
      const buffer = new Uint8Array(10000).fill(0xFF);
      const result = secureDeleteBuffer(buffer, { mode: 'standard' });

      // Should report timing (non-negative)
      expect(result.timeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Verification', () => {
    it('should verify deletion when verify=true', () => {
      const buffer = new Uint8Array(100).fill(0xFF);
      const result = secureDeleteBuffer(buffer, { mode: 'standard', verify: true });

      expect(result.verified).toBe(true);
    });

    it('should not verify when verify=false', () => {
      const buffer = new Uint8Array(100).fill(0xFF);
      const result = secureDeleteBuffer(buffer, { mode: 'standard', verify: false });

      expect(result.verified).toBe(false);
    });
  });
});

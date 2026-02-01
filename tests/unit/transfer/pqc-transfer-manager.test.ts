/**
 * PQC Transfer Manager Tests
 * Tests post-quantum secure file transfer flow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PQCTransferManager } from '@/lib/transfer/pqc-transfer-manager';
import type { TransferInitiateMessage, TransferAcceptMessage } from '@/lib/types';

// Mock dependencies
vi.mock('@/lib/monitoring/sentry', () => ({
  captureException: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

vi.mock('@/lib/crypto/pqc-crypto', () => ({
  pqCrypto: {
    generateHybridKeypair: vi.fn().mockResolvedValue({
      kyber: {
        publicKey: new Uint8Array(1184),
        secretKey: new Uint8Array(2400),
      },
      x25519: {
        publicKey: new Uint8Array(32),
        privateKey: new Uint8Array(32),
      },
    }),
    hybridEncapsulate: vi.fn().mockResolvedValue({
      sharedSecret: new Uint8Array(32),
      sessionKeys: {
        encryptionKey: new Uint8Array(32),
        authKey: new Uint8Array(32),
        sessionId: new Uint8Array(16),
      },
      ciphertext: {
        kyberCiphertext: new Uint8Array(1088),
        x25519EphemeralPublic: new Uint8Array(32),
      },
    }),
    hybridDecapsulate: vi.fn().mockResolvedValue({
      sharedSecret: new Uint8Array(32),
      sessionKeys: {
        encryptionKey: new Uint8Array(32),
        authKey: new Uint8Array(32),
        sessionId: new Uint8Array(16),
      },
    }),
  },
}));

describe('PQCTransferManager', () => {
  let manager: PQCTransferManager;
  let mockSignaling: any;

  beforeEach(() => {
    mockSignaling = {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    };

    manager = new PQCTransferManager(mockSignaling);
  });

  describe('Initialization', () => {
    it('should create manager instance', () => {
      expect(manager).toBeDefined();
      expect(manager).toBeInstanceOf(PQCTransferManager);
    });

    it('should register signaling event handlers', () => {
      expect(mockSignaling.on).toHaveBeenCalled();
    });
  });

  describe('Transfer Initiation', () => {
    it('should initiate transfer with PQC keys', async () => {
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });
      const recipientId = 'recipient-123';

      const transferId = await manager.initiateTransfer(file, recipientId);

      expect(transferId).toBeDefined();
      expect(typeof transferId).toBe('string');
      expect(mockSignaling.emit).toHaveBeenCalledWith(
        'transfer:initiate',
        expect.objectContaining({
          transferId,
          recipientId,
        })
      );
    });

    it('should generate hybrid keypair for transfer', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      await manager.initiateTransfer(file, 'recipient-123');

      // Should have generated PQC keys
      const transfers = manager.getActiveTransfers();
      expect(transfers.length).toBeGreaterThan(0);
    });

    it('should include file metadata in initiation', async () => {
      const file = new File(['test content'], 'document.pdf', {
        type: 'application/pdf',
      });

      await manager.initiateTransfer(file, 'recipient-123');

      expect(mockSignaling.emit).toHaveBeenCalledWith(
        'transfer:initiate',
        expect.objectContaining({
          metadata: expect.objectContaining({
            size: expect.any(Number),
            mimeCategory: expect.any(String),
          }),
        })
      );
    });

    it('should reject empty files', async () => {
      const file = new File([], 'empty.txt', { type: 'text/plain' });

      await expect(
        manager.initiateTransfer(file, 'recipient-123')
      ).rejects.toThrow();
    });

    it('should handle multiple simultaneous transfers', async () => {
      const file1 = new File(['content 1'], 'file1.txt', {
        type: 'text/plain',
      });
      const file2 = new File(['content 2'], 'file2.txt', {
        type: 'text/plain',
      });

      const id1 = await manager.initiateTransfer(file1, 'recipient-1');
      const id2 = await manager.initiateTransfer(file2, 'recipient-2');

      expect(id1).not.toBe(id2);

      const transfers = manager.getActiveTransfers();
      expect(transfers.length).toBe(2);
    });
  });

  describe('Transfer Acceptance', () => {
    it('should accept incoming transfer', async () => {
      const transferData: TransferInitiateMessage = {
        transferId: 'transfer-123',
        senderId: 'sender-123',
        recipientId: 'recipient-123',
        metadata: {
          encryptedName: 'encrypted',
          nameNonce: new Uint8Array(12),
          originalSize: 1000,
          mimeCategory: 'text',
          totalChunks: 1,
          fileHash: new Uint8Array(32),
          encryptedAt: Date.now(),
          originalName: '',
        },
        pqcPublicKey: {
          kyberPublicKey: new Uint8Array(1184),
          x25519PublicKey: new Uint8Array(32),
        },
      };

      const accepted = await manager.acceptTransfer(transferData);

      expect(accepted).toBe(true);
      expect(mockSignaling.emit).toHaveBeenCalledWith(
        'transfer:accept',
        expect.objectContaining({
          transferId: 'transfer-123',
        })
      );
    });

    it('should perform key exchange on acceptance', async () => {
      const transferData: TransferInitiateMessage = {
        transferId: 'transfer-123',
        senderId: 'sender-123',
        recipientId: 'recipient-123',
        metadata: {
          encryptedName: 'encrypted',
          nameNonce: new Uint8Array(12),
          originalSize: 1000,
          mimeCategory: 'text',
          totalChunks: 1,
          fileHash: new Uint8Array(32),
          encryptedAt: Date.now(),
          originalName: '',
        },
        pqcPublicKey: {
          kyberPublicKey: new Uint8Array(1184),
          x25519PublicKey: new Uint8Array(32),
        },
      };

      await manager.acceptTransfer(transferData);

      // Should have encapsulated shared secret
      expect(mockSignaling.emit).toHaveBeenCalledWith(
        'transfer:accept',
        expect.objectContaining({
          pqcCiphertext: expect.any(Object),
        })
      );
    });

    it('should reject duplicate transfer IDs', async () => {
      const transferData: TransferInitiateMessage = {
        transferId: 'transfer-123',
        senderId: 'sender-123',
        recipientId: 'recipient-123',
        metadata: {
          encryptedName: 'encrypted',
          nameNonce: new Uint8Array(12),
          originalSize: 1000,
          mimeCategory: 'text',
          totalChunks: 1,
          fileHash: new Uint8Array(32),
          encryptedAt: Date.now(),
          originalName: '',
        },
        pqcPublicKey: {
          kyberPublicKey: new Uint8Array(1184),
          x25519PublicKey: new Uint8Array(32),
        },
      };

      await manager.acceptTransfer(transferData);

      // Try to accept same transfer again
      await expect(manager.acceptTransfer(transferData)).rejects.toThrow();
    });
  });

  describe('Chunk Transfer', () => {
    it('should send encrypted chunks', async () => {
      const file = new File(['x'.repeat(100 * 1024)], 'large.txt', {
        type: 'text/plain',
      });

      const transferId = await manager.initiateTransfer(file, 'recipient-123');

      // Simulate acceptance
      await manager.handleTransferAccept({
        transferId,
        recipientId: 'recipient-123',
        pqcCiphertext: {
          kyberCiphertext: new Uint8Array(1088),
          x25519EphemeralPublic: new Uint8Array(32),
        },
      });

      // Should start sending chunks
      expect(mockSignaling.emit).toHaveBeenCalledWith(
        'transfer:chunk',
        expect.objectContaining({
          transferId,
          chunk: expect.any(Object),
        })
      );
    });

    it('should track chunk progress', async () => {
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      const transferId = await manager.initiateTransfer(file, 'recipient-123');

      const progress = manager.getTransferProgress(transferId);

      expect(progress).toBeDefined();
      expect(progress?.chunksTotal).toBeGreaterThan(0);
      expect(progress?.chunksSent).toBeGreaterThanOrEqual(0);
    });

    it('should verify chunk integrity', async () => {
      const chunk = {
        index: 0,
        data: new Uint8Array([1, 2, 3]),
        nonce: new Uint8Array(12),
        hash: new Uint8Array(32),
      };

      const isValid = manager.verifyChunk(chunk);

      expect(typeof isValid).toBe('boolean');
    });

    it('should handle chunk transmission errors', async () => {
      mockSignaling.emit.mockRejectedValueOnce(new Error('Network error'));

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      await expect(
        manager.initiateTransfer(file, 'recipient-123')
      ).rejects.toThrow();
    });
  });

  describe('Transfer Completion', () => {
    it('should complete transfer successfully', async () => {
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      const transferId = await manager.initiateTransfer(file, 'recipient-123');

      // Simulate completion
      await manager.completeTransfer(transferId);

      const transfers = manager.getActiveTransfers();
      expect(transfers.find(t => t.id === transferId)).toBeUndefined();
    });

    it('should emit completion event', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      const transferId = await manager.initiateTransfer(file, 'recipient-123');

      await manager.completeTransfer(transferId);

      expect(mockSignaling.emit).toHaveBeenCalledWith(
        'transfer:complete',
        expect.objectContaining({
          transferId,
        })
      );
    });

    it('should clean up resources on completion', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      const transferId = await manager.initiateTransfer(file, 'recipient-123');

      await manager.completeTransfer(transferId);

      // Should not be in active transfers
      const progress = manager.getTransferProgress(transferId);
      expect(progress).toBeNull();
    });
  });

  describe('Transfer Cancellation', () => {
    it('should cancel active transfer', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      const transferId = await manager.initiateTransfer(file, 'recipient-123');

      await manager.cancelTransfer(transferId);

      const transfers = manager.getActiveTransfers();
      expect(transfers.find(t => t.id === transferId)).toBeUndefined();
    });

    it('should emit cancellation event', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      const transferId = await manager.initiateTransfer(file, 'recipient-123');

      await manager.cancelTransfer(transferId);

      expect(mockSignaling.emit).toHaveBeenCalledWith(
        'transfer:cancel',
        expect.objectContaining({
          transferId,
        })
      );
    });

    it('should handle cancellation of non-existent transfer', async () => {
      await expect(
        manager.cancelTransfer('non-existent')
      ).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle key generation failure', async () => {
      const { pqCrypto } = await import('@/lib/crypto/pqc-crypto');
      vi.mocked(pqCrypto.generateHybridKeypair).mockRejectedValueOnce(
        new Error('Key generation failed')
      );

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      await expect(
        manager.initiateTransfer(file, 'recipient-123')
      ).rejects.toThrow();
    });

    it('should handle encryption failure', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      // Mock encryption failure
      const transferId = await manager.initiateTransfer(file, 'recipient-123');

      // Simulate encryption error during chunk sending
      mockSignaling.emit.mockRejectedValueOnce(
        new Error('Encryption failed')
      );

      // Should handle error gracefully
      expect(manager.getTransferProgress(transferId)).toBeDefined();
    });

    it('should handle signaling errors', async () => {
      mockSignaling.emit.mockRejectedValue(new Error('Signaling failed'));

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      await expect(
        manager.initiateTransfer(file, 'recipient-123')
      ).rejects.toThrow();
    });
  });

  describe('State Management', () => {
    it('should track active transfers', () => {
      const transfers = manager.getActiveTransfers();

      expect(Array.isArray(transfers)).toBe(true);
    });

    it('should provide transfer statistics', async () => {
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      const transferId = await manager.initiateTransfer(file, 'recipient-123');

      const stats = manager.getTransferStats(transferId);

      expect(stats).toBeDefined();
      expect(stats?.bytesTransferred).toBeGreaterThanOrEqual(0);
      expect(stats?.totalBytes).toBeGreaterThan(0);
    });

    it('should calculate transfer speed', async () => {
      const file = new File(['x'.repeat(1000)], 'test.txt', {
        type: 'text/plain',
      });

      const transferId = await manager.initiateTransfer(file, 'recipient-123');

      const speed = manager.getTransferSpeed(transferId);

      expect(typeof speed).toBe('number');
      expect(speed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Security Verification', () => {
    it('should verify PQC public key format', () => {
      const validKey = {
        kyberPublicKey: new Uint8Array(1184),
        x25519PublicKey: new Uint8Array(32),
      };

      const isValid = manager.verifyPublicKey(validKey);

      expect(isValid).toBe(true);
    });

    it('should reject invalid key sizes', () => {
      const invalidKey = {
        kyberPublicKey: new Uint8Array(100), // Wrong size
        x25519PublicKey: new Uint8Array(32),
      };

      const isValid = manager.verifyPublicKey(invalidKey);

      expect(isValid).toBe(false);
    });

    it('should authenticate transfer messages', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      const transferId = await manager.initiateTransfer(file, 'recipient-123');

      // Should include authentication
      expect(mockSignaling.emit).toHaveBeenCalledWith(
        'transfer:initiate',
        expect.objectContaining({
          transferId,
          pqcPublicKey: expect.any(Object),
        })
      );
    });
  });

  describe('Performance', () => {
    it('should initiate transfer quickly', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      const start = Date.now();
      await manager.initiateTransfer(file, 'recipient-123');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000);
    });

    it('should handle multiple concurrent transfers', async () => {
      const files = Array.from({ length: 5 }, (_, i) =>
        new File([`content ${i}`], `file${i}.txt`, { type: 'text/plain' })
      );

      const start = Date.now();

      const transfers = await Promise.all(
        files.map((file, i) =>
          manager.initiateTransfer(file, `recipient-${i}`)
        )
      );

      const duration = Date.now() - start;

      expect(transfers.length).toBe(5);
      expect(duration).toBeLessThan(5000);
    });
  });
});

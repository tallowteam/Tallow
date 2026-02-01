/**
 * Comprehensive Unit Tests for TransferManager
 *
 * Tests cover:
 * 1. State Transitions (10 tests)
 * 2. Protected Fields (5 tests)
 * 3. Event Emission (10 tests)
 * 4. ETA Calculation (5 tests)
 * 5. Transfer Management (10+ tests)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Transfer, FileInfo, Device, TransferEvent } from '@/lib/types';

// Mock generateUUID
vi.mock('@/lib/utils/uuid', () => ({
  generateUUID: vi.fn(() => 'test-uuid-' + Math.random().toString(36).substring(7)),
}));

// Mock monitoring/metrics module
vi.mock('@/lib/monitoring/metrics', () => ({
  recordTransfer: vi.fn(),
  recordError: vi.fn(),
}));

// Mock monitoring/sentry module
vi.mock('@/lib/monitoring/sentry', () => ({
  captureException: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

// We need to import the module dynamically after mocking
let TransferManager: any;
let transferManager: any;

// Helper functions to create test data
function createMockDevice(id: string, name: string): Device {
  return {
    id,
    name,
    platform: 'windows',
    ip: '192.168.1.1',
    port: 8080,
    isOnline: true,
    isFavorite: false,
    lastSeen: Date.now(),
    avatar: null,
  };
}

function createMockFileInfo(id: string, name: string, size: number): FileInfo {
  return {
    id,
    name,
    size,
    type: 'text/plain',
    lastModified: Date.now(),
    hash: 'abc123',
    thumbnail: null,
    path: null,
  };
}

describe('TransferManager', () => {
  beforeEach(async () => {
    // Reset modules to get fresh singleton instance
    vi.resetModules();

    // Re-import after reset
    const module = await import('@/lib/transfer/transfer-manager');
    TransferManager = module.default;
    transferManager = TransferManager.getInstance();
  });

  afterEach(() => {
    // Clean up all transfers
    const transfers = transferManager.getAllTransfers();
    transfers.forEach((t: Transfer) => transferManager.deleteTransfer(t.id));

    // Remove all listeners
    vi.clearAllMocks();
  });

  // ===========================================================================
  // 1. STATE TRANSITIONS (10 tests)
  // ===========================================================================
  describe('State Transitions', () => {
    it('should transition from pending to transferring', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      expect(transfer.status).toBe('pending');

      transferManager.updateTransfer(transfer.id, { status: 'transferring', startTime: Date.now() });
      const updated = transferManager.getTransfer(transfer.id);
      expect(updated?.status).toBe('transferring');
    });

    it('should transition from transferring to completed', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      transferManager.updateTransfer(transfer.id, {
        status: 'transferring',
        startTime: Date.now() - 1000, // Set startTime to avoid Infinity duration
      });
      transferManager.completeTransfer(transfer.id);

      const updated = transferManager.getTransfer(transfer.id);
      expect(updated?.status).toBe('completed');
      expect(updated?.progress).toBe(100);
    });

    it('should transition from transferring to failed', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      transferManager.updateTransfer(transfer.id, { status: 'transferring' });
      transferManager.failTransfer(transfer.id, 'Connection lost');

      const updated = transferManager.getTransfer(transfer.id);
      expect(updated?.status).toBe('failed');
      expect(updated?.error?.message).toBe('Connection lost');
    });

    it('should transition from pending to cancelled', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      transferManager.cancelTransfer(transfer.id);

      const updated = transferManager.getTransfer(transfer.id);
      expect(updated?.status).toBe('cancelled');
    });

    it('should transition from transferring to paused', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      transferManager.updateTransfer(transfer.id, { status: 'transferring' });
      transferManager.pauseTransfer(transfer.id);

      const updated = transferManager.getTransfer(transfer.id);
      expect(updated?.status).toBe('paused');
    });

    it('should transition from paused to transferring (resume)', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      transferManager.updateTransfer(transfer.id, { status: 'transferring' });
      transferManager.pauseTransfer(transfer.id);
      transferManager.resumeTransfer(transfer.id);

      const updated = transferManager.getTransfer(transfer.id);
      expect(updated?.status).toBe('transferring');
    });

    it('should not allow invalid transition from pending to completed', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      transferManager.updateTransfer(transfer.id, { status: 'completed' });

      // Should remain pending since direct transition is not allowed
      const updated = transferManager.getTransfer(transfer.id);
      expect(updated?.status).toBe('pending');
    });

    it('should not allow transition from completed state', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      transferManager.updateTransfer(transfer.id, {
        status: 'transferring',
        startTime: Date.now() - 1000,
      });
      transferManager.completeTransfer(transfer.id);

      // Try to transition from completed to transferring
      transferManager.updateTransfer(transfer.id, { status: 'transferring' });

      const updated = transferManager.getTransfer(transfer.id);
      expect(updated?.status).toBe('completed');
    });

    it('should not allow transition from failed state', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      transferManager.updateTransfer(transfer.id, { status: 'transferring' });
      transferManager.failTransfer(transfer.id, 'Error occurred');

      // Try to transition from failed to transferring
      transferManager.updateTransfer(transfer.id, { status: 'transferring' });

      const updated = transferManager.getTransfer(transfer.id);
      expect(updated?.status).toBe('failed');
    });

    it('should complete full pause/resume cycle successfully', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      expect(transfer.status).toBe('pending');

      transferManager.updateTransfer(transfer.id, {
        status: 'transferring',
        progress: 25,
        startTime: Date.now() - 1000,
      });
      expect(transferManager.getTransfer(transfer.id)?.status).toBe('transferring');

      transferManager.pauseTransfer(transfer.id);
      expect(transferManager.getTransfer(transfer.id)?.status).toBe('paused');

      transferManager.resumeTransfer(transfer.id);
      expect(transferManager.getTransfer(transfer.id)?.status).toBe('transferring');

      transferManager.updateTransfer(transfer.id, { progress: 75 });
      transferManager.completeTransfer(transfer.id);

      const final = transferManager.getTransfer(transfer.id);
      expect(final?.status).toBe('completed');
      expect(final?.progress).toBe(100);
    });
  });

  // ===========================================================================
  // 2. PROTECTED FIELDS (5 tests)
  // ===========================================================================
  describe('Protected Fields', () => {
    it('should not allow modification of id field', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      const originalId = transfer.id;

      transferManager.updateTransfer(transfer.id, { id: 'new-id' } as any);

      const updated = transferManager.getTransfer(originalId);
      expect(updated?.id).toBe(originalId);
    });

    it('should not allow modification of from device field', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');
      const newFrom = createMockDevice('d3', 'Device 3');

      const transfer = transferManager.addTransfer(files, from, to, 'send');

      transferManager.updateTransfer(transfer.id, { from: newFrom } as any);

      const updated = transferManager.getTransfer(transfer.id);
      expect(updated?.from.id).toBe('d1');
      expect(updated?.from.name).toBe('Device 1');
    });

    it('should not allow modification of to device field', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');
      const newTo = createMockDevice('d4', 'Device 4');

      const transfer = transferManager.addTransfer(files, from, to, 'send');

      transferManager.updateTransfer(transfer.id, { to: newTo } as any);

      const updated = transferManager.getTransfer(transfer.id);
      expect(updated?.to.id).toBe('d2');
      expect(updated?.to.name).toBe('Device 2');
    });

    it('should not allow modification of files field', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');
      const newFiles = [createMockFileInfo('f2', 'new.txt', 2048)];

      const transfer = transferManager.addTransfer(files, from, to, 'send');

      transferManager.updateTransfer(transfer.id, { files: newFiles } as any);

      const updated = transferManager.getTransfer(transfer.id);
      expect(updated?.files[0]?.id).toBe('f1');
      expect(updated?.files[0]?.name).toBe('test.txt');
    });

    it('should not allow modification of totalSize field', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');

      transferManager.updateTransfer(transfer.id, { totalSize: 999999 } as any);

      const updated = transferManager.getTransfer(transfer.id);
      expect(updated?.totalSize).toBe(1024);
    });
  });

  // ===========================================================================
  // 3. EVENT EMISSION (10 tests)
  // ===========================================================================
  describe('Event Emission', () => {
    it('should emit progress event when transfer is added', () => {
      const listener = vi.fn();
      transferManager.on(listener);

      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      transferManager.addTransfer(files, from, to, 'send');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'progress',
          timestamp: expect.any(Number),
        })
      );
    });

    it('should emit progress event on transfer update', () => {
      const listener = vi.fn();
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      transferManager.on(listener);

      transferManager.updateTransfer(transfer.id, { progress: 50 });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'progress',
          transfer: expect.objectContaining({ progress: 50 }),
        })
      );
    });

    it('should emit completed event when transfer completes', () => {
      const listener = vi.fn();
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      transferManager.updateTransfer(transfer.id, {
        status: 'transferring',
        startTime: Date.now() - 1000,
      });
      transferManager.on(listener);

      transferManager.completeTransfer(transfer.id);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'completed',
        })
      );
    });

    it('should emit failed event with error details', () => {
      const listener = vi.fn();
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      transferManager.updateTransfer(transfer.id, { status: 'transferring' });
      transferManager.on(listener);

      transferManager.failTransfer(transfer.id, 'Network timeout');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'failed',
        })
      );

      // Verify error details on transfer
      const updated = transferManager.getTransfer(transfer.id);
      expect(updated?.error?.message).toBe('Network timeout');
      expect(updated?.error?.code).toBe('TRANSFER_FAILED');
    });

    it('should emit paused event when transfer is paused', () => {
      const listener = vi.fn();
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      transferManager.updateTransfer(transfer.id, { status: 'transferring' });
      transferManager.on(listener);

      transferManager.pauseTransfer(transfer.id);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'paused',
        })
      );
    });

    it('should emit resumed event when transfer is resumed', () => {
      const listener = vi.fn();
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      transferManager.updateTransfer(transfer.id, { status: 'transferring' });
      transferManager.pauseTransfer(transfer.id);
      transferManager.on(listener);

      transferManager.resumeTransfer(transfer.id);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'resumed',
        })
      );
    });

    it('should emit cancelled event when transfer is cancelled', () => {
      const listener = vi.fn();
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      transferManager.on(listener);

      transferManager.cancelTransfer(transfer.id);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'cancelled',
        })
      );
    });

    it('should allow removing event listeners', () => {
      const listener = vi.fn();
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      const unsubscribe = transferManager.on(listener);

      // Remove listener
      unsubscribe();

      transferManager.updateTransfer(transfer.id, { progress: 50 });

      // Listener should not be called after removal
      expect(listener).not.toHaveBeenCalled();
    });

    it('should notify multiple listeners on event', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      transferManager.on(listener1);
      transferManager.on(listener2);
      transferManager.on(listener3);

      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      transferManager.addTransfer(files, from, to, 'send');

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
      expect(listener3).toHaveBeenCalled();
    });

    it('should include timestamp in all events', () => {
      const events: TransferEvent[] = [];
      const listener = (event: TransferEvent) => events.push(event);
      transferManager.on(listener);

      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      transferManager.updateTransfer(transfer.id, {
        status: 'transferring',
        startTime: Date.now() - 1000,
      });
      transferManager.pauseTransfer(transfer.id);
      transferManager.resumeTransfer(transfer.id);
      transferManager.completeTransfer(transfer.id);

      events.forEach((event) => {
        expect(event.timestamp).toBeDefined();
        expect(typeof event.timestamp).toBe('number');
        expect(event.timestamp).toBeGreaterThan(0);
      });
    });
  });

  // ===========================================================================
  // 4. ETA CALCULATION (5 tests)
  // ===========================================================================
  describe('ETA Calculation', () => {
    it('should calculate accurate ETA based on speed', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 10000)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      transferManager.updateTransfer(transfer.id, {
        status: 'transferring',
        speed: 1000, // 1000 bytes/second
        transferredSize: 5000, // 5000 bytes transferred
      });

      const updated = transferManager.getTransfer(transfer.id);
      // Remaining: 10000 - 5000 = 5000 bytes
      // ETA: 5000 / 1000 = 5 seconds
      expect(updated?.eta).toBe(5);
    });

    it('should handle zero speed gracefully', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 10000)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      transferManager.updateTransfer(transfer.id, {
        status: 'transferring',
        speed: 0,
        transferredSize: 5000,
      });

      const updated = transferManager.getTransfer(transfer.id);
      // With zero speed, ETA should not be calculated (remain null)
      expect(updated?.eta).toBeNull();
    });

    it('should update ETA as speed changes', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 10000)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');

      // First update with slower speed
      transferManager.updateTransfer(transfer.id, {
        status: 'transferring',
        speed: 500,
        transferredSize: 5000,
      });

      let updated = transferManager.getTransfer(transfer.id);
      expect(updated?.eta).toBe(10); // 5000 / 500 = 10

      // Speed increases
      transferManager.updateTransfer(transfer.id, {
        speed: 2500,
        transferredSize: 5000,
      });

      updated = transferManager.getTransfer(transfer.id);
      expect(updated?.eta).toBe(2); // 5000 / 2500 = 2
    });

    it('should calculate ETA correctly for large files', () => {
      const largeFileSize = 1024 * 1024 * 1024; // 1 GB
      const files = [createMockFileInfo('f1', 'large.bin', largeFileSize)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      transferManager.updateTransfer(transfer.id, {
        status: 'transferring',
        speed: 10 * 1024 * 1024, // 10 MB/s
        transferredSize: 512 * 1024 * 1024, // 512 MB transferred
      });

      const updated = transferManager.getTransfer(transfer.id);
      // Remaining: 512 MB = 536870912 bytes
      // ETA: 536870912 / 10485760 = 51.2 seconds -> ceil = 52
      expect(updated?.eta).toBe(52);
    });

    it('should not calculate ETA when not in transferring status', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 10000)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');

      // Try to set speed while in pending status
      transferManager.updateTransfer(transfer.id, {
        speed: 1000,
        transferredSize: 5000,
      });

      const updated = transferManager.getTransfer(transfer.id);
      // ETA should be null since not transferring
      expect(updated?.eta).toBeNull();
    });
  });

  // ===========================================================================
  // 5. TRANSFER MANAGEMENT (10+ tests)
  // ===========================================================================
  describe('Transfer Management', () => {
    it('should add a new transfer and return it', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');

      expect(transfer).toBeDefined();
      expect(transfer.id).toBeDefined();
      expect(transfer.files).toEqual(files);
      expect(transfer.from).toEqual(from);
      expect(transfer.to).toEqual(to);
      expect(transfer.direction).toBe('send');
      expect(transfer.status).toBe('pending');
      expect(transfer.progress).toBe(0);
      expect(transfer.totalSize).toBe(1024);
    });

    it('should get transfer by ID', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      const retrieved = transferManager.getTransfer(transfer.id);

      expect(retrieved).toEqual(transfer);
    });

    it('should return undefined for non-existent transfer ID', () => {
      const retrieved = transferManager.getTransfer('non-existent-id');
      expect(retrieved).toBeUndefined();
    });

    it('should update transfer properties correctly', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      transferManager.updateTransfer(transfer.id, {
        progress: 50,
        transferredSize: 512,
        quality: 'excellent',
      });

      const updated = transferManager.getTransfer(transfer.id);
      expect(updated?.progress).toBe(50);
      expect(updated?.transferredSize).toBe(512);
      expect(updated?.quality).toBe('excellent');
    });

    it('should delete a transfer', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      transferManager.deleteTransfer(transfer.id);

      const retrieved = transferManager.getTransfer(transfer.id);
      expect(retrieved).toBeUndefined();
    });

    it('should list all transfers', () => {
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const files1 = [createMockFileInfo('f1', 'file1.txt', 1024)];
      const files2 = [createMockFileInfo('f2', 'file2.txt', 2048)];
      const files3 = [createMockFileInfo('f3', 'file3.txt', 3072)];

      transferManager.addTransfer(files1, from, to, 'send');
      transferManager.addTransfer(files2, from, to, 'receive');
      transferManager.addTransfer(files3, to, from, 'send');

      const allTransfers = transferManager.getAllTransfers();
      expect(allTransfers).toHaveLength(3);
    });

    it('should get only active transfers', () => {
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const files1 = [createMockFileInfo('f1', 'file1.txt', 1024)];
      const files2 = [createMockFileInfo('f2', 'file2.txt', 2048)];
      const files3 = [createMockFileInfo('f3', 'file3.txt', 3072)];

      const t1 = transferManager.addTransfer(files1, from, to, 'send');
      const t2 = transferManager.addTransfer(files2, from, to, 'receive');
      const t3 = transferManager.addTransfer(files3, to, from, 'send');

      // Set different statuses
      transferManager.updateTransfer(t1.id, { status: 'transferring' });
      transferManager.updateTransfer(t2.id, {
        status: 'transferring',
        startTime: Date.now() - 1000,
      });
      transferManager.completeTransfer(t2.id);
      // t3 remains pending (active)

      const activeTransfers = transferManager.getActiveTransfers();
      expect(activeTransfers).toHaveLength(2); // t1 (transferring) and t3 (pending)
    });

    it('should clear all completed/failed/cancelled transfers', () => {
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const files1 = [createMockFileInfo('f1', 'file1.txt', 1024)];
      const files2 = [createMockFileInfo('f2', 'file2.txt', 2048)];
      const files3 = [createMockFileInfo('f3', 'file3.txt', 3072)];
      const files4 = [createMockFileInfo('f4', 'file4.txt', 4096)];

      const t1 = transferManager.addTransfer(files1, from, to, 'send');
      const t2 = transferManager.addTransfer(files2, from, to, 'receive');
      const t3 = transferManager.addTransfer(files3, to, from, 'send');
      const t4 = transferManager.addTransfer(files4, to, from, 'receive');

      // Complete t1
      transferManager.updateTransfer(t1.id, {
        status: 'transferring',
        startTime: Date.now() - 1000,
      });
      transferManager.completeTransfer(t1.id);

      // Fail t2
      transferManager.updateTransfer(t2.id, { status: 'transferring' });
      transferManager.failTransfer(t2.id, 'Error');

      // Cancel t3
      transferManager.cancelTransfer(t3.id);

      // t4 remains pending

      transferManager.clearCompleted();

      const remaining = transferManager.getAllTransfers();
      expect(remaining).toHaveLength(1);
      expect(remaining[0]?.id).toBe(t4.id);
    });

    it('should calculate total progress across all active transfers', () => {
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const files1 = [createMockFileInfo('f1', 'file1.txt', 1000)];
      const files2 = [createMockFileInfo('f2', 'file2.txt', 1000)];

      const t1 = transferManager.addTransfer(files1, from, to, 'send');
      const t2 = transferManager.addTransfer(files2, from, to, 'send');

      transferManager.updateTransfer(t1.id, {
        status: 'transferring',
        transferredSize: 250, // 25%
      });
      transferManager.updateTransfer(t2.id, {
        status: 'transferring',
        transferredSize: 750, // 75%
      });

      // Total size: 2000, Total transferred: 1000 = 50%
      const totalProgress = transferManager.getTotalProgress();
      expect(totalProgress).toBe(50);
    });

    it('should calculate total speed across all active transfers', () => {
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const files1 = [createMockFileInfo('f1', 'file1.txt', 1000)];
      const files2 = [createMockFileInfo('f2', 'file2.txt', 1000)];
      const files3 = [createMockFileInfo('f3', 'file3.txt', 1000)];

      const t1 = transferManager.addTransfer(files1, from, to, 'send');
      const t2 = transferManager.addTransfer(files2, from, to, 'send');
      const t3 = transferManager.addTransfer(files3, from, to, 'send');

      transferManager.updateTransfer(t1.id, { status: 'transferring', speed: 100 });
      transferManager.updateTransfer(t2.id, { status: 'transferring', speed: 200 });
      transferManager.updateTransfer(t3.id, { status: 'transferring', speed: 300 });

      const totalSpeed = transferManager.getTotalSpeed();
      expect(totalSpeed).toBe(600);
    });

    it('should trim old transfers when exceeding MAX_COMPLETED_TRANSFERS', async () => {
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      // Create 105 transfers and complete them all using completeTransfer
      // which triggers trimOldTransfers()
      for (let i = 0; i < 105; i++) {
        const files = [createMockFileInfo(`f${i}`, `file${i}.txt`, 1024)];
        const transfer = transferManager.addTransfer(files, from, to, 'send');

        // Transition to transferring first (required by state machine)
        transferManager.updateTransfer(transfer.id, {
          status: 'transferring',
          startTime: Date.now() - 1000, // Set startTime to avoid Infinity duration
        });

        // Complete the transfer (this triggers trimOldTransfers)
        transferManager.completeTransfer(transfer.id);
      }

      // Check that trimming occurred
      const allTransfers = transferManager.getAllTransfers();
      const completedTransfers = allTransfers.filter((t: Transfer) => t.status === 'completed');

      // Should have at most MAX_COMPLETED_TRANSFERS (100) completed transfers
      expect(completedTransfers.length).toBeLessThanOrEqual(100);
    });

    it('should calculate total size correctly for multiple files', () => {
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const files = [
        createMockFileInfo('f1', 'file1.txt', 1000),
        createMockFileInfo('f2', 'file2.txt', 2000),
        createMockFileInfo('f3', 'file3.txt', 3000),
      ];

      const transfer = transferManager.addTransfer(files, from, to, 'send');

      expect(transfer.totalSize).toBe(6000);
    });

    it('should initialize transfer with correct default values', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'receive');

      expect(transfer.status).toBe('pending');
      expect(transfer.progress).toBe(0);
      expect(transfer.speed).toBe(0);
      expect(transfer.transferredSize).toBe(0);
      expect(transfer.startTime).toBeNull();
      expect(transfer.endTime).toBeNull();
      expect(transfer.error).toBeNull();
      expect(transfer.eta).toBeNull();
      expect(transfer.quality).toBe('good');
      expect(transfer.encryptionMetadata).toBeNull();
      expect(transfer.direction).toBe('receive');
    });

    it('should return singleton instance', async () => {
      const instance1 = TransferManager.getInstance();
      const instance2 = TransferManager.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  // ===========================================================================
  // ADDITIONAL EDGE CASE TESTS
  // ===========================================================================
  describe('Edge Cases', () => {
    it('should handle update on non-existent transfer gracefully', () => {
      // Should not throw
      expect(() => {
        transferManager.updateTransfer('non-existent-id', { progress: 50 });
      }).not.toThrow();
    });

    it('should handle pause on non-transferring transfer gracefully', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');

      // Should not throw or change status
      transferManager.pauseTransfer(transfer.id);

      const updated = transferManager.getTransfer(transfer.id);
      expect(updated?.status).toBe('pending');
    });

    it('should handle resume on non-paused transfer gracefully', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');

      // Should not throw or change status
      transferManager.resumeTransfer(transfer.id);

      const updated = transferManager.getTransfer(transfer.id);
      expect(updated?.status).toBe('pending');
    });

    it('should handle empty file list', () => {
      const files: FileInfo[] = [];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');

      expect(transfer.totalSize).toBe(0);
      expect(transfer.files).toHaveLength(0);
    });

    it('should return 0 for total progress with no active transfers', () => {
      const totalProgress = transferManager.getTotalProgress();
      expect(totalProgress).toBe(0);
    });

    it('should return 0 for total speed with no active transfers', () => {
      const totalSpeed = transferManager.getTotalSpeed();
      expect(totalSpeed).toBe(0);
    });

    it('should set endTime when transfer completes', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      transferManager.updateTransfer(transfer.id, {
        status: 'transferring',
        startTime: Date.now() - 1000,
      });

      const beforeComplete = Date.now();
      transferManager.completeTransfer(transfer.id);
      const afterComplete = Date.now();

      const updated = transferManager.getTransfer(transfer.id);
      expect(updated?.endTime).toBeGreaterThanOrEqual(beforeComplete);
      expect(updated?.endTime).toBeLessThanOrEqual(afterComplete);
    });

    it('should set endTime when transfer fails', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');
      transferManager.updateTransfer(transfer.id, { status: 'transferring' });

      const beforeFail = Date.now();
      transferManager.failTransfer(transfer.id, 'Connection lost');
      const afterFail = Date.now();

      const updated = transferManager.getTransfer(transfer.id);
      expect(updated?.endTime).toBeGreaterThanOrEqual(beforeFail);
      expect(updated?.endTime).toBeLessThanOrEqual(afterFail);
    });

    it('should set endTime when transfer is cancelled', () => {
      const files = [createMockFileInfo('f1', 'test.txt', 1024)];
      const from = createMockDevice('d1', 'Device 1');
      const to = createMockDevice('d2', 'Device 2');

      const transfer = transferManager.addTransfer(files, from, to, 'send');

      const beforeCancel = Date.now();
      transferManager.cancelTransfer(transfer.id);
      const afterCancel = Date.now();

      const updated = transferManager.getTransfer(transfer.id);
      expect(updated?.endTime).toBeGreaterThanOrEqual(beforeCancel);
      expect(updated?.endTime).toBeLessThanOrEqual(afterCancel);
    });
  });
});

/**
 * Transfer Store Unit Tests
 *
 * Tests the transfer store Zustand implementation including:
 * - Initial state
 * - Transfer management (add, update, remove, clear)
 * - Transfer state machine transitions
 * - Transfer control (pause, resume, cancel, retry)
 * - Queue management
 * - Progress tracking
 * - Optimistic updates
 * - Statistics calculation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useTransferStore } from '@/lib/stores/transfer-store';
import type { Transfer, Device, FileInfo } from '@/lib/types';
import type { TransferStatus } from '@/lib/stores/transfer-store';

describe('TransferStore', () => {
  // Helper to create mock devices
  const createMockDevice = (id: string): Device => ({
    id,
    name: `Device ${id}`,
    platform: 'windows',
    ip: '192.168.1.100',
    port: 8080,
    isOnline: true,
    isFavorite: false,
    lastSeen: Date.now(),
    avatar: null,
  });

  // Helper to create mock file info
  const createMockFileInfo = (name: string, size: number): FileInfo => ({
    id: `file-${Math.random().toString(36).substring(2, 9)}`,
    name,
    size,
    type: 'application/octet-stream',
    lastModified: Date.now(),
    hash: `hash-${name}`,
    thumbnail: null,
    path: null,
  });

  // Helper to create mock transfer
  const createMockTransfer = (overrides?: Partial<Transfer>): Transfer => ({
    id: `transfer-${Math.random().toString(36).substring(2, 9)}`,
    files: [createMockFileInfo('test.txt', 1024)],
    from: createMockDevice('device-1'),
    to: createMockDevice('device-2'),
    status: 'pending' as TransferStatus,
    progress: 0,
    speed: 0,
    startTime: null,
    endTime: null,
    error: null,
    direction: 'send',
    totalSize: 1024,
    transferredSize: 0,
    eta: null,
    quality: 'good',
    encryptionMetadata: null,
    ...overrides,
  });

  // Reset store state before each test
  beforeEach(() => {
    useTransferStore.setState({
      transfers: [],
      queue: [],
      progress: {
        uploadProgress: 0,
        downloadProgress: 0,
      },
      currentTransfer: {
        fileName: null,
        fileSize: 0,
        fileType: '',
        peerId: null,
        isTransferring: false,
        isReceiving: false,
      },
      isLoading: false,
      isInitialized: false,
    });
  });

  describe('Initial State', () => {
    it('should have empty transfers array', () => {
      const state = useTransferStore.getState();
      expect(state.transfers).toEqual([]);
    });

    it('should have empty queue', () => {
      const state = useTransferStore.getState();
      expect(state.queue).toEqual([]);
    });

    it('should have zero progress', () => {
      const state = useTransferStore.getState();
      expect(state.progress.uploadProgress).toBe(0);
      expect(state.progress.downloadProgress).toBe(0);
    });

    it('should have no current transfer', () => {
      const state = useTransferStore.getState();
      expect(state.currentTransfer.fileName).toBeNull();
      expect(state.currentTransfer.isTransferring).toBe(false);
    });
  });

  describe('Transfer Management', () => {
    describe('addTransfer', () => {
      it('should add a new transfer', () => {
        const transfer = createMockTransfer({ id: 'transfer-1' });
        useTransferStore.getState().addTransfer(transfer);

        const state = useTransferStore.getState();
        expect(state.transfers).toHaveLength(1);
        expect(state.transfers[0]).toEqual(transfer);
      });

      it('should update existing transfer when adding duplicate', () => {
        const transfer1 = createMockTransfer({ id: 'transfer-1', progress: 0 });
        const transfer2 = createMockTransfer({ id: 'transfer-1', progress: 50 });

        useTransferStore.getState().addTransfer(transfer1);
        useTransferStore.getState().addTransfer(transfer2);

        const state = useTransferStore.getState();
        expect(state.transfers).toHaveLength(1);
        expect(state.transfers[0]?.progress).toBe(50);
      });

      it('should add multiple different transfers', () => {
        const transfer1 = createMockTransfer({ id: 'transfer-1' });
        const transfer2 = createMockTransfer({ id: 'transfer-2' });

        useTransferStore.getState().addTransfer(transfer1);
        useTransferStore.getState().addTransfer(transfer2);

        const state = useTransferStore.getState();
        expect(state.transfers).toHaveLength(2);
      });
    });

    describe('addTransfers', () => {
      it('should add multiple new transfers', () => {
        const transfers = [
          createMockTransfer({ id: 'transfer-1' }),
          createMockTransfer({ id: 'transfer-2' }),
        ];

        useTransferStore.getState().addTransfers(transfers);

        const state = useTransferStore.getState();
        expect(state.transfers).toHaveLength(2);
      });

      it('should update existing transfers in batch', () => {
        const transfer1 = createMockTransfer({ id: 'transfer-1', progress: 0 });
        useTransferStore.getState().addTransfer(transfer1);

        const updates = [
          createMockTransfer({ id: 'transfer-1', progress: 50 }),
          createMockTransfer({ id: 'transfer-2', progress: 25 }),
        ];

        useTransferStore.getState().addTransfers(updates);

        const state = useTransferStore.getState();
        expect(state.transfers).toHaveLength(2);
        expect(state.transfers[0]?.progress).toBe(50);
      });
    });

    describe('updateTransfer', () => {
      it('should update transfer properties', () => {
        const transfer = createMockTransfer({ id: 'transfer-1', progress: 0, status: 'pending' });
        useTransferStore.getState().addTransfer(transfer);

        useTransferStore.getState().updateTransfer('transfer-1', {
          progress: 50,
          status: 'transferring',
        });

        const state = useTransferStore.getState();
        expect(state.transfers[0]?.progress).toBe(50);
        expect(state.transfers[0]?.status).toBe('transferring');
      });

      it('should preserve other properties', () => {
        const transfer = createMockTransfer({
          id: 'transfer-1',
          progress: 0,
          totalSize: 1024,
        });
        useTransferStore.getState().addTransfer(transfer);

        useTransferStore.getState().updateTransfer('transfer-1', { progress: 50 });

        const state = useTransferStore.getState();
        expect(state.transfers[0]?.totalSize).toBe(1024);
      });

      it('should handle non-existent transfer gracefully', () => {
        const transfer = createMockTransfer({ id: 'transfer-1' });
        useTransferStore.getState().addTransfer(transfer);

        useTransferStore.getState().updateTransfer('non-existent', { progress: 50 });

        const state = useTransferStore.getState();
        expect(state.transfers).toHaveLength(1);
        expect(state.transfers[0]?.id).toBe('transfer-1');
      });
    });

    describe('updateTransferProgress', () => {
      it('should update progress and speed', () => {
        const transfer = createMockTransfer({ id: 'transfer-1', progress: 0, speed: 0 });
        useTransferStore.getState().addTransfer(transfer);

        useTransferStore.getState().updateTransferProgress('transfer-1', 75, 1024000);

        const state = useTransferStore.getState();
        expect(state.transfers[0]?.progress).toBe(75);
        expect(state.transfers[0]?.speed).toBe(1024000);
      });

      it('should update progress without speed', () => {
        const transfer = createMockTransfer({ id: 'transfer-1', progress: 0, speed: 500000 });
        useTransferStore.getState().addTransfer(transfer);

        useTransferStore.getState().updateTransferProgress('transfer-1', 50);

        const state = useTransferStore.getState();
        expect(state.transfers[0]?.progress).toBe(50);
        expect(state.transfers[0]?.speed).toBe(500000); // Preserved
      });
    });

    describe('removeTransfer', () => {
      it('should remove transfer from list', () => {
        const transfer = createMockTransfer({ id: 'transfer-1' });
        useTransferStore.getState().addTransfer(transfer);

        useTransferStore.getState().removeTransfer('transfer-1');

        const state = useTransferStore.getState();
        expect(state.transfers).toHaveLength(0);
      });

      it('should not affect other transfers', () => {
        const transfer1 = createMockTransfer({ id: 'transfer-1' });
        const transfer2 = createMockTransfer({ id: 'transfer-2' });

        useTransferStore.getState().addTransfer(transfer1);
        useTransferStore.getState().addTransfer(transfer2);

        useTransferStore.getState().removeTransfer('transfer-1');

        const state = useTransferStore.getState();
        expect(state.transfers).toHaveLength(1);
        expect(state.transfers[0]?.id).toBe('transfer-2');
      });
    });

    describe('clearTransfers', () => {
      it('should remove all transfers', () => {
        const transfer1 = createMockTransfer({ id: 'transfer-1' });
        const transfer2 = createMockTransfer({ id: 'transfer-2' });

        useTransferStore.getState().addTransfer(transfer1);
        useTransferStore.getState().addTransfer(transfer2);

        useTransferStore.getState().clearTransfers();

        const state = useTransferStore.getState();
        expect(state.transfers).toHaveLength(0);
      });
    });

    describe('clearCompleted', () => {
      it('should remove completed transfers', () => {
        const active = createMockTransfer({ id: 'transfer-1', status: 'transferring' });
        const completed = createMockTransfer({ id: 'transfer-2', status: 'completed' });
        const failed = createMockTransfer({ id: 'transfer-3', status: 'failed' });

        useTransferStore.getState().addTransfer(active);
        useTransferStore.getState().addTransfer(completed);
        useTransferStore.getState().addTransfer(failed);

        useTransferStore.getState().clearCompleted();

        const state = useTransferStore.getState();
        expect(state.transfers).toHaveLength(1);
        expect(state.transfers[0]?.status).toBe('transferring');
      });

      it('should remove cancelled transfers', () => {
        const active = createMockTransfer({ id: 'transfer-1', status: 'transferring' });
        const cancelled = createMockTransfer({ id: 'transfer-2', status: 'cancelled' });

        useTransferStore.getState().addTransfer(active);
        useTransferStore.getState().addTransfer(cancelled);

        useTransferStore.getState().clearCompleted();

        const state = useTransferStore.getState();
        expect(state.transfers).toHaveLength(1);
        expect(state.transfers[0]?.status).toBe('transferring');
      });
    });
  });

  describe('Optimistic Updates', () => {
    describe('addTransferOptimistic', () => {
      it('should add transfer and return rollback function', () => {
        const transfer = createMockTransfer({ id: 'transfer-1' });
        const rollback = useTransferStore.getState().addTransferOptimistic(transfer);

        const state = useTransferStore.getState();
        expect(state.transfers).toHaveLength(1);

        rollback();

        const stateAfterRollback = useTransferStore.getState();
        expect(stateAfterRollback.transfers).toHaveLength(0);
      });

      it('should preserve existing transfers on rollback', () => {
        const existing = createMockTransfer({ id: 'transfer-1' });
        const optimistic = createMockTransfer({ id: 'transfer-2' });

        useTransferStore.getState().addTransfer(existing);
        const rollback = useTransferStore.getState().addTransferOptimistic(optimistic);

        rollback();

        const state = useTransferStore.getState();
        expect(state.transfers).toHaveLength(1);
        expect(state.transfers[0]?.id).toBe('transfer-1');
      });
    });

    describe('updateTransferOptimistic', () => {
      it('should update transfer and return rollback function', () => {
        const transfer = createMockTransfer({ id: 'transfer-1', progress: 0 });
        useTransferStore.getState().addTransfer(transfer);

        const rollback = useTransferStore.getState().updateTransferOptimistic('transfer-1', {
          progress: 50,
        });

        const state = useTransferStore.getState();
        expect(state.transfers[0]?.progress).toBe(50);

        rollback();

        const stateAfterRollback = useTransferStore.getState();
        expect(stateAfterRollback.transfers[0]?.progress).toBe(0);
      });

      it('should return no-op function for non-existent transfer', () => {
        const rollback = useTransferStore.getState().updateTransferOptimistic('non-existent', {
          progress: 50,
        });

        expect(typeof rollback).toBe('function');
        rollback(); // Should not throw
      });
    });
  });

  describe('Transfer Control', () => {
    describe('pauseTransfer', () => {
      it('should pause transferring transfer', () => {
        const transfer = createMockTransfer({ id: 'transfer-1', status: 'transferring' });
        useTransferStore.getState().addTransfer(transfer);

        useTransferStore.getState().pauseTransfer('transfer-1');

        const state = useTransferStore.getState();
        expect(state.transfers[0]?.status).toBe('paused');
      });

      it('should not pause non-transferring transfers', () => {
        const transfer = createMockTransfer({ id: 'transfer-1', status: 'pending' });
        useTransferStore.getState().addTransfer(transfer);

        useTransferStore.getState().pauseTransfer('transfer-1');

        const state = useTransferStore.getState();
        expect(state.transfers[0]?.status).toBe('pending');
      });
    });

    describe('resumeTransfer', () => {
      it('should resume paused transfer', () => {
        const transfer = createMockTransfer({ id: 'transfer-1', status: 'paused' });
        useTransferStore.getState().addTransfer(transfer);

        useTransferStore.getState().resumeTransfer('transfer-1');

        const state = useTransferStore.getState();
        expect(state.transfers[0]?.status).toBe('transferring');
      });

      it('should not resume non-paused transfers', () => {
        const transfer = createMockTransfer({ id: 'transfer-1', status: 'completed' });
        useTransferStore.getState().addTransfer(transfer);

        useTransferStore.getState().resumeTransfer('transfer-1');

        const state = useTransferStore.getState();
        expect(state.transfers[0]?.status).toBe('completed');
      });
    });

    describe('cancelTransfer', () => {
      it('should cancel any transfer', () => {
        const transfer = createMockTransfer({ id: 'transfer-1', status: 'transferring' });
        useTransferStore.getState().addTransfer(transfer);

        useTransferStore.getState().cancelTransfer('transfer-1');

        const state = useTransferStore.getState();
        expect(state.transfers[0]?.status).toBe('cancelled');
      });
    });

    describe('retryTransfer', () => {
      it('should reset failed transfer to pending', () => {
        const transfer = createMockTransfer({
          id: 'transfer-1',
          status: 'failed',
          progress: 50,
          error: { type: 'transfer', code: 'TRANSFER_FAILED', message: 'Failed', timestamp: Date.now() },
        });
        useTransferStore.getState().addTransfer(transfer);

        useTransferStore.getState().retryTransfer('transfer-1');

        const state = useTransferStore.getState();
        expect(state.transfers[0]?.status).toBe('pending');
        expect(state.transfers[0]?.progress).toBe(0);
        expect(state.transfers[0]?.error).toBeNull();
      });

      it('should reset cancelled transfer to pending', () => {
        const transfer = createMockTransfer({ id: 'transfer-1', status: 'cancelled', progress: 75 });
        useTransferStore.getState().addTransfer(transfer);

        useTransferStore.getState().retryTransfer('transfer-1');

        const state = useTransferStore.getState();
        expect(state.transfers[0]?.status).toBe('pending');
        expect(state.transfers[0]?.progress).toBe(0);
      });

      it('should not retry successful transfers', () => {
        const transfer = createMockTransfer({ id: 'transfer-1', status: 'completed', progress: 100 });
        useTransferStore.getState().addTransfer(transfer);

        useTransferStore.getState().retryTransfer('transfer-1');

        const state = useTransferStore.getState();
        expect(state.transfers[0]?.status).toBe('completed');
        expect(state.transfers[0]?.progress).toBe(100);
      });
    });

    describe('pauseAll', () => {
      it('should pause all transferring transfers', () => {
        const transfer1 = createMockTransfer({ id: 'transfer-1', status: 'transferring' });
        const transfer2 = createMockTransfer({ id: 'transfer-2', status: 'transferring' });
        const transfer3 = createMockTransfer({ id: 'transfer-3', status: 'pending' });

        useTransferStore.getState().addTransfer(transfer1);
        useTransferStore.getState().addTransfer(transfer2);
        useTransferStore.getState().addTransfer(transfer3);

        useTransferStore.getState().pauseAll();

        const state = useTransferStore.getState();
        expect(state.transfers[0]?.status).toBe('paused');
        expect(state.transfers[1]?.status).toBe('paused');
        expect(state.transfers[2]?.status).toBe('pending');
      });
    });

    describe('resumeAll', () => {
      it('should resume all paused transfers', () => {
        const transfer1 = createMockTransfer({ id: 'transfer-1', status: 'paused' });
        const transfer2 = createMockTransfer({ id: 'transfer-2', status: 'paused' });
        const transfer3 = createMockTransfer({ id: 'transfer-3', status: 'completed' });

        useTransferStore.getState().addTransfer(transfer1);
        useTransferStore.getState().addTransfer(transfer2);
        useTransferStore.getState().addTransfer(transfer3);

        useTransferStore.getState().resumeAll();

        const state = useTransferStore.getState();
        expect(state.transfers[0]?.status).toBe('transferring');
        expect(state.transfers[1]?.status).toBe('transferring');
        expect(state.transfers[2]?.status).toBe('completed');
      });
    });
  });

  describe('Queue Management', () => {
    describe('addToQueue', () => {
      it('should add files to queue', () => {
        const file1 = new File(['content1'], 'file1.txt');
        const file2 = new File(['content2'], 'file2.txt');

        useTransferStore.getState().addToQueue([file1, file2]);

        const state = useTransferStore.getState();
        expect(state.queue).toHaveLength(2);
      });

      it('should append to existing queue', () => {
        const file1 = new File(['content1'], 'file1.txt');
        const file2 = new File(['content2'], 'file2.txt');

        useTransferStore.getState().addToQueue([file1]);
        useTransferStore.getState().addToQueue([file2]);

        const state = useTransferStore.getState();
        expect(state.queue).toHaveLength(2);
      });
    });

    describe('removeFromQueue', () => {
      it('should remove file at index', () => {
        const file1 = new File(['content1'], 'file1.txt');
        const file2 = new File(['content2'], 'file2.txt');
        const file3 = new File(['content3'], 'file3.txt');

        useTransferStore.getState().addToQueue([file1, file2, file3]);
        useTransferStore.getState().removeFromQueue(1);

        const state = useTransferStore.getState();
        expect(state.queue).toHaveLength(2);
        expect(state.queue[0]).toBe(file1);
        expect(state.queue[1]).toBe(file3);
      });
    });

    describe('clearQueue', () => {
      it('should clear all queued files', () => {
        const file1 = new File(['content1'], 'file1.txt');
        const file2 = new File(['content2'], 'file2.txt');

        useTransferStore.getState().addToQueue([file1, file2]);
        useTransferStore.getState().clearQueue();

        const state = useTransferStore.getState();
        expect(state.queue).toHaveLength(0);
      });
    });
  });

  describe('Progress Management', () => {
    describe('setUploadProgress', () => {
      it('should set upload progress', () => {
        useTransferStore.getState().setUploadProgress(50);

        const state = useTransferStore.getState();
        expect(state.progress.uploadProgress).toBe(50);
      });

      it('should clamp progress to 0-100 range', () => {
        useTransferStore.getState().setUploadProgress(150);
        let state = useTransferStore.getState();
        expect(state.progress.uploadProgress).toBe(100);

        useTransferStore.getState().setUploadProgress(-50);
        state = useTransferStore.getState();
        expect(state.progress.uploadProgress).toBe(0);
      });
    });

    describe('setDownloadProgress', () => {
      it('should set download progress', () => {
        useTransferStore.getState().setDownloadProgress(75);

        const state = useTransferStore.getState();
        expect(state.progress.downloadProgress).toBe(75);
      });

      it('should clamp progress to 0-100 range', () => {
        useTransferStore.getState().setDownloadProgress(200);
        let state = useTransferStore.getState();
        expect(state.progress.downloadProgress).toBe(100);

        useTransferStore.getState().setDownloadProgress(-25);
        state = useTransferStore.getState();
        expect(state.progress.downloadProgress).toBe(0);
      });
    });

    describe('resetProgress', () => {
      it('should reset both upload and download progress', () => {
        useTransferStore.getState().setUploadProgress(50);
        useTransferStore.getState().setDownloadProgress(75);

        useTransferStore.getState().resetProgress();

        const state = useTransferStore.getState();
        expect(state.progress.uploadProgress).toBe(0);
        expect(state.progress.downloadProgress).toBe(0);
      });
    });
  });

  describe('Current Transfer Management', () => {
    describe('setCurrentTransfer', () => {
      it('should set current transfer details', () => {
        useTransferStore.getState().setCurrentTransfer('test.txt', 1024, 'text/plain', 'peer-1');

        const state = useTransferStore.getState();
        expect(state.currentTransfer.fileName).toBe('test.txt');
        expect(state.currentTransfer.fileSize).toBe(1024);
        expect(state.currentTransfer.fileType).toBe('text/plain');
        expect(state.currentTransfer.peerId).toBe('peer-1');
      });
    });

    describe('setIsTransferring', () => {
      it('should set transferring flag', () => {
        useTransferStore.getState().setIsTransferring(true);

        const state = useTransferStore.getState();
        expect(state.currentTransfer.isTransferring).toBe(true);
      });
    });

    describe('setIsReceiving', () => {
      it('should set receiving flag', () => {
        useTransferStore.getState().setIsReceiving(true);

        const state = useTransferStore.getState();
        expect(state.currentTransfer.isReceiving).toBe(true);
      });
    });

    describe('clearCurrentTransfer', () => {
      it('should reset current transfer', () => {
        useTransferStore.getState().setCurrentTransfer('test.txt', 1024, 'text/plain', 'peer-1');
        useTransferStore.getState().setIsTransferring(true);

        useTransferStore.getState().clearCurrentTransfer();

        const state = useTransferStore.getState();
        expect(state.currentTransfer.fileName).toBeNull();
        expect(state.currentTransfer.fileSize).toBe(0);
        expect(state.currentTransfer.isTransferring).toBe(false);
      });
    });
  });

  describe('Selectors', () => {
    describe('getTransferById', () => {
      it('should return transfer by ID', () => {
        const transfer = createMockTransfer({ id: 'transfer-1' });
        useTransferStore.getState().addTransfer(transfer);

        const result = useTransferStore.getState().getTransferById('transfer-1');

        expect(result).toEqual(transfer);
      });

      it('should return undefined for non-existent ID', () => {
        const result = useTransferStore.getState().getTransferById('non-existent');

        expect(result).toBeUndefined();
      });
    });

    describe('getActiveTransfers', () => {
      it('should return active transfers', () => {
        const transferring = createMockTransfer({ id: 'transfer-1', status: 'transferring' });
        const pending = createMockTransfer({ id: 'transfer-2', status: 'pending' });
        const paused = createMockTransfer({ id: 'transfer-3', status: 'paused' });
        const completed = createMockTransfer({ id: 'transfer-4', status: 'completed' });

        useTransferStore.getState().addTransfer(transferring);
        useTransferStore.getState().addTransfer(pending);
        useTransferStore.getState().addTransfer(paused);
        useTransferStore.getState().addTransfer(completed);

        const result = useTransferStore.getState().getActiveTransfers();

        expect(result).toHaveLength(3);
        expect(result.map(t => t.status)).toEqual(
          expect.arrayContaining(['transferring', 'pending', 'paused'])
        );
      });
    });

    describe('getCompletedTransfers', () => {
      it('should return only completed transfers', () => {
        const transferring = createMockTransfer({ id: 'transfer-1', status: 'transferring' });
        const completed = createMockTransfer({ id: 'transfer-2', status: 'completed' });

        useTransferStore.getState().addTransfer(transferring);
        useTransferStore.getState().addTransfer(completed);

        const result = useTransferStore.getState().getCompletedTransfers();

        expect(result).toHaveLength(1);
        expect(result[0]?.status).toBe('completed');
      });
    });

    describe('getFailedTransfers', () => {
      it('should return failed and cancelled transfers', () => {
        const failed = createMockTransfer({ id: 'transfer-1', status: 'failed' });
        const cancelled = createMockTransfer({ id: 'transfer-2', status: 'cancelled' });
        const completed = createMockTransfer({ id: 'transfer-3', status: 'completed' });

        useTransferStore.getState().addTransfer(failed);
        useTransferStore.getState().addTransfer(cancelled);
        useTransferStore.getState().addTransfer(completed);

        const result = useTransferStore.getState().getFailedTransfers();

        expect(result).toHaveLength(2);
        expect(result.map(t => t.status)).toEqual(expect.arrayContaining(['failed', 'cancelled']));
      });
    });

    describe('getStats', () => {
      it('should calculate transfer statistics', () => {
        const active1 = createMockTransfer({
          id: 'transfer-1',
          status: 'transferring',
          totalSize: 1000,
          progress: 50,
          speed: 100,
        });
        const active2 = createMockTransfer({
          id: 'transfer-2',
          status: 'transferring',
          totalSize: 2000,
          progress: 25,
          speed: 200,
        });
        const completed = createMockTransfer({
          id: 'transfer-3',
          status: 'completed',
          totalSize: 1000,
          progress: 100,
        });
        const failed = createMockTransfer({
          id: 'transfer-4',
          status: 'failed',
        });

        useTransferStore.getState().addTransfer(active1);
        useTransferStore.getState().addTransfer(active2);
        useTransferStore.getState().addTransfer(completed);
        useTransferStore.getState().addTransfer(failed);

        const stats = useTransferStore.getState().getStats();

        expect(stats.totalActive).toBe(2);
        expect(stats.totalCompleted).toBe(1);
        expect(stats.totalFailed).toBe(1);
        expect(stats.totalSize).toBe(3000);
        expect(stats.averageSpeed).toBe(150); // (100 + 200) / 2
      });

      it('should handle empty transfers', () => {
        const stats = useTransferStore.getState().getStats();

        expect(stats.totalActive).toBe(0);
        expect(stats.totalCompleted).toBe(0);
        expect(stats.totalFailed).toBe(0);
        expect(stats.totalSize).toBe(0);
        expect(stats.averageSpeed).toBe(0);
      });
    });
  });

  describe('Loading States', () => {
    it('should set loading state', () => {
      useTransferStore.getState().setLoading(true);

      const state = useTransferStore.getState();
      expect(state.isLoading).toBe(true);
    });

    it('should set initialized state', () => {
      useTransferStore.getState().setInitialized();

      const state = useTransferStore.getState();
      expect(state.isInitialized).toBe(true);
    });
  });
});

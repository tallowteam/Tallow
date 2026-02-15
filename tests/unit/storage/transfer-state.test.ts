import { beforeEach, describe, expect, it, vi } from 'vitest';

const storageMap = vi.hoisted(() => new Map<string, string>());

vi.mock('@/lib/storage/secure-storage', () => {
  const secureStorage = {
    getItem: vi.fn(async (key: string) => storageMap.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      storageMap.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      storageMap.delete(key);
    }),
    clear: vi.fn(() => {
      storageMap.clear();
    }),
    migrateKey: vi.fn(async () => {}),
    isEncrypted: vi.fn(() => false),
  };

  return {
    secureStorage,
    default: secureStorage,
    getSecureStorage: vi.fn(async () => secureStorage),
  };
});

import {
  canResumeTransfer,
  createTransferState,
  getMissingChunks,
  getTransferState,
  getTransferStates,
  updateTransferProgress,
  pauseTransfer,
} from '@/lib/storage/transfer-state';

describe('transfer-state persistence', () => {
  beforeEach(() => {
    storageMap.clear();
  });

  it('persists progress and restores missing chunks after reconnect', async () => {
    await createTransferState(
      'transfer-1',
      'archive.zip',
      'application/zip',
      4096,
      1024,
      'peer-1'
    );

    await updateTransferProgress('transfer-1', 0, new ArrayBuffer(1024));
    await updateTransferProgress('transfer-1', 2, new ArrayBuffer(1024));
    await pauseTransfer('transfer-1');

    const restored = await getTransferState('transfer-1');
    const missing = await getMissingChunks('transfer-1');
    const allStates = await getTransferStates();

    expect(restored?.status).toBe('paused');
    expect(restored?.receivedChunks).toEqual([0, 2]);
    expect(restored?.lastUpdated).toBeInstanceOf(Date);
    expect(missing).toEqual([1, 3]);
    expect(await canResumeTransfer('transfer-1')).toBe(true);
    expect(Object.keys(allStates)).toContain('transfer-1');
  });

  it('stops advertising resume once all chunks are confirmed', async () => {
    await createTransferState(
      'transfer-2',
      'video.mp4',
      'video/mp4',
      4096,
      1024,
      'peer-2'
    );

    for (let i = 0; i < 4; i++) {
      await updateTransferProgress('transfer-2', i, new ArrayBuffer(1024));
    }

    const completed = await getTransferState('transfer-2');

    expect(completed?.status).toBe('completed');
    expect(await getMissingChunks('transfer-2')).toEqual([]);
    expect(await canResumeTransfer('transfer-2')).toBe(false);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createTransferState: vi.fn(),
  getTransferState: vi.fn(),
  updateTransferState: vi.fn(),
  saveChunk: vi.fn(),
  getAllChunks: vi.fn(),
  getResumableTransfers: vi.fn(),
  deleteTransfer: vi.fn(),
  cleanupExpiredTransfers: vi.fn(),
  exportChunkBitmap: vi.fn((bitmap: number[]) =>
    bitmap.map((value) => value.toString(16).padStart(2, '0')).join('')
  ),
  importChunkBitmap: vi.fn((bitmapHex: string) => {
    const bitmap: number[] = [];
    for (let i = 0; i < bitmapHex.length; i += 2) {
      bitmap.push(parseInt(bitmapHex.slice(i, i + 2), 16));
    }
    return bitmap;
  }),
}));

vi.mock('@/lib/storage/transfer-state-db', () => ({
  createTransferState: mocks.createTransferState,
  getTransferState: mocks.getTransferState,
  updateTransferState: mocks.updateTransferState,
  saveChunk: mocks.saveChunk,
  getAllChunks: mocks.getAllChunks,
  getResumableTransfers: mocks.getResumableTransfers,
  deleteTransfer: mocks.deleteTransfer,
  cleanupExpiredTransfers: mocks.cleanupExpiredTransfers,
  exportChunkBitmap: mocks.exportChunkBitmap,
  importChunkBitmap: mocks.importChunkBitmap,
}));

vi.mock('@/lib/utils/secure-logger', () => ({
  default: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { ResumablePQCTransferManager } from '@/lib/transfer/resumable-transfer';

function makeMetadata(overrides: Record<string, unknown> = {}) {
  return {
    transferId: 'transfer-1',
    fileName: 'archive.zip',
    fileType: 'application/zip',
    fileSize: 8 * 64 * 1024,
    fileHash: new Uint8Array(32),
    totalChunks: 8,
    chunkSize: 64 * 1024,
    peerId: 'peer-1',
    direction: 'send' as const,
    receivedChunks: 4,
    chunkBitmap: [0b00001111],
    startedAt: new Date(),
    lastUpdated: new Date(),
    status: 'paused' as const,
    ...overrides,
  };
}

describe('ResumablePQCTransferManager', () => {
  beforeEach(() => {
    mocks.createTransferState.mockReset();
    mocks.getTransferState.mockReset();
    mocks.updateTransferState.mockReset();
    mocks.saveChunk.mockReset();
    mocks.getAllChunks.mockReset();
    mocks.getResumableTransfers.mockReset();
    mocks.deleteTransfer.mockReset();
    mocks.cleanupExpiredTransfers.mockReset();
    mocks.exportChunkBitmap.mockClear();
    mocks.importChunkBitmap.mockClear();
    mocks.cleanupExpiredTransfers.mockResolvedValue(0);
  });

  it('restores from last confirmed chunk by requesting only missing chunks', async () => {
    const dataChannelSend = vi.fn();
    const manager = new ResumablePQCTransferManager({
      resumeTimeout: 1000,
      maxResumeAttempts: 2,
    });
    manager.setDataChannel({
      readyState: 'open',
      send: dataChannelSend,
    } as unknown as RTCDataChannel);

    mocks.getTransferState.mockResolvedValue(makeMetadata());

    const pendingResume = manager.resumeTransfer('transfer-1');
    await Promise.resolve();

    expect(dataChannelSend).toHaveBeenCalledTimes(1);
    expect(JSON.parse(dataChannelSend.mock.calls[0][0])).toMatchObject({
      type: 'resume-request',
      payload: { transferId: 'transfer-1' },
    });

    await manager.handleIncomingMessage(
      JSON.stringify({
        type: 'resume-response',
        payload: {
          transferId: 'transfer-1',
          chunkBitmap: '0f',
          canResume: true,
        },
      })
    );

    await pendingResume;

    expect(dataChannelSend).toHaveBeenCalledTimes(2);
    expect(JSON.parse(dataChannelSend.mock.calls[1][0])).toMatchObject({
      type: 'resume-chunk-request',
      payload: {
        transferId: 'transfer-1',
        chunkIndices: [4, 5, 6, 7],
      },
    });
  });
});

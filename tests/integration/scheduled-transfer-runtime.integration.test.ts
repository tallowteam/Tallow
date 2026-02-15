import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const runtimeMocks = vi.hoisted(() => ({
  nextId: 1,
  addTransfer: vi.fn(),
  addTransferToStore: vi.fn(),
}));

vi.mock('@/lib/utils/uuid', () => ({
  generateUUID: () => `runtime-${runtimeMocks.nextId++}`,
}));

vi.mock('@/lib/utils/secure-logger', () => ({
  default: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/stores/device-store', () => ({
  useDeviceStore: {
    getState: () => ({
      getDeviceById: (id: string) => ({
        id,
        name: 'Integration Peer',
        platform: 'web',
        ip: null,
        port: null,
        isOnline: true,
        isFavorite: false,
        lastSeen: Date.now(),
        avatar: null,
      }),
    }),
  },
}));

vi.mock('@/lib/stores/transfer-store', () => ({
  useTransferStore: {
    getState: () => ({
      addTransfer: runtimeMocks.addTransferToStore,
    }),
  },
}));

vi.mock('@/lib/transfer/transfer-manager', () => {
  class TransferManagerMock {
    static getInstance() {
      return {
        addTransfer: runtimeMocks.addTransfer,
      };
    }
  }

  return {
    default: TransferManagerMock,
  };
});

async function loadScheduledModule() {
  vi.resetModules();
  return import('@/lib/transfer/scheduled-transfer');
}

describe('scheduled-transfer runtime integration', () => {
  beforeEach(() => {
    localStorage.clear();
    runtimeMocks.nextId = 1;
    runtimeMocks.addTransfer.mockReset();
    runtimeMocks.addTransferToStore.mockReset();
    runtimeMocks.addTransfer.mockReturnValue({
      id: 'transfer-runtime',
      status: 'pending',
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-12T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('executes scheduled transfer and syncs state with store + localStorage', async () => {
    const scheduled = await loadScheduledModule();
    const listener = vi.fn();
    const unsubscribe = scheduled.onScheduledTransfersChange(listener);

    const scheduleId = scheduled.scheduleTransfer({
      files: [new File(['integration'], 'integration.txt', { type: 'text/plain' })],
      deviceId: 'integration-device',
      scheduledTime: new Date(Date.now() + 250),
      repeat: 'once',
      autoRetry: true,
      maxRetries: 2,
    });

    expect(scheduleId).toBe('runtime-1');
    expect(listener).toHaveBeenCalled();
    const storedBeforeExecution = localStorage.getItem('tallow-scheduled-transfers');
    expect(storedBeforeExecution === null ? false : storedBeforeExecution.includes(scheduleId) || storedBeforeExecution.startsWith('enc:')).toBe(true);

    await vi.advanceTimersByTimeAsync(500);

    expect(runtimeMocks.addTransfer).toHaveBeenCalledTimes(1);
    expect(runtimeMocks.addTransferToStore).toHaveBeenCalledTimes(1);
    expect(scheduled.getScheduledTransfer(scheduleId)?.status).toBe('completed');
    const storedAfterExecution = localStorage.getItem('tallow-scheduled-transfers');
    expect(storedAfterExecution === null ? false : storedAfterExecution.includes('"status":"completed"') || storedAfterExecution.startsWith('enc:')).toBe(true);

    unsubscribe();
    scheduled.cleanupScheduledTransfers();
  });
});

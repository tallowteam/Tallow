import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const scheduledMocks = vi.hoisted(() => ({
  nextId: 1,
  online: true,
  targetDeviceId: 'device-1',
  transferManagerAddTransfer: vi.fn(),
  transferStoreAddTransfer: vi.fn(),
}));

vi.mock('@/lib/utils/uuid', () => ({
  generateUUID: () => `scheduled-${scheduledMocks.nextId++}`,
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
      getDeviceById: (id: string) => {
        if (id !== scheduledMocks.targetDeviceId) {
          return null;
        }
        return {
          id,
          name: 'Peer Device',
          platform: 'web',
          ip: null,
          port: null,
          isOnline: scheduledMocks.online,
          isFavorite: false,
          lastSeen: Date.now(),
          avatar: null,
        };
      },
    }),
  },
}));

vi.mock('@/lib/stores/transfer-store', () => ({
  useTransferStore: {
    getState: () => ({
      addTransfer: scheduledMocks.transferStoreAddTransfer,
    }),
  },
}));

vi.mock('@/lib/transfer/transfer-manager', () => {
  class MockTransferManager {
    static getInstance() {
      return {
        addTransfer: scheduledMocks.transferManagerAddTransfer,
      };
    }
  }

  return {
    default: MockTransferManager,
  };
});

async function loadScheduledModule() {
  vi.resetModules();
  return import('@/lib/transfer/scheduled-transfer');
}

function createFile(name = 'sample.txt') {
  return new File(['payload'], name, { type: 'text/plain', lastModified: Date.now() });
}

describe('scheduled-transfer', () => {
  beforeEach(() => {
    localStorage.clear();
    scheduledMocks.nextId = 1;
    scheduledMocks.online = true;
    scheduledMocks.transferManagerAddTransfer.mockReset();
    scheduledMocks.transferStoreAddTransfer.mockReset();
    scheduledMocks.transferManagerAddTransfer.mockReturnValue({
      id: 'runtime-transfer-1',
      status: 'pending',
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-12T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('schedules transfers and persists to localStorage', async () => {
    const scheduled = await loadScheduledModule();
    const scheduledTime = new Date(Date.now() + 60_000);

    const id = scheduled.scheduleTransfer({
      files: [createFile()],
      deviceId: scheduledMocks.targetDeviceId,
      scheduledTime,
      repeat: 'once',
    });

    expect(id).toBe('scheduled-1');
    expect(scheduled.getScheduledTransfer(id)?.status).toBe('scheduled');

    const stored = localStorage.getItem('tallow-scheduled-transfers');
    expect(stored === null ? false : stored.includes(id) || stored.startsWith('enc:')).toBe(true);

    scheduled.cleanupScheduledTransfers();
  });

  it('cancels scheduled transfers and prevents timer execution', async () => {
    const scheduled = await loadScheduledModule();
    const id = scheduled.scheduleTransfer({
      files: [createFile()],
      deviceId: scheduledMocks.targetDeviceId,
      scheduledTime: new Date(Date.now() + 1_000),
      repeat: 'once',
    });

    expect(scheduled.cancelScheduled(id)).toBe(true);
    expect(scheduled.getScheduledTransfer(id)?.status).toBe('cancelled');

    await vi.advanceTimersByTimeAsync(2_000);
    expect(scheduledMocks.transferManagerAddTransfer).not.toHaveBeenCalled();

    scheduled.cleanupScheduledTransfers();
  });

  it('retries when device is unavailable and fails after max retries', async () => {
    const scheduled = await loadScheduledModule();
    scheduledMocks.online = false;

    const id = scheduled.scheduleTransfer({
      files: [createFile('retry.txt')],
      deviceId: scheduledMocks.targetDeviceId,
      scheduledTime: new Date(Date.now() + 100),
      repeat: 'once',
      autoRetry: true,
      maxRetries: 1,
    });

    await vi.advanceTimersByTimeAsync(200);

    const afterFirstAttempt = scheduled.getScheduledTransfer(id);
    expect(afterFirstAttempt?.retryCount).toBe(1);
    expect(afterFirstAttempt?.status).toBe('scheduled');
    expect(afterFirstAttempt?.nextRun).not.toBeNull();

    await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 100);

    const afterRetry = scheduled.getScheduledTransfer(id);
    expect(afterRetry?.status).toBe('failed');
    expect(afterRetry?.error).toBe('Device unavailable');
    expect(scheduledMocks.transferManagerAddTransfer).not.toHaveBeenCalled();

    scheduled.cleanupScheduledTransfers();
  });

  it('calculates the next run for repeating daily transfers', async () => {
    const scheduled = await loadScheduledModule();
    const baseTime = Date.now() + 100;

    const id = scheduled.scheduleTransfer({
      files: [createFile('daily.txt')],
      deviceId: scheduledMocks.targetDeviceId,
      scheduledTime: new Date(baseTime),
      repeat: 'daily',
      autoRetry: false,
    });

    await vi.advanceTimersByTimeAsync(200);

    const transfer = scheduled.getScheduledTransfer(id);
    expect(transfer?.status).toBe('scheduled');
    expect(transfer?.nextRun).not.toBeNull();
    expect(transfer?.nextRun ?? 0).toBeGreaterThan(baseTime + 23 * 60 * 60 * 1000);
    expect(scheduledMocks.transferManagerAddTransfer).toHaveBeenCalledTimes(1);
    expect(scheduledMocks.transferStoreAddTransfer).toHaveBeenCalledTimes(1);

    scheduled.cleanupScheduledTransfers();
  });

  it('notifies subscribers when schedules change', async () => {
    const scheduled = await loadScheduledModule();
    const listener = vi.fn();
    const unsubscribe = scheduled.onScheduledTransfersChange(listener);

    scheduled.scheduleTransfer({
      files: [createFile('listener.txt')],
      deviceId: scheduledMocks.targetDeviceId,
      scheduledTime: new Date(Date.now() + 1_000),
      repeat: 'once',
    });

    expect(listener).toHaveBeenCalled();
    unsubscribe();
    scheduled.cleanupScheduledTransfers();
  });

  it('fails execution when scheduled-transfer reauth is stale', async () => {
    const scheduled = await loadScheduledModule();
    const id = scheduled.scheduleTransfer({
      files: [createFile('reauth.txt')],
      deviceId: scheduledMocks.targetDeviceId,
      scheduledTime: new Date(Date.now() + 100),
      repeat: 'once',
      autoRetry: false,
    });

    scheduled.reauthenticateScheduledTransfers(Date.now() - (11 * 60 * 1000));
    await vi.advanceTimersByTimeAsync(200);

    const state = scheduled.getScheduledTransfer(id);
    expect(state?.status).toBe('failed');
    expect(state?.error).toBe('Re-authentication required before scheduled transfer execution');
    expect(scheduledMocks.transferManagerAddTransfer).not.toHaveBeenCalled();

    scheduled.cleanupScheduledTransfers();
  });
});

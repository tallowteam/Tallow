import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFileTransfer } from '@/lib/hooks/use-file-transfer';
import { useNotifications } from '@/lib/hooks/use-notifications';
import { useOnboarding } from '@/lib/hooks/use-onboarding';

const toastMocks = vi.hoisted(() => ({
  addToast: vi.fn(() => 'toast-id-lifecycle'),
  removeToast: vi.fn(),
  clearAll: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}));

const settingsMock = vi.hoisted(() => ({
  notificationSound: true,
  notificationVolume: 0.5,
  browserNotifications: true,
  notifyOnTransferComplete: true,
  notifyOnIncomingTransfer: true,
  notifyOnConnectionChange: true,
  notifyOnDeviceDiscovered: true,
  silentHoursEnabled: false,
  silentHoursStart: '22:00',
  silentHoursEnd: '08:00',
}));

const notificationManagerMock = vi.hoisted(() => ({
  registerNotificationCallback: vi.fn(),
  updateSettings: vi.fn(),
  setVolume: vi.fn(),
  setMuted: vi.fn(),
  transferStarted: vi.fn(),
  transferComplete: vi.fn(),
  transferFailed: vi.fn(),
  connectionEstablished: vi.fn(),
  connectionLost: vi.fn(),
  deviceDiscovered: vi.fn(),
  incomingTransferRequest: vi.fn(),
  connectionRequest: vi.fn(() => 'connection-toast-id'),
  requestPermission: vi.fn().mockResolvedValue(undefined),
  isBrowserNotificationsAvailable: vi.fn(() => true),
  isBrowserNotificationsDenied: vi.fn(() => false),
}));

vi.mock('@/lib/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    addToast: toastMocks.addToast,
    removeToast: toastMocks.removeToast,
    clearAll: toastMocks.clearAll,
    success: toastMocks.success,
    error: toastMocks.error,
    warning: toastMocks.warning,
    info: toastMocks.info,
  })),
}));

vi.mock('@/lib/stores', () => ({
  useSettingsStore: vi.fn(() => settingsMock),
}));

vi.mock('@/lib/utils/notification-manager', () => ({
  notificationManager: notificationManagerMock,
}));

describe('Hook lifecycle discipline', () => {
  let mockLocalStorage: Record<string, string>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage = {};

    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('useFileTransfer resets in-memory queue after unmount/remount', () => {
    const firstMount = renderHook(() => useFileTransfer());

    act(() => {
      firstMount.result.current.addFiles([
        new File(['hello'], 'hello.txt', { type: 'text/plain' }),
      ]);
    });

    expect(firstMount.result.current.files).toHaveLength(1);

    firstMount.unmount();

    const secondMount = renderHook(() => useFileTransfer());
    expect(secondMount.result.current.files).toHaveLength(0);
  });

  it('useOnboarding restores persisted state after unmount/remount', () => {
    const firstMount = renderHook(() => useOnboarding());

    act(() => {
      firstMount.result.current.start();
      firstMount.result.current.next();
    });

    expect(firstMount.result.current.state.currentStep).toBe(1);
    expect(firstMount.result.current.state.isActive).toBe(true);

    firstMount.unmount();

    const secondMount = renderHook(() => useOnboarding());
    expect(secondMount.result.current.state.currentStep).toBe(1);
    expect(secondMount.result.current.state.isActive).toBe(true);
  });

  it('useNotifications clears pending auto-reject timers on unmount', () => {
    vi.useFakeTimers();
    const onAccept = vi.fn();
    const onReject = vi.fn();

    const { result, unmount } = renderHook(() => useNotifications());

    act(() => {
      result.current.notifyIncomingTransferRequest(
        'Peer Device',
        'lifecycle-test.txt',
        onAccept,
        onReject
      );
    });

    expect(notificationManagerMock.incomingTransferRequest).toHaveBeenCalledWith(
      'Peer Device',
      'lifecycle-test.txt'
    );

    unmount();

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(onReject).not.toHaveBeenCalled();
    expect(toastMocks.removeToast).not.toHaveBeenCalled();
  });
});

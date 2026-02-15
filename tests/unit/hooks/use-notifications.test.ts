/**
 * Unit tests for useNotifications hook
 * Tests notification management and toast integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '@/lib/hooks/use-notifications';

// Mock useToast hook
const toastMocks = vi.hoisted(() => ({
  addToast: vi.fn(() => 'toast-id-123'),
  removeToast: vi.fn(),
  clearAll: vi.fn(),
  success: vi.fn(() => 'success-toast-id'),
  error: vi.fn(() => 'error-toast-id'),
  warning: vi.fn(() => 'warning-toast-id'),
  info: vi.fn(() => 'info-toast-id'),
}));

const mockAddToast = toastMocks.addToast;
const mockRemoveToast = toastMocks.removeToast;
const mockClearAll = toastMocks.clearAll;
const mockSuccess = toastMocks.success;
const mockError = toastMocks.error;
const mockWarning = toastMocks.warning;
const mockInfo = toastMocks.info;

vi.mock('@/lib/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    addToast: mockAddToast,
    removeToast: mockRemoveToast,
    clearAll: mockClearAll,
    success: mockSuccess,
    error: mockError,
    warning: mockWarning,
    info: mockInfo,
  })),
}));

// Mock useSettingsStore
const mockSettings = vi.hoisted(() => ({
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

vi.mock('@/lib/stores', () => ({
  useSettingsStore: vi.fn(() => mockSettings),
}));

// Mock notification manager
const mockNotificationManager = vi.hoisted(() => ({
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
  connectionRequest: vi.fn((_deviceName, _deviceId, _onAccept, _onReject) => 'connection-toast-id'),
  requestPermission: vi.fn().mockResolvedValue(undefined),
  isBrowserNotificationsAvailable: vi.fn(() => true),
  isBrowserNotificationsDenied: vi.fn(() => false),
}));

vi.mock('@/lib/utils/notification-manager', () => ({
  notificationManager: mockNotificationManager,
}));

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should register notification callback with manager', () => {
      renderHook(() => useNotifications());

      expect(mockNotificationManager.registerNotificationCallback).toHaveBeenCalled();
    });

    it('should update notification manager settings on mount', () => {
      renderHook(() => useNotifications());

      expect(mockNotificationManager.updateSettings).toHaveBeenCalledWith({
        notificationSound: true,
        browserNotifications: true,
        notifyOnTransferComplete: true,
        notifyOnIncomingTransfer: true,
        notifyOnConnectionChange: true,
        notifyOnDeviceDiscovered: true,
        silentHoursEnabled: false,
        silentHoursStart: '22:00',
        silentHoursEnd: '08:00',
      });

      expect(mockNotificationManager.setVolume).toHaveBeenCalledWith(0.5);
      expect(mockNotificationManager.setMuted).toHaveBeenCalledWith(false);
    });

    it('should mute sound when notificationSound is disabled', () => {
      mockSettings.notificationSound = false;

      renderHook(() => useNotifications());

      expect(mockNotificationManager.setMuted).toHaveBeenCalledWith(true);

      mockSettings.notificationSound = true; // Reset
    });
  });

  describe('General Notifications', () => {
    it('should show a notification with default variant', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.notify({
          message: 'Test notification',
        });
      });

      expect(mockAddToast).toHaveBeenCalledWith({
        message: 'Test notification',
        variant: 'info',
      });
    });

    it('should show notification with custom variant', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.notify({
          message: 'Success message',
          variant: 'success',
        });
      });

      expect(mockAddToast).toHaveBeenCalledWith({
        message: 'Success message',
        variant: 'success',
      });
    });

    it('should show notification with title', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.notify({
          title: 'Custom Title',
          message: 'Test message',
          variant: 'warning',
        });
      });

      expect(mockAddToast).toHaveBeenCalledWith({
        title: 'Custom Title',
        message: 'Test message',
        variant: 'warning',
      });
    });

    it('should show notification with custom duration', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.notify({
          message: 'Test message',
          duration: 10000,
        });
      });

      expect(mockAddToast).toHaveBeenCalledWith({
        message: 'Test message',
        variant: 'info',
        duration: 10000,
      });
    });

    it('should show notification with action', () => {
      const { result } = renderHook(() => useNotifications());
      const action = {
        label: 'Undo',
        onClick: vi.fn(),
      };

      act(() => {
        result.current.notify({
          message: 'Test message',
          action,
        });
      });

      expect(mockAddToast).toHaveBeenCalledWith({
        message: 'Test message',
        variant: 'info',
        action,
      });
    });
  });

  describe('Transfer Notifications', () => {
    it('should notify transfer started', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.notifyTransferStarted('document.pdf', 'Device 1');
      });

      expect(mockNotificationManager.transferStarted).toHaveBeenCalledWith(
        'document.pdf',
        'Device 1'
      );
      expect(mockInfo).toHaveBeenCalledWith('Starting transfer: document.pdf', {
        title: 'Transfer Started',
      });
    });

    it('should notify transfer complete (received)', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.notifyTransferComplete('document.pdf', 'received');
      });

      expect(mockNotificationManager.transferComplete).toHaveBeenCalledWith(
        'document.pdf',
        'received'
      );
      expect(mockSuccess).toHaveBeenCalledWith('Successfully received: document.pdf', {
        title: 'File Received',
      });
    });

    it('should notify transfer complete (sent)', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.notifyTransferComplete('document.pdf', 'sent');
      });

      expect(mockNotificationManager.transferComplete).toHaveBeenCalledWith(
        'document.pdf',
        'sent'
      );
      expect(mockSuccess).toHaveBeenCalledWith('Successfully sent: document.pdf', {
        title: 'Transfer Complete',
      });
    });

    it('should notify transfer complete with default direction', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.notifyTransferComplete('document.pdf');
      });

      expect(mockSuccess).toHaveBeenCalledWith('Successfully received: document.pdf', {
        title: 'File Received',
      });
    });

    it('should notify transfer failed without error message', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.notifyTransferFailed('document.pdf');
      });

      expect(mockNotificationManager.transferFailed).toHaveBeenCalledWith(
        'document.pdf',
        undefined
      );
      expect(mockError).toHaveBeenCalledWith('Failed to transfer document.pdf', {
        title: 'Transfer Failed',
      });
    });

    it('should notify transfer failed with error message', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.notifyTransferFailed('document.pdf', 'Connection lost');
      });

      expect(mockNotificationManager.transferFailed).toHaveBeenCalledWith(
        'document.pdf',
        'Connection lost'
      );
      expect(mockError).toHaveBeenCalledWith(
        'Failed to transfer document.pdf: Connection lost',
        {
          title: 'Transfer Failed',
        }
      );
    });

    it('should notify transfer failed with retry action', () => {
      const { result } = renderHook(() => useNotifications());
      const onRetry = vi.fn();

      act(() => {
        result.current.notifyTransferFailed('document.pdf', 'Network error', onRetry);
      });

      expect(mockError).toHaveBeenCalledWith(
        'Failed to transfer document.pdf: Network error',
        {
          title: 'Transfer Failed',
          action: { label: 'Retry', onClick: onRetry },
        }
      );
    });
  });

  describe('Connection Notifications', () => {
    it('should notify connection established (P2P)', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.notifyConnectionEstablished('Device 1', 'p2p');
      });

      expect(mockNotificationManager.connectionEstablished).toHaveBeenCalledWith(
        'Device 1',
        'p2p'
      );
      expect(mockSuccess).toHaveBeenCalledWith('Direct P2P connection established', {
        title: 'Connected to Device 1',
      });
    });

    it('should notify connection established (relay)', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.notifyConnectionEstablished('Device 2', 'relay');
      });

      expect(mockSuccess).toHaveBeenCalledWith('Connected via relay', {
        title: 'Connected to Device 2',
      });
    });

    it('should notify connection established with default type', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.notifyConnectionEstablished('Device 3');
      });

      expect(mockSuccess).toHaveBeenCalledWith('Direct P2P connection established', {
        title: 'Connected to Device 3',
      });
    });

    it('should notify connection lost', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.notifyConnectionLost('Device 1');
      });

      expect(mockNotificationManager.connectionLost).toHaveBeenCalledWith('Device 1');
      expect(mockWarning).toHaveBeenCalledWith('Disconnected from Device 1', {
        title: 'Connection Lost',
      });
    });

    it('should notify connection request', () => {
      const { result } = renderHook(() => useNotifications());
      const onAccept = vi.fn();
      const onReject = vi.fn();

      act(() => {
        result.current.notifyConnectionRequest('Device 1', 'device-123', onAccept, onReject);
      });

      expect(mockNotificationManager.connectionRequest).toHaveBeenCalledWith(
        'Device 1',
        'device-123',
        onAccept,
        onReject
      );
    });
  });

  describe('Device Notifications', () => {
    it('should notify device discovered', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.notifyDeviceDiscovered('New Device');
      });

      expect(mockNotificationManager.deviceDiscovered).toHaveBeenCalledWith('New Device');
      expect(mockInfo).toHaveBeenCalledWith('New Device is available for transfer', {
        title: 'New Device Found',
      });
    });
  });

  describe('Incoming Transfer Request', () => {
    it('should notify incoming transfer request with actions', () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useNotifications());
      const onAccept = vi.fn();
      const onReject = vi.fn();

      act(() => {
        result.current.notifyIncomingTransferRequest(
          'Device 1',
          'document.pdf',
          onAccept,
          onReject
        );
      });

      expect(mockNotificationManager.incomingTransferRequest).toHaveBeenCalledWith(
        'Device 1',
        'document.pdf'
      );

      expect(mockAddToast).toHaveBeenCalledWith({
        title: 'Device 1 wants to send a file',
        message: 'document.pdf',
        variant: 'info',
        duration: 30000,
        action: {
          label: 'Accept',
          onClick: expect.any(Function),
        },
      });

      vi.useRealTimers();
    });

    it('should call onAccept and remove toast when action is clicked', () => {
      const { result } = renderHook(() => useNotifications());
      const onAccept = vi.fn();
      const onReject = vi.fn();

      let actionCallback: (() => void) | undefined;

      mockAddToast.mockImplementationOnce((options) => {
        actionCallback = options.action?.onClick;
        return 'toast-id-123';
      });

      act(() => {
        result.current.notifyIncomingTransferRequest(
          'Device 1',
          'file.txt',
          onAccept,
          onReject
        );
      });

      act(() => {
        actionCallback?.();
      });

      expect(onAccept).toHaveBeenCalled();
      expect(mockRemoveToast).toHaveBeenCalledWith('toast-id-123');
    });

    it('should auto-reject after timeout', () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useNotifications());
      const onAccept = vi.fn();
      const onReject = vi.fn();

      act(() => {
        result.current.notifyIncomingTransferRequest(
          'Device 1',
          'file.txt',
          onAccept,
          onReject
        );
      });

      // Fast-forward 30 seconds
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      expect(mockRemoveToast).toHaveBeenCalledWith('toast-id-123');
      expect(onReject).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('Toast Shortcuts', () => {
    it('should expose success method', () => {
      const { result } = renderHook(() => useNotifications());

      expect(result.current.success).toBe(mockSuccess);
    });

    it('should expose error method', () => {
      const { result } = renderHook(() => useNotifications());

      expect(result.current.error).toBe(mockError);
    });

    it('should expose warning method', () => {
      const { result } = renderHook(() => useNotifications());

      expect(result.current.warning).toBe(mockWarning);
    });

    it('should expose info method', () => {
      const { result } = renderHook(() => useNotifications());

      expect(result.current.info).toBe(mockInfo);
    });

    it('should expose dismiss method', () => {
      const { result } = renderHook(() => useNotifications());

      expect(result.current.dismiss).toBe(mockRemoveToast);
    });

    it('should expose dismissAll method', () => {
      const { result } = renderHook(() => useNotifications());

      expect(result.current.dismissAll).toBe(mockClearAll);
    });
  });

  describe('Browser Notifications', () => {
    it('should request notification permission', async () => {
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(mockNotificationManager.requestPermission).toHaveBeenCalled();
    });

    it('should check if browser notifications are available', () => {
      const { result } = renderHook(() => useNotifications());

      expect(result.current.isBrowserNotificationsAvailable).toBe(true);
      expect(mockNotificationManager.isBrowserNotificationsAvailable).toHaveBeenCalled();
    });

    it('should check if browser notifications are denied', () => {
      const { result } = renderHook(() => useNotifications());

      expect(result.current.isBrowserNotificationsDenied).toBe(false);
      expect(mockNotificationManager.isBrowserNotificationsDenied).toHaveBeenCalled();
    });
  });

  describe('Settings Updates', () => {
    it('should update notification manager when settings change', () => {
      const { rerender } = renderHook(() => useNotifications());

      const initialCallCount = mockNotificationManager.updateSettings.mock.calls.length;

      // Update settings
      mockSettings.notificationSound = false;
      mockSettings.notificationVolume = 0.8;

      rerender();

      expect(mockNotificationManager.updateSettings.mock.calls.length).toBeGreaterThan(
        initialCallCount
      );
      expect(mockNotificationManager.setVolume).toHaveBeenCalledWith(0.8);
      expect(mockNotificationManager.setMuted).toHaveBeenCalledWith(true);

      // Reset
      mockSettings.notificationSound = true;
      mockSettings.notificationVolume = 0.5;
    });

    it('should update volume when volume changes', () => {
      const { rerender } = renderHook(() => useNotifications());

      mockSettings.notificationVolume = 0.7;

      rerender();

      expect(mockNotificationManager.setVolume).toHaveBeenCalledWith(0.7);

      // Reset
      mockSettings.notificationVolume = 0.5;
    });

    it('should handle undefined volume', () => {
      const { rerender } = renderHook(() => useNotifications());

      mockSettings.notificationVolume = undefined as any;

      rerender();

      expect(mockNotificationManager.setVolume).toHaveBeenCalledWith(0.3);

      // Reset
      mockSettings.notificationVolume = 0.5;
    });

    it('should update silent hours settings', () => {
      const { rerender } = renderHook(() => useNotifications());

      mockSettings.silentHoursEnabled = true;
      mockSettings.silentHoursStart = '23:00';
      mockSettings.silentHoursEnd = '07:00';

      rerender();

      expect(mockNotificationManager.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          silentHoursEnabled: true,
          silentHoursStart: '23:00',
          silentHoursEnd: '07:00',
        })
      );

      // Reset
      mockSettings.silentHoursEnabled = false;
      mockSettings.silentHoursStart = '22:00';
      mockSettings.silentHoursEnd = '08:00';
    });
  });

  describe('Edge Cases', () => {
    it('should handle notify with empty message', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.notify({ message: '' });
      });

      expect(mockAddToast).toHaveBeenCalledWith({
        message: '',
        variant: 'info',
      });
    });

    it('should handle notify without title', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.notify({
          message: 'Test',
          variant: 'success',
        });
      });

      expect(mockAddToast).toHaveBeenCalledWith({
        message: 'Test',
        variant: 'success',
      });
    });

    it('should handle transfer notifications with special characters', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.notifyTransferStarted(
          'file with spaces & special@chars.txt',
          'Device #1'
        );
      });

      expect(mockInfo).toHaveBeenCalledWith(
        'Starting transfer: file with spaces & special@chars.txt',
        {
          title: 'Transfer Started',
        }
      );
    });

    it('should handle connection notifications with long device names', () => {
      const { result } = renderHook(() => useNotifications());
      const longName = 'A'.repeat(100);

      act(() => {
        result.current.notifyConnectionEstablished(longName, 'p2p');
      });

      expect(mockSuccess).toHaveBeenCalledWith('Direct P2P connection established', {
        title: `Connected to ${longName}`,
      });
    });
  });
});

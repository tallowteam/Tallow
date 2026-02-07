/**
 * DeviceDiscovery Component Unit Tests
 * Tests for device cards, scanning state, empty state, and device selection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeviceDiscovery } from '@/components/transfer/DeviceDiscovery';
import type { Device } from '@/lib/types';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

// Mock device store
const mockDevices: Device[] = [
  {
    id: 'device-1',
    name: 'Laptop',
    platform: 'windows',
    ip: '192.168.1.100',
    port: 8384,
    isOnline: true,
    isFavorite: false,
    lastSeen: Date.now(),
    avatar: null,
  },
  {
    id: 'device-2',
    name: 'Phone',
    platform: 'android',
    ip: '192.168.1.101',
    port: 8384,
    isOnline: true,
    isFavorite: true,
    lastSeen: Date.now(),
    avatar: null,
  },
  {
    id: 'this-device',
    name: 'This Computer',
    platform: 'macos',
    ip: '192.168.1.102',
    port: 8384,
    isOnline: true,
    isFavorite: false,
    lastSeen: Date.now(),
    avatar: null,
  },
];

vi.mock('@/lib/stores/device-store', () => ({
  useDeviceStore: () => ({
    devices: mockDevices,
    discovery: {
      isScanning: false,
      error: null,
    },
    addDevice: vi.fn(),
    toggleFavorite: vi.fn(),
  }),
}));

// Mock broadcast transfer
vi.mock('@/lib/transfer/broadcast-transfer', () => ({
  createBroadcastTransfer: vi.fn(() => ({
    start: vi.fn(),
  })),
}));

// Mock loading states
vi.mock('@/components/transfer/LoadingStates', () => ({
  DeviceDiscoveryLoading: ({ count }: { count: number }) => (
    <div data-testid="loading">{count} skeletons</div>
  ),
}));

describe('DeviceDiscovery Component', () => {
  const mockOnDeviceSelect = vi.fn();
  const mockOnBroadcastStart = vi.fn();
  const selectedFiles = [new File(['test'], 'test.txt', { type: 'text/plain' })];

  beforeEach(() => {
    mockOnDeviceSelect.mockClear();
    mockOnBroadcastStart.mockClear();
  });

  describe('Rendering', () => {
    it('renders device discovery component', () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );
      expect(screen.getByText('Laptop')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
    });

    it('shows device count', () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );
      // 3 devices found (including this-device)
      expect(screen.getByText(/3 devices found/i)).toBeInTheDocument();
    });

    it('renders device cards for online devices', () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );
      expect(screen.getByText('Laptop')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('This Computer')).toBeInTheDocument();
    });
  });

  describe('Device Cards', () => {
    it('displays device name', () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );
      expect(screen.getByText('Laptop')).toBeInTheDocument();
    });

    it('displays platform badge', () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );
      expect(screen.getByText('Windows')).toBeInTheDocument();
      expect(screen.getByText('Android')).toBeInTheDocument();
    });

    it('shows favorite star for favorite devices', () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );
      const favoriteButtons = screen.getAllByLabelText(/remove from favorites/i);
      expect(favoriteButtons.length).toBeGreaterThan(0);
    });

    it('calls onDeviceSelect when device card is clicked', () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );

      const laptopCard = screen.getByLabelText(/transfer to laptop/i);
      fireEvent.click(laptopCard);

      expect(mockOnDeviceSelect).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Laptop' })
      );
    });

    it('does not call onDeviceSelect for this-device', () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );

      const thisDevice = screen.getByLabelText(/this device/i);
      fireEvent.click(thisDevice);

      expect(mockOnDeviceSelect).not.toHaveBeenCalled();
    });

    it('shows "You" badge on this-device', () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );
      expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('disables device card when no files selected', () => {
      render(
        <DeviceDiscovery
          selectedFiles={[]}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );

      const laptopCard = screen.getByLabelText(/transfer to laptop/i);
      expect(laptopCard).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Scanning State', () => {
    it('shows scanning indicator when scanning', () => {
      // Override mock for this test
      vi.mocked(require('@/lib/stores/device-store').useDeviceStore).mockReturnValueOnce({
        devices: [],
        discovery: {
          isScanning: true,
          error: null,
        },
        addDevice: vi.fn(),
        toggleFavorite: vi.fn(),
      });

      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );

      expect(screen.getByText(/scanning network/i)).toBeInTheDocument();
    });

    it('shows scan complete when not scanning', () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );

      expect(screen.getByText(/3 devices found/i)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no devices found', () => {
      // Override mock for this test
      vi.mocked(require('@/lib/stores/device-store').useDeviceStore).mockReturnValueOnce({
        devices: [],
        discovery: {
          isScanning: false,
          error: null,
        },
        addDevice: vi.fn(),
        toggleFavorite: vi.fn(),
      });

      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );

      expect(screen.getByText(/no devices found/i)).toBeInTheDocument();
    });

    it('shows different empty message when scanning', () => {
      // Override mock for this test
      vi.mocked(require('@/lib/stores/device-store').useDeviceStore).mockReturnValueOnce({
        devices: [],
        discovery: {
          isScanning: true,
          error: null,
        },
        addDevice: vi.fn(),
        toggleFavorite: vi.fn(),
      });

      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );

      expect(screen.getByText(/searching for devices/i)).toBeInTheDocument();
    });
  });

  describe('Manual IP Connection', () => {
    it('shows manual connect button', () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );
      expect(screen.getByLabelText(/manual ip connection/i)).toBeInTheDocument();
    });

    it('opens manual connect form when button clicked', () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );

      const manualButton = screen.getByLabelText(/manual ip connection/i);
      fireEvent.click(manualButton);

      expect(screen.getByText(/connect by ip address/i)).toBeInTheDocument();
    });

    it('allows entering IP address', () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );

      const manualButton = screen.getByLabelText(/manual ip connection/i);
      fireEvent.click(manualButton);

      const ipInput = screen.getByLabelText(/ip address or hostname/i) as HTMLInputElement;
      fireEvent.change(ipInput, { target: { value: '192.168.1.200' } });

      expect(ipInput.value).toBe('192.168.1.200');
    });

    it('allows entering port', () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );

      const manualButton = screen.getByLabelText(/manual ip connection/i);
      fireEvent.click(manualButton);

      const portInput = screen.getByLabelText(/port/i) as HTMLInputElement;
      fireEvent.change(portInput, { target: { value: '9999' } });

      expect(portInput.value).toBe('9999');
    });

    it('validates IP address format', async () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );

      const manualButton = screen.getByLabelText(/manual ip connection/i);
      fireEvent.click(manualButton);

      const ipInput = screen.getByLabelText(/ip address or hostname/i);
      const connectButton = screen.getByRole('button', { name: /^connect$/i });

      fireEvent.change(ipInput, { target: { value: 'invalid-ip' } });
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid ip address/i)).toBeInTheDocument();
      });
    });

    it('validates port range', async () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );

      const manualButton = screen.getByLabelText(/manual ip connection/i);
      fireEvent.click(manualButton);

      const ipInput = screen.getByLabelText(/ip address or hostname/i);
      const portInput = screen.getByLabelText(/port/i);
      const connectButton = screen.getByRole('button', { name: /^connect$/i });

      fireEvent.change(ipInput, { target: { value: '192.168.1.1' } });
      fireEvent.change(portInput, { target: { value: '70000' } });
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText(/port must be between/i)).toBeInTheDocument();
      });
    });

    it('closes manual connect form', () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );

      const manualButton = screen.getByLabelText(/manual ip connection/i);
      fireEvent.click(manualButton);

      expect(screen.getByText(/connect by ip address/i)).toBeInTheDocument();

      const closeButton = screen.getByLabelText(/close manual connect/i);
      fireEvent.click(closeButton);

      expect(screen.queryByText(/connect by ip address/i)).not.toBeInTheDocument();
    });
  });

  describe('Broadcast Mode', () => {
    it('shows broadcast button when 2+ devices available', () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );
      // Should show "Send to All (2 devices)" - excluding this-device
      expect(screen.getByText(/send to all.*2 devices/i)).toBeInTheDocument();
    });

    it('does not show broadcast button when fewer than 2 devices', () => {
      // Override mock for this test
      vi.mocked(require('@/lib/stores/device-store').useDeviceStore).mockReturnValueOnce({
        devices: [mockDevices[0]], // Only one device
        discovery: {
          isScanning: false,
          error: null,
        },
        addDevice: vi.fn(),
        toggleFavorite: vi.fn(),
      });

      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );

      expect(screen.queryByText(/send to all/i)).not.toBeInTheDocument();
    });

    it('calls onBroadcastStart when broadcast button clicked', () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
          onBroadcastStart={mockOnBroadcastStart}
        />
      );

      const broadcastButton = screen.getByText(/send to all/i);
      fireEvent.click(broadcastButton);

      expect(mockOnBroadcastStart).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('device cards are keyboard accessible', () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );

      const laptopCard = screen.getByLabelText(/transfer to laptop/i);
      expect(laptopCard).toHaveAttribute('tabIndex', '0');
    });

    it('selects device on Enter key', () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );

      const laptopCard = screen.getByLabelText(/transfer to laptop/i);
      fireEvent.keyDown(laptopCard, { key: 'Enter' });

      expect(mockOnDeviceSelect).toHaveBeenCalled();
    });

    it('selects device on Space key', () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );

      const laptopCard = screen.getByLabelText(/transfer to laptop/i);
      fireEvent.keyDown(laptopCard, { key: ' ' });

      expect(mockOnDeviceSelect).toHaveBeenCalled();
    });

    it('this-device is not keyboard accessible', () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );

      const thisDevice = screen.getByLabelText(/this device/i);
      expect(thisDevice).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Accessibility', () => {
    it('device cards have button role', () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );

      const laptopCard = screen.getByLabelText(/transfer to laptop/i);
      expect(laptopCard).toHaveAttribute('role', 'button');
    });

    it('device cards have descriptive aria-label', () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );

      expect(screen.getByLabelText(/transfer to laptop/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/transfer to phone/i)).toBeInTheDocument();
    });

    it('disabled device cards have aria-disabled', () => {
      render(
        <DeviceDiscovery
          selectedFiles={[]}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );

      const laptopCard = screen.getByLabelText(/transfer to laptop/i);
      expect(laptopCard).toHaveAttribute('aria-disabled', 'true');
    });

    it('manual connect form has proper labels', () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );

      const manualButton = screen.getByLabelText(/manual ip connection/i);
      fireEvent.click(manualButton);

      expect(screen.getByLabelText(/ip address or hostname/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/port/i)).toBeInTheDocument();
    });

    it('error messages have alert role', async () => {
      render(
        <DeviceDiscovery
          selectedFiles={selectedFiles}
          onDeviceSelect={mockOnDeviceSelect}
        />
      );

      const manualButton = screen.getByLabelText(/manual ip connection/i);
      fireEvent.click(manualButton);

      const connectButton = screen.getByRole('button', { name: /^connect$/i });
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });
});

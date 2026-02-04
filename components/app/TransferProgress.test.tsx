/**
 * TransferProgress Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/tests/utils/render';
import userEvent from '@testing-library/user-event';
import { TransferProgress } from './TransferProgress';
import { createMockTransfer } from '@/tests/utils/mocks/zustand';

describe('TransferProgress', () => {
  describe('Rendering', () => {
    it('should render transfer information', () => {
      const transfer = createMockTransfer();
      render(<TransferProgress transfer={transfer} />);

      expect(screen.getByText('test-file.txt')).toBeInTheDocument();
    });

    it('should display progress percentage', () => {
      const transfer = createMockTransfer({ progress: 75 });
      render(<TransferProgress transfer={transfer} />);

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should display file size information', () => {
      const transfer = createMockTransfer({
        totalSize: 1024 * 1024, // 1 MB
        transferredSize: 512 * 1024, // 512 KB
      });
      render(<TransferProgress transfer={transfer} />);

      expect(screen.getByText(/512 KB/)).toBeInTheDocument();
      expect(screen.getByText(/1 MB/)).toBeInTheDocument();
    });

    it('should display transfer speed', () => {
      const transfer = createMockTransfer({ speed: 1024 * 1024 }); // 1 MB/s
      render(<TransferProgress transfer={transfer} />);

      expect(screen.getByText(/1 MB\/s/)).toBeInTheDocument();
    });

    it('should display encryption indicator when encrypted', () => {
      const transfer = createMockTransfer({
        encryptionMetadata: {
          algorithm: 'AES-256-GCM',
          keyHash: 'hash',
        },
      });
      render(<TransferProgress transfer={transfer} />);

      expect(screen.getByText(/Encrypted/)).toBeInTheDocument();
    });

    it('should display quality indicator', () => {
      const transfer = createMockTransfer({ quality: 'excellent' });
      render(<TransferProgress transfer={transfer} />);

      expect(screen.getByText(/excellent/i)).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('should show correct progress width', () => {
      const transfer = createMockTransfer({ progress: 60 });
      const { container } = render(<TransferProgress transfer={transfer} />);

      const progressBar = container.querySelector('[style*="width: 60%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('should show shimmer effect when transferring', () => {
      const transfer = createMockTransfer({ status: 'transferring' });
      const { container } = render(<TransferProgress transfer={transfer} />);

      const shimmer = container.querySelector('.animate-shimmer');
      expect(shimmer).toBeInTheDocument();
    });

    it('should not show shimmer when paused', () => {
      const transfer = createMockTransfer({ status: 'paused' });
      const { container } = render(<TransferProgress transfer={transfer} />);

      const shimmer = container.querySelector('.animate-shimmer');
      expect(shimmer).not.toBeInTheDocument();
    });
  });

  describe('Time Formatting', () => {
    it('should format ETA correctly', () => {
      const transfer = createMockTransfer({ eta: 125 }); // 2:05
      render(<TransferProgress transfer={transfer} />);

      expect(screen.getByText('2:05')).toBeInTheDocument();
    });

    it('should handle zero ETA', () => {
      const transfer = createMockTransfer({ eta: 0 });
      render(<TransferProgress transfer={transfer} />);

      expect(screen.getByText('--:--')).toBeInTheDocument();
    });

    it('should handle null ETA', () => {
      const transfer = createMockTransfer({ eta: null });
      render(<TransferProgress transfer={transfer} />);

      expect(screen.getByText('--:--')).toBeInTheDocument();
    });

    it('should format hours:minutes:seconds', () => {
      const transfer = createMockTransfer({ eta: 3665 }); // 1:01:05
      render(<TransferProgress transfer={transfer} />);

      expect(screen.getByText('1:01:05')).toBeInTheDocument();
    });
  });

  describe('File Size Formatting', () => {
    it.each([
      [0, '0 Bytes'],
      [1023, '1023 Bytes'],
      [1024, '1 KB'],
      [1024 * 1024, '1 MB'],
      [1024 * 1024 * 1024, '1 GB'],
      [1024 * 1024 * 1024 * 1024, '1 TB'],
    ])('should format %s bytes as %s', (bytes, expected) => {
      const transfer = createMockTransfer({ totalSize: bytes, transferredSize: 0 });
      render(<TransferProgress transfer={transfer} />);

      expect(screen.getByText(new RegExp(expected))).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should show pause button when transferring', () => {
      const transfer = createMockTransfer({ status: 'transferring' });
      const onPause = vi.fn();
      const onResume = vi.fn();

      render(<TransferProgress transfer={transfer} onPause={onPause} onResume={onResume} />);

      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    it('should show resume button when paused', () => {
      const transfer = createMockTransfer({ status: 'paused' });
      const onPause = vi.fn();
      const onResume = vi.fn();

      render(<TransferProgress transfer={transfer} onPause={onPause} onResume={onResume} />);

      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
    });

    it('should call onPause when pause button clicked', async () => {
      const transfer = createMockTransfer({ status: 'transferring', id: 'test-123' });
      const onPause = vi.fn();
      const onResume = vi.fn();
      const user = userEvent.setup();

      render(<TransferProgress transfer={transfer} onPause={onPause} onResume={onResume} />);

      const pauseButton = screen.getByRole('button', { name: /pause/i });
      await user.click(pauseButton);

      expect(onPause).toHaveBeenCalledWith('test-123');
    });

    it('should call onResume when resume button clicked', async () => {
      const transfer = createMockTransfer({ status: 'paused', id: 'test-123' });
      const onPause = vi.fn();
      const onResume = vi.fn();
      const user = userEvent.setup();

      render(<TransferProgress transfer={transfer} onPause={onPause} onResume={onResume} />);

      const resumeButton = screen.getByRole('button', { name: /resume/i });
      await user.click(resumeButton);

      expect(onResume).toHaveBeenCalledWith('test-123');
    });

    it('should show cancel button', () => {
      const transfer = createMockTransfer();
      const onCancel = vi.fn();

      render(<TransferProgress transfer={transfer} onCancel={onCancel} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should call onCancel when cancel button clicked', async () => {
      const transfer = createMockTransfer({ id: 'test-123' });
      const onCancel = vi.fn();
      const user = userEvent.setup();

      render(<TransferProgress transfer={transfer} onCancel={onCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalledWith('test-123');
    });
  });

  describe('Quality Indicators', () => {
    it.each([
      ['excellent', 'bg-green-400'],
      ['good', 'bg-yellow-400'],
      ['poor', 'bg-orange-400'],
      ['critical', 'bg-red-400'],
    ] as const)('should show %s quality with correct color', (quality, colorClass) => {
      const transfer = createMockTransfer({ quality });
      const { container } = render(<TransferProgress transfer={transfer} />);

      const indicator = container.querySelector(`.${colorClass}`);
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const transfer = createMockTransfer();
      const { container } = render(
        <TransferProgress transfer={transfer} className="custom-class" />
      );

      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });
  });
});

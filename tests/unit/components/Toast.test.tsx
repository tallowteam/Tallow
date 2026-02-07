/**
 * Toast Component Unit Tests
 * Tests for toast notifications: show, dismiss, auto-dismiss, and variants
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Toast, type ToastProps } from '@/components/ui/Toast';

describe('Toast Component', () => {
  let mockOnClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnClose = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const defaultProps: ToastProps = {
    id: 'toast-1',
    message: 'Test message',
    onClose: mockOnClose,
  };

  describe('Rendering', () => {
    it('renders toast with message', () => {
      render(<Toast {...defaultProps} />);
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('renders toast with title and message', () => {
      render(<Toast {...defaultProps} title="Success" message="Operation completed" />);
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Operation completed')).toBeInTheDocument();
    });

    it('renders toast without title', () => {
      render(<Toast {...defaultProps} />);
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('has status role for accessibility', () => {
      render(<Toast {...defaultProps} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has correct aria attributes', () => {
      render(<Toast {...defaultProps} />);
      const toast = screen.getByRole('status');
      expect(toast).toHaveAttribute('aria-live', 'polite');
      expect(toast).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Variants', () => {
    const variants: Array<'success' | 'error' | 'warning' | 'info'> = [
      'success',
      'error',
      'warning',
      'info',
    ];

    variants.forEach((variant) => {
      it(`renders ${variant} variant`, () => {
        render(<Toast {...defaultProps} variant={variant} />);
        expect(screen.getByRole('status')).toBeInTheDocument();
      });

      it(`shows ${variant} icon`, () => {
        render(<Toast {...defaultProps} variant={variant} />);
        const toast = screen.getByRole('status');
        const icon = toast.querySelector('svg');
        expect(icon).toBeInTheDocument();
      });
    });

    it('defaults to info variant', () => {
      render(<Toast {...defaultProps} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Manual Dismiss', () => {
    it('renders close button', () => {
      render(<Toast {...defaultProps} />);
      expect(screen.getByLabelText('Close notification')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', async () => {
      render(<Toast {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close notification');
      fireEvent.click(closeButton);

      // Wait for animation
      vi.advanceTimersByTime(200);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledWith('toast-1');
      });
    });
  });

  describe('Auto-Dismiss', () => {
    it('auto-dismisses after default duration', async () => {
      render(<Toast {...defaultProps} />);

      // Fast-forward past default 5000ms
      vi.advanceTimersByTime(5000);

      // Wait for animation
      vi.advanceTimersByTime(200);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledWith('toast-1');
      });
    });

    it('auto-dismisses after custom duration', async () => {
      render(<Toast {...defaultProps} duration={3000} />);

      vi.advanceTimersByTime(3000);
      vi.advanceTimersByTime(200);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledWith('toast-1');
      });
    });

    it('does not auto-dismiss when duration is Infinity', async () => {
      render(<Toast {...defaultProps} duration={Infinity} />);

      vi.advanceTimersByTime(10000);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('shows progress bar when duration is set', () => {
      render(<Toast {...defaultProps} duration={5000} />);
      const toast = screen.getByRole('status');
      const progressBar = toast.querySelector('[aria-hidden="true"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('does not show progress bar when duration is Infinity', () => {
      render(<Toast {...defaultProps} duration={Infinity} />);
      const toast = screen.getByRole('status');
      // Progress bar should not exist
      const progressBars = Array.from(toast.querySelectorAll('[style*="width"]'));
      const hasProgressBar = progressBars.some(el =>
        el.getAttribute('aria-hidden') === 'true' &&
        el.className.includes('progress')
      );
      expect(hasProgressBar).toBe(false);
    });
  });

  describe('Action Button', () => {
    it('renders single action button', () => {
      const handleAction = vi.fn();
      render(
        <Toast
          {...defaultProps}
          action={{ label: 'Undo', onClick: handleAction }}
        />
      );
      expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    });

    it('calls action onClick handler', async () => {
      const handleAction = vi.fn();
      render(
        <Toast
          {...defaultProps}
          action={{ label: 'Retry', onClick: handleAction }}
        />
      );

      const actionButton = screen.getByRole('button', { name: 'Retry' });
      fireEvent.click(actionButton);

      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('closes toast after action is clicked', async () => {
      const handleAction = vi.fn();
      render(
        <Toast
          {...defaultProps}
          action={{ label: 'Action', onClick: handleAction }}
        />
      );

      const actionButton = screen.getByRole('button', { name: 'Action' });
      fireEvent.click(actionButton);

      vi.advanceTimersByTime(200);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledWith('toast-1');
      });
    });

    it('renders multiple action buttons', () => {
      const handleAction1 = vi.fn();
      const handleAction2 = vi.fn();
      render(
        <Toast
          {...defaultProps}
          actions={[
            { label: 'Confirm', onClick: handleAction1 },
            { label: 'Cancel', onClick: handleAction2 },
          ]}
        />
      );

      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });
  });

  describe('Preview Content', () => {
    it('renders image preview', () => {
      render(
        <Toast
          {...defaultProps}
          preview={{
            type: 'image',
            src: '/test-image.jpg',
            fileName: 'test.jpg',
          }}
        />
      );
      const image = screen.getByRole('img') as HTMLImageElement;
      expect(image).toBeInTheDocument();
      expect(image.src).toContain('test-image.jpg');
    });

    it('renders file preview', () => {
      render(
        <Toast
          {...defaultProps}
          preview={{
            type: 'file',
            fileName: 'document.pdf',
            fileSize: '2.5 MB',
          }}
        />
      );
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.getByText('2.5 MB')).toBeInTheDocument();
    });

    it('renders transfer preview with progress', () => {
      render(
        <Toast
          {...defaultProps}
          preview={{
            type: 'transfer',
            fileName: 'video.mp4',
            progress: 75,
          }}
        />
      );
      expect(screen.getByText('video.mp4')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('hides icon when preview is shown', () => {
      render(
        <Toast
          {...defaultProps}
          variant="success"
          preview={{
            type: 'file',
            fileName: 'test.txt',
          }}
        />
      );
      const toast = screen.getByRole('status');
      // Icon container should not exist
      const iconContainer = toast.querySelector('.iconContainer');
      expect(iconContainer).not.toBeInTheDocument();
    });
  });

  describe('Data Attributes', () => {
    it('adds data-toast-id attribute', () => {
      render(<Toast {...defaultProps} />);
      const toast = screen.getByRole('status');
      expect(toast).toHaveAttribute('data-toast-id', 'toast-1');
    });
  });

  describe('Exit Animation', () => {
    it('applies exiting class before removing', async () => {
      const { container } = render(<Toast {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close notification');
      fireEvent.click(closeButton);

      // Check for exiting class immediately
      const toast = container.querySelector('[role="status"]');
      expect(toast).toHaveClass('exiting');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to toast element', () => {
      const ref = { current: null as HTMLDivElement | null };
      render(<Toast {...defaultProps} ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.getAttribute('role')).toBe('status');
    });
  });

  describe('Accessibility', () => {
    it('close button has accessible label', () => {
      render(<Toast {...defaultProps} />);
      expect(screen.getByLabelText('Close notification')).toBeInTheDocument();
    });

    it('icons have aria-hidden attribute', () => {
      render(<Toast {...defaultProps} variant="success" />);
      const toast = screen.getByRole('status');
      const icon = toast.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('progress bar has aria-hidden attribute', () => {
      render(<Toast {...defaultProps} duration={5000} />);
      const toast = screen.getByRole('status');
      const progressBar = Array.from(toast.querySelectorAll('[aria-hidden="true"]')).find(
        el => el.className.includes('progress')
      );
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Rich Toast Styling', () => {
    it('applies rich toast class when preview exists', () => {
      render(
        <Toast
          {...defaultProps}
          preview={{
            type: 'file',
            fileName: 'test.txt',
          }}
        />
      );
      const toast = screen.getByRole('status');
      expect(toast).toHaveClass('richToast');
    });

    it('does not apply rich toast class without preview', () => {
      render(<Toast {...defaultProps} />);
      const toast = screen.getByRole('status');
      expect(toast).not.toHaveClass('richToast');
    });
  });
});

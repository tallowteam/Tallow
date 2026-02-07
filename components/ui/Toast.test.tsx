/**
 * Toast Component Tests
 *
 * Comprehensive test suite for the Toast notification system.
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ToastProvider, useToast } from './ToastProvider';
import { Toast } from './Toast';

// Helper component for testing the useToast hook
const TestComponent = () => {
  const { success, error, warning, info, addToast, clearAll, toasts } = useToast();

  return (
    <div>
      <button onClick={() => success('Success message')}>Success</button>
      <button onClick={() => error('Error message')}>Error</button>
      <button onClick={() => warning('Warning message')}>Warning</button>
      <button onClick={() => info('Info message')}>Info</button>
      <button
        onClick={() =>
          addToast({
            message: 'Custom toast',
            variant: 'info',
            title: 'Custom Title',
            duration: 1000,
          })
        }
      >
        Custom
      </button>
      <button
        onClick={() =>
          addToast({
            message: 'Toast with action',
            variant: 'info',
            action: {
              label: 'Click me',
              onClick: () => console.info('Action clicked'),
            },
          })
        }
      >
        With Action
      </button>
      <button onClick={clearAll}>Clear All</button>
      <div data-testid="toast-count">{toasts.length}</div>
    </div>
  );
};

describe('Toast Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('renders a toast with message', () => {
      const handleClose = vi.fn();
      render(
        <Toast
          id="test-1"
          message="Test message"
          variant="info"
          onClose={handleClose}
        />
      );

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('renders a toast with title and message', () => {
      const handleClose = vi.fn();
      render(
        <Toast
          id="test-1"
          title="Test Title"
          message="Test message"
          variant="info"
          onClose={handleClose}
        />
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('renders all variants correctly', () => {
      const variants = ['success', 'error', 'warning', 'info'] as const;
      const handleClose = vi.fn();

      variants.forEach((variant) => {
        const { container } = render(
          <Toast
            id={`test-${variant}`}
            message={`${variant} message`}
            variant={variant}
            onClose={handleClose}
          />
        );

        const toast = container.querySelector(`.${variant}`);
        expect(toast).toBeInTheDocument();
      });
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button is clicked', () => {
      const handleClose = vi.fn();
      render(
        <Toast
          id="test-1"
          message="Test message"
          variant="info"
          onClose={handleClose}
          duration={Infinity}
        />
      );

      const closeButton = screen.getByLabelText('Close notification');
      fireEvent.click(closeButton);

      act(() => {
        vi.advanceTimersByTime(200); // Wait for exit animation
      });

      expect(handleClose).toHaveBeenCalledWith('test-1');
    });

    it('auto-dismisses after duration', () => {
      const handleClose = vi.fn();
      render(
        <Toast
          id="test-1"
          message="Test message"
          variant="info"
          onClose={handleClose}
          duration={5000}
        />
      );

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      act(() => {
        vi.advanceTimersByTime(200); // Wait for exit animation
      });

      expect(handleClose).toHaveBeenCalledWith('test-1');
    });

    it('does not auto-dismiss when duration is Infinity', () => {
      const handleClose = vi.fn();
      render(
        <Toast
          id="test-1"
          message="Test message"
          variant="info"
          onClose={handleClose}
          duration={Infinity}
        />
      );

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Action Button', () => {
    it('renders action button when provided', () => {
      const handleClose = vi.fn();
      const handleAction = vi.fn();

      render(
        <Toast
          id="test-1"
          message="Test message"
          variant="info"
          onClose={handleClose}
          action={{
            label: 'Click me',
            onClick: handleAction,
          }}
        />
      );

      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('calls action onClick and closes toast', () => {
      const handleClose = vi.fn();
      const handleAction = vi.fn();

      render(
        <Toast
          id="test-1"
          message="Test message"
          variant="info"
          onClose={handleClose}
          action={{
            label: 'Click me',
            onClick: handleAction,
          }}
        />
      );

      const actionButton = screen.getByText('Click me');
      fireEvent.click(actionButton);

      expect(handleAction).toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(200); // Wait for exit animation
      });

      expect(handleClose).toHaveBeenCalledWith('test-1');
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA attributes', () => {
      const handleClose = vi.fn();
      render(
        <Toast
          id="test-1"
          message="Test message"
          variant="info"
          onClose={handleClose}
        />
      );

      const toast = screen.getByRole('status');
      expect(toast).toHaveAttribute('aria-live', 'polite');
      expect(toast).toHaveAttribute('aria-atomic', 'true');
    });

    it('close button has accessible label', () => {
      const handleClose = vi.fn();
      render(
        <Toast
          id="test-1"
          message="Test message"
          variant="info"
          onClose={handleClose}
        />
      );

      expect(screen.getByLabelText('Close notification')).toBeInTheDocument();
    });
  });
});

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders children correctly', () => {
    render(
      <ToastProvider>
        <div>Test content</div>
      </ToastProvider>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('throws error when useToast is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      const TestBadComponent = () => {
        useToast();
        return null;
      };
      render(<TestBadComponent />);
    }).toThrow('useToast must be used within a ToastProvider');

    consoleSpy.mockRestore();
  });

  describe('Toast Methods', () => {
    it('adds success toast', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const successButton = screen.getByText('Success');
      fireEvent.click(successButton);

      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    it('adds error toast', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const errorButton = screen.getByText('Error');
      fireEvent.click(errorButton);

      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('adds warning toast', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const warningButton = screen.getByText('Warning');
      fireEvent.click(warningButton);

      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });

    it('adds info toast', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const infoButton = screen.getByText('Info');
      fireEvent.click(infoButton);

      expect(screen.getByText('Info message')).toBeInTheDocument();
    });

    it('adds custom toast with options', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const customButton = screen.getByText('Custom');
      fireEvent.click(customButton);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom toast')).toBeInTheDocument();
    });

    it('adds toast with action', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const actionButton = screen.getByText('With Action');
      fireEvent.click(actionButton);

      expect(screen.getByText('Toast with action')).toBeInTheDocument();
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });
  });

  describe('Multiple Toasts', () => {
    it('supports multiple toasts', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Success'));
      fireEvent.click(screen.getByText('Error'));
      fireEvent.click(screen.getByText('Warning'));

      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });

    it('respects maxToasts limit', () => {
      render(
        <ToastProvider maxToasts={2}>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Success'));
      fireEvent.click(screen.getByText('Error'));
      fireEvent.click(screen.getByText('Warning'));

      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });

    it('clears all toasts', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Success'));
      fireEvent.click(screen.getByText('Error'));

      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Clear All'));

      act(() => {
        vi.advanceTimersByTime(200); // Wait for exit animations
      });

      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
      expect(screen.queryByText('Error message')).not.toBeInTheDocument();
    });
  });

  describe('Position', () => {
    it('applies correct position class', () => {
      const positions = [
        'top-right',
        'top-left',
        'bottom-right',
        'bottom-left',
        'top-center',
        'bottom-center',
      ] as const;

      positions.forEach((position) => {
        const { container } = render(
          <ToastProvider position={position}>
            <div>Test</div>
          </ToastProvider>
        );

        const toastContainer = container.querySelector(`[aria-label="Notifications"]`);
        expect(toastContainer).toHaveClass(position);
      });
    });
  });
});

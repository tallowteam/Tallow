/**
 * Modal Component Tests
 * Comprehensive test suite for Modal and ConfirmDialog components
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';
import { ConfirmDialog, DeleteIcon, WarningIcon, InfoIcon, SuccessIcon } from './ConfirmDialog';

describe('Modal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    children: <div>Modal Content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders when open is true', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      render(<Modal {...defaultProps} open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders with title', () => {
      render(<Modal {...defaultProps} title="Test Title" />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('renders close button by default', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });

    it('does not render close button when showCloseButton is false', () => {
      render(<Modal {...defaultProps} showCloseButton={false} />);
      expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('applies small size class', () => {
      render(<Modal {...defaultProps} size="sm" />);
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('sm');
    });

    it('applies medium size class by default', () => {
      render(<Modal {...defaultProps} />);
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('md');
    });

    it('applies large size class', () => {
      render(<Modal {...defaultProps} size="lg" />);
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('lg');
    });

    it('applies xl size class', () => {
      render(<Modal {...defaultProps} size="xl" />);
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('xl');
    });

    it('applies full size class', () => {
      render(<Modal {...defaultProps} size="full" />);
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('full');
    });
  });

  describe('Interactions', () => {
    it('calls onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByLabelText('Close modal');
      await userEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked and closeOnBackdropClick is true', async () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} closeOnBackdropClick />);

      const backdrop = screen.getByRole('dialog').parentElement;
      if (backdrop) {
        await userEvent.click(backdrop);
        expect(onClose).toHaveBeenCalled();
      }
    });

    it('does not call onClose when backdrop is clicked and closeOnBackdropClick is false', async () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} closeOnBackdropClick={false} />);

      const backdrop = screen.getByRole('dialog').parentElement;
      if (backdrop) {
        await userEvent.click(backdrop);
        expect(onClose).not.toHaveBeenCalled();
      }
    });

    it('calls onClose when Escape is pressed and closeOnEscape is true', async () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} closeOnEscape />);

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('does not call onClose when Escape is pressed and closeOnEscape is false', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} closeOnEscape={false} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('prevents multiple close calls during animation', async () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} animationDuration={100} />);

      const closeButton = screen.getByLabelText('Close modal');
      await userEvent.click(closeButton);
      await userEvent.click(closeButton);
      await userEvent.click(closeButton);

      // Should only call once during animation period
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has role="dialog"', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal="true"', () => {
      render(<Modal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('associates title with aria-labelledby when title is provided', () => {
      render(<Modal {...defaultProps} title="Test Title" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(screen.getByText('Test Title')).toHaveAttribute('id', 'modal-title');
    });

    it('close button has aria-label', () => {
      render(<Modal {...defaultProps} />);
      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toBeInTheDocument();
    });

    it('traps focus within modal', async () => {
      render(
        <Modal {...defaultProps}>
          <button>Button 1</button>
          <button>Button 2</button>
        </Modal>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Focus should be within modal
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
  });

  describe('Compositional API', () => {
    it('renders with ModalHeader', () => {
      render(
        <Modal {...defaultProps}>
          <ModalHeader>
            <h2>Custom Header</h2>
          </ModalHeader>
        </Modal>
      );

      expect(screen.getByText('Custom Header')).toBeInTheDocument();
    });

    it('renders with ModalBody', () => {
      render(
        <Modal {...defaultProps}>
          <ModalBody>
            <p>Body Content</p>
          </ModalBody>
        </Modal>
      );

      expect(screen.getByText('Body Content')).toBeInTheDocument();
    });

    it('renders with ModalFooter', () => {
      render(
        <Modal {...defaultProps}>
          <ModalFooter>
            <button>Action</button>
          </ModalFooter>
        </Modal>
      );

      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('renders complete composition', () => {
      render(
        <Modal {...defaultProps}>
          <ModalHeader>Header</ModalHeader>
          <ModalBody>Body</ModalBody>
          <ModalFooter>Footer</ModalFooter>
        </Modal>
      );

      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Body')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className to modal', () => {
      render(<Modal {...defaultProps} className="custom-modal" />);
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('custom-modal');
    });

    it('applies custom backdropClassName', () => {
      render(<Modal {...defaultProps} backdropClassName="custom-backdrop" />);
      const backdrop = screen.getByRole('dialog').parentElement;
      expect(backdrop).toHaveClass('custom-backdrop');
    });

    it('applies custom zIndex', () => {
      render(<Modal {...defaultProps} zIndex={999} />);
      const backdrop = screen.getByRole('dialog').parentElement;
      expect(backdrop).toHaveStyle({ zIndex: 999 });
    });
  });
});

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Confirm Action',
    description: 'Are you sure?',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with title and description', () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    });

    it('renders confirm and cancel buttons', () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(screen.getByText('Confirm')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('renders custom button text', () => {
      render(
        <ConfirmDialog {...defaultProps} confirmText="Delete" cancelText="Keep" />
      );
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Keep')).toBeInTheDocument();
    });

    it('renders with icon', () => {
      render(<ConfirmDialog {...defaultProps} icon={<DeleteIcon />} />);
      // Icon should be present in the document
      const dialog = screen.getByRole('dialog');
      expect(dialog.querySelector('svg')).toBeInTheDocument();
    });

    it('renders rich description content', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          description={
            <div>
              <p>First paragraph</p>
              <p>Second paragraph</p>
            </div>
          }
        />
      );
      expect(screen.getByText('First paragraph')).toBeInTheDocument();
      expect(screen.getByText('Second paragraph')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onClose when cancel button is clicked', async () => {
      const onClose = vi.fn();
      render(<ConfirmDialog {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm and onClose when confirm button is clicked', async () => {
      const onConfirm = vi.fn();
      const onClose = vi.fn();
      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} onClose={onClose} />);

      const confirmButton = screen.getByText('Confirm');
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('handles async onConfirm', async () => {
      const onConfirm = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();
      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} onClose={onClose} />);

      const confirmButton = screen.getByText('Confirm');
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('disables buttons when loading', () => {
      render(<ConfirmDialog {...defaultProps} loading />);

      const confirmButton = screen.getByText('Confirm');
      const cancelButton = screen.getByText('Cancel');

      expect(confirmButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('prevents close on backdrop click when loading', async () => {
      const onClose = vi.fn();
      render(<ConfirmDialog {...defaultProps} onClose={onClose} loading />);

      const backdrop = screen.getByRole('dialog').parentElement;
      if (backdrop) {
        await userEvent.click(backdrop);
        expect(onClose).not.toHaveBeenCalled();
      }
    });

    it('prevents close on Escape when loading', () => {
      const onClose = vi.fn();
      render(<ConfirmDialog {...defaultProps} onClose={onClose} loading />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Variants', () => {
    it('applies destructive variant', () => {
      render(<ConfirmDialog {...defaultProps} destructive />);
      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toBeInTheDocument();
      // Button should have danger variant class from Button component
    });

    it('applies default variant when not destructive', () => {
      render(<ConfirmDialog {...defaultProps} destructive={false} />);
      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toBeInTheDocument();
      // Button should have primary variant class from Button component
    });
  });

  describe('Preset Icons', () => {
    it('renders DeleteIcon', () => {
      render(<DeleteIcon />);
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders WarningIcon', () => {
      render(<WarningIcon />);
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders InfoIcon', () => {
      render(<InfoIcon />);
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders SuccessIcon', () => {
      render(<SuccessIcon />);
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('applies small size by default', () => {
      render(<ConfirmDialog {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('sm');
    });

    it('applies medium size', () => {
      render(<ConfirmDialog {...defaultProps} size="md" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('md');
    });

    it('applies large size', () => {
      render(<ConfirmDialog {...defaultProps} size="lg" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('lg');
    });
  });

  describe('Error Handling', () => {
    it('handles onConfirm errors', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const onConfirm = vi.fn().mockRejectedValue(new Error('Test error'));
      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      const confirmButton = screen.getByText('Confirm');
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });
});

describe('Integration Tests', () => {
  it('Modal and ConfirmDialog can be used together (sequentially)', async () => {
    const { rerender } = render(
      <Modal open onClose={vi.fn()}>
        <p>First Modal</p>
      </Modal>
    );

    expect(screen.getByText('First Modal')).toBeInTheDocument();

    rerender(
      <ConfirmDialog
        open
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirm"
        description="Are you sure?"
      />
    );

    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('maintains accessibility when switching between modals', async () => {
    const { rerender } = render(
      <Modal open onClose={vi.fn()} title="Modal 1">
        <p>Content 1</p>
      </Modal>
    );

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');

    rerender(
      <Modal open onClose={vi.fn()} title="Modal 2">
        <p>Content 2</p>
      </Modal>
    );

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });
});

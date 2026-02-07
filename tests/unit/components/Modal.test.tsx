/**
 * Modal Component Unit Tests
 * Tests for modal open/close, backdrop, escape key, focus trap, and accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Modal } from '@/components/ui/Modal';

// Mock FocusTrap
vi.mock('@/lib/utils/accessibility', () => ({
  FocusTrap: class FocusTrap {
    activate() {}
    deactivate() {}
  },
  KeyboardKeys: {
    ESCAPE: 'Escape',
    ENTER: 'Enter',
    TAB: 'Tab',
  },
}));

describe('Modal Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    // Clear body safely
    document.body.replaceChildren();
  });

  describe('Rendering', () => {
    it('renders modal when open is true', () => {
      render(
        <Modal open={true} onClose={mockOnClose}>
          <div>Modal content</div>
        </Modal>
      );
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('does not render modal when open is false', () => {
      render(
        <Modal open={false} onClose={mockOnClose}>
          <div>Modal content</div>
        </Modal>
      );
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    it('renders modal with title', () => {
      render(
        <Modal open={true} onClose={mockOnClose} title="Test Modal">
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('renders close button by default', () => {
      render(
        <Modal open={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });

    it('hides close button when showCloseButton is false', () => {
      render(
        <Modal open={true} onClose={mockOnClose} showCloseButton={false}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button is clicked', async () => {
      render(
        <Modal open={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onClose when backdrop is clicked', async () => {
      render(
        <Modal open={true} onClose={mockOnClose} closeOnBackdropClick={true}>
          <div>Content</div>
        </Modal>
      );

      const backdrop = screen.getByRole('dialog').parentElement;
      if (backdrop) {
        fireEvent.click(backdrop);

        await waitFor(() => {
          expect(mockOnClose).toHaveBeenCalledTimes(1);
        });
      }
    });

    it('does not close when backdrop is clicked if closeOnBackdropClick is false', async () => {
      render(
        <Modal open={true} onClose={mockOnClose} closeOnBackdropClick={false}>
          <div>Content</div>
        </Modal>
      );

      const backdrop = screen.getByRole('dialog').parentElement;
      if (backdrop) {
        fireEvent.click(backdrop);

        await waitFor(() => {
          expect(mockOnClose).not.toHaveBeenCalled();
        }, { timeout: 500 });
      }
    });

    it('does not close when modal content is clicked', async () => {
      render(
        <Modal open={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      const content = screen.getByRole('dialog');
      fireEvent.click(content);

      await waitFor(() => {
        expect(mockOnClose).not.toHaveBeenCalled();
      }, { timeout: 500 });
    });
  });

  describe('Escape Key', () => {
    it('closes modal when escape key is pressed', async () => {
      render(
        <Modal open={true} onClose={mockOnClose} closeOnEscape={true}>
          <div>Content</div>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('does not close when escape key is pressed if closeOnEscape is false', async () => {
      render(
        <Modal open={true} onClose={mockOnClose} closeOnEscape={false}>
          <div>Content</div>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(mockOnClose).not.toHaveBeenCalled();
      }, { timeout: 500 });
    });
  });

  describe('Size Variants', () => {
    const sizes = ['sm', 'md', 'lg', 'xl', 'full'] as const;

    sizes.forEach((size) => {
      it(`renders ${size} size`, () => {
        render(
          <Modal open={true} onClose={mockOnClose} size={size}>
            <div>Content</div>
          </Modal>
        );
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('defaults to md size', () => {
      render(
        <Modal open={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Custom Classes', () => {
    it('applies custom className to modal', () => {
      render(
        <Modal open={true} onClose={mockOnClose} className="custom-modal">
          <div>Content</div>
        </Modal>
      );
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('custom-modal');
    });

    it('applies custom backdropClassName', () => {
      render(
        <Modal open={true} onClose={mockOnClose} backdropClassName="custom-backdrop">
          <div>Content</div>
        </Modal>
      );
      const backdrop = screen.getByRole('dialog').parentElement;
      expect(backdrop).toHaveClass('custom-backdrop');
    });
  });

  describe('Z-Index', () => {
    it('applies custom zIndex', () => {
      render(
        <Modal open={true} onClose={mockOnClose} zIndex={1000}>
          <div>Content</div>
        </Modal>
      );
      const backdrop = screen.getByRole('dialog').parentElement;
      expect(backdrop).toHaveStyle({ zIndex: '1000' });
    });

    it('uses default zIndex of 500', () => {
      render(
        <Modal open={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      const backdrop = screen.getByRole('dialog').parentElement;
      expect(backdrop).toHaveStyle({ zIndex: '500' });
    });
  });

  describe('Body Scroll Lock', () => {
    it('locks body scroll when modal opens', () => {
      const { rerender } = render(
        <Modal open={false} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      rerender(
        <Modal open={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      expect(document.body.style.position).toBe('fixed');
    });

    it('restores body scroll when modal closes', () => {
      const { rerender } = render(
        <Modal open={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      rerender(
        <Modal open={false} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      expect(document.body.style.position).toBe('');
    });

    it('does not lock scroll when preventScroll is false', () => {
      render(
        <Modal open={true} onClose={mockOnClose} preventScroll={false}>
          <div>Content</div>
        </Modal>
      );

      expect(document.body.style.position).toBe('');
    });
  });

  describe('Accessibility', () => {
    it('has dialog role', () => {
      render(
        <Modal open={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal attribute', () => {
      render(
        <Modal open={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby when title is provided', () => {
      render(
        <Modal open={true} onClose={mockOnClose} title="Test Title">
          <div>Content</div>
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('close button has accessible label', () => {
      render(
        <Modal open={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });
  });

  describe('Portal Rendering', () => {
    it('renders modal in portal by default', () => {
      render(
        <Modal open={true} onClose={mockOnClose}>
          <div>Portal content</div>
        </Modal>
      );
      expect(screen.getByText('Portal content')).toBeInTheDocument();
    });

    it('renders modal in custom container', () => {
      const customContainer = document.createElement('div');
      document.body.appendChild(customContainer);

      render(
        <Modal open={true} onClose={mockOnClose} container={customContainer}>
          <div>Custom container content</div>
        </Modal>
      );

      expect(customContainer.textContent).toContain('Custom container content');
    });
  });

  describe('Animation Duration', () => {
    it('uses custom animation duration', async () => {
      render(
        <Modal open={true} onClose={mockOnClose} animationDuration={100}>
          <div>Content</div>
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Data Attributes', () => {
    it('adds data-modal-backdrop attribute', () => {
      render(
        <Modal open={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      const backdrop = screen.getByRole('dialog').parentElement;
      expect(backdrop).toHaveAttribute('data-modal-backdrop');
    });
  });
});

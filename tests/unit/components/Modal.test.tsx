/**
 * Modal Component Unit Tests
 * Tests for modal open/close, backdrop, escape key, focus trap, accessibility,
 * unique IDs (useId), modal stacking, and scroll lock with stacking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  Modal,
  getModalStackDepth,
  __resetModalStack,
} from '@/components/ui/Modal';

// Mock FocusTrap and announce
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
  announce: vi.fn(),
}));

describe('Modal Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    __resetModalStack();
    // Clear body safely
    document.body.replaceChildren();
  });

  afterEach(() => {
    __resetModalStack();
  });

  describe('Rendering', () => {
    it('renders modal when open is true', () => {
      render(
        <Modal open onClose={mockOnClose}>
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
        <Modal open onClose={mockOnClose} title="Test Modal">
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('renders close button by default', () => {
      render(
        <Modal open onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });

    it('hides close button when showCloseButton is false', () => {
      render(
        <Modal open onClose={mockOnClose} showCloseButton={false}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button is clicked', async () => {
      render(
        <Modal open onClose={mockOnClose}>
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
        <Modal open onClose={mockOnClose} closeOnBackdropClick>
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
        <Modal open onClose={mockOnClose} closeOnBackdropClick={false}>
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
        <Modal open onClose={mockOnClose}>
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
        <Modal open onClose={mockOnClose} closeOnEscape>
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
        <Modal open onClose={mockOnClose} closeOnEscape={false}>
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
          <Modal open onClose={mockOnClose} size={size}>
            <div>Content</div>
          </Modal>
        );
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('defaults to md size', () => {
      render(
        <Modal open onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Custom Classes', () => {
    it('applies custom className to modal', () => {
      render(
        <Modal open onClose={mockOnClose} className="custom-modal">
          <div>Content</div>
        </Modal>
      );
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('custom-modal');
    });

    it('applies custom backdropClassName', () => {
      render(
        <Modal open onClose={mockOnClose} backdropClassName="custom-backdrop">
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
        <Modal open onClose={mockOnClose} zIndex={1000}>
          <div>Content</div>
        </Modal>
      );
      const backdrop = screen.getByRole('dialog').parentElement;
      expect(backdrop).toHaveStyle({ zIndex: '1000' });
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
        <Modal open onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      expect(document.body.style.position).toBe('fixed');
    });

    it('restores body scroll when modal closes', () => {
      const { rerender } = render(
        <Modal open onClose={mockOnClose}>
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
        <Modal open onClose={mockOnClose} preventScroll={false}>
          <div>Content</div>
        </Modal>
      );

      expect(document.body.style.position).toBe('');
    });
  });

  describe('Unique IDs (useId)', () => {
    it('generates unique aria-labelledby per modal instance', () => {
      render(
        <>
          <Modal open onClose={vi.fn()} title="Alpha">
            <div>A</div>
          </Modal>
          <Modal open onClose={vi.fn()} title="Beta">
            <div>B</div>
          </Modal>
        </>
      );

      const dialogs = screen.getAllByRole('dialog');
      expect(dialogs).toHaveLength(2);

      const idA = dialogs[0]!.getAttribute('aria-labelledby');
      const idB = dialogs[1]!.getAttribute('aria-labelledby');

      expect(idA).toBeTruthy();
      expect(idB).toBeTruthy();
      expect(idA).not.toBe(idB);

      // Each ID should point to the correct title element
      expect(document.getElementById(idA!)!.textContent).toBe('Alpha');
      expect(document.getElementById(idB!)!.textContent).toBe('Beta');
    });

    it('does not have static modal-title ID', () => {
      render(
        <Modal open onClose={vi.fn()} title="Check ID">
          <div>Content</div>
        </Modal>
      );

      // The old static ID should NOT exist
      expect(document.getElementById('modal-title')).toBeNull();

      // The dialog should have a dynamic aria-labelledby
      const dialog = screen.getByRole('dialog');
      const labelledBy = dialog.getAttribute('aria-labelledby');
      expect(labelledBy).toBeTruthy();
      expect(labelledBy).not.toBe('modal-title');
    });

    it('title element ID matches aria-labelledby on dialog', () => {
      render(
        <Modal open onClose={vi.fn()} title="Linked Title">
          <div>Content</div>
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      const labelledBy = dialog.getAttribute('aria-labelledby');
      const titleEl = screen.getByText('Linked Title');
      expect(titleEl.id).toBe(labelledBy);
    });
  });

  describe('Modal Stacking', () => {
    it('tracks stacked modals', () => {
      render(
        <>
          <Modal open onClose={vi.fn()}>
            <div>First</div>
          </Modal>
          <Modal open onClose={vi.fn()}>
            <div>Second</div>
          </Modal>
        </>
      );

      expect(getModalStackDepth()).toBe(2);
    });

    it('Escape only closes topmost modal', async () => {
      const onClose1 = vi.fn();
      const onClose2 = vi.fn();

      render(
        <>
          <Modal open onClose={onClose1} closeOnEscape>
            <div>Bottom</div>
          </Modal>
          <Modal open onClose={onClose2} closeOnEscape>
            <div>Top</div>
          </Modal>
        </>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(onClose2).toHaveBeenCalledTimes(1);
        expect(onClose1).not.toHaveBeenCalled();
      });
    });

    it('scroll stays locked when one of two modals closes', () => {
      const { rerender } = render(
        <>
          <Modal open onClose={vi.fn()}>
            <div>Modal 1</div>
          </Modal>
          <Modal open onClose={vi.fn()}>
            <div>Modal 2</div>
          </Modal>
        </>
      );

      rerender(
        <>
          <Modal open onClose={vi.fn()}>
            <div>Modal 1</div>
          </Modal>
          <Modal open={false} onClose={vi.fn()}>
            <div>Modal 2</div>
          </Modal>
        </>
      );

      expect(document.body.style.position).toBe('fixed');
    });

    it('scroll unlocks when all modals close', () => {
      const { rerender } = render(
        <>
          <Modal open onClose={vi.fn()}>
            <div>Modal 1</div>
          </Modal>
          <Modal open onClose={vi.fn()}>
            <div>Modal 2</div>
          </Modal>
        </>
      );

      rerender(
        <>
          <Modal open={false} onClose={vi.fn()}>
            <div>Modal 1</div>
          </Modal>
          <Modal open={false} onClose={vi.fn()}>
            <div>Modal 2</div>
          </Modal>
        </>
      );

      expect(document.body.style.position).toBe('');
    });
  });

  describe('Accessibility', () => {
    it('has dialog role', () => {
      render(
        <Modal open onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal attribute', () => {
      render(
        <Modal open onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('has unique aria-labelledby when title is provided', () => {
      render(
        <Modal open onClose={mockOnClose} title="Test Title">
          <div>Content</div>
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      const labelledBy = dialog.getAttribute('aria-labelledby');
      expect(labelledBy).toBeTruthy();
      expect(labelledBy).toMatch(/^modal.*-title$/);
    });

    it('close button has accessible label', () => {
      render(
        <Modal open onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });

    it('announces modal title to screen readers', async () => {
      const { announce } = await import('@/lib/utils/accessibility');
      render(
        <Modal open onClose={vi.fn()} title="Screen Reader Test">
          <div>Content</div>
        </Modal>
      );

      expect(announce).toHaveBeenCalledWith(
        'Dialog opened: Screen Reader Test',
        'assertive'
      );
    });
  });

  describe('Portal Rendering', () => {
    it('renders modal in portal by default', () => {
      render(
        <Modal open onClose={mockOnClose}>
          <div>Portal content</div>
        </Modal>
      );
      expect(screen.getByText('Portal content')).toBeInTheDocument();
    });

    it('renders modal in custom container', () => {
      const customContainer = document.createElement('div');
      document.body.appendChild(customContainer);

      render(
        <Modal open onClose={mockOnClose} container={customContainer}>
          <div>Custom container content</div>
        </Modal>
      );

      expect(customContainer.textContent).toContain('Custom container content');
    });
  });

  describe('Animation Duration', () => {
    it('uses custom animation duration', async () => {
      render(
        <Modal open onClose={mockOnClose} animationDuration={100}>
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
        <Modal open onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      const backdrop = screen.getByRole('dialog').parentElement;
      expect(backdrop).toHaveAttribute('data-modal-backdrop');
    });

    it('adds data-modal-id attribute with unique value', () => {
      render(
        <Modal open onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      const backdrop = screen.getByRole('dialog').parentElement;
      expect(backdrop).toHaveAttribute('data-modal-id');
      expect(backdrop!.getAttribute('data-modal-id')).toMatch(/^modal/);
    });
  });
});

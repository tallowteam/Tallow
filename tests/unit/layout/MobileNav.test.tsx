import { render, screen, fireEvent } from '@testing-library/react';
import { MobileNav } from '@/components/layout/MobileNav';

describe('MobileNav', () => {
  beforeEach(() => {
    // Create portal root
    const portalRoot = document.createElement('div');
    portalRoot.setAttribute('id', 'portal-root');
    document.body.appendChild(portalRoot);
  });

  afterEach(() => {
    // Clean up
    document.body.style.overflow = '';
    const portalRoot = document.getElementById('portal-root');
    if (portalRoot) {
      document.body.removeChild(portalRoot);
    }
  });

  it('renders children when open', () => {
    render(
      <MobileNav isOpen={true} onClose={() => {}}>
        <div>Nav Content</div>
      </MobileNav>
    );

    expect(screen.getByText('Nav Content')).toBeInTheDocument();
  });

  it('does not render drawer when closed', () => {
    const { container } = render(
      <MobileNav isOpen={false} onClose={() => {}}>
        <div>Nav Content</div>
      </MobileNav>
    );

    // Drawer should have translate-x-full when closed
    const drawer = container.querySelector('[role="dialog"]');
    expect(drawer).toHaveClass('translate-x-full');
  });

  it('applies translate-x-0 when open', () => {
    const { container } = render(
      <MobileNav isOpen={true} onClose={() => {}}>
        <div>Nav Content</div>
      </MobileNav>
    );

    const drawer = container.querySelector('[role="dialog"]');
    expect(drawer).toHaveClass('translate-x-0');
  });

  it('renders backdrop when open', () => {
    const { container } = render(
      <MobileNav isOpen={true} onClose={() => {}}>
        <div>Nav Content</div>
      </MobileNav>
    );

    const backdrop = container.querySelector('[aria-hidden="true"]');
    expect(backdrop).toBeInTheDocument();
    expect(backdrop).toHaveClass('opacity-100');
  });

  it('hides backdrop when closed', () => {
    const { container } = render(
      <MobileNav isOpen={false} onClose={() => {}}>
        <div>Nav Content</div>
      </MobileNav>
    );

    const backdrop = container.querySelector('[aria-hidden="true"]');
    expect(backdrop).toHaveClass('opacity-0', 'pointer-events-none');
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = jest.fn();
    const { container } = render(
      <MobileNav isOpen={true} onClose={onClose}>
        <div>Nav Content</div>
      </MobileNav>
    );

    const backdrop = container.querySelector('[aria-hidden="true"]');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <MobileNav isOpen={true} onClose={onClose}>
        <div>Nav Content</div>
      </MobileNav>
    );

    const closeButton = screen.getByLabelText('Close menu');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = jest.fn();
    render(
      <MobileNav isOpen={true} onClose={onClose}>
        <div>Nav Content</div>
      </MobileNav>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when Escape is pressed while closed', () => {
    const onClose = jest.fn();
    render(
      <MobileNav isOpen={false} onClose={onClose}>
        <div>Nav Content</div>
      </MobileNav>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('locks body scroll when open', () => {
    const { rerender } = render(
      <MobileNav isOpen={false} onClose={() => {}}>
        <div>Nav Content</div>
      </MobileNav>
    );

    expect(document.body.style.overflow).toBe('');

    rerender(
      <MobileNav isOpen={true} onClose={() => {}}>
        <div>Nav Content</div>
      </MobileNav>
    );

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('unlocks body scroll when closed', () => {
    const { rerender } = render(
      <MobileNav isOpen={true} onClose={() => {}}>
        <div>Nav Content</div>
      </MobileNav>
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <MobileNav isOpen={false} onClose={() => {}}>
        <div>Nav Content</div>
      </MobileNav>
    );

    expect(document.body.style.overflow).toBe('');
  });

  it('unlocks body scroll on unmount', () => {
    const { unmount } = render(
      <MobileNav isOpen={true} onClose={() => {}}>
        <div>Nav Content</div>
      </MobileNav>
    );

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('');
  });

  it('renders with proper ARIA attributes', () => {
    const { container } = render(
      <MobileNav isOpen={true} onClose={() => {}}>
        <div>Nav Content</div>
      </MobileNav>
    );

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Mobile navigation');
  });

  it('renders menu title', () => {
    render(
      <MobileNav isOpen={true} onClose={() => {}}>
        <div>Nav Content</div>
      </MobileNav>
    );

    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('applies correct z-index layers', () => {
    const { container } = render(
      <MobileNav isOpen={true} onClose={() => {}}>
        <div>Nav Content</div>
      </MobileNav>
    );

    const backdrop = container.querySelector('[aria-hidden="true"]');
    const drawer = container.querySelector('[role="dialog"]');

    expect(backdrop).toHaveClass('z-40');
    expect(drawer).toHaveClass('z-50');
  });

  it('applies slide transition classes', () => {
    const { container } = render(
      <MobileNav isOpen={true} onClose={() => {}}>
        <div>Nav Content</div>
      </MobileNav>
    );

    const drawer = container.querySelector('[role="dialog"]');
    expect(drawer).toHaveClass('transition-transform', 'duration-300', 'ease-out');
  });

  it('applies backdrop blur effect', () => {
    const { container } = render(
      <MobileNav isOpen={true} onClose={() => {}}>
        <div>Nav Content</div>
      </MobileNav>
    );

    const backdrop = container.querySelector('[aria-hidden="true"]');
    expect(backdrop).toHaveClass('backdrop-blur-sm');
  });
});

/**
 * Button Component Unit Tests
 * Tests for core button functionality, variants, sizes, and states
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders button with text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('renders button with children', () => {
      render(
        <Button>
          <span>Custom content</span>
        </Button>
      );
      expect(screen.getByText('Custom content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Click Handler', () => {
    it('calls onClick handler when clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} disabled>Click me</Button>);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} loading>Click me</Button>);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('renders disabled button', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('applies disabled attribute when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Variants', () => {
    const variants = ['primary', 'secondary', 'outline', 'ghost', 'danger', 'link'] as const;

    variants.forEach((variant) => {
      it(`renders ${variant} variant`, () => {
        render(<Button variant={variant}>{variant}</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
      });
    });

    it('defaults to primary variant', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    const sizes = ['sm', 'md', 'lg', 'icon'] as const;

    sizes.forEach((size) => {
      it(`renders ${size} size`, () => {
        render(<Button size={size}>{size}</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
      });
    });

    it('defaults to md size', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows spinner when loading', () => {
      render(<Button loading>Loading</Button>);
      const spinner = screen.getByRole('button').querySelector('svg');
      expect(spinner).toBeInTheDocument();
    });

    it('hides icon when loading', () => {
      render(
        <Button loading icon={<span data-testid="icon">Icon</span>}>
          Loading
        </Button>
      );
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    });

    it('shows children text when loading', () => {
      render(<Button loading>Loading text</Button>);
      expect(screen.getByText('Loading text')).toBeInTheDocument();
    });
  });

  describe('Icon Support', () => {
    it('renders icon on left by default', () => {
      render(
        <Button icon={<span data-testid="icon">Icon</span>}>
          Button
        </Button>
      );
      const button = screen.getByRole('button');
      const icon = screen.getByTestId('icon');
      const text = screen.getByText('Button');

      expect(icon).toBeInTheDocument();
      expect(text).toBeInTheDocument();

      // Icon should come before text in DOM order
      const children = Array.from(button.children);
      const iconIndex = children.findIndex(child => child.contains(icon));
      const textIndex = children.findIndex(child => child.contains(text));
      expect(iconIndex).toBeLessThan(textIndex);
    });

    it('renders icon on right when iconPosition is right', () => {
      render(
        <Button icon={<span data-testid="icon">Icon</span>} iconPosition="right">
          Button
        </Button>
      );
      const button = screen.getByRole('button');
      const icon = screen.getByTestId('icon');
      const text = screen.getByText('Button');

      expect(icon).toBeInTheDocument();
      expect(text).toBeInTheDocument();

      // Text should come before icon in DOM order
      const children = Array.from(button.children);
      const iconIndex = children.findIndex(child => child.contains(icon));
      const textIndex = children.findIndex(child => child.contains(text));
      expect(textIndex).toBeLessThan(iconIndex);
    });

    it('renders icon only when no children', () => {
      render(<Button icon={<span data-testid="icon">Icon</span>} />);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  describe('Full Width', () => {
    it('renders full width button', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to button element', () => {
      const ref = { current: null as HTMLButtonElement | null };
      render(<Button ref={ref}>Button</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('HTML Button Attributes', () => {
    it('supports type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('supports aria-label', () => {
      render(<Button aria-label="Custom label">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
    });

    it('supports data attributes', () => {
      render(<Button data-testid="custom-button">Button</Button>);
      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has button role', () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('is keyboard accessible', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Button</Button>);

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('spinner has aria-hidden when loading', () => {
      render(<Button loading>Loading</Button>);
      const spinner = screen.getByRole('button').querySelector('[aria-hidden="true"]');
      expect(spinner).toBeInTheDocument();
    });
  });
});

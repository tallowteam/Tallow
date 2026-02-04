/**
 * Button Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/tests/utils/render';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  describe('Rendering', () => {
    it('should render with children', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('should apply default variant and size', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('button', 'primary', 'md');
    });

    it('should apply custom variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('secondary');
    });

    it('should apply custom size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('lg');
    });

    it('should apply fullWidth class', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('fullWidth');
    });

    it('should apply custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should show loading spinner when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();
    });

    it('should hide content when loading', () => {
      render(<Button loading>Loading Text</Button>);
      const content = screen.getByText('Loading Text');
      expect(content.parentElement).toHaveClass('contentHidden');
    });
  });

  describe('Variants', () => {
    it.each([
      ['primary', 'primary'],
      ['secondary', 'secondary'],
      ['ghost', 'ghost'],
      ['danger', 'danger'],
      ['icon', 'icon'],
    ] as const)('should render %s variant', (variant, className) => {
      render(<Button variant={variant}>{variant}</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass(className);
    });
  });

  describe('Sizes', () => {
    it.each([
      ['sm', 'sm'],
      ['md', 'md'],
      ['lg', 'lg'],
    ] as const)('should render %s size', (size, className) => {
      render(<Button size={size}>{size}</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass(className);
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click</Button>);
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button loading onClick={handleClick}>
          Loading
        </Button>
      );
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle form submission', () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());

      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Submit</Button>
        </form>
      );

      const button = screen.getByRole('button');
      button.click();

      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible role', () => {
      render(<Button>Accessible</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should support aria-label', () => {
      render(<Button aria-label="Close dialog">×</Button>);
      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
    });

    it('should set aria-busy when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('should forward ref', () => {
      const ref = vi.fn();
      render(<Button ref={ref}>Ref Test</Button>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('Props spreading', () => {
    it('should spread additional props', () => {
      render(
        <Button data-testid="custom-button" title="Tooltip">
          Props
        </Button>
      );
      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('title', 'Tooltip');
    });

    it('should support type attribute', () => {
      render(<Button type="button">Button Type</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });
  });
});

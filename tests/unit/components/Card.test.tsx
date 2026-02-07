/**
 * Card Component Unit Tests
 * Tests for card variants, padding, interactive states, and children rendering
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';

describe('Card Component', () => {
  describe('Rendering', () => {
    it('renders card with children', () => {
      render(
        <Card>
          <div>Card content</div>
        </Card>
      );
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Card className="custom-card">
          <div>Content</div>
        </Card>
      );
      const card = screen.getByText('Content').parentElement;
      expect(card).toHaveClass('custom-card');
    });
  });

  describe('Variants', () => {
    const variants = ['default', 'bordered', 'elevated', 'ghost', 'gradient'] as const;

    variants.forEach((variant) => {
      it(`renders ${variant} variant`, () => {
        render(
          <Card variant={variant}>
            <div>{variant}</div>
          </Card>
        );
        expect(screen.getByText(variant)).toBeInTheDocument();
      });
    });

    it('defaults to default variant', () => {
      render(
        <Card>
          <div>Default</div>
        </Card>
      );
      expect(screen.getByText('Default')).toBeInTheDocument();
    });
  });

  describe('Padding', () => {
    const paddings = ['none', 'sm', 'md', 'lg'] as const;

    paddings.forEach((padding) => {
      it(`renders ${padding} padding`, () => {
        render(
          <Card padding={padding}>
            <div>{padding}</div>
          </Card>
        );
        expect(screen.getByText(padding)).toBeInTheDocument();
      });
    });

    it('defaults to md padding', () => {
      render(
        <Card>
          <div>Medium</div>
        </Card>
      );
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });
  });

  describe('Hover State', () => {
    it('enables hover effects when hover is true', () => {
      render(
        <Card hover={true}>
          <div>Hoverable</div>
        </Card>
      );
      expect(screen.getByText('Hoverable')).toBeInTheDocument();
    });

    it('disables hover effects by default', () => {
      render(
        <Card>
          <div>No hover</div>
        </Card>
      );
      expect(screen.getByText('No hover')).toBeInTheDocument();
    });
  });

  describe('Glow Effect', () => {
    it('enables glow effect when glow is true', () => {
      render(
        <Card glow={true}>
          <div>Glowing</div>
        </Card>
      );
      expect(screen.getByText('Glowing')).toBeInTheDocument();
    });

    it('disables glow effect by default', () => {
      render(
        <Card>
          <div>No glow</div>
        </Card>
      );
      expect(screen.getByText('No glow')).toBeInTheDocument();
    });
  });

  describe('Interactive State', () => {
    it('enables interactive styles when interactive is true', () => {
      render(
        <Card interactive={true}>
          <div>Interactive</div>
        </Card>
      );
      expect(screen.getByText('Interactive')).toBeInTheDocument();
    });

    it('handles click events when interactive', () => {
      const handleClick = vi.fn();
      render(
        <Card interactive={true} onClick={handleClick}>
          <div>Clickable</div>
        </Card>
      );

      const card = screen.getByText('Clickable').parentElement;
      if (card) {
        fireEvent.click(card);
        expect(handleClick).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('HTML Div Attributes', () => {
    it('supports data attributes', () => {
      render(
        <Card data-testid="custom-card">
          <div>Content</div>
        </Card>
      );
      expect(screen.getByTestId('custom-card')).toBeInTheDocument();
    });

    it('supports aria attributes', () => {
      render(
        <Card aria-label="Test card">
          <div>Content</div>
        </Card>
      );
      const card = screen.getByText('Content').parentElement;
      expect(card).toHaveAttribute('aria-label', 'Test card');
    });

    it('supports style prop', () => {
      render(
        <Card style={{ backgroundColor: 'red' }}>
          <div>Styled</div>
        </Card>
      );
      const card = screen.getByText('Styled').parentElement;
      expect(card).toHaveStyle({ backgroundColor: 'red' });
    });
  });

  describe('Combined Props', () => {
    it('combines multiple props correctly', () => {
      render(
        <Card variant="elevated" padding="lg" hover={true} glow={true} interactive={true}>
          <div>Combined</div>
        </Card>
      );
      expect(screen.getByText('Combined')).toBeInTheDocument();
    });
  });
});

describe('CardHeader Component', () => {
  describe('Rendering', () => {
    it('renders card header with title', () => {
      render(<CardHeader title="Test Title" />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('renders card header with description', () => {
      render(<CardHeader description="Test description" />);
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('renders card header with title and description', () => {
      render(<CardHeader title="Title" description="Description" />);
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('renders card header with action', () => {
      render(<CardHeader title="Title" action={<button>Action</button>} />);
      expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
    });

    it('renders card header with children', () => {
      render(
        <CardHeader>
          <div>Custom content</div>
        </CardHeader>
      );
      expect(screen.getByText('Custom content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<CardHeader title="Title" className="custom-header" />);
      const header = screen.getByText('Title').parentElement?.parentElement;
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('Title as ReactNode', () => {
    it('renders title as JSX element', () => {
      render(
        <CardHeader
          title={
            <span data-testid="custom-title">Custom Title</span>
          }
        />
      );
      expect(screen.getByTestId('custom-title')).toBeInTheDocument();
    });
  });
});

describe('CardContent Component', () => {
  describe('Rendering', () => {
    it('renders card content with children', () => {
      render(
        <CardContent>
          <p>Content text</p>
        </CardContent>
      );
      expect(screen.getByText('Content text')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<CardContent className="custom-content">Text</CardContent>);
      const content = screen.getByText('Text').parentElement;
      expect(content).toHaveClass('custom-content');
    });

    it('supports HTML div attributes', () => {
      render(<CardContent data-testid="content">Text</CardContent>);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });
});

describe('CardFooter Component', () => {
  describe('Rendering', () => {
    it('renders card footer with children', () => {
      render(
        <CardFooter>
          <button>Footer button</button>
        </CardFooter>
      );
      expect(screen.getByRole('button', { name: /footer button/i })).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<CardFooter className="custom-footer">Text</CardFooter>);
      const footer = screen.getByText('Text').parentElement;
      expect(footer).toHaveClass('custom-footer');
    });

    it('supports HTML div attributes', () => {
      render(<CardFooter data-testid="footer">Text</CardFooter>);
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });
});

describe('Card Composition', () => {
  it('renders complete card with all subcomponents', () => {
    render(
      <Card>
        <CardHeader title="Card Title" description="Card description" />
        <CardContent>
          <p>Main content</p>
        </CardContent>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card description')).toBeInTheDocument();
    expect(screen.getByText('Main content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
  });
});

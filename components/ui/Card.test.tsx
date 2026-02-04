/**
 * Card Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/utils/render';
import { Card, CardHeader, CardBody, CardFooter } from './Card';

describe('Card', () => {
  describe('Card Component', () => {
    it('should render children', () => {
      render(<Card>Card Content</Card>);
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('should apply default variant', () => {
      render(<Card>Default Card</Card>);
      const card = screen.getByText('Default Card').parentElement;
      expect(card).toHaveClass('card', 'default');
    });

    it('should apply highlighted variant', () => {
      render(<Card variant="highlighted">Highlighted</Card>);
      const card = screen.getByText('Highlighted').parentElement;
      expect(card).toHaveClass('highlighted');
    });

    it('should apply interactive variant', () => {
      render(<Card variant="interactive">Interactive</Card>);
      const card = screen.getByText('Interactive').parentElement;
      expect(card).toHaveClass('interactive');
    });

    it('should apply custom className', () => {
      render(<Card className="custom-class">Custom</Card>);
      const card = screen.getByText('Custom').parentElement;
      expect(card).toHaveClass('custom-class');
    });

    it('should forward ref', () => {
      const ref = { current: null };
      render(<Card ref={ref}>Ref Test</Card>);
      expect(ref.current).toBeTruthy();
    });
  });

  describe('CardHeader Component', () => {
    it('should render children', () => {
      render(<CardHeader>Header Content</CardHeader>);
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('should apply header class', () => {
      render(<CardHeader>Header</CardHeader>);
      const header = screen.getByText('Header').parentElement;
      expect(header).toHaveClass('header');
    });

    it('should apply custom className', () => {
      render(<CardHeader className="custom">Custom Header</CardHeader>);
      const header = screen.getByText('Custom Header').parentElement;
      expect(header).toHaveClass('header', 'custom');
    });
  });

  describe('CardBody Component', () => {
    it('should render children', () => {
      render(<CardBody>Body Content</CardBody>);
      expect(screen.getByText('Body Content')).toBeInTheDocument();
    });

    it('should apply body class', () => {
      render(<CardBody>Body</CardBody>);
      const body = screen.getByText('Body').parentElement;
      expect(body).toHaveClass('body');
    });

    it('should apply custom className', () => {
      render(<CardBody className="custom">Custom Body</CardBody>);
      const body = screen.getByText('Custom Body').parentElement;
      expect(body).toHaveClass('body', 'custom');
    });
  });

  describe('CardFooter Component', () => {
    it('should render children', () => {
      render(<CardFooter>Footer Content</CardFooter>);
      expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    it('should apply footer class', () => {
      render(<CardFooter>Footer</CardFooter>);
      const footer = screen.getByText('Footer').parentElement;
      expect(footer).toHaveClass('footer');
    });

    it('should apply custom className', () => {
      render(<CardFooter className="custom">Custom Footer</CardFooter>);
      const footer = screen.getByText('Custom Footer').parentElement;
      expect(footer).toHaveClass('footer', 'custom');
    });
  });

  describe('Composite Card', () => {
    it('should render complete card structure', () => {
      render(
        <Card>
          <CardHeader>Header</CardHeader>
          <CardBody>Body</CardBody>
          <CardFooter>Footer</CardFooter>
        </Card>
      );

      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Body')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    it('should work with partial structure', () => {
      render(
        <Card>
          <CardHeader>Header Only</CardHeader>
        </Card>
      );

      expect(screen.getByText('Header Only')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should spread aria attributes', () => {
      render(
        <Card aria-label="Information card" role="article">
          Content
        </Card>
      );
      const card = screen.getByLabelText('Information card');
      expect(card).toHaveAttribute('role', 'article');
    });

    it('should support data attributes', () => {
      render(<Card data-testid="test-card">Test</Card>);
      expect(screen.getByTestId('test-card')).toBeInTheDocument();
    });
  });
});

import { render, screen } from '@testing-library/react';
import { Grid, GridColumns, GridGap } from '@/components/layout/Grid';

describe('Grid', () => {
  it('renders children correctly', () => {
    render(
      <Grid>
        <div>Item 1</div>
        <div>Item 2</div>
      </Grid>
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('applies grid base class', () => {
    const { container } = render(<Grid>Test</Grid>);
    expect(container.firstChild).toHaveClass('grid');
  });

  it.each<GridColumns>([1, 2, 3, 4])(
    'applies %i column responsive classes correctly',
    (cols) => {
      const { container } = render(<Grid cols={cols}>Test</Grid>);
      const element = container.firstChild as HTMLElement;

      const colMap: Record<GridColumns, string[]> = {
        1: ['grid-cols-1'],
        2: ['grid-cols-1', 'sm:grid-cols-2'],
        3: ['grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3'],
        4: ['grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-4'],
      };

      colMap[cols].forEach((className) => {
        expect(element).toHaveClass(className);
      });
    }
  );

  it.each<GridGap>(['sm', 'md', 'lg', 'xl'])(
    'applies %s gap class correctly',
    (gap) => {
      const { container } = render(<Grid gap={gap}>Test</Grid>);
      const element = container.firstChild as HTMLElement;

      const gapMap: Record<GridGap, string> = {
        sm: 'gap-4',
        md: 'gap-6',
        lg: 'gap-8',
        xl: 'gap-12',
      };

      expect(element).toHaveClass(gapMap[gap]);
    }
  );

  it('applies default gap and column classes', () => {
    const { container } = render(<Grid>Test</Grid>);
    expect(container.firstChild).toHaveClass('gap-6', 'grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3');
  });

  it('merges custom className', () => {
    const { container } = render(<Grid className="custom-class">Test</Grid>);
    expect(container.firstChild).toHaveClass('custom-class', 'grid');
  });

  it('disables responsive behavior when responsive=false', () => {
    const { container } = render(
      <Grid cols={3} responsive={false}>
        Test
      </Grid>
    );
    const element = container.firstChild as HTMLElement;

    // Should not have responsive classes
    expect(element).not.toHaveClass('sm:grid-cols-2');
    expect(element).not.toHaveClass('lg:grid-cols-3');
  });

  it('renders multiple children in grid layout', () => {
    render(
      <Grid cols={2}>
        <div data-testid="item-1">Item 1</div>
        <div data-testid="item-2">Item 2</div>
        <div data-testid="item-3">Item 3</div>
      </Grid>
    );

    expect(screen.getByTestId('item-1')).toBeInTheDocument();
    expect(screen.getByTestId('item-2')).toBeInTheDocument();
    expect(screen.getByTestId('item-3')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import { Stack, StackDirection, StackGap, StackAlign, StackJustify } from '@/components/layout/Stack';

describe('Stack', () => {
  it('renders children correctly', () => {
    render(
      <Stack>
        <div>Item 1</div>
        <div>Item 2</div>
      </Stack>
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('applies flex base class', () => {
    const { container } = render(<Stack>Test</Stack>);
    expect(container.firstChild).toHaveClass('flex');
  });

  it.each<StackDirection>(['vertical', 'horizontal'])(
    'applies %s direction class correctly',
    (direction) => {
      const { container } = render(<Stack direction={direction}>Test</Stack>);
      const element = container.firstChild as HTMLElement;

      const directionMap: Record<StackDirection, string> = {
        vertical: 'flex-col',
        horizontal: 'flex-row',
      };

      expect(element).toHaveClass(directionMap[direction]);
    }
  );

  it.each<StackGap>(['xs', 'sm', 'md', 'lg', 'xl'])(
    'applies %s gap class correctly',
    (gap) => {
      const { container } = render(<Stack gap={gap}>Test</Stack>);
      const element = container.firstChild as HTMLElement;

      const gapMap: Record<StackGap, string> = {
        xs: 'gap-2',
        sm: 'gap-4',
        md: 'gap-6',
        lg: 'gap-8',
        xl: 'gap-12',
      };

      expect(element).toHaveClass(gapMap[gap]);
    }
  );

  it.each<StackAlign>(['start', 'center', 'end', 'stretch'])(
    'applies %s align class correctly',
    (align) => {
      const { container } = render(<Stack align={align}>Test</Stack>);
      const element = container.firstChild as HTMLElement;

      const alignMap: Record<StackAlign, string> = {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        stretch: 'items-stretch',
      };

      expect(element).toHaveClass(alignMap[align]);
    }
  );

  it.each<StackJustify>(['start', 'center', 'end', 'between', 'around'])(
    'applies %s justify class correctly',
    (justify) => {
      const { container } = render(<Stack justify={justify}>Test</Stack>);
      const element = container.firstChild as HTMLElement;

      const justifyMap: Record<StackJustify, string> = {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
        between: 'justify-between',
        around: 'justify-around',
      };

      expect(element).toHaveClass(justifyMap[justify]);
    }
  );

  it('applies default classes', () => {
    const { container } = render(<Stack>Test</Stack>);
    expect(container.firstChild).toHaveClass(
      'flex',
      'flex-col',
      'gap-6',
      'items-stretch',
      'justify-start'
    );
  });

  it('applies wrap class when wrap=true', () => {
    const { container } = render(<Stack wrap>Test</Stack>);
    expect(container.firstChild).toHaveClass('flex-wrap');
  });

  it('does not apply wrap class when wrap=false', () => {
    const { container } = render(<Stack wrap={false}>Test</Stack>);
    expect(container.firstChild).not.toHaveClass('flex-wrap');
  });

  it('merges custom className', () => {
    const { container } = render(<Stack className="custom-class">Test</Stack>);
    expect(container.firstChild).toHaveClass('custom-class', 'flex');
  });

  it('combines multiple props correctly', () => {
    const { container } = render(
      <Stack
        direction="horizontal"
        gap="lg"
        align="center"
        justify="between"
        wrap
      >
        Test
      </Stack>
    );

    expect(container.firstChild).toHaveClass(
      'flex',
      'flex-row',
      'gap-8',
      'items-center',
      'justify-between',
      'flex-wrap'
    );
  });

  it('renders multiple children with proper spacing', () => {
    const { container } = render(
      <Stack gap="md">
        <div data-testid="item-1">Item 1</div>
        <div data-testid="item-2">Item 2</div>
        <div data-testid="item-3">Item 3</div>
      </Stack>
    );

    expect(screen.getByTestId('item-1')).toBeInTheDocument();
    expect(screen.getByTestId('item-2')).toBeInTheDocument();
    expect(screen.getByTestId('item-3')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('gap-6');
  });
});

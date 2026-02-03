import { render, screen } from '@testing-library/react';
import { Container, ContainerSize } from '@/components/layout/Container';

describe('Container', () => {
  it('renders children correctly', () => {
    render(<Container>Test content</Container>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies default size class', () => {
    const { container } = render(<Container>Test</Container>);
    expect(container.firstChild).toHaveClass('max-w-7xl');
  });

  it.each<ContainerSize>(['sm', 'md', 'lg', 'xl', 'full'])(
    'applies %s size class correctly',
    (size) => {
      const { container } = render(<Container size={size}>Test</Container>);
      const element = container.firstChild as HTMLElement;

      const sizeMap: Record<ContainerSize, string> = {
        sm: 'max-w-3xl',
        md: 'max-w-5xl',
        lg: 'max-w-7xl',
        xl: 'max-w-[1400px]',
        full: 'max-w-full',
      };

      expect(element).toHaveClass(sizeMap[size]);
    }
  );

  it('applies responsive padding classes', () => {
    const { container } = render(<Container>Test</Container>);
    expect(container.firstChild).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
  });

  it('applies centering classes', () => {
    const { container } = render(<Container>Test</Container>);
    expect(container.firstChild).toHaveClass('mx-auto', 'w-full');
  });

  it('merges custom className', () => {
    const { container } = render(
      <Container className="custom-class">Test</Container>
    );
    expect(container.firstChild).toHaveClass('custom-class', 'max-w-7xl');
  });

  it('renders as specified HTML element', () => {
    const { container: divContainer } = render(
      <Container as="div">Div</Container>
    );
    expect(divContainer.firstChild?.nodeName).toBe('DIV');

    const { container: sectionContainer } = render(
      <Container as="section">Section</Container>
    );
    expect(sectionContainer.firstChild?.nodeName).toBe('SECTION');

    const { container: articleContainer } = render(
      <Container as="article">Article</Container>
    );
    expect(articleContainer.firstChild?.nodeName).toBe('ARTICLE');

    const { container: mainContainer } = render(
      <Container as="main">Main</Container>
    );
    expect(mainContainer.firstChild?.nodeName).toBe('MAIN');
  });

  it('renders nested content correctly', () => {
    render(
      <Container>
        <div>
          <h1>Title</h1>
          <p>Paragraph</p>
        </div>
      </Container>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Paragraph')).toBeInTheDocument();
  });
});

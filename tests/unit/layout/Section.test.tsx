import { render, screen } from '@testing-library/react';
import { Section, SectionVariant } from '@/components/layout/Section';

describe('Section', () => {
  it('renders children correctly', () => {
    render(<Section>Test content</Section>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies default variant class', () => {
    const { container } = render(<Section>Test</Section>);
    expect(container.firstChild).toHaveClass('bg-transparent');
  });

  it.each<SectionVariant>(['default', 'accent', 'muted', 'gradient'])(
    'applies %s variant class correctly',
    (variant) => {
      const { container } = render(<Section variant={variant}>Test</Section>);
      const element = container.firstChild as HTMLElement;

      const variantMap: Record<SectionVariant, RegExp> = {
        default: /bg-transparent/,
        accent: /bg-zinc-900\/50/,
        muted: /bg-zinc-950\/30/,
        gradient: /bg-gradient-to-b/,
      };

      expect(element.className).toMatch(variantMap[variant]);
    }
  );

  it('applies vertical padding classes', () => {
    const { container } = render(<Section>Test</Section>);
    expect(container.firstChild).toHaveClass('py-12', 'sm:py-16', 'lg:py-24');
  });

  it('applies id attribute when provided', () => {
    const { container } = render(<Section id="test-section">Test</Section>);
    expect(container.firstChild).toHaveAttribute('id', 'test-section');
  });

  it('merges custom className', () => {
    const { container } = render(
      <Section className="custom-class">Test</Section>
    );
    expect(container.firstChild).toHaveClass('custom-class', 'bg-transparent');
  });

  it('renders as specified HTML element', () => {
    const { container: sectionContainer } = render(
      <Section as="section">Section</Section>
    );
    expect(sectionContainer.firstChild?.nodeName).toBe('SECTION');

    const { container: divContainer } = render(
      <Section as="div">Div</Section>
    );
    expect(divContainer.firstChild?.nodeName).toBe('DIV');

    const { container: articleContainer } = render(
      <Section as="article">Article</Section>
    );
    expect(articleContainer.firstChild?.nodeName).toBe('ARTICLE');
  });

  it('applies relative positioning', () => {
    const { container } = render(<Section>Test</Section>);
    expect(container.firstChild).toHaveClass('relative');
  });

  it('works with anchor links', () => {
    render(<Section id="features">Features Section</Section>);
    const section = screen.getByText('Features Section').parentElement;
    expect(section).toHaveAttribute('id', 'features');
  });
});

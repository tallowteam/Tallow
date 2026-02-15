import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThemeScript } from '@/components/theme/theme-script';

describe('ThemeScript', () => {
  it('includes no-FOUC theme bootstrap logic with system preference fallback', () => {
    const { container } = render(<ThemeScript />);
    const scriptElement = container.querySelector('script');

    expect(scriptElement).not.toBeNull();

    const source = scriptElement?.textContent ?? '';
    expect(source).toContain("localStorage.getItem('theme')");
    expect(source).toContain("window.matchMedia('(prefers-color-scheme: dark)').matches");
    expect(source).toContain("document.documentElement.setAttribute('data-theme', theme)");
  });

  it('supports required dark, light, forest, and ocean themes', () => {
    const { container } = render(<ThemeScript />);
    const source = container.querySelector('script')?.textContent ?? '';

    expect(source).toContain("savedTheme === 'dark'");
    expect(source).toContain("savedTheme === 'light'");
    expect(source).toContain("savedTheme === 'forest'");
    expect(source).toContain("savedTheme === 'ocean'");
  });

  it('supports accessibility themes: high-contrast and colorblind', () => {
    const { container } = render(<ThemeScript />);
    const source = container.querySelector('script')?.textContent ?? '';

    expect(source).toContain("savedTheme === 'high-contrast'");
    expect(source).toContain("savedTheme === 'colorblind'");
  });
});

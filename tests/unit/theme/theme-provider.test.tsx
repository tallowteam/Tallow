import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ThemeProvider, useTheme } from '@/components/theme/theme-provider';

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
}

function ThemeProbe() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <span data-testid="active-theme">{theme}</span>
      <button type="button" onClick={() => setTheme('ocean')}>
        Set Ocean
      </button>
      <button type="button" onClick={() => setTheme('forest')}>
        Set Forest
      </button>
      <button type="button" onClick={() => setTheme('high-contrast')}>
        Set High Contrast
      </button>
      <button type="button" onClick={() => setTheme('colorblind')}>
        Set Colorblind
      </button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.setAttribute('data-theme', 'dark');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses saved theme on mount', async () => {
    localStorage.setItem('theme', 'forest');
    mockMatchMedia(false);

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('forest');
    });
    expect(screen.getByTestId('active-theme')).toHaveTextContent('forest');
  });

  it('falls back to system preference when no saved theme exists', async () => {
    mockMatchMedia(true);

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
    expect(screen.getByTestId('active-theme')).toHaveTextContent('dark');
  });

  it('updates data-theme and localStorage when switching themes', async () => {
    mockMatchMedia(false);

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Set Ocean' }));

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('ocean');
    });
    expect(localStorage.getItem('theme')).toBe('ocean');
  });

  it('switches to high-contrast theme and persists it', async () => {
    mockMatchMedia(false);

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Set High Contrast' }));

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('high-contrast');
    });
    expect(localStorage.getItem('theme')).toBe('high-contrast');
    expect(screen.getByTestId('active-theme')).toHaveTextContent('high-contrast');
  });

  it('switches to colorblind theme and persists it', async () => {
    mockMatchMedia(false);

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Set Colorblind' }));

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('colorblind');
    });
    expect(localStorage.getItem('theme')).toBe('colorblind');
    expect(screen.getByTestId('active-theme')).toHaveTextContent('colorblind');
  });

  it('restores high-contrast theme from localStorage on mount', async () => {
    localStorage.setItem('theme', 'high-contrast');
    mockMatchMedia(false);

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('high-contrast');
    });
    expect(screen.getByTestId('active-theme')).toHaveTextContent('high-contrast');
  });

  it('restores colorblind theme from localStorage on mount', async () => {
    localStorage.setItem('theme', 'colorblind');
    mockMatchMedia(false);

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('colorblind');
    });
    expect(screen.getByTestId('active-theme')).toHaveTextContent('colorblind');
  });
});

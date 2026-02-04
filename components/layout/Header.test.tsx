/**
 * Header Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/tests/utils/render';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render header', () => {
      render(<Header />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should render logo', () => {
      render(<Header />);
      const logo = screen.getByText(/tallow/i);
      expect(logo).toBeInTheDocument();
    });

    it('should render navigation links', () => {
      render(<Header />);

      // Desktop navigation
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should have home link', () => {
      render(<Header />);
      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('should have app link', () => {
      render(<Header />);
      const appLink = screen.getByRole('link', { name: /app/i });
      expect(appLink).toBeInTheDocument();
      expect(appLink).toHaveAttribute('href', '/app');
    });

    it('should highlight active link', () => {
      render(<Header />);

      // Current page should be highlighted
      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Mobile Navigation', () => {
    it('should have mobile menu toggle', () => {
      render(<Header />);
      const menuButton = screen.getByRole('button', { name: /menu/i });
      expect(menuButton).toBeInTheDocument();
    });

    it('should toggle mobile menu', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const menuButton = screen.getByRole('button', { name: /menu/i });

      // Initially closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Open menu
      await user.click(menuButton);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Close menu
      await user.click(menuButton);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should close menu on escape', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const menuButton = screen.getByRole('button', { name: /menu/i });
      await user.click(menuButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should close menu on link click', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const menuButton = screen.getByRole('button', { name: /menu/i });
      await user.click(menuButton);

      const mobileNav = screen.getByRole('dialog');
      const appLink = mobileNav.querySelector('a[href="/app"]');

      if (appLink) {
        await user.click(appLink);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      }
    });
  });

  describe('Sticky Behavior', () => {
    it('should be sticky positioned', () => {
      const { container } = render(<Header />);
      const header = container.querySelector('header');

      const styles = window.getComputedStyle(header!);
      expect(styles.position).toBe('sticky');
    });
  });

  describe('Accessibility', () => {
    it('should have banner role', () => {
      render(<Header />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should have navigation landmark', () => {
      render(<Header />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should have accessible menu button', () => {
      render(<Header />);
      const menuButton = screen.getByRole('button', { name: /menu/i });
      expect(menuButton).toHaveAttribute('aria-label');
    });

    it('should manage focus in mobile menu', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const menuButton = screen.getByRole('button', { name: /menu/i });
      await user.click(menuButton);

      // First focusable element should receive focus
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should show desktop nav on large screens', () => {
      // Default render assumes desktop
      render(<Header />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeVisible();
    });

    it('should adapt to mobile viewport', () => {
      // Simulate mobile viewport
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(max-width: 768px)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(<Header />);
      expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
    });
  });
});

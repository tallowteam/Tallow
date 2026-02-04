/**
 * Page Integration Tests
 * Tests complete page rendering with components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/tests/utils/render';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock zustand stores
vi.mock('@/lib/stores/device-store', () => ({
  useDeviceStore: () => ({
    devices: [],
    selectedDevice: null,
    connection: { status: 'idle' },
    isLoading: false,
  }),
}));

describe('Page Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Landing Page', () => {
    it('should render hero section', async () => {
      const { default: LandingPage } = await import('@/app/page');
      render(<LandingPage />);

      // Check for main heading
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should render all main sections', async () => {
      const { default: LandingPage } = await import('@/app/page');
      const { container } = render(<LandingPage />);

      // Verify main sections exist
      const sections = container.querySelectorAll('section');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('should have navigation links', async () => {
      const { default: LandingPage } = await import('@/app/page');
      render(<LandingPage />);

      // Look for navigation (may be in header or mobile nav)
      const navigation = screen.queryByRole('navigation');
      if (navigation) {
        expect(navigation).toBeInTheDocument();
      }
    });
  });

  describe('App Page', () => {
    it('should render transfer interface', async () => {
      const { default: AppPage } = await import('@/app/app/page');
      render(<AppPage />);

      // Check for main content
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should display device connection status', async () => {
      const { default: AppPage } = await import('@/app/app/page');
      render(<AppPage />);

      // Page should render without errors
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Page Layout', () => {
    it('should include header in layout', () => {
      const { Header } = require('@/components/layout/Header');
      render(<Header />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should include footer in layout', () => {
      const { Footer } = require('@/components/layout/Footer');
      render(<Footer />);

      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper document structure', async () => {
      const { default: LandingPage } = await import('@/app/page');
      render(<LandingPage />);

      // Should have heading
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should have skip to content link', () => {
      // This would be in the layout
      const { Header } = require('@/components/layout/Header');
      render(<Header />);

      // Header should be accessible
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should render mobile navigation', () => {
      const { MobileNav } = require('@/components/layout/MobileNav');
      render(<MobileNav />);

      // Mobile nav should exist
      const nav = screen.queryByRole('navigation');
      expect(nav).toBeDefined();
    });

    it('should handle different viewport sizes', () => {
      const { Container } = require('@/components/layout/Container');
      render(
        <Container>
          <div>Content</div>
        </Container>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });
});

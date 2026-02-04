/**
 * Next.js Router Mocks
 * Utilities for mocking Next.js router in tests
 */

import { vi } from 'vitest';

export interface MockRouter {
  push: ReturnType<typeof vi.fn>;
  replace: ReturnType<typeof vi.fn>;
  prefetch: ReturnType<typeof vi.fn>;
  back: ReturnType<typeof vi.fn>;
  forward: ReturnType<typeof vi.fn>;
  refresh: ReturnType<typeof vi.fn>;
  pathname: string;
  query: Record<string, string | string[]>;
  asPath: string;
  route: string;
  basePath: string;
  isReady: boolean;
  isPreview: boolean;
  events: {
    on: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
    emit: ReturnType<typeof vi.fn>;
  };
}

/**
 * Create a mock router
 */
export function createMockRouter(overrides?: Partial<MockRouter>): MockRouter {
  return {
    push: vi.fn(() => Promise.resolve(true)),
    replace: vi.fn(() => Promise.resolve(true)),
    prefetch: vi.fn(() => Promise.resolve()),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    route: '/',
    basePath: '',
    isReady: true,
    isPreview: false,
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
    ...overrides,
  };
}

/**
 * Mock useRouter hook
 */
export function mockUseRouter(router?: Partial<MockRouter>) {
  const mockRouter = createMockRouter(router);

  return vi.fn(() => mockRouter);
}

/**
 * Mock usePathname hook
 */
export function mockUsePathname(pathname = '/') {
  return vi.fn(() => pathname);
}

/**
 * Mock useSearchParams hook
 */
export function mockUseSearchParams(params: Record<string, string> = {}) {
  const searchParams = new URLSearchParams(params);

  return vi.fn(() => searchParams);
}

/**
 * Reset router mocks
 */
export function resetRouterMocks(router: MockRouter) {
  router.push.mockClear();
  router.replace.mockClear();
  router.prefetch.mockClear();
  router.back.mockClear();
  router.forward.mockClear();
  router.refresh.mockClear();
  router.events.on.mockClear();
  router.events.off.mockClear();
  router.events.emit.mockClear();
}

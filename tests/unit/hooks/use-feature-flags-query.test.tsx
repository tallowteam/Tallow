import { ReactNode } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFeatureFlagsQuery, type FeatureFlagsResponse } from '@/lib/hooks/use-feature-flags-query';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  function QueryClientWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  QueryClientWrapper.displayName = 'QueryClientWrapper';
  return QueryClientWrapper;
}

describe('useFeatureFlagsQuery', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('loads feature flags from /api/flags', async () => {
    const responsePayload: FeatureFlagsResponse = {
      flags: {
        chat_enabled: true,
        voice_memos: true,
        location_sharing: false,
        screen_sharing: true,
        broadcast_mode: true,
        scheduled_transfers: true,
        team_workspaces: true,
        browser_extension_api: true,
        share_sheet_integrations: false,
        nfc_pairing: false,
        qr_linking: false,
        clipboard_sharing: false,
        advanced_compression: true,
        delta_sync: true,
        webauthn: true,
        webtransport: false,
        plausible_analytics: false,
        sentry_tracking: false,
        i18n_enabled: true,
        guest_mode: true,
        experimental_pqc: true,
        debug_mode: false,
      },
      timestamp: '2026-02-13T00:00:00.000Z',
      source: 'environment',
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => responsePayload,
    } as Response);

    const { result } = renderHook(() => useFeatureFlagsQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/flags',
      expect.objectContaining({
        method: 'GET',
        cache: 'no-store',
      })
    );
    expect(result.current.data?.flags.experimental_pqc).toBe(true);
    expect(result.current.data?.source).toBe('environment');
  });

  it('returns query error when the endpoint responds with non-2xx', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    } as Response);

    const { result } = renderHook(() => useFeatureFlagsQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect((result.current.error as Error).message).toContain('Failed to load feature flags: 503');
  });
});

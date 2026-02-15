'use client';

import { useQuery } from '@tanstack/react-query';

export interface FeatureFlags {
  chat_enabled: boolean;
  voice_memos: boolean;
  location_sharing: boolean;
  screen_sharing: boolean;
  broadcast_mode: boolean;
  scheduled_transfers: boolean;
  team_workspaces: boolean;
  browser_extension_api: boolean;
  share_sheet_integrations: boolean;
  nfc_pairing: boolean;
  qr_linking: boolean;
  clipboard_sharing: boolean;
  advanced_compression: boolean;
  delta_sync: boolean;
  webauthn: boolean;
  webtransport: boolean;
  plausible_analytics: boolean;
  sentry_tracking: boolean;
  i18n_enabled: boolean;
  guest_mode: boolean;
  experimental_pqc: boolean;
  debug_mode: boolean;
}

export interface FeatureFlagsResponse {
  flags: FeatureFlags;
  timestamp: string;
  source: 'environment' | 'defaults';
  error?: string;
}

async function fetchFeatureFlags(signal?: AbortSignal): Promise<FeatureFlagsResponse> {
  const request: RequestInit = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  };
  if (signal) {
    request.signal = signal;
  }

  const response = await fetch('/api/flags', {
    ...request,
  });

  if (!response.ok) {
    throw new Error(`Failed to load feature flags: ${response.status}`);
  }

  const payload = (await response.json()) as FeatureFlagsResponse;
  if (!payload || typeof payload !== 'object' || !payload.flags) {
    throw new Error('Feature flag response is malformed');
  }

  return payload;
}

export function useFeatureFlagsQuery() {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: ({ signal }) => fetchFeatureFlags(signal),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });
}

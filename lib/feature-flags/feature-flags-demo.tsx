/**
 * Feature Flags Demo Component
 *
 * Demonstrates all feature flag capabilities including:
 * - Viewing current flag states
 * - Toggling flags
 * - Resetting flags
 * - URL parameter override demonstration
 */

'use client';

import { useState } from 'react';
import {
  useFeatureFlags,
  useFeatureFlagToggle,
  resetAllFlags,
  FeatureFlagKey,
} from './index';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// ============================================================================
// TYPES
// ============================================================================

interface FlagInfo {
  key: FeatureFlagKey;
  name: string;
  description: string;
  category: 'core' | 'privacy' | 'experimental' | 'developer' | 'integration';
}

// ============================================================================
// FLAG METADATA
// ============================================================================

const FLAG_METADATA: FlagInfo[] = [
  // Core Features
  {
    key: 'chat_enabled',
    name: 'Chat',
    description: 'Enable real-time chat integration',
    category: 'core',
  },
  {
    key: 'voice_memos',
    name: 'Voice Memos',
    description: 'Voice memo recording and sharing',
    category: 'core',
  },
  {
    key: 'screen_sharing',
    name: 'Screen Sharing',
    description: 'Screen sharing capability',
    category: 'core',
  },
  {
    key: 'broadcast_mode',
    name: 'Broadcast Mode',
    description: '1-to-many file distribution',
    category: 'core',
  },
  {
    key: 'scheduled_transfers',
    name: 'Scheduled Transfers',
    description: 'Schedule transfers for later execution',
    category: 'core',
  },
  {
    key: 'team_workspaces',
    name: 'Team Workspaces',
    description: 'Collaborative team workspaces',
    category: 'core',
  },
  {
    key: 'guest_mode',
    name: 'Guest Mode',
    description: 'Guest access without account',
    category: 'core',
  },

  // Integration Features
  {
    key: 'browser_extension_api',
    name: 'Browser Extension API',
    description: 'API for browser extension integration',
    category: 'integration',
  },
  {
    key: 'advanced_compression',
    name: 'Advanced Compression',
    description: 'Advanced compression algorithms',
    category: 'integration',
  },
  {
    key: 'delta_sync',
    name: 'Delta Sync',
    description: 'Delta synchronization for efficient updates',
    category: 'integration',
  },
  {
    key: 'webauthn',
    name: 'WebAuthn',
    description: 'WebAuthn authentication support',
    category: 'integration',
  },
  {
    key: 'i18n_enabled',
    name: 'Internationalization',
    description: 'Multi-language support',
    category: 'integration',
  },

  // Privacy Features
  {
    key: 'location_sharing',
    name: 'Location Sharing',
    description: 'Share location with transfers (privacy-sensitive)',
    category: 'privacy',
  },
  {
    key: 'plausible_analytics',
    name: 'Plausible Analytics',
    description: 'Privacy-friendly analytics tracking',
    category: 'privacy',
  },
  {
    key: 'sentry_tracking',
    name: 'Sentry Error Tracking',
    description: 'Error tracking and monitoring',
    category: 'privacy',
  },

  // Experimental Features
  {
    key: 'webtransport',
    name: 'WebTransport',
    description: 'WebTransport protocol (experimental)',
    category: 'experimental',
  },
  {
    key: 'experimental_pqc',
    name: 'Post-Quantum Crypto',
    description: 'Experimental post-quantum cryptography',
    category: 'experimental',
  },

  // Developer Features
  {
    key: 'debug_mode',
    name: 'Debug Mode',
    description: 'Enable debug logging and tools',
    category: 'developer',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function FeatureFlagsDemo() {
  useFeatureFlags(); // Subscribe to flag changes
  const [filter, setFilter] = useState<string>('all');

  const handleResetAll = () => {
    if (confirm('Reset all feature flags to their default values?')) {
      resetAllFlags();
    }
  };

  const filteredFlags =
    filter === 'all'
      ? FLAG_METADATA
      : FLAG_METADATA.filter((flag) => flag.category === filter);

  return (
    <div className="feature-flags-demo">
      <Card>
        <CardHeader>
          <h2>Feature Flags Configuration</h2>
          <p>Manage feature flags for your Tallow instance</p>
        </CardHeader>

        <CardContent>
          {/* Filter Buttons */}
          <div className="filter-buttons" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button
              variant={filter === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'core' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('core')}
            >
              Core
            </Button>
            <Button
              variant={filter === 'integration' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('integration')}
            >
              Integration
            </Button>
            <Button
              variant={filter === 'privacy' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('privacy')}
            >
              Privacy
            </Button>
            <Button
              variant={filter === 'experimental' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('experimental')}
            >
              Experimental
            </Button>
            <Button
              variant={filter === 'developer' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('developer')}
            >
              Developer
            </Button>
          </div>

          {/* Flag List */}
          <div className="flag-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredFlags.map((flagInfo) => (
              <FlagToggleItem key={flagInfo.key} flagInfo={flagInfo} />
            ))}
          </div>

          {/* Actions */}
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <Button variant="danger" onClick={handleResetAll}>
              Reset All to Defaults
            </Button>
          </div>

          {/* URL Override Instructions */}
          <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--color-surface-secondary)', borderRadius: '0.5rem' }}>
            <h3 style={{ marginTop: 0 }}>URL Parameter Override</h3>
            <p>Test flags via URL parameters:</p>
            <code style={{ display: 'block', padding: '0.5rem', background: 'var(--color-surface-tertiary)', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
              ?flags=debug_mode:true,chat_enabled:false
            </code>
            <p style={{ fontSize: '0.875rem', marginBottom: 0 }}>
              Format: <code>?flags=flag_name:true,another_flag:false</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// FLAG TOGGLE ITEM
// ============================================================================

function FlagToggleItem({ flagInfo }: { flagInfo: FlagInfo }) {
  const [enabled, setEnabled] = useFeatureFlagToggle(flagInfo.key);

  const categoryColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'error'> = {
    core: 'default',
    privacy: 'warning',
    experimental: 'error',
    developer: 'secondary',
    integration: 'success',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem',
        border: '1px solid var(--color-border)',
        borderRadius: '0.5rem',
        background: enabled ? 'var(--color-surface-secondary)' : 'transparent',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <strong>{flagInfo.name}</strong>
          <Badge variant={categoryColors[flagInfo.category] ?? 'default'} size="sm">
            {flagInfo.category}
          </Badge>
          <Badge variant={enabled ? 'success' : 'secondary'} size="sm">
            {enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          {flagInfo.description}
        </p>
        <code style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
          {flagInfo.key}
        </code>
      </div>

      <div>
        <Button
          variant={enabled ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setEnabled(!enabled)}
        >
          {enabled ? 'Disable' : 'Enable'}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// SUMMARY COMPONENT
// ============================================================================

export function FeatureFlagsSummary() {
  const flags = useFeatureFlags();

  const enabledCount = Object.values(flags).filter(Boolean).length;
  const totalCount = Object.keys(flags).length;

  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Badge variant="info">
        {enabledCount}/{totalCount} Features Enabled
      </Badge>
    </div>
  );
}

/**
 * Feature Flags Admin UI
 * Development tool for testing feature flags
 * Only shown in development mode
 */

'use client';

import { useState } from 'react';
import { useAllFeatureFlags, useFeatureFlagsLoading, useFeatureFlagsError } from '@/lib/hooks/use-feature-flag';
import { FeatureFlags } from '@/lib/feature-flags/launchdarkly';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2, Flag, X } from 'lucide-react';

/**
 * Get friendly name for feature flag
 */
function getFlagDisplayName(key: string): string {
  return key
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get description for feature flag
 */
function getFlagDescription(key: string): string {
  const descriptions: Record<string, string> = {
    [FeatureFlags.VOICE_COMMANDS]: 'Enable voice-activated file transfer commands',
    [FeatureFlags.CAMERA_CAPTURE]: 'Allow capturing photos directly from camera for sharing',
    [FeatureFlags.METADATA_STRIPPING]: 'Automatically remove EXIF metadata from images',
    [FeatureFlags.ONE_TIME_TRANSFERS]: 'Enable self-destructing transfer links',
    [FeatureFlags.PQC_ENCRYPTION]: 'Use post-quantum cryptography (Kyber) for key exchange',
    [FeatureFlags.ADVANCED_PRIVACY]: 'Show advanced privacy settings and controls',
    [FeatureFlags.QR_CODE_SHARING]: 'Enable QR code generation for easy device pairing',
    [FeatureFlags.EMAIL_SHARING]: 'Allow sharing transfer links via email',
    [FeatureFlags.LINK_EXPIRATION]: 'Enable time-based link expiration',
    [FeatureFlags.CUSTOM_THEMES]: 'Allow users to create custom color themes',
    [FeatureFlags.MOBILE_APP_PROMO]: 'Show mobile app download prompts',
    [FeatureFlags.DONATION_PROMPTS]: 'Display donation calls-to-action',
  };

  return descriptions[key] || 'No description available';
}

/**
 * Get category for feature flag
 */
function getFlagCategory(key: string): string {
  if (([FeatureFlags.VOICE_COMMANDS, FeatureFlags.CAMERA_CAPTURE, FeatureFlags.QR_CODE_SHARING] as string[]).includes(key)) {
    return 'Features';
  }

  if (
    ([FeatureFlags.METADATA_STRIPPING, FeatureFlags.PQC_ENCRYPTION, FeatureFlags.ADVANCED_PRIVACY, FeatureFlags.ONE_TIME_TRANSFERS] as string[]).includes(
      key
    )
  ) {
    return 'Privacy & Security';
  }

  if (([FeatureFlags.EMAIL_SHARING, FeatureFlags.LINK_EXPIRATION] as string[]).includes(key)) {
    return 'Sharing';
  }

  if (([FeatureFlags.CUSTOM_THEMES] as string[]).includes(key)) {
    return 'Customization';
  }

  if (([FeatureFlags.MOBILE_APP_PROMO, FeatureFlags.DONATION_PROMPTS] as string[]).includes(key)) {
    return 'Marketing';
  }

  return 'Other';
}

export function FeatureFlagsAdmin() {
  const flags = useAllFeatureFlags();
  const loading = useFeatureFlagsLoading();
  const error = useFeatureFlagsError();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Group flags by category
  const flagsByCategory: Record<string, Array<{ key: string; value: boolean }>> = {};

  Object.entries(flags).forEach(([key, value]) => {
    const category = getFlagCategory(key);
    if (!flagsByCategory[category]) {
      flagsByCategory[category] = [];
    }
    flagsByCategory[category].push({ key, value });
  });

  // Filter flags by search term
  const filteredCategories = Object.entries(flagsByCategory).reduce(
    (acc, [category, categoryFlags]) => {
      const filtered = categoryFlags.filter((flag) => flag.key.toLowerCase().includes(searchTerm.toLowerCase()));

      if (filtered.length > 0) {
        acc[category] = filtered;
      }

      return acc;
    },
    {} as Record<string, Array<{ key: string; value: boolean }>>
  );

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-white shadow-lg hover:bg-purple-700 transition-colors"
        aria-label="Open feature flags admin"
      >
        <Flag className="h-4 w-4" />
        <span className="text-sm font-medium">Feature Flags</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-hidden">
      <Card className="shadow-2xl">
        <div className="flex items-center justify-between border-b p-4 bg-muted/50">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold">Feature Flags</h2>
            <Badge variant="outline" className="text-xs">
              Dev Only
            </Badge>
          </div>
          <button onClick={() => setIsOpen(false)} className="rounded-full p-1 hover:bg-muted transition-colors" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(80vh-4rem)]">
          {/* Status indicator */}
          <div className="flex items-center gap-2 text-sm">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span className="text-muted-foreground">Loading flags...</span>
              </>
            ) : error ? (
              <>
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-red-600">Error loading flags</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">Connected to LaunchDarkly</span>
              </>
            )}
          </div>

          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search flags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          {/* Flags by category */}
          <div className="space-y-4">
            {Object.entries(filteredCategories).map(([category, categoryFlags]) => (
              <div key={category} className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">{category}</h3>
                <div className="space-y-3">
                  {categoryFlags.map(({ key, value }) => (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
                          {getFlagDisplayName(key)}
                        </Label>
                        <Switch id={key} checked={value} disabled className="data-[state=checked]:bg-purple-600" />
                      </div>
                      <p className="text-xs text-muted-foreground">{getFlagDescription(key)}</p>
                    </div>
                  ))}
                </div>
                {category !== Object.keys(filteredCategories)[Object.keys(filteredCategories).length - 1] && <Separator className="mt-3" />}
              </div>
            ))}
          </div>

          {/* No results */}
          {Object.keys(filteredCategories).length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">No flags found matching "{searchTerm}"</div>
          )}

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
            <p className="font-semibold">Note:</p>
            <p>These flags are read-only in this interface. To change flag values, use the LaunchDarkly dashboard.</p>
            <p className="pt-2">Real-time updates are enabled. Changes made in LaunchDarkly will reflect here automatically.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

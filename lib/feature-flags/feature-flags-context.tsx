/**
 * Feature Flags Context
 * Provides React context for accessing feature flags throughout the app
 */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { secureLog } from '../utils/secure-logger';
import { LDFlagSet } from 'launchdarkly-js-client-sdk';
import {
  initLaunchDarkly,
  getAllFeatureFlags,
  DEFAULT_FLAGS,
  flushEvents,
} from './launchdarkly';

interface FeatureFlagsContextValue {
  flags: LDFlagSet;
  loading: boolean;
  error: Error | null;
  identify: (userId: string, attributes?: Record<string, any>) => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue>({
  flags: DEFAULT_FLAGS,
  loading: true,
  error: null,
  identify: async () => {},
});

interface FeatureFlagsProviderProps {
  children: ReactNode;
  userId?: string;
  initialFlags?: LDFlagSet;
}

/**
 * Feature Flags Provider Component
 * Initializes LaunchDarkly and provides flags to child components
 */
export function FeatureFlagsProvider({ children, userId, initialFlags }: FeatureFlagsProviderProps) {
  const [flags, setFlags] = useState<LDFlagSet>(initialFlags || DEFAULT_FLAGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setLoading(true);

        // Initialize LaunchDarkly
        const client = await initLaunchDarkly(userId);

        if (!mounted) {return;}

        if (client) {
          // Get initial flags
          const allFlags = getAllFeatureFlags();
          setFlags(allFlags);

          // Listen for flag changes
          client.on('change', () => {
            if (mounted) {
              const updatedFlags = getAllFeatureFlags();
              setFlags(updatedFlags);
              secureLog.log('[FeatureFlags] Flags updated:', updatedFlags);
            }
          });

          // Listen for errors
          client.on('error', (err) => {
            secureLog.error('[FeatureFlags] Error:', err);
            if (mounted) {
              setError(err as Error);
            }
          });

          secureLog.log('[FeatureFlags] Provider initialized');
        } else {
          // Use default flags if client initialization failed (expected behavior)
          secureLog.debug('[FeatureFlags] Using default feature flags');
          setFlags(DEFAULT_FLAGS);
        }
      } catch (err) {
        secureLog.error('[FeatureFlags] Initialization error:', err);
        if (mounted) {
          setError(err as Error);
          setFlags(DEFAULT_FLAGS);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    // Cleanup
    return () => {
      mounted = false;

      // Flush events before unmounting
      flushEvents();
    };
  }, [userId]);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushEvents();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const identify = async (userId: string, attributes?: Record<string, any>) => {
    try {
      const { identifyUser } = await import('./launchdarkly');
      await identifyUser(userId, attributes);

      // Update flags after identification
      const updatedFlags = getAllFeatureFlags();
      setFlags(updatedFlags);
    } catch (err) {
      secureLog.error('[FeatureFlags] Error identifying user:', err);
      setError(err as Error);
    }
  };

  const value: FeatureFlagsContextValue = {
    flags,
    loading,
    error,
    identify,
  };

  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
}

/**
 * Hook to access feature flags context
 */
export function useFeatureFlagsContext() {
  const context = useContext(FeatureFlagsContext);

  if (!context) {
    throw new Error('useFeatureFlagsContext must be used within a FeatureFlagsProvider');
  }

  return context;
}

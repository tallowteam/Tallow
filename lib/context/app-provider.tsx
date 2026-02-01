'use client';

/**
 * App Provider
 * Combines all context providers for centralized state management
 */

import React from 'react';
import { TransfersProvider } from './transfers-context';
import { DevicesProvider } from './devices-context';
import { SettingsProvider } from './settings-context';
import { NotificationsProvider } from './notifications-context';

interface AppProviderProps {
  children: React.ReactNode;
}

/**
 * Root provider that wraps all context providers
 * Use this at the app root to provide centralized state management
 *
 * Provider order (outer to inner):
 * 1. SettingsProvider - Must be first as other contexts may depend on settings
 * 2. NotificationsProvider - Provides notification system for all contexts
 * 3. DevicesProvider - Device and connection management
 * 4. TransfersProvider - File transfer state
 */
export function AppProvider({ children }: AppProviderProps) {
  return (
    <SettingsProvider>
      <NotificationsProvider>
        <DevicesProvider>
          <TransfersProvider>
            {children}
          </TransfersProvider>
        </DevicesProvider>
      </NotificationsProvider>
    </SettingsProvider>
  );
}

export default AppProvider;

'use client';

import { useEffect } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/lib/i18n/language-context';
import { ReducedMotionProvider } from '@/lib/context/reduced-motion-context';
import { FeatureFlagsProvider } from '@/lib/feature-flags/feature-flags-context';
import { LiveRegionProvider } from '@/components/accessibility/live-region-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { OfflineIndicator } from '@/components/app/offline-indicator';
import { CacheDebugPanel } from '@/components/app/cache-debug-panel';
import { FeatureFlagsAdmin } from '@/components/admin/feature-flags-admin';
import { InstallPrompt } from '@/components/app/install-prompt';
import { DevToolsPanel } from '@/components/app/dev-tools-panel';
import { initDevConsole } from '@/lib/init/dev-console';
import { clearOldCaches } from '@/lib/utils/cache-buster';

export function Providers({ children }: { children: React.ReactNode }) {
    // Initialize development console configuration
    useEffect(() => {
        initDevConsole();
    }, []);

    // Clear old caches on mount to fix cached syntax errors
    useEffect(() => {
        clearOldCaches().catch(err => {
            console.error('[Providers] Failed to clear old caches:', err);
        });
    }, []);
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={false}
        >
            <ReducedMotionProvider>
                <LanguageProvider>
                    <FeatureFlagsProvider>
                        <LiveRegionProvider>
                            <TooltipProvider delayDuration={300}>
                                <OfflineIndicator />
                                <InstallPrompt />
                                {children}
                                <Toaster position="bottom-right" richColors />
                                <CacheDebugPanel />
                                <FeatureFlagsAdmin />
                                <DevToolsPanel />
                            </TooltipProvider>
                        </LiveRegionProvider>
                    </FeatureFlagsProvider>
                </LanguageProvider>
            </ReducedMotionProvider>
        </ThemeProvider>
    );
}

'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/lib/i18n/language-context';
import { Toaster } from '@/components/ui/sonner';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <LanguageProvider>
                {children}
                <Toaster position="bottom-right" richColors />
            </LanguageProvider>
        </ThemeProvider>
    );
}

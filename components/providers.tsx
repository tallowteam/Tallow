"use client";

import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Available themes:
 * - dark: EUVEKA dark (#191610 background, #fefefc text, #fefefc accent)
 * - light: EUVEKA light (#fefefc background, #191610 text, #fefefc accent)
 * - euveka: EUVEKA dark variant
 * - euveka-light: EUVEKA light variant
 * - forest: EUVEKA grayscale base + green accent (#22c55e)
 * - ocean: EUVEKA grayscale base + white accent (#fefefc)
 * - high-contrast: WCAG AAA accessible
 * - system: Match device settings
 */
const THEME_OPTIONS = [
  'dark',
  'light',
  'euveka',
  'euveka-light',
  'forest',
  'ocean',
  'high-contrast',
  'system',
] as const;

/**
 * Full Providers wrapper with all necessary context providers
 * Theme persistence via localStorage with key "tallow-theme"
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      themes={[...THEME_OPTIONS]}
      disableTransitionOnChange={false}
      storageKey="tallow-theme"
    >
      <LanguageProvider>
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

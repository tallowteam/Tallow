'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageDropdown } from '@/components/language-dropdown';
import { Clipboard, FileDown, History, Settings, Check, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';

interface AppHeaderProps {
  isConnected: boolean;
  pqcReady: boolean;
  canSend: boolean;
  mode: 'send' | 'receive';
  receivedFileCount: number;
  onShareClipboard?: () => void;
  onShowReceived?: () => void;
  onShowHistory?: () => void;
  onShowSettings?: () => void;
}

export function AppHeader({
  isConnected,
  pqcReady,
  canSend,
  mode,
  receivedFileCount,
  onShareClipboard,
  onShowReceived,
  onShowHistory,
  onShowSettings,
}: AppHeaderProps) {
  const { t } = useLanguage();

  const getConnectionStatus = () => {
    if (isConnected && pqcReady && canSend && mode === 'send') {
      return {
        color: 'bg-green-500',
        text: 'Ready to send',
        icon: Check,
        iconColor: 'text-green-500'
      };
    }
    if (isConnected && pqcReady) {
      return {
        color: 'bg-accent',
        text: 'Secured',
        icon: Lock,
        iconColor: 'text-accent'
      };
    }
    if (isConnected) {
      return {
        color: 'bg-yellow-500 animate-pulse',
        text: 'Encrypting...',
        icon: Loader2,
        iconColor: 'text-yellow-500 animate-spin'
      };
    }
    return {
      color: 'bg-muted-foreground',
      text: t('app.ready'),
      icon: AlertCircle,
      iconColor: 'text-muted-foreground'
    };
  };

  const status = getConnectionStatus();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm safe-area-top"
      role="banner"
    >
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="nav-logo hover:opacity-60 transition-opacity !text-foreground text-lg sm:text-xl"
          aria-label="Tallow home"
        >
          tallow
        </Link>

        {/* Visually hidden h1 for SEO/Accessibility */}
        <h1 className="sr-only">Tallow - Secure File Sharing</h1>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Connection Status - hidden on very small screens, WCAG compliant */}
          <div className="hidden sm:flex items-center gap-2" role="status" aria-live="polite">
            {/* Icon for visual clarity */}
            <status.icon
              className={`w-4 h-4 ${status.iconColor}`}
              aria-hidden="true"
            />
            {/* Status text (primary information) */}
            <span className="label text-xs sm:text-sm">
              {status.text}
            </span>
            {/* Color dot (supplementary, not primary indicator) */}
            <div
              className={`w-2 h-2 rounded-full ${status.color}`}
              aria-hidden="true"
            />
          </div>

          {/* Clipboard Button - Touch friendly 44px */}
          {isConnected && onShareClipboard && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onShareClipboard}
              title="Share Clipboard"
              aria-label="Share clipboard content"
              className="h-11 w-11 sm:h-10 sm:w-10 touchable"
            >
              <Clipboard className="w-5 h-5 text-foreground" />
            </Button>
          )}

          {/* Received Files */}
          {receivedFileCount > 0 && onShowReceived && (
            <Button
              variant="outline"
              size="sm"
              onClick={onShowReceived}
              aria-label={`View ${receivedFileCount} received files`}
              className="h-10 sm:h-9 px-3 touchable"
            >
              <FileDown className="w-4 h-4 mr-1 sm:mr-2 text-foreground" />
              <span className="hidden sm:inline">{receivedFileCount} Received</span>
              <span className="sm:hidden">{receivedFileCount}</span>
            </Button>
          )}

          {/* Language Dropdown - hidden on mobile */}
          <div className="hidden sm:block">
            <LanguageDropdown />
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* History Link */}
          {onShowHistory && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onShowHistory}
              title="View History"
              aria-label="View transfer history"
              className="hidden sm:flex h-10 w-10 touchable"
            >
              <History className="w-5 h-5 text-foreground" />
            </Button>
          )}

          {/* Settings Link */}
          {onShowSettings && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onShowSettings}
              title="Settings"
              aria-label="Open settings"
              className="hidden sm:flex h-10 w-10 touchable"
            >
              <Settings className="w-5 h-5 text-foreground" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

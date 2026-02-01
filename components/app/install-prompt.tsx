'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');
  const { t: _t } = useLanguage();

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('tallow-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);

      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after 30 seconds
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Show iOS/fallback instructions
      setShowPrompt(true);
      return;
    }

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for user choice
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setShowPrompt(false);
    } else {
      console.log('User dismissed the install prompt');
      localStorage.setItem('tallow-install-dismissed', new Date().toISOString());
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('tallow-install-dismissed', new Date().toISOString());
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // iOS installation instructions
  if (platform === 'ios' && showPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
        <div className="bg-card border border-border rounded-xl shadow-xl p-6">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Close install prompt"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1 text-foreground">
                Install Tallow
              </h3>
              <p className="text-sm text-muted-foreground">
                Add to your home screen for quick access
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground mb-4">
            <p>To install Tallow on iOS:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Tap the Share button in Safari</li>
              <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
              <li>Tap &quot;Add&quot; in the top right</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Standard install prompt
  if (showPrompt && (deferredPrompt || platform === 'android' || platform === 'desktop')) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
        <div className="bg-card border border-border rounded-xl shadow-xl p-6">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Close install prompt"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              {platform === 'desktop' ? (
                <Monitor className="w-6 h-6 text-primary" />
              ) : (
                <Smartphone className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1 text-foreground">
                Install Tallow App
              </h3>
              <p className="text-sm text-muted-foreground">
                Install for faster access and offline support
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleInstall}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              <Download className="w-5 h-5" />
              Install App
            </button>

            <button
              onClick={handleDismiss}
              className="w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Not now
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✓ Works offline</li>
              <li>✓ Faster loading</li>
              <li>✓ Quick access from home screen</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

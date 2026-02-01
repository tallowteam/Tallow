'use client';

import { useState } from 'react';
import { useLanguage, languages } from '@/lib/i18n/language-context';
import { usePWA } from '@/lib/hooks/use-pwa';
import {
  formatDate,
  formatTime,
  formatNumber,
  formatCurrency,
  formatFileSize,
  formatPercentage
} from '@/lib/i18n/locale-formatter';
import {
  requestNotificationPermission,
  showNotification,
  NotificationPresets
} from '@/lib/pwa/push-notifications';
import { Check, X, Globe, Smartphone, Bell, Calendar } from 'lucide-react';

/**
 * Test panel for PWA and i18n features
 * This component is for development/testing purposes only
 * Remove or hide in production
 */
export function PWAi18nTestPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, t, currentLanguage, isRTL } = useLanguage();
  const { isInstalled, isStandalone, canInstall, isOnline, needsUpdate, install, update } = usePWA();
  const [testResults, setTestResults] = useState<string[]>([]);

  const testDate = new Date('2026-01-25T14:30:00');
  const testNumber = 1234567.89;
  const testAmount = 99.99;
  const testFileSize = 1073741824; // 1GB

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, message]);
  };

  const runTests = () => {
    setTestResults([]);
    addResult('Starting PWA & i18n tests...');

    // Test language
    addResult(`✓ Current language: ${currentLanguage.nativeName} (${language})`);
    addResult(`✓ RTL mode: ${isRTL ? 'Yes' : 'No'}`);

    // Test PWA
    addResult(`✓ Installed: ${isInstalled ? 'Yes' : 'No'}`);
    addResult(`✓ Standalone: ${isStandalone ? 'Yes' : 'No'}`);
    addResult(`✓ Can install: ${canInstall ? 'Yes' : 'No'}`);
    addResult(`✓ Online: ${isOnline ? 'Yes' : 'No'}`);

    // Test formatting
    addResult(`✓ Date: ${formatDate(testDate, language)}`);
    addResult(`✓ Time: ${formatTime(testDate, language)}`);
    addResult(`✓ Number: ${formatNumber(testNumber, language)}`);
    addResult(`✓ Currency: ${formatCurrency(testAmount, language, 'USD')}`);
    addResult(`✓ File size: ${formatFileSize(testFileSize, language)}`);
    addResult(`✓ Percent: ${formatPercentage(0.856, language)}`);

    addResult('All tests completed!');
  };

  const testNotification = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      await showNotification(NotificationPresets.fileReceived('test-document.pdf'));
      addResult('✓ Notification sent');
    } else {
      addResult('✗ Notification permission denied');
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg hover:opacity-90 text-sm"
        aria-label="Open PWA & i18n test panel"
      >
        Test PWA & i18n
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[600px] bg-card border border-border rounded-xl shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-lg font-semibold">PWA & i18n Test Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-secondary rounded"
          aria-label="Close test panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* PWA Status */}
        <section>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            PWA Status
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Installed</span>
              {isInstalled ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <X className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>Standalone Mode</span>
              {isStandalone ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <X className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>Can Install</span>
              {canInstall ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <X className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>Online</span>
              {isOnline ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <X className="w-4 h-4 text-destructive" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>Needs Update</span>
              {needsUpdate ? (
                <Check className="w-4 h-4 text-warning" />
              ) : (
                <X className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {canInstall && (
              <button
                onClick={install}
                className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
              >
                Install App
              </button>
            )}
            {needsUpdate && (
              <button
                onClick={update}
                className="w-full px-3 py-2 bg-warning text-warning-foreground rounded-lg text-sm"
              >
                Update App
              </button>
            )}
            <button
              onClick={testNotification}
              className="w-full px-3 py-2 bg-secondary rounded-lg text-sm flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" />
              Test Notification
            </button>
          </div>
        </section>

        {/* Language Status */}
        <section>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Language Status
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Current Language</span>
              <span className="font-medium">{currentLanguage.nativeName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Language Code</span>
              <span className="font-medium uppercase">{language}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>RTL Mode</span>
              {isRTL ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <X className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>Direction</span>
              <span className="font-medium">{isRTL ? 'RTL' : 'LTR'}</span>
            </div>
          </div>

          <div className="mt-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} ({lang.code})
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Formatting Tests */}
        <section>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Locale Formatting
          </h4>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-muted-foreground">Date:</span>
              <div className="font-medium">{formatDate(testDate, language)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Time:</span>
              <div className="font-medium">{formatTime(testDate, language)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Number:</span>
              <div className="font-medium">{formatNumber(testNumber, language)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Currency (USD):</span>
              <div className="font-medium">{formatCurrency(testAmount, language, 'USD')}</div>
            </div>
            <div>
              <span className="text-muted-foreground">File Size:</span>
              <div className="font-medium">{formatFileSize(testFileSize, language)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Percent:</span>
              <div className="font-medium">{formatPercentage(0.856, language)}</div>
            </div>
          </div>
        </section>

        {/* Translation Test */}
        <section>
          <h4 className="font-semibold mb-3">Translation Test</h4>
          <div className="space-y-2 text-sm">
            <div className="p-2 bg-secondary rounded">
              <span className="text-muted-foreground">nav.features:</span>
              <div className="font-medium">{t('nav.features')}</div>
            </div>
            <div className="p-2 bg-secondary rounded">
              <span className="text-muted-foreground">app.send:</span>
              <div className="font-medium">{t('app.send')}</div>
            </div>
            <div className="p-2 bg-secondary rounded">
              <span className="text-muted-foreground">app.receive:</span>
              <div className="font-medium">{t('app.receive')}</div>
            </div>
          </div>
        </section>

        {/* Test Results */}
        {testResults.length > 0 && (
          <section>
            <h4 className="font-semibold mb-3">Test Results</h4>
            <div className="p-3 bg-secondary rounded text-xs space-y-1 max-h-40 overflow-y-auto">
              {testResults.map((result, i) => (
                <div key={i} className="font-mono">
                  {result}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="p-4 border-t border-border">
        <button
          onClick={runTests}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
        >
          Run All Tests
        </button>
      </div>
    </div>
  );
}

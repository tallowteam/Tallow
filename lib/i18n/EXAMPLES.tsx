/**
 * i18n Integration Examples
 *
 * Comprehensive examples demonstrating how to use the i18n system
 * in various component types and scenarios.
 */

'use client';

import React, { useState } from 'react';
import {
  useI18n,
  getAvailableLanguages,
  type LanguageCode,
} from './index';

/**
 * Example 1: Simple Client Component
 * Basic translation usage in a functional component
 */
export function SimpleExample() {
  const { t } = useI18n();

  return (
    <div>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>
      <button>{t('hero.cta')}</button>
    </div>
  );
}

/**
 * Example 2: Language Picker Component
 * Allow users to select their preferred language
 */
export function LanguagePickerExample() {
  const { language, setLanguage, availableLanguages } = useI18n();

  return (
    <div>
      <label htmlFor="language-select">{t('settings.language')} :</label>
      <select
        id="language-select"
        value={language}
        onChange={(e) => setLanguage(e.target.value as LanguageCode)}
      >
        {Object.values(availableLanguages).map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Example 3: Dynamic Content with Parameters
 * Use string interpolation for dynamic messages
 */
export function DynamicContentExample() {
  const { t } = useI18n();
  const [speed] = useState('5.2 MB');

  return (
    <div>
      <p>{t('transfer.speed', { speed })}</p>
    </div>
  );
}

/**
 * Example 4: Conditional Translations
 * Show different content based on app state and language
 */
export function ConditionalTranslationExample() {
  const { t } = useI18n();
  const [isTransferring, setIsTransferring] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  return (
    <div>
      {!isTransferring && !isComplete && (
        <p>{t('transfer.dropFiles')}</p>
      )}
      {isTransferring && (
        <p>{t('transfer.receiving')}</p>
      )}
      {isComplete && (
        <p>{t('transfer.complete')}</p>
      )}
    </div>
  );
}

/**
 * Example 5: Error Message Translation
 * Display translated error messages
 */
export function ErrorMessageExample() {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    try {
      const file = new File([], '', { type: 'application/octet-stream' });
      if (!file) {
        setError('fileNotFound');
      } else if (file.size > 1000000) {
        setError('fileTooBig');
      }
    } catch {
      setError('cryptoError');
    }
  };

  return (
    <div>
      <button onClick={handleUpload}>{t('common.upload')}</button>
      {error && (
        <div className="error">
          {t(`errors.${error}`)}
        </div>
      )}
    </div>
  );
}

/**
 * Example 6: Settings Component with Multiple Categories
 * Shows how to organize translations across different sections
 */
export function SettingsExample() {
  const { t, language, setLanguage } = useI18n();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <div>
      <h2>{t('settings.title')}</h2>

      <section>
        <h3>{t('settings.theme')}</h3>
        <button
          onClick={() => setTheme('light')}
          aria-pressed={theme === 'light'}
        >
          {t('settings.light')}
        </button>
        <button
          onClick={() => setTheme('dark')}
          aria-pressed={theme === 'dark'}
        >
          {t('settings.dark')}
        </button>
      </section>

      <section>
        <h3>{t('settings.language')}</h3>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as LanguageCode)}
        >
          {getAvailableLanguages().map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.nativeName}
            </option>
          ))}
        </select>
      </section>
    </div>
  );
}

/**
 * Example 7: Form with Translated Labels and Validation
 * Demonstrates translations in form context
 */
export function FormExample() {
  const { t } = useI18n();
  const [deviceName, setDeviceName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName) {
      setError(t('errors.invalidInput'));
      return;
    }
    // Process form
    setError(null);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="device-name">{t('settings.deviceName')} :</label>
      <input
        id="device-name"
        type="text"
        value={deviceName}
        onChange={(e) => setDeviceName(e.target.value)}
        placeholder={t('settings.deviceNamePlaceholder')}
        aria-invalid={!!error}
        aria-describedby={error ? 'error-message' : undefined}
      />
      {error && <p id="error-message">{error}</p>}
      <button type="submit">{t('common.save')}</button>
    </form>
  );
}

/**
 * Example 8: Accessibility Features
 * Demonstrates proper use of translations for a11y
 */
export function AccessibilityExample() {
  const { t, setHtmlAttributes } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div>
      <a href="#main-content">{t('a11y.skipToContent')}</a>

      <button
        onClick={toggleMenu}
        aria-label={menuOpen ? t('a11y.closeMenu') : t('a11y.openMenu')}
        aria-expanded={menuOpen}
        aria-controls="navigation"
      >
        Menu
      </button>

      {menuOpen && (
        <nav id="navigation" role="navigation">
          <a href="/">{t('nav.home')}</a>
          <a href="/features">{t('nav.features')}</a>
          <a href="/security">{t('nav.security')}</a>
        </nav>
      )}

      <main id="main-content">
        <h1>{t('hero.title')}</h1>
      </main>
    </div>
  );
}

/**
 * Example 9: Notification Component with Translations
 * Shows how to handle different notification types
 */
export function NotificationExample() {
  const { t } = useI18n();
  const [notifications, setNotifications] = useState<
    { id: string; type: keyof typeof notificationMap; message?: string }[]
  >([]);

  const notificationMap = {
    transferComplete: t('notifications.transferComplete'),
    newDevice: t('notifications.newDevice'),
    friendRequest: t('notifications.friendRequest'),
    error: t('notifications.error'),
    connectionLost: t('notifications.connectionLost'),
  };

  const addNotification = (
    type: keyof typeof notificationMap,
    message?: string
  ) => {
    const id = Math.random().toString();
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  return (
    <div>
      <button onClick={() => addNotification('transferComplete')}>
        {t('common.info')}
      </button>

      <div role="region" aria-live="polite">
        {notifications.map((notif) => (
          <div key={notif.id} className="notification">
            {notif.message || notificationMap[notif.type]}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 10: Language-Aware Components
 * React to language changes with useEffect
 */
export function LanguageAwareExample() {
  const { t, language } = useI18n();
  const [greeting, setGreeting] = useState('');

  React.useEffect(() => {
    // Update content when language changes
    const time = new Date().getHours();
    const isEvening = time >= 18;

    if (isEvening) {
      setGreeting(t('notifications.transferComplete'));
    } else {
      setGreeting(t('common.appName'));
    }
  }, [language, t]);

  return (
    <div>
      <h1>{greeting}</h1>
      <p>{t('hero.subtitle')}</p>
    </div>
  );
}

/**
 * Example 11: File Transfer Component
 * Real-world example with multiple translation categories
 */
export function FileTransferExample() {
  const { t } = useI18n();
  const [files, setFiles] = useState<File[]>([]);
  const [transferStatus, setTransferStatus] = useState<
    'idle' | 'scanning' | 'receiving' | 'complete' | 'failed'
  >('idle');

  const handleDragDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
  };

  return (
    <div>
      <div
        onDrop={handleDragDrop}
        onDragOver={(e) => e.preventDefault()}
        className="drop-zone"
      >
        {transferStatus === 'idle' && (
          <p>{t('transfer.dropFiles')}</p>
        )}
        {transferStatus === 'scanning' && (
          <p>{t('transfer.scanning')}</p>
        )}
        {transferStatus === 'receiving' && (
          <p>{t('transfer.receiving')}</p>
        )}
        {transferStatus === 'complete' && (
          <p>{t('transfer.complete')}</p>
        )}
        {transferStatus === 'failed' && (
          <p>{t('transfer.failed')}</p>
        )}
      </div>

      {files.length > 0 && (
        <div>
          <h3>{t('transfer.filesSelected', { count: files.length })}</h3>
          <ul>
            {files.map((file) => (
              <li key={file.name}>{file.name}</li>
            ))}
          </ul>
          <div>
            <button onClick={() => setTransferStatus('scanning')}>
              {t('transfer.startTransfer')}
            </button>
            <button onClick={() => setFiles([])}>
              {t('transfer.clearFiles')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Example 12: Multi-Language Settings Panel
 * Complete settings management example
 */
export function SettingsPanelExample() {
  const { t, language, setLanguage, availableLanguages } = useI18n();
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [deviceName, setDeviceName] = useState('My Device');
  const [notificationsEnabled, setNotificationsEnabled] =
    useState(true);

  return (
    <div className="settings-panel">
      <h2>{t('settings.title')}</h2>

      <fieldset>
        <legend>{t('settings.appearance')}</legend>
        <div>
          <label htmlFor="theme-select">{t('settings.theme')} :</label>
          <select
            id="theme-select"
            value={theme}
            onChange={(e) =>
              setTheme(e.target.value as 'light' | 'dark' | 'auto')
            }
          >
            <option value="light">{t('settings.light')}</option>
            <option value="dark">{t('settings.dark')}</option>
            <option value="auto">{t('settings.autoMode')}</option>
          </select>
        </div>
      </fieldset>

      <fieldset>
        <legend>{t('settings.general')}</legend>
        <div>
          <label htmlFor="language-select">{t('settings.language')} :</label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
          >
            {Object.values(availableLanguages).map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="device-name">{t('settings.deviceName')} :</label>
          <input
            id="device-name"
            type="text"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>{t('settings.notifications')}</legend>
        <label>
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => setNotificationsEnabled(e.target.checked)}
          />
          {t('settings.enableNotifications')}
        </label>
      </fieldset>

      <div className="button-group">
        <button>{t('common.save')}</button>
        <button>{t('common.cancel')}</button>
      </div>
    </div>
  );
}

// Helper function that was used but not imported
function t(key: string, params?: Record<string, any>): string {
  const { t: tFunc } = useI18n();
  return tFunc(key, params);
}

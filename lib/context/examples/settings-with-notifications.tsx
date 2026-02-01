/**
 * Example: Settings Panel with Notifications
 * Demonstrates using SettingsContext and NotificationsContext together
 */

'use client';

import { useState } from 'react';
import { useSettings } from '../settings-context';
import { useNotifications } from '../notifications-context';

export function SettingsPanelExample() {
  const {
    settings,
    updateSettings,
    updatePrivacySettings,
    updateNotificationSettings: _updateNotificationSettings,
    updateAccessibilitySettings,
    setTheme,
    resetToDefaults,
    addTrustedContact,
    removeTrustedContact,
    isTrustedContact,
    isLoading,
    isSaving,
  } = useSettings();

  const {
    success,
    error,
    warning,
    notifyWithUndo,
  } = useNotifications();

  const [contactId, setContactId] = useState('');

  if (isLoading) {
    return <div className="p-4">Loading settings...</div>;
  }

  const handleThemeChange = async (newTheme: string) => {
    try {
      await setTheme(newTheme as any);
      success('Theme updated', {
        description: `Changed to ${newTheme} mode`,
      });
    } catch (_err) {
      error('Failed to update theme');
    }
  };

  const handlePrivacyToggle = async (key: string, value: boolean) => {
    try {
      await updatePrivacySettings({ [key]: value });
      success('Privacy settings updated');
    } catch (_err) {
      error('Failed to update privacy settings');
    }
  };

  const handleAccessibilityToggle = async (key: string, value: boolean) => {
    try {
      await updateAccessibilitySettings({ [key]: value });
      success('Accessibility settings updated');

      if (key === 'reducedMotion' && value) {
        warning('Animations will be disabled', {
          description: 'Refresh the page to apply changes',
        });
      }
    } catch (_err) {
      error('Failed to update accessibility settings');
    }
  };

  const handleResetCategory = async (category: 'privacy' | 'notifications' | 'accessibility') => {
    const previousSettings = { ...settings };

    try {
      await resetToDefaults(category);

      notifyWithUndo(
        `${category.charAt(0).toUpperCase() + category.slice(1)} settings reset`,
        async () => {
          // Restore previous settings
          await updateSettings(previousSettings);
          success('Settings restored');
        }
      );
    } catch (_err) {
      error('Failed to reset settings');
    }
  };

  const handleAddTrustedContact = async () => {
    if (!contactId.trim()) {
      warning('Please enter a contact ID');
      return;
    }

    if (isTrustedContact(contactId)) {
      warning('Contact is already trusted');
      return;
    }

    try {
      await addTrustedContact(contactId);
      success(`Added ${contactId} to trusted contacts`, {
        description: 'Metadata will not be stripped for this contact',
      });
      setContactId('');
    } catch (_err) {
      error('Failed to add trusted contact');
    }
  };

  const handleRemoveTrustedContact = async (id: string) => {
    try {
      await removeTrustedContact(id);

      notifyWithUndo(
        `Removed ${id} from trusted contacts`,
        async () => {
          await addTrustedContact(id);
          success('Contact restored to trusted list');
        }
      );
    } catch (_err) {
      error('Failed to remove trusted contact');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Theme */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Appearance</h2>

        <div className="space-y-2">
          <label htmlFor="theme-select" className="block text-sm font-medium">Theme</label>
          <select
            id="theme-select"
            value={settings.theme}
            onChange={(e) => handleThemeChange(e.target.value)}
            disabled={isSaving}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="high-contrast">High Contrast</option>
            <option value="system">System</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="language-select" className="block text-sm font-medium">Language</label>
          <select
            id="language-select"
            value={settings.language}
            onChange={(e) => updateSettings({ language: e.target.value as any })}
            disabled={isSaving}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="zh">中文</option>
          </select>
        </div>
      </section>

      {/* Privacy */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Privacy</h2>
          <button
            onClick={() => handleResetCategory('privacy')}
            className="text-sm text-white hover:underline"
            disabled={isSaving}
          >
            Reset to defaults
          </button>
        </div>

        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.privacy.stripMetadataEnabled}
              onChange={(e) => handlePrivacyToggle('stripMetadataEnabled', e.target.checked)}
              disabled={isSaving}
            />
            <span>Strip metadata from files</span>
          </label>

          {settings.privacy.stripMetadataEnabled && (
            <div className="ml-6 space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.privacy.stripMetadataByDefault}
                  onChange={(e) => handlePrivacyToggle('stripMetadataByDefault', e.target.checked)}
                  disabled={isSaving}
                />
                <span>Strip metadata by default</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.privacy.preserveOrientation}
                  onChange={(e) => handlePrivacyToggle('preserveOrientation', e.target.checked)}
                  disabled={isSaving}
                />
                <span>Preserve image orientation</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.privacy.showMetadataWarnings}
                  onChange={(e) => handlePrivacyToggle('showMetadataWarnings', e.target.checked)}
                  disabled={isSaving}
                />
                <span>Show metadata warnings</span>
              </label>
            </div>
          )}

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.privacy.relayModeEnabled}
              onChange={(e) => handlePrivacyToggle('relayModeEnabled', e.target.checked)}
              disabled={isSaving}
            />
            <span>Use relay mode for enhanced privacy</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.privacy.useOnionRouting}
              onChange={(e) => handlePrivacyToggle('useOnionRouting', e.target.checked)}
              disabled={isSaving}
            />
            <span>Enable onion routing</span>
          </label>
        </div>

        {/* Trusted Contacts */}
        <div className="mt-4 space-y-2">
          <label htmlFor="trusted-contact-input" className="block text-sm font-medium">Trusted Contacts</label>
          <p className="text-sm text-gray-600">
            Metadata will not be stripped when sending to trusted contacts
          </p>

          <div className="flex space-x-2">
            <input
              id="trusted-contact-input"
              type="text"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              placeholder="Enter contact ID"
              className="flex-1 px-3 py-2 border rounded-md"
              disabled={isSaving}
            />
            <button
              onClick={handleAddTrustedContact}
              className="px-4 py-2 bg-white/20 text-white rounded-md hover:bg-white/30"
              disabled={isSaving}
            >
              Add
            </button>
          </div>

          {settings.privacy.trustedContacts.length > 0 && (
            <ul className="mt-2 space-y-1">
              {settings.privacy.trustedContacts.map((id) => (
                <li key={id} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                  <span className="text-sm">{id}</span>
                  <button
                    onClick={() => handleRemoveTrustedContact(id)}
                    className="text-sm text-red-600 hover:underline"
                    disabled={isSaving}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Accessibility */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Accessibility</h2>
          <button
            onClick={() => handleResetCategory('accessibility')}
            className="text-sm text-white hover:underline"
            disabled={isSaving}
          >
            Reset to defaults
          </button>
        </div>

        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.accessibility.reducedMotion}
              onChange={(e) => handleAccessibilityToggle('reducedMotion', e.target.checked)}
              disabled={isSaving}
            />
            <span>Reduced motion</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.accessibility.highContrast}
              onChange={(e) => handleAccessibilityToggle('highContrast', e.target.checked)}
              disabled={isSaving}
            />
            <span>High contrast mode</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.accessibility.largeText}
              onChange={(e) => handleAccessibilityToggle('largeText', e.target.checked)}
              disabled={isSaving}
            />
            <span>Large text</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.accessibility.enableVoiceCommands}
              onChange={(e) => handleAccessibilityToggle('enableVoiceCommands', e.target.checked)}
              disabled={isSaving}
            />
            <span>Voice commands</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.accessibility.enableKeyboardShortcuts}
              onChange={(e) => handleAccessibilityToggle('enableKeyboardShortcuts', e.target.checked)}
              disabled={isSaving}
            />
            <span>Keyboard shortcuts</span>
          </label>
        </div>
      </section>

      {isSaving && (
        <div className="text-sm text-gray-600">Saving settings...</div>
      )}
    </div>
  );
}

export default SettingsPanelExample;

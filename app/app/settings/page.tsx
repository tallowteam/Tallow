'use client';

import * as React from 'react';
import { PageLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { LabeledSwitch } from '@/components/ui/Switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Shield, Moon, Bell, Download, Trash2, User } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS SECTION
// ═══════════════════════════════════════════════════════════════════════════

interface SettingsSectionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}

function SettingsSection({ icon, title, description, children }: SettingsSectionProps) {
  return (
    <Card className="mb-6">
      <CardHeader className="flex-row items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-elevated)] text-[var(--color-primary-500)]">
          {icon}
        </div>
        <div className="flex-1">
          <CardTitle as="h2">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function SettingsPage() {
  // Settings state
  const [deviceName, setDeviceName] = React.useState('My Device');
  const [theme, setTheme] = React.useState('dark');
  const [autoAccept, setAutoAccept] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);
  const [saveHistory, setSaveHistory] = React.useState(true);
  const [downloadLocation, setDownloadLocation] = React.useState('~/Downloads');
  const [requireConfirmation, setRequireConfirmation] = React.useState(true);
  const [encryptionLevel, setEncryptionLevel] = React.useState('high');

  return (
    <PageLayout
      title="Settings"
      description="Configure your Tallow preferences"
      maxWidth="lg"
    >
      {/* Device Settings */}
      <SettingsSection
        icon={<User className="h-5 w-5" />}
        title="Device"
        description="Customize how your device appears to others"
      >
        <Input
          label="Device Name"
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
          hint="This name will be visible to nearby devices"
        />
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection
        icon={<Moon className="h-5 w-5" />}
        title="Appearance"
        description="Customize the look and feel"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Theme</p>
            <p className="text-xs text-[var(--text-secondary)]">Choose your preferred color scheme</p>
          </div>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SettingsSection>

      {/* Security */}
      <SettingsSection
        icon={<Shield className="h-5 w-5" />}
        title="Security"
        description="Control security and privacy settings"
      >
        <LabeledSwitch
          label="Require confirmation"
          description="Ask before accepting incoming transfers"
          checked={requireConfirmation}
          onCheckedChange={setRequireConfirmation}
        />

        <LabeledSwitch
          label="Auto-accept from trusted devices"
          description="Automatically accept transfers from paired devices"
          checked={autoAccept}
          onCheckedChange={setAutoAccept}
        />

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Encryption Level</p>
            <p className="text-xs text-[var(--text-secondary)]">Higher levels are more secure but slower</p>
          </div>
          <Select value={encryptionLevel} onValueChange={setEncryptionLevel}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="maximum">Maximum</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection
        icon={<Bell className="h-5 w-5" />}
        title="Notifications"
        description="Manage notification preferences"
      >
        <LabeledSwitch
          label="Enable notifications"
          description="Get notified about incoming transfers"
          checked={notifications}
          onCheckedChange={setNotifications}
        />
      </SettingsSection>

      {/* Downloads */}
      <SettingsSection
        icon={<Download className="h-5 w-5" />}
        title="Downloads"
        description="Configure where files are saved"
      >
        <Input
          label="Download Location"
          value={downloadLocation}
          onChange={(e) => setDownloadLocation(e.target.value)}
          hint="Where received files will be saved"
        />

        <LabeledSwitch
          label="Save transfer history"
          description="Keep a record of sent and received files"
          checked={saveHistory}
          onCheckedChange={setSaveHistory}
        />
      </SettingsSection>

      {/* Danger Zone */}
      <SettingsSection
        icon={<Trash2 className="h-5 w-5" />}
        title="Data"
        description="Manage your data and history"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Clear Transfer History</p>
            <p className="text-xs text-[var(--text-secondary)]">Remove all transfer records</p>
          </div>
          <Button variant="outline" size="sm">
            Clear History
          </Button>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Reset All Settings</p>
            <p className="text-xs text-[var(--text-secondary)]">Restore default settings</p>
          </div>
          <Button variant="danger" size="sm">
            Reset
          </Button>
        </div>
      </SettingsSection>
    </PageLayout>
  );
}

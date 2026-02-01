'use client';

import { useState, useEffect } from 'react';
import { Shield, Eye, AlertCircle, UserCheck, Image, Video, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  getPrivacySettings,
  updatePrivacySettings,
  resetPrivacySettings,
  PrivacySettings,
} from '@/lib/privacy/privacy-settings';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function PrivacySettingsPanel() {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getPrivacySettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
      toast.error('Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updates: Partial<PrivacySettings>) => {
    if (!settings) {return;}

    try {
      const updated = await updatePrivacySettings(updates);
      setSettings(updated);
      toast.success('Privacy settings updated');
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleReset = async () => {
    try {
      const defaults = await resetPrivacySettings();
      setSettings(defaults);
      toast.success('Privacy settings reset to defaults');
    } catch (error) {
      console.error('Failed to reset settings:', error);
      toast.error('Failed to reset settings');
    }
  };

  if (loading || !settings) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Privacy Protection</h2>
            <p className="text-sm text-muted-foreground">
              Control how your files are protected before transfer
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          Reset to Defaults
        </Button>
      </div>

      <Separator />

      {/* Main Toggle */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="strip-enabled" className="text-base font-medium">
                Enable Metadata Stripping
              </Label>
              <Badge variant={settings.stripMetadataEnabled ? 'default' : 'secondary'}>
                {settings.stripMetadataEnabled ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Automatically remove sensitive metadata from files before transfer to protect your privacy
            </p>
          </div>
          <Switch
            id="strip-enabled"
            checked={settings.stripMetadataEnabled}
            onCheckedChange={(checked) =>
              handleUpdate({ stripMetadataEnabled: checked })
            }
          />
        </div>
      </Card>

      {/* Metadata Stripping Options */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Metadata Stripping Options
        </h3>

        <div className="space-y-4">
          {/* Strip by Default */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Label htmlFor="strip-default" className="text-sm font-medium">
                Strip metadata by default
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Automatically strip metadata from all files unless disabled per transfer
              </p>
            </div>
            <Switch
              id="strip-default"
              checked={settings.stripMetadataByDefault}
              onCheckedChange={(checked) =>
                handleUpdate({ stripMetadataByDefault: checked })
              }
              disabled={!settings.stripMetadataEnabled}
            />
          </div>

          <Separator />

          {/* Preserve Orientation */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Label htmlFor="preserve-orientation" className="text-sm font-medium">
                Preserve image orientation
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Keep orientation data to ensure images display correctly
              </p>
            </div>
            <Switch
              id="preserve-orientation"
              checked={settings.preserveOrientation}
              onCheckedChange={(checked) =>
                handleUpdate({ preserveOrientation: checked })
              }
              disabled={!settings.stripMetadataEnabled}
            />
          </div>

          <Separator />

          {/* Show Warnings */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Label htmlFor="show-warnings" className="text-sm font-medium">
                Show metadata warnings
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Display alerts when sensitive metadata is detected
              </p>
            </div>
            <Switch
              id="show-warnings"
              checked={settings.showMetadataWarnings}
              onCheckedChange={(checked) =>
                handleUpdate({ showMetadataWarnings: checked })
              }
              disabled={!settings.stripMetadataEnabled}
            />
          </div>
        </div>
      </Card>

      {/* File Type Preferences */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Image className="w-5 h-5" aria-hidden="true" />
          File Type Preferences
        </h3>

        <div className="space-y-4">
          {/* Strip from Images */}
          <div className="flex items-start justify-between">
            <div className="flex-1 flex items-center gap-2">
              <Image className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <div>
                <Label htmlFor="strip-images" className="text-sm font-medium">
                  Strip from images
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Remove EXIF data from JPEG, PNG, WebP, and HEIC files
                </p>
              </div>
            </div>
            <Switch
              id="strip-images"
              checked={settings.stripFromImages}
              onCheckedChange={(checked) =>
                handleUpdate({ stripFromImages: checked })
              }
              disabled={!settings.stripMetadataEnabled}
            />
          </div>

          <Separator />

          {/* Strip from Videos */}
          <div className="flex items-start justify-between">
            <div className="flex-1 flex items-center gap-2">
              <Video className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label htmlFor="strip-videos" className="text-sm font-medium">
                  Strip from videos
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Remove metadata from MP4 and MOV files
                </p>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    <Switch
                      id="strip-videos"
                      checked={settings.stripFromVideos}
                      onCheckedChange={(checked) =>
                        handleUpdate({ stripFromVideos: checked })
                      }
                      disabled={!settings.stripMetadataEnabled}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Video metadata stripping requires advanced processing</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </Card>

      {/* Privacy Notifications */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Privacy Notifications
        </h3>

        <div className="space-y-4">
          {/* Notify on Sensitive Data */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Label htmlFor="notify-sensitive" className="text-sm font-medium">
                Alert on sensitive data
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Show notification when files contain GPS, camera info, or timestamps
              </p>
            </div>
            <Switch
              id="notify-sensitive"
              checked={settings.notifyOnSensitiveData}
              onCheckedChange={(checked) =>
                handleUpdate({ notifyOnSensitiveData: checked })
              }
              disabled={!settings.stripMetadataEnabled}
            />
          </div>

          <Separator />

          {/* Require Confirmation */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Label htmlFor="require-confirm" className="text-sm font-medium">
                Require confirmation before stripping
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Ask for permission before removing metadata from files
              </p>
            </div>
            <Switch
              id="require-confirm"
              checked={settings.requireConfirmationBeforeStrip}
              onCheckedChange={(checked) =>
                handleUpdate({ requireConfirmationBeforeStrip: checked })
              }
              disabled={!settings.stripMetadataEnabled}
            />
          </div>
        </div>
      </Card>

      {/* Trusted Contacts */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck className="w-5 h-5" />
          <h3 className="text-lg font-medium">Trusted Contacts</h3>
          <Badge variant="secondary">{settings.trustedContacts.length}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Skip metadata stripping when sending to trusted contacts. Manage trusted contacts in the Friends section.
        </p>
        {settings.trustedContacts.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No trusted contacts configured
          </div>
        )}
      </Card>

      {/* Information Card */}
      <Card className="p-6 border-white/30 bg-white/20/10">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-white shrink-0 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-medium text-white mb-2">What gets removed?</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• GPS location coordinates and altitude</li>
              <li>• Camera make, model, and lens information</li>
              <li>• Date/time when photo was taken</li>
              <li>• Software and editing history</li>
              <li>• Author, copyright, and ownership data</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default PrivacySettingsPanel;

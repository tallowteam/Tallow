'use client';

/**
 * Resumable Transfer Settings
 * Configuration panel for resumable transfer options
 */

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cleanupExpiredTransfers, getResumableTransfers } from '@/lib/storage/transfer-state-db';
import { toast } from 'sonner';
import {
  Settings,
  Trash2,
  RefreshCw,
  Info,
  Zap,
} from 'lucide-react';

interface ResumableTransferSettingsProps {
  onSettingsChange?: (settings: TransferSettings) => void;
}

interface TransferSettings {
  autoResume: boolean;
  resumeTimeout: number;
  maxResumeAttempts: number;
  autoCleanup: boolean;
  cleanupDays: number;
  chunkSize: number;
}

const DEFAULT_SETTINGS: TransferSettings = {
  autoResume: true,
  resumeTimeout: 30000,
  maxResumeAttempts: 3,
  autoCleanup: true,
  cleanupDays: 7,
  chunkSize: 64,
};

export function ResumableTransferSettings({
  onSettingsChange,
}: ResumableTransferSettingsProps) {
  const [settings, setSettings] = useState<TransferSettings>(DEFAULT_SETTINGS);
  const [resumableCount, setResumableCount] = useState(0);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const loadSettings = () => {
      if (typeof window === 'undefined') {return;}

      const saved = localStorage.getItem('tallow_resumable_transfer_settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        } catch (e) {
          console.error('Failed to load settings:', e);
        }
      }
    };

    loadSettings();
    loadResumableCount();
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: TransferSettings) => {
    setSettings(newSettings);

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'tallow_resumable_transfer_settings',
        JSON.stringify(newSettings)
      );
    }

    onSettingsChange?.(newSettings);
    toast.success('Settings saved');
  };

  // Load resumable transfer count
  const loadResumableCount = async () => {
    try {
      const transfers = await getResumableTransfers();
      setResumableCount(transfers.length);
    } catch (e) {
      console.error('Failed to load resumable count:', e);
    }
  };

  // Handle cleanup
  const handleCleanup = async () => {
    setIsCleaningUp(true);

    try {
      const deleted = await cleanupExpiredTransfers();

      toast.success('Cleanup complete', {
        description: `${deleted} expired transfer(s) deleted`,
      });

      await loadResumableCount();
    } catch (error) {
      toast.error('Cleanup failed', {
        description: (error as Error).message,
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  // Update individual setting
  const updateSetting = <K extends keyof TransferSettings>(
    key: K,
    value: TransferSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle>Resumable Transfer Settings</CardTitle>
        </div>
        <CardDescription>
          Configure automatic resume and cleanup options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto-Resume Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-resume">Auto-Resume</Label>
              <p className="text-sm text-muted-foreground">
                Automatically resume interrupted transfers on reconnect
              </p>
            </div>
            <Switch
              id="auto-resume"
              checked={settings.autoResume}
              onCheckedChange={(checked) => updateSetting('autoResume', checked)}
            />
          </div>

          {settings.autoResume && (
            <>
              {/* Resume Timeout */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="resume-timeout">
                    Resume Timeout
                  </Label>
                  <Badge variant="secondary">
                    {settings.resumeTimeout / 1000}s
                  </Badge>
                </div>
                <Slider
                  id="resume-timeout"
                  min={5000}
                  max={120000}
                  step={5000}
                  value={[settings.resumeTimeout]}
                  onValueChange={([value]) => value !== undefined && updateSetting('resumeTimeout', value)}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum time to wait for peer response during resume
                </p>
              </div>

              {/* Max Resume Attempts */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="max-attempts">Max Resume Attempts</Label>
                  <Badge variant="secondary">{settings.maxResumeAttempts}</Badge>
                </div>
                <Slider
                  id="max-attempts"
                  min={1}
                  max={10}
                  step={1}
                  value={[settings.maxResumeAttempts]}
                  onValueChange={([value]) => value !== undefined && updateSetting('maxResumeAttempts', value)}
                />
                <p className="text-xs text-muted-foreground">
                  Number of times to retry resume before giving up
                </p>
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* Cleanup Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-cleanup">Auto-Cleanup</Label>
              <p className="text-sm text-muted-foreground">
                Automatically delete expired transfers
              </p>
            </div>
            <Switch
              id="auto-cleanup"
              checked={settings.autoCleanup}
              onCheckedChange={(checked) => updateSetting('autoCleanup', checked)}
            />
          </div>

          {settings.autoCleanup && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="cleanup-days">Cleanup After</Label>
                <Badge variant="secondary">{settings.cleanupDays} days</Badge>
              </div>
              <Slider
                id="cleanup-days"
                min={1}
                max={30}
                step={1}
                value={[settings.cleanupDays]}
                onValueChange={([value]) => value !== undefined && updateSetting('cleanupDays', value)}
              />
              <p className="text-xs text-muted-foreground">
                Delete transfers older than this many days
              </p>
            </div>
          )}

          {/* Manual Cleanup */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-medium">Resumable Transfers</p>
              <p className="text-xs text-muted-foreground">
                {resumableCount} transfer(s) stored
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadResumableCount}
                disabled={isCleaningUp}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCleanup}
                disabled={isCleaningUp}
              >
                {isCleaningUp ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Performance Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <Label>Performance</Label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="chunk-size">Chunk Size</Label>
              <Badge variant="secondary">{settings.chunkSize} KB</Badge>
            </div>
            <Select
              value={String(settings.chunkSize)}
              onValueChange={(value) => updateSetting('chunkSize', parseInt(value))}
            >
              <SelectTrigger id="chunk-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16">16 KB (Slow/Unstable)</SelectItem>
                <SelectItem value="32">32 KB (Balanced)</SelectItem>
                <SelectItem value="64">64 KB (Recommended)</SelectItem>
                <SelectItem value="128">128 KB (Fast/Stable)</SelectItem>
                <SelectItem value="256">256 KB (Maximum)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Smaller chunks are better for unstable connections
            </p>
          </div>
        </div>

        <Separator />

        {/* Info Section */}
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Info className="h-4 w-4" />
            Storage Information
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              • Transfer state is stored in IndexedDB for persistence
            </p>
            <p>
              • Chunks are encrypted and stored locally
            </p>
            <p>
              • Resume works even after browser restart
            </p>
            <p>
              • Expired transfers are cleaned up automatically
            </p>
          </div>
        </div>

        {/* Reset Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => saveSettings(DEFAULT_SETTINGS)}
        >
          Reset to Defaults
        </Button>
      </CardContent>
    </Card>
  );
}

export default ResumableTransferSettings;

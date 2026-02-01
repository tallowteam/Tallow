'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Hand,
  ArrowRight,
  ArrowLeft,
  ZoomIn,
  Download,
  Info,
} from 'lucide-react';

const GESTURE_SETTINGS_KEY = 'tallow_gesture_settings';

export interface GestureSettings {
  swipeToDelete: boolean;
  swipeToRetry: boolean;
  pinchToZoom: boolean;
  pullToRefresh: boolean;
}

const DEFAULT_SETTINGS: GestureSettings = {
  swipeToDelete: true,
  swipeToRetry: true,
  pinchToZoom: true,
  pullToRefresh: false,
};

export function MobileGestureSettings() {
  const [settings, setSettings] = useState<GestureSettings>(DEFAULT_SETTINGS);
  const [showDemo, setShowDemo] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(GESTURE_SETTINGS_KEY);
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to load gesture settings:', err);
      }
    }
  }, []);

  // Save settings to localStorage
  const updateSetting = (key: keyof GestureSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem(GESTURE_SETTINGS_KEY, JSON.stringify(newSettings));
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Hand className="w-5 h-5" />
            Touch Gestures
          </h3>
          <p className="text-sm text-muted-foreground">
            Customize mobile gestures for faster interactions
          </p>
        </div>

        <div className="space-y-4">
          {/* Swipe to Delete */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label
                htmlFor="swipe-delete"
                className="text-base flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Swipe Left to Delete
              </Label>
              <p className="text-sm text-muted-foreground">
                Remove completed or failed transfers with a left swipe
              </p>
            </div>
            <Switch
              id="swipe-delete"
              checked={settings.swipeToDelete}
              onCheckedChange={(checked) => updateSetting('swipeToDelete', checked)}
            />
          </div>

          {/* Swipe to Retry */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label
                htmlFor="swipe-retry"
                className="text-base flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Swipe Right to Retry
              </Label>
              <p className="text-sm text-muted-foreground">
                Retry failed transfers with a right swipe
              </p>
            </div>
            <Switch
              id="swipe-retry"
              checked={settings.swipeToRetry}
              onCheckedChange={(checked) => updateSetting('swipeToRetry', checked)}
            />
          </div>

          {/* Pinch to Zoom */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label
                htmlFor="pinch-zoom"
                className="text-base flex items-center gap-2"
              >
                <ZoomIn className="w-4 h-4" />
                Pinch to Zoom
              </Label>
              <p className="text-sm text-muted-foreground">
                Zoom file previews with pinch gesture
              </p>
            </div>
            <Switch
              id="pinch-zoom"
              checked={settings.pinchToZoom}
              onCheckedChange={(checked) => updateSetting('pinchToZoom', checked)}
            />
          </div>

          {/* Pull to Refresh */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label
                htmlFor="pull-refresh"
                className="text-base flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Pull to Refresh
              </Label>
              <p className="text-sm text-muted-foreground">
                Refresh device list by pulling down
              </p>
            </div>
            <Switch
              id="pull-refresh"
              checked={settings.pullToRefresh}
              onCheckedChange={(checked) => updateSetting('pullToRefresh', checked)}
            />
          </div>
        </div>

        {/* Demo/Help */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setShowDemo(!showDemo)}
            className="w-full"
          >
            <Info className="w-4 h-4 mr-2" />
            {showDemo ? 'Hide' : 'Show'} Gesture Guide
          </Button>

          {showDemo && (
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <ArrowLeft className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Swipe Left</p>
                  <p className="text-muted-foreground">
                    Swipe a transfer card to the left to delete it
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <ArrowRight className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Swipe Right</p>
                  <p className="text-muted-foreground">
                    Swipe a failed transfer to the right to retry it
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <ZoomIn className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Pinch to Zoom</p>
                  <p className="text-muted-foreground">
                    Use two fingers to zoom in/out on file previews
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <Download className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Pull Down</p>
                  <p className="text-muted-foreground">
                    Pull down from the top to refresh the device list
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Hook to get current gesture settings
 */
export function useGestureSettings(): GestureSettings {
  const [settings, setSettings] = useState<GestureSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const saved = localStorage.getItem(GESTURE_SETTINGS_KEY);
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to load gesture settings:', err);
      }
    }
  }, []);

  return settings;
}

export default MobileGestureSettings;

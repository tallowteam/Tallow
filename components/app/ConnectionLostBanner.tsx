'use client';

/**
 * Connection Lost Banner
 * Displays when transfer connection is interrupted
 * Shows auto-resume countdown and manual resume option
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { WifiOff, Play, X } from 'lucide-react';

interface ConnectionLostBannerProps {
  visible: boolean;
  transferId: string | null;
  progress: number;
  autoResumeEnabled: boolean;
  autoResumeCountdown: number;
  onResume: () => void;
  onCancel: () => void;
  onDismiss: () => void;
}

export function ConnectionLostBanner({
  visible,
  transferId,
  progress,
  autoResumeEnabled,
  autoResumeCountdown,
  onResume,
  onCancel,
  onDismiss,
}: ConnectionLostBannerProps) {
  if (!visible || !transferId) {return null;}

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
      <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
        <WifiOff className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <AlertTitle className="text-yellow-900 dark:text-yellow-100">
              Connection Lost
            </AlertTitle>
            <AlertDescription className="text-yellow-800 dark:text-yellow-200 mt-2 space-y-3">
              <p>
                Transfer paused at {progress.toFixed(1)}%. Your progress has been
                saved.
              </p>

              {autoResumeEnabled && autoResumeCountdown > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm">
                    Auto-resuming in {autoResumeCountdown}s...
                  </p>
                  <Progress
                    value={((10 - autoResumeCountdown) / 10) * 100}
                    className="h-2"
                  />
                </div>
              ) : null}

              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={onResume}
                  className="flex-1"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Resume Now
                </Button>
                {autoResumeEnabled && autoResumeCountdown > 0 ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onCancel}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>
    </div>
  );
}

export default ConnectionLostBanner;

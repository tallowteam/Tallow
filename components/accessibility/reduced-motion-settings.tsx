/**
 * Reduced Motion Settings Component
 * Allows users to control animation preferences
 */

'use client';

import { useCallback } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Monitor, Zap } from 'lucide-react';
import { useReducedMotionContext } from '@/lib/context/reduced-motion-context';
import { toast } from 'sonner';

export function ReducedMotionSettings() {
  const { reducedMotion, setReducedMotion, isSystemPreference } = useReducedMotionContext();

  const handleToggle = useCallback((checked: boolean) => {
    setReducedMotion(checked);
    toast.success(
      checked
        ? 'Animations disabled for smoother experience'
        : 'Animations enabled'
    );
  }, [setReducedMotion]);

  const handleReset = useCallback(() => {
    setReducedMotion(null);
    toast.success('Using system preference');
  }, [setReducedMotion]);

  // Get system preference for display
  const systemPreference = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  return (
    <div className="space-y-4">
      {/* Main Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Reduce motion</p>
          <p className="text-sm text-muted-foreground">
            Minimize animations and transitions
          </p>
        </div>
        <Switch
          checked={reducedMotion}
          onCheckedChange={handleToggle}
          aria-label="Toggle reduced motion"
        />
      </div>

      <Separator />

      {/* System Preference Info */}
      <div className="p-3 rounded-lg bg-secondary/50 space-y-2">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">System Preference</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {systemPreference
            ? 'Your system is set to reduce motion'
            : 'Your system allows motion and animations'}
        </p>
        {!isSystemPreference && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 text-xs"
          >
            Use System Setting
          </Button>
        )}
      </div>

      <Separator />

      {/* What This Does */}
      <div className="space-y-2">
        <p className="text-sm font-medium">What this does:</p>
        <ul className="text-xs text-muted-foreground space-y-1.5 ml-4">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Replaces animations with instant transitions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Removes auto-playing animations and effects</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Reduces visual distractions during transfers</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Improves performance on slower devices</span>
          </li>
        </ul>
      </div>

      {/* Preview Examples */}
      <Separator />

      <div className="space-y-3">
        <p className="text-sm font-medium">Preview:</p>

        <div className="grid grid-cols-2 gap-3">
          {/* With Motion */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="w-3 h-3" />
              <span>With motion</span>
            </div>
            <div
              className={`h-20 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 ${
                !reducedMotion ? 'animate-pulse hover:scale-105' : ''
              } transition-all`}
            />
          </div>

          {/* Without Motion */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Eye className="w-3 h-3" />
              <span>Reduced</span>
            </div>
            <div className="h-20 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20" />
          </div>
        </div>
      </div>

      {/* Accessibility Note */}
      <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
        <div className="flex items-start gap-3">
          <EyeOff className="w-5 h-5 text-accent mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium text-sm">Accessibility</p>
            <p className="text-xs text-muted-foreground">
              Reducing motion can help users with vestibular disorders, motion
              sensitivity, or those who find animations distracting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

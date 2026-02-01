'use client';

import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSwipeActions } from '@/lib/hooks/use-advanced-gestures';

export interface ActionSheetAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
  disabled?: boolean;
}

interface MobileActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  actions: ActionSheetAction[];
  enableSwipeDown?: boolean;
}

/**
 * Mobile-optimized action sheet with swipe-to-dismiss
 * Provides native-like bottom sheet experience
 */
export function MobileActionSheet({
  open,
  onOpenChange,
  title,
  description,
  actions,
  enableSwipeDown = true,
}: MobileActionSheetProps) {
  const { bind, offset: _offset, isDragging: _isDragging, swipeDirection: _swipeDirection, style } = useSwipeActions({
    onSwipeDown: () => {
      if (enableSwipeDown) {
        onOpenChange(false);
      }
    },
    threshold: 80,
    enabled: enableSwipeDown,
  });

  const handleActionClick = (action: ActionSheetAction) => {
    action.onClick();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-md p-0 gap-0',
          'sm:bottom-0 sm:top-auto sm:translate-y-0',
          'sm:rounded-t-2xl sm:rounded-b-none'
        )}
        {...(enableSwipeDown ? bind() : {})}
        style={enableSwipeDown ? style : undefined}
      >
        {/* Swipe indicator */}
        {enableSwipeDown && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-muted-foreground/20 rounded-full" />
          </div>
        )}

        <DialogHeader className="px-6 pt-4 pb-2 text-left">
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="p-2 space-y-1">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'ghost'}
              onClick={() => handleActionClick(action)}
              disabled={action.disabled}
              className={cn(
                'w-full justify-start h-12 text-base font-normal',
                action.variant === 'destructive' && 'text-destructive'
              )}
            >
              {action.icon && (
                <span className="mr-3 flex items-center">{action.icon}</span>
              )}
              {action.label}
            </Button>
          ))}
        </div>

        <div className="p-2 pt-1 border-t">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full h-12 text-base"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MobileActionSheet;

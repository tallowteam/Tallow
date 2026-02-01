'use client';

/**
 * Chat Header Component
 * Shows peer info and connection status
 */

import { memo } from 'react';
import { X, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ChatHeaderProps {
  peerName: string;
  isOnline: boolean;
  onClose?: () => void;
}

export const ChatHeader = memo(function ChatHeader({ peerName, isOnline, onClose }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center space-x-3">
        {/* Avatar */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/20 to-purple-600 flex items-center justify-center text-white font-semibold">
            {peerName.charAt(0).toUpperCase()}
          </div>

          {/* Online status indicator */}
          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`} />
        </div>

        {/* Peer info */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {peerName}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Circle className={`w-2 h-2 ${isOnline ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>

      {/* Close button */}
      {onClose && (
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
});

ChatHeader.displayName = 'ChatHeader';

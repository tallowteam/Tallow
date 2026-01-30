'use client';

/**
 * Typing Indicator Component
 * Shows animated dots when peer is typing
 */

import { memo } from 'react';

export interface TypingIndicatorProps {
  userName: string;
}

export const TypingIndicator = memo(function TypingIndicator({ userName }: TypingIndicatorProps) {
  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2">
        <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">
          {userName} is typing
        </span>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';

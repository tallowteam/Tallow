'use client';

/**
 * Message Bubble Component
 * Displays individual chat messages with status and actions
 */

import { useState } from 'react';
import { ChatMessage } from '@/lib/chat/chat-manager';
import { Check, CheckCheck, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  onDelete?: (messageId: string) => Promise<void>;
}

export function MessageBubble({ message, isOwn, onDelete }: MessageBubbleProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete || isDeleting) {return;}

    setIsDeleting(true);
    try {
      await onDelete(message.id);
    } catch (_error) {
      setIsDeleting(false);
    }
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-white" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
    >
      <div
        className={`max-w-[70%] ${
          isOwn
            ? 'bg-white/20 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
        } rounded-2xl px-4 py-2 shadow-sm relative`}
      >
        {/* Message content */}
        <div className="break-words whitespace-pre-wrap">
          {message.content}
        </div>

        {/* File attachment */}
        {message.fileAttachment && (
          <div className={`mt-2 p-2 rounded-lg ${
            isOwn ? 'bg-white/30' : 'bg-gray-200 dark:bg-gray-600'
          }`}>
            <div className="flex items-center space-x-2">
              <div className="flex-1 truncate">
                <p className="text-sm font-medium truncate">
                  {message.fileAttachment.name}
                </p>
                <p className={`text-xs ${
                  isOwn ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {(message.fileAttachment.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Timestamp and status */}
        <div className={`flex items-center justify-end space-x-1 mt-1 text-xs ${
          isOwn ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'
        }`}>
          <span>{formatTime(message.timestamp)}</span>
          {isOwn && getStatusIcon()}
        </div>

        {/* Edited indicator */}
        {message.editedAt && (
          <span className={`text-xs ${
            isOwn ? 'text-white/90' : 'text-gray-400 dark:text-gray-500'
          }`}>
            (edited)
          </span>
        )}

        {/* Delete button (appears on hover) */}
        {isOwn && onDelete && (
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            size="sm"
            variant="ghost"
            className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Delete message"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        )}
      </div>
    </div>
  );
}

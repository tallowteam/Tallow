'use client';

/**
 * Message Input Component
 * Handles message composition with file attachments
 */

import { useState, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface MessageInputProps {
  onSend: (content: string, file?: File) => Promise<void>;
  onTyping?: () => void;
  onStopTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  onTyping,
  onStopTyping,
  disabled = false,
  placeholder = 'Type a message...',
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }

    // Typing indicator
    if (onTyping) {
      onTyping();

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (onStopTyping) {
          onStopTyping();
        }
      }, 3000);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if ((!message.trim() && !attachedFile) || disabled || isSending) {
      return;
    }

    setIsSending(true);

    try {
      await onSend(message, attachedFile || undefined);

      // Clear input
      setMessage('');
      setAttachedFile(null);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Stop typing indicator
      if (onStopTyping) {
        onStopTyping();
      }
    } catch (_error) {
      // Error is handled by parent component
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB limit for chat)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setAttachedFile(file);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
      {/* File attachment preview */}
      {attachedFile && (
        <div className="mb-2 flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <Paperclip className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-gray-900 dark:text-white">
                {attachedFile.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(attachedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <Button
            onClick={removeAttachment}
            size="sm"
            variant="ghost"
            className="flex-shrink-0"
            aria-label="Remove attachment"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end space-x-2">
        {/* File attachment button */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          disabled={disabled}
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || !!attachedFile}
          size="sm"
          variant="ghost"
          className="flex-shrink-0"
          aria-label="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-white/40 disabled:opacity-50 disabled:cursor-not-allowed max-h-32 overflow-y-auto"
          style={{ minHeight: '40px' }}
        />

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={(!message.trim() && !attachedFile) || disabled || isSending}
          size="sm"
          className="flex-shrink-0 bg-white/20 hover:bg-white/30 text-white disabled:opacity-50"
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>

      {/* Character count for long messages */}
      {message.length > 5000 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
          {message.length} / 10000 characters
        </p>
      )}
    </div>
  );
}

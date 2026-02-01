'use client';

/**
 * Chat Input Component
 * Message input with emoji picker, file upload, and formatting
 */

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Smile, Send, Paperclip, Bold, Italic, Code } from 'lucide-react';
import { toast } from 'sonner';

interface ChatInputProps {
  onSendMessage: (content: string) => Promise<void>;
  onSendFile: (file: File) => Promise<void>;
  onTyping: () => void;
  onStopTyping: () => void;
  disabled?: boolean;
}

// Common emoji categories
const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙'],
  'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '🙏'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  'Objects': ['📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🎮', '🕹️', '🎧', '🎤', '🎬', '📷', '📸', '📹', '📼', '🔍', '💡', '🔦', '🔌', '🔋'],
  'Symbols': ['✅', '❌', '⭐', '🌟', '💫', '✨', '🔥', '💯', '⚡', '💥', '💢', '💬', '💭', '🗯️', '💤', '🚀', '🎯', '🎉', '🎊', '🎈'],
};

const MAX_MESSAGE_LENGTH = 10000;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function ChatInput({
  onSendMessage,
  onSendFile,
  onTyping,
  onStopTyping,
  disabled = false,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;

    if (newMessage.length <= MAX_MESSAGE_LENGTH) {
      setMessage(newMessage);

      // Trigger typing indicator
      onTyping();

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onStopTyping();
      }, 3000);
    }
  };

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return;
    }

    try {
      await onSendMessage(trimmedMessage);
      setMessage('');
      onStopTyping();

      // Focus back on textarea
      textareaRef.current?.focus();

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {return;}

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage = message.substring(0, start) + emoji + message.substring(end);

    if (newMessage.length <= MAX_MESSAGE_LENGTH) {
      setMessage(newMessage);

      // Move cursor after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    }

    setIsEmojiPickerOpen(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {return;}

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
      return;
    }

    try {
      await onSendFile(file);
      toast.success('File sent');

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to send file:', error);
      toast.error('Failed to send file');
    }
  };

  const insertFormatting = (format: 'bold' | 'italic' | 'code') => {
    const textarea = textareaRef.current;
    if (!textarea) {return;}

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = message.substring(start, end);

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'italic text'}*`;
        break;
      case 'code':
        formattedText = `\`${selectedText || 'code'}\``;
        break;
    }

    const newMessage =
      message.substring(0, start) + formattedText + message.substring(end);

    if (newMessage.length <= MAX_MESSAGE_LENGTH) {
      setMessage(newMessage);

      // Select the inserted text
      setTimeout(() => {
        const offset = format === 'bold' ? 2 : 1;
        textarea.selectionStart = start + offset;
        textarea.selectionEnd = start + formattedText.length - offset;
        textarea.focus();
      }, 0);
    }
  };

  const charactersRemaining = MAX_MESSAGE_LENGTH - message.length;
  const showCharacterCount = charactersRemaining < 100;

  return (
    <div className="p-4 space-y-2">
      {/* Formatting toolbar */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => insertFormatting('bold')}
          disabled={disabled}
          title="Bold"
          aria-label="Insert bold text"
        >
          <Bold className="w-4 h-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => insertFormatting('italic')}
          disabled={disabled}
          title="Italic"
          aria-label="Insert italic text"
        >
          <Italic className="w-4 h-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => insertFormatting('code')}
          disabled={disabled}
          title="Code"
          aria-label="Insert code"
        >
          <Code className="w-4 h-4" aria-hidden="true" />
        </Button>

        {showCharacterCount && (
          <span className="text-xs text-muted-foreground ml-auto">
            {charactersRemaining} characters remaining
          </span>
        )}
      </div>

      {/* Input area */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Shift+Enter for new line)"
            className="resize-none min-h-[80px] pr-10"
            disabled={disabled}
            aria-label="Message input"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Emoji picker */}
          <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={disabled}
                aria-label="Open emoji picker"
              >
                <Smile className="w-5 h-5" aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2" align="end">
              <div className="space-y-2">
                {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                  <div key={category}>
                    <p className="text-xs font-semibold mb-1 text-muted-foreground">
                      {category}
                    </p>
                    <div className="grid grid-cols-10 gap-1">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleEmojiSelect(emoji)}
                          className="text-xl hover:bg-muted rounded p-1 transition-colors"
                          aria-label={`Insert ${emoji} emoji`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* File attachment */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,application/pdf,.txt,.doc,.docx"
            aria-label="Select file to send"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            aria-label="Attach file"
          >
            <Paperclip className="w-5 h-5" aria-hidden="true" />
          </Button>

          {/* Send button */}
          <Button
            onClick={handleSendMessage}
            disabled={disabled || message.trim().length === 0}
            size="icon"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        Use **bold**, *italic*, `code`, or [links](url) in your messages
      </p>
    </div>
  );
}

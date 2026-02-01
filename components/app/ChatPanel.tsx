'use client';

/**
 * Chat Panel Component
 * Main chat UI panel with message list, input, and controls
 */

import React, { useEffect, useRef, useState } from 'react';
import { secureLog } from '@/lib/utils/secure-logger';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  X,
  Download,
  Search,
  MoreVertical,
  Trash2,
  FileText,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ChatMessage } from '@/lib/chat/chat-manager';
import { toast } from 'sonner';
import { PQCStatusBadge } from '@/components/ui/pqc-status-badge';

interface ChatPanelProps {
  messages: ChatMessage[];
  typingIndicator: { userName: string } | null;
  isInitialized: boolean;
  peerName: string;
  currentUserId: string;
  unreadCount: number;
  isPQCProtected?: boolean;
  onSendMessage: (content: string, replyToId?: string) => Promise<void>;
  onSendFile: (file: File) => Promise<void>;
  onTyping: () => void;
  onStopTyping: () => void;
  onMarkAsRead: (messageIds: string[]) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onEditMessage: (messageId: string, newContent: string) => Promise<void>;
  onSearchMessages: (query: string) => Promise<ChatMessage[]>;
  onExportChat: (format: 'json' | 'txt') => Promise<string>;
  onClearHistory: () => Promise<void>;
  onLoadMore: () => Promise<void>;
  onClose?: () => void;
}

export function ChatPanel({
  messages,
  typingIndicator,
  isInitialized,
  peerName,
  currentUserId,
  unreadCount,
  isPQCProtected = false,
  onSendMessage,
  onSendFile,
  onTyping,
  onStopTyping,
  onMarkAsRead,
  onDeleteMessage,
  onEditMessage,
  onSearchMessages,
  onExportChat,
  onClearHistory,
  onLoadMore,
  onClose,
}: ChatPanelProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (hasScrolledToBottom && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, hasScrolledToBottom]);

  // Mark messages as read when visible
  useEffect(() => {
    if (isInitialized && messages.length > 0 && hasScrolledToBottom) {
      const unreadMessageIds = messages
        .filter(m => m.senderId !== currentUserId && m.status !== 'read')
        .map(m => m.id);

      if (unreadMessageIds.length > 0) {
        onMarkAsRead(unreadMessageIds).catch(err => {
          secureLog.error('Failed to mark messages as read:', err);
        });
      }
    }
  }, [messages, isInitialized, currentUserId, hasScrolledToBottom, onMarkAsRead]);

  const handleSendMessage = async (content: string) => {
    try {
      await onSendMessage(content, replyToMessage?.id);
      setReplyToMessage(null);
    } catch (error) {
      secureLog.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length === 0) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await onSearchMessages(query);
      setSearchResults(results);
    } catch (error) {
      secureLog.error('Search failed:', error);
      toast.error('Search failed');
    }
  };

  const handleExport = async (format: 'json' | 'txt') => {
    try {
      const content = await onExportChat(format);
      const blob = new Blob([content], {
        type: format === 'json' ? 'application/json' : 'text/plain',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-${peerName}-${new Date().toISOString()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Chat exported successfully');
    } catch (error) {
      secureLog.error('Export failed:', error);
      toast.error('Failed to export chat');
    }
  };

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
      try {
        await onClearHistory();
        toast.success('Chat history cleared');
      } catch (error) {
        secureLog.error('Clear failed:', error);
        toast.error('Failed to clear chat history');
      }
    }
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 50;
    setHasScrolledToBottom(isAtBottom);

    // Load more when scrolling to top
    if (target.scrollTop < 100) {
      onLoadMore();
    }
  };

  const displayMessages = isSearching ? searchResults : messages;

  return (
    <Card className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-primary" aria-hidden="true" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-lg">Chat with {peerName}</h2>
              <PQCStatusBadge isProtected={isPQCProtected} compact />
            </div>
            {typingIndicator && (
              <p className="text-sm text-muted-foreground">
                {typingIndicator.userName} is typing...
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-48 pr-8"
              aria-label="Search messages"
            />
            <Search className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          </div>

          {/* Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Chat options">
                <MoreVertical className="w-4 h-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('txt')}>
                <FileText className="w-4 h-4 mr-2" aria-hidden="true" />
                Export as Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleClearHistory} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                Clear History
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Close button */}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close chat"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea
        className="flex-1 p-4"
        ref={scrollAreaRef}
        onScrollCapture={handleScroll}
      >
        {!isInitialized ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Initializing secure chat...</p>
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" aria-hidden="true" />
              <p>No messages yet</p>
              <p className="text-sm mt-2">
                {isSearching ? 'No results found' : 'Send a message to start chatting'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4" role="log" aria-label="Chat messages">
            {/* Messages are displayed newest first */}
            {displayMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUserId}
                onDelete={onDeleteMessage}
                onEdit={onEditMessage}
                onReply={() => setReplyToMessage(message)}
              />
            ))}
          </div>
        )}

        {/* Unread indicator */}
        {!hasScrolledToBottom && unreadCount > 0 && (
          <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-10">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
                if (scrollContainer) {
                  scrollContainer.scrollTop = scrollContainer.scrollHeight;
                }
              }}
            >
              {unreadCount} new message{unreadCount > 1 ? 's' : ''}
            </Button>
          </div>
        )}
      </ScrollArea>

      {/* Reply indicator */}
      {replyToMessage && (
        <div className="px-4 py-2 border-t bg-muted/50 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Replying to {replyToMessage.senderName}</p>
            <p className="text-sm text-muted-foreground truncate">{replyToMessage.content}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setReplyToMessage(null)}
            aria-label="Cancel reply"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="border-t">
        <ChatInput
          onSendMessage={handleSendMessage}
          onSendFile={onSendFile}
          onTyping={onTyping}
          onStopTyping={onStopTyping}
          disabled={!isInitialized}
        />
      </div>
    </Card>
  );
}

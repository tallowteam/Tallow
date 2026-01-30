'use client';

/**
 * Message Bubble Component
 * Individual message display with status, actions, and formatting
 */

import { useState, memo } from 'react';
import DOMPurify from 'dompurify';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  MoreVertical,
  Trash2,
  Edit2,
  Reply,
  Download,
  FileIcon,
} from 'lucide-react';
import { ChatMessage, MessageStatus } from '@/lib/chat/chat-manager';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/hooks/use-file-transfer';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  onDelete?: (messageId: string) => Promise<void>;
  onEdit?: (messageId: string, newContent: string) => Promise<void>;
  onReply?: (message: ChatMessage) => void;
}

export const MessageBubble = memo(function MessageBubble({
  message,
  isOwn,
  onDelete,
  onEdit,
  onReply,
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const handleSaveEdit = async () => {
    if (onEdit && editContent.trim() !== message.content) {
      try {
        await onEdit(message.id, editContent.trim());
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to edit message:', error);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleDownloadFile = () => {
    if (message.fileAttachment?.dataUrl) {
      const a = document.createElement('a');
      a.href = message.fileAttachment.dataUrl;
      a.download = message.fileAttachment.name;
      a.click();
    }
  };

  const getStatusIcon = (status: MessageStatus) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-muted-foreground" aria-label="Sending" />;
      case 'sent':
        return <Check className="w-3 h-3 text-muted-foreground" aria-label="Sent" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-muted-foreground" aria-label="Delivered" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-primary" aria-label="Read" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-destructive" aria-label="Failed" />;
      default:
        return null;
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const formatMarkdown = (text: string) => {
    // SECURITY FIX: Sanitize FIRST to prevent XSS, then apply markdown
    // This prevents malicious markdown like [text](javascript:alert(1))

    // Step 1: Initial sanitization - escape all HTML
    const escaped = DOMPurify.sanitize(text, {
      ALLOWED_TAGS: [], // No tags allowed initially
      ALLOWED_ATTR: [],
    });

    // Step 2: Apply markdown formatting to escaped text
    let formatted = escaped;

    // Bold: **text**
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic: *text* (but not **text**)
    formatted = formatted.replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, '<em>$1</em>');

    // Code: `text`
    formatted = formatted.replace(/`(.+?)`/g, '<code class="bg-muted px-1 rounded">$1</code>');

    // Links: [text](url) - Extract and validate URL separately
    formatted = formatted.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_match, linkText, url) => {
        // Validate URL is safe (only https, http, mailto)
        const urlPattern = /^(?:https?|mailto):/i;
        if (!urlPattern.test(url)) {
          // Unsafe URL - return as plain text
          return `[${linkText}](${url})`;
        }
        // Safe URL - create link
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary underline">${linkText}</a>`;
      }
    );

    // Auto-link URLs (only https/http)
    formatted = formatted.replace(
      /(?<![">])(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>'
    );

    // Step 3: Final sanitization with allowed tags
    // This catches any edge cases and ensures only safe HTML
    const sanitized = DOMPurify.sanitize(formatted, {
      ALLOWED_TAGS: ['strong', 'em', 'code', 'a', 'br', 'p'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/i,
      // Block javascript: data: and other dangerous protocols
      FORBID_ATTR: ['onerror', 'onload', 'onclick'],
    });

    return sanitized;
  };

  return (
    <div
      className={cn(
        'flex gap-2',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      <Card
        className={cn(
          'max-w-[70%] p-3',
          isOwn
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}
      >
        {/* Sender name (for received messages) */}
        {!isOwn && (
          <p className="text-xs font-semibold mb-1 text-muted-foreground">
            {message.senderName}
          </p>
        )}

        {/* Reply indicator */}
        {message.replyToId && (
          <div className="text-xs opacity-70 mb-2 pl-2 border-l-2 border-current">
            Replying to a message
          </div>
        )}

        {/* File attachment */}
        {message.type === 'file' && message.fileAttachment && (
          <div className="mb-2">
            <Card className="p-3 bg-background/50">
              <div className="flex items-center gap-2">
                <FileIcon className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">
                    {message.fileAttachment.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(message.fileAttachment.size)}
                  </p>
                </div>
                {message.fileAttachment.dataUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDownloadFile}
                    aria-label={`Download ${message.fileAttachment.name}`}
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Message content */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 rounded bg-background text-foreground resize-none"
              rows={3}
              autoFocus
              aria-label="Edit message"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="prose prose-sm max-w-none break-words"
            dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
          />
        )}

        {/* Footer: time, status, actions */}
        <div className="flex items-center justify-between mt-2 gap-2">
          <div className="flex items-center gap-2 text-xs opacity-70">
            <time dateTime={message.timestamp.toISOString()}>
              {formatTime(message.timestamp)}
            </time>
            {message.editedAt && <span>(edited)</span>}
          </div>

          <div className="flex items-center gap-1">
            {isOwn && getStatusIcon(message.status)}

            {/* Actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  aria-label="Message options"
                >
                  <MoreVertical className="w-3 h-3" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? 'end' : 'start'}>
                {onReply && (
                  <DropdownMenuItem onClick={() => onReply(message)}>
                    <Reply className="w-4 h-4 mr-2" aria-hidden="true" />
                    Reply
                  </DropdownMenuItem>
                )}
                {isOwn && onEdit && message.type === 'text' && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-4 h-4 mr-2" aria-hidden="true" />
                    Edit
                  </DropdownMenuItem>
                )}
                {isOwn && onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(message.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

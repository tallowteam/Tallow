'use client';

/**
 * Chat Toggle Button
 * Floating button to open/close chat during file transfers
 */

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatInterface } from './chat-interface';
import { ChatManager } from '@/lib/chat/chat-manager';

export interface ChatToggleProps {
  chatManager: ChatManager;
  sessionId: string;
  currentUserId: string;
  currentUserName: string;
  peerUserId: string;
  peerUserName: string;
  unreadCount?: number;
}

export function ChatToggle({
  chatManager,
  sessionId,
  currentUserId,
  currentUserName,
  peerUserId,
  peerUserName,
  unreadCount = 0,
}: ChatToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Chat Panel (slides in from right) */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {isOpen && (
          <ChatInterface
            chatManager={chatManager}
            sessionId={sessionId}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            peerUserId={peerUserId}
            peerUserName={peerUserName}
            onClose={() => setIsOpen(false)}
          />
        )}
      </div>

      {/* Toggle Button (floating) */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 shadow-lg z-40 flex items-center justify-center"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6 text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      )}

      {/* Overlay (when chat is open on mobile) */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden cursor-default"
          onClick={() => setIsOpen(false)}
          aria-label="Close chat panel"
        />
      )}
    </>
  );
}

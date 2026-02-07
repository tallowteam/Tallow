'use client';

/**
 * ChatWithLocationExample
 * Example integration of location sharing with ChatPanel
 * Demonstrates how to:
 * - Add location share button to chat
 * - Send location as special message type
 * - Render location messages in chat
 */

import { useState, useCallback } from 'react';
import LocationShare from './LocationShare';
import LocationMessage from './LocationMessage';
import type { GeolocationResult } from '@/lib/geo/location-sharing';

/**
 * Extended ChatMessage type to support location sharing
 * Add this to your ChatMessage type in chat-manager.ts
 */
interface LocationChatMessage {
  id: string;
  type: 'text' | 'file' | 'location' | 'system';
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  // Location-specific data
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  };
}

/**
 * Example ChatPanel with location sharing
 */
export default function ChatWithLocationExample() {
  const [isLocationShareOpen, setIsLocationShareOpen] = useState(false);
  const [messages, setMessages] = useState<LocationChatMessage[]>([]);

  // Current user ID for message ownership
  const currentUserId = 'user-1';

  /**
   * Handle location sharing
   * In real implementation, this would:
   * 1. Serialize location to JSON
   * 2. Encrypt with session keys
   * 3. Send via DataChannel
   * 4. Store in IndexedDB
   */
  const handleShareLocation = useCallback((location: GeolocationResult) => {
    const locationMessage: LocationChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'location',
      senderId: currentUserId,
      senderName: 'You',
      content: `Shared location: ${location.latitude}, ${location.longitude}`,
      timestamp: new Date(),
      status: 'sent',
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: location.timestamp,
      },
    };

    // Add to messages
    setMessages((prev) => [locationMessage, ...prev]);

    // Close location share modal
    setIsLocationShareOpen(false);

    // In real implementation, send via ChatManager:
    // chatManager.sendLocationMessage(location);
  }, [currentUserId]);

  const handleCancelLocationShare = useCallback(() => {
    setIsLocationShareOpen(false);
  }, []);

  return (
    <div style={{ padding: '20px', background: '#18181b', minHeight: '100vh' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ color: '#fafafa', marginBottom: '20px' }}>
          Chat with Location Sharing
        </h2>

        {/* Location Share Button */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setIsLocationShareOpen(true)}
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #5e5ce6 0%, #6b69f5 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Share Location
          </button>
        </div>

        {/* Messages List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                color: '#71717a',
              }}
            >
              No messages yet. Share your location to get started!
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent:
                    message.senderId === currentUserId ? 'flex-end' : 'flex-start',
                }}
              >
                {message.type === 'location' && message.location ? (
                  <LocationMessage
                    location={message.location}
                    isSent={message.senderId === currentUserId}
                  />
                ) : (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background:
                        message.senderId === currentUserId
                          ? 'linear-gradient(135deg, #5e5ce6 0%, #6b69f5 100%)'
                          : '#27272a',
                      color: '#fafafa',
                      maxWidth: '75%',
                    }}
                  >
                    {message.content}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Location Share Modal */}
        <LocationShare
          isOpen={isLocationShareOpen}
          onShare={handleShareLocation}
          onCancel={handleCancelLocationShare}
        />
      </div>
    </div>
  );
}

/**
 * INTEGRATION GUIDE
 *
 * To add location sharing to your existing ChatPanel:
 *
 * 1. Update ChatMessage type in lib/chat/chat-manager.ts:
 *    ```typescript
 *    export type MessageType = 'text' | 'file' | 'location' | 'emoji' | 'system';
 *
 *    export interface ChatMessage {
 *      // ... existing fields
 *      location?: {
 *        latitude: number;
 *        longitude: number;
 *        accuracy: number;
 *        timestamp: number;
 *      };
 *    }
 *    ```
 *
 * 2. Add sendLocationMessage method to ChatManager:
 *    ```typescript
 *    async sendLocationMessage(location: GeolocationResult): Promise<ChatMessage> {
 *      const message: ChatMessage = {
 *        id: crypto.randomUUID(),
 *        sessionId: this.sessionId,
 *        senderId: this.currentUserId,
 *        senderName: this.currentUserName,
 *        content: `Shared location: ${formatCoordinates(location.latitude, location.longitude)}`,
 *        type: 'location',
 *        status: 'sending',
 *        timestamp: new Date(),
 *        location: {
 *          latitude: location.latitude,
 *          longitude: location.longitude,
 *          accuracy: location.accuracy,
 *          timestamp: location.timestamp,
 *        },
 *      };
 *
 *      await this.storage.saveMessage(message);
 *      this.emitEvent({ type: 'message', message });
 *
 *      // Encrypt and send
 *      const encrypted = await this.encryption.encryptMessage(JSON.stringify(message));
 *      this.sendProtocolMessage({
 *        type: 'chat-message',
 *        payload: {
 *          encrypted: Array.from(encrypted.ciphertext),
 *          nonce: Array.from(encrypted.nonce),
 *          messageId: message.id,
 *          hmac: encrypted.hmac,
 *          sequence: this.outgoingSequence++,
 *        },
 *      });
 *
 *      return message;
 *    }
 *    ```
 *
 * 3. Update ChatPanel.tsx to add location button:
 *    ```tsx
 *    const [isLocationShareOpen, setIsLocationShareOpen] = useState(false);
 *
 *    const handleShareLocation = async (location: GeolocationResult) => {
 *      await chatManager.sendLocationMessage(location);
 *      setIsLocationShareOpen(false);
 *    };
 *
 *    // In input area, add location button:
 *    <button onClick={() => setIsLocationShareOpen(true)}>
 *      <svg>...</svg> {/* Map pin icon *\/}
 *    </button>
 *
 *    // Before closing </div>:
 *    <LocationShare
 *      isOpen={isLocationShareOpen}
 *      onShare={handleShareLocation}
 *      onCancel={() => setIsLocationShareOpen(false)}
 *    />
 *    ```
 *
 * 4. Update message rendering to show LocationMessage:
 *    ```tsx
 *    {message.type === 'location' && message.location ? (
 *      <LocationMessage
 *        location={message.location}
 *        isSent={message.senderId === userId}
 *      />
 *    ) : (
 *      <div className={styles.messageContent}>
 *        {message.content}
 *      </div>
 *    )}
 *    ```
 *
 * 5. Add to useChat hook (lib/hooks/use-chat.ts):
 *    ```typescript
 *    const sendLocation = useCallback(async (location: GeolocationResult): Promise<ChatMessage> => {
 *      if (!chatManagerRef.current) {
 *        throw new Error('Chat not initialized');
 *      }
 *      return chatManagerRef.current.sendLocationMessage(location);
 *    }, []);
 *
 *    // Add to return object:
 *    return {
 *      // ... existing properties
 *      sendLocation,
 *    };
 *    ```
 */

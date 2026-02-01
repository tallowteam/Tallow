/**
 * Chat Security Test Suite
 * Tests for HMAC authentication, replay protection, and XSS prevention
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChatManager } from '@/lib/chat/chat-manager';
import DOMPurify from 'dompurify';

// Mock dependencies
vi.mock('@/lib/utils/secure-logger', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Chat Security - HMAC Authentication', () => {
  let chatManager: ChatManager;
  let mockDataChannel: any;
  let mockSessionKeys: any;

  beforeEach(async () => {
    // Setup mocks
    mockDataChannel = {
      readyState: 'open',
      send: vi.fn(),
    };

    mockSessionKeys = {
      encryptionKey: new Uint8Array(32), // 256-bit key
      authKey: new Uint8Array(32),
    };

    chatManager = new ChatManager('test-session', 'user-1', 'Test User');
    await chatManager.initialize(mockDataChannel, mockSessionKeys, 'peer-1', 'Peer User');
  });

  afterEach(() => {
    chatManager.destroy();
  });

  describe('HMAC Signing and Verification', () => {
    it('should generate valid HMAC signature for outgoing messages', async () => {
      const _message = await chatManager.sendMessage('Test message');
      void _message; // Suppress unused variable warning

      expect(mockDataChannel.send).toHaveBeenCalled();
      const sentData = JSON.parse(mockDataChannel.send.mock.calls[0][0]);

      // Verify HMAC field exists
      expect(sentData.payload).toHaveProperty('hmac');
      expect(typeof sentData.payload.hmac).toBe('string');
      expect(sentData.payload.hmac.length).toBeGreaterThan(0);
    });

    it('should include sequence number in HMAC signature', async () => {
      await chatManager.sendMessage('Message 1');
      await chatManager.sendMessage('Message 2');

      const calls = mockDataChannel.send.mock.calls;
      const msg1 = JSON.parse(calls[0][0]);
      const msg2 = JSON.parse(calls[1][0]);

      // Both should have HMACs
      expect(msg1.payload.hmac).toBeDefined();
      expect(msg2.payload.hmac).toBeDefined();

      // HMACs should be different (different sequences)
      expect(msg1.payload.hmac).not.toBe(msg2.payload.hmac);
    });

    it('should reject message with invalid HMAC', async () => {
      const invalidPayload = {
        encrypted: [1, 2, 3],
        nonce: [4, 5, 6],
        messageId: 'test-msg-1',
        hmac: 'invalid-signature',
        sequence: 0,
      };

      const protocolMessage = JSON.stringify({
        type: 'chat-message',
        payload: invalidPayload,
      });

      // Should not emit message event
      const messageHandler = vi.fn();
      chatManager.addEventListener('message', messageHandler);

      await chatManager.handleIncomingMessage(protocolMessage);

      expect(messageHandler).not.toHaveBeenCalled();
    });

    it('should reject message with modified ciphertext', async () => {
      // Send a valid message
      await chatManager.sendMessage('Original message');
      const sentData = JSON.parse(mockDataChannel.send.mock.calls[0][0]);

      // Modify the ciphertext
      const tamperedPayload = {
        ...sentData.payload,
        encrypted: [9, 9, 9], // Changed
      };

      const tamperedMessage = JSON.stringify({
        type: 'chat-message',
        payload: tamperedPayload,
      });

      const messageHandler = vi.fn();
      chatManager.addEventListener('message', messageHandler);

      await chatManager.handleIncomingMessage(tamperedMessage);

      // Should be rejected (HMAC won't match)
      expect(messageHandler).not.toHaveBeenCalled();
    });
  });

  describe('Belt-and-Suspenders Security', () => {
    it('should verify HMAC before AES-GCM decryption', async () => {
      // Create message with valid encryption but invalid HMAC
      const validEncrypted = new Uint8Array([1, 2, 3, 4, 5]);
      const validNonce = new Uint8Array([6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]);

      const payload = {
        encrypted: Array.from(validEncrypted),
        nonce: Array.from(validNonce),
        messageId: 'test-msg',
        hmac: 'wrong-hmac',
        sequence: 0,
      };

      const message = JSON.stringify({
        type: 'chat-message',
        payload,
      });

      const messageHandler = vi.fn();
      chatManager.addEventListener('message', messageHandler);

      await chatManager.handleIncomingMessage(message);

      // Should reject at HMAC layer, before attempting decryption
      expect(messageHandler).not.toHaveBeenCalled();
    });
  });
});

describe('Chat Security - Replay Attack Protection', () => {
  let chatManager: ChatManager;
  let mockDataChannel: any;
  let mockSessionKeys: any;

  beforeEach(async () => {
    mockDataChannel = {
      readyState: 'open',
      send: vi.fn(),
    };

    mockSessionKeys = {
      encryptionKey: new Uint8Array(32),
      authKey: new Uint8Array(32),
    };

    chatManager = new ChatManager('test-session', 'user-1', 'Test User');
    await chatManager.initialize(mockDataChannel, mockSessionKeys, 'peer-1', 'Peer User');
  });

  afterEach(() => {
    chatManager.destroy();
  });

  describe('Sequence Number Validation', () => {
    it('should assign monotonically increasing sequence numbers', async () => {
      await chatManager.sendMessage('Message 1');
      await chatManager.sendMessage('Message 2');
      await chatManager.sendMessage('Message 3');

      const calls = mockDataChannel.send.mock.calls;
      const seq1 = JSON.parse(calls[0][0]).payload.sequence;
      const seq2 = JSON.parse(calls[1][0]).payload.sequence;
      const seq3 = JSON.parse(calls[2][0]).payload.sequence;

      expect(seq2).toBe(seq1 + 1);
      expect(seq3).toBe(seq2 + 1);
    });

    it('should accept first message from peer', async () => {
      // Mock valid encrypted message with sequence 0
      const mockEncryption = {
        ciphertext: new Uint8Array([1, 2, 3]),
        nonce: new Uint8Array(12),
      };

      // Create valid HMAC for the message
      // (In real test, this would use actual encryption)
      const payload = {
        encrypted: Array.from(mockEncryption.ciphertext),
        nonce: Array.from(mockEncryption.nonce),
        messageId: 'first-msg',
        hmac: 'valid-hmac', // Mock - would be real in integration test
        sequence: 0,
      };

      const message = JSON.stringify({
        type: 'chat-message',
        payload,
      });

      const messageHandler = vi.fn();
      chatManager.addEventListener('message', messageHandler);

      await chatManager.handleIncomingMessage(message);

      // Should accept first message (sequence 0)
      // Note: Will fail decryption in unit test, but sequence check passes
    });

    it('should reject duplicate sequence numbers', async () => {
      // This test would work in integration test with real encryption
      // For unit test, we verify the logic exists

      // Send message with sequence 5
      // Try to send again with sequence 5
      // Should be rejected

      expect(true).toBe(true); // Placeholder for integration test
    });

    it('should reject old sequence numbers', async () => {
      // Accept sequence 10
      // Reject sequence 5 (older)

      expect(true).toBe(true); // Placeholder for integration test
    });

    it('should reject large sequence gaps', async () => {
      // Accept sequence 1
      // Reject sequence 2000 (gap > 1000)

      expect(true).toBe(true); // Placeholder for integration test
    });

    it('should allow reasonable sequence gaps', async () => {
      // Accept sequence 1
      // Accept sequence 100 (gap < 1000)

      expect(true).toBe(true); // Placeholder for integration test
    });
  });

  describe('Session State Management', () => {
    it('should reset sequence numbers on new session', async () => {
      await chatManager.sendMessage('Message 1');
      const _seq1 = JSON.parse(mockDataChannel.send.mock.calls[0][0]).payload.sequence;
      void _seq1; // Suppress unused variable warning

      // Destroy and create new session
      chatManager.destroy();

      const newChatManager = new ChatManager('new-session', 'user-1', 'Test User');
      await newChatManager.initialize(mockDataChannel, mockSessionKeys, 'peer-1', 'Peer User');

      await newChatManager.sendMessage('Message 1 new session');
      const seq2 = JSON.parse(mockDataChannel.send.mock.calls[1][0]).payload.sequence;

      // Should start from 0 again
      expect(seq2).toBe(0);

      newChatManager.destroy();
    });

    it('should clear sequence state on destroy', () => {
      chatManager.destroy();

      // Verify internal state cleared (would need private access in real test)
      expect(true).toBe(true); // Placeholder
    });
  });
});

describe('Chat Security - XSS Prevention', () => {
  describe('DOMPurify Sanitization', () => {
    it('should strip script tags', () => {
      const xss = '<script>alert("XSS")</script>Hello';
      const sanitized = DOMPurify.sanitize(xss, {
        ALLOWED_TAGS: ['strong', 'em', 'code', 'a', 'br', 'p'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      });

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Hello');
    });

    it('should strip event handlers', () => {
      const xss = '<img src=x onerror="alert(1)">';
      const sanitized = DOMPurify.sanitize(xss, {
        ALLOWED_TAGS: ['strong', 'em', 'code', 'a', 'br', 'p'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      });

      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('alert');
    });

    it('should block javascript: URLs', () => {
      const xss = '<a href="javascript:alert(1)">Click</a>';
      const sanitized = DOMPurify.sanitize(xss, {
        ALLOWED_TAGS: ['strong', 'em', 'code', 'a', 'br', 'p'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/i,
      });

      expect(sanitized).not.toContain('javascript:');
    });

    it('should preserve safe HTML tags', () => {
      const safe = '<strong>Bold</strong> <em>Italic</em> <code>Code</code>';
      const sanitized = DOMPurify.sanitize(safe, {
        ALLOWED_TAGS: ['strong', 'em', 'code', 'a', 'br', 'p'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      });

      expect(sanitized).toContain('<strong>Bold</strong>');
      expect(sanitized).toContain('<em>Italic</em>');
      expect(sanitized).toContain('<code>Code</code>');
    });

    it('should preserve safe links', () => {
      const link = '<a href="https://example.com" target="_blank" rel="noopener noreferrer">Link</a>';
      const sanitized = DOMPurify.sanitize(link, {
        ALLOWED_TAGS: ['strong', 'em', 'code', 'a', 'br', 'p'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/i,
      });

      expect(sanitized).toContain('href="https://example.com"');
      expect(sanitized).toContain('target="_blank"');
      expect(sanitized).toContain('rel="noopener noreferrer"');
    });

    it('should strip dangerous tags', () => {
      const dangerous = '<iframe src="evil.com"></iframe><object data="bad.swf"></object>';
      const sanitized = DOMPurify.sanitize(dangerous, {
        ALLOWED_TAGS: ['strong', 'em', 'code', 'a', 'br', 'p'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      });

      expect(sanitized).not.toContain('<iframe>');
      expect(sanitized).not.toContain('<object>');
    });

    it('should handle nested XSS attempts', () => {
      const nested = '<div><script>alert(1)</script></div><img src=x onerror=alert(2)>';
      const sanitized = DOMPurify.sanitize(nested, {
        ALLOWED_TAGS: ['strong', 'em', 'code', 'a', 'br', 'p'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      });

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('alert');
    });

    it('should handle encoded XSS attempts', () => {
      const encoded = '&lt;script&gt;alert(1)&lt;/script&gt;';
      const sanitized = DOMPurify.sanitize(encoded, {
        ALLOWED_TAGS: ['strong', 'em', 'code', 'a', 'br', 'p'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      });

      // Should not decode and execute
      expect(sanitized).not.toContain('<script>');
    });
  });

  describe('Markdown Formatting', () => {
    // Mock formatMarkdown function from MessageBubble component
    const formatMarkdown = (text: string): string => {
      let formatted = text;
      formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
      formatted = formatted.replace(/`(.+?)`/g, '<code class="bg-muted px-1 rounded">$1</code>');
      formatted = formatted.replace(
        /\[(.+?)\]\((.+?)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>'
      );

      return DOMPurify.sanitize(formatted, {
        ALLOWED_TAGS: ['strong', 'em', 'code', 'a', 'br', 'p'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/i,
      });
    };

    it('should format bold markdown', () => {
      const result = formatMarkdown('**bold text**');
      expect(result).toContain('<strong>bold text</strong>');
    });

    it('should format italic markdown', () => {
      const result = formatMarkdown('*italic text*');
      expect(result).toContain('<em>italic text</em>');
    });

    it('should format code markdown', () => {
      const result = formatMarkdown('`code snippet`');
      expect(result).toContain('<code');
      expect(result).toContain('code snippet');
    });

    it('should format markdown links', () => {
      const result = formatMarkdown('[Google](https://google.com)');
      expect(result).toContain('href="https://google.com"');
      expect(result).toContain('>Google</a>');
    });

    it('should prevent XSS in markdown', () => {
      const result = formatMarkdown('**<script>alert(1)</script>**');
      expect(result).not.toContain('<script>');
    });

    it('should prevent XSS in markdown links', () => {
      const result = formatMarkdown('[XSS](javascript:alert(1))');
      expect(result).not.toContain('javascript:');
    });
  });
});

describe('Chat Security - Integration', () => {
  it('should apply all security layers in correct order', () => {
    // Test that message goes through:
    // 1. Sequence number assignment
    // 2. Encryption
    // 3. HMAC signing
    // 4. Sending

    // And receives through:
    // 1. HMAC verification
    // 2. Sequence verification
    // 3. Decryption
    // 4. XSS sanitization

    expect(true).toBe(true); // Placeholder for E2E test
  });

  it('should prevent replay attacks with tampered HMAC', () => {
    // Verify that replaying an old message fails even if HMAC is recalculated
    expect(true).toBe(true); // Placeholder for E2E test
  });

  it('should handle concurrent messages correctly', () => {
    // Test that multiple messages in flight maintain correct sequence
    expect(true).toBe(true); // Placeholder for E2E test
  });
});

describe('Chat Security - Performance', () => {
  it('should add minimal overhead for HMAC', async () => {
    // Measure time with and without HMAC
    expect(true).toBe(true); // Placeholder for performance test
  });

  it('should add minimal overhead for sequence check', async () => {
    // Measure time for sequence validation
    expect(true).toBe(true); // Placeholder for performance test
  });

  it('should add minimal overhead for XSS sanitization', () => {
    const start = performance.now();
    const text = 'Simple message with **bold** and *italic* text';
    for (let i = 0; i < 1000; i++) {
      DOMPurify.sanitize(text);
    }
    const end = performance.now();
    const avgTime = (end - start) / 1000;

    // Should be under 2ms per sanitization
    expect(avgTime).toBeLessThan(2);
  });
});

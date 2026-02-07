/**
 * IPC Protocol Tests
 * Unit tests for the Web Worker IPC protocol system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  IPCProtocol,
  createIPCProtocol,
  createTypedSender,
  type IPCMessage,
  type IPCResponse,
} from './ipc-protocol';

describe('IPCProtocol', () => {
  let protocol: IPCProtocol;

  beforeEach(() => {
    protocol = createIPCProtocol({
      defaultTimeout: 5000,
      debug: false,
    });
  });

  afterEach(() => {
    protocol.destroy();
  });

  describe('Message ID Generation', () => {
    it('should generate unique message IDs', () => {
      const id1 = protocol.generateMessageId();
      const id2 = protocol.generateMessageId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should generate sequential IDs', () => {
      const ids = Array.from({ length: 10 }, () => protocol.generateMessageId());

      // All IDs should be unique
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Message Creation', () => {
    it('should create a valid IPC message', () => {
      const message = protocol.createMessage(
        'encrypt',
        'crypto',
        { data: 'test' }
      );

      expect(message).toMatchObject({
        type: 'encrypt',
        channel: 'crypto',
        payload: { data: 'test' },
      });
      expect(message.id).toBeTruthy();
      expect(message.timestamp).toBeGreaterThan(0);
    });

    it('should support message options', () => {
      const message = protocol.createMessage(
        'hash',
        'crypto',
        { data: 'test' },
        {
          priority: 'high',
          timeout: 10000,
          correlationId: 'test-correlation-id',
        }
      );

      expect(message.priority).toBe('high');
      expect(message.timeout).toBe(10000);
      expect(message.correlationId).toBe('test-correlation-id');
    });
  });

  describe('Response Creation', () => {
    it('should create a success response', () => {
      const response = protocol.createSuccessResponse(
        'test-id',
        { result: 'success' },
        { processingTime: 123 }
      );

      expect(response).toMatchObject({
        id: 'test-id',
        success: true,
        data: { result: 'success' },
        metadata: { processingTime: 123 },
      });
    });

    it('should create an error response', () => {
      const response = protocol.createErrorResponse(
        'test-id',
        'Something went wrong',
        'ERR_TEST'
      );

      expect(response).toMatchObject({
        id: 'test-id',
        success: false,
        error: 'Something went wrong',
        errorCode: 'ERR_TEST',
      });
    });

    it('should handle Error objects in error response', () => {
      const error = new Error('Test error');
      const response = protocol.createErrorResponse('test-id', error);

      expect(response.error).toBe('Test error');
    });
  });

  describe('Request/Response Pattern', () => {
    it('should handle successful request/response', async () => {
      // Mock worker
      const mockWorker = {
        postMessage: vi.fn((message: IPCMessage) => {
          // Simulate async response
          setTimeout(() => {
            const response = protocol.createSuccessResponse(
              message.id,
              { result: 'success' }
            );
            protocol.handleMessage({ data: response } as MessageEvent);
          }, 100);
        }),
      } as unknown as Worker;

      const resultPromise = protocol.request(
        mockWorker,
        'test',
        'custom',
        { input: 'test' }
      );

      const result = await resultPromise;
      expect(result).toEqual({ result: 'success' });
    });

    it('should handle error response', async () => {
      const mockWorker = {
        postMessage: vi.fn((message: IPCMessage) => {
          setTimeout(() => {
            const response = protocol.createErrorResponse(
              message.id,
              'Test error'
            );
            protocol.handleMessage({ data: response } as MessageEvent);
          }, 100);
        }),
      } as unknown as Worker;

      await expect(
        protocol.request(mockWorker, 'test', 'custom', { input: 'test' })
      ).rejects.toThrow('Test error');
    });

    it('should timeout if no response received', async () => {
      const mockWorker = {
        postMessage: vi.fn(),
      } as unknown as Worker;

      await expect(
        protocol.request(mockWorker, 'test', 'custom', { input: 'test' }, {
          timeout: 100,
        })
      ).rejects.toThrow('Request timeout');
    });

    it('should handle abort signal', async () => {
      const controller = new AbortController();
      const mockWorker = {
        postMessage: vi.fn(),
      } as unknown as Worker;

      const requestPromise = protocol.request(
        mockWorker,
        'test',
        'custom',
        { input: 'test' },
        { signal: controller.signal }
      );

      // Abort immediately
      controller.abort();

      await expect(requestPromise).rejects.toThrow('Request cancelled');
    });

    it('should handle progress updates', async () => {
      const progressUpdates: number[] = [];

      const mockWorker = {
        postMessage: vi.fn((message: IPCMessage) => {
          // Send progress updates
          [25, 50, 75].forEach((progress, index) => {
            setTimeout(() => {
              protocol.handleMessage({
                data: {
                  id: message.id,
                  type: 'progress',
                  progress,
                },
              } as MessageEvent);
            }, (index + 1) * 50);
          });

          // Send final response
          setTimeout(() => {
            const response = protocol.createSuccessResponse(
              message.id,
              { result: 'done' }
            );
            protocol.handleMessage({ data: response } as MessageEvent);
          }, 200);
        }),
      } as unknown as Worker;

      const result = await protocol.request(
        mockWorker,
        'test',
        'custom',
        { input: 'test' },
        {
          onProgress: (progress) => {
            progressUpdates.push(progress.progress);
          },
        }
      );

      expect(result).toEqual({ result: 'done' });
      expect(progressUpdates).toEqual([25, 50, 75]);
    });
  });

  describe('Request Cancellation', () => {
    it('should cancel a pending request', async () => {
      const mockWorker = {
        postMessage: vi.fn(),
      } as unknown as Worker;

      const requestPromise = protocol.request(
        mockWorker,
        'test',
        'custom',
        { input: 'test' }
      );

      // Get the message ID from the mock call
      const sentMessage = mockWorker.postMessage.mock.calls[0][0] as IPCMessage;

      // Cancel the request
      const cancelled = protocol.cancelRequest(sentMessage.id);
      expect(cancelled).toBe(true);

      await expect(requestPromise).rejects.toThrow('Request cancelled');
    });

    it('should return false when cancelling non-existent request', () => {
      const cancelled = protocol.cancelRequest('non-existent-id');
      expect(cancelled).toBe(false);
    });

    it('should cancel all pending requests', async () => {
      const mockWorker = {
        postMessage: vi.fn(),
      } as unknown as Worker;

      const promises = [
        protocol.request(mockWorker, 'test1', 'custom', {}),
        protocol.request(mockWorker, 'test2', 'custom', {}),
        protocol.request(mockWorker, 'test3', 'custom', {}),
      ];

      protocol.cancelAll();

      await expect(Promise.all(promises)).rejects.toThrow();
    });
  });

  describe('Statistics', () => {
    it('should track pending requests', () => {
      const mockWorker = {
        postMessage: vi.fn(),
      } as unknown as Worker;

      // Create some pending requests
      protocol.request(mockWorker, 'test1', 'custom', {});
      protocol.request(mockWorker, 'test2', 'custom', {});

      const stats = protocol.getStats();
      expect(stats.pendingRequests).toBe(2);
    });

    it('should track oldest request age', async () => {
      const mockWorker = {
        postMessage: vi.fn(),
      } as unknown as Worker;

      protocol.request(mockWorker, 'test', 'custom', {});

      await new Promise((resolve) => setTimeout(resolve, 100));

      const stats = protocol.getStats();
      expect(stats.oldestRequestAge).toBeGreaterThan(90);
    });
  });

  describe('Typed Sender', () => {
    it('should create a typed sender', async () => {
      const mockWorker = {
        postMessage: vi.fn((message: IPCMessage) => {
          setTimeout(() => {
            const response = protocol.createSuccessResponse(
              message.id,
              { hash: 'abc123' }
            );
            protocol.handleMessage({ data: response } as MessageEvent);
          }, 50);
        }),
      } as unknown as Worker;

      type HashPayload = { data: ArrayBuffer };
      type HashResult = { hash: string };

      const hashFile = createTypedSender<HashPayload, HashResult>(
        protocol,
        mockWorker,
        'hash',
        'crypto'
      );

      const result = await hashFile({ data: new ArrayBuffer(0) });
      expect(result).toEqual({ hash: 'abc123' });
    });
  });

  describe('Max Pending Requests', () => {
    it('should throw when max pending requests exceeded', async () => {
      const limitedProtocol = createIPCProtocol({
        maxPendingRequests: 2,
      });

      const mockWorker = {
        postMessage: vi.fn(),
      } as unknown as Worker;

      // Create 2 pending requests (at limit)
      limitedProtocol.request(mockWorker, 'test1', 'custom', {});
      limitedProtocol.request(mockWorker, 'test2', 'custom', {});

      // Third request should throw
      await expect(
        limitedProtocol.request(mockWorker, 'test3', 'custom', {})
      ).rejects.toThrow('Maximum pending requests exceeded');

      limitedProtocol.destroy();
    });
  });

  describe('Ready Signal', () => {
    it('should ignore ready signal messages', () => {
      const messageEvent = {
        data: { type: 'ready' },
      } as MessageEvent;

      // Should not throw
      expect(() => protocol.handleMessage(messageEvent)).not.toThrow();
    });
  });

  describe('Unknown Messages', () => {
    it('should handle response for unknown request', () => {
      const response: IPCResponse = {
        id: 'unknown-id',
        success: true,
        data: { result: 'test' },
      };

      // Should not throw
      expect(() =>
        protocol.handleMessage({ data: response } as MessageEvent)
      ).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should cancel all requests on destroy', async () => {
      const mockWorker = {
        postMessage: vi.fn(),
      } as unknown as Worker;

      const promise = protocol.request(mockWorker, 'test', 'custom', {});

      protocol.destroy();

      await expect(promise).rejects.toThrow('Request cancelled');
    });
  });
});

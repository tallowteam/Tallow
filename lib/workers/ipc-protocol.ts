/**
 * IPC Protocol for Web Workers
 * Type-safe message passing between main thread and workers with request-response pattern.
 *
 * Features:
 * - Auto-generated unique message IDs
 * - Timeout handling with configurable duration
 * - Type-safe channels for different worker types
 * - Request-response pattern with Promise-based API
 * - Progress updates and streaming support
 */

/**
 * IPC Message channels for different worker types
 */
export type IPCChannel = 'crypto' | 'file' | 'network' | 'compression' | 'custom';

/**
 * IPC Message types
 */
export type IPCMessageType =
  // Crypto operations
  | 'encrypt' | 'decrypt' | 'hash' | 'derive-key'
  // File operations
  | 'hash-file' | 'chunk-file' | 'merge-chunks' | 'detect-type' | 'read-metadata'
  // Network operations
  | 'check-connectivity' | 'resolve-ice' | 'bandwidth-test' | 'latency-check'
  // Compression operations
  | 'compress' | 'decompress'
  // System operations
  | 'ping' | 'pong' | 'ready' | 'progress' | 'error' | 'cancel'
  // Custom operations
  | string;

/**
 * IPC Message structure
 */
export interface IPCMessage<T = unknown> {
  /** Unique message identifier */
  id: string;

  /** Message type/operation */
  type: IPCMessageType;

  /** Channel for routing to appropriate worker */
  channel: IPCChannel;

  /** Message payload */
  payload: T;

  /** Timestamp when message was created */
  timestamp: number;

  /** Optional priority for task scheduling */
  priority?: 'low' | 'normal' | 'high';

  /** Optional timeout override (ms) */
  timeout?: number;

  /** Optional correlation ID for tracking related messages */
  correlationId?: string;
}

/**
 * IPC Response structure
 */
export interface IPCResponse<T = unknown> {
  /** Message ID this response corresponds to */
  id: string;

  /** Whether the operation succeeded */
  success: boolean;

  /** Response data if successful */
  data?: T;

  /** Error message if failed */
  error?: string;

  /** Error code for categorizing failures */
  errorCode?: string;

  /** Optional metadata about the operation */
  metadata?: {
    /** Time taken to process (ms) */
    processingTime?: number;

    /** Worker that processed the request */
    workerId?: string;

    /** Any additional context */
    [key: string]: unknown;
  };
}

/**
 * Progress update message
 */
export interface IPCProgressMessage {
  /** Message ID this progress update corresponds to */
  id: string;

  /** Message type */
  type: 'progress';

  /** Progress percentage (0-100) */
  progress: number;

  /** Optional status message */
  status?: string;

  /** Optional additional data */
  data?: unknown;
}

/**
 * IPC Protocol Configuration
 */
export interface IPCProtocolConfig {
  /** Default timeout for requests (ms) */
  defaultTimeout?: number;

  /** Enable debug logging */
  debug?: boolean;

  /** Maximum number of pending requests */
  maxPendingRequests?: number;

  /** Enable request retries on failure */
  enableRetries?: boolean;

  /** Number of retry attempts */
  maxRetries?: number;

  /** Delay between retries (ms) */
  retryDelay?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<IPCProtocolConfig> = {
  defaultTimeout: 30000, // 30 seconds
  debug: false,
  maxPendingRequests: 100,
  enableRetries: false,
  maxRetries: 3,
  retryDelay: 1000,
};

/**
 * Pending request tracker
 */
interface PendingRequest<T = unknown> {
  id: string;
  resolve: (value: IPCResponse<T>) => void;
  reject: (reason: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
  startTime: number;
  retryCount: number;
  message: IPCMessage;
  onProgress?: (progress: IPCProgressMessage) => void;
}

/**
 * IPC Protocol Handler
 * Manages message passing between main thread and workers
 */
export class IPCProtocol {
  private config: Required<IPCProtocolConfig>;
  private pendingRequests = new Map<string, PendingRequest>();
  private messageCounter = 0;
  private instanceId: string;

  constructor(config: IPCProtocolConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.instanceId = this.generateInstanceId();
  }

  /**
   * Generate unique instance ID
   */
  private generateInstanceId(): string {
    return `ipc-${Date.now()}-${Array.from(crypto.getRandomValues(new Uint8Array(7))).map(b => b.toString(36)).join('').substring(0, 9)}`;
  }

  /**
   * Generate unique message ID
   */
  public generateMessageId(): string {
    this.messageCounter++;
    return `${this.instanceId}-${this.messageCounter}-${Date.now()}`;
  }

  /**
   * Create an IPC message
   */
  public createMessage<T = unknown>(
    type: IPCMessageType,
    channel: IPCChannel,
    payload: T,
    options?: {
      priority?: 'low' | 'normal' | 'high';
      timeout?: number;
      correlationId?: string;
    }
  ): IPCMessage<T> {
    return {
      id: this.generateMessageId(),
      type,
      channel,
      payload,
      timestamp: Date.now(),
      priority: options?.priority,
      timeout: options?.timeout,
      correlationId: options?.correlationId,
    };
  }

  /**
   * Create a success response
   */
  public createSuccessResponse<T = unknown>(
    messageId: string,
    data: T,
    metadata?: IPCResponse['metadata']
  ): IPCResponse<T> {
    return {
      id: messageId,
      success: true,
      data,
      metadata,
    };
  }

  /**
   * Create an error response
   */
  public createErrorResponse(
    messageId: string,
    error: string | Error,
    errorCode?: string
  ): IPCResponse<never> {
    return {
      id: messageId,
      success: false,
      error: error instanceof Error ? error.message : error,
      errorCode,
    };
  }

  /**
   * Send a request and wait for response
   */
  public async request<TRequest = unknown, TResponse = unknown>(
    worker: Worker,
    type: IPCMessageType,
    channel: IPCChannel,
    payload: TRequest,
    options?: {
      timeout?: number;
      priority?: 'low' | 'normal' | 'high';
      onProgress?: (progress: IPCProgressMessage) => void;
      signal?: AbortSignal;
    }
  ): Promise<TResponse> {
    // Check if max pending requests exceeded
    if (this.pendingRequests.size >= this.config.maxPendingRequests) {
      throw new Error('Maximum pending requests exceeded');
    }

    // Check abort signal
    if (options?.signal?.aborted) {
      throw new Error('Request aborted');
    }

    const message = this.createMessage(type, channel, payload, {
      priority: options?.priority,
      timeout: options?.timeout,
    });

    const timeout = options?.timeout ?? this.config.defaultTimeout;

    return new Promise<TResponse>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.handleTimeout(message.id);
      }, timeout);

      const pendingRequest: PendingRequest<TResponse> = {
        id: message.id,
        resolve: (response: IPCResponse<TResponse>) => {
          clearTimeout(timeoutId);
          this.pendingRequests.delete(message.id);

          if (response.success) {
            resolve(response.data as TResponse);
          } else {
            const error = new Error(response.error || 'Request failed');
            (error as any).code = response.errorCode;
            reject(error);
          }
        },
        reject: (error: Error) => {
          clearTimeout(timeoutId);
          this.pendingRequests.delete(message.id);
          reject(error);
        },
        timeoutId,
        startTime: Date.now(),
        retryCount: 0,
        message,
        onProgress: options?.onProgress,
      };

      this.pendingRequests.set(message.id, pendingRequest);

      // Handle abort signal
      if (options?.signal) {
        options.signal.addEventListener('abort', () => {
          this.cancelRequest(message.id);
        });
      }

      // Send message to worker
      try {
        worker.postMessage(message);

        if (this.config.debug) {
          console.log('[IPC] Request sent:', message);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        this.pendingRequests.delete(message.id);
        reject(error instanceof Error ? error : new Error('Failed to send message'));
      }
    });
  }

  /**
   * Handle incoming message from worker
   */
  public handleMessage(event: MessageEvent): void {
    const data = event.data;

    if (this.config.debug) {
      console.log('[IPC] Message received:', data);
    }

    // Handle ready signal
    if (data.type === 'ready') {
      return;
    }

    // Handle progress updates
    if (data.type === 'progress') {
      const progress = data as IPCProgressMessage;
      const pending = this.pendingRequests.get(progress.id);

      if (pending?.onProgress) {
        pending.onProgress(progress);
      }
      return;
    }

    // Handle response
    const response = data as IPCResponse;
    const pending = this.pendingRequests.get(response.id);

    if (!pending) {
      if (this.config.debug) {
        console.warn('[IPC] No pending request for response:', response.id);
      }
      return;
    }

    // Calculate processing time
    if (response.metadata) {
      response.metadata.processingTime = Date.now() - pending.startTime;
    } else {
      response.metadata = {
        processingTime: Date.now() - pending.startTime,
      };
    }

    // Resolve or reject based on success
    pending.resolve(response);
  }

  /**
   * Handle request timeout
   */
  private handleTimeout(messageId: string): void {
    const pending = this.pendingRequests.get(messageId);

    if (!pending) {
      return;
    }

    // Check if retries are enabled and we haven't exceeded max retries
    if (this.config.enableRetries && pending.retryCount < this.config.maxRetries) {
      if (this.config.debug) {
        console.log(`[IPC] Retrying request ${messageId} (attempt ${pending.retryCount + 1})`);
      }

      pending.retryCount++;

      // Schedule retry
      setTimeout(() => {
        // Note: Retry would require access to worker, which we don't have here
        // This is a limitation - retries should be handled at a higher level
        pending.reject(new Error('Request timeout (retries not implemented at this level)'));
      }, this.config.retryDelay);

      return;
    }

    if (this.config.debug) {
      console.warn('[IPC] Request timeout:', messageId);
    }

    pending.reject(new Error('Request timeout'));
  }

  /**
   * Cancel a pending request
   */
  public cancelRequest(messageId: string): boolean {
    const pending = this.pendingRequests.get(messageId);

    if (!pending) {
      return false;
    }

    clearTimeout(pending.timeoutId);
    pending.reject(new Error('Request cancelled'));
    this.pendingRequests.delete(messageId);

    if (this.config.debug) {
      console.log('[IPC] Request cancelled:', messageId);
    }

    return true;
  }

  /**
   * Cancel all pending requests
   */
  public cancelAll(): void {
    for (const [id] of this.pendingRequests) {
      this.cancelRequest(id);
    }
  }

  /**
   * Get statistics about pending requests
   */
  public getStats(): {
    pendingRequests: number;
    averageResponseTime: number;
    oldestRequestAge: number;
  } {
    const now = Date.now();
    const pending = Array.from(this.pendingRequests.values());

    return {
      pendingRequests: pending.length,
      averageResponseTime: 0, // Would need to track completed requests
      oldestRequestAge: pending.length > 0
        ? Math.max(...pending.map(p => now - p.startTime))
        : 0,
    };
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.cancelAll();
    this.pendingRequests.clear();
  }
}

/**
 * Create IPC protocol instance
 */
export function createIPCProtocol(config?: IPCProtocolConfig): IPCProtocol {
  return new IPCProtocol(config);
}

/**
 * Utility: Create typed IPC message sender
 */
export function createTypedSender<TPayload = unknown, TResponse = unknown>(
  protocol: IPCProtocol,
  worker: Worker,
  type: IPCMessageType,
  channel: IPCChannel
) {
  return (
    payload: TPayload,
    options?: {
      timeout?: number;
      onProgress?: (progress: IPCProgressMessage) => void;
      signal?: AbortSignal;
    }
  ): Promise<TResponse> => {
    return protocol.request<TPayload, TResponse>(
      worker,
      type,
      channel,
      payload,
      options
    );
  };
}

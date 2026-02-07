/**
 * Shared State Management for Web Workers
 * Uses SharedArrayBuffer for atomic state sharing between workers where supported.
 * Falls back to MessageChannel-based state synchronization when SAB is not available.
 *
 * Features:
 * - Atomic progress tracking across workers
 * - Cooperative cancellation signals
 * - Lock-free synchronization primitives
 * - Feature detection with fallback
 */

/**
 * Check if SharedArrayBuffer is available
 * Requires COOP/COEP headers for cross-origin isolation
 */
export function isSharedArrayBufferAvailable(): boolean {
  return typeof SharedArrayBuffer !== 'undefined';
}

/**
 * Atomic operations helper
 */
class AtomicHelper {
  /**
   * Atomically load a value
   */
  static load(buffer: Int32Array, index: number): number {
    return Atomics.load(buffer, index);
  }

  /**
   * Atomically store a value
   */
  static store(buffer: Int32Array, index: number, value: number): void {
    Atomics.store(buffer, index, value);
  }

  /**
   * Atomically add to a value and return the old value
   */
  static add(buffer: Int32Array, index: number, value: number): number {
    return Atomics.add(buffer, index, value);
  }

  /**
   * Atomically subtract from a value and return the old value
   */
  static sub(buffer: Int32Array, index: number, value: number): number {
    return Atomics.sub(buffer, index, value);
  }

  /**
   * Compare and exchange (CAS)
   */
  static compareExchange(
    buffer: Int32Array,
    index: number,
    expected: number,
    replacement: number
  ): number {
    return Atomics.compareExchange(buffer, index, expected, replacement);
  }

  /**
   * Wait for a value to change (blocking)
   */
  static wait(
    buffer: Int32Array,
    index: number,
    value: number,
    timeout?: number
  ): 'ok' | 'not-equal' | 'timed-out' {
    return Atomics.wait(buffer, index, value, timeout);
  }

  /**
   * Notify waiting threads
   */
  static notify(buffer: Int32Array, index: number, count: number = Infinity): number {
    return Atomics.notify(buffer, index, count);
  }
}

/**
 * Shared Progress Counter
 * Atomic progress tracking readable from any thread
 */
export class SharedProgress {
  private buffer: SharedArrayBuffer | null = null;
  private view: Int32Array | null = null;
  private fallbackValue = 0;
  private fallbackHandlers: Set<(progress: number) => void> = new Set();

  // Buffer indices
  private static readonly CURRENT_INDEX = 0;
  private static readonly TOTAL_INDEX = 1;
  private static readonly PERCENT_INDEX = 2; // Stored as integer (0-10000 for 2 decimal precision)

  constructor(total: number = 100) {
    if (isSharedArrayBufferAvailable()) {
      // Use SharedArrayBuffer for atomic updates
      this.buffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 3);
      this.view = new Int32Array(this.buffer);
      AtomicHelper.store(this.view, SharedProgress.TOTAL_INDEX, total);
    } else {
      // Fallback to regular state
      this.fallbackValue = 0;
    }
  }

  /**
   * Get the underlying SharedArrayBuffer
   * Can be transferred to workers
   */
  getBuffer(): SharedArrayBuffer | null {
    return this.buffer;
  }

  /**
   * Attach to an existing SharedArrayBuffer
   */
  static fromBuffer(buffer: SharedArrayBuffer): SharedProgress {
    const progress = new SharedProgress(0);
    progress.buffer = buffer;
    progress.view = new Int32Array(buffer);
    return progress;
  }

  /**
   * Set total count
   */
  setTotal(total: number): void {
    if (this.view) {
      AtomicHelper.store(this.view, SharedProgress.TOTAL_INDEX, total);
      this.updatePercent();
    }
  }

  /**
   * Get total count
   */
  getTotal(): number {
    if (this.view) {
      return AtomicHelper.load(this.view, SharedProgress.TOTAL_INDEX);
    }
    return 100; // Default fallback
  }

  /**
   * Increment progress by delta
   */
  increment(delta: number = 1): number {
    if (this.view) {
      const newValue = AtomicHelper.add(this.view, SharedProgress.CURRENT_INDEX, delta) + delta;
      this.updatePercent();
      return newValue;
    } else {
      this.fallbackValue += delta;
      this.notifyFallbackHandlers();
      return this.fallbackValue;
    }
  }

  /**
   * Set progress to specific value
   */
  set(value: number): void {
    if (this.view) {
      AtomicHelper.store(this.view, SharedProgress.CURRENT_INDEX, value);
      this.updatePercent();
    } else {
      this.fallbackValue = value;
      this.notifyFallbackHandlers();
    }
  }

  /**
   * Get current progress value
   */
  get(): number {
    if (this.view) {
      return AtomicHelper.load(this.view, SharedProgress.CURRENT_INDEX);
    }
    return this.fallbackValue;
  }

  /**
   * Get progress percentage (0-100)
   */
  getPercent(): number {
    if (this.view) {
      const percentInt = AtomicHelper.load(this.view, SharedProgress.PERCENT_INDEX);
      return percentInt / 100; // Convert from integer representation
    }
    const total = this.getTotal();
    return total > 0 ? (this.fallbackValue / total) * 100 : 0;
  }

  /**
   * Update percent value (internal)
   */
  private updatePercent(): void {
    if (!this.view) return;

    const current = AtomicHelper.load(this.view, SharedProgress.CURRENT_INDEX);
    const total = AtomicHelper.load(this.view, SharedProgress.TOTAL_INDEX);

    if (total > 0) {
      const percent = Math.min(100, (current / total) * 100);
      const percentInt = Math.floor(percent * 100); // Store with 2 decimal precision
      AtomicHelper.store(this.view, SharedProgress.PERCENT_INDEX, percentInt);
    }
  }

  /**
   * Reset progress to zero
   */
  reset(): void {
    if (this.view) {
      AtomicHelper.store(this.view, SharedProgress.CURRENT_INDEX, 0);
      AtomicHelper.store(this.view, SharedProgress.PERCENT_INDEX, 0);
    } else {
      this.fallbackValue = 0;
      this.notifyFallbackHandlers();
    }
  }

  /**
   * Subscribe to progress updates (fallback mode only)
   */
  subscribe(handler: (progress: number) => void): () => void {
    this.fallbackHandlers.add(handler);
    return () => this.fallbackHandlers.delete(handler);
  }

  /**
   * Notify fallback handlers
   */
  private notifyFallbackHandlers(): void {
    const percent = this.getPercent();
    this.fallbackHandlers.forEach(handler => handler(percent));
  }
}

/**
 * Shared Cancellation Signal
 * Atomic boolean for cooperative cancellation
 */
export class SharedCancellation {
  private buffer: SharedArrayBuffer | null = null;
  private view: Int32Array | null = null;
  private fallbackValue = false;
  private fallbackHandlers: Set<() => void> = new Set();

  private static readonly CANCELLED_INDEX = 0;

  constructor() {
    if (isSharedArrayBufferAvailable()) {
      this.buffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
      this.view = new Int32Array(this.buffer);
      AtomicHelper.store(this.view, SharedCancellation.CANCELLED_INDEX, 0);
    }
  }

  /**
   * Get the underlying SharedArrayBuffer
   */
  getBuffer(): SharedArrayBuffer | null {
    return this.buffer;
  }

  /**
   * Attach to an existing SharedArrayBuffer
   */
  static fromBuffer(buffer: SharedArrayBuffer): SharedCancellation {
    const cancellation = new SharedCancellation();
    cancellation.buffer = buffer;
    cancellation.view = new Int32Array(buffer);
    return cancellation;
  }

  /**
   * Cancel the operation
   */
  cancel(): void {
    if (this.view) {
      AtomicHelper.store(this.view, SharedCancellation.CANCELLED_INDEX, 1);
      // Notify any waiting threads
      AtomicHelper.notify(this.view, SharedCancellation.CANCELLED_INDEX);
    } else {
      this.fallbackValue = true;
      this.notifyFallbackHandlers();
    }
  }

  /**
   * Check if cancelled
   */
  isCancelled(): boolean {
    if (this.view) {
      return AtomicHelper.load(this.view, SharedCancellation.CANCELLED_INDEX) === 1;
    }
    return this.fallbackValue;
  }

  /**
   * Reset cancellation state
   */
  reset(): void {
    if (this.view) {
      AtomicHelper.store(this.view, SharedCancellation.CANCELLED_INDEX, 0);
    } else {
      this.fallbackValue = false;
    }
  }

  /**
   * Wait for cancellation (blocking - use in workers only)
   * Returns true if cancelled, false if timeout
   */
  wait(timeout?: number): boolean {
    if (!this.view) {
      throw new Error('SharedCancellation.wait() requires SharedArrayBuffer support');
    }

    const result = AtomicHelper.wait(
      this.view,
      SharedCancellation.CANCELLED_INDEX,
      0,
      timeout
    );

    return result !== 'timed-out' && this.isCancelled();
  }

  /**
   * Subscribe to cancellation (fallback mode only)
   */
  subscribe(handler: () => void): () => void {
    this.fallbackHandlers.add(handler);
    return () => this.fallbackHandlers.delete(handler);
  }

  /**
   * Notify fallback handlers
   */
  private notifyFallbackHandlers(): void {
    this.fallbackHandlers.forEach(handler => handler());
  }

  /**
   * Create an AbortSignal that's linked to this cancellation
   */
  toAbortSignal(): AbortSignal {
    const controller = new AbortController();

    if (this.isCancelled()) {
      controller.abort();
    } else {
      // Poll for cancellation
      const interval = setInterval(() => {
        if (this.isCancelled()) {
          controller.abort();
          clearInterval(interval);
        }
      }, 100);

      // Also subscribe if using fallback
      if (!this.view) {
        this.subscribe(() => {
          controller.abort();
          clearInterval(interval);
        });
      }
    }

    return controller.signal;
  }
}

/**
 * Shared Counter
 * Simple atomic counter for tracking shared state
 */
export class SharedCounter {
  private buffer: SharedArrayBuffer | null = null;
  private view: Int32Array | null = null;
  private fallbackValue = 0;

  private static readonly VALUE_INDEX = 0;

  constructor(initialValue: number = 0) {
    if (isSharedArrayBufferAvailable()) {
      this.buffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
      this.view = new Int32Array(this.buffer);
      AtomicHelper.store(this.view, SharedCounter.VALUE_INDEX, initialValue);
    } else {
      this.fallbackValue = initialValue;
    }
  }

  /**
   * Get the underlying SharedArrayBuffer
   */
  getBuffer(): SharedArrayBuffer | null {
    return this.buffer;
  }

  /**
   * Attach to an existing SharedArrayBuffer
   */
  static fromBuffer(buffer: SharedArrayBuffer): SharedCounter {
    const counter = new SharedCounter();
    counter.buffer = buffer;
    counter.view = new Int32Array(buffer);
    return counter;
  }

  /**
   * Increment counter and return new value
   */
  increment(delta: number = 1): number {
    if (this.view) {
      return AtomicHelper.add(this.view, SharedCounter.VALUE_INDEX, delta) + delta;
    } else {
      this.fallbackValue += delta;
      return this.fallbackValue;
    }
  }

  /**
   * Decrement counter and return new value
   */
  decrement(delta: number = 1): number {
    if (this.view) {
      return AtomicHelper.sub(this.view, SharedCounter.VALUE_INDEX, delta) - delta;
    } else {
      this.fallbackValue -= delta;
      return this.fallbackValue;
    }
  }

  /**
   * Get current value
   */
  get(): number {
    if (this.view) {
      return AtomicHelper.load(this.view, SharedCounter.VALUE_INDEX);
    }
    return this.fallbackValue;
  }

  /**
   * Set value
   */
  set(value: number): void {
    if (this.view) {
      AtomicHelper.store(this.view, SharedCounter.VALUE_INDEX, value);
    } else {
      this.fallbackValue = value;
    }
  }

  /**
   * Compare and swap
   * Returns true if swap occurred
   */
  compareAndSwap(expected: number, newValue: number): boolean {
    if (this.view) {
      const old = AtomicHelper.compareExchange(
        this.view,
        SharedCounter.VALUE_INDEX,
        expected,
        newValue
      );
      return old === expected;
    } else {
      if (this.fallbackValue === expected) {
        this.fallbackValue = newValue;
        return true;
      }
      return false;
    }
  }
}

/**
 * Shared Flag
 * Simple boolean flag with atomic operations
 */
export class SharedFlag {
  private buffer: SharedArrayBuffer | null = null;
  private view: Int32Array | null = null;
  private fallbackValue = false;

  private static readonly VALUE_INDEX = 0;

  constructor(initialValue: boolean = false) {
    if (isSharedArrayBufferAvailable()) {
      this.buffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
      this.view = new Int32Array(this.buffer);
      AtomicHelper.store(this.view, SharedFlag.VALUE_INDEX, initialValue ? 1 : 0);
    } else {
      this.fallbackValue = initialValue;
    }
  }

  /**
   * Get the underlying SharedArrayBuffer
   */
  getBuffer(): SharedArrayBuffer | null {
    return this.buffer;
  }

  /**
   * Attach to an existing SharedArrayBuffer
   */
  static fromBuffer(buffer: SharedArrayBuffer): SharedFlag {
    const flag = new SharedFlag();
    flag.buffer = buffer;
    flag.view = new Int32Array(buffer);
    return flag;
  }

  /**
   * Set flag to true
   */
  set(): void {
    if (this.view) {
      AtomicHelper.store(this.view, SharedFlag.VALUE_INDEX, 1);
      AtomicHelper.notify(this.view, SharedFlag.VALUE_INDEX);
    } else {
      this.fallbackValue = true;
    }
  }

  /**
   * Set flag to false
   */
  clear(): void {
    if (this.view) {
      AtomicHelper.store(this.view, SharedFlag.VALUE_INDEX, 0);
    } else {
      this.fallbackValue = false;
    }
  }

  /**
   * Check if flag is set
   */
  isSet(): boolean {
    if (this.view) {
      return AtomicHelper.load(this.view, SharedFlag.VALUE_INDEX) === 1;
    }
    return this.fallbackValue;
  }

  /**
   * Toggle flag
   */
  toggle(): boolean {
    if (this.view) {
      const current = AtomicHelper.load(this.view, SharedFlag.VALUE_INDEX);
      const newValue = current === 0 ? 1 : 0;
      AtomicHelper.store(this.view, SharedFlag.VALUE_INDEX, newValue);
      return newValue === 1;
    } else {
      this.fallbackValue = !this.fallbackValue;
      return this.fallbackValue;
    }
  }

  /**
   * Wait for flag to be set (blocking - use in workers only)
   */
  wait(timeout?: number): boolean {
    if (!this.view) {
      throw new Error('SharedFlag.wait() requires SharedArrayBuffer support');
    }

    const result = AtomicHelper.wait(this.view, SharedFlag.VALUE_INDEX, 0, timeout);
    return result !== 'timed-out' && this.isSet();
  }
}

/**
 * MessageChannel-based state sync (fallback)
 * Used when SharedArrayBuffer is not available
 */
export class MessageChannelSync {
  private channel: MessageChannel;
  private state = new Map<string, any>();
  private handlers = new Map<string, Set<(value: any) => void>>();

  constructor() {
    this.channel = new MessageChannel();
    this.channel.port1.onmessage = this.handleMessage.bind(this);
  }

  /**
   * Get port for worker
   */
  getPort(): MessagePort {
    return this.channel.port2;
  }

  /**
   * Set state value
   */
  set(key: string, value: any): void {
    this.state.set(key, value);
    this.channel.port1.postMessage({ type: 'set', key, value });
    this.notifyHandlers(key, value);
  }

  /**
   * Get state value
   */
  get(key: string): any {
    return this.state.get(key);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(key: string, handler: (value: any) => void): () => void {
    if (!this.handlers.has(key)) {
      this.handlers.set(key, new Set());
    }
    this.handlers.get(key)!.add(handler);

    return () => {
      this.handlers.get(key)?.delete(handler);
    };
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(event: MessageEvent): void {
    const { type, key, value } = event.data;

    if (type === 'set') {
      this.state.set(key, value);
      this.notifyHandlers(key, value);
    }
  }

  /**
   * Notify handlers
   */
  private notifyHandlers(key: string, value: any): void {
    this.handlers.get(key)?.forEach(handler => handler(value));
  }
}

/**
 * Feature detection and capability reporting
 */
export function getSharedStateCapabilities() {
  return {
    sharedArrayBuffer: isSharedArrayBufferAvailable(),
    atomics: typeof Atomics !== 'undefined',
    crossOriginIsolated: typeof crossOriginIsolated !== 'undefined' ? crossOriginIsolated : false,
    workers: typeof Worker !== 'undefined',
  };
}

/**
 * Utility: Create progress tracker with automatic cleanup
 */
export function createProgressTracker(total: number = 100): {
  progress: SharedProgress;
  cleanup: () => void;
} {
  const progress = new SharedProgress(total);

  return {
    progress,
    cleanup: () => {
      progress.reset();
    },
  };
}

/**
 * Utility: Create cancellation token with automatic cleanup
 */
export function createCancellationToken(): {
  cancellation: SharedCancellation;
  cancel: () => void;
  cleanup: () => void;
} {
  const cancellation = new SharedCancellation();

  return {
    cancellation,
    cancel: () => cancellation.cancel(),
    cleanup: () => cancellation.reset(),
  };
}

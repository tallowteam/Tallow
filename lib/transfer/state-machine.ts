/**
 * Transfer State Machine
 * Agent 029 — SYNC-COORDINATOR
 *
 * Finite state machine managing the lifecycle of file transfers.
 * Handles state transitions, persistence, error recovery, and
 * resumable transfer support.
 *
 * States: idle → connecting → negotiating → transferring → verifying → complete
 *         Any state can transition to → paused, failed, cancelled
 */

// ============================================================================
// TYPES
// ============================================================================

export type TransferState =
  | 'idle'
  | 'connecting'
  | 'negotiating'
  | 'encrypting'
  | 'transferring'
  | 'verifying'
  | 'decrypting'
  | 'complete'
  | 'paused'
  | 'resuming'
  | 'failed'
  | 'cancelled';

export type TransferEvent =
  | 'START'
  | 'CONNECTED'
  | 'NEGOTIATED'
  | 'ENCRYPTED'
  | 'PROGRESS'
  | 'TRANSFER_COMPLETE'
  | 'VERIFIED'
  | 'DECRYPTED'
  | 'PAUSE'
  | 'RESUME'
  | 'CANCEL'
  | 'ERROR'
  | 'RETRY'
  | 'RESET';

export type TransferDirection = 'send' | 'receive';

export interface TransferContext {
  /** Unique transfer ID */
  transferId: string;
  /** Transfer direction */
  direction: TransferDirection;
  /** File name */
  fileName: string;
  /** File size in bytes */
  fileSize: number;
  /** Bytes transferred so far */
  bytesTransferred: number;
  /** Transfer progress (0-1) */
  progress: number;
  /** Current transfer speed in bytes/sec */
  speed: number;
  /** Estimated time remaining in seconds */
  eta: number;
  /** Number of chunks completed */
  chunksCompleted: number;
  /** Total number of chunks */
  chunksTotal: number;
  /** Peer device ID */
  peerId: string;
  /** Peer device name */
  peerName: string;
  /** Error message (if failed) */
  error?: string;
  /** Number of retry attempts */
  retryCount: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Timestamp when transfer started */
  startedAt: number;
  /** Timestamp of last state change */
  lastUpdated: number;
  /** Merkle root hash for verification */
  merkleRoot?: string;
}

export interface StateTransition {
  from: TransferState;
  event: TransferEvent;
  to: TransferState;
  guard?: (ctx: TransferContext) => boolean;
}

export type StateChangeListener = (
  prevState: TransferState,
  newState: TransferState,
  event: TransferEvent,
  context: TransferContext
) => void;

// ============================================================================
// STATE TRANSITIONS
// ============================================================================

const TRANSITIONS: StateTransition[] = [
  // Normal flow
  { from: 'idle', event: 'START', to: 'connecting' },
  { from: 'connecting', event: 'CONNECTED', to: 'negotiating' },
  { from: 'negotiating', event: 'NEGOTIATED', to: 'encrypting' },
  { from: 'encrypting', event: 'ENCRYPTED', to: 'transferring' },
  { from: 'transferring', event: 'TRANSFER_COMPLETE', to: 'verifying' },
  { from: 'verifying', event: 'VERIFIED', to: 'decrypting' },
  { from: 'decrypting', event: 'DECRYPTED', to: 'complete' },

  // Shortcut for receive (no encrypt step)
  { from: 'negotiating', event: 'NEGOTIATED', to: 'transferring',
    guard: (ctx) => ctx.direction === 'receive' },

  // Verification can go directly to complete for sender
  { from: 'verifying', event: 'VERIFIED', to: 'complete',
    guard: (ctx) => ctx.direction === 'send' },

  // Pause/Resume from any active state
  { from: 'connecting', event: 'PAUSE', to: 'paused' },
  { from: 'negotiating', event: 'PAUSE', to: 'paused' },
  { from: 'encrypting', event: 'PAUSE', to: 'paused' },
  { from: 'transferring', event: 'PAUSE', to: 'paused' },
  { from: 'verifying', event: 'PAUSE', to: 'paused' },
  { from: 'decrypting', event: 'PAUSE', to: 'paused' },
  { from: 'paused', event: 'RESUME', to: 'resuming' },
  { from: 'resuming', event: 'CONNECTED', to: 'transferring' },

  // Cancel from any state
  { from: 'connecting', event: 'CANCEL', to: 'cancelled' },
  { from: 'negotiating', event: 'CANCEL', to: 'cancelled' },
  { from: 'encrypting', event: 'CANCEL', to: 'cancelled' },
  { from: 'transferring', event: 'CANCEL', to: 'cancelled' },
  { from: 'verifying', event: 'CANCEL', to: 'cancelled' },
  { from: 'decrypting', event: 'CANCEL', to: 'cancelled' },
  { from: 'paused', event: 'CANCEL', to: 'cancelled' },
  { from: 'resuming', event: 'CANCEL', to: 'cancelled' },
  { from: 'failed', event: 'CANCEL', to: 'cancelled' },

  // Error from any active state
  { from: 'connecting', event: 'ERROR', to: 'failed' },
  { from: 'negotiating', event: 'ERROR', to: 'failed' },
  { from: 'encrypting', event: 'ERROR', to: 'failed' },
  { from: 'transferring', event: 'ERROR', to: 'failed' },
  { from: 'verifying', event: 'ERROR', to: 'failed' },
  { from: 'decrypting', event: 'ERROR', to: 'failed' },
  { from: 'resuming', event: 'ERROR', to: 'failed' },

  // Retry from failed (with retry guard)
  { from: 'failed', event: 'RETRY', to: 'connecting',
    guard: (ctx) => ctx.retryCount < ctx.maxRetries },

  // Reset from terminal states
  { from: 'complete', event: 'RESET', to: 'idle' },
  { from: 'failed', event: 'RESET', to: 'idle' },
  { from: 'cancelled', event: 'RESET', to: 'idle' },
];

// ============================================================================
// STATE MACHINE
// ============================================================================

export class TransferStateMachine {
  private state: TransferState;
  private context: TransferContext;
  private listeners: StateChangeListener[] = [];

  constructor(context: Partial<TransferContext> & { transferId: string; direction: TransferDirection }) {
    this.state = 'idle';
    this.context = {
      fileName: '',
      fileSize: 0,
      bytesTransferred: 0,
      progress: 0,
      speed: 0,
      eta: 0,
      chunksCompleted: 0,
      chunksTotal: 0,
      peerId: '',
      peerName: '',
      retryCount: 0,
      maxRetries: 3,
      startedAt: 0,
      lastUpdated: Date.now(),
      ...context,
    };
  }

  /** Get current state */
  getState(): TransferState {
    return this.state;
  }

  /** Get current context */
  getContext(): Readonly<TransferContext> {
    return { ...this.context };
  }

  /** Check if a transition is valid */
  canTransition(event: TransferEvent): boolean {
    return TRANSITIONS.some(
      t => t.from === this.state && t.event === event &&
        (!t.guard || t.guard(this.context))
    );
  }

  /** Send an event to the state machine */
  send(event: TransferEvent, data?: Partial<TransferContext>): boolean {
    const transition = TRANSITIONS.find(
      t => t.from === this.state && t.event === event &&
        (!t.guard || t.guard(this.context))
    );

    if (!transition) {
      return false;
    }

    const prevState = this.state;
    this.state = transition.to;

    // Update context
    if (data) {
      Object.assign(this.context, data);
    }
    this.context.lastUpdated = Date.now();

    if (event === 'START') {
      this.context.startedAt = Date.now();
    }
    if (event === 'RETRY') {
      this.context.retryCount++;
    }

    // Notify listeners
    for (const listener of this.listeners) {
      listener(prevState, this.state, event, this.context);
    }

    return true;
  }

  /** Update transfer progress */
  updateProgress(bytesTransferred: number, speed: number): void {
    this.context.bytesTransferred = bytesTransferred;
    this.context.progress = this.context.fileSize > 0
      ? bytesTransferred / this.context.fileSize
      : 0;
    this.context.speed = speed;
    this.context.eta = speed > 0
      ? (this.context.fileSize - bytesTransferred) / speed
      : 0;
    this.context.lastUpdated = Date.now();
  }

  /** Subscribe to state changes */
  onStateChange(listener: StateChangeListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /** Check if transfer is in a terminal state */
  isTerminal(): boolean {
    return ['complete', 'failed', 'cancelled'].includes(this.state);
  }

  /** Check if transfer is actively running */
  isActive(): boolean {
    return ['connecting', 'negotiating', 'encrypting', 'transferring',
      'verifying', 'decrypting', 'resuming'].includes(this.state);
  }

  /** Serialize state for persistence / resumable transfers */
  serialize(): string {
    return JSON.stringify({
      state: this.state,
      context: this.context,
    });
  }

  /** Restore from serialized state */
  static deserialize(json: string): TransferStateMachine {
    const { state, context } = JSON.parse(json);
    const machine = new TransferStateMachine(context);
    machine.state = state;
    return machine;
  }
}

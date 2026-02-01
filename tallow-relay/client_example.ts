/**
 * Tallow Relay Client - TypeScript Example
 *
 * This example shows how to integrate the Tallow relay server
 * with the main Tallow application for file transfers.
 */

// Protocol message types
type MessageType =
  | 'CREATE_ROOM'
  | 'ROOM_CREATED'
  | 'JOIN_ROOM'
  | 'ROOM_JOINED'
  | 'PEER_JOINED'
  | 'PEER_LEFT'
  | 'DATA'
  | 'CLOSE'
  | 'ERROR';

interface RelayMessage<T = unknown> {
  type: MessageType;
  payload?: T;
  ts: number;
}

interface CreateRoomRequest {
  expiry_minutes?: number;
}

interface RoomCreatedResponse {
  room_id: string;
  code: string;
  expires_at: number;
}

interface JoinRoomRequest {
  code: string;
}

interface RoomJoinedResponse {
  room_id: string;
  expires_at: number;
}

interface ErrorResponse {
  code: string;
  message: string;
}

// Relay client class
export class TallowRelayClient {
  private ws: WebSocket | null = null;
  private roomCode: string | null = null;
  private isCreator: boolean = false;

  // Event handlers
  onRoomCreated?: (code: string, expiresAt: Date) => void;
  onRoomJoined?: () => void;
  onPeerJoined?: () => void;
  onPeerLeft?: () => void;
  onData?: (data: ArrayBuffer) => void;
  onError?: (code: string, message: string) => void;
  onClose?: () => void;

  constructor(private relayUrl: string = 'wss://relay.tallow.app/ws') {}

  /**
   * Connect to the relay server
   */
  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.relayUrl);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
          console.log('[Relay] Connected to relay server');
          resolve();
        };

        this.ws.onerror = (error) => {
          console.error('[Relay] WebSocket error:', error);
          reject(new Error('Failed to connect to relay'));
        };

        this.ws.onclose = () => {
          console.log('[Relay] Connection closed');
          this.onClose?.();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create a new relay room
   */
  async createRoom(expiryMinutes: number = 60): Promise<string> {
    await this.connect();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for room creation'));
      }, 10000);

      // Override onRoomCreated temporarily
      const originalHandler = this.onRoomCreated;
      this.onRoomCreated = (code, expiresAt) => {
        clearTimeout(timeout);
        this.onRoomCreated = originalHandler;
        this.isCreator = true;
        this.roomCode = code;
        originalHandler?.(code, expiresAt);
        resolve(code);
      };

      // Override onError temporarily
      const originalErrorHandler = this.onError;
      this.onError = (code, message) => {
        clearTimeout(timeout);
        this.onError = originalErrorHandler;
        originalErrorHandler?.(code, message);
        reject(new Error(`${code}: ${message}`));
      };

      this.sendMessage<CreateRoomRequest>('CREATE_ROOM', {
        expiry_minutes: expiryMinutes
      });
    });
  }

  /**
   * Join an existing relay room
   */
  async joinRoom(code: string): Promise<void> {
    await this.connect();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting to join room'));
      }, 10000);

      // Override onRoomJoined temporarily
      const originalHandler = this.onRoomJoined;
      this.onRoomJoined = () => {
        clearTimeout(timeout);
        this.onRoomJoined = originalHandler;
        this.isCreator = false;
        this.roomCode = code;
        originalHandler?.();
        resolve();
      };

      // Override onError temporarily
      const originalErrorHandler = this.onError;
      this.onError = (errorCode, message) => {
        clearTimeout(timeout);
        this.onError = originalErrorHandler;
        originalErrorHandler?.(errorCode, message);
        reject(new Error(`${errorCode}: ${message}`));
      };

      this.sendMessage<JoinRoomRequest>('JOIN_ROOM', { code });
    });
  }

  /**
   * Send encrypted data through the relay
   * The relay will forward this to the peer without decryption
   */
  sendData(data: ArrayBuffer | Uint8Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to relay');
    }

    // Send binary data directly for efficiency
    this.ws.send(data);
  }

  /**
   * Close the connection
   */
  close(): void {
    if (this.ws) {
      this.sendMessage('CLOSE', { reason: 'client_close' });
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Get the current room code
   */
  getRoomCode(): string | null {
    return this.roomCode;
  }

  /**
   * Check if this client created the room
   */
  isRoomCreator(): boolean {
    return this.isCreator;
  }

  // Private methods

  private sendMessage<T>(type: MessageType, payload?: T): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to relay');
    }

    const message: RelayMessage<T> = {
      type,
      payload,
      ts: Date.now()
    };

    this.ws.send(JSON.stringify(message));
  }

  private handleMessage(data: ArrayBuffer | string): void {
    // Binary data is relayed encrypted data
    if (data instanceof ArrayBuffer) {
      this.onData?.(data);
      return;
    }

    // JSON messages are control messages
    try {
      const message: RelayMessage = JSON.parse(data);

      switch (message.type) {
        case 'ROOM_CREATED': {
          const response = message.payload as RoomCreatedResponse;
          this.onRoomCreated?.(
            response.code,
            new Date(response.expires_at * 1000)
          );
          break;
        }

        case 'ROOM_JOINED': {
          this.onRoomJoined?.();
          break;
        }

        case 'PEER_JOINED': {
          this.onPeerJoined?.();
          break;
        }

        case 'PEER_LEFT': {
          this.onPeerLeft?.();
          break;
        }

        case 'ERROR': {
          const error = message.payload as ErrorResponse;
          this.onError?.(error.code, error.message);
          break;
        }

        case 'CLOSE': {
          this.onClose?.();
          break;
        }
      }
    } catch (error) {
      console.error('[Relay] Failed to parse message:', error);
    }
  }
}

// Example usage with Tallow's encryption layer
export async function transferFileViaRelay(
  file: File,
  relayClient: TallowRelayClient,
  encryptChunk: (data: ArrayBuffer) => Promise<ArrayBuffer>
): Promise<void> {
  const CHUNK_SIZE = 64 * 1024; // 64KB chunks

  // Wait for peer to join
  await new Promise<void>((resolve) => {
    relayClient.onPeerJoined = resolve;
  });

  // Send file metadata (encrypted)
  const metadata = {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  };
  const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata));
  const encryptedMetadata = await encryptChunk(metadataBytes.buffer);
  relayClient.sendData(encryptedMetadata);

  // Stream file in chunks
  const reader = file.stream().getReader();
  let offset = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {break;}

    // Encrypt and send chunk
    const encryptedChunk = await encryptChunk(value.buffer);
    relayClient.sendData(encryptedChunk);

    offset += value.length;
    console.log(`[Transfer] Progress: ${Math.round(offset / file.size * 100)}%`);
  }

  // Send completion marker
  const endMarker = new TextEncoder().encode('__END__');
  const encryptedEnd = await encryptChunk(endMarker.buffer);
  relayClient.sendData(encryptedEnd);

  console.log('[Transfer] File transfer complete');
}

// Example: Receiving file via relay
export async function receiveFileViaRelay(
  relayClient: TallowRelayClient,
  decryptChunk: (data: ArrayBuffer) => Promise<ArrayBuffer>
): Promise<File> {
  const chunks: ArrayBuffer[] = [];
  let metadata: { name: string; size: number; type: string } | null = null;

  return new Promise((resolve, reject) => {
    relayClient.onData = async (encryptedData) => {
      try {
        const data = await decryptChunk(encryptedData);

        // First message is metadata
        if (!metadata) {
          const text = new TextDecoder().decode(data);
          metadata = JSON.parse(text);
          console.log('[Receive] File metadata:', metadata);
          return;
        }

        // Check for end marker
        const text = new TextDecoder().decode(data);
        if (text === '__END__') {
          // Combine chunks and create file
          const blob = new Blob(chunks, { type: metadata.type });
          const file = new File([blob], metadata.name, { type: metadata.type });
          resolve(file);
          return;
        }

        // Regular chunk
        chunks.push(data);
        const received = chunks.reduce((sum, c) => sum + c.byteLength, 0);
        console.log(`[Receive] Progress: ${Math.round(received / metadata.size * 100)}%`);

      } catch (error) {
        reject(error);
      }
    };

    relayClient.onError = (code, message) => {
      reject(new Error(`${code}: ${message}`));
    };
  });
}

/**
 * CLI-Web Bridge Protocol
 *
 * Enables seamless transfers between Tallow CLI and Tallow Web App.
 * Both use the same encryption (ML-KEM-768 + X25519 + AES-256-GCM)
 * and the same relay protocol.
 */

import { sha256 } from '@noble/hashes/sha2.js';

// Protocol constants - must match CLI
export const PROTOCOL_VERSION = 1;
export const CHUNK_SIZE = 65536; // 64KB default
export const MAX_CODE_WORDS = 6;
export const MIN_CODE_WORDS = 2;

// Message types - must match CLI protocol
export enum MessageType {
  HELLO = 0x01,
  FILE_INFO = 0x02,
  CHUNK = 0x03,
  ACK = 0x04,
  ERROR = 0x05,
  DONE = 0x06,
  PAKE_MSG1 = 0x10,
  PAKE_MSG2 = 0x11,
  PAKE_CONFIRM = 0x12,
  HYBRID_PUBKEY = 0x20,
  HYBRID_ENCAP = 0x21,
}

// Error codes - must match CLI
export enum ErrorCode {
  UNKNOWN = 0x00,
  INVALID_MESSAGE = 0x01,
  INVALID_CHUNK = 0x02,
  CHECKSUM_MISMATCH = 0x03,
  TRANSFER_CANCELLED = 0x04,
  AUTH_FAILED = 0x05,
}

/**
 * Room code utilities - compatible with CLI
 */
export class RoomCode {
  /**
   * Normalize a room code (lowercase, trim, hyphen-separated)
   */
  static normalize(code: string): string {
    return code
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  /**
   * Validate room code format
   */
  static validate(code: string): boolean {
    const normalized = this.normalize(code);
    const words = normalized.split('-');

    if (words.length < MIN_CODE_WORDS || words.length > MAX_CODE_WORDS) {
      return false;
    }

    // Check each word is alphanumeric
    return words.every(word => /^[a-z0-9]+$/.test(word));
  }

  /**
   * Derive room ID from code (matches CLI implementation)
   * room_id = hex(BLAKE3(normalized)[0:16])
   */
  static toRoomId(code: string): string {
    const normalized = this.normalize(code);
    const hash = sha256(new TextEncoder().encode(normalized));

    // Convert first 16 bytes to hex
    return Array.from(hash.slice(0, 16))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Derive key material for PAKE (matches CLI implementation)
   */
  static toKeyMaterial(code: string): Uint8Array {
    const normalized = this.normalize(code);
    const context = 'tallow-pake-password-v1';

    // BLAKE3 key derivation
    const contextBytes = new TextEncoder().encode(context);
    const codeBytes = new TextEncoder().encode(normalized);

    // Combine context and code, then hash
    const combined = new Uint8Array(contextBytes.length + codeBytes.length);
    combined.set(contextBytes);
    combined.set(codeBytes, contextBytes.length);

    return sha256(combined);
  }
}

/**
 * Binary message encoder/decoder - compatible with CLI
 */
export class MessageCodec {
  /**
   * Encode a message with header
   * Format: [4 bytes length][1 byte type][payload]
   */
  static encode(type: MessageType, payload: Uint8Array): Uint8Array {
    const totalLen = 5 + payload.length;
    const result = new Uint8Array(totalLen);

    // Length (big-endian, excludes header)
    const payloadLen = payload.length + 1; // +1 for type byte
    result[0] = (payloadLen >> 24) & 0xff;
    result[1] = (payloadLen >> 16) & 0xff;
    result[2] = (payloadLen >> 8) & 0xff;
    result[3] = payloadLen & 0xff;

    // Type
    result[4] = type;

    // Payload
    result.set(payload, 5);

    return result;
  }

  /**
   * Decode a message
   * Returns { type, payload } or null if incomplete
   */
  static decode(data: Uint8Array): { type: MessageType; payload: Uint8Array } | null {
    if (data.length < 5) {
      return null;
    }

    // Read length
    const length = ((data[0] ?? 0) << 24) | ((data[1] ?? 0) << 16) | ((data[2] ?? 0) << 8) | (data[3] ?? 0);

    if (data.length < 4 + length) {
      return null; // Incomplete message
    }

    const type = data[4] as MessageType;
    const payload = data.slice(5, 4 + length);

    return { type, payload };
  }
}

/**
 * File info structure - compatible with CLI
 */
export interface FileInfo {
  name: string;
  size: number;
  compressed: boolean;
  compressedSize: number;
  checksum: Uint8Array; // BLAKE3 hash
  totalChunks: number;
  chunkSize: number;
}

export class FileInfoCodec {
  /**
   * Encode FileInfo to bytes
   * Format: [2 bytes name len][name][8 bytes size][1 byte flags][8 bytes compressed size][32 bytes checksum][4 bytes chunks][4 bytes chunk size]
   */
  static encode(info: FileInfo): Uint8Array {
    const nameBytes = new TextEncoder().encode(info.name);
    const totalLen = 2 + nameBytes.length + 8 + 1 + 8 + 32 + 4 + 4;
    const result = new Uint8Array(totalLen);
    const view = new DataView(result.buffer);

    let offset = 0;

    // Name length and name
    view.setUint16(offset, nameBytes.length, false);
    offset += 2;
    result.set(nameBytes, offset);
    offset += nameBytes.length;

    // Size (as two 32-bit parts for BigInt compatibility)
    view.setUint32(offset, Math.floor(info.size / 0x100000000), false);
    view.setUint32(offset + 4, info.size >>> 0, false);
    offset += 8;

    // Flags
    result[offset] = info.compressed ? 0x01 : 0x00;
    offset += 1;

    // Compressed size
    view.setUint32(offset, Math.floor(info.compressedSize / 0x100000000), false);
    view.setUint32(offset + 4, info.compressedSize >>> 0, false);
    offset += 8;

    // Checksum (32 bytes)
    result.set(info.checksum.slice(0, 32), offset);
    offset += 32;

    // Total chunks
    view.setUint32(offset, info.totalChunks, false);
    offset += 4;

    // Chunk size
    view.setUint32(offset, info.chunkSize, false);

    return result;
  }

  /**
   * Decode FileInfo from bytes
   */
  static decode(data: Uint8Array): FileInfo | null {
    if (data.length < 59) { // Minimum size
      return null;
    }

    const view = new DataView(data.buffer, data.byteOffset);
    let offset = 0;

    // Name
    const nameLen = view.getUint16(offset, false);
    offset += 2;

    if (data.length < offset + nameLen + 57) {
      return null;
    }

    const name = new TextDecoder().decode(data.slice(offset, offset + nameLen));
    offset += nameLen;

    // Size
    const sizeHigh = view.getUint32(offset, false);
    const sizeLow = view.getUint32(offset + 4, false);
    const size = sizeHigh * 0x100000000 + sizeLow;
    offset += 8;

    // Flags
    const compressed = ((data[offset] ?? 0) & 0x01) !== 0;
    offset += 1;

    // Compressed size
    const compSizeHigh = view.getUint32(offset, false);
    const compSizeLow = view.getUint32(offset + 4, false);
    const compressedSize = compSizeHigh * 0x100000000 + compSizeLow;
    offset += 8;

    // Checksum
    const checksum = data.slice(offset, offset + 32);
    offset += 32;

    // Total chunks
    const totalChunks = view.getUint32(offset, false);
    offset += 4;

    // Chunk size
    const chunkSize = view.getUint32(offset, false);

    return {
      name,
      size,
      compressed,
      compressedSize,
      checksum,
      totalChunks,
      chunkSize,
    };
  }
}

/**
 * Chunk header structure - compatible with CLI
 */
export interface ChunkHeader {
  index: number;
  size: number;
  checksum: Uint8Array; // First 8 bytes of BLAKE3 hash
}

export class ChunkCodec {
  /**
   * Encode chunk header
   * Format: [4 bytes index][4 bytes size][8 bytes checksum]
   */
  static encodeHeader(header: ChunkHeader): Uint8Array {
    const result = new Uint8Array(16);
    const view = new DataView(result.buffer);

    view.setUint32(0, header.index, false);
    view.setUint32(4, header.size, false);
    result.set(header.checksum.slice(0, 8), 8);

    return result;
  }

  /**
   * Decode chunk header
   */
  static decodeHeader(data: Uint8Array): ChunkHeader | null {
    if (data.length < 16) {
      return null;
    }

    const view = new DataView(data.buffer, data.byteOffset);

    return {
      index: view.getUint32(0, false),
      size: view.getUint32(4, false),
      checksum: data.slice(8, 16),
    };
  }

  /**
   * Compute chunk checksum (first 8 bytes of BLAKE3)
   */
  static computeChecksum(data: Uint8Array): Uint8Array {
    return sha256(data).slice(0, 8);
  }

  /**
   * Verify chunk checksum
   */
  static verifyChecksum(data: Uint8Array, expected: Uint8Array): boolean {
    const computed = this.computeChecksum(data);
    if (computed.length !== expected.length) {return false;}

    for (let i = 0; i < computed.length; i++) {
      if (computed[i] !== expected[i]) {return false;}
    }
    return true;
  }
}

/**
 * CLI-compatible relay client
 */
export class CLIRelayClient {
  private ws: WebSocket | null = null;
  private roomId: string = '';
  private onMessage: ((type: MessageType, payload: Uint8Array) => void) | null = null;
  private onConnect: (() => void) | null = null;
  private onDisconnect: (() => void) | null = null;
  private onError: ((error: Error) => void) | null = null;

  constructor(private relayUrl: string = 'wss://relay.tallow.io') {}

  /**
   * Connect to relay with room code
   */
  async connect(code: string): Promise<void> {
    this.roomId = RoomCode.toRoomId(code);
    const url = `${this.relayUrl}/ws?room=${this.roomId}`;

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.onConnect?.();
        resolve();
      };

      this.ws.onerror = (_event) => {
        const error = new Error('WebSocket error');
        this.onError?.(error);
        reject(error);
      };

      this.ws.onclose = () => {
        this.onDisconnect?.();
      };

      this.ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          this.handleBinaryMessage(new Uint8Array(event.data));
        } else if (typeof event.data === 'string') {
          this.handleTextMessage(event.data);
        }
      };
    });
  }

  /**
   * Set event handlers
   */
  setHandlers(handlers: {
    onMessage?: (type: MessageType, payload: Uint8Array) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Error) => void;
  }): void {
    this.onMessage = handlers.onMessage ?? null;
    this.onConnect = handlers.onConnect ?? null;
    this.onDisconnect = handlers.onDisconnect ?? null;
    this.onError = handlers.onError ?? null;
  }

  /**
   * Send a message
   */
  send(type: MessageType, payload: Uint8Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected');
    }

    const message = MessageCodec.encode(type, payload);
    this.ws.send(message);
  }

  /**
   * Send raw bytes
   */
  sendRaw(data: Uint8Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected');
    }
    this.ws.send(data);
  }

  /**
   * Close connection
   */
  close(): void {
    this.ws?.close();
    this.ws = null;
  }

  private handleBinaryMessage(data: Uint8Array): void {
    const decoded = MessageCodec.decode(data);
    if (decoded) {
      this.onMessage?.(decoded.type, decoded.payload);
    }
  }

  private handleTextMessage(text: string): void {
    // Handle relay control messages
    if (text === 'waiting') {
      console.log('[CLI Bridge] Waiting for peer...');
    } else if (text === 'connected' || text === 'joined') {
      console.log('[CLI Bridge] Peer connected');
    } else if (text.startsWith('error:')) {
      this.onError?.(new Error(text));
    }
  }
}

/**
 * Generate a random room code (compatible with CLI wordlist)
 */
export function generateRoomCode(numWords: number = 3): string {
  // Use subset of BIP39-style words that CLI uses
  const words = [
    'alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel',
    'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa',
    'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'xray',
    'yankee', 'zulu', 'apple', 'banana', 'cherry', 'dragon', 'eagle', 'falcon',
    'garden', 'harbor', 'island', 'jungle', 'kernel', 'lemon', 'mango', 'north',
    'orange', 'piano', 'queen', 'river', 'south', 'tower', 'union', 'valley',
    'winter', 'yellow', 'zebra', 'anchor', 'beacon', 'castle', 'desert', 'ember',
  ];

  const selected: string[] = [];
  const array = new Uint32Array(numWords);
  crypto.getRandomValues(array);

  for (let i = 0; i < numWords; i++) {
    const idx = (array[i] ?? 0) % words.length;
    const word = words[idx];
    if (word) {selected.push(word);}
  }

  return selected.join('-');
}

export default {
  RoomCode,
  MessageCodec,
  FileInfoCodec,
  ChunkCodec,
  CLIRelayClient,
  generateRoomCode,
  MessageType,
  ErrorCode,
  PROTOCOL_VERSION,
  CHUNK_SIZE,
};

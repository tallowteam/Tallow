/* tslint:disable */
/* eslint-disable */

/**
 * Stateful chat session managing encryption counters.
 *
 * The session tracks separate send and receive counters.
 * Send counter starts at 0 (even), receive counter starts at 1 (odd).
 * Both increment by 2 after each use, preventing nonce collision.
 */
export class ChatSession {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Build a 12-byte nonce from the current send counter.
     *
     * Useful for building the nonce to include in a ChatText message.
     */
    currentSendNonce(): Uint8Array;
    /**
     * Decrypt a received chat message.
     *
     * The nonce is reconstructed from the receive counter:
     * `[0u8; 4] || recv_counter.to_be_bytes()`. Increments receive counter
     * by 2 after decryption.
     *
     * Returns the decrypted UTF-8 plaintext.
     */
    decryptMessage(ciphertext: Uint8Array): string;
    /**
     * Decrypt a chat message using an explicit nonce (for interop with CLI
     * messages that carry their nonce in the ChatText message).
     *
     * Does NOT auto-increment the receive counter. Use this when the nonce
     * is provided by the wire message.
     */
    decryptMessageWithNonce(ciphertext: Uint8Array, nonce: Uint8Array): string;
    /**
     * Encrypt a chat message text.
     *
     * Uses nonce `[0u8; 4] || send_counter.to_be_bytes()` and AAD
     * `b"tallow-chat-v1"`. Increments send counter by 2 after encryption.
     *
     * Returns the AES-256-GCM ciphertext with appended authentication tag.
     */
    encryptMessage(text: string): Uint8Array;
    /**
     * Create a new chat session with the given 32-byte session key.
     *
     * Send counter starts at 0 (even), receive counter at 1 (odd).
     */
    constructor(session_key: Uint8Array);
    /**
     * Encode a ChatText wire message from encrypted data.
     *
     * * `message_id` - 16-byte unique message ID
     * * `sequence`   - Monotonic sequence number
     * * `ciphertext` - AES-256-GCM encrypted chat text
     * * `nonce`      - 12-byte nonce used for encryption
     */
    prepareChatText(message_id: Uint8Array, sequence: bigint, ciphertext: Uint8Array, nonce: Uint8Array): Uint8Array;
    /**
     * Encode a TypingIndicator wire message.
     */
    prepareTypingIndicator(typing: boolean): Uint8Array;
    /**
     * Get the current receive counter value.
     */
    receiveCounter(): bigint;
    /**
     * Get the current send counter value.
     */
    sendCounter(): bigint;
}

/**
 * File transfer session with chunk encryption/decryption.
 *
 * Owns the session key and transfer ID. Provides methods to prepare
 * encrypted chunks for sending and decrypt received chunks.
 *
 * CRITICAL: The AAD and nonce construction here MUST match the CLI exactly.
 * See `crates/tallow-protocol/src/transfer/chunking.rs`:
 * - `build_chunk_aad(transfer_id, chunk_index)` = transfer_id || index.to_be_bytes()
 * - `build_chunk_nonce(chunk_index)` = [0u8; 4] || index.to_be_bytes()
 */
export class TransferSession {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Get the current chunk index (for progress tracking).
     */
    currentChunkIndex(): bigint;
    /**
     * Decrypt a chunk from a received Chunk message.
     *
     * * `index` - The chunk index from the Chunk message
     * * `encrypted_data` - The `data` field from the Chunk message
     *
     * Returns decrypted plaintext bytes.
     */
    decryptChunk(index: bigint, encrypted_data: Uint8Array): Uint8Array;
    /**
     * Create a new transfer session.
     *
     * * `session_key` - 32-byte session key derived from KEM handshake
     * * `transfer_id` - 16-byte random transfer identifier
     */
    constructor(session_key: Uint8Array, transfer_id: Uint8Array);
    /**
     * Prepare an Ack message for a received chunk.
     *
     * * `index` - The chunk index to acknowledge
     */
    prepareAck(index: bigint): Uint8Array;
    /**
     * Encrypt a chunk and encode it as a Chunk wire message.
     *
     * * `index` - 0-based chunk index (global across all files)
     * * `total` - Total chunk count (set on final chunk, None otherwise)
     * * `plaintext` - Raw chunk data (up to 64KB)
     *
     * The AAD binds transfer_id + chunk_index to prevent reordering attacks.
     * The nonce is counter-based: [0u8; 4] || index.to_be_bytes().
     *
     * Returns postcard-encoded Chunk message with encrypted data.
     */
    prepareChunk(index: bigint, total: bigint | null | undefined, plaintext: Uint8Array): Uint8Array;
    /**
     * Prepare a FileAccept message.
     */
    prepareFileAccept(): Uint8Array;
    /**
     * Prepare a FileOffer message.
     *
     * * `manifest_bytes` - Postcard-encoded manifest (from `compute_file_manifest`)
     *
     * Returns postcard-encoded FileOffer message bytes.
     */
    prepareFileOffer(manifest_bytes: Uint8Array): Uint8Array;
    /**
     * Prepare a FileReject message.
     *
     * * `reason` - Reason for rejection
     */
    prepareFileReject(reason: string): Uint8Array;
    /**
     * Prepare a TransferComplete message.
     *
     * * `hash` - 32-byte BLAKE3 hash of the complete transfer
     * * `merkle_root` - Optional 32-byte Merkle root of chunk hashes
     */
    prepareTransferComplete(hash: Uint8Array, merkle_root?: Uint8Array | null): Uint8Array;
    /**
     * Get the transfer ID.
     */
    transferId(): Uint8Array;
}

/**
 * Result of a KEM encapsulation: ciphertext + shared secret.
 */
export class WasmEncapsulated {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * The ciphertext to send to the keypair owner for decapsulation.
     */
    ciphertext(): Uint8Array;
    /**
     * The 32-byte shared secret (identical to what decapsulate returns).
     */
    sharedSecret(): Uint8Array;
}

/**
 * Hybrid post-quantum keypair (ML-KEM-1024 + X25519).
 *
 * Generate with `WasmKeyPair::generate()`, then use `encapsulate()` and
 * `decapsulate()` for key exchange with a peer.
 */
export class WasmKeyPair {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Decapsulate a shared secret from a hybrid ciphertext.
     *
     * `ciphertext` must be the bincode-encoded `Ciphertext` from the peer's
     * `encapsulate()` call.
     *
     * Returns the 32-byte shared secret.
     */
    decapsulate(ciphertext: Uint8Array): Uint8Array;
    /**
     * Generate a new ephemeral hybrid ML-KEM-1024 + X25519 keypair.
     */
    static generate(): WasmKeyPair;
    /**
     * Serialized public key bytes (bincode-encoded hybrid PublicKey).
     *
     * Send these to the peer so they can encapsulate a shared secret to you.
     */
    publicKeyBytes(): Uint8Array;
}

/**
 * WebSocket transport helper for preparing room messages.
 *
 * Does NOT own the WebSocket connection (TypeScript manages that).
 * Provides message encoding/decoding for room operations.
 */
export class WsTransport {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Create a new WsTransport helper.
     */
    constructor();
    /**
     * Parse a room response message from the relay.
     *
     * Returns a JsValue with one of:
     * - `{type: "RoomJoined", peer_present: boolean}`
     * - `{type: "RoomJoinedMulti", peer_id: number, existing_peers: number[]}`
     * - `{type: "PeerArrived"}`
     * - `{type: "PeerJoinedRoom", peer_id: number}`
     * - `{type: "PeerLeftRoom", peer_id: number}`
     * - `{type: "Unknown", raw: string}` for other message types
     */
    parseRoomResponse(data: Uint8Array): any;
    /**
     * Prepare a RoomJoin message (legacy 2-peer rooms) ready to send via WebSocket.
     *
     * * `room_id` - 32-byte BLAKE3 hash of the code phrase
     * * `password_hash` - Optional BLAKE3 hash of relay password (or `None`)
     *
     * Returns postcard-encoded bytes ready to send as a WebSocket binary message.
     */
    prepareRoomJoin(room_id: Uint8Array, password_hash?: Uint8Array | null): Uint8Array;
    /**
     * Prepare a RoomJoinMulti message (multi-peer rooms) ready to send.
     *
     * * `room_id` - 32-byte BLAKE3 hash of the code phrase
     * * `password_hash` - Optional BLAKE3 hash of relay password
     * * `capacity` - Requested room capacity (0 = server default)
     *
     * Returns postcard-encoded bytes.
     */
    prepareRoomJoinMulti(room_id: Uint8Array, password_hash: Uint8Array | null | undefined, capacity: number): Uint8Array;
}

/**
 * Derive a room ID from a code phrase using BLAKE3.
 *
 * This MUST produce the same output as the CLI's `derive_room_id` so that
 * browser and native clients join the same relay room.
 */
export function blake3DeriveRoomId(code_phrase: string): Uint8Array;

/**
 * Compute a 32-byte BLAKE3 hash of the input data.
 */
export function blake3Hash(data: Uint8Array): Uint8Array;

/**
 * Compute a file manifest from a JSON array of file descriptions.
 *
 * Input: JSON string like `[{"name":"photo.jpg","size":1024,"path":"photos/photo.jpg"}]`
 *
 * Returns postcard-encoded manifest bytes compatible with the CLI's FileManifest.
 * The BLAKE3 hashes are zero-filled initially — the browser computes them
 * during the actual file reading phase.
 */
export function computeFileManifest(files_json: string): Uint8Array;

/**
 * Decode postcard bytes to a Message (returned as JsValue).
 */
export function decodeMessage(bytes: Uint8Array): any;

/**
 * Decrypt a chat message with AES-256-GCM.
 *
 * Uses the same nonce and AAD format as `encryptChatMessage`.
 *
 * Returns the decrypted UTF-8 string.
 */
export function decryptChatMessage(key: Uint8Array, counter: bigint, ciphertext: Uint8Array): string;

/**
 * Decrypt a data chunk with AES-256-GCM.
 *
 * Uses the same counter-based nonce as `encryptChunk`.
 *
 * Returns plaintext if authentication succeeds.
 */
export function decryptChunk(key: Uint8Array, nonce_counter: bigint, aad: Uint8Array, ciphertext: Uint8Array): Uint8Array;

/**
 * Detect the content type of clipboard text.
 *
 * Returns one of: "url", "code", "text".
 * Matches the heuristics used by the CLI's `tallow clip` content detection.
 */
export function detectContentType(text: string): string;

/**
 * Encode an Ack message.
 *
 * * `transfer_id` - 16-byte transfer identifier
 * * `index`       - Acknowledged chunk index
 */
export function encodeAck(transfer_id: Uint8Array, index: bigint): Uint8Array;

/**
 * Encode a ChatText message.
 *
 * * `message_id` - 16-byte unique message ID
 * * `sequence`   - Monotonic sequence number
 * * `ciphertext` - AES-256-GCM encrypted chat text
 * * `nonce`      - 12-byte nonce used for encryption
 */
export function encodeChatText(message_id: Uint8Array, sequence: bigint, ciphertext: Uint8Array, nonce: Uint8Array): Uint8Array;

/**
 * Encode a Chunk message.
 *
 * * `transfer_id` - 16-byte transfer identifier
 * * `index`       - 0-based chunk index
 * * `total`       - Total chunk count (set on final chunk, None otherwise)
 * * `data`        - Encrypted chunk data
 */
export function encodeChunk(transfer_id: Uint8Array, index: bigint, total: bigint | null | undefined, data: Uint8Array): Uint8Array;

/**
 * Encode a FileAccept message.
 *
 * * `transfer_id` - 16-byte transfer identifier
 */
export function encodeFileAccept(transfer_id: Uint8Array): Uint8Array;

/**
 * Encode a FileOffer message.
 *
 * * `transfer_id` - 16-byte random transfer identifier
 * * `manifest`    - Serialized file manifest bytes
 */
export function encodeFileOffer(transfer_id: Uint8Array, manifest: Uint8Array): Uint8Array;

/**
 * Encode a HandshakeComplete message.
 *
 * * `confirmation` - Receiver's key confirmation tag (32 bytes)
 */
export function encodeHandshakeComplete(confirmation: Uint8Array): Uint8Array;

/**
 * Encode a HandshakeInit message.
 *
 * * `protocol_version` - Protocol version (2 = KEM handshake)
 * * `kem_capabilities`  - Serialized KEM capabilities
 * * `cpace_public`      - CPace initiator public message (32 bytes)
 * * `nonce`             - Random nonce for session binding (16 bytes)
 */
export function encodeHandshakeInit(protocol_version: number, kem_capabilities: Uint8Array, cpace_public: Uint8Array, nonce: Uint8Array): Uint8Array;

/**
 * Encode a HandshakeKem message.
 *
 * * `kem_ciphertext` - Serialized hybrid KEM ciphertext
 * * `confirmation`   - Sender's key confirmation tag (32 bytes)
 */
export function encodeHandshakeKem(kem_ciphertext: Uint8Array, confirmation: Uint8Array): Uint8Array;

/**
 * Encode a HandshakeResponse message.
 *
 * * `selected_kem`   - Selected KEM algorithm discriminant
 * * `cpace_public`   - CPace responder public message (32 bytes)
 * * `kem_public_key` - Serialized hybrid KEM public key
 * * `nonce`          - Random nonce (16 bytes)
 */
export function encodeHandshakeResponse(selected_kem: number, cpace_public: Uint8Array, kem_public_key: Uint8Array, nonce: Uint8Array): Uint8Array;

/**
 * Encode a Message (as JsValue) to postcard bytes.
 *
 * The JsValue must be a valid serde representation of the `Message` enum.
 */
export function encodeMessage(msg: any): Uint8Array;

/**
 * Encode a Ping message.
 */
export function encodePing(): Uint8Array;

/**
 * Encode a Pong message.
 */
export function encodePong(): Uint8Array;

/**
 * Encode a RoomJoin message.
 *
 * * `room_id`       - 32-byte BLAKE3 hash of the code phrase
 * * `password_hash` - Optional BLAKE3 hash of relay password
 */
export function encodeRoomJoin(room_id: Uint8Array, password_hash?: Uint8Array | null): Uint8Array;

/**
 * Encode a TransferComplete message.
 *
 * * `transfer_id` - 16-byte transfer identifier
 * * `hash`        - 32-byte BLAKE3 hash of the manifest
 * * `merkle_root` - Optional 32-byte Merkle root of chunk hashes
 */
export function encodeTransferComplete(transfer_id: Uint8Array, hash: Uint8Array, merkle_root?: Uint8Array | null): Uint8Array;

/**
 * Encode a TypingIndicator message.
 *
 * * `typing` - true = started typing, false = stopped
 */
export function encodeTypingIndicator(typing: boolean): Uint8Array;

/**
 * Encrypt a chat message with AES-256-GCM.
 *
 * Uses nonce format `[0u8; 4] || counter.to_be_bytes()` and
 * AAD `b"tallow-chat-v1"`. Counter should increment by 2 between calls
 * (even for sender, odd for receiver) to prevent nonce collision.
 *
 * Returns ciphertext with authentication tag.
 */
export function encryptChatMessage(key: Uint8Array, counter: bigint, plaintext: string): Uint8Array;

/**
 * Encrypt a data chunk with AES-256-GCM.
 *
 * Builds a 12-byte counter-based nonce from `nonce_counter`:
 * `[0u8; 4] || counter.to_be_bytes()`.
 *
 * Returns ciphertext with appended authentication tag.
 */
export function encryptChunk(key: Uint8Array, nonce_counter: bigint, aad: Uint8Array, plaintext: Uint8Array): Uint8Array;

/**
 * Derive key material using HKDF-SHA256.
 *
 * * `ikm`        - Input key material
 * * `salt`       - Salt value (can be empty)
 * * `info`       - Application-specific context
 * * `output_len` - Desired output length in bytes
 */
export function hkdfDerive(ikm: Uint8Array, salt: Uint8Array, info: Uint8Array, output_len: number): Uint8Array;

/**
 * Initialize WASM module (called automatically on load)
 */
export function init(): void;

/**
 * Encapsulate a shared secret to a peer's hybrid public key.
 *
 * `public_key` must be bincode-encoded bytes from `WasmKeyPair::publicKeyBytes()`.
 *
 * Returns a `WasmEncapsulated` containing the ciphertext (send to peer)
 * and the shared secret (keep locally).
 */
export function kemEncapsulate(public_key: Uint8Array): WasmEncapsulated;

/**
 * Parse a manifest to determine if it represents a clipboard transfer.
 *
 * Returns a JsValue object with:
 * - `is_clipboard: bool`
 * - `content_type: string`
 * - `size: number`
 */
export function parseClipboardContent(manifest_bytes: Uint8Array): any;

/**
 * Parse a postcard-encoded file manifest into a JavaScript-friendly object.
 *
 * Returns a JsValue with structure:
 * ```json
 * {
 *   "files": [{"path": "photo.jpg", "size": 1024, "chunk_count": 1}],
 *   "total_size": 1024,
 *   "total_chunks": 1,
 *   "chunk_size": 65536,
 *   "compression": null
 * }
 * ```
 */
export function parseFileManifest(manifest_bytes: Uint8Array): any;

/**
 * Prepare a clipboard manifest compatible with the CLI's clip format.
 *
 * Returns a JSON-encoded manifest describing the clipboard content.
 * The manifest is then sent as a FileOffer's manifest field.
 *
 * * `content_type` - "text", "url", "code", or "image/png"
 * * `data_size`    - Size of the clipboard data in bytes
 */
export function prepareClipboardManifest(content_type: string, data_size: bigint): Uint8Array;

/**
 * Strip ANSI escape sequences and control characters from display text.
 *
 * Use on any string from the network before showing to the user.
 * Preserves newlines and tabs.
 */
export function sanitizeDisplayText(input: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_chatsession_free: (a: number, b: number) => void;
    readonly __wbg_transfersession_free: (a: number, b: number) => void;
    readonly __wbg_wasmencapsulated_free: (a: number, b: number) => void;
    readonly __wbg_wasmkeypair_free: (a: number, b: number) => void;
    readonly __wbg_wstransport_free: (a: number, b: number) => void;
    readonly blake3DeriveRoomId: (a: number, b: number, c: number) => void;
    readonly chatsession_currentSendNonce: (a: number, b: number) => void;
    readonly chatsession_decryptMessage: (a: number, b: number, c: number, d: number) => void;
    readonly chatsession_decryptMessageWithNonce: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly chatsession_encryptMessage: (a: number, b: number, c: number, d: number) => void;
    readonly chatsession_new: (a: number, b: number, c: number) => void;
    readonly chatsession_prepareChatText: (a: number, b: number, c: number, d: number, e: bigint, f: number, g: number, h: number, i: number) => void;
    readonly chatsession_prepareTypingIndicator: (a: number, b: number, c: number) => void;
    readonly chatsession_receiveCounter: (a: number) => bigint;
    readonly chatsession_sendCounter: (a: number) => bigint;
    readonly computeFileManifest: (a: number, b: number, c: number) => void;
    readonly decodeMessage: (a: number, b: number, c: number) => void;
    readonly decryptChatMessage: (a: number, b: number, c: number, d: bigint, e: number, f: number) => void;
    readonly decryptChunk: (a: number, b: number, c: number, d: bigint, e: number, f: number, g: number, h: number) => void;
    readonly detectContentType: (a: number, b: number, c: number) => void;
    readonly encodeAck: (a: number, b: number, c: number, d: bigint) => void;
    readonly encodeChatText: (a: number, b: number, c: number, d: bigint, e: number, f: number, g: number, h: number) => void;
    readonly encodeChunk: (a: number, b: number, c: number, d: bigint, e: number, f: bigint, g: number, h: number) => void;
    readonly encodeFileAccept: (a: number, b: number, c: number) => void;
    readonly encodeFileOffer: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly encodeHandshakeComplete: (a: number, b: number, c: number) => void;
    readonly encodeHandshakeInit: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
    readonly encodeHandshakeKem: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly encodeHandshakeResponse: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
    readonly encodeMessage: (a: number, b: number) => void;
    readonly encodePing: (a: number) => void;
    readonly encodePong: (a: number) => void;
    readonly encodeRoomJoin: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly encodeTransferComplete: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly encodeTypingIndicator: (a: number, b: number) => void;
    readonly encryptChatMessage: (a: number, b: number, c: number, d: bigint, e: number, f: number) => void;
    readonly encryptChunk: (a: number, b: number, c: number, d: bigint, e: number, f: number, g: number, h: number) => void;
    readonly hkdfDerive: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
    readonly init: () => void;
    readonly kemEncapsulate: (a: number, b: number, c: number) => void;
    readonly parseClipboardContent: (a: number, b: number, c: number) => void;
    readonly parseFileManifest: (a: number, b: number, c: number) => void;
    readonly prepareClipboardManifest: (a: number, b: number, c: number, d: bigint) => void;
    readonly sanitizeDisplayText: (a: number, b: number, c: number) => void;
    readonly transfersession_currentChunkIndex: (a: number) => bigint;
    readonly transfersession_decryptChunk: (a: number, b: number, c: bigint, d: number, e: number) => void;
    readonly transfersession_new: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly transfersession_prepareAck: (a: number, b: number, c: bigint) => void;
    readonly transfersession_prepareChunk: (a: number, b: number, c: bigint, d: number, e: bigint, f: number, g: number) => void;
    readonly transfersession_prepareFileAccept: (a: number, b: number) => void;
    readonly transfersession_prepareFileOffer: (a: number, b: number, c: number, d: number) => void;
    readonly transfersession_prepareFileReject: (a: number, b: number, c: number, d: number) => void;
    readonly transfersession_prepareTransferComplete: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly transfersession_transferId: (a: number, b: number) => void;
    readonly wasmencapsulated_ciphertext: (a: number, b: number) => void;
    readonly wasmencapsulated_sharedSecret: (a: number, b: number) => void;
    readonly wasmkeypair_decapsulate: (a: number, b: number, c: number, d: number) => void;
    readonly wasmkeypair_generate: (a: number) => void;
    readonly wasmkeypair_publicKeyBytes: (a: number, b: number) => void;
    readonly wstransport_new: () => number;
    readonly wstransport_parseRoomResponse: (a: number, b: number, c: number, d: number) => void;
    readonly wstransport_prepareRoomJoin: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly wstransport_prepareRoomJoinMulti: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly blake3Hash: (a: number, b: number, c: number) => void;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number) => void;
    readonly __wbindgen_export4: (a: number, b: number, c: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;

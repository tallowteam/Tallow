// web/wasm.ts
// Loads and initializes the tallow-web WASM module.
// All other TypeScript modules import WASM functionality through this bridge.

// The wasm-bindgen CLI generates these files in web/pkg/
// Build: cargo build -p tallow-web --target wasm32-unknown-unknown --release
// Bind: wasm-bindgen --target web --out-dir web/pkg target/wasm32-unknown-unknown/release/tallow_web.wasm
import init, {
    // Crypto
    WasmKeyPair,
    WasmEncapsulated,
    kemEncapsulate,
    encryptChunk,
    decryptChunk,
    blake3Hash,
    blake3DeriveRoomId,
    hkdfDerive,
    encryptChatMessage,
    decryptChatMessage,
    // Codec
    encodeMessage,
    decodeMessage,
    encodeRoomJoin,
    encodeFileOffer,
    encodeFileAccept,
    encodeChunk,
    encodeAck,
    encodeChatText,
    encodeTypingIndicator,
    encodeHandshakeInit,
    encodeHandshakeResponse,
    encodeHandshakeKem,
    encodeHandshakeComplete,
    encodeTransferComplete,
    encodePing,
    encodePong,
    sanitizeDisplayText,
    // Transport
    WsTransport,
    // Transfer
    TransferSession,
    // File I/O
    computeFileManifest,
    parseFileManifest,
    // Clipboard
    detectContentType,
    prepareClipboardManifest,
    parseClipboardContent,
    // Chat session
    ChatSession,
} from './pkg/tallow_web.js';

let initialized = false;

/**
 * Initialize the WASM module. Must be called before any WASM operations.
 * Safe to call multiple times — only initializes once.
 */
export async function initWasm(): Promise<void> {
    if (!initialized) {
        await init();
        initialized = true;
    }
}

/**
 * Check if WASM has been initialized.
 */
export function isWasmReady(): boolean {
    return initialized;
}

// Re-export all WASM types and functions for use by other modules
export {
    // Crypto
    WasmKeyPair,
    WasmEncapsulated,
    kemEncapsulate,
    encryptChunk,
    decryptChunk,
    blake3Hash,
    blake3DeriveRoomId,
    hkdfDerive,
    encryptChatMessage,
    decryptChatMessage,
    // Codec
    encodeMessage,
    decodeMessage,
    encodeRoomJoin,
    encodeFileOffer,
    encodeFileAccept,
    encodeChunk,
    encodeAck,
    encodeChatText,
    encodeTypingIndicator,
    encodeHandshakeInit,
    encodeHandshakeResponse,
    encodeHandshakeKem,
    encodeHandshakeComplete,
    encodeTransferComplete,
    encodePing,
    encodePong,
    sanitizeDisplayText,
    // Transport
    WsTransport,
    // Transfer
    TransferSession,
    // File I/O
    computeFileManifest,
    parseFileManifest,
    // Clipboard
    detectContentType,
    prepareClipboardManifest,
    parseClipboardContent,
    // Chat session
    ChatSession,
};

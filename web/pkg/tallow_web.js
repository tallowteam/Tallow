/* @ts-self-types="./tallow_web.d.ts" */

/**
 * Stateful chat session managing encryption counters.
 *
 * The session tracks separate send and receive counters.
 * Send counter starts at 0 (even), receive counter starts at 1 (odd).
 * Both increment by 2 after each use, preventing nonce collision.
 */
export class ChatSession {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ChatSessionFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_chatsession_free(ptr, 0);
    }
    /**
     * Build a 12-byte nonce from the current send counter.
     *
     * Useful for building the nonce to include in a ChatText message.
     * @returns {Uint8Array}
     */
    currentSendNonce() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.chatsession_currentSendNonce(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export4(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Decrypt a received chat message.
     *
     * The nonce is reconstructed from the receive counter:
     * `[0u8; 4] || recv_counter.to_be_bytes()`. Increments receive counter
     * by 2 after decryption.
     *
     * Returns the decrypted UTF-8 plaintext.
     * @param {Uint8Array} ciphertext
     * @returns {string}
     */
    decryptMessage(ciphertext) {
        let deferred3_0;
        let deferred3_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(ciphertext, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            wasm.chatsession_decryptMessage(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            var ptr2 = r0;
            var len2 = r1;
            if (r3) {
                ptr2 = 0; len2 = 0;
                throw takeObject(r2);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * Decrypt a chat message using an explicit nonce (for interop with CLI
     * messages that carry their nonce in the ChatText message).
     *
     * Does NOT auto-increment the receive counter. Use this when the nonce
     * is provided by the wire message.
     * @param {Uint8Array} ciphertext
     * @param {Uint8Array} nonce
     * @returns {string}
     */
    decryptMessageWithNonce(ciphertext, nonce) {
        let deferred4_0;
        let deferred4_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(ciphertext, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArray8ToWasm0(nonce, wasm.__wbindgen_export);
            const len1 = WASM_VECTOR_LEN;
            wasm.chatsession_decryptMessageWithNonce(retptr, this.__wbg_ptr, ptr0, len0, ptr1, len1);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            var ptr3 = r0;
            var len3 = r1;
            if (r3) {
                ptr3 = 0; len3 = 0;
                throw takeObject(r2);
            }
            deferred4_0 = ptr3;
            deferred4_1 = len3;
            return getStringFromWasm0(ptr3, len3);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export4(deferred4_0, deferred4_1, 1);
        }
    }
    /**
     * Encrypt a chat message text.
     *
     * Uses nonce `[0u8; 4] || send_counter.to_be_bytes()` and AAD
     * `b"tallow-chat-v1"`. Increments send counter by 2 after encryption.
     *
     * Returns the AES-256-GCM ciphertext with appended authentication tag.
     * @param {string} text
     * @returns {Uint8Array}
     */
    encryptMessage(text) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(text, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.chatsession_encryptMessage(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v2 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export4(r0, r1 * 1, 1);
            return v2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a new chat session with the given 32-byte session key.
     *
     * Send counter starts at 0 (even), receive counter at 1 (odd).
     * @param {Uint8Array} session_key
     */
    constructor(session_key) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(session_key, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            wasm.chatsession_new(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            ChatSessionFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Encode a ChatText wire message from encrypted data.
     *
     * * `message_id` - 16-byte unique message ID
     * * `sequence`   - Monotonic sequence number
     * * `ciphertext` - AES-256-GCM encrypted chat text
     * * `nonce`      - 12-byte nonce used for encryption
     * @param {Uint8Array} message_id
     * @param {bigint} sequence
     * @param {Uint8Array} ciphertext
     * @param {Uint8Array} nonce
     * @returns {Uint8Array}
     */
    prepareChatText(message_id, sequence, ciphertext, nonce) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(message_id, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArray8ToWasm0(ciphertext, wasm.__wbindgen_export);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passArray8ToWasm0(nonce, wasm.__wbindgen_export);
            const len2 = WASM_VECTOR_LEN;
            wasm.chatsession_prepareChatText(retptr, this.__wbg_ptr, ptr0, len0, sequence, ptr1, len1, ptr2, len2);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v4 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export4(r0, r1 * 1, 1);
            return v4;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Encode a TypingIndicator wire message.
     * @param {boolean} typing
     * @returns {Uint8Array}
     */
    prepareTypingIndicator(typing) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.chatsession_prepareTypingIndicator(retptr, this.__wbg_ptr, typing);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export4(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the current receive counter value.
     * @returns {bigint}
     */
    receiveCounter() {
        const ret = wasm.chatsession_receiveCounter(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * Get the current send counter value.
     * @returns {bigint}
     */
    sendCounter() {
        const ret = wasm.chatsession_sendCounter(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
}
if (Symbol.dispose) ChatSession.prototype[Symbol.dispose] = ChatSession.prototype.free;

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
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransferSessionFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transfersession_free(ptr, 0);
    }
    /**
     * Get the current chunk index (for progress tracking).
     * @returns {bigint}
     */
    currentChunkIndex() {
        const ret = wasm.transfersession_currentChunkIndex(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * Decrypt a chunk from a received Chunk message.
     *
     * * `index` - The chunk index from the Chunk message
     * * `encrypted_data` - The `data` field from the Chunk message
     *
     * Returns decrypted plaintext bytes.
     * @param {bigint} index
     * @param {Uint8Array} encrypted_data
     * @returns {Uint8Array}
     */
    decryptChunk(index, encrypted_data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(encrypted_data, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            wasm.transfersession_decryptChunk(retptr, this.__wbg_ptr, index, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v2 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export4(r0, r1 * 1, 1);
            return v2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a new transfer session.
     *
     * * `session_key` - 32-byte session key derived from KEM handshake
     * * `transfer_id` - 16-byte random transfer identifier
     * @param {Uint8Array} session_key
     * @param {Uint8Array} transfer_id
     */
    constructor(session_key, transfer_id) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(session_key, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArray8ToWasm0(transfer_id, wasm.__wbindgen_export);
            const len1 = WASM_VECTOR_LEN;
            wasm.transfersession_new(retptr, ptr0, len0, ptr1, len1);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            TransferSessionFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Prepare an Ack message for a received chunk.
     *
     * * `index` - The chunk index to acknowledge
     * @param {bigint} index
     * @returns {Uint8Array}
     */
    prepareAck(index) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transfersession_prepareAck(retptr, this.__wbg_ptr, index);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export4(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
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
     * @param {bigint} index
     * @param {bigint | null | undefined} total
     * @param {Uint8Array} plaintext
     * @returns {Uint8Array}
     */
    prepareChunk(index, total, plaintext) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(plaintext, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            wasm.transfersession_prepareChunk(retptr, this.__wbg_ptr, index, !isLikeNone(total), isLikeNone(total) ? BigInt(0) : total, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v2 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export4(r0, r1 * 1, 1);
            return v2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Prepare a FileAccept message.
     * @returns {Uint8Array}
     */
    prepareFileAccept() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transfersession_prepareFileAccept(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export4(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Prepare a FileOffer message.
     *
     * * `manifest_bytes` - Postcard-encoded manifest (from `compute_file_manifest`)
     *
     * Returns postcard-encoded FileOffer message bytes.
     * @param {Uint8Array} manifest_bytes
     * @returns {Uint8Array}
     */
    prepareFileOffer(manifest_bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(manifest_bytes, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            wasm.transfersession_prepareFileOffer(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v2 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export4(r0, r1 * 1, 1);
            return v2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Prepare a FileReject message.
     *
     * * `reason` - Reason for rejection
     * @param {string} reason
     * @returns {Uint8Array}
     */
    prepareFileReject(reason) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(reason, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.transfersession_prepareFileReject(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v2 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export4(r0, r1 * 1, 1);
            return v2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Prepare a TransferComplete message.
     *
     * * `hash` - 32-byte BLAKE3 hash of the complete transfer
     * * `merkle_root` - Optional 32-byte Merkle root of chunk hashes
     * @param {Uint8Array} hash
     * @param {Uint8Array | null} [merkle_root]
     * @returns {Uint8Array}
     */
    prepareTransferComplete(hash, merkle_root) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(hash, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            var ptr1 = isLikeNone(merkle_root) ? 0 : passArray8ToWasm0(merkle_root, wasm.__wbindgen_export);
            var len1 = WASM_VECTOR_LEN;
            wasm.transfersession_prepareTransferComplete(retptr, this.__wbg_ptr, ptr0, len0, ptr1, len1);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v3 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export4(r0, r1 * 1, 1);
            return v3;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the transfer ID.
     * @returns {Uint8Array}
     */
    transferId() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transfersession_transferId(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export4(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
if (Symbol.dispose) TransferSession.prototype[Symbol.dispose] = TransferSession.prototype.free;

/**
 * Result of a KEM encapsulation: ciphertext + shared secret.
 */
export class WasmEncapsulated {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmEncapsulated.prototype);
        obj.__wbg_ptr = ptr;
        WasmEncapsulatedFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmEncapsulatedFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmencapsulated_free(ptr, 0);
    }
    /**
     * The ciphertext to send to the keypair owner for decapsulation.
     * @returns {Uint8Array}
     */
    ciphertext() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.wasmencapsulated_ciphertext(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export4(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * The 32-byte shared secret (identical to what decapsulate returns).
     * @returns {Uint8Array}
     */
    sharedSecret() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.wasmencapsulated_sharedSecret(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export4(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
if (Symbol.dispose) WasmEncapsulated.prototype[Symbol.dispose] = WasmEncapsulated.prototype.free;

/**
 * Hybrid post-quantum keypair (ML-KEM-1024 + X25519).
 *
 * Generate with `WasmKeyPair::generate()`, then use `encapsulate()` and
 * `decapsulate()` for key exchange with a peer.
 */
export class WasmKeyPair {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmKeyPair.prototype);
        obj.__wbg_ptr = ptr;
        WasmKeyPairFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmKeyPairFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmkeypair_free(ptr, 0);
    }
    /**
     * Decapsulate a shared secret from a hybrid ciphertext.
     *
     * `ciphertext` must be the bincode-encoded `Ciphertext` from the peer's
     * `encapsulate()` call.
     *
     * Returns the 32-byte shared secret.
     * @param {Uint8Array} ciphertext
     * @returns {Uint8Array}
     */
    decapsulate(ciphertext) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(ciphertext, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            wasm.wasmkeypair_decapsulate(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v2 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export4(r0, r1 * 1, 1);
            return v2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Generate a new ephemeral hybrid ML-KEM-1024 + X25519 keypair.
     * @returns {WasmKeyPair}
     */
    static generate() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.wasmkeypair_generate(retptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return WasmKeyPair.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Serialized public key bytes (bincode-encoded hybrid PublicKey).
     *
     * Send these to the peer so they can encapsulate a shared secret to you.
     * @returns {Uint8Array}
     */
    publicKeyBytes() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.wasmkeypair_publicKeyBytes(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export4(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
if (Symbol.dispose) WasmKeyPair.prototype[Symbol.dispose] = WasmKeyPair.prototype.free;

/**
 * WebSocket transport helper for preparing room messages.
 *
 * Does NOT own the WebSocket connection (TypeScript manages that).
 * Provides message encoding/decoding for room operations.
 */
export class WsTransport {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WsTransportFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wstransport_free(ptr, 0);
    }
    /**
     * Create a new WsTransport helper.
     */
    constructor() {
        const ret = wasm.wstransport_new();
        this.__wbg_ptr = ret >>> 0;
        WsTransportFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
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
     * @param {Uint8Array} data
     * @returns {any}
     */
    parseRoomResponse(data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            wasm.wstransport_parseRoomResponse(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Prepare a RoomJoin message (legacy 2-peer rooms) ready to send via WebSocket.
     *
     * * `room_id` - 32-byte BLAKE3 hash of the code phrase
     * * `password_hash` - Optional BLAKE3 hash of relay password (or `None`)
     *
     * Returns postcard-encoded bytes ready to send as a WebSocket binary message.
     * @param {Uint8Array} room_id
     * @param {Uint8Array | null} [password_hash]
     * @returns {Uint8Array}
     */
    prepareRoomJoin(room_id, password_hash) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(room_id, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            var ptr1 = isLikeNone(password_hash) ? 0 : passArray8ToWasm0(password_hash, wasm.__wbindgen_export);
            var len1 = WASM_VECTOR_LEN;
            wasm.wstransport_prepareRoomJoin(retptr, this.__wbg_ptr, ptr0, len0, ptr1, len1);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v3 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export4(r0, r1 * 1, 1);
            return v3;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Prepare a RoomJoinMulti message (multi-peer rooms) ready to send.
     *
     * * `room_id` - 32-byte BLAKE3 hash of the code phrase
     * * `password_hash` - Optional BLAKE3 hash of relay password
     * * `capacity` - Requested room capacity (0 = server default)
     *
     * Returns postcard-encoded bytes.
     * @param {Uint8Array} room_id
     * @param {Uint8Array | null | undefined} password_hash
     * @param {number} capacity
     * @returns {Uint8Array}
     */
    prepareRoomJoinMulti(room_id, password_hash, capacity) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(room_id, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            var ptr1 = isLikeNone(password_hash) ? 0 : passArray8ToWasm0(password_hash, wasm.__wbindgen_export);
            var len1 = WASM_VECTOR_LEN;
            wasm.wstransport_prepareRoomJoinMulti(retptr, this.__wbg_ptr, ptr0, len0, ptr1, len1, capacity);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v3 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export4(r0, r1 * 1, 1);
            return v3;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
if (Symbol.dispose) WsTransport.prototype[Symbol.dispose] = WsTransport.prototype.free;

/**
 * Derive a room ID from a code phrase using BLAKE3.
 *
 * This MUST produce the same output as the CLI's `derive_room_id` so that
 * browser and native clients join the same relay room.
 * @param {string} code_phrase
 * @returns {Uint8Array}
 */
export function blake3DeriveRoomId(code_phrase) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(code_phrase, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        wasm.blake3DeriveRoomId(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v2 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export4(r0, r1 * 1, 1);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Compute a 32-byte BLAKE3 hash of the input data.
 * @param {Uint8Array} data
 * @returns {Uint8Array}
 */
export function blake3Hash(data) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        wasm.blake3DeriveRoomId(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v2 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export4(r0, r1 * 1, 1);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Compute a file manifest from a JSON array of file descriptions.
 *
 * Input: JSON string like `[{"name":"photo.jpg","size":1024,"path":"photos/photo.jpg"}]`
 *
 * Returns postcard-encoded manifest bytes compatible with the CLI's FileManifest.
 * The BLAKE3 hashes are zero-filled initially — the browser computes them
 * during the actual file reading phase.
 * @param {string} files_json
 * @returns {Uint8Array}
 */
export function computeFileManifest(files_json) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(files_json, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        wasm.computeFileManifest(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v2 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export4(r0, r1 * 1, 1);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Decode postcard bytes to a Message (returned as JsValue).
 * @param {Uint8Array} bytes
 * @returns {any}
 */
export function decodeMessage(bytes) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        wasm.decodeMessage(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return takeObject(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Decrypt a chat message with AES-256-GCM.
 *
 * Uses the same nonce and AAD format as `encryptChatMessage`.
 *
 * Returns the decrypted UTF-8 string.
 * @param {Uint8Array} key
 * @param {bigint} counter
 * @param {Uint8Array} ciphertext
 * @returns {string}
 */
export function decryptChatMessage(key, counter, ciphertext) {
    let deferred4_0;
    let deferred4_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(key, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(ciphertext, wasm.__wbindgen_export);
        const len1 = WASM_VECTOR_LEN;
        wasm.decryptChatMessage(retptr, ptr0, len0, counter, ptr1, len1);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        var ptr3 = r0;
        var len3 = r1;
        if (r3) {
            ptr3 = 0; len3 = 0;
            throw takeObject(r2);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export4(deferred4_0, deferred4_1, 1);
    }
}

/**
 * Decrypt a data chunk with AES-256-GCM.
 *
 * Uses the same counter-based nonce as `encryptChunk`.
 *
 * Returns plaintext if authentication succeeds.
 * @param {Uint8Array} key
 * @param {bigint} nonce_counter
 * @param {Uint8Array} aad
 * @param {Uint8Array} ciphertext
 * @returns {Uint8Array}
 */
export function decryptChunk(key, nonce_counter, aad, ciphertext) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(key, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(aad, wasm.__wbindgen_export);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray8ToWasm0(ciphertext, wasm.__wbindgen_export);
        const len2 = WASM_VECTOR_LEN;
        wasm.decryptChunk(retptr, ptr0, len0, nonce_counter, ptr1, len1, ptr2, len2);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v4 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export4(r0, r1 * 1, 1);
        return v4;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Detect the content type of clipboard text.
 *
 * Returns one of: "url", "code", "text".
 * Matches the heuristics used by the CLI's `tallow clip` content detection.
 * @param {string} text
 * @returns {string}
 */
export function detectContentType(text) {
    let deferred2_0;
    let deferred2_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(text, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        wasm.detectContentType(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred2_0 = r0;
        deferred2_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export4(deferred2_0, deferred2_1, 1);
    }
}

/**
 * Encode an Ack message.
 *
 * * `transfer_id` - 16-byte transfer identifier
 * * `index`       - Acknowledged chunk index
 * @param {Uint8Array} transfer_id
 * @param {bigint} index
 * @returns {Uint8Array}
 */
export function encodeAck(transfer_id, index) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(transfer_id, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        wasm.encodeAck(retptr, ptr0, len0, index);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v2 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export4(r0, r1 * 1, 1);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Encode a ChatText message.
 *
 * * `message_id` - 16-byte unique message ID
 * * `sequence`   - Monotonic sequence number
 * * `ciphertext` - AES-256-GCM encrypted chat text
 * * `nonce`      - 12-byte nonce used for encryption
 * @param {Uint8Array} message_id
 * @param {bigint} sequence
 * @param {Uint8Array} ciphertext
 * @param {Uint8Array} nonce
 * @returns {Uint8Array}
 */
export function encodeChatText(message_id, sequence, ciphertext, nonce) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(message_id, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(ciphertext, wasm.__wbindgen_export);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray8ToWasm0(nonce, wasm.__wbindgen_export);
        const len2 = WASM_VECTOR_LEN;
        wasm.encodeChatText(retptr, ptr0, len0, sequence, ptr1, len1, ptr2, len2);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v4 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export4(r0, r1 * 1, 1);
        return v4;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Encode a Chunk message.
 *
 * * `transfer_id` - 16-byte transfer identifier
 * * `index`       - 0-based chunk index
 * * `total`       - Total chunk count (set on final chunk, None otherwise)
 * * `data`        - Encrypted chunk data
 * @param {Uint8Array} transfer_id
 * @param {bigint} index
 * @param {bigint | null | undefined} total
 * @param {Uint8Array} data
 * @returns {Uint8Array}
 */
export function encodeChunk(transfer_id, index, total, data) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(transfer_id, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(data, wasm.__wbindgen_export);
        const len1 = WASM_VECTOR_LEN;
        wasm.encodeChunk(retptr, ptr0, len0, index, !isLikeNone(total), isLikeNone(total) ? BigInt(0) : total, ptr1, len1);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v3 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export4(r0, r1 * 1, 1);
        return v3;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Encode a FileAccept message.
 *
 * * `transfer_id` - 16-byte transfer identifier
 * @param {Uint8Array} transfer_id
 * @returns {Uint8Array}
 */
export function encodeFileAccept(transfer_id) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(transfer_id, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        wasm.encodeFileAccept(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v2 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export4(r0, r1 * 1, 1);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Encode a FileOffer message.
 *
 * * `transfer_id` - 16-byte random transfer identifier
 * * `manifest`    - Serialized file manifest bytes
 * @param {Uint8Array} transfer_id
 * @param {Uint8Array} manifest
 * @returns {Uint8Array}
 */
export function encodeFileOffer(transfer_id, manifest) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(transfer_id, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(manifest, wasm.__wbindgen_export);
        const len1 = WASM_VECTOR_LEN;
        wasm.encodeFileOffer(retptr, ptr0, len0, ptr1, len1);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v3 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export4(r0, r1 * 1, 1);
        return v3;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Encode a HandshakeComplete message.
 *
 * * `confirmation` - Receiver's key confirmation tag (32 bytes)
 * @param {Uint8Array} confirmation
 * @returns {Uint8Array}
 */
export function encodeHandshakeComplete(confirmation) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(confirmation, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        wasm.encodeHandshakeComplete(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v2 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export4(r0, r1 * 1, 1);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Encode a HandshakeInit message.
 *
 * * `protocol_version` - Protocol version (2 = KEM handshake)
 * * `kem_capabilities`  - Serialized KEM capabilities
 * * `cpace_public`      - CPace initiator public message (32 bytes)
 * * `nonce`             - Random nonce for session binding (16 bytes)
 * @param {number} protocol_version
 * @param {Uint8Array} kem_capabilities
 * @param {Uint8Array} cpace_public
 * @param {Uint8Array} nonce
 * @returns {Uint8Array}
 */
export function encodeHandshakeInit(protocol_version, kem_capabilities, cpace_public, nonce) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(kem_capabilities, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(cpace_public, wasm.__wbindgen_export);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray8ToWasm0(nonce, wasm.__wbindgen_export);
        const len2 = WASM_VECTOR_LEN;
        wasm.encodeHandshakeInit(retptr, protocol_version, ptr0, len0, ptr1, len1, ptr2, len2);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v4 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export4(r0, r1 * 1, 1);
        return v4;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Encode a HandshakeKem message.
 *
 * * `kem_ciphertext` - Serialized hybrid KEM ciphertext
 * * `confirmation`   - Sender's key confirmation tag (32 bytes)
 * @param {Uint8Array} kem_ciphertext
 * @param {Uint8Array} confirmation
 * @returns {Uint8Array}
 */
export function encodeHandshakeKem(kem_ciphertext, confirmation) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(kem_ciphertext, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(confirmation, wasm.__wbindgen_export);
        const len1 = WASM_VECTOR_LEN;
        wasm.encodeHandshakeKem(retptr, ptr0, len0, ptr1, len1);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v3 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export4(r0, r1 * 1, 1);
        return v3;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Encode a HandshakeResponse message.
 *
 * * `selected_kem`   - Selected KEM algorithm discriminant
 * * `cpace_public`   - CPace responder public message (32 bytes)
 * * `kem_public_key` - Serialized hybrid KEM public key
 * * `nonce`          - Random nonce (16 bytes)
 * @param {number} selected_kem
 * @param {Uint8Array} cpace_public
 * @param {Uint8Array} kem_public_key
 * @param {Uint8Array} nonce
 * @returns {Uint8Array}
 */
export function encodeHandshakeResponse(selected_kem, cpace_public, kem_public_key, nonce) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(cpace_public, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(kem_public_key, wasm.__wbindgen_export);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray8ToWasm0(nonce, wasm.__wbindgen_export);
        const len2 = WASM_VECTOR_LEN;
        wasm.encodeHandshakeResponse(retptr, selected_kem, ptr0, len0, ptr1, len1, ptr2, len2);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v4 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export4(r0, r1 * 1, 1);
        return v4;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Encode a Message (as JsValue) to postcard bytes.
 *
 * The JsValue must be a valid serde representation of the `Message` enum.
 * @param {any} msg
 * @returns {Uint8Array}
 */
export function encodeMessage(msg) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.encodeMessage(retptr, addHeapObject(msg));
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v1 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export4(r0, r1 * 1, 1);
        return v1;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Encode a Ping message.
 * @returns {Uint8Array}
 */
export function encodePing() {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.encodePing(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v1 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export4(r0, r1 * 1, 1);
        return v1;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Encode a Pong message.
 * @returns {Uint8Array}
 */
export function encodePong() {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.encodePong(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v1 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export4(r0, r1 * 1, 1);
        return v1;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Encode a RoomJoin message.
 *
 * * `room_id`       - 32-byte BLAKE3 hash of the code phrase
 * * `password_hash` - Optional BLAKE3 hash of relay password
 * @param {Uint8Array} room_id
 * @param {Uint8Array | null} [password_hash]
 * @returns {Uint8Array}
 */
export function encodeRoomJoin(room_id, password_hash) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(room_id, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(password_hash) ? 0 : passArray8ToWasm0(password_hash, wasm.__wbindgen_export);
        var len1 = WASM_VECTOR_LEN;
        wasm.encodeRoomJoin(retptr, ptr0, len0, ptr1, len1);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v3 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export4(r0, r1 * 1, 1);
        return v3;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Encode a TransferComplete message.
 *
 * * `transfer_id` - 16-byte transfer identifier
 * * `hash`        - 32-byte BLAKE3 hash of the manifest
 * * `merkle_root` - Optional 32-byte Merkle root of chunk hashes
 * @param {Uint8Array} transfer_id
 * @param {Uint8Array} hash
 * @param {Uint8Array | null} [merkle_root]
 * @returns {Uint8Array}
 */
export function encodeTransferComplete(transfer_id, hash, merkle_root) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(transfer_id, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(hash, wasm.__wbindgen_export);
        const len1 = WASM_VECTOR_LEN;
        var ptr2 = isLikeNone(merkle_root) ? 0 : passArray8ToWasm0(merkle_root, wasm.__wbindgen_export);
        var len2 = WASM_VECTOR_LEN;
        wasm.encodeTransferComplete(retptr, ptr0, len0, ptr1, len1, ptr2, len2);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v4 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export4(r0, r1 * 1, 1);
        return v4;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Encode a TypingIndicator message.
 *
 * * `typing` - true = started typing, false = stopped
 * @param {boolean} typing
 * @returns {Uint8Array}
 */
export function encodeTypingIndicator(typing) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.encodeTypingIndicator(retptr, typing);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v1 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export4(r0, r1 * 1, 1);
        return v1;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Encrypt a chat message with AES-256-GCM.
 *
 * Uses nonce format `[0u8; 4] || counter.to_be_bytes()` and
 * AAD `b"tallow-chat-v1"`. Counter should increment by 2 between calls
 * (even for sender, odd for receiver) to prevent nonce collision.
 *
 * Returns ciphertext with authentication tag.
 * @param {Uint8Array} key
 * @param {bigint} counter
 * @param {string} plaintext
 * @returns {Uint8Array}
 */
export function encryptChatMessage(key, counter, plaintext) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(key, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(plaintext, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        wasm.encryptChatMessage(retptr, ptr0, len0, counter, ptr1, len1);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v3 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export4(r0, r1 * 1, 1);
        return v3;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Encrypt a data chunk with AES-256-GCM.
 *
 * Builds a 12-byte counter-based nonce from `nonce_counter`:
 * `[0u8; 4] || counter.to_be_bytes()`.
 *
 * Returns ciphertext with appended authentication tag.
 * @param {Uint8Array} key
 * @param {bigint} nonce_counter
 * @param {Uint8Array} aad
 * @param {Uint8Array} plaintext
 * @returns {Uint8Array}
 */
export function encryptChunk(key, nonce_counter, aad, plaintext) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(key, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(aad, wasm.__wbindgen_export);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray8ToWasm0(plaintext, wasm.__wbindgen_export);
        const len2 = WASM_VECTOR_LEN;
        wasm.encryptChunk(retptr, ptr0, len0, nonce_counter, ptr1, len1, ptr2, len2);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v4 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export4(r0, r1 * 1, 1);
        return v4;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Derive key material using HKDF-SHA256.
 *
 * * `ikm`        - Input key material
 * * `salt`       - Salt value (can be empty)
 * * `info`       - Application-specific context
 * * `output_len` - Desired output length in bytes
 * @param {Uint8Array} ikm
 * @param {Uint8Array} salt
 * @param {Uint8Array} info
 * @param {number} output_len
 * @returns {Uint8Array}
 */
export function hkdfDerive(ikm, salt, info, output_len) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(ikm, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(salt, wasm.__wbindgen_export);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray8ToWasm0(info, wasm.__wbindgen_export);
        const len2 = WASM_VECTOR_LEN;
        wasm.hkdfDerive(retptr, ptr0, len0, ptr1, len1, ptr2, len2, output_len);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v4 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export4(r0, r1 * 1, 1);
        return v4;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Initialize WASM module (called automatically on load)
 */
export function init() {
    wasm.init();
}

/**
 * Encapsulate a shared secret to a peer's hybrid public key.
 *
 * `public_key` must be bincode-encoded bytes from `WasmKeyPair::publicKeyBytes()`.
 *
 * Returns a `WasmEncapsulated` containing the ciphertext (send to peer)
 * and the shared secret (keep locally).
 * @param {Uint8Array} public_key
 * @returns {WasmEncapsulated}
 */
export function kemEncapsulate(public_key) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(public_key, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        wasm.kemEncapsulate(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return WasmEncapsulated.__wrap(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Parse a manifest to determine if it represents a clipboard transfer.
 *
 * Returns a JsValue object with:
 * - `is_clipboard: bool`
 * - `content_type: string`
 * - `size: number`
 * @param {Uint8Array} manifest_bytes
 * @returns {any}
 */
export function parseClipboardContent(manifest_bytes) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(manifest_bytes, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        wasm.parseClipboardContent(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return takeObject(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

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
 * @param {Uint8Array} manifest_bytes
 * @returns {any}
 */
export function parseFileManifest(manifest_bytes) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(manifest_bytes, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        wasm.parseFileManifest(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return takeObject(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Prepare a clipboard manifest compatible with the CLI's clip format.
 *
 * Returns a JSON-encoded manifest describing the clipboard content.
 * The manifest is then sent as a FileOffer's manifest field.
 *
 * * `content_type` - "text", "url", "code", or "image/png"
 * * `data_size`    - Size of the clipboard data in bytes
 * @param {string} content_type
 * @param {bigint} data_size
 * @returns {Uint8Array}
 */
export function prepareClipboardManifest(content_type, data_size) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(content_type, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        wasm.prepareClipboardManifest(retptr, ptr0, len0, data_size);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v2 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export4(r0, r1 * 1, 1);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Strip ANSI escape sequences and control characters from display text.
 *
 * Use on any string from the network before showing to the user.
 * Preserves newlines and tabs.
 * @param {string} input
 * @returns {string}
 */
export function sanitizeDisplayText(input) {
    let deferred2_0;
    let deferred2_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(input, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        wasm.sanitizeDisplayText(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred2_0 = r0;
        deferred2_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export4(deferred2_0, deferred2_1, 1);
    }
}

function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg_Error_ecbf49c1b9d07c30: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return addHeapObject(ret);
        },
        __wbg_Number_7da99b0afe51b89a: function(arg0) {
            const ret = Number(getObject(arg0));
            return ret;
        },
        __wbg_String_8564e559799eccda: function(arg0, arg1) {
            const ret = String(getObject(arg1));
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_bigint_get_as_i64_a4925bc53b16f3d6: function(arg0, arg1) {
            const v = getObject(arg1);
            const ret = typeof(v) === 'bigint' ? v : undefined;
            getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_boolean_get_4a348b369b009243: function(arg0) {
            const v = getObject(arg0);
            const ret = typeof(v) === 'boolean' ? v : undefined;
            return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
        },
        __wbg___wbindgen_debug_string_43c7ccb034739216: function(arg0, arg1) {
            const ret = debugString(getObject(arg1));
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_in_035107858ad0083e: function(arg0, arg1) {
            const ret = getObject(arg0) in getObject(arg1);
            return ret;
        },
        __wbg___wbindgen_is_bigint_15e2d080220c7748: function(arg0) {
            const ret = typeof(getObject(arg0)) === 'bigint';
            return ret;
        },
        __wbg___wbindgen_is_function_18bea6e84080c016: function(arg0) {
            const ret = typeof(getObject(arg0)) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_object_8d3fac158b36498d: function(arg0) {
            const val = getObject(arg0);
            const ret = typeof(val) === 'object' && val !== null;
            return ret;
        },
        __wbg___wbindgen_is_string_4d5f2c5b2acf65b0: function(arg0) {
            const ret = typeof(getObject(arg0)) === 'string';
            return ret;
        },
        __wbg___wbindgen_is_undefined_4a711ea9d2e1ef93: function(arg0) {
            const ret = getObject(arg0) === undefined;
            return ret;
        },
        __wbg___wbindgen_jsval_eq_65f99081d9ee8f4d: function(arg0, arg1) {
            const ret = getObject(arg0) === getObject(arg1);
            return ret;
        },
        __wbg___wbindgen_jsval_loose_eq_1a2067dfb025b5ec: function(arg0, arg1) {
            const ret = getObject(arg0) == getObject(arg1);
            return ret;
        },
        __wbg___wbindgen_number_get_eed4462ef92e1bed: function(arg0, arg1) {
            const obj = getObject(arg1);
            const ret = typeof(obj) === 'number' ? obj : undefined;
            getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_string_get_d09f733449cbf7a2: function(arg0, arg1) {
            const obj = getObject(arg1);
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_df03e93053e0f4bc: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_call_85e5437fa1ab109d: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
            return addHeapObject(ret);
        }, arguments); },
        __wbg_call_df7a43aecab856a8: function() { return handleError(function (arg0, arg1) {
            const ret = getObject(arg0).call(getObject(arg1));
            return addHeapObject(ret);
        }, arguments); },
        __wbg_crypto_38df2bab126b63dc: function(arg0) {
            const ret = getObject(arg0).crypto;
            return addHeapObject(ret);
        },
        __wbg_done_0ad70482cae88a68: function(arg0) {
            const ret = getObject(arg0).done;
            return ret;
        },
        __wbg_entries_d58050057c0390ac: function(arg0) {
            const ret = Object.entries(getObject(arg0));
            return addHeapObject(ret);
        },
        __wbg_error_a6fa202b58aa1cd3: function(arg0, arg1) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                console.error(getStringFromWasm0(arg0, arg1));
            } finally {
                wasm.__wbindgen_export4(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_getRandomValues_c44a50d8cfdaebeb: function() { return handleError(function (arg0, arg1) {
            getObject(arg0).getRandomValues(getObject(arg1));
        }, arguments); },
        __wbg_get_6f5cf69c8f3f094a: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.get(getObject(arg0), getObject(arg1));
            return addHeapObject(ret);
        }, arguments); },
        __wbg_get_c40e2c3262995a8e: function(arg0, arg1) {
            const ret = getObject(arg0)[arg1 >>> 0];
            return addHeapObject(ret);
        },
        __wbg_get_unchecked_3de5bfaaea65f86b: function(arg0, arg1) {
            const ret = getObject(arg0)[arg1 >>> 0];
            return addHeapObject(ret);
        },
        __wbg_get_with_ref_key_6412cf3094599694: function(arg0, arg1) {
            const ret = getObject(arg0)[getObject(arg1)];
            return addHeapObject(ret);
        },
        __wbg_instanceof_ArrayBuffer_d8e4e51f1cf7287a: function(arg0) {
            let result;
            try {
                result = getObject(arg0) instanceof ArrayBuffer;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Uint8Array_6e48d83da6091cc8: function(arg0) {
            let result;
            try {
                result = getObject(arg0) instanceof Uint8Array;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_isArray_2efa5973cef6ec32: function(arg0) {
            const ret = Array.isArray(getObject(arg0));
            return ret;
        },
        __wbg_isSafeInteger_6709fb28be12d738: function(arg0) {
            const ret = Number.isSafeInteger(getObject(arg0));
            return ret;
        },
        __wbg_iterator_e77d2b7575cca5a7: function() {
            const ret = Symbol.iterator;
            return addHeapObject(ret);
        },
        __wbg_length_00dd7227fd4626ad: function(arg0) {
            const ret = getObject(arg0).length;
            return ret;
        },
        __wbg_length_5e07cf181b2745fb: function(arg0) {
            const ret = getObject(arg0).length;
            return ret;
        },
        __wbg_msCrypto_bd5a034af96bcba6: function(arg0) {
            const ret = getObject(arg0).msCrypto;
            return addHeapObject(ret);
        },
        __wbg_new_227d7c05414eb861: function() {
            const ret = new Error();
            return addHeapObject(ret);
        },
        __wbg_new_62f131e968c83d75: function() {
            const ret = new Object();
            return addHeapObject(ret);
        },
        __wbg_new_66075f8c2ea6575e: function() {
            const ret = new Array();
            return addHeapObject(ret);
        },
        __wbg_new_a0479da6258a0d71: function(arg0) {
            const ret = new Uint8Array(getObject(arg0));
            return addHeapObject(ret);
        },
        __wbg_new_with_length_9b57e4a9683723fa: function(arg0) {
            const ret = new Uint8Array(arg0 >>> 0);
            return addHeapObject(ret);
        },
        __wbg_next_5428439dfc1d0362: function() { return handleError(function (arg0) {
            const ret = getObject(arg0).next();
            return addHeapObject(ret);
        }, arguments); },
        __wbg_next_d314789a105729f3: function(arg0) {
            const ret = getObject(arg0).next;
            return addHeapObject(ret);
        },
        __wbg_node_84ea875411254db1: function(arg0) {
            const ret = getObject(arg0).node;
            return addHeapObject(ret);
        },
        __wbg_process_44c7a14e11e9f69e: function(arg0) {
            const ret = getObject(arg0).process;
            return addHeapObject(ret);
        },
        __wbg_prototypesetcall_d1a7133bc8d83aa9: function(arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), getObject(arg2));
        },
        __wbg_randomFillSync_6c25eac9869eb53c: function() { return handleError(function (arg0, arg1) {
            getObject(arg0).randomFillSync(takeObject(arg1));
        }, arguments); },
        __wbg_require_b4edbdcf3e2a1ef0: function() { return handleError(function () {
            const ret = module.require;
            return addHeapObject(ret);
        }, arguments); },
        __wbg_set_6be42768c690e380: function(arg0, arg1, arg2) {
            getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
        },
        __wbg_set_7bf9e2df46e7632c: function(arg0, arg1, arg2) {
            getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
        },
        __wbg_set_8326741805409e83: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
            return ret;
        }, arguments); },
        __wbg_stack_3b0d974bbf31e44f: function(arg0, arg1) {
            const ret = getObject(arg1).stack;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_static_accessor_GLOBAL_THIS_6614f2f4998e3c4c: function() {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        },
        __wbg_static_accessor_GLOBAL_d8e8a2fefe80bc1d: function() {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        },
        __wbg_static_accessor_SELF_e29eaf7c465526b1: function() {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        },
        __wbg_static_accessor_WINDOW_66e7ca3eef30585a: function() {
            const ret = typeof window === 'undefined' ? null : window;
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        },
        __wbg_subarray_f36da54ffa7114f5: function(arg0, arg1, arg2) {
            const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
            return addHeapObject(ret);
        },
        __wbg_value_414b42ce7b3eca22: function(arg0) {
            const ret = getObject(arg0).value;
            return addHeapObject(ret);
        },
        __wbg_versions_276b2795b1c6a219: function(arg0) {
            const ret = getObject(arg0).versions;
            return addHeapObject(ret);
        },
        __wbindgen_cast_0000000000000001: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return addHeapObject(ret);
        },
        __wbindgen_cast_0000000000000002: function(arg0, arg1) {
            // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
            const ret = getArrayU8FromWasm0(arg0, arg1);
            return addHeapObject(ret);
        },
        __wbindgen_cast_0000000000000003: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return addHeapObject(ret);
        },
        __wbindgen_cast_0000000000000004: function(arg0) {
            // Cast intrinsic for `U64 -> Externref`.
            const ret = BigInt.asUintN(64, arg0);
            return addHeapObject(ret);
        },
        __wbindgen_object_clone_ref: function(arg0) {
            const ret = getObject(arg0);
            return addHeapObject(ret);
        },
        __wbindgen_object_drop_ref: function(arg0) {
            takeObject(arg0);
        },
    };
    return {
        __proto__: null,
        "./tallow_web_bg.js": import0,
    };
}

const ChatSessionFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_chatsession_free(ptr >>> 0, 1));
const TransferSessionFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transfersession_free(ptr >>> 0, 1));
const WasmEncapsulatedFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmencapsulated_free(ptr >>> 0, 1));
const WasmKeyPairFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmkeypair_free(ptr >>> 0, 1));
const WsTransportFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wstransport_free(ptr >>> 0, 1));

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getObject(idx) { return heap[idx]; }

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_export3(addHeapObject(e));
    }
}

let heap = new Array(128).fill(undefined);
heap.push(undefined, null, true, false);

let heap_next = heap.length;

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasm;
function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('tallow_web_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };

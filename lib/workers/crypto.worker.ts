/**
 * Crypto Web Worker
 * Offloads heavy cryptographic operations to a background thread
 * to keep the main UI responsive during file encryption/decryption.
 */

// Message types for communication
interface CryptoWorkerMessage {
    type: 'encrypt' | 'decrypt' | 'hash' | 'derive-key';
    id: string;
    payload: unknown;
}

interface EncryptPayload {
    data: ArrayBuffer;
    key: ArrayBuffer;
    nonce?: ArrayBuffer;
}

interface DecryptPayload {
    ciphertext: ArrayBuffer;
    key: ArrayBuffer;
    nonce: ArrayBuffer;
}

interface HashPayload {
    data: ArrayBuffer;
}

interface DeriveKeyPayload {
    password: string;
    salt: ArrayBuffer;
}

// Worker context
const ctx: Worker = self as unknown as Worker;

/**
 * Generate random bytes
 */
function randomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * AES-256-GCM Encryption
 */
async function encrypt(data: ArrayBuffer, key: ArrayBuffer, providedNonce?: ArrayBuffer): Promise<{ ciphertext: ArrayBuffer; nonce: ArrayBuffer }> {
    const nonceArray = providedNonce ? new Uint8Array(providedNonce) : randomBytes(12);

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );

    const ciphertext = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: new Uint8Array(nonceArray) as BufferSource,
            tagLength: 128,
        },
        cryptoKey,
        data
    );

    return {
        ciphertext,
        nonce: new Uint8Array(nonceArray).buffer as ArrayBuffer
    };
}

/**
 * AES-256-GCM Decryption
 */
async function decrypt(ciphertext: ArrayBuffer, key: ArrayBuffer, nonce: ArrayBuffer): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );

    return crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: nonce,
            tagLength: 128,
        },
        cryptoKey,
        ciphertext
    );
}

/**
 * SHA-256 Hash
 */
async function hash(data: ArrayBuffer): Promise<ArrayBuffer> {
    return crypto.subtle.digest('SHA-256', data);
}

/**
 * Derive key from password using PBKDF2
 */
async function deriveKey(password: string, salt: ArrayBuffer): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );

    const keyBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            hash: 'SHA-256',
            salt: salt,
            iterations: 100000,
        },
        passwordKey,
        256
    );

    return keyBits;
}

/**
 * Handle incoming messages
 */
ctx.onmessage = async (event: MessageEvent<CryptoWorkerMessage>) => {
    const { type, id, payload } = event.data;

    try {
        let result: unknown;

        switch (type) {
            case 'encrypt': {
                const { data, key, nonce } = payload as EncryptPayload;
                result = await encrypt(data, key, nonce);
                break;
            }
            case 'decrypt': {
                const { ciphertext, key, nonce } = payload as DecryptPayload;
                result = await decrypt(ciphertext, key, nonce);
                break;
            }
            case 'hash': {
                const { data } = payload as HashPayload;
                result = await hash(data);
                break;
            }
            case 'derive-key': {
                const { password, salt } = payload as DeriveKeyPayload;
                result = await deriveKey(password, salt);
                break;
            }
            default:
                throw new Error(`Unknown message type: ${type}`);
        }

        ctx.postMessage({ id, success: true, result });
    } catch (error) {
        ctx.postMessage({
            id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Signal that worker is ready
ctx.postMessage({ type: 'ready' });

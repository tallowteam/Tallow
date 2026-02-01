/**
 * Generate a UUID v4 string.
 * Falls back to crypto.getRandomValues when crypto.randomUUID is unavailable
 * (non-secure contexts like HTTP on LAN).
 */
export function generateUUID(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    // Fallback: generate UUID v4 from random bytes
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    // Set version (4) and variant (10xx) bits per RFC 4122
    const byte6 = bytes[6];
    const byte8 = bytes[8];
    if (byte6 !== undefined) {bytes[6] = (byte6 & 0x0f) | 0x40;}
    if (byte8 !== undefined) {bytes[8] = (byte8 & 0x3f) | 0x80;}

    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

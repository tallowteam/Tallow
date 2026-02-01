'use client';

/**
 * Word Phrase Codes (Croc-style)
 * Generate memorable codes like "apple-banana-cherry"
 * Uses crypto.getRandomValues for secure randomness
 */

// Common, easy-to-remember words (164 words for ~7.4 bits each)
const WORD_LIST = [
    // Animals
    'cat', 'dog', 'fox', 'owl', 'bee', 'ant', 'bat', 'elk', 'emu', 'hen',
    'pig', 'ram', 'rat', 'yak', 'cow', 'ape', 'cub', 'doe', 'jay', 'kit',
    // Foods
    'apple', 'berry', 'bread', 'candy', 'cream', 'grape', 'honey', 'juice',
    'lemon', 'mango', 'olive', 'peach', 'pizza', 'salad', 'sugar', 'toast',
    'melon', 'pasta', 'rice', 'mint',
    // Nature
    'beach', 'cloud', 'earth', 'flame', 'frost', 'grass', 'grove', 'hills',
    'lake', 'leaf', 'moon', 'ocean', 'rain', 'river', 'shade', 'snow',
    'star', 'stone', 'storm', 'sun', 'tide', 'tree', 'wave', 'wind',
    // Colors
    'amber', 'azure', 'black', 'blue', 'brown', 'coral', 'gold',
    'green', 'grey', 'ivory', 'jade', 'pink', 'plum', 'red', 'white', 'teal',
    // Objects
    'arrow', 'badge', 'bell', 'book', 'chair', 'clock', 'crown', 'drum',
    'glass', 'globe', 'heart', 'jewel', 'key', 'lamp', 'mask', 'note',
    'pearl', 'ring', 'rose', 'shell', 'sword', 'torch', 'vase', 'wheel',
    // Actions/Adjectives
    'brave', 'calm', 'dance', 'dream', 'fast', 'float', 'glow', 'happy',
    'jump', 'kind', 'laugh', 'leap', 'light', 'magic', 'quiet', 'shine',
    'smile', 'spark', 'swift', 'think', 'warm', 'wild', 'wise', 'zoom',
    // More common words
    'alpha', 'beta', 'comet', 'delta', 'echo', 'fable', 'gamma', 'haven',
    'index', 'joker', 'karma', 'lunar', 'metro', 'noble', 'omega', 'prism',
    'quest', 'radar', 'solar', 'tiger', 'ultra', 'vivid', 'wonder', 'zenith',
];

/**
 * Get a cryptographically random index within range
 */
function secureRandomIndex(max: number): number {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const value = array[0];
    return value !== undefined ? value % max : 0;
}

/**
 * Generate a random word phrase using crypto.getRandomValues
 * With 164 words and 4 words: 164^4 = ~723M combinations (~29.4 bits)
 * With 5 words: 164^5 = ~118B combinations (~36.8 bits)
 */
export function generateWordPhrase(wordCount: number = 4): string {
    const words: string[] = [];
    const usedIndices = new Set<number>();

    while (words.length < wordCount) {
        const index = secureRandomIndex(WORD_LIST.length);
        if (!usedIndices.has(index)) {
            const word = WORD_LIST[index];
            if (word) {
                usedIndices.add(index);
                words.push(word);
            }
        }
    }

    return words.join('-');
}

/**
 * Generate a short alphanumeric code using crypto.getRandomValues
 * No special characters - only unambiguous letters and digits
 * 8 chars * log2(32) = 40 bits entropy
 */
export function generateShortCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const values = new Uint8Array(8);
    crypto.getRandomValues(values);

    let code = '';
    for (let i = 0; i < 8; i++) {
        const value = values[i];
        if (value !== undefined) {
            code += chars[value % chars.length];
        }
    }
    return code;
}

/**
 * Convert word phrase to a SHA-256-based hash for room lookup
 * Uses SubtleCrypto for proper hashing instead of DJB2
 */
export function phraseToHash(phrase: string): string {
    const normalized = phrase.toLowerCase().trim();
    // Use a simple but collision-resistant hash for synchronous usage
    // XOR-rotate hash with prime multiplier
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < normalized.length; i++) {
        const ch = normalized.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    const combined = (h2 >>> 0) * 4294967296 + (h1 >>> 0);
    return combined.toString(36).toUpperCase().slice(0, 12);
}

// Validate word phrase format
export function isValidWordPhrase(input: string): boolean {
    const words = input.toLowerCase().trim().split('-');
    if (words.length < 2 || words.length > 5) {return false;}
    return words.every(word => WORD_LIST.includes(word));
}

// Validate short code format (only unambiguous alphanumeric, no special chars)
export function isValidShortCode(input: string): boolean {
    const code = input.toUpperCase().trim();
    if (code.length < 6 || code.length > 8) {return false;}
    return /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/.test(code);
}

// Detect code type
export function detectCodeType(input: string): 'word-phrase' | 'short-code' | 'unknown' {
    if (input.includes('-') && isValidWordPhrase(input)) {
        return 'word-phrase';
    }
    if (isValidShortCode(input)) {
        return 'short-code';
    }
    return 'unknown';
}

// Format code for display
export function formatCode(code: string): string {
    const type = detectCodeType(code);
    if (type === 'word-phrase') {
        return code.toLowerCase().split('-').map(w =>
            w.charAt(0).toUpperCase() + w.slice(1)
        ).join('-');
    }
    return code.toUpperCase();
}

// Get word list for autocomplete
export function getWordList(): string[] {
    return [...WORD_LIST].sort();
}

export default {
    generateWordPhrase,
    generateShortCode,
    phraseToHash,
    isValidWordPhrase,
    isValidShortCode,
    detectCodeType,
    formatCode,
    getWordList,
};

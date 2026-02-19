//! Key fingerprint generation

/// Emoji set for visual fingerprints (64 distinct emojis = 6 bits each)
const FINGERPRINT_EMOJIS: &[&str] = &[
    "🔐", "🌟", "🔥", "🌊", "🎯", "🚀", "💎", "🌈",
    "🦊", "🐻", "🦅", "🐬", "🌸", "🍀", "🌙", "⚡",
    "🎵", "🎨", "🏔", "🌋", "🦋", "🐝", "🌺", "🍁",
    "❄", "☀", "🌻", "🍄", "🦈", "🐙", "🦀", "🌵",
    "🎭", "🎪", "🎲", "🎸", "🏴", "⛵", "🗝", "🔮",
    "🎃", "🌾", "🍇", "🫐", "🥝", "🍊", "🌰", "🥨",
    "🦉", "🐺", "🦁", "🐸", "🦆", "🦜", "🐢", "🦎",
    "🏖", "🏕", "🎠", "🎡", "⛰", "🗻", "🏜", "🌏",
];

/// Generate emoji fingerprint from key bytes
///
/// Maps 8 bytes of the BLAKE3 hash to 8 emojis for visual verification.
pub fn fingerprint_emoji(public_key: &[u8]) -> String {
    let hash = blake3::hash(public_key);
    let bytes = hash.as_bytes();

    bytes
        .iter()
        .take(8)
        .map(|b| {
            let idx = (*b as usize) % FINGERPRINT_EMOJIS.len();
            FINGERPRINT_EMOJIS[idx]
        })
        .collect::<Vec<_>>()
        .join(" ")
}

/// Generate hex fingerprint from key bytes
///
/// Produces a colon-separated hex string from the first 16 bytes of the BLAKE3 hash.
pub fn fingerprint_hex(public_key: &[u8]) -> String {
    let hash = blake3::hash(public_key);
    hash.as_bytes()
        .iter()
        .take(16)
        .map(|b| format!("{:02x}", b))
        .collect::<Vec<_>>()
        .join(":")
}

/// Generate a short fingerprint (8 hex chars) for display
pub fn fingerprint_short(public_key: &[u8]) -> String {
    let hash = blake3::hash(public_key);
    hash.as_bytes()
        .iter()
        .take(4)
        .map(|b| format!("{:02x}", b))
        .collect::<String>()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fingerprint_hex_format() {
        let key = [0u8; 32];
        let fp = fingerprint_hex(&key);
        // Should be 16 hex pairs separated by colons
        let parts: Vec<&str> = fp.split(':').collect();
        assert_eq!(parts.len(), 16);
        for part in parts {
            assert_eq!(part.len(), 2);
        }
    }

    #[test]
    fn test_fingerprint_emoji_length() {
        let key = [1u8; 32];
        let fp = fingerprint_emoji(&key);
        // Should have 8 emojis separated by spaces
        let parts: Vec<&str> = fp.split(' ').collect();
        assert_eq!(parts.len(), 8);
    }

    #[test]
    fn test_fingerprint_short() {
        let key = [2u8; 32];
        let fp = fingerprint_short(&key);
        assert_eq!(fp.len(), 8);
    }

    #[test]
    fn test_fingerprint_deterministic() {
        let key = [42u8; 32];
        let fp1 = fingerprint_hex(&key);
        let fp2 = fingerprint_hex(&key);
        assert_eq!(fp1, fp2);
    }

    #[test]
    fn test_different_keys_different_fingerprints() {
        let fp1 = fingerprint_hex(&[0u8; 32]);
        let fp2 = fingerprint_hex(&[1u8; 32]);
        assert_ne!(fp1, fp2);
    }
}

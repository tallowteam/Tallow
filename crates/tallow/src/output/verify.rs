//! Session verification string generation and display
//!
//! Generates numeric and emoji verification strings from session keys
//! for out-of-band MITM detection.

/// Curated set of 256 visually distinct emojis (Unicode 13.0 or earlier).
///
/// Categories: animals, food/drink, plants, weather/nature, vehicles,
/// objects, sports/activities, symbols.
const EMOJI_SET: &[&str; 256] = &[
    // Animals (0-31)
    "\u{1F436}",
    "\u{1F431}",
    "\u{1F42D}",
    "\u{1F439}",
    "\u{1F430}",
    "\u{1F98A}",
    "\u{1F43B}",
    "\u{1F43C}",
    "\u{1F428}",
    "\u{1F42F}",
    "\u{1F981}",
    "\u{1F42E}",
    "\u{1F437}",
    "\u{1F438}",
    "\u{1F435}",
    "\u{1F414}",
    "\u{1F427}",
    "\u{1F986}",
    "\u{1F985}",
    "\u{1F989}",
    "\u{1F41D}",
    "\u{1F41B}",
    "\u{1F98B}",
    "\u{1F40C}",
    "\u{1F41E}",
    "\u{1F41C}",
    "\u{1F422}",
    "\u{1F40D}",
    "\u{1F98E}",
    "\u{1F419}",
    "\u{1F991}",
    "\u{1F990}",
    // More animals (32-47)
    "\u{1F40B}",
    "\u{1F42C}",
    "\u{1F420}",
    "\u{1F421}",
    "\u{1F988}",
    "\u{1F40A}",
    "\u{1F405}",
    "\u{1F406}",
    "\u{1F993}",
    "\u{1F418}",
    "\u{1F98F}",
    "\u{1F42A}",
    "\u{1F42B}",
    "\u{1F992}",
    "\u{1F999}",
    "\u{1F412}",
    // Food and drink (48-95)
    "\u{1F34E}",
    "\u{1F34F}",
    "\u{1F350}",
    "\u{1F34A}",
    "\u{1F34B}",
    "\u{1F34C}",
    "\u{1F349}",
    "\u{1F347}",
    "\u{1F353}",
    "\u{1FAD0}",
    "\u{1F352}",
    "\u{1F351}",
    "\u{1F34D}",
    "\u{1F965}",
    "\u{1F951}",
    "\u{1F346}",
    "\u{1F955}",
    "\u{1F33D}",
    "\u{1F336}",
    "\u{1F952}",
    "\u{1F96C}",
    "\u{1F966}",
    "\u{1F9C4}",
    "\u{1F9C5}",
    "\u{1F344}",
    "\u{1F95C}",
    "\u{1F330}",
    "\u{1F35E}",
    "\u{1F950}",
    "\u{1F956}",
    "\u{1F968}",
    "\u{1F96F}",
    "\u{1F95E}",
    "\u{1F9C7}",
    "\u{1F9C0}",
    "\u{1F356}",
    "\u{1F357}",
    "\u{1F969}",
    "\u{1F953}",
    "\u{1F354}",
    "\u{1F35F}",
    "\u{1F355}",
    "\u{1F32D}",
    "\u{1F96A}",
    "\u{1F32E}",
    "\u{1F32F}",
    "\u{1FAD4}",
    "\u{1F959}",
    // Plants and flowers (96-119)
    "\u{1F490}",
    "\u{1F338}",
    "\u{1F4AE}",
    "\u{1F3F5}",
    "\u{1F339}",
    "\u{1F940}",
    "\u{1F33A}",
    "\u{1F33B}",
    "\u{1F33C}",
    "\u{1F337}",
    "\u{1F331}",
    "\u{1FAB4}",
    "\u{1F332}",
    "\u{1F333}",
    "\u{1F334}",
    "\u{1F335}",
    "\u{1F33E}",
    "\u{1F33F}",
    "\u{2618}",
    "\u{1F340}",
    "\u{1F341}",
    "\u{1F342}",
    "\u{1F343}",
    "\u{1FAB9}",
    // Weather and nature (120-151)
    "\u{2600}",
    "\u{1F324}",
    "\u{26C5}",
    "\u{1F325}",
    "\u{1F326}",
    "\u{1F327}",
    "\u{26C8}",
    "\u{1F329}",
    "\u{1F328}",
    "\u{2744}",
    "\u{1F32C}",
    "\u{1F300}",
    "\u{1F308}",
    "\u{2B50}",
    "\u{1F31F}",
    "\u{1F4AB}",
    "\u{1F525}",
    "\u{1F4A7}",
    "\u{1F30A}",
    "\u{1F30D}",
    "\u{1F30E}",
    "\u{1F30F}",
    "\u{1F311}",
    "\u{1F312}",
    "\u{1F313}",
    "\u{1F314}",
    "\u{1F315}",
    "\u{1F316}",
    "\u{1F317}",
    "\u{1F318}",
    "\u{1F319}",
    "\u{1F31E}",
    // Vehicles and transport (152-183)
    "\u{1F697}",
    "\u{1F695}",
    "\u{1F699}",
    "\u{1F68C}",
    "\u{1F68E}",
    "\u{1F3CE}",
    "\u{1F693}",
    "\u{1F691}",
    "\u{1F692}",
    "\u{1F690}",
    "\u{1F69A}",
    "\u{1F69B}",
    "\u{1F69C}",
    "\u{1F6F5}",
    "\u{1F6B2}",
    "\u{1F6F4}",
    "\u{1F6F9}",
    "\u{1F6A2}",
    "\u{26F5}",
    "\u{1F6A4}",
    "\u{1F6E5}",
    "\u{26F4}",
    "\u{2708}",
    "\u{1F6E9}",
    "\u{1F6EB}",
    "\u{1F6EC}",
    "\u{1F681}",
    "\u{1F69F}",
    "\u{1F6A0}",
    "\u{1F6A1}",
    "\u{1F680}",
    "\u{1F6F8}",
    // Objects (184-223)
    "\u{231A}",
    "\u{1F4F1}",
    "\u{1F4BB}",
    "\u{2328}",
    "\u{1F4BD}",
    "\u{1F4BF}",
    "\u{1F4C0}",
    "\u{1F3A5}",
    "\u{1F4F7}",
    "\u{1F4F8}",
    "\u{1F4F9}",
    "\u{1F50D}",
    "\u{1F4A1}",
    "\u{1F526}",
    "\u{1F3EE}",
    "\u{1F4D4}",
    "\u{1F4D5}",
    "\u{1F4D6}",
    "\u{1F4D7}",
    "\u{1F4D8}",
    "\u{1F4D9}",
    "\u{1F4DA}",
    "\u{1F4D3}",
    "\u{1F4D2}",
    "\u{1F4DC}",
    "\u{1F4CB}",
    "\u{270F}",
    "\u{1F58A}",
    "\u{1F58B}",
    "\u{1F58C}",
    "\u{1F58D}",
    "\u{1F4CF}",
    "\u{1F4D0}",
    "\u{2702}",
    "\u{1F4E6}",
    "\u{1F511}",
    "\u{1F512}",
    "\u{1F513}",
    "\u{1F528}",
    "\u{1FA93}",
    // Sports and activities (224-247)
    "\u{26BD}",
    "\u{1F3C0}",
    "\u{1F3C8}",
    "\u{26BE}",
    "\u{1F94E}",
    "\u{1F3BE}",
    "\u{1F3D0}",
    "\u{1F3C9}",
    "\u{1F94F}",
    "\u{1F3B1}",
    "\u{1F3D3}",
    "\u{1F3F8}",
    "\u{1F945}",
    "\u{1F3D2}",
    "\u{1F3D1}",
    "\u{1F94D}",
    "\u{26F3}",
    "\u{1F3AF}",
    "\u{1F3A3}",
    "\u{1F93F}",
    "\u{1F3BF}",
    "\u{1F6F7}",
    "\u{1FA82}",
    "\u{26F8}",
    // Symbols and miscellaneous (248-255)
    "\u{2764}",
    "\u{1F49B}",
    "\u{1F49A}",
    "\u{1F499}",
    "\u{1F49C}",
    "\u{1F5A4}",
    "\u{1F90D}",
    "\u{1F48E}",
];

/// Generate a numeric verification string from session key bytes.
///
/// Algorithm:
/// 1. Hash session_key with BLAKE3 using domain separation: "tallow verification string v1"
/// 2. Take the 32-byte hash output
/// 3. Split into 8 groups of 4 bytes each
/// 4. Each group: `u32::from_le_bytes(4 bytes) % 100000`, zero-padded to 5 digits
/// 5. Result: 8 groups of 5 digits = 40 digits, space-separated
pub fn numeric_verification(session_key: &[u8; 32]) -> String {
    let hash = blake3::keyed_hash(
        blake3::hash(b"tallow verification string v1").as_bytes(),
        session_key,
    );
    let bytes = hash.as_bytes();

    let mut groups = Vec::with_capacity(8);
    for i in 0..8 {
        let start = i * 4;
        let val = u32::from_le_bytes([
            bytes[start],
            bytes[start + 1],
            bytes[start + 2],
            bytes[start + 3],
        ]);
        groups.push(format!("{:05}", val % 100_000));
    }
    groups.join(" ")
}

/// Generate an emoji verification string from session key bytes.
///
/// Algorithm:
/// 1. Hash session_key with BLAKE3: "tallow emoji verification v1"
/// 2. Take first 8 bytes
/// 3. Each byte indexes into a 256-emoji lookup table
pub fn emoji_verification(session_key: &[u8; 32]) -> String {
    let hash = blake3::keyed_hash(
        blake3::hash(b"tallow emoji verification v1").as_bytes(),
        session_key,
    );
    let bytes = hash.as_bytes();

    let mut emojis = Vec::with_capacity(8);
    for i in 0..8 {
        emojis.push(EMOJI_SET[bytes[i] as usize]);
    }
    emojis.join(" ")
}

/// Display verification strings to the user.
pub fn display_verification(session_key: &[u8; 32], show_emoji: bool) {
    let numeric = numeric_verification(session_key);
    println!("Verification: {}", numeric);
    if show_emoji {
        let emoji = emoji_verification(session_key);
        println!("Emoji verify: {}", emoji);
    }
}

/// Display verification as JSON.
pub fn display_verification_json(session_key: &[u8; 32]) {
    let numeric = numeric_verification(session_key);
    let emoji = emoji_verification(session_key);
    println!(
        "{}",
        serde_json::json!({
            "event": "verification",
            "numeric": numeric,
            "emoji": emoji,
        })
    );
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_numeric_verification_deterministic() {
        let key = [42u8; 32];
        let a = numeric_verification(&key);
        let b = numeric_verification(&key);
        assert_eq!(a, b);
    }

    #[test]
    fn test_numeric_verification_different_keys() {
        let key1 = [1u8; 32];
        let key2 = [2u8; 32];
        assert_ne!(numeric_verification(&key1), numeric_verification(&key2));
    }

    #[test]
    fn test_numeric_verification_format() {
        let key = [0u8; 32];
        let result = numeric_verification(&key);
        let groups: Vec<&str> = result.split(' ').collect();
        assert_eq!(groups.len(), 8, "Should be 8 groups");
        for group in &groups {
            assert_eq!(group.len(), 5, "Each group should be 5 digits: {}", group);
            assert!(
                group.chars().all(|c| c.is_ascii_digit()),
                "All chars should be digits"
            );
        }
    }

    #[test]
    fn test_emoji_verification_deterministic() {
        let key = [42u8; 32];
        assert_eq!(emoji_verification(&key), emoji_verification(&key));
    }

    #[test]
    fn test_emoji_verification_different_keys() {
        let key1 = [1u8; 32];
        let key2 = [2u8; 32];
        assert_ne!(emoji_verification(&key1), emoji_verification(&key2));
    }

    #[test]
    fn test_emoji_set_size() {
        assert_eq!(EMOJI_SET.len(), 256);
    }

    #[test]
    fn test_emoji_set_no_duplicates() {
        let mut seen = std::collections::HashSet::new();
        for (i, emoji) in EMOJI_SET.iter().enumerate() {
            assert!(
                seen.insert(emoji),
                "Duplicate emoji at index {}: {}",
                i,
                emoji
            );
        }
    }

    #[test]
    fn test_both_peers_match() {
        // Core security property: same session key -> same verification
        let key = [99u8; 32];
        let peer_a = numeric_verification(&key);
        let peer_b = numeric_verification(&key);
        assert_eq!(peer_a, peer_b);
    }
}

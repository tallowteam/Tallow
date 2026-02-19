//! Room code generation and room ID derivation
//!
//! Code phrases use the EFF Diceware wordlist for human-readable codes.
//! Room IDs are BLAKE3 hashes of the code phrase for relay routing.

use rand::seq::SliceRandom;
use rand::thread_rng;

/// Default number of words in a code phrase
pub const DEFAULT_WORD_COUNT: usize = 6;

/// Generate a memorable room code phrase using the EFF Diceware wordlist
///
/// # Arguments
///
/// * `word_count` - Number of words (6 recommended, ~77.5 bits entropy)
pub fn generate_code_phrase(word_count: usize) -> String {
    let wordlist = &tallow_crypto::kdf::eff_wordlist::EFF_WORDLIST;
    let mut rng = thread_rng();

    let mut words = Vec::with_capacity(word_count);
    for _ in 0..word_count {
        if let Some(word) = wordlist.choose(&mut rng) {
            words.push(*word);
        }
    }

    words.join("-")
}

/// Derive a room ID from a code phrase
///
/// Uses BLAKE3 hash to produce a 32-byte room ID.
/// The relay uses this to pair sender and receiver.
pub fn derive_room_id(code_phrase: &str) -> [u8; 32] {
    blake3::hash(code_phrase.as_bytes()).into()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_code_phrase() {
        let code = generate_code_phrase(6);
        assert_eq!(code.split('-').count(), 6);

        // All words should be from EFF wordlist
        let wordlist = &tallow_crypto::kdf::eff_wordlist::EFF_WORDLIST;
        for word in code.split('-') {
            assert!(wordlist.contains(&word), "word '{}' not in EFF wordlist", word);
        }
    }

    #[test]
    fn test_derive_room_id_deterministic() {
        let id1 = derive_room_id("test-code-phrase");
        let id2 = derive_room_id("test-code-phrase");
        assert_eq!(id1, id2);
    }

    #[test]
    fn test_derive_room_id_unique() {
        let id1 = derive_room_id("alpha-bravo-charlie");
        let id2 = derive_room_id("delta-echo-foxtrot");
        assert_ne!(id1, id2);
    }
}

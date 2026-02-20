//! Room code generation and room ID derivation
//!
//! Code phrases use the EFF Diceware wordlist for human-readable codes.
//! Room IDs are BLAKE3 hashes of the code phrase for relay routing.

use rand::seq::SliceRandom;
use rand::thread_rng;

/// Default number of words in a code phrase.
///
/// 4 words from the EFF 7776-word list = ~51.7 bits entropy.
/// Sufficient for ephemeral PAKE sessions where offline brute-force
/// is prevented by the relay rate-limiting and session expiry.
pub const DEFAULT_WORD_COUNT: usize = 4;

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
    fn test_generate_code_phrase_default() {
        let code = generate_code_phrase(DEFAULT_WORD_COUNT);
        assert_eq!(code.split('-').count(), 4);

        // All words should be from EFF wordlist
        let wordlist = &tallow_crypto::kdf::eff_wordlist::EFF_WORDLIST;
        for word in code.split('-') {
            assert!(
                wordlist.contains(&word),
                "word '{}' not in EFF wordlist",
                word
            );
        }
    }

    #[test]
    fn test_configurable_word_count() {
        let code3 = generate_code_phrase(3);
        assert_eq!(code3.split('-').count(), 3);

        let code4 = generate_code_phrase(4);
        assert_eq!(code4.split('-').count(), 4);

        let code6 = generate_code_phrase(6);
        assert_eq!(code6.split('-').count(), 6);
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

    #[test]
    fn test_custom_code_produces_valid_room_id() {
        let id = derive_room_id("my-custom-code");
        assert_ne!(id, [0u8; 32]);
        // Same code always produces same room ID
        assert_eq!(id, derive_room_id("my-custom-code"));
    }

    #[test]
    fn test_short_codes_produce_unique_room_ids() {
        let id1 = derive_room_id("abcd");
        let id2 = derive_room_id("abce");
        assert_ne!(id1, id2);
    }
}

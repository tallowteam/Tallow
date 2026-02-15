//! Room code generation

/// Word list for code phrases (subset for stub)
const WORDS: &[&str] = &[
    "alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf", "hotel",
];

/// Generate a memorable room code phrase
pub fn generate_code_phrase(word_count: usize) -> String {
    // Stub implementation - in real version would use cryptographic randomness
    WORDS
        .iter()
        .cycle()
        .take(word_count)
        .map(|s| *s)
        .collect::<Vec<_>>()
        .join("-")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_code() {
        let code = generate_code_phrase(3);
        assert_eq!(code.split('-').count(), 3);
    }
}

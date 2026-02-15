//! Key fingerprint generation

/// Generate emoji fingerprint from key
pub fn fingerprint_emoji(_public_key: &[u8]) -> String {
    // Stub - would map hash to emojis
    "🔐🌟🔥".to_string()
}

/// Generate hex fingerprint from key
pub fn fingerprint_hex(public_key: &[u8]) -> String {
    // Simple hex encoding
    public_key
        .iter()
        .take(16)
        .map(|b| format!("{:02x}", b))
        .collect::<Vec<_>>()
        .join(":")
}

# Testing Cryptographic Code

## Mandatory Tests for Every Crypto Function

1. **Roundtrip**: encrypt(decrypt(x)) == x for all x
2. **Wrong key**: decrypt with different key fails
3. **Tampered ciphertext**: flipped bit in ciphertext fails auth
4. **Nonce uniqueness**: verify nonce generator never produces duplicates
5. **Zeroization**: verify key material is zeroed after scope exit
6. **Empty input**: encrypt/decrypt handles empty plaintext
7. **Max-size input**: handles messages near the AES-GCM limit

## Property-Based Tests (proptest)
```rust
proptest! {
    #[test]
    fn roundtrip_any_plaintext(plaintext in prop::collection::vec(any::<u8>(), 0..10000)) {
        let key = generate_test_key();
        let ct = encrypt(&key, &plaintext).unwrap();
        let pt = decrypt(&key, &ct).unwrap();
        prop_assert_eq!(pt, plaintext);
    }
}
```

## Fuzz Targets (cargo-fuzz)
```rust
#![no_main]
use libfuzzer_sys::fuzz_target;

fuzz_target!(|data: &[u8]| {
    // Should never panic regardless of input
    let _ = tallow_protocol::wire::parse_message(data);
});
```

## Tools
- `proptest` for property-based testing
- `cargo-fuzz` for fuzzing parsers and protocol handlers
- `criterion` for benchmarks
- `cargo-valgrind` for memory safety verification

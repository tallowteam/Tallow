//! Integration tests for Tallow WASM

use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
fn test_module_initialization() {
    tallow_wasm::init();
    let version = tallow_wasm::version();
    assert!(version.contains("tallow-wasm"));
}

#[wasm_bindgen_test]
fn test_capabilities() {
    let caps = tallow_wasm::capabilities();
    assert!(!caps.is_null());
    assert!(!caps.is_undefined());
}

#[wasm_bindgen_test]
fn test_mlkem_keypair() {
    let kp = tallow_wasm::mlkem_keypair();
    assert_eq!(kp.public_key().len(), 1184);
    assert_eq!(kp.secret_key().len(), 2400);
}

#[wasm_bindgen_test]
fn test_x25519_keypair() {
    let kp = tallow_wasm::x25519_keypair();
    assert_eq!(kp.public_key().len(), 32);
    assert_eq!(kp.secret_key().len(), 32);
}

#[wasm_bindgen_test]
fn test_hybrid_keypair() {
    let kp = tallow_wasm::hybrid_keypair();
    assert_eq!(kp.mlkem_public_key().len(), 1184);
    assert_eq!(kp.x25519_public_key().len(), 32);
}

#[wasm_bindgen_test]
fn test_aes_encryption() {
    let key = tallow_wasm::aes_generate_key();
    let plaintext = b"Hello, WASM!";

    let ciphertext = tallow_wasm::aes_encrypt(&key, plaintext).unwrap();
    let decrypted = tallow_wasm::aes_decrypt(&key, &ciphertext).unwrap();

    assert_eq!(plaintext, &decrypted[..]);
}

#[wasm_bindgen_test]
fn test_blake3_hash() {
    let data = b"test data";
    let hash1 = tallow_wasm::blake3_hash(data);
    let hash2 = tallow_wasm::blake3_hash(data);

    assert_eq!(hash1.len(), 32);
    assert_eq!(hash1, hash2); // Deterministic
}

#[wasm_bindgen_test]
fn test_argon2_password() {
    let password = "test-password";
    let hash = tallow_wasm::argon2_hash_password(password).unwrap();

    assert!(tallow_wasm::argon2_verify_password(password, &hash).unwrap());
    assert!(!tallow_wasm::argon2_verify_password("wrong", &hash).unwrap());
}

#[wasm_bindgen_test]
fn test_file_chunker() {
    let file_size = 10 * 1024 * 1024; // 10 MB
    let chunk_size = 1024 * 1024; // 1 MB
    let chunker = tallow_wasm::FileChunker::new(file_size, Some(chunk_size));

    assert_eq!(chunker.total_chunks(), 10);
    assert_eq!(chunker.chunk_size(), chunk_size);
}

#[wasm_bindgen_test]
fn test_transfer_session() {
    let key = tallow_wasm::aes_generate_key();
    let session_id = tallow_wasm::generate_session_id();
    let mut session = tallow_wasm::TransferSession::new(&key, session_id).unwrap();

    let chunk = b"test chunk";
    let encrypted = session.encrypt_chunk(chunk).unwrap();
    let decrypted = session.decrypt_chunk(&encrypted).unwrap();

    assert_eq!(chunk, &decrypted[..]);
}

#[wasm_bindgen_test]
fn test_hybrid_key_exchange() {
    // Responder generates keypair
    let responder = tallow_wasm::hybrid_keypair();

    // Initiator encapsulates
    let encap_result = tallow_wasm::hybrid_encapsulate(
        &responder.mlkem_public_key(),
        &responder.x25519_public_key(),
        Some("test-context".to_string()),
    )
    .unwrap();

    // Extract values from JS object
    let encap_obj = js_sys::Object::from(encap_result);

    let session_key_1 = js_sys::Reflect::get(&encap_obj, &"sessionKey".into())
        .unwrap()
        .dyn_into::<js_sys::Uint8Array>()
        .unwrap()
        .to_vec();

    let mlkem_ct = js_sys::Reflect::get(&encap_obj, &"mlkemCiphertext".into())
        .unwrap()
        .dyn_into::<js_sys::Uint8Array>()
        .unwrap()
        .to_vec();

    let x25519_pub = js_sys::Reflect::get(&encap_obj, &"x25519Public".into())
        .unwrap()
        .dyn_into::<js_sys::Uint8Array>()
        .unwrap()
        .to_vec();

    // Responder decapsulates
    let session_key_2 = tallow_wasm::hybrid_decapsulate(
        &responder.mlkem_secret_key(),
        &mlkem_ct,
        &responder.x25519_secret_key(),
        &x25519_pub,
        Some("test-context".to_string()),
    )
    .unwrap();

    // Both should derive the same session key
    assert_eq!(session_key_1, session_key_2);
    assert_eq!(session_key_1.len(), 32);
}

#[wasm_bindgen_test]
fn test_chunk_hashing() {
    let chunk1 = vec![1u8; 1024];
    let chunk2 = vec![2u8; 1024];

    let chunks = vec![
        js_sys::Uint8Array::from(&chunk1[..]),
        js_sys::Uint8Array::from(&chunk2[..]),
    ];

    let hashes = tallow_wasm::generate_chunk_hashes(chunks.clone());
    assert_eq!(hashes.len(), 2);

    let merkle_root = tallow_wasm::merkle_root(hashes);
    assert_eq!(merkle_root.len(), 32);
}

#[wasm_bindgen_test]
fn test_memory_utilities() {
    let mut data = vec![1, 2, 3, 4, 5];
    tallow_wasm::secure_zero(&mut data);
    assert!(tallow_wasm::is_zeroed(&data));

    let random = tallow_wasm::secure_random_bytes(32);
    assert_eq!(random.len(), 32);

    let id = tallow_wasm::generate_session_id();
    assert_eq!(id.len(), 32);
}

#[wasm_bindgen_test]
fn test_constant_time_operations() {
    let a = b"secret";
    let b = b"secret";
    let c = b"public";

    assert!(tallow_wasm::constant_time_compare(a, b));
    assert!(!tallow_wasm::constant_time_compare(a, c));
}

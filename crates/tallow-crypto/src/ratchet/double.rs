//! Double Ratchet protocol (Signal-style)

use crate::error::{CryptoError, Result};
use crate::hash::blake3;
use crate::kem::x25519::X25519KeyPair;
use crate::symmetric::{chacha_decrypt, chacha_encrypt};
use serde::{Deserialize, Serialize};
use zeroize::Zeroize;

/// Double Ratchet state
#[derive(Clone, Zeroize, Serialize, Deserialize)]
#[zeroize(drop)]
pub struct DoubleRatchet {
    root_key: [u8; 32],
    send_chain_key: [u8; 32],
    recv_chain_key: [u8; 32],
    send_counter: u64,
    recv_counter: u64,
    ephemeral_keypair: X25519KeyPair,
}

impl DoubleRatchet {
    /// Initialize a new double ratchet
    pub fn init(shared_secret: &[u8; 32]) -> Self {
        let ephemeral_keypair = X25519KeyPair::generate();

        Self {
            root_key: *shared_secret,
            send_chain_key: blake3::derive_key("send_chain", shared_secret),
            recv_chain_key: blake3::derive_key("recv_chain", shared_secret),
            send_counter: 0,
            recv_counter: 0,
            ephemeral_keypair,
        }
    }

    /// Encrypt a message
    pub fn encrypt_message(&mut self, plaintext: &[u8]) -> Result<Vec<u8>> {
        // Derive message key from chain key
        let message_key = blake3::derive_key("message", &self.send_chain_key);

        // Advance chain key
        self.send_chain_key = blake3::derive_key("chain_advance", &self.send_chain_key);

        // Encrypt with nonce = counter
        let mut nonce = [0u8; 12];
        nonce[..8].copy_from_slice(&self.send_counter.to_le_bytes());

        let ciphertext = chacha_encrypt(&message_key, &nonce, plaintext, &[])?;

        self.send_counter += 1;

        Ok(ciphertext)
    }

    /// Decrypt a message
    pub fn decrypt_message(&mut self, ciphertext: &[u8]) -> Result<Vec<u8>> {
        // Derive message key from chain key
        let message_key = blake3::derive_key("message", &self.recv_chain_key);

        // Advance chain key
        self.recv_chain_key = blake3::derive_key("chain_advance", &self.recv_chain_key);

        // Decrypt with nonce = counter
        let mut nonce = [0u8; 12];
        nonce[..8].copy_from_slice(&self.recv_counter.to_le_bytes());

        let plaintext = chacha_decrypt(&message_key, &nonce, ciphertext, &[])?;

        self.recv_counter += 1;

        Ok(plaintext)
    }

    /// Perform DH ratchet step
    pub fn ratchet_step(&mut self, their_public: &x25519_dalek::PublicKey) {
        let dh_output = self.ephemeral_keypair.diffie_hellman(their_public);

        // KDF with root key and DH output
        let mut input = Vec::new();
        input.extend_from_slice(&self.root_key);
        input.extend_from_slice(&dh_output.0);

        self.root_key = blake3::derive_key("root", &input);
        self.send_chain_key = blake3::derive_key("send_chain", &self.root_key);
        self.recv_chain_key = blake3::derive_key("recv_chain", &self.root_key);

        // Generate new ephemeral keypair
        self.ephemeral_keypair = X25519KeyPair::generate();
    }
}

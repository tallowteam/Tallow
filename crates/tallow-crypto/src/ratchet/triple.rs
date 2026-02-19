//! Triple Ratchet combining Double Ratchet and Sparse PQ Ratchet
//!
//! The Triple Ratchet provides post-quantum forward secrecy by periodically
//! mixing ML-KEM-derived secrets into the Double Ratchet's root key.

use crate::error::{CryptoError, Result};
use crate::ratchet::{DoubleRatchet, SparsePqRatchet};
use serde::{Deserialize, Serialize};
use zeroize::Zeroize;

/// Triple Ratchet state
#[derive(Clone, Serialize, Deserialize)]
pub struct TripleRatchet {
    double_ratchet: DoubleRatchet,
    sparse_pq_ratchet: SparsePqRatchet,
}

impl Zeroize for TripleRatchet {
    fn zeroize(&mut self) {
        self.double_ratchet.zeroize();
        self.sparse_pq_ratchet.zeroize();
    }
}

impl Drop for TripleRatchet {
    fn drop(&mut self) {
        self.zeroize();
    }
}

impl TripleRatchet {
    /// Initialize a new triple ratchet
    pub fn init(shared_secret: &[u8; 32], pq_rekey_interval: u64) -> Self {
        Self {
            double_ratchet: DoubleRatchet::init(shared_secret),
            sparse_pq_ratchet: SparsePqRatchet::new(*shared_secret, pq_rekey_interval),
        }
    }

    /// Encrypt a message
    pub fn encrypt_message(&mut self, plaintext: &[u8]) -> Result<Vec<u8>> {
        self.double_ratchet.encrypt_message(plaintext)
    }

    /// Decrypt a message
    pub fn decrypt_message(&mut self, ciphertext: &[u8]) -> Result<Vec<u8>> {
        self.double_ratchet.decrypt_message(ciphertext)
    }

    /// Perform ratchet step, potentially mixing PQ secret
    ///
    /// If the sparse PQ ratchet triggers a rekey, the new PQ shared secret
    /// is mixed into the double ratchet's root key via HKDF.
    pub fn step(&mut self) {
        if let Some(_pk) = self.sparse_pq_ratchet.step() {
            // PQ rekey occurred — mix the new secret into the double ratchet
            let pq_secret = *self.sparse_pq_ratchet.current_secret();
            self.double_ratchet.mix_pq_secret(&pq_secret);
        }
    }

    /// Get the double ratchet reference
    pub fn double_ratchet(&self) -> &DoubleRatchet {
        &self.double_ratchet
    }

    /// Get the sparse PQ ratchet reference
    pub fn sparse_pq_ratchet(&self) -> &SparsePqRatchet {
        &self.sparse_pq_ratchet
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_triple_ratchet_basic() {
        let shared_secret = [42u8; 32];
        let mut sender = TripleRatchet::init(&shared_secret, 10);
        let mut receiver = TripleRatchet::init(&shared_secret, 10);

        let ct = sender.encrypt_message(b"hello").unwrap();
        let pt = receiver.decrypt_message(&ct).unwrap();

        assert_eq!(pt, b"hello");
    }

    #[test]
    fn test_triple_ratchet_pq_mixing() {
        let shared_secret = [42u8; 32];
        let mut ratchet = TripleRatchet::init(&shared_secret, 2);

        // Step 1: no PQ rekey
        ratchet.step();

        // Step 2: PQ rekey should occur (interval = 2)
        // This should mix the PQ secret into the double ratchet
        ratchet.step();

        // Verify the ratchet still works after PQ mixing
        let ct = ratchet.encrypt_message(b"after pq rekey").unwrap();
        assert!(!ct.is_empty());
    }
}

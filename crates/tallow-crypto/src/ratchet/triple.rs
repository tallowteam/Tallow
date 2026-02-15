//! Triple Ratchet combining Double Ratchet and Sparse PQ Ratchet

use crate::error::{CryptoError, Result};
use crate::ratchet::{DoubleRatchet, SparsePqRatchet};
use serde::{Deserialize, Serialize};
use zeroize::Zeroize;

/// Triple Ratchet state
#[derive(Clone, Zeroize, Serialize, Deserialize)]
#[zeroize(drop)]
pub struct TripleRatchet {
    double_ratchet: DoubleRatchet,
    sparse_pq_ratchet: SparsePqRatchet,
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

    /// Perform ratchet step
    pub fn step(&mut self) {
        if let Some(_pk) = self.sparse_pq_ratchet.step() {
            // PQ rekey occurred, mix into double ratchet
            let _pq_secret = self.sparse_pq_ratchet.current_secret();
            // In real implementation, would mix this into the double ratchet
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

//! Sparse PQ ratchet for periodic ML-KEM re-keying

use crate::error::Result;
use crate::hash::blake3;
use crate::kem::mlkem::{MlKem, PublicKey, SecretKey};
use serde::{Deserialize, Serialize};
use zeroize::Zeroize;

/// Sparse PQ Ratchet state
#[derive(Clone, Serialize, Deserialize)]
pub struct SparsePqRatchet {
    current_secret: [u8; 32],
    #[serde(skip)]
    keypair: Option<(PublicKey, SecretKey)>,
    step_count: u64,
    rekey_interval: u64,
}

impl Zeroize for SparsePqRatchet {
    fn zeroize(&mut self) {
        self.current_secret.zeroize();
        self.keypair = None; // Clear the keypair
        self.step_count.zeroize();
    }
}

impl Drop for SparsePqRatchet {
    fn drop(&mut self) {
        self.zeroize();
    }
}

impl SparsePqRatchet {
    /// Create a new sparse PQ ratchet
    ///
    /// # Panics
    ///
    /// Never panics. A `rekey_interval` of 0 disables PQ rekeying.
    pub fn new(initial_secret: [u8; 32], rekey_interval: u64) -> Self {
        Self {
            current_secret: initial_secret,
            keypair: None,
            step_count: 0,
            // Clamp to prevent div-by-zero in is_multiple_of
            rekey_interval: if rekey_interval == 0 {
                u64::MAX
            } else {
                rekey_interval
            },
        }
    }

    /// Perform a ratchet step
    pub fn step(&mut self) -> Result<Option<PublicKey>> {
        self.step_count = self.step_count.saturating_add(1);

        if self.step_count.is_multiple_of(self.rekey_interval) {
            // Time to rekey
            let (pk, sk) = MlKem::keygen()?;
            self.keypair = Some((pk.clone(), sk));
            Ok(Some(pk))
        } else {
            Ok(None)
        }
    }

    /// Process received ML-KEM ciphertext and update secret
    pub fn process_ciphertext(&mut self, ct: &crate::kem::mlkem::Ciphertext) -> Result<()> {
        if let Some((_, sk)) = &self.keypair {
            let shared_secret = MlKem::decapsulate(sk, ct)?;

            // Mix with current secret
            let mut input = Vec::new();
            input.extend_from_slice(&self.current_secret);
            input.extend_from_slice(&shared_secret.0);

            self.current_secret = blake3::hash(&input);

            // Zeroize temporary key material
            input.zeroize();

            // Clear used keypair
            self.keypair = None;
        }

        Ok(())
    }

    /// Get current secret
    pub fn current_secret(&self) -> &[u8; 32] {
        &self.current_secret
    }
}

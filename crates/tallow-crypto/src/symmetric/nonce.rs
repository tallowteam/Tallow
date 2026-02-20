//! Nonce generation and management

use crate::error::Result;
use rand::RngCore;
use rand_core::OsRng;
use zeroize::Zeroize;

/// Direction for bidirectional nonce generation
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Direction {
    /// Sending direction
    Send,
    /// Receiving direction
    Receive,
}

/// Nonce generator with counter-based generation and direction encoding
///
/// This generator ensures nonces are never reused by combining a random seed
/// with a counter and direction bit.
#[derive(Clone)]
pub struct NonceGenerator {
    counter: u64,
    seed: [u8; 32],
    direction: Direction,
}

impl Zeroize for NonceGenerator {
    fn zeroize(&mut self) {
        self.counter.zeroize();
        self.seed.zeroize();
        // Direction is Copy and doesn't need zeroization
    }
}

impl Drop for NonceGenerator {
    fn drop(&mut self) {
        self.zeroize();
    }
}

impl NonceGenerator {
    /// Create a new nonce generator with a random seed
    ///
    /// # Arguments
    ///
    /// * `direction` - The direction (send or receive) for this generator
    pub fn new(direction: Direction) -> Result<Self> {
        let mut seed = [0u8; 32];
        OsRng.fill_bytes(&mut seed);

        Ok(Self {
            counter: 0,
            seed,
            direction,
        })
    }

    /// Create a nonce generator from a specific seed
    ///
    /// # Arguments
    ///
    /// * `seed` - 32-byte seed for deterministic nonce generation
    /// * `direction` - The direction (send or receive) for this generator
    pub fn from_seed(seed: [u8; 32], direction: Direction) -> Self {
        Self {
            counter: 0,
            seed,
            direction,
        }
    }

    /// Generate the next nonce
    ///
    /// The nonce is constructed as:
    /// - First 8 bytes: counter (big-endian)
    /// - Next 4 bytes: XOR of seed bytes 0-3 with direction bit
    ///
    /// # Returns
    ///
    /// 12-byte nonce
    pub fn next_nonce(&mut self) -> [u8; 12] {
        let mut nonce = [0u8; 12];

        // Encode counter in first 8 bytes
        nonce[..8].copy_from_slice(&self.counter.to_be_bytes());

        // Encode seed and direction in last 4 bytes
        let direction_bit = match self.direction {
            Direction::Send => 0x00,
            Direction::Receive => 0x80,
        };

        nonce[8] = self.seed[0] ^ direction_bit;
        nonce[9] = self.seed[1];
        nonce[10] = self.seed[2];
        nonce[11] = self.seed[3];

        self.counter = self.counter.wrapping_add(1);

        nonce
    }

    /// Get the current counter value
    pub fn counter(&self) -> u64 {
        self.counter
    }

    /// Reset the counter (dangerous - only use for testing)
    #[cfg(test)]
    pub fn reset(&mut self) {
        self.counter = 0;
    }

    /// Set the counter to a specific value
    ///
    /// # Safety
    ///
    /// This should only be used when resuming a session. Ensure the counter
    /// value is greater than any previously used value to prevent nonce reuse.
    pub fn set_counter(&mut self, counter: u64) {
        self.counter = counter;
    }
}

impl std::fmt::Debug for NonceGenerator {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("NonceGenerator")
            .field("counter", &self.counter)
            .field("seed", &"<REDACTED>")
            .field("direction", &self.direction)
            .finish()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_nonce_generation() {
        let mut gen = NonceGenerator::new(Direction::Send).unwrap();
        let nonce1 = gen.next_nonce();
        let nonce2 = gen.next_nonce();

        // Nonces should be different
        assert_ne!(nonce1, nonce2);
    }

    #[test]
    fn test_nonce_counter() {
        let mut gen = NonceGenerator::new(Direction::Send).unwrap();
        assert_eq!(gen.counter(), 0);

        gen.next_nonce();
        assert_eq!(gen.counter(), 1);

        gen.next_nonce();
        assert_eq!(gen.counter(), 2);
    }

    #[test]
    fn test_nonce_direction_encoding() {
        let seed = [42u8; 32];
        let mut send_gen = NonceGenerator::from_seed(seed, Direction::Send);
        let mut recv_gen = NonceGenerator::from_seed(seed, Direction::Receive);

        let send_nonce = send_gen.next_nonce();
        let recv_nonce = recv_gen.next_nonce();

        // First 8 bytes (counter) should be the same
        assert_eq!(&send_nonce[..8], &recv_nonce[..8]);

        // Byte 8 should differ due to direction bit
        assert_ne!(send_nonce[8], recv_nonce[8]);
    }

    #[test]
    fn test_nonce_set_counter() {
        let mut gen = NonceGenerator::new(Direction::Send).unwrap();
        gen.set_counter(100);

        let nonce = gen.next_nonce();
        assert_eq!(gen.counter(), 101);

        // Verify counter is encoded in nonce
        let counter_bytes = u64::from_be_bytes(nonce[..8].try_into().unwrap());
        assert_eq!(counter_bytes, 100);
    }
}

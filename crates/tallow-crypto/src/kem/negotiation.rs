//! KEM capability negotiation

use super::KemAlgorithm;
use serde::{Deserialize, Serialize};

/// KEM capabilities for negotiation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KemCapabilities {
    /// Supported algorithms in preference order
    pub supported: Vec<KemAlgorithm>,
}

impl KemCapabilities {
    /// Create capabilities with all algorithms supported
    pub fn all() -> Self {
        Self {
            supported: vec![
                KemAlgorithm::Hybrid,
                KemAlgorithm::MlKem1024,
                KemAlgorithm::X25519,
            ],
        }
    }

    /// Create capabilities with only post-quantum algorithms
    pub fn pq_only() -> Self {
        Self {
            supported: vec![KemAlgorithm::MlKem1024],
        }
    }

    /// Create capabilities with only classical algorithms
    pub fn classical_only() -> Self {
        Self {
            supported: vec![KemAlgorithm::X25519],
        }
    }

    /// Check if an algorithm is supported
    pub fn supports(&self, algorithm: KemAlgorithm) -> bool {
        self.supported.contains(&algorithm)
    }
}

impl Default for KemCapabilities {
    fn default() -> Self {
        Self::all()
    }
}

/// Negotiate a KEM algorithm between two peers
///
/// # Arguments
///
/// * `ours` - Our KEM capabilities
/// * `theirs` - Their KEM capabilities
///
/// # Returns
///
/// The first mutually supported algorithm, or None if no match
pub fn negotiate(ours: &KemCapabilities, theirs: &KemCapabilities) -> Option<KemAlgorithm> {
    for algorithm in &ours.supported {
        if theirs.supports(*algorithm) {
            return Some(*algorithm);
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_negotiate_hybrid() {
        let ours = KemCapabilities::all();
        let theirs = KemCapabilities::all();

        let result = negotiate(&ours, &theirs);
        assert_eq!(result, Some(KemAlgorithm::Hybrid));
    }

    #[test]
    fn test_negotiate_pq_only() {
        let ours = KemCapabilities::pq_only();
        let theirs = KemCapabilities::all();

        let result = negotiate(&ours, &theirs);
        assert_eq!(result, Some(KemAlgorithm::MlKem1024));
    }

    #[test]
    fn test_negotiate_no_match() {
        let ours = KemCapabilities::pq_only();
        let theirs = KemCapabilities::classical_only();

        let result = negotiate(&ours, &theirs);
        assert_eq!(result, None);
    }

    #[test]
    fn test_supports() {
        let caps = KemCapabilities::all();
        assert!(caps.supports(KemAlgorithm::Hybrid));
        assert!(caps.supports(KemAlgorithm::MlKem1024));
        assert!(caps.supports(KemAlgorithm::X25519));

        let pq_caps = KemCapabilities::pq_only();
        assert!(!pq_caps.supports(KemAlgorithm::X25519));
    }
}

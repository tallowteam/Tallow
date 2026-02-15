//! NAT type detection

use crate::Result;

/// NAT type classification
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NatType {
    /// Full cone NAT (easiest to traverse)
    FullCone,
    /// Restricted cone NAT
    RestrictedCone,
    /// Port-restricted cone NAT
    PortRestricted,
    /// Symmetric NAT (hardest to traverse)
    Symmetric,
    /// Unknown or no NAT
    Unknown,
}

/// Detect NAT type using STUN
pub async fn detect() -> Result<NatType> {
    todo!("Implement NAT type detection")
}

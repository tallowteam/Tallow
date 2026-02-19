//! Password-Authenticated Key Exchange (PAKE) protocols
//!
//! CPace is the v1 PAKE protocol, implemented over Ristretto255.
//! OPAQUE is deferred to v2.

pub mod cpace;

pub use cpace::{CpaceInitiator, CpaceResponder};

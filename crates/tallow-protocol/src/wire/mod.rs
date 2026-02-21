//! Wire protocol encoding/decoding
//!
//! Messages are serialized with postcard and framed with 4-byte BE length prefixes.

#[cfg(feature = "full")]
pub mod codec;
pub mod messages;
#[cfg(feature = "full")]
pub mod version;

#[cfg(feature = "full")]
pub use codec::TallowCodec;
pub use messages::Message;
#[cfg(feature = "full")]
pub use version::{
    negotiate_version, process_version_request, version_request, MIN_PROTOCOL_VERSION,
    PROTOCOL_VERSION,
};

//! Wire protocol encoding/decoding
//!
//! Messages are serialized with postcard and framed with 4-byte BE length prefixes.

pub mod codec;
pub mod messages;
pub mod version;

pub use codec::TallowCodec;
pub use messages::Message;
pub use version::{
    negotiate_version, process_version_request, version_request, MIN_PROTOCOL_VERSION,
    PROTOCOL_VERSION,
};

//! Wire protocol encoding/decoding
//!
//! Messages are serialized with postcard and framed with 4-byte BE length prefixes.

pub mod codec;
pub mod messages;
pub mod version;

pub use codec::TallowCodec;
pub use messages::Message;
pub use version::{PROTOCOL_VERSION, MIN_PROTOCOL_VERSION, negotiate_version, version_request, process_version_request};

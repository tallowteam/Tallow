//! Codec for encoding/decoding Tallow protocol messages

use bytes::BytesMut;
use super::Message;
use crate::{ProtocolError, Result};

/// Tallow protocol codec
#[derive(Debug, Default)]
pub struct TallowCodec;

impl TallowCodec {
    /// Create a new codec
    pub fn new() -> Self {
        Self
    }

    /// Encode a message
    pub fn encode(&mut self, _msg: Message, _buf: &mut BytesMut) -> Result<()> {
        todo!("Implement message encoding")
    }

    /// Decode a message
    pub fn decode(&mut self, _buf: &mut BytesMut) -> Result<Option<Message>> {
        todo!("Implement message decoding")
    }
}

// Note: tokio_util::codec traits would be implemented here when tokio is added

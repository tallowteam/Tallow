//! Store error types

use std::fmt;

/// Storage layer errors
#[derive(Debug)]
pub enum StoreError {
    /// Configuration error
    ConfigError(String),
    /// Identity error
    IdentityError(String),
    /// Trust database error
    TrustError(String),
    /// Persistence error
    PersistenceError(String),
    /// Serialization error
    SerializationError(String),
    /// IO error
    Io(std::io::Error),
}

impl fmt::Display for StoreError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ConfigError(msg) => write!(f, "Config error: {}", msg),
            Self::IdentityError(msg) => write!(f, "Identity error: {}", msg),
            Self::TrustError(msg) => write!(f, "Trust error: {}", msg),
            Self::PersistenceError(msg) => write!(f, "Persistence error: {}", msg),
            Self::SerializationError(msg) => write!(f, "Serialization error: {}", msg),
            Self::Io(err) => write!(f, "IO error: {}", err),
        }
    }
}

impl std::error::Error for StoreError {}

impl From<std::io::Error> for StoreError {
    fn from(err: std::io::Error) -> Self {
        Self::Io(err)
    }
}

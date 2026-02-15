//! File encryption and decryption

pub mod decrypt;
pub mod encrypt;

pub use decrypt::{decrypt_chunk, FileDecryptor};
pub use encrypt::{encrypt_chunk, EncryptedChunk, FileEncryptor};

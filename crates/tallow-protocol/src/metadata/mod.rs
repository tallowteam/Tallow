//! Metadata handling and privacy

pub mod filename;
pub mod stripper;

pub use filename::{decrypt_filename, encrypt_filename};
pub use stripper::{strip_exif, strip_metadata};

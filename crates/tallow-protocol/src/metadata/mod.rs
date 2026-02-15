//! Metadata handling and privacy

pub mod stripper;
pub mod filename;

pub use stripper::{strip_exif, strip_metadata};
pub use filename::{encrypt_filename, decrypt_filename};

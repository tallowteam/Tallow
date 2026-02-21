//! Tallow WebAssembly browser client
//!
//! Thin wasm-bindgen wrapper over tallow-crypto and tallow-protocol wire types.
//! The browser uses identical cryptographic code paths to the CLI.
#![forbid(unsafe_code)]

pub mod codec;
pub mod crypto;

use wasm_bindgen::prelude::*;

/// Initialize WASM module (called automatically on load)
#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
}

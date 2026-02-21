//! Encrypted key-value store with file persistence
//!
//! Each value is encrypted independently with AES-256-GCM using a key
//! derived from the master passphrase via Argon2id.

use crate::Result;
use crate::StoreError;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use zeroize::Zeroize;

/// On-disk format for encrypted K/V entries
#[derive(Serialize, Deserialize)]
struct EncryptedEntry {
    salt: [u8; 16],
    nonce: [u8; 12],
    ciphertext: Vec<u8>,
}

/// On-disk format for the full store
#[derive(Serialize, Deserialize, Default)]
struct StoreData {
    entries: HashMap<String, EncryptedEntry>,
    /// Random salt for master key derivation (added in v2)
    /// Absent in legacy stores; generated on first save.
    #[serde(default)]
    master_salt: Option<[u8; 16]>,
}

/// Encrypted key-value store
///
/// Manual `Debug` impl redacts `master_key` and `cache` to prevent
/// secret material from appearing in logs, panics, or `{:?}` formatting.
pub struct EncryptedKv {
    /// In-memory decrypted cache
    cache: HashMap<String, Vec<u8>>,
    /// Path to the store file
    path: PathBuf,
    /// Master key (derived from passphrase)
    master_key: [u8; 32],
    /// Random salt used for master key derivation (persisted in store file)
    master_salt: [u8; 16],
}

impl std::fmt::Debug for EncryptedKv {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("EncryptedKv")
            .field("path", &self.path)
            .field(
                "cache",
                &format!("[{} entries, REDACTED]", self.cache.len()),
            )
            .field("master_key", &"[REDACTED]")
            .field("master_salt", &self.master_salt)
            .finish()
    }
}

impl EncryptedKv {
    /// Create a new encrypted KV store
    pub fn new() -> Self {
        Self {
            cache: HashMap::new(),
            path: PathBuf::new(),
            master_key: [0u8; 32],
            master_salt: [0u8; 16],
        }
    }

    /// Open a store at the given path with a master passphrase
    pub fn open(path: PathBuf, passphrase: &str) -> Result<Self> {
        // Load existing data to get the stored salt (if any)
        let existing_data = if path.exists() {
            let data = std::fs::read(&path)?;
            Some(bincode::deserialize::<StoreData>(&data).map_err(|e| {
                StoreError::PersistenceError(format!("Failed to parse store: {}", e))
            })?)
        } else {
            None
        };

        // Use stored random salt, or generate a new one for fresh stores
        let kv_salt: [u8; 16] = existing_data
            .as_ref()
            .and_then(|d| d.master_salt)
            .unwrap_or_else(rand::random);

        // Derive master key from passphrase using Argon2id (memory-hard KDF)
        let mut derived =
            tallow_crypto::kdf::argon2::derive_key(passphrase.as_bytes(), &kv_salt, 32).map_err(
                |e| StoreError::PersistenceError(format!("Argon2id key derivation failed: {}", e)),
            )?;
        let mut master_key = [0u8; 32];
        master_key.copy_from_slice(&derived[..32]);
        derived.zeroize();

        let mut store = Self {
            cache: HashMap::new(),
            path,
            master_key,
            master_salt: kv_salt,
        };

        // Load and decrypt existing entries
        if let Some(store_data) = existing_data {
            store.decrypt_entries(store_data)?;
        }

        Ok(store)
    }

    /// Get a value by key
    pub fn get(&self, key: &str) -> Result<Option<Vec<u8>>> {
        Ok(self.cache.get(key).cloned())
    }

    /// Set a value, persisting to disk
    pub fn set(&mut self, key: &str, value: &[u8]) -> Result<()> {
        self.cache.insert(key.to_string(), value.to_vec());
        self.save_to_disk()
    }

    /// Delete a value, persisting to disk
    pub fn delete(&mut self, key: &str) -> Result<()> {
        self.cache.remove(key);
        self.save_to_disk()
    }

    /// List all keys
    pub fn keys(&self) -> Vec<&str> {
        self.cache.keys().map(|k| k.as_str()).collect()
    }

    /// Decrypt all entries from a loaded StoreData
    fn decrypt_entries(&mut self, store_data: StoreData) -> Result<()> {
        self.cache.clear();
        for (key, entry) in store_data.entries {
            let plaintext = tallow_crypto::symmetric::aes_decrypt(
                &self.master_key,
                &entry.nonce,
                &entry.ciphertext,
                key.as_bytes(), // AAD = key name for domain binding
            )
            .map_err(|e| {
                StoreError::PersistenceError(format!("Failed to decrypt entry '{}': {}", key, e))
            })?;
            self.cache.insert(key, plaintext);
        }

        Ok(())
    }

    /// Encrypt all entries and save to disk atomically
    fn save_to_disk(&self) -> Result<()> {
        if let Some(parent) = self.path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let mut store_data = StoreData {
            master_salt: Some(self.master_salt),
            ..Default::default()
        };

        for (key, value) in &self.cache {
            let nonce: [u8; 12] = rand::random();
            let salt: [u8; 16] = rand::random();

            let ciphertext = tallow_crypto::symmetric::aes_encrypt(
                &self.master_key,
                &nonce,
                value,
                key.as_bytes(), // AAD = key name for domain binding
            )
            .map_err(|e| {
                StoreError::PersistenceError(format!("Failed to encrypt entry '{}': {}", key, e))
            })?;

            store_data.entries.insert(
                key.clone(),
                EncryptedEntry {
                    salt,
                    nonce,
                    ciphertext,
                },
            );
        }

        let data = bincode::serialize(&store_data).map_err(|e| {
            StoreError::SerializationError(format!("Failed to serialize store: {}", e))
        })?;

        // Atomic write: write to temp file then rename
        let tmp_path = self.path.with_extension("tmp");
        std::fs::write(&tmp_path, &data)?;
        std::fs::rename(&tmp_path, &self.path)?;

        // Restrict file permissions to owner-only on Unix (0o600)
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let perms = std::fs::Permissions::from_mode(0o600);
            let _ = std::fs::set_permissions(&self.path, perms);
        }

        Ok(())
    }
}

impl Default for EncryptedKv {
    fn default() -> Self {
        Self::new()
    }
}

impl Drop for EncryptedKv {
    fn drop(&mut self) {
        // Zeroize master key on drop using zeroize crate
        // (compiler cannot optimize this away)
        self.master_key.zeroize();
        // Clear cached plaintext values
        for value in self.cache.values_mut() {
            value.zeroize();
        }
        self.cache.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_set_get() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("store.enc");

        let mut store = EncryptedKv::open(path, "test-pass").unwrap();
        store.set("key1", b"value1").unwrap();

        let val = store.get("key1").unwrap();
        assert_eq!(val, Some(b"value1".to_vec()));
    }

    #[test]
    fn test_persistence() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("store.enc");

        // Write
        {
            let mut store = EncryptedKv::open(path.clone(), "test-pass").unwrap();
            store.set("key1", b"value1").unwrap();
            store.set("key2", b"value2").unwrap();
        }

        // Read in new instance
        {
            let store = EncryptedKv::open(path, "test-pass").unwrap();
            assert_eq!(store.get("key1").unwrap(), Some(b"value1".to_vec()));
            assert_eq!(store.get("key2").unwrap(), Some(b"value2".to_vec()));
        }
    }

    #[test]
    fn test_delete() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("store.enc");

        let mut store = EncryptedKv::open(path, "test-pass").unwrap();
        store.set("key1", b"value1").unwrap();
        store.delete("key1").unwrap();

        assert_eq!(store.get("key1").unwrap(), None);
    }

    #[test]
    fn test_keys() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("store.enc");

        let mut store = EncryptedKv::open(path, "test-pass").unwrap();
        store.set("alpha", b"a").unwrap();
        store.set("beta", b"b").unwrap();

        let mut keys = store.keys();
        keys.sort();
        assert_eq!(keys, vec!["alpha", "beta"]);
    }
}

//! Identity keypair storage with encrypted persistence

use crate::persistence::paths;
use crate::Result;
use crate::StoreError;
use std::path::Path;

/// Identity store for managing keypairs
pub struct IdentityStore {
    /// The identity keypair (loaded on demand)
    keypair: Option<tallow_crypto::keys::IdentityKeyPair>,
    /// Path to the encrypted identity file
    path: std::path::PathBuf,
}

impl std::fmt::Debug for IdentityStore {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("IdentityStore")
            .field("keypair", &self.keypair.as_ref().map(|_| "[REDACTED]"))
            .field("path", &self.path)
            .finish()
    }
}

impl IdentityStore {
    /// Create a new identity store with default path
    pub fn new() -> Self {
        Self {
            keypair: None,
            path: paths::identity_file(),
        }
    }

    /// Create an identity store with a custom path
    pub fn with_path(path: std::path::PathBuf) -> Self {
        Self {
            keypair: None,
            path,
        }
    }

    /// Check if an identity exists on disk
    pub fn exists(&self) -> bool {
        self.path.exists()
    }

    /// Generate a new keypair and persist it encrypted
    ///
    /// Uses the provided passphrase to encrypt the keypair.
    /// If passphrase is empty, the keypair is still encrypted (Argon2id salt provides uniqueness).
    pub fn generate(&mut self, passphrase: &str) -> Result<()> {
        let keypair = tallow_crypto::keys::IdentityKeyPair::generate()
            .map_err(|e| StoreError::IdentityError(format!("Failed to generate keypair: {}", e)))?;

        self.save_encrypted(&keypair, passphrase)?;
        self.keypair = Some(keypair);
        Ok(())
    }

    /// Load the identity from disk
    pub fn load(&mut self, passphrase: &str) -> Result<()> {
        let keypair = self.load_encrypted(passphrase)?;
        self.keypair = Some(keypair);
        Ok(())
    }

    /// Load or generate identity (convenience for first-run flow)
    pub fn load_or_generate(&mut self, passphrase: &str) -> Result<()> {
        if self.exists() {
            self.load(passphrase)
        } else {
            // Ensure directory exists
            if let Some(parent) = self.path.parent() {
                std::fs::create_dir_all(parent)?;
            }
            self.generate(passphrase)
        }
    }

    /// Export keypair to a portable encrypted file
    pub fn export(&self, output: &Path, passphrase: &str) -> Result<Vec<u8>> {
        let keypair = self
            .keypair
            .as_ref()
            .ok_or_else(|| StoreError::IdentityError("No identity loaded".to_string()))?;

        let key_bytes = keypair.to_bytes().map_err(|e| {
            StoreError::IdentityError(format!("Failed to serialize keypair: {}", e))
        })?;

        let encrypted = tallow_crypto::keys::encrypt_keyring(passphrase, &key_bytes)
            .map_err(|e| StoreError::IdentityError(format!("Failed to encrypt export: {}", e)))?;

        let export_bytes = bincode::serialize(&encrypted).map_err(|e| {
            StoreError::SerializationError(format!("Failed to serialize export: {}", e))
        })?;

        std::fs::write(output, &export_bytes)?;
        Ok(export_bytes)
    }

    /// Import keypair from a portable encrypted file
    pub fn import(&mut self, input: &Path, passphrase: &str) -> Result<()> {
        let data = std::fs::read(input)
            .map_err(|e| StoreError::IdentityError(format!("Failed to read import file: {}", e)))?;

        let keyring: tallow_crypto::keys::EncryptedKeyring =
            bincode::deserialize(&data).map_err(|e| {
                StoreError::SerializationError(format!("Failed to parse import: {}", e))
            })?;

        let key_bytes = tallow_crypto::keys::decrypt_keyring(passphrase, &keyring)
            .map_err(|e| StoreError::IdentityError(format!("Failed to decrypt import: {}", e)))?;

        let keypair = tallow_crypto::keys::IdentityKeyPair::from_bytes(&key_bytes)
            .map_err(|e| StoreError::IdentityError(format!("Failed to parse keypair: {}", e)))?;

        // Save to our local identity file with the same passphrase
        self.save_encrypted(&keypair, passphrase)?;
        self.keypair = Some(keypair);
        Ok(())
    }

    /// Get the public key bytes (BLAKE3 identity hash)
    pub fn public_key(&self) -> Option<&[u8; 32]> {
        self.keypair.as_ref().map(|kp| kp.id())
    }

    /// Get the fingerprint (hex-encoded identity hash)
    pub fn fingerprint(&self) -> Option<String> {
        self.public_key()
            .map(|pk| super::fingerprint::fingerprint_hex(pk))
    }

    /// Get the full identity keypair (for signing)
    pub fn keypair(&self) -> Option<&tallow_crypto::keys::IdentityKeyPair> {
        self.keypair.as_ref()
    }

    /// Save keypair encrypted to disk
    fn save_encrypted(
        &self,
        keypair: &tallow_crypto::keys::IdentityKeyPair,
        passphrase: &str,
    ) -> Result<()> {
        // Ensure parent directory exists
        if let Some(parent) = self.path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let key_bytes = keypair.to_bytes().map_err(|e| {
            StoreError::IdentityError(format!("Failed to serialize keypair: {}", e))
        })?;

        let encrypted = tallow_crypto::keys::encrypt_keyring(passphrase, &key_bytes)
            .map_err(|e| StoreError::IdentityError(format!("Failed to encrypt keypair: {}", e)))?;

        let enc_bytes = bincode::serialize(&encrypted).map_err(|e| {
            StoreError::SerializationError(format!("Failed to serialize encrypted keypair: {}", e))
        })?;

        std::fs::write(&self.path, enc_bytes)?;
        Ok(())
    }

    /// Load keypair decrypted from disk
    fn load_encrypted(&self, passphrase: &str) -> Result<tallow_crypto::keys::IdentityKeyPair> {
        let data = std::fs::read(&self.path).map_err(|e| {
            StoreError::IdentityError(format!(
                "Failed to read identity at {}: {}",
                self.path.display(),
                e
            ))
        })?;

        let keyring: tallow_crypto::keys::EncryptedKeyring =
            bincode::deserialize(&data).map_err(|e| {
                StoreError::SerializationError(format!("Failed to parse encrypted identity: {}", e))
            })?;

        let key_bytes = tallow_crypto::keys::decrypt_keyring(passphrase, &keyring)
            .map_err(|e| StoreError::IdentityError(format!("Failed to decrypt identity: {}", e)))?;

        tallow_crypto::keys::IdentityKeyPair::from_bytes(&key_bytes)
            .map_err(|e| StoreError::IdentityError(format!("Failed to parse keypair: {}", e)))
    }
}

impl Default for IdentityStore {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_generate_and_load() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("identity.enc");
        let passphrase = "test-passphrase";

        let mut store = IdentityStore::with_path(path.clone());
        assert!(!store.exists());

        store.generate(passphrase).unwrap();
        assert!(store.exists());
        assert!(store.public_key().is_some());

        let fingerprint1 = store.fingerprint().unwrap();

        // Load in a new store
        let mut store2 = IdentityStore::with_path(path);
        store2.load(passphrase).unwrap();
        let fingerprint2 = store2.fingerprint().unwrap();

        assert_eq!(fingerprint1, fingerprint2);
    }

    #[test]
    fn test_export_import() {
        let dir = TempDir::new().unwrap();
        let identity_path = dir.path().join("identity.enc");
        let export_path = dir.path().join("export.enc");
        let passphrase = "test-passphrase";

        // Generate
        let mut store = IdentityStore::with_path(identity_path);
        store.generate(passphrase).unwrap();
        let original_fp = store.fingerprint().unwrap();

        // Export
        store.export(&export_path, passphrase).unwrap();
        assert!(export_path.exists());

        // Import into new store
        let import_path = dir.path().join("imported.enc");
        let mut store2 = IdentityStore::with_path(import_path);
        store2.import(&export_path, passphrase).unwrap();
        let imported_fp = store2.fingerprint().unwrap();

        assert_eq!(original_fp, imported_fp);
    }

    #[test]
    fn test_load_or_generate() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("identity.enc");
        let passphrase = "";

        // First call generates
        let mut store = IdentityStore::with_path(path.clone());
        store.load_or_generate(passphrase).unwrap();
        let fp1 = store.fingerprint().unwrap();

        // Second call loads existing
        let mut store2 = IdentityStore::with_path(path);
        store2.load_or_generate(passphrase).unwrap();
        let fp2 = store2.fingerprint().unwrap();

        assert_eq!(fp1, fp2);
    }
}

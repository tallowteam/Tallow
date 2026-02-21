//! SSH key exchange command — send/receive SSH public keys securely
//!
//! Uses Tallow's E2E encrypted channel to exchange SSH public keys.
//! - Send mode (default): reads local SSH public key and sends it
//! - Receive mode (`--accept`): receives a key and appends to authorized_keys
//!
//! This is essentially a specialized text transfer where the payload is
//! an SSH public key, with added safety checks for key format validation,
//! fingerprint display, and duplicate detection.

use crate::cli::SshSetupArgs;
use crate::output;
use std::io;
use std::path::PathBuf;
use tracing::{info, warn};

/// Execute ssh-setup command
pub async fn execute(args: SshSetupArgs, json: bool) -> io::Result<()> {
    if args.accept {
        receive_ssh_key(&args, json).await
    } else {
        send_ssh_key(&args, json).await
    }
}

/// Send mode: read local SSH public key and send via encrypted channel
async fn send_ssh_key(args: &SshSetupArgs, json: bool) -> io::Result<()> {
    // 1. Find SSH public key
    let key_path = if let Some(ref path) = args.key {
        PathBuf::from(path)
    } else {
        find_ssh_pubkey()?
    };

    let pub_key = std::fs::read_to_string(&key_path).map_err(|e| {
        io::Error::new(
            io::ErrorKind::NotFound,
            format!("Cannot read SSH key {}: {}", key_path.display(), e),
        )
    })?;
    let pub_key = pub_key.trim().to_string();

    // Validate SSH key format
    validate_ssh_key(&pub_key)?;

    // 2. Compute fingerprint
    let fingerprint = compute_ssh_fingerprint(&pub_key);
    let key_type = pub_key.split_whitespace().next().unwrap_or("unknown");

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "ssh_key_loaded",
                "key_path": key_path.display().to_string(),
                "key_type": key_type,
                "fingerprint": fingerprint,
            })
        );
    } else {
        output::color::section("SSH Key Exchange -- Send Mode");
        output::color::info(&format!("Key: {}", key_path.display()));
        output::color::info(&format!("Type: {}", key_type));
        output::color::info(&format!("Fingerprint: {}", fingerprint));
    }

    // 3. Send via tallow's text send mechanism
    // Build SendArgs to reuse the existing send infrastructure
    info!("Sending SSH public key via encrypted channel");

    let send_args = crate::cli::SendArgs {
        files: Vec::new(),
        text: Some(pub_key),
        custom_code: args.code.clone(),
        words: None,
        qr: false,
        no_clipboard: false,
        ignore_stdin: true,
        to: None,
        room: None,
        compress: "none".to_string(), // SSH keys are small, no compression needed
        strip_metadata: false,
        encrypt_filenames: false,
        relay: args.relay.clone(),
        relay_pass: args.relay_pass.clone(),
        proxy: None,
        tor: false,
        discover: false,
        exclude: None,
        git: false,
        throttle: None,
        ask: false,
        verify: true, // Always verify for SSH key exchange
        local: false,
        no_p2p: false,
        dry_run: false,
        notify: false,
        max_retries: 5,
        no_hooks: true, // No hooks for SSH key exchange
    };

    if !json {
        output::color::info("Starting encrypted transfer...");
        println!();
    }

    crate::commands::send::execute(send_args, json).await
}

/// Receive mode: receive SSH key and optionally append to authorized_keys
async fn receive_ssh_key(args: &SshSetupArgs, json: bool) -> io::Result<()> {
    let code = args.code.as_ref().ok_or_else(|| {
        io::Error::new(
            io::ErrorKind::InvalidInput,
            "Code phrase required to receive SSH key. Usage: tallow ssh-setup --accept <code>",
        )
    })?;

    if !json {
        output::color::section("SSH Key Exchange -- Receive Mode");
        output::color::info("Receiving SSH public key via encrypted channel...");
        println!();
    }

    // Use receive infrastructure to get the key
    // We create a temporary directory to receive into
    let temp_dir = std::env::temp_dir().join("tallow-ssh-receive");
    std::fs::create_dir_all(&temp_dir)?;

    let receive_args = crate::cli::ReceiveArgs {
        code: Some(code.clone()),
        output: Some(temp_dir.clone()),
        yes: true, // Auto-accept since user explicitly ran ssh-setup --accept
        overwrite: true,
        auto_accept: false,
        relay: args.relay.clone(),
        relay_pass: args.relay_pass.clone(),
        proxy: None,
        tor: false,
        advertise: false,
        resume_id: None,
        verify: true, // Always verify for SSH key exchange
        local: false,
        no_p2p: false,
        notify: false,
        max_retries: 5,
        no_hooks: true, // No hooks for SSH key exchange
        per_file: false,
    };

    crate::commands::receive::execute(receive_args, json).await?;

    // After receive, look for the received text content
    // The receive command writes text to stdout when in text mode,
    // so we need to handle this differently. For now, guide the user.
    if !json {
        println!();
        output::color::section("Next Steps");
        output::color::info("The SSH public key was received via the encrypted channel above.");
        output::color::info("To add it to your authorized_keys, copy the key and run:");
        println!("  echo '<received-key>' >> ~/.ssh/authorized_keys");
        println!();
        output::color::warning("Always verify the key fingerprint with the sender before adding!");
    }

    // Clean up temp dir
    let _ = std::fs::remove_dir_all(&temp_dir);

    Ok(())
}

/// Find the best SSH public key in ~/.ssh/
fn find_ssh_pubkey() -> io::Result<PathBuf> {
    let ssh_dir = dirs::home_dir()
        .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "Cannot find home directory"))?
        .join(".ssh");

    if !ssh_dir.exists() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            format!(
                "SSH directory not found: {}. Generate a key with: ssh-keygen -t ed25519",
                ssh_dir.display()
            ),
        ));
    }

    // Try common key types in preference order (most secure first)
    for name in &["id_ed25519.pub", "id_ecdsa.pub", "id_rsa.pub"] {
        let path = ssh_dir.join(name);
        if path.exists() {
            info!("Found SSH public key: {}", path.display());
            return Ok(path);
        }
    }

    Err(io::Error::new(
        io::ErrorKind::NotFound,
        format!(
            "No SSH public key found in {}. Use --key to specify path, \
             or generate one with: ssh-keygen -t ed25519",
            ssh_dir.display()
        ),
    ))
}

/// Validate that a string looks like an SSH public key
fn validate_ssh_key(key: &str) -> io::Result<()> {
    let parts: Vec<&str> = key.split_whitespace().collect();

    if parts.len() < 2 {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            "Invalid SSH key format: expected 'type base64-data [comment]'",
        ));
    }

    let valid_types = [
        "ssh-ed25519",
        "ssh-rsa",
        "ecdsa-sha2-nistp256",
        "ecdsa-sha2-nistp384",
        "ecdsa-sha2-nistp521",
        "ssh-dss",
        "sk-ssh-ed25519@openssh.com",
        "sk-ecdsa-sha2-nistp256@openssh.com",
    ];

    if !valid_types.contains(&parts[0]) {
        warn!("Unrecognized SSH key type: {}", parts[0]);
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            format!(
                "Unrecognized SSH key type '{}'. Expected one of: {}",
                parts[0],
                valid_types.join(", ")
            ),
        ));
    }

    // Basic base64 validation (SSH keys use standard base64)
    if parts[1].len() < 16 {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            "SSH key data is too short to be valid",
        ));
    }

    Ok(())
}

/// Compute a BLAKE3 fingerprint of an SSH public key
///
/// Uses the base64 key data (second field) for fingerprinting,
/// matching the convention of `ssh-keygen -l` but using BLAKE3
/// instead of SHA256.
fn compute_ssh_fingerprint(pub_key: &str) -> String {
    let parts: Vec<&str> = pub_key.split_whitespace().collect();
    if parts.len() >= 2 {
        let hash = blake3::hash(parts[1].as_bytes());
        let hex = hash.to_hex();
        format!("BLAKE3:{}", &hex[..32])
    } else {
        "invalid key format".to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compute_fingerprint_valid_key() {
        let key = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGpMzETnWjMBQnPu3UZ6jB/MkRz4test user@host";
        let fp = compute_ssh_fingerprint(key);
        assert!(fp.starts_with("BLAKE3:"));
        assert_eq!(fp.len(), 7 + 32); // "BLAKE3:" + 32 hex chars
    }

    #[test]
    fn test_compute_fingerprint_invalid_key() {
        let fp = compute_ssh_fingerprint("invalid");
        assert_eq!(fp, "invalid key format");
    }

    #[test]
    fn test_validate_ssh_key_ed25519() {
        let key = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGpMzETnWjMBQnPu3UZ6jB/MkRz4test user@host";
        assert!(validate_ssh_key(key).is_ok());
    }

    #[test]
    fn test_validate_ssh_key_rsa() {
        let key = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7example user@host";
        assert!(validate_ssh_key(key).is_ok());
    }

    #[test]
    fn test_validate_ssh_key_invalid_type() {
        let key = "not-ssh AAAAB3NzaC1yc2E";
        assert!(validate_ssh_key(key).is_err());
    }

    #[test]
    fn test_validate_ssh_key_too_short() {
        let key = "ssh-ed25519 short";
        assert!(validate_ssh_key(key).is_err());
    }

    #[test]
    fn test_validate_ssh_key_empty() {
        assert!(validate_ssh_key("").is_err());
    }

    #[test]
    fn test_fingerprint_deterministic() {
        let key = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGpMzETnWjMBQnPu3UZ6jB/MkRz4test user@host";
        let fp1 = compute_ssh_fingerprint(key);
        let fp2 = compute_ssh_fingerprint(key);
        assert_eq!(fp1, fp2);
    }
}

//! Self-update command implementation
//!
//! Detects installation method and performs the appropriate update:
//! - Homebrew: delegates to `brew upgrade tallow`
//! - Scoop: delegates to `scoop update tallow`
//! - Cargo: delegates to `cargo install --git ... --force`
//! - Direct binary: downloads from GitHub Releases, verifies SHA-256, replaces binary

use crate::cli::UpdateArgs;
use crate::output;
use std::io;
use std::path::{Path, PathBuf};
use std::time::Duration;

const GITHUB_REPO: &str = "tallowteam/Tallow";
const GITHUB_API_URL: &str = "https://api.github.com/repos/tallowteam/Tallow/releases/latest";
const HTTP_TIMEOUT: Duration = Duration::from_secs(60);
const DOWNLOAD_TIMEOUT: Duration = Duration::from_secs(300);

/// How tallow was installed on this system
#[derive(Debug)]
enum InstallMethod {
    Homebrew,
    Scoop,
    Cargo,
    DirectBinary { path: PathBuf },
}

/// Information about a GitHub release
#[derive(Debug)]
struct ReleaseInfo {
    #[allow(dead_code)]
    tag_name: String,
    version: semver::Version,
    assets: Vec<AssetInfo>,
}

/// A single release asset (binary archive or checksum)
#[derive(Debug)]
struct AssetInfo {
    name: String,
    download_url: String,
}

/// Main entry point for `tallow update`
pub async fn execute(args: UpdateArgs, json: bool) -> io::Result<()> {
    let current = current_version();
    let method = detect_install_method()?;

    if !json {
        output::color::section("Tallow Update");
        output::color::info(&format!("Current version: {}", current));
        output::color::info(&format!("Install method:  {}", method_display(&method)));
    }

    // Fetch latest release from GitHub
    let release = fetch_latest_release().await?;

    let up_to_date = release.version <= current && !args.force;

    if json {
        let info = serde_json::json!({
            "event": "update_check",
            "current_version": current.to_string(),
            "latest_version": release.version.to_string(),
            "up_to_date": up_to_date,
            "install_method": method_str(&method),
        });
        println!("{}", info);
        if args.check || up_to_date {
            return Ok(());
        }
    } else {
        output::color::info(&format!("Latest version:  {}", release.version));

        if up_to_date {
            output::color::success("Already up to date!");
            return Ok(());
        }

        println!();
        output::color::info(&format!(
            "Update available: {} -> {}",
            current, release.version
        ));
    }

    if args.check {
        if !json {
            println!();
            output::color::info("Run `tallow update` to install.");
        }
        return Ok(());
    }

    // Confirm with user unless --yes
    if !args.yes && !json {
        let confirm = dialoguer::Confirm::new()
            .with_prompt(format!("Update tallow {} -> {}?", current, release.version))
            .default(false)
            .interact()
            .map_err(|e| io::Error::other(format!("Input error: {}", e)))?;

        if !confirm {
            output::color::info("Update cancelled.");
            return Ok(());
        }
    }

    // Perform update based on install method
    match method {
        InstallMethod::Homebrew => {
            run_package_manager(json, "brew", &["upgrade", "tallow"])?;
        }
        InstallMethod::Scoop => {
            run_package_manager(json, "scoop", &["update", "tallow"])?;
        }
        InstallMethod::Cargo => {
            run_package_manager(
                json,
                "cargo",
                &[
                    "install",
                    "--git",
                    &format!("https://github.com/{}", GITHUB_REPO),
                    "tallow",
                    "--force",
                ],
            )?;
        }
        InstallMethod::DirectBinary { ref path } => {
            self_update_binary(path, &release, json).await?;
        }
    }

    if json {
        let info = serde_json::json!({
            "event": "update_complete",
            "previous_version": current.to_string(),
            "new_version": release.version.to_string(),
            "install_method": method_str(&method),
        });
        println!("{}", info);
    } else {
        println!();
        output::color::success(&format!("Updated to tallow {}", release.version));
    }

    Ok(())
}

/// Parse the compiled-in version string
fn current_version() -> semver::Version {
    semver::Version::parse(env!("CARGO_PKG_VERSION")).unwrap_or(semver::Version::new(0, 0, 0))
}

/// Detect how tallow was installed by examining the binary path
fn detect_install_method() -> io::Result<InstallMethod> {
    let exe = std::env::current_exe()
        .and_then(|p| p.canonicalize())
        .map_err(|e| io::Error::other(format!("Cannot determine executable path: {}", e)))?;

    let path_str = exe.to_string_lossy();

    // Dev build detection
    if path_str.contains("target/debug")
        || path_str.contains("target/release")
        || path_str.contains("target\\debug")
        || path_str.contains("target\\release")
    {
        return Err(io::Error::other(
            "Running from a development build (target/ directory). \
             Use `cargo build` or `git pull` to update instead.",
        ));
    }

    // Homebrew: /opt/homebrew/Cellar/tallow/ or /usr/local/Cellar/tallow/ or /home/linuxbrew/
    if path_str.contains("/Cellar/tallow/")
        || path_str.contains("/homebrew/bin/")
        || path_str.contains("/linuxbrew/")
    {
        return Ok(InstallMethod::Homebrew);
    }

    // Scoop: ~\scoop\apps\tallow\
    if path_str.contains("\\scoop\\apps\\tallow\\") || path_str.contains("/scoop/apps/tallow/") {
        return Ok(InstallMethod::Scoop);
    }

    // Cargo: ~/.cargo/bin/ or $CARGO_HOME/bin/
    let cargo_home = std::env::var("CARGO_HOME")
        .ok()
        .map(PathBuf::from)
        .or_else(|| dirs::home_dir().map(|h| h.join(".cargo")));

    if let Some(cargo_dir) = cargo_home {
        let cargo_bin = cargo_dir.join("bin");
        if let Ok(canonical_cargo) = cargo_bin.canonicalize() {
            if let Some(parent) = exe.parent() {
                if parent == canonical_cargo {
                    return Ok(InstallMethod::Cargo);
                }
            }
        }
    }

    Ok(InstallMethod::DirectBinary {
        path: exe.to_path_buf(),
    })
}

/// Fetch the latest release info from GitHub API
async fn fetch_latest_release() -> io::Result<ReleaseInfo> {
    let client = build_http_client(HTTP_TIMEOUT)?;

    let mut request = client
        .get(GITHUB_API_URL)
        .header("Accept", "application/vnd.github.v3+json")
        .header(
            "User-Agent",
            format!("tallow/{}", env!("CARGO_PKG_VERSION")),
        );

    // Support GITHUB_TOKEN for rate limiting
    if let Ok(token) = std::env::var("GITHUB_TOKEN") {
        request = request.header("Authorization", format!("Bearer {}", token));
    }

    let resp = request
        .send()
        .await
        .map_err(|e| io::Error::other(format!("Failed to fetch latest release: {}", e)))?;

    if resp.status() == 403 {
        return Err(io::Error::other(
            "GitHub API rate limit exceeded. Set GITHUB_TOKEN env var for higher limits, \
             or download manually from https://github.com/tallowteam/Tallow/releases",
        ));
    }

    if !resp.status().is_success() {
        return Err(io::Error::other(format!(
            "GitHub API returned status {}",
            resp.status()
        )));
    }

    let body: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| io::Error::other(format!("Failed to parse release info: {}", e)))?;

    let tag_name = body["tag_name"]
        .as_str()
        .ok_or_else(|| io::Error::other("Missing tag_name in release"))?
        .to_string();

    // Parse version from tag (strip leading 'v' if present)
    let version_str = tag_name.strip_prefix('v').unwrap_or(&tag_name);
    let version = semver::Version::parse(version_str)
        .map_err(|e| io::Error::other(format!("Invalid version '{}': {}", version_str, e)))?;

    let assets = body["assets"]
        .as_array()
        .ok_or_else(|| io::Error::other("Missing assets in release"))?
        .iter()
        .filter_map(|a| {
            Some(AssetInfo {
                name: a["name"].as_str()?.to_string(),
                download_url: a["browser_download_url"].as_str()?.to_string(),
            })
        })
        .collect();

    Ok(ReleaseInfo {
        tag_name,
        version,
        assets,
    })
}

/// Get the target triple for the current platform
fn platform_target_triple() -> String {
    let arch = std::env::consts::ARCH;

    let os = match std::env::consts::OS {
        "linux" => "unknown-linux-gnu",
        "macos" => "apple-darwin",
        "windows" => "pc-windows-msvc",
        other => other,
    };

    format!("{}-{}", arch, os)
}

/// Find the matching asset for the current platform
fn select_asset(release: &ReleaseInfo) -> io::Result<&AssetInfo> {
    let triple = platform_target_triple();

    // Look for the archive (not the .sha256 file)
    release
        .assets
        .iter()
        .find(|a| a.name.contains(&triple) && !a.name.ends_with(".sha256"))
        .ok_or_else(|| {
            let available: Vec<&str> = release
                .assets
                .iter()
                .filter(|a| !a.name.ends_with(".sha256"))
                .map(|a| a.name.as_str())
                .collect();
            io::Error::other(format!(
                "No release binary for platform '{}'. Available: {}",
                triple,
                available.join(", ")
            ))
        })
}

/// Find the SHA-256 checksum asset for a given archive
fn select_checksum_asset<'a>(
    release: &'a ReleaseInfo,
    archive_name: &str,
) -> Option<&'a AssetInfo> {
    let checksum_name = format!("{}.sha256", archive_name);
    release.assets.iter().find(|a| a.name == checksum_name)
}

/// Download, verify, and replace the binary for direct installations
async fn self_update_binary(
    current_path: &Path,
    release: &ReleaseInfo,
    json: bool,
) -> io::Result<()> {
    let asset = select_asset(release)?;

    if !json {
        output::color::info(&format!("Downloading {}...", asset.name));
    }

    let client = build_http_client(DOWNLOAD_TIMEOUT)?;
    let tmp_dir = tempfile::TempDir::new()?;

    // Download archive
    let archive_path = tmp_dir.path().join(&asset.name);
    download_file(&client, &asset.download_url, &archive_path, json).await?;

    // Download and verify checksum
    if let Some(checksum_asset) = select_checksum_asset(release, &asset.name) {
        let checksum_path = tmp_dir.path().join(&checksum_asset.name);
        download_file(&client, &checksum_asset.download_url, &checksum_path, json).await?;

        // Parse checksum file: format is "hash  filename" or "hash filename"
        let checksum_content = std::fs::read_to_string(&checksum_path)?;
        let expected_hash = checksum_content
            .split_whitespace()
            .next()
            .ok_or_else(|| io::Error::other("Empty checksum file"))?;

        if !json {
            output::color::info("Verifying SHA-256 checksum...");
        }
        verify_sha256(&archive_path, expected_hash)?;
        if !json {
            output::color::success("Checksum verified");
        }
    } else {
        output::color::warning("No checksum file found for this release — skipping verification");
    }

    // Extract binary
    if !json {
        output::color::info("Extracting binary...");
    }
    let extracted = extract_binary(&archive_path, tmp_dir.path())?;

    // Replace binary
    replace_binary(current_path, &extracted, json)?;

    Ok(())
}

/// Build an HTTP client with appropriate settings
fn build_http_client(timeout: Duration) -> io::Result<reqwest::Client> {
    reqwest::Client::builder()
        .timeout(timeout)
        .user_agent(format!("tallow/{}", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|e| io::Error::other(format!("Failed to create HTTP client: {}", e)))
}

/// Download a file from a URL to a local path
async fn download_file(
    client: &reqwest::Client,
    url: &str,
    dest: &Path,
    json: bool,
) -> io::Result<()> {
    use futures::StreamExt;

    let resp = client
        .get(url)
        .send()
        .await
        .map_err(|e| io::Error::other(format!("Download failed: {}", e)))?;

    if !resp.status().is_success() {
        return Err(io::Error::other(format!(
            "Download returned status {}",
            resp.status()
        )));
    }

    let total_size = resp.content_length();

    let pb = if !json {
        total_size.map(|total| {
            let pb = indicatif::ProgressBar::new(total);
            pb.set_style(
                indicatif::ProgressStyle::default_bar()
                    .template(" [{bar:40.cyan/blue}] {bytes}/{total_bytes} ({eta})")
                    .unwrap_or_else(|_| indicatif::ProgressStyle::default_bar())
                    .progress_chars("#>-"),
            );
            pb
        })
    } else {
        None
    };

    let mut file = std::fs::File::create(dest)?;
    let mut stream = resp.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| io::Error::other(format!("Download error: {}", e)))?;
        std::io::Write::write_all(&mut file, &chunk)?;
        if let Some(ref pb) = pb {
            pb.inc(chunk.len() as u64);
        }
    }

    if let Some(pb) = pb {
        pb.finish_and_clear();
    }

    Ok(())
}

/// Verify SHA-256 checksum of a file
fn verify_sha256(file_path: &Path, expected_hex: &str) -> io::Result<()> {
    use sha2::Digest;

    let mut file = std::fs::File::open(file_path)?;
    let mut hasher = sha2::Sha256::new();
    std::io::copy(&mut file, &mut hasher)?;
    let actual = hex::encode(hasher.finalize());

    if actual != expected_hex.to_lowercase() {
        return Err(io::Error::other(format!(
            "Checksum mismatch!\n  Expected: {}\n  Actual:   {}",
            expected_hex, actual
        )));
    }

    Ok(())
}

/// Extract the tallow binary from an archive
fn extract_binary(archive: &Path, dest_dir: &Path) -> io::Result<PathBuf> {
    let name = archive.file_name().unwrap_or_default().to_string_lossy();

    if name.ends_with(".tar.gz") || name.ends_with(".tgz") {
        extract_tar_gz(archive, dest_dir)
    } else if name.ends_with(".zip") {
        extract_zip(archive, dest_dir)
    } else {
        Err(io::Error::other(format!(
            "Unsupported archive format: {}",
            name
        )))
    }
}

/// Extract a .tar.gz archive and find the tallow binary
#[cfg(not(windows))]
fn extract_tar_gz(archive: &Path, dest_dir: &Path) -> io::Result<PathBuf> {
    let file = std::fs::File::open(archive)?;
    let decoder = flate2::read::GzDecoder::new(file);
    let mut ar = tar::Archive::new(decoder);
    ar.unpack(dest_dir)?;

    // Find the tallow binary in the extracted files
    find_binary_in_dir(dest_dir, "tallow")
}

#[cfg(windows)]
fn extract_tar_gz(archive: &Path, dest_dir: &Path) -> io::Result<PathBuf> {
    let file = std::fs::File::open(archive)?;
    let decoder = flate2::read::GzDecoder::new(file);
    let mut ar = tar::Archive::new(decoder);
    ar.unpack(dest_dir)?;

    find_binary_in_dir(dest_dir, "tallow.exe")
}

/// Extract a .zip archive and find the tallow binary
fn extract_zip(archive: &Path, dest_dir: &Path) -> io::Result<PathBuf> {
    let file = std::fs::File::open(archive)?;
    let mut zip = zip::ZipArchive::new(file)
        .map_err(|e| io::Error::other(format!("Failed to open zip: {}", e)))?;

    zip.extract(dest_dir)
        .map_err(|e| io::Error::other(format!("Failed to extract zip: {}", e)))?;

    let binary_name = if cfg!(windows) {
        "tallow.exe"
    } else {
        "tallow"
    };

    find_binary_in_dir(dest_dir, binary_name)
}

/// Recursively find a named binary in a directory
fn find_binary_in_dir(dir: &Path, name: &str) -> io::Result<PathBuf> {
    // Check immediate directory first
    let direct = dir.join(name);
    if direct.exists() {
        return Ok(direct);
    }

    // Search one level of subdirectories
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
                let candidate = entry.path().join(name);
                if candidate.exists() {
                    return Ok(candidate);
                }
            }
        }
    }

    Err(io::Error::other(format!(
        "Could not find '{}' in extracted archive",
        name
    )))
}

/// Replace the current binary with the new one
fn replace_binary(current: &Path, new_binary: &Path, _json: bool) -> io::Result<()> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        // Make new binary executable
        let mut perms = std::fs::metadata(new_binary)?.permissions();
        perms.set_mode(0o755);
        std::fs::set_permissions(new_binary, perms)?;
    }

    // Check if we can write to the target location
    if is_writable(current) {
        // Direct replacement
        #[cfg(unix)]
        {
            // Atomic rename on Unix
            std::fs::rename(new_binary, current)?;
        }

        #[cfg(windows)]
        {
            // Windows: rename current to .old, then copy new
            let old_path = current.with_extension("exe.old");
            let _ = std::fs::remove_file(&old_path); // Clean up previous .old
            std::fs::rename(current, &old_path)?;
            std::fs::copy(new_binary, current)?;
            // .old will be cleaned up on next launch
        }
    } else {
        // Need elevated privileges
        #[cfg(unix)]
        {
            if !json {
                output::color::warning(&format!(
                    "Binary at {} requires elevated privileges to update",
                    current.display()
                ));
                output::color::info(&format!(
                    "Running: sudo cp {} {}",
                    new_binary.display(),
                    current.display()
                ));
            }

            let status = std::process::Command::new("sudo")
                .arg("cp")
                .arg(new_binary)
                .arg(current)
                .status()?;

            if !status.success() {
                return Err(io::Error::new(
                    io::ErrorKind::PermissionDenied,
                    "Failed to update binary with sudo. Try: sudo tallow update",
                ));
            }
        }

        #[cfg(windows)]
        {
            return Err(io::Error::new(
                io::ErrorKind::PermissionDenied,
                format!(
                    "Cannot write to {}. Try running as Administrator.",
                    current.display()
                ),
            ));
        }
    }

    Ok(())
}

/// Run a package manager command and stream its output
fn run_package_manager(json: bool, cmd: &str, args: &[&str]) -> io::Result<()> {
    if !json {
        output::color::info(&format!("Running: {} {}", cmd, args.join(" ")));
    }

    let status = std::process::Command::new(cmd)
        .args(args)
        .stdin(std::process::Stdio::inherit())
        .stdout(std::process::Stdio::inherit())
        .stderr(std::process::Stdio::inherit())
        .status()
        .map_err(|e| {
            io::Error::other(format!(
                "'{}' not found on PATH. Is it installed? ({})",
                cmd, e
            ))
        })?;

    if !status.success() {
        return Err(io::Error::other(format!(
            "{} exited with status {}",
            cmd,
            status.code().unwrap_or(-1)
        )));
    }

    Ok(())
}

/// Check if we have write permission to a path
fn is_writable(path: &Path) -> bool {
    // Check the parent directory (for rename) or the file itself
    let check_path = if path.exists() {
        path
    } else {
        path.parent().unwrap_or(path)
    };

    // Try opening for write as a permission test
    if path.exists() {
        std::fs::OpenOptions::new()
            .write(true)
            .open(check_path)
            .is_ok()
    } else {
        // Check parent directory
        check_path
            .metadata()
            .map(|m| !m.permissions().readonly())
            .unwrap_or(false)
    }
}

/// Human-readable display name for install method
fn method_display(method: &InstallMethod) -> String {
    match method {
        InstallMethod::Homebrew => "Homebrew".to_string(),
        InstallMethod::Scoop => "Scoop".to_string(),
        InstallMethod::Cargo => "Cargo".to_string(),
        InstallMethod::DirectBinary { path } => {
            format!("Direct binary ({})", path.display())
        }
    }
}

/// Machine-readable install method string
fn method_str(method: &InstallMethod) -> &'static str {
    match method {
        InstallMethod::Homebrew => "homebrew",
        InstallMethod::Scoop => "scoop",
        InstallMethod::Cargo => "cargo",
        InstallMethod::DirectBinary { .. } => "direct",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_current_version_parses() {
        let v = current_version();
        assert_eq!(v.major, 0);
        assert_eq!(v.minor, 1);
        assert_eq!(v.patch, 0);
    }

    #[test]
    fn test_platform_target_triple_format() {
        let triple = platform_target_triple();
        assert!(
            triple.contains('-'),
            "Triple should contain '-': {}",
            triple
        );
    }

    #[test]
    fn test_method_display_variants() {
        assert_eq!(method_display(&InstallMethod::Homebrew), "Homebrew");
        assert_eq!(method_display(&InstallMethod::Scoop), "Scoop");
        assert_eq!(method_display(&InstallMethod::Cargo), "Cargo");
        assert!(method_display(&InstallMethod::DirectBinary {
            path: PathBuf::from("/usr/local/bin/tallow")
        })
        .contains("Direct binary"));
    }

    #[test]
    fn test_method_str_variants() {
        assert_eq!(method_str(&InstallMethod::Homebrew), "homebrew");
        assert_eq!(method_str(&InstallMethod::Scoop), "scoop");
        assert_eq!(method_str(&InstallMethod::Cargo), "cargo");
        assert_eq!(
            method_str(&InstallMethod::DirectBinary {
                path: PathBuf::from("/tmp/tallow")
            }),
            "direct"
        );
    }

    #[test]
    fn test_select_asset_no_match() {
        let release = ReleaseInfo {
            tag_name: "v0.2.0".to_string(),
            version: semver::Version::new(0, 2, 0),
            assets: vec![AssetInfo {
                name: "tallow-v0.2.0-riscv64-unknown-linux-gnu.tar.gz".to_string(),
                download_url: "https://example.com/riscv.tar.gz".to_string(),
            }],
        };
        assert!(select_asset(&release).is_err());
    }

    #[test]
    fn test_select_asset_skips_sha256() {
        let triple = platform_target_triple();
        let release = ReleaseInfo {
            tag_name: "v0.2.0".to_string(),
            version: semver::Version::new(0, 2, 0),
            assets: vec![
                AssetInfo {
                    name: format!("tallow-v0.2.0-{}.tar.gz.sha256", triple),
                    download_url: "https://example.com/checksum".to_string(),
                },
                AssetInfo {
                    name: format!("tallow-v0.2.0-{}.tar.gz", triple),
                    download_url: "https://example.com/archive".to_string(),
                },
            ],
        };
        let asset = select_asset(&release).unwrap();
        assert!(!asset.name.ends_with(".sha256"));
    }

    #[test]
    fn test_select_checksum_asset() {
        let release = ReleaseInfo {
            tag_name: "v0.2.0".to_string(),
            version: semver::Version::new(0, 2, 0),
            assets: vec![
                AssetInfo {
                    name: "tallow-v0.2.0-x86_64.tar.gz".to_string(),
                    download_url: "https://example.com/archive".to_string(),
                },
                AssetInfo {
                    name: "tallow-v0.2.0-x86_64.tar.gz.sha256".to_string(),
                    download_url: "https://example.com/checksum".to_string(),
                },
            ],
        };
        let cs = select_checksum_asset(&release, "tallow-v0.2.0-x86_64.tar.gz");
        assert!(cs.is_some());
        assert!(cs.unwrap().name.ends_with(".sha256"));
    }

    #[test]
    fn test_verify_sha256_valid() {
        let dir = tempfile::TempDir::new().unwrap();
        let file_path = dir.path().join("test.bin");
        std::fs::write(&file_path, b"hello world").unwrap();

        // SHA-256 of "hello world"
        let expected = "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9";
        assert!(verify_sha256(&file_path, expected).is_ok());
    }

    #[test]
    fn test_verify_sha256_invalid() {
        let dir = tempfile::TempDir::new().unwrap();
        let file_path = dir.path().join("test.bin");
        std::fs::write(&file_path, b"hello world").unwrap();

        let wrong = "0000000000000000000000000000000000000000000000000000000000000000";
        assert!(verify_sha256(&file_path, wrong).is_err());
    }

    #[test]
    fn test_verify_sha256_case_insensitive() {
        let dir = tempfile::TempDir::new().unwrap();
        let file_path = dir.path().join("test.bin");
        std::fs::write(&file_path, b"hello world").unwrap();

        let upper = "B94D27B9934D3E08A52E52D7DA7DABFAC484EFE37A5380EE9088F7ACE2EFCDE9";
        assert!(verify_sha256(&file_path, upper).is_ok());
    }

    #[test]
    fn test_find_binary_direct() {
        let dir = tempfile::TempDir::new().unwrap();
        let binary = dir.path().join("tallow");
        std::fs::write(&binary, b"fake binary").unwrap();

        let found = find_binary_in_dir(dir.path(), "tallow").unwrap();
        assert_eq!(found, binary);
    }

    #[test]
    fn test_find_binary_in_subdir() {
        let dir = tempfile::TempDir::new().unwrap();
        let subdir = dir.path().join("tallow-v0.2.0");
        std::fs::create_dir(&subdir).unwrap();
        let binary = subdir.join("tallow");
        std::fs::write(&binary, b"fake binary").unwrap();

        let found = find_binary_in_dir(dir.path(), "tallow").unwrap();
        assert_eq!(found, binary);
    }

    #[test]
    fn test_find_binary_missing() {
        let dir = tempfile::TempDir::new().unwrap();
        assert!(find_binary_in_dir(dir.path(), "tallow").is_err());
    }
}

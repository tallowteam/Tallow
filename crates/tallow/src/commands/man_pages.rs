//! Man page generation command implementation
//!
//! Hidden subcommand that generates man pages for packaging and distribution.
//! Uses `clap_mangen` to render man pages from the CLI definition.

use clap::CommandFactory;
use std::io;
use std::path::Path;

/// Execute the man-pages generation command
pub fn execute(out_dir: &str) -> io::Result<()> {
    let out_path = Path::new(out_dir);
    std::fs::create_dir_all(out_path).map_err(|e| {
        io::Error::other(format!(
            "Failed to create output directory '{}': {}",
            out_dir, e
        ))
    })?;

    let cmd = crate::cli::Cli::command();
    generate_man_pages(&cmd, out_path)?;

    tracing::info!("Man pages written to {}", out_dir);
    Ok(())
}

/// Recursively generate man pages for a command and all its subcommands
fn generate_man_pages(cmd: &clap::Command, out_dir: &Path) -> io::Result<()> {
    // Generate man page for this command
    let man = clap_mangen::Man::new(cmd.clone());
    let mut buf: Vec<u8> = Vec::new();
    man.render(&mut buf)
        .map_err(|e| io::Error::other(format!("Failed to render man page: {}", e)))?;

    let name = cmd.get_name().to_string();
    let filename = format!("{}.1", name);
    let filepath = out_dir.join(&filename);
    std::fs::write(&filepath, &buf)?;
    tracing::debug!("Generated {}", filepath.display());

    // Recurse into subcommands
    for subcmd in cmd.get_subcommands() {
        if subcmd.is_hide_set() {
            continue;
        }

        let sub_man = clap_mangen::Man::new(subcmd.clone());
        let mut sub_buf: Vec<u8> = Vec::new();
        sub_man
            .render(&mut sub_buf)
            .map_err(|e| io::Error::other(format!("Failed to render man page: {}", e)))?;

        let sub_name = format!("{}-{}", name, subcmd.get_name());
        let sub_filename = format!("{}.1", sub_name);
        let sub_filepath = out_dir.join(&sub_filename);
        std::fs::write(&sub_filepath, &sub_buf)?;
        tracing::debug!("Generated {}", sub_filepath.display());
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_man_page_generation() {
        let dir = tempfile::TempDir::new().unwrap();
        execute(dir.path().to_str().unwrap()).unwrap();

        // The main tallow man page should exist
        let main_man = dir.path().join("tallow.1");
        assert!(main_man.exists(), "tallow.1 should be generated");

        // At least some subcommand man pages should exist
        let send_man = dir.path().join("tallow-send.1");
        assert!(send_man.exists(), "tallow-send.1 should be generated");

        let receive_man = dir.path().join("tallow-receive.1");
        assert!(receive_man.exists(), "tallow-receive.1 should be generated");

        let history_man = dir.path().join("tallow-history.1");
        assert!(history_man.exists(), "tallow-history.1 should be generated");
    }

    #[test]
    fn test_man_page_content_not_empty() {
        let dir = tempfile::TempDir::new().unwrap();
        execute(dir.path().to_str().unwrap()).unwrap();

        let main_man = dir.path().join("tallow.1");
        let content = std::fs::read(&main_man).unwrap();
        assert!(!content.is_empty(), "tallow.1 should not be empty");

        // Should contain roff formatting
        let text = String::from_utf8_lossy(&content);
        assert!(
            text.contains(".TH"),
            "man page should contain .TH header directive"
        );
    }
}

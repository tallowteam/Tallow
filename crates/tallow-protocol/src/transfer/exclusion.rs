//! File exclusion and gitignore-aware directory walking
//!
//! Provides configurable file exclusion using gitignore-style patterns
//! and optional `.gitignore` integration via the `ignore` crate.

use crate::{ProtocolError, Result};
use ignore::overrides::OverrideBuilder;
use ignore::WalkBuilder;
use std::path::{Path, PathBuf};

/// Configuration for file exclusion during directory scanning
#[derive(Debug, Clone, Default)]
pub struct ExclusionConfig {
    /// Patterns to exclude (gitignore syntax)
    pub patterns: Vec<String>,
    /// Whether to respect .gitignore files
    pub respect_gitignore: bool,
}

impl ExclusionConfig {
    /// Create config from a comma-separated exclude string and gitignore flag
    ///
    /// # Arguments
    ///
    /// * `exclude` - Optional comma-separated list of gitignore-style patterns
    /// * `gitignore` - Whether to respect `.gitignore` files found during traversal
    pub fn from_exclude_str(exclude: Option<&str>, gitignore: bool) -> Self {
        let patterns = exclude
            .map(|s| {
                s.split(',')
                    .map(|p| p.trim().to_string())
                    .filter(|p| !p.is_empty())
                    .collect()
            })
            .unwrap_or_default();
        Self {
            patterns,
            respect_gitignore: gitignore,
        }
    }

    /// Returns true if this config has any active exclusion rules
    pub fn is_active(&self) -> bool {
        !self.patterns.is_empty() || self.respect_gitignore
    }

    /// Walk a directory with exclusion rules applied, returning matching file paths
    ///
    /// Uses the `ignore` crate for efficient, gitignore-aware directory traversal.
    /// Files matching exclusion patterns are omitted from the results.
    ///
    /// # Arguments
    ///
    /// * `root` - The root directory to walk
    ///
    /// # Returns
    ///
    /// A vector of file paths that passed the exclusion filters
    pub fn walk_directory(&self, root: &Path) -> Result<Vec<PathBuf>> {
        let mut builder = WalkBuilder::new(root);

        builder.git_ignore(self.respect_gitignore);
        builder.git_global(self.respect_gitignore);
        builder.git_exclude(self.respect_gitignore);
        builder.hidden(false); // Show hidden files by default

        if !self.patterns.is_empty() {
            let mut overrides = OverrideBuilder::new(root);
            for pattern in &self.patterns {
                overrides.add(&format!("!{}", pattern)).map_err(|e| {
                    ProtocolError::TransferFailed(format!(
                        "invalid exclude pattern '{}': {}",
                        pattern, e
                    ))
                })?;
            }
            let built = overrides.build().map_err(|e| {
                ProtocolError::TransferFailed(format!("failed to build overrides: {}", e))
            })?;
            builder.overrides(built);
        }

        let files: Vec<PathBuf> = builder
            .build()
            .filter_map(|entry| entry.ok())
            .filter(|entry| entry.file_type().is_some_and(|ft| ft.is_file()))
            .map(|entry| entry.into_path())
            .collect();

        Ok(files)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_empty_config_not_active() {
        let config = ExclusionConfig::default();
        assert!(!config.is_active());
    }

    #[test]
    fn test_gitignore_makes_active() {
        let config = ExclusionConfig::from_exclude_str(None, true);
        assert!(config.is_active());
    }

    #[test]
    fn test_patterns_make_active() {
        let config = ExclusionConfig::from_exclude_str(Some("*.log,tmp"), false);
        assert!(config.is_active());
        assert_eq!(config.patterns.len(), 2);
    }

    #[test]
    fn test_parse_exclude_str() {
        let config = ExclusionConfig::from_exclude_str(Some("node_modules, .git, *.log"), false);
        assert_eq!(config.patterns, vec!["node_modules", ".git", "*.log"]);
    }

    #[test]
    fn test_walk_with_exclude() {
        let tmpdir = tempfile::tempdir().unwrap();
        let root = tmpdir.path();

        // Create files
        fs::write(root.join("main.rs"), "fn main() {}").unwrap();
        fs::write(root.join("debug.log"), "debug info").unwrap();
        fs::create_dir_all(root.join("node_modules")).unwrap();
        fs::write(root.join("node_modules").join("pkg.js"), "module").unwrap();

        let config = ExclusionConfig::from_exclude_str(Some("*.log,node_modules"), false);
        let files = config.walk_directory(root).unwrap();

        let names: Vec<String> = files
            .iter()
            .map(|f| f.file_name().unwrap().to_string_lossy().to_string())
            .collect();

        assert!(names.contains(&"main.rs".to_string()));
        assert!(!names.contains(&"debug.log".to_string()));
        assert!(!names.contains(&"pkg.js".to_string()));
    }
}

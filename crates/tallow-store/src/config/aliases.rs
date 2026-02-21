//! Path alias management
//!
//! Aliases map short names to absolute directory paths for quick access.
//! Example: `"nas" -> "/mnt/nas/share"`, used as `tallow send nas:backups/`.

use crate::{Result, StoreError};
use std::collections::HashMap;
use std::path::{Path, PathBuf};

/// Resolve a path string that may contain an alias prefix.
///
/// Format: `alias:subpath` resolves to `<alias_target>/subpath`.
/// If no alias prefix is found, returns the input as a `PathBuf`.
pub fn resolve_alias(input: &str, aliases: &HashMap<String, PathBuf>) -> PathBuf {
    if let Some((alias, remainder)) = input.split_once(':') {
        // Avoid matching Windows drive letters (e.g., "C:")
        if alias.len() == 1
            && alias
                .chars()
                .next()
                .is_some_and(|c| c.is_ascii_alphabetic())
        {
            return PathBuf::from(input);
        }
        if let Some(base) = aliases.get(alias) {
            return base.join(remainder);
        }
    }
    PathBuf::from(input)
}

/// Validate an alias name.
///
/// Names must be non-empty, not a single ASCII letter (conflicts with
/// Windows drive letters), and contain only alphanumeric characters,
/// hyphens, or underscores.
pub fn validate_alias_name(name: &str) -> Result<()> {
    if name.is_empty() {
        return Err(StoreError::ConfigError("Alias name cannot be empty".into()));
    }
    if name.len() == 1 && name.chars().next().is_some_and(|c| c.is_ascii_alphabetic()) {
        return Err(StoreError::ConfigError(
            "Single-letter alias names conflict with Windows drive letters".into(),
        ));
    }
    if !name
        .chars()
        .all(|c| c.is_alphanumeric() || c == '-' || c == '_')
    {
        return Err(StoreError::ConfigError(
            "Alias names may only contain alphanumeric characters, hyphens, and underscores".into(),
        ));
    }
    Ok(())
}

/// Validate an alias target path.
///
/// The target must be an absolute path with no `..` components.
pub fn validate_alias_target(target: &Path) -> Result<()> {
    if !target.is_absolute() {
        return Err(StoreError::ConfigError(format!(
            "Alias target must be an absolute path, got: {}",
            target.display()
        )));
    }
    for component in target.components() {
        if matches!(component, std::path::Component::ParentDir) {
            return Err(StoreError::ConfigError(format!(
                "Alias target must not contain '..' components: {}",
                target.display()
            )));
        }
    }
    Ok(())
}

/// Add an alias to the alias map.
///
/// Validates both the name and target before inserting. If an alias with
/// the same name already exists, it is overwritten.
pub fn add_alias(aliases: &mut HashMap<String, PathBuf>, name: &str, target: &Path) -> Result<()> {
    validate_alias_name(name)?;
    validate_alias_target(target)?;
    aliases.insert(name.to_string(), target.to_path_buf());
    Ok(())
}

/// Remove an alias from the alias map.
///
/// Returns `true` if the alias existed and was removed, `false` otherwise.
pub fn remove_alias(aliases: &mut HashMap<String, PathBuf>, name: &str) -> bool {
    aliases.remove(name).is_some()
}

/// List all aliases sorted by name.
///
/// Returns a sorted vector of `(name, path)` pairs.
pub fn list_aliases(aliases: &HashMap<String, PathBuf>) -> Vec<(&str, &Path)> {
    let mut items: Vec<(&str, &Path)> = aliases
        .iter()
        .map(|(k, v)| (k.as_str(), v.as_path()))
        .collect();
    items.sort_by_key(|(name, _)| *name);
    items
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Platform-appropriate absolute path for tests.
    #[cfg(windows)]
    fn abs(p: &str) -> PathBuf {
        PathBuf::from(format!("C:\\test\\{}", p))
    }

    /// Platform-appropriate absolute path for tests.
    #[cfg(not(windows))]
    fn abs(p: &str) -> PathBuf {
        PathBuf::from(format!("/test/{}", p))
    }

    fn make_aliases() -> HashMap<String, PathBuf> {
        let mut m = HashMap::new();
        m.insert("nas".to_string(), abs("nas/share"));
        m.insert("docs".to_string(), abs("user/documents"));
        m
    }

    // ── resolve_alias ────────────────────────────────────────────

    #[test]
    fn resolve_known_alias() {
        let aliases = make_aliases();
        let resolved = resolve_alias("nas:backups/2024", &aliases);
        assert_eq!(resolved, abs("nas/share").join("backups/2024"));
    }

    #[test]
    fn resolve_known_alias_empty_remainder() {
        let aliases = make_aliases();
        let resolved = resolve_alias("nas:", &aliases);
        assert_eq!(resolved, abs("nas/share").join(""));
    }

    #[test]
    fn resolve_unknown_alias_passthrough() {
        let aliases = make_aliases();
        let resolved = resolve_alias("unknown:foo/bar", &aliases);
        // Unknown alias: returns the input verbatim
        assert_eq!(resolved, PathBuf::from("unknown:foo/bar"));
    }

    #[test]
    fn resolve_no_colon_passthrough() {
        let aliases = make_aliases();
        let resolved = resolve_alias("/tmp/some/file.txt", &aliases);
        assert_eq!(resolved, PathBuf::from("/tmp/some/file.txt"));
    }

    #[test]
    fn resolve_windows_drive_letter_not_treated_as_alias() {
        let aliases = make_aliases();
        let resolved = resolve_alias("C:\\Users\\test\\file.txt", &aliases);
        assert_eq!(resolved, PathBuf::from("C:\\Users\\test\\file.txt"));
    }

    #[test]
    fn resolve_uppercase_drive_letter() {
        let aliases = make_aliases();
        let resolved = resolve_alias("D:\\data", &aliases);
        assert_eq!(resolved, PathBuf::from("D:\\data"));
    }

    #[test]
    fn resolve_lowercase_drive_letter() {
        let mut aliases = HashMap::new();
        aliases.insert("c".to_string(), abs("should/not/match"));
        // Even though "c" is in the map, single-letter is treated as a drive letter
        let resolved = resolve_alias("c:\\windows", &aliases);
        assert_eq!(resolved, PathBuf::from("c:\\windows"));
    }

    #[test]
    fn resolve_two_letter_alias_not_drive() {
        let mut aliases = HashMap::new();
        aliases.insert("ab".to_string(), abs("ab"));
        let resolved = resolve_alias("ab:data", &aliases);
        assert_eq!(resolved, abs("ab").join("data"));
    }

    #[test]
    fn resolve_plain_relative_path() {
        let aliases = make_aliases();
        let resolved = resolve_alias("relative/path/file.txt", &aliases);
        assert_eq!(resolved, PathBuf::from("relative/path/file.txt"));
    }

    // ── validate_alias_name ──────────────────────────────────────

    #[test]
    fn validate_name_empty_rejected() {
        assert!(validate_alias_name("").is_err());
    }

    #[test]
    fn validate_name_single_letter_rejected() {
        assert!(validate_alias_name("C").is_err());
        assert!(validate_alias_name("d").is_err());
        assert!(validate_alias_name("Z").is_err());
    }

    #[test]
    fn validate_name_single_digit_accepted() {
        // Single digit is not a letter, so it's allowed
        assert!(validate_alias_name("1").is_ok());
    }

    #[test]
    fn validate_name_valid_names() {
        assert!(validate_alias_name("nas").is_ok());
        assert!(validate_alias_name("my-nas").is_ok());
        assert!(validate_alias_name("my_nas").is_ok());
        assert!(validate_alias_name("backup2024").is_ok());
        assert!(validate_alias_name("ab").is_ok());
    }

    #[test]
    fn validate_name_special_chars_rejected() {
        assert!(validate_alias_name("my nas").is_err());
        assert!(validate_alias_name("my.nas").is_err());
        assert!(validate_alias_name("my/nas").is_err());
        assert!(validate_alias_name("my:nas").is_err());
        assert!(validate_alias_name("nas!").is_err());
    }

    // ── validate_alias_target ────────────────────────────────────

    #[test]
    fn validate_target_relative_rejected() {
        assert!(validate_alias_target(Path::new("relative/path")).is_err());
    }

    #[test]
    fn validate_target_parent_dir_rejected() {
        // Use a platform-absolute path with `..` embedded
        #[cfg(windows)]
        let p = Path::new("C:\\mnt\\..\\etc");
        #[cfg(not(windows))]
        let p = Path::new("/mnt/../etc");
        assert!(validate_alias_target(p).is_err());
    }

    #[test]
    fn validate_target_absolute_accepted() {
        assert!(validate_alias_target(&abs("nas/share")).is_ok());
    }

    #[cfg(windows)]
    #[test]
    fn validate_target_windows_absolute_accepted() {
        assert!(validate_alias_target(Path::new("C:\\Users\\test")).is_ok());
    }

    // ── add_alias ────────────────────────────────────────────────

    #[test]
    fn add_alias_success() {
        let mut aliases = HashMap::new();
        let target = abs("nas");
        add_alias(&mut aliases, "nas", &target).unwrap();
        assert_eq!(aliases.get("nas").unwrap(), &target);
    }

    #[test]
    fn add_alias_overwrites_existing() {
        let mut aliases = HashMap::new();
        add_alias(&mut aliases, "nas", &abs("nas1")).unwrap();
        add_alias(&mut aliases, "nas", &abs("nas2")).unwrap();
        assert_eq!(aliases.get("nas").unwrap(), &abs("nas2"));
    }

    #[test]
    fn add_alias_bad_name_rejected() {
        let mut aliases = HashMap::new();
        let target = abs("nas");
        assert!(add_alias(&mut aliases, "", &target).is_err());
        assert!(add_alias(&mut aliases, "C", &target).is_err());
    }

    #[test]
    fn add_alias_bad_target_rejected() {
        let mut aliases = HashMap::new();
        assert!(add_alias(&mut aliases, "nas", Path::new("relative")).is_err());
        #[cfg(windows)]
        assert!(add_alias(&mut aliases, "nas", Path::new("C:\\mnt\\..\\etc")).is_err());
        #[cfg(not(windows))]
        assert!(add_alias(&mut aliases, "nas", Path::new("/mnt/../etc")).is_err());
    }

    // ── remove_alias ─────────────────────────────────────────────

    #[test]
    fn remove_existing_alias() {
        let mut aliases = make_aliases();
        assert!(remove_alias(&mut aliases, "nas"));
        assert!(!aliases.contains_key("nas"));
    }

    #[test]
    fn remove_nonexistent_alias() {
        let mut aliases = make_aliases();
        assert!(!remove_alias(&mut aliases, "nonexistent"));
    }

    // ── list_aliases ─────────────────────────────────────────────

    #[test]
    fn list_aliases_sorted() {
        let aliases = make_aliases();
        let listed = list_aliases(&aliases);
        assert_eq!(listed.len(), 2);
        // "docs" comes before "nas" alphabetically
        assert_eq!(listed[0].0, "docs");
        assert_eq!(listed[1].0, "nas");
    }

    #[test]
    fn list_aliases_empty() {
        let aliases = HashMap::new();
        let listed = list_aliases(&aliases);
        assert!(listed.is_empty());
    }

    #[test]
    fn list_aliases_preserves_paths() {
        let aliases = make_aliases();
        let listed = list_aliases(&aliases);
        assert_eq!(listed[0].1, abs("user/documents").as_path());
        assert_eq!(listed[1].1, abs("nas/share").as_path());
    }
}

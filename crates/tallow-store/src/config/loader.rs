//! Configuration file loading and saving

use super::TallowConfig;
use crate::persistence::paths;
use crate::Result;
use crate::StoreError;
use std::path::PathBuf;

/// Load configuration from file, or create default if missing
pub fn load_config() -> Result<TallowConfig> {
    let path = config_path();

    if !path.exists() {
        let config = TallowConfig::default();
        save_config(&config)?;
        return Ok(config);
    }

    let content = std::fs::read_to_string(&path).map_err(|e| {
        StoreError::ConfigError(format!(
            "Failed to read config at {}: {}",
            path.display(),
            e
        ))
    })?;

    let config: TallowConfig = toml::from_str(&content)
        .map_err(|e| StoreError::ConfigError(format!("Failed to parse config: {}", e)))?;

    Ok(config)
}

/// Save configuration to file
pub fn save_config(config: &TallowConfig) -> Result<()> {
    let path = config_path();

    // Ensure parent directory exists
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    let content = toml::to_string_pretty(config).map_err(|e| {
        StoreError::SerializationError(format!("Failed to serialize config: {}", e))
    })?;

    std::fs::write(&path, content)?;
    Ok(())
}

/// Get configuration file path
pub fn config_path() -> PathBuf {
    paths::config_file()
}

/// Load config from a specific path
pub fn load_config_from(path: &std::path::Path) -> Result<TallowConfig> {
    let content = std::fs::read_to_string(path).map_err(|e| {
        StoreError::ConfigError(format!(
            "Failed to read config at {}: {}",
            path.display(),
            e
        ))
    })?;

    let config: TallowConfig = toml::from_str(&content)
        .map_err(|e| StoreError::ConfigError(format!("Failed to parse config: {}", e)))?;

    Ok(config)
}

/// Get a config value by dotted key path (e.g., "network.enable_mdns")
pub fn get_config_value(config: &TallowConfig, key: &str) -> Result<String> {
    // Serialize to toml::Value and navigate by key path
    let value = toml::Value::try_from(config)
        .map_err(|e| StoreError::ConfigError(format!("Failed to convert config: {}", e)))?;

    let parts: Vec<&str> = key.split('.').collect();
    let mut current = &value;

    for part in &parts {
        current = current
            .get(part)
            .ok_or_else(|| StoreError::ConfigError(format!("Config key not found: {}", key)))?;
    }

    Ok(format_toml_value(current))
}

/// Set a config value by dotted key path
pub fn set_config_value(config: &mut TallowConfig, key: &str, value: &str) -> Result<()> {
    // Serialize config to toml::Value, modify, deserialize back
    let mut toml_value = toml::Value::try_from(&*config)
        .map_err(|e| StoreError::ConfigError(format!("Failed to convert config: {}", e)))?;

    let parts: Vec<&str> = key.split('.').collect();
    let mut current = &mut toml_value;

    for (i, part) in parts.iter().enumerate() {
        if i == parts.len() - 1 {
            // Set the value — try to parse as the appropriate type
            let table = current.as_table_mut().ok_or_else(|| {
                StoreError::ConfigError(format!("Config path is not a table: {}", key))
            })?;
            let parsed = parse_toml_value(value);
            table.insert(part.to_string(), parsed);
        } else {
            current = current
                .get_mut(part)
                .ok_or_else(|| StoreError::ConfigError(format!("Config key not found: {}", key)))?;
        }
    }

    // Deserialize back to TallowConfig
    let updated: TallowConfig = toml_value
        .try_into()
        .map_err(|e| StoreError::ConfigError(format!("Failed to apply config change: {}", e)))?;

    *config = updated;
    Ok(())
}

/// Format a TOML value as a display string
fn format_toml_value(value: &toml::Value) -> String {
    match value {
        toml::Value::String(s) => s.clone(),
        toml::Value::Integer(i) => i.to_string(),
        toml::Value::Float(f) => f.to_string(),
        toml::Value::Boolean(b) => b.to_string(),
        toml::Value::Array(arr) => {
            let items: Vec<String> = arr.iter().map(format_toml_value).collect();
            format!("[{}]", items.join(", "))
        }
        toml::Value::Table(_) => toml::to_string_pretty(value).unwrap_or_default(),
        toml::Value::Datetime(dt) => dt.to_string(),
    }
}

/// Parse a string value into appropriate TOML type
fn parse_toml_value(value: &str) -> toml::Value {
    // Try boolean
    if value == "true" {
        return toml::Value::Boolean(true);
    }
    if value == "false" {
        return toml::Value::Boolean(false);
    }

    // Try integer
    if let Ok(i) = value.parse::<i64>() {
        return toml::Value::Integer(i);
    }

    // Try float
    if let Ok(f) = value.parse::<f64>() {
        return toml::Value::Float(f);
    }

    // Default to string
    toml::Value::String(value.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_config_value() {
        let config = TallowConfig::default();
        let val = get_config_value(&config, "network.enable_mdns").unwrap();
        assert_eq!(val, "true");
    }

    #[test]
    fn test_set_config_value() {
        let mut config = TallowConfig::default();
        set_config_value(&mut config, "network.enable_mdns", "false").unwrap();
        assert!(!config.network.enable_mdns);
    }

    #[test]
    fn test_get_nonexistent_key() {
        let config = TallowConfig::default();
        let result = get_config_value(&config, "nonexistent.key");
        assert!(result.is_err());
    }

    #[test]
    fn test_roundtrip_toml() {
        let config = TallowConfig::default();
        let toml_str = toml::to_string_pretty(&config).unwrap();
        let parsed: TallowConfig = toml::from_str(&toml_str).unwrap();
        assert_eq!(parsed.network.enable_mdns, config.network.enable_mdns);
    }
}

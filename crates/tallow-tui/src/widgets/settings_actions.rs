//! Settings save/cancel/reset logic and validation.
//!
//! Provides state management for settings changes, validation, and persistence.
//! Tracks modifications and allows reverting or committing changes.

use super::setting_widget::SettingType;
use std::collections::HashMap;

/// Actions that can be performed on settings.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SettingsAction {
    /// Save all changes to persistent storage
    Save,
    /// Cancel and revert all changes
    Cancel,
    /// Reset a specific setting to default by key
    Reset(String),
    /// Reset all settings to defaults
    ResetAll,
}

/// State manager for settings with change tracking.
#[derive(Debug, Clone)]
pub struct SettingsState {
    /// Original values before any modifications
    original_values: HashMap<String, SettingType>,
    /// Current values (potentially modified)
    current_values: HashMap<String, SettingType>,
    /// Default values for reset operations
    default_values: HashMap<String, SettingType>,
    /// Track which settings have been modified
    modified_flags: HashMap<String, bool>,
}

impl SettingsState {
    /// Creates a new settings state with default values.
    pub fn new() -> Self {
        let mut state = Self {
            original_values: HashMap::new(),
            current_values: HashMap::new(),
            default_values: HashMap::new(),
            modified_flags: HashMap::new(),
        };

        // Initialize with default settings
        state.initialize_defaults();
        state
    }

    /// Initializes default settings values.
    fn initialize_defaults(&mut self) {
        // Network defaults
        self.set_default(
            "network.webrtc_port",
            SettingType::Number(9000, 1024, 65535),
        );
        self.set_default(
            "network.signaling_port",
            SettingType::Number(8080, 1024, 65535),
        );
        self.set_default("network.enable_ipv6", SettingType::Toggle(true));
        self.set_default("network.nat_traversal", SettingType::Toggle(true));
        self.set_default(
            "network.upload_speed_limit",
            SettingType::Number(0, 0, 1000),
        );
        self.set_default(
            "network.download_speed_limit",
            SettingType::Number(0, 0, 1000),
        );

        // Privacy defaults
        self.set_default("privacy.strip_metadata", SettingType::Toggle(true));
        self.set_default("privacy.encrypt_filenames", SettingType::Toggle(false));
        self.set_default("privacy.onion_routing", SettingType::Toggle(false));
        self.set_default("privacy.traffic_padding", SettingType::Toggle(true));

        // Security defaults
        self.set_default("security.require_verification", SettingType::Toggle(true));
        self.set_default("security.post_quantum_crypto", SettingType::Toggle(true));
        self.set_default("security.biometric_auth", SettingType::Toggle(false));
        self.set_default("security.auto_reject_unknown", SettingType::Toggle(false));

        // Display defaults
        self.set_default("display.notifications", SettingType::Toggle(true));
        self.set_default("display.sound_effects", SettingType::Toggle(true));
        self.set_default(
            "display.display_name",
            SettingType::Text("My Device".into()),
        );
        self.set_default(
            "display.show_transfer_animations",
            SettingType::Toggle(true),
        );

        // Advanced defaults
        self.set_default("advanced.debug_logging", SettingType::Toggle(false));
        self.set_default("advanced.chunk_size", SettingType::Number(256, 64, 4096));
        self.set_default("advanced.max_connections", SettingType::Number(10, 1, 100));
        self.set_default("advanced.webassembly", SettingType::Toggle(true));
    }

    /// Sets a default value for a setting key.
    fn set_default(&mut self, key: impl Into<String>, value: SettingType) {
        let key = key.into();
        self.default_values.insert(key.clone(), value.clone());
        self.original_values.insert(key.clone(), value.clone());
        self.current_values.insert(key.clone(), value);
        self.modified_flags.insert(key, false);
    }

    /// Applies a change to a setting.
    pub fn apply_change(
        &mut self,
        key: impl Into<String>,
        value: SettingType,
    ) -> Result<(), String> {
        let key = key.into();

        // Validate the change
        self.validate_setting(&key, &value)?;

        // Update current value
        if let Some(original) = self.original_values.get(&key) {
            self.current_values.insert(key.clone(), value.clone());
            self.modified_flags.insert(key, original != &value);
            Ok(())
        } else {
            Err(format!("Unknown setting key: {}", key))
        }
    }

    /// Reverts all changes to original values.
    pub fn revert(&mut self) {
        self.current_values = self.original_values.clone();
        for flag in self.modified_flags.values_mut() {
            *flag = false;
        }
    }

    /// Resets a specific setting to its default value.
    pub fn reset_setting(&mut self, key: &str) -> Result<(), String> {
        if let Some(default) = self.default_values.get(key) {
            self.current_values.insert(key.to_string(), default.clone());

            if let Some(original) = self.original_values.get(key) {
                self.modified_flags
                    .insert(key.to_string(), original != default);
            }

            Ok(())
        } else {
            Err(format!("Unknown setting key: {}", key))
        }
    }

    /// Resets all settings to default values.
    pub fn reset_all(&mut self) {
        self.current_values = self.default_values.clone();

        for (key, default) in &self.default_values {
            if let Some(original) = self.original_values.get(key) {
                self.modified_flags.insert(key.clone(), original != default);
            }
        }
    }

    /// Commits current values as the new original values.
    pub fn commit(&mut self) {
        self.original_values = self.current_values.clone();
        for flag in self.modified_flags.values_mut() {
            *flag = false;
        }
    }

    /// Checks if there are any unsaved changes.
    pub fn has_unsaved_changes(&self) -> bool {
        self.modified_flags.values().any(|&modified| modified)
    }

    /// Returns a list of all modified setting keys.
    pub fn get_modified_settings(&self) -> Vec<String> {
        self.modified_flags
            .iter()
            .filter(|(_, &modified)| modified)
            .map(|(key, _)| key.clone())
            .collect()
    }

    /// Gets the current value of a setting.
    pub fn get(&self, key: &str) -> Option<&SettingType> {
        self.current_values.get(key)
    }

    /// Gets the original value of a setting.
    pub fn get_original(&self, key: &str) -> Option<&SettingType> {
        self.original_values.get(key)
    }

    /// Validates a setting value.
    fn validate_setting(&self, key: &str, value: &SettingType) -> Result<(), String> {
        match key {
            k if k.ends_with("_port") => self.validate_port(value),
            "network.upload_speed_limit" | "network.download_speed_limit" => {
                self.validate_speed_limit(value)
            }
            "display.display_name" => self.validate_display_name(value),
            "advanced.chunk_size" => self.validate_chunk_size(value),
            "advanced.max_connections" => self.validate_max_connections(value),
            _ => Ok(()), // No specific validation for other settings
        }
    }

    /// Validates a port number.
    fn validate_port(&self, value: &SettingType) -> Result<(), String> {
        if let SettingType::Number(port, _, _) = value {
            if *port < 1024 {
                return Err("Port must be >= 1024 (reserved ports)".into());
            }
            if *port > 65535 {
                return Err("Port must be <= 65535".into());
            }
            Ok(())
        } else {
            Err("Port must be a number".into())
        }
    }

    /// Validates speed limit values.
    fn validate_speed_limit(&self, value: &SettingType) -> Result<(), String> {
        if let SettingType::Number(limit, _, _) = value {
            if *limit < 0 {
                return Err("Speed limit cannot be negative".into());
            }
            Ok(())
        } else {
            Err("Speed limit must be a number".into())
        }
    }

    /// Validates display name.
    fn validate_display_name(&self, value: &SettingType) -> Result<(), String> {
        if let SettingType::Text(name) = value {
            if name.is_empty() {
                return Err("Display name cannot be empty".into());
            }
            if name.len() > 32 {
                return Err("Display name must be <= 32 characters".into());
            }
            // Check for valid characters
            if !name
                .chars()
                .all(|c| c.is_alphanumeric() || c.is_whitespace() || "-_".contains(c))
            {
                return Err("Display name contains invalid characters".into());
            }
            Ok(())
        } else {
            Err("Display name must be text".into())
        }
    }

    /// Validates chunk size.
    fn validate_chunk_size(&self, value: &SettingType) -> Result<(), String> {
        if let SettingType::Number(size, _, _) = value {
            if *size < 64 || *size > 4096 {
                return Err("Chunk size must be between 64 and 4096 KB".into());
            }
            // Ensure power of 2 for optimal performance
            if *size > 0 && !(*size as u64).is_power_of_two() {
                return Err("Chunk size should be a power of 2 for optimal performance".into());
            }
            Ok(())
        } else {
            Err("Chunk size must be a number".into())
        }
    }

    /// Validates max connections.
    fn validate_max_connections(&self, value: &SettingType) -> Result<(), String> {
        if let SettingType::Number(conns, _, _) = value {
            if *conns < 1 {
                return Err("Must allow at least 1 connection".into());
            }
            if *conns > 100 {
                return Err("Too many connections may cause performance issues".into());
            }
            Ok(())
        } else {
            Err("Max connections must be a number".into())
        }
    }

    /// Executes a settings action.
    pub fn execute_action(&mut self, action: SettingsAction) -> Result<(), String> {
        match action {
            SettingsAction::Save => {
                self.commit();
                Ok(())
            }
            SettingsAction::Cancel => {
                self.revert();
                Ok(())
            }
            SettingsAction::Reset(key) => self.reset_setting(&key),
            SettingsAction::ResetAll => {
                self.reset_all();
                Ok(())
            }
        }
    }
}

impl Default for SettingsState {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_settings_state_initialization() {
        let state = SettingsState::new();
        assert!(!state.has_unsaved_changes());
        assert!(state.get("network.webrtc_port").is_some());
    }

    #[test]
    fn test_apply_change() {
        let mut state = SettingsState::new();

        let result = state.apply_change(
            "network.webrtc_port",
            SettingType::Number(9001, 1024, 65535),
        );
        assert!(result.is_ok());
        assert!(state.has_unsaved_changes());
    }

    #[test]
    fn test_revert_changes() {
        let mut state = SettingsState::new();

        state
            .apply_change(
                "network.webrtc_port",
                SettingType::Number(9001, 1024, 65535),
            )
            .unwrap();
        assert!(state.has_unsaved_changes());

        state.revert();
        assert!(!state.has_unsaved_changes());
    }

    #[test]
    fn test_validate_port() {
        let state = SettingsState::new();

        // Valid port
        assert!(state
            .validate_port(&SettingType::Number(8080, 1024, 65535))
            .is_ok());

        // Invalid port (too low)
        assert!(state
            .validate_port(&SettingType::Number(80, 0, 65535))
            .is_err());

        // Invalid port (too high)
        assert!(state
            .validate_port(&SettingType::Number(70000, 0, 70000))
            .is_err());
    }

    #[test]
    fn test_validate_display_name() {
        let state = SettingsState::new();

        // Valid name
        assert!(state
            .validate_display_name(&SettingType::Text("My Device".into()))
            .is_ok());

        // Empty name
        assert!(state
            .validate_display_name(&SettingType::Text("".into()))
            .is_err());

        // Too long name
        let long_name = "A".repeat(40);
        assert!(state
            .validate_display_name(&SettingType::Text(long_name))
            .is_err());
    }

    #[test]
    fn test_commit_changes() {
        let mut state = SettingsState::new();

        state
            .apply_change(
                "network.webrtc_port",
                SettingType::Number(9001, 1024, 65535),
            )
            .unwrap();
        assert!(state.has_unsaved_changes());

        state.commit();
        assert!(!state.has_unsaved_changes());

        // Original value should now be the committed value
        if let Some(SettingType::Number(port, _, _)) = state.get_original("network.webrtc_port") {
            assert_eq!(*port, 9001);
        } else {
            panic!("Expected number value");
        }
    }

    #[test]
    fn test_reset_setting() {
        let mut state = SettingsState::new();

        state
            .apply_change(
                "network.webrtc_port",
                SettingType::Number(9001, 1024, 65535),
            )
            .unwrap();
        state.reset_setting("network.webrtc_port").unwrap();

        if let Some(SettingType::Number(port, _, _)) = state.get("network.webrtc_port") {
            assert_eq!(*port, 9000); // Default value
        } else {
            panic!("Expected number value");
        }
    }

    #[test]
    fn test_get_modified_settings() {
        let mut state = SettingsState::new();

        state
            .apply_change(
                "network.webrtc_port",
                SettingType::Number(9001, 1024, 65535),
            )
            .unwrap();
        state
            .apply_change("privacy.strip_metadata", SettingType::Toggle(false))
            .unwrap();

        let modified = state.get_modified_settings();
        assert!(modified.contains(&"network.webrtc_port".to_string()));
        assert!(modified.contains(&"privacy.strip_metadata".to_string()));
        assert_eq!(modified.len(), 2);
    }
}

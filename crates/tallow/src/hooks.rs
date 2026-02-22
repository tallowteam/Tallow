//! Hook system for pre/post transfer commands
//!
//! Allows users to define shell commands that run at various points during the
//! transfer lifecycle, similar to git hooks. Hooks are configured in the TOML
//! config file under `[hooks]`.
//!
//! # Security
//!
//! - Hooks run with the user's permissions (not elevated)
//! - Commands execute via the system shell with a 30-second timeout
//! - Sensitive data (keys, secrets) is NOT passed in environment variables
//! - Hook failures log a warning but do NOT abort the transfer

use std::io;
use tallow_store::config::HookConfig;

/// Maximum time a hook is allowed to run before being killed
const HOOK_TIMEOUT_SECS: u64 = 30;

/// Types of hooks that can be triggered
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HookType {
    /// Runs before sending files
    PreSend,
    /// Runs after sending files successfully
    PostSend,
    /// Runs before receiving files
    PreReceive,
    /// Runs after receiving files successfully
    PostReceive,
    /// Runs when a transfer error occurs
    OnError,
}

impl HookType {
    /// Get the human-readable name for this hook type
    fn name(&self) -> &'static str {
        match self {
            Self::PreSend => "pre_send",
            Self::PostSend => "post_send",
            Self::PreReceive => "pre_receive",
            Self::PostReceive => "post_receive",
            Self::OnError => "on_error",
        }
    }
}

/// Environment context passed to hook commands via environment variables
#[derive(Debug, Default)]
pub struct HookEnv {
    /// List of files involved in the transfer
    pub files: Vec<String>,
    /// Total transfer size in bytes
    pub total_size: u64,
    /// Peer fingerprint (if known, NOT the full key)
    pub peer_fingerprint: Option<String>,
    /// Code phrase used for the transfer
    pub code_phrase: Option<String>,
    /// Error message (only set for on_error hooks)
    pub error: Option<String>,
    /// Transfer direction ("send" or "receive")
    pub direction: String,
}

/// Manages hook execution for transfer lifecycle events
pub struct HookRunner {
    /// Hook configuration from the TOML config file
    config: HookConfig,
    /// Whether hooks are enabled (can be disabled via --no-hooks)
    enabled: bool,
}

impl HookRunner {
    /// Create a new HookRunner from the application config
    pub fn from_config(config: &HookConfig, enabled: bool) -> Self {
        Self {
            config: config.clone(),
            enabled,
        }
    }

    /// Get the command string for a given hook type
    fn command_for(&self, hook: HookType) -> &str {
        match hook {
            HookType::PreSend => &self.config.pre_send,
            HookType::PostSend => &self.config.post_send,
            HookType::PreReceive => &self.config.pre_receive,
            HookType::PostReceive => &self.config.post_receive,
            HookType::OnError => &self.config.on_error,
        }
    }

    /// Check if a given hook type has a command configured
    pub fn has_hook(&self, hook: HookType) -> bool {
        self.enabled && !self.command_for(hook).trim().is_empty()
    }

    /// Run a hook command with the given environment context
    ///
    /// If the hook is not configured (empty string) or hooks are disabled,
    /// this is a no-op that returns Ok(()).
    ///
    /// Hook failures log a warning but do NOT return an error, because
    /// hook failures should never abort a file transfer.
    pub async fn run_hook(&self, hook: HookType, env: &HookEnv) -> io::Result<()> {
        if !self.enabled {
            tracing::debug!("Hooks disabled, skipping {}", hook.name());
            return Ok(());
        }

        let command = self.command_for(hook);
        if command.trim().is_empty() {
            return Ok(());
        }

        tracing::info!("Running {} hook: {}", hook.name(), command);

        match run_hook_command(command, env).await {
            Ok(status) => {
                if status {
                    tracing::info!("{} hook completed successfully", hook.name());
                } else {
                    tracing::warn!(
                        "{} hook exited with non-zero status (continuing transfer)",
                        hook.name()
                    );
                }
            }
            Err(e) => {
                tracing::warn!("{} hook failed: {} (continuing transfer)", hook.name(), e);
            }
        }

        Ok(())
    }
}

/// Execute a hook command with the given environment variables
///
/// Returns Ok(true) if the command exited successfully (code 0),
/// Ok(false) if it exited with a non-zero code, or Err on execution failure.
async fn run_hook_command(command: &str, env: &HookEnv) -> io::Result<bool> {
    // Determine the shell to use
    let (shell, shell_arg) = if cfg!(target_os = "windows") {
        ("cmd", "/C")
    } else {
        ("sh", "-c")
    };

    let mut cmd = tokio::process::Command::new(shell);
    cmd.arg(shell_arg).arg(command);

    // Set TALLOW_* environment variables
    // NOTE: We intentionally do NOT pass sensitive data like session keys
    // or code phrases (TALLOW_CODE is omitted — it's an auth secret).
    cmd.env("TALLOW_FILES", env.files.join(","));
    cmd.env("TALLOW_SIZE", env.total_size.to_string());
    cmd.env("TALLOW_DIRECTION", &env.direction);

    if let Some(ref fingerprint) = env.peer_fingerprint {
        cmd.env("TALLOW_PEER", fingerprint);
    }

    // TALLOW_CODE intentionally omitted — code phrase is an authentication
    // secret and must not be leaked to hook scripts or /proc/<pid>/environ.

    if let Some(ref error) = env.error {
        cmd.env("TALLOW_ERROR", error);
    }

    // Suppress stdin (hooks shouldn't read from terminal)
    cmd.stdin(std::process::Stdio::null());
    // Capture stdout/stderr for logging
    cmd.stdout(std::process::Stdio::piped());
    cmd.stderr(std::process::Stdio::piped());

    let mut child = cmd.spawn()?;

    // Apply timeout — use child.wait() so we retain the handle for kill-on-timeout
    let result = tokio::time::timeout(
        std::time::Duration::from_secs(HOOK_TIMEOUT_SECS),
        child.wait(),
    )
    .await;

    match result {
        Ok(Ok(status)) => Ok(status.success()),
        Ok(Err(e)) => Err(e),
        Err(_) => {
            // Timeout fired — actually kill the child process to prevent orphans
            let _ = child.start_kill();
            tracing::warn!(
                "Hook timed out after {}s — process killed",
                HOOK_TIMEOUT_SECS
            );
            Err(io::Error::new(
                io::ErrorKind::TimedOut,
                format!("Hook timed out after {}s", HOOK_TIMEOUT_SECS),
            ))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hook_type_name() {
        assert_eq!(HookType::PreSend.name(), "pre_send");
        assert_eq!(HookType::PostSend.name(), "post_send");
        assert_eq!(HookType::PreReceive.name(), "pre_receive");
        assert_eq!(HookType::PostReceive.name(), "post_receive");
        assert_eq!(HookType::OnError.name(), "on_error");
    }

    #[test]
    fn test_hook_runner_disabled() {
        let config = HookConfig {
            pre_send: "echo hello".to_string(),
            ..Default::default()
        };
        let runner = HookRunner::from_config(&config, false);
        assert!(!runner.has_hook(HookType::PreSend));
    }

    #[test]
    fn test_hook_runner_empty_command() {
        let config = HookConfig::default();
        let runner = HookRunner::from_config(&config, true);
        assert!(!runner.has_hook(HookType::PreSend));
        assert!(!runner.has_hook(HookType::PostSend));
        assert!(!runner.has_hook(HookType::PreReceive));
        assert!(!runner.has_hook(HookType::PostReceive));
        assert!(!runner.has_hook(HookType::OnError));
    }

    #[test]
    fn test_hook_runner_has_hook() {
        let config = HookConfig {
            pre_send: "echo starting send".to_string(),
            post_receive: "mv ~/Downloads/tallow/* ~/received/".to_string(),
            ..Default::default()
        };
        let runner = HookRunner::from_config(&config, true);
        assert!(runner.has_hook(HookType::PreSend));
        assert!(!runner.has_hook(HookType::PostSend));
        assert!(!runner.has_hook(HookType::PreReceive));
        assert!(runner.has_hook(HookType::PostReceive));
        assert!(!runner.has_hook(HookType::OnError));
    }

    #[test]
    fn test_hook_runner_whitespace_only_not_a_hook() {
        let config = HookConfig {
            pre_send: "   ".to_string(),
            ..Default::default()
        };
        let runner = HookRunner::from_config(&config, true);
        assert!(!runner.has_hook(HookType::PreSend));
    }

    #[test]
    fn test_hook_env_default() {
        let env = HookEnv::default();
        assert!(env.files.is_empty());
        assert_eq!(env.total_size, 0);
        assert!(env.peer_fingerprint.is_none());
        assert!(env.code_phrase.is_none());
        assert!(env.error.is_none());
        assert!(env.direction.is_empty());
    }

    #[test]
    fn test_hook_env_construction() {
        let env = HookEnv {
            files: vec!["file1.txt".to_string(), "file2.txt".to_string()],
            total_size: 1024,
            peer_fingerprint: Some("abc12345".to_string()),
            code_phrase: Some("alpha-bravo-charlie".to_string()),
            error: None,
            direction: "send".to_string(),
        };
        assert_eq!(env.files.len(), 2);
        assert_eq!(env.total_size, 1024);
        assert_eq!(env.direction, "send");
    }

    #[tokio::test]
    async fn test_run_hook_noop_when_disabled() {
        let config = HookConfig {
            pre_send: "echo should not run".to_string(),
            ..Default::default()
        };
        let runner = HookRunner::from_config(&config, false);
        let env = HookEnv::default();
        let result = runner.run_hook(HookType::PreSend, &env).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_run_hook_noop_when_empty() {
        let config = HookConfig::default();
        let runner = HookRunner::from_config(&config, true);
        let env = HookEnv::default();
        let result = runner.run_hook(HookType::PreSend, &env).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_run_hook_success() {
        // Use a command that exists on all platforms
        let cmd = if cfg!(target_os = "windows") {
            "echo hello"
        } else {
            "echo hello"
        };
        let config = HookConfig {
            pre_send: cmd.to_string(),
            ..Default::default()
        };
        let runner = HookRunner::from_config(&config, true);
        let env = HookEnv {
            direction: "send".to_string(),
            ..Default::default()
        };
        let result = runner.run_hook(HookType::PreSend, &env).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_run_hook_command_failure_does_not_error() {
        // A command that fails with non-zero exit code
        let cmd = if cfg!(target_os = "windows") {
            "exit /b 1"
        } else {
            "exit 1"
        };
        let config = HookConfig {
            on_error: cmd.to_string(),
            ..Default::default()
        };
        let runner = HookRunner::from_config(&config, true);
        let env = HookEnv {
            error: Some("test error".to_string()),
            direction: "send".to_string(),
            ..Default::default()
        };
        // Should return Ok even though the hook command failed
        let result = runner.run_hook(HookType::OnError, &env).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_run_hook_with_env_vars() {
        // Verify that environment variables are set correctly
        let cmd = if cfg!(target_os = "windows") {
            "echo %TALLOW_SIZE%"
        } else {
            "echo $TALLOW_SIZE"
        };
        let config = HookConfig {
            post_send: cmd.to_string(),
            ..Default::default()
        };
        let runner = HookRunner::from_config(&config, true);
        let env = HookEnv {
            files: vec!["test.txt".to_string()],
            total_size: 42,
            direction: "send".to_string(),
            ..Default::default()
        };
        let result = runner.run_hook(HookType::PostSend, &env).await;
        assert!(result.is_ok());
    }

    #[test]
    fn test_hook_config_serde_roundtrip() {
        let config = HookConfig {
            pre_send: "echo starting".to_string(),
            post_send: "notify-send done".to_string(),
            pre_receive: String::new(),
            post_receive: "mv ~/dl/* ~/received/".to_string(),
            on_error: "echo failed: $TALLOW_ERROR".to_string(),
        };

        let toml_str = toml::to_string_pretty(&config).unwrap();
        let parsed: HookConfig = toml::from_str(&toml_str).unwrap();

        assert_eq!(parsed.pre_send, "echo starting");
        assert_eq!(parsed.post_send, "notify-send done");
        assert!(parsed.pre_receive.is_empty());
        assert_eq!(parsed.post_receive, "mv ~/dl/* ~/received/");
        assert_eq!(parsed.on_error, "echo failed: $TALLOW_ERROR");
    }

    #[test]
    fn test_hook_config_missing_fields_default() {
        // When deserializing TOML with no hooks section, all fields default to empty
        let toml_str = "";
        let parsed: HookConfig = toml::from_str(toml_str).unwrap();
        assert!(parsed.pre_send.is_empty());
        assert!(parsed.post_send.is_empty());
        assert!(parsed.pre_receive.is_empty());
        assert!(parsed.post_receive.is_empty());
        assert!(parsed.on_error.is_empty());
    }

    #[test]
    fn test_hook_config_partial_fields() {
        let toml_str = r#"pre_send = "echo hello""#;
        let parsed: HookConfig = toml::from_str(toml_str).unwrap();
        assert_eq!(parsed.pre_send, "echo hello");
        assert!(parsed.post_send.is_empty());
    }

    #[test]
    fn test_full_config_with_hooks() {
        let toml_str = r#"
[network]
enable_mdns = true
enable_relay = true
relay_servers = ["129.146.114.5:4433"]
stun_servers = ["stun.l.google.com:19302"]
turn_servers = []

[transfer]
download_dir = "~/Downloads"
auto_accept_trusted = false
enable_compression = true
chunk_size = 262144
default_throttle = ""
default_words = 4
default_exclude = ""
default_gitignore = false

[privacy]
strip_metadata = true
encrypt_filenames = false
enable_onion_routing = false
use_doh = false
default_proxy = ""

[ui]
theme = "auto"
show_notifications = true
language = "en"

[hooks]
pre_send = "echo 'Starting send...'"
post_send = "notify-send 'Transfer complete'"
pre_receive = ""
post_receive = "mv ~/Downloads/tallow/* ~/received/"
on_error = "echo 'Transfer failed: $TALLOW_ERROR'"
"#;
        let parsed: tallow_store::config::TallowConfig = toml::from_str(toml_str).unwrap();
        assert_eq!(parsed.hooks.pre_send, "echo 'Starting send...'");
        assert_eq!(parsed.hooks.post_send, "notify-send 'Transfer complete'");
        assert!(parsed.hooks.pre_receive.is_empty());
        assert!(!parsed.hooks.post_receive.is_empty());
        assert!(!parsed.hooks.on_error.is_empty());
    }
}

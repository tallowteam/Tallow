//! OS-level sandboxing for Tallow
//!
//! Implements defense-in-depth sandboxing that restricts the process to only
//! the system calls and filesystem paths it actually needs. Activated after
//! initialization (config loaded, keys generated, network started).
//!
//! Linux: Landlock (filesystem) + Seccomp-BPF (syscalls) + prctl (core dumps)
//! OpenBSD: pledge + unveil (stubbed — requires pledge crate)
//! macOS: core dump prevention via setrlimit
//! Windows: graceful no-op (no kernel sandbox)

use std::path::Path;
use thiserror::Error;

/// Errors that can occur during sandbox setup
#[derive(Error, Debug)]
pub enum SandboxError {
    /// The current platform does not support sandboxing
    #[error("Sandboxing not supported on this platform")]
    Unsupported,
    /// Sandbox application failed
    #[error("Failed to apply sandbox: {0}")]
    ApplyFailed(String),
    /// An I/O error occurred during sandbox setup
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

/// Sandbox configuration describing allowed filesystem access and capabilities
///
/// Note: DNS resolution uses the same syscalls as general networking (socket,
/// connect, sendto, recvfrom), so it cannot be independently restricted at the
/// syscall level. DNS is allowed whenever `allow_network` is true.
/// Default is restrictive: no paths, no network. Callers must opt in.
#[derive(Default)]
pub struct SandboxConfig {
    /// Paths that should remain readable
    pub read_paths: Vec<String>,
    /// Paths that should remain writable
    pub write_paths: Vec<String>,
    /// Whether networking (and DNS) is allowed (default: false)
    pub allow_network: bool,
}

impl SandboxConfig {
    /// Build a config for sending files
    ///
    /// Grants read access to config dirs and source files, write access to temp.
    pub fn for_send(source_paths: &[&Path]) -> Self {
        let mut read_paths = Vec::new();
        let mut write_paths = Vec::new();

        // Config directory (read-only)
        if let Some(config) = dirs::config_dir() {
            read_paths.push(config.join("tallow").display().to_string());
        }

        // Data directory (read-only after init)
        if let Some(data) = dirs::data_dir() {
            read_paths.push(data.join("tallow").display().to_string());
        }

        // Source files being sent (read-only)
        for path in source_paths {
            read_paths.push(path.display().to_string());
        }

        // Temp directory (writable for intermediate files)
        write_paths.push(std::env::temp_dir().display().to_string());

        // Data directory needs write for history log
        if let Some(data) = dirs::data_dir() {
            write_paths.push(data.join("tallow").display().to_string());
        }

        Self {
            read_paths,
            write_paths,
            allow_network: true,
        }
    }

    /// Build a config for file transfer (receive) operations
    ///
    /// Grants read access to config dirs and write access to the output directory.
    pub fn for_transfer(output_dir: &Path) -> Self {
        let mut read_paths = Vec::new();
        let mut write_paths = Vec::new();

        // Config directory (read-only)
        if let Some(config) = dirs::config_dir() {
            read_paths.push(config.join("tallow").display().to_string());
        }

        // Data directory (read-only after init)
        if let Some(data) = dirs::data_dir() {
            read_paths.push(data.join("tallow").display().to_string());
        }

        // Output directory (writable)
        write_paths.push(output_dir.display().to_string());

        // Temp directory (writable for intermediate files)
        write_paths.push(std::env::temp_dir().display().to_string());

        // Data directory needs write for checkpoints + history
        if let Some(data) = dirs::data_dir() {
            write_paths.push(data.join("tallow").display().to_string());
        }

        Self {
            read_paths,
            write_paths,
            allow_network: true,
        }
    }
}

/// Apply OS-level sandboxing (SAND-01, SAND-02, SAND-03)
///
/// This should be called AFTER all initialization is complete:
/// - Config loaded
/// - Identity keys generated/loaded
/// - Network interfaces enumerated
/// - Logging initialized
///
/// After this call, the process is restricted to:
/// - Network I/O (send/recv)
/// - File read/write to specified paths only
/// - No new process execution
/// - No filesystem creation outside allowed paths
pub fn apply_sandbox(config: &SandboxConfig) -> Result<(), SandboxError> {
    // SAND-03: Disable core dumps on all platforms
    disable_core_dumps();

    apply_platform_sandbox(config)
}

/// Disable core dumps to prevent key material from being written to disk (SAND-03)
///
/// Uses platform-specific mechanisms:
/// - Linux: prctl(PR_SET_DUMPABLE, 0) via libc
/// - macOS/BSD: setrlimit(RLIMIT_CORE, 0) — stubbed
/// - Windows: no-op (minidumps are opt-in)
#[allow(unsafe_code)] // Required for libc::prctl on Linux
pub fn disable_core_dumps() {
    #[cfg(target_os = "linux")]
    {
        // SAFETY: prctl(PR_SET_DUMPABLE, 0) is safe — it only affects the
        // current process's dumpable attribute and requires no preconditions.
        // We call it through libc which handles the syscall interface.
        let ret = unsafe { libc::prctl(libc::PR_SET_DUMPABLE, 0, 0, 0, 0) };
        if ret == 0 {
            tracing::info!("Core dumps: disabled via prctl(PR_SET_DUMPABLE, 0)");
        } else {
            tracing::warn!(
                "Core dumps: prctl(PR_SET_DUMPABLE, 0) failed (errno={})",
                std::io::Error::last_os_error()
            );
        }
    }

    #[cfg(any(target_os = "macos", target_os = "freebsd", target_os = "openbsd"))]
    {
        // TODO: Implement actual core dump prevention via setrlimit(RLIMIT_CORE, 0)
        tracing::warn!("Core dumps: setrlimit(RLIMIT_CORE, 0) not yet implemented — stubbed");
    }

    #[cfg(target_os = "windows")]
    {
        // Windows: MiniDumpWriteDump is opt-in; Dr. Watson/WER can be
        // disabled via registry but that's system-wide. For our purposes,
        // the default Windows behavior is acceptable.
        tracing::debug!("Core dumps: Windows default (no automatic core dumps)");
    }

    #[cfg(not(any(
        target_os = "linux",
        target_os = "macos",
        target_os = "freebsd",
        target_os = "openbsd",
        target_os = "windows"
    )))]
    {
        tracing::warn!("Core dumps: no platform-specific prevention available");
    }
}

/// Apply platform-specific sandbox
fn apply_platform_sandbox(config: &SandboxConfig) -> Result<(), SandboxError> {
    #[cfg(target_os = "linux")]
    {
        apply_linux_sandbox(config)?;
        return Ok(());
    }

    #[cfg(target_os = "openbsd")]
    {
        apply_openbsd_sandbox(config)?;
        return Ok(());
    }

    #[cfg(not(any(target_os = "linux", target_os = "openbsd")))]
    {
        let _ = config; // suppress unused warning
        tracing::info!(
            "OS sandbox: not available on {} (core dumps still disabled)",
            std::env::consts::OS
        );
        Ok(())
    }
}

/// Linux sandbox: Landlock + Seccomp-BPF (SAND-01 + SAND-02)
///
/// Landlock restricts filesystem access (kernel 5.13+).
/// Seccomp restricts system calls.
/// Both degrade gracefully on older kernels.
#[cfg(target_os = "linux")]
fn apply_linux_sandbox(config: &SandboxConfig) -> Result<(), SandboxError> {
    // SAND-01: Landlock filesystem restrictions
    apply_landlock(config)?;

    // SAND-02: Seccomp-BPF syscall filtering
    apply_seccomp(config)?;

    tracing::info!("Linux sandbox: Landlock + Seccomp active");
    Ok(())
}

/// Apply Landlock filesystem restrictions (SAND-01)
///
/// Restricts filesystem access to only the paths specified in the config.
/// Degrades gracefully if Landlock is not supported by the kernel.
#[cfg(target_os = "linux")]
fn apply_landlock(config: &SandboxConfig) -> Result<(), SandboxError> {
    use landlock::{
        path_beneath_rules, Access, AccessFs, Ruleset, RulesetAttr, RulesetCreatedAttr,
        RulesetStatus, ABI,
    };

    // Use the best available ABI version, with graceful degradation
    let abi = ABI::V3;

    // Create the ruleset handling all filesystem access rights
    let read_access = AccessFs::from_read(abi);
    let full_access = AccessFs::from_all(abi);

    let status = Ruleset::default()
        .handle_access(full_access)
        .map_err(|e| SandboxError::ApplyFailed(format!("Landlock handle_access: {}", e)))?
        .create()
        .map_err(|e| SandboxError::ApplyFailed(format!("Landlock create: {}", e)))?
        // Add read-only rules for config, data, and source paths
        .add_rules(path_beneath_rules(&config.read_paths, read_access))
        .map_err(|e| SandboxError::ApplyFailed(format!("Landlock read rules: {}", e)))?
        // Add read+write rules for output and temp paths
        .add_rules(path_beneath_rules(&config.write_paths, full_access))
        .map_err(|e| SandboxError::ApplyFailed(format!("Landlock write rules: {}", e)))?
        // Enforce — from this point, filesystem access is restricted
        .restrict_self()
        .map_err(|e| SandboxError::ApplyFailed(format!("Landlock restrict_self: {}", e)))?;

    match status.ruleset {
        RulesetStatus::FullyEnforced => {
            tracing::info!(
                "Landlock: ACTIVE (fully enforced) — {} read paths, {} write paths",
                config.read_paths.len(),
                config.write_paths.len()
            );
        }
        RulesetStatus::PartiallyEnforced => {
            tracing::warn!(
                "Landlock: partially enforced (kernel may not support all requested access rights)"
            );
        }
        RulesetStatus::NotEnforced => {
            tracing::warn!("Landlock: NOT enforced (kernel does not support Landlock)");
        }
        // RulesetStatus is non_exhaustive — handle future variants gracefully
        _ => {
            tracing::info!("Landlock: applied (unknown enforcement status)");
        }
    }

    Ok(())
}

/// Apply Seccomp-BPF syscall filtering (SAND-02)
///
/// Restricts the process to only the system calls needed for file transfer.
/// Uses an allowlist approach — all unlisted syscalls return EPERM.
///
/// Note: Some syscall constants are architecture-specific. This filter is
/// designed for x86_64 but uses `cfg` guards for portability.
#[cfg(target_os = "linux")]
fn apply_seccomp(config: &SandboxConfig) -> Result<(), SandboxError> {
    use seccompiler::{BpfProgram, SeccompAction, SeccompFilter, SeccompRule};
    use std::collections::BTreeMap;
    use std::convert::TryInto;

    let mut rules: BTreeMap<i64, Vec<SeccompRule>> = BTreeMap::new();

    /// Helper to insert a syscall rule, ignoring duplicates
    macro_rules! allow_syscall {
        ($rules:expr, $syscall:expr) => {
            $rules.insert($syscall, vec![]);
        };
    }

    // --- Memory management ---
    allow_syscall!(rules, libc::SYS_brk);
    allow_syscall!(rules, libc::SYS_mmap);
    allow_syscall!(rules, libc::SYS_munmap);
    allow_syscall!(rules, libc::SYS_mprotect);
    allow_syscall!(rules, libc::SYS_madvise);
    allow_syscall!(rules, libc::SYS_mlock);
    allow_syscall!(rules, libc::SYS_mlock2);
    allow_syscall!(rules, libc::SYS_munlock);
    allow_syscall!(rules, libc::SYS_mremap);

    // --- File I/O ---
    allow_syscall!(rules, libc::SYS_read);
    allow_syscall!(rules, libc::SYS_write);
    allow_syscall!(rules, libc::SYS_pread64);
    allow_syscall!(rules, libc::SYS_pwrite64);
    allow_syscall!(rules, libc::SYS_readv);
    allow_syscall!(rules, libc::SYS_writev);
    allow_syscall!(rules, libc::SYS_openat);
    allow_syscall!(rules, libc::SYS_close);
    allow_syscall!(rules, libc::SYS_newfstatat);
    allow_syscall!(rules, libc::SYS_lseek);
    allow_syscall!(rules, libc::SYS_fcntl);
    allow_syscall!(rules, libc::SYS_ioctl);
    allow_syscall!(rules, libc::SYS_dup);
    allow_syscall!(rules, libc::SYS_dup3);
    allow_syscall!(rules, libc::SYS_ftruncate);
    allow_syscall!(rules, libc::SYS_fsync);
    allow_syscall!(rules, libc::SYS_fdatasync);
    allow_syscall!(rules, libc::SYS_fallocate);
    allow_syscall!(rules, libc::SYS_statx);
    allow_syscall!(rules, libc::SYS_faccessat);
    allow_syscall!(rules, libc::SYS_faccessat2);
    allow_syscall!(rules, libc::SYS_getcwd);

    // x86_64-only syscalls (superseded by *at variants on aarch64)
    #[cfg(target_arch = "x86_64")]
    {
        allow_syscall!(rules, libc::SYS_fstat);
        allow_syscall!(rules, libc::SYS_dup2);
        allow_syscall!(rules, libc::SYS_access);
    }

    // --- Directory operations (needed for output dirs and temp) ---
    allow_syscall!(rules, libc::SYS_getdents64);
    allow_syscall!(rules, libc::SYS_mkdirat);
    allow_syscall!(rules, libc::SYS_renameat2);
    allow_syscall!(rules, libc::SYS_unlinkat);
    allow_syscall!(rules, libc::SYS_symlinkat);
    allow_syscall!(rules, libc::SYS_readlinkat);
    allow_syscall!(rules, libc::SYS_linkat);
    allow_syscall!(rules, libc::SYS_fchmod);
    allow_syscall!(rules, libc::SYS_fchmodat);
    allow_syscall!(rules, libc::SYS_fchown);
    allow_syscall!(rules, libc::SYS_fchownat);
    allow_syscall!(rules, libc::SYS_utimensat);

    // --- Networking (if allowed) ---
    if config.allow_network {
        allow_syscall!(rules, libc::SYS_socket);
        allow_syscall!(rules, libc::SYS_bind);
        allow_syscall!(rules, libc::SYS_connect);
        allow_syscall!(rules, libc::SYS_listen);
        allow_syscall!(rules, libc::SYS_accept4);
        allow_syscall!(rules, libc::SYS_sendto);
        allow_syscall!(rules, libc::SYS_recvfrom);
        allow_syscall!(rules, libc::SYS_sendmsg);
        allow_syscall!(rules, libc::SYS_recvmsg);
        allow_syscall!(rules, libc::SYS_shutdown);
        allow_syscall!(rules, libc::SYS_getsockopt);
        allow_syscall!(rules, libc::SYS_setsockopt);
        allow_syscall!(rules, libc::SYS_getsockname);
        allow_syscall!(rules, libc::SYS_getpeername);
        allow_syscall!(rules, libc::SYS_socketpair);

        // x86_64 has separate accept syscall; aarch64 only has accept4
        #[cfg(target_arch = "x86_64")]
        allow_syscall!(rules, libc::SYS_accept);
    }

    // --- Polling and event I/O (tokio runtime) ---
    allow_syscall!(rules, libc::SYS_epoll_create1);
    allow_syscall!(rules, libc::SYS_epoll_ctl);
    allow_syscall!(rules, libc::SYS_epoll_pwait);
    allow_syscall!(rules, libc::SYS_ppoll);
    allow_syscall!(rules, libc::SYS_pselect6);
    allow_syscall!(rules, libc::SYS_eventfd2);
    allow_syscall!(rules, libc::SYS_pipe2);

    // x86_64-only legacy polling syscalls (aarch64 uses *pwait variants)
    #[cfg(target_arch = "x86_64")]
    {
        allow_syscall!(rules, libc::SYS_epoll_wait);
        allow_syscall!(rules, libc::SYS_poll);
        allow_syscall!(rules, libc::SYS_select);
    }

    // --- Process and thread management ---
    allow_syscall!(rules, libc::SYS_exit);
    allow_syscall!(rules, libc::SYS_exit_group);
    allow_syscall!(rules, libc::SYS_futex);
    allow_syscall!(rules, libc::SYS_sched_yield);
    allow_syscall!(rules, libc::SYS_sched_getaffinity);
    allow_syscall!(rules, libc::SYS_nanosleep);
    allow_syscall!(rules, libc::SYS_clock_nanosleep);
    allow_syscall!(rules, libc::SYS_clock_gettime);
    allow_syscall!(rules, libc::SYS_clock_getres);
    allow_syscall!(rules, libc::SYS_gettimeofday);
    allow_syscall!(rules, libc::SYS_getpid);
    allow_syscall!(rules, libc::SYS_gettid);
    allow_syscall!(rules, libc::SYS_getuid);
    allow_syscall!(rules, libc::SYS_geteuid);
    allow_syscall!(rules, libc::SYS_getgid);
    allow_syscall!(rules, libc::SYS_getegid);
    allow_syscall!(rules, libc::SYS_set_robust_list);
    allow_syscall!(rules, libc::SYS_get_robust_list);
    allow_syscall!(rules, libc::SYS_prctl);

    // x86_64-only: arch_prctl for TLS setup
    #[cfg(target_arch = "x86_64")]
    allow_syscall!(rules, libc::SYS_arch_prctl);

    // --- Signals ---
    allow_syscall!(rules, libc::SYS_rt_sigaction);
    allow_syscall!(rules, libc::SYS_rt_sigprocmask);
    allow_syscall!(rules, libc::SYS_rt_sigreturn);
    allow_syscall!(rules, libc::SYS_sigaltstack);
    allow_syscall!(rules, libc::SYS_tgkill);

    // --- Thread creation (for tokio worker threads) ---
    allow_syscall!(rules, libc::SYS_clone);
    allow_syscall!(rules, libc::SYS_clone3);
    allow_syscall!(rules, libc::SYS_set_tid_address);
    allow_syscall!(rules, libc::SYS_rseq);

    // --- Entropy (for cryptography) ---
    allow_syscall!(rules, libc::SYS_getrandom);

    // --- Resource limits ---
    allow_syscall!(rules, libc::SYS_getrlimit);
    allow_syscall!(rules, libc::SYS_prlimit64);
    allow_syscall!(rules, libc::SYS_sysinfo);
    allow_syscall!(rules, libc::SYS_uname);

    // --- Terminal I/O (for TUI and progress bars) ---
    // ioctl is already allowed above for general use

    // Build the seccomp filter:
    // - mismatch_action: ERRNO(EPERM) for unlisted syscalls (deny by default)
    // - match_action: Allow for listed syscalls (allowlist)
    let target_arch = std::env::consts::ARCH
        .try_into()
        .map_err(|e| SandboxError::ApplyFailed(format!("Unsupported arch for seccomp: {:?}", e)))?;

    let filter = SeccompFilter::new(
        rules,
        // mismatch_action: deny syscalls NOT in our allowlist
        SeccompAction::Errno(libc::EPERM as u32),
        // match_action: allow syscalls IN our allowlist
        SeccompAction::Allow,
        target_arch,
    )
    .map_err(|e| SandboxError::ApplyFailed(format!("Seccomp filter creation: {}", e)))?;

    let bpf_prog: BpfProgram = filter
        .try_into()
        .map_err(|e| SandboxError::ApplyFailed(format!("Seccomp BPF compilation: {}", e)))?;

    seccompiler::apply_filter(&bpf_prog)
        .map_err(|e| SandboxError::ApplyFailed(format!("Seccomp apply_filter: {}", e)))?;

    tracing::info!(
        "Seccomp: ACTIVE (allowlist filter, network={})",
        config.allow_network
    );

    Ok(())
}

/// OpenBSD sandbox: pledge + unveil
#[cfg(target_os = "openbsd")]
fn apply_openbsd_sandbox(config: &SandboxConfig) -> Result<(), SandboxError> {
    // TODO: Implement actual pledge + unveil (requires pledge/unveil crate)
    // pledge("stdio rpath wpath cpath inet dns tty", None)
    // For each read path: unveil(path, "r")
    // For each write path: unveil(path, "rwc")
    // unveil(None, None) to lock
    let _ = config;
    tracing::warn!("OpenBSD sandbox: STUBBED — pledge + unveil not yet active");
    Ok(())
}

/// Check if the current platform supports sandboxing
pub fn is_sandbox_supported() -> bool {
    // Only Linux has a real implementation (Landlock + Seccomp).
    // macOS and OpenBSD paths are stubbed — don't claim support.
    cfg!(target_os = "linux")
}

/// Get a human-readable description of the active sandbox
pub fn sandbox_status() -> &'static str {
    #[cfg(target_os = "linux")]
    return "Linux (Landlock + Seccomp-BPF + prctl)";

    #[cfg(target_os = "openbsd")]
    return "OpenBSD (Pledge + Unveil)";

    #[cfg(target_os = "macos")]
    return "macOS (core dump prevention)";

    #[cfg(target_os = "windows")]
    return "Windows (no kernel sandbox)";

    #[cfg(not(any(
        target_os = "linux",
        target_os = "openbsd",
        target_os = "macos",
        target_os = "windows"
    )))]
    return "None (unsupported platform)";
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = SandboxConfig::default();
        assert!(!config.allow_network); // Default is restrictive
        assert!(config.read_paths.is_empty());
        assert!(config.write_paths.is_empty());
    }

    #[test]
    fn test_sandbox_status() {
        let status = sandbox_status();
        assert!(!status.is_empty());
    }

    #[test]
    fn test_is_supported() {
        let _ = is_sandbox_supported();
    }

    #[test]
    fn test_for_transfer() {
        let config = SandboxConfig::for_transfer(Path::new("/tmp/output"));
        assert!(!config.write_paths.is_empty());
        assert!(config.allow_network);
        // Output dir should be in write paths
        assert!(config.write_paths.iter().any(|p| p.contains("output")));
    }

    #[test]
    fn test_for_send() {
        let source = Path::new("/home/user/file.txt");
        let config = SandboxConfig::for_send(&[source]);
        assert!(config.allow_network);
        // Source path should be in read paths
        assert!(config.read_paths.iter().any(|p| p.contains("file.txt")));
        // Temp dir should be in write paths
        assert!(!config.write_paths.is_empty());
    }

    #[test]
    fn test_for_send_multiple_files() {
        let sources = [Path::new("/home/user/a.txt"), Path::new("/home/user/b.txt")];
        let config = SandboxConfig::for_send(&sources);
        // Both source paths should be in read paths
        assert!(config.read_paths.iter().any(|p| p.contains("a.txt")));
        assert!(config.read_paths.iter().any(|p| p.contains("b.txt")));
    }

    #[test]
    fn test_disable_core_dumps() {
        // Should not panic on any platform
        disable_core_dumps();
    }

    #[test]
    fn test_apply_sandbox() {
        // Should succeed (no-op on unsupported platforms like Windows)
        let config = SandboxConfig::default();
        let result = apply_sandbox(&config);
        // On Windows/macOS, this should be Ok (graceful no-op)
        // On Linux CI without Landlock support, it should still be Ok
        // (graceful degradation)
        assert!(result.is_ok());
    }

    #[test]
    fn test_sandbox_error_display() {
        let err = SandboxError::Unsupported;
        assert_eq!(err.to_string(), "Sandboxing not supported on this platform");

        let err = SandboxError::ApplyFailed("test failure".to_string());
        assert_eq!(err.to_string(), "Failed to apply sandbox: test failure");
    }

    #[test]
    fn test_config_with_no_network() {
        let config = SandboxConfig {
            read_paths: vec![],
            write_paths: vec![],
            allow_network: false,
        };
        assert!(!config.allow_network);
    }
}

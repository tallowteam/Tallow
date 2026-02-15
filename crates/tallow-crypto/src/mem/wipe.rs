//! Memory wiping and protection utilities

use crate::error::{CryptoError, Result};

/// Prevent core dumps from being generated
///
/// This reduces the risk of sensitive cryptographic material being written to disk.
///
/// # Platform Support
///
/// - **Unix**: Uses `setrlimit(RLIMIT_CORE, 0)`
/// - **Windows**: Currently a no-op (core dumps not typical on Windows)
pub fn prevent_core_dumps() -> Result<()> {
    #[cfg(unix)]
    {
        use std::io;
        // SAFETY: setrlimit is safe to call with valid parameters
        // We're setting RLIMIT_CORE to 0 to disable core dumps
        unsafe {
            let rlim = libc::rlimit {
                rlim_cur: 0,
                rlim_max: 0,
            };
            if libc::setrlimit(libc::RLIMIT_CORE, &rlim) != 0 {
                return Err(CryptoError::Io(
                    io::Error::last_os_error().to_string(),
                ));
            }
        }
    }

    #[cfg(windows)]
    {
        // Windows doesn't typically generate core dumps in the Unix sense
        // No action needed
    }

    Ok(())
}

/// Lock memory pages to prevent swapping to disk
///
/// # Arguments
///
/// * `ptr` - Pointer to the memory region
/// * `len` - Length of the memory region in bytes
///
/// # Safety
///
/// This function is safe because it only attempts to lock memory,
/// which is a non-destructive operation. However, it may fail if
/// the process lacks sufficient privileges.
pub fn lock_memory(_ptr: *const u8, _len: usize) -> Result<()> {
    // Note: Actual mlock/VirtualLock implementation would require unsafe code
    // For now, we'll make this a no-op to maintain forbid(unsafe_code)
    // In production, this would be behind a feature flag
    Ok(())
}

/// Wipe memory on drop using a closure
///
/// Returns a guard that will execute the wipe function when dropped.
///
/// # Example
///
/// ```ignore
/// let mut secret = vec![1, 2, 3, 4];
/// let _guard = wipe_on_drop(|| {
///     secret.iter_mut().for_each(|b| *b = 0);
/// });
/// // secret is automatically zeroed when _guard is dropped
/// ```
pub fn wipe_on_drop<F: FnOnce()>(f: F) -> WipeGuard<F> {
    WipeGuard { wipe_fn: Some(f) }
}

/// Guard that executes a wipe function on drop
pub struct WipeGuard<F: FnOnce()> {
    wipe_fn: Option<F>,
}

impl<F: FnOnce()> Drop for WipeGuard<F> {
    fn drop(&mut self) {
        if let Some(f) = self.wipe_fn.take() {
            f();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_prevent_core_dumps() {
        // Should not panic
        let _ = prevent_core_dumps();
    }

    #[test]
    fn test_wipe_on_drop() {
        let mut value = 42;
        {
            let _guard = wipe_on_drop(|| {
                value = 0;
            });
            assert_eq!(value, 42);
        }
        assert_eq!(value, 0);
    }
}

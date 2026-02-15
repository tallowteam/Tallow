//! Exit code constants

/// Success exit code
pub const SUCCESS: i32 = 0;

/// General error
pub const ERROR: i32 = 1;

/// Authentication failure
pub const AUTH_FAILURE: i32 = 2;

/// User cancelled operation
pub const CANCELLED: i32 = 3;

/// Network error
pub const NETWORK_ERROR: i32 = 4;

/// File not found
pub const FILE_NOT_FOUND: i32 = 5;

/// Permission denied
pub const PERMISSION_DENIED: i32 = 6;

/// Invalid configuration
pub const CONFIG_ERROR: i32 = 7;

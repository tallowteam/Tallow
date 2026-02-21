//! User prompts and input using dialoguer

use std::io;
use zeroize::Zeroizing;

/// Prompt for yes/no confirmation (default: no)
pub fn confirm(message: &str) -> io::Result<bool> {
    dialoguer::Confirm::new()
        .with_prompt(message)
        .default(false)
        .interact()
        .map_err(|e| io::Error::other(format!("Prompt failed: {}", e)))
}

/// Prompt for yes/no confirmation with a custom default
pub fn confirm_with_default(message: &str, default: bool) -> io::Result<bool> {
    dialoguer::Confirm::new()
        .with_prompt(message)
        .default(default)
        .interact()
        .map_err(|e| io::Error::other(format!("Prompt failed: {}", e)))
}

/// Prompt for password input (hidden)
///
/// Returns a `Zeroizing<String>` that automatically zeroizes
/// the password memory when dropped, preventing it from lingering
/// in freed heap allocations.
pub fn password_prompt(message: &str) -> io::Result<Zeroizing<String>> {
    let password = dialoguer::Password::new()
        .with_prompt(message)
        .interact()
        .map_err(|e| io::Error::other(format!("Password prompt failed: {}", e)))?;
    Ok(Zeroizing::new(password))
}

/// Select from a list of options
pub fn select<T: ToString>(message: &str, options: &[T]) -> io::Result<usize> {
    let items: Vec<String> = options.iter().map(|o| o.to_string()).collect();

    dialoguer::Select::new()
        .with_prompt(message)
        .items(&items)
        .default(0)
        .interact()
        .map_err(|e| io::Error::other(format!("Select failed: {}", e)))
}

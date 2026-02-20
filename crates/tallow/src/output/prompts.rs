//! User prompts and input using dialoguer

use std::io;

/// Prompt for yes/no confirmation
pub fn confirm(message: &str) -> io::Result<bool> {
    dialoguer::Confirm::new()
        .with_prompt(message)
        .default(false)
        .interact()
        .map_err(|e| io::Error::other(format!("Prompt failed: {}", e)))
}

/// Prompt for password input (hidden)
pub fn password_prompt(message: &str) -> io::Result<String> {
    dialoguer::Password::new()
        .with_prompt(message)
        .interact()
        .map_err(|e| io::Error::other(format!("Password prompt failed: {}", e)))
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

//! User prompts and input

use std::io;

/// Prompt for yes/no confirmation
pub fn confirm(message: &str) -> io::Result<bool> {
    print!("{} [y/N]: ", message);
    // Would use dialoguer crate
    Ok(false)
}

/// Prompt for password input
pub fn password_prompt(message: &str) -> io::Result<String> {
    print!("{}: ", message);
    // Would use dialoguer crate with hidden input
    Ok(String::new())
}

/// Select from a list of options
pub fn select<T: ToString>(message: &str, _options: &[T]) -> io::Result<usize> {
    print!("{}: ", message);
    // Would use dialoguer crate
    Ok(0)
}

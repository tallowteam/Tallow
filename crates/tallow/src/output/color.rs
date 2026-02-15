//! Colored output helpers

/// Print styled text
pub fn styled(text: &str, _style: &str) -> String {
    // Would use owo-colors crate
    text.to_string()
}

/// Print warning message
pub fn warning(text: &str) {
    eprintln!("Warning: {}", text);
}

/// Print error message
pub fn error(text: &str) {
    eprintln!("Error: {}", text);
}

/// Print success message
pub fn success(text: &str) {
    println!("Success: {}", text);
}

/// Print info message
pub fn info(text: &str) {
    println!("Info: {}", text);
}

//! Colored output helpers using owo-colors with NO_COLOR support

use owo_colors::OwoColorize;

/// Check if color output is enabled (respects NO_COLOR env var)
fn color_enabled() -> bool {
    std::env::var("NO_COLOR").is_err()
}

/// Apply a named style to text
pub fn styled(text: &str, style: &str) -> String {
    if !color_enabled() {
        return text.to_string();
    }

    match style {
        "bold" => format!("{}", text.bold()),
        "dim" => format!("{}", text.dimmed()),
        "red" => format!("{}", text.red()),
        "green" => format!("{}", text.green()),
        "yellow" => format!("{}", text.yellow()),
        "blue" => format!("{}", text.blue()),
        "cyan" => format!("{}", text.cyan()),
        "magenta" => format!("{}", text.magenta()),
        _ => text.to_string(),
    }
}

/// Print warning message to stderr
pub fn warning(text: &str) {
    if color_enabled() {
        eprintln!("{} {}", "Warning:".yellow().bold(), text);
    } else {
        eprintln!("Warning: {}", text);
    }
}

/// Print error message to stderr
pub fn error(text: &str) {
    if color_enabled() {
        eprintln!("{} {}", "Error:".red().bold(), text);
    } else {
        eprintln!("Error: {}", text);
    }
}

/// Print success message to stdout
pub fn success(text: &str) {
    if color_enabled() {
        println!("{} {}", "OK:".green().bold(), text);
    } else {
        println!("OK: {}", text);
    }
}

/// Print info message to stdout
pub fn info(text: &str) {
    if color_enabled() {
        println!("{} {}", ">>".cyan().bold(), text);
    } else {
        println!(">> {}", text);
    }
}

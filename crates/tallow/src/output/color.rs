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

/// Print a transfer summary line (file count + total size)
pub fn transfer_summary(file_count: usize, total_bytes: u64) {
    let size_str = super::format_size(total_bytes);
    if color_enabled() {
        println!(
            "{} {} ({} total)",
            ">>".cyan().bold(),
            format!("{} file(s)", file_count).bold(),
            size_str
        );
    } else {
        println!(">> {} file(s) ({} total)", file_count, size_str);
    }
}

/// Print a file listing entry with name and size
pub fn file_entry(name: &str, size: u64) {
    let size_str = super::format_size(size);
    if color_enabled() {
        println!("   {} {}", name, format!("({})", size_str).dimmed());
    } else {
        println!("   {} ({})", name, size_str);
    }
}

/// Print transfer completion with speed summary
pub fn transfer_complete(total_bytes: u64, duration: std::time::Duration) {
    let speed = super::format_speed(total_bytes, duration);
    let size_str = super::format_size(total_bytes);
    if color_enabled() {
        println!(
            "{} Transfer complete: {} at {}",
            "OK:".green().bold(),
            size_str,
            speed
        );
    } else {
        println!("OK: Transfer complete: {} at {}", size_str, speed);
    }
}

/// Print a section separator (dimmed)
pub fn section(text: &str) {
    if color_enabled() {
        println!("{}", text.dimmed());
    } else {
        println!("{}", text);
    }
}

/// Print a highlighted code phrase for sharing
pub fn code_phrase(code: &str) {
    if color_enabled() {
        println!("  {}", code.bold().cyan());
    } else {
        println!("  {}", code);
    }
}

/// Display that a direct LAN connection was established
pub fn direct_connection() {
    if color_enabled() {
        println!(
            "{} {}",
            "OK:".green().bold(),
            "Direct LAN connection established!".bold()
        );
    } else {
        println!("OK: Direct LAN connection established!");
    }
}

/// Display that the transfer fell back to relay after LAN attempt failed
pub fn fallback_to_relay(relay: &str) {
    if color_enabled() {
        eprintln!(
            "{} LAN peer not found, connected via relay ({})",
            "Warning:".yellow().bold(),
            relay
        );
    } else {
        eprintln!(
            "Warning: LAN peer not found, connected via relay ({})",
            relay
        );
    }
}

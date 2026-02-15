//! JSON output formatting

/// Trait for JSON output
pub trait JsonOutput {
    /// Convert to JSON string
    fn to_json(&self) -> String;
}

/// Print as JSON
pub fn print_json<T: JsonOutput>(value: &T) {
    println!("{}", value.to_json());
}

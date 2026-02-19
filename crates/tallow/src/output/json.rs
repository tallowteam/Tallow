//! JSON output formatting

use serde::Serialize;

/// Trait for types that can be output as JSON
pub trait JsonOutput: Serialize {
    /// Get a human-readable type name for the output
    fn output_type(&self) -> &'static str;
}

/// Print any serializable value as JSON
pub fn print_json<T: Serialize>(value: &T) {
    match serde_json::to_string_pretty(value) {
        Ok(json) => println!("{}", json),
        Err(e) => eprintln!("{{\"error\": \"JSON serialization failed: {}\"}}", e),
    }
}

/// Print a JSON event (for streaming output)
pub fn print_event(event: &str, data: serde_json::Value) {
    let mut obj = serde_json::Map::new();
    obj.insert("event".to_string(), serde_json::Value::String(event.to_string()));
    for (k, v) in data.as_object().into_iter().flatten() {
        obj.insert(k.clone(), v.clone());
    }
    println!("{}", serde_json::Value::Object(obj));
}

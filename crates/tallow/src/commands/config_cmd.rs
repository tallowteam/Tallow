//! Config command implementation

use crate::cli::{AliasCommands, ConfigArgs, ConfigCommands};
use std::io;

/// Execute config command
pub async fn execute(args: ConfigArgs, json: bool) -> io::Result<()> {
    match args.command {
        Some(ConfigCommands::Show) | None => config_show(json),
        Some(ConfigCommands::Get { key }) => config_get(&key, json),
        Some(ConfigCommands::Set { key, value }) => config_set(&key, &value, json),
        Some(ConfigCommands::List) => config_list(json),
        Some(ConfigCommands::Edit) => config_edit(json),
        Some(ConfigCommands::Reset { yes }) => config_reset(yes, json),
        Some(ConfigCommands::Alias { command }) => config_alias(command, json),
    }
}

fn config_show(json: bool) -> io::Result<()> {
    let config = tallow_store::config::load_config()
        .map_err(|e| io::Error::other(format!("Failed to load config: {}", e)))?;

    if json {
        let json_val = serde_json::to_value(&config)
            .map_err(|e| io::Error::other(format!("Failed to serialize: {}", e)))?;
        println!(
            "{}",
            serde_json::to_string_pretty(&json_val).unwrap_or_default()
        );
    } else {
        let toml_str = toml::to_string_pretty(&config)
            .map_err(|e| io::Error::other(format!("Failed to format: {}", e)))?;
        println!("# Tallow Configuration");
        println!("# Path: {}", tallow_store::config::config_path().display());
        println!();
        println!("{}", toml_str);
    }

    Ok(())
}

fn config_get(key: &str, json: bool) -> io::Result<()> {
    let config =
        tallow_store::config::load_config().map_err(|e| io::Error::other(format!("{}", e)))?;

    let value = tallow_store::config::get_config_value(&config, key)
        .map_err(|e| io::Error::new(io::ErrorKind::NotFound, format!("{}", e)))?;

    if json {
        println!("{}", serde_json::json!({"key": key, "value": value}));
    } else {
        println!("{}", value);
    }

    Ok(())
}

fn config_set(key: &str, value: &str, json: bool) -> io::Result<()> {
    let mut config =
        tallow_store::config::load_config().map_err(|e| io::Error::other(format!("{}", e)))?;

    tallow_store::config::set_config_value(&mut config, key, value)
        .map_err(|e| io::Error::new(io::ErrorKind::InvalidInput, format!("{}", e)))?;

    tallow_store::config::save_config(&config).map_err(|e| io::Error::other(format!("{}", e)))?;

    if json {
        println!(
            "{}",
            serde_json::json!({"event": "config_updated", "key": key, "value": value})
        );
    } else {
        crate::output::color::success(&format!("Set {} = {}", key, value));
    }

    Ok(())
}

fn config_list(json: bool) -> io::Result<()> {
    let config =
        tallow_store::config::load_config().map_err(|e| io::Error::other(format!("{}", e)))?;

    // List all keys by serializing to TOML and walking the structure
    let toml_val =
        toml::Value::try_from(&config).map_err(|e| io::Error::other(format!("{}", e)))?;

    let mut entries = Vec::new();
    collect_keys("", &toml_val, &mut entries);

    if json {
        let list: Vec<serde_json::Value> = entries
            .iter()
            .map(|(k, v)| serde_json::json!({"key": k, "value": v}))
            .collect();
        println!(
            "{}",
            serde_json::to_string_pretty(&list).unwrap_or_default()
        );
    } else {
        for (key, value) in &entries {
            println!("{} = {}", key, value);
        }
    }

    Ok(())
}

fn config_edit(_json: bool) -> io::Result<()> {
    let path = tallow_store::config::config_path();

    // Ensure config file exists
    let _ = tallow_store::config::load_config();

    let editor = std::env::var("EDITOR")
        .or_else(|_| std::env::var("VISUAL"))
        .unwrap_or_else(|_| {
            if cfg!(windows) {
                "notepad".to_string()
            } else {
                "vi".to_string()
            }
        });

    println!("Opening {} in {}...", path.display(), editor);

    std::process::Command::new(&editor)
        .arg(&path)
        .status()
        .map_err(|e| io::Error::other(format!("Failed to open editor '{}': {}", editor, e)))?;

    Ok(())
}

fn config_reset(yes: bool, json: bool) -> io::Result<()> {
    if !yes {
        println!("This will reset all configuration to defaults.");
        println!("Use --yes to confirm.");
        return Ok(());
    }

    let config = tallow_store::config::TallowConfig::default();
    tallow_store::config::save_config(&config).map_err(|e| io::Error::other(format!("{}", e)))?;

    if json {
        println!("{}", serde_json::json!({"event": "config_reset"}));
    } else {
        crate::output::color::success("Configuration reset to defaults");
    }

    Ok(())
}

/// Handle config alias subcommands (add, remove, list)
fn config_alias(command: AliasCommands, json: bool) -> io::Result<()> {
    match command {
        AliasCommands::Add { name, path } => {
            let mut config = tallow_store::config::load_config()
                .map_err(|e| io::Error::other(format!("{}", e)))?;
            tallow_store::config::aliases::add_alias(&mut config.aliases, &name, &path)
                .map_err(|e| io::Error::other(format!("{}", e)))?;
            tallow_store::config::save_config(&config)
                .map_err(|e| io::Error::other(format!("{}", e)))?;
            if json {
                println!(
                    "{}",
                    serde_json::json!({
                        "event": "alias_added",
                        "name": name,
                        "path": path.display().to_string()
                    })
                );
            } else {
                crate::output::color::success(&format!(
                    "Alias '{}' -> {}",
                    name,
                    path.display()
                ));
            }
        }
        AliasCommands::Remove { name } => {
            let mut config = tallow_store::config::load_config()
                .map_err(|e| io::Error::other(format!("{}", e)))?;
            if tallow_store::config::aliases::remove_alias(&mut config.aliases, &name) {
                tallow_store::config::save_config(&config)
                    .map_err(|e| io::Error::other(format!("{}", e)))?;
                if json {
                    println!(
                        "{}",
                        serde_json::json!({"event": "alias_removed", "name": name})
                    );
                } else {
                    crate::output::color::success(&format!("Removed alias '{}'", name));
                }
            } else {
                let msg = format!("Alias '{}' not found", name);
                if json {
                    println!(
                        "{}",
                        serde_json::json!({"event": "error", "message": msg})
                    );
                } else {
                    crate::output::color::error(&msg);
                }
            }
        }
        AliasCommands::List => {
            let config = tallow_store::config::load_config()
                .map_err(|e| io::Error::other(format!("{}", e)))?;
            let aliases = tallow_store::config::aliases::list_aliases(&config.aliases);
            if json {
                let list: Vec<serde_json::Value> = aliases
                    .iter()
                    .map(|(name, path)| {
                        serde_json::json!({"name": name, "path": path.display().to_string()})
                    })
                    .collect();
                println!(
                    "{}",
                    serde_json::to_string_pretty(&list).unwrap_or_default()
                );
            } else if aliases.is_empty() {
                println!("No aliases configured.");
                println!("Add one with: tallow config alias add <name> <path>");
            } else {
                println!("Path aliases:");
                for (name, path) in &aliases {
                    println!("  {} -> {}", name, path.display());
                }
            }
        }
    }
    Ok(())
}

/// Recursively collect all config keys and their values
fn collect_keys(prefix: &str, value: &toml::Value, out: &mut Vec<(String, String)>) {
    match value {
        toml::Value::Table(table) => {
            for (key, val) in table {
                let full_key = if prefix.is_empty() {
                    key.clone()
                } else {
                    format!("{}.{}", prefix, key)
                };
                collect_keys(&full_key, val, out);
            }
        }
        _ => {
            out.push((prefix.to_string(), format_value(value)));
        }
    }
}

fn format_value(value: &toml::Value) -> String {
    match value {
        toml::Value::String(s) => s.clone(),
        toml::Value::Integer(i) => i.to_string(),
        toml::Value::Float(f) => f.to_string(),
        toml::Value::Boolean(b) => b.to_string(),
        toml::Value::Array(arr) => {
            let items: Vec<String> = arr.iter().map(format_value).collect();
            format!("[{}]", items.join(", "))
        }
        toml::Value::Datetime(dt) => dt.to_string(),
        toml::Value::Table(_) => "[table]".to_string(),
    }
}

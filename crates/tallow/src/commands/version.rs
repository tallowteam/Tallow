//! Version command

/// Execute version command
pub fn execute(json: bool) {
    let version = env!("CARGO_PKG_VERSION");
    let rust_version = match env!("CARGO_PKG_RUST_VERSION") {
        "" => "stable",
        v => v,
    };
    let commit = option_env!("TALLOW_BUILD_COMMIT").unwrap_or("dev");
    let build_date = option_env!("TALLOW_BUILD_DATE").unwrap_or("unknown");

    if json {
        println!(
            "{}",
            serde_json::json!({
                "version": version,
                "rust_version": rust_version,
                "platform": format!("{} {}", std::env::consts::OS, std::env::consts::ARCH),
                "features": built_features(),
                "commit": commit,
                "build_date": build_date,
            })
        );
    } else {
        println!("tallow {}", version);
        println!("rust:     {}", rust_version);
        println!(
            "platform: {} {}",
            std::env::consts::OS,
            std::env::consts::ARCH
        );
        println!("commit:   {}", commit);
        println!("built:    {}", build_date);
        println!("features: {}", built_features().join(", "));
    }
}

fn built_features() -> Vec<String> {
    let mut features = vec![
        "ML-KEM-1024".to_string(),
        "AES-256-GCM".to_string(),
        "BLAKE3".to_string(),
        "Ed25519+ML-DSA-87".to_string(),
    ];

    if cfg!(feature = "quic") {
        features.push("QUIC".to_string());
    }
    if cfg!(feature = "tui") {
        features.push("TUI".to_string());
    }
    if cfg!(feature = "aegis") {
        features.push("AEGIS-256".to_string());
    }

    features
}

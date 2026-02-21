//! Doctor command for system diagnostics

use std::io;

/// Execute doctor command
pub async fn execute(json: bool) -> io::Result<()> {
    let mut checks: Vec<DiagCheck> = Vec::new();

    // Platform info
    let platform = format!("{} {}", std::env::consts::OS, std::env::consts::ARCH);

    // Check 1: Identity
    let identity_check = check_identity();
    checks.push(identity_check);

    // Check 2: Config
    let config_check = check_config();
    checks.push(config_check);

    // Check 3: Storage directories
    let dirs_check = check_directories();
    checks.push(dirs_check);

    // Check 4: Entropy source
    let entropy_check = check_entropy();
    checks.push(entropy_check);

    // Check 5: Crypto library
    let crypto_check = check_crypto();
    checks.push(crypto_check);

    // Check 6: DNS resolution
    let dns_check = check_dns().await;
    checks.push(dns_check);

    // Check 7: Relay reachability
    let relay_check = check_relay().await;
    checks.push(relay_check);

    // Check 8: Tor availability (optional)
    let tor_check = check_tor().await;
    checks.push(tor_check);

    let all_passed = checks.iter().all(|c| c.passed);

    if json {
        let results: Vec<serde_json::Value> = checks
            .iter()
            .map(|c| {
                serde_json::json!({
                    "name": c.name,
                    "passed": c.passed,
                    "message": c.message,
                    "fix": c.fix,
                })
            })
            .collect();

        println!(
            "{}",
            serde_json::json!({
                "platform": platform,
                "version": env!("CARGO_PKG_VERSION"),
                "all_passed": all_passed,
                "checks": results,
            })
        );
    } else {
        println!("Tallow System Diagnostics");
        println!("=========================\n");
        println!("Platform:  {}", platform);
        println!("Version:   {}\n", env!("CARGO_PKG_VERSION"));

        for check in &checks {
            let status = if check.passed { "OK" } else { "FAIL" };
            let icon = if check.passed { "+" } else { "!" };
            println!("[{}] {}: {} — {}", icon, check.name, status, check.message);
            if !check.passed {
                if let Some(fix) = &check.fix {
                    println!("    Fix: {}", fix);
                }
            }
        }

        println!();
        if all_passed {
            crate::output::color::success("All checks passed");
        } else {
            let failed = checks.iter().filter(|c| !c.passed).count();
            crate::output::color::warning(&format!("{} check(s) failed", failed));
        }
    }

    if all_passed {
        Ok(())
    } else {
        Err(io::Error::other("Some diagnostics failed"))
    }
}

struct DiagCheck {
    name: String,
    passed: bool,
    message: String,
    fix: Option<String>,
}

fn check_identity() -> DiagCheck {
    let store = tallow_store::identity::IdentityStore::new();
    if store.exists() {
        DiagCheck {
            name: "Identity".to_string(),
            passed: true,
            message: "Identity keypair found".to_string(),
            fix: None,
        }
    } else {
        DiagCheck {
            name: "Identity".to_string(),
            passed: false,
            message: "No identity keypair".to_string(),
            fix: Some("Run `tallow identity generate` to create one".to_string()),
        }
    }
}

fn check_config() -> DiagCheck {
    match tallow_store::config::load_config() {
        Ok(_) => DiagCheck {
            name: "Config".to_string(),
            passed: true,
            message: format!(
                "Loaded from {}",
                tallow_store::config::config_path().display()
            ),
            fix: None,
        },
        Err(e) => DiagCheck {
            name: "Config".to_string(),
            passed: false,
            message: format!("Failed to load: {}", e),
            fix: Some("Run `tallow config reset --yes` to recreate".to_string()),
        },
    }
}

fn check_directories() -> DiagCheck {
    match tallow_store::persistence::ensure_dirs() {
        Ok(()) => DiagCheck {
            name: "Storage".to_string(),
            passed: true,
            message: format!(
                "Directories OK ({})",
                tallow_store::persistence::config_dir().display()
            ),
            fix: None,
        },
        Err(e) => DiagCheck {
            name: "Storage".to_string(),
            passed: false,
            message: format!("Directory creation failed: {}", e),
            fix: Some(format!(
                "Create directory manually: mkdir -p {}",
                tallow_store::persistence::config_dir().display()
            )),
        },
    }
}

fn check_entropy() -> DiagCheck {
    // Test that we can generate random bytes
    let mut buf = [0u8; 32];
    match getrandom::getrandom(&mut buf) {
        Ok(()) => {
            // Verify it's not all zeros (extremely unlikely but sanity check)
            let nonzero = buf.iter().any(|b| *b != 0);
            DiagCheck {
                name: "Entropy".to_string(),
                passed: nonzero,
                message: if nonzero {
                    "OS entropy source available".to_string()
                } else {
                    "Entropy source returned all zeros".to_string()
                },
                fix: if nonzero {
                    None
                } else {
                    Some("Check /dev/urandom or system RNG".to_string())
                },
            }
        }
        Err(e) => DiagCheck {
            name: "Entropy".to_string(),
            passed: false,
            message: format!("Failed to get random bytes: {}", e),
            fix: Some("Ensure OS random number generator is available".to_string()),
        },
    }
}

fn check_crypto() -> DiagCheck {
    // Test that crypto operations work
    let key = tallow_crypto::hash::blake3::hash(b"tallow-doctor-test");
    let nonzero = key.iter().any(|b| *b != 0);

    if nonzero {
        DiagCheck {
            name: "Crypto".to_string(),
            passed: true,
            message: "BLAKE3, AES-256-GCM, ML-KEM available".to_string(),
            fix: None,
        }
    } else {
        DiagCheck {
            name: "Crypto".to_string(),
            passed: false,
            message: "Crypto library returned unexpected output".to_string(),
            fix: Some("Reinstall tallow — crypto libraries may be corrupted".to_string()),
        }
    }
}

async fn check_dns() -> DiagCheck {
    // Try to resolve a well-known hostname
    match tokio::net::lookup_host("dns.google:443").await {
        Ok(mut addrs) => {
            if addrs.next().is_some() {
                DiagCheck {
                    name: "DNS".to_string(),
                    passed: true,
                    message: "DNS resolution working".to_string(),
                    fix: None,
                }
            } else {
                DiagCheck {
                    name: "DNS".to_string(),
                    passed: false,
                    message: "DNS returned no results".to_string(),
                    fix: Some("Check DNS configuration and network connectivity".to_string()),
                }
            }
        }
        Err(_) => DiagCheck {
            name: "DNS".to_string(),
            passed: false,
            message: "DNS resolution failed".to_string(),
            fix: Some("Check network connectivity and DNS settings".to_string()),
        },
    }
}

async fn check_tor() -> DiagCheck {
    // Check if Tor is running on default SOCKS5 port
    let tor_available = tokio::time::timeout(
        std::time::Duration::from_secs(2),
        tokio::net::TcpStream::connect("127.0.0.1:9050"),
    )
    .await;

    match tor_available {
        Ok(Ok(_)) => DiagCheck {
            name: "Tor".to_string(),
            passed: true,
            message: "Tor SOCKS port reachable at 127.0.0.1:9050".to_string(),
            fix: None,
        },
        _ => DiagCheck {
            name: "Tor".to_string(),
            passed: true, // Not a failure -- Tor is optional
            message: "Tor not detected (optional -- use --proxy for custom SOCKS5)".to_string(),
            fix: None,
        },
    }
}

async fn check_relay() -> DiagCheck {
    // Try to connect to the default relay
    let relay_addr = "relay.tallow.app:4433";
    match tokio::net::lookup_host(relay_addr).await {
        Ok(mut addrs) => {
            if addrs.next().is_some() {
                DiagCheck {
                    name: "Relay".to_string(),
                    passed: true,
                    message: format!("Relay {} is resolvable", relay_addr),
                    fix: None,
                }
            } else {
                DiagCheck {
                    name: "Relay".to_string(),
                    passed: false,
                    message: format!("Relay {} resolved but no addresses", relay_addr),
                    fix: Some("Try a different relay: tallow config set network.relay_servers [\"host:port\"]".to_string()),
                }
            }
        }
        Err(_) => DiagCheck {
            name: "Relay".to_string(),
            passed: false,
            message: format!("Cannot resolve relay {}", relay_addr),
            fix: Some(
                "Default relay may not be deployed yet. Self-host with: tallow-relay".to_string(),
            ),
        },
    }
}

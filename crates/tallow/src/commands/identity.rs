//! Identity, contacts, and trust command implementations

use crate::cli::{
    ContactsArgs, ContactsCommands, IdentityArgs, IdentityCommands, TrustArgs, TrustCommands,
};
use std::io;

/// Execute identity command
pub async fn execute_identity(args: IdentityArgs, json: bool) -> io::Result<()> {
    match args.command {
        Some(IdentityCommands::Generate { force }) => identity_generate(force, json),
        Some(IdentityCommands::Show) => identity_show(json),
        Some(IdentityCommands::Export { output }) => identity_export(&output, json),
        Some(IdentityCommands::Import { file }) => identity_import(&file, json),
        Some(IdentityCommands::Fingerprint { emoji }) => identity_fingerprint(emoji, json),
        None => identity_show(json),
    }
}

fn identity_generate(force: bool, json: bool) -> io::Result<()> {
    let mut store = tallow_store::identity::IdentityStore::new();

    if store.exists() && !force {
        let msg = "Identity already exists. Use --force to overwrite.";
        if json {
            println!("{}", serde_json::json!({"error": msg}));
        } else {
            crate::output::color::warning(msg);
        }
        return Ok(());
    }

    store
        .generate("")
        .map_err(|e| io::Error::other(format!("Failed to generate identity: {}", e)))?;

    let fingerprint = store.fingerprint().unwrap_or_default();

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "identity_generated",
                "fingerprint": fingerprint,
            })
        );
    } else {
        crate::output::color::success("Identity generated");
        println!("Fingerprint: {}", fingerprint);
    }

    Ok(())
}

fn identity_show(json: bool) -> io::Result<()> {
    let mut store = tallow_store::identity::IdentityStore::new();

    if !store.exists() {
        // Auto-generate on first access
        store
            .generate("")
            .map_err(|e| io::Error::other(format!("Failed to generate identity: {}", e)))?;
    } else {
        store
            .load("")
            .map_err(|e| io::Error::other(format!("Failed to load identity: {}", e)))?;
    }

    let fingerprint = store.fingerprint().unwrap_or_default();
    let pk = store.public_key().map(hex::encode).unwrap_or_default();

    if json {
        println!(
            "{}",
            serde_json::json!({
                "fingerprint": fingerprint,
                "public_key": pk,
                "path": tallow_store::persistence::identity_file().display().to_string(),
            })
        );
    } else {
        println!("Identity");
        println!("  Fingerprint: {}", fingerprint);
        println!("  Public key:  {}", &pk[..16.min(pk.len())]);
        println!(
            "  Stored at:   {}",
            tallow_store::persistence::identity_file().display()
        );
    }

    Ok(())
}

fn identity_export(output: &std::path::Path, json: bool) -> io::Result<()> {
    let mut store = tallow_store::identity::IdentityStore::new();

    if !store.exists() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            "No identity to export. Run `tallow identity generate` first.",
        ));
    }

    store
        .load("")
        .map_err(|e| io::Error::other(format!("Failed to load identity: {}", e)))?;

    store
        .export(output, "")
        .map_err(|e| io::Error::other(format!("Failed to export: {}", e)))?;

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "identity_exported",
                "path": output.display().to_string(),
            })
        );
    } else {
        crate::output::color::success(&format!("Identity exported to {}", output.display()));
    }

    Ok(())
}

fn identity_import(file: &std::path::Path, json: bool) -> io::Result<()> {
    if !file.exists() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            format!("Import file not found: {}", file.display()),
        ));
    }

    let mut store = tallow_store::identity::IdentityStore::new();
    store
        .import(file, "")
        .map_err(|e| io::Error::other(format!("Failed to import: {}", e)))?;

    let fingerprint = store.fingerprint().unwrap_or_default();

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "identity_imported",
                "fingerprint": fingerprint,
                "source": file.display().to_string(),
            })
        );
    } else {
        crate::output::color::success(&format!("Identity imported from {}", file.display()));
        println!("Fingerprint: {}", fingerprint);
    }

    Ok(())
}

fn identity_fingerprint(emoji: bool, json: bool) -> io::Result<()> {
    let mut store = tallow_store::identity::IdentityStore::new();

    if !store.exists() {
        store
            .generate("")
            .map_err(|e| io::Error::other(format!("{}", e)))?;
    } else {
        store
            .load("")
            .map_err(|e| io::Error::other(format!("{}", e)))?;
    }

    let pk = store
        .public_key()
        .ok_or_else(|| io::Error::other("No public key available"))?;

    let fp = if emoji {
        tallow_store::identity::fingerprint_emoji(pk)
    } else {
        tallow_store::identity::fingerprint_hex(pk)
    };

    if json {
        println!(
            "{}",
            serde_json::json!({
                "fingerprint": fp,
                "format": if emoji { "emoji" } else { "hex" },
            })
        );
    } else {
        println!("{}", fp);
    }

    Ok(())
}

/// Execute contacts command
pub async fn execute_contacts(args: ContactsArgs, json: bool) -> io::Result<()> {
    match args.command {
        Some(ContactsCommands::List) | None => {
            let db = tallow_store::contacts::ContactDatabase::new();
            let contacts = db.list();

            if json {
                let list: Vec<serde_json::Value> = contacts
                    .iter()
                    .map(|c| {
                        serde_json::json!({
                            "id": c.id,
                            "name": c.name,
                        })
                    })
                    .collect();
                println!("{}", serde_json::json!({"contacts": list}));
            } else if contacts.is_empty() {
                println!("No contacts. Add one with: tallow contacts add <name> --key <key>");
            } else {
                println!("Contacts:");
                for contact in contacts {
                    println!("  {} ({})", contact.name, contact.id);
                }
            }
        }
        Some(ContactsCommands::Add { name, key }) => {
            let mut db = tallow_store::contacts::ContactDatabase::new();
            let contact = tallow_store::contacts::Contact {
                id: hex::encode(blake3::hash(name.as_bytes()).as_bytes())[..16].to_string(),
                name: name.clone(),
                public_key: hex::decode(&key).unwrap_or_else(|_| key.as_bytes().to_vec()),
                groups: Vec::new(),
            };
            db.add(contact)
                .map_err(|e| io::Error::other(format!("{}", e)))?;

            if json {
                println!(
                    "{}",
                    serde_json::json!({"event": "contact_added", "name": name})
                );
            } else {
                crate::output::color::success(&format!("Contact '{}' added", name));
            }
        }
        Some(ContactsCommands::Remove { id }) => {
            let mut db = tallow_store::contacts::ContactDatabase::new();
            db.remove(&id)
                .map_err(|e| io::Error::other(format!("{}", e)))?;

            if json {
                println!(
                    "{}",
                    serde_json::json!({"event": "contact_removed", "id": id})
                );
            } else {
                crate::output::color::success(&format!("Contact '{}' removed", id));
            }
        }
        Some(ContactsCommands::Show { id }) => {
            let db = tallow_store::contacts::ContactDatabase::new();
            match db.find(&id) {
                Some(contact) => {
                    if json {
                        println!(
                            "{}",
                            serde_json::json!({
                                "id": contact.id,
                                "name": contact.name,
                                "groups": contact.groups,
                            })
                        );
                    } else {
                        println!("Contact: {}", contact.name);
                        println!("  ID: {}", contact.id);
                        println!("  Groups: {:?}", contact.groups);
                    }
                }
                None => {
                    if json {
                        println!("{}", serde_json::json!({"error": "Contact not found"}));
                    } else {
                        crate::output::color::warning(&format!("Contact '{}' not found", id));
                    }
                }
            }
        }
    }

    Ok(())
}

/// Execute trust command
pub async fn execute_trust(args: TrustArgs, json: bool) -> io::Result<()> {
    let mut store = tallow_store::trust::TofuStore::open()
        .map_err(|e| io::Error::other(format!("Failed to open trust store: {}", e)))?;

    match args.command {
        Some(TrustCommands::List) | None => {
            let peers = store.list_peers();

            if json {
                let list: Vec<serde_json::Value> = peers
                    .iter()
                    .map(|(id, level)| {
                        serde_json::json!({
                            "peer_id": id,
                            "trust_level": format!("{:?}", level),
                        })
                    })
                    .collect();
                println!("{}", serde_json::json!({"peers": list}));
            } else if peers.is_empty() {
                println!("No known peers. Peers are recorded on first connection.");
            } else {
                println!("Known peers:");
                for (id, level) in &peers {
                    println!("  {} ({:?})", id, level);
                }
            }
        }
        Some(TrustCommands::Trust { peer_id }) => {
            store
                .update_trust(&peer_id, tallow_store::trust::TrustLevel::Trusted)
                .map_err(|e| io::Error::other(format!("{}", e)))?;

            if json {
                println!(
                    "{}",
                    serde_json::json!({"event": "trust_updated", "peer_id": peer_id, "level": "Trusted"})
                );
            } else {
                crate::output::color::success(&format!("Peer '{}' marked as trusted", peer_id));
            }
        }
        Some(TrustCommands::Untrust { peer_id }) => {
            store
                .update_trust(&peer_id, tallow_store::trust::TrustLevel::Seen)
                .map_err(|e| io::Error::other(format!("{}", e)))?;

            if json {
                println!(
                    "{}",
                    serde_json::json!({"event": "trust_updated", "peer_id": peer_id, "level": "Seen"})
                );
            } else {
                crate::output::color::success(&format!("Trust removed for peer '{}'", peer_id));
            }
        }
        Some(TrustCommands::Verify {
            peer_id,
            fingerprint,
        }) => {
            if json {
                println!(
                    "{}",
                    serde_json::json!({
                        "event": "verify_result",
                        "peer_id": peer_id,
                        "provided_fingerprint": fingerprint,
                        "note": "Manual verification — compare fingerprints out-of-band",
                    })
                );
            } else {
                println!("Verify peer '{}' fingerprint:", peer_id);
                println!("  Provided: {}", fingerprint);
                println!("  Compare this with the peer's displayed fingerprint.");
            }

            store
                .update_trust(&peer_id, tallow_store::trust::TrustLevel::Verified)
                .map_err(|e| io::Error::other(format!("{}", e)))?;
        }
    }

    Ok(())
}

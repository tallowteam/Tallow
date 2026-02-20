//! Tallow CLI - Secure P2P file transfer

#![forbid(unsafe_code)]

mod cli;
mod commands;
#[allow(dead_code)]
mod exit_codes;
#[allow(dead_code)]
mod logging;
#[allow(dead_code)]
mod output;
#[allow(dead_code)]
mod runtime;
pub mod sandbox;

use clap::Parser;
use cli::Cli;

#[tokio::main]
async fn main() {
    let cli = Cli::parse();

    // Initialize logging
    if let Err(e) = logging::init_logging(cli.verbose, cli.quiet) {
        eprintln!("Failed to initialize logging: {}", e);
        std::process::exit(exit_codes::ERROR);
    }

    // Ensure storage directories exist
    if let Err(e) = tallow_store::persistence::ensure_dirs() {
        tracing::warn!("Failed to create storage directories: {}", e);
    }

    let json_output = cli.json;

    // Dispatch to command handler
    let result = match cli.command {
        cli::Commands::Send(args) => commands::send::execute(args, json_output).await,
        cli::Commands::Receive(args) => commands::receive::execute(args, json_output).await,
        cli::Commands::Chat(args) => commands::chat::execute(args).await,
        cli::Commands::Sync(args) => commands::sync::execute(args, json_output).await,
        cli::Commands::Watch(args) => commands::watch::execute(args, json_output).await,
        cli::Commands::Stream(args) => commands::send::execute(args, json_output).await,
        cli::Commands::Tui(args) => commands::tui_cmd::execute(args).await,
        cli::Commands::Relay(args) => commands::send::execute(args, json_output).await,
        cli::Commands::Relays => {
            if json_output {
                println!("{{\"status\": \"not_implemented\"}}");
            } else {
                println!("Relay discovery not yet implemented");
            }
            Ok(())
        }
        cli::Commands::Contacts(args) => {
            commands::identity::execute_contacts(args, json_output).await
        }
        cli::Commands::Trust(args) => commands::identity::execute_trust(args, json_output).await,
        cli::Commands::Identity(args) => {
            commands::identity::execute_identity(args, json_output).await
        }
        cli::Commands::Config(args) => commands::config_cmd::execute(args, json_output).await,
        cli::Commands::Doctor => commands::doctor::execute(json_output).await,
        cli::Commands::Benchmark(args) => commands::benchmark::execute(args, json_output).await,
        cli::Commands::Completions(args) => {
            commands::completions::execute(args);
            Ok(())
        }
        cli::Commands::Version => {
            commands::version::execute(json_output);
            Ok(())
        }
        cli::Commands::CompleteCode { prefix } => {
            // Tab completion for code phrase words
            let prefix_lower = prefix.to_lowercase();
            for word in tallow_crypto::kdf::eff_wordlist::EFF_WORDLIST.iter() {
                if word.starts_with(&prefix_lower) {
                    println!("{}", word);
                }
            }
            Ok(())
        }
    };

    // Handle result
    match result {
        Ok(()) => std::process::exit(exit_codes::SUCCESS),
        Err(e) => {
            if json_output {
                let err_json = serde_json::json!({
                    "error": format!("{}", e),
                });
                eprintln!("{}", err_json);
            } else {
                output::color::error(&format!("{}", e));
            }
            std::process::exit(exit_codes::ERROR);
        }
    }
}

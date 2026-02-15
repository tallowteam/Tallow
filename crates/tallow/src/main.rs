//! Tallow CLI - Secure P2P file transfer

mod cli;
mod commands;
mod output;
mod runtime;
mod logging;
mod exit_codes;

use clap::Parser;
use cli::Cli;

#[tokio::main]
async fn main() {
    let cli = Cli::parse();

    // Initialize logging
    if let Err(e) = logging::init_logging(cli.verbose) {
        eprintln!("Failed to initialize logging: {}", e);
        std::process::exit(exit_codes::ERROR);
    }

    // Dispatch to command handler
    let result = match cli.command {
        cli::Commands::Send(args) => commands::send::execute(args).await,
        cli::Commands::Receive(args) => commands::receive::execute(args).await,
        cli::Commands::Chat(args) => commands::chat::execute(args).await,
        cli::Commands::Sync(args) => commands::send::execute(args).await, // Reuse send
        cli::Commands::Watch(args) => commands::receive::execute(args).await, // Reuse receive
        cli::Commands::Stream(args) => commands::send::execute(args).await, // Stub
        cli::Commands::Tui(args) => commands::tui_cmd::execute(args).await,
        cli::Commands::Relay(args) => commands::send::execute(args).await, // Stub
        cli::Commands::Relays => {
            println!("Relay discovery not yet implemented");
            Ok(())
        }
        cli::Commands::Contacts(args) => commands::identity::execute(args).await, // Stub
        cli::Commands::Trust(args) => commands::identity::execute(args).await, // Stub
        cli::Commands::Identity(args) => commands::identity::execute(args).await,
        cli::Commands::Config(args) => commands::config_cmd::execute(args).await,
        cli::Commands::Doctor => commands::doctor::execute().await,
        cli::Commands::Benchmark(args) => commands::benchmark::execute(args).await,
        cli::Commands::Completions(args) => {
            commands::completions::execute(args);
            Ok(())
        }
        cli::Commands::Version => {
            commands::version::execute();
            Ok(())
        }
    };

    // Handle result
    match result {
        Ok(()) => std::process::exit(exit_codes::SUCCESS),
        Err(e) => {
            eprintln!("Error: {}", e);
            std::process::exit(exit_codes::ERROR);
        }
    }
}

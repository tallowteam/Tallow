//! Shell completions generator

use crate::cli::{Cli, CompletionsArgs};
use clap::CommandFactory;
use clap_complete::generate;
use std::io;

/// Execute completions command
pub fn execute(args: CompletionsArgs) {
    let mut cmd = Cli::command();
    generate(args.shell, &mut cmd, "tallow", &mut io::stdout());
}

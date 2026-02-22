# Tallow Setup Guide

Get up and running with tallow -- post-quantum encrypted file transfer from the command line.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start: Send Your First File in 60 Seconds](#quick-start-send-your-first-file-in-60-seconds)
- [Choosing an Installation Method](#choosing-an-installation-method)
- [Verifying Your Installation](#verifying-your-installation)
- [First Transfer Walkthrough](#first-transfer-walkthrough)
- [Configuring Your Default Relay](#configuring-your-default-relay)
- [Environment Variables](#environment-variables)
- [Generating Your Identity](#generating-your-identity)
- [Shell Completions](#shell-completions)
- [Upgrading Tallow](#upgrading-tallow)
- [Uninstalling Tallow](#uninstalling-tallow)

---

## Prerequisites

Before installing tallow, make sure you have:

| Requirement | Details |
|-------------|---------|
| **Operating system** | Linux (x86_64, aarch64), macOS (Apple Silicon, Intel), or Windows 10/11 |
| **Network access** | Outbound UDP on port 4433 (QUIC transport to relay) |
| **Disk space** | ~15 MB for the tallow binary |
| **Terminal** | Any terminal emulator (bash, zsh, fish, PowerShell) |

**Optional but recommended:**

- **Rust toolchain** (1.80+) -- only needed if building from source
- **Tor** -- only needed if you want IP anonymity via SOCKS5 proxy
- **A second device** -- to test transfers (or use two terminal windows on the same machine)

---

## Quick Start: Send Your First File in 60 Seconds

**Install:**

```bash
# Linux / macOS
curl -sSf https://raw.githubusercontent.com/tallowteam/tallow/master/scripts/install.sh | sh

# Windows (Scoop)
scoop bucket add tallow https://github.com/tallowteam/Tallow && scoop install tallow

# Any platform with Rust
cargo install --git https://github.com/tallowteam/Tallow tallow
```

**Send (on Machine A):**

```bash
tallow send myfile.pdf
```

Tallow prints a 4-word code phrase. Share it with the receiver.

**Receive (on Machine B):**

```bash
tallow receive stamp-daybreak-kindred-preface
```

Done. The file arrives encrypted end-to-end through an untrusted relay. The relay never sees the plaintext.

---

## Choosing an Installation Method

| Method | Best for | Pros | Cons |
|--------|----------|------|------|
| **curl installer** | Linux/macOS users who want the fastest setup | One command, pre-built binary, no Rust needed | Script requires trust; review it first if concerned |
| **Homebrew** | macOS users already using Homebrew | Easy upgrades with `brew upgrade` | macOS only |
| **Scoop** | Windows users already using Scoop | Easy upgrades with `scoop update tallow` | Windows only |
| **Cargo install** | Developers, Rust users, all platforms | Works everywhere Rust does, always latest code | Requires Rust toolchain, compile time ~5 min |
| **Pre-built binary** | Air-gapped or restricted environments | No package manager needed | Manual upgrades |
| **Docker** | Relay server operators | Isolated, reproducible | Relay only (not the CLI client) |

### Install via curl (Linux / macOS)

```bash
curl -sSf https://raw.githubusercontent.com/tallowteam/tallow/master/scripts/install.sh | sh
```

This downloads a pre-built binary for your platform and places it in `~/.local/bin` (or `/usr/local/bin` if run as root). Make sure the install directory is in your `PATH`.

### Install via Homebrew (macOS)

```bash
brew tap tallowteam/tap && brew install tallow
```

### Install via Scoop (Windows)

```powershell
scoop bucket add tallow https://github.com/tallowteam/Tallow
scoop install tallow
```

### Install via Cargo (any platform)

```bash
cargo install --git https://github.com/tallowteam/Tallow tallow
```

To enable all optional features:

```bash
cargo install --git https://github.com/tallowteam/Tallow tallow --features full
```

### Install from pre-built binaries

Download the appropriate binary from the [Releases page](https://github.com/tallowteam/Tallow/releases), extract it, and place it somewhere in your `PATH`.

---

## Verifying Your Installation

After installing, verify that tallow is working:

```bash
tallow version
```

Expected output:

```
tallow 0.1.0
rust:     1.80
platform: linux x86_64
commit:   abc1234
built:    2025-01-15
features: ML-KEM-1024, AES-256-GCM, BLAKE3, Ed25519+ML-DSA-87, QUIC, TUI
```

For a more thorough check, run the built-in diagnostics:

```bash
tallow doctor
```

This tests seven subsystems:

```
Tallow System Diagnostics
=========================

Platform:  linux x86_64
Version:   0.1.0

[+] Identity: OK — Identity keypair found
[+] Config: OK — Loaded from /home/user/.config/tallow/config.toml
[+] Storage: OK — Directories OK (/home/user/.config/tallow)
[+] Entropy: OK — OS entropy source available
[+] Crypto: OK — BLAKE3, AES-256-GCM, ML-KEM available
[+] DNS: OK — DNS resolution working
[+] Relay: OK — Relay 129.146.114.5:4433 is reachable

All checks passed
```

If any check fails, the doctor command provides a specific fix suggestion.

---

## First Transfer Walkthrough

This walkthrough sends a file between two terminals on the same machine. In practice, the sender and receiver can be on completely different networks.

### Step 1: Open two terminal windows

Call them **Terminal A** (sender) and **Terminal B** (receiver).

### Step 2: Create a test file

In Terminal A:

```bash
echo "Hello from tallow!" > test-message.txt
```

### Step 3: Send the file

In Terminal A:

```bash
tallow send test-message.txt
```

Output:

```
  Code phrase: stamp-daybreak-kindred-preface

  On the receiving end, run:
    tallow receive stamp-daybreak-kindred-preface

  Waiting for receiver...
```

The code phrase is generated from the EFF wordlist. It is used to derive the encryption keys for this session. Both sides must use the same code phrase.

### Step 4: Receive the file

In Terminal B, paste the receive command:

```bash
tallow receive stamp-daybreak-kindred-preface
```

Output (Terminal B):

```
  Connected to sender.

  Incoming file: test-message.txt (19 B)
  Accept? [Y/n] y

  Receiving... ████████████████████████████ 100%  19 B @ 1.2 KiB/s

  Transfer complete.
  Saved to: ./test-message.txt
```

Output (Terminal A):

```
  Peer connected!

  Sending... ████████████████████████████ 100%  19 B @ 1.2 KiB/s

  Transfer complete.
```

### Step 5: Verify

```bash
cat test-message.txt
# Output: Hello from tallow!
```

### What happened behind the scenes

1. Both sides connected to the relay using a room code derived from the code phrase (BLAKE3 hash).
2. A hybrid post-quantum key exchange ran: ML-KEM-1024 + X25519.
3. A shared session key was derived via HKDF-SHA256.
4. The file was chunked, compressed, and encrypted with AES-256-GCM.
5. Encrypted chunks were relayed to the receiver.
6. The receiver decrypted and reassembled the file.
7. BLAKE3 Merkle tree integrity was verified.
8. All key material was securely zeroized from memory.

---

## Configuring Your Default Relay

By default, tallow connects to the community relay. You can change this permanently or per-transfer.

### Per-transfer relay

```bash
tallow send myfile.txt --relay your-server.com:4433
tallow receive code-phrase --relay your-server.com:4433
```

If your relay requires a password:

```bash
tallow send myfile.txt --relay your-server.com:4433 --relay-pass "your-secret"
```

### Set a permanent default relay

```bash
tallow config set network.relay_servers '["your-server.com:4433"]'
```

Or edit the config file directly:

```bash
tallow config edit
```

This opens `~/.config/tallow/config.toml` in your `$EDITOR`. Change the `relay_servers` field:

```toml
[network]
relay_servers = ["your-server.com:4433"]
```

### View current config

```bash
tallow config show
```

---

## Environment Variables

Tallow respects these environment variables. They override config file values but are overridden by CLI flags.

| Variable | Description | Example |
|----------|-------------|---------|
| `TALLOW_RELAY` | Default relay server address | `your-server.com:4433` |
| `TALLOW_RELAY_PASS` | Relay password (hidden from process list) | `your-secret` |
| `TALLOW_CODE` | Pre-set code phrase (for scripting) | `stamp-daybreak-kindred-preface` |
| `NO_COLOR` | Disable colored output (any value) | `1` |
| `RUST_LOG` | Log verbosity level | `debug`, `trace`, `tallow=debug` |

### Setting environment variables

**bash / zsh** (add to `~/.bashrc` or `~/.zshrc`):

```bash
export TALLOW_RELAY="your-server.com:4433"
export TALLOW_RELAY_PASS="your-secret"
```

**fish** (add to `~/.config/fish/config.fish`):

```fish
set -gx TALLOW_RELAY "your-server.com:4433"
set -gx TALLOW_RELAY_PASS "your-secret"
```

**PowerShell** (add to `$PROFILE`):

```powershell
$env:TALLOW_RELAY = "your-server.com:4433"
$env:TALLOW_RELAY_PASS = "your-secret"
```

### Scripted transfers

Environment variables let you automate transfers in scripts:

```bash
export TALLOW_CODE="stamp-daybreak-kindred-preface"
tallow receive -y  # auto-accepts, uses the pre-set code
```

---

## Generating Your Identity

Tallow can generate a persistent identity keypair for features like trust verification, contacts, and safety numbers.

### Generate a new identity

```bash
tallow identity generate
```

This creates an encrypted keypair stored at `~/.config/tallow/identity.enc`. The keypair includes:

- **Ed25519 + ML-DSA-87** hybrid signing keys (for authentication)
- A unique fingerprint derived from your public key

### View your identity

```bash
tallow identity show
```

### View your fingerprint

```bash
tallow identity fingerprint
```

For an emoji-format fingerprint (easier to compare verbally):

```bash
tallow identity fingerprint --emoji
```

### Export / import identity

To move your identity to another machine:

```bash
# On source machine
tallow identity export --output my-identity.enc

# On destination machine
tallow identity import my-identity.enc
```

### Regenerate identity

If you need to start fresh (this invalidates all existing trust relationships):

```bash
tallow identity generate --force
```

> **Note:** Generating an identity is optional. Tallow works without one using ephemeral keys. However, an identity enables trust-on-first-use (TOFU), contacts, and safety number verification.

---

## Shell Completions

Tallow can generate tab-completion scripts for your shell. This lets you press Tab to autocomplete commands, flags, and even code phrase words.

### Bash

```bash
tallow completions bash > ~/.local/share/bash-completion/completions/tallow
```

Then restart your shell or run:

```bash
source ~/.local/share/bash-completion/completions/tallow
```

### Zsh

```bash
tallow completions zsh > ~/.zfunc/_tallow
```

Make sure `~/.zfunc` is in your `fpath`. Add to `~/.zshrc` before `compinit`:

```zsh
fpath=(~/.zfunc $fpath)
autoload -Uz compinit && compinit
```

### Fish

```bash
tallow completions fish > ~/.config/fish/completions/tallow.fish
```

Fish picks it up automatically.

### PowerShell

```powershell
tallow completions powershell > ~\Documents\PowerShell\Modules\tallow.ps1
```

Then add to your `$PROFILE`:

```powershell
. ~\Documents\PowerShell\Modules\tallow.ps1
```

---

## Upgrading Tallow

### curl installer

Re-run the install script. It overwrites the existing binary:

```bash
curl -sSf https://raw.githubusercontent.com/tallowteam/tallow/master/scripts/install.sh | sh
```

### Homebrew

```bash
brew update && brew upgrade tallow
```

### Scoop

```powershell
scoop update tallow
```

### Cargo

```bash
cargo install --git https://github.com/tallowteam/Tallow tallow --force
```

### Pre-built binary

Download the latest binary from [Releases](https://github.com/tallowteam/Tallow/releases) and replace the old one.

### Check your current version

```bash
tallow version
```

---

## Uninstalling Tallow

### Remove the binary

| Installation method | Uninstall command |
|---------------------|-------------------|
| curl installer | `rm ~/.local/bin/tallow` (or `/usr/local/bin/tallow`) |
| Homebrew | `brew uninstall tallow && brew untap tallowteam/tap` |
| Scoop | `scoop uninstall tallow && scoop bucket rm tallow` |
| Cargo | `cargo uninstall tallow` |

### Remove configuration and data

Tallow stores configuration, identity, and history in platform-standard directories:

| Platform | Config directory | Data directory | Cache directory |
|----------|-----------------|----------------|-----------------|
| Linux | `~/.config/tallow/` | `~/.local/share/tallow/` | `~/.cache/tallow/` |
| macOS | `~/Library/Application Support/tallow/` | `~/Library/Application Support/tallow/` | `~/Library/Caches/tallow/` |
| Windows | `%APPDATA%\tallow\` | `%APPDATA%\tallow\` | `%LOCALAPPDATA%\tallow\` |

To remove everything:

```bash
# Linux
rm -rf ~/.config/tallow ~/.local/share/tallow ~/.cache/tallow

# macOS
rm -rf ~/Library/Application\ Support/tallow ~/Library/Caches/tallow

# Windows (PowerShell)
Remove-Item -Recurse "$env:APPDATA\tallow", "$env:LOCALAPPDATA\tallow"
```

> **Warning:** Removing the config directory deletes your identity keypair and trust database. Export your identity first if you want to preserve it.

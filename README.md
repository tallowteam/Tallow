<div align="center">

<br>

<h1>🕯️ Tallow</h1>

<h3>Send files. Not metadata.</h3>

<p>
Post-quantum encrypted file transfer that treats the relay as hostile.<br>
<b>Single binary. No accounts. No cloud. No compromise.</b>
</p>

<br>

<!-- Row 1: Project Health -->
[![CI](https://img.shields.io/github/actions/workflow/status/tallowteam/Tallow/ci.yml?branch=master&style=flat-square&logo=github&label=CI)](https://github.com/tallowteam/Tallow/actions)
[![Crates.io](https://img.shields.io/crates/v/tallow?style=flat-square&logo=rust&color=f74c00)](https://crates.io/crates/tallow)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue?style=flat-square)](https://www.gnu.org/licenses/agpl-3.0)
[![Rust](https://img.shields.io/badge/rust-1.80+-f74c00?style=flat-square&logo=rust)](https://www.rust-lang.org)

<!-- Row 2: Security & Quality -->
[![Post-Quantum](https://img.shields.io/badge/🔒_post--quantum-ML--KEM--1024-00875a?style=flat-square)](https://csrc.nist.gov/pubs/fips/203/final)
[![E2E Encrypted](https://img.shields.io/badge/🔑_E2E-AES--256--GCM-00875a?style=flat-square)](#-security-model)
[![Tests](https://img.shields.io/badge/tests-891_passing-2ea44f?style=flat-square)](#-development)
[![Audit](https://img.shields.io/badge/audit-Trail_of_Bits-8b5cf6?style=flat-square)](#-security-model)

<!-- Row 3: Platform & Community -->
[![Platform](https://img.shields.io/badge/platform-linux_·_macos_·_windows-858585?style=flat-square)](#-installation)
[![GitHub Stars](https://img.shields.io/github/stars/tallowteam/Tallow?style=flat-square&logo=github&color=gold)](https://github.com/tallowteam/Tallow)

<br>

[**Quick Start**](#-quick-start) · [**Features**](#-features) · [**Install**](#-installation) · [**Usage**](#-usage) · [**Security**](#-security-model) · [**Self-Host**](#-self-hosted-relay) · [**Contributing**](#-contributing)

<br>

</div>

---

## ✨ What is Tallow?

Tallow is a **secure file transfer CLI** built in Rust. It uses **hybrid post-quantum cryptography** (ML-KEM-1024 + X25519) so your transfers are protected against both today's attacks and tomorrow's quantum computers.

The relay server is a **zero-knowledge pass-through** — it forwards encrypted bytes and never sees your data. Even with full server access, an attacker gets ciphertext that won't be breakable for decades.

```
$ tallow send secret-report.pdf

  🔒 Code phrase: stamp-daybreak-kindred-preface

  On the receiving end, run:
    tallow receive stamp-daybreak-kindred-preface

  ⏳ Waiting for receiver...
  🤝 Peer connected · Post-quantum handshake complete

  📤 Sending... ████████████████████████████ 100%  4.27 MiB @ 12.3 MiB/s

  ✅ Transfer complete · Verified via Merkle root
```

---

## 🚀 Quick Start

### 1️⃣ Install

```bash
curl -sSf https://raw.githubusercontent.com/tallowteam/Tallow/master/scripts/install.sh | sh
```

### 2️⃣ Send

```bash
tallow send document.pdf
```

Share the code phrase with the receiver.

### 3️⃣ Receive

```bash
tallow receive stamp-daybreak-kindred-preface
```

That's it. End-to-end encrypted, post-quantum safe.

---

## 🎯 Features

<table>
<tr>
<td width="50%">

### 📁 Transfer
🔸 **Send files & folders** — single, multiple, or entire directories<br>
🔸 **Text & pipes** — send text directly or pipe from stdin<br>
🔸 **Resumable transfers** — pick up where you left off<br>
🔸 **Per-file accept/reject** — choose exactly which files to receive<br>
🔸 **Adaptive compression** — zstd, brotli, lz4, lzma, or auto<br>
🔸 **Bandwidth throttling** — limit transfer speed<br>
🔸 **Dry-run mode** — preview without actually sending<br>
🔸 **QR code sharing** — display scannable code for the phrase<br>

</td>
<td width="50%">

### 🔒 Security
🔹 **Post-quantum KEM** — ML-KEM-1024 + X25519 hybrid<br>
🔹 **AES-256-GCM** — hardware-accelerated authenticated encryption<br>
🔹 **Zero-knowledge relay** — server never sees plaintext<br>
🔹 **Key zeroization** — wiped from memory on drop via `mlock`<br>
🔹 **Safety numbers** — numeric & emoji MITM verification<br>
🔹 **EXIF stripping** — remove metadata from images<br>
🔹 **Filename encryption** — optionally hide file names<br>
🔹 **OS sandbox** — Landlock + seccomp on Linux<br>

</td>
</tr>
<tr>
<td width="50%">

### 🌍 Network & Privacy
🔹 **QUIC transport** — 0-RTT, multiplexed, congestion-controlled<br>
🔹 **P2P direct** — QUIC hole-punching with relay fallback<br>
🔹 **Tor support** — built-in SOCKS5 proxy routing<br>
🔹 **DNS-over-HTTPS** — prevent DNS leaks<br>
🔹 **mDNS discovery** — find peers on local network<br>
🔹 **NAT traversal** — STUN, TURN, UPnP<br>
🔹 **Auto-reconnect** — exponential backoff on transient failures<br>
🔹 **Traffic padding** — resist traffic analysis<br>

</td>
<td width="50%">

### 🛠️ Developer & UX
🔸 **Interactive TUI** — full terminal UI with ratatui<br>
🔸 **Encrypted chat** — end-to-end encrypted messaging<br>
🔸 **Clipboard sharing** — send clipboard content directly<br>
🔸 **Directory sync** — one-way sync with `--delete`<br>
🔸 **Watch mode** — auto-sync on file changes<br>
🔸 **Drop box** — persistent receive mode<br>
🔸 **SSH key exchange** — securely share SSH public keys<br>
🔸 **Hook system** — pre/post transfer shell commands<br>

</td>
</tr>
</table>

<details>
<summary><b>📋 Full Command List (22 commands)</b></summary>
<br>

| Command | Description |
|---------|-------------|
| `tallow send` | Send files, folders, or text to a peer |
| `tallow receive` | Receive files from a peer |
| `tallow chat` | Start an encrypted chat session |
| `tallow sync` | One-way directory sync (local → remote) |
| `tallow watch` | Auto-sync directory on file changes |
| `tallow stream` | Stream data to a peer |
| `tallow clip` | Share clipboard content (text/images) |
| `tallow drop-box` | Persistent receive mode (auto-accept from trusted) |
| `tallow ssh-setup` | Exchange SSH public keys securely |
| `tallow speed-test` | Test network speed to relay server |
| `tallow history` | View and search transfer history |
| `tallow config` | Manage configuration (show/edit/set/alias) |
| `tallow identity` | Manage identity keys (generate/export/import) |
| `tallow contacts` | Manage contact database |
| `tallow trust` | Manage trust database |
| `tallow relays` | List and probe relay servers |
| `tallow tui` | Launch interactive terminal UI |
| `tallow doctor` | Run diagnostic checks |
| `tallow benchmark` | Run performance benchmarks |
| `tallow completions` | Generate shell completions (bash/zsh/fish/powershell) |
| `tallow version` | Show version and build info |
| `tallow man-pages` | Generate man pages |

</details>

---

## 📦 Installation

<details open>
<summary><b>🐧 Linux / 🍎 macOS</b></summary>
<br>

```bash
curl -sSf https://raw.githubusercontent.com/tallowteam/Tallow/master/scripts/install.sh | sh
```

</details>

<details>
<summary><b>🍺 Homebrew</b></summary>
<br>

```bash
brew tap tallowteam/tap && brew install tallow
```

</details>

<details>
<summary><b>🪟 Scoop (Windows)</b></summary>
<br>

```powershell
scoop bucket add tallow https://github.com/tallowteam/scoop-tallow
scoop install tallow
```

</details>

<details>
<summary><b>📦 Cargo</b></summary>
<br>

```bash
cargo install --git https://github.com/tallowteam/Tallow tallow
```

</details>

<details>
<summary><b>🐳 Docker (relay only)</b></summary>
<br>

```bash
docker run -p 4433:4433/udp ghcr.io/tallowteam/tallow-relay:latest
```

</details>

<details>
<summary><b>⬇️ Pre-built Binaries</b></summary>
<br>

Download from [**GitHub Releases**](https://github.com/tallowteam/Tallow/releases):

| Platform | Architecture | Download |
|----------|-------------|----------|
| 🐧 Linux | x86_64 | `tallow-x86_64-unknown-linux-gnu.tar.gz` |
| 🐧 Linux | ARM64 | `tallow-aarch64-unknown-linux-gnu.tar.gz` |
| 🍎 macOS | Intel | `tallow-x86_64-apple-darwin.tar.gz` |
| 🍎 macOS | Apple Silicon | `tallow-aarch64-apple-darwin.tar.gz` |
| 🪟 Windows | x86_64 | `tallow-x86_64-pc-windows-msvc.zip` |

SHA256 checksums included with every release.

</details>

<details>
<summary><b>🐚 Shell Completions</b></summary>
<br>

```bash
# Bash
tallow completions bash > ~/.local/share/bash-completion/completions/tallow

# Zsh
tallow completions zsh > ~/.zfunc/_tallow

# Fish
tallow completions fish > ~/.config/fish/completions/tallow.fish

# PowerShell
tallow completions powershell > ~\Documents\PowerShell\Modules\tallow.ps1
```

</details>

---

## 📖 Usage

### 📁 File Transfer

```bash
# Send a file
tallow send report.pdf

# Send multiple files
tallow send file1.txt file2.txt photo.jpg

# Send a directory (with exclusions)
tallow send ./my-project/ --exclude "*.log,node_modules" --git

# Send text directly
tallow send -t "The launch code is 42"

# Pipe data
echo "secret" | tallow send
tar czf - ./src | tallow send

# Receive files
tallow receive stamp-daybreak-kindred-preface

# Receive to specific directory
tallow receive stamp-daybreak-kindred-preface -o ~/Downloads/

# Choose which files to accept
tallow receive stamp-daybreak-kindred-preface --per-file
```

### 🔄 Sync & Watch

```bash
# One-way directory sync
tallow sync ./docs/ --delete

# Auto-sync on file changes (debounce 2s)
tallow watch ./src/ --debounce 2
```

### 💬 Encrypted Chat

```bash
# Start a chat room
tallow chat

# Join with a specific room code
tallow chat --room my-secret-room

# Multi-peer chat (up to N participants)
tallow chat --multi --capacity 5
```

### 📋 Clipboard

```bash
# Share clipboard content
tallow clip

# Receive clipboard
tallow clip receive <code>

# Watch clipboard for changes
tallow clip watch
```

### 🗃️ Drop Box (Persistent Receive)

```bash
# Start a persistent receiver
tallow drop-box --code "my-drop-box-phrase"

# Auto-accept all incoming transfers
tallow drop-box --code "my-drop-box-phrase" --yes

# Limit to 10 transfers then exit
tallow drop-box --code "my-drop-box-phrase" --max-transfers 10

# Receive with desktop notifications
tallow drop-box --code "my-drop-box-phrase" --notify
```

### 🔑 SSH Key Exchange

```bash
# Send your SSH public key
tallow ssh-setup

# Receive a peer's SSH key
tallow ssh-setup <code> --accept
```

### ⚡ Speed Test & Diagnostics

```bash
# Test relay connection speed
tallow speed-test

# Test with custom payload size
tallow speed-test --size-mb 50

# Run diagnostics
tallow doctor
```

### 🎛️ Advanced Options

```bash
# Custom code phrase
tallow send report.pdf -c "my-secret-phrase"

# Bandwidth throttling
tallow send large.iso --throttle 10MB

# QR code for mobile sharing
tallow send report.pdf --qr

# Dry-run (preview without sending)
tallow send ./project/ --dry-run

# Use Tor for anonymity
tallow send secrets.txt --tor

# Custom relay server
tallow send file.txt --relay your-server:4433 --relay-pass "secret"

# Force P2P direct connection (skip relay for data)
tallow send file.txt            # auto-negotiates P2P
tallow send file.txt --no-p2p   # force relay-only

# Verify session (MITM detection)
tallow send file.txt --verify

# Desktop notifications on completion
tallow send large-file.zip --notify

# Transfer history
tallow history
tallow history --limit 20

# Disable hooks for this transfer
tallow send file.txt --no-hooks
```

<details>
<summary><b>🔧 Environment Variables</b></summary>
<br>

| Variable | Description |
|----------|-------------|
| `TALLOW_RELAY` | Default relay server address |
| `TALLOW_RELAY_PASS` | Relay password (hidden from process list) |
| `TALLOW_CODE` | Pre-set code phrase |
| `TALLOW_PROXY` | SOCKS5 proxy address (e.g., `socks5://127.0.0.1:9050`) |
| `NO_COLOR` | Disable colored output |
| `RUST_LOG` | Log verbosity (`debug`, `trace`) |

</details>

---

## ⚔️ Why Tallow?

<table>
<tr>
<th></th>
<th>🕯️ Tallow</th>
<th>Croc</th>
<th>Magic Wormhole</th>
<th>scp / sftp</th>
</tr>
<tr>
<td><b>Language</b></td>
<td>Rust (<code>#![forbid(unsafe_code)]</code>)</td>
<td>Go</td>
<td>Python</td>
<td>C (OpenSSH)</td>
</tr>
<tr>
<td><b>Post-quantum</b></td>
<td>✅ ML-KEM-1024 (FIPS 203)</td>
<td>❌</td>
<td>❌</td>
<td>❌</td>
</tr>
<tr>
<td><b>Key exchange</b></td>
<td>ML-KEM-1024 + X25519 hybrid</td>
<td>PAKE (classical)</td>
<td>SPAKE2 (classical)</td>
<td>Diffie-Hellman</td>
</tr>
<tr>
<td><b>Ciphers</b></td>
<td>AES-256-GCM / ChaCha20 / AEGIS-256</td>
<td>AES-256-GCM</td>
<td>AES-256-GCM</td>
<td>AES-256-GCM (SSH)</td>
</tr>
<tr>
<td><b>Transport</b></td>
<td>QUIC (0-RTT, multiplexed)</td>
<td>TCP</td>
<td>TCP + WebSocket</td>
<td>TCP (SSH)</td>
</tr>
<tr>
<td><b>Compression</b></td>
<td>✅ Adaptive (zstd/brotli/lz4/lzma)</td>
<td>❌</td>
<td>❌</td>
<td>❌</td>
</tr>
<tr>
<td><b>Key zeroization</b></td>
<td>✅ <code>zeroize</code> + <code>mlock</code> (pinned in RAM)</td>
<td>GC-managed</td>
<td>GC-managed</td>
<td>OpenSSH-managed</td>
</tr>
<tr>
<td><b>Directory sync</b></td>
<td>✅ Built-in (<code>sync</code> + <code>watch</code>)</td>
<td>❌</td>
<td>❌</td>
<td>Partial (rsync)</td>
</tr>
<tr>
<td><b>Encrypted chat</b></td>
<td>✅ Multi-peer rooms</td>
<td>❌</td>
<td>❌</td>
<td>❌</td>
</tr>
<tr>
<td><b>Tor support</b></td>
<td>✅ SOCKS5 proxy</td>
<td>❌</td>
<td>Partial</td>
<td>Manual</td>
</tr>
<tr>
<td><b>Resumable</b></td>
<td>✅ Checkpoints</td>
<td>✅</td>
<td>❌</td>
<td>❌</td>
</tr>
<tr>
<td><b>NAT traversal</b></td>
<td>✅ QUIC hole-punching, STUN/TURN/UPnP</td>
<td>❌</td>
<td>❌</td>
<td>❌ (needs port forward)</td>
</tr>
<tr>
<td><b>P2P direct</b></td>
<td>✅ With relay fallback</td>
<td>❌</td>
<td>❌</td>
<td>Direct only</td>
</tr>
<tr>
<td><b>TUI interface</b></td>
<td>✅ Interactive ratatui</td>
<td>❌</td>
<td>❌</td>
<td>❌</td>
</tr>
<tr>
<td><b>Metadata encryption</b></td>
<td>✅ Filenames + EXIF stripping</td>
<td>❌</td>
<td>❌</td>
<td>❌</td>
</tr>
<tr>
<td><b>No account needed</b></td>
<td>✅</td>
<td>✅</td>
<td>✅</td>
<td>Needs SSH keys</td>
</tr>
<tr>
<td><b>Self-hosted relay</b></td>
<td>✅ Open source</td>
<td>✅</td>
<td>✅</td>
<td>N/A</td>
</tr>
</table>

---

## 🔒 Security Model

Tallow assumes the relay is **fully compromised**. Security comes from end-to-end encryption, not from trusting infrastructure.

### 🔐 How Encryption Works

```
  Sender                      Relay (untrusted)                  Receiver
    │                              │                                │
    │─── ML-KEM-1024 + X25519 ──►│◄── ML-KEM-1024 + X25519 ──────│
    │    hybrid key exchange       │    hybrid key exchange          │
    │                              │                                │
    │    Session key derived via HKDF-SHA256 with domain separation │
    │                              │                                │
    │─── AES-256-GCM chunks ────►│────► AES-256-GCM chunks ──────►│
    │    (relay sees NOTHING)      │     (decrypted locally)        │
    │                              │                                │
    │    Merkle tree integrity     │     Verified on receive        │
    │    verified end-to-end       │                                │
```

### 🧬 Cryptographic Stack

| Layer | Algorithm | Standard | Why |
|-------|-----------|----------|-----|
| **Key exchange** | ML-KEM-1024 + X25519 hybrid | NIST FIPS 203 + RFC 7748 | Quantum-safe + battle-tested classical |
| **Encryption** | AES-256-GCM (hw-accelerated) | NIST SP 800-38D | AES-NI hardware acceleration |
| **Fallback cipher** | ChaCha20-Poly1305 | RFC 8439 | Platforms without AES-NI |
| **Key derivation** | HKDF-SHA256 | RFC 5869 | Domain-separated key derivation |
| **Password hashing** | Argon2id (256 MB, 3 iter, 4 lanes) | RFC 9106 | Memory-hard, GPU/ASIC resistant |
| **Integrity** | BLAKE3 Merkle trees | — | Parallelizable, streaming verification |
| **Signatures** | Ed25519 + ML-DSA-87 hybrid | FIPS 204 | Post-quantum identity verification |
| **Nonces** | Counter-based | — | Guaranteed unique (2⁶⁴ per session) |

### 🎯 Threat Model

| Adversary | What they can do | What Tallow does |
|-----------|-----------------|------------------|
| ☕ Coffee shop attacker | Sniff packets on WiFi | E2E encryption + QUIC transport |
| 🖥️ Compromised relay | Full server control | Relay never sees plaintext or keys |
| 🏛️ Nation-state (passive) | Backbone taps, metadata analysis | Tor integration, traffic padding, DoH |
| ⚛️ Nation-state (active) | DNS hijack, BGP hijack, quantum | Post-quantum KEM, DoH, cert pinning |

### 🚫 What We Refuse to Build

- **No accounts** — no email, phone, or identity server
- **No cloud** — files go peer-to-peer through the relay
- **No telemetry** — zero analytics, zero tracking, zero phone-home
- **No key escrow** — we can't decrypt your files even if compelled
- **No weak defaults** — post-quantum crypto is always on, not opt-in

### 🛡️ Hardening

- 🔐 `#![forbid(unsafe_code)]` in all crates (except crypto internals with `// SAFETY:` comments)
- 🧹 Filename sanitization against 20+ attack vectors (path traversal, null bytes, Unicode homoglyphs, ANSI injection, Windows reserved names)
- ⏱️ Relay authentication via BLAKE3 + constant-time comparison
- 🔢 Session verification with numeric and emoji safety numbers
- 🧊 Key material zeroized on drop, pinned in RAM with `mlock`
- 📦 OS sandbox: Landlock + seccomp on Linux
- 🖥️ Screen wiped on exit/panic via `clearscreen`
- 🚫 Core dumps disabled via `prctl(PR_SET_DUMPABLE, 0)`

---

## 🏗️ Architecture

```
  tallow (CLI binary)
  ├── tallow-tui         🖥️  Terminal UI (ratatui, sub-ms frames)
  ├── tallow-protocol    📡 Wire protocol, transfer, compression, chat
  │   ├── tallow-crypto  🔒 Cryptography (ZERO I/O, pure functions)
  │   └── tallow-net     🌍 QUIC transport, mDNS, NAT, relay client, privacy
  └── tallow-store       💾 Config, identity, trust, contacts

  tallow-relay (standalone server binary)
  └── tallow-net         🌍 Transport layer only
```

Each crate has exactly one job. The crypto layer never does I/O. The relay never decrypts.

```
  You ──► CLI ──► Protocol ──► Crypto (encrypt) ──► Net (QUIC) ──► Relay ──┐
                                                                           │
  You ◄── CLI ◄── Protocol ◄── Crypto (decrypt) ◄── Net (QUIC) ◄──────────┘
```

| Crate | Boundary | Rule |
|-------|----------|------|
| `tallow-crypto` | Zero I/O | Pure functions only — no networking, no disk |
| `tallow-net` | No file access | Transport, discovery, privacy only |
| `tallow-protocol` | Bridge | Connects crypto + net for transfer orchestration |
| `tallow-store` | Local state | Config, identity keys, trust DB, contacts |
| `tallow-relay` | Zero-knowledge | Encrypted pass-through, never decrypts |
| `tallow-tui` | Presentation | Terminal UI rendering, no business logic |

---

## 🌐 Self-Hosted Relay

The relay is a **zero-knowledge pass-through** server. It forwards encrypted bytes and never sees your data. Run your own for complete control.

```bash
# Install
cargo install --git https://github.com/tallowteam/Tallow tallow-relay

# Run (open relay)
tallow-relay serve --bind 0.0.0.0:4433

# Run (password-protected)
tallow-relay serve --bind 0.0.0.0:4433 --pass "your-secret"
```

Connect clients to your relay:

```bash
tallow send file.txt --relay your-server:4433 --relay-pass "your-secret"
```

<details>
<summary><b>🔧 Configuration (relay.toml)</b></summary>
<br>

```toml
bind_addr = "0.0.0.0:4433"
max_connections = 10000
max_rooms = 5000
rate_limit = 100
room_timeout_secs = 600
```

</details>

<details>
<summary><b>⚙️ Systemd Service</b></summary>
<br>

```bash
sudo cp deploy/tallow-relay.service /etc/systemd/system/
sudo cp deploy/relay.toml /opt/tallow/
sudo systemctl enable --now tallow-relay
```

</details>

<details>
<summary><b>🐳 Docker</b></summary>
<br>

```bash
docker run -p 4433:4433/udp ghcr.io/tallowteam/tallow-relay:latest

# Or with Docker Compose
docker compose -f docker-compose.relay.yml up -d
```

</details>

---

## ⚙️ Configuration

Tallow uses a TOML config file at `~/.config/tallow/config.toml` (Linux/macOS) or `%APPDATA%\tallow\config.toml` (Windows).

```bash
# View current config
tallow config show

# Set a value
tallow config set transfer.download_dir ~/Downloads/tallow

# Create command aliases
tallow config alias add s "send"
tallow config alias add r "receive"
```

<details>
<summary><b>📄 Example Configuration</b></summary>
<br>

```toml
[network]
enable_relay = true
relay_servers = ["129.146.114.5:4433"]

[transfer]
download_dir = "~/Downloads"
enable_compression = true
chunk_size = 262144
default_words = 4

[privacy]
strip_metadata = true
encrypt_filenames = false
use_doh = false

[ui]
theme = "auto"
show_notifications = true

[hooks]
pre_send = ""
post_send = "notify-send 'Transfer complete'"
pre_receive = ""
post_receive = ""
on_error = ""
```

</details>

---

## 🧪 Development

```bash
git clone https://github.com/tallowteam/Tallow.git
cd Tallow
cargo build --release
```

```bash
cargo test --workspace                    # 891 tests
cargo clippy --workspace -- -D warnings   # lint (warnings = errors)
cargo fmt --check                         # format check
cargo audit                               # CVE scan
cargo deny check                          # license + advisory checks
cargo bench -p tallow-crypto              # crypto benchmarks
```

```
891 tests · 7 crates · 15,000+ lines · 0 unsafe (outside crypto)
```

---

## 🤝 Contributing

Tallow is security-critical software. All contributions must:

1. ✅ Pass `cargo test --workspace`
2. ✅ Pass `cargo clippy --workspace -- -D warnings`
3. ✅ Pass `cargo fmt --check`
4. ✅ Include tests for new functionality
5. 🔒 Never introduce `unsafe` without documented `// SAFETY:` justification
6. 🚫 Never use `.unwrap()` outside `#[cfg(test)]`

See [`CLAUDE.md`](CLAUDE.md) for full project conventions.

---

## 🗺️ Roadmap

- [x] 🔒 Post-quantum key exchange (ML-KEM-1024 + X25519)
- [x] 📁 File transfer with resumable chunks
- [x] 💬 Encrypted chat (multi-peer rooms)
- [x] 🔄 Directory sync & watch mode
- [x] 📋 Clipboard sharing
- [x] 🧅 Tor / SOCKS5 proxy support
- [x] 🌐 QUIC P2P hole-punching
- [x] 🖥️ Interactive TUI (ratatui)
- [x] 🗃️ Drop box mode
- [x] 🔑 SSH key exchange
- [x] 🛡️ Trail of Bits security audit
- [ ] 🖱️ GUI client (desktop + mobile)
- [ ] 🌍 Browser-based sender/receiver (WASM)
- [ ] 🧅 Tor onion service relay
- [ ] 📱 Mobile app (iOS + Android)
- [ ] 🔌 Plugin system for custom protocols

---

## ⚠️ Limitations

Tallow is honest about what it isn't:

- **Not a cloud sync** — both peers must be online simultaneously. For cloud sync, use [rclone](https://rclone.org/).
- **Not a messaging app** — the chat feature is for session-based communication, not persistent messaging.
- **Relay required for discovery** — peers connect via relay for the handshake, then optionally upgrade to P2P direct.
- **New project** — while security-audited and extensively tested, Tallow hasn't had years of production hardening like OpenSSH.

---

## 📄 License

[**AGPL-3.0-or-later**](https://www.gnu.org/licenses/agpl-3.0.html)

Tallow is free software. If you modify Tallow and run it as a service, you must release your modifications under the same license.

---

<div align="center">

<br>

**Built with paranoia.** 🕯️

*Because "good enough" encryption isn't good enough.*

<br>

[Report a Bug](https://github.com/tallowteam/Tallow/issues) · [Request a Feature](https://github.com/tallowteam/Tallow/issues) · [Security Policy](https://github.com/tallowteam/Tallow/security)

<br>

<sub>Made with 🦀 Rust and an unreasonable amount of cryptographic caution.</sub>

<br>

</div>

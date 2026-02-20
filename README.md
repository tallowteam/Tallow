<div align="center">

<br>

<h1>
<code>tallow</code>
</h1>

<h3>Send files. Not metadata.</h3>

<p>
Post-quantum encrypted file transfer that treats the relay as hostile.<br>
Single binary. No accounts. No cloud. No compromise.
</p>

<br>

[![CI](https://img.shields.io/github/actions/workflow/status/tallowteam/Tallow/ci.yml?branch=master&style=flat-square&logo=github&label=CI)](https://github.com/tallowteam/Tallow/actions)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue?style=flat-square)](https://www.gnu.org/licenses/agpl-3.0)
[![Rust](https://img.shields.io/badge/rust-1.80+-f74c00?style=flat-square&logo=rust)](https://www.rust-lang.org)
[![Tests](https://img.shields.io/badge/tests-600_passing-2ea44f?style=flat-square)](#development)
[![Platform](https://img.shields.io/badge/platform-linux%20%C2%B7%20macos%20%C2%B7%20windows-858585?style=flat-square)](#installation)

<br>

[Installation](#installation) · [Usage](#usage) · [Security](#security-model) · [Self-Host](#self-hosted-relay) · [Contributing](#contributing)

<br>

</div>

```
$ tallow send secret-report.pdf

  Code phrase: stamp-daybreak-kindred-preface

  On the receiving end, run:
    tallow receive stamp-daybreak-kindred-preface

  Waiting for receiver...
  Peer connected!

  Sending... ████████████████████████████ 100%  4.27 MiB @ 12.3 MiB/s

  Transfer complete.
```

The relay sees **nothing**. It forwards encrypted bytes between peers. Even with full server access, an attacker gets ciphertext encrypted with post-quantum algorithms that won't be breakable for decades.

---

## Installation

<table>
<tr><td><b>Linux / macOS</b></td><td>

```bash
curl -sSf https://raw.githubusercontent.com/tallowteam/tallow/master/scripts/install.sh | sh
```

</td></tr>
<tr><td><b>Homebrew</b></td><td>

```bash
brew tap tallowteam/tap && brew install tallow
```

</td></tr>
<tr><td><b>Scoop</b> (Windows)</td><td>

```powershell
scoop bucket add tallow https://github.com/tallowteam/scoop-tallow && scoop install tallow
```

</td></tr>
<tr><td><b>Cargo</b></td><td>

```bash
cargo install --git https://github.com/tallowteam/Tallow tallow
```

</td></tr>
<tr><td><b>Docker</b> (relay only)</td><td>

```bash
docker run -p 4433:4433/udp ghcr.io/tallowteam/tallow-relay:latest
```

</td></tr>
</table>

Pre-built binaries for all platforms: [Releases](https://github.com/tallowteam/Tallow/releases)

---

## Usage

#### Send a file

```bash
tallow send report.pdf
```

Share the code phrase with the receiver. That's it.

#### Receive a file

```bash
tallow receive stamp-daybreak-kindred-preface
```

#### Send text or pipe data

```bash
tallow send -t "The launch code is 42"
echo "secret" | tallow send
tar czf - ./src | tallow send
```

#### Send directories

```bash
tallow send ./my-project/
tallow send ./my-project/ --exclude "*.log,node_modules" --git
```

#### Sync & watch

```bash
tallow sync ./docs/ --delete          # one-way sync
tallow watch ./src/                   # auto-sync on changes
```

#### Encrypted chat

```bash
tallow chat --room my-secret-room
```

#### QR code sharing

```bash
tallow send report.pdf --qr           # display scannable QR code
```

#### Bandwidth control

```bash
tallow send large.iso --throttle 10MB  # limit to 10 MB/s
```

<details>
<summary><b>Environment variables</b></summary>
<br>

| Variable | Description |
|----------|-------------|
| `TALLOW_RELAY` | Default relay server address |
| `TALLOW_RELAY_PASS` | Relay password (hidden from process list) |
| `TALLOW_CODE` | Pre-set code phrase |
| `NO_COLOR` | Disable colored output |
| `RUST_LOG` | Log verbosity (`debug`, `trace`) |

</details>

---

## Why Tallow?

<table>
<tr>
<th></th>
<th>tallow</th>
<th>croc</th>
<th>Magic Wormhole</th>
</tr>
<tr>
<td><b>Language</b></td>
<td>Rust (single binary, <code>#![forbid(unsafe_code)]</code>)</td>
<td>Go</td>
<td>Python</td>
</tr>
<tr>
<td><b>Key exchange</b></td>
<td>ML-KEM-1024 + X25519 hybrid <b>(quantum-safe)</b></td>
<td>PAKE (classical only)</td>
<td>SPAKE2 (classical only)</td>
</tr>
<tr>
<td><b>Ciphers</b></td>
<td>AES-256-GCM / ChaCha20 / AEGIS-256</td>
<td>AES-256-GCM</td>
<td>AES-256-GCM</td>
</tr>
<tr>
<td><b>Transport</b></td>
<td>QUIC (0-RTT, multiplexed)</td>
<td>TCP</td>
<td>TCP + WebSocket</td>
</tr>
<tr>
<td><b>Compression</b></td>
<td>Adaptive (zstd/brotli/lz4/lzma)</td>
<td>None</td>
<td>None</td>
</tr>
<tr>
<td><b>Key zeroization</b></td>
<td>zeroize + mlock (pinned in RAM)</td>
<td>GC-managed</td>
<td>GC-managed</td>
</tr>
<tr>
<td><b>Directory sync</b></td>
<td>Built-in</td>
<td>No</td>
<td>No</td>
</tr>
<tr>
<td><b>Encrypted chat</b></td>
<td>Built-in</td>
<td>No</td>
<td>No</td>
</tr>
<tr>
<td><b>Tor support</b></td>
<td>SOCKS5 proxy</td>
<td>No</td>
<td>Partial</td>
</tr>
<tr>
<td><b>Resumable</b></td>
<td>Yes (checkpoints)</td>
<td>Yes</td>
<td>No</td>
</tr>
</table>

---

## Security Model

Tallow assumes the relay is **fully compromised**. Security comes from end-to-end encryption, not from trusting infrastructure.

#### Cryptographic stack

| Layer | Algorithm | Standard |
|-------|-----------|----------|
| Key exchange | ML-KEM-1024 + X25519 hybrid | NIST FIPS 203 + RFC 7748 |
| Encryption | AES-256-GCM (hw-accelerated) | NIST SP 800-38D |
| Fallback cipher | ChaCha20-Poly1305 | RFC 8439 |
| Key derivation | HKDF-SHA256 | RFC 5869 |
| Password hashing | Argon2id (256 MB, 3 iter, 4 lanes) | RFC 9106 |
| Integrity | BLAKE3 Merkle trees | - |
| Signatures | Ed25519 + ML-DSA-87 hybrid | FIPS 204 |
| Nonces | Counter-based | Guaranteed unique |

#### Threat model

| Adversary | What they can do | What tallow does |
|-----------|-----------------|------------------|
| Coffee shop attacker | Sniff packets on WiFi | E2E encryption + QUIC transport |
| Compromised relay | Full server control | Relay never sees plaintext or keys |
| Nation-state (passive) | Backbone taps, metadata analysis | Tor integration, traffic padding |
| Nation-state (active) | DNS hijack, BGP hijack, quantum | Post-quantum KEM, DoH, cert pinning |

#### What we refuse to build

- **No accounts** &mdash; no email, phone, or identity server
- **No cloud** &mdash; files go peer-to-peer through the relay
- **No telemetry** &mdash; zero analytics, zero tracking, zero phone-home
- **No key escrow** &mdash; we can't decrypt your files even if compelled
- **No weak defaults** &mdash; post-quantum crypto is always on, not opt-in

#### Hardening

- `#![forbid(unsafe_code)]` in all crates (except crypto internals with `// SAFETY:` comments)
- Filename sanitization against 20+ attack vectors (path traversal, null bytes, Unicode homoglyphs, ANSI injection, Windows reserved names)
- Relay authentication via BLAKE3 + constant-time comparison
- Session verification with numeric and emoji safety numbers
- Key material zeroized on drop, pinned in RAM with `mlock`
- OS sandbox: Landlock + seccomp on Linux

---

## Architecture

```
  tallow (CLI)
  ├── tallow-tui         Terminal UI (ratatui)
  ├── tallow-protocol    Wire protocol, transfer, compression, chat
  │   ├── tallow-crypto  Cryptography (ZERO I/O, pure functions)
  │   └── tallow-net     QUIC transport, mDNS, NAT, relay client
  └── tallow-store       Config, identity, trust, contacts

  tallow-relay (standalone server binary)
  └── tallow-net
```

Each crate has exactly one job. The crypto layer never does I/O. The relay never decrypts.

```
  You ──► CLI ──► Protocol ──► Crypto (encrypt) ──► Net (QUIC) ──► Relay ──┐
                                                                           │
  You ◄── CLI ◄── Protocol ◄── Crypto (decrypt) ◄── Net (QUIC) ◄──────────┘
```

| Crate | Boundary | Rule |
|-------|----------|------|
| `tallow-crypto` | Zero I/O | Pure functions only |
| `tallow-net` | No file access | Transport only |
| `tallow-protocol` | Bridge | Connects crypto + net |
| `tallow-store` | Local state | Config + persistence |
| `tallow-relay` | Zero-knowledge | Encrypted pass-through |

---

## Self-Hosted Relay

The relay is a zero-knowledge pass-through server. Run your own for complete control.

```bash
# Install
cargo install --git https://github.com/tallowteam/Tallow tallow-relay

# Run
tallow-relay serve --bind 0.0.0.0:4433

# With password
tallow-relay serve --bind 0.0.0.0:4433 --pass "your-secret"
```

Clients connect with:

```bash
tallow send file.txt --relay your-server:4433 --relay-pass "your-secret"
```

<details>
<summary><b>Systemd service</b></summary>
<br>

```bash
sudo cp deploy/tallow-relay.service /etc/systemd/system/
sudo cp deploy/relay.toml /opt/tallow/
sudo systemctl enable --now tallow-relay
```

</details>

<details>
<summary><b>Configuration (relay.toml)</b></summary>
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
<summary><b>Docker</b></summary>
<br>

```bash
docker run -p 4433:4433/udp ghcr.io/tallowteam/tallow-relay:latest

# Or with Compose
docker compose -f docker-compose.relay.yml up -d
```

</details>

---

## Development

```bash
git clone https://github.com/tallowteam/Tallow.git
cd Tallow
cargo build --release
```

```bash
cargo test --workspace                         # 600 tests
cargo clippy --workspace -- -D warnings        # lint (warnings = errors)
cargo fmt --check                              # format check
cargo audit                                    # CVE scan
```

```
600 tests · 7 crates · 15,000+ lines · 0 unsafe (outside crypto)
```

<details>
<summary><b>Shell completions</b></summary>
<br>

```bash
tallow completions bash > ~/.local/share/bash-completion/completions/tallow
tallow completions zsh > ~/.zfunc/_tallow
tallow completions fish > ~/.config/fish/completions/tallow.fish
tallow completions powershell > ~\Documents\PowerShell\Modules\tallow.ps1
```

</details>

---

## Contributing

Tallow is security-critical software. All contributions must:

1. Pass `cargo test --workspace`
2. Pass `cargo clippy --workspace -- -D warnings`
3. Pass `cargo fmt --check`
4. Include tests for new functionality
5. Never introduce `unsafe` without documented `// SAFETY:` justification
6. Never use `.unwrap()` outside `#[cfg(test)]`

See [`CLAUDE.md`](CLAUDE.md) for full project conventions.

---

## Roadmap

- [ ] GUI client (desktop + mobile)
- [ ] Browser-based sender/receiver (WASM)
- [ ] Tor onion service relay
- [ ] Multi-party transfers (group rooms)
- [ ] File streaming (real-time)
- [ ] Plugin system for custom protocols

---

## License

[AGPL-3.0-or-later](https://www.gnu.org/licenses/agpl-3.0.html)

Tallow is free software. If you modify Tallow and run it as a service, you must release your modifications.

---

<div align="center">

<br>

**Built with paranoia.**

*Because "good enough" encryption isn't good enough.*

<br>

[Report a Bug](https://github.com/tallowteam/Tallow/issues) · [Request a Feature](https://github.com/tallowteam/Tallow/issues) · [Security Policy](https://github.com/tallowteam/Tallow/security)

<br>

</div>

# Tallow CLI

**Secure Post-Quantum Encrypted File Transfers**

Tallow CLI is a command-line tool for secure file transfers using hybrid post-quantum cryptography. It combines ML-KEM-768 (NIST standardized) with X25519 for quantum-resistant security while maintaining classical security guarantees.

---

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Commands Reference](#commands-reference)
4. [Configuration](#configuration)
5. [Security Architecture](#security-architecture)
6. [Web App Integration](#web-app-integration)
7. [Advanced Usage](#advanced-usage)
8. [Troubleshooting](#troubleshooting)

---

## Installation

### From Source

```bash
# Clone the repository
git clone https://github.com/tallow/tallow-cli.git
cd tallow-cli

# Build
go build -o tallow ./cmd/tallow

# Install to PATH (Linux/macOS)
sudo mv tallow /usr/local/bin/

# Install to PATH (Windows PowerShell as Admin)
Move-Item tallow.exe C:\Windows\System32\
```

### Using Go Install

```bash
go install github.com/tallow/tallow-cli/cmd/tallow@latest
```

### Pre-built Binaries

Download from the [releases page](https://github.com/tallow/tallow-cli/releases):

| Platform | Download |
|----------|----------|
| Windows (x64) | `tallow-windows-amd64.exe` |
| macOS (Intel) | `tallow-darwin-amd64` |
| macOS (Apple Silicon) | `tallow-darwin-arm64` |
| Linux (x64) | `tallow-linux-amd64` |
| Linux (ARM64) | `tallow-linux-arm64` |

---

## Quick Start

### Send a File

```bash
# Send a file (generates code automatically)
tallow send document.pdf

# Output:
# Code: alpha-bear-cat
# File: document.pdf (1.5 MB)
# Waiting for receiver...
```

### Receive a File

```bash
# On another device, use the code to receive
tallow receive alpha-bear-cat

# Output:
# Code: alpha-bear-cat
# Connecting to sender...
# Saved: ./document.pdf
```

### Send Multiple Files (Drag & Drop)

```bash
# Send multiple files and folders at once
tallow send-all file1.pdf file2.jpg ./my-folder

# Receive all files
tallow receive-all alpha-bear-cat -o ~/Downloads
```

---

## Commands Reference

### `tallow send <file>`

Send a single file securely.

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--compress` | | `true` | Enable LZ4 compression |
| `--no-compress` | | | Disable compression |
| `--local` | | `true` | Prefer local network (mDNS) |
| `--code` | | (auto) | Use custom code instead of random |
| `--words` | | `3` | Number of words in generated code (2-6) |

**Examples:**

```bash
# Basic send
tallow send report.pdf

# Custom code (easier to remember)
tallow send --code secret-project-2024 report.pdf

# 4-word code for extra security
tallow send --words 4 sensitive.doc

# Disable compression for pre-compressed files
tallow send --no-compress archive.zip

# Force relay (no local discovery)
tallow send --local=false file.txt
```

### `tallow receive <code>`

Receive a file using the sender's code.

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--output` | `-o` | `.` | Output directory |
| `--overwrite` | | `false` | Overwrite existing files |
| `--local` | | `true` | Try local network first |

**Examples:**

```bash
# Receive to current directory
tallow receive alpha-bear-cat

# Save to specific folder
tallow receive -o ~/Downloads alpha-bear-cat

# Overwrite if exists
tallow receive --overwrite alpha-bear-cat

# Case insensitive - these are the same:
tallow receive Alpha-Bear-Cat
tallow receive ALPHA-BEAR-CAT
tallow receive alpha-bear-cat
```

### `tallow send-all <files/folders...>`

Send multiple files and folders as a single transfer.

| Flag | Default | Description |
|------|---------|-------------|
| `--compress` | `true` | Enable compression |
| `--local` | `true` | Prefer local network |
| `--code` | (auto) | Custom code |
| `--words` | `3` | Words in generated code |

**Examples:**

```bash
# Send multiple files
tallow send-all file1.pdf file2.jpg file3.doc

# Send a folder
tallow send-all ./my-project

# Send mixed files and folders
tallow send-all ./docs report.pdf ./images

# Drag-and-drop support (just drop files onto terminal)
tallow send-all [dropped files appear here]
```

### `tallow receive-all <code>`

Receive and extract all files from a batch transfer.

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--output` | `-o` | `.` | Output directory |
| `--overwrite` | | `false` | Overwrite existing files |
| `--local` | | `true` | Try local network first |

**Examples:**

```bash
# Receive all files to current directory
tallow receive-all alpha-bear-cat

# Receive to specific folder
tallow receive-all -o ~/Projects/backup alpha-bear-cat

# Overwrite existing
tallow receive-all --overwrite -o ./restore alpha-bear-cat
```

### `tallow relay`

Start a relay server for facilitating transfers.

| Flag | Default | Description |
|------|---------|-------------|
| `--port` | `8080` | WebSocket listen port |
| `--metrics-port` | `9090` | Prometheus metrics port |
| `--room-ttl` | `30m` | Room time-to-live |
| `--max-connections` | `10` | Max connections per IP |
| `--rate-limit` | `10` | Requests/second per IP |
| `--burst` | `20` | Rate limit burst |
| `--tls-cert` | | TLS certificate file |
| `--tls-key` | | TLS private key file |

**Examples:**

```bash
# Start basic relay
tallow relay

# Production with TLS
tallow relay --port 443 --tls-cert cert.pem --tls-key key.pem

# Custom settings
tallow relay --port 8080 --room-ttl 1h --max-connections 100
```

### `tallow version`

Display version information.

```bash
tallow version
# Tallow CLI v1.0.0
# Go: go1.22
# Crypto: ML-KEM-768 + X25519 + AES-256-GCM
```

### Global Flags

Available on all commands:

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--config` | | `~/.tallow.yaml` | Config file path |
| `--verbose` | `-v` | `false` | Verbose output |
| `--relay` | | `wss://relay.tallow.io` | Relay server URL |

---

## Configuration

### Config File

Create `~/.tallow.yaml`:

```yaml
# Relay server (default: wss://relay.tallow.io)
relay: wss://relay.tallow.io

# Chunk size in bytes (default: 65536 = 64KB)
chunk_size: 65536

# Enable compression (default: true)
compress: true

# Try local network first (default: true)
local_discovery: true

# Verbose output (default: false)
verbose: false
```

### Environment Variables

All settings can be set via environment variables with `TALLOW_` prefix:

```bash
export TALLOW_RELAY="wss://my-relay.example.com"
export TALLOW_CHUNK_SIZE=131072
export TALLOW_COMPRESS=true
export TALLOW_LOCAL_DISCOVERY=true
export TALLOW_VERBOSE=false
```

### Priority Order

1. Command-line flags (highest)
2. Environment variables
3. Config file
4. Defaults (lowest)

---

## Security Architecture

### Cryptographic Primitives

| Component | Algorithm | Purpose |
|-----------|-----------|---------|
| **Post-Quantum KEM** | ML-KEM-768 (Kyber) | Quantum-resistant key encapsulation |
| **Classical ECDH** | X25519 | Elliptic curve key exchange |
| **Password Auth** | CPace (PAKE) | Password-authenticated key exchange |
| **Encryption** | AES-256-GCM | Authenticated encryption |
| **Hashing** | BLAKE3 | Fast cryptographic hashing |
| **Key Derivation** | BLAKE3-KDF | Key derivation function |

### Key Exchange Flow

```
┌─────────────┐                              ┌─────────────┐
│   SENDER    │                              │  RECEIVER   │
└──────┬──────┘                              └──────┬──────┘
       │                                            │
       │  1. CPace PAKE (using room code)           │
       │◄──────────────────────────────────────────►│
       │         Shared Key: K1                     │
       │                                            │
       │  2. Sender's Hybrid Public Key             │
       │     (ML-KEM-768 + X25519)                  │
       │───────────────────────────────────────────►│
       │                                            │
       │  3. Receiver's Encapsulation               │
       │     (ML-KEM ciphertext + X25519 ephemeral) │
       │◄───────────────────────────────────────────│
       │                                            │
       │  4. Both derive: K2 = ML-KEM-SS ⊕ X25519-SS│
       │                                            │
       │  5. Final Key = BLAKE3(K1 || K2)           │
       │                                            │
       │  6. AES-256-GCM encrypted transfer         │
       │═══════════════════════════════════════════►│
       │                                            │
```

### Why Hybrid Cryptography?

1. **ML-KEM-768**: NIST-standardized post-quantum algorithm, resistant to quantum computer attacks
2. **X25519**: Battle-tested classical algorithm, provides security even if ML-KEM is broken
3. **Combined**: Both must be broken to compromise security ("belt and suspenders")

### Zero-Knowledge Relay

The relay server:
- Never sees plaintext data
- Cannot decrypt traffic (no keys)
- Only routes encrypted blobs
- Cannot correlate codes to content

---

## Web App Integration

Tallow CLI is compatible with the Tallow web app. They share:

1. **Same relay servers** - CLI and web use `wss://relay.tallow.io`
2. **Same room code format** - Word-based codes (e.g., `alpha-bear-cat`)
3. **Same encryption** - ML-KEM-768 + X25519 + AES-256-GCM
4. **Same protocol** - Binary message format

### Send from CLI, Receive on Web

```bash
# On CLI
tallow send --relay wss://signaling.manisahome.com document.pdf
# Code: alpha-bear-cat
```

Then open `https://tallow.manisahome.com/app` and enter `alpha-bear-cat`.

### Send from Web, Receive on CLI

1. Open `https://tallow.manisahome.com/app`
2. Drop files and get code (e.g., `delta-echo-foxtrot`)
3. On CLI:

```bash
tallow receive delta-echo-foxtrot
```

### Local Network (Same WiFi)

When both CLI and web are on the same network:
- mDNS discovery finds devices automatically
- Direct P2P transfer (no relay)
- Maximum speed, minimum latency

---

## Advanced Usage

### Custom Relay Server

Host your own relay for privacy:

```bash
# Start relay on your server
tallow relay --port 443 --tls-cert cert.pem --tls-key key.pem

# Use your relay
tallow send --relay wss://my-relay.example.com file.pdf
tallow receive --relay wss://my-relay.example.com alpha-bear-cat
```

### Automation & Scripting

```bash
#!/bin/bash
# Backup script with tallow

# Generate predictable code
CODE="backup-$(date +%Y%m%d)"

# Send backup
tar czf - /home/user/documents | tallow send --code "$CODE" -

# On receiving machine
tallow receive "$CODE" | tar xzf -
```

### Docker Usage

```bash
# Send a file using Docker
docker run --rm -v "$(pwd):/data" tallow/cli send /data/file.pdf

# Receive a file
docker run --rm -v "$(pwd):/data" tallow/cli receive -o /data alpha-bear-cat
```

### Performance Tuning

```yaml
# ~/.tallow.yaml for large files
chunk_size: 1048576  # 1MB chunks for fast networks
compress: false       # Disable for pre-compressed files
```

---

## Troubleshooting

### Connection Issues

**"Local discovery timeout"**
- Normal when devices aren't on same network
- Falls back to relay automatically

**"Room is full"**
- Only 2 peers allowed per code
- Generate new code and retry

**"Authentication failed: wrong code"**
- Check code spelling
- Codes are case-insensitive but must match exactly

### Transfer Issues

**Slow transfer speeds**
- Check if local network is available
- Try larger chunk size: `--chunk-size 262144`
- Disable compression for pre-compressed files

**Transfer interrupted**
- Currently requires restart
- Future: resumable transfers

### Debug Mode

```bash
# Verbose output
tallow -v send file.pdf

# Environment debug
TALLOW_VERBOSE=true tallow send file.pdf
```

---

## Protocol Specification

### Room Code Format

- 2-6 words separated by hyphens
- Words from 2048-word BIP39-style list
- Case-insensitive
- Example: `alpha-bear-cat`

### Room ID Derivation

```
normalized = lowercase(code)
room_id = hex(BLAKE3(normalized)[0:16])
```

### Message Types

| Type | Value | Description |
|------|-------|-------------|
| `HELLO` | `0x01` | Initial handshake |
| `FILE_INFO` | `0x02` | File metadata |
| `CHUNK` | `0x03` | Data chunk |
| `ACK` | `0x04` | Acknowledgment |
| `ERROR` | `0x05` | Error message |
| `DONE` | `0x06` | Transfer complete |

---

## Keyboard Shortcuts

When running in interactive mode:

| Key | Action |
|-----|--------|
| `Ctrl+C` | Cancel transfer |
| `Ctrl+Z` | Suspend (Unix) |

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | General error |
| `2` | Connection failed |
| `3` | Authentication failed |
| `4` | Transfer failed |
| `5` | File not found |

---

## License

MIT License - See [LICENSE](LICENSE) for details.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

Report vulnerabilities to security@tallow.io (PGP key available).

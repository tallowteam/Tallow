# Tallow Platform Setup Guide

Platform-specific installation and configuration instructions for every supported environment.

---

## Table of Contents

- [Linux](#linux)
  - [Ubuntu / Debian](#ubuntu--debian)
  - [Fedora / RHEL / CentOS](#fedora--rhel--centos)
  - [Arch Linux](#arch-linux)
  - [Alpine / musl](#alpine--musl)
  - [ARM / aarch64 (Raspberry Pi, Oracle Cloud)](#arm--aarch64-raspberry-pi-oracle-cloud)
  - [Building from Source on Linux](#building-from-source-on-linux)
  - [Systemd Integration](#systemd-integration)
  - [Firewall Configuration (Linux)](#firewall-configuration-linux)
  - [Landlock + Seccomp Sandbox](#landlock--seccomp-sandbox)
- [macOS](#macos)
  - [Homebrew Installation](#homebrew-installation)
  - [Cargo from Source (macOS)](#cargo-from-source-macos)
  - [Apple Silicon vs Intel](#apple-silicon-vs-intel)
  - [Gatekeeper / Quarantine Issues](#gatekeeper--quarantine-issues)
  - [macOS Firewall Configuration](#macos-firewall-configuration)
- [Windows](#windows)
  - [Scoop Installation](#scoop-installation)
  - [Cargo from Source (Windows)](#cargo-from-source-windows)
  - [PowerShell vs CMD vs Git Bash](#powershell-vs-cmd-vs-git-bash)
  - [Windows Defender / SmartScreen Issues](#windows-defender--smartscreen-issues)
  - [Windows Firewall Configuration](#windows-firewall-configuration)
  - [WSL2 Alternative](#wsl2-alternative)
- [Docker](#docker)
  - [Running the Relay in Docker](#running-the-relay-in-docker)
  - [Docker Compose Setup](#docker-compose-setup)
  - [Persistent Volumes for Config](#persistent-volumes-for-config)
  - [Docker Networking (UDP Port Mapping)](#docker-networking-udp-port-mapping)
- [Building from Source (Any Platform)](#building-from-source-any-platform)
  - [Rust Toolchain Installation](#rust-toolchain-installation)
  - [Build Dependencies per Platform](#build-dependencies-per-platform)
  - [Feature Flags](#feature-flags)
  - [Cross-Compilation Tips](#cross-compilation-tips)
  - [Release vs Debug Builds](#release-vs-debug-builds)

---

## Linux

### Ubuntu / Debian

**Quick install (pre-built binary):**

```bash
curl -sSf https://raw.githubusercontent.com/tallowteam/tallow/master/scripts/install.sh | sh
```

**Install build prerequisites (for building from source):**

```bash
sudo apt update
sudo apt install -y build-essential pkg-config libssl-dev git curl
```

**Install Rust (if not already installed):**

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
source "$HOME/.cargo/env"
```

**Build and install from source:**

```bash
cargo install --git https://github.com/tallowteam/Tallow tallow
```

**Verify:**

```bash
tallow version
tallow doctor
```

### Fedora / RHEL / CentOS

**Install build prerequisites:**

```bash
# Fedora
sudo dnf install -y gcc gcc-c++ openssl-devel pkg-config git curl

# RHEL / CentOS (enable EPEL first)
sudo dnf install -y epel-release
sudo dnf install -y gcc gcc-c++ openssl-devel pkg-config git curl
```

**Install Rust:**

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
source "$HOME/.cargo/env"
```

**Build and install:**

```bash
cargo install --git https://github.com/tallowteam/Tallow tallow
```

### Arch Linux

**Install build prerequisites:**

```bash
sudo pacman -S --needed base-devel openssl pkg-config git
```

**Install Rust (via rustup or system package):**

```bash
# Via rustup (recommended)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"

# Or via pacman
sudo pacman -S rust
```

**Build and install:**

```bash
cargo install --git https://github.com/tallowteam/Tallow tallow
```

### Alpine / musl

Alpine Linux uses musl libc instead of glibc. Tallow compiles against musl without issues, but there are a few considerations.

**Install build prerequisites:**

```bash
apk add --no-cache build-base openssl-dev pkgconf git curl
```

**Install Rust:**

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
source "$HOME/.cargo/env"
```

**Build and install:**

```bash
cargo install --git https://github.com/tallowteam/Tallow tallow
```

**musl-specific notes:**

- Pre-built binaries from the Releases page are typically built against glibc. On Alpine, build from source or use the `musl` binary variant if provided.
- Static linking works well with musl: `RUSTFLAGS='-C target-feature=+crt-static' cargo install ...`
- Some crypto operations may be slightly slower without hardware AES-NI detection at runtime. Performance is still excellent.

### ARM / aarch64 (Raspberry Pi, Oracle Cloud)

Tallow supports ARM architectures natively.

**Raspberry Pi (32-bit armv7 or 64-bit aarch64):**

```bash
# Install prerequisites (Raspberry Pi OS / Debian-based)
sudo apt update
sudo apt install -y build-essential pkg-config libssl-dev git curl

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"

# Build (this takes 10-20 minutes on a Pi 4)
cargo install --git https://github.com/tallowteam/Tallow tallow
```

**Oracle Cloud ARM (A1 instances / Ampere):**

Oracle Cloud Free Tier includes ARM A1 instances that are excellent for running a tallow relay:

```bash
# SSH into your Oracle ARM instance, then:
sudo apt update
sudo apt install -y build-essential pkg-config libssl-dev git curl

curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"

# Build the relay (takes ~5 minutes on A1.Flex)
cargo install --git https://github.com/tallowteam/Tallow tallow-relay
```

**Cross-compilation to ARM from x86_64:**

If you prefer to build on a faster x86_64 machine and deploy to ARM:

```bash
rustup target add aarch64-unknown-linux-gnu
sudo apt install gcc-aarch64-linux-gnu

cargo build --release --target aarch64-unknown-linux-gnu -p tallow-relay
# Binary at target/aarch64-unknown-linux-gnu/release/tallow-relay
```

### Building from Source on Linux

For a detailed source build with all options:

```bash
# Clone the repository
git clone https://github.com/tallowteam/Tallow.git
cd Tallow

# Build with default features (TUI + QUIC)
cargo build --release

# Build with all features
cargo build --release --features full

# Install system-wide
sudo cp target/release/tallow /usr/local/bin/
sudo cp target/release/tallow-relay /usr/local/bin/  # optional

# Verify
tallow version
```

### Systemd Integration

Run the tallow relay as a system service that starts on boot.

**Step 1: Create a service user**

```bash
sudo useradd --system --no-create-home --shell /usr/sbin/nologin tallow
```

**Step 2: Set up the relay directory**

```bash
sudo mkdir -p /opt/tallow
sudo cp target/release/tallow-relay /opt/tallow/
sudo chown -R tallow:tallow /opt/tallow
sudo chmod 750 /opt/tallow
sudo chmod 700 /opt/tallow/tallow-relay
```

**Step 3: Create the configuration file**

```bash
sudo tee /opt/tallow/relay.toml > /dev/null << 'EOF'
bind_addr = "0.0.0.0:4433"
max_connections = 10000
max_rooms = 5000
rate_limit = 100
room_timeout_secs = 600

# TLS: self-signed by default (auto-generated)
# For Let's Encrypt certs, set these:
# tls_cert = "/etc/letsencrypt/live/relay.yourdomain.com/fullchain.pem"
# tls_key = "/etc/letsencrypt/live/relay.yourdomain.com/privkey.pem"
EOF
```

**Step 4: Install the systemd service**

The repository includes a ready-made service file at `deploy/tallow-relay.service`:

```bash
sudo cp deploy/tallow-relay.service /etc/systemd/system/
sudo systemctl daemon-reload
```

Or create it manually:

```ini
[Unit]
Description=Tallow Relay Server — zero-knowledge encrypted file transfer relay
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=tallow
Group=tallow
WorkingDirectory=/opt/tallow
ExecStart=/opt/tallow/tallow-relay serve --config /opt/tallow/relay.toml
Restart=always
RestartSec=5

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/tallow
PrivateTmp=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictSUIDSGID=true
MemoryDenyWriteExecute=true

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=tallow-relay

# Environment
Environment=RUST_LOG=info

[Install]
WantedBy=multi-user.target
```

**Step 5: Enable and start**

```bash
sudo systemctl enable --now tallow-relay
```

**Step 6: Check status and logs**

```bash
sudo systemctl status tallow-relay
sudo journalctl -u tallow-relay -f
```

### Firewall Configuration (Linux)

Tallow uses **UDP port 4433** for QUIC transport. You must open this port if running a relay.

**ufw (Ubuntu default):**

```bash
sudo ufw allow 4433/udp comment "tallow relay"
sudo ufw reload
sudo ufw status
```

**iptables:**

```bash
sudo iptables -I INPUT -p udp --dport 4433 -j ACCEPT

# Persist across reboots
sudo sh -c 'iptables-save > /etc/iptables/rules.v4'
# Or if using netfilter-persistent:
sudo netfilter-persistent save
```

**firewalld (Fedora/RHEL):**

```bash
sudo firewall-cmd --permanent --add-port=4433/udp
sudo firewall-cmd --reload
sudo firewall-cmd --list-ports
```

**nftables:**

```bash
sudo nft add rule inet filter input udp dport 4433 accept
```

**Cloud provider firewalls:**

If your relay is on a cloud provider (AWS, GCP, Oracle Cloud, etc.), you must also open UDP 4433 in the provider's network security group / firewall rules. The OS-level firewall is not enough.

For Oracle Cloud specifically, open UDP 4433 in the VCN Security List under your subnet's ingress rules.

### Landlock + Seccomp Sandbox

On Linux kernels 5.13+, tallow can use Landlock for filesystem access control and seccomp for syscall filtering. These provide defense-in-depth by restricting what the tallow process can access even if a vulnerability is exploited.

**Requirements:**

- Linux kernel 5.13+ (for Landlock v1)
- Linux kernel 5.19+ (for Landlock v2 with file truncation)
- seccomp support enabled in kernel (standard on all major distros)

**Checking support:**

```bash
# Check Landlock support
cat /sys/kernel/security/lsm
# Should include "landlock" in the output

# Check seccomp support
grep CONFIG_SECCOMP /boot/config-$(uname -r)
# Should show CONFIG_SECCOMP=y
```

Tallow enables sandboxing automatically when kernel support is detected. No configuration is needed.

---

## macOS

### Homebrew Installation

The simplest method on macOS:

```bash
brew tap tallowteam/tap
brew install tallow
```

**Upgrade later:**

```bash
brew update && brew upgrade tallow
```

### Cargo from Source (macOS)

**Prerequisites:**

You need Xcode Command Line Tools (provides the C compiler and linker):

```bash
xcode-select --install
```

If you already have the full Xcode app installed, the CLT are included.

**Install Rust:**

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
```

**Build and install:**

```bash
cargo install --git https://github.com/tallowteam/Tallow tallow
```

### Apple Silicon vs Intel

Tallow supports both architectures natively:

| Architecture | Chip examples | Rust target |
|-------------|---------------|-------------|
| Apple Silicon (ARM) | M1, M2, M3, M4 | `aarch64-apple-darwin` |
| Intel (x86_64) | Any pre-2020 Mac | `x86_64-apple-darwin` |

**How to check your architecture:**

```bash
uname -m
# arm64 = Apple Silicon
# x86_64 = Intel
```

Both architectures get hardware-accelerated AES-256-GCM. Apple Silicon also benefits from strong hardware RNG via Secure Enclave.

If you installed Rust via rustup, it automatically selects the correct target for your machine. No extra configuration is needed.

### Gatekeeper / Quarantine Issues

If you download a pre-built binary from the Releases page, macOS Gatekeeper may block it because it is not notarized by Apple.

**Symptom:**

```
"tallow" can't be opened because Apple cannot check it for malicious software.
```

Or in the terminal:

```
zsh: killed     tallow
```

**Fix:**

Remove the quarantine attribute:

```bash
xattr -d com.apple.quarantine /path/to/tallow
```

For example, if the binary is in `/usr/local/bin`:

```bash
xattr -d com.apple.quarantine /usr/local/bin/tallow
```

Alternatively, right-click the binary in Finder, select "Open", and confirm the dialog. This adds an exception for that binary.

**Note:** This is not needed when installing via Homebrew or Cargo, as those methods do not trigger Gatekeeper.

### macOS Firewall Configuration

If you are running a relay on macOS (typically only for development/testing):

1. Open **System Settings** > **Network** > **Firewall**.
2. Click **Options** (or **Firewall Options** on older macOS).
3. Click **+** and add the `tallow-relay` binary.
4. Set it to **Allow incoming connections**.

From the command line:

```bash
# Check firewall status
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Add tallow-relay as allowed
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/tallow-relay
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/tallow-relay
```

For the tallow client (not relay), no firewall changes are needed -- outbound connections work by default.

---

## Windows

### Scoop Installation

[Scoop](https://scoop.sh) is the recommended package manager for tallow on Windows:

```powershell
# Install Scoop if you don't have it
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# Add the tallow bucket and install
scoop bucket add tallow https://github.com/tallowteam/Tallow
scoop install tallow
```

**Upgrade later:**

```powershell
scoop update tallow
```

### Cargo from Source (Windows)

**Prerequisites:**

You need Visual Studio Build Tools with the C++ workload:

1. Download [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/).
2. Run the installer.
3. Select **"Desktop development with C++"**.
4. Install.

This provides `cl.exe`, `link.exe`, and the Windows SDK that Rust needs for compilation.

**Install Rust:**

Download and run [rustup-init.exe](https://rustup.rs). Accept the defaults.

Or from PowerShell:

```powershell
winget install Rustlang.Rustup
```

**Build and install:**

```powershell
cargo install --git https://github.com/tallowteam/Tallow tallow
```

**Important:** If you build in Git Bash instead of PowerShell, you may encounter linker errors because Git Bash's PATH can shadow Microsoft's `link.exe` with a different `link.exe` from MSYS2. Build from PowerShell or a "Developer Command Prompt for VS" to avoid this.

### PowerShell vs CMD vs Git Bash

Tallow works in all three Windows shells, but there are minor differences:

| Feature | PowerShell | CMD | Git Bash |
|---------|-----------|-----|----------|
| Pipe data to tallow | `echo "text" \| tallow send` | `echo text \| tallow send` | `echo "text" \| tallow send` |
| Environment variables | `$env:TALLOW_RELAY = "..."` | `set TALLOW_RELAY=...` | `export TALLOW_RELAY="..."` |
| Building from source | Recommended | Works | May have linker issues |
| Color output | Full support | Full support | Full support |
| Tab completion | `tallow completions powershell` | Not supported | `tallow completions bash` |

**Recommended:** Use PowerShell or Windows Terminal for the best experience.

### Windows Defender / SmartScreen Issues

When running tallow for the first time (especially a pre-built binary), Windows may show:

**SmartScreen warning:**

> "Windows protected your PC -- Microsoft Defender SmartScreen prevented an unrecognized app from starting."

Click **"More info"** then **"Run anyway"**.

**Windows Defender false positive:**

In rare cases, Windows Defender may flag tallow as suspicious because it performs cryptographic operations and network connections. To add an exclusion:

1. Open **Windows Security** > **Virus & threat protection** > **Manage settings**.
2. Scroll to **Exclusions** > **Add or remove exclusions**.
3. Click **Add an exclusion** > **File** and select the tallow binary.

From PowerShell (as Administrator):

```powershell
Add-MpPreference -ExclusionPath "C:\Users\$env:USERNAME\scoop\apps\tallow\current\tallow.exe"
```

### Windows Firewall Configuration

Tallow client (sending/receiving files) typically does not need firewall changes because it makes outbound connections.

If you are running a relay server on Windows (uncommon):

**Via GUI:**

1. Open **Windows Defender Firewall with Advanced Security** (search "wf.msc").
2. Click **Inbound Rules** > **New Rule**.
3. Select **Port** > **UDP** > enter `4433`.
4. Select **Allow the connection**.
5. Name it "Tallow Relay".

**Via PowerShell (as Administrator):**

```powershell
New-NetFirewallRule -DisplayName "Tallow Relay" -Direction Inbound -Protocol UDP -LocalPort 4433 -Action Allow
```

### WSL2 Alternative

If you prefer a Linux environment on Windows, tallow works seamlessly under WSL2:

```bash
# In WSL2 (Ubuntu)
sudo apt update
sudo apt install -y build-essential pkg-config libssl-dev git curl

curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"

cargo install --git https://github.com/tallowteam/Tallow tallow
```

**Notes on WSL2:**

- Network access works normally. WSL2 has its own IP address but outbound connections route through the host.
- File transfers save to the WSL2 filesystem by default. Use `/mnt/c/Users/YourName/Downloads/` to save directly to the Windows filesystem.
- Landlock sandbox support depends on the WSL2 kernel version.
- The TUI works in Windows Terminal with WSL2.

---

## Docker

Docker is supported for running the **relay server only**. The tallow CLI client is not distributed as a Docker image (it is a desktop/server tool meant to run on the host).

### Running the Relay in Docker

```bash
docker run -d \
  --name tallow-relay \
  -p 4433:4433/udp \
  ghcr.io/tallowteam/tallow-relay:latest
```

**With a relay password:**

```bash
docker run -d \
  --name tallow-relay \
  -p 4433:4433/udp \
  -e TALLOW_RELAY_PASS="your-secret" \
  ghcr.io/tallowteam/tallow-relay:latest
```

**Check relay logs:**

```bash
docker logs -f tallow-relay
```

### Docker Compose Setup

Create a `docker-compose.yml`:

```yaml
version: "3.8"

services:
  tallow-relay:
    image: ghcr.io/tallowteam/tallow-relay:latest
    container_name: tallow-relay
    restart: unless-stopped
    ports:
      - "4433:4433/udp"
    volumes:
      - ./relay.toml:/opt/tallow/relay.toml:ro
      - tallow-data:/opt/tallow/data
    environment:
      - RUST_LOG=info
      - TALLOW_RELAY_PASS=${TALLOW_RELAY_PASS:-}
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "1.0"

volumes:
  tallow-data:
```

Create a `relay.toml` alongside it:

```toml
bind_addr = "0.0.0.0:4433"
max_connections = 10000
max_rooms = 5000
rate_limit = 100
room_timeout_secs = 600
```

**Start:**

```bash
docker compose up -d
```

**Stop:**

```bash
docker compose down
```

**View logs:**

```bash
docker compose logs -f tallow-relay
```

### Persistent Volumes for Config

The Docker Compose setup above uses a named volume (`tallow-data`) for any persistent data. The relay itself is largely stateless (it just forwards encrypted bytes), but volumes are useful for:

- TLS certificate storage (if using Let's Encrypt)
- Log persistence (if configured to write to files)
- Future features like rate-limiting state

To use host-mounted directories instead:

```yaml
volumes:
  - /opt/tallow/data:/opt/tallow/data
  - /etc/letsencrypt:/etc/letsencrypt:ro  # for TLS certs
```

### Docker Networking (UDP Port Mapping)

Tallow uses QUIC, which runs over UDP. Docker's UDP port mapping has some nuances:

**Ensure you use `/udp` in port mappings:**

```bash
# Correct
docker run -p 4433:4433/udp ...

# Wrong (maps TCP only)
docker run -p 4433:4433 ...
```

**If you also want TCP (for future HTTP health endpoints):**

```bash
docker run -p 4433:4433/udp -p 4433:4433/tcp ...
```

**Docker network modes:**

| Mode | UDP support | Performance | Use case |
|------|------------|-------------|----------|
| `bridge` (default) | Works with `-p` | Good | Most deployments |
| `host` | Native, no mapping needed | Best | Production, high-traffic |
| `macvlan` | Native | Best | Multi-relay setups |

For high-traffic relays, consider `--network host` to avoid Docker's NAT overhead:

```bash
docker run -d --name tallow-relay --network host ghcr.io/tallowteam/tallow-relay:latest
```

---

## Building from Source (Any Platform)

### Rust Toolchain Installation

Tallow requires Rust 1.80 or later. Install via [rustup](https://rustup.rs):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

On Windows, download and run [rustup-init.exe](https://rustup.rs).

Verify:

```bash
rustc --version   # should be 1.80+
cargo --version
```

### Build Dependencies per Platform

| Platform | Required packages |
|----------|-------------------|
| Ubuntu/Debian | `build-essential pkg-config libssl-dev git` |
| Fedora/RHEL | `gcc gcc-c++ openssl-devel pkg-config git` |
| Arch | `base-devel openssl pkg-config git` |
| Alpine | `build-base openssl-dev pkgconf git` |
| macOS | Xcode Command Line Tools (`xcode-select --install`) |
| Windows | Visual Studio Build Tools (C++ workload) |

### Feature Flags

Tallow uses Cargo feature flags to control optional functionality:

| Feature | Default | Description |
|---------|---------|-------------|
| `tui` | Yes | Terminal UI (ratatui + crossterm) |
| `quic` | Yes | QUIC transport (quinn) |
| `aegis` | No | AEGIS-256 cipher (higher throughput on supported CPUs) |
| `onion` | No | Tor onion routing support |
| `full` | No | Enables all features: tui + quic + aegis + onion |

**Build with specific features:**

```bash
# Default features (tui + quic)
cargo build --release

# All features
cargo build --release --features full

# Minimal build (no TUI, no QUIC)
cargo build --release --no-default-features

# Specific features
cargo build --release --no-default-features --features "quic,aegis"
```

**Install with features via cargo:**

```bash
cargo install --git https://github.com/tallowteam/Tallow tallow --features full
```

### Cross-Compilation Tips

**Common targets:**

| Target | Use case |
|--------|----------|
| `x86_64-unknown-linux-gnu` | Standard Linux x86_64 |
| `x86_64-unknown-linux-musl` | Static Linux binary (portable) |
| `aarch64-unknown-linux-gnu` | Linux ARM64 (Pi, cloud ARM) |
| `x86_64-apple-darwin` | macOS Intel |
| `aarch64-apple-darwin` | macOS Apple Silicon |
| `x86_64-pc-windows-msvc` | Windows x86_64 |

**Add a target and cross-compile:**

```bash
# Add the target
rustup target add aarch64-unknown-linux-gnu

# Install the cross-linker (example: ARM64 on Ubuntu)
sudo apt install gcc-aarch64-linux-gnu

# Build
cargo build --release --target aarch64-unknown-linux-gnu -p tallow
```

**Using `cross` for easier cross-compilation:**

[cross](https://github.com/cross-rs/cross) uses Docker to provide the right toolchain automatically:

```bash
cargo install cross
cross build --release --target aarch64-unknown-linux-gnu -p tallow
```

**Static Linux binaries (musl):**

```bash
rustup target add x86_64-unknown-linux-musl
cargo build --release --target x86_64-unknown-linux-musl -p tallow
# Resulting binary has zero runtime dependencies
```

### Release vs Debug Builds

| Build | Command | Binary size | Speed | Use case |
|-------|---------|-------------|-------|----------|
| Debug | `cargo build` | ~50 MB | Slow (unoptimized) | Development, testing |
| Release | `cargo build --release` | ~10-15 MB | Fast (optimized, LTO) | Production, distribution |

The release profile in Tallow's `Cargo.toml` is configured for maximum performance:

```toml
[profile.release]
lto = "fat"           # Full link-time optimization
codegen-units = 1     # Single codegen unit for better optimization
strip = true          # Strip debug symbols
panic = "abort"       # Abort on panic (smaller binary)
opt-level = 3         # Maximum optimization
overflow-checks = true # Keep integer overflow checks (security)
```

Release builds take significantly longer (5-15 minutes depending on hardware) but produce a binary that is much smaller and faster.

```bash
# Quick debug build for development
cargo build -p tallow

# Optimized release build for production
cargo build --release -p tallow

# Build just the relay
cargo build --release -p tallow-relay
```

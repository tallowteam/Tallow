#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Tallow Relay Server — Oracle Cloud Deployment Script
# Run this ON the Oracle VM after SSH'ing in
# Usage: bash setup-relay.sh
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

TALLOW_DIR="/opt/tallow"
TALLOW_USER="tallow"
RELAY_PORT=4433

echo "╔══════════════════════════════════════════╗"
echo "║     TALLOW RELAY DEPLOYMENT SCRIPT       ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Step 1: System updates ────────────────────────────────────
echo "[1/8] Updating system packages..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# ── Step 2: Install Rust (for building on the VM) ─────────────
echo "[2/8] Installing Rust toolchain..."
if command -v rustc &>/dev/null; then
    echo "  Rust already installed: $(rustc --version)"
else
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
    source "$HOME/.cargo/env"
    echo "  Installed: $(rustc --version)"
fi
source "$HOME/.cargo/env" 2>/dev/null || true

# ── Step 3: Install build dependencies ────────────────────────
echo "[3/8] Installing build dependencies..."
sudo apt-get install -y -qq build-essential pkg-config libssl-dev git

# ── Step 4: Clone and build ───────────────────────────────────
echo "[4/8] Building tallow-relay (this takes ~5 min on ARM A1)..."
if [ -d "$HOME/tallow" ]; then
    cd "$HOME/tallow"
    git pull --ff-only
else
    git clone https://github.com/tallowteam/Tallow.git "$HOME/tallow"
    cd "$HOME/tallow"
fi

cargo build --release -p tallow-relay 2>&1 | tail -5
echo "  Build complete."

# ── Step 5: Create service user and directory ─────────────────
echo "[5/8] Setting up service user and directory..."
sudo useradd --system --no-create-home --shell /usr/sbin/nologin "$TALLOW_USER" 2>/dev/null || true
sudo mkdir -p "$TALLOW_DIR"
sudo cp "$HOME/tallow/target/release/tallow-relay" "$TALLOW_DIR/"
sudo cp "$HOME/tallow/deploy/relay.toml" "$TALLOW_DIR/"
sudo chown -R "$TALLOW_USER:$TALLOW_USER" "$TALLOW_DIR"
sudo chmod 750 "$TALLOW_DIR"
sudo chmod 700 "$TALLOW_DIR/tallow-relay"

# ── Step 6: Install systemd service ──────────────────────────
echo "[6/8] Installing systemd service..."
sudo cp "$HOME/tallow/deploy/tallow-relay.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable tallow-relay

# ── Step 7: Open firewall (iptables + Oracle iptables rules) ─
echo "[7/8] Configuring firewall..."

# Ubuntu on Oracle Cloud uses iptables by default
# Check if the rule already exists before adding
if ! sudo iptables -C INPUT -p udp --dport "$RELAY_PORT" -j ACCEPT 2>/dev/null; then
    sudo iptables -I INPUT 6 -p udp --dport "$RELAY_PORT" -j ACCEPT
    echo "  Added iptables rule for UDP $RELAY_PORT"
else
    echo "  iptables rule already exists"
fi

# Also open TCP for potential future HTTP health checks
if ! sudo iptables -C INPUT -p tcp --dport "$RELAY_PORT" -j ACCEPT 2>/dev/null; then
    sudo iptables -I INPUT 6 -p tcp --dport "$RELAY_PORT" -j ACCEPT
    echo "  Added iptables rule for TCP $RELAY_PORT"
else
    echo "  TCP rule already exists"
fi

# Persist iptables rules across reboots
sudo sh -c 'iptables-save > /etc/iptables/rules.v4' 2>/dev/null || \
    sudo netfilter-persistent save 2>/dev/null || \
    echo "  Warning: Could not persist iptables rules. Install iptables-persistent."

# ── Step 8: Start the relay ──────────────────────────────────
echo "[8/8] Starting tallow-relay..."
sudo systemctl start tallow-relay
sleep 2

if sudo systemctl is-active --quiet tallow-relay; then
    echo ""
    echo "╔══════════════════════════════════════════╗"
    echo "║       RELAY IS RUNNING                   ║"
    echo "╚══════════════════════════════════════════╝"
    echo ""
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "<your-public-ip>")
    echo "  Status:   $(sudo systemctl is-active tallow-relay)"
    echo "  Address:  $PUBLIC_IP:$RELAY_PORT (UDP/QUIC)"
    echo "  Config:   $TALLOW_DIR/relay.toml"
    echo "  Logs:     sudo journalctl -u tallow-relay -f"
    echo ""
    echo "  To use with tallow client:"
    echo "    tallow send myfile.txt --relay $PUBLIC_IP:$RELAY_PORT"
    echo ""
    echo "  IMPORTANT: You must also open UDP $RELAY_PORT in the"
    echo "  Oracle Cloud Security List (VCN firewall). See README."
else
    echo ""
    echo "  ERROR: Service failed to start."
    echo "  Check logs: sudo journalctl -u tallow-relay -n 50"
    exit 1
fi

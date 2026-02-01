#!/bin/bash

# Tallow Rebuild Script (Run on Synology NAS)
# Place this in /volume1/docker/tallow/ or running via SSH

PROJECT_DIR="/volume1/docker/tallow"

echo "========================================"
echo "  Tallow: Rebuild & Restart Containers"
echo "========================================"

cd "$PROJECT_DIR" || { echo "❌ Error: Could not verify directory $PROJECT_DIR"; exit 1; }

echo "📂 Working directory: $(pwd)"

echo "🛑 Stopping current containers..."
sudo docker compose down

echo "🏗️  Building and starting new containers..."
sudo docker compose up -d --build

echo "✅ Done! Checking status..."
sudo docker ps | grep tallow

echo "========================================"
echo "Logs available via: sudo docker logs tallow -f"

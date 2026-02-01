#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# TALLOW Subagents Installer
# Installs all 20 specialized subagents for TALLOW development
# ═══════════════════════════════════════════════════════════════════════════════

set -e

AGENTS_DIR="$HOME/.claude/agents"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║           TALLOW Subagents Installer - All 20 Agents (Opus)               ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Create agents directory if it doesn't exist
mkdir -p "$AGENTS_DIR"

# Copy all agent files
echo "Installing agents to $AGENTS_DIR..."
echo ""

# List of all 20 agents
AGENTS=(
    "01-flutter-pro:🔴 HIGH"
    "02-go-expert:🔴 HIGH"
    "03-mdns-discovery:🔴 HIGH"
    "04-rust-performance:🟡 MEDIUM"
    "05-pqc-crypto-auditor:🔴 CRITICAL"
    "06-protocol-security:🔴 HIGH"
    "07-penetration-tester:🟢 LOW"
    "08-relay-architect:🔴 HIGH"
    "09-nat-traversal:🟡 MEDIUM"
    "10-webrtc-optimizer:🟡 MEDIUM"
    "11-react-nextjs-pro:🟡 MEDIUM"
    "12-accessibility-expert:🟡 MEDIUM"
    "13-framer-motion-pro:🟢 LOW"
    "14-playwright-expert:🟡 MEDIUM"
    "15-performance-engineer:🟡 MEDIUM"
    "16-test-automator:🟡 MEDIUM"
    "17-devops-engineer:🟡 MEDIUM"
    "18-monitoring-expert:🟢 LOW"
    "19-documentation-engineer:🟢 LOW"
    "20-i18n-expert:🟢 LOW"
)

for agent_info in "${AGENTS[@]}"; do
    agent_file="${agent_info%%:*}"
    priority="${agent_info##*:}"
    agent_name="${agent_file#*-}"
    
    if [ -f "$SCRIPT_DIR/agents/${agent_file}.md" ]; then
        cp "$SCRIPT_DIR/agents/${agent_file}.md" "$AGENTS_DIR/${agent_name}.md"
        echo "  ✅ ${agent_name}.md - $priority"
    else
        echo "  ⚠️  ${agent_file}.md not found"
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "✅ Installation complete! ${#AGENTS[@]} agents installed."
echo ""
echo "📁 Agents installed to: $AGENTS_DIR"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "📋 QUICK REFERENCE - Add to your CLAUDE.md:"
echo ""
echo "## Subagent Delegation Rules"
echo ""
echo "### 🔴 HIGH PRIORITY (always use)"
echo "- flutter-pro → Native iOS/Android/Desktop apps"
echo "- go-expert → CLI tool and relay server"
echo "- mdns-discovery → Local device discovery"
echo "- pqc-crypto-auditor → ALL crypto changes (CRITICAL)"
echo "- relay-architect → Relay protocol design"
echo "- protocol-security → Security reviews"
echo ""
echo "### 🟡 MEDIUM PRIORITY"
echo "- react-nextjs-pro → Web frontend"
echo "- nat-traversal → Connection issues"
echo "- webrtc-optimizer → Transfer speed"
echo "- playwright-expert → E2E tests"
echo "- performance-engineer → Optimization"
echo "- test-automator → Test coverage"
echo "- devops-engineer → CI/CD"
echo "- accessibility-expert → WCAG compliance"
echo ""
echo "### 🟢 LOW PRIORITY"
echo "- rust-performance, penetration-tester, framer-motion-pro,"
echo "- monitoring-expert, documentation-engineer, i18n-expert"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"

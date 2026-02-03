#!/bin/bash
# Tallow Agents Installation Script
# Installs curated agents for Tallow development

set -e

AGENTS_DIR="$HOME/.claude/agents/tallow"
WSHOBSON_REPO="https://github.com/wshobson/agents.git"
VOLTAGENT_REPO="https://github.com/VoltAgent/awesome-claude-code-subagents.git"
TMP_DIR=$(mktemp -d)

echo "=== Tallow Agents Installer ==="
echo ""

# Create agents directory
mkdir -p "$AGENTS_DIR"
echo "Created: $AGENTS_DIR"

# Clone repositories
echo ""
echo "Cloning agent repositories..."
git clone --depth 1 "$WSHOBSON_REPO" "$TMP_DIR/wshobson" 2>/dev/null
git clone --depth 1 "$VOLTAGENT_REPO" "$TMP_DIR/voltagent" 2>/dev/null

# Agent lists
WSHOBSON_AGENTS=(
  "security-auditor"
  "backend-security-coder"
  "frontend-security-coder"
  "penetration-tester"
  "code-reviewer"
  "architect-reviewer"
  "performance-engineer"
  "debugger"
  "error-detective"
  "tdd-orchestrator"
  "test-automator"
  "qa-expert"
  "chaos-engineer"
  "compliance-auditor"
  "nextjs-developer"
  "react-specialist"
  "typescript-pro"
  "websocket-engineer"
)

VOLTAGENT_AGENTS=(
  "accessibility-tester"
  "ui-visual-validator"
  "ui-designer"
)

echo ""
echo "Installing agents..."

# Copy wshobson agents
for agent in "${WSHOBSON_AGENTS[@]}"; do
  src=$(find "$TMP_DIR/wshobson" -name "${agent}.md" -path "*/agents/*" 2>/dev/null | head -1)
  if [ -n "$src" ] && [ -f "$src" ]; then
    cp "$src" "$AGENTS_DIR/"
    echo "  ✓ $agent"
  else
    echo "  ✗ $agent (not found)"
  fi
done

# Copy voltagent agents
for agent in "${VOLTAGENT_AGENTS[@]}"; do
  src=$(find "$TMP_DIR/voltagent" -name "${agent}.md" 2>/dev/null | head -1)
  if [ -n "$src" ] && [ -f "$src" ]; then
    cp "$src" "$AGENTS_DIR/"
    echo "  ✓ $agent"
  else
    echo "  ✗ $agent (not found)"
  fi
done

# Cleanup
rm -rf "$TMP_DIR"

# Count installed
count=$(ls -1 "$AGENTS_DIR"/*.md 2>/dev/null | wc -l)

echo ""
echo "=== Installation Complete ==="
echo "Installed: $count agents"
echo "Location: $AGENTS_DIR"
echo ""
echo "To use: Reference agents in Claude Code conversations"

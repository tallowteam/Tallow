#!/bin/bash
# Auto-run clippy on Rust file edits
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty' 2>/dev/null)
if [[ "$FILE" == *.rs ]]; then
  cargo clippy --quiet --message-format=short 2>&1 | head -20
fi
exit 0

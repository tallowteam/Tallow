#!/bin/bash
# Block reads of sensitive files
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty' 2>/dev/null)
case "$FILE" in
  *.env*|*secret*|*.pem|*.key|*credential*)
    echo '{"block": true, "reason": "Access to secrets/credentials is blocked by security policy."}' >&2
    exit 2
    ;;
esac
exit 0

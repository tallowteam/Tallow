#!/bin/bash
# Detailed unsafe block report with context
echo "=== Unsafe Block Audit ==="
grep -rn "unsafe" crates/ --include="*.rs" | while IFS=: read -r file line content; do
    echo ""
    echo "File: $file:$line"
    echo "Code: $content"
    prev_line=$((line - 1))
    safety=$(sed -n "${prev_line}p" "$file" 2>/dev/null)
    if echo "$safety" | grep -q "// SAFETY:"; then
        echo "SAFETY comment: YES"
        echo "  $safety"
    else
        echo "SAFETY comment: MISSING"
    fi
done

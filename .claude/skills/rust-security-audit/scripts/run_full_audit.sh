#!/bin/bash
set -euo pipefail
echo "=== Tallow Security Audit Pipeline ==="
echo ""
echo "--- Step 1: Dependency CVE Scan (cargo audit) ---"
cargo audit 2>&1 || true
echo ""
echo "--- Step 2: Policy Check (cargo deny) ---"
cargo deny check 2>&1 || true
echo ""
echo "--- Step 3: Static Analysis (clippy) ---"
cargo clippy --all-targets -- -D warnings 2>&1 || true
echo ""
echo "--- Step 4: Unsafe Block Report ---"
echo "Total unsafe blocks:"
grep -rn "unsafe" crates/ --include="*.rs" | wc -l
echo "Unsafe without SAFETY comment:"
grep -rn "unsafe" crates/ --include="*.rs" | grep -v "// SAFETY:" | grep -v "#\[cfg(test)\]" || echo "  None found (good)"
echo ""
echo "--- Step 5: Unwrap in Non-Test Code ---"
grep -rn "\.unwrap()\|\.expect(" crates/ --include="*.rs" | grep -v "#\[cfg(test)\]" | grep -v "test" || echo "  None found (good)"
echo ""
echo "=== Audit Complete ==="

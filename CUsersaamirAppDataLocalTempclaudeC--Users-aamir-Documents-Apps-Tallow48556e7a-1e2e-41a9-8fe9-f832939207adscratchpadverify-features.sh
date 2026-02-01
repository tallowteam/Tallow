#!/bin/bash
# Verify documented features exist in codebase

echo "=== Verifying Documented Features ==="
echo ""

echo "1. Components (expecting 141):"
find components -name "*.tsx" -o -name "*.ts" | wc -l

echo ""
echo "2. API Routes (expecting 22):"
find app/api -name "route.ts" | wc -l

echo ""
echo "3. Hooks (expecting 30+):"
find lib/hooks -name "use-*.ts" | wc -l

echo ""
echo "4. Storage modules:"
ls -1 lib/storage/*.ts 2>/dev/null | wc -l

echo ""
echo "5. Crypto modules:"
ls -1 lib/crypto/*.ts 2>/dev/null | wc -l

echo ""
echo "6. Network/Transport:"
ls -1 lib/transport/*.ts lib/webrtc/*.ts lib/signaling/*.ts 2>/dev/null | wc -l

echo ""
echo "7. Test files:"
find tests -name "*.spec.ts" -o -name "*.test.ts" | wc -l

echo ""
echo "=== Key Features Check ==="
echo ""
echo "Post-Quantum Crypto:"
test -f lib/crypto/pqc-crypto.ts && echo "✅ pqc-crypto.ts" || echo "❌ pqc-crypto.ts missing"

echo ""
echo "Triple Ratchet:"
test -f lib/crypto/triple-ratchet.ts && echo "✅ triple-ratchet.ts" || echo "❌ triple-ratchet.ts missing"

echo ""
echo "Onion Routing:"
test -f lib/transport/onion-routing.ts && echo "✅ onion-routing.ts" || echo "❌ onion-routing.ts missing"

echo ""
echo "Screen Sharing:"
test -f lib/hooks/use-screen-share.ts && echo "✅ use-screen-share.ts" || echo "❌ use-screen-share.ts missing"

echo ""
echo "Group Transfer:"
test -f lib/transfer/group-transfer-manager.ts && echo "✅ group-transfer-manager.ts" || echo "❌ group-transfer-manager.ts missing"

echo ""
echo "Password Protection:"
test -f lib/crypto/password-file-encryption.ts && echo "✅ password-file-encryption.ts" || echo "❌ password-file-encryption.ts missing"

echo ""
echo "Metadata Stripping:"
test -f lib/privacy/metadata-stripper.ts && echo "✅ metadata-stripper.ts" || echo "❌ metadata-stripper.ts missing"

echo ""
echo "Email Fallback:"
test -f lib/email-fallback/index.ts && echo "✅ email-fallback/index.ts" || echo "❌ email-fallback missing"

echo ""
echo "Resumable Transfers:"
test -f lib/transfer/resumable-transfer.ts && echo "✅ resumable-transfer.ts" || echo "❌ resumable-transfer.ts missing"

echo ""
echo "Folder Transfer:"
test -f lib/transfer/folder-transfer.ts && echo "✅ folder-transfer.ts" || echo "❌ folder-transfer.ts missing"

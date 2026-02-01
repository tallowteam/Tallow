#!/bin/bash

# Group Transfer Testing Script
# Run this to test all group transfer functionality

echo "╔════════════════════════════════════════════════════════╗"
echo "║  Group Transfer Testing Script                         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if required files exist
echo "Checking implementation files..."
FILES=(
    "lib/discovery/group-discovery-manager.ts"
    "lib/signaling/socket-signaling.ts"
    "lib/transfer/group-transfer-manager.ts"
    "components/app/GroupTransferInviteDialog.tsx"
    "app/app/page.tsx"
    "signaling-server.js"
)

ALL_EXIST=true
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "✗ $file - MISSING!"
        ALL_EXIST=false
    fi
done

echo ""

if [ "$ALL_EXIST" = false ]; then
    echo "❌ Some required files are missing!"
    exit 1
fi

echo "✅ All required files exist"
echo ""

# Run TypeScript type check
echo "Running TypeScript type check..."
npx tsc --noEmit --skipLibCheck 2>&1 | grep -E "(error TS|✓|✗)" | head -20

# Check for common issues
echo ""
echo "Checking for common issues..."

# Check if GroupTransferInviteDialog is imported
if grep -q "GroupTransferInviteDialog" app/app/page.tsx; then
    echo "✓ GroupTransferInviteDialog imported in app page"
else
    echo "✗ GroupTransferInviteDialog NOT imported in app page"
fi

# Check if multi-file sending is implemented
if grep -q "for (let i = 0; i < selectedFiles.length; i++)" app/app/page.tsx; then
    echo "✓ Multi-file sending implemented"
else
    echo "✗ Multi-file sending NOT implemented"
fi

# Check if group events are in signaling server
if grep -q "create-group-transfer" signaling-server.js; then
    echo "✓ Group transfer events in signaling server"
else
    echo "✗ Group transfer events NOT in signaling server"
fi

# Check if group invite handler exists
if grep -q "onGroupInvite" app/app/page.tsx; then
    echo "✓ Group invite handler exists in app"
else
    echo "✗ Group invite handler NOT in app"
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Manual Testing Checklist                              ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "1. Start the signaling server:"
echo "   node signaling-server.js"
echo ""
echo "2. Start the development server:"
echo "   npm run dev"
echo ""
echo "3. Open two browser tabs (sender & receiver)"
echo ""
echo "4. Sender Setup:"
echo "   - Select 2-3 files"
echo "   - Click Advanced → Enable Group Transfer"
echo "   - Click 'Select Recipients'"
echo "   - Choose 1-2 recipients"
echo "   - Confirm and start transfer"
echo ""
echo "5. Receiver Setup:"
echo "   - Wait for GroupTransferInviteDialog"
echo "   - Verify file info displayed"
echo "   - Click 'Accept Transfer'"
echo "   - Wait for files to download"
echo ""
echo "6. Verify:"
echo "   - All files received on receiver"
echo "   - GroupTransferProgress shows status"
echo "   - Toast notifications appear"
echo "   - File integrity maintained"
echo ""
echo "Test completed! Review results above."

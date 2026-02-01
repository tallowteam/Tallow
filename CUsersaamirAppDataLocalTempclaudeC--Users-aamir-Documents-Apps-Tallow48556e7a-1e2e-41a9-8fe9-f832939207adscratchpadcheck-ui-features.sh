#!/bin/bash
echo "=== Checking UI Feature Exposure ==="
echo ""

echo "1. Main App Pages:"
ls -1 app/app/*.tsx 2>/dev/null
echo ""

echo "2. Public Pages:"
ls -1 app/*.tsx 2>/dev/null | grep -v layout
echo ""

echo "3. Feature Pages:"
find app -name "page.tsx" -type f | sort
echo ""

echo "4. API Routes (Backend):"
find app/api -name "route.ts" | wc -l
echo "total routes"
echo ""

echo "5. Key UI Components Check:"
echo "Transfer UI:"
test -f app/app/page.tsx && echo "✅ Main transfer page exists" || echo "❌ Missing"

echo "Settings:"
test -f app/app/settings/page.tsx && echo "✅ Settings page exists" || echo "❌ Missing"

echo "History:"
test -f app/app/history/page.tsx && echo "✅ History page exists" || echo "❌ Missing"

echo ""
echo "6. Checking main app features in app/app/page.tsx:"
if [ -f app/app/page.tsx ]; then
    echo "File transfers:" 
    grep -q "sendFile\|transferFile" app/app/page.tsx && echo "  ✅ Implemented" || echo "  ❓ Check needed"
    
    echo "Screen sharing:"
    grep -q "screenShare\|shareScreen" app/app/page.tsx && echo "  ✅ Implemented" || echo "  ❓ Check needed"
    
    echo "Group transfers:"
    grep -q "groupTransfer\|multipleRecipients" app/app/page.tsx && echo "  ✅ Implemented" || echo "  ❓ Check needed"
fi

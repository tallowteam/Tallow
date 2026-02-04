#!/bin/bash

# Layout Components Verification Script
# Verifies all layout components are properly created and functional

set -e

echo "🔍 Verifying Layout Components..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if files exist
echo "📁 Checking component files..."

COMPONENTS=(
  "components/layout/Container.tsx"
  "components/layout/Section.tsx"
  "components/layout/Grid.tsx"
  "components/layout/Stack.tsx"
  "components/layout/Header.tsx"
  "components/layout/Footer.tsx"
  "components/layout/MobileNav.tsx"
  "components/layout/LayoutDemo.tsx"
  "components/layout/index.ts"
  "components/layout/README.md"
)

ALL_FOUND=true

for component in "${COMPONENTS[@]}"; do
  if [ -f "$component" ]; then
    echo -e "${GREEN}✓${NC} Found: $component"
  else
    echo -e "${RED}✗${NC} Missing: $component"
    ALL_FOUND=false
  fi
done

echo ""

# Check test files
echo "🧪 Checking test files..."

TESTS=(
  "tests/unit/layout/Container.test.tsx"
  "tests/unit/layout/Section.test.tsx"
  "tests/unit/layout/Grid.test.tsx"
  "tests/unit/layout/Stack.test.tsx"
  "tests/unit/layout/MobileNav.test.tsx"
  "tests/e2e/layout/header.spec.ts"
)

for test in "${TESTS[@]}"; do
  if [ -f "$test" ]; then
    echo -e "${GREEN}✓${NC} Found: $test"
  else
    echo -e "${RED}✗${NC} Missing: $test"
    ALL_FOUND=false
  fi
done

echo ""

# Check documentation
echo "📚 Checking documentation..."

DOCS=(
  "LAYOUT_COMPONENTS_QUICK_REFERENCE.md"
  "LAYOUT_COMPONENTS_DELIVERY.md"
)

for doc in "${DOCS[@]}"; do
  if [ -f "$doc" ]; then
    echo -e "${GREEN}✓${NC} Found: $doc"
  else
    echo -e "${RED}✗${NC} Missing: $doc"
    ALL_FOUND=false
  fi
done

echo ""

# Verify TypeScript compilation for layout components only
echo "🔧 Checking TypeScript compilation..."

if npx tsc --noEmit components/layout/*.tsx 2>&1 | grep -q "error TS"; then
  echo -e "${RED}✗${NC} TypeScript errors found in layout components"
  ALL_FOUND=false
else
  echo -e "${GREEN}✓${NC} No TypeScript errors in layout components"
fi

echo ""

# Check exports
echo "📦 Checking exports..."

if grep -q "export { Container }" components/layout/index.ts; then
  echo -e "${GREEN}✓${NC} Container exported"
else
  echo -e "${RED}✗${NC} Container not exported"
  ALL_FOUND=false
fi

if grep -q "export { Section }" components/layout/index.ts; then
  echo -e "${GREEN}✓${NC} Section exported"
else
  echo -e "${RED}✗${NC} Section not exported"
  ALL_FOUND=false
fi

if grep -q "export { Grid }" components/layout/index.ts; then
  echo -e "${GREEN}✓${NC} Grid exported"
else
  echo -e "${RED}✗${NC} Grid not exported"
  ALL_FOUND=false
fi

if grep -q "export { Stack }" components/layout/index.ts; then
  echo -e "${GREEN}✓${NC} Stack exported"
else
  echo -e "${RED}✗${NC} Stack not exported"
  ALL_FOUND=false
fi

if grep -q "export { Header }" components/layout/index.ts; then
  echo -e "${GREEN}✓${NC} Header exported"
else
  echo -e "${RED}✗${NC} Header not exported"
  ALL_FOUND=false
fi

if grep -q "export { Footer }" components/layout/index.ts; then
  echo -e "${GREEN}✓${NC} Footer exported"
else
  echo -e "${RED}✗${NC} Footer not exported"
  ALL_FOUND=false
fi

if grep -q "export { MobileNav }" components/layout/index.ts; then
  echo -e "${GREEN}✓${NC} MobileNav exported"
else
  echo -e "${RED}✗${NC} MobileNav not exported"
  ALL_FOUND=false
fi

echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$ALL_FOUND" = true ]; then
  echo -e "${GREEN}✓ All layout components verified successfully!${NC}"
  echo ""
  echo "Components created: 7"
  echo "Test files created: 6"
  echo "Documentation files: 3"
  echo "Total files: 18"
  echo ""
  echo "Next steps:"
  echo "1. Import components: import { Container, Section } from '@/components/layout'"
  echo "2. Run tests: npm test components/layout"
  echo "3. View demo: Add LayoutDemo to a page"
  echo "4. Read docs: components/layout/README.md"
else
  echo -e "${RED}✗ Some layout components are missing or have errors${NC}"
  exit 1
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# TypeScript Maintenance Guide

Quick reference for maintaining zero TypeScript errors in the Tallow project.

## Daily Commands

```bash
# Quick type check (fast)
npx tsc --noEmit

# Type check with error count
npx tsc --noEmit 2>&1 | grep -c "error TS"

# Type check and save to file
npx tsc --noEmit 2>&1 | tee typescript-check.log
```

## Common Patterns

### 1. Accessing Environment Variables

```typescript
// ✗ Wrong - fails with noPropertyAccessFromIndexSignature
process.env.MY_VAR

// ✓ Correct
process.env['MY_VAR']
```

### 2. Optional Properties

```typescript
// ✗ Wrong - fails with exactOptionalPropertyTypes
const config = {
  optionalProp: undefined, // Don't do this
};

// ✓ Correct - omit the property
const config = {
  // optionalProp omitted
};

// ✓ Correct - conditional spread
const config = {
  ...(condition && { optionalProp: value }),
};
```

### 3. Function Type Guards

```typescript
// ✗ Wrong - checking if function exists
if (obj.method) { }

// ✓ Correct
if (typeof obj.method === 'function') { }
```

### 4. React Hook Return Types

```typescript
// ✗ Wrong - should return cleanup function
export function useHook(): void {
  return () => cleanup();
}

// ✓ Correct
export function useHook(): () => void {
  return () => cleanup();
}
```

### 5. Array Access with noUncheckedIndexedAccess

```typescript
// Array access returns T | undefined
const arr = [1, 2, 3];
const item = arr[0]; // number | undefined

// ✓ Safe access patterns
if (arr[0] !== undefined) {
  const item = arr[0]; // number
}

// ✓ Or use optional chaining
const value = arr[0]?.toString();

// ✓ Or provide default
const item = arr[0] ?? defaultValue;
```

### 6. Next.js Config Types

```typescript
import type { NextConfig } from 'next';

const config: NextConfig = {
  // Only use documented properties
  // Check Next.js docs for valid options
};

export default config;
```

## Pre-Commit Checklist

- [ ] Run `npx tsc --noEmit` - should return 0 errors
- [ ] No new `any` types added (unless justified with comment)
- [ ] All index signature access uses bracket notation
- [ ] No optional properties set to `undefined`
- [ ] Function type guards use `typeof === 'function'`

## Package.json Scripts

Add these to your package.json:

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    "type-check:verbose": "tsc --noEmit --listFiles"
  }
}
```

## Git Hooks

### Pre-commit Hook (.husky/pre-commit)

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run TypeScript check
echo "Running TypeScript check..."
npx tsc --noEmit

if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors found. Please fix before committing."
  exit 1
fi

echo "✓ TypeScript check passed"
```

## VSCode Settings

Add to `.vscode/settings.json`:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always"
}
```

## Troubleshooting

### Issue: Auto-formatter adding back .next includes

**Solution:** The .next directory is excluded in tsconfig.json but formatters may add it back. This is OK as long as `.next` directory itself is deleted or in `.gitignore`.

### Issue: Sudden errors after npm install

**Solution:**
```bash
# Clean and reinstall
rm -rf node_modules .next
npm install

# Type check
npx tsc --noEmit
```

### Issue: Next.js type errors

**Solution:**
```bash
# Delete .next and let Next.js regenerate
rm -rf .next
npm run dev
```

### Issue: Slow type checking

**Solution:**
```bash
# Use incremental compilation (already enabled)
# Check tsconfig.json has:
{
  "compilerOptions": {
    "incremental": true
  }
}
```

## Strict Mode Flags Reference

Our configuration uses all TypeScript strict mode flags:

| Flag | Purpose | Common Issues |
|------|---------|---------------|
| `strict` | Master flag for all strict checks | N/A |
| `strictNullChecks` | Null/undefined checking | Use `?.` or `??` operators |
| `noImplicitAny` | No implicit any types | Add explicit types |
| `strictFunctionTypes` | Stricter function type checks | Function parameter contravariance |
| `strictBindCallApply` | Strict bind/call/apply | Ensure correct argument types |
| `strictPropertyInitialization` | Properties must be initialized | Use `!` or initialize in constructor |
| `noImplicitThis` | This must be typed | Add `this: Type` parameter |
| `alwaysStrict` | Use strict mode | N/A |
| `noUncheckedIndexedAccess` | Array access returns T \| undefined | Check for undefined before use |
| `exactOptionalPropertyTypes` | Can't set optional to undefined | Omit property or use conditional spread |
| `noImplicitReturns` | All paths must return | Add return statements |
| `noFallthroughCasesInSwitch` | Switch cases must break | Add break or return |
| `noUnusedLocals` | No unused variables | Remove or prefix with `_` |
| `noUnusedParameters` | No unused parameters | Remove or prefix with `_` |
| `noPropertyAccessFromIndexSignature` | Use bracket notation | Use `obj['prop']` not `obj.prop` |

## Quick Fixes

### Remove unused variables
```typescript
// ✗ Wrong
const unusedVar = getValue();

// ✓ Correct - prefix with underscore if intentionally unused
const _unusedVar = getValue();

// ✓ Better - remove if truly unused
```

### Handle all switch cases
```typescript
// ✗ Wrong
switch (type) {
  case 'a':
    doA();
  case 'b':
    doB();
}

// ✓ Correct
switch (type) {
  case 'a':
    doA();
    break;
  case 'b':
    doB();
    break;
  default:
    throw new Error(`Unknown type: ${type}`);
}
```

### Strict null checks
```typescript
// ✗ Wrong
function process(value: string | null) {
  return value.length; // Error: value might be null
}

// ✓ Correct
function process(value: string | null) {
  if (value === null) return 0;
  return value.length;
}

// ✓ Also correct
function process(value: string | null) {
  return value?.length ?? 0;
}
```

## Resources

- [TypeScript Handbook - Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Effective TypeScript](https://effectivetypescript.com/)

## Success Metrics

Track these metrics over time:

```bash
# Total TypeScript files
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | wc -l

# Error count (should be 0)
npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0"

# Warning count
npx tsc --noEmit 2>&1 | grep -c "warning TS" || echo "0"
```

Current Status: **0 errors, 0 warnings, 200+ files**

---

**Last Updated:** January 28, 2026
**Status:** ✓ Zero Errors Achieved

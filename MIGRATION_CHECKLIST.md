# TypeScript Strict Mode Migration Checklist

## Phase 1: Assessment (Current)

- [x] Enable strict mode in tsconfig.json
- [x] Install and configure ESLint plugins
- [x] Set up pre-commit hooks
- [x] Document configuration and patterns
- [ ] Run initial type check and categorize errors
- [ ] Create migration plan based on error severity

## Phase 2: Critical Fixes (Priority 1)

### Type Safety Errors

- [ ] Fix all `any` types in public APIs
  - [ ] lib/types.ts - Review all interface definitions
  - [ ] lib/api/*.ts - Add proper request/response types
  - [ ] lib/hooks/*.ts - Type all hook return values
  - [ ] components/*/*.tsx - Type all component props

- [ ] Fix unsafe type operations
  - [ ] Review all type assertions (`as` keyword)
  - [ ] Replace with proper type guards
  - [ ] Add runtime validation where needed

- [ ] Fix null/undefined handling
  - [ ] Add null checks for optional properties
  - [ ] Use optional chaining (?.)
  - [ ] Use nullish coalescing (??)
  - [ ] Remove non-null assertions (!)

### Promise Handling

- [ ] Fix all floating promises
  - [ ] Add await where needed
  - [ ] Use void for fire-and-forget
  - [ ] Add .catch() for error handling
  - [ ] Type all async functions

### Function Return Types

- [ ] Add explicit return types to:
  - [ ] All exported functions
  - [ ] All async functions
  - [ ] All component functions
  - [ ] All hook functions
  - [ ] All utility functions

## Phase 3: Component Fixes (Priority 2)

### React Components

- [ ] app/**/*.tsx
  - [ ] app/page.tsx
  - [ ] app/layout.tsx
  - [ ] app/app/page.tsx
  - [ ] app/app/settings/page.tsx
  - [ ] app/app/history/page.tsx

- [ ] components/ui/**/*.tsx
  - [ ] button.tsx
  - [ ] input.tsx
  - [ ] dialog.tsx
  - [ ] select.tsx
  - [ ] All other UI components

- [ ] components/app/**/*.tsx
  - [ ] AppHeader.tsx
  - [ ] ConnectionSelector.tsx
  - [ ] CameraCapture.tsx
  - [ ] FilePreview.tsx
  - [ ] All other app components

- [ ] components/transfer/**/*.tsx
  - [ ] transfer-card.tsx
  - [ ] transfer-queue.tsx
  - [ ] file-selector.tsx
  - [ ] All transfer-related components

### Known Issues to Fix

1. **app/app/page.tsx:1817** - VerificationDialog not found
2. **app/app/settings/page.tsx:188** - ProxyConfig Promise type mismatch
3. **components/app/MobileGestureSettings.tsx:10-11** - Missing lucide-react exports
4. **components/ui/button-animated.tsx:75** - Motion props type conflict
5. **components/ui/index.ts:26** - Duplicate buttonVariants export
6. **components/ui/toast-examples.tsx:221** - Promise type mismatch
7. **lib/animations/animated-components.tsx** - Multiple motion.div type errors

## Phase 4: Library Code (Priority 3)

### Crypto & Security

- [ ] lib/crypto/**/*.ts
  - [ ] pqc-crypto.ts
  - [ ] triple-ratchet.ts
  - [ ] key-management.ts
  - [ ] digital-signatures.ts
  - [ ] All crypto utilities

- [ ] lib/security/**/*.ts
  - [ ] csrf.ts
  - [ ] memory-wiper.ts
  - [ ] credential-encryption.ts

### Transfer & Network

- [ ] lib/transfer/**/*.ts
  - [ ] transfer-manager.ts
  - [ ] pqc-transfer-manager.ts
  - [ ] file-encryption.ts
  - [ ] file-chunking.ts

- [ ] lib/network/**/*.ts
  - [ ] proxy-config.ts
  - [ ] All network utilities

- [ ] lib/transport/**/*.ts
  - [ ] onion-routing.ts
  - [ ] private-webrtc.ts

### Hooks & Context

- [ ] lib/hooks/**/*.ts
  - [ ] use-p2p-connection.ts
  - [ ] use-file-transfer.ts
  - [ ] use-pqc-transfer.ts
  - [ ] All custom hooks

- [ ] lib/context/**/*.tsx
  - [ ] transfers-context.tsx
  - [ ] devices-context.tsx
  - [ ] settings-context.tsx
  - [ ] All context providers

### Storage & State

- [ ] lib/storage/**/*.ts
  - [ ] secure-storage.ts
  - [ ] my-devices.ts
  - [ ] transfer-history.ts
  - [ ] friends.ts

## Phase 5: ESLint Compliance (Priority 4)

### Accessibility Fixes

- [ ] Add alt text to all images
- [ ] Add ARIA labels where needed
- [ ] Fix keyboard navigation
- [ ] Add proper form labels
- [ ] Fix interactive element roles
- [ ] Ensure proper heading hierarchy

### Security Fixes

- [ ] Review all object property access
- [ ] Validate all user inputs
- [ ] Fix timing-safe comparisons
- [ ] Review regex patterns
- [ ] Audit eval-like code

### React Hooks Compliance

- [ ] Fix all hooks dependency arrays
- [ ] Ensure hooks are called unconditionally
- [ ] Fix conditional hook usage
- [ ] Review all useEffect dependencies
- [ ] Review all useCallback/useMemo dependencies

## Phase 6: Testing & Validation

### Unit Tests

- [ ] Update test files for new types
  - [ ] tests/unit/**/*.test.ts
  - [ ] tests/unit/**/*.test.tsx

- [ ] Add type tests
  - [ ] Create type assertion tests
  - [ ] Test type inference
  - [ ] Test generic types

### E2E Tests

- [ ] Verify tests still pass
  - [ ] tests/e2e/**/*.spec.ts
  - [ ] Fix any type-related test failures

### Manual Testing

- [ ] Test all critical user flows
- [ ] Test file transfers
- [ ] Test device connections
- [ ] Test settings changes
- [ ] Test error scenarios

## Phase 7: Documentation

- [x] Create TYPE_SAFETY_GUIDE.md
- [x] Create ESLINT_RULES_REFERENCE.md
- [x] Create MIGRATION_CHECKLIST.md
- [ ] Update README.md with type safety info
- [ ] Document breaking changes
- [ ] Create migration examples
- [ ] Add inline code comments for complex types

## Phase 8: CI/CD Integration

- [ ] Add type checking to CI pipeline
- [ ] Add linting to CI pipeline
- [ ] Set up PR checks
- [ ] Configure build to fail on type errors
- [ ] Add badge to README

## Progress Tracking

### Current Status

```
Total Type Errors: ~50 (estimated)
Fixed: 0
Remaining: ~50
Progress: 0%
```

### By Category

| Category | Total | Fixed | Remaining |
|----------|-------|-------|-----------|
| Type Errors | ~30 | 0 | ~30 |
| Null Checks | ~10 | 0 | ~10 |
| Promise Handling | ~5 | 0 | ~5 |
| Accessibility | ~15 | 0 | ~15 |
| Security | ~5 | 0 | ~5 |

## Tips for Migration

### 1. Start Small
Focus on one file or module at a time. Don't try to fix everything at once.

### 2. Use Type Guards
Instead of type assertions, create proper type guard functions:
```typescript
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value
  );
}
```

### 3. Leverage Union Types
Use union types for flexibility while maintaining type safety:
```typescript
type Status = 'idle' | 'loading' | 'success' | 'error';
```

### 4. Use Type Inference
Let TypeScript infer types when possible:
```typescript
// Don't need to specify type here
const numbers = [1, 2, 3]; // inferred as number[]
```

### 5. Gradual Adoption
Use `// @ts-expect-error` for temporary issues with a plan to fix:
```typescript
// @ts-expect-error - TODO: Fix after upgrading library
const result = legacyFunction();
```

## Common Patterns

### Pattern 1: Optional Props with Defaults
```typescript
interface Props {
  required: string;
  optional?: string;
}

function Component({ required, optional = 'default' }: Props) {
  // optional is now string, not string | undefined
}
```

### Pattern 2: Discriminated Unions
```typescript
type Success = { status: 'success'; data: Data };
type Error = { status: 'error'; error: string };
type Result = Success | Error;

function handle(result: Result) {
  if (result.status === 'success') {
    // TypeScript knows result.data exists
    console.log(result.data);
  } else {
    // TypeScript knows result.error exists
    console.log(result.error);
  }
}
```

### Pattern 3: Generic Components
```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return items.map(renderItem);
}
```

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [ESLint TypeScript Rules](https://typescript-eslint.io/rules/)
- [TYPE_SAFETY_GUIDE.md](./TYPE_SAFETY_GUIDE.md)
- [ESLINT_RULES_REFERENCE.md](./ESLINT_RULES_REFERENCE.md)

## Getting Help

1. Check existing documentation
2. Review type errors carefully
3. Use TypeScript playground for complex types
4. Ask in code reviews
5. Consult with team members

---

**Last Updated:** 2026-01-25
**Migration Start Date:** 2026-01-25
**Target Completion:** TBD

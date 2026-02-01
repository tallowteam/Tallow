# Type Safety Fixes Required

## Summary

TypeScript type checking revealed 61 type errors across the codebase. These need to be addressed systematically.

## Categories of Errors

### 1. Date vs Timestamp Conversion (18 errors)
Many files still use `Date` objects instead of timestamps (`number`).

**Affected Files:**
- `app/app/page.tsx` - Multiple Date assignments
- `components/transfer/file-selector-with-privacy.tsx`
- `components/transfer/file-selector.tsx`
- `lib/context/devices-context.tsx`

**Fix Pattern:**
```typescript
// Before
lastSeen: new Date()

// After
lastSeen: Date.now()
```

### 2. Missing Required Properties (10 errors)
Some objects are missing newly required properties from type updates.

**Affected Files:**
- `app/app/page.tsx` - Device objects missing `ip`, `port`, `avatar`
- `app/app/page.tsx` - FileWithData missing `path`, `lastModified`, `thumbnail`

**Fix Pattern:**
```typescript
// Before
const device = {
  id: '1',
  name: 'Device',
  platform: 'web',
  isOnline: true,
  isFavorite: false,
  lastSeen: Date.now()
};

// After
const device: Device = {
  id: '1',
  name: 'Device',
  platform: 'web',
  ip: null,
  port: null,
  avatar: null,
  isOnline: true,
  isFavorite: false,
  lastSeen: Date.now()
};
```

### 3. AppError Display in React (4 errors)
`AppError` objects can't be directly rendered in React components.

**Affected Files:**
- `components/app/GroupTransferProgress.tsx`
- `components/examples/group-transfer-example.tsx`
- `components/transfer/transfer-card-animated.tsx`
- `components/transfer/transfer-card.tsx`

**Fix Pattern:**
```typescript
// Before
<div>{error}</div> // error is AppError

// After
import { formatErrorMessage } from '@/lib/utils/error-handling';
<div>{error ? formatErrorMessage(error) : null}</div>
```

### 4. Index Signature Access (4 errors)
With `noPropertyAccessFromIndexSignature` enabled, need bracket notation.

**Affected Files:**
- `app/api/email/download/[id]/route.ts`
- `app/download/[id]/page.tsx`

**Fix Pattern:**
```typescript
// Before
params.id

// After
params['id']
```

### 5. Possibly Undefined Values (8 errors)
Need null checks before accessing properties.

**Affected Files:**
- `app/app/page.tsx` - `file` possibly undefined
- `components/ui/pqc-status-badge.tsx` - `info` possibly undefined
- `lib/search/search-utils.ts` - Several possibly undefined accesses

**Fix Pattern:**
```typescript
// Before
file.name

// After
file?.name ?? 'unknown'
```

### 6. Unused Variables (6 errors)
Variables declared but never used.

**Affected Files:**
- `app/api/email/download/[id]/route.ts` - `decryptWithPassword`
- `app/app/page.tsx` - Several unused handlers
- `lib/security/memory-protection.ts` - `key`

**Fix:** Remove or prefix with underscore if intentionally unused.

### 7. exactOptionalPropertyTypes Issues (5 errors)
Optional properties can't be explicitly set to undefined.

**Affected Files:**
- `lib/privacy/secure-deletion.ts`
- `lib/search/search-utils.ts`
- `lib/security/memory-protection.ts`

**Fix Pattern:**
```typescript
// Before
const options = {
  onProgress: callback || undefined
};

// After
const options = callback ? { onProgress: callback } : {};
```

### 8. Type Import Issues (2 errors)
Incorrect namespace usage for Fuse.js.

**Affected Files:**
- `lib/search/search-utils.ts`

**Fix Pattern:**
```typescript
// Before
type FuseOptions = Fuse.FuseOptions<SearchItem>;

// After
import type { IFuseOptions } from 'fuse.js';
type FuseOptions = IFuseOptions<SearchItem>;
```

### 9. Missing Properties in Interfaces (4 errors)
Some interfaces are missing required properties.

**Affected Files:**
- `app/api/email/download/[id]/route.ts` - `EncryptedFileMetadata` missing `version`
- `lib/chat/chat-manager.ts` - Missing `hmac` and `sequence`

**Fix:** Add missing properties to the data structures or update interfaces.

## Priority Fixes

### High Priority (Breaking functionality)
1. Fix AppError display in React components (4 errors)
2. Fix missing required properties in Device and FileWithData (10 errors)
3. Fix possibly undefined access (8 errors)

### Medium Priority (Type safety)
1. Convert Date to timestamps (18 errors)
2. Fix index signature access (4 errors)
3. Fix exactOptionalPropertyTypes (5 errors)

### Low Priority (Code quality)
1. Remove unused variables (6 errors)
2. Fix Fuse.js imports (2 errors)
3. Add missing interface properties (4 errors)

## Recommended Approach

1. **Create helper functions** for error message formatting:
```typescript
// lib/utils/error-display.ts
export function getErrorMessage(error: AppError | string | null): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  return formatErrorMessage(error);
}
```

2. **Create Device factory function**:
```typescript
// lib/utils/device-factory.ts
export function createDevice(partial: Partial<Device> & Pick<Device, 'id' | 'name' | 'platform'>): Device {
  return {
    ip: null,
    port: null,
    avatar: null,
    isOnline: false,
    isFavorite: false,
    lastSeen: Date.now(),
    ...partial
  };
}
```

3. **Create FileInfo factory function**:
```typescript
// lib/utils/file-factory.ts
export function createFileInfo(file: File): FileInfo {
  return {
    id: generateUUID(),
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    path: null,
    thumbnail: null,
    hash: undefined
  };
}
```

## Automated Fix Script

For bulk Date-to-timestamp conversions:

```bash
# Replace Date objects with timestamps
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/new Date()/Date.now()/g'
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/lastSeen: Date/lastSeen: number/g'
```

## Testing After Fixes

1. Run type check: `npm run type-check`
2. Run tests: `npm test`
3. Build application: `npm run build`
4. Test in browser with specific scenarios

## Next Steps

1. Create helper utilities (error-display, device-factory, file-factory)
2. Fix high-priority errors first (React rendering, required properties)
3. Run type-check after each batch of fixes
4. Update tests to match new types
5. Document any breaking changes

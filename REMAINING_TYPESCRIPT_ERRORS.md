# Remaining TypeScript Errors - Quick Fix Guide

## Current Status: 95 errors remaining

## Quick Fixes by Category

### 1. Unused Variables (Simple - 15 errors)
**Fix:** Prefix with underscore or remove

```typescript
// Before:
import { vi, beforeEach } from 'vitest';

// After:
import { describe, it, expect } from 'vitest';
// OR
import { vi as _vi, beforeEach as _beforeEach } from 'vitest';
```

**Files:**
- tests/unit/chat-security.test.ts
- tests/unit/crypto/key-management.test.ts
- tests/unit/crypto/password-protection.test.ts
- tests/unit/crypto/sparse-pq-ratchet.test.ts
- tests/unit/crypto/triple-ratchet.test.ts
- tests/unit/media-capture.test.ts
- tests/unit/media/screen-recording.test.ts
- tests/unit/metadata-stripper.test.ts
- tests/unit/privacy/secure-deletion.test.ts
- tests/unit/security/memory-protection.test.ts
- tests/unit/transfer/transfer-mode-integration.test.ts
- tests/e2e/group-transfer-integration.spec.ts
- tests/e2e/group-transfer.spec.ts

### 2. Object Possibly Undefined (30+ errors)
**Fix:** Add non-null assertions or optional chaining

```typescript
// Before:
expect(result.data.field).toBe(expected);

// After Option 1: Optional chaining
expect(result.data?.field).toBe(expected);

// After Option 2: Non-null assertion (if guaranteed to exist)
expect(result.data!.field).toBe(expected);

// After Option 3: Assertion first
expect(result.data).toBeDefined();
expect(result.data.field).toBe(expected);
```

**Files:**
- tests/unit/crypto/peer-authentication.test.ts (1)
- tests/unit/crypto/pq-signatures.test.ts (2)
- tests/unit/device-converters.test.ts (12)
- tests/unit/privacy/secure-deletion.test.ts (6)
- tests/unit/search/search-utils.test.ts (8)
- tests/unit/transfer/encryption-chacha.test.ts (1)
- tests/unit/transport/onion-routing.test.ts (3)

### 3. Date vs Number Type Mismatches (10+ errors)
**Fix:** Use Date objects where required

```typescript
// In DiscoveredDevice context:
lastSeen: new Date()  // NOT Date.now()

// In Device context:
lastSeen: Date.now()  // NOT new Date()

// In Friend context:
addedAt: new Date()
lastConnected: new Date()  // NOT Date.now()
```

**Files:**
- tests/unit/device-converters.test.ts (already partially fixed)
- tests/unit/transfer/transfer-mode-integration.test.ts (3 errors at lines 81, 89, 97)

### 4. Playwright API Issues (3 errors)
**Fix:** Remove invalid hasText property from click options

```typescript
// Before:
await button.click({ hasText: 'Start Capture' });

// After:
const button = page.getByRole('button', { name: 'Start Capture' });
await button.click();
```

**Files:**
- tests/e2e/camera-capture.spec.ts (lines 124, 209, 232)

### 5. RangeTuple Type Issues (4 errors)
**Fix:** Use proper tuple type [number, number]

```typescript
// Before:
const ranges: number[][] = [[0, 5], [10, 15]];

// After:
const ranges: [number, number][] = [[0, 5], [10, 15]];
// OR
const ranges: RangeTuple[] = [[0, 5], [10, 15]];
```

**Files:**
- tests/unit/search/search-utils.test.ts (lines 235, 247, 258, 270)

### 6. exactOptionalPropertyTypes Issues (2 errors)
**Fix:** Don't pass undefined to optional properties

```typescript
// Before:
const options = { mode: someValue };  // where someValue might be undefined

// After:
const options = someValue ? { mode: someValue } : {};
// OR
const options = { mode: someValue ?? 'default' };
```

**Files:**
- tests/unit/privacy/secure-deletion.test.ts (line 253)

### 7. Variable Scope Issues (5 errors)
**Fix:** Use correct variable names or fix scoping

```typescript
// Before:
const _stream = await getStream();
// ... later ...
stream.getTracks();  // ERROR: stream not defined

// After:
const stream = await getStream();
// ... later ...
stream.getTracks();  // OK
```

**Files:**
- tests/unit/media/screen-recording.test.ts (lines 112-123)

### 8. Type Compatibility Issues

#### Device Type Mismatch (1 error)
**File:** tests/unit/device-converters.test.ts (line 409)
**Fix:** Ensure all required properties are present

```typescript
const device: Device = {
  id: '123',
  name: 'Test Device',
  platform: 'web',
  ip: null,
  port: null,
  isOnline: true,
  isFavorite: false,
  lastSeen: Date.now(),
  avatar: null,
};
```

#### Comparison Type Mismatch (1 error)
**File:** tests/unit/transfer/transfer-mode-integration.test.ts (line 587)
**Fix:** Use correct type for comparison

```typescript
// Before:
if (mode === 'single') // where mode is 'group'

// After:
if (mode === 'group')  // Use correct value
```

#### Missing Property (2 errors)
**File:** tests/unit/crypto/password-protection.test.ts (lines 294-295)
**Fix:** Use correct property names from EncryptedFileMetadata interface

## Batch Fix Scripts

### Fix All Unused Imports
```bash
# Remove unused vi imports
find tests -name "*.test.ts*" -exec sed -i '/import.*vi.*vitest/d' {} \;

# Add underscore to unused variables
find tests -name "*.test.ts*" -exec sed -i 's/const \(vi\|beforeEach\|stream\) =/const _\1 =/g' {} \;
```

### Fix All Date Types in DiscoveredDevice
```bash
find tests -name "*.test.ts" -exec sed -i 's/lastSeen: Date\.now()/lastSeen: new Date()/g' {} \;
```

## Priority Order for Fixing

1. **Quick wins (15 min):** Unused variables - prefix with underscore
2. **Medium effort (30 min):** Playwright API fixes and RangeTuple fixes
3. **Systematic fixes (1 hour):** Object undefined checks - add proper assertions
4. **Careful review (1 hour):** Date vs number type fixes - understand context
5. **Complex (2 hours):** Create test helper utilities to prevent future issues

## Test Helper Creation (Recommended)

Create `tests/helpers/mocks.ts`:

```typescript
import type { Device, Transfer, FileInfo, Friend } from '@/lib/types';
import type { DiscoveredDevice } from '@/lib/discovery/local-discovery';

export function createMockDevice(overrides?: Partial<Device>): Device {
  return {
    id: 'mock-device-' + Math.random(),
    name: 'Mock Device',
    platform: 'web',
    ip: null,
    port: null,
    isOnline: true,
    isFavorite: false,
    lastSeen: Date.now(),
    avatar: null,
    ...overrides,
  };
}

export function createMockTransfer(overrides?: Partial<Transfer>): Transfer {
  const now = Date.now();
  return {
    id: 'mock-transfer-' + Math.random(),
    files: [createMockFileInfo()],
    from: createMockDevice(),
    to: createMockDevice(),
    status: 'pending',
    progress: 0,
    speed: 0,
    direction: 'send',
    totalSize: 1024,
    transferredSize: 0,
    startTime: now,
    endTime: null,
    error: null,
    eta: null,
    quality: 'good',
    encryptionMetadata: null,
    ...overrides,
  };
}

export function createMockFileInfo(overrides?: Partial<FileInfo>): FileInfo {
  return {
    id: 'mock-file-' + Math.random(),
    name: 'test.txt',
    size: 1024,
    type: 'text/plain',
    lastModified: Date.now(),
    hash: 'mock-hash',
    thumbnail: null,
    path: null,
    ...overrides,
  };
}

export function createMockDiscoveredDevice(overrides?: Partial<DiscoveredDevice>): DiscoveredDevice {
  return {
    id: 'discovered-' + Math.random(),
    name: 'Discovered Device',
    platform: 'web',
    lastSeen: new Date(),
    isOnline: true,
    ...overrides,
  };
}

export function createMockFriend(overrides?: Partial<Friend>): Friend {
  return {
    id: 'friend-' + Math.random(),
    name: 'Mock Friend',
    friendCode: 'CODE' + Math.random().toString(36).substr(2, 9),
    requirePasscode: false,
    trustLevel: 'trusted',
    connectionPreferences: {
      preferredMethod: 'direct',
      allowedMethods: ['direct'],
    },
    addedAt: new Date(),
    ...overrides,
  };
}
```

Then use in tests:
```typescript
import { createMockDevice, createMockTransfer } from '@/tests/helpers/mocks';

const device = createMockDevice({ name: 'Custom Name' });
const transfer = createMockTransfer({ status: 'completed' });
```

## Estimated Time to Zero Errors

- With helper functions: **2-3 hours**
- Without helper functions: **4-6 hours**

## Recommended Next Steps

1. Create test helper file
2. Fix all unused variables (bulk find/replace)
3. Fix Playwright API issues (3 locations)
4. Fix RangeTuple issues (4 locations)
5. Add proper assertions to handle undefined cases
6. Review and fix remaining edge cases

Total remaining: **95 errors** → Target: **0 errors**

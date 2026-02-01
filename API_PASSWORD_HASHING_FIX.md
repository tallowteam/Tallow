# Critical Fix: Password Hashing in Rooms API

**Priority:** HIGH
**File:** `app/api/rooms/route.ts`
**Issue:** Using SHA-256 instead of password-specific hashing algorithm

---

## Problem

The current implementation uses SHA-256 for password hashing:

```typescript
// Lines 211-218 in app/api/rooms/route.ts
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

**Why This Is Insecure:**
- SHA-256 is too fast (allows brute-force attacks)
- No salt (vulnerable to rainbow table attacks)
- No work factor (can't increase difficulty over time)
- Not designed for password storage

---

## Solution Options

### Option 1: bcrypt (Recommended)

**Pros:**
- Industry standard
- Automatic salting
- Configurable work factor
- Wide library support

**Install:**
```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

**Implementation:**
```typescript
import bcrypt from 'bcryptjs';

/**
 * Hash password using bcrypt (secure for password storage)
 * @param password - Plain text password
 * @returns Hashed password with salt
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10; // 2^10 iterations
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify password against hash
 * @param password - Plain text password
 * @param hash - Stored password hash
 * @returns true if password matches
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
```

---

### Option 2: argon2 (Most Secure)

**Pros:**
- Winner of Password Hashing Competition (2015)
- Memory-hard (resistant to GPU attacks)
- Configurable memory, time, parallelism
- Recommended by OWASP

**Install:**
```bash
npm install argon2
npm install --save-dev @types/argon2
```

**Implementation:**
```typescript
import argon2 from 'argon2';

/**
 * Hash password using Argon2id (most secure)
 * @param password - Plain text password
 * @returns Hashed password with salt
 */
async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, {
    type: argon2.argon2id, // Hybrid of argon2i and argon2d
    memoryCost: 65536,     // 64 MB
    timeCost: 3,           // 3 iterations
    parallelism: 4,        // 4 threads
  });
}

/**
 * Verify password against hash
 * @param password - Plain text password
 * @param hash - Stored password hash
 * @returns true if password matches
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}
```

---

### Option 3: scrypt (Node.js Built-in)

**Pros:**
- No dependencies (built into Node.js)
- Memory-hard algorithm
- Secure for password storage

**Implementation:**
```typescript
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

/**
 * Hash password using scrypt (Node.js built-in)
 * @param password - Plain text password
 * @returns Hashed password with salt (format: salt.hash)
 */
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  return `${salt}.${derivedKey.toString('hex')}`;
}

/**
 * Verify password against hash
 * @param password - Plain text password
 * @param hash - Stored password hash (format: salt.hash)
 * @returns true if password matches
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, storedHash] = hash.split('.');
  const storedHashBuffer = Buffer.from(storedHash, 'hex');
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;

  return timingSafeEqual(storedHashBuffer, derivedKey);
}
```

---

## Complete Fixed Code

### Using bcrypt (Recommended for Most Cases)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { secureLog } from '@/lib/utils/secure-logger';
import bcrypt from 'bcryptjs';

/**
 * Room API Routes
 * Handles room persistence and cleanup
 */

// In-memory room storage (in production, use Redis or a database)
const rooms = new Map<string, {
  id: string;
  code: string;
  name: string;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  expiresAt: string | null;
  isPasswordProtected: boolean;
  passwordHash?: string;
  maxMembers: number;
  members: any[];
}>();

// Cleanup expired rooms every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (room.expiresAt && new Date(room.expiresAt).getTime() < now) {
      rooms.delete(code);
      secureLog.log(`[Rooms API] Cleaned up expired room: ${code}`);
    }
  }
}, 5 * 60 * 1000);

/**
 * GET /api/rooms?code=XXXXX - Get room info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code')?.toUpperCase();

    if (!code) {
      return NextResponse.json(
        { error: 'Room code is required' },
        { status: 400 }
      );
    }

    const room = rooms.get(code);

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Check if expired
    if (room.expiresAt && new Date(room.expiresAt).getTime() < Date.now()) {
      rooms.delete(code);
      return NextResponse.json(
        { error: 'Room has expired' },
        { status: 410 }
      );
    }

    // Return room info (without password hash)
    return NextResponse.json({
      id: room.id,
      code: room.code,
      name: room.name,
      ownerId: room.ownerId,
      ownerName: room.ownerName,
      createdAt: room.createdAt,
      expiresAt: room.expiresAt,
      isPasswordProtected: room.isPasswordProtected,
      maxMembers: room.maxMembers,
      memberCount: room.members.length,
    });
  } catch (error) {
    secureLog.error('[Rooms API] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rooms - Create a new room
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, code, name, ownerId, ownerName, password, expiresAt, maxMembers } = body;

    // Validate required fields
    if (!id || !code || !ownerId || !ownerName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if code already exists
    if (rooms.has(code)) {
      return NextResponse.json(
        { error: 'Room code already exists' },
        { status: 409 }
      );
    }

    // Hash password if provided (SECURE: using bcrypt)
    let passwordHash: string | undefined;
    if (password) {
      passwordHash = await hashPassword(password);
    }

    // Create room
    const room = {
      id,
      code,
      name: name || `Room ${code}`,
      ownerId,
      ownerName,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt || null,
      isPasswordProtected: !!password,
      ...(passwordHash ? { passwordHash } : {}),
      maxMembers: maxMembers || 10,
      members: [],
    };

    rooms.set(code, room);

    secureLog.log(`[Rooms API] Created room: ${code}`);

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        code: room.code,
        name: room.name,
        ownerId: room.ownerId,
        createdAt: room.createdAt,
        expiresAt: room.expiresAt,
        isPasswordProtected: room.isPasswordProtected,
        maxMembers: room.maxMembers,
      },
    });
  } catch (error) {
    secureLog.error('[Rooms API] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rooms?code=XXXXX - Delete a room
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code')?.toUpperCase();
    const ownerId = searchParams.get('ownerId');

    if (!code || !ownerId) {
      return NextResponse.json(
        { error: 'Room code and owner ID are required' },
        { status: 400 }
      );
    }

    const room = rooms.get(code);

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (room.ownerId !== ownerId) {
      return NextResponse.json(
        { error: 'Only the room owner can delete the room' },
        { status: 403 }
      );
    }

    rooms.delete(code);

    secureLog.log(`[Rooms API] Deleted room: ${code}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    secureLog.error('[Rooms API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * SECURE PASSWORD HASHING using bcrypt
 * Replaces the insecure SHA-256 implementation
 */

/**
 * Hash password using bcrypt (industry standard)
 * @param password - Plain text password
 * @returns Hashed password with salt
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10; // 2^10 iterations (recommended)
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify password against bcrypt hash
 * @param password - Plain text password
 * @param hash - Stored password hash
 * @returns true if password matches
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
```

---

## Testing the Fix

### Unit Test

```typescript
import { describe, it, expect } from 'vitest';

describe('Password Hashing', () => {
  it('should hash passwords securely', async () => {
    const password = 'TestPassword123!';
    const hash = await hashPassword(password);

    // Hash should not equal password
    expect(hash).not.toBe(password);

    // Hash should be long enough (bcrypt hashes are 60 chars)
    expect(hash.length).toBeGreaterThan(50);

    // Hash should start with bcrypt prefix
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it('should verify correct passwords', async () => {
    const password = 'TestPassword123!';
    const hash = await hashPassword(password);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject incorrect passwords', async () => {
    const password = 'TestPassword123!';
    const hash = await hashPassword(password);

    const isValid = await verifyPassword('WrongPassword', hash);
    expect(isValid).toBe(false);
  });

  it('should generate different hashes for same password', async () => {
    const password = 'TestPassword123!';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    // Different salts should produce different hashes
    expect(hash1).not.toBe(hash2);

    // But both should verify correctly
    expect(await verifyPassword(password, hash1)).toBe(true);
    expect(await verifyPassword(password, hash2)).toBe(true);
  });
});
```

### Integration Test

```typescript
import { describe, it, expect } from 'vitest';

describe('Room Password Protection', () => {
  it('should create password-protected room', async () => {
    const response = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'test-123',
        code: 'ABCD',
        name: 'Test Room',
        ownerId: 'user-123',
        ownerName: 'Test User',
        password: 'SecurePassword123!',
      }),
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.room.isPasswordProtected).toBe(true);
    expect(data.room.passwordHash).toBeUndefined(); // Should not be returned
  });
});
```

---

## Migration Plan

### Step 1: Install Dependencies

```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

### Step 2: Update Code

Replace the password hashing functions in `app/api/rooms/route.ts` with the bcrypt implementation above.

### Step 3: Test

Run the unit tests to verify the implementation:

```bash
npm test app/api/rooms/route.test.ts
```

### Step 4: Deploy

Deploy the fix to production. No database migration needed since rooms are stored in-memory.

### Step 5: Monitor

Monitor logs for any password verification failures.

---

## Performance Comparison

| Algorithm | Hash Time | Security | Recommendation |
|-----------|-----------|----------|----------------|
| SHA-256 (current) | <1ms | ⚠️ INSECURE | DO NOT USE |
| bcrypt (10 rounds) | ~100ms | ✅ Good | RECOMMENDED |
| argon2id | ~200ms | ✅ Excellent | Best for high security |
| scrypt | ~150ms | ✅ Good | If no dependencies needed |

**Note:** Slower hash times are GOOD for passwords - they prevent brute-force attacks.

---

## Recommendation

**Use bcrypt** for this fix:
- Industry standard
- Good security/performance balance
- Simple to implement
- Well-tested library
- 100ms hash time is acceptable for login operations

If maximum security is required, use argon2id instead.

---

## Additional Security Considerations

1. **Password Policy**
   - Minimum length: 8 characters
   - Require mix of letters, numbers, symbols
   - Prevent common passwords

2. **Rate Limiting**
   - Add rate limiting to password verification
   - Lock room after 5 failed attempts
   - Temporary cooldown period

3. **Password Strength Meter**
   - Show password strength to users
   - Encourage strong passwords

4. **Audit Logging**
   - Log failed password attempts
   - Alert on suspicious activity

---

**Priority:** HIGH - Implement before production deployment
**Estimated Time:** 30 minutes
**Complexity:** Low
**Risk:** Low (backward compatible if no rooms exist yet)

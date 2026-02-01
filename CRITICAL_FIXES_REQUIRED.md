# Critical Security Fixes Required - Immediate Action

**Date:** 2026-01-28
**Priority:** URGENT
**Review:** CODE_QUALITY_SECURITY_REVIEW.md

---

## Critical Issues Requiring Immediate Attention

### 🔴 CRITICAL #1: Lazy-Loading Race Condition (MUST FIX NOW)

**File:** `lib/crypto/pqc-crypto-lazy.ts` (Lines 159-173)

**Problem:**
```typescript
// CURRENT - BROKEN
serializeKeypairPublic(keyPair: HybridKeyPair): Uint8Array {
    if (!this.pqcService) {
        throw new Error('PQC crypto not loaded...');
    }
    return this.pqcService.serializeKeypairPublic(keyPair);
}
```

**Fix:**
```typescript
// ADD NULL CHECKS + VALIDATION
serializeKeypairPublic(keyPair: HybridKeyPair): Uint8Array {
    if (!this.pqcService) {
        throw new Error('PQC crypto not loaded. Call preload() first.');
    }
    if (!keyPair?.kyber?.publicKey || !keyPair?.x25519?.publicKey) {
        throw new Error('Invalid keypair structure');
    }
    return this.pqcService.serializeKeypairPublic(keyPair);
}

// DO SAME FOR randomBytes() and hash()
```

**Impact:** Application crashes, DoS vulnerability
**Effort:** 30 minutes

---

### 🔴 CRITICAL #2: Insecure localStorage Usage (HIGH PRIORITY)

**Files:** 50+ files using direct localStorage

**Problem:**
```typescript
// INSECURE - Found in pqc-transfer-manager.ts, app/page.tsx, etc.
const setting = localStorage.getItem('tallow_advanced_privacy_mode');
localStorage.setItem('tallow_key_rotation_interval', value);
```

**Fix:**
```typescript
// USE SECURE STORAGE
import { secureStorage } from '@/lib/storage/secure-storage';

const setting = await secureStorage.getItem('tallow_advanced_privacy_mode');
await secureStorage.setItem('tallow_key_rotation_interval', value);
```

**Files to Fix:**
- `lib/transfer/pqc-transfer-manager.ts` (Lines 169, 434-444)
- `app/app/page.tsx` (Lines 456-463)
- `app/app/settings/page.tsx` (All settings)
- `lib/init/privacy-init.ts` (Privacy settings)
- `lib/hooks/use-resumable-transfer.ts` (Transfer state)

**Impact:** XSS vulnerability, data exposure
**Effort:** 2-3 hours

---

### 🟠 HIGH #3: XSS Risk in Email Template

**File:** `app/api/send-share-email/route.ts` (Lines 50-89)

**Problem:**
```typescript
// URL NOT VALIDATED
function buildShareEmailHtml(shareUrl: string, ...): string {
    return `<a href="${shareUrl}">Download</a>`; // XSS RISK
}
```

**Fix:**
```typescript
function sanitizeUrl(url: string): string {
    try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('Invalid protocol');
        }
        return parsed.toString();
    } catch {
        throw new Error('Invalid URL');
    }
}

function buildShareEmailHtml(shareUrl: string, ...): string {
    const safeUrl = sanitizeUrl(shareUrl);
    return `<a href="${escapeHtml(safeUrl)}">Download</a>`;
}
```

**Impact:** XSS attack via malicious URLs
**Effort:** 1 hour

---

### 🟠 HIGH #4: Recursive ACK Timeout (Stack Overflow Risk)

**File:** `lib/transfer/pqc-transfer-manager.ts` (Lines 857-875)

**Problem:**
```typescript
// RECURSIVE - STACK OVERFLOW RISK
private async waitForAck(chunkIndex: number, retries = 0): Promise<void> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            if (retries < MAX_RETRIES) {
                resolve(this.waitForAck(chunkIndex, retries + 1)); // RECURSION!
            }
        }, ACK_TIMEOUT);
    });
}
```

**Fix:**
```typescript
// ITERATIVE APPROACH
private async waitForAck(chunkIndex: number): Promise<void> {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    this.pendingAcks.delete(chunkIndex);
                    reject(new Error(`ACK timeout for chunk ${chunkIndex}`));
                }, ACK_TIMEOUT);

                this.pendingAcks.set(chunkIndex, () => {
                    clearTimeout(timeout);
                    resolve();
                });
            });
            return; // Success
        } catch (e) {
            if (attempt === MAX_RETRIES) throw e;
            secureLog.log(`Retry ${attempt + 1} for chunk ${chunkIndex}`);
        }
    }
}
```

**Impact:** Stack overflow, memory leak
**Effort:** 1 hour

---

### 🟡 MEDIUM #5: Missing CSRF Protection

**File:** `app/api/send-share-email/route.ts` (Lines 92-172)

**Problem:**
```typescript
export async function POST(request: NextRequest) {
    const authError = requireApiKey(request);
    // NO CSRF TOKEN CHECK
}
```

**Fix:**
```typescript
import { validateCSRFToken } from '@/lib/security/csrf';

export async function POST(request: NextRequest) {
    // Add CSRF validation
    const csrfToken = request.headers.get('x-csrf-token');
    if (!validateCSRFToken(csrfToken)) {
        return NextResponse.json(
            { error: 'Invalid CSRF token' },
            { status: 403 }
        );
    }

    const authError = requireApiKey(request);
    if (authError) return authError;
    // ...
}
```

**Impact:** CSRF attack, spam abuse
**Effort:** 2 hours

---

### 🟡 MEDIUM #6: Memory Leak in Connection Manager

**File:** `app/app/page.tsx` (Lines 326-394)

**Problem:**
```typescript
// NO CLEANUP ON UNMOUNT
const connectionManager = useRef<ConnectionManager | null>(null);
const peerConnection = useRef<RTCPeerConnection | null>(null);
const dataChannel = useRef<RTCDataChannel | null>(null);
const pqcManager = useRef<PQCTransferManager | null>(null);
```

**Fix:**
```typescript
useEffect(() => {
    // Cleanup on component unmount
    return () => {
        if (connectionTimeout.current) {
            clearTimeout(connectionTimeout.current);
        }
        if (dataChannel.current) {
            dataChannel.current.close();
            dataChannel.current = null;
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (pqcManager.current) {
            pqcManager.current.destroy();
            pqcManager.current = null;
        }
        if (connectionManager.current) {
            connectionManager.current.disconnect();
            connectionManager.current = null;
        }
        pendingCandidates.current = [];
    };
}, []);
```

**Impact:** Memory leaks, dangling connections
**Effort:** 1 hour

---

## Quick Fix Checklist

### Day 1 (4-5 hours)
- [ ] Fix lazy-loading null checks (#1) - 30 min
- [ ] Fix recursive ACK logic (#4) - 1 hour
- [ ] Add URL sanitization (#3) - 1 hour
- [ ] Add connection cleanup (#6) - 1 hour
- [ ] Test critical paths - 1-2 hours

### Day 2 (3-4 hours)
- [ ] Migrate 10 most critical localStorage calls to secureStorage (#2)
- [ ] Add CSRF protection to email endpoint (#5)
- [ ] Test email and storage functionality

### Day 3 (2-3 hours)
- [ ] Complete remaining localStorage migrations (#2)
- [ ] Add ESLint rules to prevent future issues
- [ ] Update documentation

---

## Testing Priorities

After fixes, test these scenarios:

1. **PQC Key Exchange**
   - [ ] Rapid connect/disconnect cycles
   - [ ] Simultaneous connections from both sides
   - [ ] Connection timeout handling

2. **File Transfer**
   - [ ] Large files (>100MB)
   - [ ] Connection loss during transfer
   - [ ] ACK timeout scenarios

3. **Email Functionality**
   - [ ] Malicious URL injection attempts
   - [ ] CSRF attack simulation
   - [ ] Rate limit testing

4. **Storage Security**
   - [ ] Verify all sensitive data encrypted
   - [ ] Test XSS resistance
   - [ ] Browser extension isolation

5. **Memory Leaks**
   - [ ] Multiple connection cycles
   - [ ] Long-running sessions
   - [ ] Browser memory profiling

---

## ESLint Rules to Add

```javascript
// .eslintrc.js
rules: {
  // Prevent direct localStorage usage
  'no-restricted-globals': [
    'error',
    {
      name: 'localStorage',
      message: 'Use secureStorage instead of localStorage for sensitive data'
    }
  ],

  // Prevent direct console usage
  'no-console': ['error', { allow: ['warn', 'error'] }],

  // Require explicit return types
  '@typescript-eslint/explicit-function-return-type': 'warn',

  // Prevent any type
  '@typescript-eslint/no-explicit-any': 'error'
}
```

---

## Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run security checks
npm run security-check

# Run type checking
npm run type-check

# Run linting
npm run lint

# Run critical tests
npm run test:critical
```

---

## Monitoring After Deployment

1. **Error Tracking**
   - Monitor for null reference errors in PQC crypto
   - Track ACK timeout failures
   - Watch for memory usage spikes

2. **Security Monitoring**
   - Alert on suspicious email patterns
   - Track CSRF token failures
   - Monitor localStorage access attempts

3. **Performance Metrics**
   - Measure connection success rate
   - Track transfer completion times
   - Monitor memory usage trends

---

## Success Criteria

Before marking as complete:

- [ ] All 6 critical issues fixed
- [ ] No TypeScript errors
- [ ] All tests passing
- [ ] ESLint rules added
- [ ] Pre-commit hooks working
- [ ] Security scan clean (Snyk/Dependabot)
- [ ] Manual testing completed
- [ ] Code review approval
- [ ] Documentation updated

---

## Questions?

Refer to full report: `CODE_QUALITY_SECURITY_REVIEW.md`

Contact: Development team lead
Priority: **URGENT - Start immediately**

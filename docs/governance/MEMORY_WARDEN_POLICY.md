# MEMORY-WARDEN Policy (Agent 017)

> Every secret has a destructor. Every key has a TTL.

## Status: ENFORCED

## Scope

This policy governs the lifecycle of all cryptographic secrets, session keys,
shared secrets, password derivatives, and any other sensitive material that
transits memory within the Tallow frontend application.

## Rules

### R1 -- Every Secret Has a Destructor

Every `Uint8Array` containing key material, shared secrets, password hashes,
or derived keys MUST be zeroed immediately after use. The zeroing call MUST
appear inside a `finally` block so that it executes even when an exception
is thrown.

```typescript
try {
  const key = deriveKey(password);
  // use key ...
} finally {
  secureWipeBuffer(key);
}
```

Alternatively, callers may use `SecureWrapper.use()` or `ProtectedSecureWrapper`
which dispose automatically.

### R2 -- Every Key Has a TTL

All session keys stored in the `EphemeralKeyManager` MUST have an explicit
`expiresAt` timestamp. The default TTL is 5 minutes (`KEY_LIFETIME_MS`).
A timer MUST be scheduled via `scheduleKeyDeletion` for every key. When the
timer fires, the key material is securely wiped.

### R3 -- SecureStorage for ALL Persistent Secrets

No raw secret may be written to `localStorage` or `sessionStorage`. All
persistent secrets MUST go through one of:

- `secureStorage` (AES-256-GCM encrypted localStorage wrapper)
- `SecureVault` (IndexedDB with AES-256-GCM and PBKDF2-derived master key)
- Non-extractable `CryptoKey` objects in IndexedDB

The static verifier (`verify-memory-warden.js`) scans for violations.

### R4 -- NO Secrets in Redux/Zustand

Zustand stores (or any client-side state management layer) MUST NOT contain:

- Private keys (`privateKey`, `secretKey`)
- Shared secrets (`sharedSecret`)
- Password derivatives or raw passwords
- Session encryption keys

Public keys, credential IDs, and non-secret metadata are permitted.

### R5 -- NO Secrets in Error Messages

Error messages, Sentry breadcrumbs, and log calls MUST NOT include:

- Key material (even truncated)
- Passwords or password hashes
- Shared secrets or session keys
- Raw `Uint8Array` content of secrets

Session IDs, public key hashes, and non-secret metadata are permitted when
truncated (e.g., `sessionId.slice(0, 8) + '...'`).

### R6 -- TypedArrays Only for Secrets

Secret material MUST be held in `Uint8Array` (or other TypedArray), never in
JavaScript strings. Strings are immutable and cannot be zeroed from memory.

### R7 -- FinalizationRegistry as Safety Net

`FinalizationRegistry` MAY be used as a backup to catch wrappers that were
not explicitly disposed, but it MUST NOT be relied upon as the primary
cleanup mechanism. Explicit `dispose()` in `finally` blocks is required.

## Verification

### Automated (CI)

```
npm run verify:memory-warden
```

The verifier checks:

| Check | What it scans |
|-------|---------------|
| Zustand secret leak | Store files for `privateKey`, `secretKey`, `sharedSecret`, `password` fields |
| Error message leak | `throw new Error(...)` and `console.error(...)` for key/secret tokens |
| localStorage direct write | Direct `localStorage.setItem` with sensitive key names |
| sessionStorage write | Any `sessionStorage.setItem` with secret data |
| Missing finally-block wipe | Key derivation without adjacent `finally { ... wipe }` |
| String secrets | `password: string` parameters passed to non-derivation functions |

### Manual (Release)

Before each release, Agent 017 verifies:

1. Heap snapshot after transfer: no key material survives.
2. `EphemeralKeyManager.getStats()` returns zero active keys post-session.
3. `getMemoryProtectionStatus()` shows zero active wrappers post-session.

## Affected Files

| File | Role |
|------|------|
| `lib/security/memory-wiper.ts` | Core wipe primitives (`secureWipeBuffer`, `SecureWrapper`) |
| `lib/security/memory-protection.ts` | Pool, canary, heap-inspection detection |
| `lib/storage/secure-storage.ts` | Encrypted localStorage wrapper |
| `lib/crypto/vault.ts` | IndexedDB encrypted vault |
| `lib/crypto/key-management.ts` | Ephemeral key lifecycle and Double Ratchet |
| `lib/hooks/use-secure-storage.ts` | React hook for encrypted storage |
| `lib/storage/migrate-to-secure.ts` | Migration from plaintext to encrypted storage |

## Exceptions

None. All secret material is subject to this policy without exception. If a
new module needs to hold secrets, it MUST integrate with `SecureWrapper` or
`ProtectedSecureWrapper` and register for `finally`-block cleanup.

## Changelog

| Date | Change |
|------|--------|
| 2026-02-13 | Initial policy created and enforced by Agent 017 |

# Security & Privacy Review

**Analysis Date:** 2026-01-23
**Scope:** Full codebase security and privacy audit

---

## CRITICAL Issues

### 1. Transfer Verification Gate Blocks All Sends (CRITICAL - Transfer Bug)
- **File:** `app/app/page.tsx:906-909`
- **Issue:** `handleStartTransfer` requires `peerVerified === true` before allowing file send. However, `peerVerified` is only set via `setPeerVerified(true)` at line 306, which runs when `isPeerVerified(peerId)` returns true (already-verified peer). For **first-time connections**, the verification dialog opens but closing/confirming it sets `verificationSession` state - it does NOT set `peerVerified = true`. The `confirmVerification` handler in the dialog calls `markSessionVerified()` but never calls `setPeerVerified(true)`.
- **Impact:** First-time transfers ALWAYS fail with "Peer verification required before sending files" even after user confirms SAS verification.
- **Fix:** In the verification dialog's confirm handler, add `setPeerVerified(true)` after `markSessionVerified()`.

### 2. Signaling Encryption Fallback to Plaintext (HIGH)
- **File:** `lib/signaling/connection-manager.ts:233-239, 245-251`
- **Issue:** Both `encryptPayload` and `decryptPayload` silently fall back to unencrypted data if encryption/decryption fails. An attacker who modifies ciphertext will trigger decryption failure, causing the system to use the attacker's modified plaintext.
- **Impact:** Signaling messages (offers, answers, ICE candidates) could be silently downgraded to plaintext by a network attacker, enabling MITM on the WebRTC connection.
- **Fix:** On encryption failure, abort the signaling operation. On decryption failure, reject the message and notify the user.

### 3. Deprecated `crypto-js` Dependency (HIGH)
- **File:** `package.json`
- **Issue:** `crypto-js` ^4.2.0 is a deprecated library with known vulnerabilities. The maintainer has explicitly recommended against its use.
- **Impact:** Potential cryptographic weaknesses in any code path using crypto-js.
- **Fix:** Audit usage (likely in `lib/storage/secure-storage.ts`), replace with Web Crypto API, remove dependency.

### 4. DH Public Key Validation Insufficient (HIGH)
- **File:** `lib/hooks/use-p2p-connection.ts:318-330`
- **Issue:** Only validates key length and all-zero check. Does not validate against other low-order X25519 points (e.g., points of small order). While `@noble/curves` handles clamping, a malicious peer could potentially send a contributory-nothing key.
- **Impact:** Weakened DH shared secret if attacker provides a low-order point.
- **Fix:** Use `x25519.utils.isValidPublicKey()` or reject keys where `getSharedSecret` produces all-zeros output.

### 5. Deserialization Accepts Untrusted Lengths (HIGH)
- **File:** `lib/crypto/pqc-crypto.ts:444-465`
- **Issue:** `kyberLen` is read from untrusted serialized data. Bounds check uses hardcoded 2048 but ML-KEM-768 ciphertext is 1088 bytes and public key is 1184 bytes. Oversized values could cause memory exhaustion.
- **Impact:** Denial of service via crafted messages causing OOM.
- **Fix:** Use exact expected sizes for ML-KEM-768 (reject anything else).

---

## HIGH Issues

### 6. Welcome Email Endpoint Has No Rate Limiting (HIGH)
- **File:** `app/api/send-welcome/route.ts:28-34`
- **Issue:** POST endpoint sends emails without rate limiting, CSRF protection, or email format validation.
- **Impact:** Attacker can spam arbitrary email addresses through your Resend account, wasting quota and potentially getting your domain blacklisted.
- **Fix:** Add rate limiting (per IP and per email), validate email format, add CSRF token.

### 7. Stripe Webhook Only Logs (MEDIUM-HIGH)
- **File:** `app/api/stripe/webhook/route.ts:38-58`
- **Issue:** Webhook receives payment events, verifies signature, but only logs them without any persistence or business logic.
- **Impact:** Donation payments are processed by Stripe but never recorded in the application. No idempotency protection.
- **Fix:** Implement actual donation tracking or remove the endpoint.

### 8. Memory-Based Key Wiping Not Guaranteed (MEDIUM)
- **File:** `lib/crypto/key-management.ts:469-498`
- **Issue:** JavaScript engines may optimize away zero-writes. No way to guarantee memory is actually cleared in V8/SpiderMonkey.
- **Impact:** Key material may persist in memory after "destruction".
- **Mitigation:** Use `crypto.subtle` where possible (keys stored in secure enclave). Document as best-effort.

---

## MEDIUM Issues

### 9. `NodeJS.Timeout` Type in Client Code (LOW-MEDIUM)
- **Files:** `lib/crypto/key-management.ts`, `lib/transport/obfuscation.ts`
- **Issue:** Uses `NodeJS.Timeout` type for browser `setInterval`/`setTimeout`.
- **Impact:** Type mismatch (works at runtime, but pollutes types).

### 10. File Size Validation Off-By-One (MEDIUM)
- **File:** `lib/hooks/use-p2p-connection.ts:431`
- **Issue:** Allows receiving `size + CHUNK_SIZE` bytes before rejection.
- **Impact:** Could receive one extra 16KB chunk beyond declared size.

### 11. PQC Library Not Audited (MEDIUM)
- **File:** `package.json` - `pqc-kyber` 0.7.0
- **Issue:** Experimental library, not formally audited, version 0.x.
- **Impact:** Potential implementation flaws in ML-KEM.
- **Mitigation:** Document as experimental, plan migration to NIST-standardized implementation.

### 12. No TURN Credential Rotation (MEDIUM)
- **File:** `lib/transport/private-webrtc.ts:41-42`
- **Issue:** TURN credentials are static env vars. If compromised, all relay traffic is exposed.
- **Fix:** Implement time-limited TURN credentials via REST API (most TURN providers support this).

---

## Privacy Findings

### 13. IP Leak Prevention Properly Implemented (POSITIVE)
- **File:** `lib/transport/private-webrtc.ts`
- **Finding:** Force-relay mode blocks host/srflx candidates, filters SDP, monitors connection type. Uses non-Google STUN servers.
- **Status:** Well-implemented when TURN credentials are configured.

### 14. No Analytics/Telemetry (POSITIVE)
- **Finding:** No Google Analytics, no tracking pixels, `NEXT_TELEMETRY_DISABLED=1` set.
- **Status:** Privacy-respecting.

### 15. Secure Logger Properly Masks Sensitive Data (POSITIVE)
- **File:** `lib/utils/secure-logger.ts`
- **Finding:** Masks device IDs, keys, connection codes in all log output.

### 16. Signaling Server Logs Socket IDs and Room Names (LOW)
- **File:** `signaling-server.js:163, 191, 254`
- **Issue:** Console.log includes socket IDs and room names (which are connection codes).
- **Impact:** Server operator (you) can see which connection codes are in use.
- **Mitigation:** Hash room names in server logs for operational privacy.

---

## Deployment Security

### 17. Docker Runs as Root (LOW)
- **File:** `Dockerfile`
- **Issue:** If no `USER` directive, containers run as root.
- **Fix:** Add `USER node` after installing dependencies.

### 18. CORS in Dev Mode Wide Open (LOW)
- **File:** `signaling-server.js:83, 137`
- **Issue:** In dev mode (`!process.env.NODE_ENV`), all origins are allowed.
- **Impact:** Only affects development. Production properly restricts to `tallow.manisahome.com`.

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 1 (transfer verification bug) |
| HIGH     | 5 |
| MEDIUM   | 4 |
| LOW      | 3 |
| POSITIVE | 3 |

**Most Urgent:** Fix #1 (verification gate) - this is why transfers don't work for first-time peers.

---

*Security review: 2026-01-23*

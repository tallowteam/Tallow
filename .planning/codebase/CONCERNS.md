# Codebase Concerns

**Analysis Date:** 2026-01-23

## Tech Debt

**NodeJS.Timeout in Browser Context:**
- Issue: Uses `NodeJS.Timeout` type for `setInterval`/`setTimeout` in client-side code (`'use client'` components)
- Files: `lib/crypto/key-management.ts`, `lib/transport/obfuscation.ts`
- Impact: Type mismatch - NodeJS.Timeout is a Node.js type, browser uses number. Works at runtime but creates type pollution
- Fix approach: Replace `NodeJS.Timeout` with browser-compatible timeout types or use `ReturnType<typeof setInterval>`

**Hardcoded Domain Separators:**
- Issue: Cryptographic domain separators use string literals scattered across files rather than centralized constants
- Files: `lib/crypto/pqc-crypto.ts`, `lib/crypto/key-management.ts`, `lib/crypto/triple-ratchet.ts`, `lib/crypto/peer-authentication.ts`
- Impact: If changed for protocol versioning, requires updates in multiple locations; increases maintenance burden
- Fix approach: Create `lib/crypto/constants.ts` with all domain separators (`tallow-hybrid-v1`, `tallow-session-keys-v1`, etc.)

**Unused Legacy Code Path:**
- Issue: `lib/storage/secure-storage.ts` contains migration code for legacy localStorage seed derivation (`STORAGE_KEY_SEED`, `deriveLegacyKey`)
- Files: `lib/storage/secure-storage.ts` (lines 9, 83-100)
- Impact: Dead code path clutters security-critical storage module; increases surface area
- Fix approach: Remove legacy key derivation if migration is complete; add database migration timestamp to verify

**Missing Error Context in Crypto Operations:**
- Issue: Crypto functions throw generic errors without context about what failed
- Files: `lib/crypto/pqc-crypto.ts` (multiple locations)
- Impact: Difficult to debug encryption/decryption failures in production
- Fix approach: Add context labels to errors: `throw new Error('Kyber encapsulation failed: ${context}')`

## Known Bugs

**File Size Mismatch Warning Not Actionable:**
- Symptoms: Transfer completes but logs warn of size mismatch (line 405 in `lib/hooks/use-p2p-connection.ts`)
- Files: `lib/hooks/use-p2p-connection.ts` (line 404-405)
- Trigger: Happens when final file chunk doesn't align with declared size
- Workaround: File still received but warning pollutes logs
- Root cause: Only warns instead of rejecting; allows silent data corruption

**Base64 Decoding Can Fail Silently:**
- Symptoms: File decryption returns generic filename when `decryptFileName` fails
- Files: `lib/crypto/file-encryption-pqc.ts` (line 158-162)
- Trigger: Malformed base64 in encrypted filename
- Impact: User doesn't know filename decryption failed; files get generic names
- Fix approach: Log the actual error before falling back to generic name

## Security Considerations

**Shared DH Secret Exposed in Verification:**
- Risk: `dhSharedSecret.current` passed directly to `createVerificationSession` for SAS generation
- Files: `lib/hooks/use-p2p-connection.ts` (line 140)
- Current mitigation: DH secret is wiped on disconnect, but held in memory during verification
- Recommendations:
  - Consider deriving a separate verification key from DH secret using HKDF with domain separator
  - Add explicit confirmation that SAS was displayed before allowing further operations
  - Document that verification skipping weakens MITM protection

**Stripe Webhook Event Processing Is Incomplete:**
- Risk: Webhook only logs payment events, doesn't persist them or trigger application logic
- Files: `app/api/stripe/webhook/route.ts` (lines 38-58)
- Current mitigation: Non-functional in current state (just logs)
- Recommendations:
  - Implement actual database persistence of donations if feature is used
  - Add signature verification with timestamp validation (currently only verifies signature)
  - Add idempotency key tracking to prevent duplicate processing
  - Implement webhook event retry logic on failure

**Email Sending Degrades Gracefully Without Verification:**
- Risk: Welcome email sends without authentication verification; no rate limiting
- Files: `app/api/send-welcome/route.ts` (lines 28-34)
- Current mitigation: Fails gracefully if Resend API key not configured
- Recommendations:
  - Add rate limiting by email address (can spam verification emails)
  - Validate email format before sending (currently accepts any string)
  - Add CSRF token or signed request verification for POST endpoint
  - Consider requiring captcha on client-side before email endpoint

**Memory Doesn't Guarantee Secure Deletion:**
- Risk: JavaScript doesn't guarantee memory clearing; uses manual overwrite as best-effort
- Files: `lib/crypto/key-management.ts` (lines 469-498), `lib/crypto/triple-ratchet.ts` (lines 418-429)
- Current mitigation: Multi-pass overwrites (random, zeros, 0xFF)
- Recommendations:
  - Document that JavaScript secure deletion is "best effort" not guaranteed
  - Consider using `StructuredClone` with typed arrays for additional isolation
  - Add telemetry to verify memory wipe completion
  - Document limitations in security architecture guide

**Unvalidated DH Public Key Could Cause Cryptographic Weakness:**
- Risk: DH public key validation only rejects all-zeros; doesn't validate other low-order points or malicious keys
- Files: `lib/hooks/use-p2p-connection.ts` (lines 318-330)
- Current mitigation: Validates array length and all-zero case
- Recommendations:
  - For X25519, add clamping verification (already done by noble/curves library, but add explicit check)
  - Consider rejecting extremely low entropy keys (though rare with random generation)
  - Add logging of key acceptance/rejection for audit trail

**File Size Validation Has Off-By-One Risk:**
- Risk: Allows receiving more than declared size by one CHUNK_SIZE (line 431)
- Files: `lib/hooks/use-p2p-connection.ts` (line 431)
- Current mitigation: Errors after exceeding by CHUNK_SIZE
- Recommendations:
  - Reject immediately when exceeding exact declared size
  - Calculate max allowed total before receiving: `expectedSize + tolerance`
  - Add explicit test for file size boundary conditions

## Performance Bottlenecks

**Streaming Encryption Accumulates Full File in Memory:**
- Problem: `encryptFileStream` generator still loads entire file into memory for hashing
- Files: `lib/crypto/file-encryption-pqc.ts` (lines 318-349)
- Cause: First pass reads entire file into `chunks` array before hashing
- Improvement path:
  - Use streaming hash (SHA-256 supports incremental hashing with Web Crypto)
  - Implement two-pass streaming: first pass computes hash, second pass encrypts
  - For huge files (> 500MB), consider skipping full-file hash or making it optional

**File Download Creates Synchronous DOM Operations:**
- Problem: `downloadFiles` iterates and downloads sequentially with no delay
- Files: `lib/hooks/use-file-transfer.ts` (lines 113-116)
- Impact: Downloading 100+ files will block UI; no progress feedback
- Improvement path:
  - Add delay between downloads: `await new Promise(r => setTimeout(r, 50))`
  - Use batch queueing system
  - Show progress for multiple file downloads

**Large File Chunk Processing May Block UI:**
- Problem: Chunk encryption/decryption in `encryptFile` and `decryptFile` processes all chunks synchronously
- Files: `lib/crypto/file-encryption-pqc.ts` (lines 91-114, 200-224)
- Impact: Files > 1GB will freeze UI during encryption/decryption phase
- Improvement path:
  - Implement `processChunksInBatches` with `requestIdleCallback` for responsiveness
  - Add progress callback to report encryption progress
  - Consider Web Worker for crypto-heavy operations

## Fragile Areas

**Deserialization Accepts Untrusted Length Values:**
- Files: `lib/crypto/pqc-crypto.ts` (lines 444-465, 494-515)
- Why fragile:
  - Reads kyberLen from untrusted serialized data without sufficient validation
  - Bounds check uses hardcoded 2048 but ML-KEM-768 should be 1184
  - Could accept oversized ciphertexts causing memory exhaustion
- Safe modification:
  - Use explicit length constants for each KEM variant (ML-KEM-768: 1184/1088, ML-KEM-1024: 1568/1568)
  - Reject any kyberLen outside exact expected values (fail-closed)
  - Add tests with malformed ciphertexts at boundaries
- Test coverage: Missing fuzz testing of deserialization with malformed inputs

**Key Ratchet State Not Protected from Concurrent Access:**
- Files: `lib/crypto/key-management.ts`, `lib/crypto/triple-ratchet.ts`
- Why fragile:
  - `ratchetStates` Map accessed from multiple async operations without locks
  - Two simultaneous calls to `dhRatchetStep` could corrupt state
  - Out-of-order message handling modifies state without atomicity
- Safe modification:
  - Add request queuing: wrap all state mutations in sequential queue
  - Use `async-lock` library for critical sections
  - Document that operations must not be concurrent
- Test coverage: Missing concurrent stress tests with simultaneous messages

**SAS Verification Skipping Has No Fallback:**
- Files: `lib/hooks/use-p2p-connection.ts` (lines 174-184)
- Why fragile:
  - `skipVerification` marks session as 'skipped' but connection proceeds unchanged
  - No way to re-verify later; once skipped, trust is never established
  - Peer could perform MITM without user ever knowing
- Safe modification:
  - Add "require verification" setting that prevents data transfer until SAS verified
  - Warn user when skipping: "Without verification, you cannot confirm who you're talking to"
  - Allow re-triggering verification on same session
- Test coverage: Missing tests for verification state transitions

**Password-Protected File Decryption Error Handling:**
- Files: `lib/crypto/file-encryption-pqc.ts` (lines 279-298)
- Why fragile:
  - Wrong password will produce garbage data that fails hash check (not a clear error)
  - User receives "File hash mismatch - file corrupted" instead of "Wrong password"
  - Could lead to user retrying with correct password multiple times
- Safe modification:
  - Try decryption with derived key and catch hash mismatch
  - Check if salt exists before deriving key (missing salt = wrong password format)
  - Provide clearer error: "Decryption failed - incorrect password or corrupted file"
- Test coverage: Add test for wrong password error message

## Scaling Limits

**Skipped Message Key Storage Unbounded:**
- Current capacity: `MAX_SKIP = 1000` keys stored in memory
- Limit: With out-of-order delivery of large transfers, skipped keys could grow
- Scaling path:
  - Current limit is per session; with many sessions, memory could grow to MBs
  - Implement time-based eviction (drop keys older than 60 seconds)
  - Use LRU cache instead of unlimited growth
  - Monitor skipped key count and warn if approaching limit

**Ratchet State Map Holds Sessions Forever:**
- Current capacity: Sessions remain in `ratchetStates` map indefinitely
- Limit: Long-running applications with many connections accumulate memory
- Scaling path:
  - Implement automatic cleanup of disconnected sessions
  - Add `destroySession` call on disconnect (currently manual)
  - Use WeakMap for sessions that get GC'd automatically
  - Add metrics for active sessions

**Secure Storage IndexedDB Not Cleaned Up:**
- Current capacity: Encryption keys stored in IndexedDB with no expiration
- Limit: Multiple users on shared device can find old keys
- Scaling path:
  - Add `storageVersion` and invalidate old keys on major version upgrades
  - Implement time-based expiration (30 days) for storage keys
  - Add API to explicitly wipe stored keys on logout
  - Document multi-user device risks

## Dependencies at Risk

**noble/curves X25519 Implementation:**
- Risk: Relies on community-maintained cryptography library (not audited like libsodium)
- Files: Multiple crypto files use `@noble/curves/ed25519.js`
- Impact: Bug in X25519 would compromise DH shared secret; affects SAS verification
- Migration plan:
  - Consider using TweetNaCl.js as alternative (more audited, same functionality)
  - Add crypto library audit trail documentation
  - Monitor @noble/hashes and @noble/curves repositories for security updates
  - Consider Web Crypto API for X25519 when supported in all target browsers

**crypto-js Dependency:**
- Risk: Deprecated library; maintainer recommends against use in new projects
- Files: `package.json` shows `crypto-js` ^4.2.0 as dependency
- Impact: Security vulnerabilities in crypto-js won't be patched
- Migration plan:
  - Search codebase for actual usage of `crypto-js` - may be unused
  - Replace with Web Crypto API equivalents
  - Remove from dependencies after verifying no imports

**pqc-kyber Not Formally Audited:**
- Risk: Post-quantum crypto library is experimental; not production-ready
- Files: Entire `lib/crypto/` directory depends on `pqc-kyber`
- Impact: ML-KEM implementation could have flaws; no security guarantee
- Migration plan:
  - Monitor NIST PQC standardization progress
  - Plan migration to standardized ML-KEM implementations when available
  - Add security disclaimer in README about PQC experimental status
  - Document fallback to classical DH if Kyber fails

## Missing Critical Features

**No Offline Message Buffering:**
- Problem: If connection drops mid-transfer, user must restart from beginning
- Impact: Large files (2GB+) could waste hours on connection flake
- Blocks: Reliable file transfer over poor networks
- Suggested implementation:
  - Store partial transfers with chunk checksums
  - Resume from last successful chunk on reconnect
  - Add resume UI: "Resume transfer of file.zip (2GB, 45% complete)"

**No File Integrity Verification After Reception:**
- Problem: File hash verified during decryption, but no way to verify after download
- Impact: If file corrupts during download (before decryption), user won't know
- Blocks: Verification of downloaded files without re-transferring
- Suggested implementation:
  - Store file hash separately from encrypted file
  - Display checksum after download for manual verification
  - Add "Verify Integrity" button that re-hashes downloaded file

**No Audit Log or Transfer History:**
- Problem: No record of who sent what file or when
- Files: `app/app/history/page.tsx` exists but implementation unclear
- Impact: Can't verify if unauthorized transfers occurred
- Blocks: Compliance with data access logs
- Suggested implementation:
  - Log transfer metadata (peers, file size, timestamp) to encrypted storage
  - Exclude actual file contents from log
  - Implement log export for compliance
  - Add timestamp validation to prevent log tampering

**No Bandwidth Limiting or Throttling:**
- Problem: Transfer speeds not controlled; could saturate network
- Impact: User's internet becomes unusable during transfers
- Blocks: Using Tallow alongside other network activities
- Suggested implementation:
  - Add speed limit setting (e.g., "limit to 5 Mbps")
  - Implement token bucket rate limiter in `sendFile` loop
  - Show estimated remaining time based on speed limit

## Test Coverage Gaps

**Cryptographic Algorithm Substitution:**
- What's not tested: What happens if Kyber encapsulation returns wrong-sized output
- Files: `lib/crypto/pqc-crypto.ts` (Kyber usage)
- Risk: Library bug could produce malformed ciphertexts not caught by tests
- Priority: HIGH - impacts all encryption
- Suggested tests:
  - Mock Kyber to return oversized/undersized ciphertexts
  - Verify serialization/deserialization rejects bad sizes
  - Test with known test vectors from NIST

**Network Adversary Scenarios:**
- What's not tested: MITM attacks where adversary modifies DH public key
- Files: `lib/hooks/use-p2p-connection.ts` DH exchange
- Risk: Modified key could allow decryption by attacker if SAS not verified
- Priority: CRITICAL - foundational security property
- Suggested tests:
  - E2E test: Adversary modifies DH public key, user sees different SAS
  - Verify user must confirm SAS match before proceeding
  - Test SAS matches on both sides for legitimate key exchange

**Corrupted File Chunk Scenarios:**
- What's not tested: File transfer with bit flips in encrypted chunks
- Files: `lib/crypto/file-encryption-pqc.ts` decryption
- Risk: Silent data corruption if hash verification fails but user doesn't notice warning
- Priority: HIGH - data integrity is critical
- Suggested tests:
  - Flip random bits in encrypted chunks, verify decryption fails cleanly
  - Test off-by-one in chunk size handling
  - Verify file corruption detected before user downloads

**Password Derivation Edge Cases:**
- What's not tested: Empty password, very long password (> 100KB), special characters
- Files: `lib/crypto/file-encryption-pqc.ts` `encryptFileWithPassword`
- Risk: PBKDF2 with unusual inputs could fail
- Priority: MEDIUM - affects password-protected files
- Suggested tests:
  - Test password length boundaries (0 bytes, 1M bytes)
  - Test Unicode normalization issues (ü vs u+¨)
  - Verify salt generation doesn't fail

**Concurrent Transfer State Management:**
- What's not tested: Starting multiple transfers simultaneously on same connection
- Files: `lib/hooks/use-p2p-connection.ts` (single transfer tracking)
- Risk: `currentTransfer` state might get confused with multiple concurrent transfers
- Priority: MEDIUM - affects multi-file transfers
- Suggested tests:
  - Start transfer A, then transfer B before A completes
  - Verify both track progress independently
  - Test error in one transfer doesn't affect the other

---

*Concerns audit: 2026-01-23*

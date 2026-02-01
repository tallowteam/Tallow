# TEST FIXES - PRIORITIZED ACTION PLAN
**Generated:** 2026-01-28
**Timeline:** 4 weeks to production-ready

---

## WEEK 1: FIX FAILING TESTS (P0)

### Day 1: Fix 100% Failure Tests
**Priority:** CRITICAL - Blocking everything

#### 1. Fix secure-logger.test.ts (9/9 failing)
**File:** `C:\Users\aamir\Documents\Apps\Tallow\tests\unit\utils\secure-logger.test.ts`
**Issue:** All logging tests failing
**Likely cause:** Environment detection logic
**Action:**
- Fix NODE_ENV detection
- Update console mock setup
- Verify sanitization logic

#### 2. Fix group-transfer-manager.test.ts (19/19 failing)
**File:** `C:\Users\aamir\Documents\Apps\Tallow\tests\unit\transfer\group-transfer-manager.test.ts`
**Issue:** Complete feature test failure
**Likely cause:** API changes, mock issues
**Action:**
- Review GroupTransferManager API
- Update mocks
- Fix state management tests

#### 3. Fix feature-card.test.tsx (29/39 failing - 74%)
**File:** `C:\Users\aamir\Documents\Apps\Tallow\components\features\feature-card.test.tsx`
**Issue:** Framer Motion props on DOM elements
**Likely cause:** Motion component usage
**Action:**
- Use motion.div instead of div with motion props
- Fix whileHover/whileTap props
- Update component rendering

**Estimated time:** 1 day

---

### Day 2: Fix High Failure Rate Tests (>10 failures)

#### 4. Fix chat-security.test.ts (15/33 failing - 45%)
**File:** `C:\Users\aamir\Documents\Apps\Tallow\tests\unit\chat-security.test.ts`
**Issue:** HMAC signature and sequence number tests timing out
**Likely cause:** 10s timeouts, async issues
**Action:**
- Fix HMAC generation/verification
- Fix sequence number tracking
- Reduce test timeouts
- Fix DOMPurify sanitization tests

#### 5. Fix technology-showcase.test.tsx (17/37 failing)
**File:** `C:\Users\aamir\Documents\Apps\Tallow\components\features\technology-showcase.test.tsx`
**Issue:** Component rendering failures
**Action:**
- Fix Framer Motion usage
- Update mocks
- Fix render expectations

#### 6. Fix cache-stats.test.ts (10/25 failing - 40%)
**File:** `C:\Users\aamir\Documents\Apps\Tallow\tests\unit\utils\cache-stats.test.ts`
**Issue:** Cache statistics tracking
**Action:**
- Review cache API changes
- Fix metric calculations
- Update test expectations

**Estimated time:** 1 day

---

### Day 3: Fix Crypto Test Failures

#### 7. Fix triple-ratchet.test.ts (9/25 failing)
**File:** `C:\Users\aamir\Documents\Apps\Tallow\tests\unit\crypto\triple-ratchet.test.ts`
**Issue:** Ratchet state management
**Action:**
- Fix ratchet advancement logic
- Fix key derivation tests
- Fix state serialization

#### 8. Fix sparse-pq-ratchet.test.ts (6/33 failing)
**File:** `C:\Users\aamir\Documents\Apps\Tallow\tests\unit\crypto\sparse-pq-ratchet.test.ts`
**Issue:** Hybrid keypair and epoch tests
**Action:**
- Fix hybrid keypair generation
- Fix public key retrieval
- Fix epoch advancement

#### 9. Fix key-management.test.ts (4/44 failing)
**File:** `C:\Users\aamir\Documents\Apps\Tallow\tests\unit\crypto\key-management.test.ts`
**Issue:** Key operations
**Action:**
- Fix key generation
- Fix key storage
- Fix key rotation

**Estimated time:** 1 day

---

### Day 4: Fix Component and API Tests

#### 10. Fix use-case-grid.test.tsx (8/26 failing)
**File:** `C:\Users\aamir\Documents\Apps\Tallow\components\features\use-case-grid.test.tsx`
**Action:** Fix Framer Motion and rendering

#### 11. Fix send-share-email.test.ts (5/13 failing)
**File:** `C:\Users\aamir\Documents\Apps\Tallow\tests\unit\api\send-share-email.test.ts`
**Issue:** Vitest mock warnings, Resend API
**Action:**
- Fix vi.fn() mock implementations
- Fix Resend API mocking
- Fix email validation

#### 12. Fix screen-sharing.test.ts (4/32 failing)
**File:** `C:\Users\aamir\Documents\Apps\Tallow\tests\unit\screen-sharing.test.ts`
**Action:** Fix screen sharing manager tests

#### 13. Fix pqc-lazy.test.ts (4/16 failing)
**File:** `C:\Users\aamir\Documents\Apps\Tallow\tests\unit\crypto\pqc-lazy.test.ts`
**Action:** Fix lazy loading and preload tests

**Estimated time:** 1 day

---

### Day 5: Fix Remaining Unit Test Failures

#### 14-27. Fix remaining tests (1-3 failures each):
- pq-signatures.test.ts (3 failing)
- peer-authentication.test.ts (3 failing)
- metadata-stripper.test.ts (3 failing)
- chat-storage.test.ts (3 failing)
- validation/schemas.test.ts (3 failing)
- email-fallback.test.ts (3 failing)
- send-welcome.test.ts (3 failing)
- chat-manager.test.ts (2 failing)
- rooms/transfer-room-manager.test.ts (1 failing)
- email-integration.test.ts (1 failing)
- video-metadata-stripper.test.ts (1 failing)
- use-service-worker.test.ts (1 failing)
- chacha20-poly1305.test.ts (1 failing)
- csrf.test.ts (1 failing)

**Action:** Fix each systematically

**Estimated time:** 1 day

---

## WEEK 2: ADD CRITICAL TESTS (P0)

### Day 1-2: Storage Layer Tests (Currently 0%)

#### Create tests for:
1. **secure-storage.ts**
   - IndexedDB operations
   - Encryption at rest
   - Data retrieval
   - Error handling

2. **transfer-state-db.ts**
   - State persistence
   - State updates
   - Cleanup
   - Recovery

3. **transfer-history.ts**
   - History recording
   - History retrieval
   - History cleanup

4. **transfer-state.ts**
   - State management
   - State transitions

**Files to create:**
- `tests/unit/storage/secure-storage.test.ts`
- `tests/unit/storage/transfer-state-db.test.ts`
- `tests/unit/storage/transfer-history.test.ts`
- `tests/unit/storage/transfer-state.test.ts`

**Estimated time:** 2 days

---

### Day 3-4: Core Crypto Tests

#### Create tests for:
5. **file-encryption-pqc.ts** (CRITICAL)
   - PQC encryption
   - PQC decryption
   - Key handling
   - Error cases

6. **crypto-loader.ts**
   - Lazy loading
   - Module caching
   - Error handling

7. **pqc-crypto-lazy.ts**
   - Lazy PQC operations
   - Preloading
   - Memory management

**Files to create:**
- `tests/unit/crypto/file-encryption-pqc-complete.test.ts`
- `tests/unit/crypto/crypto-loader.test.ts`
- `tests/unit/crypto/pqc-crypto-lazy-complete.test.ts`

**Estimated time:** 2 days

---

### Day 5: Transfer Manager Tests

#### Create tests for:
8. **pqc-transfer-manager.ts** (CRITICAL)
   - Transfer initiation
   - Progress tracking
   - Encryption integration
   - P2P coordination
   - Error handling
   - Cancellation

**File to create:**
- `tests/unit/transfer/pqc-transfer-manager-complete.test.ts`

**Estimated time:** 1 day

---

## WEEK 3: ADD MORE CRITICAL TESTS (P1)

### Day 1-2: Chat Encryption Tests

#### Create tests for:
1. **chat-encryption.ts** (CRITICAL)
   - E2E encryption
   - Key exchange
   - Message encryption
   - Message decryption

2. **message-encryption.ts** (CRITICAL)
   - Message formatting
   - Signature generation
   - Signature verification

**Files to create:**
- `tests/unit/chat/chat-encryption-complete.test.ts`
- `tests/unit/chat/message-encryption.test.ts`

**Estimated time:** 2 days

---

### Day 3: Email Fallback Tests

#### Create tests for:
3. **email-fallback/index.ts**
   - Fallback trigger
   - Email preparation
   - Retry logic

4. **email-service.ts**
   - Email sending
   - Template rendering
   - Error handling

**Files to create:**
- `tests/unit/email-fallback/index.test.ts`
- `tests/unit/email/email-service-complete.test.ts`

**Estimated time:** 1 day

---

### Day 4: Signaling Tests

#### Create tests for:
5. **socket-signaling.ts** (CRITICAL)
   - WebSocket connection
   - Message sending
   - Message receiving
   - Reconnection
   - Error handling

6. **signaling-crypto.ts**
   - Encrypted signaling
   - Key exchange via signaling

**Files to create:**
- `tests/unit/signaling/socket-signaling-complete.test.ts`
- `tests/unit/signaling/signaling-crypto-complete.test.ts`

**Estimated time:** 1 day

---

### Day 5: Hook Tests (Priority Hooks)

#### Create tests for:
7. **use-file-transfer.ts**
8. **use-pqc-transfer.ts**
9. **use-p2p-connection.ts**
10. **use-group-transfer.ts**

**Files to create:**
- `tests/unit/hooks/use-file-transfer.test.ts`
- `tests/unit/hooks/use-pqc-transfer.test.ts`
- `tests/unit/hooks/use-p2p-connection.test.ts`
- `tests/unit/hooks/use-group-transfer-complete.test.ts`

**Estimated time:** 1 day

---

## WEEK 4: E2E TESTS & INTEGRATION

### Day 1-2: Fix E2E Test Selectors

#### Fix failing E2E tests:
1. **camera-capture.spec.ts**
   - Fix Advanced menu selector
   - Fix camera permission handling
   - Fix dialog interactions

2. **Update all E2E selectors**
   - Use data-testid attributes
   - Improve selector stability
   - Add proper waits

**Action items:**
- Add data-testid to critical UI elements
- Update all E2E test selectors
- Fix timeout issues
- Improve error handling

**Estimated time:** 2 days

---

### Day 3: Add Missing E2E Coverage

#### Create E2E tests for:
1. **Complete file transfer flow**
   - Select file → Transfer → Verify receipt
2. **Chat flow**
   - Send message → Receive message
3. **Email fallback flow**
   - Failed transfer → Email fallback
4. **Group transfer flow**
   - Multiple recipients → Verify all received

**Files to create:**
- `tests/e2e/complete-transfer-flow.spec.ts`
- `tests/e2e/chat-flow.spec.ts`
- `tests/e2e/complete-email-fallback.spec.ts`

**Estimated time:** 1 day

---

### Day 4: CI/CD Integration

#### Set up test automation:
1. **Create GitHub Actions workflow**
   - Run unit tests on PR
   - Run E2E tests on PR
   - Block merge on failure
   - Generate coverage report

2. **Configure test thresholds**
   - Set minimum 80% coverage
   - Set 0 failing tests
   - Set performance budgets

**Files to create:**
- `.github/workflows/test.yml`
- `.github/workflows/e2e.yml`

**Estimated time:** 1 day

---

### Day 5: Documentation & Review

#### Complete test documentation:
1. **Update testing docs**
   - Test writing guidelines
   - Mock setup guide
   - E2E best practices

2. **Code review**
   - Review all new tests
   - Verify coverage
   - Check for flaky tests

3. **Final validation**
   - Run full test suite
   - Verify all passing
   - Check coverage report

**Estimated time:** 1 day

---

## SUCCESS METRICS

### Week 1 End:
```
✅ 0 failing unit tests (from 150+)
✅ All existing tests passing
✅ 80%+ success rate
```

### Week 2 End:
```
✅ Storage layer tested (10 files)
✅ Core crypto tested (PQC encryption)
✅ Transfer manager tested
✅ 40% overall coverage
```

### Week 3 End:
```
✅ Chat encryption tested
✅ Email fallback tested
✅ Signaling tested
✅ Priority hooks tested
✅ 60% overall coverage
```

### Week 4 End:
```
✅ E2E tests passing
✅ CI/CD gates enabled
✅ Documentation complete
✅ 80% overall coverage
✅ Production-ready
```

---

## RESOURCES NEEDED

### Team:
- 2 senior engineers (full-time)
- 1 QA engineer (part-time for E2E)

### Tools:
- Vitest (unit tests) ✓
- Playwright (E2E tests) ✓
- Coverage tools ✓
- CI/CD (GitHub Actions)

### Time:
- **Minimum:** 4 weeks
- **Recommended:** 6 weeks (buffer)
- **Effort:** ~320 hours

---

## RISK MITIGATION

### If timeline slips:
1. **Priority 1:** Fix all failing tests (non-negotiable)
2. **Priority 2:** Test critical paths only
3. **Priority 3:** Defer non-critical coverage

### If tests are flaky:
1. Isolate flaky tests
2. Add retry logic
3. Fix root cause incrementally

### If coverage goal not met:
1. 60% minimum (critical paths only)
2. Document untested areas
3. Plan for future sprints

---

## DAILY CHECKLIST

### Every Day:
- [ ] Run full test suite
- [ ] Fix newly failing tests immediately
- [ ] Review test coverage
- [ ] Update progress tracker
- [ ] Commit green tests only

### Every Week:
- [ ] Review progress vs plan
- [ ] Adjust timeline if needed
- [ ] Demo passing tests to team
- [ ] Update documentation

---

## COMPLETION CRITERIA

### Production Ready Checklist:
- [ ] 0 failing unit tests
- [ ] 0 failing E2E tests
- [ ] ≥80% code coverage
- [ ] All critical paths tested
- [ ] Storage layer fully tested
- [ ] Crypto layer fully tested
- [ ] Transfer system fully tested
- [ ] Chat encryption tested
- [ ] Email fallback tested
- [ ] Signaling tested
- [ ] CI/CD gates enabled
- [ ] No flaky tests
- [ ] Documentation complete
- [ ] Team sign-off

**Once ALL checkboxes are checked: READY TO SHIP**

---

**Start Date:** 2026-01-28
**Target Completion:** 2026-02-25 (4 weeks)
**Status:** Ready to begin
**Next Action:** Start Day 1 - Fix secure-logger.test.ts


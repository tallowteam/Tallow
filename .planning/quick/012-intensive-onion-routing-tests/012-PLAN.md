---
type: quick
id: "012"
title: Intensive Onion Routing & Traffic Obfuscation Tests
wave: 1
depends_on: []
files_modified:
  - tests/unit/transport/onion-routing.test.ts
  - tests/unit/transport/obfuscation.test.ts
  - tests/integration/onion-routing-integration.test.ts
  - tests/e2e/privacy-mode.spec.ts
  - lib/transfer/pqc-transfer-manager.ts
autonomous: true

must_haves:
  truths:
    - "Unit tests cover OnionRouter, TrafficObfuscator, RelayDirectory"
    - "Integration tests verify OnionRoutingManager with mock relays"
    - "E2E tests verify privacy mode with onion routing enabled"
    - "pqc-transfer-manager uses OnionRoutingManager when enabled"
  artifacts:
    - path: "tests/unit/transport/obfuscation.test.ts"
      provides: "Unit tests for TrafficObfuscator"
      min_lines: 150
    - path: "tests/integration/onion-routing-integration.test.ts"
      provides: "Integration tests for OnionRoutingManager"
      min_lines: 100
  key_links:
    - from: "lib/transfer/pqc-transfer-manager.ts"
      to: "lib/transport/onion-routing-integration.ts"
      via: "OnionRoutingManager import and usage"
      pattern: "getOnionRoutingManager|routeThroughOnion"
---

<objective>
Create intensive tests for onion routing and traffic obfuscation, then wire up onion routing to actually work in PQC transfers.

Purpose: Ensure privacy features work correctly before production deployment.
Output: Comprehensive test coverage + working onion routing integration.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@lib/transport/onion-routing.ts
@lib/transport/onion-routing-integration.ts
@lib/transport/obfuscation.ts
@lib/transfer/pqc-transfer-manager.ts
@lib/hooks/use-onion-routing.ts
@tests/unit/transport/onion-routing.test.ts

**Current State:**
- OnionRouter class exists with circuit building, layer wrapping/unwrapping
- TrafficObfuscator exists with padding, timing, protocol disguise, cover traffic
- OnionRoutingManager exists as integration layer
- Existing unit tests: 24/30 passing for onion-routing
- Traffic obfuscation IS wired (checks localStorage for tallow_advanced_privacy_mode)
- Onion routing is NOT wired to pqc-transfer-manager.ts

**Key Patterns:**
- Tests use vitest with vi.fn() for mocks
- Test files in tests/unit/, tests/integration/, tests/e2e/
- Use @/ alias for lib imports
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create TrafficObfuscator Unit Tests</name>
  <files>tests/unit/transport/obfuscation.test.ts</files>
  <action>
Create comprehensive unit tests for TrafficObfuscator:

1. **Padding Tests**:
   - `padToUniformSize` pads data to TLS record sizes
   - `unpadData` correctly extracts original data
   - `fragmentData` splits large payloads correctly
   - `reassembleFragments` reconstructs original data

2. **Timing Tests**:
   - `calculateDelay` returns values based on mode (constant, jittered, burst)
   - `applyTimingDelay` actually delays execution
   - `calculateBitrateDelay` respects target bitrate

3. **Protocol Disguise Tests**:
   - `generateDisguiseHeaders` creates proper HTTP headers
   - `wrapInProtocolFrame` creates HTTP-like frames
   - `unwrapFromProtocolFrame` extracts original data

4. **Cover Traffic Tests**:
   - `generateDecoyPacket` creates valid decoy packets
   - `generateCoverPacket` creates valid cover packets
   - `startCoverTraffic` / `stopCoverTraffic` lifecycle

5. **Full Pipeline Tests**:
   - `obfuscate` -> `deobfuscate` roundtrip
   - `obfuscateWithDisguise` -> `deobfuscateFromDisguise` roundtrip
   - Stats tracking (originalSize, paddedSize, overhead)

Use fake timers for timing tests. Mock crypto.getRandomValues for deterministic tests where needed.
  </action>
  <verify>npm test tests/unit/transport/obfuscation.test.ts -- --reporter=verbose</verify>
  <done>All obfuscation unit tests pass (minimum 20 tests)</done>
</task>

<task type="auto">
  <name>Task 2: Create OnionRoutingManager Integration Tests</name>
  <files>tests/integration/onion-routing-integration.test.ts</files>
  <action>
Create integration tests that verify OnionRoutingManager works with mock relays:

1. **Setup**: Create mock RelayDirectoryService that returns predictable relay nodes

2. **Initialization Tests**:
   - Manager initializes with bootstrap relays
   - Config updates propagate correctly
   - Events emit properly (initialized, configUpdated, relaysUpdated)

3. **Circuit Building Tests**:
   - `selectRelayPath` returns correct number of hops
   - `createOnionLayers` creates properly nested encryption
   - Path diversity (different regions, no relay reuse)

4. **Data Routing Tests**:
   - `routeThroughOnion` succeeds with mock relay
   - Stats update after successful transfer
   - Failed transfers increment failedTransfers
   - Active circuits tracked and cleaned up

5. **Edge Cases**:
   - Insufficient relays throws proper error
   - Mode 'disabled' prevents routing
   - Cleanup properly destroys all circuits

Mock the actual network calls (WebSocket connections) but test the full integration flow.
  </action>
  <verify>npm test tests/integration/onion-routing-integration.test.ts -- --reporter=verbose</verify>
  <done>All integration tests pass (minimum 15 tests)</done>
</task>

<task type="auto">
  <name>Task 3: Wire Onion Routing to PQC Transfer Manager + E2E Tests</name>
  <files>
    lib/transfer/pqc-transfer-manager.ts
    tests/e2e/privacy-mode.spec.ts
  </files>
  <action>
**Part A: Wire OnionRoutingManager to PQCTransferManager**

In `pqc-transfer-manager.ts`:

1. Import OnionRoutingManager:
```typescript
import {
  getOnionRoutingManager,
  OnionRoutingManager
} from '../transport/onion-routing-integration';
```

2. Add instance variable:
```typescript
private onionManager: OnionRoutingManager | null = null;
private onionRoutingEnabled: boolean = false;
```

3. In `initializeSession`, check for onion routing setting:
```typescript
// After existing obfuscation check
try {
  const onionRoutingMode = localStorage.getItem('tallow_onion_routing_mode');
  if (onionRoutingMode === 'multi-hop' || onionRoutingMode === 'single-hop') {
    this.onionRoutingEnabled = true;
    this.onionManager = getOnionRoutingManager();
    await this.onionManager.initialize();
    this.onionManager.updateConfig({ mode: onionRoutingMode });
    secureLog.log('[PQC] Onion routing enabled:', onionRoutingMode);
  }
} catch (e) {
  secureLog.error('[PQC] Failed to initialize onion routing:', e);
}
```

4. In `sendFile`, before sending chunks, if onion routing enabled:
```typescript
if (this.onionRoutingEnabled && this.onionManager) {
  // Route encrypted chunk through onion network
  const chunkBuffer = chunkData.buffer.slice(
    chunkData.byteOffset,
    chunkData.byteOffset + chunkData.byteLength
  );
  await this.onionManager.routeThroughOnion(
    `${this.session.sessionId}-chunk-${i}`,
    chunkBuffer,
    this.dataChannel?.label || 'peer'
  );
}
```

5. In `destroy`, cleanup onion manager:
```typescript
if (this.onionManager) {
  this.onionManager.closeTransferCircuit(this.session?.sessionId || '');
}
```

**Part B: Enhance E2E Privacy Mode Tests**

In `tests/e2e/privacy-mode.spec.ts`, add tests:

1. Test onion routing UI toggle exists and works
2. Test that enabling onion routing mode persists to localStorage
3. Test privacy settings panel shows onion routing status
4. Test that advanced privacy mode enables both obfuscation AND onion routing

Use page.evaluate to check localStorage values and verify UI state matches.
  </action>
  <verify>
npm run build && npm test tests/e2e/privacy-mode.spec.ts -- --reporter=verbose
  </verify>
  <done>
PQC transfer manager initializes OnionRoutingManager when enabled.
E2E tests verify privacy mode UI works correctly.
Build succeeds with no type errors.
  </done>
</task>

</tasks>

<verification>
After all tasks complete:

1. Run full test suite for transport:
```bash
npm test tests/unit/transport/ -- --reporter=verbose
```

2. Run integration tests:
```bash
npm test tests/integration/onion-routing-integration.test.ts -- --reporter=verbose
```

3. Run E2E privacy tests:
```bash
npm test tests/e2e/privacy-mode.spec.ts -- --reporter=verbose
```

4. Verify build:
```bash
npm run build
```

5. Check test count:
```bash
npm test tests/unit/transport/ tests/integration/ -- --reporter=json | grep -c '"status":"passed"'
```
</verification>

<success_criteria>
- [ ] TrafficObfuscator has 20+ unit tests passing
- [ ] OnionRoutingManager has 15+ integration tests passing
- [ ] pqc-transfer-manager.ts imports and uses OnionRoutingManager
- [ ] localStorage 'tallow_onion_routing_mode' triggers onion routing
- [ ] E2E privacy-mode.spec.ts tests pass
- [ ] Build succeeds with no TypeScript errors
- [ ] Total new tests: 35+
</success_criteria>

<output>
After completion, create `.planning/quick/012-intensive-onion-routing-tests/012-SUMMARY.md`
</output>

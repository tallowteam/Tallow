---
quick: 010
title: mDNS Discovery Integration Testing
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/unit/discovery/mdns-bridge.test.ts
  - tests/unit/discovery/daemon-integration.test.ts
  - tests/e2e/mdns-discovery.spec.ts
autonomous: true

must_haves:
  truths:
    - "mDNS bridge unit tests cover WebSocket connection lifecycle"
    - "Daemon integration tests verify message protocol"
    - "E2E test validates full discovery flow when daemon is running"
  artifacts:
    - path: "tests/unit/discovery/mdns-bridge.test.ts"
      provides: "MDNSBridge class unit tests"
      min_lines: 150
    - path: "tests/unit/discovery/daemon-integration.test.ts"
      provides: "WebSocket server and mDNS server integration tests"
      min_lines: 100
    - path: "tests/e2e/mdns-discovery.spec.ts"
      provides: "E2E discovery flow test"
      min_lines: 60
  key_links:
    - from: "tests/unit/discovery/mdns-bridge.test.ts"
      to: "lib/discovery/mdns-bridge.ts"
      via: "imports and tests MDNSBridge class"
      pattern: "import.*mdns-bridge"
    - from: "tests/e2e/mdns-discovery.spec.ts"
      to: "daemon/"
      via: "tests full stack when daemon available"
      pattern: "daemon.*available|mdns.*discovery"
---

<objective>
Create comprehensive integration tests for mDNS discovery across web app, CLI, and daemon.

Purpose: Verify that mDNS discovery works correctly across all components (daemon mDNS server, WebSocket bridge, unified discovery manager, React hooks, and Go CLI).

Output: Three test files covering unit tests for MDNSBridge, daemon integration tests, and E2E discovery flow.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@lib/discovery/mdns-bridge.ts
@lib/discovery/unified-discovery.ts
@lib/discovery/mdns-types.ts
@lib/hooks/use-unified-discovery.ts
@daemon/src/mdns-server.ts
@daemon/src/websocket-server.ts
@tallow-cli/internal/discovery/discovery_test.go
@tests/unit/discovery/unified-discovery.test.ts
@tests/unit/discovery/mdns-types.test.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create MDNSBridge unit tests</name>
  <files>tests/unit/discovery/mdns-bridge.test.ts</files>
  <action>
Create comprehensive unit tests for the MDNSBridge class in lib/discovery/mdns-bridge.ts.

Test coverage should include:
1. Connection lifecycle (connect, disconnect, reconnect)
2. Discovery operations (startDiscovery, stopDiscovery, getDevices, refreshDevices)
3. Advertising operations (advertise, stopAdvertising, getIsAdvertising)
4. Message handling (device-found, device-lost, device-updated, device-list, error, status, pong)
5. Event handlers (setEventHandlers, on, off)
6. Message queue (queuing when disconnected, processing on connect)
7. Ping/pong keepalive mechanism
8. Connection timeout handling
9. isDaemonAvailable utility function

Mock WebSocket using vi.mock with a class that simulates:
- readyState (CONNECTING, OPEN, CLOSING, CLOSED)
- onopen, onclose, onerror, onmessage callbacks
- send() method that captures sent messages
- close() method

Use vitest describe/it/expect pattern matching existing tests in tests/unit/discovery/.
  </action>
  <verify>
Run: npm test -- tests/unit/discovery/mdns-bridge.test.ts
All tests pass with no errors.
  </verify>
  <done>
MDNSBridge class has unit test coverage for all public methods and WebSocket interaction patterns.
  </done>
</task>

<task type="auto">
  <name>Task 2: Create daemon integration tests</name>
  <files>tests/unit/discovery/daemon-integration.test.ts</files>
  <action>
Create integration tests that verify the daemon's WebSocket server and mDNS server work correctly together.

Since the daemon runs Node.js and uses bonjour-service + ws, create tests that:

1. Mock bonjour-service to simulate mDNS discovery events:
   - device-found with mock RemoteService
   - device-lost events
   - device-updated events

2. Mock ws WebSocketServer to simulate client connections:
   - Client connection handling
   - Message parsing and routing
   - Broadcast to all clients
   - Platform filtering

3. Test the message protocol:
   - Client sends 'start-discovery' -> Server starts mDNS discovery
   - Client sends 'advertise' -> Server advertises via mDNS
   - Server receives mDNS device -> broadcasts 'device-found' to clients
   - Client sends 'get-devices' -> Server responds with device-list
   - Client sends 'ping' -> Server responds with 'pong'

4. Test edge cases:
   - Multiple clients with different platform filters
   - Client disconnect cleanup
   - Invalid message handling

Import from daemon/src/websocket-server.ts and daemon/src/mdns-server.ts using relative imports.
Use vitest with proper mocking of bonjour-service and ws modules.
  </action>
  <verify>
Run: npm test -- tests/unit/discovery/daemon-integration.test.ts
All tests pass with no errors.
  </verify>
  <done>
Daemon WebSocket server and mDNS server integration is verified through unit tests.
  </done>
</task>

<task type="auto">
  <name>Task 3: Create E2E mDNS discovery test</name>
  <files>tests/e2e/mdns-discovery.spec.ts</files>
  <action>
Create a Playwright E2E test that verifies the full mDNS discovery flow.

The test should:

1. Check if daemon is available (ws://localhost:53318)
   - If not available, skip tests with appropriate message
   - Use test.skip() when daemon not running

2. When daemon is available, test:
   - Navigate to app page (/app)
   - Wait for unified discovery to initialize
   - Verify mDNS status indicator shows "connected" or similar
   - Verify device list updates when discovery starts
   - Test advertising this device via mDNS

3. Test the device list UI:
   - Check for data-testid="device-list" or similar
   - Verify discovered devices show source badge (mdns/signaling/both)
   - Test device filtering by platform if UI supports it

4. Use conditional test approach:
```typescript
test.describe('mDNS Discovery', () => {
  let daemonAvailable = false;

  test.beforeAll(async () => {
    // Check daemon availability via WebSocket
    daemonAvailable = await checkDaemonAvailable();
  });

  test('discovers devices via mDNS when daemon running', async ({ page }) => {
    test.skip(!daemonAvailable, 'mDNS daemon not running');
    // ... test implementation
  });
});
```

5. Include fallback tests that work without daemon:
   - Verify signaling-only discovery works
   - Verify UI gracefully handles mDNS unavailable state

Follow existing E2E test patterns in tests/e2e/*.spec.ts.
  </action>
  <verify>
Run: npx playwright test tests/e2e/mdns-discovery.spec.ts --reporter=list
Tests pass (some may skip if daemon not running, which is expected).
  </verify>
  <done>
E2E test validates mDNS discovery flow when daemon is available, and gracefully skips when not.
  </done>
</task>

</tasks>

<verification>
1. All unit tests pass: npm test -- tests/unit/discovery/
2. E2E test runs without errors: npx playwright test tests/e2e/mdns-discovery.spec.ts
3. No TypeScript errors: npx tsc --noEmit
4. Test coverage for discovery module increased
</verification>

<success_criteria>
- MDNSBridge unit tests cover connection, discovery, advertising, and message handling
- Daemon integration tests verify WebSocket server + mDNS server interaction
- E2E test validates full discovery flow (conditional on daemon availability)
- All tests follow existing patterns in the codebase
- Tests are properly typed with TypeScript
</success_criteria>

<output>
After completion, create `.planning/quick/010-mdns-discovery-integration-testing/010-SUMMARY.md`
</output>

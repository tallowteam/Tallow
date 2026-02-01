# Transfer Integration - Quick Debug Reference

**Quick access guide for debugging transfer integration issues**

---

## Critical State Dependencies

### State Variables to Monitor
```typescript
// Connection State
connectionType: 'local' | 'internet' | 'friends' | null  // Can be null!
isConnected: boolean
isConnecting: boolean

// Transfer Mode
transferMode: 'single' | 'group'
selectedDevice: Device | null              // Single mode only
selectedRecipientIds: string[]            // Group mode only

// Data State
availableRecipients: Device[]             // Computed from connectionType
selectedFiles: FileWithData[]
discoveredDevices: DiscoveredDevice[]
friends: Friend[]
```

### State Consistency Rules
✅ **Valid States**:
- `transferMode === 'single'` + `selectedDevice !== null` + `selectedRecipientIds === []`
- `transferMode === 'group'` + `selectedDevice === null` + `selectedRecipientIds.length > 0`
- `connectionType === null` + no selections

❌ **Invalid States** (bugs!):
- `transferMode === 'single'` + `selectedRecipientIds.length > 0`
- `transferMode === 'group'` + `selectedDevice !== null`
- `connectionType === 'internet'` + `transferMode === 'group'` (no recipients available)

---

## Common Bug Patterns

### Pattern 1: Empty availableRecipients
```typescript
// BUG: No validation before showing selector
const handleSelectRecipients = () => {
    setShowRecipientSelector(true); // Opens empty dialog
}

// FIX: Validate first
const handleSelectRecipients = () => {
    if (availableRecipients.length === 0) {
        toast.error('No devices available');
        return;
    }
    setShowRecipientSelector(true);
}
```

### Pattern 2: Type Inconsistency (lastSeen)
```typescript
// BUG: Mixed types
const device1 = { lastSeen: new Date() };        // Date object
const device2 = { lastSeen: Date.now() };        // number
devices.sort((a, b) => a.lastSeen - b.lastSeen); // BREAKS!

// FIX: Always use timestamps
const device = { lastSeen: Date.now() };         // Always number
```

### Pattern 3: State Update Race
```typescript
// BUG: Rapid toggles cause desync
const toggle = () => {
    setTransferMode(transferMode === 'single' ? 'group' : 'single');
    setSelectedRecipientIds([]); // May run before mode updates!
}

// FIX: Use functional updates
const toggle = () => {
    setTransferMode(prev => {
        const next = prev === 'single' ? 'group' : 'single';
        if (next === 'single') {
            setSelectedRecipientIds([]);
        }
        return next;
    });
}
```

### Pattern 4: Missing Device Validation
```typescript
// BUG: Device may have disconnected
const recipients = selectedRecipientIds.map(id => {
    const device = discoveredDevices.find(d => d.id === id);
    return { id, device }; // device could be undefined!
});

// FIX: Filter and validate
const recipients = selectedRecipientIds
    .map(id => discoveredDevices.find(d => d.id === id))
    .filter((d): d is Device => d !== undefined && d.isOnline);

if (recipients.length < selectedRecipientIds.length) {
    toast.warning('Some devices are offline');
}
```

---

## Debugging Checklist

### When Adding New Feature
- [ ] Validate all empty state scenarios
- [ ] Check type consistency (especially Date/number)
- [ ] Add guards for async state transitions
- [ ] Test with single and group modes
- [ ] Test with all connection types
- [ ] Handle device disconnect gracefully
- [ ] Add user feedback for all errors
- [ ] Debounce rapid user actions

### When Bug Reported
1. **Check state consistency**: Log all relevant state variables
2. **Verify prerequisites**: Are required devices/files present?
3. **Test mode transitions**: Single ↔ Group, connection type changes
4. **Check timing**: Race conditions in async operations?
5. **Validate boundaries**: Min/max limits enforced?

### Quick Debug Commands (Browser Console)
```javascript
// Inspect current state
console.log({
    connectionType: window.__connectionType,
    transferMode: window.__transferMode,
    selectedRecipientIds: window.__selectedRecipientIds,
    availableRecipients: window.__availableRecipients,
    isConnected: window.__isConnected
});

// Force invalid state (testing)
window.__setSelectedRecipientIds(['fake-id-1', 'fake-id-2']);
window.__setTransferMode('group');

// Trigger edge case
window.__setConnectionType('internet'); // Should clear recipients
```

---

## File-Specific Bug Locations

### app/app/page.tsx
- **Lines 234-271**: Device list conversion (type issues)
- **Lines 749-761**: Mode toggle (race conditions)
- **Lines 763-778**: Recipient selection (validation gaps)
- **Lines 780-870**: Group transfer initialization (device lookup failures)
- **Lines 2010-2080**: Connection type selection (no guards)

### components/app/RecipientSelector.tsx
- **Lines 138-154**: Device selection toggle (boundary check)
- **Lines 233-235**: Confirmation validation (min/max)
- **Lines 378-479**: Device list rendering (empty state)

### lib/hooks/use-group-transfer.ts
- **Lines 62-204**: Initialization (recipient validation)
- **Lines 209-258**: Send operation (connection checks)

---

## Testing Quick Commands

### Manual Test Scenarios
```bash
# Test empty states
1. Clear all devices → Enable group mode → Try to select recipients
2. Clear friends list → Switch to Friends mode → Enable group mode
3. Switch to Internet P2P → Try group transfer

# Test type issues
1. Create device with Date object → Sort by lastSeen
2. Create friend with number timestamp → Convert to Device
3. Check all Device creation sites for consistency

# Test state transitions
1. Select recipients → Switch connection type → Verify cleared
2. Select recipients → Toggle mode rapidly 10x → Check final state
3. Start transfer → Switch connection type → Should block

# Test boundaries
1. Select 11 recipients → Try to confirm (should reject)
2. Select 0 recipients → Try to confirm (should reject)
3. Select 1 recipient → Should suggest single mode

# Test race conditions
1. Open 2 tabs → Select different recipients in each → Confirm both
2. Click mode toggle 10 times rapidly
3. Start transfer → Disconnect device → Check handling
```

### Automated Test Command
```bash
npm run test tests/integration/transfer-integration.test.ts
```

---

## Common Error Messages & Fixes

### "No devices available"
**Cause**: Empty `availableRecipients` array
**Check**: Connection type, discovery status, friends list
**Fix**: Switch to Local/Friends mode or add devices/friends

### "No valid recipients found"
**Cause**: Selected devices offline or disconnected
**Check**: Device connection status, socketId availability
**Fix**: Re-select active devices or refresh device list

### "Transfer failed: peer connection not ready"
**Cause**: WebRTC connection not established
**Check**: `isConnected`, `pqcReady`, `dataChannel.readyState`
**Fix**: Wait for connection or reconnect

### "Cannot change connection type during transfer"
**Cause**: Attempted to switch while `groupTransfer.isTransferring`
**Check**: Transfer state
**Fix**: Wait for transfer completion

---

## Performance Monitoring

### Key Metrics to Track
```typescript
// Device Discovery Performance
discoveryStartTime: number
deviceListUpdateCount: number  // Should be < 10/min

// Transfer Performance
transferInitTime: number       // Should be < 2s
recipientConnectionTime: number // Should be < 5s per recipient
averageTransferSpeed: number   // Bytes/sec

// State Update Performance
modeToggleCount: number        // High count = potential issue
stateUpdateLatency: number     // Should be < 100ms
```

### Memory Leak Indicators
- `discoveredDevices.length` continuously growing
- `transfers` array never cleared
- Event listeners not cleaned up
- WebRTC connections not closed

---

## Key Dependencies

### State Flow
```
User Action
    ↓
Handler (validation)
    ↓
State Update (React.useState)
    ↓
useMemo Recomputation
    ↓
UI Re-render
    ↓
Effect Execution
```

### Critical useMemo Dependencies
```typescript
// These recompute when dependencies change:
localDevices ← [discoveredDevices]
friendDevices ← [friends]
availableRecipients ← [connectionType, localDevices, friendDevices]

// If availableRecipients changes, may invalidate:
- selectedRecipientIds (device IDs may no longer exist)
- RecipientSelector open state
- GroupTransferConfirmDialog
```

---

## Emergency Fixes

### Quick Patch for Production
```typescript
// Add to top of app/page.tsx
useEffect(() => {
    // Emergency: Clear invalid state on mount
    if (transferMode === 'single' && selectedRecipientIds.length > 0) {
        console.warn('Invalid state detected, clearing recipients');
        setSelectedRecipientIds([]);
    }
    if (transferMode === 'group' && selectedDevice !== null) {
        console.warn('Invalid state detected, clearing device');
        setSelectedDevice(null);
    }
    if (connectionType === 'internet' && transferMode === 'group') {
        console.warn('Invalid combination detected, switching to single mode');
        setTransferMode('single');
    }
}, [transferMode, selectedRecipientIds, selectedDevice, connectionType]);
```

### Force State Reset
```typescript
const resetAllTransferState = () => {
    setTransferMode('single');
    setConnectionType(null);
    setSelectedDevice(null);
    setSelectedRecipientIds([]);
    setSelectedFiles([]);
    cleanupConnection();
    toast.info('Transfer state reset');
};
```

---

## Code Smell Indicators

🚨 **RED FLAGS** (needs immediate attention):
- Multiple nested type checks: `typeof x === 'number' ? x : x.getTime()`
- Silent failures: `if (!device) return null; // No error thrown`
- Unsafe casts: `d.platform as any`
- Missing validation: `onClick={() => doThing()}` without checks
- Race-prone code: Multiple rapid `setState` calls

⚠️ **YELLOW FLAGS** (needs review):
- Large dependency arrays: `useCallback(..., [a, b, c, d, e])`
- Complex computed values: useMemo with > 10 lines
- Duplicated validation logic
- Magic numbers: `if (count > 10)` (should be constant)

---

## Related Files

### Must Review Together
- `app/app/page.tsx` - Main integration
- `components/app/RecipientSelector.tsx` - Selection UI
- `lib/hooks/use-group-transfer.ts` - Group transfer logic
- `lib/types.ts` - Type definitions
- `lib/storage/friends.ts` - Friends data

### Support Files
- `lib/discovery/local-discovery.ts` - Device discovery
- `lib/signaling/connection-manager.ts` - Connection management
- `lib/transfer/group-transfer-manager.ts` - Transfer execution

---

*Keep this file open while debugging!*
*Last Updated: 2026-01-27*

# Transfer Integration Bug Reproduction Scripts

**Automated test scripts and manual reproduction steps for all identified bugs**

---

## Table of Contents
1. [Empty State Issues](#empty-state-issues)
2. [Type Conversion Issues](#type-conversion-issues)
3. [State Transition Issues](#state-transition-issues)
4. [Race Condition Issues](#race-condition-issues)
5. [Boundary Condition Issues](#boundary-condition-issues)

---

## Empty State Issues

### BUG-001: No Discovered Devices

**Manual Reproduction**:
```
1. Open app in browser
2. Ensure no devices on network (or block discovery)
3. Click "Local Network" connection type
4. Enable "Group Transfer" mode
5. Click "Select Recipients"
6. Observe: Empty list with no helpful guidance
```

**Automated Test**:
```typescript
describe('BUG-001: No Discovered Devices', () => {
    it('should show helpful error when no devices available', async () => {
        const { getByText, queryByText } = render(<AppPage />);

        // Simulate no discovered devices
        mockDiscovery.setDevices([]);

        // Switch to Local Network
        await userEvent.click(getByText('Local Network'));

        // Enable group mode
        await userEvent.click(getByText('Enable Group Transfer'));

        // Try to select recipients
        await userEvent.click(getByText('Select Recipients'));

        // Should show helpful error
        expect(queryByText(/No devices discovered/i)).toBeInTheDocument();
        expect(queryByText(/ensure devices are on the same network/i)).toBeInTheDocument();
    });
});
```

**Browser Console Script**:
```javascript
// Simulate empty device scenario
window.testEmptyDevices = () => {
    // Clear discovered devices
    const discovery = window.__getLocalDiscovery();
    discovery.clearAllDevices();

    // Try to enable group transfer
    window.__setConnectionType('local');
    window.__setTransferMode('group');

    // Try to select recipients (should fail gracefully)
    window.__handleSelectRecipients();

    console.log('✅ Test complete - check for error message');
};

// Run test
window.testEmptyDevices();
```

---

### BUG-002: No Friends Added

**Manual Reproduction**:
```
1. Clear all friends from storage: localStorage.removeItem('tallow_friends')
2. Reload app
3. Click "Friends" connection type
4. Enable "Group Transfer" mode
5. Click "Select Recipients"
6. Observe: Empty list with no onboarding
```

**Automated Test**:
```typescript
describe('BUG-002: No Friends Added', () => {
    it('should show onboarding when friends list empty', async () => {
        // Clear friends
        mockFriendsStorage.clear();

        const { getByText, queryByText } = render(<AppPage />);

        await userEvent.click(getByText('Friends'));
        await userEvent.click(getByText('Enable Group Transfer'));
        await userEvent.click(getByText('Select Recipients'));

        // Should show onboarding prompt
        expect(queryByText(/No friends added yet/i)).toBeInTheDocument();
        expect(queryByText(/Add friends to start sharing/i)).toBeInTheDocument();
    });
});
```

**Browser Console Script**:
```javascript
// Test empty friends scenario
window.testNoFriends = async () => {
    // Clear friends
    await window.__secureStorage.setItem('tallow_friends', '[]');
    window.__setFriends([]);

    // Switch to friends mode
    window.__setConnectionType('friends');
    window.__setTransferMode('group');

    // Check available recipients
    console.log('Available recipients:', window.__availableRecipients);
    console.assert(
        window.__availableRecipients.length === 0,
        '❌ Should have no recipients'
    );

    console.log('✅ Test complete');
};

window.testNoFriends();
```

---

### BUG-003: Switch to Group Mode with Empty Lists

**Manual Reproduction**:
```
1. Disconnect from network (no devices discovered)
2. Enable "Group Transfer" mode
3. Observe: Mode switches but user can't proceed
4. No warning that recipients needed
```

**Automated Test**:
```typescript
describe('BUG-003: Group Mode with Empty Lists', () => {
    it('should warn when switching to group with no recipients', async () => {
        mockDiscovery.setDevices([]);

        const { getByText } = render(<AppPage />);

        // Enable group transfer with no devices
        await userEvent.click(getByText('Enable Group Transfer'));

        // Should show warning toast
        await waitFor(() => {
            expect(mockToast.warning).toHaveBeenCalledWith(
                expect.stringMatching(/No devices available/i)
            );
        });
    });
});
```

---

## Type Conversion Issues

### BUG-004: lastSeen Date/Number Inconsistency

**Manual Reproduction**:
```
1. Add device with Date object: devices.push({ lastSeen: new Date() })
2. Add device with number: devices.push({ lastSeen: Date.now() })
3. Sort devices by lastSeen
4. Observe: Incorrect sorting or NaN errors
```

**Automated Test**:
```typescript
describe('BUG-004: lastSeen Type Inconsistency', () => {
    it('should handle mixed Date/number types in lastSeen', () => {
        const device1: Device = {
            id: '1',
            name: 'Device 1',
            lastSeen: new Date().getTime(), // number
            // ... other props
        };

        const device2 = {
            id: '2',
            name: 'Device 2',
            lastSeen: new Date(), // Date object (BUG!)
            // ... other props
        };

        // Attempt to sort
        const devices = [device1, device2 as any];
        const sorted = devices.sort((a, b) => a.lastSeen - b.lastSeen);

        // This will produce NaN if not handled correctly
        expect(typeof sorted[0].lastSeen).toBe('number');
        expect(isNaN(sorted[0].lastSeen as number)).toBe(false);
    });

    it('should normalize all lastSeen values to numbers', () => {
        const discoveredDevice = {
            id: 'test',
            name: 'Test Device',
            lastSeen: new Date(), // Discovery returns Date
            isOnline: true,
        };

        // Convert to Device
        const device = convertToDevice(discoveredDevice);

        expect(typeof device.lastSeen).toBe('number');
        expect(device.lastSeen).toBeGreaterThan(0);
    });
});
```

**Browser Console Script**:
```javascript
// Test type inconsistency
window.testLastSeenTypes = () => {
    const devices = [
        { id: '1', name: 'Device 1', lastSeen: Date.now() },
        { id: '2', name: 'Device 2', lastSeen: new Date() }, // Wrong type!
    ];

    // Try to sort
    try {
        const sorted = devices.sort((a, b) => a.lastSeen - b.lastSeen);
        console.log('Sorted:', sorted);

        // Check for NaN
        const hasNaN = sorted.some(d => isNaN(d.lastSeen));
        console.assert(!hasNaN, '❌ NaN detected in sorting!');
    } catch (err) {
        console.error('❌ Sorting failed:', err);
    }
};

window.testLastSeenTypes();
```

---

## State Transition Issues

### BUG-007: Connection Type Switch During Group Transfer

**Manual Reproduction**:
```
1. Select 5 devices in Local Network mode
2. Click "Select Recipients" → Choose 5 devices → Confirm
3. Start group transfer (files begin sending)
4. While transfer in progress, click "Internet P2P"
5. Observe: availableRecipients becomes empty
6. Group transfer tracking breaks
```

**Automated Test**:
```typescript
describe('BUG-007: Connection Type Switch During Transfer', () => {
    it('should block connection type change during active transfer', async () => {
        const { getByText } = render(<AppPage />);

        // Setup: Local mode with devices
        await setupLocalDevices(['device-1', 'device-2']);
        await userEvent.click(getByText('Local Network'));
        await userEvent.click(getByText('Enable Group Transfer'));

        // Select files and recipients
        await selectFiles(['file1.txt']);
        await selectRecipients(['device-1', 'device-2']);

        // Start transfer
        await userEvent.click(getByText('Send to Group'));

        // Try to switch connection type (should block)
        await userEvent.click(getByText('Internet P2P'));

        // Should show error
        expect(mockToast.error).toHaveBeenCalledWith(
            expect.stringMatching(/Cannot change connection type/i)
        );

        // Connection type should remain unchanged
        expect(window.__connectionType).toBe('local');
    });
});
```

**Browser Console Script**:
```javascript
// Simulate connection switch during transfer
window.testConnectionSwitchDuringTransfer = async () => {
    // Start fake transfer
    window.__groupTransfer.isTransferring = true;

    // Try to switch connection type
    const originalType = window.__connectionType;
    window.__setConnectionType('internet');

    // Check if blocked
    setTimeout(() => {
        if (window.__connectionType !== originalType) {
            console.error('❌ Connection type changed during transfer!');
        } else {
            console.log('✅ Connection type change correctly blocked');
        }

        // Cleanup
        window.__groupTransfer.isTransferring = false;
    }, 100);
};

window.testConnectionSwitchDuringTransfer();
```

---

### BUG-008: Toggle Mode with Selected Recipients

**Manual Reproduction**:
```
1. Enable group transfer mode
2. Open RecipientSelector, select 3 devices (don't confirm)
3. Click Cancel
4. Toggle to single mode
5. Toggle back to group mode
6. Open RecipientSelector again
7. Observe: Old selections may still be visible in component
```

**Automated Test**:
```typescript
describe('BUG-008: Mode Toggle State Desync', () => {
    it('should clear recipient selections when toggling modes', async () => {
        const { getByText, getByLabelText } = render(<AppPage />);

        // Enable group mode
        await userEvent.click(getByText('Enable Group Transfer'));

        // Select recipients
        await userEvent.click(getByText('Select Recipients'));
        await userEvent.click(getByLabelText('Device 1'));
        await userEvent.click(getByLabelText('Device 2'));
        await userEvent.click(getByText('Continue'));

        // Verify selection
        expect(window.__selectedRecipientIds).toHaveLength(2);

        // Toggle to single mode
        await userEvent.click(getByText('Disable Group Transfer'));

        // Verify recipients cleared
        expect(window.__selectedRecipientIds).toHaveLength(0);

        // Toggle back to group
        await userEvent.click(getByText('Enable Group Transfer'));

        // Open selector again
        await userEvent.click(getByText('Select Recipients'));

        // Should have no pre-selected devices
        const selectedCheckboxes = screen.queryAllByRole('checkbox', { checked: true });
        expect(selectedCheckboxes).toHaveLength(0);
    });
});
```

---

## Race Condition Issues

### BUG-011: Rapid Mode Switching

**Manual Reproduction**:
```
1. Use browser console or automation tool
2. Rapidly toggle mode 10 times in 1 second:
   for (let i = 0; i < 10; i++) {
       handleToggleTransferMode();
       await sleep(100);
   }
3. Check final state - may be inconsistent
```

**Automated Test**:
```typescript
describe('BUG-011: Rapid Mode Switching', () => {
    it('should handle rapid mode toggles without state corruption', async () => {
        const { getByText } = render(<AppPage />);

        // Setup initial state
        const device = createMockDevice('device-1');
        window.__setSelectedDevice(device);

        // Rapidly toggle 10 times
        for (let i = 0; i < 10; i++) {
            await userEvent.click(getByText(/Enable|Disable Group Transfer/));
        }

        // Wait for all state updates
        await waitFor(() => {
            const mode = window.__transferMode;
            const device = window.__selectedDevice;
            const recipients = window.__selectedRecipientIds;

            // Validate consistency
            if (mode === 'single') {
                expect(recipients).toHaveLength(0);
            } else {
                expect(device).toBeNull();
            }
        });
    });
});
```

**Browser Console Script**:
```javascript
// Stress test mode switching
window.testRapidModeSwitch = async () => {
    console.log('Starting rapid mode switch test...');

    const initialMode = window.__transferMode;
    let inconsistenciesDetected = 0;

    // Toggle 20 times rapidly
    for (let i = 0; i < 20; i++) {
        window.__handleToggleTransferMode();

        // Check consistency immediately
        await new Promise(resolve => setTimeout(resolve, 50));

        const mode = window.__transferMode;
        const device = window.__selectedDevice;
        const recipients = window.__selectedRecipientIds;

        // Validate
        if (mode === 'single' && recipients.length > 0) {
            inconsistenciesDetected++;
            console.error(`❌ Iteration ${i}: Single mode with recipients!`);
        }
        if (mode === 'group' && device !== null) {
            inconsistenciesDetected++;
            console.error(`❌ Iteration ${i}: Group mode with device!`);
        }
    }

    console.log(`Test complete. Inconsistencies: ${inconsistenciesDetected}`);
    console.log(`Final mode: ${window.__transferMode}`);
};

window.testRapidModeSwitch();
```

---

### BUG-012: Concurrent Recipient Selection (Multi-Tab)

**Manual Reproduction**:
```
1. Open app in two browser tabs (Tab A and Tab B)
2. Tab A: Enable group mode, select 3 devices
3. Tab B: Enable group mode, select different 5 devices
4. Tab A: Click "Continue"
5. Tab B: Click "Continue" (overwrites Tab A selection)
6. Only Tab B selection persists
```

**Automated Test**:
```typescript
describe('BUG-012: Multi-Tab Concurrent Selection', () => {
    it('should handle concurrent selections from multiple tabs', async () => {
        // Simulate two instances
        const instance1 = renderInNewContext(<AppPage />);
        const instance2 = renderInNewContext(<AppPage />);

        // Both select recipients simultaneously
        await Promise.all([
            selectRecipientsInInstance(instance1, ['device-1', 'device-2']),
            selectRecipientsInInstance(instance2, ['device-3', 'device-4']),
        ]);

        // Verify conflict detection or resolution
        // Should show warning or sync state
        expect(mockToast.warning).toHaveBeenCalledWith(
            expect.stringMatching(/Another instance detected/i)
        );
    });
});
```

**Browser Console Script**:
```javascript
// Simulate multi-tab conflict
window.testMultiTabConflict = () => {
    // Save current selection
    const originalSelection = window.__selectedRecipientIds;

    // Simulate another tab's update (via localStorage event)
    const conflictingSelection = ['device-x', 'device-y', 'device-z'];

    localStorage.setItem('tallow_pending_selection', JSON.stringify({
        tabId: 'other-tab',
        selection: conflictingSelection,
        timestamp: Date.now(),
    }));

    // Trigger storage event
    window.dispatchEvent(new StorageEvent('storage', {
        key: 'tallow_pending_selection',
        newValue: JSON.stringify({
            tabId: 'other-tab',
            selection: conflictingSelection,
            timestamp: Date.now(),
        }),
    }));

    // Check if conflict detected
    setTimeout(() => {
        console.log('Original selection:', originalSelection);
        console.log('Current selection:', window.__selectedRecipientIds);
        console.log('Should have shown conflict warning');
    }, 1000);
};

window.testMultiTabConflict();
```

---

## Boundary Condition Issues

### BUG-014: Maximum Recipients Enforcement

**Manual Reproduction**:
```
1. Enable group mode
2. Open RecipientSelector
3. Use DevTools console: window.__setSelectedRecipientIds(Array(50).fill('device-id'))
4. Click "Continue"
5. Observe: May accept > 10 recipients
```

**Automated Test**:
```typescript
describe('BUG-014: Maximum Recipients Enforcement', () => {
    it('should reject selections exceeding max limit', async () => {
        const { getByText } = render(<AppPage />);

        // Try to select 15 recipients (over limit of 10)
        const tooManyRecipients = Array(15).fill(null).map((_, i) => `device-${i}`);

        // Simulate direct state manipulation
        act(() => {
            window.__setSelectedRecipientIds(tooManyRecipients);
        });

        // Try to confirm
        await userEvent.click(getByText('Continue'));

        // Should show error and truncate
        expect(mockToast.error).toHaveBeenCalledWith(
            expect.stringMatching(/Maximum 10 recipients/i)
        );

        expect(window.__selectedRecipientIds.length).toBeLessThanOrEqual(10);
    });
});
```

**Browser Console Script**:
```javascript
// Test max recipients bypass
window.testMaxRecipientsBypass = () => {
    console.log('Testing maximum recipients enforcement...');

    // Try to set > 10 recipients
    const tooMany = Array(15).fill(null).map((_, i) => `device-${i}`);

    window.__setSelectedRecipientIds(tooMany);

    console.log(`Set ${tooMany.length} recipients`);

    // Try to proceed
    try {
        window.__handleRecipientSelectionConfirm();

        // Check if blocked
        const current = window.__selectedRecipientIds;
        if (current.length > 10) {
            console.error('❌ SECURITY ISSUE: More than 10 recipients accepted!');
        } else {
            console.log('✅ Correctly limited to', current.length, 'recipients');
        }
    } catch (err) {
        console.log('✅ Correctly threw error:', err.message);
    }
};

window.testMaxRecipientsBypass();
```

---

### BUG-016: Single Recipient in Group Mode

**Manual Reproduction**:
```
1. Enable group mode
2. Select only 1 recipient
3. Start transfer
4. Observe: Group transfer overhead for single device
5. No suggestion to use single mode
```

**Automated Test**:
```typescript
describe('BUG-016: Single Recipient in Group Mode', () => {
    it('should suggest single mode when only one recipient selected', async () => {
        const { getByText } = render(<AppPage />);

        await userEvent.click(getByText('Enable Group Transfer'));
        await selectRecipients(['device-1']); // Only 1 recipient

        await userEvent.click(getByText('Continue'));

        // Should show suggestion
        expect(mockToast.info).toHaveBeenCalledWith(
            expect.stringMatching(/Only one recipient/i),
            expect.objectContaining({
                action: expect.objectContaining({
                    label: expect.stringMatching(/Switch to Single Mode/i),
                }),
            })
        );
    });
});
```

---

## Comprehensive Test Suite

**Run All Tests**:
```bash
# Unit tests
npm run test -- transfer-integration

# Integration tests
npm run test:integration -- transfer-bugs

# E2E tests
npm run test:e2e -- transfer-edge-cases

# Stress tests
npm run test:stress -- transfer-race-conditions
```

**Playwright E2E Test Suite**:
```typescript
// tests/e2e/transfer-bugs.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Transfer Integration Bug Reproduction', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/app');
    });

    test('BUG-001: Empty devices warning', async ({ page }) => {
        // Clear devices
        await page.evaluate(() => {
            window.__getLocalDiscovery().clearAllDevices();
        });

        await page.click('text=Local Network');
        await page.click('text=Enable Group Transfer');
        await page.click('text=Select Recipients');

        await expect(page.locator('text=No devices discovered')).toBeVisible();
    });

    test('BUG-007: Block connection change during transfer', async ({ page }) => {
        // Setup transfer in progress
        await page.evaluate(() => {
            window.__groupTransfer.isTransferring = true;
        });

        await page.click('text=Internet P2P');

        // Should show error toast
        await expect(page.locator('.toast-error')).toContainText(
            /Cannot change connection type/i
        );
    });

    test('BUG-011: Rapid mode toggle', async ({ page }) => {
        // Toggle rapidly
        for (let i = 0; i < 10; i++) {
            await page.click('button:has-text("Enable Group Transfer"), button:has-text("Disable Group Transfer")');
        }

        // Wait for state to settle
        await page.waitForTimeout(500);

        // Verify consistent state
        const stateValid = await page.evaluate(() => {
            const mode = window.__transferMode;
            const device = window.__selectedDevice;
            const recipients = window.__selectedRecipientIds;

            return (mode === 'single' && recipients.length === 0) ||
                   (mode === 'group' && device === null);
        });

        expect(stateValid).toBe(true);
    });
});
```

---

## Helper Functions for Testing

**Setup Utilities**:
```typescript
// test-utils/transfer-helpers.ts

export async function setupLocalDevices(deviceIds: string[]) {
    const devices = deviceIds.map(id => createMockDevice(id));
    mockDiscovery.setDevices(devices);
    return devices;
}

export async function selectFiles(filenames: string[]) {
    const files = filenames.map(name => createMockFile(name));
    await userEvent.upload(screen.getByLabelText('Select files'), files);
}

export async function selectRecipients(deviceIds: string[]) {
    await userEvent.click(screen.getByText('Select Recipients'));

    for (const id of deviceIds) {
        await userEvent.click(screen.getByLabelText(`Device ${id}`));
    }

    await userEvent.click(screen.getByText('Continue'));
}

export function createMockDevice(id: string): Device {
    return {
        id,
        name: `Device ${id}`,
        platform: 'web',
        ip: null,
        port: null,
        isOnline: true,
        isFavorite: false,
        lastSeen: Date.now(), // Always number!
        avatar: null,
    };
}

export function createMockFile(name: string, size = 1024): File {
    return new File(['content'], name, { type: 'text/plain' });
}
```

---

## Quick Test Commands

```bash
# Test specific bug
npm test -- -t "BUG-001"

# Test all empty state issues
npm test -- -t "Empty State"

# Test all race conditions
npm test -- -t "Race Condition"

# Run with coverage
npm test -- --coverage transfer-integration

# Watch mode for development
npm test -- --watch transfer-integration

# Stress test (100 iterations)
npm run test:stress -- --iterations=100
```

---

*Use these scripts to validate fixes and prevent regressions!*
*Add new reproduction scripts as bugs are discovered.*

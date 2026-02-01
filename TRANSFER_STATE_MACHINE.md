# Transfer Integration State Machine

Visual representation of valid state transitions and edge cases

---

## 1. Connection Type State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                   CONNECTION TYPE STATES                     │
└─────────────────────────────────────────────────────────────┘

         ┌──────────┐
         │   NULL   │ (Initial State)
         └────┬─────┘
              │
       ┌──────┴──────┬───────────────┐
       │             │               │
       ▼             ▼               ▼
  ┌────────┐    ┌─────────┐    ┌─────────┐
  │ LOCAL  │    │INTERNET │    │ FRIENDS │
  └────┬───┘    └────┬────┘    └────┬────┘
       │             │               │
       │             │               │
       └─────────┬───┴───────────────┘
                 │
                 ▼
          [User can switch]
                 │
                 ▼
         ┌───────────────┐
         │ ⚠️  GUARD:     │
         │ Block if      │
         │ transfer      │
         │ in progress   │
         └───────────────┘

VALID TRANSITIONS:
• null → local ✅
• null → internet ✅
• null → friends ✅
• local ↔ internet ✅ (if not transferring)
• local ↔ friends ✅ (if not transferring)
• internet ↔ friends ✅ (if not transferring)

BLOCKED TRANSITIONS:
• any → any ❌ (while groupTransfer.isTransferring)
• any → any ⚠️ (should warn if selectedRecipientIds.length > 0)
```

---

## 2. Transfer Mode State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                   TRANSFER MODE STATES                       │
└─────────────────────────────────────────────────────────────┘

        ┌────────────┐
        │   SINGLE   │ (Default)
        └─────┬──────┘
              │
              │ [Toggle Mode]
              │
              ▼
        ┌──────────────────┐
        │  Validation:      │
        │  1. Clear device  │
        │  2. Reset state   │
        └──────┬───────────┘
               │
               ▼
        ┌────────────┐
        │   GROUP    │
        └─────┬──────┘
              │
              │ [Toggle Mode]
              │
              ▼
        ┌──────────────────┐
        │  Validation:      │
        │  1. Clear IDs     │
        │  2. Close dialogs │
        └──────┬───────────┘
               │
               ▼
        ┌────────────┐
        │   SINGLE   │
        └────────────┘

SIDE EFFECTS:
single → group:
  • setSelectedDevice(null) ✅
  • setSelectedRecipientIds([]) ⚠️ (should keep if valid)
  • Close connection if exists ⚠️ (needs warning)

group → single:
  • setSelectedRecipientIds([]) ✅
  • setSelectedDevice(null) ✅ (already null)
  • Close group dialogs ⚠️ (missing)

EDGE CASES:
❌ Rapid toggle (< 500ms): Can cause state corruption
⚠️ Toggle during transfer: Should block completely
⚠️ Toggle with open dialogs: Should close first
```

---

## 3. Recipient Selection State Flow

```
┌─────────────────────────────────────────────────────────────┐
│                RECIPIENT SELECTION FLOW                      │
└─────────────────────────────────────────────────────────────┘

START
  │
  ▼
┌─────────────────────┐
│ Check Prerequisites │
│ • files.length > 0  │
│ • mode === 'group'  │
│ • connectionType OK │
└──────┬──────────────┘
       │
       ▼ [Valid]
┌─────────────────────┐
│ Compute Available   │
│ Recipients List     │
└──────┬──────────────┘
       │
       ├──────→ Empty? ──→ ❌ Error: "No devices available"
       │
       ▼ [Has Devices]
┌─────────────────────┐
│ Open Selector       │
│ Dialog              │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ User Selects        │
│ Devices (1-10)      │
└──────┬──────────────┘
       │
       ├──────→ Cancel ──→ [Clear Selection] → END
       │
       ▼ [Confirm]
┌─────────────────────┐
│ Validate Selection  │
│ • count >= 1        │
│ • count <= 10       │
│ • all online?       │
└──────┬──────────────┘
       │
       ├──────→ Invalid ──→ ❌ Error Message
       │
       ▼ [Valid]
┌─────────────────────┐
│ Show Confirm Dialog │
└──────┬──────────────┘
       │
       ▼ [User Confirms]
┌─────────────────────┐
│ Initialize Transfer │
│ • Get socket IDs    │
│ • Validate devices  │
│ • Start transfer    │
└──────┬──────────────┘
       │
       ▼
END (Transfer running)

KEY VALIDATION POINTS:
1️⃣ Check files selected
2️⃣ Check recipients available
3️⃣ Check all devices online
4️⃣ Check socket IDs exist
5️⃣ Check max/min limits

MISSING VALIDATIONS (BUGS):
⚠️ Step 2: connectionType === 'internet' not checked
⚠️ Step 3: Device disconnect not detected
⚠️ Step 4: Socket ID null check too late
⚠️ Step 5: Max limit not enforced in handler
```

---

## 4. Device Availability State

```
┌─────────────────────────────────────────────────────────────┐
│              DEVICE AVAILABILITY STATE MODEL                 │
└─────────────────────────────────────────────────────────────┘

For Each Device:

    ┌─────────────┐
    │ DISCOVERED  │ (Added to discoveredDevices)
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │   ONLINE    │ (isOnline: true, socketId exists)
    └──────┬──────┘
           │
           ├────→ [Network Change]
           │             │
           │             ▼
           │      ┌─────────────┐
           │      │   OFFLINE   │ (isOnline: false)
           │      └──────┬──────┘
           │             │
           │             ├────→ [Reconnect]
           │             │             │
           │             │             ▼
           │             │      ┌─────────────┐
           │             │      │   ONLINE    │
           │             │      └─────────────┘
           │             │
           │             └────→ [Timeout: 10s]
           │                           │
           │                           ▼
           │                    ┌─────────────┐
           │                    │   REMOVED   │
           │                    └─────────────┘
           │
           └────→ [Selected for Transfer]
                         │
                         ▼
                  ┌─────────────┐
                  │  SELECTED   │
                  └──────┬──────┘
                         │
                         ├────→ [Goes Offline] ─→ ❌ BUG: Not detected!
                         │
                         ▼
                  ┌─────────────┐
                  │TRANSFERRING │
                  └──────┬──────┘
                         │
                         ├────→ Success → ONLINE
                         └────→ Failed → ERROR

CRITICAL TRANSITIONS MISSING HANDLING:
1. SELECTED → OFFLINE: Should remove from selection
2. TRANSFERRING → OFFLINE: Should cancel transfer for that device
3. ONLINE → REMOVED: Should invalidate selection

RACE CONDITIONS:
⚠️ Device added during map operation
⚠️ Device removed during transfer init
⚠️ socketId becomes null after validation
```

---

## 5. Combined State Matrix

```
┌───────────────────────────────────────────────────────────────────────┐
│              VALID STATE COMBINATIONS MATRIX                          │
└───────────────────────────────────────────────────────────────────────┘

Connection Type │ Transfer Mode │ Selected Device │ Selected IDs │ Valid?
─────────────────┼───────────────┼─────────────────┼──────────────┼────────
null            │ single        │ null            │ []           │ ✅ (init)
null            │ group         │ null            │ []           │ ⚠️ (useless)
local           │ single        │ Device A        │ []           │ ✅ (ready)
local           │ single        │ null            │ []           │ ✅ (no conn)
local           │ group         │ null            │ [A,B,C]      │ ✅ (ready)
local           │ group         │ null            │ []           │ ⚠️ (need select)
internet        │ single        │ Device A        │ []           │ ✅ (ready)
internet        │ group         │ null            │ []           │ ❌ (no devices)
internet        │ group         │ null            │ [A,B]        │ ❌ (impossible)
friends         │ single        │ Friend A        │ []           │ ✅ (ready)
friends         │ group         │ null            │ [A,B,C]      │ ✅ (ready)
local           │ single        │ Device A        │ [B,C]        │ ❌ BUG!
local           │ group         │ Device A        │ [B,C]        │ ❌ BUG!
any             │ any           │ null            │ []           │ ⚠️ (can't send)

KEY INSIGHTS:
• internet + group = ALWAYS invalid (no availableRecipients)
• single mode MUST have selectedDevice OR isConnecting
• group mode MUST have selectedRecipientIds.length > 0
• NEVER both selectedDevice AND selectedRecipientIds populated

INVARIANTS TO ENFORCE:
1. (transferMode === 'single') → (selectedRecipientIds.length === 0)
2. (transferMode === 'group') → (selectedDevice === null)
3. (connectionType === 'internet') → (transferMode !== 'group')
4. (selectedRecipientIds.length > 0) → (availableRecipients includes all IDs)
```

---

## 6. Error State Transitions

```
┌─────────────────────────────────────────────────────────────┐
│                   ERROR HANDLING FLOW                        │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  Normal State    │
└────────┬─────────┘
         │
         │ [Error Occurs]
         │
         ▼
┌──────────────────┐      ┌─────────────────────────┐
│  Error Detection │────→ │  Determine Severity:    │
└────────┬─────────┘      │  • Critical (data loss) │
         │                │  • High (can't proceed) │
         │                │  • Medium (can recover) │
         │                └─────────────────────────┘
         │
         ├────→ Critical ─────→ [Reset All State]
         │                            │
         │                            ▼
         │                     ┌──────────────────┐
         │                     │ Clear selections │
         │                     │ Close connections│
         │                     │ Show error toast │
         │                     └──────────────────┘
         │
         ├────→ High ─────────→ [Partial Reset]
         │                            │
         │                            ▼
         │                     ┌──────────────────┐
         │                     │ Keep files/mode  │
         │                     │ Clear recipients │
         │                     │ Allow retry      │
         │                     └──────────────────┘
         │
         └────→ Medium ───────→ [Show Warning]
                                       │
                                       ▼
                                ┌──────────────────┐
                                │ Keep all state   │
                                │ Suggest action   │
                                │ Auto-retry?      │
                                └──────────────────┘

CURRENT BUGS:
❌ Many errors silently fail (return null)
❌ No severity classification
❌ Inconsistent reset behavior
⚠️ Some errors clear too much state
⚠️ Some errors clear too little state
```

---

## 7. Timing Diagram (Critical Race Condition)

```
┌─────────────────────────────────────────────────────────────┐
│          RACE CONDITION: RAPID MODE TOGGLE                   │
└─────────────────────────────────────────────────────────────┘

Time  │ User Action          │ State Updates (Queued)
──────┼──────────────────────┼─────────────────────────────────
  0ms │ Click "Enable Group" │
  1ms │                      │ → setTransferMode('group')
  2ms │                      │ → setSelectedDevice(null)
100ms │ Click "Disable"      │ [First update not applied yet!]
101ms │                      │ → setTransferMode('single')
102ms │                      │ → setSelectedRecipientIds([])
150ms │                      │ [React batches updates...]
200ms │ FINAL STATE:         │ transferMode: 'single' ✅
      │                      │ selectedDevice: null ✅
      │                      │ selectedRecipientIds: [] ✅
      │                      │ BUT: Missing intermediate cleanup!

ACTUAL BUG SCENARIO:
Time  │ User Action          │ State Updates
──────┼──────────────────────┼─────────────────────────────────
  0ms │ Mode: single         │ selectedDevice: DeviceA
      │ Device: DeviceA      │ selectedRecipientIds: []
 10ms │ Click "Enable Group" │
 11ms │                      │ → setTransferMode('group') [queued]
 12ms │                      │ → setSelectedDevice(null) [queued]
 15ms │ Click "Disable"      │ [Reads OLD transferMode!]
 16ms │                      │ Uses transferMode === 'single' (wrong!)
 17ms │                      │ → setTransferMode('group') [queued]
 18ms │                      │ → setSelectedDevice(null) [queued]
200ms │ FINAL STATE:         │ transferMode: 'group' ❌
      │                      │ selectedDevice: null ✅
      │                      │ selectedRecipientIds: [] ❌
      │                      │ Result: Invalid state!

FIX: Use ref to track in-progress update or debounce
```

---

## 8. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              DATA FLOW: DEVICE DISCOVERY → UI                │
└─────────────────────────────────────────────────────────────┘

LocalDiscovery                  State                    UI
─────────────                  ─────                    ───

    [Scan]
       │
       ▼
 Emit: device-found ─────→ discoveredDevices ─┐
       │                         │             │
       │                         ▼             │
       │                  useMemo:             │
       │                  localDevices ────────┤
       │                         │             │
       │                         │             │
ConnectionManager               │             │
─────────────────               │             │
    [Friend Connected]          │             │
       │                        │             │
       ▼                        │             │
 getFriends() ──────────→ friends             │
                                │             │
                                ▼             │
                         useMemo:             │
                         friendDevices ───────┤
                                              │
                                              │
                                              ▼
                                        useMemo:
                                   availableRecipients
                                              │
                                              ├──→ DeviceList
                                              ├──→ RecipientSelector
                                              └──→ GroupConfirm

ISSUES:
1. discoveredDevices updates → localDevices recomputes → availableRecipients recomputes
   BUT: selectedRecipientIds not validated against new list!

2. Connection type change → availableRecipients changes completely
   BUT: selectedRecipientIds still has old IDs!

3. Friend list update → friendDevices recomputes
   BUT: RecipientSelector may be open with stale data!

NEEDED:
• useEffect to validate selectedRecipientIds when availableRecipients changes
• Guard against availableRecipients changing during open dialog
• Lock recipient list during transfer initialization
```

---

## 9. State Validation Rules (Automated)

```typescript
/**
 * Add this to app/page.tsx useEffect for debugging
 */
useEffect(() => {
    // Validate state consistency
    const errors: string[] = [];

    // Rule 1: Single mode shouldn't have recipients
    if (transferMode === 'single' && selectedRecipientIds.length > 0) {
        errors.push('Invalid: Single mode with recipients selected');
    }

    // Rule 2: Group mode shouldn't have single device
    if (transferMode === 'group' && selectedDevice !== null) {
        errors.push('Invalid: Group mode with single device selected');
    }

    // Rule 3: Internet + Group = impossible
    if (connectionType === 'internet' && transferMode === 'group') {
        errors.push('Invalid: Internet P2P cannot use group mode');
    }

    // Rule 4: Selected recipients must exist in available list
    const invalidRecipients = selectedRecipientIds.filter(
        id => !availableRecipients.find(d => d.id === id)
    );
    if (invalidRecipients.length > 0) {
        errors.push(`Invalid: ${invalidRecipients.length} recipients not in available list`);
    }

    // Rule 5: Max recipients limit
    if (selectedRecipientIds.length > 10) {
        errors.push('Invalid: More than 10 recipients selected');
    }

    if (errors.length > 0) {
        console.error('❌ State validation failed:', errors);
        // In production: Auto-fix or show recovery UI
    }
}, [transferMode, selectedDevice, selectedRecipientIds, connectionType, availableRecipients]);
```

---

## 10. Recovery Paths

```
┌─────────────────────────────────────────────────────────────┐
│              ERROR RECOVERY STATE MACHINE                    │
└─────────────────────────────────────────────────────────────┘

For Each Error Type:

EMPTY_RECIPIENTS:
  Detect: availableRecipients.length === 0 when trying to select
  Recover:
    1. Switch to different connection type
    2. OR Add friends
    3. OR Wait for discovery
  UI: Show helpful message with action buttons

TYPE_MISMATCH:
  Detect: typeof device.lastSeen !== 'number'
  Recover:
    1. Normalize value: Date → getTime()
    2. Update device object
    3. Continue operation
  UI: Silent fix with console warning

DEVICE_OFFLINE:
  Detect: selectedDevice.isOnline === false
  Recover:
    1. Remove from selection
    2. Notify user
    3. Allow re-selection
  UI: Toast with "Remove" action

STATE_CORRUPTION:
  Detect: transferMode + selections mismatch
  Recover:
    1. Determine "source of truth" (most recent action)
    2. Clear conflicting state
    3. Toast explanation
  UI: Show "State reset" message

RACE_CONDITION:
  Detect: Multiple rapid updates detected
  Recover:
    1. Cancel pending updates
    2. Apply last known good state
    3. Lock UI temporarily
  UI: Disable buttons for 500ms
```

---

*Use this as a reference when debugging state-related issues!*
*Print and keep nearby during development.*

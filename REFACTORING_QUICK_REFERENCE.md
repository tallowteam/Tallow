# Transfer Integration Refactoring - Quick Reference

## Critical Issues Summary

### 1. Code Duplication - Device Conversions
**Before**: 26 lines duplicated, unsafe type casting
**After**: Use `device-converters.ts` utility
**Effort**: 2 hours | **Impact**: High

```typescript
// OLD (Don't do this)
const localDevices = useMemo(() => discoveredDevices.map(d => ({
    id: d.id,
    name: d.name,
    platform: d.platform as any, // ❌ Unsafe
    lastSeen: typeof d.lastSeen === 'number' ? d.lastSeen : d.lastSeen.getTime(), // ❌ Complex
    // ...
})), [discoveredDevices]);

// NEW (Do this)
import { convertDiscoveredDevices } from '@/lib/utils/device-converters';

const localDevices = useMemo(
  () => convertDiscoveredDevices(discoveredDevices),
  [discoveredDevices]
);
```

---

### 2. State Management - Combine Related State
**Before**: 4 separate dialog states
**After**: Single state object
**Effort**: 3 hours | **Impact**: High

```typescript
// OLD (Don't do this)
const [showRecipientSelector, setShowRecipientSelector] = useState(false);
const [showGroupConfirmDialog, setShowGroupConfirmDialog] = useState(false);
const [showGroupProgressDialog, setShowGroupProgressDialog] = useState(false);
const [showGroupInviteDialog, setShowGroupInviteDialog] = useState(false);

// NEW (Do this)
const groupTransferUI = useGroupTransferUI();

groupTransferUI.openDialog('recipientSelector');
groupTransferUI.closeDialog('confirmDialog');
groupTransferUI.closeAllDialogs();
```

---

### 3. Performance - Memoize Expensive Calculations
**Before**: Recalculating on every render
**After**: Memoized values
**Effort**: 1 hour | **Impact**: Medium

```typescript
// OLD (Don't do this)
<p>
  Total: {formatFileSize(selectedFiles.reduce((acc, f) => acc + f.size, 0))}
  {/* This calculates twice per render! */}
  ({formatFileSize(selectedFiles.reduce((acc, f) => acc + f.size, 0) * selectedRecipientIds.length)})
</p>

// NEW (Do this)
const totalFileSize = useMemo(
  () => selectedFiles.reduce((acc, f) => acc + f.size, 0),
  [selectedFiles]
);

const totalTransferSize = useMemo(
  () => totalFileSize * Math.max(selectedRecipientIds.length, 1),
  [totalFileSize, selectedRecipientIds.length]
);

<p>
  Total: {formatFileSize(totalFileSize)}
  ({formatFileSize(totalTransferSize)})
</p>
```

---

### 4. Error Handling - Comprehensive Try-Catch
**Before**: Errors not caught, no cleanup
**After**: Full error handling with cleanup
**Effort**: 4 hours | **Impact**: High

```typescript
// OLD (Don't do this)
const handleGroupTransferConfirm = useCallback(async () => {
    try {
        await groupTransfer.initializeGroupTransfer(...);

        // ❌ No error handling for file sending
        for (const file of selectedFiles) {
            await groupTransfer.sendToAll(file.file); // Can throw!
        }
    } catch (error) {
        toast.error('Failed'); // ❌ Only catches init errors
    }
}, []);

// NEW (Do this)
const handleGroupTransferConfirm = useCallback(async () => {
    let isInitialized = false;
    let transferId: string | null = null;

    try {
        transferId = generateUUID();
        await groupTransfer.initializeGroupTransfer(...);
        isInitialized = true;

        for (const file of selectedFiles) {
            try {
                await groupTransfer.sendToAll(file.file);
            } catch (fileError) {
                // ✅ Handle individual file errors
                secureLog.error(`Failed to send ${file.name}:`, fileError);
                toast.error(`Failed to send ${file.name}`);
                // Continue with other files
            }
        }
    } catch (error) {
        // ✅ Specific error messages
        if (isInitialized) {
            toast.error('Transfer failed during sending');
        } else {
            toast.error('Failed to initialize transfer');
        }

        // ✅ Cleanup on error
        if (transferId) {
            await transferMetadata.clearMetadata(transferId);
        }
    } finally {
        // ✅ Always reset state
        setSendingFileName('');
        setSendingFileIndex(0);
    }
}, []);
```

---

### 5. useMemo Dependencies - availableRecipients
**Before**: Inefficient conditional chains
**After**: Declarative map approach
**Effort**: 30 minutes | **Impact**: Low

```typescript
// OLD (Don't do this)
const availableRecipients = useMemo(() => {
    if (connectionType === 'local') {
        return localDevices;
    } else if (connectionType === 'friends') {
        return friendDevices;
    } else if (connectionType === 'internet') {
        return [];
    }
    return [];
}, [connectionType, localDevices, friendDevices]);

// NEW (Do this)
const availableRecipients = useMemo(() => {
    const recipientMap: Record<ConnectionType, Device[]> = {
        'local': localDevices,
        'friends': friendDevices,
        'internet': [],
    };
    return recipientMap[connectionType] || [];
}, [connectionType, localDevices, friendDevices]);
```

---

### 6. Hook Dependencies - useGroupTransfer
**Before**: Entire options object as dependency
**After**: Use refs for callbacks
**Effort**: 2 hours | **Impact**: Medium

```typescript
// OLD (Don't do this)
export function useGroupTransfer(options: UseGroupTransferOptions = {}) {
    const initializeGroupTransfer = useCallback(
        async (...params) => {
            // Use options.onComplete()
        },
        [options] // ❌ Recreates callback when options change
    );
}

// NEW (Do this)
export function useGroupTransfer(options: UseGroupTransferOptions = {}) {
    // ✅ Create stable refs
    const onCompleteRef = useRef(options.onComplete);

    useEffect(() => {
        onCompleteRef.current = options.onComplete;
    }, [options.onComplete]);

    const initializeGroupTransfer = useCallback(
        async (...params) => {
            // Use onCompleteRef.current()
        },
        [/* stable dependencies only */]
    );
}
```

---

### 7. Component Extraction - Too Large
**Before**: 2589 lines, multiple responsibilities
**After**: Extracted components
**Effort**: 16 hours | **Impact**: High

```typescript
// OLD Structure
app/app/page.tsx (2589 lines)

// NEW Structure
app/app/
├── page.tsx (300 lines - coordinator only)
├── hooks/
│   ├── use-transfer-state.ts (state management)
│   ├── use-connection-setup.ts (WebRTC logic)
│   └── use-recipient-manager.ts (recipient logic)
├── components/
│   ├── SendPanel.tsx (send UI)
│   ├── ReceivePanel.tsx (receive UI)
│   └── ConnectionPanel.tsx (connection UI)
└── utils/
    └── device-converters.ts (transformations)
```

---

### 8. RecipientSelector Performance
**Before**: Filter runs on every render
**After**: Memoized with debouncing
**Effort**: 1 hour | **Impact**: Medium

```typescript
// OLD (Don't do this)
const filteredDevices = availableDevices.filter((device) => {
    const query = searchQuery.toLowerCase();
    return device.name.toLowerCase().includes(query);
}); // ❌ Runs on every render

// NEW (Do this)
const filteredDevices = useMemo(() => {
    if (!searchQuery) return availableDevices;
    const query = searchQuery.toLowerCase();
    return availableDevices.filter((device) =>
        device.name.toLowerCase().includes(query)
    );
}, [availableDevices, searchQuery]); // ✅ Only when dependencies change

// For large lists, add debouncing
const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
}, [searchQuery]);
```

---

## Implementation Priority

### Phase 1: Immediate (1 week)
1. ✅ Create `device-converters.ts` - **2 hours**
2. ⚠️ Add comprehensive error handling - **4 hours**
3. ⚠️ Fix useMemo dependencies - **1 hour**
4. ⚠️ Memoize expensive calculations - **1 hour**

**Total**: 8 hours | **Impact**: Prevents bugs, improves performance

### Phase 2: Short-term (2 weeks)
5. Extract state management hook - **6 hours**
6. Fix useGroupTransfer dependencies - **2 hours**
7. Add error boundaries - **2 hours**
8. Optimize RecipientSelector - **1 hour**

**Total**: 11 hours | **Impact**: Better maintainability

### Phase 3: Long-term (1 month)
9. Extract component boundaries - **16 hours**
10. Add comprehensive tests - **8 hours**
11. Create integration tests - **4 hours**

**Total**: 28 hours | **Impact**: Long-term sustainability

---

## Quick Testing Commands

```bash
# Run unit tests
npm test lib/utils/device-converters.test.ts

# Run hook tests
npm test lib/hooks/use-group-transfer.test.ts

# Run integration tests
npm test app/app/page.integration.test.tsx

# Run all tests with coverage
npm test -- --coverage

# Profile component renders
npm run build:analyze
```

---

## Files to Create

### High Priority
- ✅ `lib/utils/device-converters.ts` (created)
- ⚠️ `lib/hooks/use-group-transfer-ui.ts`
- ⚠️ `components/error-boundaries/GroupTransferErrorBoundary.tsx`

### Medium Priority
- `lib/hooks/use-transfer-state.ts`
- `lib/hooks/use-recipient-manager.ts`

### Low Priority
- `app/app/components/SendPanel.tsx`
- `app/app/components/ReceivePanel.tsx`
- `app/app/components/ConnectionPanel.tsx`

---

## Metrics to Track

### Before Refactoring
- Lines of Code: 2589
- Cyclomatic Complexity: ~150
- Code Duplication: 15%
- Test Coverage: <20%
- Re-renders per action: ~40

### Target After Refactoring
- Lines of Code: <500 (coordinator)
- Cyclomatic Complexity: <30
- Code Duplication: <5%
- Test Coverage: >70%
- Re-renders per action: <15

---

## Common Pitfalls to Avoid

1. **Don't extract too early** - Ensure abstractions are stable
2. **Maintain behavior** - Add characterization tests first
3. **Refactor incrementally** - Don't try to do everything at once
4. **Keep tests passing** - Run tests after each change
5. **Document breaking changes** - Update migration guides
6. **Profile performance** - Measure before and after
7. **Review thoroughly** - Get team feedback on architecture

---

## Need Help?

- See `REFACTORING_ANALYSIS_TRANSFER_INTEGRATION.md` for detailed analysis
- Check `lib/utils/device-converters.ts` for example implementation
- Review existing hooks in `lib/hooks/` for patterns
- Ask team for architecture review before major changes

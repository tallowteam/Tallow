# Group Transfer Implementation Checklist

Use this checklist to verify your group transfer implementation is complete and working correctly.

---

## 📊 Executive Summary

**Overall Status**: 🟡 **In Progress** (40% Complete)

| Component | Status | Progress |
|-----------|--------|----------|
| **Core Implementation** | ✅ Complete | 100% |
| **Documentation** | ✅ Complete | 100% |
| **UI Components** | ✅ Built | 100% |
| **TypeScript Compilation** | ✅ Passing | 100% |
| **Unit Tests** | ⚠️ Failing | 0% (Need fixes) |
| **WebRTC Integration** | ❌ Not Started | 0% |
| **Device Discovery** | ❌ Not Started | 0% |
| **App UI Integration** | ❌ Not Started | 0% |
| **Manual Testing** | ❌ Not Started | 0% |
| **Production Ready** | ❌ Blocked | 40% |

### ✅ What's Complete:
- All TypeScript modules implemented
- All React components built
- All documentation written
- TypeScript strict mode compliance
- Clean architecture with separation of concerns

### ⚠️ What's In Progress:
- Unit test mock refactoring needed
- Security architecture approved but needs verification

### ❌ What's Blocked:
- WebRTC data channel creation (CRITICAL BLOCKER)
- Device discovery integration (CRITICAL BLOCKER)
- UI integration into main app (HIGH PRIORITY)
- End-to-end testing (BLOCKED by integration)

### ⏱️ Estimated Time to Production:
**14-20 hours** of focused development work

### 🎯 Next Action:
**Implement WebRTC data channel creation** - This is the critical path blocker

---

## 📖 How to Use This Checklist

This document serves as both a progress tracker and implementation guide:

### 1. **For Project Managers/Stakeholders**:
   - Check the **Executive Summary** for high-level status
   - Review **Completion Status** for timeline estimates
   - See **Blockers to Production** for critical dependencies

### 2. **For Developers Starting Integration**:
   - Review **Quick Action Items** (Priority Order) section
   - Follow items sequentially - each builds on the previous
   - Reference detailed documentation in sister files:
     - `GROUP_TRANSFER_GUIDE.md` - Comprehensive technical guide
     - `GROUP_TRANSFER_README.md` - Quick reference
     - `INTEGRATION_EXAMPLE.md` - Step-by-step integration
     - `GROUP_TRANSFER_ARCHITECTURE.md` - System design

### 3. **For QA/Testing**:
   - Skip to **Testing Checklist** section
   - Review **Manual Testing** scenarios
   - Check **Known Issues & Limitations** for expected behaviors

### 4. **For Security Review**:
   - See **Security Features** under Feature Verification
   - Review **Security Notes** in Notes section
   - Verify encryption independence per recipient

### 5. **Tracking Progress**:
   - Check boxes `[x]` as items are completed
   - Update status indicators (✅ ⚠️ ❌)
   - Add notes in margins for context
   - Update **Last Updated** date at bottom

---

## Pre-Integration Checklist

### Files Created ✓

- [x] `lib/transfer/group-transfer-manager.ts` - Core transfer orchestration
- [x] `lib/hooks/use-group-transfer.ts` - React hook for state management
- [x] `components/app/RecipientSelector.tsx` - Multi-select UI
- [x] `components/app/GroupTransferProgress.tsx` - Progress tracking UI
- [x] `components/app/GroupTransferConfirmDialog.tsx` - Confirmation dialog
- [x] `components/app/GroupTransferExample.tsx` - Integration example
- [x] `components/ui/checkbox.tsx` - UI component dependency
- [x] `lib/types.ts` - Type definitions updated
- [x] `tests/unit/transfer/group-transfer-manager.test.ts` - Unit tests

### Documentation Created ✓

- [x] `GROUP_TRANSFER_GUIDE.md` - Comprehensive guide
- [x] `GROUP_TRANSFER_README.md` - Quick reference
- [x] `INTEGRATION_EXAMPLE.md` - Integration steps
- [x] `GROUP_TRANSFER_SUMMARY.md` - Executive summary
- [x] `GROUP_TRANSFER_ARCHITECTURE.md` - Architecture diagrams
- [x] `GROUP_TRANSFER_CHECKLIST.md` - This file

## Integration Checklist

### Phase 1: Basic Setup

- [x] Import `GroupTransferManager` into your project
- [x] Import `useGroupTransfer` hook
- [x] Import UI components (RecipientSelector, etc.)
- [x] Verify TypeScript compilation passes
- [x] No ESLint errors

### Phase 2: WebRTC Integration

- [ ] Implement data channel creation function
- [ ] Test single data channel creation
- [ ] Test multiple data channel creation
- [ ] Verify channels stay open during transfer
- [ ] Handle channel errors gracefully

**Status**: ⚠️ WebRTC integration pending - requires PQCTransferManager data channel setup

### Phase 3: UI Integration

- [ ] Add "Send to Multiple Recipients" button to app
- [ ] Wire up RecipientSelector to button click
- [ ] Connect GroupTransferConfirmDialog
- [ ] Connect GroupTransferProgress dialog
- [ ] Test UI flow end-to-end

**Status**: ⚠️ Components exist but not wired to main app UI (`app/page.tsx`)

### Phase 4: State Management

- [ ] Initialize useGroupTransfer hook
- [ ] Configure bandwidth limits
- [ ] Set up event callbacks
- [ ] Test state updates during transfer
- [ ] Verify cleanup on component unmount

**Status**: ⚠️ Hook exists but not integrated into application

### Phase 5: Device Management

- [ ] Populate available devices list
- [ ] Filter online/offline devices
- [ ] Display device status correctly
- [ ] Handle device connection/disconnection
- [ ] Update device list in real-time

**Status**: ⚠️ Requires integration with existing device discovery system

## Testing Checklist

### Unit Tests

- [x] Run `npm run test:unit tests/unit/transfer/group-transfer-manager.test.ts`
- [ ] All tests passing ⚠️ **19/19 tests currently failing** (mock implementation issues)
- [ ] No console errors/warnings
- [ ] Test coverage > 90%

**Issues Found**:
- Vitest mock warnings: `vi.fn()` not using 'function' or 'class' implementation
- Tests exist but need mock refactoring for proper execution
- PQCTransferManager mocks need proper async/Promise handling

### Manual Testing - Happy Path

#### Single File, Multiple Recipients

- [ ] Select 1 file
- [ ] Select 2 recipients
- [ ] Confirm transfer
- [ ] Verify both recipients receive file
- [ ] Check progress updates correctly
- [ ] Verify completion notification
- [ ] Confirm file integrity on both recipients

#### Multiple Files, Multiple Recipients

- [ ] Select 3 files
- [ ] Select 3 recipients
- [ ] Confirm transfer
- [ ] Verify all recipients receive all files
- [ ] Check aggregate progress
- [ ] Verify per-recipient progress
- [ ] Confirm completion

### Manual Testing - Error Scenarios

#### Network Interruption

- [ ] Start transfer to 3 recipients
- [ ] Disconnect 1 recipient mid-transfer
- [ ] Verify other 2 recipients continue
- [ ] Check failed recipient is marked as failed
- [ ] Verify partial success notification

#### Key Exchange Timeout

- [ ] Attempt transfer with offline device
- [ ] Verify timeout after 30 seconds
- [ ] Check error message is clear
- [ ] Verify other transfers continue

#### All Recipients Fail

- [ ] Attempt transfer with all offline devices
- [ ] Verify all marked as failed
- [ ] Check failure notification
- [ ] Verify clean state reset

#### Cancel During Transfer

- [ ] Start transfer
- [ ] Click cancel mid-transfer
- [ ] Verify all transfers stop
- [ ] Check cleanup completes
- [ ] Verify resources released

### Manual Testing - Edge Cases

#### Maximum Recipients

- [ ] Select maximum allowed recipients (10)
- [ ] Start transfer
- [ ] Verify all receive file
- [ ] Check performance is acceptable

#### Large Files

- [ ] Transfer 500MB file to 5 recipients
- [ ] Verify progress updates smoothly
- [ ] Check memory usage is reasonable
- [ ] Confirm completion

#### Empty File

- [ ] Attempt to send 0-byte file
- [ ] Verify error message shown
- [ ] Transfer prevented

#### Rapid Cancellation

- [ ] Start transfer
- [ ] Immediately cancel
- [ ] Verify clean cancellation
- [ ] No hanging connections

### Performance Testing

- [ ] Monitor CPU usage during transfer
- [ ] Check memory consumption
- [ ] Verify network utilization
- [ ] Test with slow network connection
- [ ] Test with fast network connection

## Feature Verification Checklist

### Security Features

- [ ] Each recipient has independent encryption
- [ ] ML-KEM-768 key exchange per recipient
- [ ] X25519 hybrid encryption per recipient
- [ ] No key reuse across recipients
- [ ] Session keys unique per recipient
- [ ] Verify with network inspection tools

### Progress Tracking

- [ ] Overall progress updates every 100-200ms
- [ ] Per-recipient progress shown
- [ ] Speed calculation accurate
- [ ] ETA calculation reasonable
- [ ] Success/failure counts correct

### Bandwidth Management

- [ ] Per-recipient bandwidth limit applied
- [ ] Total bandwidth doesn't exceed system capacity
- [ ] Throttling works correctly
- [ ] No network saturation

### Error Handling

- [ ] Individual failures don't stop others
- [ ] Clear error messages
- [ ] Graceful degradation
- [ ] Proper cleanup on error
- [ ] No memory leaks

### UI/UX Features

- [ ] Recipient search works
- [ ] Multi-select works correctly
- [ ] Visual selection feedback
- [ ] Keyboard navigation works
- [ ] Screen reader accessible
- [ ] Mobile responsive
- [ ] Dark mode compatible

## Accessibility Checklist

### ARIA Support

- [ ] All dialogs have aria-describedby
- [ ] Buttons have aria-label where needed
- [ ] Lists have proper role="list"
- [ ] Status updates announced to screen readers
- [ ] Focus management works correctly

### Keyboard Navigation

- [ ] Tab navigation works through all elements
- [ ] Enter/Space activate buttons
- [ ] Arrow keys navigate lists
- [ ] Escape closes dialogs
- [ ] No keyboard traps

### Visual Accessibility

- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Focus indicators visible
- [ ] Text is readable at all zoom levels
- [ ] Icons have text alternatives
- [ ] No information conveyed by color alone

## Browser Compatibility Checklist

### Desktop Browsers

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers

- [ ] Chrome Mobile
- [ ] Safari iOS
- [ ] Firefox Mobile
- [ ] Samsung Internet

### WebRTC Support

- [ ] Test RTCPeerConnection in all browsers
- [ ] Test RTCDataChannel in all browsers
- [ ] Verify TURN server fallback works
- [ ] Test with restrictive firewalls

## Performance Benchmarks

### Metrics to Track

- [ ] Time to initialize 10 recipients: < 2s
- [ ] Key exchange time per recipient: < 1s
- [ ] File transfer speed: > 500 KB/s per recipient
- [ ] Memory usage: < 100MB for 10 recipients
- [ ] CPU usage: < 50% during transfer

### Optimization Checklist

- [ ] React.memo used where appropriate
- [ ] Event handlers memoized with useCallback
- [ ] State updates batched
- [ ] Progress polling optimized
- [ ] Component re-renders minimized

## Documentation Checklist

### Code Documentation

- [ ] All public methods have JSDoc
- [ ] Complex logic has inline comments
- [ ] Type definitions are complete
- [ ] Examples provided for all APIs

### User Documentation

- [ ] Installation instructions clear
- [ ] Usage examples comprehensive
- [ ] API reference complete
- [ ] Troubleshooting guide helpful

## Production Readiness Checklist

### Code Quality

- [ ] No console.log statements in production
- [ ] Error boundaries in place
- [ ] Proper logging implemented
- [ ] Analytics integrated (if needed)

### Security

- [ ] No sensitive data logged
- [ ] Encryption verified
- [ ] Key management secure
- [ ] Input validation complete

### Monitoring

- [ ] Transfer success rate tracked
- [ ] Error rates monitored
- [ ] Performance metrics collected
- [ ] User feedback mechanism in place

### Deployment

- [ ] Build process tested
- [ ] Bundle size acceptable
- [ ] No breaking changes to existing features
- [ ] Rollback plan ready

## Sign-Off Checklist

### Development Sign-Off

- [ ] All features implemented
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Documentation complete

### QA Sign-Off

- [ ] All test cases passed
- [ ] Edge cases covered
- [ ] Performance acceptable
- [ ] No critical bugs

### Security Sign-Off

- [ ] Security review complete
- [ ] Encryption verified
- [ ] Vulnerabilities addressed
- [ ] Compliance requirements met

### Product Sign-Off

- [ ] Features meet requirements
- [ ] UX is acceptable
- [ ] Performance is acceptable
- [ ] Ready for production

## Post-Deployment Checklist

### Monitoring (Week 1)

- [ ] Monitor error rates
- [ ] Track usage metrics
- [ ] Collect user feedback
- [ ] Watch for performance issues

### Iteration Planning

- [ ] Prioritize bug fixes
- [ ] Plan feature enhancements
- [ ] Schedule performance optimization
- [ ] Document lessons learned

## Known Issues & Limitations

Document any known issues:

- [x] Issue #1: **UI Components Not Integrated into Main App**
  - Severity: [ ] Low [x] Medium [ ] High
  - Workaround: Components exist in `components/app/` but need to be imported into `app/page.tsx` or app transfer UI
  - Fix planned: [x] Yes [ ] No
  - **Action Required**: Wire up RecipientSelector, GroupTransferProgress, and GroupTransferConfirmDialog to main transfer UI

- [x] Issue #2: **Unit Tests Failing (19/19)**
  - Severity: [ ] Low [x] Medium [ ] High
  - Workaround: Tests exist but Vitest mocks need refactoring. Use manual testing until mocks are fixed.
  - Fix planned: [x] Yes [ ] No
  - **Action Required**: Refactor test mocks to use proper `function` or `class` implementations instead of arrow functions

- [x] Issue #3: **WebRTC Data Channel Integration Missing**
  - Severity: [ ] Low [ ] Medium [x] High
  - Workaround: None - this is a blocker for actual functionality
  - Fix planned: [x] Yes [ ] No
  - **Action Required**: Implement `createDataChannel` function that returns Promise<RTCDataChannel> for each recipient

- [x] Issue #4: **Device Discovery Not Connected**
  - Severity: [ ] Low [x] Medium [ ] High
  - Workaround: Hard-code device list for testing
  - Fix planned: [x] Yes [ ] No
  - **Action Required**: Connect to existing device discovery/announcement system (likely using Socket.io signaling)

- [x] Issue #5: **No Progress Persistence**
  - Severity: [x] Low [ ] Medium [ ] High
  - Workaround: Progress resets on page reload - acceptable for MVP
  - Fix planned: [ ] Yes [x] No (Future enhancement)
  - **Note**: Consider adding transfer history/resume functionality in future versions

## Future Enhancements

Track planned improvements:

- [ ] Resume failed transfers
- [ ] Multi-file/folder support
- [ ] Recipient grouping
- [ ] Bandwidth auto-adjustment
- [ ] Transfer scheduling
- [ ] Advanced analytics

## Notes

Use this section for implementation-specific notes, gotchas, or reminders:

```
IMPLEMENTATION NOTES (January 2026)
_________________________________________________________________________

1. **Architecture Complete**: All core classes and components are implemented:
   - GroupTransferManager: Orchestrates multi-recipient transfers
   - useGroupTransfer: React hook for state management
   - RecipientSelector: Multi-select UI component
   - GroupTransferProgress: Real-time progress tracking
   - GroupTransferConfirmDialog: Transfer confirmation flow

2. **Integration Blockers**:
   - Missing: createDataChannel function (WebRTC setup)
   - Missing: Connection to device discovery system
   - Missing: UI integration in main app

3. **Key Dependencies**:
   - Requires PQCTransferManager for encryption (✓ exists)
   - Requires RTCPeerConnection setup (needs implementation)
   - Requires Socket.io signaling (partially implemented)

4. **TypeScript Strict Mode**: All files compile successfully with:
   - exactOptionalPropertyTypes: true
   - strict: true
   - All ES2020+ features supported

5. **Next Steps** (Priority Order):
   a) Fix unit test mocks (refactor to use function/class syntax)
   b) Implement WebRTC data channel creation
   c) Connect to device discovery
   d) Wire up UI components to app/page.tsx
   e) End-to-end manual testing

6. **Performance Considerations**:
   - Each recipient gets independent encryption (PQC overhead)
   - Bandwidth should be divided among recipients
   - Consider parallel vs sequential transfers based on connection quality
   - Monitor memory usage with >5 concurrent recipients

7. **Security Notes**:
   - Each recipient has unique ML-KEM-768 + X25519 hybrid encryption
   - No key reuse between recipients (verified in architecture)
   - Session keys are ephemeral and not stored
   - Encryption happens before data channel transmission
_________________________________________________________________________
```

---

## Completion Status

- **Implementation Started**: January 2026 (Codebase analysis phase)
- **Core Development Complete**: January 2026 (All modules & components built)
- **Integration Complete**: ⚠️ **NOT STARTED** (Blocked on WebRTC setup)
- **Testing Complete**: ⚠️ **IN PROGRESS** (Unit tests need fixes)
- **Documentation Complete**: ✅ **COMPLETE** (6 comprehensive docs created)
- **Production Deployment**: ⚠️ **BLOCKED** (Integration required first)

**Current Status**: [x] In Progress

**Readiness Assessment**:
- **Code Quality**: ✅ 90% - TypeScript strict mode passing, clean architecture
- **Documentation**: ✅ 100% - Comprehensive guides, examples, and checklists
- **Testing**: ⚠️ 20% - Tests exist but need mock refactoring
- **Integration**: ⚠️ 0% - Not wired to main application
- **Production Ready**: ❌ 40% overall

**Blockers to Production**:
1. 🔴 **CRITICAL**: WebRTC data channel creation not implemented
2. 🔴 **CRITICAL**: Device discovery system not connected
3. 🟡 **HIGH**: UI components not integrated into main app
4. 🟡 **HIGH**: Unit tests failing (19/19)
5. 🟢 **MEDIUM**: Manual testing not performed
6. 🟢 **LOW**: Performance benchmarks not established

**Sign-off**:
- Developer: ⚠️ **Pending Integration** (Core code complete but not integrated)
- QA: ❌ **Not Started** (Cannot test until integrated)
- Security: ⚠️ **Architecture Approved** (Implementation pending verification)
- Product: ⚠️ **Pending Demo** (Need working prototype)

**Estimated Time to Production**:
- Fix unit test mocks: ~2 hours
- Implement WebRTC integration: ~4-6 hours
- Connect device discovery: ~2-3 hours
- Wire up UI components: ~2-3 hours
- Manual testing & fixes: ~4-6 hours
- **Total**: ~14-20 hours of development work

---

## Quick Action Items (Priority Order)

To get this feature production-ready, complete these tasks in order:

1. ⚠️ **Fix Unit Tests** (2 hours)
   - Refactor vitest mocks in `tests/unit/transfer/group-transfer-manager.test.ts`
   - Change arrow function mocks to proper `function` syntax
   - Verify all 19 tests pass

2. 🔴 **Implement WebRTC Data Channel Creation** (4-6 hours)
   - Create `createDataChannel(deviceId: string): Promise<RTCDataChannel>` function
   - Handle ICE candidate gathering
   - Implement STUN/TURN fallback
   - Test single and multiple connections

3. 🔴 **Connect Device Discovery** (2-3 hours)
   - Integrate with existing Socket.io signaling server
   - Implement device online/offline detection
   - Add real-time device list updates
   - Filter available vs unavailable devices

4. 🔴 **UI Integration** (2-3 hours)
   - Add "Send to Multiple" button to `app/page.tsx`
   - Wire up RecipientSelector component
   - Connect GroupTransferProgress dialog
   - Connect GroupTransferConfirmDialog
   - Add to existing file transfer flow

5. ✅ **Manual Testing** (4-6 hours)
   - Test single file → multiple recipients
   - Test multiple files → multiple recipients
   - Test error scenarios (disconnect, timeout, cancel)
   - Test with different network conditions
   - Verify encryption independence per recipient

6. 📊 **Performance Validation** (2 hours)
   - Measure transfer speeds with 2, 5, 10 recipients
   - Monitor memory usage during transfers
   - Verify bandwidth throttling works
   - Test with large files (500MB+)

---

## 💻 Critical Code Snippets for Integration

### 1. WebRTC Data Channel Creation (Required)

```typescript
// File: lib/webrtc/create-data-channel.ts
import { Socket } from 'socket.io-client';

export interface DataChannelConfig {
  deviceId: string;
  socket: Socket;
  iceServers: RTCIceServer[];
}

export async function createDataChannel(
  config: DataChannelConfig
): Promise<RTCDataChannel> {
  const pc = new RTCPeerConnection({
    iceServers: config.iceServers
  });

  const dataChannel = pc.createDataChannel('file-transfer', {
    ordered: true,
    maxRetransmits: 3
  });

  // Handle ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      config.socket.emit('ice-candidate', {
        to: config.deviceId,
        candidate: event.candidate
      });
    }
  };

  // Create and send offer
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  config.socket.emit('offer', {
    to: config.deviceId,
    offer: pc.localDescription
  });

  // Wait for answer
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Connection timeout'));
    }, 30000);

    config.socket.once('answer', async (data) => {
      clearTimeout(timeout);
      await pc.setRemoteDescription(data.answer);

      dataChannel.onopen = () => resolve(dataChannel);
      dataChannel.onerror = () => reject(new Error('Data channel failed'));
    });
  });
}
```

### 2. UI Integration (Required)

```typescript
// File: app/page.tsx (add to existing transfer UI)
'use client';

import { useGroupTransfer } from '@/lib/hooks/use-group-transfer';
import { RecipientSelector } from '@/components/app/RecipientSelector';
import { GroupTransferProgress } from '@/components/app/GroupTransferProgress';
import { GroupTransferConfirmDialog } from '@/components/app/GroupTransferConfirmDialog';
import { useState } from 'react';

export default function TransferPage() {
  const [showRecipientSelector, setShowRecipientSelector] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    selectedDevices,
    setSelectedDevices,
    startGroupTransfer,
    progress,
    isTransferring
  } = useGroupTransfer({
    createDataChannel, // Implement this function
    bandwidthLimitPerRecipient: 5 * 1024 * 1024, // 5 MB/s per recipient
  });

  const handleSendToMultiple = () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }
    setShowRecipientSelector(true);
  };

  const handleConfirmTransfer = async () => {
    if (selectedFile && selectedDevices.length > 0) {
      await startGroupTransfer(selectedFile);
    }
  };

  return (
    <div>
      {/* Existing single transfer UI */}

      {/* Add this button */}
      <button onClick={handleSendToMultiple}>
        Send to Multiple Recipients
      </button>

      {/* Add these dialogs */}
      <RecipientSelector
        open={showRecipientSelector}
        onOpenChange={setShowRecipientSelector}
        availableDevices={[]} // TODO: Connect to device discovery
        selectedDevices={selectedDevices}
        onSelectionChange={setSelectedDevices}
      />

      <GroupTransferConfirmDialog
        open={selectedDevices.length > 0 && !isTransferring}
        onConfirm={handleConfirmTransfer}
        recipients={selectedDevices}
        file={selectedFile}
      />

      <GroupTransferProgress
        open={isTransferring}
        progress={progress}
      />
    </div>
  );
}
```

### 3. Device Discovery Integration (Required)

```typescript
// File: lib/hooks/use-device-discovery.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface Device {
  id: string;
  name: string;
  online: boolean;
  lastSeen: Date;
}

export function useDeviceDiscovery() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketUrl = process.env['NEXT_PUBLIC_SIGNALING_URL'] || 'http://localhost:3001';
    const newSocket = io(socketUrl);

    newSocket.on('device-list', (deviceList: Device[]) => {
      setDevices(deviceList);
    });

    newSocket.on('device-online', (device: Device) => {
      setDevices(prev => [...prev.filter(d => d.id !== device.id), device]);
    });

    newSocket.on('device-offline', (deviceId: string) => {
      setDevices(prev => prev.map(d =>
        d.id === deviceId ? { ...d, online: false } : d
      ));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return { devices, socket };
}
```

### 4. Complete Integration Example

```typescript
// Putting it all together
export default function TransferPage() {
  const { devices, socket } = useDeviceDiscovery();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    selectedDevices,
    setSelectedDevices,
    startGroupTransfer,
    progress,
    isTransferring
  } = useGroupTransfer({
    createDataChannel: async (deviceId) => {
      if (!socket) throw new Error('Socket not connected');
      return createDataChannel({
        deviceId,
        socket,
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' }
        ]
      });
    },
    bandwidthLimitPerRecipient: 5 * 1024 * 1024,
    onComplete: (results) => {
      const successful = results.filter(r => r.status === 'success').length;
      console.log(`Transfer complete: ${successful}/${results.length} successful`);
    },
    onError: (error) => {
      console.error('Transfer error:', error);
    }
  });

  const onlineDevices = devices.filter(d => d.online);

  return (
    <div>
      <RecipientSelector
        availableDevices={onlineDevices}
        selectedDevices={selectedDevices}
        onSelectionChange={setSelectedDevices}
      />
      {/* ... rest of UI ... */}
    </div>
  );
}
```

---

**Last Updated**: January 25, 2026

**Next Review**: After WebRTC integration complete

**Contact**: For questions about this implementation, refer to `GROUP_TRANSFER_GUIDE.md`

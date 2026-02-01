# Group Transfer Integration Test Plan

## Pre-Test Setup

### Environment Setup
```bash
# 1. Install dependencies
npm install

# 2. Start signaling server
node signaling-server.js

# 3. Start development server
npm run dev

# 4. Open two browser windows/tabs
# - Tab 1: Sender (http://localhost:3000/app)
# - Tab 2: Receiver (http://localhost:3000/app)
```

### Required Test Files
Prepare test files of varying sizes:
- Small: `test-1kb.txt` (1 KB)
- Medium: `test-1mb.jpg` (1 MB)
- Large: `test-10mb.pdf` (10 MB)
- Very Large: `test-100mb.zip` (100 MB)

## Test Suite

### Test 1: Basic Group Transfer (2 Files, 1 Recipient)
**Objective**: Verify basic multi-file group transfer functionality

**Steps**:
1. **Sender Tab**:
   - Select 2 files (test-1kb.txt, test-1mb.jpg)
   - Click Advanced → Enable Group Transfer
   - Verify toast: "Group transfer mode enabled"
   - Click "Select Recipients"
   - Select 1 device from RecipientSelector
   - Click "Confirm Selection"
   - Review GroupTransferConfirmDialog
   - Verify: Shows 2 files, 1 recipient, total size
   - Click "Start Transfer"

2. **Receiver Tab**:
   - Wait for GroupTransferInviteDialog
   - Verify: Shows sender name
   - Verify: Shows "2 files" or file names
   - Verify: Shows correct total size
   - Verify: Shows "1 recipient in this transfer"
   - Click "Accept Transfer"
   - Wait for transfer to complete
   - Verify: All 2 files appear in received files list
   - Download files and verify integrity

3. **Sender Tab**:
   - Verify GroupTransferProgress dialog appears
   - Verify: Shows recipient name
   - Verify: Progress bar updates
   - Verify: Shows 2/2 files sent
   - Verify: Success toast appears
   - Verify: Dialog shows completed status

**Expected Results**:
- ✅ All 2 files transferred successfully
- ✅ Progress tracking accurate
- ✅ File integrity maintained
- ✅ UI updates in real-time

---

### Test 2: Multi-Recipient Group Transfer (3 Files, 3 Recipients)
**Objective**: Verify simultaneous transfer to multiple recipients

**Steps**:
1. **Sender Tab**:
   - Select 3 files (different sizes)
   - Enable Group Transfer mode
   - Select 3 recipients
   - Start transfer

2. **All Receiver Tabs** (open 3 tabs):
   - Accept invitation on all 3 tabs
   - Verify all receive files simultaneously

3. **Sender Tab**:
   - Verify GroupTransferProgress shows all 3 recipients
   - Verify each recipient has separate progress bar
   - Verify all complete successfully

**Expected Results**:
- ✅ All 3 recipients receive invitations
- ✅ Transfers proceed in parallel
- ✅ All recipients receive all files
- ✅ Individual recipient failures don't affect others

---

### Test 3: Reject Group Transfer
**Objective**: Verify rejection flow works correctly

**Steps**:
1. **Sender Tab**:
   - Select files
   - Enable Group Transfer
   - Select 2 recipients
   - Start transfer

2. **Receiver 1 Tab**:
   - Click "Reject" on invitation

3. **Receiver 2 Tab**:
   - Click "Accept Transfer"

4. **Sender Tab**:
   - Verify Receiver 1 shows as failed/rejected
   - Verify Receiver 2 shows as connected/transferring
   - Verify transfer continues to Receiver 2

**Expected Results**:
- ✅ Rejection doesn't block other recipients
- ✅ Sender receives rejection notification
- ✅ Accepted recipients receive files
- ✅ Appropriate error messages shown

---

### Test 4: Connection Timeout
**Objective**: Verify timeout handling

**Steps**:
1. **Sender Tab**:
   - Select files
   - Enable Group Transfer
   - Select recipient
   - Start transfer

2. **Receiver Tab**:
   - Don't interact with invitation (let it timeout)

3. **Sender Tab**:
   - Wait for connection timeout (30 seconds)
   - Verify timeout error shown
   - Verify transfer marked as failed

**Expected Results**:
- ✅ Timeout occurs after configured duration
- ✅ Clear error message shown
- ✅ Resources cleaned up properly
- ✅ Can retry transfer

---

### Test 5: Large File Transfer (100MB)
**Objective**: Verify large file handling

**Steps**:
1. **Sender Tab**:
   - Select 1 large file (100 MB)
   - Enable Group Transfer
   - Select 1 recipient
   - Start transfer

2. **Monitor**:
   - Watch progress bar updates
   - Monitor memory usage
   - Check for UI freezing
   - Verify speed calculation

3. **Receiver Tab**:
   - Accept transfer
   - Monitor receive progress
   - Verify file integrity after download

**Expected Results**:
- ✅ Transfer completes successfully
- ✅ Progress updates smoothly
- ✅ No memory leaks
- ✅ UI remains responsive
- ✅ File integrity verified (checksum match)

---

### Test 6: Many Small Files (50 files)
**Objective**: Verify handling of many files

**Steps**:
1. **Prepare**: Create 50 small files (1-10 KB each)
2. **Sender Tab**:
   - Select all 50 files
   - Enable Group Transfer
   - Select 1 recipient
   - Start transfer

3. **Monitor**:
   - Watch file counter (X/50)
   - Verify sequential file sending
   - Check for errors

4. **Receiver Tab**:
   - Accept transfer
   - Verify all 50 files received

**Expected Results**:
- ✅ All 50 files transferred
- ✅ File counter accurate
- ✅ No files skipped
- ✅ Order maintained (if important)

---

### Test 7: Network Interruption
**Objective**: Verify error handling during transfer

**Steps**:
1. **Sender Tab**:
   - Start large file transfer
   - After 50% progress, disconnect network (turn off WiFi)
   - Wait for connection lost detection
   - Reconnect network

2. **Verify**:
   - Error message shown
   - Transfer marked as failed
   - Can retry after reconnection

**Expected Results**:
- ✅ Connection loss detected quickly
- ✅ Clear error message
- ✅ Resources cleaned up
- ✅ Can retry successfully

---

### Test 8: Maximum Recipients (10 recipients)
**Objective**: Verify maximum limit enforcement

**Steps**:
1. **Sender Tab**:
   - Select files
   - Enable Group Transfer
   - Try to select 11 recipients
   - Verify limit enforced at 10

2. **Start transfer with 10 recipients**:
   - Verify all 10 receive invitations
   - Monitor performance
   - Verify all complete

**Expected Results**:
- ✅ UI prevents selecting >10 recipients
- ✅ Server rejects >10 recipients
- ✅ Transfer succeeds with 10 recipients
- ✅ Performance acceptable

---

### Test 9: UI Discoverability
**Objective**: Verify users can find group transfer feature

**Steps**:
1. **New User Flow**:
   - Open app
   - Look for group transfer options
   - Find "Advanced" menu
   - Find "Enable Group Transfer" item
   - Enable group transfer
   - Verify UI changes to show mode

2. **Verify UI Indicators**:
   - Transfer mode badge shows "Group Transfer"
   - Recipient count shown
   - "Select Recipients" button visible
   - Different icon (Users icon)

**Expected Results**:
- ✅ Feature discoverable within 30 seconds
- ✅ Clear visual indicators
- ✅ Intuitive workflow
- ✅ Helpful tooltips/labels

---

### Test 10: Mixed File Types
**Objective**: Verify different file types handled correctly

**Steps**:
1. **Sender Tab**:
   - Select mixed file types:
     - Image (.jpg)
     - Document (.pdf)
     - Archive (.zip)
     - Text (.txt)
     - Video (.mp4)
   - Send via group transfer

2. **Receiver Tab**:
   - Accept and receive all files
   - Download each file
   - Verify file type preserved
   - Open/view each file

**Expected Results**:
- ✅ All file types transferred
- ✅ MIME types preserved
- ✅ Files openable after transfer
- ✅ No corruption

---

## Performance Benchmarks

### Baseline Performance Targets

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| Connection Setup Time | <2s | <5s | >5s |
| Transfer Speed (Local) | >10 MB/s | >5 MB/s | <5 MB/s |
| UI Responsiveness | 60 FPS | 30 FPS | <30 FPS |
| Memory Usage (per recipient) | <50 MB | <100 MB | >100 MB |
| CPU Usage | <30% | <50% | >50% |

### Measure Performance
```javascript
// In browser console during transfer:
console.time('groupTransfer');
// Wait for transfer to complete
console.timeEnd('groupTransfer');

// Check memory
console.log(performance.memory);
```

---

## Security Testing

### Test 11: Encryption Verification
**Steps**:
1. Open browser DevTools → Network tab
2. Start group transfer
3. Verify WebRTC data channel traffic encrypted
4. Check signaling messages don't contain file data
5. Verify PQC encryption active (if supported)

**Expected Results**:
- ✅ WebRTC data encrypted
- ✅ Signaling metadata only
- ✅ PQC encryption indicator shown
- ✅ No plaintext file data in network logs

### Test 12: Unauthorized Access Prevention
**Steps**:
1. Start group transfer with recipient A
2. Attempt to join from recipient B (not invited)
3. Verify rejection

**Expected Results**:
- ✅ Non-invited recipients can't join
- ✅ Server validates recipient list
- ✅ Error message shown to unauthorized user

---

## Browser Compatibility

Test on:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)

---

## Regression Testing

Verify existing features still work:
- [ ] Single file transfer works
- [ ] Internet mode transfers work
- [ ] Local discovery works
- [ ] Chat during transfer works
- [ ] Screen sharing works
- [ ] Camera capture works
- [ ] Email fallback works

---

## Automated Testing (Future)

### Unit Tests
```typescript
// lib/discovery/__tests__/group-discovery-manager.test.ts
describe('GroupDiscoveryManager', () => {
  test('connects to device via signaling', async () => {
    // Test implementation
  });
});

// lib/signaling/__tests__/socket-signaling.test.ts
describe('SocketSignaling', () => {
  test('emits group-offer with timestamp', () => {
    // Test implementation
  });
});
```

### Integration Tests
```typescript
// tests/integration/group-transfer.test.ts
describe('Group Transfer Flow', () => {
  test('sends multiple files to multiple recipients', async () => {
    // Test implementation
  });
});
```

---

## Issue Reporting Template

If issues found during testing:

```markdown
### Issue Title
Brief description of the issue

**Environment**:
- Browser: Chrome 121
- OS: Windows 11
- Connection: Local WiFi

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**:
What should happen

**Actual Behavior**:
What actually happened

**Screenshots**:
Attach relevant screenshots

**Console Logs**:
Paste relevant console errors

**Signaling Server Logs**:
Paste relevant server logs
```

---

## Test Results Summary

| Test | Status | Notes | Tester | Date |
|------|--------|-------|--------|------|
| Test 1: Basic Transfer | ⏳ Pending | | | |
| Test 2: Multi-Recipient | ⏳ Pending | | | |
| Test 3: Reject Flow | ⏳ Pending | | | |
| Test 4: Timeout | ⏳ Pending | | | |
| Test 5: Large File | ⏳ Pending | | | |
| Test 6: Many Files | ⏳ Pending | | | |
| Test 7: Network Loss | ⏳ Pending | | | |
| Test 8: Max Recipients | ⏳ Pending | | | |
| Test 9: UI Discovery | ⏳ Pending | | | |
| Test 10: Mixed Types | ⏳ Pending | | | |
| Test 11: Encryption | ⏳ Pending | | | |
| Test 12: Unauthorized | ⏳ Pending | | | |

**Legend**:
- ⏳ Pending
- ✅ Passed
- ⚠️ Passed with issues
- ❌ Failed

---

## Sign-Off

**QA Lead**: _______________________
**Date**: _______________________
**Approved for Production**: [ ] Yes [ ] No
**Comments**: _______________________

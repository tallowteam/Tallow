# Screen Sharing - Manual Testing Guide

**Important:** Screen sharing cannot be fully automated in tests because it requires explicit user permission through browser UI. This guide provides step-by-step manual testing procedures.

---

## Test Environment Setup

### Prerequisites
1. **Browser:** Chrome 72+, Edge 79+, or Firefox 66+
2. **Server:** Development server running (`npm run dev`)
3. **URL:** http://localhost:3000/screen-share-demo
4. **Network:** Stable internet connection

### Recommended Test Browsers
- ✅ **Chrome (Primary)** - Full feature support
- ✅ **Edge** - Full feature support
- ⚠️ **Firefox** - No system audio support
- ⚠️ **Safari** - Limited support

---

## Test Suite 1: Basic Functionality

### Test 1.1: Screen Sharing Button Display
**Steps:**
1. Navigate to `/screen-share-demo`
2. Click "Sender (Your Screen)" tab

**Expected Results:**
- ✅ "Start Sharing" button visible
- ✅ Settings button visible
- ✅ No error messages

**Status:** ___

---

### Test 1.2: Start Screen Sharing
**Steps:**
1. Click "Start Sharing" button
2. Browser permission dialog appears
3. Select "Entire Screen" or "Window"
4. Click "Share" button in browser dialog

**Expected Results:**
- ✅ Browser picker appears
- ✅ Can select screen/window/tab
- ✅ After selection, "Sharing" badge appears (green)
- ✅ "Stop Sharing" button becomes visible
- ✅ Preview shows your screen
- ✅ Toast notification: "Screen sharing started"

**Screenshots:**
- Browser picker dialog
- Sharing state with green badge
- Preview window

**Status:** ___

---

### Test 1.3: Stop Screen Sharing
**Steps:**
1. While sharing is active, click "Stop Sharing" button

**Expected Results:**
- ✅ Sharing stops immediately
- ✅ Preview disappears
- ✅ "Start Sharing" button returns
- ✅ Badge removed
- ✅ Toast notification: "Screen sharing stopped"

**Status:** ___

---

### Test 1.4: Permission Denied
**Steps:**
1. Click "Start Sharing"
2. In browser dialog, click "Cancel"

**Expected Results:**
- ✅ Error alert displayed
- ✅ Error message mentions permission
- ✅ Can retry by clicking "Start Sharing" again

**Status:** ___

---

### Test 1.5: Browser UI Stop
**Steps:**
1. Start sharing
2. Click browser's "Stop Sharing" button (appears in toolbar/tab)

**Expected Results:**
- ✅ Tallow UI updates to stopped state
- ✅ "Start Sharing" button returns
- ✅ Preview removed
- ✅ No errors

**Status:** ___

---

## Test Suite 2: Quality & Settings

### Test 2.1: Quality Selection
**Steps:**
1. Click "Settings" button
2. Change Quality to "720p"
3. Click "Start Sharing"
4. Check preview resolution

**Expected Results:**
- ✅ Quality selector shows "720p (1280x720)"
- ✅ Preview displays 1280x720 resolution
- ✅ Statistics show correct resolution

**Repeat for:**
- ✅ 1080p (1920x1080)
- ✅ 4K (3840x2160) - if hardware supports

**Status:** ___

---

### Test 2.2: Frame Rate Selection
**Steps:**
1. Open Settings
2. Change Frame Rate to "15 FPS"
3. Start sharing
4. Observe statistics

**Expected Results:**
- ✅ Frame rate selector works
- ✅ Statistics show ~15 FPS
- ✅ Video appears smooth (no judder)

**Repeat for:**
- ✅ 30 FPS
- ✅ 60 FPS

**Status:** ___

---

### Test 2.3: Audio Sharing (Chrome/Edge Only)
**Steps:**
1. Open Settings
2. Enable "Share System Audio" toggle
3. Start sharing
4. Play audio on your computer

**Expected Results:**
- ✅ Toggle enables successfully
- ✅ Blue info message about browser support appears
- ✅ Audio indicator (speaker icon) shows in preview
- ✅ Remote viewer can hear audio (if WebRTC connected)

**Firefox Test:**
- ✅ Same steps should show warning about no audio support

**Status:** ___

---

### Test 2.4: Dynamic Quality Change
**Steps:**
1. Start sharing at 1080p
2. Click "Settings" while sharing
3. Try to change quality

**Expected Results:**
- ✅ Quality selector is disabled while sharing
- ✅ Message indicates restart required
- ⚠️ OR quality changes without restart (implementation dependent)

**Status:** ___

---

## Test Suite 3: Preview Features

### Test 3.1: Preview Display
**Steps:**
1. Start sharing
2. Move windows around on your screen
3. Observe preview

**Expected Results:**
- ✅ Preview shows real-time screen content
- ✅ Updates smoothly as you move windows
- ✅ Aspect ratio maintained
- ✅ Resolution badge shows correct dimensions

**Status:** ___

---

### Test 3.2: Hide/Show Preview
**Steps:**
1. While sharing, click "Hide Preview"
2. Click "Show Preview"

**Expected Results:**
- ✅ Preview hides (shows placeholder)
- ✅ "Show Preview" button appears
- ✅ Clicking shows preview again
- ✅ Sharing continues uninterrupted

**Status:** ___

---

### Test 3.3: Fullscreen Preview
**Steps:**
1. Click "Fullscreen" button on preview
2. Press ESC to exit

**Expected Results:**
- ✅ Preview goes fullscreen
- ✅ ESC exits fullscreen
- ✅ "Exit Fullscreen" button works
- ✅ Sharing continues during fullscreen

**Status:** ___

---

### Test 3.4: Pause/Resume
**Steps:**
1. Start sharing
2. Click "Pause" button
3. Click "Resume" button

**Expected Results:**
- ✅ "Paused" badge appears
- ✅ Preview shows pause overlay
- ✅ Video track disabled (black screen for remote)
- ✅ Resume restores video
- ✅ No reconnection needed

**Status:** ___

---

## Test Suite 4: Viewer (Receiver)

### Test 4.1: Waiting State
**Steps:**
1. Navigate to `/screen-share-demo`
2. Click "Receiver (Remote View)" tab
3. Don't start sharing

**Expected Results:**
- ✅ Shows "Waiting for screen share..." message
- ✅ Monitor icon displayed
- ✅ No video element

**Status:** ___

---

### Test 4.2: Receiving Stream
**Steps:**
1. Go to Sender tab, start sharing
2. Switch to Receiver tab

**Expected Results:**
- ✅ Video appears (simulated in demo)
- ✅ "Receiving" badge (blue, pulsing)
- ✅ Resolution displayed
- ✅ Controls available

**Note:** Full WebRTC testing requires two separate devices/browsers

**Status:** ___

---

### Test 4.3: Fullscreen Viewer
**Steps:**
1. With stream receiving, click "Fullscreen"
2. Press ESC

**Expected Results:**
- ✅ Video goes fullscreen
- ✅ ESC hint displayed
- ✅ Exit fullscreen works

**Status:** ___

---

### Test 4.4: Picture-in-Picture
**Steps:**
1. Click "Picture-in-Picture" button
2. Move PiP window
3. Click "Exit PiP" or close PiP window

**Expected Results:**
- ✅ Video pops out to PiP window
- ✅ Can resize and move PiP
- ✅ Controls show "Exit PiP"
- ✅ Closing PiP returns to normal view

**Status:** ___

---

### Test 4.5: Screenshot Capture
**Steps:**
1. While viewing stream, click "Screenshot"
2. Check Downloads folder

**Expected Results:**
- ✅ Screenshot downloads as PNG
- ✅ Filename: `screen-share-[timestamp].png`
- ✅ Toast: "Screenshot saved"
- ✅ Image contains current frame

**Status:** ___

---

### Test 4.6: Audio Controls (if audio enabled)
**Steps:**
1. Start sharing with audio
2. In viewer, click "Mute" button
3. Click "Unmute"

**Expected Results:**
- ✅ Mute button visible when audio present
- ✅ Audio stops on mute
- ✅ Mute icon appears on video
- ✅ Unmute restores audio

**Status:** ___

---

## Test Suite 5: Statistics

### Test 5.1: Statistics Display
**Steps:**
1. Start sharing
2. Wait 2-3 seconds for stats to populate
3. Observe statistics panel

**Expected Results:**
- ✅ Resolution displayed (e.g., "1920x1080")
- ✅ Frame rate shows actual FPS
- ✅ Bitrate shows Mbps/Kbps
- ✅ Latency shows milliseconds
- ✅ Stats update every second

**Status:** ___

---

### Test 5.2: Stats Accuracy
**Steps:**
1. Start at 720p/15fps
2. Note statistics
3. Stop and restart at 1080p/60fps
4. Note statistics

**Expected Results:**
- ✅ Resolution changes reflect correctly
- ✅ FPS increases from ~15 to ~60
- ✅ Bitrate increases (higher quality = higher bitrate)

**Status:** ___

---

## Test Suite 6: Error Handling

### Test 6.1: No Screen Available
**Steps:**
1. (If possible) disable screen capture in browser settings
2. Try to start sharing

**Expected Results:**
- ✅ Error message displayed
- ✅ No crash
- ✅ Can dismiss and try again

**Status:** ___

---

### Test 6.2: Sharing Already in Progress
**Steps:**
1. Start sharing in tab 1
2. Without stopping, click "Start Sharing" again

**Expected Results:**
- ✅ Second click has no effect OR
- ✅ Error about already sharing OR
- ✅ Restarts sharing (implementation dependent)

**Status:** ___

---

### Test 6.3: Browser Compatibility
**Steps:**
1. Test in Safari (if available)
2. Look for warning message

**Expected Results:**
- ✅ Warning about limited support OR
- ✅ Feature detection prevents start OR
- ✅ Works with limitations

**Status:** ___

---

## Test Suite 7: Browser Compatibility Matrix

### Chrome (72+)
- ✅ Screen sharing works
- ✅ System audio works
- ✅ All quality presets
- ✅ All frame rates
- ✅ Pause/resume
- ✅ Switch source
- ✅ Statistics
- ✅ PiP support

**Status:** ___

---

### Edge (79+)
- ✅ Screen sharing works
- ✅ System audio works
- ✅ All quality presets
- ✅ All frame rates
- ✅ Pause/resume
- ✅ Switch source
- ✅ Statistics
- ✅ PiP support

**Status:** ___

---

### Firefox (66+)
- ✅ Screen sharing works
- ❌ System audio NOT available
- ✅ All quality presets
- ✅ All frame rates
- ✅ Pause/resume
- ✅ Switch source
- ✅ Statistics
- ⚠️ PiP limited

**Status:** ___

---

### Safari (13+)
- ⚠️ Screen sharing limited
- ❌ System audio NOT available
- ⚠️ Quality presets limited
- ⚠️ Frame rates limited
- ⚠️ Features may vary

**Status:** ___

---

## Test Suite 8: Performance

### Test 8.1: CPU Usage
**Steps:**
1. Open Task Manager / Activity Monitor
2. Start sharing at 1080p/30fps
3. Monitor CPU usage for 1 minute

**Expected Results:**
- ✅ CPU usage stays reasonable (<50% on modern hardware)
- ✅ No freezing or lag
- ✅ UI remains responsive

**CPU Usage:** ___% (record actual)

**Status:** ___

---

### Test 8.2: Memory Usage
**Steps:**
1. Open browser DevTools > Performance Monitor
2. Start sharing
3. Monitor memory for 2 minutes

**Expected Results:**
- ✅ Memory stable (no continuous growth)
- ✅ No memory leaks
- ✅ Garbage collection works

**Memory Usage:** ___ MB (record baseline and after 2 min)

**Status:** ___

---

### Test 8.3: High Resolution (4K)
**Steps:**
1. Select 4K quality
2. Set 60 FPS
3. Start sharing
4. Monitor performance

**Expected Results:**
- ✅ Starts successfully (if hardware capable)
- ✅ Frame rate maintained
- ✅ No stuttering
- ⚠️ OR gracefully degrades quality

**Status:** ___

---

## Test Suite 9: Integration

### Test 9.1: With WebRTC Connection
**Steps:**
1. Set up two browsers/devices
2. Establish P2P connection via Tallow
3. Start screen sharing
4. Verify remote sees screen

**Expected Results:**
- ✅ Screen visible on remote device
- ✅ Low latency (<1 second)
- ✅ Smooth playback
- ✅ Audio works (if enabled)

**Status:** ___

---

### Test 9.2: Switch Source During Sharing
**Steps:**
1. Start sharing (entire screen)
2. Click "Switch Source"
3. Select a different window
4. Confirm

**Expected Results:**
- ✅ Browser picker appears again
- ✅ Can select different source
- ✅ Preview updates to new source
- ✅ No disconnection
- ✅ Statistics reset/update

**Status:** ___

---

## Test Suite 10: Security & Privacy

### Test 10.1: User Consent
**Steps:**
1. Attempt to start sharing
2. Observe permission flow

**Expected Results:**
- ✅ Browser dialog appears (NOT auto-granted)
- ✅ User must explicitly click "Share"
- ✅ "Cancel" stops process safely

**Status:** ___

---

### Test 10.2: Visual Indicators
**Steps:**
1. Start sharing
2. Look for indicators

**Expected Results:**
- ✅ Browser shows "Sharing" indicator in tab/toolbar
- ✅ Tallow shows "Sharing" badge
- ✅ "Live" badge visible in preview
- ✅ Privacy notice displayed

**Status:** ___

---

### Test 10.3: Auto-Stop on Disconnect
**Steps:**
1. Start sharing with WebRTC connection
2. Close the connection
3. Verify sharing stops

**Expected Results:**
- ✅ Sharing stops automatically
- ✅ Resources cleaned up
- ✅ UI returns to stopped state

**Status:** ___

---

## Test Results Summary

### Completion Checklist
- [ ] Suite 1: Basic Functionality (5/5 tests)
- [ ] Suite 2: Quality & Settings (4/4 tests)
- [ ] Suite 3: Preview Features (4/4 tests)
- [ ] Suite 4: Viewer (6/6 tests)
- [ ] Suite 5: Statistics (2/2 tests)
- [ ] Suite 6: Error Handling (3/3 tests)
- [ ] Suite 7: Browser Compatibility (4 browsers)
- [ ] Suite 8: Performance (3/3 tests)
- [ ] Suite 9: Integration (2/2 tests)
- [ ] Suite 10: Security & Privacy (3/3 tests)

**Total Tests:** 40+

### Issues Found
1. Issue: ___
   - Severity: ___
   - Steps to reproduce: ___
   - Expected: ___
   - Actual: ___

2. Issue: ___
   - Severity: ___
   - Steps to reproduce: ___
   - Expected: ___
   - Actual: ___

### Notes
- Browser: ___
- OS: ___
- Date: ___
- Tester: ___

---

## Quick Smoke Test (5 minutes)

If time is limited, run this abbreviated test:

1. ✅ Navigate to `/screen-share-demo`
2. ✅ Click "Start Sharing" → Select screen → Verify sharing starts
3. ✅ Verify preview shows your screen
4. ✅ Check statistics are populating
5. ✅ Click "Pause" → Verify pauses
6. ✅ Click "Resume" → Verify resumes
7. ✅ Click "Stop Sharing" → Verify stops cleanly
8. ✅ Click "Settings" → Change quality → Verify saved
9. ✅ Try in different browser (Chrome vs Firefox)
10. ✅ Check browser console for errors

**Smoke Test Status:** ___

---

## Automated Checks

These can be verified programmatically:

```bash
# Check for TypeScript errors
npm run build

# Check for console errors during sharing
# (Open DevTools console while testing)

# Verify all imports resolve
npm run lint
```

---

## Report Template

```
### Screen Sharing Test Report

**Date:** ___
**Tester:** ___
**Browser:** ___ (version: ___)
**OS:** ___

**Tests Passed:** ___/40
**Tests Failed:** ___/40
**Tests Skipped:** ___/40

**Critical Issues:** ___
**Minor Issues:** ___

**Recommendation:** [ ] PASS / [ ] FAIL / [ ] PASS WITH ISSUES

**Notes:**
___
```

---

**Last Updated:** 2026-01-27
**Version:** 1.0

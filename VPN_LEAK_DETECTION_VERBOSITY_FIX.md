# VPN Leak Detection Verbosity Fix

## Problem
The VPN leak detector was showing 8+ identical warnings:
```
[WARNING] [VPNLeakDetector] WebRTC IP leak detected: 4 IPs found
[WARNING] [VPNLeakDetector] WebRTC IP leak detected: 4 IPs found
... (repeated 8+ times)
```

## Root Cause
The `onicecandidate` event handler in `detectWebRTCLeaks()` fires multiple times (once for each ICE candidate discovered during WebRTC connection setup). Each event was logging a warning, causing duplicate messages even though the IPs were the same.

## Solution Implemented

### 1. Added Throttling/Debouncing
Added instance variables to the `VPNLeakDetector` class:
- `lastWarningTime`: Tracks when the last warning was shown
- `lastWarningIPCount`: Tracks how many IPs were in the last warning
- `WARNING_THROTTLE_MS`: 5-second throttle window

### 2. Consolidated Warnings
Changed the warning strategy:
- **Before**: Warning logged for each ICE candidate event (8+ times)
- **After**: Single warning logged after all IPs are collected (1 time)

### 3. Improved Logging Levels
- Individual IP detections: Changed from `warn` to `log` (debug level)
- Consolidated leak summary: Shown as `warn` only once
- Duplicate warnings within 5 seconds: Suppressed

## Changes Made

### File: `C:\Users\aamir\Documents\Apps\Tallow\lib\privacy\vpn-leak-detection.ts`

#### 1. Added throttling properties (lines 132-134)
```typescript
private lastWarningTime = 0;
private lastWarningIPCount = 0;
private readonly WARNING_THROTTLE_MS = 5000; // Show warning at most once per 5 seconds
```

#### 2. Updated `detectWebRTCLeaks()` method (lines 247-307)
- Added `warningShown` flag to track if warning was displayed
- Moved warning to timeout callback (shows once after all IPs collected)
- Changed individual IP logs from `warn` to `log` level
- Added deduplication check for new IPs

#### 3. Added `logLeakWarning()` helper method (lines 309-328)
- Implements throttling logic
- Consolidates duplicate warnings
- Shows IP count in singular/plural form

## Benefits

1. **Reduced Console Noise**: 8+ warnings reduced to 1 warning
2. **Better User Experience**: Clear, consolidated message
3. **Maintains Functionality**: Still detects all IPs correctly
4. **Prevents Spam**: 5-second throttle prevents rapid re-checks from spamming console
5. **Improved Debugging**: Individual IPs still logged at debug level

## Example Output

### Before
```
[WARNING] [VPNLeakDetector] WebRTC IP leak detected: 192.168...
[WARNING] [VPNLeakDetector] WebRTC IP leak detected: 192.168...
[WARNING] [VPNLeakDetector] WebRTC IP leak detected: 10.0...
[WARNING] [VPNLeakDetector] WebRTC IP leak detected: 10.0...
[WARNING] [VPNLeakDetector] WebRTC IP leak detected: 172.16...
[WARNING] [VPNLeakDetector] WebRTC IP leak detected: 172.16...
[WARNING] [VPNLeakDetector] WebRTC IP leak detected: 4 IPs found
[WARNING] [VPNLeakDetector] WebRTC IP leak detected: 4 IPs found
```

### After
```
[LOG] [VPNLeakDetector] WebRTC IP detected: 192.168...
[LOG] [VPNLeakDetector] WebRTC IP detected: 10.0...
[LOG] [VPNLeakDetector] WebRTC IP detected: 172.16...
[LOG] [VPNLeakDetector] WebRTC IP detected: 203.0...
[WARNING] [VPNLeakDetector] WebRTC IP leak detected: 4 IPs found
```

## Testing

The fix:
1. Maintains all existing functionality
2. Passes TypeScript type checking
3. Preserves the same API surface
4. Works with existing privacy initialization code

## Related Files
- `C:\Users\aamir\Documents\Apps\Tallow\lib\privacy\vpn-leak-detection.ts` (modified)
- `C:\Users\aamir\Documents\Apps\Tallow\lib\init\privacy-init.ts` (uses the detector)
- `C:\Users\aamir\Documents\Apps\Tallow\lib\privacy\index.ts` (exports)

## Security Impact
No security impact - this is purely a logging/UX improvement. All leak detection functionality remains intact and working correctly.

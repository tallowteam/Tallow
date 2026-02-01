# Memory Monitor - Quick Reference

## Quick Commands (Browser Console)

```javascript
// View current configuration
window.memoryMonitor.getConfig()

// Get current memory stats
window.memoryMonitor.getStats()

// Get full report with leak detection
window.memoryMonitor.getReport()

// Enable verbose logging (shows 95-99% warnings)
window.memoryMonitor.enableVerboseLogging()

// Disable verbose logging
window.memoryMonitor.disableVerboseLogging()

// Clear memory samples
window.memoryMonitor.clear()

// Stop monitoring
window.memoryMonitor.stop()

// Restart monitoring with custom interval (30 seconds)
window.memoryMonitor.start(30000)
```

## Thresholds

| Environment | Warning | Critical |
|------------|---------|----------|
| Development | 95% | 99% |
| Production | 85% | 95% |

## Monitoring Frequency

| Environment | Browser | Server |
|------------|---------|--------|
| Development | 30s | 60s |
| Production | 30s | 60s |

## Alert Behavior

- **Critical Alert Cooldown**: 60 seconds between alerts
- **Dev Mode Warnings**: Suppressed by default (enable with verbose logging)
- **Production Warnings**: Always active

## Visual Indicators (Dev Tools Panel)

- **Green** (< 70%): Healthy
- **Yellow** (70-90%): Moderate usage
- **Red** (> 90%): High usage

## Common Scenarios

### Scenario 1: "Critical" warnings in dev mode

**Before optimization**: Warnings at 96-98%
**After optimization**: Only warns at 99%+
**Action**: None needed - this is expected dev behavior

### Scenario 2: Need to debug memory issues

```javascript
// Enable verbose logging
window.memoryMonitor.enableVerboseLogging()
// Reload page
location.reload()
```

### Scenario 3: Check if there's a memory leak

```javascript
const report = window.memoryMonitor.getReport()
if (report.leakDetected) {
  console.log('Memory leak detected!')
  console.log('Peak usage:', report.peak)
  console.log('Current usage:', report.current)
}
```

### Scenario 4: Reduce monitoring overhead

```javascript
// Stop current monitoring
window.memoryMonitor.stop()
// Restart with 2 minute interval
window.memoryMonitor.start(120000)
```

## Files

- **Memory Monitor**: `lib/utils/memory-monitor.ts`
- **Dev Tools Panel**: `components/app/dev-tools-panel.tsx`
- **Full Documentation**: `MEMORY_MONITOR_OPTIMIZATION.md`

## Support

For detailed information, see [MEMORY_MONITOR_OPTIMIZATION.md](./MEMORY_MONITOR_OPTIMIZATION.md)

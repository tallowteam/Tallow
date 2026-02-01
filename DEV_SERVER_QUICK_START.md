# Development Server Quick Start

## Starting the Server

```bash
# Recommended: Use optimized dev script
npm run dev

# Alternative: Simple mode (no checks)
npm run dev:simple

# Turbopack mode (experimental)
npm run dev:turbo

# With Node.js inspector
npm run dev:inspect
```

## What's Optimized?

### 1. No More 408 Errors ✅
- Service worker disabled in development
- Increased HTTP timeouts
- Proper keep-alive settings

### 2. Memory Management ✅
- 4GB heap limit (prevents OOM crashes)
- Automatic memory monitoring
- Memory leak detection
- Visual memory usage panel

### 3. Fast Hot Reloads ✅
- Optimized file watching
- No unnecessary polling
- Excluded non-code files
- Efficient change aggregation

### 4. Resource Cleanup ✅
- Automatic timer cleanup
- Event listener management
- Proper component unmounting
- Memory released on page unload

## Development Tools Panel

Click the **orange activity button** (bottom-right) to view:
- Real-time memory usage
- Heap statistics
- Memory leak alerts
- Peak memory tracking

## Common Issues

### 1. Server Still Timing Out?

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev
```

### 2. High Memory Usage?

**Check Dev Tools Panel:**
- If usage > 80%, restart server
- If leak detected, check for unclosed connections
- Review useEffect cleanup functions

### 3. Slow Hot Reloads?

**Optimize:**
```bash
# Reduce open files in editor
# Close unused browser tabs
# Clear browser cache
```

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Initial startup | < 30s | ✅ |
| HMR latency | < 2s | ✅ |
| Memory (idle) | < 1GB | ✅ |
| Memory (active) | < 2GB | ✅ |
| 408 errors | 0 | ✅ |

## Files Modified

### New Files
- `.dev.env` - Development environment config
- `next.dev.config.ts` - Dev-optimized Next.js config
- `lib/utils/memory-monitor.ts` - Memory monitoring
- `lib/utils/cleanup-manager.ts` - Resource cleanup
- `components/app/dev-tools-panel.tsx` - Dev tools UI
- `scripts/dev-server.js` - Optimized startup script

### Modified Files
- `lib/pwa/service-worker-registration.ts` - Disabled in dev
- `lib/hooks/use-service-worker.ts` - Disabled in dev
- `components/providers.tsx` - Added dev tools panel
- `package.json` - Updated dev scripts

## Architecture

```
Development Flow:
1. npm run dev
2. scripts/dev-server.js checks environment
3. Starts Next.js with optimized settings
4. Memory monitor starts automatically
5. Service worker stays disabled
6. Dev tools panel available
```

## Monitoring

### Browser DevTools
- **Console**: Check for warnings/errors
- **Network**: Monitor request timing
- **Application**: Verify no service worker
- **Performance**: Profile memory usage

### Dev Tools Panel
- **Memory Usage**: Current heap statistics
- **Peak Memory**: Highest usage recorded
- **Leak Detection**: Automatic alerts
- **Actions**: Clear stats, view tips

## Best Practices

### ✅ Do
- Restart server if memory > 3GB
- Check dev tools panel regularly
- Clean up useEffect hooks properly
- Close unused browser tabs
- Clear cache if experiencing issues

### ❌ Don't
- Keep multiple dev servers running
- Use service worker in development
- Ignore memory leak warnings
- Let server run for days without restart
- Leave browser DevTools open unless debugging

## Troubleshooting

### Issue: 408 Request Timeout

**Cause:** Service worker still active or HTTP timeout too low

**Fix:**
1. Open DevTools → Application → Service Workers
2. If any listed, click "Unregister"
3. Hard refresh (Ctrl+Shift+R)
4. Restart dev server

### Issue: Memory Growing Continuously

**Cause:** Memory leak in React components

**Fix:**
1. Check dev tools panel for leak alert
2. Review recent component changes
3. Ensure useEffect returns cleanup function
4. Check for unclosed WebRTC connections
5. Verify event listeners are removed

### Issue: HMR Not Working

**Cause:** File watching issues or cache problems

**Fix:**
1. Check `.watchmanconfig` includes your files
2. Ensure no file polling: `echo $WATCHPACK_POLLING` (should be empty/false)
3. Clear Next.js cache: `rm -rf .next`
4. Restart dev server

## Environment Variables

Available in `.dev.env`:

```bash
NODE_ENV=development                           # Environment
NODE_OPTIONS="--max-old-space-size=4096"      # Memory limit
HTTP_TIMEOUT=120000                            # Request timeout
SKIP_SERVICE_WORKER=true                       # Disable SW
FAST_REFRESH=true                              # Enable HMR
WATCHPACK_POLLING=false                        # Disable polling
```

## Need Help?

1. **Check console logs** - Most issues show clear errors
2. **Review dev tools panel** - Memory and performance insights
3. **Read full docs** - See `DEV_SERVER_OPTIMIZATION.md`
4. **Enable inspector** - Run `npm run dev:inspect` for deep debugging

## Quick Reference Commands

```bash
# Start dev server
npm run dev

# Clean cache and restart
rm -rf .next && npm run dev

# Check memory from CLI (while server running)
curl http://localhost:3000/api/metrics

# Profile with Node.js inspector
npm run dev:inspect
# Then open chrome://inspect in Chrome
```

## Success Indicators

You'll know the optimization is working when:
- ✅ No 408 timeout errors during browsing
- ✅ Memory stays under 2GB during active development
- ✅ Hot reloads complete in < 2 seconds
- ✅ Dev tools panel shows no leak warnings
- ✅ Service worker shows as disabled in DevTools

## Version Info

- **Optimization Date:** 2026-01-28
- **Next.js Version:** 16.1.6
- **Node.js Required:** >= 18.0.0
- **Status:** Stable ✅

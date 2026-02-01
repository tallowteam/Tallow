# Development Setup Guide

Quick guide to get the optimized development environment running.

## Prerequisites

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **Operating System**: Windows, macOS, or Linux

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start optimized dev server
npm run dev

# 3. Open browser
# Navigate to http://localhost:3000
```

That's it! The server is now running with all optimizations enabled.

## What Happens Automatically

When you run `npm run dev`:

1. ✅ **Environment checks** - Verifies Node.js version and configuration
2. ✅ **Memory optimization** - Sets 4GB heap limit automatically
3. ✅ **Service worker disabled** - No conflicts with HMR
4. ✅ **Memory monitoring** - Starts tracking resource usage
5. ✅ **Dev tools enabled** - Orange button appears in bottom-right

## Development Tools

### Dev Tools Panel
Click the **orange activity button** (bottom-right corner) to access:
- Real-time memory usage
- Heap statistics
- Memory leak detection
- Performance tips

### Health Check
```bash
# Check server health
npm run health

# Continuous monitoring (every 10 seconds)
npm run health:watch
```

### Metrics
```bash
# Get Prometheus metrics
npm run metrics

# Watch metrics continuously
npm run metrics:watch
```

## Common Commands

```bash
# Development
npm run dev              # Start optimized dev server
npm run dev:simple       # Start without checks (faster)
npm run dev:turbo        # Use Turbopack (experimental)
npm run dev:inspect      # Start with Node.js inspector

# Health & Monitoring
npm run health           # Check server health
npm run health:watch     # Monitor continuously
npm run metrics          # Get metrics

# Building
npm run build            # Production build
npm run build:analyze    # Build with bundle analyzer

# Testing
npm test                 # Run E2E tests
npm run test:unit        # Run unit tests
npm run test:crypto      # Run crypto tests

# Code Quality
npm run lint             # Check linting
npm run lint:fix         # Fix linting issues
npm run type-check       # TypeScript check
npm run quality          # Full quality check
```

## Project Structure

```
C:\Users\aamir\Documents\Apps\Tallow\
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/                    # Libraries and utilities
│   ├── crypto/            # Cryptography
│   ├── hooks/             # React hooks
│   ├── utils/             # Utilities
│   │   ├── memory-monitor.ts      # Memory monitoring
│   │   └── cleanup-manager.ts     # Resource cleanup
├── public/                 # Static files
├── scripts/                # Build and dev scripts
│   ├── dev-server.js      # Optimized dev starter
│   └── health-check.js    # Health check utility
├── tests/                  # Test files
├── .dev.env               # Dev environment config
├── next.config.ts         # Production config
├── next.dev.config.ts     # Development config
└── package.json           # Dependencies and scripts
```

## Configuration Files

### .dev.env
Development environment variables:
- Memory limits
- HTTP timeouts
- Feature flags

### next.dev.config.ts
Development-optimized Next.js configuration:
- Fast webpack builds
- Efficient file watching
- Minimal optimizations

### .watchmanconfig
File watching exclusions:
- Ignored directories
- Performance optimization

## Troubleshooting

### Server won't start?

```bash
# Clear cache
rm -rf .next node_modules/.cache

# Reinstall dependencies
npm install

# Try again
npm run dev
```

### 408 timeout errors?

```bash
# 1. Verify service worker is disabled
# Open DevTools → Application → Service Workers
# Should show: "No service workers"

# 2. Clear Next.js cache
rm -rf .next

# 3. Restart
npm run dev
```

### High memory usage?

```bash
# 1. Check dev tools panel
# Click orange button → View memory

# 2. Run health check
npm run health

# 3. Restart if memory > 3GB
# Ctrl+C to stop
npm run dev
```

### Slow hot reloads?

```bash
# 1. Close unused browser tabs
# 2. Close unused files in editor
# 3. Clear cache
rm -rf .next

# 4. Restart
npm run dev
```

## Performance Tips

### ✅ Best Practices
1. **Close unused tabs** - Reduces memory pressure
2. **Restart daily** - Prevents memory accumulation
3. **Monitor regularly** - Check dev tools panel
4. **Clean cache** - Run `rm -rf .next` weekly
5. **Update dependencies** - Keep packages current

### ❌ Avoid
1. **Multiple dev servers** - Causes port conflicts
2. **Leaving DevTools open** - Increases memory usage
3. **Editing many files at once** - Overwhelms HMR
4. **Running heavy processes** - Competes for resources
5. **Ignoring warnings** - Can lead to crashes

## Environment Variables

Create `.env.local` for custom settings:

```bash
# Server
PORT=3000
HOSTNAME=localhost

# Features
NEXT_PUBLIC_FEATURE_X=true

# API Keys (keep secret!)
RESEND_API_KEY=your_key_here
NEXT_PUBLIC_TURN_SERVER=your_turn_server
```

Never commit `.env.local` - it's already in `.gitignore`.

## IDE Setup

### VS Code
Recommended extensions:
- ESLint
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- Prettier

### WebStorm
Enable:
- Node.js and npm
- TypeScript
- Tailwind CSS
- ESLint

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/e2e/landing.spec.ts

# Run with UI
npm run test:ui

# Run unit tests
npm run test:unit

# Run crypto tests
npm run test:crypto
```

## Building for Production

```bash
# Standard build
npm run build

# Build with bundle analysis
npm run build:analyze

# Start production server
npm run start
```

## Getting Help

### Documentation
- **Quick Start**: `DEV_SERVER_QUICK_START.md`
- **Full Guide**: `DEV_SERVER_OPTIMIZATION.md`
- **Summary**: `DX_OPTIMIZATION_SUMMARY.md`

### Tools
- **Health Check**: `npm run health`
- **Dev Panel**: Click orange button in browser
- **Console Logs**: Browser DevTools → Console

### Common Issues
1. Check documentation first
2. Run health check
3. Review console logs
4. Clear cache and restart
5. Check GitHub issues

## What's Optimized?

This development environment includes:

✅ **Memory Management** - 4GB heap, automatic monitoring, leak detection
✅ **Fast Hot Reloads** - < 2 second HMR, optimized file watching
✅ **No Timeouts** - Proper HTTP configuration, no 408 errors
✅ **Resource Cleanup** - Automatic timer and listener cleanup
✅ **Visual Monitoring** - Real-time memory and performance dashboard
✅ **Health Checks** - Automated server health verification

## Success Indicators

Your dev environment is working correctly when:

1. ✅ Server starts in < 30 seconds
2. ✅ Hot reloads complete in < 2 seconds
3. ✅ Memory usage stays under 2GB during active development
4. ✅ No 408 timeout errors during normal browsing
5. ✅ Dev tools panel shows green status
6. ✅ Health check reports "GOOD"

## Next Steps

1. **Explore features** - Check `TALLOW_COMPLETE_DOCUMENTATION.md`
2. **Review architecture** - Read `ARCHITECTURE.md`
3. **Understand crypto** - See `ADVANCED_SECURITY.md`
4. **Learn testing** - Review `TEST_COVERAGE.md`
5. **Deploy app** - Follow `DEPLOYMENT-GUIDE.md`

## Support

Need help?
1. Read the docs (start with `DEV_SERVER_QUICK_START.md`)
2. Run `npm run health` to check server status
3. Check console logs for error messages
4. Review GitHub issues
5. Enable inspector: `npm run dev:inspect`

---

**Happy coding!** 🚀

The development environment is optimized for maximum productivity and stability.

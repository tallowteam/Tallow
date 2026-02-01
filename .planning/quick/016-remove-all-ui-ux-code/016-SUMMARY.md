---
phase: quick-016
plan: 01
subsystem: ui-removal
tags: [cleanup, ui, reset, destructive]
tech-stack:
  removed:
    - react-components (234 files)
    - framer-motion-presets (12 files)
    - design-tokens (2 files)
    - react-contexts (13 files)
    - ui-hooks (12 files)
    - visual-tests (20 files)
key-files:
  removed:
    - components/ (entire directory)
    - tallow-ui-subagents/ (entire directory)
    - subagents/ (entire directory)
    - lib/animations/ (12 files)
    - lib/design-system/ (2 files)
    - lib/features/ (5 files)
    - lib/context/ (13 files)
    - lib/styles/ (1 file)
    - app/pages (21 directories, 49 files)
    - tests/e2e/visual/ (20 files)
    - tests/unit/ (UI test dirs)
  preserved:
    - lib/crypto/
    - lib/transfer/
    - lib/transport/
    - lib/webrtc/
    - lib/discovery/
    - lib/rooms/
    - app/api/
    - daemon/
    - tallow-cli/
    - tallow-relay/
metrics:
  duration: 4m17s
  files-removed: 351
  lines-deleted: 105116
  completed: 2026-02-01
---

# Quick Task 016: Remove All UI/UX Code - Summary

**One-liner:** Complete UI reset removing 351 files and 105K lines, preserving
only crypto, transfer, transport, and API code.

## Objective Achieved

Removed ALL UI, UX, and design-related code from the Tallow codebase to enable a
complete UI restart from scratch.

## Tasks Completed

| Task | Name                            | Commit  | Files Changed |
| ---- | ------------------------------- | ------- | ------------- |
| 1    | Remove UI component directories | 5105e32 | 234 deleted   |
| 2    | Remove UI pages from app/       | 79c79a9 | 52 changed    |
| 3    | Remove UI lib code and tests    | 9511cce | 65 deleted    |

## What Was Removed

### Directories Removed (complete)

- `components/` - 234 React components
- `tallow-ui-subagents/` - UI subagent definitions
- `subagents/` - Agent definitions
- `lib/animations/` - Framer Motion presets (12 files)
- `lib/design-system/` - Design tokens (2 files)
- `lib/features/` - UI feature data (5 files)
- `lib/context/` - React contexts (13 files)
- `lib/styles/` - CSS styles (1 file)
- `tests/unit/components/` - Component tests
- `tests/unit/animations/` - Animation tests
- `tests/unit/visual/` - Visual tests
- `tests/unit/hooks/` - Hook tests
- `tests/unit/contexts/` - Context tests
- `tests/e2e/visual/` - Visual regression tests (20 files + snapshots)

### App Pages Removed (21 directories)

- `app/(demos)/` - Demo pages
- `app/advanced/` - Advanced feature pages
- `app/app/` - Main app pages
- `app/architecture-diagrams/` - Diagrams page
- `app/docs/` - Docs page
- `app/donate/` - Donation pages
- `app/download/` - Download pages
- `app/features/` - Features page
- `app/help/` - Help pages
- `app/how-it-works/` - How it works page
- `app/metadata-demo/` - Metadata demo
- `app/offline/` - Offline page
- `app/pqc-test/` - PQC test page
- `app/privacy/` - Privacy page
- `app/room/` - Room pages
- `app/security/` - Security page
- `app/security-test/` - Security test page
- `app/share/` - Share pages
- `app/terms/` - Terms page
- `app/test-page/` - Test page
- `app/ui-demo/` - UI demo page

### Root UI Files Removed

- `app/error.tsx`
- `app/loading.tsx`
- `app/not-found.tsx`
- `app/global-error.tsx`
- `app/toast-styles.css`

### UI Hooks Removed

- `use-animation-preferences.ts`
- `use-announce.ts`
- `use-async-resource.ts`
- `use-breakpoint.ts`
- `use-euveka-theme.ts`
- `use-focus-management.ts`
- `use-focus-trap.ts`
- `use-form-status-enhanced.ts`
- `use-lazy-component.ts`
- `use-reduced-motion.ts`
- `use-scroll-progress.ts`
- `use-section-in-view.ts`

### E2E Tests Removed

- `landing.spec.ts`
- `donate.spec.ts`
- `settings.spec.ts`
- `accessibility.spec.ts`
- `chat.spec.ts`
- `offline.spec.ts`
- `mobile-features.spec.ts`
- `comprehensive-feature-verification.spec.ts`
- `visual/screenshots.spec.ts` (+ 18 snapshot images)

## What Was Preserved

### Core Libraries (100% intact)

- `lib/crypto/` - Post-quantum cryptography (10+ files)
- `lib/transfer/` - File transfer engine (15+ files)
- `lib/transport/` - Onion routing and obfuscation (7 files)
- `lib/webrtc/` - WebRTC configuration (5+ files)
- `lib/discovery/` - Device discovery (10+ files)
- `lib/rooms/` - Room security (5+ files)
- `lib/chat/` - Chat encryption (backend)
- `lib/email/` - Email service
- `lib/email-fallback/` - Email fallback
- `lib/relay/` - Relay client
- `lib/network/` - Network utilities
- `lib/monitoring/` - Monitoring
- `lib/middleware/` - Middleware
- `lib/privacy/` - Privacy logic
- `lib/auth/` - Authentication
- `lib/api/` - API utilities
- `lib/i18n/` - Internationalization

### Transfer/Network Hooks Preserved

- `use-adaptive-transfer.ts`
- `use-advanced-transfer.ts`
- `use-chat.ts`
- `use-device-connection.ts`
- `use-email-transfer.ts`
- `use-file-transfer.ts`
- `use-group-discovery.ts`
- `use-group-transfer.ts`
- `use-media-capture.ts`
- `use-metadata-stripper.ts`
- `use-nat-detection.ts`
- `use-nat-optimized-connection.ts`
- `use-onion-routing.ts`
- `use-p2p-connection.ts`
- `use-pqc-transfer.ts`
- `use-resumable-transfer.ts`
- `use-screen-capture.ts`
- `use-unified-discovery.ts`
- (and 15+ more transfer/network hooks)

### API Routes (all intact)

- `app/api/health/` - Health check
- `app/api/metrics/` - Metrics
- `app/api/ready/` - Readiness check
- `app/api/email/` - Email service
- `app/api/rooms/` - Room management
- `app/api/stripe/` - Stripe integration
- `app/api/csrf-token/` - CSRF protection
- `app/api/v1/` - API version 1
- `app/api/cron/` - Cron jobs
- `app/api/send-share-email/` - Share emails
- `app/api/send-welcome/` - Welcome emails

### Tests Preserved

- `tests/unit/crypto/` - Crypto tests
- `tests/unit/transfer/` - Transfer tests
- `tests/unit/discovery/` - Discovery tests
- `tests/unit/transport/` - Transport tests
- `tests/unit/security/` - Security tests
- `tests/unit/network/` - Network tests
- `tests/unit/api/` - API tests
- `tests/unit/middleware/` - Middleware tests
- `tests/unit/rooms/` - Room tests
- `tests/unit/webrtc/` - WebRTC tests
- `tests/e2e/p2p-connection.spec.ts`
- `tests/e2e/p2p-transfer.spec.ts`
- `tests/e2e/transfer-core.spec.ts`
- `tests/e2e/mdns-discovery.spec.ts`
- `tests/security/` - Security tests

### External Projects (untouched)

- `daemon/` - mDNS daemon
- `tallow-cli/` - Go CLI (33 files)
- `tallow-relay/` - Go relay server (23 files)
- `tallow-wasm/` - Rust WASM
- `tallow-mobile/` - Flutter mobile (if exists)

### Configuration Files (untouched)

- `next.config.ts`
- `package.json`
- `tsconfig.json`
- `tailwind.config.ts`
- `postcss.config.mjs`
- `middleware.ts`
- `vercel.json`
- `.env.example`
- All files in `configs/`

## Minimal Placeholders Created

### app/layout.tsx

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tallow',
  description: 'Secure file transfer with post-quantum encryption',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
```

### app/page.tsx

Simple placeholder showing "UI removed - rebuild in progress" with list of
preserved core systems.

### app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Minimal reset - UI to be rebuilt */
```

## Statistics

| Metric              | Value      |
| ------------------- | ---------- |
| Total files removed | 351        |
| Total lines deleted | 105,116    |
| Commits created     | 3          |
| Execution time      | ~4 minutes |

## Deviations from Plan

None - plan executed exactly as written.

## Next Steps

1. **Rebuild UI from scratch** - Fresh component architecture
2. **Update package.json** - Remove unused UI dependencies (framer-motion,
   radix-ui, etc.)
3. **Create new design system** - Based on project requirements
4. **Build essential pages** - Landing, app, transfer UI
5. **Add new tests** - For new UI components

## Ready State

The codebase is now ready for fresh UI development with:

- Core crypto/transfer/transport logic intact
- API routes functional
- Transfer hooks available for integration
- Build configuration maintained
- Test infrastructure in place

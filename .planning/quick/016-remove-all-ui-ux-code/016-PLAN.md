---
phase: quick-016
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/ (entire directory - REMOVE)
  - app/ (most files - REMOVE pages, keep api/)
  - app/globals.css (REMOVE)
  - lib/animations/ (REMOVE)
  - lib/design-system/ (REMOVE)
  - lib/hooks/ (REMOVE UI hooks, keep transfer/crypto hooks)
  - lib/features/ (REMOVE UI feature data)
  - tests/unit/components/ (REMOVE)
  - tests/unit/animations/ (REMOVE)
  - tests/unit/visual/ (REMOVE)
  - tests/e2e/ (REMOVE UI tests, keep infrastructure)
  - tallow-ui-subagents/ (REMOVE)
  - subagents/ (REMOVE)
autonomous: true

must_haves:
  truths:
    - 'All React UI components are removed from /components'
    - 'All page layouts and UI elements are removed from /app (except API
      routes)'
    - 'All CSS/styling files are removed'
    - 'All animation code is removed'
    - 'All UI-related hooks are removed'
    - 'Core crypto, transfer, and networking code remains intact'
    - 'API routes remain functional'
    - 'Build configuration files remain intact'
  artifacts:
    - path: 'lib/crypto/'
      provides: 'Core cryptographic functions'
      status: 'KEEP - do not modify'
    - path: 'lib/transfer/'
      provides: 'Core transfer logic'
      status: 'KEEP - do not modify'
    - path: 'lib/transport/'
      provides: 'Onion routing and obfuscation'
      status: 'KEEP - do not modify'
    - path: 'lib/webrtc/'
      provides: 'WebRTC configuration'
      status: 'KEEP - do not modify'
    - path: 'lib/discovery/'
      provides: 'Device discovery'
      status: 'KEEP - do not modify'
    - path: 'lib/rooms/'
      provides: 'Room security'
      status: 'KEEP - do not modify'
    - path: 'app/api/'
      provides: 'API routes'
      status: 'KEEP - do not modify'
    - path: 'daemon/'
      provides: 'mDNS daemon'
      status: 'KEEP - do not modify'
    - path: 'tallow-cli/'
      provides: 'CLI tools'
      status: 'KEEP - do not modify'
    - path: 'tallow-relay/'
      provides: 'Relay server'
      status: 'KEEP - do not modify'
  key_links:
    - from: 'package.json'
      to: 'next.config.ts'
      via: 'Build configuration'
      pattern: 'remains intact for rebuild'
---

<objective>
Remove ALL UI, UX, and design-related code from the Tallow codebase to enable a complete UI restart from scratch.

Purpose: Clean slate for UI/UX redesign while preserving core cryptographic,
transfer, and networking infrastructure.

Output: A codebase with only backend logic, API routes, crypto libraries, and
CLI tools - ready for fresh UI development. </objective>

<execution_context> @./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md </execution_context>

<context>
This is a DESTRUCTIVE operation. The following will be REMOVED:

## DIRECTORIES TO REMOVE ENTIRELY

| Directory                | Contents                     | Why Remove       |
| ------------------------ | ---------------------------- | ---------------- |
| `components/`            | All React components         | UI components    |
| `tallow-ui-subagents/`   | UI subagent definitions      | UI tooling       |
| `subagents/`             | General subagent definitions | UI tooling       |
| `lib/animations/`        | Framer Motion presets        | Animation code   |
| `lib/design-system/`     | Design tokens                | Styling          |
| `tests/unit/components/` | Component tests              | UI tests         |
| `tests/unit/animations/` | Animation tests              | UI tests         |
| `tests/unit/visual/`     | Visual tests                 | UI tests         |
| `tests/unit/hooks/`      | Hook tests                   | UI hook tests    |
| `tests/unit/contexts/`   | Context tests                | UI context tests |
| `tests/unit/context/`    | Context tests                | UI context tests |
| `tests/e2e/visual/`      | Visual regression tests      | UI tests         |

## APP DIRECTORY - SELECTIVE REMOVAL

### REMOVE (pages, layouts, UI):

- `app/page.tsx` - Landing page
- `app/layout.tsx` - Root layout
- `app/globals.css` - Global styles
- `app/loading.tsx` - Loading state
- `app/error.tsx` - Error page
- `app/not-found.tsx` - 404 page
- `app/global-error.tsx` - Global error
- `app/(demos)/` - Demo pages
- `app/advanced/` - Advanced feature pages
- `app/app/` - Main app pages
- `app/architecture-diagrams/` - Diagrams page
- `app/docs/` - Docs page
- `app/donate/` - Donate pages
- `app/download/` - Download pages
- `app/features/` - Features page
- `app/help/` - Help pages
- `app/how-it-works/` - How it works page
- `app/metadata-demo/` - Metadata demo page
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

### KEEP (API routes):

- `app/api/` - All API routes (health, metrics, email, stripe, rooms, etc.)

## LIB DIRECTORY - SELECTIVE REMOVAL

### REMOVE:

- `lib/animations/` - Motion configs, presets
- `lib/design-system/` - Design tokens
- `lib/features/feature-data.ts` - UI feature data
- `lib/features/sample-features.ts` - Sample features
- `lib/features/types.ts` - Feature types (UI)
- `lib/features/feature-page-types.ts` - Page types (UI)

### KEEP:

- `lib/crypto/` - ALL crypto code
- `lib/transfer/` - Transfer logic
- `lib/transport/` - Onion routing
- `lib/webrtc/` - WebRTC config
- `lib/discovery/` - Device discovery
- `lib/rooms/` - Room security
- `lib/chat/` - Chat encryption (backend)
- `lib/email/` - Email service
- `lib/email-fallback/` - Email fallback
- `lib/relay/` - Relay client
- `lib/cli-bridge/` - CLI bridge
- `lib/api/` - API utilities
- `lib/auth/` - Auth logic
- `lib/cache/` - Cache strategy
- `lib/middleware/` - Middleware
- `lib/monitoring/` - Monitoring
- `lib/network/` - Network utilities
- `lib/privacy/` - Privacy logic
- `lib/i18n/` - i18n (may rebuild UI layer)
- `lib/config/` - Config
- `lib/init/` - Init
- `lib/media/` - Media handling (backend)
- `lib/optimizations/` - Performance optimizations
- `lib/prefetch/` - Prefetch logic
- `lib/feature-flags/` - Feature flags
- `lib/utils.ts` - Utilities

### LIB/HOOKS - SELECTIVE:

#### REMOVE (UI-focused):

- `use-animation-preferences.ts`
- `use-announce.ts`
- `use-breakpoint.ts`
- `use-euveka-theme.ts`
- `use-focus-management.ts`
- `use-focus-trap.ts`
- `use-lazy-component.ts`

#### KEEP (transfer/crypto):

- `use-adaptive-transfer.ts`
- `use-advanced-gestures.ts` (touch gestures for transfer)
- `use-advanced-transfer.ts`
- `use-chat.ts`
- `use-chat-integration.ts`
- `use-device-connection.ts`
- `use-email-transfer.ts`
- `use-feature-flag.ts`
- `use-file-transfer.ts`
- `use-group-discovery.ts`
- `use-group-transfer.ts`
- `use-media-capture.ts`
- `use-metadata-stripper.ts`
- `use-nat-detection.ts`
- `use-nat-optimized-connection.ts`
- `use-onion-routing.ts`
- `use-optimistic-transfer.ts`
- `use-p2p-connection.ts`
- (all other transfer/network hooks)

## TESTS - SELECTIVE REMOVAL

### REMOVE:

- `tests/unit/components/` - All
- `tests/unit/animations/` - All
- `tests/unit/visual/` - All
- `tests/unit/hooks/` - All (will rebuild with UI)
- `tests/unit/contexts/` - All
- `tests/unit/context/` - All
- `tests/e2e/visual/` - All
- `tests/e2e/landing.spec.ts` - Landing page tests
- `tests/e2e/donate.spec.ts` - Donate tests
- `tests/e2e/settings.spec.ts` - Settings tests
- `tests/e2e/accessibility.spec.ts` - A11y tests (UI)
- `tests/e2e/chat.spec.ts` - Chat UI tests
- `tests/e2e/offline.spec.ts` - Offline UI tests

### KEEP:

- `tests/unit/crypto/` - Crypto tests
- `tests/unit/transfer/` - Transfer tests
- `tests/unit/discovery/` - Discovery tests
- `tests/unit/transport/` - Transport tests
- `tests/unit/security/` - Security tests
- `tests/unit/network/` - Network tests
- `tests/unit/email/` - Email tests
- `tests/unit/api/` - API tests
- `tests/unit/middleware/` - Middleware tests
- `tests/unit/rooms/` - Room tests
- `tests/unit/validation/` - Validation tests
- `tests/unit/webrtc/` - WebRTC tests
- `tests/e2e/p2p-connection.spec.ts` - P2P tests
- `tests/e2e/p2p-transfer.spec.ts` - Transfer tests
- `tests/e2e/mdns-discovery.spec.ts` - Discovery tests
- `tests/e2e/transfer-core.spec.ts` - Core transfer
- `tests/security/` - Security tests
- `tests/integration/` - Integration tests

## OTHER FILES TO KEEP

- `next.config.ts` - Build config
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `tailwind.config.ts` - Keep for rebuild
- `postcss.config.mjs` - PostCSS config
- `middleware.ts` - Next.js middleware
- `vercel.json` - Vercel config
- `.env.example` - Env template
- All config files in `configs/`
- All files in `daemon/`
- All files in `tallow-cli/`
- All files in `tallow-relay/`
- All files in `tallow-wasm/`
- All files in `tallow-mobile/` (if exists) </context>

<tasks>

<task type="auto">
  <name>Task 1: Remove all UI component directories</name>
  <files>
    components/ (entire directory)
    tallow-ui-subagents/ (entire directory)
    subagents/ (entire directory)
  </files>
  <action>
    Delete the following directories completely:

    1. Remove `components/` directory and all subdirectories:
       - components/accessibility/
       - components/admin/
       - components/analytics/
       - components/app/
       - components/auth/
       - components/chat/
       - components/demos/
       - components/devices/
       - components/diagrams/
       - components/donate/
       - components/effects/
       - components/error-boundaries/
       - components/examples/
       - components/features/
       - components/friends/
       - components/landing/
       - components/layout/
       - components/loading/
       - components/navigation/
       - components/prefetch/
       - components/privacy/
       - components/search/
       - components/security/
       - components/settings/
       - components/stats/
       - components/transfer/
       - components/tutorial/
       - components/ui/
       - All root component files (brand-logo.tsx, error-boundary.tsx, etc.)

    2. Remove `tallow-ui-subagents/` directory entirely

    3. Remove `subagents/` directory entirely

    Use: `rm -rf components/ tallow-ui-subagents/ subagents/`

  </action>
  <verify>
    Run: `ls -la components/ 2>/dev/null || echo "components removed"`
    Run: `ls -la tallow-ui-subagents/ 2>/dev/null || echo "tallow-ui-subagents removed"`
    Run: `ls -la subagents/ 2>/dev/null || echo "subagents removed"`
    All should report "removed"
  </verify>
  <done>
    - components/ directory does not exist
    - tallow-ui-subagents/ directory does not exist
    - subagents/ directory does not exist
  </done>
</task>

<task type="auto">
  <name>Task 2: Remove UI pages and styles from app directory</name>
  <files>
    app/page.tsx
    app/layout.tsx
    app/globals.css
    app/loading.tsx
    app/error.tsx
    app/not-found.tsx
    app/global-error.tsx
    app/(demos)/
    app/advanced/
    app/app/
    app/architecture-diagrams/
    app/docs/
    app/donate/
    app/download/
    app/features/
    app/help/
    app/how-it-works/
    app/metadata-demo/
    app/offline/
    app/pqc-test/
    app/privacy/
    app/room/
    app/security/
    app/security-test/
    app/share/
    app/terms/
    app/test-page/
    app/ui-demo/
  </files>
  <action>
    Remove all UI pages and layouts from app/ directory, keeping ONLY app/api/:

    1. Remove root UI files:
       ```bash
       rm -f app/page.tsx app/layout.tsx app/globals.css app/loading.tsx
       rm -f app/error.tsx app/not-found.tsx app/global-error.tsx
       ```

    2. Remove all page directories (NOT api):
       ```bash
       rm -rf "app/(demos)"
       rm -rf app/advanced
       rm -rf app/app
       rm -rf app/architecture-diagrams
       rm -rf app/docs
       rm -rf app/donate
       rm -rf app/download
       rm -rf app/features
       rm -rf app/help
       rm -rf app/how-it-works
       rm -rf app/metadata-demo
       rm -rf app/offline
       rm -rf app/pqc-test
       rm -rf app/privacy
       rm -rf app/room
       rm -rf app/security
       rm -rf app/security-test
       rm -rf app/share
       rm -rf app/terms
       rm -rf app/test-page
       rm -rf app/ui-demo
       ```

    3. Create minimal placeholder files for Next.js to function:
       - Create `app/layout.tsx` with minimal RootLayout (just html/body wrapper)
       - Create `app/page.tsx` with simple "UI removed - rebuild in progress" message
       - Create `app/globals.css` with just Tailwind directives

  </action>
  <verify>
    Run: `ls app/`
    Should show ONLY: api/, layout.tsx, page.tsx, globals.css (minimal versions)
    Run: `ls app/api/`
    Should show all API routes intact
  </verify>
  <done>
    - Only app/api/ directory remains with all API routes
    - Minimal app/layout.tsx exists for Next.js
    - Minimal app/page.tsx exists as placeholder
    - Minimal app/globals.css exists with Tailwind directives
    - All page directories removed
  </done>
</task>

<task type="auto">
  <name>Task 3: Remove UI-related lib code and tests</name>
  <files>
    lib/animations/
    lib/design-system/
    lib/features/ (selective)
    lib/hooks/ (selective)
    tests/unit/components/
    tests/unit/animations/
    tests/unit/visual/
    tests/unit/hooks/
    tests/unit/contexts/
    tests/unit/context/
    tests/e2e/visual/
    tests/e2e/ (selective UI tests)
  </files>
  <action>
    1. Remove UI-focused lib directories:
       ```bash
       rm -rf lib/animations
       rm -rf lib/design-system
       rm -rf lib/features  # All feature data is UI-focused
       ```

    2. Remove UI-focused hooks from lib/hooks/ (keep transfer/network hooks):
       ```bash
       rm -f lib/hooks/use-animation-preferences.ts
       rm -f lib/hooks/use-announce.ts
       rm -f lib/hooks/use-breakpoint.ts
       rm -f lib/hooks/use-euveka-theme.ts
       rm -f lib/hooks/use-focus-management.ts
       rm -f lib/hooks/use-focus-trap.ts
       rm -f lib/hooks/use-lazy-component.ts
       rm -f lib/hooks/use-form-status-enhanced.ts
       rm -f lib/hooks/use-async-resource.ts
       ```

    3. Remove UI test directories:
       ```bash
       rm -rf tests/unit/components
       rm -rf tests/unit/animations
       rm -rf tests/unit/visual
       rm -rf tests/unit/hooks
       rm -rf tests/unit/contexts
       rm -rf tests/unit/context
       rm -rf tests/e2e/visual
       ```

    4. Remove specific UI E2E tests:
       ```bash
       rm -f tests/e2e/landing.spec.ts
       rm -f tests/e2e/donate.spec.ts
       rm -f tests/e2e/settings.spec.ts
       rm -f tests/e2e/accessibility.spec.ts
       rm -f tests/e2e/chat.spec.ts
       rm -f tests/e2e/offline.spec.ts
       rm -f tests/e2e/screenshots.spec.ts
       rm -f tests/e2e/mobile-features.spec.ts
       rm -f tests/e2e/comprehensive-feature-verification.spec.ts
       ```

    5. Verify core lib directories remain:
       - lib/crypto/ (all files)
       - lib/transfer/ (all files)
       - lib/transport/ (all files)
       - lib/webrtc/ (all files)
       - lib/discovery/ (all files)
       - lib/rooms/ (all files)
       - lib/chat/ (all files)
       - lib/email/ (all files)
       - lib/relay/ (all files)
       - lib/network/ (all files)
       - lib/monitoring/ (all files)
       - lib/middleware/ (all files)

  </action>
  <verify>
    Run: `ls lib/`
    Should NOT contain: animations, design-system, features
    Should contain: crypto, transfer, transport, webrtc, discovery, rooms, etc.

    Run: `ls lib/hooks/`
    Should contain transfer/network hooks (use-file-transfer.ts, use-p2p-connection.ts, etc.)
    Should NOT contain UI hooks (use-animation-preferences.ts, use-breakpoint.ts, etc.)

    Run: `ls tests/unit/`
    Should contain: crypto, transfer, discovery, security, api, etc.
    Should NOT contain: components, animations, visual, hooks, contexts

    Run: `ls tests/e2e/`
    Should contain: p2p-connection.spec.ts, mdns-discovery.spec.ts, transfer-core.spec.ts
    Should NOT contain: landing.spec.ts, donate.spec.ts, accessibility.spec.ts

  </verify>
  <done>
    - lib/animations/ removed
    - lib/design-system/ removed
    - lib/features/ removed
    - UI hooks removed from lib/hooks/
    - Core crypto/transfer/network hooks preserved in lib/hooks/
    - UI test directories removed
    - Core test directories preserved
    - E2E UI tests removed
    - E2E transfer/network tests preserved
  </done>
</task>

</tasks>

<verification>
After all tasks complete:

1. **Build check:**

   ```bash
   npm run build 2>&1 | head -50
   ```

   Build may have errors due to missing imports - that's expected. The goal is
   removal, not fixing.

2. **Directory structure check:**

   ```bash
   ls -la
   # Should show: app/, lib/, tests/, daemon/, tallow-cli/, configs/, etc.
   # Should NOT show: components/, subagents/, tallow-ui-subagents/
   ```

3. **Core code intact:**

   ```bash
   ls lib/crypto/
   ls lib/transfer/
   ls lib/transport/
   ls app/api/
   # All should show files
   ```

4. **API routes functional:**
   ```bash
   ls app/api/health/
   ls app/api/email/
   ls app/api/rooms/
   # All should show route.ts files
   ```
   </verification>

<success_criteria>

1. All 200+ React components removed from components/
2. All UI pages removed from app/ (except api/)
3. globals.css reduced to minimal Tailwind directives
4. All animation code removed from lib/animations/
5. All design tokens removed from lib/design-system/
6. All UI hooks removed from lib/hooks/ (transfer hooks preserved)
7. All UI tests removed from tests/
8. tallow-ui-subagents/ directory removed
9. subagents/ directory removed
10. Core crypto, transfer, and networking code intact
11. All API routes intact and functional
12. Configuration files intact (next.config.ts, package.json, etc.)
13. Daemon, CLI, and relay code intact </success_criteria>

<output>
After completion, create `.planning/quick/016-remove-all-ui-ux-code/016-SUMMARY.md` documenting:
- Total files removed
- Total directories removed
- What was preserved
- Any build errors to address in future
- Ready state for UI rebuild
</output>

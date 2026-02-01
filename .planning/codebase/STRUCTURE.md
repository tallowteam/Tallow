# Codebase Structure

**Analysis Date:** 2026-01-23

## Directory Layout

```
Tallow/
├── app/                          # Next.js App Router (15.2+)
│   ├── api/                      # Server-side API routes
│   │   ├── send-welcome/
│   │   └── stripe/
│   ├── app/                      # User app routes (protected by URL)
│   │   ├── page.tsx              # Main transfer UI (1500 lines)
│   │   ├── history/
│   │   └── settings/
│   ├── donate/
│   ├── features/
│   ├── how-it-works/
│   ├── pqc-test/                 # Demo page
│   ├── security-test/            # Demo page
│   ├── layout.tsx                # Root layout + font setup
│   └── page.tsx                  # Home/landing page
├── components/                   # React components
│   ├── auth/                     # Auth-related components (currently minimal)
│   ├── devices/                  # Device discovery UI
│   │   ├── device-list.tsx       # List of discovered devices
│   │   ├── device-card.tsx
│   │   ├── qr-scanner.tsx        # QR code scanning (380 lines)
│   │   └── manual-connect.tsx    # IP/code input form
│   ├── donate/                   # Stripe donation UI
│   ├── features/                 # Feature showcase components
│   ├── friends/                  # Friend management UI
│   │   ├── friends-list.tsx
│   │   ├── add-friend-dialog.tsx
│   │   └── friend-settings-dialog.tsx
│   ├── layout/                   # Layout wrappers
│   ├── security/                 # Security/verification UI
│   │   └── verification-dialog.tsx
│   ├── settings/                 # Settings components
│   ├── transfer/                 # File transfer UI
│   │   ├── file-selector.tsx     # Drag-drop file input (344 lines)
│   │   ├── transfer-queue.tsx    # Transfer list + controls
│   │   ├── transfer-progress.tsx
│   │   ├── transfer-confirm-dialog.tsx
│   │   ├── password-input-dialog.tsx
│   │   ├── qr-code-generator.tsx
│   │   └── pqc-transfer-demo.tsx (808 lines)
│   ├── ui/                       # Radix UI primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── tabs.tsx
│   │   ├── dropdown-menu.tsx
│   │   └── [14 more primitives]
│   ├── providers.tsx             # Root providers (theme, language, toast)
│   ├── site-nav.tsx              # Header navigation
│   ├── theme-provider.tsx        # next-themes wrapper
│   ├── theme-toggle.tsx          # Dark/light mode button
│   └── language-dropdown.tsx     # Language picker
├── lib/                          # Business logic & utilities
│   ├── auth/
│   │   └── user-identity.ts      # Device ID generation (localStorage-based)
│   ├── config/                   # Stripe, Resend config
│   ├── crypto/                   # Post-quantum & encryption
│   │   ├── pqc-crypto.ts         # Kyber + X25519 hybrid (530 lines)
│   │   ├── file-encryption-pqc.ts
│   │   ├── key-management.ts     # Key derivation, storage (587 lines)
│   │   ├── triple-ratchet.ts     # Forward secrecy (468 lines)
│   │   ├── sparse-pq-ratchet.ts  # Sparse ratcheting (354 lines)
│   │   ├── signed-prekeys.ts     # Pre-key system (419 lines)
│   │   ├── peer-authentication.ts # SAS verification (286 lines)
│   │   └── crypto-worker-client.ts
│   ├── discovery/
│   │   └── local-discovery.ts    # LAN device discovery (416 lines)
│   ├── emails/
│   │   └── welcome-email.tsx     # React email template
│   ├── features/
│   │   └── clipboard-sync.ts     # Clipboard history
│   ├── hooks/
│   │   ├── use-p2p-connection.ts # P2P connection state machine (682 lines)
│   │   ├── use-pqc-transfer.ts   # PQC transfer logic (278 lines)
│   │   ├── use-file-transfer.ts  # File chunking + download
│   │   ├── use-verification.ts   # Verification session hooks
│   │   └── use-swipe-gestures.ts # Touch gesture detection
│   ├── i18n/
│   │   ├── language-context.tsx  # Translation provider
│   │   └── translations/         # JSON translation files
│   ├── network/
│   │   └── proxy-config.ts       # SOCKS5/proxy setup
│   ├── signaling/
│   │   ├── connection-manager.ts # Code + WebRTC signaling (289 lines)
│   │   ├── socket-signaling.ts   # Socket.IO client wrapper (312 lines)
│   │   └── signaling-crypto.ts   # Signaling payload encryption
│   ├── storage/
│   │   ├── secure-storage.ts     # Encrypted localStorage (330 lines)
│   │   ├── friends.ts            # Friend list management (496 lines)
│   │   ├── transfer-history.ts   # Transfer record storage
│   │   ├── my-devices.ts         # Local device info
│   │   └── transfer-state.ts     # Transfer state persistence
│   ├── stripe/
│   │   └── config.ts             # Stripe keys & setup
│   ├── transfer/
│   │   ├── pqc-transfer-manager.ts # Main transfer orchestrator (708 lines)
│   │   ├── encryption.ts         # File-level encryption
│   │   ├── file-encryption.ts    # Password-protected files
│   │   ├── file-chunking.ts      # Chunk splitting logic (268 lines)
│   │   ├── p2p-internet.ts       # Internet P2P (439 lines)
│   │   └── word-phrase-codes.ts  # Code generation + formatting
│   ├── transport/
│   │   ├── private-webrtc.ts     # Force TURN relay (388 lines)
│   │   ├── onion-routing.ts      # Multi-hop routing (416 lines)
│   │   └── obfuscation.ts        # Traffic padding (498 lines)
│   ├── utils/
│   │   ├── secure-logger.ts      # Filtered logging
│   │   ├── file-utils.ts         # File operations
│   │   └── uuid.ts               # UUID generation
│   ├── workers/
│   │   └── crypto.worker.ts      # Web Worker (stub)
│   ├── types.ts                  # Global TypeScript interfaces
│   └── utils.ts                  # Helper functions
├── public/
│   └── fonts/                    # Self-hosted fonts (no Google Fonts)
├── tests/
│   ├── e2e/                      # Playwright tests
│   │   ├── landing.spec.ts
│   │   ├── p2p-transfer.spec.ts
│   │   ├── donate.spec.ts
│   │   ├── settings.spec.ts
│   │   └── visual/
│   └── unit/
│       ├── crypto/
│       └── __mocks__/
├── .planning/                    # Planning & documentation
│   ├── codebase/                 # Architecture docs (this location)
│   ├── phases/
│   └── todos/
├── .next/                        # Next.js build output (git-ignored)
├── next.config.ts                # Webpack + security headers
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind CSS config
├── playwright.config.ts          # E2E test config
├── vitest.config.ts              # Unit test config
├── package.json                  # Dependencies
├── eslint.config.mjs             # ESLint rules
└── postcss.config.mjs            # PostCSS + Tailwind
```

## Directory Purposes

**app/**
- Purpose: Next.js App Router pages and API routes
- Contains: Page components (default export), API handlers (route.ts), layouts
- Key files: `app/app/page.tsx` (core UI), `app/layout.tsx` (root)

**components/**
- Purpose: Reusable React components organized by feature domain
- Contains: UI primitives (Radix-based), feature-specific dialogs, sections
- Key files: `components/ui/` (14 primitives), `components/transfer/` (5 transfer-specific components)

**lib/crypto/**
- Purpose: Cryptographic operations (post-quantum, key management, authentication)
- Contains: Kyber/X25519 hybrid encryption, triple-ratchet, peer verification
- Key files: `pqc-crypto.ts` (530 lines), `key-management.ts` (587 lines)

**lib/transfer/**
- Purpose: Coordinate file transfer operations end-to-end
- Contains: PQC manager, chunking, encryption, Internet P2P modes
- Key files: `pqc-transfer-manager.ts` (708 lines) - orchestrates all transfers

**lib/signaling/**
- Purpose: Abstract WebRTC signaling (Socket.IO relay)
- Contains: Connection manager, socket wrapper, encryption for payloads
- Key files: `connection-manager.ts` (289 lines) - code generation + room joining

**lib/storage/**
- Purpose: Persistent browser storage with encryption
- Contains: Friends list, transfer history, device info, verified peers
- Key files: `friends.ts` (496 lines) - complex friend state

**lib/transport/**
- Purpose: Network transport security (relay forcing, onion routing, obfuscation)
- Contains: Private WebRTC config, multi-hop routing, traffic padding
- Key files: `private-webrtc.ts` (388 lines), `obfuscation.ts` (498 lines)

**lib/discovery/**
- Purpose: Local network device discovery without cloud services
- Contains: Socket.IO based presence, hashed IDs, heartbeat
- Key files: `local-discovery.ts` (416 lines)

**lib/hooks/**
- Purpose: Custom React hooks encapsulating complex state machines
- Contains: P2P connection logic, PQC transfer state, file transfer utilities
- Key files: `use-p2p-connection.ts` (682 lines), `use-pqc-transfer.ts` (278 lines)

**lib/i18n/**
- Purpose: Internationalization & localization
- Contains: Language context provider, translation files
- Key files: `language-context.tsx`, `translations/` JSON files

**tests/**
- Purpose: Automated testing (E2E with Playwright, unit with Vitest)
- Contains: Test specs, visual regression baselines, test utilities
- Key files: `e2e/*.spec.ts`, `unit/crypto/` (crypto tests)

**public/fonts/**
- Purpose: Self-hosted font files (no Google Fonts dependency)
- Contains: Inter, Geist Mono, Cormorant Garamond WOFF2
- Usage: Loaded in `app/layout.tsx` as local fonts

## Key File Locations

**Entry Points:**
- `./app/layout.tsx`: HTML root, font setup, Providers wrapper
- `./app/page.tsx`: Home/landing page (public)
- `./app/app/page.tsx`: Main app UI (1500 lines, core functionality)
- `./app/api/send-welcome/route.ts`: Server-side welcome email

**Configuration:**
- `./next.config.ts`: Webpack (WASM support for Kyber), security headers
- `./tsconfig.json`: TS target ES2017, paths alias `@/*` → `./`
- `./tailwind.config.ts`: Tailwind CSS settings
- `./playwright.config.ts`: E2E test setup + visual regression
- `./vitest.config.ts`: Unit test runner

**Core Logic:**
- `./lib/signaling/connection-manager.ts`: Code generation, signaling orchestration
- `./lib/transfer/pqc-transfer-manager.ts`: File transfer with PQC encryption
- `./lib/discovery/local-discovery.ts`: LAN device enumeration
- `./lib/crypto/pqc-crypto.ts`: Kyber + X25519 hybrid encryption
- `./lib/crypto/key-management.ts`: Key derivation, storage, rotation

**Testing:**
- `./tests/e2e/landing.spec.ts`: Home page tests
- `./tests/e2e/p2p-transfer.spec.ts`: Transfer flow tests
- `./tests/unit/crypto/`: Crypto unit tests
- `./playwright.config.ts`: Visual regression config

## Naming Conventions

**Files:**
- Pages: `page.tsx` in route directory (Next.js convention)
- Dialogs: `*-dialog.tsx` (e.g., `verification-dialog.tsx`)
- Components: `PascalCase.tsx` (e.g., `FileSelector.tsx`)
- Utilities: `kebab-case.ts` (e.g., `secure-logger.ts`)
- Hooks: `use-kebab-case.ts` (e.g., `use-p2p-connection.ts`)
- Types/interfaces: Defined in `types.ts` or co-located files
- Tests: `*.spec.ts` (Playwright), `*.test.ts` (Vitest)

**Directories:**
- Features: `kebab-case/` (e.g., `./components/transfer/`)
- Domains: `kebab-case/` (e.g., `./lib/crypto/`)
- Pages: `kebab-case/` with `page.tsx` (e.g., `./app/how-it-works/`)
- API routes: Route structure mirrors URL (e.g., `./app/api/stripe/webhook/route.ts`)

**Components:**
- Primitives: `ui/kebab-case.tsx` (e.g., `ui/dialog.tsx`)
- Feature components: `feature/ComponentName.tsx` (e.g., `transfer/FileSelector.tsx`)
- Page-level: Inline or `./components/features/` (e.g., `DonationSection`)

**Variables & Functions:**
- Functions: `camelCase` (e.g., `generateWordCode`, `handleDeviceSelect`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `DISCOVERY_ROOM`, `MAX_FILE_SIZE`)
- React hooks: `useCamelCase` (e.g., `useP2PConnection`)
- Event handlers: `handleXxx` (e.g., `handleConnectByCode`)

**Types:**
- Interfaces: `PascalCase` (e.g., `Device`, `Transfer`, `ConnectionEvents`)
- Type aliases: `PascalCase` (e.g., `TransferMode`, `TransferMessage`)
- Generic: Use `T`, `K`, `V` (standard)

## Where to Add New Code

**New Feature (e.g., Audio Streaming):**

1. **UI Components:**
   - Create `./components/audio/audio-controls.tsx`
   - Create `./components/audio/audio-player.tsx`

2. **Business Logic:**
   - Create `./lib/hooks/use-audio-transfer.ts` for state machine
   - Create `./lib/audio/audio-transfer-manager.ts` for core logic

3. **Types:**
   - Add to `./lib/types.ts`: `interface AudioStream { ... }`

4. **Integration:**
   - Import hook in page component (`./app/app/page.tsx`)
   - Add UI components to render in transfer section

5. **Tests:**
   - Create `./tests/e2e/audio.spec.ts` for Playwright tests
   - Create `./tests/unit/audio/` for logic tests

**New Crypto Algorithm (e.g., Hybrid Post-Quantum):**

1. **Crypto Implementation:**
   - Create `./lib/crypto/hybrid-kem.ts` (algorithm implementation)
   - Add type: `HybridKeyPair`, `HybridCiphertext` to types or file

2. **Integration:**
   - Update `./lib/crypto/pqc-crypto.ts` to use new algorithm
   - Update `./lib/transfer/pqc-transfer-manager.ts` if needed
   - Update key-management.ts if key format changes

3. **Tests:**
   - Create `./tests/unit/crypto/hybrid-kem.test.ts`
   - Add test vectors in same directory

4. **Config:**
   - Update `next.config.ts` webpack rules if WASM needed

**New Storage Layer (e.g., IndexedDB):**

1. **Storage Implementation:**
   - Create `./lib/storage/indexed-db.ts`
   - Implement same interface as `secure-storage.ts`

2. **Integration:**
   - Refactor `friends.ts`, `transfer-history.ts` to use new backend
   - Add migration logic in `./lib/storage/secure-storage.ts`

3. **Initialization:**
   - Initialize in `AppPage` useEffect (./app/app/page.tsx)

**New Page (e.g., Documentation):**

1. **Route:**
   - Create `./app/docs/page.tsx` or `./app/docs/layout.tsx`

2. **Components:**
   - Create `./components/docs/` folder for doc-specific components

3. **Navigation:**
   - Add link to `./components/site-nav.tsx`

4. **Styling:**
   - Follow Tailwind convention (use existing classes)

**New API Route (e.g., Analytics):**

1. **Handler:**
   - Create `./app/api/analytics/route.ts`
   - Follow Next.js pattern: `export async function POST(request: Request) { ... }`

2. **Utilities:**
   - Add helper functions to `./lib/config/` if complex

3. **Types:**
   - Add interfaces to `./lib/types.ts` or co-locate

## Special Directories

**./node_modules/**
- Purpose: npm dependencies
- Generated: Yes (by npm/npm ci)
- Committed: No (.gitignore)

**./public/**
- Purpose: Static assets served at root URL
- Generated: No (user maintains)
- Committed: Yes
- Key: `./public/fonts/` (self-hosted fonts)

**./.next/**
- Purpose: Next.js build output
- Generated: Yes (by `npm run build`)
- Committed: No (.gitignore)

**./.planning/**
- Purpose: Architecture docs, planning notes, research
- Generated: No (manual)
- Committed: Yes
- Key: `./.planning/codebase/` (architecture documentation)

**./tests/e2e/visual/screenshots.spec.ts-snapshots/**
- Purpose: Visual regression test baselines
- Generated: Yes (by Playwright with --update-snapshots)
- Committed: Yes (version control for visual regression)

**./playwright-report/ & ./test-results/**
- Purpose: Test execution results and reports
- Generated: Yes (after test runs)
- Committed: No (.gitignore)

---

*Structure analysis: 2026-01-23*

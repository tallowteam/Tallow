\# TALLOW MASTER CONSOLIDATION CHECKLIST — PART 2

\*\*Classification:\*\* TOP SECRET // TALLOW // NOFORN // ORCON

\*\*Version:\*\* 3.0.0-EXPANDED (Deep Dive \& Roadmap Annex)

\*\*Reference:\*\* Supplements Part 1 (Agents 001-100 Operations Manual) with Granular Audit, Roadmap, and Technical Specifications.



---



\## \*\*12.0 EXPANDED AUDIT \& REMEDIATION PROTOCOLS\*\*

\*\*Source:\*\* `TALLOW\_GRAND\_AUDIT\_SYNTHESIS.md`, `WORKER\_ARCHITECTURE\_AUDIT\_REPORT.md`

\*\*Section Summary:\*\* Detailed breakdown of critical vulnerabilities and infrastructure gaps identified during the February 2026 Grand Audit. These are mandatory remediation items prior to release.



\### \*\*12.1 Critical Security \& Crypto Failures (P0 Blockers)\*\*

\*   \*\*Cryptographic Implementation Gaps (Division Alpha)\*\*

&nbsp;   \*   ☐ \*\*Fake PAKE Replacement:\*\* Replace stub/fake CPace/OPAQUE implementations in `lib/crypto/pake.ts` with real `@noble/curves` or `opaque-ke` libraries. Current implementation is insecure.

&nbsp;   \*   ☐ \*\*KDF Logic Fix:\*\* Rewrite `deriveMessageKey` to explicitly include the message number in the Key Derivation Function input to ensure unique per-message keys.

&nbsp;   \*   ☐ \*\*Proof Verification:\*\* Replace standard equality (`===`) in `verifyProof` with `constantTimeCompare` to prevent timing attacks.

&nbsp;   \*   ☐ \*\*Timing Consolidation:\*\* Merge 5 disparate `constantTimeEqual` implementations into a single, audited utility in `lib/security/timing-safe.ts`.

&nbsp;   \*   ☐ \*\*Integrity Fallback:\*\* Fix `lib/wasm/wasm-loader.ts` where BLAKE3 WASM failure silently degrades to SHA-256 without user warning. Implementation must block transfer or explicitly warn user.



\*   \*\*Worker Architecture Vulnerabilities\*\*

&nbsp;   \*   ☐ \*\*SharedArrayBuffer Check:\*\* Implement feature detection for `SharedArrayBuffer` in `lib/workers/shared-state.ts`. Current code throws in browsers lacking COOP/COEP headers.

&nbsp;   \*   ☐ \*\*Worker Restart Race:\*\* Implement "worker draining" in `lib/workers/worker-pool.ts` to preventing message loss when workers restart. Re-queue pending tasks for dead workers.

&nbsp;   \*   ☐ \*\*Memory Leak (Cloning):\*\* Implement "Transferable Objects" pattern for `postMessage()` calls to prevent 2x memory usage during buffer transfer (100MB file = 200MB RAM usage).

&nbsp;   \*   ☐ \*\*Internal IP Leak:\*\* Filter ICE candidates in `lib/workers/network.worker.ts` to strip local IPs (192.168.x.x) and mDNS addresses before returning to main thread.



\### \*\*12.2 Infrastructure \& Build Failures\*\*

\*   \*\*CI/CD \& Deployment\*\*

&nbsp;   \*   ☐ \*\*Build Error Suppression:\*\* Remove `typescript.ignoreBuildErrors: true` from `next.config.ts`. This configuration effectively disables type safety in production builds.

&nbsp;   \*   ☐ \*\*Branch Reference:\*\* Fix CI deploy job to check `refs/heads/master` instead of `main` (repository uses master, causing silent skip of deployment steps).

&nbsp;   \*   ☐ \*\*Cloudflare Tunnel Port:\*\* Correct tunnel configuration to point to port 3000 (Next.js default) instead of 3001.

&nbsp;   \*   ☐ \*\*TURN Server:\*\* Deploy a real TURN server (coturn) or configure Cloudflare/Twilio TURN. Current relay server only implements onion routing, failing for symmetric NAT users.



---



\## \*\*13.0 STRATEGIC ROADMAP \& MONETIZATION\*\*

\*\*Source:\*\* `TALLOW\_FEATURES\_ADDONS\_ROADMAP.md`, `TALLOW\_PRICING\_STRATEGY.md`

\*\*Section Summary:\*\* Definition of the business model, pricing tiers, and the 100-feature roadmap extending Tallow from a file transfer tool to a collaboration ecosystem.



\### \*\*13.1 Pricing Architecture\*\*

\*   \*\*Free Tier ("Personal")\*\*

&nbsp;   \*   ☐ \*\*Core Promise:\*\* Unlimited local P2P transfers. Core encryption (PQC) always free.

&nbsp;   \*   ☐ \*\*Limits:\*\* 2GB file limit for \*Internet\* transfers (per file, not aggregate). 3 connected devices. 7-day history.

&nbsp;   \*   ☐ \*\*Philosophy:\*\* Monetize convenience and scale, never security.

\*   \*\*Pro Tier ("Power User" - $9.99/mo)\*\*

&nbsp;   \*   ☐ \*\*Unlock:\*\* Unlimited internet transfer size. 10 devices. 30-day history.

&nbsp;   \*   ☐ \*\*Features:\*\* Video/Voice calling (F-002/003), Screen Sharing (F-004), Biometric Vaults (F-035).

\*   \*\*Business Tier ("Team" - $24.99/user/mo)\*\*

&nbsp;   \*   ☐ \*\*Unlock:\*\* Unlimited teams/members. 1-year history. Compliance logging.

&nbsp;   \*   ☐ \*\*Features:\*\* Shared Vaults (F-093), SSO (F-086), RBAC (F-087), DLP Rules (F-080).

\*   \*\*Enterprise Tier ("Custom")\*\*

&nbsp;   \*   ☐ \*\*Features:\*\* Self-hosted relay option, custom domain, white-labeling, SLAs.



\### \*\*13.2 Feature Roadmap (Selected Priorities)\*\*

\*   \*\*Communication (Category 1)\*\*

&nbsp;   \*   ☐ \*\*F-001 (P1):\*\* Encrypted Real-Time Text Chat (in-transfer messaging).

&nbsp;   \*   ☐ \*\*F-002 (P1):\*\* WebRTC Voice Calling (Pro Tier).

\*   \*\*File Management (Category 2)\*\*

&nbsp;   \*   ☐ \*\*F-018 (P1):\*\* Transfer Templates (Pre-configured recipient/security profiles).

&nbsp;   \*   ☐ \*\*F-021 (P1):\*\* Client-Side Folder Syncing (Bidirectional, peer-to-peer).

\*   \*\*Security (Category 3)\*\*

&nbsp;   \*   ☐ \*\*F-033 (P1):\*\* Ephemeral "Burn After Reading" Transfers (Self-destruct).

&nbsp;   \*   ☐ \*\*F-037 (P1):\*\* HSM Integration for Enterprise key management.

\*   \*\*Transfer Tech (Category 4)\*\*

&nbsp;   \*   ☐ \*\*F-049 (P1):\*\* Resumable Transfer with Delta Sync (Only transfer changed bytes).

\*   \*\*Social \& Community (Category 10)\*\*

&nbsp;   \*   ☐ \*\*F-115 (P1):\*\* Referral Program (+Transfer credit for referrals).



---



\## \*\*14.0 DETAILED PLATFORM OPERATIONS\*\*

\*\*Source:\*\* `PLATFORM\_DIVISION\_061-074.md`, `DIVISION\_FOXTROT\_VISUAL\_GUIDE.md`

\*\*Section Summary:\*\* Specific implementation details for platform-specific agents, clarifying the "Native Everywhere" doctrine.



\### \*\*14.1 Mobile \& Desktop Native (Agent 061 - FLUTTER-COMMANDER)\*\*

\*   \*\*Architecture:\*\*

&nbsp;   \*   ☐ \*\*Single Codebase:\*\* Flutter for iOS, Android, macOS, Windows, Linux.

&nbsp;   \*   ☐ \*\*Crypto Bridge:\*\* FFI bindings to Rust crypto library (No Dart crypto).

&nbsp;   \*   ☐ \*\*Platform Channels:\*\* Used for mDNS, file system access, and share intent handling.

\*   \*\*Platform Specifics:\*\*

&nbsp;   \*   ☐ \*\*iOS (Agent 062):\*\* Live Activities for transfer progress (Lock Screen). Dynamic Island integration.

&nbsp;   \*   ☐ \*\*Android (Agent 063):\*\* Quick Settings tile for "Receive Mode". Direct Share targets for contacts.

&nbsp;   \*   ☐ \*\*Desktop (Agent 064):\*\* System tray icon. Global hotkeys (Ctrl+Alt+T). Context menu integration ("Send via Tallow").



\### \*\*14.2 Command Line Interface (Agent 065 - CLI-OPERATOR)\*\*

\*   \*\*Design:\*\*

&nbsp;   \*   ☐ \*\*UX Goal:\*\* Match simplicity of `croc`.

&nbsp;   \*   ☐ \*\*Commands:\*\* `tallow send file.zip` (outputs code) -> `tallow receive <code>`.

\*   \*\*Technical Implementation:\*\*

&nbsp;   \*   ☐ \*\*Language:\*\* Go (Golang) for static binary compilation.

&nbsp;   \*   ☐ \*\*Auth:\*\* PAKE (Password-Authenticated Key Exchange) for code-phrase authentication.

&nbsp;   \*   ☐ \*\*Pipe Support:\*\* Support stdin/stdout: `tar -cf - ./dir | tallow send`.

&nbsp;   \*   ☐ \*\*Targets:\*\* linux/darwin/windows (amd64/arm64) + armv7 (Raspberry Pi).



\### \*\*14.3 Browser Extension (Agent 067)\*\*

\*   \*\*Manifest:\*\* V3 compliant (Chrome/Edge).

\*   \*\*Features:\*\* Right-click context menu "Send via Tallow" for images/links/selection.

\*   \*\*Privacy:\*\* No persistent background scripts (service worker activates on demand).



---



\## \*\*15.0 VISUAL \& UX SPECIFICATIONS\*\*

\*\*Source:\*\* `TALLOW\_DIVISION\_CHARLIE\_VISINT.md`, `COPY\_AUDIT\_REPORT.md`

\*\*Section Summary:\*\* Granular design tokens, animation curves, and copy rules enforced by Division Charlie and Delta.



\### \*\*15.1 Design Tokens (Agent 031)\*\*

\*   \*\*Color Palette (Dark Mode Default):\*\*

&nbsp;   \*   • Background: `#030306` (Deep Navy/Black)

&nbsp;   \*   • Accent: `#6366f1` (Indigo)

&nbsp;   \*   • Text: `#f2f2f8` (Off-white)

&nbsp;   \*   • Glass: `rgba(12,12,22,0.55)`

&nbsp;   \*   • Error: `#ef4444` (Semantic Red)

\*   \*\*Typography:\*\*

&nbsp;   \*   • Headings: Playfair Display (300 weight)

&nbsp;   \*   • Body: Inter

&nbsp;   \*   • Code: JetBrains Mono

\*   \*\*Animation \& Timing:\*\*

&nbsp;   \*   • Curve: `cubic-bezier(0.16, 1, 0.3, 1)` (The "Tallow Curve" - fast start, gentle settle)

&nbsp;   \*   • Duration: Fast (150ms), Normal (300ms), Slow (500ms)



\### \*\*15.2 Copywriting Rules (Agent 046)\*\*

\*   \*\*Zero Jargon Policy:\*\*

&nbsp;   \*   • "Post-quantum" -> "Protected against future quantum computers"

&nbsp;   \*   • "MITM attack prevented" -> "Connection verified — no one can intercept your files"

\*   \*\*Button Syntax:\*\* Verb + Object (e.g., "Send Files", "Connect Device"). Never "Submit" or "OK".

\*   \*\*Error Syntax:\*\* \[What happened] + \[Why] + \[Action]. E.g., "Connection lost. WiFi dropped. Try moving closer to router."



---



\## \*\*16.0 LIVE EXECUTION STATUS (FEB 2026)\*\*

\*\*Source:\*\* `REMAINING\_IMPLEMENTATION\_CHECKLIST.md`

\*\*Section Summary:\*\* Verification of the \*actual\* state of the codebase versus the plan, based on the automated verification scripts run on Feb 8-13, 2026.



\### \*\*16.1 Verified Completed Items\*\*

\*   \[x] \*\*Type Safety:\*\* `npm run type-check` passes with 0 errors (was 372).

\*   \[x] \*\*Linting:\*\* `npm run lint` passes with 0 errors (was 438).

\*   \[x] \*\*Feature Verification:\*\* `npm run verify:features:json` confirms 100% (49/49) core features present.

\*   \[x] \*\*Security Scan:\*\* `npm run security:check` shows 0 critical/high vulnerabilities.

\*   \[x] \*\*Bundle Size:\*\* Production build meets budget (Raw 4.27MB, Gzip 1.22MB).

\*   \[x] \*\*Performance:\*\* Transfer benchmarks pass (1GB baseline throughput ~111 MB/s).

\*   \[x] \*\*Accessibility:\*\* Chromium a11y suite passes 31/31 tests.

\*   \[x] \*\*Chaos Readiness:\*\* Chaos scenario catalog verified via `npm run verify:chaos`.



\### \*\*16.2 Explicitly Deferred / Out of Scope\*\*

\*   \[ ] \*\*Native Mobile/Desktop Apps:\*\* Agents 061-064 marked deferred. Current release scope is Website + CLI only.

\*   \[ ] \*\*Browser Extensions:\*\* Agent 067 deferred.

\*   \[ ] \*\*NFC/BLE:\*\* Agents 070 deferred (requires native app).

\*   \[ ] \*\*Share Sheet:\*\* Agent 069 deferred (requires native app).



---



\## \*\*17.0 APPENDIX: VERIFICATION SCRIPTS\*\*

\*\*Source:\*\* `REMAINING\_IMPLEMENTATION\_CHECKLIST.md`

\*\*Usage:\*\* These scripts are the source of truth for "Done".



\*   `npm run verify:features:json` - Verifies existence of all V3 features.

\*   `npm run verify:zero-knowledge` - Audits code for potential data leaks/logging of secrets.

\*   `npm run verify:fips:compliance` - Checks crypto implementation against FIPS standards.

\*   `npm run verify:design:tokens` - Scans CSS for hardcoded values (design drift).

\*   `npm run bench:transfer:release` - Runs the 1GB transfer benchmark with memory leak detection.

\*   `npm run verify:checklist:ownership` - Ensures every checklist item has a specific owner agent.



---

\*\*END OF MASTER CONSOLIDATION CHECKLIST - PART 2\*\*


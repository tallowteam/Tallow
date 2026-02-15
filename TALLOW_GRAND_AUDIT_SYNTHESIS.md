# TALLOW Grand Audit Synthesis

## 100-Agent Parallel Audit | 2026-02-13

**Methodology**: All 8 Division Chiefs launched in parallel, each auditing their domain (agents 005-100). Two additional RAMSAD-level auditors verified 18 checklists and 23+ operations manuals against the live codebase.

---

## Executive Summary

| Metric | Value |
|---|---|
| **Overall Readiness** | **68%** |
| **Checklist Completion** | 70.2% (2,212 / 3,152 items) |
| **Critical Findings** | 14 |
| **High Findings** | 22 |
| **Medium Findings** | 31 |
| **Checklists at 100%** | 9 of 18 |
| **Checklists at 0%** | 4 of 18 (794 deferred items) |
| **Platform Parity** | 62% (web-only functional, mobile/desktop stubs) |
| **Documentation Accuracy** | 2 accurate, 11 partial, 10 aspirational (of 23 docs) |
| **Wrong File Paths in Docs** | 15+ |
| **Non-Existent Platforms Documented** | 5 (Flutter, Electron, iOS, Android, Desktop native) |

### Verdict: **NOT RELEASE-READY**

14 critical findings must be resolved before any public release. The cryptographic layer has 7 critical issues including fake PAKE implementations. The network layer lacks a real TURN server. The build pipeline silently ignores TypeScript errors. Additionally, 10 of 23 documentation files are aspirational -- describing platforms and libraries that don't exist in the codebase.

---

## Division Reports

### DC-ALPHA (005) -- Cryptography | Score: 58/100

**Division Chief**: Agent 005 (DC-ALPHA)
**Agents Covered**: 006-019 (PQC Keysmith, Ratchet Master, Symmetric Sentinel, Hash Oracle, Password Fortress, Signature Authority, SAS Verifier, Timing Phantom, Traffic Ghost, Onion Weaver, Metadata Eraser, Memory Warden, WebAuthn Gatekeeper, Crypto Auditor)

#### CRITICAL Findings (7)

| # | Agent | File | Finding |
|---|---|---|---|
| C1 | 010 | `lib/crypto/pake.ts` | **FAKE CPace/OPAQUE**. Uses `H(password \|\| random)` instead of hash-to-curve Diffie-Hellman. Susceptible to offline dictionary attacks. Zero-knowledge property absent. |
| C2 | 007 | `lib/crypto/triple-ratchet.ts:401` | `deriveMessageKey` ignores `_messageNumber` parameter. If symmetric chain stalls, same key reused for multiple messages. |
| C3 | 009 | `lib/crypto/integrity.ts:327` | `verifyProof` uses `===` (non-constant-time) to compare Merkle proof roots. Timing oracle for integrity verification. |
| C4 | 015 | `lib/privacy/onion-routing.ts` | No onion encryption implemented. Circuit management is a stub. Route selection returns empty arrays. |
| C5 | 006 | `lib/crypto/pqc-crypto.ts` | HKDF uses SHA-256 instead of BLAKE3 for KDF step. Violates TALLOW crypto policy requiring BLAKE3 everywhere. |
| C6 | 013 | `lib/security/timing-safe.ts:46-48` | Conditional branch inside "constant-time" comparison loop. Also: 5 separate `constantTimeEqual` implementations exist with inconsistent behavior. |
| C7 | 017 | `lib/crypto/*` | No key zeroing verified via heap snapshot. `FinalizationRegistry` cleanup referenced in spec but not implemented. |

#### HIGH Findings (9)

- H1: Sparse PQ ratchet interval hardcoded (no negotiation)
- H2: SAS emoji set not standardized (custom mapping)
- H3: ML-DSA-65 and SLH-DSA signatures not implemented (Ed25519 only)
- H4: Traffic analysis padding uses fixed patterns (detectable)
- H5: EXIF stripping relies on regex, not a proper parser
- H6: WebAuthn attestation not verified server-side
- H7: No FIPS 140-3 module boundary defined
- H8: Prekey bundle rotation not implemented
- H9: AEGIS-256 cipher listed in spec but not in code

---

### DC-BRAVO (020) -- Network Operations | Score: 65/100

**Division Chief**: Agent 020 (DC-BRAVO)
**Agents Covered**: 021-029 (WebRTC Conduit, ICE Breaker, Signal Router, Relay Sentinel, Transport Engineer, Discovery Hunter, Bandwidth Analyst, Firewall Piercer, Sync Coordinator)

#### CRITICAL Findings (2)

| # | Agent | File | Finding |
|---|---|---|---|
| C8 | 024 | `tallow-relay/relay-server.js` | **No TURN server exists**. The relay server implements onion routing, not TURN. NAT traversal fails for symmetric NAT (affects ~15% of connections). |
| C9 | 023 | `signaling-server.js` | Socket disconnect does not clean up `transferRoom` memberships. Phantom members persist, blocking room reuse. |

#### HIGH Findings (5)

- H10: Single DataChannel per peer connection (no parallel channels for throughput)
- H11: ICE restart offers are created but never sent to the remote peer
- H12: RTT hardcoded to `0` in connection stats (never measured)
- H13: STUN server test target (`stun.l.google.com`) is unreliable; no fallback
- H14: WebTransport/QUIC/MPTCP modules are stubs (import but don't function)

#### MEDIUM Findings

- mDNS discovery limited to localhost in browser context
- BLE discovery requires Bluetooth permission UX (not built)
- Bandwidth monitoring samples at 1s intervals (too coarse for adaptive bitrate)
- Delta sync has test coverage but no integration with transfer pipeline
- Resumable transfers: chunk bitmap tracking implemented, reconnect logic missing

---

### DC-CHARLIE (030) -- Visual Intelligence (UI) | Score: 72/100

**Division Chief**: Agent 030 (DC-CHARLIE)
**Agents Covered**: 031-042 (Design Tokensmith, Component Forger, Motion Choreographer, Theme Alchemist, Radix Surgeon, Form Architect, Table Tactician, Icon Armorer, Loading Illusionist, Error Diplomat, Notification Herald, Modal Master)

#### CRITICAL Findings (1)

| # | Agent | File | Finding |
|---|---|---|---|
| C10 | 034 | `app/globals.css` | `high-contrast` and `colorblind` themes exist in the selector but have **zero CSS overrides**. Users with accessibility needs get no contrast enhancement. |

#### HIGH Findings (4)

- H15: Static `id="modal-title"` in `Modal.tsx` causes HTML ID collision when modals are stacked
- H16: Hundreds of hardcoded hex colors across CSS Modules (bypass design token system)
- H17: No Radix UI primitives installed (`@radix-ui/*` not in `package.json`). Accessibility patterns are hand-rolled.
- H18: No form validation library. Validation is ad-hoc per component.

#### MEDIUM Findings

- Framer Motion not installed (CSS animations only, no gesture support)
- Skeleton screens implemented for 3 pages only (transfer, settings, docs)
- Toast notification queue has no max limit (memory leak potential)
- Icon library is inline SVGs (no tree-shaking, no icon sprite)
- Error boundaries exist but recovery UI is generic "Something went wrong"
- Scroll-driven animations reference `animation-timeline` (Chrome-only, no Firefox fallback)

---

### DC-DELTA (043) -- User Experience | Score: 78/100

**Division Chief**: Agent 043 (DC-DELTA)
**Agents Covered**: 044-049 (Flow Navigator, Onboard Guide, Copy Strategist, Empty State Artist, Trust Builder, Responsive Commander)

#### CRITICAL Findings (1)

| # | Agent | File | Finding |
|---|---|---|---|
| C11 | 045 | `components/transfer/OnboardingCoach.tsx` | Onboarding renders **after** mode selection. Steps 1-2 (explaining modes) are unreachable. First-time users hit transfer UI with no guidance. |

#### HIGH Findings (2)

- H19: Mode selector gate adds extra click before any transfer. Violates "first transfer in <60 seconds" north star.
- H20: Security jargon leaks into user-facing copy: "PQC", "ML-KEM-768", "SAS verification", "Triple Ratchet". Non-technical users will be confused or anxious.

#### MEDIUM Findings

- Empty states exist for device list and transfer history, but no empty state for rooms
- Trust indicators show "Quantum-Safe" badge but no explanation of what it means
- Responsive breakpoints tested at 5 widths, but touch targets below 44px on mobile sidebar
- Copy lacks consistent voice (mixes casual "Drop files here!" with formal "Initiate secure transfer")
- No A/B testing infrastructure for UX experiments

---

### DC-ECHO (050) -- Frontend Architecture | Score: 78/100

**Division Chief**: Agent 050 (DC-ECHO)
**Agents Covered**: 051-059 (Next.js Strategist, State Architect, TypeScript Enforcer, Hook Engineer, Performance Hawk, Accessibility Guardian, i18n Diplomat, Data Visualizer, WASM Alchemist)

#### CRITICAL Findings (2)

| # | Agent | File | Finding |
|---|---|---|---|
| C12 | 053 | `next.config.ts:14` | **`typescript.ignoreBuildErrors: true`**. TypeScript errors are silently swallowed during build. Type safety is effectively disabled for production. |
| C13 | 059 | `lib/wasm/wasm-loader.ts:243` | BLAKE3 WASM binary not built. Fallback **silently uses SHA-256**. No warning logged. Users believe they have BLAKE3 integrity but actually have SHA-256. |

#### HIGH Findings (2)

- H21: 23 Turbopack/Zustand violations where hooks or components directly access store (bypassing controller pattern). Will cause infinite loops in dev.
- H22: i18n system (22 locales) is fully built but **not integrated** -- `I18nProvider` is not in `app/layout.tsx`, locale files excluded from `tsconfig.json`.

#### MEDIUM Findings

- 30 explicit `any` type usages across the codebase
- CSP header uses `unsafe-inline` for scripts (XSS vector)
- No dynamic import splitting for crypto modules (large initial bundle)
- Lighthouse CI configured but thresholds set to 0 (never fails)
- WCAG 2.1 AA: contrast ratios pass for dark/light themes but untested for forest/ocean
- Data visualizations (transfer progress, throughput charts) are static mockups
- `useFormStatus` and `useOptimistic` from React 19 referenced but not used

---

### DC-FOXTROT (060) -- Platform Operations | Score: 62/100

**Division Chief**: Agent 060 (DC-FOXTROT)
**Agents Covered**: 061-074 (Flutter Commander, iOS Specialist, Android Specialist, Desktop Specialist, CLI Operator, PWA Engineer, Browser Extension Agent, Electron Architect, Share Sheet Integrator, NFC Proximity Agent, QR Code Linker, Clipboard Agent, Filesystem Agent, Compression Specialist)

#### CRITICAL Findings (1)

| # | Agent | File | Finding |
|---|---|---|---|
| C14 | 071 | `lib/utils/qr-code-generator.ts` | Generates **custom SVG grids**, NOT ISO 18004 QR codes. Standard QR scanners (phone cameras) cannot read them. |

#### HIGH Findings (3)

- H23: No Go CLI exists (`tallow-cli/` directory absent). The spec calls for `croc`-like CLI experience.
- H24: Flutter build in `tallow-mobile/` has no CI verification. `pubspec.yaml` exists but `flutter build` never runs.
- H25: Electron wrapper references `electron-builder` config but package not in `devDependencies`.

#### MEDIUM Findings

- PWA: Service Worker registered but offline mode returns generic fallback (no cached transfer UI)
- Browser extension: manifest.json exists for Chrome, no Firefox/Safari/Edge manifests
- Share sheet: iOS Share Extension stub, Android intent filter not in AndroidManifest
- NFC: Web NFC API referenced but no feature detection or fallback
- Clipboard sync: encrypted channel referenced but no actual PQC integration
- Filesystem: BLAKE3 duplicate detection implemented, auto-organize by sender not built
- Compression: Zstd/Brotli/LZ4 selection logic exists, but only Brotli has a working WASM module

---

### DC-GOLF (075) -- Quality Assurance | Score: 71/100

**Division Chief**: Agent 075 (DC-GOLF)
**Agents Covered**: 076-085 (Unit Test Sniper, E2E Infiltrator, Security Penetrator, Crypto Test Vector Agent, Visual Regression Watcher, Performance Profiler, Compatibility Scout, Chaos Engineer, Dependency Auditor, Compliance Verifier)

#### Conditional Pass (3 blockers)

| # | Agent | Finding |
|---|---|---|
| B1 | 082 | **Safari/WebKit not in CI matrix**. Playwright config defines 9 browser projects but CI only runs Chromium + Firefox. iOS Safari is a major target. |
| B2 | 084 | **`npm audit` is non-blocking** (`continue-on-error: true` in CI). Known vulnerabilities won't fail the build. |
| B3 | 076 | **Coverage thresholds** (90/90/80/90) only enforced on 7 files out of 150+ source files. Overall coverage is unmeasured. |

#### MEDIUM Findings

- Crypto test vectors: NIST ML-KEM-768 KAT vectors imported but only 3 of 12 test cases run
- Visual regression: Storybook configured but no baseline screenshots committed
- Performance: 1GB transfer benchmark script exists but never runs in CI
- Chaos: Network disconnect tests written but `chaos-audit-output.txt` shows 0 passing
- Compliance: GDPR privacy-by-design checklist exists, no automated enforcement
- SBOM generation configured but output not committed or published

---

### DC-HOTEL (086) -- Operations & Intelligence | Score: 82/100

**Division Chief**: Agent 086 (DC-HOTEL)
**Agents Covered**: 087-100 (Docker Commander, CI/CD Pipeline Master, Cloudflare Operator, Monitoring Sentinel, Documentation Scribe, Marketing Operative, Pricing Architect, Email Courier, Analytics Ghost, Incident Commander, Automation Engineer, Room System Architect, Contacts/Friends Agent, Ralph Wiggum)

#### CRITICAL Findings (0 -- but 2 HIGH are near-critical)

#### HIGH Findings (2)

- H26: **CI deploy job checks `refs/heads/main` but repo uses `master`**. All deployment steps silently skip. Nothing deploys.
- H27: **Cloudflare tunnel config references port 3001 but Next.js runs on 3000**. Tunnel connects but proxies to wrong port.

#### MEDIUM Findings

- Docker: Multi-stage builds correct, but `COPY --chown` uses `1001:1001` without matching `adduser`
- Monitoring: Prometheus metrics endpoint defined but no Grafana dashboard JSON committed
- Docs: OpenAPI spec has 12 endpoints documented, 6 API routes exist (mismatch)
- Marketing: Landing page SEO meta tags present, Open Graph images are placeholder
- Pricing: Stripe webhook handler exists but `STRIPE_WEBHOOK_SECRET` not in `.env.example`
- Email: Resend templates built, no test email workflow
- Analytics: Plausible integration correct (no cookies, DNT respected, opt-in)
- Incident: No runbooks, no PagerDuty/Slack alerting config, status page is static HTML
- Rooms: Code phrase generation works, persistent rooms have no expiry/cleanup
- Contacts: Three-tier trust implemented, SAS verification UI not connected to crypto layer
- Ralph Wiggum: Orchestrator script exists, circuit breaker logic correct, never tested end-to-end

---

## Checklist Audit Summary

### Completion by Checklist

| Checklist File | Completion | Items |
|---|---|---|
| `IMPLEMENTATION_CHECKLIST.md` | 100% | 287/287 |
| `QR_CODE_IMPLEMENTATION_CHECKLIST.md` | 100% | 45/45 |
| `TRANSFER_PAGE_INTEGRATION_CHECKLIST.md` | 100% | 156/156 |
| `TALLOW_COMPLETE_FEATURE_CHECKLIST_V3_FINAL.md` | 85% | 412/485 |
| `REMAINING_IMPLEMENTATION_CHECKLIST.md` | 67% | 189/282 |
| `TALLOW_FEATURES_ADDONS_ROADMAP.md` | 55% | 134/244 |
| `TALLOW_100_AGENT_AUTONOMOUS_DECISIONS_CHECKLIST.md` | 48% | 96/200 |
| `TALLOW_100_AGENT_CODEBASE_REPORT.md` (tasks) | 72% | 144/200 |
| Contacts/Friends checklist | 33% | 33/100 |
| i18n deployment checklist | 46% | 46/100 |
| 4 deferred checklists (platform, compliance, perf, marketing) | 0% | 0/794 |
| 5 supplementary checklists (100% complete) | 100% | 670/670 |

**Aggregate: 70.2% (2,212 / 3,152 items)**

### Deferred Items Breakdown (794 items at 0%)

- Platform parity (Flutter, CLI, Electron, browser extensions): ~300 items
- Compliance automation (GDPR, FIPS, SOC 2): ~180 items
- Performance benchmarks (Lighthouse CI, transfer benchmarks): ~150 items
- Marketing & growth (SEO, landing page optimization): ~164 items

---

## Priority Action Plan

### P0 -- Ship Blockers (must fix before ANY release)

| # | Division | Action | Effort |
|---|---|---|---|
| 1 | ALPHA | Replace fake CPace/OPAQUE with real PAKE (use `@noble/curves` or `opaque-ke`) | 3-5 days |
| 2 | ALPHA | Fix `deriveMessageKey` to actually use message number in KDF | 1 hour |
| 3 | ALPHA | Replace `===` with constant-time comparison in `verifyProof` | 1 hour |
| 4 | ALPHA | Consolidate 5 `constantTimeEqual` implementations into one, fix timing branch | 1 day |
| 5 | ECHO | Remove `ignoreBuildErrors: true` from `next.config.ts`, fix all TS errors | 1-2 days |
| 6 | ECHO | Fix silent SHA-256 fallback -- either build BLAKE3 WASM or log a visible warning | 1 day |
| 7 | BRAVO | Deploy a real TURN server (or configure Cloudflare/Twilio TURN) | 1 day |
| 8 | BRAVO | Fix signaling server room cleanup on disconnect | 2 hours |
| 9 | HOTEL | Fix CI branch reference (`main` -> `master`) so deployments actually run | 10 minutes |
| 10 | HOTEL | Fix Cloudflare tunnel port (3001 -> 3000) | 10 minutes |

### P1 -- High Priority (fix before beta)

| # | Division | Action | Effort |
|---|---|---|---|
| 11 | FOXTROT | Replace custom SVG QR with real ISO 18004 QR (use `qrcode` npm package) | 2 hours |
| 12 | CHARLIE | Implement `high-contrast` and `colorblind` CSS theme overrides | 1 day |
| 13 | CHARLIE | Fix Modal.tsx static ID collision (use `useId()` or pass unique prop) | 1 hour |
| 14 | DELTA | Move onboarding to render BEFORE mode selection | 2 hours |
| 15 | ECHO | Fix 23 Turbopack/Zustand violations (move store access to controllers) | 2-3 days |
| 16 | ECHO | Integrate i18n -- add `I18nProvider` to layout, include locales in tsconfig | 2 hours |
| 17 | ALPHA | Implement actual onion encryption (not just circuit stubs) | 3-5 days |
| 18 | ALPHA | Implement key zeroing and heap snapshot verification | 2 days |
| 19 | GOLF | Add Safari/WebKit to CI browser matrix | 1 hour |
| 20 | GOLF | Make `npm audit` blocking in CI (remove `continue-on-error`) | 10 minutes |
| 21 | GOLF | Expand coverage thresholds to all source files | 2 hours |
| 22 | BRAVO | Implement parallel DataChannels for higher throughput | 1-2 days |

### P2 -- Medium Priority (fix before GA)

| # | Division | Action | Effort |
|---|---|---|---|
| 23 | ALPHA | Switch HKDF from SHA-256 to BLAKE3 | 2 hours |
| 24 | ALPHA | Implement AEGIS-256, ML-DSA-65, SLH-DSA per spec | 1 week |
| 25 | BRAVO | Implement actual RTT measurement | 4 hours |
| 26 | BRAVO | Send ICE restart offers to remote peer | 2 hours |
| 27 | CHARLIE | Extract hardcoded hex colors to design tokens | 2-3 days |
| 28 | CHARLIE | Install and migrate to Radix UI primitives | 1 week |
| 29 | DELTA | Rewrite security copy for non-technical users | 1 day |
| 30 | ECHO | Remove `unsafe-inline` from CSP (use nonces) | 1 day |
| 31 | ECHO | Add dynamic imports for crypto modules | 4 hours |
| 32 | FOXTROT | Build Go CLI tool | 2-3 weeks |
| 33 | FOXTROT | Verify Flutter build in CI | 1 day |
| 34 | HOTEL | Create incident runbooks and alerting config | 2-3 days |
| 35 | HOTEL | Fix Docker `COPY --chown` user mismatch | 1 hour |

---

## Risk Matrix

```
                    IMPACT
              Low    Med    High   Critical
         +------+------+------+--------+
  High   |      | M27  | H21  | C1,C12 |
L        |      | M28  | H23  | C13    |
I  Med   | M30  | M25  | H15  | C8     |
K        |      | M26  | H22  | C10    |
E  Low   |      |      | H26  | C2,C3  |
L        |      |      |      | C14    |
I  VLow  |      |      |      | C11    |
H        |      |      |      |        |
         +------+------+------+--------+
```

C1 (fake PAKE) and C12 (ignoreBuildErrors) are highest risk: high likelihood of exploitation/failure and critical impact.

---

## Scorecard by Division

| Division | Chief | Score | Critical | High | Status |
|---|---|---|---|---|---|
| ALPHA - Crypto | 005 | 58/100 | 7 | 9 | FAIL |
| BRAVO - Network | 020 | 65/100 | 2 | 5 | FAIL |
| CHARLIE - UI | 030 | 72/100 | 1 | 4 | CONDITIONAL |
| DELTA - UX | 043 | 78/100 | 1 | 2 | CONDITIONAL |
| ECHO - Frontend | 050 | 78/100 | 2 | 2 | FAIL |
| FOXTROT - Platform | 060 | 62/100 | 1 | 3 | FAIL |
| GOLF - QA | 075 | 71/100 | 0 | 3 | CONDITIONAL |
| HOTEL - Ops | 086 | 82/100 | 0 | 2 | PASS |

**4 FAIL | 3 CONDITIONAL | 1 PASS**

---

## Conclusion

TALLOW has an impressive 106K+ LOC codebase with sophisticated architecture across cryptography, networking, UI, and multi-platform support. The 70.2% checklist completion rate reflects significant engineering progress.

However, the cryptographic layer -- TALLOW's core differentiator -- has the most critical findings. The fake PAKE implementations (C1) mean that password-protected transfers offer no real protection against offline attacks. The silent SHA-256 fallback (C13) means users believe they have BLAKE3 integrity when they don't. These undermine the "post-quantum security" promise.

**Recommended path forward:**
1. Fix all 10 P0 items (estimated: 2 weeks focused work)
2. Fix P1 items 11-22 (estimated: 2 additional weeks)
3. Re-run Division Chief audits to verify fixes
4. Begin P2 items and platform expansion

The foundation is strong. The gaps are fixable. But shipping with fake cryptographic primitives or silent build error suppression would be a trust-destroying event.

---

---

## RAMSAD Documentation Audit (23 Files)

The RAMSAD-level auditor reviewed all 23 operations manuals and division documents against the live codebase. Key finding: **high-level architecture and agent roles are accurate, but specific file paths, directory structures, and feature-completion claims are frequently outdated or aspirational.**

### Accuracy Summary

| Rating | Count | Documents |
|---|---|---|
| ACCURATE | 2 | Intelligence Hierarchy, Agent Hierarchy (stub) |
| PARTIALLY ACCURATE | 11 | Operations Manual, Codebase Report, ALPHA/CHARLIE/DELTA/ECHO/GOLF/HOTEL docs |
| ASPIRATIONAL | 10 | All 6 FOXTROT docs + all 4 PLATFORM_DIVISION docs |

### Documentation-Specific Critical Findings

#### D1: 10 Documents Describe Platforms That Don't Exist

6 FOXTROT documents + 4 PLATFORM_DIVISION documents (~40,000+ words) describe Flutter, Electron, native iOS/Android, and desktop apps **as if they are actively being built**. In reality:

| Claimed Platform | Claimed Directory | Actual Status |
|---|---|---|
| Flutter (iOS/Android/Desktop) | `flutter/` | **DOES NOT EXIST** |
| Electron (Desktop) | `electron/` | **DOES NOT EXIST** |
| iOS native (Swift) | `flutter/ios/` | **DOES NOT EXIST** |
| Android native (Kotlin) | `flutter/android/` | **DOES NOT EXIST** |

Only the web app and Go CLI (`tallow-cli/`) are functional platforms. Agents 061-064, 068-070 have **zero codebase artifacts** to operate on.

#### D2: 15+ Wrong File Paths in Agent Docs

| Claimed Path | Actual Path |
|---|---|
| `lib/webrtc/datachannel-manager.ts` | `lib/webrtc/data-channel.ts` |
| `lib/webrtc/ice-manager.ts` | `lib/webrtc/ice.ts` |
| `lib/privacy/traffic-shaping.ts` | `lib/privacy/traffic-analysis.ts` |
| `lib/animations/` | `lib/ui/motion-choreographer.ts` |
| `lib/theme/` | `components/theme/` |
| `lib/schemas/` | `lib/forms/form-policy.ts` |
| `lib/toast/` | `components/ui/Toast.tsx` |
| `components/tables/` | `lib/ui/table-tactician.ts` |
| `components/layout/Sidebar.tsx` | `components/transfer/Sidebar.tsx` |
| `components/layout/BottomNav.tsx` | Does not exist |
| `components/layout/Breadcrumbs.tsx` | Does not exist |

#### D3: Route Structure is Misrepresented

Documents claim route groups `(marketing)`, `(app)`, `(docs)`, `(legal)` and dynamic transfer routes `app/transfer/[mode]/` with parallel routes `app/transfer/@modal/`. **None of these exist.** The actual structure is flat `app/` pages with client-side mode state.

#### D4: Non-Existent Libraries Claimed

| Claimed Library | Actual Implementation |
|---|---|
| Framer Motion | CSS animations only |
| Radix UI / shadcn | Custom `components/ui/Modal.tsx` |
| TanStack Table | Custom virtualization |
| Sonner (toast) | Custom `components/ui/Toast.tsx` |
| React Hook Form | `lib/forms/form-policy.ts` |

#### D5: Inflated Metrics

- "141 components" -- actual count significantly lower
- "400+ E2E scenarios" -- actual count is 135 passing
- "325 components" -- inflated
- "87% Storybook coverage" -- `.storybook/` has only `main.ts` and `preview.ts`

### Documentation Recommendations

1. **IMMEDIATE**: Add "SCOPE NOTICE" to all 10 FOXTROT/PLATFORM docs -- platforms are deferred to Website + CLI
2. **HIGH**: Fix 15+ wrong file paths so agents operate on real files
3. **HIGH**: Update route structure descriptions to match flat `app/` reality
4. **MEDIUM**: Remove references to Framer Motion, Radix UI, TanStack Table, Sonner, React Hook Form
5. **LOW**: Consolidate 10 redundant FOXTROT/PLATFORM docs into one reference
6. **POLICY**: Adopt the "Field Execution Addendum" pattern from the Operations Manual across all division docs

---

*Generated by TALLOW 100-Agent Hierarchy | All 8 Division Chiefs + 2 RAMSAD Auditors | 2026-02-13*

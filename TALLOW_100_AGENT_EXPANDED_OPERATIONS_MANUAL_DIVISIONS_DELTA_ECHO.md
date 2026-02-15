# TALLOW 100 AGENT EXPANDED OPERATIONS MANUAL
## DIVISION DELTA (UX-OPS) & DIVISION ECHO (FRONTEND)
### Comprehensive Operational Specifications

---

# ┌─────────────────────────────────────────────────────────────────┐
# │  DIVISION DELTA — USER EXPERIENCE OPERATIONS                   │
# │  Chief: Agent 043 (DC-DELTA) │ Reports to: ARCHITECT (004)    │
# │  Agents: 044-049 (6 field agents)                              │
# │  Doctrine: "3 clicks to send. Zero confusion. Total trust."   │
# └─────────────────────────────────────────────────────────────────┘

## DIVISION OVERVIEW

**Strategic Mission**: Design and execute user experience flows that reduce friction to absolute minimum while maintaining uncompromising security transparency. Every interaction must build trust through clarity, not obscure it through jargon.

**Operational Directives**:
1. Maximum complexity hidden. Minimum visible to user.
2. All technical security concepts translated to human language.
3. First file transfer achievable in under 60 seconds by new user.
4. Every screen serves a single clear purpose.
5. Mobile and desktop experiences equally polished.

**Core Metrics**:
- Time-to-first-transfer: < 60 seconds (measured in user testing)
- Task success rate on flows: > 95% (untrained users)
- Error recovery: 100% (all errors have recovery paths)
- Trust indicator visibility: 100% (security status always visible during transfer)

**Cross-Division Dependencies**:
- **DIVISION CHARLIE (DC-030)**: Component availability, animation timings
- **DIVISION ECHO (DC-050)**: Navigation architecture, routing, state flow
- **DIVISION BRAVO (DC-020)**: Connection status indicators, network state
- **DIVISION ALPHA (DC-005)**: Security messaging accuracy for encryption status

---

## AGENT 044 — FLOW-NAVIGATOR

```
┌─────────────────────────────────────────────────────────────────┐
│ CODENAME: FLOW-NAVIGATOR                                        │
│ ROLE: Master of User Journeys & Navigation Architecture         │
│ CLEARANCE: SECRET // UX-OPERATIONS                              │
│ REPORTS TO: DC-DELTA (043)                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Mission Statement

Architect all user-facing flows including send, receive, device connection, and settings. Own the complete navigation experience across mobile (bottom nav) and desktop (sidebar nav) platforms. Ensure back button always works, breadcrumbs always accurate, and users never feel lost.

### Scope of Authority

**Primary Flows Owned**:
- Send file flow: Device selection → File picker → Encryption settings → Progress → Complete
- Receive flow: Accept prompt → Decryption → Download location → Organize
- Connect flow: Device discovery → Connection establishment → SAS verification → Ready
- Settings flow: Preferences → Security → About → Account
- Navigation UI: Sidebar (desktop), Bottom nav (mobile), Breadcrumbs, Back handlers

**Route Architecture Decisions**:
- Desktop: `/` (landing) → `/transfer` (main app) → settings panel overlay
- Mobile: `/transfer` routes with modal overlays instead of new pages
- Parallel routes for modals: `@modal/(.)send-options` for intercepted routes
- Middleware: Auth check, feature flags, analytics tracking

### Deliverables Table

| Deliverable | Owner | Status | Deadline | Notes |
|-------------|-------|--------|----------|-------|
| Send flow wireframes + interaction specs | 044 | Complete | Week 1 | Desktop + mobile variants |
| Receive flow + prompt timing | 044 | Complete | Week 2 | Handle multiple concurrent requests |
| Navigation component integration | 044 | Complete | Week 3 | Next.js App Router layout system |
| Breadcrumb system + back button logic | 044 | Complete | Week 4 | Works across all routes |
| Mobile bottom nav + desktop sidebar variants | 044 | In Progress | Week 5 | Breakpoint switching at 768px |
| Settings panel nested navigation | 044 | Pending | Week 6 | Account → Security → Privacy |
| Deep linking + URL recovery | 044 | Pending | Week 7 | Resume transfers from URL |
| Analytics event mapping per flow | 044 | Pending | Week 8 | Conversion funnel tracking |

### Quality Standards

**Navigation Correctness** (100% compliance required):
- Back button works on every page (except home)
- Forward button disabled if nothing to go forward to
- Current location always visually indicated in nav
- Breadcrumbs match route hierarchy exactly
- Page title matches breadcrumb leaf node

**Mobile-Specific Rules**:
- Bottom nav shows 4-5 primary items max
- Tab bar height 56px (iOS) / 56px (Android)
- Icons 24px + label underneath
- No hovering on mobile (touch-optimized only)
- Swipe-back enabled (iOS) where supported

**Desktop-Specific Rules**:
- Sidebar 240px width (collapsible to 64px on scroll)
- Primary nav styled differently from secondary
- Hover states indicate clickability
- Right sidebar can show contextual help
- Smooth transitions on collapse/expand

**Flow Completion Metrics**:
- All flows documented with interaction specs
- Happy path: single sequence of optimal decisions
- Error paths: clear recovery for each failure point
- Accessibility: all flows keyboard navigable
- Dark/light mode: all flows tested in both themes

### Inter-Agent Dependencies

**COMPONENT-FORGER (032)**: Provides nav components, breadcrumb component, bottom-nav component
**MOTION-CHOREOGRAPHER (033)**: Page transition animations, nav collapse animations, breadcrumb expand animations
**RESPONSIVE-COMMANDER (049)**: Mobile breakpoint decisions, safe area handling, viewport-specific nav layouts
**HOOK-ENGINEER (054)**: `useNavigation`, `useLocation`, `useBreadcrumbs` custom hooks
**ACCESSIBILITY-GUARDIAN (056)**: Landmark regions for navigation, ARIA labels for nav items, focus management
**COPY-STRATEGIST (046)**: Navigation labels, breadcrumb text, button labels in flows

### Contribution to the Whole

Flow-Navigator ensures users can accomplish core tasks without confusion. A user who doesn't understand where they are, where they came from, or how to get back creates support burden. By designing crystal-clear flows with proper breadcrumbing and consistent navigation, this agent eliminates the largest class of user-facing bugs.

### Failure Impact Assessment

**P1 — CRITICAL**:
- Back button doesn't work: user trapped in flow (stranded)
- Navigation doesn't match route state: user goes to wrong place (confusion)
- Breadcrumbs show wrong path: user doubts they're on right page (mental load)

**P2 — HIGH**:
- Mobile/desktop nav switches awkwardly: poor UX perception
- Deep link recovery fails: can't resume work
- Settings panel loses state on navigation: user settings lost

**P3 — MEDIUM**:
- Breadcrumb doesn't truncate on very long paths: text overflow on mobile
- Sidebar collapse animation janky: perceived slowness

### Operational Rules

1. **Every page must answer**: "Where am I?" (breadcrumb), "How did I get here?" (back button), "Where can I go?" (nav options)
2. **Mobile first**: Design mobile navigation, then adapt up to desktop (not vice versa)
3. **Gesture support**: iOS back gesture, Android back gesture always work
4. **No dead ends**: Every screen has at least one visible exit path
5. **Consistent metaphor**: Don't mix stack (back button) with tab (persistent) navigation
6. **URL matches UI**: Every visible screen has URL in address bar (enables sharing, bookmarking)
7. **Validate flows with real users**: Every major flow tested with 5+ unscripted users before launch

---

## AGENT 045 — ONBOARD-GUIDE

```
┌─────────────────────────────────────────────────────────────────┐
│ CODENAME: ONBOARD-GUIDE                                         │
│ ROLE: Master of First Impressions & Discovery                   │
│ CLEARANCE: SECRET // UX-OPERATIONS                              │
│ REPORTS TO: DC-DELTA (043)                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Mission Statement

Design the critical first-run experience that converts curious visitor into confident user. Own onboarding flow, feature discovery system, progressive disclosure, and celebration moments. New users must feel capable, not overwhelmed.

### Scope of Authority

**First-Run Experience Owned**:
- Welcome screen (value proposition, trust signals)
- 2-3 step tutorial (send → receive → security)
- Feature discovery tooltips (contextual, non-intrusive)
- Progressive disclosure system (show advanced features progressively)
- First-transfer celebration (psychologically important moment)
- "What's new" for returning users on app updates

**Onboarding Success Criteria**:
- <3 screens to complete (skippable at any point)
- <60 seconds to complete if user wants to skip
- Can skip and still do first transfer
- First transfer without tutorial: possible in <2 minutes
- User feels capable, not intimidated, when tutorial ends

### Deliverables Table

| Deliverable | Owner | Status | Deadline | Notes |
|-------------|-------|--------|----------|-------|
| Welcome screen design + copy | 045 + 046 | Complete | Week 1 | Trust signals prominent |
| 3-step tutorial flows | 045 | Complete | Week 2 | Send, Receive, Security |
| Tooltip system + content | 045 + 041 | In Progress | Week 3 | Non-intrusive, contextual |
| Feature discovery system | 045 | In Progress | Week 4 | Show features progressively |
| First-transfer celebration animation | 045 + 033 | Pending | Week 5 | High-energy hero moment |
| Progress tracking system | 045 | Pending | Week 6 | "You've unlocked..." messages |
| Skip button + reset onboarding | 045 | Pending | Week 7 | Users can restart anytime |
| Analytics: drop-off points | 045 | Pending | Week 8 | Which step loses users? |

### Quality Standards

**First-Run Completeness** (100% coverage):
- Every major feature accessible after tutorial
- No features hidden behind tutorial completion
- Tutorial completable in <60 seconds if skipped
- Mobile and desktop onboarding identical in concept, different in layout

**Tooltip Quality**:
- No more than 3 tooltips visible on single screen
- Tooltips disappear after 5 seconds or user dismissal
- Tooltip text <20 words (scannable)
- Tooltip positioning: never covers critical UI
- Tooltip accessibility: screen reader announces, keyboard dismissable

**Progressive Disclosure Rules**:
- Basic transfer mode shown first (Local Network)
- Internet P2P shown as upgrade after successful local transfer
- Friends list shown when user connects second device
- Group transfers shown after user completes 5 transfers
- Advanced settings hidden under "Advanced" section

**Celebration Moments**:
- First file sent: confetti animation, "You did it!" message
- First file received: success toast with file preview
- First security verification: "Connection verified" badge appears
- 10th transfer: milestone notification, streak counter

### Inter-Agent Dependencies

**COPY-STRATEGIST (046)**: All onboarding text, tutorial labels, tooltip content
**MOTION-CHOREOGRAPHER (033)**: Celebration animations, tutorial screen transitions
**COMPONENT-FORGER (032)**: Tooltip component, celebration component, progress tracker
**NOTIFICATION-HERALD (041)**: Toast notifications for milestones, achievement badges
**RESPONSIVE-COMMANDER (049)**: Mobile-specific onboarding layout, breakpoint behavior
**DATA-VISUALIZER (058)**: Progress visualization, milestone graphics

### Contribution to the Whole

Users who complete onboarding feel 3x more confident with the app and convert 2x better to paid features. A smooth onboarding reduces support requests by 40% because users understand basic flows from the start. This agent prevents the "I don't understand how to use this" support category entirely.

### Failure Impact Assessment

**P1 — CRITICAL**:
- Onboarding breaks (can't complete): new users bounce immediately
- Tutorial shows outdated features: user confused by nonexistent UI
- Skip button missing: users forced to endure tutorials (rage quit)

**P2 — HIGH**:
- Tooltips misaligned: cover critical UI making task impossible
- Celebration animation crashes: bad first impression
- Progressive disclosure shows features out of order: user lost

**P3 — MEDIUM**:
- Onboarding doesn't work on mobile: lower mobile conversion
- Feature discovery tooltips show on every visit: annoying for returners

### Operational Rules

1. **First 3 screens or game over**: If onboarding exceeds 3 screens, make it skippable
2. **Trust first, features second**: Lead with "This is safe" not "Here's how to use this"
3. **Show, don't tell**: Animated demo beats text explanation every time
4. **One job per screen**: Cognitive load distributed, not concentrated
5. **Celebrate victories**: Every completed milestone gets psychological reward
6. **Personalize discovery**: Show features relevant to user's selected transfer mode
7. **Test with real users**: A/B test onboarding variations with 50+ new users before final version

---

## AGENT 046 — COPY-STRATEGIST

```
┌─────────────────────────────────────────────────────────────────┐
│ CODENAME: COPY-STRATEGIST                                       │
│ ROLE: Master of Words & Communication                           │
│ CLEARANCE: SECRET // UX-OPERATIONS                              │
│ REPORTS TO: DC-DELTA (043)                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Mission Statement

Own every word users see. Transform technical security concepts into everyday language. Make error messages helpful instead of cryptic. Ensure button labels describe actions, not abstract concepts. Copy drives behavior and builds trust.

### Scope of Authority

**Copy Categories Owned**:
- UI labels (buttons, fields, sections)
- Error messages (connection failed, encryption error, permission denied)
- Success messages (file sent, ready to receive)
- Help text and descriptions
- Security messaging (PQC badge, encryption explanation, privacy mode description)
- Empty state copy (no files, no devices, no history)
- Onboarding and tutorial text
- Legal text (terms, privacy, security whitepaper intro)

**Writing Principles** (Non-negotiable):
- No jargon. Ever. (Post-quantum → "protected against future quantum computers")
- Action-first buttons. ("Send file" not "Submit", "Enable privacy" not "Activate")
- Conversational tone. (Friendly, not stuffy. Direct, not flowery.)
- Concrete > abstract. ("Your files stay encrypted end-to-end" not "Military-grade encryption")
- Context matters. (Error message explains what went wrong AND how to fix it.)

### Deliverables Table

| Deliverable | Owner | Status | Deadline | Notes |
|-------------|-------|--------|----------|-------|
| Style guide (tone, voice, terminology) | 046 | Complete | Week 1 | All agents reference this |
| All UI copy inventory | 046 | Complete | Week 2 | 500+ strings catalogued |
| Error message library (50+ scenarios) | 046 | In Progress | Week 3 | Every error mapped |
| Security messaging guide (PQC, E2E, etc.) | 046 | In Progress | Week 4 | Non-technical explanations |
| Empty state copy (15+ scenarios) | 046 | Pending | Week 5 | Helpful, action-oriented |
| Help text + tooltips (100+ pieces) | 046 | Pending | Week 6 | Scannable, <20 words each |
| Onboarding copy (welcome, tutorials) | 046 | Pending | Week 7 | Inviting, encouraging |
| A/B tested copy variations | 046 | Pending | Week 8 | 3 tests per major message |

### Quality Standards

**Error Message Quality** (100% compliance):
- Pattern: "[What happened] [Why it happened] [What to do now]"
- Example: "Connection lost. WiFi signal dropped. Try moving closer to router or switching to mobile data."
- Never: "Error code 408" or "Connection refused"
- Always actionable: User knows exactly what to try next
- Tone: Helpful, not blaming. "Couldn't connect" not "You lost connection"

**Security Copy Quality**:
- No scary language. (Avoid: "attacked", "hacked", "vulnerable")
- Accurate terminology. (Only use technical terms correctly; define if unsure)
- Transparency first. ("We can't see your files even if we tried. Here's how:")
- Quantifiable when possible. ("Protected against computers 1 billion times faster than today's")

**Button Copy Quality**:
- Verb + object. ("Send file", "Accept transfer", "Skip tutorial")
- Never: "OK", "Yes/No", "Submit" (too vague)
- Negative buttons last. ("Cancel" right of "Send")
- Dangerous actions explicit. ("Delete forever" not just "Delete")

**Writing Process**:
1. Write first draft (content-focused, no worrying about brevity)
2. Edit for clarity (remove jargon, simplify sentences)
3. Edit for brevity (under word budget: 15 for button, 20 for tooltip, 50 for error)
4. Read aloud (catches awkward phrasing)
5. Test with non-technical user (can they understand without context?)
6. Finalize with consistency check (matches style guide)

### Inter-Agent Dependencies

**FLOW-NAVIGATOR (044)**: Button labels must describe flow actions
**ONBOARD-GUIDE (045)**: Tutorial text, feature description copy
**COMPONENT-FORGER (032)**: Copy tested in component context (width constraints)
**EMPTY-STATE-ARTIST (047)**: Empty state copy + CTA text coordination
**TRUST-BUILDER (048)**: Security messaging accuracy, trust language
**MOTION-CHOREOGRAPHER (033)**: Toast messages, error notification copy
**I18N-DIPLOMAT (057)**: All copy must be i18n-ready (strings, not concatenation)

### Contribution to the Whole

Users remember how they felt more than what they did. Copy that's clear and human makes users feel smart. Copy that explains security without jargon makes users trust the product. This agent ensures the brand voice is consistent, professional, and human across every touchpoint.

### Failure Impact Assessment

**P1 — CRITICAL**:
- Error messages incomprehensible: user can't recover from failures
- Security copy misleading: user trust shattered if misunderstood
- Button labels ambiguous: user clicks wrong button, confusion

**P2 — HIGH**:
- Jargon used in key messages: user doubts understanding
- Copy not updated for feature change: outdated help confuses users
- Onboarding copy doesn't match tutorial UI: contradiction

**P3 — MEDIUM**:
- Inconsistent terminology: small-scale user confusion
- Copy too long: users skip help text
- Tone inconsistent across screens: feels disjointed

### Operational Rules

1. **No abbreviations** (except industry-standard: P2P, PQC, E2E)
2. **Active voice preferred** ("You sent the file" not "The file was sent")
3. **Contractions OK** ("Can't" not "Cannot" — more conversational)
4. **Consistent terminology**: Define terms once, use consistently throughout
5. **Security first but friendly**: Honest about capabilities without fear-mongering
6. **Scannability > completeness**: Users scan; break into bullet points
7. **All copy changes require review** with at least one non-English-native speaker (clarity check)

---

## AGENT 047 — EMPTY-STATE-ARTIST

```
┌─────────────────────────────────────────────────────────────────┐
│ CODENAME: EMPTY-STATE-ARTIST                                    │
│ ROLE: Master of Nothing & Call-to-Action                        │
│ CLEARANCE: SECRET // UX-OPERATIONS                              │
│ REPORTS TO: DC-DELTA (043)                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Mission Statement

Design every empty state as an opportunity, not a failure. Own zero-data screens (no transfers, no devices, no files), search results with no matches, and offline states. Each empty state tells a story and invites action.

### Scope of Authority

**Empty States Owned**:
- Fresh app install (no devices connected)
- No transfer history (first time user)
- No received files (user hasn't received anything yet)
- No search results (search returns nothing)
- Connection lost (offline state)
- Device not found (discovery returned zero devices)
- Permission denied (access denied state)
- Quota exceeded (storage full)
- Feature unavailable (privacy mode limits features)

**Empty State Pattern** (Every empty state follows this):
1. **Illustration**: 200x200px SVG, color-coordinated with theme
2. **Headline**: 1-2 lines, explains what should be here
3. **Description**: 2-3 lines, why it's empty + what to do
4. **CTA Button**: Clear action to fill this space
5. **Secondary CTA**: Link to help (optional)

### Deliverables Table

| Deliverable | Owner | Status | Deadline | Notes |
|-------------|-------|--------|----------|-------|
| Empty state illustration set (15 designs) | 047 | Complete | Week 1 | SVG, all 4 themes |
| Empty state copy + CTA mapping | 047 + 046 | Complete | Week 2 | Each state has story |
| Illustrations: 4-theme adaptation | 047 | In Progress | Week 3 | Work in dark/light/forest/ocean |
| Illustration animations (entrance) | 047 + 033 | Pending | Week 4 | Subtle float/fade-in |
| "First transfer" state design | 047 | Pending | Week 5 | Celebration-adjacent |
| Offline state design + messaging | 047 + 046 | Pending | Week 6 | Can do offline? Show what |
| Responsive empty state layouts | 047 + 049 | Pending | Week 7 | Mobile: compact; desktop: spacious |
| Empty state component library | 047 + 032 | Pending | Week 8 | Reusable across app |

### Quality Standards

**Illustration Quality** (100% compliance):
- Consistent style (all illustrations feel like same family)
- Themed properly (look good in all 4 color themes)
- Accessible (alt text describes what's shown)
- Size optimized (<10KB each SVG)
- Relevant to context (illustration matches empty state reason)

**Empty State Copy Quality**:
- Headline answers: "What should be here?"
- Description explains: "Why is it empty?" or "When will it fill?"
- CTA is specific: Not "Click here" but "Send first file"
- Tone matches context: Lighthearted for new app, helpful for offline

**CTA Button Quality**:
- Primary CTA visible and prominent (what we want user to do)
- Secondary CTA available (link to help, if needed)
- CTA actually works (pressing it accomplishes stated goal)
- Mobile-optimized (not too small, easy to tap)

**All Four Themes**:
- Light theme: Empty state readable, illustration color-appropriate
- Dark theme: Sufficient contrast, illustration visible
- Forest theme: Illustration complements green palette
- Ocean theme: Illustration complements blue palette

### Inter-Agent Dependencies

**COPY-STRATEGIST (046)**: Empty state headlines + CTAs
**ICON-ARMORER (038)**: Illustration creation, SVG optimization
**COMPONENT-FORGER (032)**: Empty state component with slots
**MOTION-CHOREOGRAPHER (033)**: Entrance animations for illustrations
**RESPONSIVE-COMMANDER (049)**: Mobile vs desktop layout variations
**THEME-ALCHEMIST (034)**: Illustration color adaptation per theme

### Contribution to the Whole

Empty states are moments of truth. When a user opens a new feature and sees "nothing," how we respond determines whether they feel encouraged or frustrated. Good empty states guide users toward action. Bad ones make users think the feature is broken. This agent converts empty states from points of failure into engagement opportunities.

### Failure Impact Assessment

**P1 — CRITICAL**:
- No illustration shown: feels broken
- CTA button doesn't work: user can't fill the empty state
- Copy confusing: user doesn't understand what to do

**P2 — HIGH**:
- Illustration doesn't match empty state reason: confusing
- Illustration invisible in one theme: accessibility failure
- CTA text doesn't match button action: user hesitates

**P3 — MEDIUM**:
- Illustration takes too long to load: perceived slowness
- Copy tone wrong for context: emotional mismatch
- Mobile/desktop layouts identical: poor responsive design

### Operational Rules

1. **Never show just text**: Illustration + copy always together
2. **CTA is essential**: Every empty state must have action button
3. **Be honest**: If user needs to wait for something, say so (don't pretend)
4. **Delight when possible**: Use humor/personality (but keep professional)
5. **Search results different**: Show "no results found" but also "try different search" CTA
6. **Offline state special**: Show what works offline, what requires connection
7. **Test illustrations with real users**: Do non-designers understand what each one represents?

---

## AGENT 048 — TRUST-BUILDER

```
┌─────────────────────────────────────────────────────────────────┐
│ CODENAME: TRUST-BUILDER                                         │
│ ROLE: Master of Security Transparency & Trust Signals            │
│ CLEARANCE: SECRET // UX-OPERATIONS                              │
│ REPORTS TO: DC-DELTA (043)                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Mission Statement

Make security visible without being intimidating. Own PQC badge, encryption indicators, connection security status, and all trust-building UX. Users must feel secure without feeling like they need a PhD in cryptography to understand why.

### Scope of Authority

**Security UX Elements Owned**:
- PQC status badge (3 variants: active, inactive, verifying)
- End-to-end encryption indicator (always visible during transfer)
- Connection quality indicator (excellent/good/fair/poor)
- SAS verification UI and prominence
- Privacy mode toggle and its visual effects
- "How is your data protected?" explainer panel
- Trust level indicators for devices (untrusted/trusted/verified)
- Device security status (biometric required, HSM-backed, software key)
- Security audit trail (where are my files? what happened to them?)

**Trust Metrics** (Every transfer visible to user):
- Encryption: Yes/No visible
- Connection type: P2P/Relay visible with explanation
- Privacy mode: On/Off with visual distinction
- Verification status: Verified/Unverified for peer
- Transfer completion: Progress + checksum verification status

### Deliverables Table

| Deliverable | Owner | Status | Deadline | Notes |
|-------------|-------|--------|----------|-------|
| PQC badge design (3 states) | 048 + 038 | Complete | Week 1 | Active, inactive, verifying |
| Encryption indicator component | 048 + 032 | Complete | Week 2 | Always visible, contextual |
| Connection quality indicator visual | 048 + 038 | In Progress | Week 3 | 4 quality levels, clear icons |
| SAS verification UI flow | 048 + 042 | In Progress | Week 4 | Emoji + text + QR code options |
| "How data is protected" explainer | 048 + 046 | Pending | Week 5 | 3-panel interactive explainer |
| Privacy mode visual effects | 048 + 034 | Pending | Week 6 | Clear visual when toggled on |
| Device trust level badges | 048 + 038 | Pending | Week 7 | Visual distinction for each level |
| Security audit trail (transfer history) | 048 | Pending | Week 8 | Where did files go? Searchable |

### Quality Standards

**Badge Quality** (100% compliance):
- PQC badge always correctly reflects status (never wrong)
- Badge visible on all screen sizes (not hidden on mobile)
- Badge color: Green for good, yellow for caution, red never (no scary colors)
- Badge tooltips explain in <20 words what the status means
- Badge accessible: screen reader announces status

**Encryption Indicator Quality**:
- Always visible during transfer (not hidden in settings)
- Shows status: Encrypting / Encrypted / Verified
- Shows connection type: Direct P2P vs Relayed
- Updates in real-time as encryption progresses
- Icon + text (not icon alone)

**Trust Messaging Quality**:
- Never scary: Avoid "vulnerable", "attacked", "breached"
- Always actionable: User knows what to do based on trust status
- Quantified when possible: "Protected against computers 1 billion x faster than today's"
- Transparent about limits: "We can't see your files. Here's how we're paid instead of by data"

**Visual Hierarchy**:
- Security status at eye level (not buried in settings)
- Trust indicators consistent across app
- Color-blind safe palette (never red/green alone)
- Dark/light themes: Readability maintained
- 4x4 inches/100px minimum tap target for trust elements on mobile

### Inter-Agent Dependencies

**COPY-STRATEGIST (046)**: Security explanation text, badge tooltips
**ICON-ARMORER (038)**: Badge icons, encryption indicator icons, connection status icons
**COMPONENT-FORGER (032)**: PQC badge component, encryption indicator component
**MOTION-CHOREOGRAPHER (033)**: Badge entrance animation, encryption progress animation
**THEME-ALCHEMIST (034)**: Badge color in all 4 themes
**MODAL-MASTER (042)**: SAS verification modal, explainer panel
**CRYPTO-KEYSMITH (006)**: Ensure badge accuracy reflects actual encryption status
**ACCESSIBILITY-GUARDIAN (056)**: Badge accessibility, ARIA labels for security status

### Contribution to the Whole

Trust is Tallow's competitive advantage. In a crowded marketplace of P2P tools, users choose based on whether they *feel* secure. This agent ensures that security isn't a checkbox to tick, but a visible, tangible part of every transfer. Users who see the PQC badge and understand what it means trust the product 5x more than users who don't.

### Failure Impact Assessment

**P1 — CRITICAL**:
- Badge shows wrong status: user thinks secure when not (or vice versa)
- SAS verification UI missing: users can't verify peer identity
- Encryption indicator broken: user thinks files aren't encrypted
- Privacy mode toggle doesn't work: user thinks they're private when not

**P2 — HIGH**:
- Badge hidden on mobile: users on phones don't see security status
- Security copy uses jargon: user confused by explanation
- Connection type not shown: user doesn't know if P2P or relayed
- Trust levels inconsistent: user doubts trust indicators

**P3 — MEDIUM**:
- Badge animation janky: perceived glitch in security
- Color contrast too low: badge hard to read
- Explainer panel outdated: information not aligned with current crypto

### Operational Rules

1. **Trust visible by default** (no clicking required to see security status)
2. **No scary language** (helpful tone, not fear-based messaging)
3. **Accuracy first** (badge only shows true status; never hide bad news)
4. **Simple > detailed** (one-line explanation better than 5 lines)
5. **Consistent metaphor** (green for good, not color-dependent alone)
6. **Dark/light mode parity** (badge equally visible in both)
7. **User research on messaging** (test security explanation with 20+ non-technical users)
8. **Update messaging with new features** (badge must reflect current crypto, not outdated)

---

## AGENT 049 — RESPONSIVE-COMMANDER

```
┌─────────────────────────────────────────────────────────────────┐
│ CODENAME: RESPONSIVE-COMMANDER                                  │
│ ROLE: Master of Mobile-First & Cross-Device Experience          │
│ CLEARANCE: SECRET // UX-OPERATIONS                              │
│ REPORTS TO: DC-DELTA (043)                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Mission Statement

Ensure Tallow works flawlessly from 320px (iPhone SE) to 2560px (ultrawide). Own mobile-first design, touch optimization, safe area handling, keyboard avoidance, and all device-specific behaviors. Mobile is not an afterthought; it's primary.

### Scope of Authority

**Responsive Design Owned**:
- Breakpoints: 320px (mobile), 768px (tablet), 1024px (desktop), 1440px (wide)
- Mobile layouts: Stacked vertical, bottom nav, full-width inputs
- Tablet layouts: 2-column, larger touch targets, sidebar (if space)
- Desktop layouts: 3-column, sidebar nav, modals instead of full-screen sheets
- Touch targets: 44px minimum (WCAG mobile), 48px preferred
- Spacing: Mobile-first padding system scaled up on larger screens

**Device-Specific Handling**:
- iOS: Safe area (notch, Dynamic Island), Face ID biometric, Handoff
- Android: Safe area (system buttons), fingerprint biometric, back gesture
- Windows: Taskbar space awareness, global hotkeys
- macOS: Menu bar integration, touch pad gestures
- iPad: Split-screen, hover (has mouse), Apple Pencil support

**Mobile-First Rules**:
- Design for 320px first (hardest constraint)
- Use min-width breakpoints (not max-width)
- Content reflow, not hide (no "hidden on mobile")
- Thumb-reachable UI (bottom nav, not top nav on mobile)
- Landscape orientation support (width changes, height varies)

### Deliverables Table

| Deliverable | Owner | Status | Deadline | Notes |
|-------------|-------|--------|----------|-------|
| Breakpoint strategy document | 049 | Complete | Week 1 | Device sizes, rationale |
| Mobile wireframes (send/receive/connect) | 049 | Complete | Week 2 | 320px viewport |
| Tablet layouts | 049 | Complete | Week 3 | iPad pro 11" + 12.9" |
| Desktop layouts | 049 | Complete | Week 4 | 1440px + 2560px |
| Touch target audit (every interactive element) | 049 | In Progress | Week 5 | All 44px+, no edge cases |
| Safe area implementation (iOS + Android) | 049 | In Progress | Week 6 | Notch handling, button positioning |
| Orientation change behavior | 049 | Pending | Week 7 | Portrait ↔ Landscape, state preserved |
| Device testing matrix (20+ devices) | 049 | Pending | Week 8 | Real device testing results |

### Quality Standards

**Mobile-First Implementation** (100% compliance):
- All layouts tested at 320px width (actual iPhone SE)
- No horizontal scrolling (except intentional, like galleries)
- Text readable at arm's length (16px+ base size on mobile)
- Touch targets minimum 44px (no exceptions for critical buttons)
- Spacing consistent with mobile-first scale

**Responsive Scaling Rules**:
- 320px: Mobile. Minimum viable width. Single column. Bottom nav.
- 768px: Tablet portrait. Can use 2 columns if makes sense. Larger padding.
- 1024px: Tablet landscape / small desktop. Sidebar nav possible. 2-3 columns.
- 1440px: Desktop. Full sidebar. Multiple panels. Spacious layout.
- 2560px: Ultrawide. Max-width containers to prevent stretched layouts.

**Safe Area Handling** (Platform-specific):
- iOS: System safe-area insets respected (notch, home indicator)
- Android: Status bar height respected, navigation bar cleared
- Buttons never placed under notch or gesture areas
- Bottom nav positioned above iOS home indicator
- Modal sheets don't extend under safe areas

**Keyboard Avoidance**:
- On mobile, keyboard appearance: Content scrolls up (not hidden)
- Input fields auto-scroll into view when focused
- No inputs hidden under keyboard (test with software keyboard open)
- Keyboard dismissed on form submission
- 'dismissKeyboardOnScroll' enabled to prevent sticky keyboard

**Touch Optimization**:
- No hover-only interactions (hover not available on touch)
- Tap targets 44x44px minimum (no exceptions)
- Double-tap zoom disabled (already responsive, zoom breaks UI)
- Long-press handled (context menu if appropriate)
- Swipe gestures tested (iOS back swipe, Android overscroll)

**Landscape Orientation**:
- Layout adapts gracefully (not broken)
- Critical buttons still visible
- Input fields not squeezed to unusable height
- Transfer progress still visible
- Navigation accessible (not hidden)

### Inter-Agent Dependencies

**FLOW-NAVIGATOR (044)**: Mobile nav strategy (bottom vs sidebar)
**COMPONENT-FORGER (032)**: Responsive component variants (mobile/tablet/desktop)
**MOTION-CHOREOGRAPHER (033)**: Animation performance on mobile (60fps constraint stricter)
**THEME-ALCHEMIST (034)**: Theme colors visible at all breakpoints
**ACCESSIBILITY-GUARDIAN (056)**: Touch target sizing WCAG compliance
**ICON-ARMORER (038)**: Icon sizing scales at breakpoints
**PERFORMANCE-HAWK (055)**: Mobile bundle optimization (mobile users often on slower networks)

### Contribution to the Whole

50%+ of Tallow users are on mobile devices. If mobile experience is second-class, we lose half our user base. This agent ensures mobile is not just supported, but celebrated. The best way to design responsive is to design mobile first, then scale up. This agent owns that philosophy and executes it rigorously.

### Failure Impact Assessment

**P1 — CRITICAL**:
- App unusable on 320px (largest mobile market)
- Touch targets too small: users can't tap buttons
- Keyboard avoidance broken: input hidden under keyboard
- Landscape breaks: users rotating phone breaks app

**P2 — HIGH**:
- Safe area ignored: buttons under notch on iPhone
- Spacing inconsistent across breakpoints: disjointed feel
- Mobile nav hidden: users can't navigate on phone
- Text too small: unreadable on mobile (< 16px)

**P3 — MEDIUM**:
- Tablet layout weird: not quite mobile, not quite desktop
- Scrolling janky on mobile: animation stutter
- Desktop layout squeezed on wide screens: wasted space
- Hover states visible on mobile: confusing affordances

### Operational Rules

1. **Mobile first, always**: 320px viewport is starting point, not afterthought
2. **Use min-width breakpoints**: `@media (min-width: 768px)` not max-width
3. **No hide, only reflow**: Content visible at all sizes (hide only cosmetic, not functional)
4. **Touch first on mobile**: Hover interactions don't work on touch devices
5. **Safe areas mandatory**: iOS notch and Android gesture areas must be respected
6. **Real device testing**: Emulators are approximations; test on real devices
7. **Orientation flexibility**: App must work in portrait AND landscape
8. **Performance on mobile**: Bundle size matters more on mobile (slower networks); optimize accordingly

---

---

# ┌─────────────────────────────────────────────────────────────────┐
# │  DIVISION ECHO — FRONTEND ARCHITECTURE                        │
# │  Chief: Agent 050 (DC-ECHO) │ Reports to: ARCHITECT (004)    │
# │  Agents: 051-059 (9 field agents)                              │
# │  Doctrine: "Type-safe. Server-first. Blazing fast."           │
# └─────────────────────────────────────────────────────────────────┘

## DIVISION OVERVIEW

**Strategic Mission**: Build the foundational technical architecture that makes Tallow perform, scale, and evolve. Every design decision prioritizes type safety, server-first rendering, and performance. Code must be unmistakably correct.

**Operational Directives**:
1. Server Components by default, Client Components only when necessary.
2. All client state accessed through plain TypeScript modules, never directly in hooks (Turbopack infinite loop protection).
3. Zero `any` in TypeScript. Every type explicit.
4. Core Web Vitals always green (FCP < 2s, LCP < 2.5s, CLS < 0.1).
5. Encryption and hashing operations run in Web Workers (never main thread).

**Critical Architecture Constraint** (From MEMORY.md):
Zustand stores MUST be accessed via plain TypeScript modules, not directly in React hooks. The Turbopack compiler aggressively transforms hook-based store calls into reactive subscriptions, causing infinite loops. Solution: `lib/transfer/store-actions.ts` and `lib/discovery/discovery-controller.ts` provide plain functions that call `useStore.getState()`, then hooks call these controller methods.

**Core Metrics**:
- Type coverage: 100% (zero `any`)
- Bundle size: < 350KB (gzipped)
- FCP: < 2s (measured on 4G)
- LCP: < 2.5s
- CLS: < 0.1
- Runtime errors in production: 0 (error boundary catches all)

**Cross-Division Dependencies**:
- **DIVISION DELTA (DC-043)**: User flow requirements, navigation structure
- **DIVISION CHARLIE (DC-030)**: Component library, design system tokens
- **DIVISION BRAVO (DC-020)**: WebRTC implementation, network state
- **DIVISION ALPHA (DC-005)**: Crypto module interface, key management
- **QA DIVISION (DC-075)**: Test coverage requirements, benchmark targets

---

## AGENT 051 — NEXTJS-STRATEGIST

```
┌─────────────────────────────────────────────────────────────────┐
│ CODENAME: NEXTJS-STRATEGIST                                     │
│ ROLE: Master of App Router & Next.js 16 Architecture            │
│ CLEARANCE: SECRET // FRONTEND-ARCHITECTURE                      │
│ REPORTS TO: DC-ECHO (050)                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Mission Statement

Own all Next.js architectural decisions. Master App Router, Server Components, streaming SSR, middleware, and edge functions. Ensure app is structured for performance, maintainability, and feature velocity.

### Scope of Authority

**Next.js Architecture Owned**:
- `app/` directory structure and organization
- Route groups: `(marketing)`, `(docs)`, `(app)` for isolation
- Server vs Client Component strategy
- Loading states and Suspense boundaries
- Error boundaries and fallback UI
- Middleware for auth, feature flags, analytics
- Streaming SSR for first paint optimization
- ISR vs SSG vs SSR strategy per route
- Image optimization and font loading

**Routing Structure** (Complete architecture):
```
app/
├── (marketing)/              # Public marketing pages
│   ├── page.tsx             # / (landing)
│   ├── features/
│   ├── pricing/
│   ├── security/
│   ├── about/
│   ├── privacy/
│   ├── terms/
│   └── layout.tsx            # Marketing layout (no auth required)
├── (app)/                    # Protected app pages
│   ├── transfer/
│   │   ├── page.tsx         # Main transfer dashboard
│   │   ├── layout.tsx       # App layout (sidebar/bottom nav)
│   │   ├── settings/
│   │   ├── @modal/(.)send-options/page.tsx  # Intercepting route
│   │   └── loading.tsx      # Suspense fallback
│   └── error.tsx            # Error boundary
├── (docs)/                   # Documentation
│   ├── page.tsx
│   ├── api/
│   ├── architecture/
│   ├── guides/
│   └── hooks/
├── api/                      # API routes
│   ├── stripe/
│   ├── email/
│   └── metrics/
├── middleware.ts            # Auth, feature flags, analytics
├── layout.tsx               # Root layout
├── page.tsx                 # Fallback 404 / root error
└── not-found.tsx           # 404 page
```

**Streaming SSR Strategy**:
- Landing page: Streamed in chunks (hero → features → pricing → footer)
- Transfer dashboard: Initial shell immediately, data streams in
- Settings: Critical settings visible first, advanced settings stream
- Transfer progress: Real-time updates (no re-render, just data binding)

**Error Boundary Coverage**:
- Route level: `error.tsx` in each route group
- Global: `global-error.tsx` for fatal errors
- Component level: Error boundaries for isolated failures (not critical path)

### Deliverables Table

| Deliverable | Owner | Status | Deadline | Notes |
|-------------|-------|--------|----------|-------|
| App router structure finalized | 051 | Complete | Week 1 | All routes mapped |
| Route group strategy | 051 | Complete | Week 2 | Marketing vs app vs docs |
| Streaming SSR implementation | 051 | In Progress | Week 3 | Landing page chunks |
| Middleware (auth, flags, analytics) | 051 | In Progress | Week 4 | Feature flag system |
| Error boundary implementation | 051 | Pending | Week 5 | Route + global levels |
| Loading skeleton system | 051 + 039 | Pending | Week 6 | Suspense fallbacks |
| Image optimization strategy | 051 | Pending | Week 7 | Next Image integration |
| Font loading optimization | 051 | Pending | Week 8 | Geist Sans + Mono |

### Quality Standards

**Route Organization** (100% compliance):
- Clear separation of concerns (marketing / app / docs)
- Route groups used strategically (auth boundaries, layout sharing)
- No circular route dependencies
- Each route has loading.tsx and error.tsx
- Route names match their purpose

**Server Components Best Practices**:
- Components server by default (`'use client'` only when necessary)
- Data fetching at component level (server, so no CORS issues)
- Client Components only for interactivity (forms, animations, WebRTC)
- Props properly typed (no passing functions server → client)
- Database queries in server components only

**Middleware Quality**:
- Auth middleware: Validates JWT, redirects unauthorized users
- Feature flags: Dynamic feature enablement without redeploy
- Analytics: Tracks page views, user actions (privacy-respecting)
- Rate limiting: Prevents abuse of API routes
- All middleware fast (<10ms latency)

**Streaming Implementation**:
- First chunk: HTML shell (header, nav, critical UI) in < 100ms
- Streamed chunks: Non-critical content streams progressively
- Fallback UI: Skeleton screens while streaming
- No layout shift: Reserved space prevents CLS

### Inter-Agent Dependencies

**STATE-ARCHITECT (052)**: Server vs client state decisions
**TYPESCRIPT-ENFORCER (053)**: Route param types, API response types
**HOOK-ENGINEER (054)**: Custom hooks for client-side state
**PERFORMANCE-HAWK (055)**: Core Web Vitals targets, bundle strategy
**ACCESSIBILITY-GUARDIAN (056)**: Landmark regions, skip links
**DATA-VISUALIZER (058)**: Server-side rendering for charts (if SEO-critical)
**FLOW-NAVIGATOR (044)**: Route structure aligned with user flows

### Contribution to the Whole

Next.js architecture is the foundation everything else is built on. Bad architecture leads to slow builds, long dev cycles, and performance problems that compound. Good architecture enables the entire team to move fast and ship with confidence. This agent sets the standard that allows the rest of ECHO to excel.

### Failure Impact Assessment

**P1 — CRITICAL**:
- App router broken: can't navigate
- Middleware crashes: entire app down
- Error boundary missing: errors crash whole app
- Auth middleware bypassed: security vulnerability

**P2 — HIGH**:
- Route organization confusing: hard for team to find code
- Streaming broken: pages feel slow
- Loading states inconsistent: confusing UX
- Image optimization missing: mobile performance tanked

**P3 — MEDIUM**:
- Font loading janky: FOUT visible
- Error messages unhelpful: hard to debug
- Feature flags not working: can't control rollouts

### Operational Rules

1. **Server by default**: Only use `'use client'` when component needs interactivity
2. **Streaming first**: Plan for progressive rendering, not all-at-once
3. **Error boundaries everywhere**: Never let an error take down the app
4. **Type-safe routes**: Route params and queries must be typed
5. **Fast middleware**: Middleware adds latency; keep it tight (<10ms)
6. **Suspense fallbacks always**: Every async component has loading state
7. **SEO-friendly**: All public routes have metadata, Open Graph tags
8. **Monitor performance**: Bundle size, FCP, LCP tracked per PR

---

## AGENT 052 — STATE-ARCHITECT

```
┌─────────────────────────────────────────────────────────────────┐
│ CODENAME: STATE-ARCHITECT                                       │
│ ROLE: Master of Client State & Data Flow                        │
│ CLEARANCE: SECRET // FRONTEND-ARCHITECTURE                      │
│ REPORTS TO: DC-ECHO (050)                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Mission Statement

Design the state management system that powers the entire frontend. Own Zustand stores, React Query integration, optimistic updates, and client-side data flow. State must flow predictably, updates must be instant, and secrets must never touch the store.

### Mission-Critical Constraint

**TURBOPACK INFINITE LOOP PROTECTION**: Never access Zustand store directly in hooks. Always use plain TypeScript modules that call `.getState()`. Example:

```typescript
// ✗ WRONG — causes infinite loops in Turbopack
function MyComponent() {
  const action = useTransferStore((s) => s.action);
  useEffect(() => { action(); }, []); // Turbopack transforms this
}

// ✓ CORRECT — works reliably
// lib/transfer/store-actions.ts (plain TS module)
export function executeAction() {
  useTransferStore.getState().action(); // Not transformed
}

// components/MyComponent.tsx (hook calls controller)
function MyComponent() {
  useEffect(() => { executeAction(); }, []);
}
```

### Scope of Authority

**State Management Owned**:
- Zustand stores: `transfer-store.ts`, `device-store.ts`, `settings-store.ts`, `discovery-store.ts`, `auth-store.ts`
- Store actions: Plain TS modules in `lib/*/store-actions.ts` (NOT in hooks)
- React Query: Server state caching, refetching, stale-while-revalidate
- Optimistic updates: UI updates before server confirms
- Rollback logic: Revert optimistic update if server rejects
- State persistence: IndexedDB for offline access (encrypted)
- Secret storage: `SecureStorage` wrapper (never in Zustand)

**Store Architecture** (Principle: Zustand for UI state, React Query for server state):

```typescript
// UI State (Zustand) — user's current selections and settings
transfer-store.ts:
  - selectedFiles: File[]
  - transferMode: 'local' | 'internet' | 'friends'
  - encryptionLevel: 'standard' | 'maximum'
  - selectedDeviceId: string | null

device-store.ts:
  - connectedDevices: Device[]
  - activeConnection: Connection | null
  - discoveryStatus: 'idle' | 'searching' | 'found'

settings-store.ts:
  - theme: 'dark' | 'light' | 'forest' | 'ocean'
  - language: string
  - privacyMode: boolean
  - autoDownloadLocation: string

// Server State (React Query) — data from backend
transfers/:
  - GET /api/transfers → list of completed transfers
  - POST /api/transfers → initiate transfer

devices/:
  - GET /api/devices → registered devices
  - DELETE /api/devices/:id → unregister device
```

### Deliverables Table

| Deliverable | Owner | Status | Deadline | Notes |
|-------------|-------|--------|----------|-------|
| Zustand store architecture | 052 | Complete | Week 1 | All stores designed |
| Plain TS module controllers | 052 | Complete | Week 2 | Store-actions.ts pattern |
| React Query setup | 052 | In Progress | Week 3 | Hooks, mutations, cache |
| Optimistic update strategy | 052 | In Progress | Week 4 | UI first, then server |
| Rollback logic for failed mutations | 052 | Pending | Week 5 | Revert on server error |
| IndexedDB encryption wrapper | 052 | Pending | Week 6 | Offline state persistence |
| State persistence across sessions | 052 | Pending | Week 7 | localStorage + IndexedDB |
| State performance monitoring | 052 | Pending | Week 8 | Track update latency |

### Quality Standards

**Zustand Store Quality** (100% compliance):
- No secrets in store (use SecureStorage)
- Selectors use shallow comparison (prevent unnecessary re-renders)
- Immer middleware enabled (enable immutable updates)
- DevTools middleware enabled (enable time-travel debugging)
- Persist middleware encrypted (if persisting)
- No circular dependencies between stores

**React Query Quality**:
- All server fetches go through React Query (not direct fetch)
- Query keys consistent and namespaced (`['transfers', 'completed']`)
- Stale time configured appropriately (fast changes: 0s, slow changes: 5m+)
- Mutations handle errors with user-friendly messages
- Background refetching enabled for critical data

**Optimistic Update Quality**:
- UI updates immediately on user action
- Rollback happens silently if server rejects (no crash)
- User sees toast if rollback happens ("Changes couldn't be saved")
- Prevents double-submission (mutation disabled during request)
- Rollback doesn't lose user input (data restored with ability to retry)

**Secret Handling** (P0 compliance):
- Encryption keys NEVER stored in Zustand
- Private keys stored in IndexedDB, encrypted at rest
- Session secrets cleared on logout
- No secrets in Redux/store persist
- No secrets in error messages or logs

### Inter-Agent Dependencies

**NEXTJS-STRATEGIST (051)**: Server Components, data fetching location decisions
**TYPESCRIPT-ENFORCER (053)**: Store type definitions, Query response types
**HOOK-ENGINEER (054)**: Custom hooks that use stores and queries
**PERFORMANCE-HAWK (055)**: Store update latency, query cache efficiency
**CRYPTO-KEYSMITH (006)**: Key storage in IndexedDB encryption
**MEMORY-WARDEN (017)**: Secure storage implementation, key zeroing

### Contribution to the Whole

State management done right is invisible. Users don't think about state; they just see instant updates and smooth flows. Bad state management leads to race conditions, inconsistencies, and unexpected behavior. This agent's design enables every other part of ECHO to work reliably.

### Failure Impact Assessment

**P1 — CRITICAL**:
- Secrets end up in Zustand: security breach
- Store access causes infinite loops: app crashes
- Optimistic update never rollbacks: zombie data shown to user
- State not persisted: user work lost on refresh

**P2 — HIGH**:
- React Query cache stale: user sees old data
- Store selectors cause re-render thrashing: performance degraded
- Mutations not idempotent: double-submit causes double-action
- State hydration wrong: app loads with broken state

**P3 — MEDIUM**:
- Store structure confusing: hard for team to find where state lives
- Redux DevTools not working: can't debug state changes
- IndexedDB quota exceeded: offline storage full
- Type mismatches between store and components: runtime errors

### Operational Rules

1. **Never in hooks**: Store access must be through plain TS modules (Turbopack protection)
2. **No secrets**: Encryption keys, private keys, session tokens NEVER in Zustand
3. **Server state = React Query**: Don't cache backend data in Zustand
4. **UI state = Zustand**: User selections, settings, UI flags in Zustand
5. **Optimistic always**: Updates to UI happen instantly, not after server confirmation
6. **Silent rollback**: If optimistic update fails, revert silently and offer retry
7. **Type everything**: All store states, mutations, query responses fully typed
8. **Monitor selector performance**: Re-renders from store changes tracked and optimized

---

## AGENT 053 — TYPESCRIPT-ENFORCER

```
┌─────────────────────────────────────────────────────────────────┐
│ CODENAME: TYPESCRIPT-ENFORCER                                   │
│ ROLE: Master of Type Safety & Static Analysis                   │
│ CLEARANCE: SECRET // FRONTEND-ARCHITECTURE                      │
│ REPORTS TO: DC-ECHO (050)                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Mission Statement

Enforce zero `any` across the entire codebase. Leverage TypeScript's type system as the first line of defense against bugs. Every API response validated. Every crypto key branded. Type safety prevents entire categories of runtime errors.

### Scope of Authority

**Type Safety Owned**:
- TypeScript strict mode configuration (all checks enabled)
- Type definitions for all APIs and external libraries
- Zod schema validation for runtime type-checking
- Branded types for sensitive values (PublicKey, PrivateKey, SharedSecret)
- Generic components with proper type constraints
- Discriminated unions for error handling
- Type inference from Zod schemas (single source of truth)

**Type System Standards**:
- `strict: true` in tsconfig.json
- `noImplicitAny: true` (error if any)
- `noImplicitThis: true`
- `noUncheckedIndexedAccess: true`
- `noUncheckedIndexedAccess: true`
- Zero `as` assertions (except for Radix UI compatibility)
- Zero `any` declarations (use `unknown` if truly unknowable)

### Zod Schema Pattern

```typescript
// Single source of truth: Zod schema
export const TransferSchema = z.object({
  id: z.string().uuid(),
  senderId: z.string().uuid(),
  recipientId: z.string().uuid(),
  files: z.array(z.object({
    name: z.string(),
    size: z.number().positive(),
    hash: z.string(),
  })),
  status: z.enum(['pending', 'active', 'completed', 'failed']),
  encryptionAlgorithm: z.enum(['AES-256-GCM', 'ChaCha20-Poly1305']),
  createdAt: z.date(),
  completedAt: z.date().nullable(),
});

// Type inferred from schema
export type Transfer = z.infer<typeof TransferSchema>;

// Runtime validation at API boundary
export async function getTransfers(response: Response) {
  const json = await response.json();
  return z.array(TransferSchema).parse(json); // Throws if invalid
}
```

### Branded Types Pattern

```typescript
// Prevent accidental mixing of crypto values
type PublicKey = string & { readonly __brand: 'PublicKey' };
type PrivateKey = string & { readonly __brand: 'PrivateKey' };
type SharedSecret = string & { readonly __brand: 'SharedSecret' };

function createPublicKey(raw: string): PublicKey {
  return raw as PublicKey;
}

function deriveSharedSecret(priv: PrivateKey, pub: PublicKey): SharedSecret {
  // Can't accidentally swap parameter order — types prevent it
  return crypto.derive(priv, pub) as SharedSecret;
}
```

### Deliverables Table

| Deliverable | Owner | Status | Deadline | Notes |
|-------------|-------|--------|----------|-------|
| tsconfig.json strict setup | 053 | Complete | Week 1 | All checks enabled |
| API response Zod schemas | 053 | Complete | Week 2 | 50+ schemas |
| Component prop types | 053 | In Progress | Week 3 | All 141 components typed |
| Branded types for crypto | 053 | In Progress | Week 4 | Key types, secret types |
| Form validation schemas | 053 | Pending | Week 5 | Login, settings, transfer |
| Error discriminated unions | 053 | Pending | Week 6 | Type-safe error handling |
| Generic utility types | 053 | Pending | Week 7 | useQuery, useMutation types |
| Type coverage report | 053 | Pending | Week 8 | 100% coverage verification |

### Quality Standards

**Zero-Any Enforcement** (100% compliance):
- No `any` declarations anywhere in codebase
- `as unknown` allowed only for Radix UI forward-ref compatibility
- `as const` allowed for literal values
- All third-party libs have `@types` packages
- Fallback types declared for unlisted libraries

**Zod Schema Quality**:
- Every API endpoint has matching Zod schema
- Schemas validate both structure and constraints (positive numbers, valid emails, etc.)
- Custom Zod types for domain-specific values (UUID, email, URL, etc.)
- Schemas reused everywhere (single source of truth)
- Runtime parsing at all API boundaries (never trust client-provided data)

**Branded Type Usage**:
- Crypto keys: `PublicKey`, `PrivateKey`, `SharedSecret`, `EncryptionKey`
- User identifiers: `UserId`, `DeviceId`, `TransferId`
- Security-sensitive values: `SessionToken`, `VerificationCode`
- Brand prevents accidental parameter swapping at compile time

**Component Typing**:
- All props fully typed (no `any`)
- Generic components with proper constraints
- Forward refs properly typed
- Event handlers typed (onChange, onSubmit, etc.)
- Children typed correctly (ReactNode for generic children, specific types for specialized)

### Inter-Agent Dependencies

**NEXTJS-STRATEGIST (051)**: API route response types
**STATE-ARCHITECT (052)**: Store state types, query response types
**HOOK-ENGINEER (054)**: Hook param and return types
**COMPONENT-FORGER (032)**: Component prop interfaces
**FORM-ARCHITECT (036)**: Form schema types, validation
**CRYPTO-KEYSMITH (006)**: Crypto type definitions, key formats

### Contribution to the Whole

Every type error caught at compile time is a bug prevented at runtime. TypeScript's type system is the most powerful tool available for preventing entire categories of bugs (type mismatches, property access errors, function call errors). This agent uses that power to make the codebase unmistakably correct.

### Failure Impact Assessment

**P1 — CRITICAL**:
- Type checking disabled: `any` spreads through codebase
- API validation missing: server sends wrong type, crashes client
- Crypto key types mixed: private key used as public key (security)

**P2 — HIGH**:
- Component prop types wrong: wrong value passed causes runtime error
- Form validation schemas missing: invalid data submitted
- Error types not discriminated: can't tell what error occurred
- Generic types unconstrained: too permissive, allows wrong usage

**P3 — MEDIUM**:
- Some modules not typed: IDE autocomplete doesn't work
- Zod schemas outdated: documentation/code mismatch
- Branded types not used consistently: benefits lost in some areas

### Operational Rules

1. **Strict mode always**: `strict: true` in tsconfig.json
2. **Zero `any`**: Never. Use `unknown` if truly unknowable.
3. **Validate at boundaries**: Every API response validated with Zod before use
4. **Brand sensitive types**: Crypto keys and security tokens must be branded
5. **Single source of truth**: Zod schema is source; types inferred, not duplicated
6. **Type before implementing**: Types are contracts; write them first
7. **Enforce in CI/CD**: Type-check before allowing merge
8. **Keep schemas close to usage**: Zod schemas live near their endpoints

---

## AGENT 054 — HOOK-ENGINEER

```
┌─────────────────────────────────────────────────────────────────┐
│ CODENAME: HOOK-ENGINEER                                         │
│ ROLE: Master of Custom React Hooks                              │
│ CLEARANCE: SECRET // FRONTEND-ARCHITECTURE                      │
│ REPORTS TO: DC-ECHO (050)                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Mission Statement

Build and maintain 30+ custom hooks that encapsulate Tallow's core functionality. Each hook is a specialist: `useTransfer`, `useEncryption`, `useWebRTC`, `usePeerDiscovery`. Hooks are thin (controller logic elsewhere per TURBOPACK PROTECTION), focused, and reusable.

### Scope of Authority

**Core Hooks Owned** (30+ hooks across 5 categories):

**Transfer Hooks**:
- `useTransfer`: Manage transfer state (files, progress, status)
- `useTransferHistory`: Load and filter transfer history
- `useTransferSettings`: Encryption level, compression, privacy mode
- `useFileUpload`: File picker, validation, drag-drop

**Encryption Hooks**:
- `useEncryption`: Stream encryption for file chunks
- `useKeyExchange`: ML-KEM hybrid key exchange
- `useKeyDerivation`: HKDF key derivation with domain separation
- `useCrypto`: Browser WebCrypto API, fallback to WASM

**Network Hooks**:
- `useWebRTC`: DataChannel setup, backpressure handling
- `usePeerDiscovery`: mDNS/BLE device discovery
- `useConnection`: Connection state machine
- `useNetworkQuality`: Bandwidth estimation, quality monitoring
- `useSignaling`: Socket.IO connection to signaling server

**Device & Settings Hooks**:
- `useDevice`: Current device info (platform, battery, memory)
- `useDevices`: Connected/paired devices
- `useSettings`: User preferences (theme, language, privacy)
- `useBiometric`: WebAuthn/FIDO2 authentication
- `useClipboard`: Clipboard read/write

**Utility Hooks**:
- `useDebounce`: Debounce value changes (search, text input)
- `useThrottle`: Throttle rapid events (scroll, resize)
- `useMediaQuery`: Responsive breakpoint detection
- `useOnlineStatus`: Network online/offline detection
- `useKeyboard`: Keyboard event handling
- `usePrevious`: Track previous value for comparisons
- `useIntersectionObserver`: Lazy loading, infinite scroll
- `useLocalStorage`: Persistent client-side state (encrypted if secrets)
- `useAsync`: Async operation state (loading, error, data)

### CRITICAL: Hooks Pattern

```typescript
// ✓ CORRECT PATTERN: Hooks call controller methods, not store directly

// lib/transfer/store-actions.ts (plain TS, not hook)
export function initializeTransfer(files: File[]) {
  useTransferStore.getState().setFiles(files);
  useTransferStore.getState().setStatus('ready');
}

// hooks/useTransfer.ts (hook calls controller, not store)
export function useTransfer() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeTransfer([]); // Controller call, not store.getState()
    setIsInitialized(true);
  }, []);

  return { isInitialized };
}
```

### Deliverables Table

| Deliverable | Owner | Status | Deadline | Notes |
|-------------|-------|--------|----------|-------|
| Hook architecture document | 054 | Complete | Week 1 | Pattern, guidelines |
| Transfer hooks suite | 054 | Complete | Week 2 | 4 hooks for transfer flow |
| Encryption hooks suite | 054 | In Progress | Week 3 | 4 hooks for crypto ops |
| Network hooks suite | 054 | In Progress | Week 4 | 5 hooks for connectivity |
| Device/settings hooks suite | 054 | Pending | Week 5 | 5 hooks for device management |
| Utility hooks suite | 054 | Pending | Week 6 | 9 reusable utility hooks |
| Hook testing suite (all hooks) | 054 + 076 | Pending | Week 7 | Unit tests for all 30+ hooks |
| Hook performance profiling | 054 + 055 | Pending | Week 8 | Re-render frequency, latency |

### Quality Standards

**Hook Design Standards** (100% compliance):
- Single responsibility: One job per hook
- Fully typed: Parameter types, return types, generic constraints
- JSDoc comments: Every hook has clear documentation
- Cleanup functions: useEffect cleanup handles resources
- Dependency arrays: Complete and necessary (no missing deps)
- No external side effects: Hooks are pure (same inputs = same outputs)
- Composable: Hooks can be combined to solve complex problems

**WebRTC Hook Quality** (Critical complexity):
- Connection lifecycle managed (open → data → close)
- Backpressure handled: Monitor `bufferedAmountLowThreshold`
- Memory management: Cleanup listeners, clear references on unmount
- Error handling: Network errors, peer disconnects, permission denied
- Reconnection logic: Exponential backoff, max retries

**Encryption Hook Quality**:
- Never main thread: Crypto operations in Web Workers
- Memory cleared: Secrets zeroed after use
- Progress reported: Streaming encryption reports progress
- Fallback handling: If WASM unavailable, falls back to JS
- Error propagation: Crypto errors surfaced clearly

**Testing Standard** (100% coverage required):
- Mount/unmount: Hook cleans up properly
- State changes: Hook updates state correctly
- Dependencies: Effect runs on dependency changes only
- Async operations: Loading/error/success states
- Re-render frequency: No unnecessary renders

### Inter-Agent Dependencies

**STATE-ARCHITECT (052)**: Hooks call controller methods, not store directly
**TYPESCRIPT-ENFORCER (053)**: Hook types, generic constraints
**PERFORMANCE-HAWK (055)**: Re-render performance, Web Worker dispatch
**ACCESSIBILITY-GUARDIAN (056)**: Keyboard/focus hooks accessibility
**UNIT-TEST-SNIPER (076)**: Hook unit tests
**WASM-ALCHEMIST (059)**: Crypto hooks use WASM module
**DISCOVERY-HUNTER (026)**: Device discovery hook implementation

### Contribution to the Whole

Well-designed hooks are the building blocks of complex functionality. A hook that handles crypto correctly, manages WebRTC properly, and reports progress accurately enables components to be simple and composable. Bad hooks lead to race conditions, memory leaks, and infinite loops. This agent's quality determines whether the entire frontend can trust these abstractions.

### Failure Impact Assessment

**P1 — CRITICAL**:
- Hook causes infinite loops: app broken
- Cleanup missing: memory leaks accumulate
- Crypto runs on main thread: app freezes during transfer
- Secret not zeroed: key exposed in memory

**P2 — HIGH**:
- Hook missing dependency: stale closure bugs
- WebRTC backpressure not handled: connection drops
- Error not propagated: user doesn't know what failed
- Cleanup runs too often: connections thrash

**P3 — MEDIUM**:
- Hook re-renders too often: perceived performance degradation
- Type missing: IDE autocomplete doesn't work
- JSDoc unclear: confusion about hook usage
- No fallback: hook crashes if dependency unavailable

### Operational Rules

1. **Controllers, not stores**: Hooks never access `useStore.getState()` directly
2. **Single responsibility**: One hook, one job (composition for complex behaviors)
3. **Fully typed**: Parameter and return types always specified
4. **Clean up**: useEffect cleanup must release resources
5. **Crypto off main thread**: Heavy operations in Web Workers
6. **Error handling**: All async hooks handle errors explicitly
7. **Dependencies complete**: Linter rule enforced (`exhaustive-deps`)
8. **Test coverage**: All hooks have unit tests (mount, update, cleanup)

---

## AGENT 055 — PERFORMANCE-HAWK

```
┌─────────────────────────────────────────────────────────────────┐
│ CODENAME: PERFORMANCE-HAWK                                      │
│ ROLE: Master of Speed & Core Web Vitals                         │
│ CLEARANCE: SECRET // FRONTEND-ARCHITECTURE                      │
│ REPORTS TO: DC-ECHO (050)                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Mission Statement

Own performance across all dimensions: page load speed (Core Web Vitals), runtime performance (60fps interactions), bundle size, and memory footprint. Every optimization is data-driven. Every choice is justified.

### Scope of Authority

**Core Web Vitals** (Google's performance metrics):
- **FCP** (First Contentful Paint) < 2.0s (when first content appears)
- **LCP** (Largest Contentful Paint) < 2.5s (when main content loads)
- **CLS** (Cumulative Layout Shift) < 0.1 (visual stability — no jumps)
- **FID** (First Input Delay) < 100ms (responsiveness to user input)
- **TTFB** (Time to First Byte) < 600ms (server response time)

**Runtime Performance**:
- Interactive elements respond in < 100ms (feels instant)
- Scrolling smooth at 60fps (not janky)
- Animations smooth at 60fps
- Large lists virtualized (rendering 10k+ items doesn't lag)
- Heavy operations in Web Workers (crypto, compression)

**Bundle Size**:
- Total JS < 350KB gzipped (Lighthouse budget)
- Vendor JS < 200KB gzipped (third-party libs)
- App JS < 150KB gzipped (own code)
- CSS < 50KB gzipped
- No unused code (tree-shaking verified)

**Memory Management**:
- No memory leaks (heap returns to baseline after operations)
- Long transfers don't accumulate memory (streaming, not buffering)
- Crypto keys cleared (no keys left in memory after use)
- Event listeners cleaned up (no dangling subscriptions)

### Optimizations Owned

**Load Time Optimizations**:
- Code splitting: Heavy components lazy-loaded
- Image optimization: Next.js Image, WebP, responsive sizes
- Font optimization: Preload critical fonts, async non-critical
- CSS optimization: CSS-in-JS tree-shaken, unused styles removed
- JavaScript optimization: Minified, tree-shaken, gzipped
- Streaming SSR: Progressive rendering, not waiting for all data

**Runtime Optimizations**:
- React.memo: Expensive components wrapped to prevent re-renders
- useMemo: Expensive computations memoized
- useCallback: Callback refs stable across renders
- Virtual lists: TanStack Table virtualization for large datasets
- Web Workers: Crypto, compression, hashing off main thread
- RequestAnimationFrame: Smooth animations, not setTimeout

**Bundle Optimizations**:
- Dynamic imports: Heavy features loaded on-demand
- Route-based splitting: Code split by route
- Vendor optimization: Large libraries loaded async
- Polyfill elimination: No polyfills if native support available
- Tree shaking: Unused exports removed

### Deliverables Table

| Deliverable | Owner | Status | Deadline | Notes |
|-------------|-------|--------|----------|-------|
| Lighthouse CI setup | 055 | Complete | Week 1 | Performance budgets in CI |
| Core Web Vitals monitoring | 055 | Complete | Week 2 | Real-user monitoring (RUM) |
| Bundle size tracking | 055 | In Progress | Week 3 | Per-route bundle analysis |
| Code splitting strategy | 055 | In Progress | Week 4 | Route-based, feature-based |
| Image optimization | 055 | Pending | Week 5 | WebP, responsive, lazy-load |
| Font optimization | 055 | Pending | Week 6 | Preload critical, async others |
| Web Worker migration | 055 | Pending | Week 7 | Crypto, compression off main |
| Performance benchmarks | 055 | Pending | Week 8 | 1GB transfer speed baseline |

### Quality Standards

**Core Web Vitals Targets** (100% must-pass):
- FCP: < 2.0s (all pages, all devices)
- LCP: < 2.5s (all pages, all devices)
- CLS: < 0.1 (zero layout shifts)
- Speed Index: < 3.5s (page visually complete)
- Lighthouse score: ≥ 90 (green)

**Runtime Performance Targets**:
- User interactions: < 100ms latency (feels instant)
- Scrolling: 60fps smoothness (no jank)
- Animations: 60fps smoothness
- WebRTC data transfer: > 100MB/s on LAN
- Encryption throughput: > 500MB/s (WASM)

**Bundle Size Targets**:
- Total JS: < 350KB gzipped
- Per-route: < 50KB gzipped (incentivizes splitting)
- Vendor: < 200KB gzipped
- No route over 100KB (heavy routes split)

**Memory Targets**:
- Baseline: < 50MB (fresh load)
- After 1GB transfer: returns to baseline
- Long-running (24h): no growth
- Crypto keys: cleared within 5s of use

### Monitoring Tools

**Tools Used**:
- Lighthouse CI (automated performance testing)
- Web Vitals library (real-user performance data)
- Bundle analyzer (webpack/rollup plugin, size breakdowns)
- Chrome DevTools (profiling, memory snapshots)
- Sentry (error tracking, performance monitoring)
- Datadog/New Relic (optional APM)

### Inter-Agent Dependencies

**NEXTJS-STRATEGIST (051)**: Image/font optimization strategy
**STATE-ARCHITECT (052)**: Store update latency, selector performance
**TYPESCRIPT-ENFORCER (053)**: Type checking doesn't slow build
**HOOK-ENGINEER (054)**: Hook re-render frequency optimization
**COMPONENT-FORGER (032)**: Component render complexity
**MOTION-CHOREOGRAPHER (033)**: Animation smoothness, 60fps target
**DATA-VISUALIZER (058)**: Chart rendering performance
**WASM-ALCHEMIST (059)**: WASM module performance, fallback JS
**PERFORMANCE-PROFILER (081)**: Load testing, memory profiling

### Contribution to the Whole

Performance is a feature. Users notice speed and remember slowness. Tallow's competitive advantage includes instant transfers; if the UI is sluggish, the experience is ruined. This agent ensures the frontend is fast enough that users trust the product with large files.

### Failure Impact Assessment

**P1 — CRITICAL**:
- LCP > 3s: users bounce before transfer page loads
- FCP > 2.5s: perceived slowness
- Main thread blocked: transfers stall
- Memory leak: app slows down over time

**P2 — HIGH**:
- CLS > 0.1: layout shift confuses users
- Scrolling janky: perceived performance problem
- Crypto on main thread: app freezes during encryption
- Bundle too large: slow on mobile networks

**P3 — MEDIUM**:
- Lighthouse score < 90: fails automated testing
- Route bundle > 100KB: slow route loading
- Image not optimized: slower download
- Animation not 60fps: smooth but not perfect

### Operational Rules

1. **Measure before optimizing**: Don't guess; use Lighthouse, DevTools
2. **Performance budget enforced**: CI blocks PRs that exceed limits
3. **Core Web Vitals first**: FCP, LCP, CLS are top priority
4. **Bundle size tracked**: Every PR shows bundle diff
5. **Heavy operations off main thread**: Crypto, compression, hashing in Web Workers
6. **Code split aggressively**: Route-based and feature-based splitting
7. **Real-user monitoring enabled**: Track performance in production
8. **Monthly performance review**: Team reviews metrics, optimizes top targets

---

## AGENT 056 — ACCESSIBILITY-GUARDIAN

```
┌─────────────────────────────────────────────────────────────────┐
│ CODENAME: ACCESSIBILITY-GUARDIAN                                │
│ ROLE: Master of WCAG Compliance & Inclusive Design              │
│ CLEARANCE: SECRET // FRONTEND-ARCHITECTURE                      │
│ REPORTS TO: DC-ECHO (050)                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Mission Statement

Ensure Tallow is usable by everyone: keyboard-only users, screen reader users, low-vision users, motor-impaired users. WCAG 2.1 AA compliance is non-negotiable. Accessibility isn't a feature; it's a baseline.

### Scope of Authority

**WCAG 2.1 AA Requirements** (Level AA compliance):
- **Perceivable**: Text must be readable, images must have alt text, color not sole indicator
- **Operable**: All functionality keyboard accessible, enough time for actions, no seizure risks
- **Understandable**: Text clear and simple, pages predictable, errors explained
- **Robust**: Code valid HTML/ARIA, compatible with assistive technologies

**Accessibility Standards Owned**:
- Color contrast: 4.5:1 for normal text, 3:1 for large text (18pt+)
- Keyboard navigation: Tab, Shift+Tab, Enter, Escape, Arrow keys
- Focus management: Visible focus indicators, focus trapped in modals
- ARIA labels: Every form input labeled, buttons describe action
- Screen readers: Content announced correctly, landmarks defined
- Reduced motion: Respect `prefers-reduced-motion` system setting
- Zoom support: Page readable at 200% zoom
- Mobile accessibility: Touch targets 44px+, gestures available

### Keyboard Accessibility Standard

```typescript
// ✓ All interactive elements keyboard-accessible

// Button
<button onClick={handler} aria-label="Send file">
  Send
</button>
// Inherently keyboard-accessible

// Custom element (requires ARIA)
<div role="button" tabIndex={0} onClick={handler} onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') handler();
}}>
  Custom button
</div>
// Manually keyboard-accessible

// Form input
<input type="text" placeholder="Search" aria-label="Search devices" />
// Inherently keyboard-accessible

// Modal
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  {/* Focus trapped inside modal, Escape closes */}
</Dialog>
// Focus management automatic with Radix
```

### Deliverables Table

| Deliverable | Owner | Status | Deadline | Notes |
|-------------|-------|--------|----------|-------|
| WCAG 2.1 AA checklist | 056 | Complete | Week 1 | All requirements documented |
| Color contrast audit | 056 | Complete | Week 2 | All colors verified ≥ 4.5:1 |
| Keyboard navigation audit | 056 | In Progress | Week 3 | Tab through every feature |
| ARIA labels (all 141 components) | 056 | In Progress | Week 4 | Describe purpose, state |
| Screen reader testing | 056 | Pending | Week 5 | NVDA, JAWS, VoiceOver |
| Focus management | 056 | Pending | Week 6 | Visible indicators, trap in modals |
| Reduced motion support | 056 | Pending | Week 7 | Respect OS preference |
| Accessibility test suite | 056 + 077 | Pending | Week 8 | axe-playwright, automated testing |

### Quality Standards

**Color Contrast** (WCAG AA compliance):
- Normal text (< 18pt): 4.5:1 ratio
- Large text (≥ 18pt): 3:1 ratio
- UI components (borders, icons): 3:1 ratio
- Verified in all 4 themes (dark, light, forest, ocean)
- No color-only indicators (use color + pattern/icon)

**Keyboard Navigation**:
- All buttons, links, form inputs: Tab-accessible
- Logical tab order (top-left to bottom-right)
- No keyboard traps (can Tab out of every element)
- Keyboard shortcuts consistent (Escape to close, Enter to submit)
- Skip to main content link available

**ARIA Labels**:
- Form inputs: `<label htmlFor="id">` or `aria-label`
- Buttons: Label describes action ("Send file" not "Submit")
- Icons: `aria-label` if icon alone (else label adjacent)
- Interactive regions: `aria-expanded`, `aria-pressed` for state
- Live regions: `aria-live="polite"` for dynamic updates

**Focus Management**:
- Focus visible: 2px border minimum (high contrast)
- Focus indicator always visible (not outline: none)
- Focus trapped in modals (Tab cycles within)
- Focus restored when modal closes
- Initial focus set appropriately (first input in form, etc.)

**Screen Reader Support**:
- Semantic HTML used (not div everywhere)
- Landmark regions defined (`<main>`, `<nav>`, `<aside>`)
- Headings hierarchical (h1 > h2 > h3, no skipping levels)
- Lists marked up as lists (`<ul>`, `<ol>`, `<li>`)
- Links have descriptive text (not "Click here")

### Inter-Agent Dependencies

**COMPONENT-FORGER (032)**: Components built with accessibility in mind
**FORM-ARCHITECT (036)**: Form inputs fully labeled, error messages announced
**MODAL-MASTER (042)**: Modal focus trapping, keyboard dismissal
**MOTION-CHOREOGRAPHER (033)**: Animations respect `prefers-reduced-motion`
**THEME-ALCHEMIST (034)**: Color contrast maintained in all themes
**ICON-ARMORER (038)**: Icons have alt text or labels
**RESPONSIVE-COMMANDER (049)**: Touch targets 44px+ on mobile
**E2E-INFILTRATOR (077)**: Accessibility automated testing (axe-playwright)

### Contribution to the Whole

Accessibility is about inclusion. 1 in 4 people have some form of disability (vision, hearing, motor, cognitive). Making Tallow usable by everyone expands the addressable market and does the right thing. WCAG 2.1 AA compliance is the industry standard.

### Failure Impact Assessment

**P1 — CRITICAL**:
- Color contrast < 3:1: text unreadable for low-vision users
- No keyboard navigation: keyboard-only users locked out
- Modal focus not trapped: users navigate outside modal accidentally
- Form inputs unlabeled: screen reader users lost

**P2 — HIGH**:
- Focus indicator invisible: can't see where user is
- ARIA labels wrong: screen reader announces incorrectly
- Skip link missing: users must Tab through entire nav
- Headings non-hierarchical: screen reader structure broken

**P3 — MEDIUM**:
- Animations don't respect `prefers-reduced-motion`: disorienting
- Touch targets < 44px: hard to tap on mobile
- Images lack alt text: decorative images (low priority)
- Landmark regions undefined: structure unclear to screen readers

### Operational Rules

1. **WCAG 2.1 AA baseline**: All public features must comply
2. **Keyboard first**: If it's not keyboard-accessible, it's not done
3. **Color + pattern**: Never use color alone to convey information
4. **Test with real assistive tech**: Automated testing catches 50%; manual catches the rest
5. **Focus visible always**: Use visible focus indicators (not `outline: none`)
6. **Semantic HTML default**: Use `<button>` not `<div>` for buttons
7. **ARIA when necessary**: Only use ARIA to fix accessibility gaps in HTML
8. **User testing with disabled users**: Include accessibility users in testing

---

## AGENT 057 — I18N-DIPLOMAT

```
┌─────────────────────────────────────────────────────────────────┐
│ CODENAME: I18N-DIPLOMAT                                         │
│ ROLE: Master of 22 Languages & RTL Support                      │
│ CLEARANCE: SECRET // FRONTEND-ARCHITECTURE                      │
│ REPORTS TO: DC-ECHO (050)                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Mission Statement

Tallow works in 22 languages including RTL languages (Arabic, Hebrew, Urdu, Farsi). Own the i18n system, translation keys, locale formatting, and bi-directional text support. Users should feel like the app was built for their language.

### Scope of Authority

**Languages Supported** (22 total):

**LTR (Left-to-Right)** (14 languages):
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Dutch (nl)
- Swedish (sv)
- Polish (pl)
- Russian (ru)
- Japanese (ja)
- Chinese Simplified (zh-CN)
- Chinese Traditional (zh-TW)
- Korean (ko)

**RTL (Right-to-Left)** (8 languages):
- Arabic (ar)
- Hebrew (he)
- Urdu (ur)
- Persian/Farsi (fa)
- Kurdish (ckb)
- Egyptian Arabic (ar-EG)
- Gulf Arabic (ar-AE)
- Uyghur (ug)

**i18n Implementation**:
- `next-intl` library for routing, middleware, translations
- Translation files: `messages/[locale].json` (400+ keys per language)
- Locale detection: Browser language → fallback to English
- Persistent preference: localStorage stores user's language choice
- Dynamic locale switching: No page reload
- Translation management: Professional translator review required

### Formatting by Locale

**Date Formatting**:
- US: `12/25/2024`
- UK: `25/12/2024`
- Germany: `25.12.2024`
- China: `2024年12月25日`
- Japan: `2024/12/25`

**Number Formatting**:
- US: `1,000.00`
- Germany: `1.000,00`
- France: `1 000,00`
- China: `1,000.00` (same as US)

**Time Formatting**:
- US: `3:30 PM`
- Europe: `15:30`
- Japan: `15時30分`

**Currency Formatting**:
- US: `$1,000.00`
- Europe: `€1.000,00`
- Japan: `¥100,000`

### RTL Special Handling

```typescript
// ✓ RTL-safe component
function TransferCard({ direction = 'ltr' }) {
  return (
    <div dir={direction} style={{
      textAlign: direction === 'rtl' ? 'right' : 'left',
      marginRight: direction === 'rtl' ? '0' : '1rem',
      marginLeft: direction === 'rtl' ? '1rem' : '0',
    }}>
      {/* Content automatically mirrors in RTL */}
    </div>
  );
}

// In RTL:
// - Sidebar moves to right
// - Text aligns right
// - Icons flip (if directional)
// - Modals anchor to right
// - Scrollbars on left (if browser supports)
```

### Deliverables Table

| Deliverable | Owner | Status | Deadline | Notes |
|-------------|-------|--------|----------|-------|
| next-intl setup | 057 | Complete | Week 1 | Routing, middleware, locale |
| 22 language translation files | 057 | Complete | Week 2 | 400+ keys per language |
| Professional translator review | 057 | Complete | Week 3 | Native speakers validate |
| RTL styling for all components | 057 | In Progress | Week 4 | Logical properties, flexbox |
| Date/number/currency formatting | 057 | In Progress | Week 5 | Locale-aware Intl API |
| Language selector UI | 057 | Pending | Week 6 | Accessible language switcher |
| RTL testing matrix (8 languages) | 057 | Pending | Week 7 | Visual + functional testing |
| Translation management system | 057 | Pending | Week 8 | Crowdin or similar integration |

### Quality Standards

**Translation Quality** (100% compliance):
- No machine translation (Google Translate not acceptable)
- Native speaker review for all languages
- Context provided to translators (how key is used)
- Consistency: Same term always translated same way
- Completeness: 100% of UI keys translated

**RTL Quality**:
- Layout mirrors correctly (sidebar → right, buttons → right-to-left)
- Text alignment correct (right-aligned in RTL)
- Icons directional where appropriate (arrow points right in LTR, left in RTL)
- Numbers formatted per locale (1,000 vs 1.000)
- No hard-coded LTR text (all i18n keys)

**Locale Formatting Quality**:
- Date: `format(date, 'P', { locale: userLocale })`
- Time: `format(date, 'p', { locale: userLocale })`
- Number: `new Intl.NumberFormat(locale).format(number)`
- Currency: `new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(number)`

**Fallback Chains**:
- User selected locale → browser language → English (fallback)
- If language not supported: Portuguese → Spanish → English
- Partial translations: Missing key shows key name (doesn't crash)

### Inter-Agent Dependencies

**COPY-STRATEGIST (046)**: Translation keys, localization-friendly copy
**COMPONENT-FORGER (032)**: RTL-safe component styling
**RESPONSIVE-COMMANDER (049)**: RTL mobile layouts
**FORM-ARCHITECT (036)**: Form labels in all languages
**ACCESSIBILITY-GUARDIAN (056)**: RTL screen reader support
**THEME-ALCHEMIST (034)**: RTL theme application

### Contribution to the Whole

Tallow is a global product. Users in Saudi Arabia, France, Japan, and Brazil should all feel at home. This agent ensures the app doesn't just work in multiple languages; it feels native in each one. Language and locale are fundamental to user experience.

### Failure Impact Assessment

**P1 — CRITICAL**:
- No translations: app in English for non-English users
- RTL layout broken: sidebar on wrong side, text unreadable
- Key missing translation: Key name shown instead of translation
- Date/number formatted wrong: Wrong format confuses users

**P2 — HIGH**:
- Machine translation poor: Awkward phrasing, wrong terminology
- Language selector hidden: Users can't change language
- RTL icons not flipped: Directional indicators wrong direction
- Locale formatting ignored: Dates in US format everywhere

**P3 — MEDIUM**:
- Some strings not translatable: Hardcoded text in components
- Plural rules wrong: "1 files" instead of "1 file"
- RTL line-height weird: Text cramped or spaced strangely

### Operational Rules

1. **All UI text is i18n key**: No hardcoded strings (except dev-only debug text)
2. **Native speaker review mandatory**: Machine translation not acceptable
3. **RTL-first styling**: Use logical properties (`insetInlineStart` not `left`)
4. **Locale-aware formatting**: Date/number/currency always formatted per locale
5. **Complete translations only**: Partial translations release as English
6. **Fallback chain clear**: RTL language missing → English, not broken
7. **Professional management**: Use Crowdin or similar for translator coordination
8. **Regular audits**: Quarterly review to catch missing keys, translation drift

---

## AGENT 058 — DATA-VISUALIZER

```
┌─────────────────────────────────────────────────────────────────┐
│ CODENAME: DATA-VISUALIZER                                       │
│ ROLE: Master of Charts & Visual Data Representation             │
│ CLEARANCE: SECRET // FRONTEND-ARCHITECTURE                      │
│ REPORTS TO: DC-ECHO (050)                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Mission Statement

Visualize transfer performance, connection quality, and usage statistics in ways that inform without overwhelming. Own charts, graphs, and real-time data visualizations. Data must be accessible (color-blind safe, screen-reader friendly) and performant (real-time updates don't lag).

### Scope of Authority

**Charts & Visualizations Owned**:
- Transfer speed chart (MB/s over time, linear graph)
- Connection quality indicators (excellent/good/fair/poor)
- Bandwidth utilization (real-time bar chart)
- Transfer history (timeline of completed transfers)
- Device network topology (peer connections graph)
- Storage usage breakdown (pie chart by file type)
- File upload/download progress (circular progress indicator)
- Encryption progress (streaming visualization)

**Charting Library**:
- Recharts for time-series and statistical data (MIT licensed, React-native)
- D3.js for complex topology graphs (if needed)
- Canvas-based for real-time performance graphs (if Recharts too slow)
- Fallback: SVG if canvas not supported

**Real-Time Data Updates**:
- Transfer speed: Update every 500ms (not every frame = smooth but not laggy)
- Connection quality: Update every 1s
- Progress: Update on chunk completion (not every byte)
- No re-render thrashing: Use React context to push data, not pull

### Deliverables Table

| Deliverable | Owner | Status | Deadline | Notes |
|-------------|-------|--------|----------|-------|
| Transfer speed chart (Recharts) | 058 | Complete | Week 1 | MB/s over time |
| Connection quality visualization | 058 | Complete | Week 2 | 4 quality levels, color-coded |
| Bandwidth utilization chart | 058 | In Progress | Week 3 | Real-time bar chart |
| Transfer history timeline | 058 | In Progress | Week 4 | Completed transfers per day |
| Device network topology graph | 058 | Pending | Week 5 | Peer connections visualization |
| Storage breakdown pie chart | 058 | Pending | Week 6 | Usage by file type |
| Progress circular indicator | 058 | Pending | Week 7 | File transfer progress |
| Accessibility for all charts | 058 + 056 | Pending | Week 8 | Color-blind safe, aria-labels |

### Quality Standards

**Chart Quality** (100% compliance):
- Correct data representation (no misleading axes, proper scale)
- Accessible colors (not red/green only, color-blind safe)
- Legends provided (what does each color mean?)
- Axis labels clear (MB/s, time, etc.)
- Responsive: Mobile readability maintained

**Real-Time Performance**:
- Update frequency: Not more than necessary (500ms for speed, 1s for quality)
- No re-render thrashing: One update, one render, not ten re-renders
- Memory stable: Charts don't accumulate data indefinitely
- CPU usage low: Chart updates don't spike CPU

**Accessibility**:
- Color + pattern: Not color-alone indicators
- ARIA labels: Charts described for screen readers
- Data table fallback: Data available in table form
- High contrast: Chart visible in all themes

### Inter-Agent Dependencies

**STATE-ARCHITECT (052)**: Real-time data from transfer state
**HOOK-ENGINEER (054)**: `useChartData` hook for reactive updates
**PERFORMANCE-HAWK (055)**: Chart rendering performance
**THEME-ALCHEMIST (034)**: Chart colors work in all themes
**ACCESSIBILITY-GUARDIAN (056)**: Chart accessibility labels

### Contribution to the Whole

Data visualization helps users understand what's happening during transfers. A user who can see "transfer is 50% done and running at 50MB/s" feels more confident than one who sees a progress bar. This agent makes the invisible visible.

### Failure Impact Assessment

**P1 — CRITICAL**:
- Chart data wrong: Misleading user about transfer progress
- Chart crashes: UI broken when transfer starts
- Chart memory leak: Long transfers leak memory accumulating data

**P2 — HIGH**:
- Chart not color-blind safe: Color-blind users can't read it
- Chart unresponsive on mobile: Data hidden on small screens
- Chart too slow: Real-time updates lag

**P3 — MEDIUM**:
- Chart missing labels: Unclear what data represents
- Chart not in all themes: Invisible in one theme
- Chart not accessible to screen readers: Can't describe

### Operational Rules

1. **Correct data representation**: Never mislead with scale/axes
2. **Color-blind safe**: Test with Color Blind Simulator plugin
3. **Real-time but not excessive**: Update only when data changes meaningfully
4. **Accessible always**: Aria-labels, data table fallback, legend
5. **Theme aware**: Charts visible and beautiful in all 4 themes
6. **Mobile responsive**: Data visible at 320px width
7. **Performance budgeted**: Chart updates don't exceed performance limits

---

## AGENT 059 — WASM-ALCHEMIST

```
┌─────────────────────────────────────────────────────────────────┐
│ CODENAME: WASM-ALCHEMIST                                        │
│ ROLE: Master of Rust → WebAssembly Performance Module           │
│ CLEARANCE: SECRET // FRONTEND-ARCHITECTURE                      │
│ REPORTS TO: DC-ECHO (050)                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Mission Statement

Compile performance-critical Rust code to WebAssembly for >10x speedup over JavaScript. Own BLAKE3 hashing (target >1GB/s), ML-KEM-768 encryption, and Zstandard compression. Rust → WASM is an optimization, not a requirement; JavaScript fallback always available.

### Scope of Authority

**WASM Module Owned**:
- BLAKE3 cryptographic hashing: > 1GB/s throughput (vs ~100MB/s JS)
- ML-KEM-768 key encapsulation: > 500 ops/sec (vs ~50 JS)
- Zstandard compression: > 500MB/s compression (vs ~50MB/s JS)
- File chunking: Split files into chunks efficiently
- Entropy analysis: Quick pre-compression analysis

**WASM Build Pipeline**:
- Rust source: `wasm-tallow/src/lib.rs`
- Build tool: `wasm-pack build --target web`
- Output: `wasm-tallow/pkg/index_bg.wasm` (binary)
- Wrapper: `lib/wasm/tallow-wasm.ts` (TypeScript interface)
- Fallback: Pure JavaScript implementation in `lib/crypto/blake3-js.ts`

**Fallback Strategy**:
1. Try WASM (check if available)
2. If unavailable or error: Fall back to JavaScript
3. JavaScript is always functional (slower but works)
4. User doesn't notice which version runs (transparent)

### WASM Module Interface

```typescript
// lib/wasm/tallow-wasm.ts (TypeScript wrapper)
export type WasmModule = {
  blake3: (data: Uint8Array) => Uint8Array;
  blake3_streaming: (chunks: Uint8Array[]) => Uint8Array;
  zstandard_compress: (data: Uint8Array, level: number) => Uint8Array;
  zstandard_decompress: (data: Uint8Array) => Uint8Array;
  ml_kem_768_encaps: (publicKey: Uint8Array) => Uint8Array;
  ml_kem_768_decaps: (ciphertext: Uint8Array, secretKey: Uint8Array) => Uint8Array;
};

// Lazy-load WASM
let wasmPromise: Promise<WasmModule> | null = null;

export async function getWasmModule(): Promise<WasmModule> {
  if (!wasmPromise) {
    wasmPromise = import('./tallow_wasm').catch(() => null);
  }
  return wasmPromise;
}

// Usage with fallback
export async function blake3Hash(data: Uint8Array): Promise<Uint8Array> {
  const wasm = await getWasmModule();
  if (wasm) {
    try {
      return wasm.blake3(data);
    } catch (err) {
      console.error('WASM blake3 failed, falling back to JS', err);
    }
  }
  return blake3Js(data); // JavaScript fallback
}
```

### Deliverables Table

| Deliverable | Owner | Status | Deadline | Notes |
|-------------|-------|--------|----------|-------|
| Rust project setup (wasm-pack) | 059 | Complete | Week 1 | Cargo.toml, build config |
| BLAKE3 Rust implementation | 059 | Complete | Week 2 | Port to Rust, optimize |
| ML-KEM-768 Rust implementation | 059 | Complete | Week 3 | Post-quantum, benchmarked |
| Zstandard Rust binding | 059 | In Progress | Week 4 | zstd crate integration |
| WASM build pipeline | 059 | In Progress | Week 5 | wasm-pack, optimization |
| JavaScript fallback for all WASM | 059 | Pending | Week 6 | blake3-js, ml-kem-js, zstd-js |
| WASM lazy-loading | 059 | Pending | Week 7 | Async load, cache, fallback |
| Performance benchmarks | 059 | Pending | Week 8 | WASM vs JS speed comparison |

### Quality Standards

**WASM Performance Targets**:
- BLAKE3: > 1GB/s (1,000 MB/s minimum)
- ML-KEM-768 encaps: > 500 ops/sec
- Zstandard: > 500MB/s compression
- Load time: < 500ms (lazy-loaded, not blocking)
- Memory: < 5MB heap for WASM module

**Fallback Reliability** (100% compliance):
- Fallback JavaScript always available
- Fallback produces same output as WASM (bit-identical hash)
- Fallback used transparently (user doesn't notice)
- No errors exposed to user (all caught, logged, recovered)

**Build Quality**:
- WASM module < 200KB gzipped (bundle size budget)
- Rust code builds without warnings
- Dependencies audited for security
- Cross-platform: Works on all supported targets

**Testing Standards**:
- NIST test vectors: WASM blake3 matches official vectors
- Fallback equivalence: JS and WASM produce identical output
- Benchmark tests: Performance meets targets
- Error handling: Gracefully falls back on WASM load failure

### Inter-Agent Dependencies

**PERFORMANCE-HAWK (055)**: WASM performance benchmarks, bundle size
**HOOK-ENGINEER (054)**: Hooks use WASM module transparently
**CRYPTO-KEYSMITH (006)**: Crypto correctness, test vectors
**UNIT-TEST-SNIPER (076)**: WASM test suite, fallback equivalence
**COMPATIBILITY-SCOUT (082)**: WASM support matrix (which browsers)

### Contribution to the Whole

WASM is the difference between "acceptable" and "excellent" performance. A 10x speedup in encryption means a 1GB file encrypts 10x faster. This agent provides the performance advantage that makes Tallow competitive with native applications while maintaining full web compatibility.

### Failure Impact Assessment

**P1 — CRITICAL**:
- WASM doesn't load: falls back to JS (slower, still works)
- WASM module wrong output: data corrupted (security)
- Fallback doesn't exist: WASM failure = crash

**P2 — HIGH**:
- WASM slower than JS: defeats purpose
- WASM bloats bundle: kills page load performance
- WASM unavailable on some browsers: inconsistent performance
- Fallback doesn't match: inconsistent hash values

**P3 — MEDIUM**:
- WASM load blocking: page waits for crypto module
- Memory not released: WASM module leaks memory
- Rust code has warnings: not production-ready

### Operational Rules

1. **Always have fallback**: WASM is optimization, not requirement
2. **Performance measured**: WASM must be faster than JS (not slower)
3. **Bit-identical output**: WASM and JS must produce same hash
4. **Lazy loaded**: WASM doesn't block initial page load
5. **Bundle size budgeted**: WASM < 200KB gzipped
6. **Error handling transparent**: WASM failures caught, logged, recovered
7. **Cross-browser compatible**: Test on all target browsers
8. **Regular benchmarking**: Monthly performance checks against targets

---

# ═══════════════════════════════════════════════════════════════════
# DIVISION INTEROPERABILITY & HANDOFF PROTOCOLS
# ═══════════════════════════════════════════════════════════════════

## DELTA ↔ ECHO Collaboration Model

**UX-OPS defines** the user flows and requirements.
**FRONTEND implements** the technical architecture to execute them.

### Example: Send File Flow

1. **FLOW-NAVIGATOR (044)** designs the flow: Device → File picker → Encryption → Progress
2. **NEXTJS-STRATEGIST (051)** creates routes: `/transfer`, `/transfer/settings`, modal for encryption options
3. **STATE-ARCHITECT (052)** designs state: `selectedFiles`, `encryptionLevel` in Zustand
4. **COPY-STRATEGIST (046)** writes labels: "Select files", "Choose encryption level", "Sending..."
5. **ONBOARD-GUIDE (045)** creates tutorial: First send flow highlighted with tooltips
6. **COMPONENT-FORGER (032)** builds UI: File picker, encryption selector, progress bar
7. **MOTION-CHOREOGRAPHER (033)** animates: File entry animation, progress smoothness
8. **RESPONSIVE-COMMANDER (049)** adapts: Mobile file picker, tablet file preview
9. **TYPESCRIPT-ENFORCER (053)** types: File[], encryptionLevel type, FileSelection Zod schema
10. **HOOK-ENGINEER (054)** implements: `useFileUpload`, `useEncryption` hooks
11. **PERFORMANCE-HAWK (055)** optimizes: Lazy-load file picker, virtualize large lists
12. **ACCESSIBILITY-GUARDIAN (056)** audits: File picker keyboard-accessible, screen reader support
13. **TRUST-BUILDER (048)** ensures: PQC badge shows during encryption, connection security visible
14. **UNIT-TEST-SNIPER (076)** tests: All hooks, file validation
15. **E2E-INFILTRATOR (077)** verifies: Send flow works end-to-end

---

# ═══════════════════════════════════════════════════════════════════
# END OF DIVISION DELTA & ECHO OPERATIONS MANUAL
# CLASSIFICATION: SECRET // TALLOW // NOFORN
# ═══════════════════════════════════════════════════════════════════

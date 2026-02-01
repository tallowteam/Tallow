# Roadmap: Tallow UI Foundation

## Overview

This roadmap delivers a complete UI foundation for Tallow, the post-quantum
secure P2P file transfer application. Starting with design system infrastructure
and progressing through component layers, we build from CSS tokens through base
components, Radix primitives, hero animations, transfer UI, layout, pages, and
finally wire everything to the existing lib/ transfer logic for a working
end-to-end file transfer experience.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Design system infrastructure (CSS tokens,
      Tailwind, animations) ✓ Completed 2026-02-01
- [x] **Phase 2: Base Components** - Core UI primitives (Button, Input, Card,
      Badge) ✓ Completed 2026-02-01
- [x] **Phase 3: Radix Components** - Accessible overlays and controls (Dialog,
      Tooltip, Select, Switch) ✓ Completed 2026-02-01
- [x] **Phase 4: Hero Components** - Signature animated elements (DropZone,
      TransferProgress, EncryptionIndicator, ConnectionLine) ✓ Completed
      2026-02-01
- [x] **Phase 5: Transfer Components** - File and connection display (FileList,
      TransferComplete, DeviceCard, ConnectionStatus) ✓ Completed 2026-02-01
- [x] **Phase 6: Layout** - Application structure (Header, Sidebar, PageLayout,
      responsive) ✓ Completed 2026-02-01
- [x] **Phase 7: Pages** - Application screens (Home, Settings, Devices,
      History) ✓ Completed 2026-02-01
- [ ] **Phase 8: Hooks** - Integration with existing lib/ (useTransfer,
      useWebRTC, useCrypto, useSignaling)
- [ ] **Phase 9: Integration** - End-to-end file transfer working with new UI

## Phase Details

### Phase 1: Foundation

**Goal**: Design system infrastructure is in place and working **Depends on**:
Nothing (first phase) **Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04,
FOUND-05, FOUND-06, FOUND-07, FOUND-08 **Success Criteria** (what must be TRUE):

1. CSS variables render correct colors/spacing when inspected in browser
   devtools
2. Tailwind classes using design tokens (bg-surface, text-secondary, etc.) work
   in any component
3. Animation variants can be imported and applied to motion elements
4. Geist fonts load and display correctly on page
5. cn() utility merges classes correctly (tested with conflicting Tailwind
   classes) **Plans**: TBD

Plans:

- [ ] 01-01: TBD

### Phase 2: Base Components

**Goal**: Core UI primitives are usable across the application **Depends on**:
Phase 1 **Requirements**: BASE-01, BASE-02, BASE-03, BASE-04, BASE-05, BASE-06,
BASE-07, BASE-08, BASE-09 **Success Criteria** (what must be TRUE):

1. User can see and interact with all button variants (primary, secondary,
   ghost, etc.) with correct colors and hover states
2. User can type in Input fields with visible focus rings and see error/hint
   states
3. Card components display content with correct backgrounds and optional hover
   elevation
4. Badge components show status labels with appropriate semantic colors
5. All components respond to disabled state (reduced opacity, no pointer events)
   **Plans**: TBD

Plans:

- [ ] 02-01: TBD

### Phase 3: Radix Components

**Goal**: Accessible overlay and control components are ready for use **Depends
on**: Phase 2 **Requirements**: RADIX-01, RADIX-02, RADIX-03, RADIX-04,
RADIX-05, RADIX-06 **Success Criteria** (what must be TRUE):

1. User can open/close Dialog with animated overlay, use keyboard to navigate,
   and close with Escape
2. User can hover elements and see Tooltip after brief delay with proper
   animation
3. User can click Select/Dropdown and choose options from animated menu
4. User can toggle Switch on/off with visible state change and animation
5. All components maintain focus correctly and support keyboard navigation
   **Plans**: TBD

Plans:

- [ ] 03-01: TBD

### Phase 4: Hero Components

**Goal**: Signature animated components that define the Tallow visual experience
**Depends on**: Phase 3 **Requirements**: HERO-01, HERO-02, HERO-03, HERO-04,
HERO-05, HERO-06, HERO-07, HERO-08, HERO-09, HERO-10, HERO-11, HERO-12, HERO-13,
HERO-14 **Success Criteria** (what must be TRUE):

1. User can drag files onto DropZone and see visual feedback (glow, icon
   animation, state changes)
2. User can see TransferProgress displaying file info with animated progress bar
   and glow effects
3. User can see EncryptionIndicator with SVG ring animation and lock icon spring
   effect
4. User can see ConnectionLine animating between connected peers with pulse
   effect
5. All hero components smoothly transition between their states (idle, active,
   complete) **Plans**: TBD

Plans:

- [ ] 04-01: TBD

### Phase 5: Transfer Components

**Goal**: File and connection display components are functional **Depends on**:
Phase 4 **Requirements**: XFER-01, XFER-02, XFER-03, XFER-04, XFER-05, XFER-06,
XFER-07, XFER-08 **Success Criteria** (what must be TRUE):

1. User can see list of selected files with formatted sizes and remove
   individual files
2. User can see animated checkmark and ring burst when transfer completes
3. User can see peer devices with connection status indicators
4. ConnectionStatus component shows clear state (disconnected, connecting,
   connected) **Plans**: TBD

Plans:

- [ ] 05-01: TBD

### Phase 6: Layout

**Goal**: Application shell provides consistent navigation and structure
**Depends on**: Phase 5 **Requirements**: LAYOUT-01, LAYOUT-02, LAYOUT-03,
LAYOUT-04 **Success Criteria** (what must be TRUE):

1. User sees consistent Header with navigation across all pages
2. User can navigate using Sidebar to different sections
3. Page content renders within PageLayout wrapper with correct padding/margins
4. Layout adapts appropriately to different viewport sizes **Plans**: TBD

Plans:

- [ ] 06-01: TBD

### Phase 7: Pages

**Goal**: Application screens are navigable and display appropriate content
**Depends on**: Phase 6 **Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04
**Success Criteria** (what must be TRUE):

1. User can access Home page with DropZone ready to receive files
2. User can see file list and transfer progress on Home page after selecting
   files
3. User can access Settings page with configurable options
4. User can access Connections page showing available/connected peers **Plans**:
   TBD

Plans:

- [ ] 07-01: TBD

### Phase 8: Hooks

**Goal**: React hooks connect UI to existing lib/ functionality **Depends on**:
Phase 7 **Requirements**: INTG-01, INTG-02, INTG-03, INTG-04 **Success
Criteria** (what must be TRUE):

1. useTransfer hook returns transfer state and methods that work with
   lib/transfer/
2. useWebRTC hook manages peer connections using lib/webrtc/
3. useCrypto hook provides encryption status from lib/crypto/
4. useSignaling hook connects to signaling server via lib/signaling/ **Plans**:
   TBD

Plans:

- [ ] 08-01: TBD

### Phase 9: Integration

**Goal**: End-to-end file transfer works through the new UI **Depends on**:
Phase 8 **Requirements**: INTG-05 **Success Criteria** (what must be TRUE):

1. User can select files via DropZone on Home page
2. User can see connected peers and initiate transfer
3. User can observe encryption indicator during key exchange
4. User can watch transfer progress with live updates
5. User sees transfer complete animation when files are received **Plans**: TBD

Plans:

- [ ] 09-01: TBD

## Progress

**Execution Order:** Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6
-> 7 -> 8 -> 9

| Phase                  | Plans Complete | Status      | Completed  |
| ---------------------- | -------------- | ----------- | ---------- |
| 1. Foundation          | 1/1            | Complete    | 2026-02-01 |
| 2. Base Components     | 1/1            | Complete    | 2026-02-01 |
| 3. Radix Components    | 1/1            | Complete    | 2026-02-01 |
| 4. Hero Components     | 1/1            | Complete    | 2026-02-01 |
| 5. Transfer Components | 1/1            | Complete    | 2026-02-01 |
| 6. Layout              | 1/1            | Complete    | 2026-02-01 |
| 7. Pages               | 1/1            | Complete    | 2026-02-01 |
| 8. Hooks               | 0/?            | Not started | -          |
| 9. Integration         | 0/?            | Not started | -          |

---

_Created: 2025-02-01_ _Last updated: 2025-02-01_

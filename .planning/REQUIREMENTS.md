# Requirements: Tallow UI Foundation

**Defined:** 2025-02-01 **Core Value:** Secure file transfer with premium,
responsive UI

## v1 Requirements

Requirements for complete UI foundation with working file transfer.

### Foundation

- [ ] **FOUND-01**: globals.css with all CSS variables (colors, typography,
      spacing, shadows)
- [ ] **FOUND-02**: Tailwind config extended with design tokens
- [ ] **FOUND-03**: cn() utility function (clsx + tailwind-merge)
- [ ] **FOUND-04**: Animation config (durations, easings)
- [ ] **FOUND-05**: Animation variants (fade, scale, stagger, modal, dropdown,
      tooltip, toast, drawer)
- [ ] **FOUND-06**: Micro-interaction helpers (buttonTap, cardHover, iconHover,
      listItemHover)
- [ ] **FOUND-07**: Hero animation variants (dropZone, encryption, connection,
      progress, success)
- [ ] **FOUND-08**: Geist fonts configured in layout.tsx

### Base Components

- [ ] **BASE-01**: Button component with variants (primary, secondary, ghost,
      outline, danger, success, link)
- [ ] **BASE-02**: Button sizes (xs, sm, md, lg, xl, icon, icon-sm, icon-lg)
- [ ] **BASE-03**: Button loading state with spinner
- [ ] **BASE-04**: Input component with label, error, hint, icons
- [ ] **BASE-05**: Input focus animation with ring
- [ ] **BASE-06**: Card component with variants (default, elevated, interactive,
      glow)
- [ ] **BASE-07**: Card sub-components (Header, Title, Description, Content,
      Footer)
- [ ] **BASE-08**: Badge component with variants (default, primary, success,
      warning, error, info, outline)
- [ ] **BASE-09**: Badge sizes (sm, md, lg)

### Radix Components

- [ ] **RADIX-01**: Dialog with animated overlay and content
- [ ] **RADIX-02**: Dialog sub-components (Header, Title, Description, Footer,
      Close)
- [ ] **RADIX-03**: Tooltip with animation
- [ ] **RADIX-04**: TooltipProvider wrapper
- [ ] **RADIX-05**: Select/Dropdown with animation
- [ ] **RADIX-06**: Switch/Toggle component

### Hero Components

- [ ] **HERO-01**: DropZone with idle/hover/active states
- [ ] **HERO-02**: DropZone icon bob animation on hover
- [ ] **HERO-03**: DropZone glow effect on drag active
- [ ] **HERO-04**: DropZone file validation (size, type)
- [ ] **HERO-05**: TransferProgress with file info display
- [ ] **HERO-06**: TransferProgress bar with animation
- [ ] **HERO-07**: TransferProgress glow effect during transfer
- [ ] **HERO-08**: TransferProgress states (encrypting, transferring, complete)
- [ ] **HERO-09**: EncryptionIndicator with SVG ring animation
- [ ] **HERO-10**: EncryptionIndicator lock icon spring animation
- [ ] **HERO-11**: EncryptionIndicator states (idle, encrypting, complete)
- [ ] **HERO-12**: ConnectionLine with path animation
- [ ] **HERO-13**: ConnectionLine pulse effect when connected
- [ ] **HERO-14**: ConnectionLine states (disconnected, connecting, connected)

### Transfer Components

- [ ] **XFER-01**: FileList component showing selected files
- [ ] **XFER-02**: FileList with file size formatting
- [ ] **XFER-03**: FileList remove file action
- [ ] **XFER-04**: TransferComplete with checkmark animation
- [ ] **XFER-05**: TransferComplete ring burst effect
- [ ] **XFER-06**: DeviceCard showing peer device info
- [ ] **XFER-07**: DeviceCard connection status indicator
- [ ] **XFER-08**: ConnectionStatus component with states

### Layout Components

- [ ] **LAYOUT-01**: Header component with navigation
- [ ] **LAYOUT-02**: Sidebar component with navigation
- [ ] **LAYOUT-03**: PageLayout wrapper component
- [ ] **LAYOUT-04**: Responsive layout behavior

### Pages

- [ ] **PAGE-01**: Home/Transfer page with DropZone
- [ ] **PAGE-02**: Home page file list and transfer progress
- [ ] **PAGE-03**: Settings page
- [ ] **PAGE-04**: Connections page with peer list

### Integration

- [ ] **INTG-01**: useTransfer hook connecting to lib/transfer/
- [ ] **INTG-02**: useWebRTC hook connecting to lib/webrtc/
- [ ] **INTG-03**: useCrypto hook for encryption status from lib/crypto/
- [ ] **INTG-04**: useSignaling hook connecting to lib/signaling/
- [ ] **INTG-05**: End-to-end file transfer working with new UI

## v2 Requirements

Deferred to future release.

- Light theme support
- Mobile responsive optimization
- Additional Radix components (Accordion, Tabs, ScrollArea)
- QR code for peer connection
- Transfer history
- Settings persistence

## Out of Scope

| Feature               | Reason                               |
| --------------------- | ------------------------------------ |
| Backend/API changes   | Existing lib/ code is the foundation |
| Crypto implementation | Already complete in lib/crypto/      |
| Mobile native apps    | Desktop/web first                    |
| Production signaling  | Separate infrastructure concern      |
| Unit test framework   | Separate milestone                   |

## Traceability

| Requirement | Phase | Status  |
| ----------- | ----- | ------- |
| FOUND-01    | 1     | Pending |
| FOUND-02    | 1     | Pending |
| FOUND-03    | 1     | Pending |
| FOUND-04    | 1     | Pending |
| FOUND-05    | 1     | Pending |
| FOUND-06    | 1     | Pending |
| FOUND-07    | 1     | Pending |
| FOUND-08    | 1     | Pending |
| BASE-01     | 2     | Pending |
| BASE-02     | 2     | Pending |
| BASE-03     | 2     | Pending |
| BASE-04     | 2     | Pending |
| BASE-05     | 2     | Pending |
| BASE-06     | 2     | Pending |
| BASE-07     | 2     | Pending |
| BASE-08     | 2     | Pending |
| BASE-09     | 2     | Pending |
| RADIX-01    | 3     | Pending |
| RADIX-02    | 3     | Pending |
| RADIX-03    | 3     | Pending |
| RADIX-04    | 3     | Pending |
| RADIX-05    | 3     | Pending |
| RADIX-06    | 3     | Pending |
| HERO-01     | 4     | Pending |
| HERO-02     | 4     | Pending |
| HERO-03     | 4     | Pending |
| HERO-04     | 4     | Pending |
| HERO-05     | 4     | Pending |
| HERO-06     | 4     | Pending |
| HERO-07     | 4     | Pending |
| HERO-08     | 4     | Pending |
| HERO-09     | 5     | Pending |
| HERO-10     | 5     | Pending |
| HERO-11     | 5     | Pending |
| HERO-12     | 5     | Pending |
| HERO-13     | 5     | Pending |
| HERO-14     | 5     | Pending |
| XFER-01     | 6     | Pending |
| XFER-02     | 6     | Pending |
| XFER-03     | 6     | Pending |
| XFER-04     | 6     | Pending |
| XFER-05     | 6     | Pending |
| XFER-06     | 6     | Pending |
| XFER-07     | 6     | Pending |
| XFER-08     | 6     | Pending |
| LAYOUT-01   | 7     | Pending |
| LAYOUT-02   | 7     | Pending |
| LAYOUT-03   | 7     | Pending |
| LAYOUT-04   | 7     | Pending |
| PAGE-01     | 8     | Pending |
| PAGE-02     | 8     | Pending |
| PAGE-03     | 8     | Pending |
| PAGE-04     | 8     | Pending |
| INTG-01     | 9     | Pending |
| INTG-02     | 9     | Pending |
| INTG-03     | 9     | Pending |
| INTG-04     | 9     | Pending |
| INTG-05     | 10    | Pending |

**Coverage:**

- v1 requirements: 55 total
- Mapped to phases: 55
- Unmapped: 0 ✓

---

_Requirements defined: 2025-02-01_ _Last updated: 2025-02-01 after initial
definition_

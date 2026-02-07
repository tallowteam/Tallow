# Visual Code Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Tallow Room System                          │
│                                                                   │
│  ┌─────────────────┐         ┌──────────────────┐               │
│  │ User Creates    │────────>│ Room Code        │               │
│  │ Room            │         │ Generated        │               │
│  └─────────────────┘         │ (e.g., ABC123)   │               │
│                               └────────┬─────────┘               │
│                                        │                         │
│                                        ▼                         │
│                               ┌──────────────────┐               │
│                               │ RoomCodeConnect  │               │
│                               │ Component        │               │
│                               └────────┬─────────┘               │
│                                        │                         │
│                   ┌────────────────────┼────────────────┐        │
│                   │                    │                │        │
│                   ▼                    ▼                ▼        │
│          ┌────────────────┐   ┌────────────┐  ┌──────────────┐  │
│          │ Share Link     │   │ Copy Code  │  │ Show Visual  │  │
│          │ Button         │   │ Button     │  │ Code Button  │  │
│          └────────────────┘   └────────────┘  └──────┬───────┘  │
│                                                       │          │
│                                                       ▼          │
│                                              ┌──────────────────┐│
│                                              │ Visual Code      ││
│                                              │ Generator        ││
│                                              └────────┬─────────┘│
│                                                       │          │
│                                                       ▼          │
│                                              ┌──────────────────┐│
│                                              │ Display/Download ││
│                                              └──────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Visual Code Generation Pipeline

```
Input (Room Code)
     │
     │  "ABC123"
     │
     ▼
┌─────────────────┐
│ URL Construction│
│                 │
│ /transfer?room= │
│     ABC123      │
└────────┬────────┘
         │
         │  https://tallow.app/transfer?room=ABC123
         │
         ▼
┌─────────────────┐
│  Hash Function  │
│                 │
│  simpleHash()   │
└────────┬────────┘
         │
         │  Hash values
         │
         ▼
┌─────────────────┐
│  Color Mapping  │
│                 │
│  Grid 12x12     │
└────────┬────────┘
         │
         │  Color array
         │
         ▼
┌─────────────────┐
│  SVG Generation │
│                 │
│  + Corners      │
│  + Grid cells   │
│  + Background   │
└────────┬────────┘
         │
         │  SVG markup
         │
         ▼
┌─────────────────┐
│ Base64 Encoding │
│                 │
│  btoa()         │
└────────┬────────┘
         │
         │  data:image/svg+xml;base64,...
         │
         ▼
    Data URL
    (Ready for display)
```

## Component Hierarchy

```
RoomCodeConnect
│
├── inputSection (Join mode)
│   ├── input (Room code entry)
│   └── joinButton
│
├── createButton (Create mode)
│
└── codeDisplay (In-room view - Host only)
    │
    ├── codeContainer
    │   └── code (ABC123)
    │
    ├── shareButtons
    │   ├── shareButton (Share Link)
    │   └── copyCodeButton (Copy Code)
    │
    ├── qrButton (NEW)
    │   └── QRCodeIcon
    │
    └── qrCodeContainer (NEW - Conditional)
        │
        ├── qrCodeWrapper
        │   └── qrCodeImage
        │       └── <img src={dataURL} />
        │
        ├── qrCodeHint
        │   └── "Scan or share..."
        │
        └── downloadButton (NEW)
            └── DownloadIcon
```

## State Flow

```
┌──────────────────┐
│  Initial State   │
│                  │
│  showQRCode:     │
│  false           │
└────────┬─────────┘
         │
         │  User clicks "Show Visual Code"
         │
         ▼
┌──────────────────┐
│  Toggle State    │
│                  │
│  setShowQRCode   │
│  (true)          │
└────────┬─────────┘
         │
         │  Trigger re-render
         │
         ▼
┌──────────────────┐
│  Conditional     │
│  Render          │
│                  │
│  {showQRCode &&  │
│   <QRDisplay />} │
└────────┬─────────┘
         │
         │  Generate visual code
         │
         ▼
┌──────────────────┐
│  Visual Code     │
│  Generation      │
│                  │
│  generateEnhanced│
│  VisualCodeDataURL│
└────────┬─────────┘
         │
         │  Return data URL
         │
         ▼
┌──────────────────┐
│  Display Image   │
│                  │
│  <img src={url}> │
└──────────────────┘

User Actions:
│
├─> Click "Hide" ─────> setShowQRCode(false) ─────> Hide container
│
└─> Click "Download" ──> downloadVisualCode() ─────> Save SVG file
```

## Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                        Component Props                        │
│  - selectedFiles: File[]                                      │
│  - onConnect?: (roomCode: string) => void                     │
│  - initialRoomCode?: string                                   │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    useRoomConnection Hook                     │
│  - activeRoomCode: string                                     │
│  - isHost: boolean                                            │
│  - isInRoom: boolean                                          │
│  - members: Member[]                                          │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    Local Component State                      │
│  - showQRCode: boolean                                        │
│  - copied: boolean                                            │
│  - copiedLink: boolean                                        │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    Visual Code Generator                      │
│                                                                │
│  Input:  activeRoomCode + window.location.origin              │
│  Output: data:image/svg+xml;base64,...                        │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                          UI Render                            │
│  - Display visual code image                                  │
│  - Show download button                                       │
│  - Enable user interactions                                   │
└──────────────────────────────────────────────────────────────┘
```

## File Structure

```
c:\Users\aamir\Documents\Apps\Tallow\
│
├── lib/
│   └── utils/
│       ├── qr-code-generator.ts              [Core Generator]
│       │   ├── simpleHash()
│       │   ├── stringToColor()
│       │   ├── generateVisualCodeData()
│       │   ├── generateVisualCodeSVG()
│       │   ├── generateVisualCodeDataURL()
│       │   ├── generateEnhancedVisualCode()
│       │   ├── generateEnhancedVisualCodeDataURL()
│       │   └── downloadVisualCode()
│       │
│       ├── qr-code-generator.test.ts         [Unit Tests]
│       └── QR_CODE_README.md                 [Technical Docs]
│
├── components/
│   └── transfer/
│       ├── RoomCodeConnect.tsx               [Main Component]
│       │   ├── QRCodeIcon()
│       │   ├── DownloadIcon()
│       │   ├── handleToggleQRCode()
│       │   └── handleDownloadQRCode()
│       │
│       ├── RoomCodeConnect.module.css        [Component Styles]
│       │   ├── .qrButton
│       │   ├── .qrCodeContainer
│       │   ├── .qrCodeWrapper
│       │   ├── .qrCodeImage
│       │   └── .downloadButton
│       │
│       ├── VisualCodeDemo.tsx                [Demo Component]
│       ├── VisualCodeDemo.module.css         [Demo Styles]
│       └── QR_CODE_INTEGRATION_GUIDE.md      [Integration Docs]
│
└── [Root Documentation]
    ├── QR_CODE_FEATURE_SUMMARY.md            [Feature Overview]
    ├── QR_CODE_IMPLEMENTATION_CHECKLIST.md   [Completion Checklist]
    ├── QR_CODE_QUICK_REFERENCE.md            [Quick Reference]
    └── QR_CODE_ARCHITECTURE.md               [This File]
```

## Visual Code Structure

```
┌─────────────────────────────────────┐
│  SVG Canvas (256x256px)             │
│  ┌───────────────────────────────┐  │
│  │ Background (white, rounded)   │  │
│  │                               │  │
│  │  ┌──┐                         │  │
│  │  │██│  Top-Left Marker        │  │
│  │  │  │  (3x3 positioning)      │  │
│  │  └──┘                         │  │
│  │                               │  │
│  │     ● ● ● ● ● ●              │  │
│  │     ● ● ● ● ● ●   Data Grid  │  │
│  │     ● ● ● ● ● ●   (12x12)    │  │
│  │     ● ● ● ● ● ●              │  │
│  │     ● ● ● ● ● ●              │  │
│  │                               │  │
│  │                       ┌──┐    │  │
│  │  Top-Right Marker     │██│    │  │
│  │  (3x3 positioning)    │  │    │  │
│  │                       └──┘    │  │
│  │                               │  │
│  │  ┌──┐                         │  │
│  │  │██│  Bottom-Left Marker     │  │
│  │  │  │  (3x3 positioning)      │  │
│  │  └──┘                         │  │
│  └───────────────────────────────┘  │
│                                     │
│  Padding: 16px                      │
│  Border Radius: 12px                │
└─────────────────────────────────────┘

Legend:
┌──┐
│██│  = Positioning square (corner marker)
└──┘

 ●   = Data cell (colored circle from hash)
```

## User Interaction Flow

```
User Journey: Sharing a Room

1. Create Room
   │
   ├─> User clicks "Create a Room"
   │
   └─> Room code generated (e.g., "ABC123")

2. View Share Options
   │
   ├─> Share Link button displayed
   ├─> Copy Code button displayed
   └─> Show Visual Code button displayed (NEW)

3. Show Visual Code
   │
   ├─> User clicks "Show Visual Code"
   │
   ├─> Visual code container slides down
   │
   └─> Visual code image displayed

4. Use Visual Code
   │
   ├─> Option A: Screenshot and share
   │
   └─> Option B: Click "Download" button
       │
       └─> SVG file saved to device

5. Recipient Actions
   │
   ├─> Receive visual code image
   │
   ├─> Read room code from visual pattern
   │
   └─> Enter code in "Join Room" interface
```

## CSS Architecture

```
Design Token Flow

Global Tokens (app/globals.css)
     │
     ├─> --space-* (spacing scale)
     ├─> --color-* (color palette)
     ├─> --font-* (typography)
     ├─> --radius-* (border radius)
     └─> --transition-* (animations)
             │
             ▼
Component Styles (RoomCodeConnect.module.css)
     │
     ├─> .qrButton
     │   ├─> padding: var(--space-3) var(--space-4)
     │   ├─> color: var(--color-text)
     │   ├─> background: var(--color-surface)
     │   ├─> border-radius: var(--radius-lg)
     │   └─> transition: var(--transition-fast)
     │
     ├─> .qrCodeContainer
     │   ├─> gap: var(--space-3)
     │   ├─> padding: var(--space-4)
     │   ├─> background: var(--color-bg)
     │   └─> animation: slideDown 0.3s
     │
     └─> .qrCodeImage
         ├─> width: 256px
         ├─> height: 256px
         └─> image-rendering: crisp-edges
```

## Performance Optimization

```
Render Cycle

Initial Render
     │
     └─> showQRCode = false
         │
         └─> No visual code generated (saves CPU)

User clicks "Show Visual Code"
     │
     └─> setState(showQRCode = true)
         │
         └─> Trigger re-render
             │
             └─> Generate visual code (< 1ms)
                 │
                 └─> Display image (instant)

User clicks "Hide Visual Code"
     │
     └─> setState(showQRCode = false)
         │
         └─> Unmount container
             │
             └─> Free memory
```

## Error Handling

```
Error Flow

generateEnhancedVisualCodeDataURL()
     │
     ├─> Input validation
     │   ├─> Empty URL? → Return empty string
     │   └─> Invalid options? → Use defaults
     │
     ├─> Hash generation
     │   └─> Always succeeds (deterministic)
     │
     ├─> SVG generation
     │   └─> String concatenation (no errors)
     │
     └─> Base64 encoding
         ├─> btoa() supported? → Encode
         └─> Not supported? → Fallback (rare)

downloadVisualCode()
     │
     ├─> Blob creation
     │   └─> Memory available? → Create blob
     │
     ├─> URL creation
     │   └─> Browser supports? → Create URL
     │
     ├─> Download trigger
     │   └─> User interaction? → Download
     │
     └─> Cleanup
         └─> Revoke URL (prevent memory leak)
```

## Security Model

```
Security Boundaries

User Input (Room Code)
     │
     │  Sanitization: None needed (alphanumeric only)
     │
     ▼
URL Construction
     │
     │  Validation: Standard URL format
     │
     ▼
Hash Generation
     │
     │  Security: Deterministic, no secrets
     │
     ▼
SVG Generation
     │
     │  Security: No user input in SVG content
     │
     ▼
Base64 Encoding
     │
     │  Security: Browser-native, safe
     │
     ▼
Data URL
     │
     │  Usage: Client-side only, no transmission
     │
     └─> No XSS, no injection, no leakage
```

## Future Architecture

```
Planned Enhancements

Phase 1: Current Implementation ✓
     │
     └─> Visual code generation
         └─> Manual entry required

Phase 2: Camera Integration
     │
     ├─> Add camera access
     ├─> Image recognition
     └─> Auto-extract room code

Phase 3: Real QR Codes
     │
     ├─> Integrate QR library
     ├─> Standard QR encoding
     └─> Universal scanner support

Phase 4: Advanced Features
     │
     ├─> NFC tap-to-share
     ├─> Animated codes
     └─> Custom branding
```

---

**Document Version**: 1.0.0
**Last Updated**: 2026-02-06
**Maintainer**: Frontend Developer Agent

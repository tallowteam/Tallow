# Tallow Architecture Diagrams

Professional, educational, and theme-aware React components visualizing Tallow's system architecture and cryptographic flows.

## Overview

This directory contains four comprehensive architecture diagrams designed for documentation, presentations, and educational purposes. All diagrams are:

- **Theme-aware**: Automatically adapt to light, dark, and high-contrast modes
- **Responsive**: Mobile-first design that works on all screen sizes
- **Accessible**: WCAG compliant with proper ARIA labels and keyboard navigation
- **Educational**: Detailed annotations explaining each component and process
- **Customizable**: Toggle labels, adjust sizing, and modify styling

## Available Diagrams

### 1. System Architecture Diagram

**Component**: `SystemArchitectureDiagram`

High-level overview showing:
- Client applications (Web/Mobile)
- Signaling server infrastructure
- STUN/TURN servers for NAT traversal
- P2P connection flow
- Storage layers (IndexedDB)
- Security components

**Use Cases**:
- System overview presentations
- Architecture documentation
- Onboarding new developers
- Technical discussions

### 2. WebRTC Connection Flow Diagram

**Component**: `WebRTCFlowDiagram`

Step-by-step connection establishment:
1. **Signaling**: Exchange SDP offers/answers
2. **ICE Candidates**: Network path discovery
3. **DTLS Handshake**: Secure connection
4. **DataChannel**: Bidirectional stream
5. **P2P Transfer**: Direct file transfer

**Use Cases**:
- WebRTC education
- Connection troubleshooting
- Network debugging guides
- Technical blog posts

### 3. Encryption Flow Diagram

**Component**: `EncryptionFlowDiagram`

Complete encryption pipeline:
1. **Hybrid Key Generation**: ML-KEM-768 + X25519
2. **Key Exchange**: Secure public key swap
3. **File Chunking**: 64KB segments
4. **Per-Chunk Encryption**: ChaCha20-Poly1305
5. **Encrypted Stream**: Secure transmission

**Use Cases**:
- Security documentation
- Cryptography education
- Compliance reports
- Security audits

### 4. Triple Ratchet Protocol Diagram

**Component**: `TripleRatchetDiagram`

Advanced key rotation system:
- **Root Chain**: Master key derivation
- **Sending Chain**: Outbound message keys
- **Receiving Chain**: Inbound message keys
- **Forward Secrecy**: Past message security
- **Post-Compromise Security**: Self-healing

**Use Cases**:
- Advanced cryptography docs
- Security researcher presentations
- Protocol specification
- Academic discussions

## Installation & Usage

### Basic Usage

```tsx
import {
  SystemArchitectureDiagram,
  WebRTCFlowDiagram,
  EncryptionFlowDiagram,
  TripleRatchetDiagram,
} from '@/components/diagrams';

// Use in your component
export function MyPage() {
  return (
    <div>
      <h1>System Overview</h1>
      <SystemArchitectureDiagram />
    </div>
  );
}
```

### With Options

```tsx
<WebRTCFlowDiagram
  showLabels={true}        // Show/hide detailed labels
  className="max-w-4xl"    // Custom styling
/>
```

### All Diagrams

```tsx
export function ArchitectureGuide() {
  const [showLabels, setShowLabels] = useState(true);

  return (
    <div className="space-y-12">
      <section>
        <h2>System Architecture</h2>
        <SystemArchitectureDiagram showLabels={showLabels} />
      </section>

      <section>
        <h2>Connection Flow</h2>
        <WebRTCFlowDiagram showLabels={showLabels} />
      </section>

      <section>
        <h2>Encryption Pipeline</h2>
        <EncryptionFlowDiagram showLabels={showLabels} />
      </section>

      <section>
        <h2>Key Rotation</h2>
        <TripleRatchetDiagram showLabels={showLabels} />
      </section>
    </div>
  );
}
```

## Props

All diagram components share the same props interface:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `undefined` | Additional CSS classes for the container |
| `showLabels` | `boolean` | `true` | Show/hide detailed annotations and descriptions |

## Styling & Theming

### Theme Support

Diagrams automatically adapt to your application's theme:

```tsx
// Light mode
<div className="light">
  <SystemArchitectureDiagram />
</div>

// Dark mode
<div className="dark">
  <SystemArchitectureDiagram />
</div>

// High contrast mode
<div className="high-contrast">
  <SystemArchitectureDiagram />
</div>
```

### Custom Styling

```tsx
// Constrain width
<WebRTCFlowDiagram className="max-w-3xl mx-auto" />

// Add spacing
<EncryptionFlowDiagram className="my-8 p-6" />

// Custom background
<TripleRatchetDiagram className="bg-muted rounded-xl" />
```

## Responsive Behavior

All diagrams use responsive design patterns:

### Desktop (≥768px)
- Horizontal flow layouts
- Multi-column grids
- Expanded labels and descriptions

### Mobile (<768px)
- Vertical flow layouts
- Single-column stacking
- Compact labels
- Touch-friendly interactions

## Accessibility Features

- **Semantic HTML**: Proper heading hierarchy
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard access
- **Focus Management**: Clear focus indicators
- **Color Contrast**: WCAG AA/AAA compliant
- **Reduced Motion**: Respects `prefers-reduced-motion`

## Color Coding

Diagrams use consistent color coding:

| Color | Purpose | Example |
|-------|---------|---------|
| Blue | Signaling & Communication | Signaling server, WebSocket |
| Purple | Key Management | Key generation, Root chain |
| Green | Security & Encryption | Encryption, Secure channels |
| Orange | Processing | File chunking, Data transformation |
| Pink | Peer Operations | Sending, Receiving |
| Teal | Network Services | STUN, Network discovery |
| Rose | Fallback Services | TURN relay |
| Violet | Storage | IndexedDB, Persistence |

## Animation Details

### Entrance Animations
- **Fade-in**: Smooth opacity transition
- **Stagger delays**: Sequential reveal (100ms intervals)
- **Scale transitions**: Subtle size changes on load

### Interactive Animations
- **Hover effects**: Scale up, shadow increase
- **Spin indicators**: Rotating icons for active processes
- **Pulse effects**: Status indicators and connections

### Performance
- CSS-based animations
- GPU-accelerated transforms
- Reduced motion support
- No JavaScript animation libraries

## File Structure

```
components/diagrams/
├── README.md                          # This file
├── index.ts                           # Barrel export
├── webrtc-flow-diagram.tsx            # WebRTC connection flow
├── encryption-flow-diagram.tsx        # Encryption pipeline
├── triple-ratchet-diagram.tsx         # Key rotation protocol
└── system-architecture-diagram.tsx    # Overall system architecture
```

## Demo Page

Visit `/architecture-diagrams` to see all diagrams in action with interactive controls.

## Technical Details

### Dependencies
- **React**: ^18.3.0
- **lucide-react**: Icon library
- **Tailwind CSS**: Styling framework
- **TypeScript**: Type safety

### Icons Used
All icons from `lucide-react`:
- `Monitor`, `Smartphone`: Devices
- `Server`, `Cloud`: Infrastructure
- `Key`, `Lock`, `Shield`: Security
- `ArrowRight`, `RotateCw`: Flow indicators
- `Database`, `HardDrive`: Storage
- `Wifi`, `Radio`, `Globe`: Network

## Best Practices

### Performance
```tsx
// Lazy load diagrams for better initial load
const SystemArchitectureDiagram = lazy(() =>
  import('@/components/diagrams').then(m => ({
    default: m.SystemArchitectureDiagram
  }))
);
```

### Documentation
```tsx
// In documentation, show labels by default
<WebRTCFlowDiagram showLabels={true} />

// In presentations, hide for cleaner look
<WebRTCFlowDiagram showLabels={false} />
```

### Print Styling
```tsx
// Optimize for print/export
<div className="print:bg-white print:text-black">
  <SystemArchitectureDiagram />
</div>
```

## Export & Sharing

While the diagrams are React components, you can:

1. **Screenshot**: Use browser tools to capture
2. **PDF Export**: Print to PDF from browser
3. **SVG Export**: Convert to SVG via browser rendering
4. **Embed**: Include in documentation sites

## Contributing

When adding new diagrams:

1. Follow the existing component structure
2. Use consistent color coding
3. Include both labeled and unlabeled modes
4. Ensure responsive behavior
5. Add proper TypeScript types
6. Document all props
7. Test in all theme modes

## Examples

### Documentation Site

```tsx
import { WebRTCFlowDiagram } from '@/components/diagrams';

export function DocsPage() {
  return (
    <article>
      <h1>WebRTC Connection Process</h1>
      <p>Learn how peers establish connections...</p>
      <WebRTCFlowDiagram showLabels={true} />
    </article>
  );
}
```

### Presentation Mode

```tsx
export function PresentationSlide() {
  return (
    <div className="h-screen flex items-center justify-center">
      <EncryptionFlowDiagram
        showLabels={false}
        className="max-w-5xl"
      />
    </div>
  );
}
```

### Interactive Tutorial

```tsx
export function InteractiveTutorial() {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div>
      <SystemArchitectureDiagram
        showLabels={currentStep >= 2}
        className="mb-8"
      />
      <TutorialSteps step={currentStep} />
    </div>
  );
}
```

## Support

For issues or questions:
- Check the demo page at `/architecture-diagrams`
- Review this README
- Examine component source code
- Check Tallow's main documentation

## License

These diagrams are part of the Tallow project and follow the same license.

---

**Created for Tallow** - Secure, post-quantum file transfer

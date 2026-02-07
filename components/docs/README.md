# Documentation Components

Interactive documentation system with collapsible sidebar navigation.

## Overview

Production-ready sidebar navigation for Tallow documentation with search, filtering, and active section tracking.

## Components

### DocsSidebar
Responsive sidebar with 9 main sections covering all Tallow features.

**Features:**
- Collapsible sections with smooth animations
- Real-time search and filtering
- Active section highlighting with purple accent
- Sticky positioning on desktop
- Slide-in drawer on mobile
- Full accessibility support

## Quick Start

```tsx
import { DocsSidebar } from '@/components/docs';

<DocsSidebar
  activeSection="#introduction"
  onLinkClick={(href) => scrollToSection(href)}
  isMobileMenuOpen={isOpen}
  onMobileMenuClose={() => setIsOpen(false)}
/>
```

## Documentation Sections

1. **Getting Started**
   - Introduction
   - Quick Start
   - Installation
   - Configuration

2. **File Transfer**
   - Basic Transfer
   - Group Transfers
   - Resumable Transfers
   - Large Files

3. **Security & Encryption**
   - Encryption Overview
   - Post-Quantum Cryptography
   - Key Exchange
   - Digital Signatures

4. **Privacy Features**
   - Privacy Mode
   - Metadata Stripping
   - Onion Routing
   - IP Protection

5. **Chat System**
   - Secure Messaging
   - End-to-End Encryption
   - Message Storage
   - File Sharing

6. **Room System**
   - Creating Rooms
   - Room Codes
   - Multi-Device Transfer
   - Room Security

7. **Device Discovery**
   - mDNS Discovery
   - Local Network
   - NAT Traversal
   - TURN Servers

8. **API Reference**
   - REST API
   - WebSocket API
   - Authentication
   - Rate Limiting

9. **Deployment**
   - Self-Hosting
   - Docker Setup
   - Environment Variables
   - Production Tips

## Visual Structure

```
┌─────────────────────────────────────────────────────┐
│ Header (Fixed)                                       │
└─────────────────────────────────────────────────────┘
┌──────────────┬──────────────────────────────────────┐
│              │                                       │
│  Sidebar     │  Main Content                         │
│  (280px)     │                                       │
│              │  ┌─────────────────────────────────┐ │
│  [Search]    │  │ Hero Section                     │ │
│              │  └─────────────────────────────────┘ │
│  ▼ Getting   │                                       │
│    Started   │  ┌─────────────────────────────────┐ │
│    • Intro   │  │ Quick Start Cards                │ │
│    • Install │  └─────────────────────────────────┘ │
│              │                                       │
│  ▶ File      │  ┌─────────────────────────────────┐ │
│    Transfer  │  │ Content Section                  │ │
│              │  └─────────────────────────────────┘ │
│  ▶ Security  │                                       │
│              │  ...more sections...                 │
│  (Sticky)    │                                       │
│              │                                       │
└──────────────┴──────────────────────────────────────┘
```

### Mobile View

```
┌─────────────────────────────┐
│ Header (Fixed)               │
└─────────────────────────────┘
│                              │
│  Main Content (Full Width)   │
│                              │
│  ┌────────────────────────┐ │
│  │ Hero Section            │ │
│  └────────────────────────┘ │
│                              │
│  ┌────────────────────────┐ │
│  │ Content Sections        │ │
│  └────────────────────────┘ │
│                              │
└──────────────────────────────┘
                    ┌─────────┐
                    │ 📱 Menu │ (Floating)
                    └─────────┘

Tap Menu → Sidebar slides in from left
```

## Files

```
components/docs/
├── DocsSidebar.tsx              # Main component (290 lines)
├── DocsSidebar.module.css       # Styles (370 lines)
├── index.ts                     # Exports
├── README.md                    # This file
├── QUICK_REFERENCE.md           # Developer guide
└── SIDEBAR_IMPLEMENTATION.md    # Full documentation
```

## Design System

### Colors
- **Accent**: `#5E5CE6` (Purple) - Active states
- **Background**: Dark theme optimized
- **Text**: Semantic color hierarchy
- **Borders**: Subtle separators

### Typography
- Section titles: 14px semibold
- Links: 14px regular
- Search input: 14px

### Spacing
- Sidebar width: 280px
- Content max-width: 900px
- Section gaps: 4px
- Link gaps: 4px

### Animations
- Expand/collapse: 200ms ease-out
- Hover states: 150ms
- Mobile drawer: 250ms

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required APIs:**
- IntersectionObserver
- CSS Custom Properties
- CSS Grid/Flexbox
- CSS Transforms

## Accessibility

- WCAG 2.1 Level AA compliant
- Keyboard navigation
- Screen reader support
- Focus indicators
- Semantic HTML
- ARIA attributes

## Performance

- IntersectionObserver for scroll tracking
- useMemo for search optimization
- GPU-accelerated animations
- Minimal re-renders
- < 50KB total bundle size

## Related Documentation

- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Developer quick start
- [SIDEBAR_IMPLEMENTATION.md](./SIDEBAR_IMPLEMENTATION.md) - Full implementation details

## Examples

See `app/docs/page.tsx` for complete working example with:
- State management
- IntersectionObserver setup
- Smooth scrolling
- Mobile menu handling

## Contributing

To add new documentation sections:

1. Add section to `sections` array in `DocsSidebar.tsx`
2. Create corresponding content section in page with `data-section` and `id`
3. Update this README with new section info

## License

Part of the Tallow project. See main LICENSE file.

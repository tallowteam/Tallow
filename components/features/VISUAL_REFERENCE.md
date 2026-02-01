# Visual Reference Guide - Landing Page Components

A visual guide to understand component layouts, spacing, and design patterns.

## Table of Contents
- [UseCaseGrid Component](#usecasegrid-component)
- [TechnologyShowcase Component](#technologyshowcase-component)
- [Spacing & Typography](#spacing--typography)
- [Color Schemes](#color-schemes)
- [Responsive Layouts](#responsive-layouts)
- [Animation States](#animation-states)

---

## UseCaseGrid Component

### Full Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                        Built for Everyone                          │
│                         (display-md)                               │
│                                                                     │
│     See how Tallow empowers different professionals with secure,   │
│               privacy-first file sharing (body-lg)                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  ┌─────────┐     │  │  ┌─────────┐     │  │  ┌─────────┐     │
│  │ Shield  │     │  │  │  Users  │     │  │  │ Palette │     │
│  │  Icon   │     │  │  │  Icon   │     │  │  │  Icon   │     │
│  └─────────┘     │  │  └─────────┘     │  │  └─────────┘     │
│                  │  │                  │  │                  │
│ Privacy          │  │ Enterprise       │  │ Creative         │
│ Advocates        │  │ Teams            │  │ Professionals    │
│                  │  │                  │  │                  │
│ Journalist       │  │ Marketing team   │  │ Photographer     │
│ protecting       │  │ sharing campaign │  │ sending RAW      │
│ sources...       │  │ assets...        │  │ files...         │
│                  │  │                  │  │                  │
│ Key Features:    │  │ Key Features:    │  │ Key Features:    │
│ ✓ Max privacy    │  │ ✓ Group transfer │  │ ✓ Large files    │
│ ✓ Tor support    │  │ ✓ Transfer rooms │  │ ✓ Folder xfer    │
│ ✓ Obfuscation    │  │ ✓ Email fallback │  │ ✓ Resumable      │
│ ✓ Metadata strip │  │ ✓ API access     │  │ ✓ Fast P2P       │
└──────────────────┘  └──────────────────┘  └──────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  ┌─────────┐     │  │  ┌─────────┐     │  │  ┌─────────┐     │
│  │  Heart  │     │  │  │  Scale  │     │  │  │  Code   │     │
│  │  Icon   │     │  │  │  Icon   │     │  │  │  Icon   │     │
│  └─────────┘     │  │  └─────────┘     │  │  └─────────┘     │
│                  │  │                  │  │                  │
│ Healthcare       │  │ Legal            │  │ Developers       │
│ Providers        │  │ Professionals    │  │                  │
│                  │  │                  │  │                  │
│ Doctor sharing   │  │ Lawyer sharing   │  │ DevOps team      │
│ patient records  │  │ case files...    │  │ sharing deploy   │
│ ...              │  │                  │  │ artifacts...     │
│                  │  │                  │  │                  │
│ Key Features:    │  │ Key Features:    │  │ Key Features:    │
│ ✓ HIPAA comply   │  │ ✓ Encryption     │  │ ✓ API access     │
│ ✓ Encryption     │  │ ✓ Access control │  │ ✓ Self-hosting   │
│ ✓ Audit trails   │  │ ✓ Transfer logs  │  │ ✓ CLI tools      │
│ ✓ Secure storage │  │ ✓ Confidential   │  │ ✓ Automation     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### Individual Card Anatomy

```
┌────────────────────────────────────────┐
│ ┌──────────┐                           │  ← 32px padding
│ │          │                           │
│ │  Shield  │ (64px container)          │  ← Icon container
│ │   Icon   │ (32px icon)               │     bg-primary/10
│ │          │                           │     rounded-xl
│ └──────────┘                           │
│                                        │
│ Privacy Advocates                      │  ← Persona (heading-md)
│                                        │     24px font-size
│                                        │     font-semibold
│                                        │
│ Journalist protecting sources while    │  ← Scenario (body-lg)
│ sharing sensitive documents            │     16px font-size
│                                        │     text-muted-foreground
│                                        │
│ KEY FEATURES                           │  ← Label (label-lg)
│                                        │     Uppercase, tracked
│ ✓ Maximum privacy mode                 │
│ ✓ Tor support                          │  ← Features list
│ ✓ Traffic obfuscation                  │     14px font-size
│ ✓ Metadata stripping                   │     Check icons
│                                        │
└────────────────────────────────────────┘
    ↑                                    ↑
  24px                                 24px
  border-radius                       border-radius
```

### Hover State

```
Before Hover:
┌────────────────────┐
│   Card Content     │  translateY(0)
│                    │  shadow-sm
└────────────────────┘

During Hover:
┌────────────────────┐
│   Card Content     │  translateY(-4px)
│                    │  shadow-xl
└────────────────────┘  border-foreground
       ↑
    -4px lift
```

---

## TechnologyShowcase Component

### Full Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                    Cutting-Edge Technology                          │
│                         (display-md)                               │
│                                                                     │
│   Powered by the latest advancements in cryptography and           │
│   peer-to-peer networking to ensure maximum security (body-lg)     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌───────────────────────────┐ ┌───────────────────────────┐ ┌──────────────────────────┐
│   ┌─────────────┐         │ │   ┌─────────────┐         │ │   ┌─────────────┐        │
│   │             │         │ │   │             │         │ │   │             │        │
│   │   Shield    │ 48px    │ │   │   Repeat    │ 48px    │ │   │     Zap     │ 48px   │
│   │    Icon     │         │ │   │    Icon     │         │ │   │    Icon     │        │
│   │             │         │ │   │             │         │ │   │             │        │
│   └─────────────┘         │ │   └─────────────┘         │ │   └─────────────┘        │
│                           │ │                           │ │                          │
│ ML-KEM-768 (Kyber)        │ │ Triple Ratchet Protocol   │ │ WebRTC DataChannels      │
│ (display-sm, 36px)        │ │ (display-sm, 36px)        │ │ (display-sm, 36px)       │
│                           │ │                           │ │                          │
│ NIST-standardized         │ │ Combined classical and    │ │ Browser-native P2P       │
│ quantum-resistant         │ │ post-quantum key          │ │ connections with         │
│ encryption protecting     │ │ rotation with auto        │ │ DTLS-SRTP encryption     │
│ against future quantum    │ │ rekeying every 5 min      │ │ and NAT traversal        │
│ computers (body-lg)       │ │ (body-lg)                 │ │ (body-lg)                │
│                           │ │                           │ │                          │
│ ─────────────────────────│ │ ─────────────────────────│ │ ─────────────────────────│
│                           │ │                           │ │                          │
│ WHY THIS MATTERS          │ │ WHY THIS MATTERS          │ │ WHY THIS MATTERS         │
│                           │ │                           │ │                          │
│ Your files stay secure    │ │ Past messages remain      │ │ Maximum speed with       │
│ even in a post-quantum    │ │ secure even if future     │ │ zero server access       │
│ world (font-medium)       │ │ keys are compromised      │ │ to your files            │
│                           │ │ (font-medium)             │ │ (font-medium)            │
│                           │ │                           │ │                          │
│ Learn More →              │ │ Learn More →              │ │ Learn More →             │
│                           │ │                           │ │                          │
└───────────────────────────┘ └───────────────────────────┘ └──────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│         Want to dive deeper into our security architecture?        │
│                                                                     │
│   ┌─────────────────────┐        ┌─────────────────────┐          │
│   │ 🛡️ Security Docs    │        │ 📖 How It Works     │          │
│   └─────────────────────┘        └─────────────────────┘          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Individual Card Anatomy

```
┌──────────────────────────────────────────────────┐
│  ┌──────────────┐                                │  ← 40px padding (lg:48px)
│  │              │                                │
│  │              │  96px container               │  ← Icon container
│  │   Shield     │  48px icon                    │     bg-primary/10
│  │     Icon     │  rounded-2xl                  │     rounded-2xl
│  │              │                                │
│  └──────────────┘                                │
│                                                  │
│  ML-KEM-768 (Kyber)                              │  ← Tech name (display-sm)
│                                                  │     36px font-size
│                                                  │     font-light
│                                                  │
│  NIST-standardized quantum-resistant             │  ← Description (body-lg)
│  encryption protecting against future            │     16px font-size
│  quantum computers                               │     text-muted-foreground
│                                                  │     leading-relaxed
│                                                  │
│  ──────────────────────────────────────────────  │  ← Divider border-t
│                                                  │
│  WHY THIS MATTERS                                │  ← Section label (label)
│                                                  │     Uppercase, tracked
│  Your files stay secure even in a                │  ← Why text
│  post-quantum world                              │     14px font-size
│                                                  │     font-medium
│                                                  │
│  Learn More →                                    │  ← Link with icon
│                                                  │     text-primary
│                                                  │     Hover: translate-x-1
└──────────────────────────────────────────────────┘
```

---

## Spacing & Typography

### UseCaseGrid Spacing

```
Section Header:
- Bottom margin: 64px (mb-16)
- Max width: 48rem (max-w-2xl)

Grid Gap:
- All breakpoints: 24px (gap-6)

Card Padding:
- All sides: 32px (p-8)

Internal Spacing:
- Icon to title: 24px (mb-6)
- Title to scenario: 12px (mb-3)
- Scenario to features: 24px (mb-6)
- Between features: 8px (space-y-2)
```

### TechnologyShowcase Spacing

```
Section Header:
- Bottom margin: 64px (mb-16)
- Max width: 48rem (max-w-3xl)

Grid Gap:
- Mobile: 24px (gap-6)
- Desktop: 32px (lg:gap-8)

Card Padding:
- Mobile: 32px (p-8)
- Desktop: 40px (lg:p-10)

Internal Spacing:
- Icon to title: 32px (mb-8)
- Title to description: 16px (mb-4)
- Description to divider: 24px (mb-6)
- Divider to why label: 24px (pt-6)
- Why label to text: 12px (mb-3)
- Why text to link: 24px (mb-6)
```

### Typography Scale

```
Display MD:
- Font size: 36px (sm:48px)
- Font family: Cormorant Garamond
- Font weight: 300 (light)
- Line height: 1.05
- Letter spacing: -0.01em

Heading MD:
- Font size: 24px (sm:30px)
- Font family: Inter
- Font weight: 600 (semibold)
- Line height: 1.2

Body LG:
- Font size: 18px
- Font family: Inter
- Font weight: 400 (normal)
- Line height: 1.625 (relaxed)
- Color: muted-foreground

Label LG:
- Font size: 14px
- Font family: Inter
- Font weight: 500 (medium)
- Text transform: uppercase
- Letter spacing: 0.15em
```

---

## Color Schemes

### Light Mode

```
Card Background:
- bg-card: #FFFFFF
- border: rgba(10, 10, 10, 0.08)

Text:
- Foreground: #0A0A0A
- Muted: #595959
- Primary: #0A0A0A

Icons:
- Icon background: primary/10
- Icon color: primary (#0A0A0A)

Shadows:
- Default: 0 2px 4px rgba(0, 0, 0, 0.04)
- Hover: 0 12px 40px -12px rgba(0, 0, 0, 0.15)
```

### Dark Mode

```
Card Background:
- bg-card: #1A1A1A
- border: rgba(245, 245, 245, 0.15)

Text:
- Foreground: #F5F5F5
- Muted: #A8A8A8
- Primary: #F5F5F5

Icons:
- Icon background: primary/10
- Icon color: primary (#F5F5F5)

Shadows:
- Default: 0 2px 4px rgba(0, 0, 0, 0.5)
- Hover: 0 12px 40px -12px rgba(61, 90, 254, 0.3)
  + Glow: 0 0 10px rgba(61, 90, 254, 0.3)
```

### High Contrast Mode

```
Card Background:
- bg-card: #FFFFFF (light) / #1A1A1A (dark)
- border: 2px solid (thicker)
- border-color: rgba(0, 0, 0, 0.3) / rgba(255, 255, 255, 0.4)

Text:
- Foreground: #000000 / #FFFFFF
- Muted: #1A1A1A / #E5E5E5

Focus States:
- Outline: 3px solid
- Outline offset: 3px
```

---

## Responsive Layouts

### Mobile (< 768px)

```
UseCaseGrid:
┌─────────────────────┐
│  Privacy Advocates  │
└─────────────────────┘

┌─────────────────────┐
│  Enterprise Teams   │
└─────────────────────┘

┌─────────────────────┐
│ Creative Pros       │
└─────────────────────┘

(1 column, full width)
```

### Tablet (768px - 1023px)

```
UseCaseGrid:
┌─────────────┐ ┌─────────────┐
│  Privacy    │ │  Enterprise │
│  Advocates  │ │  Teams      │
└─────────────┘ └─────────────┘

┌─────────────┐ ┌─────────────┐
│  Creative   │ │  Healthcare │
│  Pros       │ │  Providers  │
└─────────────┘ └─────────────┘

(2 columns)
```

### Desktop (≥ 1024px)

```
UseCaseGrid:
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Privacy │ │Enterprise│ │Creative │
│Advocates│ │  Teams  │ │  Pros   │
└─────────┘ └─────────┘ └─────────┘

┌─────────┐ ┌─────────┐ ┌─────────┐
│Healthcare│ │  Legal  │ │  Devs   │
│Providers│ │  Pros   │ │         │
└─────────┘ └─────────┘ └─────────┘

(3 columns)

TechnologyShowcase:
┌───────────┐ ┌───────────┐ ┌───────────┐
│ ML-KEM-768│ │  Triple   │ │  WebRTC   │
│  (Kyber)  │ │  Ratchet  │ │DataChannels│
└───────────┘ └───────────┘ └───────────┘

(3 columns)
```

---

## Animation States

### Scroll-Triggered Animation

```
Initial State (off-screen):
opacity: 0
translateY: 20px

Animated State (in viewport):
opacity: 1
translateY: 0
duration: 0.5s
easing: ease-out
```

### Hover Animation

```
Default State:
translateY: 0
shadow: var(--shadow-sm)

Hover State:
translateY: -4px
shadow: var(--shadow-xl)
duration: 0.3s
easing: ease-out
```

### Link Hover (Technology Cards)

```
Arrow Icon:
Default: translateX(0)
Hover: translateX(4px)
transition: transform 0.2s
```

### Reduced Motion

```
@media (prefers-reduced-motion: reduce) {
  All animations:
  - duration: 0.01ms
  - transform: none
  - opacity: 1 (immediate)
}
```

---

## Icon Reference

### UseCaseGrid Icons (32px)

```
Shield     - Privacy Advocates
Users      - Enterprise Teams
Palette    - Creative Professionals
Heart      - Healthcare Providers
Scale      - Legal Professionals
Code       - Developers
```

### TechnologyShowcase Icons (48px)

```
Shield     - ML-KEM-768 (Security)
Repeat     - Triple Ratchet (Key Rotation)
Zap        - WebRTC (Speed/Performance)
```

### Feature Check Icons (16px)

```
Check      - Used for all feature list items
           - Color: primary
           - Size: 16px (size-4)
```

---

## Accessibility Landmarks

### Landmark Structure

```
<section role="region" aria-labelledby="use-cases-heading">
  <h2 id="use-cases-heading">Built for Everyone</h2>

  <div role="list">
    <article aria-labelledby="use-case-privacy-advocates-title">
      <h3 id="use-case-privacy-advocates-title">Privacy Advocates</h3>
      <ul role="list" aria-label="Key features for Privacy Advocates">
        <li>Maximum privacy mode</li>
        ...
      </ul>
    </article>
    ...
  </div>
</section>
```

### Focus Order

```
1. Section heading (h2)
2. Section description (p)
3. First card
4. Second card
5. ...
6. Last card
```

### Keyboard Navigation

```
Tab       → Move to next focusable element
Shift+Tab → Move to previous focusable element
Enter     → Activate link/button
Space     → Activate link/button (on cards)
```

---

## Print Styles

Both components are print-friendly:

```css
@media print {
  /* Remove animations */
  * { animation: none !important; }

  /* Optimize colors for print */
  .card-feature {
    border: 1px solid #000;
    break-inside: avoid;
  }

  /* Hide decorative elements */
  [aria-hidden="true"] { display: none; }
}
```

---

## Browser Rendering

### Safari Optimization

```css
/* Smooth font rendering on macOS/iOS */
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

### Firefox Optimization

```css
/* Crisp borders */
outline-offset: 2px;

/* Smooth transitions */
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
```

### Chrome/Edge Optimization

```css
/* GPU acceleration */
transform: translateZ(0);
will-change: transform;
```

---

This visual reference helps designers and developers understand the exact layout, spacing, and visual hierarchy of both components.

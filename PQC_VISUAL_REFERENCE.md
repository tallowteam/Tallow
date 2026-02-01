# PQC Integration - Visual Reference Guide

## What Users See

This document provides a visual reference for how PQC (Post-Quantum Cryptography) protection is displayed across all Tallow features.

## Badge Variants

### 1. Quantum-Resistant (Protected)

**Appearance:**
```
┌────────────────────────────────┐
│ 🛡️ Quantum-Resistant          │
└────────────────────────────────┘
```

**Colors:**
- Background: Green (#16a34a)
- Icon: White shield with checkmark
- Text: White

**When Shown:**
- PQC key exchange complete
- ML-KEM-768 + X25519 active
- Session keys derived and ready

**Tooltip:**
```
Post-Quantum Cryptography Protected
Algorithm: ML-KEM-768 + X25519
Secure against quantum computer attacks
```

### 2. Standard Encryption (Not PQC)

**Appearance:**
```
┌────────────────────────────────┐
│ 🛡️ Standard Encryption        │
└────────────────────────────────┘
```

**Colors:**
- Background: Gray/Secondary
- Icon: Gray shield
- Text: Gray

**When Shown:**
- Connection established without PQC
- Classical encryption only (still secure)
- PQC not available/not initiated

**Tooltip:**
```
Using standard encryption (not quantum-resistant)
```

### 3. Warning (No Protection)

**Appearance:**
```
┌────────────────────────────────┐
│ ⚠️  No PQC Protection          │
└────────────────────────────────┘
```

**Colors:**
- Background: Red (#dc2626)
- Icon: Warning triangle
- Text: White

**When Shown:**
- showWarning prop enabled
- Operation started without PQC
- Security concern highlighted

**Tooltip:**
```
Connection not quantum-resistant
Establish PQC connection for quantum-safe encryption
```

### 4. Compact Mode

**Appearance:**
```
┌───┐
│ 🛡️ │
└───┘
```

**Usage:**
- Space-constrained layouts
- Headers and titles
- Mobile views

## Feature-Specific Displays

### Screen Sharing

**Full Interface:**
```
╔══════════════════════════════════════════════════════╗
║ 🖥️  Screen Share                    🟢 Sharing  🛡️  ║
║ Share your screen with end-to-end encryption        ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  [Stop Sharing]  [Pause]  [Switch]  [Settings]     ║
║                                                      ║
╠══════════════════════════════════════════════════════╣
║  Statistics                                          ║
║  Resolution: 1920x1080                              ║
║  Frame Rate: 30.0 FPS                               ║
║  Bitrate: 2.5 Mbps                                  ║
║  Latency: 45 ms                                     ║
╠══════════════════════════════════════════════════════╣
║  ✅ Quantum-Resistant Screen Sharing Active          ║
║     Your screen is protected with ML-KEM-768 +      ║
║     X25519 hybrid encryption. Secure against        ║
║     quantum computers.                              ║
╚══════════════════════════════════════════════════════╝
```

**Compact Header:**
```
┌────────────────────────────────────────┐
│ 🖥️  Screen Share      [🟢 Live] [🛡️]  │
└────────────────────────────────────────┘
```

### Chat Panel

**Full Interface:**
```
╔══════════════════════════════════════════════════════╗
║ 💬 Chat with Device-123  🛡️    [⋮]  [✕]            ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  [Them]  Hey, received the file!              10:32 ║
║                                                      ║
║  [You]   Great! Let me know if you need more. 10:33 ║
║          ✓✓ Read                                    ║
║                                                      ║
╠══════════════════════════════════════════════════════╣
║  [📎]  Type a message...                   [Send]   ║
╚══════════════════════════════════════════════════════╝
```

**Header Detail:**
```
┌──────────────────────────────┐
│ Chat with Device-123  🛡️     │
│ Online • End-to-end encrypted│
└──────────────────────────────┘
```

### Group Transfer Progress

**Full Dialog:**
```
╔══════════════════════════════════════════════════════╗
║ 👥 Group Transfer in Progress                       ║
║ Sending document.pdf to 3 recipients  🛡️           ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  📄 document.pdf  2.4 MB  🔐 ML-KEM-768             ║
║  ████████████████░░░░░░  67% complete               ║
║                                                      ║
║  ┌──────────────────────────────────────────────┐  ║
║  │ Statistics                                   │  ║
║  │ ✅ 2 Completed  🔄 1 In Progress  ❌ 0 Failed│  ║
║  │ Total Speed: 4.2 MB/s  •  ETA: 12s         │  ║
║  └──────────────────────────────────────────────┘  ║
║                                                      ║
║  Recipients:                                         ║
║  ┌──────────────────────────────────────────────┐  ║
║  │ ✅ Desktop-PC      100%  5.1 MB/s   Done     │  ║
║  │ ✅ Laptop-Work     100%  4.8 MB/s   Done     │  ║
║  │ 🔄 Phone-Android    45%  3.2 MB/s   12s left │  ║
║  └──────────────────────────────────────────────┘  ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
```

**File Badge Stack:**
```
┌──────────────────────────────────────┐
│ 🛡️ Quantum-Resistant                 │
│ 🔐 ML-KEM-768                        │
│ 🔒 Password Protected                │
│ ⏱️  Expires in 24h                   │
└──────────────────────────────────────┘
```

### File Transfer Status

**Transfer Card:**
```
╔══════════════════════════════════════════════════════╗
║  📄 vacation-photos.zip                             ║
║  ████████████████████████  89% • 4.2 MB/s          ║
║                                                      ║
║  🛡️ Quantum-Resistant  🔐 ML-KEM-768  🔒 Protected  ║
║                                                      ║
║  3.8 GB of 4.2 GB • 15 seconds remaining            ║
╚══════════════════════════════════════════════════════╝
```

**Status Badge Group:**
```
┌──────────────────────────────────────┐
│ [🛡️ PQC] [🔒 Protected] [📝 Signed]  │
└──────────────────────────────────────┘
```

## Mobile Responsive Views

### Mobile Chat Header
```
┌────────────────────────────┐
│ 💬 Device-123  🛡️      [≡] │
└────────────────────────────┘
```

### Mobile Screen Share
```
┌────────────────────────────┐
│ 🖥️  Sharing  🛡️        [⋮] │
├────────────────────────────┤
│ [Stop] [Pause] [Settings]  │
└────────────────────────────┘
```

### Mobile Transfer Status
```
┌────────────────────────────┐
│ file.pdf                   │
│ ████████░░ 75%             │
│ 🛡️ 🔐 🔒                   │
└────────────────────────────┘
```

## Color Palette

### Light Mode

**PQC Protected:**
- Background: `bg-green-600` (#16a34a)
- Hover: `hover:bg-green-700` (#15803d)
- Text: `text-white`
- Icon: White

**Algorithm Badge:**
- Background: `bg-blue-100` (#dbeafe)
- Text: `text-blue-700` (#1d4ed8)
- Icon: Blue

**Standard Encryption:**
- Background: `bg-secondary` (theme-based)
- Text: `text-secondary-foreground`
- Icon: Gray

**Warning:**
- Background: `bg-red-600` (#dc2626)
- Text: `text-white`
- Icon: Red

### Dark Mode

**PQC Protected:**
- Background: `dark:bg-green-700` (#15803d)
- Hover: `dark:hover:bg-green-800` (#166534)
- Text: `text-white`
- Icon: White

**Algorithm Badge:**
- Background: `dark:bg-blue-950` (#172554)
- Text: `dark:text-blue-300` (#93c5fd)
- Icon: Blue

**Standard Encryption:**
- Background: `dark:bg-secondary` (theme-based)
- Text: `dark:text-secondary-foreground`
- Icon: Gray

**Warning:**
- Background: `dark:bg-red-800` (#991b1b)
- Text: `text-white`
- Icon: Red

## Icon Library (Lucide React)

**PQC Protection:**
- `<ShieldCheck />` - Quantum-resistant active
- `<Shield />` - Standard encryption
- `<AlertTriangle />` - Warning state

**Algorithms:**
- `<Shield />` - Generic security
- `<Lock />` - Encryption
- `<Key />` - Key exchange

**Status:**
- `<CheckCircle2 />` - Complete/verified
- `<Clock />` - Timing/expiration
- `<Activity />` - Active transfer

## Animation States

### Badge Appearance
```
Initial: opacity-0, scale-95
Animate: opacity-100, scale-100
Duration: 200ms
Easing: ease-out
```

### Hover Effect
```
Initial: scale-100
Hover: scale-105
Duration: 150ms
Easing: ease-in-out
```

### Loading State
```
Shimmer effect across badge
Gradient: transparent → white/20% → transparent
Duration: 2000ms
Loop: infinite
```

## Accessibility Features

### ARIA Labels

**Protected Badge:**
```html
<span
  aria-label="Quantum-resistant encryption active"
  role="status"
>
  🛡️ Quantum-Resistant
</span>
```

**Algorithm Badge:**
```html
<span
  aria-label="Using ML-KEM-768 key encapsulation"
  role="img"
>
  🔐 ML-KEM-768
</span>
```

### Keyboard Navigation

**Tab Order:**
1. Main feature controls
2. PQC status badge (focusable)
3. Settings/options
4. Secondary actions

**Focus Styles:**
```css
focus:ring-2 focus:ring-primary focus:ring-offset-2
```

### Screen Reader Text

**Example:**
```html
<span className="sr-only">
  This connection is protected with post-quantum cryptography
  using ML-KEM-768 key encapsulation and X25519 key exchange.
  Your data is secure against quantum computer attacks.
</span>
```

## Tooltip Content

### PQC Protected Tooltip
```
┌─────────────────────────────────────┐
│ Post-Quantum Cryptography Protected │
│                                     │
│ Algorithm: ML-KEM-768 + X25519      │
│                                     │
│ Secure against quantum computer     │
│ attacks                             │
└─────────────────────────────────────┘
```

### Algorithm Details Tooltip
```
┌─────────────────────────────────────┐
│ ML-KEM-768                          │
│                                     │
│ NIST-standardized post-quantum key  │
│ encapsulation (formerly Kyber-768)  │
└─────────────────────────────────────┘
```

### Feature Badge Group Tooltip
```
┌─────────────────────────────────────┐
│ Security Features                   │
│                                     │
│ ✓ Hybrid Key Exchange (ML-KEM+X25519)│
│ ✓ AES-256-GCM Encryption            │
│ ✓ Forward Secrecy (5-min rotation)  │
└─────────────────────────────────────┘
```

## Context-Specific Variations

### Screen Sharing Privacy Notice

**With PQC:**
```
╔══════════════════════════════════════════════════════╗
║ ✅ Quantum-Resistant Screen Sharing Active           ║
║                                                      ║
║ Your screen is protected with ML-KEM-768 + X25519   ║
║ hybrid encryption. Secure against quantum computers. ║
╚══════════════════════════════════════════════════════╝
```

**Without PQC:**
```
╔══════════════════════════════════════════════════════╗
║ ⚠️  Standard Encrypted Screen Sharing                ║
║                                                      ║
║ Your screen is being shared with end-to-end          ║
║ encryption. Only the connected peer can view it.     ║
╚══════════════════════════════════════════════════════╝
```

### Chat Message Security

**Encrypted Message:**
```
┌────────────────────────────────┐
│ [You] Hey there! 🛡️      10:32 │
│       ✓✓ Read, Encrypted       │
└────────────────────────────────┘
```

**File Attachment:**
```
┌────────────────────────────────┐
│ [You] 📎 document.pdf     10:35 │
│       🛡️ Encrypted with PQC    │
│       1.2 MB • [Download]      │
└────────────────────────────────┘
```

## Print/Export Views

### Security Report Badge
```
╔══════════════════════════════════════╗
║ SECURITY STATUS                      ║
║                                      ║
║ Encryption: Quantum-Resistant        ║
║ Algorithm: ML-KEM-768 + X25519       ║
║ Status: Active                       ║
║ Forward Secrecy: Enabled (5 min)     ║
║ Verified: Yes                        ║
╚══════════════════════════════════════╝
```

## Summary

### Badge Hierarchy
1. **Primary**: PQCStatusBadge (most important)
2. **Secondary**: Algorithm badges (ML-KEM-768, etc.)
3. **Tertiary**: Additional security features

### Display Rules
- **Always show** PQC status in active transfers
- **Compact mode** for space-constrained layouts
- **Full badges** in settings and security views
- **Tooltips** for educational context

### Color Meaning
- 🟢 Green = Quantum-resistant protection
- 🟡 Yellow = Standard encryption
- 🔴 Red = Warning/not protected
- ⚪ Gray = Inactive/disabled

### Icon Convention
- 🛡️ = Security/protection
- 🔐 = Encryption algorithm
- 🔒 = Locked/protected
- ✅ = Verified/complete
- ⚠️ = Warning/caution

---

**Visual Guide Complete**
Use this reference when implementing or troubleshooting PQC indicators across the application.

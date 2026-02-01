# Tallow

## What This Is

Post-quantum secure P2P file transfer desktop application with a Linear-inspired
premium dark UI. Users can securely share files directly between devices with
end-to-end encryption, featuring a polished visual experience that feels fast,
intentional, and trustworthy.

## Core Value

Users can securely transfer files between devices with zero friction and
complete confidence in their privacy — the UI should feel premium, responsive,
and trustworthy.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Complete design system implementation following
      TALLOW_DESIGN_SYSTEM_CLAUDE_CODE.md
- [ ] Base UI component library (Button, Input, Card, Dialog, Tooltip, Badge,
      etc.)
- [ ] Hero components (DropZone, TransferProgress, EncryptionIndicator,
      ConnectionLine)
- [ ] Animation system with Framer Motion (micro-interactions + hero animations)
- [ ] Integration with existing lib/ transfer logic (crypto, webrtc, signaling)
- [ ] Working file transfer flow — can actually send files P2P with new UI

### Out of Scope

- Backend changes — existing lib/ code is the foundation
- Crypto implementation — already exists in lib/crypto/
- Mobile native apps — desktop/web first
- Light theme — dark mode only for v1

## Context

**Existing codebase:**

- `lib/crypto/` — Post-quantum cryptography (Kyber + X25519 hybrid)
- `lib/transfer/` — File chunking, transfer managers
- `lib/webrtc/` — P2P connection handling
- `lib/signaling/` — WebSocket signaling for peer discovery
- No `components/` directory — UI foundation needs to be built from scratch

**Design system documents:**

- `TALLOW_DESIGN_SYSTEM_CLAUDE_CODE.md` — Complete 2800+ line design
  specification
- `CLAUDE.md` — Condensed reference for Claude Code

**Tech stack (specified in design docs):**

- Next.js 14+ (App Router)
- Tailwind CSS + CSS Variables
- Radix UI primitives
- Framer Motion animations
- class-variance-authority (CVA)
- Lucide React icons
- Geist fonts (Sans + Mono)

## Constraints

- **Design system**: Must follow TALLOW_DESIGN_SYSTEM_CLAUDE_CODE.md exactly
- **Primary color**: #5E5CE6 (Linear Purple) — use everywhere
- **Animation timing**: 0.2s duration, [0.16, 1, 0.3, 1] easing
- **Components**: Must use forwardRef, motion.\*, CVA variants, cn() utility
- **Micro-interactions**: buttons=scale(0.98), cards=y(-2), icons=scale(1.1)
- **Existing code**: Must integrate with lib/ without breaking it

## Key Decisions

| Decision                     | Rationale                                        | Outcome   |
| ---------------------------- | ------------------------------------------------ | --------- |
| Radix UI for primitives      | Accessibility, keyboard nav, focus management    | — Pending |
| Framer Motion for animations | Specified in design system, premium feel         | — Pending |
| CVA for variants             | Type-safe variant management                     | — Pending |
| Dark theme only              | Design system optimized for dark, light deferred | — Pending |
| Wire to existing lib/        | Complete working app, not just component library | — Pending |

---

_Last updated: 2025-02-01 after initialization_

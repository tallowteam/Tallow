# Tallow Marketing Pages - Quick Reference

## Pages Overview

| Page | URL | File Path | Size | Purpose |
|------|-----|-----------|------|---------|
| **Pricing** | `/pricing` | `app/pricing/page.tsx` | 16.5 KB | Pricing tiers, FAQ, CTAs |
| **About** | `/about` | `app/about/page.tsx` | 16.4 KB | Mission, team, timeline, contact |
| **Privacy** | `/privacy` | `app/privacy/page.tsx` | 25.4 KB | Privacy policy, data handling |
| **Terms** | `/terms` | `app/terms/page.tsx` | 24.5 KB | Terms of service, legal |
| **Security** | `/security` | `app/security/page.tsx` | 19.9 KB | Security features, audits, bug bounty |
| **Features** | `/features` | `app/features/page.tsx` | 19.2 KB | All features, use cases |

## Page Content Summary

### Pricing (`/pricing`)
- **Free Plan:** $0 forever, 5GB limit, core features
- **Pro Plan:** $9.99/month, unlimited, advanced features
- **Enterprise:** Custom pricing, team features, dedicated support
- **8 FAQs** covering common questions
- **CTA:** "Start Free", "Get Pro", "Contact Sales"

### About (`/about`)
- **Mission:** Secure file transfers for everyone
- **4 Values:** Security First, Privacy by Design, Open & Transparent, Innovation
- **Timeline:** 2024-2025 milestones
- **Teams:** Engineering, Security, Support
- **Contact:** hello@tallow.app, San Francisco CA

### Privacy (`/privacy`)
- **9 Sections:** Full privacy policy
- **Data Collected:** Email, username, basic usage
- **Data NOT Collected:** File contents, recipients, metadata
- **User Rights:** Access, correction, deletion, export
- **Retention:** Active accounts, 90-day logs
- **Contact:** privacy@tallow.app

### Terms (`/terms`)
- **13 Sections:** Complete legal agreement
- **Key Points:** Acceptable use, IP rights, payment terms
- **Disclaimers:** AS-IS service, liability limits
- **Governing Law:** California, arbitration
- **Contact:** legal@tallow.app

### Security (`/security`)
- **6 Security Features:** PQC, E2E, Zero-knowledge, P2P, Metadata stripping, Key exchange
- **3 Audits:** Cure53, Trail of Bits, NCC Group
- **Bug Bounty:** $100-$10,000 rewards
- **Scope:** Auth bypass, crypto, RCE, XSS, etc.
- **Contact:** security@tallow.app

### Features (`/features`)
- **6 Core Features:** PQC, E2E encryption, fast transfers, zero-knowledge, cross-platform, folders
- **6 Advanced Features:** Resume, metadata stripping, onion routing, HW acceleration, sync, groups
- **6 Use Cases:** Professionals, journalists, healthcare, legal, creators, activists
- **CTAs:** "Try Free Now", "View Pricing"

## Common Elements

### Header (All Pages)
```
[Tallow Logo] .................... [Home] [Launch App]
```

### Footer (All Pages)
```
Product         Company         Support
- Features      - About         - Contact
- Pricing       - Privacy
- Security      - Terms
```

## SEO Keywords

| Page | Primary Keywords |
|------|-----------------|
| Pricing | tallow pricing, secure file transfer plans, free file transfer |
| About | about tallow, secure file transfer mission, privacy-first |
| Privacy | tallow privacy policy, zero knowledge, data privacy |
| Terms | tallow terms, terms of service, user agreement |
| Security | tallow security, post-quantum cryptography, security audit |
| Features | tallow features, secure file transfer features, p2p file sharing |

## Style Guide

### Colors
- Background: `#0a0a0a` (near black)
- Text: `#ffffff` (white), `#a1a1a1` (secondary)
- Accent: Purple-blue gradient (`#7c3aed` → `#3b82f6`)
- Success: `#10b981` (green)

### Typography
- Font: Inter (variable weight)
- H1: 3-4.5rem (responsive clamp)
- H2: 2.25-3rem
- Body: 1rem, 1.5 line-height

### Buttons
- Primary: Gradient background, white text
- Secondary: Transparent with border
- Hover: Transform translateY(-2px)

### Cards
- Background: `rgba(255, 255, 255, 0.05)`
- Border: `rgba(255, 255, 255, 0.05)`
- Radius: `--radius-xl` (16px)
- Hover: Accent border + shadow

## Icons Used

- **@heroicons/react/24/outline:**
  - ShieldCheckIcon
  - LockClosedIcon
  - BoltIcon
  - EyeSlashIcon
  - DevicePhoneMobileIcon
  - FolderIcon
  - ClockIcon
  - ArrowRightIcon
  - CheckIcon
  - XMarkIcon
  - UserGroupIcon
  - And more...

## Responsive Breakpoints

```css
Desktop:  1280px+  (multi-column, full features)
Tablet:   768-1279px  (2-column, adjusted)
Mobile:   <768px  (single column, stacked)
Small:    <480px  (minimal spacing)
```

## File Structure

```
app/
├── pricing/
│   └── page.tsx
├── about/
│   └── page.tsx
├── privacy/
│   └── page.tsx
├── terms/
│   └── page.tsx
├── security/
│   └── page.tsx
└── features/
    └── page.tsx
```

## Development

### Run Dev Server
```bash
npm run dev
# Visit http://localhost:3000/pricing (or other pages)
```

### Build for Production
```bash
npm run build
npm start
```

### Type Check
```bash
npx tsc --noEmit
```

## Customization Checklist

- [ ] Update email addresses
  - hello@tallow.app
  - privacy@tallow.app
  - legal@tallow.app
  - security@tallow.app
- [ ] Add team member photos/bios (About)
- [ ] Finalize pricing tiers (Pricing)
- [ ] Legal review (Privacy, Terms)
- [ ] Add actual audit reports (Security)
- [ ] Set up bug bounty program (Security)
- [ ] Add feature screenshots (Features)
- [ ] Configure analytics
- [ ] Set up A/B testing
- [ ] Submit to Google Search Console

## Testing URLs (Dev)

```
http://localhost:3000/pricing
http://localhost:3000/about
http://localhost:3000/privacy
http://localhost:3000/terms
http://localhost:3000/security
http://localhost:3000/features
```

## Analytics Events to Track

### Pricing Page
- View Pricing Page
- Click Free CTA
- Click Pro CTA
- Click Enterprise CTA
- Expand FAQ

### About Page
- View About Page
- Click Contact Email
- Click Social Links

### Privacy Page
- View Privacy Policy
- Click Privacy Email
- Time on Page

### Terms Page
- View Terms Page
- Scroll Depth
- Time on Page

### Security Page
- View Security Page
- Click Bug Bounty Email
- View Audit Details

### Features Page
- View Features Page
- Click Try Free CTA
- Click View Pricing
- Feature Interest (hover/click)

---

**Quick Reference Version 1.0**
**Last Updated:** February 3, 2026

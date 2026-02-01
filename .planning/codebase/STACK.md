# Technology Stack

**Analysis Date:** 2026-01-23

## Languages

**Primary:**
- TypeScript 5 - All application code and configuration
- JavaScript (Node.js) - Signaling server implementation

**Secondary:**
- JSX/TSX - React components
- CSS - Tailwind CSS styling

## Runtime

**Environment:**
- Node.js 20 (Alpine Linux in Docker)
- Browser runtime (React 19 client-side)

**Package Manager:**
- npm with npm lockfile (`package-lock.json`)
- Lockfile: Present

## Frameworks

**Core:**
- Next.js 16.1.2 - Full-stack web framework with App Router
- React 19.2.3 - UI component framework
- Tailwind CSS 4 - Utility-first CSS framework

**Testing:**
- Playwright 1.58.0 - E2E browser testing
- Vitest 4.0.18 - Unit testing framework with v8 coverage
- @vitest/coverage-v8 4.0.18 - Coverage reporting

**Build/Dev:**
- Turbopack - Next.js bundler (configured in `next.config.ts`)
- TypeScript compiler - Type checking and transpilation
- PostCSS 4 - CSS processing with Tailwind
- ESLint 9 - Code linting (with eslint-config-next)

## Key Dependencies

**Critical:**
- `socket.io` 4.8.3 - WebSocket signaling server
- `socket.io-client` 4.8.3 - WebSocket client for signaling
- `simple-peer` 9.11.1 - WebRTC peer connection wrapper
- `pqc-kyber` 0.7.0 - Post-quantum cryptography for encryption

**Cryptography & Security:**
- `@noble/curves` 2.0.1 - Elliptic curve cryptography
- `@noble/hashes` 2.0.1 - Cryptographic hash functions
- `crypto-js` 4.2.0 - JavaScript cryptography library

**Payment & Email:**
- `stripe` 20.2.0 - Stripe API client (server-side)
- `@stripe/stripe-js` 8.6.4 - Stripe.js client library
- `resend` 6.7.0 - Email delivery service client
- `@react-email/components` 1.0.4 - React email templates

**UI Components & Styling:**
- `@radix-ui/*` (v1.1.x - v2.1.x) - Headless UI component library
  - `react-avatar`, `react-dialog`, `react-dropdown-menu`, `react-label`
  - `react-progress`, `react-scroll-area`, `react-separator`, `react-slider`
  - `react-switch`, `react-tabs`, `react-tooltip`, `react-slot`
- `lucide-react` 0.562.0 - Icon library
- `framer-motion` 12.26.2 - Animation library
- `class-variance-authority` 0.7.1 - Type-safe component variants
- `clsx` 2.1.1 - Utility for conditional classnames
- `tailwind-merge` 3.4.0 - Merge Tailwind classes safely
- `sonner` 2.0.7 - Toast notifications

**Utilities:**
- `next-themes` 0.4.6 - Theme provider (light/dark mode)
- `date-fns` 4.1.0 - Date manipulation
- `qrcode` 1.5.4 - QR code generation
- `jsqr` 1.4.0 - QR code scanning/decoding

**Fonts:**
- `@fontsource-variable/inter` 5.2.8 - Variable Inter font
- `@fontsource/cormorant-garamond` 5.2.11 - Serif display font
- `@fontsource/playfair-display` 5.2.8 - Display font (dev only)
- `geist` 1.5.1 - Geist font family (dev only)

## Configuration

**Environment:**
- Configuration via `.env.local` file (see `.env.example`)
- Environment variables are required for:
  - Email service (Resend API)
  - Payment processing (Stripe keys)
  - WebRTC relay servers (TURN/STUN)
  - Privacy settings (IP leak prevention)

**Build:**
- `tsconfig.json` - TypeScript configuration with strict mode enabled, path aliases (`@/*`)
- `next.config.ts` - Next.js configuration with:
  - WebAssembly support for `pqc-kyber` WASM module
  - Turbopack configuration
  - Security headers (HSTS, CSP, X-Frame-Options, etc.)
  - Webpack customization for WASM loading
- `vitest.config.ts` - Unit test configuration
- `playwright.config.ts` - E2E test configuration (Chrome, Firefox, mobile)
- `eslint.config.mjs` - ESLint configuration based on Next.js and TypeScript standards
- `postcss.config.mjs` - PostCSS configuration for Tailwind CSS
- `wrangler.toml` - Cloudflare Workers configuration (Node.js compat mode, v0.7.0)

## Platform Requirements

**Development:**
- Node.js 20+ with npm
- TypeScript 5+
- For WebRTC development: TURN server credentials (optional but recommended)
- Stripe test keys for payment feature testing (optional)
- Resend API key for email testing (optional)

**Production:**
- Docker containerization (Node.js 20 Alpine)
- HTTPS required (HSTS header enforced)
- TURN server credentials configured for WebRTC relay
- Cloudflare Tunnel for tunneling to signaling server (documented in docker-compose.yml)
- Email service provider (Resend) for welcome emails
- Payment processor (Stripe) for donations

---

*Stack analysis: 2026-01-23*

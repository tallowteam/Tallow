# Phase 21: Web UI / Browser Client - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Browser-based file transfer, clipboard sharing, and encrypted chat — interoperable with the CLI. Users visit a URL, enter a code phrase, and send/receive files, share clipboard contents, and chat with E2E encryption. WASM-compiled tallow-crypto for consistent cryptography, WebSocket transport to relay. All three features (files, clipboard, chat) are equal priority. Includes PWA capability.

</domain>

<decisions>
## Implementation Decisions

### Visual Direction
- **Aesthetic:** Clean modern dark — polished, rounded corners, smooth gradients (like Linear or Vercel)
- **Color palette:** Deep blue/purple — navy/indigo backgrounds (#0f172a), blue accents — trust, security feel
- **Typography:** System fonts only — no external fonts, no CDN dependency. Inter/system-ui for body.
- **Security messaging:** Hero-level — "Post-Quantum Encrypted" branding is prominent throughout. Security is the primary selling point, not an afterthought.
- **Animations:** Polished transitions — slide/scale animations between screens, progress state indicators with motion
- **Progress bar:** Full-width bar spanning the content area (like WeTransfer)
- **Design references:** Euveka (https://www.euveka.com/) for fonts and layout; Vercel/Mastra for dark aesthetic
- **Mobile:** Equal weight — both mobile and desktop get equal design attention
- **Landing page:** Full hero with features — headline, security badges, features overview, then scroll to action area
- **Branding:** Full brand experience — logo, tagline, PQ security badges, GitHub stars, install count — mini landing page feel
- **Theme:** Dark + light mode toggle — default dark, with a toggle for light mode
- **Footer:** Rich — GitHub link, docs link, CLI install instructions, security audit status, version
- **Drop zone:** Large bordered area — big dashed-border rectangle with "Drop files here" text and upload icon
- **Connection status:** Step-by-step visual — show handshake steps: Connecting → Key Exchange → PQ Encryption Active → Ready
- **Transfer complete:** Summary card — files transferred, total size, time taken, speed, hash verification
- **Error states:** Friendly with retry — clear error message, retry button, suggest checking code phrase

### User Flow & Code Phrase UX
- **Send/receive selection:** Explicit buttons — two clear buttons: "Send Files" and "Receive Files", user picks role upfront
- **Code phrase entry:** Both options — tab between "Enter a code" and "Generate a code"
- **Post-connection layout:** Dashboard — all three modes (files, clipboard, chat) visible at once
- **Dashboard layout:** Claude's discretion — research best UI/UX patterns from top web apps for optimal layout
- **First visit:** Landing page first — see the hero/features section, scroll down to the action area
- **Deep links:** Yes — tallow.manisahome.com?code=7-gamma-bravo opens with code pre-filled
- **File receive confirmation:** Simple accept/reject — file name + size, Accept/Reject buttons
- **Multi-file sending:** Both — initial batch selection, plus "Add more files" button that stays visible

### Feature Scope
- **Feature priority:** All equal — files, clipboard, and chat are equally important
- **Chat text:** Emoji support — native emoji picker + text, no markdown rendering
- **Code generation:** Both directions — browser can generate codes and wait for peers. Browser-to-browser transfers fully supported.
- **Folder upload:** Both — individual files and folders via drag-drop (webkitdirectory API)
- **File size limit:** Soft limit 1GB — warning above 1GB, block above 4GB with "Use the CLI for large transfers"
- **Sounds:** No sounds — visual-only notifications
- **Keyboard shortcuts:** Full shortcuts — keyboard-driven with Ctrl+K command palette style (like Linear)
- **Language:** English only — no i18n system
- **Compression:** User toggle — "Compress" checkbox visible before sending
- **Accessibility:** Basic semantic HTML — proper headings, labels, buttons
- **Settings panel:** Yes — full panel with relay URL, theme, compression, chunk size, keyboard shortcuts display (stored in localStorage)
- **Connection indicator:** Subtle — small colored dot (green/yellow/red) based on latency
- **Transfer resume:** Yes — full resume support. Track chunks in sessionStorage, re-negotiate from last verified chunk on reconnect.
- **Multi-peer rooms:** Yes — browser can join multi-peer rooms (send to multiple CLI/browser peers)
- **File preview:** No preview — show file name, size, type; accept/reject without preview
- **Transfer history:** Persistent — show past transfers across sessions (in localStorage, encrypted at rest)
- **Peer fingerprint:** Optional expandable — hide by default, show via "Verify peer" link for security-conscious users
- **Browser-to-browser:** Yes — full B2B support, works identically to browser-to-CLI
- **Offline handling:** Show offline banner — display "You are offline" banner, auto-reconnect when back online
- **QR code:** Yes — display QR code alongside text code phrase for easy mobile scanning

### Hosting & Domain
- **Host:** Cloudflare Pages at tallow.manisahome.com
- **Relay WS endpoint:** Same domain with path — tallow.manisahome.com/ws, Cloudflare proxies WS to relay VM
- **Deploy pipeline:** GitHub Actions — auto-deploy on push to master: build WASM + deploy to Cloudflare Pages
- **404 page:** Custom branded 404 with link back to home
- **Analytics:** Privacy-respecting — Plausible or similar (no cookies, GDPR-compliant)
- **Static hosting:** Pure static files — 100% static, no Cloudflare Workers/Functions
- **CSP:** Strict — no inline scripts, WASM from self only, WS to relay domain only
- **WASM caching:** Service worker handles caching and cache busting

### Claude's Discretion
- Dashboard layout arrangement (research best patterns from top web apps)
- Open Graph / social sharing metadata
- Build tooling for TypeScript (tsc, Vite, esbuild, or plain JS — Claude picks)

</decisions>

<specifics>
## Specific Ideas

- **Euveka** (https://www.euveka.com/) — reference for fonts and layout approach
- **Vercel / Mastra** — reference for dark aesthetic, sleek gradients, developer-focused polish
- **Linear** — reference for keyboard shortcuts with Ctrl+K command palette
- **WeTransfer** — reference for full-width progress bar style
- Security is the hero selling point: "Post-Quantum Encrypted" prominently branded throughout
- Dashboard layout should show all three modes (files, clipboard, chat) simultaneously — not tabs
- Code phrase deep links for easy sharing: `tallow.manisahome.com?code=7-gamma-bravo`
- QR code for code phrases — enables phone-to-desktop workflow

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 21-web-ui-browser-client*
*Context gathered: 2026-02-21*

# External Integrations

**Analysis Date:** 2026-01-23

## APIs & External Services

**Payment Processing:**
- Stripe - Donation payments via checkout sessions
  - SDK/Client: `stripe` (20.2.0 server), `@stripe/stripe-js` (8.6.4 client)
  - Auth: Environment variables `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
  - Implementation: `lib/stripe/config.ts`, `app/api/stripe/create-checkout-session/route.ts`, `app/api/stripe/webhook/route.ts`
  - Webhook endpoint: `POST /api/stripe/webhook` - handles `checkout.session.completed` and `payment_intent.succeeded` events

**Email Delivery:**
- Resend - Welcome email sending service
  - SDK/Client: `resend` (6.7.0)
  - Auth: Environment variable `RESEND_API_KEY`
  - Implementation: `app/api/send-welcome/route.ts`
  - Endpoint: `POST /api/send-welcome` - sends React email component via Resend
  - Graceful degradation: Works without API key (skips email)

## WebRTC & Real-Time Communication

**Signaling Server:**
- Custom Socket.IO signaling server for P2P connection negotiation
  - Technology: Node.js with Socket.IO 4.8.3 (both server and client)
  - Location: `signaling-server.js` (standalone Node.js server)
  - Docker container: Runs separately on port 3001
  - Health check: `GET /health` endpoint at `/signaling-server.js:153`
  - CORS configuration: Validates allowed origins (production: `https://tallow.manisahome.com`, dev: more permissive)
  - Rate limiting: IP-based connection limits, per-socket event limits, max 5 rooms per socket

**WebRTC Configuration:**
- Private transport implementation in `lib/transport/private-webrtc.ts`
  - Purpose: TURN-relay-only WebRTC to prevent IP address leaks
  - Features:
    - Configurable TURN servers via environment variables
    - IP filtering to block local IP candidates
    - SDP filtering to remove local address information
    - Monitoring and statistics collection
    - Graceful fallback to direct connections when relay unavailable

**TURN/STUN Servers:**
- Configurable TURN servers for WebRTC relay
  - Environment: `NEXT_PUBLIC_TURN_SERVER` (default: `turns:relay.metered.ca:443?transport=tcp`)
  - Credentials: `NEXT_PUBLIC_TURN_USERNAME`, `NEXT_PUBLIC_TURN_CREDENTIAL`
  - Privacy mode: Force relay-only via `NEXT_PUBLIC_FORCE_RELAY=true` (recommended)
  - Fallback: Allow direct connections via `NEXT_PUBLIC_ALLOW_DIRECT=false`
  - Recommended providers: Metered.ca, Xirsys, Twilio (see `.env.example`)
  - Default STUN fallbacks: `stun:stun.nextcloud.com:443`, `stun:stun.stunprotocol.org:3478` (privacy-respecting, non-Google)

**Socket.IO Signaling Events:**
- Implementation: `lib/signaling/socket-signaling.ts`
- Events transmitted:
  - `join-room` - Join connection code room
  - `peer-joined` - Notify when peer connects
  - `offer` - WebRTC offer with timestamp for replay protection
  - `answer` - WebRTC answer with timestamp
  - `ice-candidate` - ICE candidate exchange
  - `presence` - Device presence broadcast
  - `peer-left` - Notify when peer disconnects
  - `leave-room` - Leave specific room
- Replay protection: All signaling messages include `ts` (timestamp), rejected if >30s old (5s clock skew tolerance)
- Socket path: `/signaling`
- Transports: WebSocket with polling fallback
- Reconnection: Automatic with 5 max attempts, rooms rejoin on reconnect

## Data Storage

**Databases:**
- Not detected - application is stateless (peer-to-peer only)
- No persistent backend database required

**File Storage:**
- Local filesystem or browser IndexedDB/blob URLs
- Files transferred peer-to-peer via WebRTC data channels
- No cloud file storage integrations

**Caching:**
- Browser local caching (HTTP cache headers)
- LocalStorage for proxy configuration in `lib/network/proxy-config.ts`

## Authentication & Identity

**Auth Provider:**
- Custom client-side authentication (no backend auth service)
- WebRTC peer authentication via crypto signatures in `lib/crypto/peer-authentication.ts`
- Connection codes generate unique room IDs via UUID generation

**Session Management:**
- Sessionless architecture - each connection is independent
- Socket.IO connection IDs used for signaling
- No user login/account system

## Monitoring & Observability

**Error Tracking:**
- Not detected - no error tracking service integrated

**Logging:**
- Custom secure logger in `lib/utils/secure-logger.ts`
- Console logging with IP/sensitive data masking
- Server-side logging in signaling server with timestamp formatting

**Analytics:**
- Not detected - no analytics service configured
- Next.js telemetry disabled: `NEXT_TELEMETRY_DISABLED=1`

## CI/CD & Deployment

**Hosting:**
- Docker containerization (Node.js 20 Alpine)
- Docker Compose orchestration (`docker-compose.yml`)
- Services:
  1. Main app (port 3000) - Next.js application
  2. Signaling server (port 3001) - Socket.IO server
  3. Playwright tests (test profile) - E2E test runner
- Cloudflare Tunnel for production tunneling (referenced in comments)
- Cloudflare Workers configuration (`wrangler.toml`) with Node.js compatibility

**CI Pipeline:**
- Not detected - no CI configuration file in repo
- Local Playwright and Vitest runners for development

**Health Checks:**
- Main app: `wget http://localhost:3000` (30s interval, 10s timeout, 3 retries)
- Signaling: `wget http://localhost:3001/health` (30s interval, 10s timeout, 3 retries)

## Environment Configuration

**Required env vars:**
1. **Email (Optional):**
   - `RESEND_API_KEY` - Resend email service

2. **Payments (Optional):**
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key
   - `STRIPE_SECRET_KEY` - Stripe secret key (server-side)
   - `STRIPE_WEBHOOK_SECRET` - Webhook signature verification

3. **WebRTC (Recommended for production):**
   - `NEXT_PUBLIC_TURN_SERVER` - TURN server URL (default: `turns:relay.metered.ca:443?transport=tcp`)
   - `NEXT_PUBLIC_TURN_USERNAME` - TURN username
   - `NEXT_PUBLIC_TURN_CREDENTIAL` - TURN credential
   - `NEXT_PUBLIC_FORCE_RELAY` - Force relay-only mode (default: `true`)
   - `NEXT_PUBLIC_ALLOW_DIRECT` - Allow direct fallback (default: `false`)

4. **Signaling (Optional - auto-configured):**
   - `NEXT_PUBLIC_SIGNALING_URL` - Override signaling server URL (auto-detects from hostname)
   - `SIGNALING_PORT` - Signaling server port (default: 3001)
   - `ALLOWED_ORIGINS` - Comma-separated CORS allowed origins (production: `https://tallow.manisahome.com`)

5. **Runtime:**
   - `NODE_ENV` - Set to `production` in Docker
   - `NEXT_TELEMETRY_DISABLED` - Set to `1` to disable Next.js telemetry
   - `PORT` - Main app port (default: 3000)
   - `HOSTNAME` - Main app hostname (default: `0.0.0.0`)

**Secrets location:**
- `.env.local` file (not committed to git)
- Example template: `.env.example`
- Docker: Environment variables passed via `docker-compose.yml` or runtime secrets

## Webhooks & Callbacks

**Incoming:**
- Stripe webhook: `POST /api/stripe/webhook` - Receives payment events with signature validation
- Healthcheck endpoints:
  - `GET http://localhost:3000` - Main app health
  - `GET http://localhost:3001/health` - Signaling server health

**Outgoing:**
- Socket.IO signaling events to connected peers (peer-to-peer negotiation)
- Stripe API calls: create checkout sessions, construct webhook events

## Security Headers

**Content Security Policy (via `proxy.ts`):**
- Allows: Stripe.js, WebSocket connections, TURN servers, blob URLs for files
- Blocks: Plugins, mixed content (in production), cross-origin forms
- Nonce-based: Scripts validated with generated cryptographic nonce

**Additional Headers (via `next.config.ts` and `proxy.ts`):**
- `X-DNS-Prefetch-Control: on`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (production only)
- `X-Frame-Options: SAMEORIGIN` / `DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(self), microphone=(), geolocation=()`

---

*Integration audit: 2026-01-23*

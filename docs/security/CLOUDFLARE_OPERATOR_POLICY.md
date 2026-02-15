# Cloudflare Operator Policy

## Objective
Ensure edge perimeter and fallback infrastructure are enforced for production internet transfer paths.

## Required Controls
- Cloudflare Tunnel is configured for always-on operation (`restart: unless-stopped`) and ingress routes for both app and signaling domains.
- Cloudflare R2 uploads enforce server-side encryption at rest (`x-amz-server-side-encryption: AES256`) in addition to client-side E2E encryption.
- Cloudflare Worker handles signaling edge proxy with cache bypass and minimal forwarded metadata.
- Cloudflare WAF is enabled with managed rules plus explicit abuse and threat-score controls.

## Source of Truth
- `cloudflare/tunnel/config.yml`
- `cloudflare/tunnel/docker-compose.cloudflared.yml`
- `cloudflare/workers/signaling-edge-worker.js`
- `cloudflare/waf/waf-rules.json`
- `lib/cloud/cloudflare-r2.ts`

## Enforcement
- `npm run verify:cloudflare:operator`
- CI and release workflows must include the `cloudflare-operator` verification job.

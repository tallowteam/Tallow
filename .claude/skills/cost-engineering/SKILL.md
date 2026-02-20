---
name: cost-engineering
description: >
  Budget constraints and infrastructure decisions for Tallow. Auto-invoke
  when discussing hosting, infrastructure costs, scaling decisions, or
  evaluating whether a feature fits within resource constraints.
allowed-tools: Read, Grep, Glob
---

# Cost Engineering Skill

## Infrastructure Constraints
- Oracle Cloud free tier: ARM64, 1 OCPU, 12 GB RAM per instance
- Multi-cloud targets: Hetzner + DO + Vultr + Cloudflare CDN
- Privacy jurisdictions: Switzerland, Iceland

## Cost Principles
- Security from disciplined engineering, not expensive tooling
- Minimal budget approach — free tier first, scale only when necessary
- Open-source tooling preferred over paid alternatives
- Self-hostable relay servers (users bring their own infra)

## Resource Limits
- Relay server: Must fit in 1 GB RAM (Oracle free tier conservative)
- Binary size: < 10 MB stripped
- Startup time: < 100ms to first prompt
- No external service dependencies at runtime (no cloud APIs, no SaaS)

## Scaling Strategy
- Horizontal: Fully stateless relays, no shared state
- Vertical: io_uring for high-throughput on Linux
- CDN: Cloudflare for static assets (docs, update checks)
- No database required for relay operation (pure pass-through)

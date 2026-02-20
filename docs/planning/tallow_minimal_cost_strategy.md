# TALLOW — MINIMAL COST BUILD STRATEGY

> **Goal:** Build the most secure file transfer CLI ever made — for as close to $0 as possible.
> **Reality:** Some things cost money. This guide separates the non-negotiable spend from everything you can do for free.

---

## COST TIER OVERVIEW

| Tier | Cost | What You Get |
|------|------|-------------|
| **Phase 0: Solo Dev** | $0 - $50/mo | Working MVP, open source, functional transfers |
| **Phase 1: Launch Ready** | $200 - $500 one-time + $50/mo | Legal protection, basic infrastructure, public release |
| **Phase 2: Credible** | $5K - $15K one-time | Security audit, trademark, professional trust signals |
| **Phase 3: Revenue** | Self-funding | Enterprise features pay for everything |

---

## WHAT'S COMPLETELY FREE

### Development Tools — $0

| Tool | Purpose | Cost |
|------|---------|------|
| Rust toolchain | Language, compiler, cargo | Free forever |
| All Rust crates | Every dependency in the stack | Free (open source) |
| VS Code / Helix / Neovim | Editor | Free |
| Git + GitHub | Source control, issues, PRs | Free for public repos |
| GitHub Actions | CI/CD — 2,000 min/month free for public repos | Free |
| GitHub Pages | Documentation hosting | Free |
| Clippy + rustfmt + miri | Code quality, UB detection | Free |
| cargo-audit + cargo-deny | Dependency security | Free |
| cargo-fuzz | Fuzzing with libFuzzer | Free |
| ProVerif + Tamarin | Formal verification | Free (academic tools) |
| mdBook / Starlight | Documentation site generator | Free |
| Figma (free tier) | TUI mockups and design | Free |
| Discord + Matrix | Community platforms | Free |
| Sigstore / Rekor | Release signing + transparency log | Free |

### Testing & Quality — $0

| Tool | Purpose | Cost |
|------|---------|------|
| cargo test / nextest | Unit + integration testing | Free |
| criterion | Benchmarking | Free |
| proptest | Property-based testing | Free |
| Docker Compose | Integration test network | Free (local) |
| OSS-Fuzz | Continuous fuzzing (once accepted) | Free (Google runs it) |
| cargo-mutants | Mutation testing | Free |
| semgrep | SAST scanning | Free for open source |

### Distribution — $0

| Channel | Cost |
|---------|------|
| GitHub Releases | Free (binary hosting) |
| crates.io | Free (Rust package registry) |
| AUR (Arch Linux) | Free (community maintained) |
| Homebrew tap | Free (your own tap repo) |
| Nix package | Free |
| Docker Hub | Free (1 public repo) |

**Total development cost: $0**
You can build the entire Tallow client for free using only open-source tools.

---

## WHAT COSTS MONEY (AND HOW TO MINIMIZE)

### 1. Domain Name — $10-15/year (NON-NEGOTIABLE)

| Option | Cost |
|--------|------|
| tallow.dev | ~$12/year |
| tallow.io | ~$30/year |
| tallowcli.com | ~$10/year |

**Recommendation:** Get `tallow.dev` — `.dev` forces HTTPS, signals technical project. Use Cloudflare Registrar for cheapest renewal.

**Cost: ~$12/year**

---

### 2. Relay Infrastructure — $0 to $20/month

This is where most people think it's expensive. It doesn't have to be.

#### Phase 0: Zero Cost Relay Options

| Approach | Cost | How |
|----------|------|-----|
| P2P only (no relay) | $0 | Ship without relays. Direct connections work for LAN and when both peers have public IPs |
| Free tier VPS | $0 | Oracle Cloud free tier: 4 ARM cores, 24GB RAM, 200GB storage, FOREVER FREE. This runs a Tallow relay easily |
| Home server | $0 | Your Synology NAS can run a Tallow relay via Docker |

**Seriously: Oracle Cloud's free ARM tier is absurdly generous.** A single free-tier instance can handle 1,000+ concurrent relay connections.

#### Phase 1: Cheap Relay Options

| Provider | Cost | Specs |
|----------|------|-------|
| Hetzner CAX11 (ARM) | €3.79/mo (~$4) | 2 vCPU, 4GB RAM, 40GB, 20TB traffic |
| Hetzner CX22 | €5.39/mo (~$6) | 2 vCPU, 4GB RAM, 40GB, 20TB traffic |
| Netcup RS 1000 | €4.99/mo (~$5) | 2 cores, 4GB RAM, 60GB, unlimited traffic |
| BuyVM (privacy) | $3.50/mo | 1 core, 1GB RAM, 20GB SSD, unmetered |
| RackNerd | $10.99/YEAR | 1 core, 1GB RAM, 15GB SSD (annual deal) |

**Minimal viable relay network:**
- 1x Oracle Cloud free tier (US)
- 1x Hetzner CAX11 (EU — Germany) = $4/mo
- Total: **$4/month** for a 2-region relay network

#### Phase 2: Community-Operated Relays — $0

Once Tallow is open source, community members will run relays (like Tor). You provide:
- `tallow relay serve` one-command setup
- Docker image
- Documentation

**The relay network can scale to hundreds of nodes at zero cost to you.**

---

### 3. Legal Protection — $250-600 one-time (IMPORTANT)

| Item | Cost | Priority |
|------|------|----------|
| USPTO Trademark (TALLOW for software) | $250-350 | HIGH — Protect the name before someone squats it |
| EAR/BIS TSU notification (export control) | $0 | FREE — Just send an email to BIS and NSA with repo URL |
| AGPL-3.0 license + CLA | $0 | Free — Use existing templates |
| Legal review of CLA (optional) | $200-500 | MEDIUM — Can use Signal's CLA as template for free |

**Minimum legal spend: $250** (trademark filing)
**Recommended: $350** (trademark + CLA template review from a lawyer on Avvo/LegalZoom)

💡 **Cost saver:** File the trademark yourself via USPTO TEAS Plus ($250). Don't use a law firm ($1,500+).

---

### 4. Security Audit — $0 to $15,000 (CAN DEFER)

This is the biggest potential expense. Here's how to minimize it:

#### Free Audit Options

| Option | Cost | Quality |
|--------|------|---------|
| Self-audit with tooling | $0 | Good — cargo-audit, semgrep, miri, clippy, fuzzing |
| Community audit (open source review) | $0 | Variable — Depends on who reviews |
| Academic review (university partnership) | $0 | Good — Offer co-authorship on papers |
| Google OSS-Fuzz acceptance | $0 | Excellent — Continuous automated fuzzing |
| Trail of Bits "public good" audits | $0 | Excellent — They occasionally audit open source for free |
| OSTIF (Open Source Technology Improvement Fund) | $0 | Excellent — They fund audits for critical open source |

#### Discounted Audit Options

| Option | Cost | Notes |
|--------|------|-------|
| Trail of Bits mini-audit (1 week, scoped) | $5,000 - $8,000 | Focus on crypto protocol only |
| NCC Group open-source discount | $8,000 - $12,000 | They offer discounts for FOSS |
| Cure53 scoped review | $5,000 - $10,000 | Excellent for protocol analysis |
| Independent Rust security consultants | $2,000 - $5,000 | Hire 1-2 known Rust security people for a week |

#### The Smart Path

1. **Phase 0 ($0):** Self-audit with all free tooling + fuzzing + formal verification
2. **Phase 1 ($0):** Apply to OSTIF or Trail of Bits public good programs
3. **Phase 2 ($5K-8K):** If rejected, fund a scoped mini-audit of the crypto protocol only
4. **Phase 3 (self-funding):** Enterprise revenue pays for full audit

**Pro tip:** Apply to OSTIF early. They funded audits for OpenVPN, WireGuard, Unbound, and other security tools. Tallow fits their mission perfectly.

---

### 5. Code Signing — $0 to $100/year

| Option | Cost | Trust Level |
|--------|------|-------------|
| GPG/Ed25519 self-signing | $0 | Low — Users must manually trust your key |
| Sigstore keyless signing | $0 | Medium — Linked to GitHub OIDC identity |
| Apple Developer ID (for macOS) | $99/year | High — Removes macOS Gatekeeper warnings |
| Windows code signing (EV) | $200-400/year | High — Removes SmartScreen warnings |

**Recommendation for minimal cost:**
- Use Sigstore (free) for all releases
- Skip Apple/Windows signing until you have revenue
- macOS users can `xattr -d com.apple.quarantine tallow` as workaround
- Windows users can use `winget` or download from GitHub

**Cost: $0** (with Sigstore)

---

### 6. Documentation & Website — $0

| Component | How | Cost |
|-----------|-----|------|
| Landing page | GitHub Pages + Starlight/mdBook | $0 |
| Documentation site | GitHub Pages | $0 |
| Blog | GitHub Pages + static site generator | $0 |
| SSL | Cloudflare free tier (if using custom domain) | $0 |
| Email (security@tallow.dev) | Cloudflare Email Routing → your Gmail | $0 |
| Status page | GitHub Actions + static page | $0 |

---

### 7. Infrastructure Services — $0

| Service | Free Option |
|---------|-------------|
| DNS | Cloudflare (free tier) |
| CDN | Cloudflare (free tier) |
| DDoS protection | Cloudflare (free tier — enough for early stage) |
| Email | Cloudflare Email Routing (free) |
| Monitoring | Uptime Kuma (self-hosted on relay VPS) |
| Analytics | None needed (zero telemetry!) |
| Error tracking | None needed (local crash dumps!) |

---

## THE $0 MVP PATH

Here's exactly how to ship Tallow v0.1 for literally $0:

### What v0.1 Includes (from your Agent 48 answer)
- Send + receive files with PQ encryption
- Code phrase authentication (PAKE)
- P2P direct connections
- Single relay support
- Basic TUI progress display

### $0 Build Plan

| Step | What | Cost |
|------|------|------|
| 1 | Write Tallow in Rust using all free crates | $0 |
| 2 | Host on GitHub (public repo, AGPL-3.0) | $0 |
| 3 | CI/CD via GitHub Actions (build + test + fuzz) | $0 |
| 4 | Run relay on Oracle Cloud free tier | $0 |
| 5 | Documentation on GitHub Pages | $0 |
| 6 | Community on Discord + Matrix | $0 |
| 7 | Release binaries on GitHub Releases | $0 |
| 8 | Sign releases with Sigstore | $0 |
| 9 | Package for Homebrew tap + AUR + crates.io | $0 |
| 10 | File BIS/TSU export control notification | $0 |

**Total v0.1 cost: $0**

---

## THE $50/MONTH SUSTAINABLE PATH

Once you want to look professional:

| Item | Monthly Cost |
|------|-------------|
| Domain (tallow.dev) | $1/mo ($12/year) |
| Hetzner relay (EU) | $4/mo |
| Oracle relay (US) | $0 (free tier) |
| Cloudflare (DNS + CDN + email) | $0 |
| GitHub (CI/CD + hosting) | $0 |
| **TOTAL** | **~$5/month** |

Add trademark filing: **$250 one-time**

**Ongoing cost: $5/month + $250 one-time = $310 first year, $60/year after**

---

## COST COMPARISON: TALLOW VS SIMILAR PROJECTS

| Project | Annual Budget | Team Size | What They Spend On |
|---------|--------------|-----------|-------------------|
| Croc | ~$0 | 1 person | Relay donated, all volunteer |
| Magic Wormhole | ~$0 | 2-3 volunteers | No relay infrastructure |
| OnionShare | ~$5K | 2-3 people | Hosted by Science & Design |
| Signal | ~$50M | ~100 people | Servers, staff, legal, infrastructure |
| WireGuard | ~$50K | 1-2 core | Donated infrastructure, consulting funds development |

**Tallow can operate in the Croc/WireGuard tier: $0-$500/year with one developer.**

---

## WHERE TO NEVER CUT COSTS

Even on a $0 budget, NEVER compromise on:

| Item | Why | Free Alternative |
|------|-----|-----------------|
| Cryptographic correctness | Broken crypto = no security | Fuzzing, KAT tests, formal verification (all free) |
| Dependency auditing | Supply chain attacks are real | cargo-audit, cargo-deny, cargo-vet (all free) |
| Reproducible builds | Compromised builds = compromised users | Nix (free), GitHub Actions (free) |
| Memory safety | Memory bugs in crypto = game over | Rust (free), miri (free), sanitizers (free) |
| Code review | Fresh eyes catch critical bugs | Open source community (free) |

---

## REVENUE TIMELINE TO SELF-SUSTAINING

| Milestone | Revenue Source | Expected Income |
|-----------|---------------|-----------------|
| v0.1 release | GitHub Sponsors | $0-100/mo |
| v0.3 (chat + contacts) | GitHub Sponsors + Open Collective | $100-500/mo |
| v1.0 (stable + audited) | Pro tier ($8/mo) — 50 users | $400/mo |
| v1.x (enterprise features) | Business tier ($25/user/mo) — 10 companies | $2,500/mo |
| v2.0 (FIPS + SOC 2) | Enterprise ($custom) — 2-3 contracts | $5,000-10,000/mo |

**Break-even on $5/mo infrastructure: 1 Pro subscriber**
**Fund a security audit ($8K): 100 Pro subscribers or 1 enterprise contract**

---

## YOUR SPECIFIC COST ADVANTAGES

You already have infrastructure that reduces costs further:

1. **Synology NAS** — Can run a Tallow relay in Docker (tested environment, you already manage Docker containers)
2. **Home lab Docker experience** — Relay deployment is trivial for you
3. **Accounting background** — You can handle business formation, tax filings, and financial planning yourself
4. **CS degree** — No need to hire developers for core implementation
5. **CMA pursuit / FP&A interest** — Financial modeling for the business plan is in your wheelhouse

---

## ABSOLUTE MINIMUM BUDGET SUMMARY

| Phase | One-Time | Monthly | Annual Total |
|-------|----------|---------|-------------|
| MVP (v0.1) | $0 | $0 | **$0** |
| Professional (v0.3) | $250 (trademark) | $5 (relay) | **$310** |
| Credible (v1.0) | $5,000 (mini-audit) | $5 (relay) | **$5,060** |
| Revenue (v1.x+) | $0 | Self-funding | **$0 net** |

**You can go from idea to published, trademark-protected, relay-operational Tallow for $310 in year one.**

The security audit ($5K-8K) is the only significant expense, and even that can be $0 if OSTIF or Trail of Bits accepts you for their public good programs.

---

## NEXT STEPS — PRIORITY ORDER

1. **Register tallow.dev** ($12) — Do this TODAY before someone takes it
2. **Create GitHub repo** ($0) — AGPL-3.0, README, roadmap
3. **Build tallow-crypto crate** ($0) — The foundation: ML-KEM + X25519 + AES-GCM + BLAKE3
4. **Build tallow-protocol crate** ($0) — PAKE + handshake + streaming AEAD
5. **Build tallow-cli** ($0) — `tallow send` and `tallow receive` with code phrases
6. **Deploy relay on Oracle free tier** ($0) — Single relay for testing
7. **Ship v0.1 on GitHub** ($0) — Working MVP
8. **File trademark** ($250) — Protect the name
9. **Apply to OSTIF for funded audit** ($0) — Start the process early
10. **Open GitHub Sponsors** ($0) — Start accepting funding

**Total to reach step 7: $0**
**Total to reach step 10: $262**

---

*Tallow — built by one person, funded by conviction, secured by math.*

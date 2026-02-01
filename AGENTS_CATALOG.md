# TALLOW Agents Catalog

This document catalogs all specialized agents available for TALLOW development.

---

## Quick Reference

| Agent | Purpose | Model |
|-------|---------|-------|
| `go-expert` | CLI & Relay development | opus |
| `react-nextjs-pro` | Frontend components | opus |
| `pqc-crypto-auditor` | Security review | opus |
| `test-automator` | Test coverage | opus |
| `playwright-expert` | E2E testing | opus |
| `devops-engineer` | CI/CD & infrastructure | opus |
| `performance-engineer` | Speed optimization | opus |
| `webrtc-optimizer` | Transfer throughput | opus |
| `accessibility-expert` | A11y compliance | opus |
| `documentation-engineer` | Docs & guides | opus |
| `framer-motion-pro` | Animations | opus |
| `flutter-pro` | Mobile app | opus |
| `i18n-expert` | Internationalization | opus |
| `mdns-discovery` | Local network | opus |
| `monitoring-expert` | Observability | opus |
| `nat-traversal` | Network connectivity | opus |
| `penetration-tester` | Security testing | opus |
| `protocol-security` | Protocol audit | opus |
| `relay-architect` | Relay design | opus |
| `rust-performance` | WASM optimization | opus |

---

## GSD (Get Shit Done) Commands

The GSD addon provides structured project management:

### Project Management
```bash
/gsd:new-project     # Initialize new project with roadmap
/gsd:new-milestone   # Start new milestone cycle
/gsd:progress        # Check project progress
/gsd:complete-milestone  # Archive completed milestone
```

### Phase Planning
```bash
/gsd:plan-phase      # Create detailed execution plan
/gsd:execute-phase   # Execute plan with atomic commits
/gsd:verify-work     # Validate features
/gsd:add-phase       # Add phase to roadmap
/gsd:remove-phase    # Remove future phase
```

### Research & Debug
```bash
/gsd:research-phase  # Research before planning
/gsd:debug           # Systematic debugging
/gsd:map-codebase    # Analyze codebase structure
```

### Task Management
```bash
/gsd:add-todo        # Add task to todo list
/gsd:check-todos     # List pending todos
/gsd:quick           # Execute quick task
```

### Session Control
```bash
/gsd:pause-work      # Create context handoff
/gsd:resume-work     # Resume from previous session
/gsd:settings        # Configure GSD toggles
/gsd:help            # Show all commands
```

---

## Agent Details

### 1. go-expert
**Purpose:** Build Go-based CLI tool and relay server

**Capabilities:**
- CLI development (croc-style UX)
- PAKE implementation with CPace
- Relay server architecture
- Cross-platform builds

**Key Files:**
```
tallow-cli/
├── cmd/tallow/main.go
├── internal/cli/{send,receive,relay}.go
├── internal/crypto/{pqc,pake,hybrid}.go
└── internal/transfer/{sender,receiver}.go
```

---

### 2. pqc-crypto-auditor
**Purpose:** Security audit for post-quantum cryptography

**Audit Checklist:**
- [ ] Key generation uses CSPRNG
- [ ] Keys never logged
- [ ] Keys zeroed after use
- [ ] ML-KEM + X25519 complete before encryption
- [ ] Nonces never reused
- [ ] Auth tag verified before decryption
- [ ] Argon2id with ≥64MB memory

**Critical Files:**
```
lib/crypto/pqc-encryption.ts
lib/crypto/password-file-encryption.ts
lib/chat/encryption/triple-ratchet.ts
lib/signaling/signaling-crypto.ts
```

---

### 3. test-automator
**Purpose:** Improve test coverage from 70% to 90%+

**Priority Areas:**
1. Crypto paths (ML-KEM, X25519, AES-GCM)
2. Edge cases (empty files, special chars, network interruption)
3. Integration tests
4. Visual regression

---

### 4. react-nextjs-pro
**Purpose:** Maintain 141-component frontend

**Stack:**
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS
- Framer Motion
- shadcn/ui

**React 19 Features:**
- `use()` hook
- `useOptimistic`
- `useFormStatus`
- Server Components

---

### 5. playwright-expert
**Purpose:** Maintain 400+ E2E test scenarios

**Test Structure:**
```
tests/
├── e2e/
│   ├── transfer/
│   ├── chat/
│   ├── privacy/
│   └── accessibility/
├── visual/
└── fixtures/
```

---

### 6. devops-engineer
**Purpose:** CI/CD and infrastructure

**Capabilities:**
- GitHub Actions pipelines
- Docker multi-platform builds
- Kubernetes deployments
- Helm charts
- Monitoring setup

---

### 7. performance-engineer
**Purpose:** Speed and efficiency optimization

**Targets:**
- Lighthouse: 95+
- LCP: <2.5s
- FID: <100ms
- CLS: <0.1
- Bundle: <250KB gzipped

---

### 8. webrtc-optimizer
**Purpose:** Maximize transfer throughput

**Targets:**
- LAN WiFi: 200+ Mbps
- LAN Ethernet: 500+ Mbps

**Techniques:**
- Adaptive chunk sizing
- Backpressure handling
- Parallel data channels

---

### 9. accessibility-expert
**Purpose:** WCAG 2.1 AA compliance

**Focus Areas:**
- Screen reader support
- Keyboard navigation
- Color contrast
- Focus management
- ARIA labels

---

### 10. framer-motion-pro
**Purpose:** Smooth animations

**Patterns:**
- Page transitions
- List animations
- Gesture handling
- Layout animations

---

### 11. flutter-pro
**Purpose:** Cross-platform mobile app

**Features:**
- iOS/Android support
- Native file picker
- Background transfers
- Push notifications

---

### 12. i18n-expert
**Purpose:** Internationalization (21 languages)

**Languages:**
ar, bn, de, en, es, fr, he, hi, id, it, ja, ko, nl, pl, pt, ru, th, tr, uk, vi, zh

---

### 13. mdns-discovery
**Purpose:** Local network device discovery

**Implementation:**
- Zeroconf/Bonjour
- Service advertisement
- Peer resolution
- Fallback to relay

---

### 14. monitoring-expert
**Purpose:** Observability and alerting

**Stack:**
- Prometheus metrics
- Grafana dashboards
- Sentry error tracking
- Custom health checks

---

### 15. nat-traversal
**Purpose:** Network connectivity

**Techniques:**
- STUN/TURN
- ICE candidates
- Symmetric NAT handling
- Relay fallback

---

### 16. penetration-tester
**Purpose:** Security testing

**Scope:**
- API security
- XSS/CSRF prevention
- Input validation
- Rate limiting
- Auth bypass attempts

---

### 17. protocol-security
**Purpose:** Protocol audit

**Areas:**
- Message format
- Key exchange
- Session management
- Replay protection

---

### 18. relay-architect
**Purpose:** Relay server design

**Features:**
- Zero-knowledge routing
- Room management
- Rate limiting
- Horizontal scaling

---

### 19. rust-performance
**Purpose:** WASM optimization

**Focus:**
- Crypto operations in Rust
- WASM compilation
- Memory efficiency
- Performance profiling

---

### 20. documentation-engineer
**Purpose:** Technical documentation

**Outputs:**
- API documentation
- User guides
- Architecture diagrams
- Deployment guides

---

## How to Use Agents

### Via Task Tool
```
Use the Task tool with subagent_type matching the agent name:

Task(
  description="Audit crypto implementation",
  prompt="Review lib/crypto/pqc-encryption.ts for security issues",
  subagent_type="pqc-crypto-auditor"
)
```

### Via GSD Commands
```bash
# Quick task with specific focus
/gsd:quick "Optimize WebRTC chunk size for better throughput"

# Execute full phase
/gsd:execute-phase 3
```

---

## Agent Files Location

```
subagents/agents/
├── accessibility-expert.md
├── devops-engineer.md
├── documentation-engineer.md
├── flutter-pro.md
├── framer-motion-pro.md
├── go-expert.md
├── i18n-expert.md
├── mdns-discovery.md
├── monitoring-expert.md
├── nat-traversal.md
├── penetration-tester.md
├── performance-engineer.md
├── playwright-expert.md
├── pqc-crypto-auditor.md
├── protocol-security.md
├── react-nextjs-pro.md
├── relay-architect.md
├── rust-performance.md
├── test-automator.md
└── webrtc-optimizer.md
```

---

## GSD Configuration

Located at `.claude/get-shit-done/templates/config.json`

```json
{
  "planning": {
    "requireQuestions": true,
    "maxQuestionsPerPhase": 5
  },
  "execution": {
    "atomicCommits": true,
    "checkpointsEnabled": true
  },
  "verification": {
    "runTests": true,
    "requirePassing": true
  }
}
```

---

## Best Practices

1. **Use specialized agents** for domain-specific tasks
2. **Run crypto audits** before any security-related release
3. **Execute tests** after significant changes
4. **Check progress** regularly with `/gsd:progress`
5. **Pause work** properly to maintain context across sessions

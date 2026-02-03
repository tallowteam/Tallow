# TALLOW FRONTEND CLAUDE.MD SNIPPET

Copy everything below this line into your project's CLAUDE.md:

---

## 👥 TALLOW FRONTEND SUBAGENT TEAM

You have 12 specialized agents for building Tallow's frontend. **USE THEM
PROACTIVELY.**

### 🏗️ Architecture & Development

| Agent                     | Model  | Use For                                                          |
| ------------------------- | ------ | ---------------------------------------------------------------- |
| `react-architect`         | Opus   | React 19, RSC, Server Actions, Suspense, Next.js 15 App Router   |
| `state-management-expert` | Sonnet | Zustand stores, WebRTC state sync, transfer progress, peer state |
| `typescript-expert`       | Opus   | Strict TypeScript, Zod schemas, generics, discriminated unions   |

### 🔒 Security (CRITICAL for Tallow)

| Agent                | Model | Use For                                                                 |
| -------------------- | ----- | ----------------------------------------------------------------------- |
| `security-auditor`   | Opus  | OWASP compliance, SAST scanning, vulnerability detection, crypto review |
| `security-architect` | Opus  | SAS verification UI, trust indicators, privacy settings, security UX    |

### 🎨 UI/UX & Design

| Agent                 | Model  | Use For                                                             |
| --------------------- | ------ | ------------------------------------------------------------------- |
| `ui-ux-designer`      | Sonnet | Design system, wireframes, component specs, user flows              |
| `tailwind-specialist` | Haiku  | Tailwind CSS, CVA variants, dark mode, responsive design            |
| `ui-visual-validator` | Sonnet | Screenshot verification, visual regression, design-to-code matching |

### ✅ Quality & Performance

| Agent                  | Model  | Use For                                                       |
| ---------------------- | ------ | ------------------------------------------------------------- |
| `test-automator`       | Sonnet | TDD, React Testing Library, Vitest, test generation, coverage |
| `code-reviewer`        | Opus   | Bug detection, race conditions, code quality, PR reviews      |
| `performance-engineer` | Sonnet | Bundle optimization, WebRTC profiling, Core Web Vitals        |
| `accessibility-expert` | Sonnet | WCAG 2.1 AA, keyboard navigation, screen readers, ARIA        |

---

## 📋 DELEGATION RULES

### Task Distribution

- **Complex tasks (70%)**: Delegate to specialist agents
- **Simple tasks (30%)**: Handle directly

### Mandatory Delegation

| Task Type             | Required Agents                                         |
| --------------------- | ------------------------------------------------------- |
| Security-related work | `security-auditor` + `security-architect`               |
| New components        | `ui-ux-designer` → `react-architect` → `test-automator` |
| State management      | `state-management-expert`                               |
| Performance issues    | `performance-engineer`                                  |
| Type design           | `typescript-expert`                                     |
| Accessibility         | `accessibility-expert`                                  |

### Before ANY Frontend Task

> **Ask yourself: "Which specialist agent is BEST suited for this task?"**

---

## 🔄 STANDARD WORKFLOWS

### New Component

```
ui-ux-designer → react-architect → tailwind-specialist →
test-automator → accessibility-expert → code-reviewer
```

### Security Feature (SAS, Privacy Settings, Encryption UI)

```
security-architect → react-architect → security-auditor → test-automator
```

### State Management Change

```
state-management-expert → typescript-expert → test-automator
```

### Performance Fix

```
performance-engineer → code-reviewer
```

### Accessibility Audit

```
accessibility-expert → ui-visual-validator
```

### Full PR Review

```
code-reviewer → security-auditor → performance-engineer
```

---

## 🎯 TALLOW-SPECIFIC CONTEXT

### Tech Stack

- **Framework**: Next.js 15 (App Router)
- **React**: 19 (RSC, Server Actions)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + CVA
- **State**: Zustand (with devtools, persist, immer)
- **Testing**: Vitest + React Testing Library + Playwright
- **WebRTC**: Native with data channels

### Security Requirements

- Post-quantum cryptography (ML-KEM-768 + X25519)
- Triple Ratchet for forward secrecy
- SAS verification for MITM protection
- Optional onion routing (1-3 hops)
- Metadata stripping
- Zero-knowledge architecture

### Key UI Components

1. **Transfer UI**: FileDropzone, TransferProgress, TransferList
2. **Discovery UI**: DeviceCard, DeviceGrid, ConnectionStatus
3. **Security UI**: SASVerification, SecurityBadge, PrivacySettings
4. **Room UI**: RoomCreate, RoomJoin, RoomCode, RoomMembers

### Quality Targets

- **Coverage**: 80%+ statements, 75%+ branches
- **Performance**: LCP < 1.5s, FID < 50ms, CLS < 0.05
- **Bundle**: Initial JS < 100KB
- **Accessibility**: WCAG 2.1 AA compliant

---

## 💡 QUICK INVOCATION EXAMPLES

```
"Use react-architect to design the transfer page component structure"

"Have security-auditor review the WebRTC connection for vulnerabilities"

"Get state-management-expert to implement transfer progress tracking"

"Use ui-ux-designer to create the SAS verification flow wireframe"

"Have test-automator generate tests for SecurityBadge"

"Use performance-engineer to optimize the device grid rendering"

"Get accessibility-expert to audit the modal keyboard navigation"

"Have code-reviewer check for race conditions in the transfer code"
```

---

## ⚠️ CRITICAL REMINDERS

1. **ALWAYS** use `security-auditor` + `security-architect` for ANY
   security-related work
2. **NEVER** skip testing - use `test-automator` for all new components
3. **CHECK** accessibility with `accessibility-expert` before marking components
   done
4. **REVIEW** all PRs with `code-reviewer` for bugs and race conditions
5. **OPTIMIZE** with `performance-engineer` if bundle size increases

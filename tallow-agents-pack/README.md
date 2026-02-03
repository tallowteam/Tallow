# Tallow Frontend Subagents Pack

> **12 Specialized AI Agents for Building Tallow's Frontend**

This pack contains comprehensive documentation for each subagent curated
specifically for Tallow's frontend development. These agents work together to
build a secure, performant, and accessible P2P file sharing application.

---

## 📦 What's Included

| Agent                       | Model  | Purpose                            | Primary Use Cases                                       |
| --------------------------- | ------ | ---------------------------------- | ------------------------------------------------------- |
| **react-architect**         | Opus   | React 19 + Next.js 15 architecture | RSC, Server Actions, component design                   |
| **state-management-expert** | Sonnet | Zustand state management           | WebRTC state, transfer progress, real-time sync         |
| **security-auditor**        | Opus   | Security code review               | OWASP, vulnerability scanning, crypto review            |
| **security-architect**      | Opus   | Security UX design                 | SAS verification UI, trust indicators, privacy settings |
| **test-automator**          | Sonnet | Test generation                    | React Testing Library, Vitest, TDD                      |
| **ui-ux-designer**          | Sonnet | Visual design                      | Design system, wireframes, user flows                   |
| **tailwind-specialist**     | Haiku  | CSS styling                        | Tailwind, CVA, dark mode                                |
| **ui-visual-validator**     | Sonnet | Visual verification                | Screenshot comparison, regression detection             |
| **performance-engineer**    | Sonnet | Performance optimization           | Bundle size, WebRTC throughput, Core Web Vitals         |
| **code-reviewer**           | Opus   | Code quality                       | Bug detection, race conditions, PR review               |
| **typescript-expert**       | Opus   | Type system design                 | Zod schemas, generics, discriminated unions             |
| **accessibility-expert**    | Sonnet | WCAG compliance                    | Keyboard nav, screen readers, ARIA                      |

---

## 🏗️ Agent Architecture

```
                                    ┌─────────────────────┐
                                    │   MAIN CLAUDE CODE  │
                                    │     ORCHESTRATOR    │
                                    └──────────┬──────────┘
                                               │
              ┌────────────────────────────────┼────────────────────────────────┐
              │                                │                                │
    ┌─────────▼─────────┐          ┌──────────▼──────────┐         ┌──────────▼──────────┐
    │  ARCHITECTURE     │          │     SECURITY        │         │     QUALITY         │
    │                   │          │                     │         │                     │
    │ • react-architect │          │ • security-auditor  │         │ • test-automator    │
    │ • state-mgmt-exp  │          │ • security-arch     │         │ • code-reviewer     │
    │ • typescript-exp  │          │                     │         │ • perf-engineer     │
    └─────────┬─────────┘          └──────────┬──────────┘         └──────────┬──────────┘
              │                                │                                │
              │                    ┌───────────┴───────────┐                    │
              │                    │                       │                    │
    ┌─────────▼─────────┐   ┌──────▼──────┐   ┌───────────▼────────┐  ┌────────▼────────┐
    │     UI/UX         │   │  STYLING    │   │   ACCESSIBILITY    │  │    VALIDATION   │
    │                   │   │             │   │                    │  │                 │
    │ • ui-ux-designer  │   │ • tailwind  │   │ • accessibility    │  │ • ui-visual     │
    │                   │   │   specialist│   │   -expert          │  │   -validator    │
    └───────────────────┘   └─────────────┘   └────────────────────┘  └─────────────────┘
```

---

## 🎯 Model Tier Strategy

We use a 3-tier model strategy for optimal performance and cost:

### Tier 1: Opus 4.5 (Critical)

- **react-architect** - Architecture decisions are foundational
- **security-auditor** - Security can't be compromised
- **security-architect** - Security UX must be right
- **code-reviewer** - Quality gate must be thorough
- **typescript-expert** - Type system affects everything

### Tier 2: Sonnet 4.5 (Complex)

- **state-management-expert** - Complex but patterns are known
- **test-automator** - Test generation is pattern-based
- **ui-ux-designer** - Design requires creativity
- **ui-visual-validator** - Visual analysis needs intelligence
- **performance-engineer** - Performance tuning is iterative
- **accessibility-expert** - WCAG rules are well-defined

### Tier 3: Haiku (Fast)

- **tailwind-specialist** - CSS is fast, patterns are simple

---

## 🔄 Common Workflows

### New Component Creation

```
ui-ux-designer → react-architect → tailwind-specialist →
test-automator → accessibility-expert → code-reviewer
```

### Security Feature (e.g., SAS Verification)

```
security-architect → react-architect → security-auditor →
test-automator → code-reviewer
```

### Performance Optimization

```
performance-engineer → code-reviewer
```

### State Management

```
state-management-expert → typescript-expert → test-automator
```

---

## 📋 Delegation Rules

Add these to your CLAUDE.md:

```markdown
## Delegation Rules

### Task Distribution

- **70% Complex tasks**: Delegate to specialists
- **30% Simple tasks**: Handle directly

### Mandatory Delegation

- Security work → security-auditor + security-architect
- New components → Start with ui-ux-designer
- State changes → state-management-expert
- Type design → typescript-expert

### Before ANY Task

Ask: "Which specialist agent is BEST suited for this?"
```

---

## 📁 Directory Structure

```
tallow-agents-pack/
├── README.md                          # This file
├── CLAUDE-SNIPPET.md                  # Copy to your CLAUDE.md
├── agents/
│   ├── react-architect.md             # ~400 lines
│   ├── state-management-expert.md     # ~500 lines
│   ├── security-auditor.md            # ~350 lines
│   ├── security-architect.md          # ~400 lines
│   ├── test-automator.md              # ~200 lines
│   ├── ui-ux-designer.md              # ~300 lines
│   ├── tailwind-specialist.md         # ~150 lines
│   ├── ui-visual-validator.md         # ~150 lines
│   ├── performance-engineer.md        # ~300 lines
│   ├── code-reviewer.md               # ~350 lines
│   ├── typescript-expert.md           # ~350 lines
│   └── accessibility-expert.md        # ~400 lines
└── install.sh                         # Installation script
```

---

## 🚀 Installation

### Option 1: Full Collection Install

Run the installation script to get agents from wshobson/agents and VoltAgent:

```bash
./install.sh
```

### Option 2: Use These Detailed Agents

These Markdown files contain comprehensive, Tallow-specific guidance. Copy them
to:

```bash
mkdir -p ~/.claude/agents/tallow
cp agents/*.md ~/.claude/agents/tallow/
```

### Option 3: Project-Local Agents

Copy to your Tallow project:

```bash
cp -r agents/ /path/to/tallow/.claude/agents/
```

---

## 📝 Usage Examples

### Invoking Agents

```
"Use react-architect to design the component structure for the transfer page"

"Have security-auditor review the WebRTC connection code for vulnerabilities"

"Get state-management-expert to implement the Zustand store for transfers"

"Use ui-ux-designer to create wireframes for the SAS verification flow"

"Have test-automator generate tests for all security components"
```

### Chaining Agents

```
"First use security-architect to design the SAS verification UI, then have
react-architect implement it, then get test-automator to write tests,
and finally have security-auditor review the complete implementation"
```

### Autonomous Build (with Ralph Wiggum)

```bash
claude "/ralph-loop 'Build Tallow frontend components:
1. Use ui-ux-designer for component specs
2. Use react-architect for implementation
3. Use tailwind-specialist for styling
4. Use test-automator for tests
5. Use accessibility-expert for WCAG audit
6. Use code-reviewer for final review

Output <promise>FRONTEND_COMPLETE</promise> when done.' --max-iterations 50"
```

---

## 🔧 Agent Deep Dive

### react-architect

The foundational architecture agent. Knows:

- React 19 features (RSC, Server Actions, `use` hook)
- Next.js 15 App Router patterns
- When to use 'use client' vs Server Components
- Component composition patterns
- Suspense and error boundaries
- Performance optimization

**Best for:** Component architecture, data flow design, React patterns

---

### state-management-expert

Manages all client-side state. Knows:

- Zustand store design with slices
- Middleware (devtools, persist, immer)
- Selector optimization with shallow comparison
- WebRTC state synchronization
- Real-time state updates

**Best for:** Store design, state sync, performance optimization

---

### security-auditor

The security gatekeeper. Knows:

- OWASP Top 10 compliance
- XSS, CSRF, injection prevention
- Cryptographic implementation review
- Timing attack prevention
- Secure random generation
- Dependency vulnerability scanning

**Best for:** Security code review, vulnerability detection, crypto audit

---

### security-architect

Designs user-facing security. Knows:

- Trust indicator hierarchy
- SAS verification flow design
- Security badge states
- Privacy settings organization
- Security error messaging
- Progressive security disclosure

**Best for:** Security UX, trust indicators, privacy controls

---

### test-automator

Generates comprehensive tests. Knows:

- React Testing Library patterns
- Vitest configuration
- Hook testing with renderHook
- MSW for API mocking
- Accessibility testing with jest-axe
- Coverage targets

**Best for:** Test generation, TDD workflows, coverage improvement

---

### ui-ux-designer

Creates the visual design system. Knows:

- Color palette design
- Typography scale
- Component specifications
- User flow design
- Responsive breakpoints
- Dark mode patterns

**Best for:** Design system, wireframes, visual specs

---

### tailwind-specialist

Implements the design. Knows:

- Tailwind CSS v4
- CVA for component variants
- Responsive utilities
- Animation definitions
- Custom configuration

**Best for:** CSS styling, component variants, responsive design

---

### ui-visual-validator

Verifies implementation matches design. Knows:

- Screenshot comparison
- Visual regression detection
- Playwright visual testing
- Cross-browser consistency
- Responsive verification

**Best for:** Visual QA, regression testing, design verification

---

### performance-engineer

Optimizes everything. Knows:

- Bundle size analysis
- React rendering optimization
- WebRTC throughput tuning
- Memory leak detection
- Core Web Vitals
- Lighthouse audits

**Best for:** Performance profiling, optimization, bottleneck detection

---

### code-reviewer

Quality gatekeeper. Knows:

- Bug pattern detection
- Race condition identification
- Stale closure detection
- Memory leak patterns
- Code smell detection
- PR review templates

**Best for:** Code review, bug detection, quality assessment

---

### typescript-expert

Designs the type system. Knows:

- Discriminated unions
- Zod schema design
- Generic type inference
- Branded types
- Mapped and conditional types
- Strict configuration

**Best for:** Type design, schema validation, type safety

---

### accessibility-expert

Ensures WCAG compliance. Knows:

- WCAG 2.1 AA requirements
- Keyboard navigation
- Screen reader optimization
- ARIA best practices
- Focus management
- Color contrast

**Best for:** Accessibility audit, ARIA implementation, keyboard nav

---

## 📊 Coverage Matrix

| Feature Area            | Primary Agent           | Supporting Agents                       |
| ----------------------- | ----------------------- | --------------------------------------- |
| Component Architecture  | react-architect         | typescript-expert                       |
| State Management        | state-management-expert | typescript-expert, performance-engineer |
| Security Implementation | security-auditor        | security-architect, code-reviewer       |
| Security UX             | security-architect      | ui-ux-designer, accessibility-expert    |
| Testing                 | test-automator          | code-reviewer                           |
| Visual Design           | ui-ux-designer          | tailwind-specialist                     |
| Styling                 | tailwind-specialist     | ui-ux-designer                          |
| Visual QA               | ui-visual-validator     | ui-ux-designer                          |
| Performance             | performance-engineer    | code-reviewer, react-architect          |
| Code Quality            | code-reviewer           | security-auditor, performance-engineer  |
| Type Safety             | typescript-expert       | code-reviewer                           |
| Accessibility           | accessibility-expert    | ui-ux-designer, test-automator          |

---

## 📄 License

MIT - Use these agents freely for your projects.

---

## 🙏 Credits

Based on research from:

- [wshobson/agents](https://github.com/wshobson/agents) (27.2k ⭐)
- [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents)
- Claude Code documentation
- Community best practices

---

**Happy Building! 🚀**

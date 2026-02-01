# Performance Testing Workflow

Visual guide to the automated performance testing workflow in Tallow.

## Testing Levels

```
┌──────────────────────────────────────────────────────────────┐
│                    PERFORMANCE TESTING                        │
│                        HIERARCHY                              │
└──────────────────────────────────────────────────────────────┘

Level 1: FAST CHECKS (< 10 seconds)
├─ npm run perf:bundle      → Bundle size validation
└─ npm run perf:transfer    → Transfer speed benchmark

Level 2: DETAILED TESTS (< 2 minutes)
├─ npm run perf:memory      → Memory profiling
├─ npm run perf:vitals      → Web Vitals estimation
└─ npm run perf:full        → Combined suite

Level 3: COMPREHENSIVE AUDITS (< 5 minutes)
├─ npm run perf:lighthouse  → Single Lighthouse run
└─ npm run perf:ci          → Full Lighthouse CI
```

## Development Workflow

```
┌─────────────┐
│   DEVELOP   │
│   FEATURE   │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ╔═══════════════════╗
│   BEFORE    │────▶║ npm run perf:bundle║
│   COMMIT    │     ╚═══════════════════╝
└──────┬──────┘              │
       │                     │
       │                ✓ PASS / ✗ FAIL
       ▼                     │
┌─────────────┐              │
│   COMMIT    │◀─────────────┘
└──────┬──────┘
       │
       ▼
┌─────────────┐     ╔═══════════════════╗
│   BEFORE    │────▶║ npm run perf:full  ║
│     PR      │     ╚═══════════════════╝
└──────┬──────┘              │
       │                     │
       │                ✓ PASS / ✗ FAIL
       ▼                     │
┌─────────────┐              │
│  CREATE PR  │◀─────────────┘
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  AUTO CI/CD │
│   TESTING   │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ╔═══════════════════╗
│   BEFORE    │────▶║ npm run perf:ci    ║
│  RELEASE    │     ╚═══════════════════╝
└──────┬──────┘              │
       │                     │
       │                ✓ PASS / ✗ FAIL
       ▼                     │
┌─────────────┐              │
│   DEPLOY    │◀─────────────┘
└─────────────┘
```

## CI/CD Pipeline Flow

```
┌─────────────────────────────────────────────────────────┐
│           GitHub Actions Workflow Trigger               │
│  • Push to main/master/develop                          │
│  • Pull Request                                         │
│  • Manual Dispatch                                      │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────┐         ┌───────────────┐
│  Job 1:       │         │  Job 2:       │
│  Performance  │         │  Lighthouse   │
│  Tests        │         │  CI           │
└───────┬───────┘         └───────┬───────┘
        │                         │
        │  ┌────────────┐         │  ┌────────────┐
        ├─▶│ Bundle     │         ├─▶│ Build      │
        │  │ Analysis   │         │  │ Application│
        │  └────────────┘         │  └────────────┘
        │                         │
        │  ┌────────────┐         │  ┌────────────┐
        ├─▶│ Transfer   │         ├─▶│ Start      │
        │  │ Benchmarks │         │  │ Server     │
        │  └────────────┘         │  └────────────┘
        │                         │
        │  ┌────────────┐         │  ┌────────────┐
        └─▶│ Web Vitals │         └─▶│ Lighthouse │
           │ Estimation │            │ Audits     │
           └────────────┘            └────────────┘
                 │                         │
                 │                         │
                 ▼                         ▼
           ┌────────────┐            ┌────────────┐
           │ Upload     │            │ Upload     │
           │ Performance│            │ Lighthouse │
           │ Report     │            │ Results    │
           └────────────┘            └────────────┘
                 │                         │
                 └────────────┬────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │  Job 3:             │
                   │  Performance        │
                   │  Summary            │
                   └──────────┬──────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │ • Download Artifacts│
                   │ • Generate Summary  │
                   │ • Report Status     │
                   └──────────┬──────────┘
                              │
                    ✓ PASS / ✗ FAIL
```

## Test Suite Architecture

```
┌─────────────────────────────────────────────────────────┐
│           scripts/performance-test.js                   │
└─────────────────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬────────────┐
        │            │            │            │
        ▼            ▼            ▼            ▼
    ┌───────┐   ┌───────┐   ┌───────┐   ┌───────┐
    │Bundle │   │Memory │   │Transfer   │ Web   │
    │ Size  │   │Profile│   │ Speed │   │Vitals │
    └───┬───┘   └───┬───┘   └───┬───┘   └───┬───┘
        │           │           │           │
        ├──JS      ├──RSS      ├──1MB      ├──LCP
        ├──CSS     ├──Heap     ├──10MB     ├──FID
        ├──Fonts   ├──Peak     ├──50MB     ├──CLS
        └──Total   └──Growth   └──100MB    └──FCP

                     │
                     ▼
            ┌────────────────┐
            │ performance-   │
            │ report.json    │
            └────────────────┘
```

## Lighthouse CI Flow

```
┌──────────────────────────────────────────────────────┐
│              lighthouserc.js Config                   │
└────────────────────┬─────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   ┌────────┐   ┌────────┐   ┌────────┐
   │  Home  │   │  App   │   │  How   │
   │  Page  │   │  Page  │   │  Works │
   └───┬────┘   └───┬────┘   └───┬────┘
       │            │            │
       │  Run 1, 2, 3           │
       ├────────────┼────────────┤
       │            │            │
       ▼            ▼            ▼
   ┌───────────────────────────────┐
   │     Performance Audits        │
   ├───────────────────────────────┤
   │ • Performance       ≥90       │
   │ • Accessibility     ≥95       │
   │ • Best Practices    ≥90       │
   │ • SEO              ≥90       │
   └────────────┬──────────────────┘
                │
                ▼
   ┌───────────────────────────────┐
   │     Budget Assertions         │
   ├───────────────────────────────┤
   │ • LCP < 2.5s        [error]   │
   │ • FCP < 2.0s        [warn]    │
   │ • CLS < 0.1         [error]   │
   │ • Bundle < 1MB      [error]   │
   └────────────┬──────────────────┘
                │
                ▼
   ┌───────────────────────────────┐
   │        Reports Generated       │
   ├───────────────────────────────┤
   │ • HTML Reports (per page)     │
   │ • JSON Data                   │
   │ • Manifest                    │
   │ • Database (optional)         │
   └───────────────────────────────┘
```

## Performance Budget Enforcement

```
┌─────────────────────────────────────────────────────────┐
│                  PERFORMANCE BUDGETS                     │
└─────────────────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬────────────┐
        ▼            ▼            ▼            ▼
    ┌───────┐   ┌───────┐   ┌───────┐   ┌───────┐
    │Bundle │   │ Web   │   │Light- │   │Memory │
    │ Size  │   │Vitals │   │house  │   │ Usage │
    └───┬───┘   └───┬───┘   └───┬───┘   └───┬───┘
        │           │           │           │
        ▼           ▼           ▼           ▼
    Threshold   Threshold   Min Score   Max Usage
      Check       Check        Check       Check
        │           │           │           │
        ▼           ▼           ▼           ▼
    ┌───────────────────────────────────────────┐
    │        ✓ PASS or ✗ FAIL                   │
    └────────────────┬──────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    ┌───────┐   ┌───────┐   ┌───────┐
    │ Pass: │   │ Fail: │   │Report │
    │Continue   │ Block │   │ Save  │
    │Process│   │Deploy │   │Results│
    └───────┘   └───────┘   └───────┘
```

## Artifact Generation Flow

```
┌──────────────┐
│  Test Run    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Generate     │
│ Reports      │
└──────┬───────┘
       │
       ├──────────────────────────────┐
       │                              │
       ▼                              ▼
┌────────────────┐          ┌────────────────┐
│ performance-   │          │ lighthouse-    │
│ report.json    │          │ results/       │
└────────┬───────┘          └────────┬───────┘
         │                           │
         │                  ┌────────┼────────┐
         │                  │        │        │
         │                  ▼        ▼        ▼
         │              ┌────┐   ┌────┐   ┌────┐
         │              │HTML│   │JSON│   │ DB │
         │              └────┘   └────┘   └────┘
         │                           │
         └────────────┬──────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │  Upload to:            │
         ├────────────────────────┤
         │ • GitHub Artifacts     │
         │ • Local Storage        │
         │ • Filesystem DB        │
         └────────────────────────┘
```

## Monitoring and Alerting

```
┌─────────────────────────────────────────────────────────┐
│              Performance Monitoring                      │
└─────────────────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬────────────┐
        │            │            │            │
        ▼            ▼            ▼            ▼
    ┌───────┐   ┌───────┐   ┌───────┐   ┌───────┐
    │ Real  │   │GitHub │   │ Local │   │Manual │
    │ Time  │   │Actions│   │  Dev  │   │ Audit │
    └───┬───┘   └───┬───┘   └───┬───┘   └───┬───┘
        │           │           │           │
        ▼           ▼           ▼           ▼
    ┌───────────────────────────────────────────┐
    │         Collect Metrics                   │
    └────────────────┬──────────────────────────┘
                     │
                     ▼
    ┌───────────────────────────────────────────┐
    │         Compare to Thresholds             │
    └────────────────┬──────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
    ┌───────┐   ┌───────┐   ┌───────┐
    │ Pass  │   │ Warn  │   │ Fail  │
    └───┬───┘   └───┬───┘   └───┬───┘
        │           │           │
        ▼           ▼           ▼
    Continue    Alert Team   Block Deploy
```

## Regression Detection

```
┌──────────────────────────────────────────────────────────┐
│            Performance Regression Detection               │
└──────────────────────────────────────────────────────────┘
                        │
                        ▼
              ┌────────────────┐
              │   Baseline     │
              │  (previous)    │
              └────────┬───────┘
                       │
                       ▼
              ┌────────────────┐
              │   Current      │
              │  (new test)    │
              └────────┬───────┘
                       │
                       ▼
              ┌────────────────┐
              │   Compare      │
              └────────┬───────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
      ┌───────┐   ┌───────┐   ┌───────┐
      │Improved   │ Same  │   │Regress│
      │  (✓)  │   │  (-)  │   │  (✗)  │
      └───┬───┘   └───┬───┘   └───┬───┘
          │           │           │
          └────────────┼───────────┘
                       │
                       ▼
              ┌────────────────┐
              │  Report Delta  │
              └────────┬───────┘
                       │
                       ▼
              ┌────────────────┐
              │ Update Baseline│
              │  (if approved) │
              └────────────────┘
```

## Report Viewing Flow

```
┌──────────────┐
│  Test Run    │
│  Complete    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Reports    │
│  Generated   │
└──────┬───────┘
       │
       ├────────────────────────┐
       │                        │
       ▼                        ▼
┌────────────┐          ┌────────────┐
│  Terminal  │          │  GitHub    │
│  Output    │          │  Actions   │
└──────┬─────┘          └──────┬─────┘
       │                       │
       ▼                       ▼
   View in             Download Artifacts
   Console                    │
                              ▼
                       ┌────────────┐
                       │  Open HTML │
                       │  Reports   │
                       └──────┬─────┘
                              │
                              ▼
                       ┌────────────┐
                       │  Review    │
                       │  Details   │
                       └──────┬─────┘
                              │
                              ▼
                       ┌────────────┐
                       │  Take      │
                       │  Action    │
                       └────────────┘
```

## Quick Decision Tree

```
┌─────────────────────────────────────────────────┐
│      What test should I run?                    │
└────────────────┬────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
Before Commit?         Before PR?
    │                         │
    │ YES                     │ YES
    ▼                         ▼
npm run               npm run
perf:bundle           perf:full
    │                         │
    └────────────┬────────────┘
                 │
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
Before Release?        Debugging?
    │                         │
    │ YES                     │ YES
    ▼                         ▼
npm run               npm run build:analyze
perf:ci               (bundle analyzer)
    │                         │
    │                         ▼
    │                  npm run perf:memory
    │                  (if memory issues)
    │                         │
    └────────────┬────────────┘
                 │
                 ▼
           Tests Complete
```

---

## Summary

This workflow shows the complete performance testing infrastructure from development through deployment. Each level provides appropriate testing depth for different stages of the development lifecycle, ensuring performance is monitored without slowing down development velocity.

**Key Principles**:
- Fast feedback during development
- Comprehensive checks before release
- Automated enforcement in CI/CD
- Clear reporting at all stages
- Progressive testing depth

---

**Created**: 2026-01-26
**Version**: 1.0.0

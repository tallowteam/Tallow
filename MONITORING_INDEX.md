# Monitoring Documentation Index

Complete index of all monitoring, analytics, and feature flag documentation for Tallow.

## Quick Start

**New to the monitoring infrastructure?** Start here:

1. **Read**: [Implementation Summary](MONITORING_IMPLEMENTATION_SUMMARY.md)
2. **Reference**: [Quick Reference Card](MONITORING_QUICK_REFERENCE.md)
3. **Configure**: Check `.env.example` for environment variables
4. **Test**: Run verification checklist below

## Documentation Files

### Core Documentation

| File | Description | Use When |
|------|-------------|----------|
| [MONITORING_IMPLEMENTATION_SUMMARY.md](MONITORING_IMPLEMENTATION_SUMMARY.md) | High-level overview and quick start | Getting started, understanding what was built |
| [MONITORING_ANALYTICS_DOCS.md](MONITORING_ANALYTICS_DOCS.md) | Comprehensive 500+ line guide | Need detailed information, production setup |
| [MONITORING_QUICK_REFERENCE.md](MONITORING_QUICK_REFERENCE.md) | Quick reference card | Daily development, looking up syntax |
| [MONITORING_CHANGELOG.md](MONITORING_CHANGELOG.md) | Detailed changelog of all changes | Understanding what was added, reviewing changes |
| [MONITORING_VERIFICATION.md](MONITORING_VERIFICATION.md) | Testing and verification checklist | Before deployment, troubleshooting |

### Module Documentation

| File | Description | Use When |
|------|-------------|----------|
| [lib/monitoring/README.md](lib/monitoring/README.md) | Monitoring module documentation | Working with metrics or analytics |
| [lib/monitoring/integration-example.ts](lib/monitoring/integration-example.ts) | 10 complete code examples | Need implementation examples |

### Configuration Files

| File | Description | Use When |
|------|-------------|----------|
| [grafana-dashboard.json](grafana-dashboard.json) | Grafana dashboard with 17 panels | Setting up Grafana visualization |
| [prometheus-alerts.yml](prometheus-alerts.yml) | Prometheus alerting rules | Configuring production alerts |
| [.env.example](.env.example) | Environment variable examples | Configuring the application |

### Test Files

| File | Description | Use When |
|------|-------------|----------|
| [tests/unit/monitoring/metrics.test.ts](tests/unit/monitoring/metrics.test.ts) | Unit tests for metrics | Running tests, understanding usage |

## By Use Case

### I want to...

#### Set up monitoring for the first time
1. Read: [Implementation Summary](MONITORING_IMPLEMENTATION_SUMMARY.md)
2. Configure: [.env.example](.env.example)
3. Verify: [Verification Checklist](MONITORING_VERIFICATION.md)

#### Learn how to use metrics
1. Quick lookup: [Quick Reference](MONITORING_QUICK_REFERENCE.md) → Prometheus section
2. Detailed guide: [Analytics Docs](MONITORING_ANALYTICS_DOCS.md) → Prometheus Metrics
3. Examples: [integration-example.ts](lib/monitoring/integration-example.ts)

#### Learn how to track analytics
1. Quick lookup: [Quick Reference](MONITORING_QUICK_REFERENCE.md) → Plausible section
2. Detailed guide: [Analytics Docs](MONITORING_ANALYTICS_DOCS.md) → Plausible Analytics
3. Examples: [integration-example.ts](lib/monitoring/integration-example.ts)

#### Learn how to use feature flags
1. Quick lookup: [Quick Reference](MONITORING_QUICK_REFERENCE.md) → LaunchDarkly section
2. Detailed guide: [Analytics Docs](MONITORING_ANALYTICS_DOCS.md) → LaunchDarkly Feature Flags
3. Examples: [integration-example.ts](lib/monitoring/integration-example.ts)

#### Set up Grafana dashboard
1. Import: [grafana-dashboard.json](grafana-dashboard.json)
2. Guide: [Analytics Docs](MONITORING_ANALYTICS_DOCS.md) → Grafana Dashboard
3. Alerts: [prometheus-alerts.yml](prometheus-alerts.yml)

#### Deploy to production
1. Checklist: [Verification](MONITORING_VERIFICATION.md) → Production Verification
2. Setup: [Analytics Docs](MONITORING_ANALYTICS_DOCS.md) → Production Setup
3. Environment: [.env.example](.env.example)

#### Troubleshoot issues
1. Debug: [Verification](MONITORING_VERIFICATION.md) → Error Handling
2. Guide: [Analytics Docs](MONITORING_ANALYTICS_DOCS.md) → Troubleshooting
3. Tests: [metrics.test.ts](tests/unit/monitoring/metrics.test.ts)

#### Understand what changed
1. Summary: [Implementation Summary](MONITORING_IMPLEMENTATION_SUMMARY.md)
2. Details: [Changelog](MONITORING_CHANGELOG.md)
3. Verify: [Verification Checklist](MONITORING_VERIFICATION.md)

## By Task

### Task #34: Prometheus Metrics

**Read**:
- [Implementation Summary](MONITORING_IMPLEMENTATION_SUMMARY.md) → Task #34 section
- [Analytics Docs](MONITORING_ANALYTICS_DOCS.md) → Prometheus Metrics section
- [Quick Reference](MONITORING_QUICK_REFERENCE.md) → Prometheus section

**Files**:
- `lib/monitoring/metrics.ts` - Metric definitions
- `app/api/metrics/route.ts` - API endpoint
- `grafana-dashboard.json` - Dashboard
- `prometheus-alerts.yml` - Alert rules

**Test**:
```bash
curl http://localhost:3000/api/metrics
```

### Task #35: Plausible Analytics

**Read**:
- [Implementation Summary](MONITORING_IMPLEMENTATION_SUMMARY.md) → Task #35 section
- [Analytics Docs](MONITORING_ANALYTICS_DOCS.md) → Plausible Analytics section
- [Quick Reference](MONITORING_QUICK_REFERENCE.md) → Plausible section

**Files**:
- `lib/monitoring/plausible.ts` - Analytics integration
- `components/analytics/plausible-script.tsx` - Script component

**Configure**:
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` in `.env.local`

### Task #36: LaunchDarkly Feature Flags

**Read**:
- [Implementation Summary](MONITORING_IMPLEMENTATION_SUMMARY.md) → Task #36 section
- [Analytics Docs](MONITORING_ANALYTICS_DOCS.md) → LaunchDarkly section
- [Quick Reference](MONITORING_QUICK_REFERENCE.md) → LaunchDarkly section

**Files**:
- `lib/feature-flags/launchdarkly.ts` - LD client
- `lib/feature-flags/feature-flags-context.tsx` - Context
- `lib/hooks/use-feature-flag.ts` - Hooks
- `components/admin/feature-flags-admin.tsx` - Admin UI

**Configure**:
- `NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID` in `.env.local`

## Code Examples

All examples are in: [lib/monitoring/integration-example.ts](lib/monitoring/integration-example.ts)

1. File Transfer Tracking
2. PQC Key Exchange Tracking
3. WebRTC Connection Tracking
4. Feature Usage Tracking
5. Voice Command with Feature Flag
6. Metadata Stripping with Privacy
7. Settings Change Tracking
8. Session Tracking
9. Complete Transfer Pipeline
10. Error Boundary Integration

## API Reference

### Metrics API

**Endpoint**: `GET /api/metrics`

**Documentation**:
- [Quick Reference](MONITORING_QUICK_REFERENCE.md#prometheus-metrics)
- [Full Guide](MONITORING_ANALYTICS_DOCS.md#prometheus-metrics)

### Analytics API

**Import**: `import { analytics } from '@/lib/monitoring/plausible'`

**Documentation**:
- [Quick Reference](MONITORING_QUICK_REFERENCE.md#plausible-analytics)
- [Full Guide](MONITORING_ANALYTICS_DOCS.md#plausible-analytics)

### Feature Flags API

**Import**: `import { useFeatureFlag } from '@/lib/hooks/use-feature-flag'`

**Documentation**:
- [Quick Reference](MONITORING_QUICK_REFERENCE.md#launchdarkly-feature-flags)
- [Full Guide](MONITORING_ANALYTICS_DOCS.md#launchdarkly-feature-flags)

## File Locations

### Source Code

```
lib/
├── monitoring/
│   ├── metrics.ts              # Prometheus metrics
│   ├── plausible.ts           # Analytics
│   ├── integration-example.ts # Examples
│   ├── index.ts               # Exports
│   └── README.md              # Module docs
├── feature-flags/
│   ├── launchdarkly.ts           # LD client
│   ├── feature-flags-context.tsx # Context
│   └── index.ts                  # Exports
└── hooks/
    └── use-feature-flag.ts    # Hooks
```

### Components

```
components/
├── admin/
│   └── feature-flags-admin.tsx    # Admin UI
└── analytics/
    └── plausible-script.tsx       # Script
```

### API Routes

```
app/api/
└── metrics/
    └── route.ts    # Metrics endpoint
```

### Configuration

```
Root/
├── grafana-dashboard.json      # Grafana config
├── prometheus-alerts.yml       # Alert rules
└── .env.example               # Environment vars
```

### Tests

```
tests/unit/monitoring/
└── metrics.test.ts    # Metric tests
```

### Documentation

```
Root/
├── MONITORING_ANALYTICS_DOCS.md          # Full guide
├── MONITORING_QUICK_REFERENCE.md         # Quick ref
├── MONITORING_IMPLEMENTATION_SUMMARY.md  # Summary
├── MONITORING_CHANGELOG.md               # Changes
├── MONITORING_VERIFICATION.md            # Testing
└── MONITORING_INDEX.md                   # This file
```

## Search by Topic

### Metrics
- [Prometheus Metrics Overview](MONITORING_ANALYTICS_DOCS.md#prometheus-metrics)
- [Available Metrics](MONITORING_ANALYTICS_DOCS.md#available-metrics)
- [Recording Metrics](MONITORING_QUICK_REFERENCE.md#prometheus-metrics)
- [Metric Examples](lib/monitoring/integration-example.ts)
- [Metric Tests](tests/unit/monitoring/metrics.test.ts)

### Analytics
- [Plausible Overview](MONITORING_ANALYTICS_DOCS.md#plausible-analytics)
- [Custom Events](MONITORING_ANALYTICS_DOCS.md#custom-events)
- [Tracking Examples](MONITORING_QUICK_REFERENCE.md#plausible-analytics)
- [Privacy Features](MONITORING_ANALYTICS_DOCS.md#privacy-features)

### Feature Flags
- [LaunchDarkly Overview](MONITORING_ANALYTICS_DOCS.md#launchdarkly-feature-flags)
- [Available Flags](MONITORING_ANALYTICS_DOCS.md#available-feature-flags)
- [Usage Examples](MONITORING_QUICK_REFERENCE.md#launchdarkly-feature-flags)
- [React Hooks](lib/hooks/use-feature-flag.ts)
- [Admin UI](components/admin/feature-flags-admin.tsx)

### Setup & Configuration
- [Quick Start](MONITORING_IMPLEMENTATION_SUMMARY.md#quick-start)
- [Environment Variables](.env.example)
- [Production Setup](MONITORING_ANALYTICS_DOCS.md#production-setup)
- [Verification](MONITORING_VERIFICATION.md)

### Integration
- [Integration Examples](lib/monitoring/integration-example.ts)
- [Combined Usage](MONITORING_ANALYTICS_DOCS.md#integration-examples)
- [Best Practices](MONITORING_ANALYTICS_DOCS.md#best-practices)

### Visualization
- [Grafana Dashboard](grafana-dashboard.json)
- [Dashboard Guide](MONITORING_ANALYTICS_DOCS.md#grafana-dashboard)
- [Alert Rules](prometheus-alerts.yml)

### Testing
- [Unit Tests](tests/unit/monitoring/metrics.test.ts)
- [Verification Checklist](MONITORING_VERIFICATION.md)
- [Test Instructions](MONITORING_VERIFICATION.md#functional-testing)

### Troubleshooting
- [Common Issues](MONITORING_ANALYTICS_DOCS.md#troubleshooting)
- [Error Handling](MONITORING_VERIFICATION.md#error-handling)
- [Debug Guide](lib/monitoring/README.md#troubleshooting)

## Version History

| Version | Date | Changes | Documentation |
|---------|------|---------|---------------|
| 1.0.0 | 2026-01-25 | Initial release | [Changelog](MONITORING_CHANGELOG.md) |

## Support

### Getting Help

1. **Check Documentation**: Start with relevant doc from index above
2. **Review Examples**: See [integration-example.ts](lib/monitoring/integration-example.ts)
3. **Run Tests**: Verify with [verification checklist](MONITORING_VERIFICATION.md)
4. **Check Logs**: Browser console and server logs
5. **File Issue**: If problem persists, open GitHub issue

### External Resources

- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Docs](https://grafana.com/docs/)
- [Plausible Docs](https://plausible.io/docs)
- [LaunchDarkly Docs](https://docs.launchdarkly.com/)

## Contributing

When adding new monitoring features:

1. Update relevant source files
2. Add tests to `tests/unit/monitoring/`
3. Update documentation:
   - [MONITORING_ANALYTICS_DOCS.md](MONITORING_ANALYTICS_DOCS.md)
   - [MONITORING_QUICK_REFERENCE.md](MONITORING_QUICK_REFERENCE.md)
   - [MONITORING_CHANGELOG.md](MONITORING_CHANGELOG.md)
4. Add examples to [integration-example.ts](lib/monitoring/integration-example.ts)
5. Update this index if needed

## License

Part of the Tallow project. See main LICENSE file.

---

**Quick Links**:
- [📊 Implementation Summary](MONITORING_IMPLEMENTATION_SUMMARY.md)
- [📚 Full Documentation](MONITORING_ANALYTICS_DOCS.md)
- [⚡ Quick Reference](MONITORING_QUICK_REFERENCE.md)
- [✅ Verification](MONITORING_VERIFICATION.md)
- [📝 Changelog](MONITORING_CHANGELOG.md)

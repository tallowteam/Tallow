# Bandwidth Analyst Policy (Agent 027)

**Owner:** BANDWIDTH-ANALYST (Agent 027)
**Last Updated:** 2026-02-13
**Status:** Active

## Objective

Network quality MUST be measured continuously during active transfers. A real-time speed and quality indicator MUST be available to the UI. Transfers MUST auto-downgrade on network degradation and auto-upgrade when conditions improve.

## Required Controls

### 1. Continuous Quality Measurement

- Bandwidth MUST be sampled at least once per second during active transfers.
- Samples are averaged over a 30-sample sliding window.
- Metrics tracked: throughput (bytes/s), RTT, packet loss, jitter.

### 2. Real-Time Quality Indicator

- Quality levels: `excellent` (>10 MB/s), `good` (>1 MB/s), `fair` (>256 KB/s), `poor` (>64 KB/s), `critical` (<64 KB/s).
- Quality level transitions trigger callbacks for UI updates.
- Peak throughput is tracked for reporting.

### 3. Auto-Downgrade on Degradation

- If average throughput drops below 100 KB/s, auto-downgrade triggers.
- Downgrade reduces chunk size and parallel channel count.
- Auto-upgrade when throughput exceeds 1 MB/s again.

### 4. Network Quality Integration

- `lib/network/network-quality.ts` provides RTT, packet loss, jitter monitoring.
- `lib/network/signal-strength.ts` provides signal level estimation.
- `lib/transfer/adaptive-bitrate.ts` adjusts transfer parameters based on quality.

### 5. Release Gate

- `npm run verify:bandwidth:analyst` MUST pass in CI and release workflows.

## Evidence Anchors

- `lib/network/bandwidth-monitor.ts` - Bandwidth monitoring and quality classification
- `lib/network/network-quality.ts` - Network quality metrics
- `lib/network/signal-strength.ts` - Signal strength estimation
- `lib/transfer/adaptive-bitrate.ts` - Adaptive transfer parameters
- `tests/unit/network/bandwidth-analyst.test.ts` - Unit tests
- `scripts/verify-bandwidth-analyst.js` - Verifier script

## CI/CD Integration

- **npm script:** `npm run verify:bandwidth:analyst`
- **CI job:** Runs in `unit-test` job of `.github/workflows/ci.yml`
- **Release job:** Runs in `verify-security-signoffs` job of `.github/workflows/release.yml`

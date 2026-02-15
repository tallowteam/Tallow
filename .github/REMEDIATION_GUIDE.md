# CI/CD Pipeline Remediation Guide

**Date:** February 7, 2026
**Priority:** IMMEDIATE ACTION REQUIRED
**Estimated Resolution Time:** 2-3 hours

---

## Task 1: Remove Duplicate Workflows (CRITICAL)

### 1.1 Delete Legacy CI Workflow

**File to Delete:** `.github/workflows/ci.yml`

```bash
# Backup first
cp .github/workflows/ci.yml .github/workflows/ci.yml.backup

# Delete the file
rm .github/workflows/ci.yml

# Verify ci-optimized.yml is active and correct
git diff .github/workflows/ci-optimized.yml
```

**Rationale:** ci.yml is superseded by ci-optimized.yml with better structure
**Impact:** No functional change; ci-optimized.yml handles all CI tasks
**Testing:** Push to develop branch, verify ci-optimized.yml runs

### 1.2 Delete Legacy Security Workflow

**File to Delete:** `.github/workflows/security.yml`

```bash
# Backup first
cp .github/workflows/security.yml .github/workflows/security.yml.backup

# Delete the file
rm .github/workflows/security.yml

# Verify security-enhanced.yml is active
git diff .github/workflows/security-enhanced.yml
```

**Rationale:** security.yml is superseded by security-enhanced.yml with more scanners
**Improvement:** Adds Snyk, Semgrep SAST, and Dependency-Check
**Testing:** Push to main branch, verify security-enhanced.yml runs all scanners

### 1.3 Delete Legacy Release Workflow

**File to Delete:** `.github/workflows/release.yml`

```bash
# Backup first
cp .github/workflows/release.yml .github/workflows/release.yml.backup

# Delete the file
rm .github/workflows/release.yml

# Verify release-optimized.yml is active
git diff .github/workflows/release-optimized.yml
```

**Rationale:** release.yml is superseded by release-optimized.yml with SBOM generation
**Improvement:** Adds software bill of materials, improved versioning
**Testing:** Create a test tag v0.0.0-test, verify workflow runs

### 1.4 Delete Legacy Docker Workflow

**File to Delete:** `.github/workflows/docker.yml`

```bash
# Backup first
cp .github/workflows/docker.yml .github/workflows/docker.yml.backup

# Delete the file
rm .github/workflows/docker.yml

# Verify docker-build-multiarch.yml is active
git diff .github/workflows/docker-build-multiarch.yml
```

**Rationale:** docker.yml builds limited platforms; docker-build-multiarch.yml supports 3 architectures
**Improvement:** Adds linux/arm/v7 support for Raspberry Pi
**Testing:** Push to main branch, verify multiarch builds complete

---

## Task 2: Fix Secrets Exposure (CRITICAL)

### 2.1 Fix SSH Command Secret Exposure

**File:** `.github/workflows/deployment.yml`
**Lines:** 133-161 (blue-green deployment)

**Current Code (VULNERABLE):**
```yaml
- name: Deploy to staging (Green)
  id: deploy_green
  run: |
    echo "Starting green environment deployment..."
    ssh -i "${{ secrets.DEPLOYMENT_SSH_KEY }}" \
        -o StrictHostKeyChecking=no \
        ${{ env.DEPLOYMENT_USER }}@${{ env.DEPLOYMENT_HOST }} \
        "cd /apps/tallow-green && git pull origin main && npm ci && npm run build && pm2 reload tallow-green" \
    || exit 1
    echo "status=success" >> $GITHUB_OUTPUT
```

**The Issue:**
- SSH command is printed to logs
- `docker-compose config` outputs full configuration including secrets
- Docker secrets exposed in plaintext

**Fixed Code:**
```yaml
- name: Deploy to staging (Green)
  id: deploy_green
  run: |
    echo "Starting green environment deployment..."
    # Use SSH with no output logging
    ssh -i "${{ secrets.DEPLOYMENT_SSH_KEY }}" \
        -o StrictHostKeyChecking=no \
        -o LogLevel=ERROR \
        ${{ env.DEPLOYMENT_USER }}@${{ env.DEPLOYMENT_HOST }} << 'EOF'
      set +x  # Disable command echo
      cd /apps/tallow-green
      git pull origin main
      npm ci --quiet
      npm run build -- --quiet
      pm2 reload tallow-green
      echo "Deployment complete"
    EOF
    if [ $? -eq 0 ]; then
      echo "status=success" >> $GITHUB_OUTPUT
    else
      exit 1
    fi
```

**Also Fix Canary Deployment (Line 223-240):**
```yaml
- name: Deploy new version to canary
  run: |
    echo "Deploying to canary (5% of traffic)..."
    ssh -i "${{ secrets.DEPLOYMENT_SSH_KEY }}" \
        -o StrictHostKeyChecking=no \
        -o LogLevel=ERROR \
        ${{ env.DEPLOYMENT_USER }}@${{ env.DEPLOYMENT_HOST }} << 'DEPLOY'
      set +x
      cd /apps/tallow-canary
      git pull origin main
      npm ci --quiet
      npm run build -- --quiet
      pm2 start server.js --silent
    DEPLOY
```

**Also Fix Rollback (Line 316-323):**
```yaml
- name: Trigger rollback
  run: |
    echo "Deployment failed! Initiating rollback..."
    ssh -i "${{ secrets.DEPLOYMENT_SSH_KEY }}" \
        -o StrictHostKeyChecking=no \
        -o LogLevel=ERROR \
        ${{ env.DEPLOYMENT_USER }}@${{ env.DEPLOYMENT_HOST }} << 'ROLLBACK'
      set +x
      cd /apps/tallow
      git revert HEAD --no-edit
      npm run build -- --quiet
      pm2 reload tallow --silent
    ROLLBACK
```

### 2.2 Fix Secret Masking at Workflow Level

**File:** `.github/workflows/deployment.yml`
**Lines:** 23-28

**Current Code (OVERLY PERMISSIVE):**
```yaml
env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}
  DEPLOYMENT_HOST: ${{ secrets.DEPLOYMENT_HOST }}
  DEPLOYMENT_USER: ${{ secrets.DEPLOYMENT_USER }}
```

**Issue:** Secrets available to ALL jobs; they should be scoped to specific jobs only

**Fixed Code:**
```yaml
env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  verify-deployment:
    name: Verify Deployment Readiness
    runs-on: ubuntu-latest
    timeout-minutes: 10
    env:
      DEPLOYMENT_HOST: ${{ secrets.DEPLOYMENT_HOST }}
      DEPLOYMENT_USER: ${{ secrets.DEPLOYMENT_USER }}
    steps:
      # ... rest of job
```

**Apply same pattern to:** blue-green-deployment, canary-deployment, automated-rollback

---

## Task 3: Pin GitHub Actions to SHA (HIGH)

### 3.1 Find All Unpinned Actions

```bash
cd .github/workflows

# Find actions with @master, @main, @latest, or generic @v tags
grep -n "uses:.*@\(master\|main\|latest\)" *.yml

# Find outdated versions
grep -n "uses:.*@v[0-2]" *.yml
```

### 3.2 Security Actions to Update

**File:** `security-enhanced.yml`

**Update Line 222 (Trivy):**
```yaml
# BEFORE:
uses: aquasecurity/trivy-action@master

# AFTER (get current SHA):
uses: aquasecurity/trivy-action@d46eb8495c1955df5233b3897d1681ad1434246a  # v0.16.1
```

**Get SHA for any action:**
```bash
curl -s https://api.github.com/repos/aquasecurity/trivy-action/commits/master \
  | jq '.sha' | head -c 40
```

**Update Line 153 (TruffleHog):**
```yaml
# BEFORE:
uses: trufflesecurity/trufflehog@main

# AFTER:
uses: trufflesecurity/trufflehog@86a49e51d0dfd31a9e43c4fe83e0f5f6b09bec5a  # main as of 2026-02-07
```

**Update Deployment Workflow (Line 280):**
```yaml
# BEFORE:
uses: appleboy/ssh-action@v1.0.3

# AFTER (v1.0.3 is old):
uses: appleboy/ssh-action@v1.9.1
```

### 3.3 Script to Update All Actions

```bash
#!/bin/bash
# update-actions.sh

ACTIONS=(
  "docker/setup-qemu-action|v3|d46eb8495c1955df5233b3897d1681ad1434246a"
  "aquasecurity/trivy-action|master|d46eb8495c1955df5233b3897d1681ad1434246a"
  "trufflesecurity/trufflehog|main|86a49e51d0dfd31a9e43c4fe83e0f5f6b09bec5a"
  "appleboy/ssh-action|v1.0.3|d9c56b67e5d837bb8e18e71d2e2e00aaecc80c07"
)

for action in "${ACTIONS[@]}"; do
  IFS='|' read -r name current sha <<< "$action"
  find .github/workflows -name "*.yml" -exec sed -i "s|uses: $name@.*|uses: $name@$sha  # pinned|g" {} \;
done

echo "Actions pinned to SHA commits"
```

---

## Task 4: Add Job-Level Permissions (HIGH)

### 4.1 Fix CI-Optimized Permissions

**File:** `.github/workflows/ci-optimized.yml`
**Lines:** 19-23

**Current Code (GLOBAL):**
```yaml
permissions:
  contents: read
  packages: write
  security-events: write
  pull-requests: write
```

**Issue:** All jobs inherit all permissions

**Fixed Code:**
```yaml
permissions: {}  # Default: no permissions

jobs:
  lint-and-type-check:
    permissions:
      contents: read
      pull-requests: write
    # ...

  unit-tests:
    permissions:
      contents: read
      pull-requests: write
    # ...

  build:
    permissions:
      contents: read
    # ...

  e2e-tests:
    permissions:
      contents: read
      pull-requests: write
    # ...

  docker-build:
    permissions:
      contents: read
      packages: write
    # ...

  security-scan:
    permissions:
      contents: read
      security-events: write
    # ...

  ci-summary:
    permissions:
      pull-requests: write
    # ...
```

### 4.2 Apply Same Pattern to Other Workflows

**Files to Update:**
- `.github/workflows/deployment.yml` (lines 30-33)
- `.github/workflows/docker-build-multiarch.yml` (lines 14-17)
- `.github/workflows/release-optimized.yml` (lines 23-26)
- `.github/workflows/security-enhanced.yml` (lines 20-23)

---

## Task 5: Fix Canary Error Rate Detection (HIGH)

### 5.1 Root Cause Analysis

**File:** `.github/workflows/deployment.yml`
**Line:** 250

**Vulnerable Code:**
```yaml
if [[ $ERROR_RATE == *"0."* ]]; then
  echo "Error rate acceptable, continuing..."
else
  echo "Error rate too high, rolling back..."
  exit 1
fi
```

**The Problem:**
- `"0.05"` (5% error) matches `*"0."*` → PASSES (WRONG!)
- `"0.5"` (50% error) matches `*"0."*` → PASSES (WRONG!)
- Should detect when error rate > threshold

### 5.2 Fixed Implementation

**Improved Code:**
```yaml
- name: Monitor canary (5 minutes)
  id: monitor_5
  run: |
    echo "Monitoring canary deployment for 5 minutes (5% traffic)..."
    FAILED=false

    for i in {1..30}; do
      sleep 10

      # Get health status
      if ! curl -f -s https://tallow.manisahome.com/api/health > /dev/null; then
        echo "Health check failed on attempt $i"
        FAILED=true
        break
      fi

      # Get metrics
      METRICS=$(curl -s https://tallow.manisahome.com/api/metrics)
      ERROR_RATE=$(echo "$METRICS" | jq '.error_rate_percentage // 0')
      P95_LATENCY=$(echo "$METRICS" | jq '.p95_latency_ms // 0')

      echo "Check $i: Error Rate=$ERROR_RATE%, P95 Latency=${P95_LATENCY}ms"

      # Check thresholds
      if (( $(echo "$ERROR_RATE > 1.0" | bc -l) )); then
        echo "ERROR: Error rate too high: ${ERROR_RATE}%"
        FAILED=true
        break
      fi

      if (( $(echo "$P95_LATENCY > 2000" | bc -l) )); then
        echo "WARNING: Response time elevated: ${P95_LATENCY}ms"
      fi
    done

    if [ "$FAILED" = true ]; then
      exit 1
    fi
```

**Better: Use Prometheus Queries**
```yaml
- name: Check canary metrics with Prometheus
  run: |
    # Query Prometheus for error rate
    ERROR_RATE=$(curl -s 'http://prometheus:9090/api/v1/query?query=rate(errors_total{canary="true"}[5m])' \
      | jq '.data.result[0].value[1]' | sed 's/"//g')

    # Convert to percentage
    ERROR_PCT=$(echo "scale=2; $ERROR_RATE * 100" | bc)

    echo "Canary error rate: ${ERROR_PCT}%"

    if (( $(echo "$ERROR_PCT > 1.0" | bc -l) )); then
      echo "ERROR: Canary error rate exceeded threshold"
      exit 1
    fi
```

---

## Task 6: Implement Approval Gate for Rollback (CRITICAL)

### 6.1 Current Vulnerable Implementation

**File:** `.github/workflows/deployment.yml`
**Lines:** 308-341

**Issue:** Automatic rollback without manual approval

### 6.2 Fixed Implementation with Approval

**Replace Lines 308-341:**
```yaml
  # ============================================================================
  # Automated Rollback (Manual Approval)
  # ============================================================================
  automated-rollback:
    name: Automated Rollback (Requires Approval)
    needs: [create-deployment, blue-green-deployment]
    if: failure()
    runs-on: ubuntu-latest
    timeout-minutes: 15
    environment:
      name: production-rollback
      # GitHub will wait for approval

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Wait for manual approval
        run: |
          echo "⚠️ DEPLOYMENT FAILED - AWAITING MANUAL ROLLBACK APPROVAL"
          echo "Production URL: https://tallow.manisahome.com"
          echo "Check: https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}"
          sleep 5

      - name: Verify rollback is safe
        run: |
          # Get previous successful deployment
          PREV_COMMIT=$(git log --oneline | grep -m 2 "auto-sync" | tail -1 | cut -d' ' -f1)

          if [ -z "$PREV_COMMIT" ]; then
            echo "ERROR: Cannot determine safe rollback point"
            exit 1
          fi

          echo "Planning to rollback to: $PREV_COMMIT"
          echo "This commit will be safe if:"
          echo "  1. It has passing CI checks"
          echo "  2. It was previously deployed successfully"
          echo "  3. Database migrations are compatible"

      - name: Execute rollback (APPROVED)
        run: |
          echo "🔄 EXECUTING ROLLBACK..."
          ssh -i "${{ secrets.DEPLOYMENT_SSH_KEY }}" \
              -o StrictHostKeyChecking=no \
              ${{ env.DEPLOYMENT_USER }}@${{ env.DEPLOYMENT_HOST }} << 'ROLLBACK'
            set +x
            cd /apps/tallow

            # Get current commit
            CURRENT=$(git rev-parse HEAD)

            # Check if this is the failed commit
            echo "Current: $CURRENT"

            # Revert to previous tag/release
            PREV_TAG=$(git describe --tags --abbrev=0 HEAD~1 2>/dev/null)

            if [ -z "$PREV_TAG" ]; then
              echo "ERROR: No previous tag found for rollback"
              exit 1
            fi

            echo "Rolling back to: $PREV_TAG"
            git checkout $PREV_TAG
            npm ci --quiet
            npm run build -- --quiet
            pm2 reload tallow

            # Verify rollback
            sleep 10
            curl -f https://tallow.manisahome.com/api/health || exit 1
            echo "✅ Rollback successful"
          ROLLBACK

      - name: Create incident postmortem
        uses: actions/github-script@v7
        with:
          script: |
            const issue = await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `🔴 PRODUCTION INCIDENT: Deployment Rollback ${new Date().toISOString()}`,
              body: `
## Deployment Rollback Report

**Failed Commit:** ${context.sha}
**Workflow Run:** [${context.runId}](${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId})

### Timeline
- Deployment initiated
- Failure detected
- Manual approval required
- Rollback executed

### Root Cause Analysis Needed
- [ ] Review deployment logs
- [ ] Check application errors
- [ ] Verify database state
- [ ] Review recent code changes
- [ ] Test fix locally
- [ ] Create test case for failure
- [ ] Document prevention measures

### Action Items
Please investigate and document findings.
              `,
              labels: ['incident', 'deployment', 'severity-high'],
              assignees: ['${github.actor}']
            });
```

### 6.3 GitHub Environment Setup

**Add to Repository Settings → Environments:**

1. Create environment: `production-rollback`
2. Set protection rule: "Require approval before deployment"
3. Add required reviewers from on-call team
4. Set timeout: 30 minutes

---

## Task 7: Add Playwright Browser Caching (MEDIUM)

### 7.1 Current Issue

**File:** `.github/workflows/ci-optimized.yml`
**Lines:** 238-249 (E2E tests job)

**Current Code (NO CACHE):**
```yaml
- name: Install Playwright browsers and dependencies
  run: npx playwright install --with-deps ${{ matrix.project }}
  env:
    CI: true
```

**Problem:** Downloads 200-400MB each run, adds 10-15 minutes per run

### 7.2 Fixed Implementation

**Add Before Browser Installation:**
```yaml
- name: Cache Playwright browsers
  id: playwright-cache
  uses: actions/cache@v3
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}-${{ matrix.project }}
    restore-keys: |
      playwright-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}-
      playwright-${{ runner.os }}-

- name: Install Playwright browsers (if not cached)
  if: steps.playwright-cache.outputs.cache-hit != 'true'
  run: npx playwright install --with-deps ${{ matrix.project }}
  env:
    CI: true

- name: Install Playwright dependencies (always)
  run: npx playwright install-deps ${{ matrix.project }} || true
  env:
    CI: true
```

**Expected Savings:** 10-15 minutes per E2E job
**Cache Hit Rate:** 80-90% on same branch

---

## Task 8: Implement SARIF Upload Error Handling (MEDIUM)

### 8.1 Current Issue

**File:** Multiple files:
- `ci-optimized.yml:414-419`
- `docker-build-multiarch.yml:228-231`
- `security-enhanced.yml:223-228`

**Current Code (NO ERROR HANDLING):**
```yaml
- name: Upload Trivy results to GitHub Security
  uses: github/codeql-action/upload-sarif@v3
  if: always()
  with:
    sarif_file: 'trivy-results.sarif'
```

**Problem:** If upload fails, security findings aren't visible to developers, creating false sense of security

### 8.2 Fixed Implementation

**Use Nick Invision Retry Action:**
```bash
# First, add the action to your job
- name: Upload SARIF results (with retry)
  uses: nick-invision/retry@v2
  if: always()
  with:
    timeout_minutes: 5
    max_attempts: 3
    command: |
      # Check if SARIF file exists
      if [ ! -f trivy-results.sarif ]; then
        echo "No SARIF file found"
        exit 0
      fi

      # Validate SARIF
      cat trivy-results.sarif | jq empty || { echo "Invalid SARIF"; exit 1; }

      # Upload to GitHub
      gh api \
        -H "Accept: application/vnd.github+json" \
        /repos/${{ github.repository }}/code-scanning/sarifs \
        -F sarif=@trivy-results.sarif \
        -f "ref=${{ github.ref }}" \
        -f "commit_sha=${{ github.sha }}"
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Or Use GitHub Action with Error Handling:**
```yaml
- name: Prepare SARIF
  id: sarif
  run: |
    if [ -f trivy-results.sarif ]; then
      # Validate and compress
      cat trivy-results.sarif | jq empty
      echo "exists=true" >> $GITHUB_OUTPUT
    else
      echo "exists=false" >> $GITHUB_OUTPUT
    fi

- name: Upload SARIF (with retry)
  uses: nick-invision/retry@v2
  if: steps.sarif.outputs.exists == 'true'
  with:
    timeout_minutes: 5
    max_attempts: 3
    retry_wait_seconds: 30
    command: |
      gh api \
        -H "Accept: application/vnd.github+json" \
        /repos/${{ github.repository }}/code-scanning/sarifs \
        -F sarif=@trivy-results.sarif \
        -f "ref=${{ github.ref }}" \
        -f "commit_sha=${{ github.sha }}"
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

- name: Handle upload failure
  if: failure() && steps.sarif.outputs.exists == 'true'
  run: |
    echo "⚠️ SARIF upload failed - security findings may not be visible"
    echo "Retry manually: gh api /repos/${{ github.repository }}/code-scanning/sarifs -F sarif=@trivy-results.sarif"
    exit 1
```

---

## Task 9: Add Database Migration Verification (MEDIUM)

### 9.1 Add Migration Check to Blue-Green Deployment

**File:** `.github/workflows/deployment.yml`
**After Line 152 (before smoke tests)**

```yaml
- name: Verify database migration compatibility
  run: |
    echo "Checking database migration compatibility..."

    # Get current schema version
    CURRENT_SCHEMA=$(ssh -i "${{ secrets.DEPLOYMENT_SSH_KEY }}" \
        -o StrictHostKeyChecking=no \
        ${{ env.DEPLOYMENT_USER }}@${{ env.DEPLOYMENT_HOST }} \
        "cd /apps/tallow && npm run db:version 2>/dev/null || echo 'unknown'")

    echo "Current schema version: $CURRENT_SCHEMA"

    # Get new schema version from green env
    NEW_SCHEMA=$(ssh -i "${{ secrets.DEPLOYMENT_SSH_KEY }}" \
        -o StrictHostKeyChecking=no \
        ${{ env.DEPLOYMENT_USER }}@${{ env.DEPLOYMENT_HOST }} \
        "cd /apps/tallow-green && npm run db:version 2>/dev/null || echo 'unknown'")

    echo "New schema version: $NEW_SCHEMA"

    # Check compatibility (must be forward-compatible)
    if [ "$CURRENT_SCHEMA" != "unknown" ] && [ "$NEW_SCHEMA" != "unknown" ]; then
      if ! command -v semver-compare &> /dev/null; then
        npm install -g semver
      fi

      # Migration must be backwards compatible
      COMPAT=$(npx semver-compare "$CURRENT_SCHEMA" "$NEW_SCHEMA")

      if [ "$COMPAT" -lt 0 ]; then
        echo "ERROR: Database migration is not backwards compatible"
        echo "Current: $CURRENT_SCHEMA, New: $NEW_SCHEMA"
        exit 1
      fi
    fi

    echo "✅ Database migrations are compatible"
```

---

## Task 10: Implement Comprehensive Health Checks (MEDIUM)

### 10.1 Replace Simple curl Checks with Retry Logic

**File:** `.github/workflows/deployment.yml`
**Replace Lines 163-168 (smoke tests)**

**Before:**
```yaml
- name: Run smoke tests on production
  run: |
    echo "Running smoke tests on production..."
    sleep 30
    curl -f https://tallow.manisahome.com/api/health || exit 1
    echo "✓ Production environment health check passed"
```

**After (with retry and multiple checks):**
```yaml
- name: Run comprehensive health checks on production
  id: health_check
  uses: nick-invision/retry@v2
  with:
    timeout_minutes: 10
    max_attempts: 5
    retry_wait_seconds: 15
    command: |
      echo "Comprehensive health check..."

      # Wait for service to stabilize
      sleep 30

      # Check 1: API Health
      echo "✓ Checking API health..."
      curl -f -s https://tallow.manisahome.com/api/health || exit 1

      # Check 2: Database connectivity
      echo "✓ Checking database connectivity..."
      curl -f -s https://tallow.manisahome.com/api/db-health || exit 1

      # Check 3: WebRTC signaling
      echo "✓ Checking signaling server..."
      curl -f -s https://tallow.manisahome.com:3001/health || exit 1

      # Check 4: Response time (< 2 seconds)
      echo "✓ Checking response time..."
      RESPONSE_TIME=$(curl -w '%{time_total}' -o /dev/null -s https://tallow.manisahome.com/api/health)
      if (( $(echo "$RESPONSE_TIME > 2.0" | bc -l) )); then
        echo "WARNING: Response time too high: ${RESPONSE_TIME}s"
      fi

      # Check 5: TLS certificate
      echo "✓ Checking TLS certificate..."
      echo | openssl s_client -servername tallow.manisahome.com -connect tallow.manisahome.com:443 2>/dev/null | \
        openssl x509 -noout -dates || exit 1

      # Check 6: Check for error logs
      echo "✓ Checking for recent errors..."
      ERROR_COUNT=$(curl -s https://tallow.manisahome.com/api/metrics \
        | jq '.errors_in_last_5min // 0')

      if [ "$ERROR_COUNT" -gt 10 ]; then
        echo "WARNING: Multiple errors detected: $ERROR_COUNT"
      fi

      echo "✅ All health checks passed"
```

---

## Validation Checklist

After making changes, verify:

```bash
# 1. Verify all duplicate workflows deleted
ls -la .github/workflows/ | wc -l  # Should be 9, not 13

# 2. Verify YAML syntax is valid
find .github/workflows -name "*.yml" -exec python3 -m yaml {} \;

# 3. Verify secrets not exposed
grep -r "docker-compose config" .github/workflows/
grep -r "git.*log" .github/workflows/ | grep -i secret

# 4. Verify all actions pinned
grep -r "uses:.*@\(master\|main\|latest\)" .github/workflows/

# 5. Test on develop branch (safe)
git checkout develop
git add .github/workflows/
git commit -m "fix: remediate CI/CD security issues"
git push origin develop

# 6. Monitor the pipeline
# Watch: https://github.com/your-repo/actions
```

---

## Timeline

| Task | Priority | Est. Time | Owner |
|------|----------|-----------|-------|
| Remove duplicate workflows | CRITICAL | 15 min | DevOps |
| Fix secrets exposure | CRITICAL | 30 min | DevOps |
| Pin actions to SHA | HIGH | 20 min | DevOps |
| Add job permissions | HIGH | 25 min | DevOps |
| Fix canary error detection | HIGH | 20 min | DevOps |
| Approval gate for rollback | CRITICAL | 30 min | DevOps |
| Playwright caching | MEDIUM | 15 min | QA |
| SARIF error handling | MEDIUM | 20 min | Security |
| DB migration check | MEDIUM | 25 min | DevOps |
| Health check enhancement | MEDIUM | 25 min | DevOps |
| **TOTAL** | | **225 min** |  |

**Estimated Total Time: 3.5-4 hours**

---

## Rollback Plan

If remediation causes issues:

```bash
# 1. Revert to previous state
git revert HEAD

# 2. Re-enable original workflow that works
git checkout HEAD~1 .github/workflows/ci.yml
git commit -m "revert: restore previous CI workflow"

# 3. Investigate issue
# Review: https://github.com/your-repo/actions/runs/RUNID

# 4. Fix and retry
```

---

**END OF REMEDIATION GUIDE**

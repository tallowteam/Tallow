# Tallow CI/CD Pipeline Documentation

## Overview

This document describes the comprehensive CI/CD pipeline for Tallow, a high-performance peer-to-peer file transfer application built with Next.js 16 and TypeScript.

## Pipeline Architecture

### Workflows

1. **CI/CD Pipeline** (`ci-optimized.yml`)
   - Runs on: Push to main/master/develop, Pull Requests, Manual trigger
   - Duration: ~30-40 minutes
   - Concurrency: Latest run cancels previous

2. **Deployment Pipeline** (`deployment.yml`)
   - Runs on: Push to main, Manual trigger with strategy selection
   - Supports: Blue-Green, Canary, Rolling deployments
   - Duration: 15-45 minutes depending on strategy

3. **Security Scanning** (`security-enhanced.yml`)
   - Runs on: Push, Pull Requests, Daily schedule (2 AM UTC), Manual trigger
   - Multiple security tools: CodeQL, Semgrep, Trivy, Dependency Check
   - Duration: ~40-50 minutes

4. **Release Workflow** (`release-optimized.yml`)
   - Trigger: Git tags matching v*.*.* or manual dispatch
   - Builds multi-arch Docker images (amd64, arm64)
   - Packages Helm charts and creates GitHub Release
   - Duration: ~45-60 minutes

5. **Dependabot Auto-Updates** (`dependabot.yml`)
   - npm dependencies: Weekly (Monday 3 AM UTC)
   - GitHub Actions: Weekly (Wednesday 3 AM UTC)
   - Docker: Weekly (Friday 3 AM UTC)
   - Limit: 10 open PRs per ecosystem

## Pipeline Stages

### Stage 1: Lint & Type Check
```bash
npm run lint          # ESLint analysis
npm run type-check    # TypeScript compilation check
```
- Validates code quality and type safety
- Fails on any linting or type errors
- Dependencies: None
- Timeout: 15 minutes

### Stage 2: Unit Tests & Coverage
```bash
npm run test:unit:coverage  # Vitest with coverage
```
- Runs all unit tests
- Generates coverage reports
- Uploads to Codecov
- Comments coverage on PRs
- Dependencies: Lint & Type Check
- Timeout: 20 minutes

### Stage 3: Build Application
```bash
npm run build  # Next.js production build
```
- Compiles Next.js application
- Analyzes bundle size
- Uploads .next artifact
- Dependencies: Lint & Type Check
- Timeout: 25 minutes

### Stage 4: E2E Tests
```bash
npx playwright install --with-deps [browser]
npx playwright test --project=[browser]
```
- Tests with Chromium and Firefox
- Uploads test reports as artifacts
- Parallel execution across browsers
- Dependencies: Build
- Timeout: 35 minutes

### Stage 5: Docker Build
```bash
docker build -f Dockerfile -t web:latest .
docker build -f Dockerfile.signaling -t signaling:latest .
```
- Builds multi-architecture images (amd64, arm64)
- Images: web and signaling services
- Pushes to GitHub Container Registry
- Only pushes on non-PR events
- Dependencies: Lint, Unit Tests, Build
- Timeout: 40 minutes

### Stage 6: Security Scanning
Multiple parallel security tools:
- **CodeQL**: JavaScript/TypeScript analysis
- **npm audit**: Dependency vulnerability scanning
- **Trivy**: Filesystem and container scanning
- **Gitleaks & TruffleHog**: Secret detection
- **Semgrep**: SAST analysis
- **License Check**: License compliance

## Deployment Strategies

### Blue-Green Deployment

Safest deployment strategy with zero downtime:

1. **Deploy to Green Environment**
   - Deploy new version to staging environment
   - Run smoke tests
   - Verify health checks

2. **Traffic Switch**
   - Instantly switch all traffic to green
   - Keep blue environment ready for rollback
   - Verify production health

3. **Cleanup**
   - Keep blue environment running for rollback
   - Mark green as new production

**Characteristics:**
- Zero downtime
- Instant rollback capability
- Requires duplicate infrastructure
- Best for critical applications

### Canary Deployment

Progressive rollout with monitoring:

1. **Deploy to Canary**
   - Deploy new version to canary instance
   - Route 5% of traffic

2. **Monitor (5 minutes at 5%)**
   - Check error rates
   - Monitor response times
   - Verify no crashes

3. **Expand to 25%**
   - Gradually increase traffic
   - Continue monitoring
   - Monitor for 10 minutes

4. **Full Rollout**
   - Route 100% of traffic
   - Final health verification
   - Complete deployment

**Characteristics:**
- Gradual risk reduction
- Real user traffic testing
- Quick rollback if issues detected
- Best for detecting runtime issues

## Environment Setup

### Required Secrets

Configure these in GitHub repository settings:

```
DEPLOYMENT_HOST          # SSH host for deployment
DEPLOYMENT_USER          # SSH user for deployment
DEPLOYMENT_SSH_KEY       # Private SSH key
NAS_HOST                 # NAS server hostname
NAS_USERNAME             # NAS username
NAS_SSH_KEY              # NAS SSH private key
NAS_SSH_PORT             # NAS SSH port (optional, default 22)
CODECOV_TOKEN            # Codecov integration token
SNYK_TOKEN               # Snyk security scanning token (optional)
GITLEAKS_LICENSE         # Gitleaks license (optional)
```

### Required Workflows Permissions

Enable these in repository settings:

- **Actions**: Read & Write
- **Contents**: Read & Write
- **Deployments**: Read & Write
- **Pull Requests**: Read & Write
- **Security Events**: Read & Write

## Monitoring & Notifications

### Built-in Notifications

1. **PR Comments**
   - Coverage reports
   - Security scan results
   - E2E test summaries

2. **GitHub Issues**
   - CI/CD failures (labeled: `ci-failure`)
   - Deployment rollbacks (labeled: `incident`)
   - Release announcements (labeled: `release`)

3. **Workflow Summary**
   - Status of all jobs
   - Links to failed jobs
   - Artifacts and reports

### Health Checks

Post-deployment monitoring includes:

```bash
curl https://tallow.manisahome.com/api/health
curl https://tallow.manisahome.com/api/metrics
```

**Checks:**
- API responsiveness
- Error rates (< 1%)
- Response times (< 1000ms)
- Database connectivity

## Caching Strategy

### npm Dependencies
- **Cache**: npm package cache
- **Key**: node-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}
- **Restore**: Latest matching or any

### Docker Layers
- **Type**: GitHub Actions cache
- **Scope**: Per repository
- **Max Size**: 10GB per repository

### Build Artifacts
- **Retention**: 5-7 days
- **Compression**: Maximum (level 9)
- **Reuse**: E2E tests download build artifacts

## Concurrency Management

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.head_ref || github.run_id }}
  cancel-in-progress: true
```

- **CI Pipeline**: Latest run cancels previous on same PR/branch
- **Deployment**: No cancellation (sequential deployments)
- **Security**: Sequential to prevent race conditions
- **Release**: Sequential to prevent versioning conflicts

## Performance Metrics

### Target Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Deployment Frequency | > 10/day | - |
| Lead Time | < 1 hour | ~40 min |
| MTTR | < 30 minutes | - |
| Change Failure Rate | < 5% | - |
| Build Time | < 25 minutes | ~25 min |
| Test Time | < 35 minutes | ~30 min |
| Security Scan Time | < 50 minutes | ~45 min |

### Build Time Breakdown

- Checkout & Setup: ~2 min
- Dependencies: ~3 min (cached ~30s)
- Lint & Type Check: ~5 min
- Build: ~8 min
- Tests: ~10 min
- Docker Build: ~15 min (parallel)

## Troubleshooting

### Common Issues

#### Build Timeout
**Problem**: Build exceeds 25 minute timeout
**Solution**:
- Check bundle size: `npm run perf:bundle`
- Enable verbose logging: `NODE_DEBUG=* npm run build`
- Review `.next` directory caching

#### Test Failures
**Problem**: Intermittent E2E test failures
**Solution**:
- Review Playwright reports: `playwright-report/`
- Check test-results: `test-results/`
- Run locally: `npx playwright test --headed`

#### Deployment Failures
**Problem**: SSH connection errors
**Solution**:
- Verify SSH credentials
- Check firewall rules
- Verify known_hosts: `ssh-keyscan -H $HOST >> ~/.ssh/known_hosts`

#### Secret Leaks
**Problem**: Gitleaks detects false positives
**Solution**:
- Review `.gitleaksignore`
- Update scan patterns
- Rotate compromised secrets

## Best Practices

### 1. Branch Protection Rules

Enforce for `main` branch:

```
- Require status checks to pass before merging
  - Lint & Type Check
  - Unit Tests & Coverage
  - E2E Tests
  - Security Scanning

- Require code reviews before merging (1+ approval)
- Require branches to be up to date before merging
- Require conversations to be resolved before merging
- Include administrators in above restrictions
- Restrict who can push to matching branches
```

### 2. Commit Message Format

Follow conventional commits:

```
type(scope): subject
<blank line>
body
<blank line>
footer
```

**Types**: feat, fix, docs, style, refactor, test, chore, ci, perf, build

### 3. Pull Request Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Commit Changes**
   ```bash
   git commit -m "feat(component): add new feature"
   ```

3. **Push & Create PR**
   ```bash
   git push origin feat/my-feature
   ```

4. **Wait for CI** (All checks must pass)

5. **Request Review** (1+ approvals required)

6. **Merge** (with "Squash and merge" strategy recommended)

### 4. Release Process

1. **Prepare Release**
   ```bash
   npm version [major|minor|patch]
   git push origin --tags
   ```

2. **Workflow Triggers**
   - Git tag detected (v*.*.*)
   - Release workflow starts automatically
   - Docker images built and pushed
   - Helm chart packaged
   - GitHub Release created

3. **Verify Release**
   - Check GitHub Releases page
   - Verify Docker images in GHCR
   - Test deployment

### 5. Security

- **Secrets**: Never commit secrets, use GitHub Secrets
- **Dependencies**: Keep dependencies updated via Dependabot
- **Scanning**: Review security scan results on every PR
- **Scanning**: Enable branch protection rules
- **Signing**: Use GPG signed commits (recommended)

## Advanced Configuration

### Custom Scheduling

Modify cron schedules in workflow files:

```yaml
schedule:
  - cron: '0 2 * * *'  # Daily at 2 AM UTC
```

Cron format: `minute hour day month day-of-week`

### Slack Notifications

To add Slack notifications, install GitHub App:

```yaml
- name: Send Slack notification
  uses: slackapi/slack-github-action@v1.24.0
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "CI/CD Pipeline Result: ${{ job.status }}"
      }
```

### Custom Status Checks

Add required status checks:

```bash
gh api repos/OWNER/REPO/branches/main/protection/required_status_checks \
  --input - << 'EOF'
{
  "strict": true,
  "contexts": ["lint-and-type-check", "unit-tests", "e2e-tests"]
}
EOF
```

## Maintenance

### Weekly Tasks
- Review workflow runs
- Check Dependabot PRs
- Monitor security scans
- Update dependencies

### Monthly Tasks
- Review deployment frequency metrics
- Audit failed deployments
- Update security policies
- Review branch protection rules

### Quarterly Tasks
- Performance tuning
- Cost optimization
- Strategy review
- Security audit

## Support & Resources

### Documentation
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

### Community
- [GitHub Community](https://github.community)
- [Stack Overflow: github-actions](https://stackoverflow.com/questions/tagged/github-actions)
- [Docker Community](https://www.docker.com/community)

### Security Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)

---

**Last Updated**: 2026-02-06
**Maintained By**: DevOps Team
**Version**: 1.0.0

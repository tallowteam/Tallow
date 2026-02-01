# CI/CD Pipeline Documentation

This directory contains GitHub Actions workflows for automated testing and deployment.

## Workflows

### `ci.yml` - Continuous Integration and Deployment

Triggered on push and pull requests to `main`, `master`, and `develop` branches.

**Jobs:**
1. **Lint & Type Check** - ESLint and TypeScript validation
2. **Unit Tests** - Vitest tests with coverage reporting
3. **E2E Tests** - Playwright tests (Chromium + Firefox)
4. **Build** - Docker image build validation
5. **Security** - npm audit + Trivy vulnerability scanning
6. **Deploy** - Automated deployment to NAS (main branch only)

## Required Secrets

Configure these in: **Settings → Secrets and variables → Actions**

### Deployment Secrets (Required for auto-deploy)

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `NAS_HOST` | NAS IP address or hostname | `192.168.4.3` or `nas.local` |
| `NAS_USERNAME` | SSH username | `admin` |
| `NAS_SSH_KEY` | Private SSH key for authentication | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `NAS_SSH_PORT` | SSH port (optional) | `22` (default) |

### Optional Secrets

| Secret Name | Description |
|-------------|-------------|
| `CODECOV_TOKEN` | Token for code coverage reports |

## Setup Instructions

### 1. Generate SSH Key Pair (if not already done)

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions@tallow" -f ~/.ssh/tallow-deploy

# Copy public key to NAS
ssh-copy-id -i ~/.ssh/tallow-deploy.pub admin@192.168.4.3
```

### 2. Add SSH Private Key to GitHub Secrets

```bash
# Display private key
cat ~/.ssh/tallow-deploy

# Copy the entire output (including header/footer)
# Add to GitHub: Settings → Secrets → New repository secret
# Name: NAS_SSH_KEY
# Value: (paste the private key)
```

### 3. Add Other Secrets

```bash
# NAS_HOST
Value: 192.168.4.3 (or your NAS IP)

# NAS_USERNAME
Value: admin (or your SSH username)

# NAS_SSH_PORT (optional)
Value: 22
```

### 4. Configure NAS Deployment Path

The workflow expects the Tallow repository at: `/volume1/docker/tallow`

If your path is different, update the `deploy` job in `ci.yml`:

```yaml
script: |
  cd /your/custom/path
  git pull origin main
  docker compose up -d --build
```

## Manual Deployment

To deploy manually without pushing to `main`:

```bash
# 1. Go to Actions tab on GitHub
# 2. Select "CI/CD Pipeline" workflow
# 3. Click "Run workflow"
# 4. Select branch and confirm
```

## Testing Locally

### Run all checks locally before pushing:

```bash
# Lint
npm run lint

# Type check
npx tsc --noEmit

# Unit tests
npm run test:unit

# E2E tests
npm run test

# Build Docker images
docker build -t tallow:test .
docker build -t tallow-signaling:test -f Dockerfile.signaling .
```

## Troubleshooting

### Deployment fails with "Permission denied"

**Solution:** Ensure SSH key is added to NAS authorized_keys:
```bash
ssh admin@192.168.4.3 "cat ~/.ssh/authorized_keys"
# Should contain the public key
```

### E2E tests timeout

**Solution:** Increase timeout in `ci.yml`:
```yaml
timeout-minutes: 30  # Increase to 45 or 60
```

### Docker build fails

**Solution:** Check Dockerfile syntax and dependencies:
```bash
docker build --no-cache -t tallow:debug .
```

### Health check fails after deployment

**Solution:**
1. Check Docker containers: `docker compose ps`
2. View logs: `docker compose logs tallow signaling`
3. Verify Cloudflare tunnel is running
4. Test locally: `curl http://localhost:3000`

## Status Badge

Add this to your README.md:

```markdown
[![CI/CD](https://github.com/YOUR-USERNAME/Tallow/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR-USERNAME/Tallow/actions/workflows/ci.yml)
```

## Workflow Diagram

```
┌─────────────┐
│ Push/PR     │
└──────┬──────┘
       │
       ├─────► Lint & Type Check
       ├─────► Unit Tests ────► Codecov
       ├─────► E2E Tests (Chromium)
       ├─────► E2E Tests (Firefox)
       ├─────► Build Docker
       └─────► Security Scan
                   │
                   ▼
           ┌───────────────┐
           │ All Pass?     │
           └───┬───────────┘
               │ Yes (main only)
               ▼
          ┌────────────┐
          │   Deploy   │
          └────────────┘
```

## Environment Variables

The CI/CD pipeline uses these environment variables:

- `CI=true` - Enables CI-specific behavior in tests
- `NODE_ENV=test` - Set during tests
- `NODE_VERSION=20` - Node.js version for all jobs

## Caching

The workflow uses caching to speed up builds:

- **npm cache** - Node modules (cache key: `package-lock.json` hash)
- **Docker layer cache** - Build layers (GitHub Actions cache)
- **Playwright browsers** - Installed browsers

## Best Practices

1. **Always run tests locally** before pushing
2. **Use feature branches** for development
3. **Create PRs** for code review before merging to main
4. **Monitor Actions tab** for build status
5. **Keep secrets secure** - never commit `.env` files
6. **Review security alerts** from Trivy and npm audit

## Disabling Auto-Deploy

To disable automatic deployment on push to main:

```yaml
# In ci.yml, comment out the deploy job's if condition:
# if: github.ref == 'refs/heads/main' && github.event_name == 'push'
if: false  # Disable auto-deploy
```

Then use manual workflow dispatch for deployments.

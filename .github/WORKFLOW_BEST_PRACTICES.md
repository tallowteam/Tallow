# GitHub Actions Workflow Best Practices

## Table of Contents
1. [Security Best Practices](#security-best-practices)
2. [Performance Optimization](#performance-optimization)
3. [Reliability & Error Handling](#reliability--error-handling)
4. [Cost Optimization](#cost-optimization)
5. [Maintenance & Monitoring](#maintenance--monitoring)

## Security Best Practices

### 1. Secrets Management

**Do**:
```yaml
- name: Deploy
  uses: appleboy/ssh-action@v1.0.3
  with:
    host: ${{ secrets.SSH_HOST }}
    username: ${{ secrets.SSH_USER }}
    key: ${{ secrets.SSH_KEY }}
```

**Don't**:
```yaml
- name: Deploy
  run: ssh user@host.com  # Hard-coded credentials
```

**Guidelines**:
- Store all sensitive data in GitHub Secrets
- Use fine-grained personal access tokens (PATs) instead of password
- Rotate secrets regularly
- Use environment-specific secrets (PROD_*, STAGING_*)
- Never print secrets to logs
- Use masked inputs for sensitive values

### 2. Permissions

**Minimum Permissions Strategy**:
```yaml
permissions:
  contents: read
  packages: write
  security-events: write
```

**Never use**:
```yaml
permissions:
  contents: write  # Unless needed
  pull-requests: admin  # Unless needed
```

**Permission Scopes**:
- `contents`: Repository files
- `packages`: Container registry
- `security-events`: Security tab uploads
- `pull-requests`: PR comments
- `issues`: Issue creation
- `deployments`: Deployment records
- `id-token`: OIDC tokens

### 3. Action Pinning

**Use specific versions**:
```yaml
- uses: actions/checkout@v4          # Good
- uses: actions/setup-node@v4        # Good
- uses: docker/build-push-action@v5  # Good
```

**Avoid**:
```yaml
- uses: actions/checkout@master  # Bad - unpredictable
- uses: actions/setup-node@v4.0.1-pre.1  # Avoid pre-releases
```

**Update Cadence**:
- Review action updates weekly
- Use Dependabot for automatic updates
- Test updates on develop branch first

### 4. Code Scanning Integration

```yaml
- name: Initialize CodeQL
  uses: github/codeql-action/init@v3
  with:
    languages: javascript

- name: Upload CodeQL results
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: results.sarif
```

### 5. Artifact Security

```yaml
- name: Upload artifacts
  uses: actions/upload-artifact@v4
  with:
    name: build-artifacts
    path: dist/
    if-no-files-found: warn
    retention-days: 5  # Clean up old artifacts
```

## Performance Optimization

### 1. Caching Strategy

**npm Dependencies**:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
    cache-dependency-path: 'package-lock.json'
```

**Docker Layers**:
```yaml
- name: Build Docker image
  uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

**Custom Caching**:
```yaml
- name: Cache custom files
  uses: actions/cache@v3
  with:
    path: |
      ~/.cache/custom
      dist/
    key: ${{ runner.os }}-build-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-build-
```

### 2. Parallel Execution

```yaml
strategy:
  matrix:
    node-version: [18, 20]
    os: [ubuntu-latest, macos-latest]
  fail-fast: false  # Don't cancel other jobs on failure

jobs:
  test:
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
```

### 3. Job Dependencies

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - run: npm run lint

  test:
    needs: lint  # Wait for lint to pass
    runs-on: ubuntu-latest
    steps:
      - run: npm test

  build:
    needs: [lint, test]  # Wait for both
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
```

### 4. Conditional Execution

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - run: npm run deploy

  pr-check:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - run: npm run lint
```

### 5. Resource Optimization

```yaml
jobs:
  build:
    runs-on: ubuntu-latest  # Standard runner
    timeout-minutes: 30     # Set realistic timeout
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 1    # Shallow clone for speed

      - name: Cleanup
        run: |
          sudo rm -rf /usr/local/lib/android  # Save space
          sudo rm -rf /usr/share/dotnet
```

## Reliability & Error Handling

### 1. Retry Logic

```yaml
- name: Deploy with retry
  run: |
    for i in {1..3}; do
      npm run deploy && break || sleep 10
    done
```

**Using action**:
```yaml
- name: API call with retry
  uses: nick-invision/retry@v2
  with:
    timeout_minutes: 10
    max_attempts: 3
    retry_wait_seconds: 5
    command: npm run deploy
```

### 2. Error Handling

```yaml
- name: Build
  run: npm run build
  continue-on-error: true  # Don't fail workflow

- name: Report
  if: failure()  # Run if previous step failed
  run: echo "Build failed"

- name: Cleanup
  if: always()  # Always run
  run: npm run cleanup
```

### 3. Status Checks

```yaml
- name: Final check
  run: |
    if [ "${{ job.status }}" == "failure" ]; then
      exit 1
    fi

- name: Report status
  if: always()
  uses: actions/github-script@v7
  with:
    script: |
      const status = context.job.status;
      console.log('Job status:', status);
```

### 4. Timeouts

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30  # Job timeout

    steps:
      - name: Long-running task
        timeout-minutes: 15  # Step timeout
        run: npm run long-test
```

### 5. Health Checks

```yaml
- name: Health check
  run: |
    for i in {1..30}; do
      curl -f https://app.example.com/health && exit 0
      sleep 2
    done
    exit 1
```

## Cost Optimization

### 1. Runner Selection

```yaml
# For most CI tasks
jobs:
  test:
    runs-on: ubuntu-latest  # Cheapest
    steps:
      - run: npm test

# For heavy computation
  build-images:
    runs-on: ubuntu-latest-8-cores  # More expensive but faster
    steps:
      - run: docker buildx build .
```

### 2. Concurrency Control

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true  # Cancel old runs
```

**Usage**:
- Saves minutes on concurrent runs
- Recommended for all workflows
- Especially for PRs from same author

### 3. Artifact Cleanup

```yaml
- name: Upload artifacts
  uses: actions/upload-artifact@v4
  with:
    name: build
    path: dist/
    retention-days: 1  # Delete after 1 day
```

### 4. Job Skipping

```yaml
jobs:
  test:
    if: "!contains(github.event.head_commit.message, '[skip ci]')"
    runs-on: ubuntu-latest
    steps:
      - run: npm test
```

**Usage**:
```bash
git commit -m "docs: update readme [skip ci]"
```

### 5. Matrix Optimization

```yaml
strategy:
  matrix:
    node: [18, 20]  # Don't test too many versions
    os: [ubuntu-latest]  # Use only needed platforms
  fail-fast: true  # Stop on first failure
```

## Maintenance & Monitoring

### 1. Workflow Documentation

```yaml
name: CI Pipeline

# Clear description of what this workflow does
# When it runs
# What it requires
on:
  push:
    branches: [main]

# Environment variables
env:
  NODE_VERSION: '20'

jobs:
  # Meaningful job names with purpose
  lint-and-type-check:
    # Clear step descriptions
    steps:
      - name: Run TypeScript compiler
        run: npx tsc --noEmit
```

### 2. Monitoring & Alerts

```yaml
# Add to README or .github/workflows/README.md
|Workflow|Status|Last Run|
|--------|------|--------|
|CI|[![CI](https://github.com/repo/actions/workflows/ci.yml/badge.svg)](https://github.com/repo/actions/workflows/ci.yml)|[View](https://github.com/repo/actions/workflows/ci.yml)|
```

### 3. Notifications

```yaml
- name: Slack notification
  if: failure()
  uses: slackapi/slack-github-action@v1.24.0
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}

- name: Create issue on failure
  if: failure()
  uses: actions/github-script@v7
  with:
    script: |
      await github.rest.issues.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: `Workflow failed: ${context.workflow}`,
        body: `Run: ${context.runUrl}`
      });
```

### 4. Workflow Logging

```yaml
- name: Debug logging
  if: runner.debug == '1'
  run: set -x  # Print all commands

- name: Log environment
  run: |
    echo "Node version: $(node --version)"
    echo "npm version: $(npm --version)"
    echo "OS: $(uname -a)"
```

### 5. Performance Metrics

```yaml
- name: Report metrics
  run: |
    echo "## Workflow Metrics" >> $GITHUB_STEP_SUMMARY
    echo "Duration: $(date +%s) - $START_TIME seconds" >> $GITHUB_STEP_SUMMARY
    echo "Build size: $(du -sh dist/ | cut -f1)" >> $GITHUB_STEP_SUMMARY
```

## Common Patterns

### Pattern: Matrix with Exclude

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    node: [18, 20]
  exclude:
    - os: windows-latest
      node: 18  # Skip Node 18 on Windows
```

### Pattern: Conditional Deployment

```yaml
jobs:
  deploy:
    if: |
      github.event_name == 'push' &&
      github.ref == 'refs/heads/main' &&
      github.event.head_commit.message != '[skip deploy]'
```

### Pattern: PR Comment

```yaml
- name: Comment on PR
  if: github.event_name == 'pull_request'
  uses: actions/github-script@v7
  with:
    script: |
      await github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: '✅ All checks passed!'
      });
```

### Pattern: Upload to External Service

```yaml
- name: Upload coverage
  run: |
    curl -s -X POST https://coverage.example.com/upload \
      -H "Authorization: Bearer ${{ secrets.COVERAGE_TOKEN }}" \
      -d @coverage.json
```

### Pattern: Version Bump

```yaml
- name: Get version
  id: version
  run: echo "version=$(jq -r .version package.json)" >> $GITHUB_OUTPUT

- name: Use version
  run: echo "Current version: ${{ steps.version.outputs.version }}"
```

## Testing Workflows Locally

### Using act

```bash
# Install act
brew install act

# Run workflow locally
act push -j lint

# Run with secrets
act -s GITHUB_TOKEN=<token> push

# Debug
act -v push
```

### Manual Testing

```bash
# Simulate workflow steps locally
npm ci
npm run lint
npm run type-check
npm run test:unit
npm run build
```

## Security Audit

### Monthly Checklist

- [ ] Review workflow runs for failures
- [ ] Check for deprecated actions
- [ ] Audit secrets usage
- [ ] Update action versions
- [ ] Review permissions
- [ ] Check for hardcoded values
- [ ] Test secret rotation
- [ ] Review logs for sensitive data

### Quarterly Review

- [ ] Update runner OS versions
- [ ] Review caching strategy
- [ ] Performance analysis
- [ ] Cost optimization
- [ ] Documentation update
- [ ] Security scanning tools update

---

**Last Updated**: 2026-02-06
**Version**: 1.0.0

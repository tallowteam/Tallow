# CI/CD Integration Guide for Type Safety

This guide explains how to integrate TypeScript strict mode and ESLint checks into your CI/CD pipeline.

## GitHub Actions (Recommended)

### Setup

A complete GitHub Actions workflow has been created in `.github/workflows/type-check.yml`.

This workflow includes:
- TypeScript type checking on multiple Node versions
- ESLint with code annotations
- Accessibility-specific checks
- Security-specific checks
- Quality gate that fails if any check fails

### Usage

The workflow runs automatically on:
- Push to main/master/develop branches
- Pull requests to main/master/develop branches

### Results

- ✅ Success: All checks passed
- ❌ Failure: Check the logs and annotations
- 📊 Artifacts: Error reports uploaded for debugging

### Manual Trigger

```bash
# Trigger workflow manually
gh workflow run type-check.yml
```

## GitLab CI/CD

Create `.gitlab-ci.yml`:

```yaml
stages:
  - quality
  - test

type-check:
  stage: quality
  image: node:20
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run type-check
  artifacts:
    when: on_failure
    paths:
      - tsc-output.log
    expire_in: 1 week

eslint:
  stage: quality
  image: node:20
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run lint -- --format json --output-file eslint-report.json
  artifacts:
    reports:
      codequality: eslint-report.json
    expire_in: 1 week

quality-gate:
  stage: test
  image: node:20
  dependencies:
    - type-check
    - eslint
  script:
    - echo "All quality checks passed"
```

## CircleCI

Create `.circleci/config.yml`:

```yaml
version: 2.1

orbs:
  node: circleci/node@5.1

jobs:
  type-check:
    executor: node/default
    steps:
      - checkout
      - node/install-packages
      - run:
          name: Run TypeScript type checking
          command: npm run type-check
      - store_artifacts:
          path: tsc-output.log
          when: on_fail

  lint:
    executor: node/default
    steps:
      - checkout
      - node/install-packages
      - run:
          name: Run ESLint
          command: npm run lint
      - store_artifacts:
          path: eslint-report.json
          when: always

workflows:
  quality-checks:
    jobs:
      - type-check
      - lint
```

## Jenkins

Create `Jenkinsfile`:

```groovy
pipeline {
    agent any

    tools {
        nodejs "NodeJS 20"
    }

    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Type Check') {
            steps {
                sh 'npm run type-check'
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint -- --format json --output-file eslint-report.json'
            }
            post {
                always {
                    recordIssues(
                        enabledForFailure: true,
                        tools: [esLint(pattern: 'eslint-report.json')]
                    )
                }
            }
        }

        stage('Quality Gate') {
            when {
                expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
            }
            steps {
                echo 'All quality checks passed!'
            }
        }
    }

    post {
        failure {
            emailext (
                subject: "Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Type checking or linting failed. Check console output.",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}
```

## Azure DevOps

Create `azure-pipelines.yml`:

```yaml
trigger:
  branches:
    include:
      - main
      - master
      - develop

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '20.x'
    displayName: 'Install Node.js'

  - script: npm ci
    displayName: 'Install dependencies'

  - script: npm run type-check
    displayName: 'TypeScript type checking'
    continueOnError: false

  - script: npm run lint
    displayName: 'ESLint'
    continueOnError: false

  - task: PublishTestResults@2
    condition: always()
    inputs:
      testResultsFormat: 'JUnit'
      testResultsFiles: '**/eslint-report.xml'
      failTaskOnFailedTests: true
```

## Pre-commit Hooks (Already Configured)

The project already has Husky configured:

```bash
# .husky/pre-commit
npx lint-staged

# .husky/pre-push
npm run type-check
```

This ensures:
- Staged files are linted before commit
- Full type check runs before push

## NPM Scripts

The following scripts are available:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    "quality": "npm run type-check && npm run lint"
  }
}
```

## VS Code Integration

Add to `.vscode/settings.json`:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.run": "onType",
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Branch Protection Rules

### GitHub

Configure branch protection for main/master:

1. Settings → Branches → Add rule
2. Require status checks to pass:
   - ✓ TypeScript Type Checking
   - ✓ ESLint
   - ✓ Accessibility Check
   - ✓ Security Check
3. Require branches to be up to date
4. Require conversation resolution before merging

### GitLab

Configure in `.gitlab-ci.yml`:

```yaml
workflow:
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '$CI_COMMIT_BRANCH && $CI_OPEN_MERGE_REQUESTS'
      when: never
    - if: '$CI_COMMIT_BRANCH'

only_allow_merge_if_pipeline_succeeds: true
```

## Pull Request Template

Create `.github/pull_request_template.md`:

```markdown
## Description
Brief description of changes

## Type Safety Checklist
- [ ] All TypeScript errors fixed
- [ ] No new `any` types introduced
- [ ] All functions have return types
- [ ] Null/undefined handled properly
- [ ] ESLint passes without warnings

## Accessibility Checklist
- [ ] Alt text added for images
- [ ] ARIA labels where needed
- [ ] Keyboard navigation tested
- [ ] Form labels associated

## Security Checklist
- [ ] No eval() usage
- [ ] Input validation added
- [ ] No security vulnerabilities

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
```

## Status Badges

Add to README.md:

```markdown
![Type Check](https://github.com/username/tallow/actions/workflows/type-check.yml/badge.svg)
![ESLint](https://github.com/username/tallow/actions/workflows/type-check.yml/badge.svg)
```

## Slack/Discord Notifications

### GitHub Actions → Slack

Add to workflow:

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "Type check or lint failed in ${{ github.repository }}"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Metrics & Reporting

### Type Coverage

Add to CI:

```bash
npx type-coverage --detail --strict --at-least 95
```

### ESLint Report

Generate HTML report:

```bash
npm run lint -- --format html --output-file eslint-report.html
```

### Code Climate

Add `.codeclimate.yml`:

```yaml
version: "2"
plugins:
  eslint:
    enabled: true
    channel: "eslint-9"
  typescript:
    enabled: true
```

## Troubleshooting

### CI fails but local passes

1. Ensure same Node version
2. Clear cache: `npm ci` instead of `npm install`
3. Check for platform-specific issues
4. Verify environment variables

### Type check too slow

1. Enable incremental compilation
2. Use project references
3. Exclude test files in production builds
4. Cache node_modules

### ESLint out of memory

1. Increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096`
2. Use .eslintignore properly
3. Run on specific directories only

## Best Practices

### 1. Fail Fast
Run type checking and linting early in the pipeline

### 2. Cache Dependencies
Cache node_modules to speed up builds

### 3. Parallel Jobs
Run type check and lint in parallel

### 4. Incremental Builds
Use TypeScript incremental compilation

### 5. Clear Feedback
Provide clear error messages and annotations

### 6. Don't Skip Checks
Never bypass quality checks in CI/CD

### 7. Monitor Metrics
Track type coverage and lint errors over time

## Example Complete Pipeline

```yaml
# .github/workflows/quality.yml
name: Quality Checks

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Type Check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Quality Gate
        run: echo "✅ All checks passed!"
```

## Continuous Monitoring

### Set up alerts for:
- Increased type errors
- New ESLint violations
- Accessibility regressions
- Security vulnerabilities

### Track metrics:
- Type coverage percentage
- Lint error count
- Build time trends
- Code quality score

---

**Last Updated:** 2026-01-25
**CI/CD Status:** ✅ Configured
**Next Steps:** Enable branch protection and monitoring

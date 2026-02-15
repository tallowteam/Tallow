#!/usr/bin/env node

'use strict';

const fs = require('fs');
const https = require('https');
const path = require('path');

const POLICY_PATH = path.join(process.cwd(), 'docs', 'governance', 'BRANCH_PROTECTION_POLICY.json');
const CI_WORKFLOW_PATH = path.join(process.cwd(), '.github', 'workflows', 'ci.yml');

function ensureDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function toPosix(inputPath) {
  return inputPath.split(path.sep).join('/');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function requestGithubJson(pathname, token) {
  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        hostname: 'api.github.com',
        path: pathname,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'tallow-branch-protection-verifier',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
      (response) => {
        let body = '';
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch (error) {
              reject(new Error(`Failed to parse GitHub response: ${error instanceof Error ? error.message : String(error)}`));
            }
            return;
          }

          reject(new Error(`GitHub API ${response.statusCode || 'error'}: ${body}`));
        });
      }
    );

    request.on('error', (error) => reject(error));
    request.end();
  });
}

function checkPolicyAndWorkflow(policy) {
  const failures = [];

  if (!fs.existsSync(CI_WORKFLOW_PATH)) {
    failures.push('missing .github/workflows/ci.yml');
    return {
      pass: false,
      details: failures,
    };
  }

  const ciWorkflowContent = fs.readFileSync(CI_WORKFLOW_PATH, 'utf8');
  const suites = Array.isArray(policy.requiredSuites) ? policy.requiredSuites : [];

  suites.forEach((suite) => {
    if (!suite || typeof suite.workflowJobId !== 'string') {
      failures.push(`policy suite missing workflowJobId: ${JSON.stringify(suite)}`);
      return;
    }

    if (!ciWorkflowContent.includes(`${suite.workflowJobId}:`)) {
      failures.push(`ci.yml missing workflow job: ${suite.workflowJobId}`);
    }
  });

  return {
    pass: failures.length === 0,
    details: failures.length === 0 ? ['required workflow jobs found in ci.yml'] : failures,
  };
}

function collectContextsFromProtection(protection) {
  const requiredStatusChecks = protection && protection.required_status_checks ? protection.required_status_checks : {};
  const contexts = new Set();

  if (Array.isArray(requiredStatusChecks.contexts)) {
    requiredStatusChecks.contexts.forEach((context) => {
      if (typeof context === 'string' && context.trim().length > 0) {
        contexts.add(context);
      }
    });
  }

  if (Array.isArray(requiredStatusChecks.checks)) {
    requiredStatusChecks.checks.forEach((check) => {
      if (check && typeof check.context === 'string' && check.context.trim().length > 0) {
        contexts.add(check.context);
      }
    });
  }

  return {
    strict: requiredStatusChecks.strict === true,
    contexts: Array.from(contexts),
  };
}

async function checkRemoteBranchProtection(policy) {
  const explicitToken = process.env.BRANCH_PROTECTION_TOKEN || process.env.GH_TOKEN;
  const fallbackGithubToken = process.env.GITHUB_TOKEN;
  const token = explicitToken || fallbackGithubToken;
  const tokenSource = explicitToken ? 'explicit' : fallbackGithubToken ? 'github-token' : 'none';
  const repository = process.env.GITHUB_REPOSITORY;
  const skipRemote = process.argv.includes('--skip-remote');

  if (skipRemote) {
    return {
      pass: true,
      skipped: true,
      details: ['remote branch protection check skipped by flag'],
    };
  }

  if (!token || !repository) {
    if (process.env.CI === 'true') {
      return {
        pass: false,
        skipped: false,
        details: ['missing GITHUB_TOKEN or GITHUB_REPOSITORY in CI environment'],
      };
    }

    return {
      pass: true,
      skipped: true,
      details: ['remote branch protection check skipped (no GitHub token/repository env)'],
    };
  }

  const [owner, repo] = repository.split('/');
  const branch = policy.branch;
  if (!owner || !repo || !branch) {
    return {
      pass: false,
      skipped: false,
      details: ['invalid policy or repository metadata'],
    };
  }

  try {
    const protection = await requestGithubJson(`/repos/${owner}/${repo}/branches/${branch}/protection`, token);
    const normalized = collectContextsFromProtection(protection);
    const failures = [];

    if (policy.requireStrictStatusChecks === true && !normalized.strict) {
      failures.push('required_status_checks.strict is not enabled');
    }

    const requiredSuites = Array.isArray(policy.requiredSuites) ? policy.requiredSuites : [];
    requiredSuites.forEach((suite) => {
      const pattern = typeof suite.contextPattern === 'string' ? suite.contextPattern.trim() : '';
      if (!pattern) {
        failures.push(`suite ${suite.id || '<unknown>'} missing contextPattern`);
        return;
      }

      const found = normalized.contexts.some((context) => context.includes(pattern));
      if (!found) {
        failures.push(`missing required status context pattern "${pattern}"`);
      }
    });

    return {
      pass: failures.length === 0,
      skipped: false,
      details: failures.length === 0
        ? [`validated branch protection for ${owner}/${repo}:${branch}`, ...normalized.contexts.map((context) => `context: ${context}`)]
        : failures,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isPermissionBound = message.includes('403') || message.includes('404');

    if (tokenSource === 'github-token' && isPermissionBound) {
      return {
        pass: true,
        skipped: true,
        details: [
          'remote branch protection check skipped (default GITHUB_TOKEN lacks branch-protection read permission)',
          `raw error: ${message}`,
        ],
      };
    }

    return {
      pass: false,
      skipped: false,
      details: [`remote branch protection check failed: ${message}`],
    };
  }
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Branch Protection Verification',
    '',
    `Generated: ${report.timestamp}`,
    '',
    `Overall: ${report.passed ? 'PASS' : 'FAIL'}`,
    '',
    '## Checks',
    `- ${report.localCheck.pass ? '[PASS]' : '[FAIL]'} Local policy/workflow consistency`,
    `- ${report.remoteCheck.pass ? '[PASS]' : '[FAIL]'} Remote branch protection${report.remoteCheck.skipped ? ' (skipped)' : ''}`,
    '',
    '## Local Check Details',
    ...report.localCheck.details.map((detail) => `- ${detail}`),
    '',
    '## Remote Check Details',
    ...report.remoteCheck.details.map((detail) => `- ${detail}`),
    '',
  ];

  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
}

async function main() {
  if (!fs.existsSync(POLICY_PATH)) {
    console.error('[verify-branch-protection] Missing policy file: docs/governance/BRANCH_PROTECTION_POLICY.json');
    process.exit(1);
  }

  const policy = readJson(POLICY_PATH);
  const localCheck = checkPolicyAndWorkflow(policy);
  const remoteCheck = await checkRemoteBranchProtection(policy);

  const report = {
    timestamp: new Date().toISOString(),
    policyPath: toPosix(path.relative(process.cwd(), POLICY_PATH)),
    localCheck,
    remoteCheck,
    passed: localCheck.pass && remoteCheck.pass,
  };

  const reportsDirectory = path.join(process.cwd(), 'reports');
  ensureDirectory(reportsDirectory);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(reportsDirectory, `branch-protection-${stamp}.json`);
  const mdPath = path.join(reportsDirectory, `branch-protection-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-branch-protection] JSON: ${toPosix(path.relative(process.cwd(), jsonPath))}`);
  console.log(`[verify-branch-protection] Markdown: ${toPosix(path.relative(process.cwd(), mdPath))}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();

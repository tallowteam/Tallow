#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DOCKERFILE_PATH = path.join(ROOT, 'Dockerfile');
const SIGNALING_DOCKERFILE_PATH = path.join(ROOT, 'Dockerfile.signaling');
const COMPOSE_PATH = path.join(ROOT, 'docker-compose.yml');
const DOCKER_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'docker.yml');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

function ensureDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function checkFilesExist() {
  const missing = [];
  if (!fs.existsSync(DOCKERFILE_PATH)) {
    missing.push('Dockerfile');
  }
  if (!fs.existsSync(SIGNALING_DOCKERFILE_PATH)) {
    missing.push('Dockerfile.signaling');
  }
  if (!fs.existsSync(COMPOSE_PATH)) {
    missing.push('docker-compose.yml');
  }
  if (!fs.existsSync(DOCKER_WORKFLOW_PATH)) {
    missing.push('.github/workflows/docker.yml');
  }
  if (!fs.existsSync(CI_WORKFLOW_PATH)) {
    missing.push('.github/workflows/ci.yml');
  }
  if (!fs.existsSync(RELEASE_WORKFLOW_PATH)) {
    missing.push('.github/workflows/release.yml');
  }

  return {
    name: 'Docker governance files exist',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['Dockerfiles, compose, and workflow gates found'] : missing.map((file) => `missing: ${file}`),
  };
}

function checkDockerfilePolicy(fileLabel, content) {
  const checks = [];
  const fromMatches = content.match(/^FROM\s+/gm) || [];
  checks.push({
    label: `${fileLabel}: uses multi-stage build`,
    pass: fromMatches.length >= 2 && /FROM\s+\S+\s+AS\s+\S+/i.test(content),
    detail: `FROM count=${fromMatches.length}`,
  });

  const userMatch = content.match(/^USER\s+(.+)$/m);
  const userValue = userMatch ? userMatch[1].trim() : '';
  checks.push({
    label: `${fileLabel}: runs as non-root user`,
    pass: Boolean(userValue) && !/^root$/i.test(userValue),
    detail: userValue ? `USER ${userValue}` : 'missing USER directive',
  });

  checks.push({
    label: `${fileLabel}: defines HEALTHCHECK`,
    pass: /HEALTHCHECK\s+/i.test(content),
    detail: /HEALTHCHECK\s+/i.test(content) ? 'HEALTHCHECK found' : 'missing HEALTHCHECK',
  });

  return checks;
}

function extractServiceBlock(composeContent, serviceName) {
  const lines = composeContent.split(/\r?\n/);
  const startPattern = new RegExp(`^\\s{2}${serviceName}:\\s*$`);
  const nextServicePattern = /^\s{2}[A-Za-z0-9_-]+:\s*$/;
  const topLevelPattern = /^[A-Za-z0-9_-]+:\s*$/;

  const startIndex = lines.findIndex((line) => startPattern.test(line));
  if (startIndex === -1) {
    return null;
  }

  const block = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (nextServicePattern.test(line) || topLevelPattern.test(line)) {
      break;
    }
    block.push(line);
  }

  return block.join('\n');
}

function checkComposeServicePolicy(composeContent, serviceName) {
  const block = extractServiceBlock(composeContent, serviceName);
  if (!block) {
    return {
      label: `docker-compose: ${serviceName} service policy`,
      pass: false,
      detail: `missing service: ${serviceName}`,
    };
  }

  const requiredTokens = ['healthcheck:', 'logging:', 'max-size:', 'max-file:'];
  const missingTokens = requiredTokens.filter((token) => !block.includes(token));
  return {
    label: `docker-compose: ${serviceName} service policy`,
    pass: missingTokens.length === 0,
    detail: missingTokens.length === 0 ? 'healthcheck + log rotation configured' : `missing tokens: ${missingTokens.join(', ')}`,
  };
}

function checkDockerWorkflowPolicy(content) {
  const requiredTokens = [
    'docker-build-multiarch:',
    'image-size-analysis:',
    'MAX_SIZE_MB=500',
    'Image exceeds 500MB budget',
  ];
  const missing = requiredTokens.filter((token) => !content.includes(token));
  if (!content.includes('linux/amd64') || !content.includes('linux/arm64')) {
    missing.push('missing multi-arch platform tokens: linux/amd64 + linux/arm64');
  }
  return {
    name: 'Docker workflow enforces multi-arch build and 500MB image budget',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['docker.yml includes hard image-size budget enforcement and multi-arch build'] : missing.map((token) => `missing token: ${token}`),
  };
}

function checkCiReleaseGates(ciContent, releaseContent) {
  const ciRequired = ['docker-commander:', 'npm run verify:docker:commander'];
  const releaseRequired = ['docker-commander:', 'npm run verify:docker:commander'];

  const failures = [];
  ciRequired.forEach((token) => {
    if (!ciContent.includes(token)) {
      failures.push(`ci.yml missing token: ${token}`);
    }
  });
  releaseRequired.forEach((token) => {
    if (!releaseContent.includes(token)) {
      failures.push(`release.yml missing token: ${token}`);
    }
  });

  return {
    name: 'CI/release gates enforce Docker commander policy',
    pass: failures.length === 0,
    details: failures.length === 0 ? ['docker-commander verification is wired in CI and release workflows'] : failures,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Docker Commander Verification',
    '',
    `Generated: ${report.timestamp}`,
    '',
    '## Checks',
    ...report.checks.map((check) => `- ${check.pass ? '[PASS]' : '[FAIL]'} ${check.name}`),
    '',
  ];

  report.checks.forEach((check) => {
    lines.push(`### ${check.name}`);
    check.details.forEach((detail) => lines.push(`- ${detail}`));
    lines.push('');
  });

  lines.push('## Summary');
  lines.push(`- Overall: ${report.passed ? 'PASS' : 'FAIL'}`);
  lines.push('');

  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  const checks = [];
  const filesExist = checkFilesExist();
  checks.push(filesExist);

  if (filesExist.pass) {
    const dockerfileContent = readFile(DOCKERFILE_PATH);
    const signalingDockerfileContent = readFile(SIGNALING_DOCKERFILE_PATH);
    const composeContent = readFile(COMPOSE_PATH);
    const dockerWorkflowContent = readFile(DOCKER_WORKFLOW_PATH);
    const ciWorkflowContent = readFile(CI_WORKFLOW_PATH);
    const releaseWorkflowContent = readFile(RELEASE_WORKFLOW_PATH);

    const dockerfileChecks = checkDockerfilePolicy('Dockerfile', dockerfileContent)
      .concat(checkDockerfilePolicy('Dockerfile.signaling', signalingDockerfileContent));
    dockerfileChecks.forEach((check) => {
      checks.push({
        name: check.label,
        pass: check.pass,
        details: [check.detail],
      });
    });

    const composeChecks = [
      checkComposeServicePolicy(composeContent, 'tallow'),
      checkComposeServicePolicy(composeContent, 'signaling'),
    ];
    composeChecks.forEach((check) => {
      checks.push({
        name: check.label,
        pass: check.pass,
        details: [check.detail],
      });
    });

    checks.push(checkDockerWorkflowPolicy(dockerWorkflowContent));
    checks.push(checkCiReleaseGates(ciWorkflowContent, releaseWorkflowContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const reportsDirectory = path.join(ROOT, 'reports');
  ensureDirectory(reportsDirectory);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(reportsDirectory, `docker-commander-${stamp}.json`);
  const mdPath = path.join(reportsDirectory, `docker-commander-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-docker-commander] JSON: ${jsonPath}`);
  console.log(`[verify-docker-commander] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();

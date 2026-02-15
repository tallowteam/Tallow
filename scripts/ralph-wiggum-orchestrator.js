#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const DEFAULT_ITERATIONS = 30;
const CIRCUIT_BREAKER_THRESHOLD = 3;
const PROGRESS_INTERVAL = 10;
const CIPHER_AGENT_ID = '002';

const DEFAULT_TASKS = [
  { name: 'lint', command: ['npm', 'run', 'lint', '--', '--max-warnings=0'], modifiesCrypto: false },
  { name: 'type-check', command: ['npm', 'run', 'type-check'], modifiesCrypto: false },
  { name: 'unit-test', command: ['npm', 'run', 'test:unit'], modifiesCrypto: false },
];

function parseArgs(argv) {
  const args = {
    iterations: DEFAULT_ITERATIONS,
    dryRun: true,
    allowCryptoTasks: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--iterations') {
      const raw = argv[index + 1];
      const parsed = Number(raw);
      if (!Number.isNaN(parsed) && parsed > 0) {
        args.iterations = parsed;
      }
      index += 1;
      continue;
    }

    if (token === '--execute') {
      args.dryRun = false;
      continue;
    }

    if (token === '--allow-crypto-tasks') {
      args.allowCryptoTasks = true;
      continue;
    }
  }

  return args;
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function hasCipherSignoff() {
  const releaseSignoffCandidates = [
    path.join(ROOT, 'release-signoffs', 'v0.1.0.json'),
    path.join(ROOT, 'release-signoffs', 'TEMPLATE.json'),
  ];

  for (const candidate of releaseSignoffCandidates) {
    const parsed = readJsonIfExists(candidate);
    if (!parsed) {
      continue;
    }

    const approvals = Array.isArray(parsed.approvals) ? parsed.approvals : [];
    const approved = approvals.some((approval) => {
      if (!approval || typeof approval !== 'object') {
        return false;
      }
      const id = String(approval.approverId || '');
      const status = String(approval.status || '').toLowerCase();
      return id === CIPHER_AGENT_ID && (status === 'approved' || status === 'signed');
    });

    if (approved) {
      return true;
    }
  }

  return false;
}

function runTask(task, dryRun) {
  if (dryRun) {
    return {
      success: true,
      code: 0,
      output: `[dry-run] ${task.command.join(' ')}`,
    };
  }

  const [cmd, ...args] = task.command;
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: 'pipe',
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
  return {
    success: result.status === 0,
    code: typeof result.status === 'number' ? result.status : 1,
    output,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const hasSignoff = hasCipherSignoff();

  let consecutiveFailures = 0;
  let totalRuns = 0;
  const records = [];

  for (let iteration = 1; iteration <= args.iterations; iteration += 1) {
    for (const task of DEFAULT_TASKS) {
      if (task.modifiesCrypto && !(args.allowCryptoTasks && hasSignoff)) {
        console.error(`[ralph] blocked crypto-modifying task "${task.name}" without CIPHER sign-off`);
        process.exit(1);
      }

      const result = runTask(task, args.dryRun);
      totalRuns += 1;
      records.push({
        iteration,
        task: task.name,
        success: result.success,
        code: result.code,
      });

      if (result.success) {
        consecutiveFailures = 0;
      } else {
        consecutiveFailures += 1;
      }

      if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
        console.error('[ralph] circuit breaker opened after 3 consecutive failures');
        console.error(`<promise>FAILED</promise>`);
        process.exit(1);
      }
    }

    if (iteration % PROGRESS_INTERVAL === 0) {
      console.log(`[ralph] progress iteration ${iteration}/${args.iterations}, task-runs=${totalRuns}`);
    }
  }

  console.log(`[ralph] completed iterations=${args.iterations}, task-runs=${totalRuns}`);
  console.log(`<promise>DONE</promise>`);

  const outputPath = path.join(ROOT, 'reports', `ralph-wiggum-runtime-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  try {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      iterations: args.iterations,
      dryRun: args.dryRun,
      records,
      circuitBreakerThreshold: CIRCUIT_BREAKER_THRESHOLD,
      progressInterval: PROGRESS_INTERVAL,
    }, null, 2), 'utf8');
    console.log(`[ralph] report: ${outputPath}`);
  } catch {
    // Keep orchestrator resilient; reporting failures should not hide the completion status.
  }
}

main();

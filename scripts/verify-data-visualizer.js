#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'DATA_VISUALIZER_POLICY.md');
const SIMPLE_CHART_PATH = path.join(ROOT, 'components', 'admin', 'SimpleChart.tsx');
const SIMPLE_CHART_CSS_PATH = path.join(ROOT, 'components', 'admin', 'SimpleChart.module.css');
const TRANSFER_RATE_GRAPH_PATH = path.join(ROOT, 'components', 'transfer', 'TransferRateGraph.tsx');
const TRANSFER_RATE_GRAPH_CSS_PATH = path.join(ROOT, 'components', 'transfer', 'TransferRateGraph.module.css');
const SIGNAL_INDICATOR_PATH = path.join(ROOT, 'components', 'transfer', 'SignalIndicator.tsx');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:data:visualizer';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:data:visualizer';

function ensureDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function resolveReportsDirectory() {
  const preferredDirectory = path.join(ROOT, 'reports');
  ensureDirectory(preferredDirectory);

  const probePath = path.join(preferredDirectory, '.write-probe');
  try {
    fs.writeFileSync(probePath, 'ok', 'utf8');
    fs.unlinkSync(probePath);
    return preferredDirectory;
  } catch {
    const fallbackDirectory = path.join(ROOT, 'verification-reports');
    ensureDirectory(fallbackDirectory);
    return fallbackDirectory;
  }
}

function toPosix(inputPath) {
  return inputPath.split(path.sep).join('/');
}

function readFile(filePath) {
  const buffer = fs.readFileSync(filePath);

  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.toString('utf16le');
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    const swapped = Buffer.allocUnsafe(buffer.length - (buffer.length % 2));
    for (let i = 0; i < swapped.length; i += 2) {
      swapped[i] = buffer[i + 1];
      swapped[i + 1] = buffer[i];
    }
    return swapped.toString('utf16le');
  }

  return buffer.toString('utf8');
}

function checkRequiredFiles() {
  const requiredFiles = [
    POLICY_PATH,
    SIMPLE_CHART_PATH,
    SIMPLE_CHART_CSS_PATH,
    TRANSFER_RATE_GRAPH_PATH,
    TRANSFER_RATE_GRAPH_CSS_PATH,
    SIGNAL_INDICATOR_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'Data visualizer policy, chart primitives, and workflows exist',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? ['all required data visualizer files are present']
        : missing.map((item) => `missing: ${item}`),
  };
}

function checkChartAccessibility(simpleChartContent, transferRateGraphContent) {
  const findings = [];

  if (!/role="img"/.test(simpleChartContent)) {
    findings.push('SimpleChart SVG is missing role="img"');
  }
  if (!/aria-label=\{ariaLabel\}/.test(simpleChartContent)) {
    findings.push('SimpleChart SVG is missing configurable aria-label');
  }
  if (!/<title>\{ariaLabel\}<\/title>/.test(simpleChartContent)) {
    findings.push('SimpleChart SVG is missing title metadata');
  }
  if (!/<desc>\{`Chart type/.test(simpleChartContent)) {
    findings.push('SimpleChart SVG is missing descriptive metadata');
  }

  if (!/role="img"/.test(transferRateGraphContent)) {
    findings.push('TransferRateGraph SVG is missing role="img"');
  }
  if (!/aria-label=\{`Transfer rate graph/.test(transferRateGraphContent)) {
    findings.push('TransferRateGraph SVG is missing descriptive aria-label');
  }
  if (!/<title>Transfer rate history<\/title>/.test(transferRateGraphContent)) {
    findings.push('TransferRateGraph SVG is missing title metadata');
  }
  if (!/<desc>\{`Realtime transfer speed chart\./.test(transferRateGraphContent)) {
    findings.push('TransferRateGraph SVG is missing descriptive metadata');
  }

  return {
    name: 'Chart containers expose accessibility semantics',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['SVG roles, labels, and metadata are present for chart containers'] : findings,
  };
}

function checkDataPointLabels(simpleChartContent, transferRateGraphContent) {
  const findings = [];

  if (!/<circle[\s\S]*?aria-label=/.test(simpleChartContent)) {
    findings.push('SimpleChart line points are missing aria-label attributes');
  }
  if (!/<rect[\s\S]*?aria-label=/.test(simpleChartContent)) {
    findings.push('SimpleChart bar points are missing aria-label attributes');
  }
  if (!/<path[\s\S]*?aria-label=\{`\$\{point\.label\}/.test(simpleChartContent)) {
    findings.push('SimpleChart donut slices are missing aria-label attributes');
  }
  if (!/<circle[\s\S]*?aria-label=\{`Current transfer speed/.test(transferRateGraphContent)) {
    findings.push('TransferRateGraph current point indicator is missing screen-reader label');
  }

  return {
    name: 'Chart data points carry assistive labels',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['line/bar/donut/current-point elements expose readable labels'] : findings,
  };
}

function checkRealtimeRenderingAndMotion(
  simpleChartContent,
  transferRateGraphContent,
  simpleChartCssContent,
  transferRateGraphCssContent
) {
  const findings = [];

  const transferGraphUseMemoCount = (transferRateGraphContent.match(/useMemo\(/g) || []).length;
  if (transferGraphUseMemoCount < 2) {
    findings.push(`TransferRateGraph expected >=2 useMemo transforms, found ${transferGraphUseMemoCount}`);
  }
  if (!/const chartContent = useMemo\(/.test(simpleChartContent)) {
    findings.push('SimpleChart does not memoize chart renderer output');
  }
  if (!/@media \(prefers-reduced-motion: reduce\)/.test(transferRateGraphCssContent)) {
    findings.push('TransferRateGraph CSS missing reduced-motion media query');
  }
  if (!/@media \(prefers-reduced-motion: reduce\)/.test(simpleChartCssContent)) {
    findings.push('SimpleChart CSS missing reduced-motion media query');
  }

  return {
    name: 'Real-time chart rendering uses memoization and reduced-motion controls',
    pass: findings.length === 0,
    details:
      findings.length === 0
        ? ['memoized chart transforms and reduced-motion handling are in place']
        : findings,
  };
}

function checkColorSafety(simpleChartContent) {
  const findings = [];

  const paletteMatch = simpleChartContent.match(/export const COLOR_BLIND_SAFE_PALETTE = \[([\s\S]*?)\] as const;/);
  const colors = paletteMatch ? (paletteMatch[1].match(/#[0-9A-Fa-f]{6}/g) || []) : [];

  if (!paletteMatch) {
    findings.push('SimpleChart missing COLOR_BLIND_SAFE_PALETTE export');
  }
  if (colors.length < 6) {
    findings.push(`color-blind-safe palette should include >=6 colors, found ${colors.length}`);
  }
  if (!/const colors = COLOR_BLIND_SAFE_PALETTE;/.test(simpleChartContent)) {
    findings.push('chart color selection is not routed through COLOR_BLIND_SAFE_PALETTE');
  }

  return {
    name: 'Color-blind-safe chart palette is centralized and reused',
    pass: findings.length === 0,
    details:
      findings.length === 0
        ? [`COLOR_BLIND_SAFE_PALETTE size: ${colors.length}`]
        : findings,
  };
}

function checkTransferTelemetryCoverage(signalIndicatorContent, transferRateGraphContent) {
  const findings = [];

  if (!/role="status"/.test(signalIndicatorContent)) {
    findings.push('SignalIndicator missing role="status" for assistive status updates');
  }
  if (!/aria-label=\{`Signal strength:/.test(signalIndicatorContent)) {
    findings.push('SignalIndicator missing descriptive aria-label');
  }
  if (!/className=\{styles\.srOnly\}/.test(signalIndicatorContent)) {
    findings.push('SignalIndicator missing screen-reader-only status text');
  }
  if (!/className=\{styles\.label\}>Transfer Rate<\/span>/.test(transferRateGraphContent)) {
    findings.push('TransferRateGraph missing visible "Transfer Rate" label');
  }
  if (!/className=\{styles\.currentSpeed\}/.test(transferRateGraphContent)) {
    findings.push('TransferRateGraph missing visible current speed readout');
  }

  return {
    name: 'Transfer telemetry components expose visible and screen-reader status',
    pass: findings.length === 0,
    details:
      findings.length === 0
        ? ['signal quality and transfer-rate status text is available for visual and assistive users']
        : findings,
  };
}

function checkScriptAndWorkflow(packageJson, ciContent, releaseContent) {
  const missing = [];
  if (!(packageJson.scripts || {})[REQUIRED_SCRIPT_NAME]) {
    missing.push(`missing package script: ${REQUIRED_SCRIPT_NAME}`);
  }
  if (!ciContent.includes(REQUIRED_WORKFLOW_COMMAND)) {
    missing.push(`CI workflow missing command: ${REQUIRED_WORKFLOW_COMMAND}`);
  }
  if (!releaseContent.includes(REQUIRED_WORKFLOW_COMMAND)) {
    missing.push(`release workflow missing command: ${REQUIRED_WORKFLOW_COMMAND}`);
  }

  return {
    name: 'Data visualizer gate is wired in package scripts and workflows',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? [
            `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
            '.github/workflows/ci.yml runs data visualizer verification',
            '.github/workflows/release.yml runs data visualizer verification',
          ]
        : missing,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Data Visualizer Verification',
    '',
    `Generated: ${report.timestamp}`,
    '',
    '## Checks',
    ...report.checks.map((check) => `- ${check.pass ? '[PASS]' : '[FAIL]'} ${check.name}`),
    '',
  ];

  for (const check of report.checks) {
    lines.push(`### ${check.name}`);
    for (const detail of check.details) {
      lines.push(`- ${detail}`);
    }
    lines.push('');
  }

  lines.push('## Summary');
  lines.push(`- Overall: ${report.passed ? 'PASS' : 'FAIL'}`);
  lines.push('');

  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  const checks = [];
  const required = checkRequiredFiles();
  checks.push(required);

  if (required.pass) {
    const simpleChartContent = readFile(SIMPLE_CHART_PATH);
    const simpleChartCssContent = readFile(SIMPLE_CHART_CSS_PATH);
    const transferRateGraphContent = readFile(TRANSFER_RATE_GRAPH_PATH);
    const transferRateGraphCssContent = readFile(TRANSFER_RATE_GRAPH_CSS_PATH);
    const signalIndicatorContent = readFile(SIGNAL_INDICATOR_PATH);
    const packageJson = JSON.parse(readFile(PACKAGE_JSON_PATH));
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkChartAccessibility(simpleChartContent, transferRateGraphContent));
    checks.push(checkDataPointLabels(simpleChartContent, transferRateGraphContent));
    checks.push(
      checkRealtimeRenderingAndMotion(
        simpleChartContent,
        transferRateGraphContent,
        simpleChartCssContent,
        transferRateGraphCssContent
      )
    );
    checks.push(checkColorSafety(simpleChartContent));
    checks.push(checkTransferTelemetryCoverage(signalIndicatorContent, transferRateGraphContent));
    checks.push(checkScriptAndWorkflow(packageJson, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `data-visualizer-verification-${stamp}.json`);
  const mdPath = path.join(outputDirectory, `data-visualizer-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-data-visualizer] JSON: ${jsonPath}`);
  console.log(`[verify-data-visualizer] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();

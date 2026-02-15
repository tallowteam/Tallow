#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const appDir = path.join(process.cwd(), 'app');
const reportsDir = path.join(process.cwd(), 'reports');
const date = new Date().toISOString().slice(0, 10);
const reportPath = path.join(reportsDir, `route-boundaries-${date}.md`);

function walkPages(dir, pages = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkPages(fullPath, pages);
      continue;
    }
    if (entry.isFile() && entry.name === 'page.tsx') {
      pages.push(fullPath);
    }
  }
  return pages;
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function main() {
  if (!fs.existsSync(appDir)) {
    console.error('[verify-route-boundaries] Missing app directory.');
    process.exit(1);
  }

  const pages = walkPages(appDir);
  const missing = [];

  for (const pagePath of pages) {
    const routeDir = path.dirname(pagePath);
    const loadingPath = path.join(routeDir, 'loading.tsx');
    const errorPath = path.join(routeDir, 'error.tsx');
    const hasLoading = fs.existsSync(loadingPath);
    const hasError = fs.existsSync(errorPath);

    if (!hasLoading || !hasError) {
      missing.push({
        routeDir: path.relative(process.cwd(), routeDir),
        hasLoading,
        hasError,
      });
    }
  }

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const lines = [];
  lines.push('# Route Boundary Verification');
  lines.push('');
  lines.push(`- Date: ${new Date().toISOString()}`);
  lines.push(`- Checked route directories: ${pages.length}`);
  lines.push(`- Missing boundaries: ${missing.length}`);
  lines.push('');

  if (missing.length === 0) {
    lines.push('All route directories with `page.tsx` include both `loading.tsx` and `error.tsx`.');
  } else {
    lines.push('| Route Directory | loading.tsx | error.tsx |');
    lines.push('| --- | --- | --- |');
    for (const item of missing) {
      lines.push(
        `| \`${toPosix(item.routeDir)}\` | ${item.hasLoading ? 'Yes' : 'No'} | ${item.hasError ? 'Yes' : 'No'} |`
      );
    }
  }

  fs.writeFileSync(reportPath, lines.join('\n') + '\n', 'utf8');
  console.log(`[verify-route-boundaries] Report: ${reportPath}`);

  if (missing.length > 0) {
    console.error('[verify-route-boundaries] Missing required route boundaries.');
    process.exit(1);
  }

  console.log('[verify-route-boundaries] All route boundaries verified.');
}

main();

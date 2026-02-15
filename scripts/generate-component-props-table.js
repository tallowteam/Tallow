#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const COMPONENTS_DIR = path.join(ROOT, 'components');
const OUTPUT_PATH = path.join(ROOT, 'docs', 'governance', 'COMPONENT_PROPS_TABLES.md');

function ensureDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function toPosix(filePath) {
  return filePath.replace(/\\/g, '/');
}

function walk(directoryPath) {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  const files = [];

  entries.forEach((entry) => {
    const absolutePath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(absolutePath));
      return;
    }

    if (!entry.name.endsWith('.tsx')) {
      return;
    }

    if (/\.(test|stories)\.tsx$/i.test(entry.name)) {
      return;
    }

    files.push(absolutePath);
  });

  return files;
}

function extractPropsType(content) {
  const interfaceMatch = content.match(/interface\s+([A-Za-z0-9_]+Props)\s*{/);
  if (interfaceMatch && interfaceMatch[1]) {
    return interfaceMatch[1];
  }

  const typeMatch = content.match(/type\s+([A-Za-z0-9_]+Props)\s*=/);
  if (typeMatch && typeMatch[1]) {
    return typeMatch[1];
  }

  return 'Unspecified';
}

function extractComponentName(content, fallbackName) {
  const defaultFunctionMatch = content.match(/export\s+default\s+function\s+([A-Za-z0-9_]+)/);
  if (defaultFunctionMatch && defaultFunctionMatch[1]) {
    return defaultFunctionMatch[1];
  }

  const functionMatch = content.match(/export\s+function\s+([A-Za-z0-9_]+)/);
  if (functionMatch && functionMatch[1]) {
    return functionMatch[1];
  }

  const constMatch = content.match(/export\s+const\s+([A-Za-z0-9_]+)\s*=/);
  if (constMatch && constMatch[1]) {
    return constMatch[1];
  }

  return fallbackName;
}

function buildRows() {
  const files = walk(COMPONENTS_DIR);
  const rows = files.map((filePath) => {
    const relativePath = toPosix(path.relative(ROOT, filePath));
    const content = fs.readFileSync(filePath, 'utf8');
    const fallbackName = path.basename(filePath, '.tsx');
    const componentName = extractComponentName(content, fallbackName);
    const propsType = extractPropsType(content);
    const storyPath = toPosix(relativePath.replace(/\.tsx$/, '.stories.tsx'));

    return {
      componentName,
      relativePath,
      propsType,
      storyPath,
    };
  });

  rows.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return rows;
}

function writeMarkdown(rows) {
  const generatedAt = new Date().toISOString();
  const lines = [
    '# Storybook Component Props Table',
    '',
    `Generated: ${generatedAt}`,
    '',
    `Total components tracked: ${rows.length}`,
    '',
    'This index is the canonical props-table source for Storybook/autodocs coverage verification.',
    '',
    '| Component | Source | Props Type | Story Path |',
    '| --- | --- | --- | --- |',
  ];

  rows.forEach((row) => {
    lines.push(`| \`${row.componentName}\` | \`${row.relativePath}\` | \`${row.propsType}\` | \`${row.storyPath}\` |`);
  });

  lines.push('');
  fs.writeFileSync(OUTPUT_PATH, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  if (!fs.existsSync(COMPONENTS_DIR)) {
    console.error('[generate-component-props-table] Missing components directory');
    process.exit(1);
  }

  ensureDirectory(path.dirname(OUTPUT_PATH));
  const rows = buildRows();
  writeMarkdown(rows);
  console.log(`[generate-component-props-table] Wrote ${rows.length} rows to ${toPosix(path.relative(ROOT, OUTPUT_PATH))}`);
}

main();

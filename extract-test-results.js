const fs = require('fs');

// Parse the unit test output
const output = fs.readFileSync('C:\\Users\\aamir\\AppData\\Local\\Temp\\claude\\C--Users-aamir-Documents-Apps-Tallow\\tasks\\b466254.output', 'utf8');

const lines = output.split('\n');

// Extract test results
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let testFiles = 0;
let failedTestFiles = 0;

const failedTestsList = [];
const testFileSummary = [];

let currentFile = '';

lines.forEach(line => {
  // Match test file lines like: ✓ tests/unit/... (N tests)
  const fileMatch = line.match(/[✓❯]\s+([\w\/\\.-]+\.test\.tsx?)\s+\((\d+)\s+tests?(?:\s+\|\s+(\d+)\s+failed)?\)/);

  if (fileMatch) {
    testFiles++;
    const file = fileMatch[1];
    const tests = parseInt(fileMatch[2]);
    const failed = fileMatch[3] ? parseInt(fileMatch[3]) : 0;

    totalTests += tests;
    passedTests += (tests - failed);
    failedTests += failed;

    if (failed > 0) {
      failedTestFiles++;
    }

    currentFile = file;
    testFileSummary.push({
      file,
      total: tests,
      passed: tests - failed,
      failed
    });
  }

  // Match individual failing test lines
  const testFailMatch = line.match(/[×]\s+(.+?)\s+\d+ms/);
  if (testFailMatch && currentFile) {
    failedTestsList.push({
      file: currentFile,
      test: testFailMatch[1]
    });
  }
});

console.log('=== UNIT TEST RESULTS ===\n');
console.log(`Test Files: ${testFiles} (${failedTestFiles} failed)`);
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

console.log('=== FAILED TEST FILES ===\n');
testFileSummary
  .filter(t => t.failed > 0)
  .sort((a, b) => b.failed - a.failed)
  .forEach(t => {
    console.log(`${t.file}`);
    console.log(`  Tests: ${t.total} | Passed: ${t.passed} | Failed: ${t.failed}`);
  });

console.log('\n=== TOP FAILING TEST CATEGORIES ===\n');
const categoryFails = {};
testFileSummary.forEach(t => {
  if (t.failed > 0) {
    const parts = t.file.split('/');
    let category = 'other';
    if (parts.includes('crypto')) category = 'crypto';
    else if (parts.includes('transfer')) category = 'transfer';
    else if (parts.includes('chat')) category = 'chat';
    else if (parts.includes('security')) category = 'security';
    else if (parts.includes('api')) category = 'api';
    else if (parts.includes('email')) category = 'email';
    else if (parts.includes('components')) category = 'components';
    else if (parts.includes('hooks')) category = 'hooks';

    categoryFails[category] = (categoryFails[category] || 0) + t.failed;
  }
});

Object.entries(categoryFails)
  .sort((a, b) => b[1] - a[1])
  .forEach(([cat, fails]) => {
    console.log(`${cat}: ${fails} failed tests`);
  });

const fs = require('fs');
const path = require('path');

// Map of feature modules to their test files
const featureTestMapping = {};
const featuresWithoutTests = [];
const testResults = {
  unit: { total: 0, passed: 0, failed: 0 },
  e2e: { total: 0, passed: 0, failed: 0 }
};

// Get all lib files
function getLibFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getLibFiles(filePath, fileList);
    } else if (file.endsWith('.ts') && !file.endsWith('.test.ts') && !file.endsWith('.d.ts')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

// Get all test files
function getTestFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getTestFiles(filePath, fileList);
    } else if (file.endsWith('.test.ts') || file.endsWith('.spec.ts')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

// Analyze coverage
const libDir = path.join(__dirname, 'lib');
const testUnitDir = path.join(__dirname, 'tests', 'unit');
const testE2EDir = path.join(__dirname, 'tests', 'e2e');

const libFiles = getLibFiles(libDir);
const unitTestFiles = getTestFiles(testUnitDir);
const e2eTestFiles = getTestFiles(testE2EDir);

console.log('=== TALLOW TEST COVERAGE ANALYSIS ===\n');
console.log(`Total Library Files: ${libFiles.length}`);
console.log(`Total Unit Test Files: ${unitTestFiles.length}`);
console.log(`Total E2E Test Files: ${e2eTestFiles.length}\n`);

// Group by feature area
const featureAreas = {
  crypto: [],
  transfer: [],
  chat: [],
  email: [],
  security: [],
  privacy: [],
  monitoring: [],
  api: [],
  storage: [],
  hooks: [],
  signaling: [],
  webrtc: [],
  pwa: [],
  i18n: [],
  utils: [],
  other: []
};

libFiles.forEach(file => {
  const relativePath = path.relative(libDir, file);
  const category = relativePath.split(path.sep)[0];

  if (featureAreas[category]) {
    featureAreas[category].push(relativePath);
  } else {
    featureAreas.other.push(relativePath);
  }
});

// Check which features have tests
console.log('=== FEATURE COVERAGE BY CATEGORY ===\n');

Object.keys(featureAreas).forEach(category => {
  const files = featureAreas[category];
  if (files.length === 0) return;

  const tested = files.filter(file => {
    const baseName = path.basename(file, '.ts');
    const hasUnitTest = unitTestFiles.some(test => test.includes(baseName));
    const hasE2ETest = e2eTestFiles.some(test => test.includes(baseName));
    return hasUnitTest || hasE2ETest;
  });

  const coverage = files.length > 0 ? ((tested.length / files.length) * 100).toFixed(1) : 0;

  console.log(`${category.toUpperCase()}:`);
  console.log(`  Files: ${files.length}`);
  console.log(`  Tested: ${tested.length}`);
  console.log(`  Coverage: ${coverage}%`);

  if (tested.length < files.length) {
    const untested = files.filter(file => {
      const baseName = path.basename(file, '.ts');
      const hasUnitTest = unitTestFiles.some(test => test.includes(baseName));
      const hasE2ETest = e2eTestFiles.some(test => test.includes(baseName));
      return !hasUnitTest && !hasE2ETest;
    });
    console.log(`  MISSING TESTS (${untested.length}):`);
    untested.forEach(f => console.log(`    - ${f}`));
  }
  console.log('');
});

// Critical features that MUST have tests
const criticalFeatures = [
  'crypto/file-encryption-pqc.ts',
  'crypto/key-management.ts',
  'crypto/triple-ratchet.ts',
  'transfer/pqc-transfer-manager.ts',
  'security/csrf.ts',
  'security/memory-wiper.ts',
  'chat/chat-encryption.ts',
  'email-fallback/index.ts',
  'hooks/use-pqc-transfer.ts',
  'hooks/use-file-transfer.ts',
  'signaling/socket-signaling.ts',
  'transfer/encryption.ts',
  'privacy/metadata-stripper.ts'
];

console.log('=== CRITICAL FEATURE TEST STATUS ===\n');
criticalFeatures.forEach(feature => {
  const fullPath = path.join(libDir, feature);
  const exists = fs.existsSync(fullPath);
  if (!exists) {
    console.log(`❌ ${feature} - FILE NOT FOUND`);
    return;
  }

  const baseName = path.basename(feature, '.ts');
  const hasUnitTest = unitTestFiles.some(test => test.includes(baseName));
  const hasE2ETest = e2eTestFiles.some(test => test.includes(baseName));

  if (hasUnitTest || hasE2ETest) {
    console.log(`✅ ${feature} - HAS TESTS`);
  } else {
    console.log(`❌ ${feature} - NO TESTS (CRITICAL)`);
  }
});

console.log('\n=== SUMMARY ===');
const totalTested = libFiles.filter(file => {
  const baseName = path.basename(file, '.ts');
  const hasUnitTest = unitTestFiles.some(test => test.includes(baseName));
  const hasE2ETest = e2eTestFiles.some(test => test.includes(baseName));
  return hasUnitTest || hasE2ETest;
}).length;

const overallCoverage = ((totalTested / libFiles.length) * 100).toFixed(1);
console.log(`Overall Test Coverage: ${overallCoverage}% (${totalTested}/${libFiles.length} files)`);
console.log(`Files Without Tests: ${libFiles.length - totalTested}`);

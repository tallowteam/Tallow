#!/usr/bin/env node

/**
 * Email Fallback Feature Verification Script
 * Verifies all components of the email-based file transfer system
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  // API Routes
  'app/api/v1/send-file-email/route.ts',
  'app/api/v1/download-file/route.ts',

  // Components
  'components/app/EmailFallbackDialog.tsx',
  'components/app/EmailFallbackButton.tsx',

  // Storage
  'lib/storage/temp-file-storage.ts',

  // Email Templates
  'lib/emails/file-transfer-email.tsx',

  // Index/Exports
  'lib/email-fallback/index.ts',
];

const REQUIRED_PACKAGES = [
  'resend',
  '@react-email/components',
];

console.log('🔍 Verifying Email Fallback Feature...\n');

let hasErrors = false;

// Check files exist
console.log('📁 Checking required files...');
REQUIRED_FILES.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - NOT FOUND`);
    hasErrors = true;
  }
});

console.log('\n📦 Checking required packages...');
const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

REQUIRED_PACKAGES.forEach(pkg => {
  if (allDeps[pkg]) {
    console.log(`  ✅ ${pkg} (${allDeps[pkg]})`);
  } else {
    console.log(`  ❌ ${pkg} - NOT INSTALLED`);
    hasErrors = true;
  }
});

// Check environment variables
console.log('\n🔐 Checking environment configuration...');
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('RESEND_API_KEY=re_')) {
    console.log('  ✅ RESEND_API_KEY is configured');
  } else {
    console.log('  ⚠️  RESEND_API_KEY may not be properly configured');
  }
} else {
  console.log('  ⚠️  .env.local file not found');
}

// Verify API routes structure
console.log('\n🔌 Verifying API route implementation...');
const sendEmailRoute = path.join(process.cwd(), 'app/api/v1/send-file-email/route.ts');
if (fs.existsSync(sendEmailRoute)) {
  const content = fs.readFileSync(sendEmailRoute, 'utf8');

  const checks = [
    { name: 'Resend import', pattern: /import.*Resend.*from.*resend/ },
    { name: 'POST handler', pattern: /export\s+async\s+function\s+POST/ },
    { name: 'Rate limiting', pattern: /rateLimit|rate.*limit/i },
    { name: 'Email validation', pattern: /EMAIL_REGEX|email.*validation/i },
    { name: 'Attachment handling', pattern: /attachment|fileData/ },
    { name: 'Link mode', pattern: /downloadUrl|link.*mode/i },
    { name: 'API key auth', pattern: /requireApiKey|auth/ },
  ];

  checks.forEach(check => {
    if (check.pattern.test(content)) {
      console.log(`  ✅ ${check.name}`);
    } else {
      console.log(`  ⚠️  ${check.name} - not detected`);
    }
  });
}

// Verify download route
const downloadRoute = path.join(process.cwd(), 'app/api/v1/download-file/route.ts');
if (fs.existsSync(downloadRoute)) {
  const content = fs.readFileSync(downloadRoute, 'utf8');

  const checks = [
    { name: 'GET handler', pattern: /export\s+async\s+function\s+GET/ },
    { name: 'Download validation', pattern: /fileId.*token.*key/ },
    { name: 'Decryption', pattern: /decrypt/ },
    { name: 'Rate limiting', pattern: /rateLimit/ },
  ];

  checks.forEach(check => {
    if (check.pattern.test(content)) {
      console.log(`  ✅ ${check.name} (download)`);
    } else {
      console.log(`  ⚠️  ${check.name} (download) - not detected`);
    }
  });
}

// Verify dialog component
console.log('\n🎨 Verifying UI components...');
const dialogPath = path.join(process.cwd(), 'components/app/EmailFallbackDialog.tsx');
if (fs.existsSync(dialogPath)) {
  const content = fs.readFileSync(dialogPath, 'utf8');

  const checks = [
    { name: 'Email input', pattern: /input.*type="email"/ },
    { name: 'Expiration selector', pattern: /expiration|Select/ },
    { name: 'Progress indicator', pattern: /Progress|progress/ },
    { name: 'Error handling', pattern: /error|Error/ },
    { name: 'Security info', pattern: /End-to-End Encrypted|security/ },
    { name: 'File size check', pattern: /MAX_ATTACHMENT_SIZE/ },
  ];

  checks.forEach(check => {
    if (check.pattern.test(content)) {
      console.log(`  ✅ ${check.name}`);
    } else {
      console.log(`  ⚠️  ${check.name} - not detected`);
    }
  });
}

// Verify temp storage
console.log('\n💾 Verifying temp file storage...');
const storagePath = path.join(process.cwd(), 'lib/storage/temp-file-storage.ts');
if (fs.existsSync(storagePath)) {
  const content = fs.readFileSync(storagePath, 'utf8');

  const checks = [
    { name: 'Upload function', pattern: /export\s+(async\s+)?function\s+uploadTempFile/ },
    { name: 'Download function', pattern: /export\s+(async\s+)?function\s+downloadTempFile/ },
    { name: 'Cleanup function', pattern: /cleanupExpiredFiles/ },
    { name: 'Encryption', pattern: /encryptFile|encrypt/ },
    { name: 'Token generation', pattern: /generateSecureToken|downloadToken/ },
    { name: 'Expiration check', pattern: /expiresAt|expiration/ },
  ];

  checks.forEach(check => {
    if (check.pattern.test(content)) {
      console.log(`  ✅ ${check.name}`);
    } else {
      console.log(`  ⚠️  ${check.name} - not detected`);
    }
  });
}

// Verify email template
console.log('\n📧 Verifying email template...');
const emailPath = path.join(process.cwd(), 'lib/emails/file-transfer-email.tsx');
if (fs.existsSync(emailPath)) {
  const content = fs.readFileSync(emailPath, 'utf8');

  const checks = [
    { name: 'React Email imports', pattern: /@react-email\/components/ },
    { name: 'FileTransferEmail component', pattern: /export\s+(function|const)\s+FileTransferEmail/ },
    { name: 'Download button', pattern: /<Button.*href/ },
    { name: 'Attachment mode', pattern: /attachmentMode/ },
    { name: 'Security section', pattern: /Security.*Privacy|encrypted/ },
    { name: 'File details', pattern: /fileName|fileSize/ },
  ];

  checks.forEach(check => {
    if (check.pattern.test(content)) {
      console.log(`  ✅ ${check.name}`);
    } else {
      console.log(`  ⚠️  ${check.name} - not detected`);
    }
  });
}

// Check for test file
console.log('\n🧪 Checking E2E tests...');
const testPath = path.join(process.cwd(), 'tests/e2e/email-fallback.spec.ts');
if (fs.existsSync(testPath)) {
  console.log('  ✅ E2E test file exists');
  const content = fs.readFileSync(testPath, 'utf8');
  const testCount = (content.match(/test\(/g) || []).length;
  console.log(`  ℹ️  Found ${testCount} test cases`);
} else {
  console.log('  ⚠️  E2E test file not found');
}

// Summary
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.log('❌ VERIFICATION FAILED - Missing required files or packages');
  process.exit(1);
} else {
  console.log('✅ VERIFICATION PASSED - All core components present');
  console.log('\n📋 Next steps:');
  console.log('  1. Ensure RESEND_API_KEY is properly configured in .env.local');
  console.log('  2. Run: npm run dev');
  console.log('  3. Test email feature manually in the UI');
  console.log('  4. Run: npm run test:e2e -- email-fallback');
  console.log('  5. Check API endpoints:');
  console.log('     - POST /api/v1/send-file-email');
  console.log('     - GET  /api/v1/download-file');
  process.exit(0);
}

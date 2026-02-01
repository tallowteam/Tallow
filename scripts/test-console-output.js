#!/usr/bin/env node
/**
 * Test Console Output - Verify LaunchDarkly warnings are suppressed
 * This script helps verify that console warnings are properly suppressed
 */

console.log('\n📊 Console Output Test\n');
console.log('='.repeat(60));

// Simulate the secure logger behavior
const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined;
const isDebugEnabled = process.env.DEBUG === 'true' || process.env.NEXT_PUBLIC_DEBUG === 'true';

console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Debug Mode: ${isDebugEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);
console.log('='.repeat(60));

// Test log levels
const testLogs = [
  { level: 'error', message: '[LaunchDarkly] Connection failed', shown: 'Always' },
  { level: 'warn', message: '[LaunchDarkly] Client ID not configured', shown: 'Only if DEBUG=true' },
  { level: 'log', message: '[LaunchDarkly] Initialized successfully', shown: 'Only if DEBUG=true' },
  { level: 'debug', message: '[LaunchDarkly] Using default flags', shown: 'Only if DEBUG=true' },
];

console.log('\n🔍 Log Behavior:\n');
testLogs.forEach(({ level, message, shown }) => {
  const willShow = level === 'error' || (isDev && isDebugEnabled);
  const status = willShow ? '✅ SHOWN' : '❌ HIDDEN';
  console.log(`${status} [${level}] ${message}`);
  console.log(`   └─ ${shown}`);
});

console.log('\n💡 Tips:\n');
if (!isDebugEnabled) {
  console.log('To enable debug logs in browser:');
  console.log('  localStorage.setItem("DEBUG", "true")');
  console.log('  Then refresh the page\n');

  console.log('To enable debug logs in Node.js:');
  console.log('  DEBUG=true node script.js\n');
} else {
  console.log('Debug mode is ENABLED');
  console.log('All logs will be visible\n');

  console.log('To disable debug logs:');
  console.log('  localStorage.removeItem("DEBUG")');
  console.log('  Or: unset DEBUG environment variable\n');
}

console.log('🎯 Expected Behavior:\n');
console.log('✅ Clean console by default (no LaunchDarkly warnings)');
console.log('✅ Warnings only shown when DEBUG=true');
console.log('✅ Errors always visible');
console.log('✅ Session-based logging (warnings shown once per session)');
console.log('\n' + '='.repeat(60) + '\n');

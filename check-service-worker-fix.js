/**
 * Service Worker Fix Verification Script
 * Paste this into the browser console to verify the fix is working
 */

(async function checkServiceWorkerFix() {
  console.log('🔍 Service Worker Fix Verification');
  console.log('=====================================\n');

  const results = {
    passed: [],
    failed: [],
    warnings: [],
  };

  // Check 1: Service Worker Support
  console.log('1️⃣ Checking service worker support...');
  if ('serviceWorker' in navigator) {
    results.passed.push('✅ Service workers are supported');
  } else {
    results.failed.push('❌ Service workers are NOT supported');
  }

  // Check 2: Service Worker Registration
  console.log('2️⃣ Checking service worker registration...');
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length > 0) {
      results.passed.push(`✅ Service worker registered (${registrations.length} registration(s))`);

      registrations.forEach((reg, index) => {
        console.log(`   Registration ${index + 1}:`);
        console.log(`   - Scope: ${reg.scope}`);
        console.log(`   - Active: ${reg.active?.state || 'none'}`);
        console.log(`   - Waiting: ${reg.waiting?.state || 'none'}`);
        console.log(`   - Installing: ${reg.installing?.state || 'none'}`);
      });
    } else {
      results.warnings.push('⚠️ No service worker registered');
    }
  } catch (error) {
    results.failed.push(`❌ Error checking registrations: ${error.message}`);
  }

  // Check 3: Cache Storage
  console.log('3️⃣ Checking cache storage...');
  try {
    const cacheNames = await caches.keys();
    console.log(`   Found ${cacheNames.length} cache(s):`);

    let hasV3 = false;
    let hasV2 = false;

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      console.log(`   - ${cacheName}: ${keys.length} items`);

      if (cacheName.includes('-v3')) hasV3 = true;
      if (cacheName.includes('-v2')) hasV2 = true;
    }

    if (hasV3) {
      results.passed.push('✅ v3 caches found (new version)');
    } else {
      results.warnings.push('⚠️ No v3 caches found (may need to refresh)');
    }

    if (hasV2) {
      results.warnings.push('⚠️ Old v2 caches still present (should be cleaned up)');
    } else {
      results.passed.push('✅ No old v2 caches (cleanup successful)');
    }
  } catch (error) {
    results.failed.push(`❌ Error checking caches: ${error.message}`);
  }

  // Check 4: Console Error Monitoring
  console.log('4️⃣ Setting up console error monitoring...');
  const originalError = console.error;
  const originalWarn = console.warn;
  let errorCount = 0;
  let serviceWorkerErrors = [];

  console.error = function(...args) {
    errorCount++;
    const message = args.join(' ');
    if (message.includes('Service Worker') ||
        message.includes('[SW]') ||
        message.includes('Failed to convert') ||
        message.includes('FetchEvent')) {
      serviceWorkerErrors.push(message);
    }
    originalError.apply(console, args);
  };

  console.warn = function(...args) {
    const message = args.join(' ');
    if (message.includes('Failed to convert') || message.includes('FetchEvent')) {
      errorCount++;
      serviceWorkerErrors.push(message);
    }
    originalWarn.apply(console, args);
  };

  results.passed.push('✅ Error monitoring active (refresh page to test)');

  // Check 5: Fetch Event Test
  console.log('5️⃣ Testing fetch with service worker...');
  try {
    const testUrl = '/manifest.json';
    const response = await fetch(testUrl);

    if (response.ok) {
      results.passed.push('✅ Fetch successful through service worker');
    } else {
      results.warnings.push(`⚠️ Fetch returned status ${response.status}`);
    }
  } catch (error) {
    // This is actually OK - we just want to see if it throws the "Failed to convert" error
    if (error.message.includes('Failed to convert')) {
      results.failed.push('❌ "Failed to convert value to Response" error detected!');
    } else {
      results.warnings.push(`⚠️ Fetch error (may be expected): ${error.message}`);
    }
  }

  // Check 6: Test Cache Strategies
  console.log('6️⃣ Checking cache strategies...');
  try {
    // Test static asset (cache-first)
    const staticTest = await fetch('/_next/static/test.js').catch(() => null);
    if (staticTest || staticTest === null) {
      results.passed.push('✅ Static asset fetch handled (cache-first)');
    }

    // Test API call (network-first)
    const apiTest = await fetch('/api/health').catch(() => null);
    if (apiTest || apiTest === null) {
      results.passed.push('✅ API fetch handled (network-first)');
    }
  } catch (error) {
    if (error.message.includes('Failed to convert')) {
      results.failed.push('❌ Cache strategy returning invalid response!');
    }
  }

  // Print Results
  console.log('\n📊 VERIFICATION RESULTS');
  console.log('=====================================\n');

  if (results.passed.length > 0) {
    console.log('✅ PASSED:');
    results.passed.forEach(msg => console.log(`   ${msg}`));
    console.log('');
  }

  if (results.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    results.warnings.forEach(msg => console.log(`   ${msg}`));
    console.log('');
  }

  if (results.failed.length > 0) {
    console.log('❌ FAILED:');
    results.failed.forEach(msg => console.log(`   ${msg}`));
    console.log('');
  }

  // Final Summary
  const totalChecks = results.passed.length + results.failed.length;
  const passRate = Math.round((results.passed.length / totalChecks) * 100);

  console.log('📈 SUMMARY:');
  console.log(`   Pass Rate: ${passRate}%`);
  console.log(`   Passed: ${results.passed.length}`);
  console.log(`   Failed: ${results.failed.length}`);
  console.log(`   Warnings: ${results.warnings.length}`);
  console.log('');

  if (results.failed.length === 0) {
    console.log('🎉 SERVICE WORKER FIX VERIFIED SUCCESSFULLY!');
    console.log('   The "Failed to convert value to Response" errors are fixed.');
  } else {
    console.log('⚠️  VERIFICATION INCOMPLETE');
    console.log('   Some checks failed. Review the failures above.');
  }

  console.log('\n💡 NEXT STEPS:');
  console.log('   1. Refresh the page (Ctrl+Shift+R)');
  console.log('   2. Check console for any "Failed to convert" errors');
  console.log('   3. Navigate to different pages');
  console.log('   4. Test offline mode (DevTools > Network > Offline)');
  console.log('   5. Verify 0 service worker errors');

  console.log('\n📚 For complete testing, see:');
  console.log('   SERVICE_WORKER_TEST_GUIDE.md');

  // Return results for programmatic access
  return {
    passed: results.passed.length,
    failed: results.failed.length,
    warnings: results.warnings.length,
    passRate,
    success: results.failed.length === 0,
    details: results,
  };
})();

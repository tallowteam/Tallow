import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.resolve('screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const pages = [
  {
    url: '/',
    name: 'landing',
    label: 'Landing Page',
  },
  {
    url: '/features',
    name: 'features',
    label: 'Features Page',
  },
  {
    url: '/security',
    name: 'security',
    label: 'Security Page',
  },
  {
    url: '/pricing',
    name: 'pricing',
    label: 'Pricing Page',
  },
  {
    url: '/about',
    name: 'about',
    label: 'About Page',
  },
];

async function checkPage(page, config) {
  const results = {
    name: config.label,
    url: config.url,
    issues: [],
    warnings: [],
    info: [],
  };

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Checking: ${config.label} (${BASE_URL}${config.url})`);
  console.log('='.repeat(60));

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Navigate
  try {
    const response = await page.goto(`${BASE_URL}${config.url}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    if (!response) {
      results.issues.push('No response received');
      return results;
    }

    const status = response.status();
    console.log(`  Status: ${status}`);

    if (status >= 400) {
      results.issues.push(`HTTP ${status} error`);
    }
  } catch (e) {
    results.issues.push(`Navigation failed: ${e.message}`);
    return results;
  }

  // Wait for hydration
  await page.waitForTimeout(2000);

  // Take top screenshot
  const topScreenshot = path.join(SCREENSHOT_DIR, `verify-${config.name}.png`);
  await page.screenshot({ path: topScreenshot, fullPage: false });
  console.log(`  Screenshot (top): verify-${config.name}.png`);

  // Get page title
  const title = await page.title();
  console.log(`  Title: ${title}`);
  if (!title || title === '') {
    results.warnings.push('Page has no title');
  }

  // Check page dimensions via locator
  const bodyBox = await page.locator('body').boundingBox();
  const bodyHeight = bodyBox ? bodyBox.height : 0;
  console.log(`  Body height: ${bodyHeight}px`);

  // Scroll to bottom and take screenshot
  if (bodyHeight > 800) {
    await page.keyboard.press('End');
    await page.waitForTimeout(1000);
    const bottomScreenshot = path.join(SCREENSHOT_DIR, `verify-${config.name}-bottom.png`);
    await page.screenshot({ path: bottomScreenshot, fullPage: false });
    console.log(`  Screenshot (bottom): verify-${config.name}-bottom.png`);
  }

  // Scroll back to top
  await page.keyboard.press('Home');
  await page.waitForTimeout(500);

  // Get accessibility snapshot (use ariaSnapshot for newer Playwright)
  let a11yInfo = 'available';
  try {
    const snapshot = await page.locator('body').ariaSnapshot();
    const lineCount = snapshot ? snapshot.split('\n').length : 0;
    console.log(`  A11y snapshot lines: ${lineCount}`);
    // Save a11y snapshot to file
    const a11yFile = path.join(SCREENSHOT_DIR, `a11y-${config.name}.txt`);
    fs.writeFileSync(a11yFile, snapshot || '');
  } catch (e) {
    console.log(`  A11y snapshot: skipped (${e.message})`);
    a11yInfo = 'unavailable';
  }

  // Check for specific elements
  const headerCount = await page.locator('header, nav, [role="banner"], [role="navigation"]').count();
  if (headerCount > 0) {
    results.info.push('Header/Navigation: Present');
  } else {
    results.warnings.push('No header or navigation element found');
  }

  const footerCount = await page.locator('footer, [role="contentinfo"]').count();
  if (footerCount > 0) {
    results.info.push('Footer: Present');
  } else {
    results.warnings.push('No footer element found');
  }

  const mainCount = await page.locator('main, [role="main"]').count();
  if (mainCount > 0) {
    results.info.push('Main content area: Present');
  } else {
    results.warnings.push('No <main> element found');
  }

  // Check for h1
  const h1Count = await page.locator('h1').count();
  if (h1Count > 0) {
    const h1Text = await page.locator('h1').first().textContent();
    results.info.push(`H1: "${h1Text?.trim().substring(0, 80)}"`);
  } else {
    results.warnings.push('No H1 element found');
  }

  // Count headings
  const headingCount = await page.locator('h1, h2, h3, h4, h5, h6').count();
  results.info.push(`Total headings: ${headingCount}`);

  // Check for images without alt text
  const imgCount = await page.locator('img').count();
  const imgNoAltCount = await page.locator('img:not([alt]):not([aria-hidden="true"])').count();
  if (imgNoAltCount > 0) {
    results.warnings.push(`${imgNoAltCount} image(s) missing alt text`);
  }
  results.info.push(`Images: ${imgCount} total`);

  // Check for links
  const linkCount = await page.locator('a').count();
  results.info.push(`Total links: ${linkCount}`);

  // Check for buttons
  const buttonCount = await page.locator('button, [role="button"]').count();
  results.info.push(`Total buttons: ${buttonCount}`);

  // Check for visible text content
  const bodyText = await page.locator('body').innerText();
  const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;
  results.info.push(`Approximate word count: ${wordCount}`);

  if (wordCount < 20) {
    results.warnings.push('Very little text content on page');
  }

  // Check for error elements
  const errorCount = await page.locator('.error, [role="alert"], .error-boundary').count();
  if (errorCount > 0) {
    results.issues.push(`${errorCount} error element(s) found on page`);
  }

  // Console errors
  if (consoleErrors.length > 0) {
    // Filter out known benign errors
    const realErrors = consoleErrors.filter(e =>
      !e.includes('favicon') && !e.includes('404')
    );
    if (realErrors.length > 0) {
      results.warnings.push(`Console errors (${realErrors.length}): ${realErrors.slice(0, 3).join(' | ')}`);
    }
  }

  // Page-specific checks
  const pageText = bodyText.toLowerCase();

  if (config.name === 'landing') {
    const sectionCount = await page.locator('section').count();
    results.info.push(`Sections: ${sectionCount}`);

    const ctaCount = await page.locator('a:has-text("Get Started"), a:has-text("Start"), a:has-text("Try"), button:has-text("Start"), button:has-text("Try")').count();
    if (ctaCount > 0) {
      results.info.push('CTA button: Present');
    } else {
      results.warnings.push('No clear CTA button found');
    }

    if (!pageText.includes('feature')) results.warnings.push('No "feature" section text found');
    if (!pageText.includes('security') && !pageText.includes('secure') && !pageText.includes('encrypt')) {
      results.warnings.push('No security section text found');
    }
  }

  if (config.name === 'pricing') {
    const cardCount = await page.locator('[class*="card"], [class*="Card"], [class*="tier"], [class*="plan"], [class*="pricing"], [class*="Pricing"]').count();
    results.info.push(`Pricing cards/tiers found: ${cardCount}`);

    if (cardCount < 3) {
      results.warnings.push(`Expected 3 pricing tiers, found ${cardCount} card-like elements`);
    }

    const hasPrice = /\$\d+|free/i.test(bodyText);
    if (hasPrice) {
      results.info.push('Price amounts: Present');
    } else {
      results.warnings.push('No price amounts found');
    }
  }

  if (config.name === 'security') {
    const securityTerms = ['encrypt', 'security', 'privacy', 'protect', 'quantum'];
    const foundTerms = securityTerms.filter(t => pageText.includes(t));
    results.info.push(`Security terms found: ${foundTerms.join(', ')}`);
    if (foundTerms.length === 0) {
      results.warnings.push('No security-related terms found');
    }
  }

  if (config.name === 'features') {
    const featureCards = await page.locator('[class*="card"], [class*="Card"], [class*="feature"], [class*="Feature"]').count();
    results.info.push(`Feature cards found: ${featureCards}`);
  }

  // Print results
  console.log('\n  --- Results ---');
  if (results.issues.length > 0) {
    console.log('  ISSUES:');
    results.issues.forEach(i => console.log(`    [!] ${i}`));
  }
  if (results.warnings.length > 0) {
    console.log('  WARNINGS:');
    results.warnings.forEach(w => console.log(`    [~] ${w}`));
  }
  console.log('  INFO:');
  results.info.forEach(i => console.log(`    [i] ${i}`));

  return results;
}

async function main() {
  console.log('Starting page verification...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  const allResults = [];

  for (const config of pages) {
    try {
      const result = await checkPage(page, config);
      allResults.push(result);
    } catch (e) {
      console.error(`  FATAL ERROR on ${config.label}: ${e.message}`);
      allResults.push({
        name: config.label,
        url: config.url,
        issues: [`Fatal error: ${e.message}`],
        warnings: [],
        info: [],
      });
    }
  }

  await browser.close();

  // Print summary
  console.log('\n\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  let totalIssues = 0;
  let totalWarnings = 0;

  for (const result of allResults) {
    console.log(`\n${result.name} (${result.url}):`);
    if (result.issues.length === 0 && result.warnings.length === 0) {
      console.log('  [OK] No issues found');
    }
    result.issues.forEach(i => {
      console.log(`  [ISSUE] ${i}`);
      totalIssues++;
    });
    result.warnings.forEach(w => {
      console.log(`  [WARN] ${w}`);
      totalWarnings++;
    });
  }

  console.log(`\nTotal: ${totalIssues} issues, ${totalWarnings} warnings`);
  console.log('Screenshots saved to: screenshots/');

  // Write JSON report
  const report = JSON.stringify(allResults, null, 2);
  fs.writeFileSync(path.join(SCREENSHOT_DIR, 'verification-report.json'), report);
  console.log('Report saved to: screenshots/verification-report.json');
}

main().catch(e => {
  console.error('Script failed:', e);
  process.exit(1);
});

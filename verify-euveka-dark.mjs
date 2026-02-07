import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

mkdirSync('screenshots', { recursive: true });

const pages = [
  { url: 'http://localhost:3000/privacy', name: 'privacy', label: 'Privacy Page' },
  { url: 'http://localhost:3000/terms', name: 'terms', label: 'Terms Page' },
  { url: 'http://localhost:3000/nonexistent-page', name: '404', label: '404 Page' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Test in dark mode (the Euveka design default)
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark'
  });

  for (const pg of pages) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`VERIFYING (DARK MODE): ${pg.label} (${pg.url})`);
    console.log('='.repeat(70));

    const page = await context.newPage();
    const consoleErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    page.on('pageerror', err => {
      consoleErrors.push(`PAGE ERROR: ${err.message}`);
    });

    try {
      const response = await page.goto(pg.url, { waitUntil: 'networkidle', timeout: 30000 });
      const status = response?.status();
      console.log(`HTTP Status: ${status}`);

      await page.waitForTimeout(2000);

      // Take screenshots - dark mode
      await page.screenshot({ path: `screenshots/verify-${pg.name}-dark.png`, fullPage: true });
      console.log(`Screenshot saved: screenshots/verify-${pg.name}-dark.png`);

      // Check data-theme attribute
      const dataTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      console.log(`data-theme attribute: ${dataTheme}`);

      // Design check
      const designCheck = await page.evaluate(() => {
        const results = {};
        const cs = getComputedStyle(document.documentElement);

        results.bgBase = cs.getPropertyValue('--bg-base').trim();
        results.bgSurface = cs.getPropertyValue('--bg-surface').trim();
        results.textPrimary = cs.getPropertyValue('--text-primary').trim();
        results.primary500 = cs.getPropertyValue('--primary-500').trim();
        results.borderDashed = cs.getPropertyValue('--border-dashed').trim();
        results.fontDisplay = cs.getPropertyValue('--font-display').trim();

        // Body background
        results.bodyBg = getComputedStyle(document.body).backgroundColor;

        // Check for warm dark bg
        const bodyBg = getComputedStyle(document.body).backgroundColor;
        results.isWarmDark = bodyBg.includes('13, 12, 8') || bodyBg.includes('0, 0, 0') || bodyBg.includes('10, 10, 10');

        // Check for dashed borders
        let dashedCount = 0;
        for (const el of document.querySelectorAll('*')) {
          const s = getComputedStyle(el);
          if (s.borderStyle?.includes('dashed') || s.borderTopStyle?.includes('dashed')) dashedCount++;
        }
        results.dashedBorderCount = dashedCount;

        // Check heading fonts
        const headings = document.querySelectorAll('h1, h2, h3');
        results.headings = [];
        for (const h of [...headings].slice(0, 5)) {
          const ff = getComputedStyle(h).fontFamily;
          results.headings.push({
            tag: h.tagName,
            text: h.textContent?.substring(0, 30) || '',
            font: ff.substring(0, 100),
            hasSerif: ff.includes('Playfair') || (ff.includes('serif') && !ff.includes('sans-serif') && !ff.includes('sans'))
          });
        }

        // Check for blue accent usage
        let blueAccentCount = 0;
        for (const el of document.querySelectorAll('a, button, [class*="badge"], [class*="Badge"]')) {
          const c = getComputedStyle(el).color;
          const bg = getComputedStyle(el).backgroundColor;
          if (c.includes('0, 153, 255') || bg.includes('0, 153, 255') || c.includes('51, 173, 255') || bg.includes('0, 122, 204')) {
            blueAccentCount++;
          }
        }
        results.blueAccentCount = blueAccentCount;

        // Check header
        const header = document.querySelector('header');
        results.hasHeader = !!header;

        // Check footer
        const footer = document.querySelector('footer');
        results.hasFooter = !!footer;

        // Check h1
        const h1 = document.querySelector('h1');
        results.h1Text = h1?.textContent || 'none';

        // Count sections
        results.sectionCount = document.querySelectorAll('section').length;

        return results;
      });

      console.log(`\n--- Design Verification ---`);
      console.log(`  --bg-base: ${designCheck.bgBase}`);
      console.log(`  --bg-surface: ${designCheck.bgSurface}`);
      console.log(`  --text-primary: ${designCheck.textPrimary}`);
      console.log(`  --primary-500: ${designCheck.primary500}`);
      console.log(`  --border-dashed: ${designCheck.borderDashed}`);
      console.log(`  --font-display: ${designCheck.fontDisplay}`);
      console.log(`  Body background: ${designCheck.bodyBg}`);
      console.log(`  Warm dark background: ${designCheck.isWarmDark ? 'YES' : 'NO'}`);
      console.log(`  Dashed border elements: ${designCheck.dashedBorderCount}`);
      console.log(`  Blue accent elements: ${designCheck.blueAccentCount}`);
      console.log(`  Header present: ${designCheck.hasHeader}`);
      console.log(`  Footer present: ${designCheck.hasFooter}`);
      console.log(`  H1 text: "${designCheck.h1Text}"`);
      console.log(`  Sections: ${designCheck.sectionCount}`);

      console.log(`\n  Heading fonts:`);
      for (const h of designCheck.headings) {
        console.log(`    ${h.tag}: "${h.text}" -> serif: ${h.hasSerif} | ${h.font}`);
      }

      // Console errors
      console.log(`\n--- Console Errors: ${consoleErrors.length} ---`);
      for (const err of consoleErrors) {
        console.log(`  ERROR: ${err.substring(0, 200)}`);
      }

    } catch (err) {
      console.log(`FAILED TO LOAD: ${err.message}`);
    }

    await page.close();
  }

  await browser.close();
  console.log('\n\nDone!');
})();

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
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  for (const pg of pages) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`VERIFYING: ${pg.label} (${pg.url})`);
    console.log('='.repeat(70));

    const page = await context.newPage();
    const consoleErrors = [];
    const consoleWarnings = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {consoleErrors.push(msg.text());}
      if (msg.type() === 'warning') {consoleWarnings.push(msg.text());}
    });

    page.on('pageerror', err => {
      consoleErrors.push(`PAGE ERROR: ${err.message}`);
    });

    try {
      const response = await page.goto(pg.url, { waitUntil: 'networkidle', timeout: 30000 });
      const status = response?.status();
      console.log(`\n--- HTTP Status: ${status} ---`);

      // Wait a moment for any client-side rendering
      await page.waitForTimeout(2000);

      // Take full-page screenshot
      const screenshotPath = `screenshots/verify-${pg.name}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Screenshot saved: ${screenshotPath}`);

      // Check page title
      const title = await page.title();
      console.log(`Page title: "${title}"`);

      // Check if page has content (not blank)
      const bodyText = await page.evaluate(() => document.body?.innerText?.trim().substring(0, 200));
      console.log(`Body text preview: "${bodyText}"`);

      const isBlank = !bodyText || bodyText.length < 10;
      console.log(`Page blank: ${isBlank}`);

      // Check header
      const hasHeader = await page.evaluate(() => {
        const header = document.querySelector('header');
        return header ? { exists: true, text: header.innerText.substring(0, 100) } : { exists: false };
      });
      console.log(`Header: ${hasHeader.exists ? 'FOUND - ' + hasHeader.text : 'NOT FOUND'}`);

      // Check footer
      const hasFooter = await page.evaluate(() => {
        const footer = document.querySelector('footer');
        return footer ? { exists: true, text: footer.innerText.substring(0, 100) } : { exists: false };
      });
      console.log(`Footer: ${hasFooter.exists ? 'FOUND - ' + hasFooter.text : 'NOT FOUND'}`);

      // Check main content
      const hasMain = await page.evaluate(() => {
        const main = document.querySelector('main');
        return main ? { exists: true, childCount: main.children.length } : { exists: false };
      });
      console.log(`Main element: ${hasMain.exists ? 'FOUND (' + hasMain.childCount + ' children)' : 'NOT FOUND'}`);

      // Check h1
      const h1 = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        return h1 ? h1.innerText : null;
      });
      console.log(`H1: ${h1 || 'NOT FOUND'}`);

      // Check for Euveka design elements
      const designCheck = await page.evaluate(() => {
        const results = {};

        // Check background color on body or main wrapper
        const body = document.body;
        const bodyBg = getComputedStyle(body).backgroundColor;
        results.bodyBackground = bodyBg;

        // Check for warm dark background (#0d0c08 = rgb(13, 12, 8))
        const allElements = document.querySelectorAll('*');
        let hasWarmDark = false;
        let hasDashedBorder = false;
        let hasBlueAccent = false;

        for (const el of allElements) {
          const style = getComputedStyle(el);
          const bg = style.backgroundColor;
          if (bg.includes('13, 12, 8') || bg.includes('12, 11, 7') || bg.includes('10, 9, 6') || bg.includes('18, 17, 12')) {
            hasWarmDark = true;
          }
          if (style.borderStyle === 'dashed' || style.borderTopStyle === 'dashed' || style.borderBottomStyle === 'dashed') {
            hasDashedBorder = true;
          }
          const color = style.color;
          if (color.includes('0, 153, 255') || color.includes('0, 132, 255') || style.borderColor?.includes('0, 153, 255')) {
            hasBlueAccent = true;
          }
        }

        results.hasWarmDarkBackground = hasWarmDark;
        results.hasDashedBorders = hasDashedBorder;
        results.hasBlueAccent = hasBlueAccent;

        // Check for serif fonts in headings
        const headings = document.querySelectorAll('h1, h2, h3');
        const headingFonts = [];
        for (const h of headings) {
          const font = getComputedStyle(h).fontFamily;
          headingFonts.push({ tag: h.tagName, text: h.innerText.substring(0, 30), font: font.substring(0, 80) });
        }
        results.headingFonts = headingFonts.slice(0, 5);

        // Check cards
        const cards = document.querySelectorAll('[class*="card"], [class*="Card"]');
        results.cardCount = cards.length;

        // Check sections
        const sections = document.querySelectorAll('section');
        results.sectionCount = sections.length;

        return results;
      });

      console.log(`\n--- Euveka Design Check ---`);
      console.log(`Body background: ${designCheck.bodyBackground}`);
      console.log(`Warm dark background (#0d0c08 style): ${designCheck.hasWarmDarkBackground ? 'YES' : 'NO'}`);
      console.log(`Dashed borders: ${designCheck.hasDashedBorders ? 'YES' : 'NO'}`);
      console.log(`Blue accent (#0099ff): ${designCheck.hasBlueAccent ? 'YES' : 'NO'}`);
      console.log(`Cards found: ${designCheck.cardCount}`);
      console.log(`Sections found: ${designCheck.sectionCount}`);
      console.log(`Heading fonts:`);
      for (const hf of designCheck.headingFonts) {
        const isSerif = hf.font.toLowerCase().includes('serif') && !hf.font.toLowerCase().includes('sans-serif');
        console.log(`  ${hf.tag}: "${hf.text}" — ${hf.font} ${isSerif ? '(SERIF)' : '(SANS-SERIF)'}`);
      }

      // Console errors
      console.log(`\n--- Console Errors: ${consoleErrors.length} ---`);
      for (const err of consoleErrors) {
        console.log(`  ERROR: ${err.substring(0, 200)}`);
      }
      console.log(`--- Console Warnings: ${consoleWarnings.length} ---`);

    } catch (err) {
      console.log(`FAILED TO LOAD: ${err.message}`);
    }

    await page.close();
  }

  await browser.close();
  console.log('\n\nDone! All pages verified.');
})();

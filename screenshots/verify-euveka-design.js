const { chromium } = require('playwright');

async function verifyPages() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  const pages = [
    { url: 'http://localhost:3000/transfer', name: 'transfer' },
    { url: 'http://localhost:3000/settings', name: 'settings' },
    { url: 'http://localhost:3000/docs', name: 'docs' },
  ];

  const results = {};

  for (const pageInfo of pages) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`CHECKING: ${pageInfo.url}`);
    console.log('='.repeat(60));

    const page = await context.newPage();

    // Collect console messages
    const consoleErrors = [];
    const consoleWarnings = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {consoleErrors.push(msg.text());}
      if (msg.type() === 'warning') {consoleWarnings.push(msg.text());}
    });

    // Collect page errors
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    try {
      // Navigate with timeout
      const response = await page.goto(pageInfo.url, { waitUntil: 'networkidle', timeout: 30000 });
      const status = response ? response.status() : 'unknown';
      console.log(`Status: ${status}`);

      // Wait a bit for any dynamic content
      await page.waitForTimeout(2000);

      // Take viewport screenshot
      await page.screenshot({
        path: `screenshots/verify-euveka-${pageInfo.name}.png`,
        fullPage: false
      });
      console.log(`Screenshot saved: verify-euveka-${pageInfo.name}.png`);

      // Take full page screenshot
      await page.screenshot({
        path: `screenshots/verify-euveka-${pageInfo.name}-full.png`,
        fullPage: true
      });
      console.log(`Full screenshot saved: verify-euveka-${pageInfo.name}-full.png`);

      // Check page title
      const title = await page.title();
      console.log(`Title: ${title}`);

      // Check if page has content (not blank)
      const bodyText = await page.evaluate(() => document.body.innerText.trim().length);
      console.log(`Body text length: ${bodyText} chars`);

      // Check for key elements
      const hasHeader = await page.evaluate(() => {
        const header = document.querySelector('header') || document.querySelector('nav');
        return header !== null;
      });
      console.log(`Has header/nav: ${hasHeader}`);

      const hasFooter = await page.evaluate(() => {
        const footer = document.querySelector('footer');
        return footer !== null;
      });
      console.log(`Has footer: ${hasFooter}`);

      // Check for main content area
      const hasMain = await page.evaluate(() => {
        const main = document.querySelector('main') || document.querySelector('[role="main"]');
        return main !== null;
      });
      console.log(`Has main content: ${hasMain}`);

      // Check Euveka design elements
      const designCheck = await page.evaluate(() => {
        const result = {};

        // Check background colors - look for warm dark tones
        const body = document.body;
        const bodyBg = getComputedStyle(body).backgroundColor;
        result.bodyBackground = bodyBg;

        // Check for dashed borders
        const dashedElements = document.querySelectorAll('*');
        let dashedCount = 0;
        for (const el of dashedElements) {
          const style = getComputedStyle(el);
          if (style.borderStyle === 'dashed' ||
              style.borderTopStyle === 'dashed' ||
              style.borderBottomStyle === 'dashed' ||
              style.borderLeftStyle === 'dashed' ||
              style.borderRightStyle === 'dashed') {
            dashedCount++;
          }
        }
        result.dashedBorderCount = dashedCount;

        // Check for blue accent color (#0099ff or similar)
        const allElements = document.querySelectorAll('*');
        let blueAccentCount = 0;
        for (const el of allElements) {
          const style = getComputedStyle(el);
          const color = style.color;
          const bg = style.backgroundColor;
          // rgb(0, 153, 255) is #0099ff
          if (color.includes('0, 153, 255') || bg.includes('0, 153, 255') ||
              color.includes('0,153,255') || bg.includes('0,153,255')) {
            blueAccentCount++;
          }
        }
        result.blueAccentCount = blueAccentCount;

        // Check for serif fonts in headings
        const headings = document.querySelectorAll('h1, h2, h3');
        const headingFonts = [];
        for (const h of headings) {
          const font = getComputedStyle(h).fontFamily;
          headingFonts.push({ tag: h.tagName, text: h.textContent?.substring(0, 50), font });
        }
        result.headingFonts = headingFonts.slice(0, 5);

        // Check for pill-shaped buttons (border-radius)
        const buttons = document.querySelectorAll('button, a[class*="button"], a[class*="Button"], [class*="btn"], [class*="Btn"]');
        const buttonStyles = [];
        for (const btn of buttons) {
          const style = getComputedStyle(btn);
          const radius = style.borderRadius;
          buttonStyles.push({
            text: btn.textContent?.substring(0, 30)?.trim(),
            borderRadius: radius,
            isPill: parseInt(radius) >= 20
          });
        }
        result.buttonStyles = buttonStyles.slice(0, 5);

        // Check CSS custom properties
        const rootStyle = getComputedStyle(document.documentElement);
        result.cssVars = {
          bgPrimary: rootStyle.getPropertyValue('--bg-primary')?.trim(),
          accentColor: rootStyle.getPropertyValue('--accent')?.trim() || rootStyle.getPropertyValue('--accent-color')?.trim(),
          colorPrimary: rootStyle.getPropertyValue('--color-primary')?.trim(),
        };

        return result;
      });

      console.log(`\nDesign Check:`);
      console.log(`  Body background: ${designCheck.bodyBackground}`);
      console.log(`  Dashed border elements: ${designCheck.dashedBorderCount}`);
      console.log(`  Blue accent (#0099ff) elements: ${designCheck.blueAccentCount}`);
      console.log(`  CSS vars: ${JSON.stringify(designCheck.cssVars)}`);

      if (designCheck.headingFonts.length > 0) {
        console.log(`  Heading fonts:`);
        for (const h of designCheck.headingFonts) {
          console.log(`    ${h.tag}: "${h.text}" -> ${h.font}`);
        }
      }

      if (designCheck.buttonStyles.length > 0) {
        console.log(`  Button styles:`);
        for (const b of designCheck.buttonStyles) {
          console.log(`    "${b.text}" -> radius: ${b.borderRadius}, pill: ${b.isPill}`);
        }
      }

      // Check page structure via accessibility tree snapshot
      const snapshot = await page.evaluate(() => {
        const walk = (el, depth = 0) => {
          if (depth > 2) {return '';}
          const tag = el.tagName?.toLowerCase();
          if (!tag || ['script', 'style', 'noscript', 'svg', 'path'].includes(tag)) {return '';}

          const role = el.getAttribute('role') || '';
          const ariaLabel = el.getAttribute('aria-label') || '';
          const id = el.id ? `#${el.id}` : '';
          let info = `${'  '.repeat(depth)}<${tag}${id}${role ? ` role="${role}"` : ''}${ariaLabel ? ` aria-label="${ariaLabel}"` : ''}>`;

          // Only get direct text for leaf-ish elements
          if (['h1','h2','h3','h4','p','button','a','span','label'].includes(tag)) {
            const text = el.textContent?.trim()?.substring(0, 60);
            if (text) {info += ` ${text}`;}
          }

          let result = info + '\n';

          if (depth < 2) {
            for (const child of el.children) {
              result += walk(child, depth + 1);
            }
          }
          return result;
        };
        return walk(document.body);
      });

      console.log(`\nPage structure (depth 2):`);
      console.log(snapshot.substring(0, 3000));

      // Report console errors
      if (consoleErrors.length > 0) {
        console.log(`\nCONSOLE ERRORS (${consoleErrors.length}):`);
        for (const err of consoleErrors) {
          console.log(`  ERROR: ${err.substring(0, 200)}`);
        }
      } else {
        console.log(`\nNo console errors`);
      }

      if (pageErrors.length > 0) {
        console.log(`\nPAGE ERRORS (${pageErrors.length}):`);
        for (const err of pageErrors) {
          console.log(`  PAGE ERROR: ${err.substring(0, 200)}`);
        }
      }

      results[pageInfo.name] = {
        status,
        title,
        bodyTextLength: bodyText,
        hasHeader,
        hasFooter,
        hasMain,
        consoleErrors: consoleErrors.length,
        pageErrors: pageErrors.length,
        designCheck,
        errors: consoleErrors,
        pageErrorMessages: pageErrors
      };

    } catch (error) {
      console.log(`FAILED: ${error.message}`);
      results[pageInfo.name] = { error: error.message };
    }

    await page.close();
  }

  // Save results
  const fs = require('fs');
  fs.writeFileSync('screenshots/euveka-verification-report.json', JSON.stringify(results, null, 2));
  console.log('\n\nResults saved to screenshots/euveka-verification-report.json');

  await browser.close();
}

verifyPages().catch(console.error);

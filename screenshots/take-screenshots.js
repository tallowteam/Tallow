const { chromium } = require('playwright');

const pages = [
  { url: 'http://localhost:3000/transfer', name: 'transfer' },
  { url: 'http://localhost:3000/settings', name: 'settings' },
  { url: 'http://localhost:3000/docs', name: 'docs' },
  { url: 'http://localhost:3000/docs/guides', name: 'docs-guides' },
  { url: 'http://localhost:3000/docs/guides/getting-started', name: 'docs-guides-getting-started' },
  { url: 'http://localhost:3000/docs/api', name: 'docs-api' },
  { url: 'http://localhost:3000/docs/architecture', name: 'docs-architecture' },
  { url: 'http://localhost:3000/docs/hooks', name: 'docs-hooks' },
  { url: 'http://localhost:3000/privacy', name: 'privacy' },
  { url: 'http://localhost:3000/terms', name: 'terms' },
];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  for (const p of pages) {
    console.log(`\n=== ${p.name} (${p.url}) ===`);
    const page = await context.newPage();
    try {
      const response = await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
      console.log(`Status: ${response.status()}`);

      // Wait a bit for client-side rendering
      await page.waitForTimeout(2000);

      // Take full page screenshot
      await page.screenshot({
        path: `c:/Users/aamir/Documents/Apps/Tallow/screenshots/check-${p.name}.png`,
        fullPage: true
      });
      console.log(`Screenshot saved: check-${p.name}.png`);

      // Get page title
      const title = await page.title();
      console.log(`Title: ${title}`);

      // Check for header
      const header = await page.$('header');
      console.log(`Header present: ${!!header}`);

      // Check for footer
      const footer = await page.$('footer');
      console.log(`Footer present: ${!!footer}`);

      // Check for main content
      const main = await page.$('main');
      console.log(`Main element present: ${!!main}`);

      // Get text content of main headings
      const headings = await page.$$('h1, h2, h3');
      const headingTexts = [];
      for (const h of headings.slice(0, 10)) {
        const text = await h.textContent();
        headingTexts.push(`${await h.evaluate(e => e.tagName)}: ${text.trim().substring(0, 80)}`);
      }
      console.log(`Headings:`);
      headingTexts.forEach(h => console.log(`  ${h}`));

      // Check for error messages
      const errorEls = await page.$$('[class*="error"], [class*="Error"], [role="alert"]');
      if (errorEls.length > 0) {
        const errorTexts = [];
        for (const el of errorEls) {
          const t = await el.textContent();
          errorTexts.push(t.trim().substring(0, 100));
        }
        console.log(`Errors found: ${JSON.stringify(errorTexts)}`);
      }

      // Get accessibility snapshot
      const a11ySnapshot = await page.accessibility.snapshot();
      if (a11ySnapshot) {
        const printTree = (node, indent) => {
          if (!node) {return;}
          const prefix = '  '.repeat(indent);
          const name = node.name ? ` "${node.name.substring(0, 60)}"` : '';
          const value = node.value ? ` [val: ${node.value.substring(0, 40)}]` : '';
          console.log(`${prefix}${node.role}${name}${value}`);
          if (node.children && indent < 3) {
            node.children.forEach(c => printTree(c, indent + 1));
          }
        };
        console.log(`\nAccessibility Tree (top 3 levels):`);
        printTree(a11ySnapshot, 0);
      }

      // Check visible text content summary
      const mainEl = await page.$('main');
      if (mainEl) {
        const bodyText = await mainEl.textContent();
        console.log(`\nVisible text (first 500 chars):`);
        console.log(bodyText.substring(0, 500).trim());
      }

    } catch (err) {
      console.log(`ERROR: ${err.message}`);
    }
    await page.close();
  }

  await browser.close();
  console.log('\n\nDone!');
})();

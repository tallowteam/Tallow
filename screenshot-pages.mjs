import { chromium } from 'playwright';

const pages = [
  { url: 'http://localhost:3000/admin', name: 'admin' },
  { url: 'http://localhost:3000/features/gallery', name: 'features-gallery' },
  { url: 'http://localhost:3000/docs/playground', name: 'docs-playground' },
  { url: 'http://localhost:3000/docs/guides/local-transfer', name: 'docs-guides-local-transfer' },
  { url: 'http://localhost:3000/docs/guides/internet-transfer', name: 'docs-guides-internet-transfer' },
  { url: 'http://localhost:3000/docs/guides/security', name: 'docs-guides-security' },
  { url: 'http://localhost:3000/biometric-demo', name: 'biometric-demo' },
  { url: 'http://localhost:3000/nonexistent-url-test', name: '404-page' },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  for (const page of pages) {
    console.log(`\n=== Navigating to: ${page.url} ===`);
    const tab = await context.newPage();

    try {
      const response = await tab.goto(page.url, { waitUntil: 'networkidle', timeout: 30000 });
      console.log(`Status: ${response?.status()}`);
      console.log(`Title: ${await tab.title()}`);

      // Wait a bit for any animations/lazy content
      await tab.waitForTimeout(2000);

      // Take full-page screenshot
      await tab.screenshot({
        path: `screenshots/${page.name}.png`,
        fullPage: true
      });
      console.log(`Screenshot saved: screenshots/${page.name}.png`);

      // Get accessibility snapshot
      const snapshot = await tab.accessibility.snapshot();
      console.log(`\nAccessibility Snapshot for ${page.name}:`);
      console.log(JSON.stringify(snapshot, null, 2).substring(0, 3000));

      // Check for header and footer
      const hasHeader = await tab.locator('header').count();
      const hasFooter = await tab.locator('footer').count();
      const hasNav = await tab.locator('nav').count();
      console.log(`\nHeader present: ${hasHeader > 0}`);
      console.log(`Footer present: ${hasFooter > 0}`);
      console.log(`Nav present: ${hasNav > 0}`);

      // Check for error indicators
      const errorText = await tab.locator('text=/error|Error|404|not found/i').count();
      console.log(`Error/404 text found: ${errorText > 0}`);

      // Get page content summary
      const bodyText = await tab.locator('body').innerText();
      const lines = bodyText.split('\n').filter(l => l.trim()).slice(0, 30);
      console.log(`\nPage content (first 30 non-empty lines):`);
      lines.forEach(l => console.log(`  ${l.substring(0, 120)}`));

    } catch (err) {
      console.log(`Error loading ${page.url}: ${err.message}`);
    }

    await tab.close();
  }

  await browser.close();
  console.log('\n=== All pages processed ===');
}

main().catch(console.error);

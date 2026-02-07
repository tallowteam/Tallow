import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  // Take viewport-only screenshots (not full page) for the very tall features gallery
  const tab = await context.newPage();
  await tab.goto('http://localhost:3000/features/gallery', { waitUntil: 'networkidle', timeout: 30000 });
  await tab.waitForTimeout(2000);

  // Top of page
  await tab.screenshot({ path: 'screenshots/features-gallery-top.png', fullPage: false });

  // Scroll down to see content area
  await tab.evaluate(() => window.scrollTo(0, 800));
  await tab.waitForTimeout(500);
  await tab.screenshot({ path: 'screenshots/features-gallery-content.png', fullPage: false });

  // Scroll to bottom for footer
  await tab.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight - 900));
  await tab.waitForTimeout(500);
  await tab.screenshot({ path: 'screenshots/features-gallery-bottom.png', fullPage: false });

  await tab.close();
  await browser.close();
  console.log('Done');
}

main().catch(console.error);

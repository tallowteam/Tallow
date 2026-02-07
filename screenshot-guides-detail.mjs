import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  // Local transfer guide - top + sidebar
  const lt = await context.newPage();
  await lt.goto('http://localhost:3000/docs/guides/local-transfer', { waitUntil: 'networkidle', timeout: 30000 });
  await lt.waitForTimeout(2000);
  await lt.screenshot({ path: 'screenshots/local-transfer-top.png', fullPage: false });

  // Check sidebar
  const sidebarLinks = await lt.locator('nav a').allTextContents();
  console.log(`Local Transfer sidebar links: ${sidebarLinks.join(', ')}`);

  await lt.close();

  // Internet transfer guide - top
  const it = await context.newPage();
  await it.goto('http://localhost:3000/docs/guides/internet-transfer', { waitUntil: 'networkidle', timeout: 30000 });
  await it.waitForTimeout(2000);
  await it.screenshot({ path: 'screenshots/internet-transfer-top.png', fullPage: false });
  await it.close();

  // Security guide - top
  const sg = await context.newPage();
  await sg.goto('http://localhost:3000/docs/guides/security', { waitUntil: 'networkidle', timeout: 30000 });
  await sg.waitForTimeout(2000);
  await sg.screenshot({ path: 'screenshots/security-guide-top.png', fullPage: false });
  await sg.close();

  await browser.close();
  console.log('Done');
}

main().catch(console.error);

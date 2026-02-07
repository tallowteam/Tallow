import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const tab = await context.newPage();

  await tab.goto('http://localhost:3000/docs/guides/local-transfer', { waitUntil: 'networkidle', timeout: 30000 });
  await tab.waitForTimeout(2000);

  // Take a cropped screenshot of just the header area
  await tab.screenshot({
    path: 'screenshots/header-breadcrumb-detail.png',
    clip: { x: 0, y: 0, width: 500, height: 70 }
  });

  // Check for overlapping elements in header
  const headerHTML = await tab.evaluate(() => {
    const header = document.querySelector('header');
    return header ? header.innerHTML.substring(0, 500) : 'No header found';
  });
  console.log('Header HTML excerpt:', headerHTML);

  // Check breadcrumb
  const breadcrumb = await tab.locator('nav[aria-label]').first().textContent().catch(() => 'not found');
  console.log('Breadcrumb text:', breadcrumb);

  await tab.close();
  await browser.close();
  console.log('Done');
}

main().catch(console.error);

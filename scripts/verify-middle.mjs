import { chromium } from 'playwright';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.resolve('screenshots');

const pages = [
  { url: '/', name: 'landing' },
  { url: '/features', name: 'features' },
  { url: '/security', name: 'security' },
  { url: '/pricing', name: 'pricing' },
  { url: '/about', name: 'about' },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  for (const config of pages) {
    await page.goto(`${BASE_URL}${config.url}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    // Take full page screenshot
    const fullPath = path.join(SCREENSHOT_DIR, `verify-${config.name}-full.png`);
    await page.screenshot({ path: fullPath, fullPage: true });
    console.log(`Full screenshot: verify-${config.name}-full.png`);

    // Take middle-of-page screenshot
    const bodyBox = await page.locator('body').boundingBox();
    if (bodyBox && bodyBox.height > 1440) {
      const midY = Math.floor(bodyBox.height / 2) - 360;
      await page.mouse.wheel(0, midY);
      await page.waitForTimeout(500);
      const midPath = path.join(SCREENSHOT_DIR, `verify-${config.name}-middle.png`);
      await page.screenshot({ path: midPath, fullPage: false });
      console.log(`Middle screenshot: verify-${config.name}-middle.png`);
    }
  }

  await browser.close();
  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });

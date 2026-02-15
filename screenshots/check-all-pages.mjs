import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:3000';
const OUT = join(__dirname, 'full-check');

mkdirSync(OUT, { recursive: true });

const pages = [
  { name: 'home', path: '/' },
  { name: 'features', path: '/features' },
  { name: 'security', path: '/security' },
  { name: 'pricing', path: '/pricing' },
  { name: 'about', path: '/about' },
  { name: 'transfer', path: '/transfer' },
  { name: 'settings', path: '/settings' },
  { name: 'docs', path: '/docs' },
  { name: 'privacy', path: '/privacy' },
  { name: 'terms', path: '/terms' },
  { name: '404', path: '/nonexistent-test' },
];

async function run() {
  const browser = await chromium.launch({ headless: false, channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const errors = {};

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const url = page.url();
      if (!errors[url]) {errors[url] = [];}
      errors[url].push(msg.text());
    }
  });

  for (const { name, path } of pages) {
    console.log(`\n=== Checking: ${name} (${path}) ===`);

    try {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 15000 });
    } catch {
      console.log(`  Warning: networkidle timeout, continuing...`);
    }

    await page.waitForTimeout(1500);

    // Viewport screenshot
    await page.screenshot({ path: join(OUT, `${name}-viewport.png`) });
    console.log(`  Viewport screenshot saved`);

    // Full page screenshot
    await page.screenshot({ path: join(OUT, `${name}-full.png`), fullPage: true });
    console.log(`  Full page screenshot saved`);

    // Scroll through sections
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const viewportHeight = 900;
    const sections = Math.ceil(pageHeight / viewportHeight);
    console.log(`  Page height: ${pageHeight}px, sections: ${sections}`);

    for (let i = 0; i < sections; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), i * viewportHeight);
      await page.waitForTimeout(400);
      await page.screenshot({ path: join(OUT, `${name}-section-${i}.png`) });
    }
    console.log(`  ${sections} section screenshots saved`);

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));

    const pageUrl = page.url();
    if (errors[pageUrl]?.length > 0) {
      console.log(`  ERRORS:`);
      errors[pageUrl].forEach(e => console.log(`    - ${e}`));
    } else {
      console.log(`  No console errors`);
    }
  }

  console.log(`\n\n========== SUMMARY ==========`);
  const allErrors = Object.entries(errors);
  if (allErrors.length === 0) {
    console.log('No console errors on any page!');
  } else {
    for (const [url, errs] of allErrors) {
      console.log(`\n${url}:`);
      errs.forEach(e => console.log(`  - ${e}`));
    }
  }

  console.log(`\nScreenshots saved to: ${OUT}`);
  console.log('Browser remains open for inspection. Press Ctrl+C to close.');

  // Keep browser open
  await new Promise(() => {});
}

run().catch(console.error);

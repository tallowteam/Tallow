import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const designs = [
  { file: '16-magazine-app.html', name: '16-magazine-app' },
  { file: '17-magazine-devices.html', name: '17-magazine-devices' },
  { file: '18-magazine-shield.html', name: '18-magazine-shield' },
  { file: '19-magazine-flow.html', name: '19-magazine-flow' },
  { file: '20-magazine-dashboard.html', name: '20-magazine-dashboard' },
];

const browser = await chromium.launch({ headless: true, channel: 'chrome' });

for (const design of designs) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const html = readFileSync(join(__dirname, design.file), 'utf-8');
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  await page.screenshot({ path: join(__dirname, `${design.name}-hero.png`), type: 'png' });
  await page.screenshot({ path: join(__dirname, `${design.name}-full.png`), fullPage: true, type: 'png' });

  console.log(`Done: ${design.name}`);
  await page.close();
}

await browser.close();
console.log('\nAll 5 magazine mockups captured!');

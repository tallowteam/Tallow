import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const designs = [
  { file: 'preview-dark-purple-euveka-mastra.html', name: 'dark-purple-euveka-mastra' },
];

const browser = await chromium.launch({ headless: true, channel: 'chrome' });

for (const design of designs) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const html = readFileSync(join(__dirname, design.file), 'utf-8');
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500); // Wait for Google Fonts

  // Full page
  await page.screenshot({
    path: join(__dirname, `tallow-${design.name}-full.png`),
    fullPage: true, type: 'png'
  });

  // Hero viewport
  await page.screenshot({
    path: join(__dirname, `tallow-${design.name}-hero.png`),
    type: 'png'
  });

  console.log(`Done: ${design.name}`);
  await page.close();
}

await browser.close();
console.log('\nEuveka + Mastra preview captured!');

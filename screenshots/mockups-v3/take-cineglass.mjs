import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const designs = [
  { file: '06-cineglass-immersive.html', name: '06-cineglass-immersive' },
  { file: '07-cineglass-horizon.html', name: '07-cineglass-horizon' },
  { file: '08-cineglass-noir.html', name: '08-cineglass-noir' },
  { file: '09-cineglass-editorial.html', name: '09-cineglass-editorial' },
  { file: '10-cineglass-aurora.html', name: '10-cineglass-aurora' },
];

const browser = await chromium.launch({ headless: true, channel: 'chrome' });

for (const design of designs) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const html = readFileSync(join(__dirname, design.file), 'utf-8');
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  await page.screenshot({
    path: join(__dirname, `${design.name}-full.png`),
    fullPage: true, type: 'png'
  });

  await page.screenshot({
    path: join(__dirname, `${design.name}-hero.png`),
    type: 'png'
  });

  console.log(`Done: ${design.name}`);
  await page.close();
}

await browser.close();
console.log('\nAll 5 cineglass mockups captured!');

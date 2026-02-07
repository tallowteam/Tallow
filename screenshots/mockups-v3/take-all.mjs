import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const designs = [
  { file: '01-split-bento.html', name: '01-split-bento' },
  { file: '02-cinematic-scroll.html', name: '02-cinematic-scroll' },
  { file: '03-command-dev.html', name: '03-command-dev' },
  { file: '04-editorial-asymmetric.html', name: '04-editorial-asymmetric' },
  { file: '05-glassmorphic-gradient.html', name: '05-glassmorphic-gradient' },
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
console.log('\nAll 5 mockups captured!');

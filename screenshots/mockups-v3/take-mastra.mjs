import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const designs = [
  { file: '11-mastra-grid.html', name: '11-mastra-grid' },
  { file: '12-mastra-command.html', name: '12-mastra-command' },
  { file: '13-mastra-panels.html', name: '13-mastra-panels' },
  { file: '14-mastra-magazine.html', name: '14-mastra-magazine' },
  { file: '15-mastra-floating.html', name: '15-mastra-floating' },
];

const browser = await chromium.launch({ headless: true, channel: 'chrome' });

for (const design of designs) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const html = readFileSync(join(__dirname, design.file), 'utf-8');
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  await page.screenshot({
    path: join(__dirname, `${design.name}-hero.png`),
    type: 'png'
  });

  await page.screenshot({
    path: join(__dirname, `${design.name}-full.png`),
    fullPage: true, type: 'png'
  });

  console.log(`Done: ${design.name}`);
  await page.close();
}

await browser.close();
console.log('\nAll 5 mastra mockups captured!');

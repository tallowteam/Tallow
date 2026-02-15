import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const tab = await context.newPage();

  // Check where content ends on features gallery
  await tab.goto('http://localhost:3000/features/gallery', { waitUntil: 'networkidle', timeout: 30000 });
  await tab.waitForTimeout(2000);

  // Count feature cards
  const cards = await tab.locator('[aria-label]').count();
  console.log(`Total elements with aria-label: ${cards}`);

  // Check for footer
  const footer = await tab.locator('footer').count();
  console.log(`Footer found: ${footer}`);

  // Check where last visible content is
  const lastCard = await tab.evaluate(() => {
    const cards = document.querySelectorAll('[class*="card"], [class*="Card"], [class*="feature"]');
    let maxBottom = 0;
    cards.forEach(c => {
      const rect = c.getBoundingClientRect();
      if (rect.bottom > maxBottom) {maxBottom = rect.bottom + window.scrollY;}
    });
    return maxBottom;
  });
  console.log(`Last card bottom position: ${lastCard}px`);

  const pageHeight = await tab.evaluate(() => document.documentElement.scrollHeight);
  console.log(`Total page height: ${pageHeight}px`);
  console.log(`Empty space at bottom: ${pageHeight - lastCard}px`);

  // Scroll to where cards end
  await tab.evaluate((pos) => window.scrollTo(0, pos - 400), lastCard);
  await tab.waitForTimeout(500);
  await tab.screenshot({ path: 'screenshots/features-gallery-last-cards.png', fullPage: false });

  await tab.close();
  await browser.close();
  console.log('Done');
}

main().catch(console.error);

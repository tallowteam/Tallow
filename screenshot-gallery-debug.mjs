import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const tab = await context.newPage();

  await tab.goto('http://localhost:3000/features/gallery', { waitUntil: 'networkidle', timeout: 30000 });
  await tab.waitForTimeout(2000);

  // Check how many feature cards are actually rendered and visible
  const visibleCards = await tab.evaluate(() => {
    const allDivs = document.querySelectorAll('div');
    let cardCount = 0;
    let lastVisibleBottom = 0;
    allDivs.forEach(d => {
      const style = window.getComputedStyle(d);
      if (style.display !== 'none' && d.textContent.includes('Implemented')) {
        const rect = d.getBoundingClientRect();
        if (rect.height > 50 && rect.height < 300 && rect.width > 200) {
          cardCount++;
          const bottom = rect.bottom + window.scrollY;
          if (bottom > lastVisibleBottom) lastVisibleBottom = bottom;
        }
      }
    });
    return { cardCount, lastVisibleBottom };
  });
  console.log(`Visible card-like divs: ${visibleCards.cardCount}`);
  console.log(`Last visible bottom: ${visibleCards.lastVisibleBottom}`);

  // Scroll to ~5000px and take a screenshot
  for (const pos of [3000, 6000, 9000, 12000, 15000, 18000]) {
    await tab.evaluate((p) => window.scrollTo(0, p), pos);
    await tab.waitForTimeout(300);
    await tab.screenshot({ path: `screenshots/features-gallery-${pos}.png`, fullPage: false });
    console.log(`Screenshot at scroll ${pos}`);
  }

  await tab.close();
  await browser.close();
  console.log('Done');
}

main().catch(console.error);

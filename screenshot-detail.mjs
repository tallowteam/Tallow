import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  // Docs playground - check for header/footer
  const pg = await context.newPage();
  await pg.goto('http://localhost:3000/docs/playground', { waitUntil: 'networkidle', timeout: 30000 });
  await pg.waitForTimeout(2000);

  // Top of page
  await pg.screenshot({ path: 'screenshots/playground-top.png', fullPage: false });

  // Bottom of page
  await pg.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await pg.waitForTimeout(500);
  await pg.screenshot({ path: 'screenshots/playground-bottom.png', fullPage: false });

  // Check for skip link, header, etc.
  const skipLink = await pg.locator('text=Skip to main content').count();
  const headerEl = await pg.locator('header').count();
  const footerEl = await pg.locator('footer').count();
  const backLink = await pg.locator('text=Back').count();
  console.log(`Playground - Skip link: ${skipLink}, Header: ${headerEl}, Footer: ${footerEl}, Back link: ${backLink}`);

  await pg.close();

  // Biometric demo - closer look at browser support section
  const bio = await context.newPage();
  await bio.goto('http://localhost:3000/biometric-demo', { waitUntil: 'networkidle', timeout: 30000 });
  await bio.waitForTimeout(2000);

  // Scroll to browser support
  await bio.evaluate(() => window.scrollTo(0, 800));
  await bio.waitForTimeout(500);
  await bio.screenshot({ path: 'screenshots/biometric-browser-support.png', fullPage: false });

  // Bottom
  await bio.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await bio.waitForTimeout(500);
  await bio.screenshot({ path: 'screenshots/biometric-bottom.png', fullPage: false });

  // Check if it has a proper nav
  const bioHeader = await bio.locator('header').count();
  const bioFooter = await bio.locator('footer').count();
  const bioNav = await bio.locator('nav').count();
  console.log(`Biometric - Header: ${bioHeader}, Footer: ${bioFooter}, Nav: ${bioNav}`);

  // Check for the "Back to Home" link
  const backHome = await bio.locator('text=Back to Home').count();
  console.log(`Biometric - "Back to Home" link: ${backHome}`);

  await bio.close();

  // 404 page - check more details
  const notFound = await context.newPage();
  await notFound.goto('http://localhost:3000/nonexistent-url-test', { waitUntil: 'networkidle', timeout: 30000 });
  await notFound.waitForTimeout(2000);

  const nfHeader = await notFound.locator('header').count();
  const nfFooter = await notFound.locator('footer').count();
  const nfNav = await notFound.locator('nav').count();
  console.log(`404 - Header: ${nfHeader}, Footer: ${nfFooter}, Nav: ${nfNav}`);

  await notFound.close();
  await browser.close();
  console.log('Done');
}

main().catch(console.error);

import { chromium } from 'playwright';

const pages = [
  { url: 'http://localhost:3000/admin', name: 'admin' },
  { url: 'http://localhost:3000/features/gallery', name: 'features-gallery' },
  { url: 'http://localhost:3000/docs/playground', name: 'docs-playground' },
  { url: 'http://localhost:3000/docs/guides/local-transfer', name: 'docs-guides-local-transfer' },
  { url: 'http://localhost:3000/docs/guides/internet-transfer', name: 'docs-guides-internet-transfer' },
  { url: 'http://localhost:3000/docs/guides/security', name: 'docs-guides-security' },
  { url: 'http://localhost:3000/biometric-demo', name: 'biometric-demo' },
  { url: 'http://localhost:3000/nonexistent-url-test', name: '404-page' },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  for (const page of pages) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`PAGE: ${page.name} (${page.url})`);
    console.log(`${'='.repeat(70)}`);
    const tab = await context.newPage();

    try {
      const response = await tab.goto(page.url, { waitUntil: 'networkidle', timeout: 30000 });
      console.log(`HTTP Status: ${response?.status()}`);
      console.log(`Title: ${await tab.title()}`);

      await tab.waitForTimeout(2000);

      // Check for header and footer
      const hasHeader = await tab.locator('header').count();
      const hasFooter = await tab.locator('footer').count();
      const hasNav = await tab.locator('nav').count();
      const hasMain = await tab.locator('main').count();
      console.log(`\nStructural elements:`);
      console.log(`  <header>: ${hasHeader > 0 ? 'YES' : 'NO'} (count: ${hasHeader})`);
      console.log(`  <footer>: ${hasFooter > 0 ? 'YES' : 'NO'} (count: ${hasFooter})`);
      console.log(`  <nav>: ${hasNav > 0 ? 'YES' : 'NO'} (count: ${hasNav})`);
      console.log(`  <main>: ${hasMain > 0 ? 'YES' : 'NO'} (count: ${hasMain})`);

      // Check for headings
      const h1s = await tab.locator('h1').allTextContents();
      const h2s = await tab.locator('h2').allTextContents();
      const h3s = await tab.locator('h3').allTextContents();
      console.log(`\nHeadings:`);
      console.log(`  H1: ${h1s.length > 0 ? h1s.join(', ') : 'NONE'}`);
      console.log(`  H2: ${h2s.length > 0 ? h2s.join(' | ') : 'NONE'}`);
      console.log(`  H3: ${h3s.length > 0 ? h3s.slice(0, 10).join(' | ') : 'NONE'}`);

      // Check for links
      const links = await tab.locator('a').count();
      const buttons = await tab.locator('button').count();
      const images = await tab.locator('img').count();
      const forms = await tab.locator('form').count();
      console.log(`\nInteractive elements:`);
      console.log(`  Links: ${links}`);
      console.log(`  Buttons: ${buttons}`);
      console.log(`  Images: ${images}`);
      console.log(`  Forms: ${forms}`);

      // Check for aria attributes
      const ariaLabels = await tab.locator('[aria-label]').count();
      const ariaRoles = await tab.locator('[role]').count();
      console.log(`\nAccessibility attributes:`);
      console.log(`  Elements with aria-label: ${ariaLabels}`);
      console.log(`  Elements with role: ${ariaRoles}`);

      // Get all text content
      const bodyText = await tab.locator('body').innerText();
      const lines = bodyText.split('\n').filter(l => l.trim()).slice(0, 40);
      console.log(`\nPage text content (first 40 non-empty lines):`);
      lines.forEach(l => console.log(`  ${l.substring(0, 150)}`));

      // Check page dimensions
      const pageHeight = await tab.evaluate(() => document.documentElement.scrollHeight);
      const pageWidth = await tab.evaluate(() => document.documentElement.scrollWidth);
      console.log(`\nPage dimensions: ${pageWidth}x${pageHeight}`);

      // Check for console errors
      const consoleErrors = [];
      tab.on('console', msg => {
        if (msg.type() === 'error') {consoleErrors.push(msg.text());}
      });

    } catch (err) {
      console.log(`Error: ${err.message}`);
    }

    await tab.close();
  }

  await browser.close();
  console.log('\n=== Analysis complete ===');
}

main().catch(console.error);

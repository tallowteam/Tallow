const { chromium } = require('playwright');

const pages = [
  { url: 'http://localhost:3000/docs', name: 'verify-docs', label: 'Docs Main Page' },
  { url: 'http://localhost:3000/docs/api', name: 'verify-docs-api', label: 'API Reference' },
  { url: 'http://localhost:3000/docs/architecture', name: 'verify-docs-arch', label: 'Architecture' },
  { url: 'http://localhost:3000/docs/guides', name: 'verify-docs-guides', label: 'Guides Index' },
  { url: 'http://localhost:3000/docs/guides/getting-started', name: 'verify-docs-guides-started', label: 'Getting Started Guide' },
  { url: 'http://localhost:3000/docs/guides/local-transfer', name: 'verify-docs-guides-local', label: 'Local Transfer Guide' },
  { url: 'http://localhost:3000/docs/guides/internet-transfer', name: 'verify-docs-guides-internet', label: 'Internet Transfer Guide' },
  { url: 'http://localhost:3000/docs/guides/security', name: 'verify-docs-guides-security', label: 'Security Guide' },
  { url: 'http://localhost:3000/docs/hooks', name: 'verify-docs-hooks', label: 'Hooks Documentation' },
  { url: 'http://localhost:3000/docs/playground', name: 'verify-docs-playground', label: 'Interactive Playground' },
];

const SCREENSHOT_DIR = 'c:/Users/aamir/Documents/Apps/Tallow/screenshots';

async function getScrollHeight(page) {
  return page.evaluate('document.documentElement.scrollHeight');
}

async function scrollToMiddle(page) {
  return page.evaluate('window.scrollTo(0, document.documentElement.scrollHeight / 2)');
}

async function scrollToTop(page) {
  return page.evaluate('window.scrollTo(0, 0)');
}

async function getMainTextContent(page) {
  try {
    return page.evaluate('document.querySelector("main") ? document.querySelector("main").textContent.trim() : ""');
  } catch (e) {
    return '';
  }
}

async function countBrokenImages(page) {
  return page.evaluate(`
    Array.from(document.querySelectorAll('img'))
      .filter(function(img) { return !img.complete || img.naturalWidth === 0; })
      .map(function(img) { return img.src || img.getAttribute('src'); })
  `);
}

async function getHeadings(page) {
  return page.evaluate(`
    Array.from(document.querySelectorAll('h1, h2, h3')).slice(0, 15).map(function(el) {
      return {
        tag: el.tagName,
        text: el.textContent.trim().substring(0, 100),
        visible: el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0
      };
    })
  `);
}

async function getLinks(page) {
  return page.evaluate(`
    Array.from(document.querySelectorAll('main a[href]')).slice(0, 30).map(function(a) {
      return {
        href: a.getAttribute('href'),
        text: a.textContent.trim().substring(0, 60)
      };
    })
  `);
}

async function getErrorTexts(page) {
  return page.evaluate(`
    Array.from(document.querySelectorAll('[class*="error"], [class*="Error"], [role="alert"], .next-error-h1'))
      .map(function(el) { return el.textContent.trim().substring(0, 150); })
  `);
}

async function countElements(page, selector) {
  return page.evaluate('document.querySelectorAll("' + selector + '").length');
}

async function hasElement(page, selector) {
  return page.evaluate('!!document.querySelector(\'' + selector + '\')');
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const results = [];

  for (const p of pages) {
    console.log('\n' + '='.repeat(70));
    console.log('PAGE: ' + p.label + ' (' + p.url + ')');
    console.log('='.repeat(70));

    const pageResult = {
      name: p.label,
      url: p.url,
      issues: [],
      status: null,
      hasHeader: false,
      hasFooter: false,
      hasMain: false,
      hasSidebar: false,
      headings: [],
      errors: [],
      consoleErrors: [],
      is404: false,
    };

    const page = await context.newPage();

    // Collect console errors
    page.on('console', function(msg) {
      if (msg.type() === 'error') {
        pageResult.consoleErrors.push(msg.text().substring(0, 200));
      }
    });

    try {
      const response = await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
      pageResult.status = response.status();
      console.log('HTTP Status: ' + pageResult.status);

      if (pageResult.status === 404) {
        pageResult.is404 = true;
        pageResult.issues.push('Page returns 404 Not Found');
      }

      // Wait for rendering
      await page.waitForTimeout(2000);

      // VIEWPORT SCREENSHOT (top)
      await page.screenshot({
        path: SCREENSHOT_DIR + '/' + p.name + '.png',
        fullPage: false,
      });
      console.log('Screenshot: ' + p.name + '.png (viewport)');

      // Scroll and take bottom screenshot if page is taller
      const pageHeight = await getScrollHeight(page);
      if (pageHeight > 1000) {
        await scrollToMiddle(page);
        await page.waitForTimeout(500);
        await page.screenshot({
          path: SCREENSHOT_DIR + '/' + p.name + '-bottom.png',
          fullPage: false,
        });
        console.log('Screenshot: ' + p.name + '-bottom.png (scrolled)');
        await scrollToTop(page);
      } else {
        console.log('Page fits in viewport (height: ' + pageHeight + 'px), no bottom screenshot needed.');
      }

      // Title
      const title = await page.title();
      console.log('Title: ' + title);

      // Check structural elements
      pageResult.hasHeader = await hasElement(page, 'header');
      pageResult.hasFooter = await hasElement(page, 'footer');
      pageResult.hasMain = await hasElement(page, 'main');
      pageResult.hasSidebar = await hasElement(page, '[class*="sidebar"], [class*="Sidebar"], aside');

      console.log('Header: ' + (pageResult.hasHeader ? 'YES' : 'MISSING'));
      console.log('Footer: ' + (pageResult.hasFooter ? 'YES' : 'MISSING'));
      console.log('Main: ' + (pageResult.hasMain ? 'YES' : 'MISSING'));
      console.log('Sidebar: ' + (pageResult.hasSidebar ? 'YES' : 'N/A'));

      if (!pageResult.hasHeader) pageResult.issues.push('Missing <header> element');
      if (!pageResult.hasFooter) pageResult.issues.push('Missing <footer> element');
      if (!pageResult.hasMain) pageResult.issues.push('Missing <main> element');

      // Headings
      const headings = await getHeadings(page);
      pageResult.headings = headings;
      console.log('\nHeadings (' + headings.length + '):');
      headings.forEach(function(h) {
        var visibility = h.visible ? '' : ' [HIDDEN]';
        console.log('  ' + h.tag + ': ' + h.text + visibility);
      });

      if (headings.length === 0) {
        pageResult.issues.push('No headings found on page');
      }

      // Check for error elements
      var errorTexts = await getErrorTexts(page);
      if (errorTexts.length > 0) {
        pageResult.errors = errorTexts;
        console.log('\nError elements found:');
        errorTexts.forEach(function(e) { console.log('  - ' + e); });
        var is404 = errorTexts.some(function(t) { return t.includes('404') || t.toLowerCase().includes('not found'); });
        if (is404) {
          pageResult.is404 = true;
          pageResult.issues.push('Page shows 404/not-found error');
        }
      }

      // Check for empty main content
      var mainText = await getMainTextContent(page);
      if (mainText.length < 20) {
        pageResult.issues.push('Main content appears empty or very short (' + mainText.length + ' chars)');
      }
      console.log('\nMain content length: ' + mainText.length + ' chars');
      console.log('First 300 chars: ' + mainText.substring(0, 300).replace(/\s+/g, ' '));

      // Check for broken images
      var brokenImages = await countBrokenImages(page);
      if (brokenImages.length > 0) {
        pageResult.issues.push('Broken images: ' + brokenImages.join(', '));
        console.log('\nBroken images: ' + brokenImages.join(', '));
      }

      // Docs main page specific checks
      if (p.name === 'verify-docs') {
        var cardCount = await countElements(page, '[class*="card"], [class*="Card"], [class*="feature"]');
        var codeCount = await countElements(page, 'pre, code, [class*="code"]');
        console.log('\nDocs main page specific checks:');
        console.log('  Feature cards/sections: ' + cardCount);
        console.log('  Code blocks: ' + codeCount);
        if (cardCount === 0) pageResult.issues.push('No feature cards found on docs main page');
      }

      // Links
      var links = await getLinks(page);
      console.log('\nLinks in main (' + links.length + '):');
      links.slice(0, 10).forEach(function(l) { console.log('  ' + l.text + ' -> ' + l.href); });

      // Accessibility snapshot
      try {
        var a11y = await page.accessibility.snapshot();
        if (a11y) {
          var countNodes = function(node) {
            var count = 1;
            if (node.children) node.children.forEach(function(c) { count += countNodes(c); });
            return count;
          };
          console.log('\nAccessibility tree nodes: ' + countNodes(a11y));
        }
      } catch (e) {
        console.log('Accessibility snapshot failed: ' + e.message);
      }

      // Console errors
      if (pageResult.consoleErrors.length > 0) {
        console.log('\nConsole errors (' + pageResult.consoleErrors.length + '):');
        pageResult.consoleErrors.forEach(function(e) { console.log('  ' + e); });
        pageResult.issues.push(pageResult.consoleErrors.length + ' console error(s)');
      }

    } catch (err) {
      console.log('NAVIGATION ERROR: ' + err.message);
      pageResult.issues.push('Navigation error: ' + err.message);
      try {
        await page.screenshot({
          path: SCREENSHOT_DIR + '/' + p.name + '.png',
          fullPage: false,
        });
      } catch (e) {}
    }

    results.push(pageResult);
    await page.close();
  }

  await browser.close();

  // SUMMARY
  console.log('\n\n' + '='.repeat(70));
  console.log('SUMMARY OF ALL DOCS PAGES');
  console.log('='.repeat(70) + '\n');

  var totalIssues = 0;
  results.forEach(function(r) {
    var icon = r.issues.length === 0 ? '[PASS]' : '[FAIL]';
    console.log(icon + ' ' + r.name + ' (' + r.url + ')');
    console.log('     HTTP ' + r.status + ' | Header:' + r.hasHeader + ' Footer:' + r.hasFooter + ' Main:' + r.hasMain + ' Sidebar:' + r.hasSidebar);
    if (r.issues.length > 0) {
      r.issues.forEach(function(i) { console.log('     ** ' + i); });
      totalIssues += r.issues.length;
    }
    console.log('');
  });

  console.log('\nTotal pages checked: ' + results.length);
  console.log('Total issues found: ' + totalIssues);
  console.log('Pages with issues: ' + results.filter(function(r) { return r.issues.length > 0; }).length);
  console.log('Pages passing: ' + results.filter(function(r) { return r.issues.length === 0; }).length);
})();

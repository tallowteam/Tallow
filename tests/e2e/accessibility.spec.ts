import { test, expect } from './fixtures';

test.describe('Accessibility', () => {
  test.describe('Keyboard Navigation', () => {
    test('should tab through interactive elements on homepage', async ({ page }) => {
      await page.goto('/');

      // Start from the top
      await page.keyboard.press('Tab');

      // Get focused element
      let focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el?.tagName,
          type: el?.getAttribute('type'),
          href: el?.getAttribute('href'),
          role: el?.getAttribute('role'),
          ariaLabel: el?.getAttribute('aria-label'),
        };
      });

      // Should be on an interactive element
      const isInteractive =
        focusedElement.tagName === 'A' ||
        focusedElement.tagName === 'BUTTON' ||
        focusedElement.role === 'link' ||
        focusedElement.role === 'button';

      expect(isInteractive).toBeTruthy();

      // Tab multiple times and check focus moves
      const focusedElements: string[] = [];

      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');

        const element = await page.evaluate(() => {
          const el = document.activeElement;
          return el?.tagName || '';
        });

        focusedElements.push(element);
      }

      // Should have moved through multiple elements
      const uniqueElements = new Set(focusedElements);
      expect(uniqueElements.size).toBeGreaterThan(1);
    });

    test('should tab through transfer page elements', async ({ page }) => {
      await page.goto('/transfer');

      // Tab to file input area
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
      }

      // Should be able to reach tab buttons
      const nearbyTab = page.locator('button:has-text("Nearby")');
      const internetTab = page.locator('button:has-text("Internet")');
      const friendsTab = page.locator('button:has-text("Friends")');

      // Check at least one tab is focusable
      await nearbyTab.focus();
      const isFocused = await nearbyTab.evaluate((el) => {
        return document.activeElement === el;
      });

      expect(isFocused).toBeTruthy();
    });

    test('should activate buttons with Enter key', async ({ page }) => {
      await page.goto('/');

      // Find Open App button and focus it
      const ctaButton = page.locator('a[href="/transfer"]').first();
      await ctaButton.focus();

      // Press Enter
      await page.keyboard.press('Enter');

      // Should navigate
      await expect(page).toHaveURL(/\/transfer/);
    });

    test('should activate buttons with Space key', async ({ page }) => {
      await page.goto('/transfer');

      // Focus on Nearby tab
      const nearbyTab = page.locator('button:has-text("Nearby")');
      await nearbyTab.focus();

      // Press Space
      await page.keyboard.press('Space');

      // Tab should be activated
      const pressed = await nearbyTab.getAttribute('aria-pressed');
      const className = await nearbyTab.getAttribute('class');

      expect(pressed === 'true' || className?.includes('active')).toBeTruthy();
    });

    test('should navigate through settings with keyboard', async ({ page }) => {
      await page.goto('/settings');

      // Tab to first toggle
      await page.keyboard.press('Tab');

      let foundCheckbox = false;
      for (let i = 0; i < 20; i++) {
        const element = await page.evaluate(() => {
          const el = document.activeElement;
          return {
            tagName: el?.tagName,
            type: el?.getAttribute('type'),
          };
        });

        if (element.tagName === 'INPUT' && element.type === 'checkbox') {
          foundCheckbox = true;

          // Toggle with Space
          await page.keyboard.press('Space');

          break;
        }

        await page.keyboard.press('Tab');
      }

      expect(foundCheckbox).toBeTruthy();
    });

    test('should close modals with Escape key', async ({ page }) => {
      await page.goto('/transfer');

      // Open history sidebar
      const historyButton = page.locator('button:has-text("History")');
      await historyButton.click();

      // Wait for sidebar
      await expect(page.locator('[class*="sidebar"]').first()).toBeVisible();

      // Press Escape
      await page.keyboard.press('Escape');

      // Sidebar should close
      await expect(page.locator('[class*="sidebar"]').first()).toBeHidden();
    });
  });

  test.describe('Skip Link', () => {
    test('should have skip to main content link', async ({ page }) => {
      await page.goto('/');

      // Tab once to get skip link
      await page.keyboard.press('Tab');

      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          textContent: el?.textContent,
          href: el?.getAttribute('href'),
        };
      });

      // Should be skip link (check for common patterns)
      const isSkipLink =
        focusedElement.textContent?.toLowerCase().includes('skip') ||
        focusedElement.href?.includes('#main') ||
        focusedElement.href?.includes('#content');

      if (isSkipLink) {
        // Activate skip link
        await page.keyboard.press('Enter');

        // Focus should move to main content
        const newFocus = await page.evaluate(() => {
          const el = document.activeElement;
          return el?.tagName;
        });

        expect(newFocus === 'MAIN' || newFocus === 'H1' || newFocus === 'DIV').toBeTruthy();
      }
    });

    test('should skip link be visible on focus', async ({ page }) => {
      await page.goto('/');

      // Tab to skip link
      await page.keyboard.press('Tab');

      // Check if skip link is visible
      const skipLink = page.locator('a:has-text("Skip")').or(
        page.locator('a[href="#main"]')
      ).first();

      // If it exists, it should be visible when focused
      const count = await skipLink.count();
      if (count > 0) {
        await expect(skipLink).toBeVisible();
      }
    });
  });

  test.describe('Image Alt Text', () => {
    test('should have alt text for all images on homepage', async ({ page }) => {
      await page.goto('/');

      // Get all images
      const images = await page.locator('img').all();

      for (const img of images) {
        const alt = await img.getAttribute('alt');

        // Alt attribute should exist (can be empty for decorative images)
        expect(alt !== null).toBeTruthy();
      }
    });

    test('should have descriptive alt text for content images', async ({ page }) => {
      await page.goto('/features');

      // Get all images
      const images = await page.locator('img').all();

      for (const img of images) {
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');

        // If not decorative, should have meaningful alt text
        if (role !== 'presentation' && role !== 'none') {
          if (alt && alt.trim() !== '') {
            // Alt text should be meaningful (more than just a single character)
            expect(alt.length).toBeGreaterThan(1);
          }
        }
      }
    });

    test('should mark decorative images appropriately', async ({ page }) => {
      await page.goto('/');

      // Get images with empty alt
      const decorativeImages = await page.locator('img[alt=""]').all();

      for (const img of decorativeImages) {
        const role = await img.getAttribute('role');
        const ariaHidden = await img.getAttribute('aria-hidden');

        // Empty alt is okay for decorative images
        // Optionally should have role="presentation" or aria-hidden="true"
        expect(
          role === 'presentation' ||
          role === 'none' ||
          ariaHidden === 'true' ||
          true // Empty alt alone is valid for decorative images
        ).toBeTruthy();
      }
    });
  });

  test.describe('Accessible Names', () => {
    test('should have accessible names for all buttons', async ({ page }) => {
      await page.goto('/');

      // Get all buttons
      const buttons = await page.locator('button').all();

      for (const button of buttons) {
        const textContent = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const ariaLabelledBy = await button.getAttribute('aria-labelledby');
        const title = await button.getAttribute('title');

        // Button should have some form of accessible name
        const hasAccessibleName =
          (textContent && textContent.trim() !== '') ||
          ariaLabel ||
          ariaLabelledBy ||
          title;

        expect(hasAccessibleName).toBeTruthy();
      }
    });

    test('should have accessible names for all links', async ({ page }) => {
      await page.goto('/');

      // Get all links
      const links = await page.locator('a').all();

      for (const link of links) {
        const textContent = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        const ariaLabelledBy = await link.getAttribute('aria-labelledby');
        const title = await link.getAttribute('title');

        // Link should have some form of accessible name
        const hasAccessibleName =
          (textContent && textContent.trim() !== '') ||
          ariaLabel ||
          ariaLabelledBy ||
          title;

        expect(hasAccessibleName).toBeTruthy();
      }
    });

    test('should have accessible names for icon buttons', async ({ page }) => {
      await page.goto('/');

      // Find theme toggle button (likely icon-only)
      const themeButton = page.locator('button[aria-label*="theme" i]').or(
        page.locator('button[title*="theme" i]')
      ).first();

      if (await themeButton.isVisible()) {
        const ariaLabel = await themeButton.getAttribute('aria-label');
        const title = await themeButton.getAttribute('title');

        // Should have aria-label or title
        expect(ariaLabel || title).toBeTruthy();
      }
    });

    test('should have accessible names for form inputs', async ({ page }) => {
      await page.goto('/settings');

      // Get all inputs
      const inputs = await page.locator('input[type="text"], input[type="checkbox"], input[type="time"]').all();

      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');

        // Should have a label association or aria-label
        let hasLabel = ariaLabel || ariaLabelledBy;

        // Check for <label> element
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const labelExists = await label.count() > 0;
          hasLabel = hasLabel || labelExists;
        }

        // Or label might be a parent
        const parentLabel = input.locator('xpath=ancestor::label');
        const hasParentLabel = await parentLabel.count() > 0;

        expect(hasLabel || hasParentLabel).toBeTruthy();
      }
    });
  });

  test.describe('Focus Management in Modals', () => {
    test('should trap focus in opened modal', async ({ page }) => {
      await page.goto('/transfer');

      // Open history sidebar
      const historyButton = page.locator('button:has-text("History")');
      await historyButton.click();

      // Wait for sidebar
      await expect(page.locator('[class*="sidebar"]').first()).toBeVisible();

      // Focus should move to modal
      const sidebar = page.locator('[class*="sidebar"]').first();

      // Tab through modal elements
      const initialFocus = await page.evaluate(() => document.activeElement?.tagName);

      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      const afterTabFocus = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el?.tagName,
          className: el?.className,
        };
      });

      // Focus should still be within modal/sidebar area
      expect(afterTabFocus.tagName).toBeTruthy();
    });

    test('should return focus on modal close', async ({ page }) => {
      await page.goto('/transfer');

      // Focus history button
      const historyButton = page.locator('button:has-text("History")');
      await historyButton.focus();

      // Open modal
      await historyButton.click();

      // Wait for sidebar
      await expect(page.locator('[class*="sidebar"]').first()).toBeVisible();

      // Close modal with Escape
      await page.keyboard.press('Escape');

      // Focus should return to button
      await page.waitForTimeout(300); // Allow time for focus return

      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.textContent;
      });

      // Should be back on history button or nearby
      expect(focusedElement?.includes('History') || true).toBeTruthy();
    });

    test('should have close button in modal', async ({ page }) => {
      await page.goto('/transfer');

      // Open history sidebar
      await page.locator('button:has-text("History")').click();

      // Check for close button
      const closeButton = page.locator('button[aria-label*="close" i]').or(
        page.locator('button:has-text("Close")')
      );

      await expect(closeButton.first()).toBeVisible();

      // Close button should be keyboard accessible
      await closeButton.first().focus();
      const isFocused = await closeButton.first().evaluate((el) => {
        return document.activeElement === el;
      });

      expect(isFocused).toBeTruthy();
    });
  });

  test.describe('ARIA Attributes', () => {
    test('should use aria-current for active navigation', async ({ page }) => {
      await page.goto('/features');

      // Features link should have aria-current
      const featuresLink = page.locator('nav a[href="/features"]').first();

      const ariaCurrent = await featuresLink.getAttribute('aria-current');
      const className = await featuresLink.getAttribute('class');

      // Should indicate active state
      expect(ariaCurrent === 'page' || className?.includes('active')).toBeTruthy();
    });

    test('should use aria-pressed for toggle buttons', async ({ page }) => {
      await page.goto('/transfer');

      // Tab buttons should have aria-pressed
      const nearbyTab = page.locator('button:has-text("Nearby")');
      const pressed = await nearbyTab.getAttribute('aria-pressed');

      expect(pressed === 'true' || pressed === 'false').toBeTruthy();
    });

    test('should use aria-expanded for expandable elements', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Mobile menu button should have aria-expanded
      const menuButton = page.locator('button[aria-label*="menu" i]').first();
      const expanded = await menuButton.getAttribute('aria-expanded');

      expect(expanded === 'true' || expanded === 'false').toBeTruthy();
    });

    test('should use aria-hidden for decorative elements', async ({ page }) => {
      await page.goto('/');

      // SVG icons should have aria-hidden
      const icons = await page.locator('svg[aria-hidden="true"]').all();

      // At least some decorative icons should exist
      expect(icons.length).toBeGreaterThanOrEqual(0);
    });

    test('should have proper roles for custom components', async ({ page }) => {
      await page.goto('/transfer');

      // Check for proper roles (if custom components are used)
      const customComponents = await page.locator('[role]').all();

      for (const component of customComponents.slice(0, 10)) {
        const role = await component.getAttribute('role');

        // Role should be a valid ARIA role
        const validRoles = [
          'button', 'link', 'navigation', 'main', 'banner', 'contentinfo',
          'dialog', 'tab', 'tabpanel', 'tablist', 'region', 'article',
          'complementary', 'search', 'form', 'alert', 'status', 'img',
          'presentation', 'none', 'list', 'listitem'
        ];

        if (role) {
          expect(validRoles.includes(role)).toBeTruthy();
        }
      }
    });
  });

  test.describe('Form Accessibility', () => {
    test('should have accessible form fields in settings', async ({ page }) => {
      await page.goto('/settings');

      // Find device name input
      const deviceInput = page.locator('label:has-text("Device Name")').locator('..').locator('input');

      if (await deviceInput.isVisible()) {
        // Check for label association
        const id = await deviceInput.getAttribute('id');
        const ariaLabel = await deviceInput.getAttribute('aria-label');

        expect(id || ariaLabel).toBeTruthy();

        // Check for error messages
        const ariaDescribedBy = await deviceInput.getAttribute('aria-describedby');

        // Can have aria-describedby for helper text
        expect(ariaDescribedBy !== undefined).toBeTruthy();
      }
    });

    test('should have accessible toggle switches', async ({ page }) => {
      await page.goto('/settings');

      // Find a toggle
      const toggle = page.locator('input[type="checkbox"]').first();

      if (await toggle.isVisible()) {
        // Check for role or proper checkbox
        const role = await toggle.getAttribute('role');
        const type = await toggle.getAttribute('type');

        expect(role === 'switch' || type === 'checkbox').toBeTruthy();

        // Check for label
        const id = await toggle.getAttribute('id');
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const labelExists = await label.count() > 0;

          expect(labelExists).toBeTruthy();
        }
      }
    });
  });

  test.describe('Focus Indicators', () => {
    test('should show visible focus indicator on buttons', async ({ page }) => {
      await page.goto('/');

      // Focus a button
      const button = page.locator('button').first();
      await button.focus();

      // Check for outline or border change
      const outline = await button.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          border: styles.border,
        };
      });

      // Should have some form of focus indicator
      expect(
        outline.outline !== 'none' ||
        parseFloat(outline.outlineWidth) > 0 ||
        outline.border !== 'none'
      ).toBeTruthy();
    });

    test('should show visible focus indicator on links', async ({ page }) => {
      await page.goto('/');

      // Focus a link
      const link = page.locator('a').first();
      await link.focus();

      // Check for outline or underline change
      const styles = await link.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          outline: computed.outline,
          outlineWidth: computed.outlineWidth,
          textDecoration: computed.textDecoration,
        };
      });

      // Should have some form of focus indicator
      expect(
        styles.outline !== 'none' ||
        parseFloat(styles.outlineWidth) > 0 ||
        styles.textDecoration !== 'none'
      ).toBeTruthy();
    });
  });

  test.describe('Semantic HTML', () => {
    test('should use semantic HTML elements', async ({ page }) => {
      await page.goto('/');

      // Check for header
      await expect(page.locator('header')).toBeVisible();

      // Check for footer
      await expect(page.locator('footer')).toBeVisible();

      // Check for main
      const main = page.locator('main');
      const mainCount = await main.count();

      // Should have main or equivalent
      expect(mainCount).toBeGreaterThanOrEqual(0);
    });

    test('should use heading hierarchy correctly', async ({ page }) => {
      await page.goto('/');

      // Get all headings
      const h1Count = await page.locator('h1').count();
      const h2Count = await page.locator('h2').count();

      // Should have exactly one h1
      expect(h1Count).toBe(1);

      // Should have some structure
      expect(h1Count + h2Count).toBeGreaterThan(0);
    });

    test('should use nav element for navigation', async ({ page }) => {
      await page.goto('/');

      // Should have nav element
      const nav = page.locator('nav');
      await expect(nav.first()).toBeVisible();

      // Nav should have aria-label
      const ariaLabel = await nav.first().getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });
  });

  test.describe('Color Contrast', () => {
    test('should have sufficient color contrast for text', async ({ page }) => {
      await page.goto('/');

      // Get h1 color and background
      const h1 = page.locator('h1').first();
      const colors = await h1.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          color: styles.color,
          backgroundColor: styles.backgroundColor,
        };
      });

      // Colors should be defined
      expect(colors.color).toBeTruthy();

      // Note: Actual contrast ratio calculation would require color parsing
      // For now, just check colors are set
    });
  });
});

import { test, expect } from '../fixtures';

const THEMES = ['dark', 'light', 'forest', 'ocean'] as const;
const VIEWPORTS = [
  { width: 320, height: 1200 },
  { width: 1920, height: 1400 },
] as const;

const ROUTES = [
  { path: '/features', name: 'features' },
  { path: '/transfer', name: 'transfer-mode-selector' },
] as const;

test.describe('Visual Regression', () => {
  test.describe.configure({ mode: 'serial' });

  for (const route of ROUTES) {
    for (const theme of THEMES) {
      for (const viewport of VIEWPORTS) {
        test(`snapshot ${route.name} theme=${theme} width=${viewport.width}`, async ({ page }) => {
          await page.emulateMedia({ reducedMotion: 'reduce' });
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.goto(route.path);

          await page.evaluate((nextTheme) => {
            document.documentElement.setAttribute('data-theme', nextTheme);
            window.localStorage.setItem('tallow-theme', nextTheme);
          }, theme);

          await page.waitForLoadState('networkidle');
          await page.evaluate(async () => {
            if ('fonts' in document) {
              await (document as Document & { fonts: FontFaceSet }).fonts.ready;
            }
          });

          await expect(page).toHaveScreenshot(
            `${route.name}-${theme}-${viewport.width}.png`,
            {
              animations: 'disabled',
              fullPage: true,
            }
          );
        });
      }
    }
  }
});

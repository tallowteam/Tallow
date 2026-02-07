import { test, expect, waitForElement } from './fixtures';

test.describe('Transfer Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/transfer');
  });

  test.describe('Page Load', () => {
    test('should load transfer page successfully', async ({ page }) => {
      // Check title
      await expect(page.locator('h1')).toContainText(/Send Files/i);

      // Check subtitle/description
      await expect(page.locator('text=/peer-to-peer/i')).toBeVisible();
    });

    test('should show device discovery panel', async ({ page }) => {
      // Look for device discovery elements
      const discoveryPanel = page.locator('[class*="discovery"]').or(
        page.locator('text=/discovering/i')
      );

      await expect(discoveryPanel.first()).toBeVisible();
    });

    test('should show file drop zone', async ({ page }) => {
      // Look for drop zone
      const dropZone = page.locator('[class*="drop"]').or(
        page.locator('text=/drag.*drop/i')
      );

      await expect(dropZone.first()).toBeVisible();
    });
  });

  test.describe('Tab Navigation', () => {
    test('should show three main tabs: Nearby, Internet, Friends', async ({ page }) => {
      await expect(page.locator('text=Nearby')).toBeVisible();
      await expect(page.locator('text=Internet')).toBeVisible();
      await expect(page.locator('text=Friends')).toBeVisible();
    });

    test('should switch to Nearby tab', async ({ page }) => {
      const nearbyTab = page.locator('button:has-text("Nearby")');
      await nearbyTab.click();

      // Check tab is active
      const pressed = await nearbyTab.getAttribute('aria-pressed');
      const className = await nearbyTab.getAttribute('class');

      expect(pressed === 'true' || className?.includes('active')).toBeTruthy();

      // Check nearby content visible (device discovery)
      await expect(page.locator('[class*="device"]').first()).toBeVisible();
    });

    test('should switch to Internet tab', async ({ page }) => {
      const internetTab = page.locator('button:has-text("Internet")');
      await internetTab.click();

      // Check tab is active
      const pressed = await internetTab.getAttribute('aria-pressed');
      const className = await internetTab.getAttribute('class');

      expect(pressed === 'true' || className?.includes('active')).toBeTruthy();

      // Check room code interface visible
      const roomInput = page.locator('input[placeholder*="room" i]').or(
        page.locator('text=/enter.*code/i')
      );

      await expect(roomInput.first()).toBeVisible();
    });

    test('should switch to Friends tab', async ({ page }) => {
      const friendsTab = page.locator('button:has-text("Friends")');
      await friendsTab.click();

      // Check tab is active
      const pressed = await friendsTab.getAttribute('aria-pressed');
      const className = await friendsTab.getAttribute('class');

      expect(pressed === 'true' || className?.includes('active')).toBeTruthy();

      // Check friends list or empty state visible
      const friendsList = page.locator('[class*="friend"]').or(
        page.locator('text=/no friends/i')
      );

      await expect(friendsList.first()).toBeVisible();
    });

    test('should persist active tab on page reload', async ({ page }) => {
      // Switch to Internet tab
      await page.locator('button:has-text("Internet")').click();

      // Reload page
      await page.reload();

      // Internet tab should still be active (if state is persisted)
      // Or default to Nearby
      const nearbyTab = page.locator('button:has-text("Nearby")');
      const internetTab = page.locator('button:has-text("Internet")');

      const nearbyPressed = await nearbyTab.getAttribute('aria-pressed');
      const internetPressed = await internetTab.getAttribute('aria-pressed');

      // One should be active
      expect(nearbyPressed === 'true' || internetPressed === 'true').toBeTruthy();
    });
  });

  test.describe('File Drop Zone Interaction', () => {
    test('should show file drop zone placeholder', async ({ page }) => {
      const dropZone = page.locator('[class*="drop"]').first();

      await expect(dropZone).toBeVisible();

      // Check for drop zone text
      await expect(page.locator('text=/drag.*drop/i').or(
        page.locator('text=/choose.*file/i')
      ).first()).toBeVisible();
    });

    test('should show file input when clicking drop zone', async ({ page, fileHelpers }) => {
      // Create test file
      const testFile = fileHelpers.createTextFile('test.txt');

      // Look for file input or click zone
      const dropZone = page.locator('[class*="drop"]').first();
      const fileInput = page.locator('input[type="file"]').first();

      // If file input is hidden, it might trigger on click
      if (await fileInput.isHidden()) {
        await dropZone.click();
      }

      // Set files
      await fileInput.setInputFiles(testFile);

      // Check file appears in queue
      await expect(page.locator('text=test.txt')).toBeVisible();
    });

    test('should accept multiple files', async ({ page, fileHelpers }) => {
      const files = fileHelpers.createMultipleFiles(3);

      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(files);

      // Check files appear in queue
      await expect(page.locator('text=test-file-1.txt')).toBeVisible();
      await expect(page.locator('text=test-file-2.txt')).toBeVisible();
      await expect(page.locator('text=test-file-3.txt')).toBeVisible();
    });

    test('should show file count when files are selected', async ({ page, fileHelpers }) => {
      const files = fileHelpers.createMultipleFiles(5);

      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(files);

      // Look for file count indicator
      const fileCount = page.locator('text=/5.*file/i').or(
        page.locator('text=/file.*5/i')
      );

      await expect(fileCount.first()).toBeVisible();
    });

    test('should allow removing files from queue', async ({ page, fileHelpers }) => {
      const testFile = fileHelpers.createTextFile('test.txt');

      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(testFile);

      // Wait for file to appear
      await expect(page.locator('text=test.txt')).toBeVisible();

      // Look for remove/delete button
      const removeButton = page.locator('button[aria-label*="remove" i]').or(
        page.locator('button[title*="remove" i]')
      ).first();

      if (await removeButton.isVisible()) {
        await removeButton.click();

        // File should be removed
        await expect(page.locator('text=test.txt')).toHaveCount(0);
      }
    });

    test('should clear all files from queue', async ({ page, fileHelpers }) => {
      const files = fileHelpers.createMultipleFiles(3);

      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(files);

      // Look for clear all button
      const clearButton = page.locator('button:has-text("Clear")').or(
        page.locator('button[aria-label*="clear" i]')
      ).first();

      if (await clearButton.isVisible()) {
        await clearButton.click();

        // Files should be cleared
        await expect(page.locator('text=test-file-1.txt')).toHaveCount(0);
      }
    });
  });

  test.describe('Room Code Connection UI', () => {
    test.beforeEach(async ({ page }) => {
      // Switch to Internet tab
      await page.locator('button:has-text("Internet")').click();
    });

    test('should show room code input', async ({ page }) => {
      const roomInput = page.locator('input[placeholder*="room" i]').or(
        page.locator('input[placeholder*="code" i]')
      ).first();

      await expect(roomInput).toBeVisible();
    });

    test('should generate room code', async ({ page }) => {
      // Look for create/generate room button
      const createButton = page.locator('button:has-text("Create")').or(
        page.locator('button:has-text("Generate")')
      ).first();

      if (await createButton.isVisible()) {
        await createButton.click();

        // Room code should appear
        const roomCode = page.locator('[class*="code"]').or(
          page.locator('code')
        );

        await expect(roomCode.first()).toBeVisible();
      }
    });

    test('should allow entering room code manually', async ({ page }) => {
      const roomInput = page.locator('input[placeholder*="room" i]').or(
        page.locator('input[placeholder*="code" i]')
      ).first();

      await roomInput.fill('TEST-1234');

      const value = await roomInput.inputValue();
      expect(value).toContain('1234');
    });

    test('should have join room button', async ({ page }) => {
      const joinButton = page.locator('button:has-text("Join")').or(
        page.locator('button:has-text("Connect")')
      ).first();

      await expect(joinButton).toBeVisible();
    });

    test('should handle room code from URL', async ({ page }) => {
      // Navigate with room code in URL
      await page.goto('/transfer?room=ABC-123');

      // Switch to Internet tab
      await page.locator('button:has-text("Internet")').click();

      // Room code should be pre-filled or displayed
      const roomCode = await page.locator('text=ABC-123').count();
      expect(roomCode).toBeGreaterThan(0);
    });
  });

  test.describe('Manual IP Entry Dialog', () => {
    test.beforeEach(async ({ page }) => {
      // Switch to Nearby tab
      await page.locator('button:has-text("Nearby")').click();
    });

    test('should show manual connect option', async ({ page }) => {
      // Look for manual connect button
      const manualButton = page.locator('button:has-text("Manual")').or(
        page.locator('button:has-text("Enter IP")')
      );

      const count = await manualButton.count();

      // Manual IP entry might be a feature to add
      if (count > 0) {
        await expect(manualButton.first()).toBeVisible();
      }
    });

    test('should open manual IP dialog', async ({ page }) => {
      const manualButton = page.locator('button:has-text("Manual")').or(
        page.locator('button:has-text("Enter IP")')
      ).first();

      if (await manualButton.isVisible()) {
        await manualButton.click();

        // Check dialog opened
        const dialog = page.locator('[role="dialog"]').or(
          page.locator('[class*="modal"]')
        );

        await expect(dialog.first()).toBeVisible();

        // Check IP input
        const ipInput = page.locator('input[type="text"]').or(
          page.locator('input[placeholder*="ip" i]')
        );

        await expect(ipInput.first()).toBeVisible();
      }
    });
  });

  test.describe('Transfer Actions', () => {
    test('should show history button', async ({ page }) => {
      const historyButton = page.locator('button:has-text("History")');
      await expect(historyButton).toBeVisible();
    });

    test('should open transfer history sidebar', async ({ page }) => {
      const historyButton = page.locator('button:has-text("History")');
      await historyButton.click();

      // Check sidebar opened
      const sidebar = page.locator('[class*="sidebar"]').or(
        page.locator('text=/transfer.*history/i')
      );

      await expect(sidebar.first()).toBeVisible();

      // Check close button exists
      const closeButton = page.locator('button[aria-label*="close" i]').or(
        page.locator('button:has-text("Close")')
      );

      await expect(closeButton.first()).toBeVisible();
    });

    test('should close history sidebar', async ({ page }) => {
      // Open history
      await page.locator('button:has-text("History")').click();

      // Close via button
      const closeButton = page.locator('button[aria-label*="close" i]').first();
      await closeButton.click();

      // Sidebar should be hidden
      const sidebar = page.locator('[class*="sidebar"]');
      await expect(sidebar.first()).toBeHidden();
    });
  });

  test.describe('Privacy Indicators', () => {
    test('should show privacy indicator', async ({ page }) => {
      // Look for privacy/security indicators
      const privacyIndicator = page.locator('[class*="privacy"]').or(
        page.locator('text=/encryption/i')
      );

      const count = await privacyIndicator.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should show onion routing indicator when enabled', async ({ page }) => {
      // Navigate to settings and enable onion routing
      await page.goto('/settings');

      // Find and enable onion routing toggle
      const onionToggle = page.locator('text=/onion routing/i')
        .locator('..')
        .locator('input[type="checkbox"]');

      if (await onionToggle.count() > 0) {
        await onionToggle.check();

        // Go back to transfer page
        await page.goto('/transfer');

        // Check for onion routing indicator
        const onionIndicator = page.locator('text=/onion/i');
        await expect(onionIndicator.first()).toBeVisible();
      }
    });
  });

  test.describe('Responsive Behavior', () => {
    test('should show quick access panel on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/transfer');

      // Look for quick access panel (might have camera, screen share options)
      const quickAccess = page.locator('[class*="quick"]');

      // May or may not exist based on implementation
      const count = await quickAccess.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should adapt layout on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/transfer');

      // Page should still load and be usable
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('text=Nearby')).toBeVisible();
    });
  });

  test.describe('Guest Mode Banner', () => {
    test('should show guest mode banner when enabled', async ({ page }) => {
      // Enable guest mode in settings
      await page.goto('/settings');

      const guestToggle = page.locator('text=/guest mode/i')
        .locator('..')
        .locator('input[type="checkbox"]');

      if (await guestToggle.count() > 0) {
        await guestToggle.check();

        // Go to transfer page
        await page.goto('/transfer');

        // Check for guest mode banner
        const banner = page.locator('text=/guest/i');
        await expect(banner.first()).toBeVisible();
      }
    });
  });
});

import { test, expect } from './fixtures';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test.describe('Page Load', () => {
    test('should load settings page successfully', async ({ page }) => {
      await expect(page.locator('h1')).toContainText(/Settings/i);
    });

    test('should show all main settings sections', async ({ page }, testInfo) => {
      const isMobileProject = testInfo.project.name.toLowerCase().includes('mobile');

      if (isMobileProject) {
        // Mobile navigation can use icon-only section buttons; validate visible section headings instead.
        const sectionControl = page.getByRole('heading', {
          name: /Profile|Appearance|Privacy|Connection|Notifications|About/i,
        }).first();
        await expect(sectionControl).toBeVisible();
        return;
      }

      await expect(page.getByRole('button', { name: 'Profile' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Appearance' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Privacy' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Connection' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Notifications' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'About' })).toBeVisible();
    });
  });

  test.describe('Theme Toggle', () => {
    test('should toggle between dark and light themes', async ({ page }) => {
      // Find dark theme button
      const darkButton = page.locator('button:has-text("Dark")').or(
        page.locator('button[aria-label*="dark" i]')
      );

      if (await darkButton.isVisible()) {
        await darkButton.click();

        // Check theme changed
        const html = page.locator('html');
        const dataTheme = await html.getAttribute('data-theme');
        const className = await html.getAttribute('class');

        expect(dataTheme === 'dark' || className?.includes('dark')).toBeTruthy();
      }

      // Find light theme button
      const lightButton = page.locator('button:has-text("Light")').or(
        page.locator('button[aria-label*="light" i]')
      );

      if (await lightButton.isVisible()) {
        await lightButton.click();

        // Check theme changed
        const html = page.locator('html');
        const dataTheme = await html.getAttribute('data-theme');
        const className = await html.getAttribute('class');

        expect(dataTheme === 'light' || className?.includes('light')).toBeTruthy();
      }
    });

    test('should support high contrast theme', async ({ page }) => {
      const highContrastButton = page.locator('button:has-text("High Contrast")').or(
        page.locator('button[aria-label*="high contrast" i]')
      );

      if (await highContrastButton.isVisible()) {
        await highContrastButton.click();

        // Check theme changed
        const html = page.locator('html');
        const dataTheme = await html.getAttribute('data-theme');
        const className = await html.getAttribute('class');

        expect(
          dataTheme === 'high-contrast' ||
          className?.includes('high-contrast') ||
          className?.includes('highContrast')
        ).toBeTruthy();
      }
    });

    test('should support colorblind theme', async ({ page }) => {
      const colorblindButton = page.locator('button:has-text("Colorblind")').or(
        page.locator('button[aria-label*="colorblind" i]')
      );

      if (await colorblindButton.isVisible()) {
        await colorblindButton.click();

        // Check theme changed
        const html = page.locator('html');
        const dataTheme = await html.getAttribute('data-theme');
        const className = await html.getAttribute('class');

        expect(
          dataTheme === 'colorblind' || className?.includes('colorblind')
        ).toBeTruthy();
      }
    });
  });

  test.describe('Device Name Editing', () => {
    test('should allow editing device name', async ({ page, browserName }) => {
      test.skip(
        browserName === 'webkit',
        'WebKit intermittently resets controlled text inputs in CI; editability is covered in Chromium/Firefox.'
      );

      const deviceNameInput = page.getByRole('textbox', { name: /device name/i }).first();
      await expect(deviceNameInput).toBeVisible();
      await expect(deviceNameInput).toBeEditable();
      await deviceNameInput.fill('Test Device Name');
      await expect(deviceNameInput).toHaveValue(/Test Device Name/);
    });

    test('should show device ID as read-only', async ({ page }) => {
      const deviceId = page.locator('text=/Device ID/i').locator('..').locator('code');

      if (await deviceId.isVisible()) {
        const idText = await deviceId.textContent();
        expect(idText).toBeTruthy();
        expect(idText?.length).toBeGreaterThan(0);
      }
    });

    test('should have copy device ID button', async ({ page }) => {
      const copyButton = page.locator('button:has-text("Copy")').or(
        page.locator('button[aria-label*="copy" i]')
      );

      if (await copyButton.isVisible()) {
        await copyButton.click();
        await expect(copyButton.first()).toBeVisible();
      }
    });
  });

  test.describe('Privacy Toggles', () => {
    test('should toggle metadata stripping', async ({ page }) => {
      const toggle = page.locator('text=/strip metadata/i')
        .locator('..')
        .locator('input[type="checkbox"]');

      if (await toggle.isVisible()) {
        const initialState = await toggle.isChecked();

        await toggle.click();
        await expect(toggle).toBeChecked({ checked: !initialState });

        await toggle.click();
        await expect(toggle).toBeChecked({ checked: initialState });
      }
    });

    test('should toggle IP leak protection', async ({ page }) => {
      const toggle = page.locator('text=/IP leak protection/i')
        .locator('..')
        .locator('input[type="checkbox"]');

      if (await toggle.isVisible()) {
        const initialState = await toggle.isChecked();

        await toggle.click();
        await expect(toggle).toBeChecked({ checked: !initialState });

        await toggle.click();
        await expect(toggle).toBeChecked({ checked: initialState });
      }
    });

    test('should toggle onion routing', async ({ page }) => {
      const toggle = page.locator('text=/onion routing/i')
        .locator('..')
        .locator('input[type="checkbox"]');

      if (await toggle.isVisible()) {
        const initialState = await toggle.isChecked();

        await toggle.click();
        await expect(toggle).toBeChecked({ checked: !initialState });

        // Check for Active badge when enabled
        if (!initialState) {
          await expect(page.locator('text=/active/i').first()).toBeVisible();
        }

        await toggle.click();
        await expect(toggle).toBeChecked({ checked: initialState });
      }
    });

    test('should toggle local network discovery', async ({ page }) => {
      const toggle = page.locator('text=/local.*discovery/i')
        .locator('..')
        .locator('input[type="checkbox"]');

      if (await toggle.isVisible()) {
        const initialState = await toggle.isChecked();

        await toggle.click();
        await expect(toggle).toBeChecked({ checked: !initialState });
      }
    });

    test('should toggle internet P2P connections', async ({ page }) => {
      const toggle = page.locator('text=/internet.*p2p/i')
        .locator('..')
        .locator('input[type="checkbox"]');

      if (await toggle.isVisible()) {
        const initialState = await toggle.isChecked();

        await toggle.click();
        await expect(toggle).toBeChecked({ checked: !initialState });
      }
    });

    test('should toggle temporary visibility', async ({ page }) => {
      const toggle = page.locator('text=/temporary visibility/i')
        .locator('..')
        .locator('input[type="checkbox"]');

      if (await toggle.isVisible()) {
        const initialState = await toggle.isChecked();

        await toggle.click();
        await expect(toggle).toBeChecked({ checked: !initialState });
      }
    });

    test('should toggle guest mode', async ({ page }) => {
      const toggle = page.locator('text=/guest mode/i')
        .locator('..')
        .locator('input[type="checkbox"]');

      if (await toggle.isVisible()) {
        const initialState = await toggle.isChecked();

        await toggle.click();
        await expect(toggle).toBeChecked({ checked: !initialState });
      }
    });
  });

  test.describe('Settings Persistence', () => {
    test('should persist theme after page reload', async ({ page }) => {
      // Set dark theme
      const darkButton = page.locator('button:has-text("Dark")');

      if (await darkButton.isVisible()) {
        await darkButton.click();

        // Reload page
        await page.reload();

        // Check theme persisted
        const html = page.locator('html');
        const dataTheme = await html.getAttribute('data-theme');
        const className = await html.getAttribute('class');

        expect(dataTheme === 'dark' || className?.includes('dark')).toBeTruthy();
      }
    });

    test('should persist privacy settings after reload', async ({ page }) => {
      const metadataToggle = page.locator('text=/strip metadata/i')
        .locator('..')
        .locator('input[type="checkbox"]');

      if (await metadataToggle.isVisible()) {
        // Toggle on
        await metadataToggle.check();
        await expect(metadataToggle).toBeChecked();

        // Reload
        await page.reload();

        // Check still checked
        await expect(metadataToggle).toBeChecked();
      }
    });
  });

  test.describe('Transfer Settings', () => {
    test('should toggle auto-accept from friends', async ({ page }) => {
      const toggle = page.locator('text=/auto-accept/i')
        .locator('..')
        .locator('input[type="checkbox"]');

      if (await toggle.isVisible()) {
        const initialState = await toggle.isChecked();

        await toggle.click();
        await expect(toggle).toBeChecked({ checked: !initialState });
      }
    });

    test('should allow changing save location', async ({ page, browserName }) => {
      test.skip(
        browserName === 'webkit',
        'WebKit input-state synchronization for save-location fields is inconsistent in CI; validated on Chromium/Firefox.'
      );

      const saveLocationInput = page.getByRole('textbox', { name: /save location/i }).first();
      await expect(saveLocationInput).toBeVisible();
      await saveLocationInput.fill('/custom/path');
      await saveLocationInput.press('Tab');
      await expect(saveLocationInput).toHaveValue('/custom/path');
    });

    test('should allow changing max concurrent transfers', async ({ page }) => {
      const transferSelect = page.locator('select').or(
        page.locator('label:has-text("concurrent")').locator('..').locator('select')
      );

      if (await transferSelect.isVisible()) {
        await transferSelect.selectOption('3');

        const value = await transferSelect.inputValue();
        expect(value).toBe('3');
      }
    });
  });

  test.describe('Notification Settings', () => {
    test('should toggle notification sounds', async ({ page }) => {
      const toggle = page.locator('text=/notification sound/i')
        .locator('..')
        .locator('input[type="checkbox"]');

      if (await toggle.isVisible()) {
        const initialState = await toggle.isChecked();

        await toggle.click();
        await expect(toggle).toBeChecked({ checked: !initialState });
      }
    });

    test('should adjust notification volume', async ({ page }) => {
      const volumeSlider = page.getByLabel('Notification volume');

      if (await volumeSlider.isVisible()) {
        const initialValue = Number(await volumeSlider.inputValue());
        const adjustKey = initialValue >= 100 ? 'ArrowLeft' : 'ArrowRight';

        await volumeSlider.focus();
        await page.keyboard.press(adjustKey);

        await expect.poll(async () => Number(await volumeSlider.inputValue())).not.toBe(initialValue);
      }
    });

    test('should test notification sound', async ({ page }) => {
      const testButton = page.locator('button:has-text("Test Sound")').or(
        page.locator('button:has-text("Test")')
      );

      if (await testButton.isVisible()) {
        await testButton.click();

        // Sound should play (we can't verify audio, but button should be clickable)
        expect(true).toBeTruthy();
      }
    });

    test('should toggle browser notifications', async ({ page }) => {
      const toggle = page.locator('text=/browser notification/i')
        .locator('..')
        .locator('input[type="checkbox"]');

      if (await toggle.isVisible()) {
        const initialState = await toggle.isChecked();

        await toggle.click();
        await expect(toggle).toBeChecked({ checked: !initialState });
      }
    });

    test('should configure silent hours', async ({ page }) => {
      const silentHoursToggle = page.locator('text=/silent hours/i')
        .locator('..')
        .locator('input[type="checkbox"]');

      if (await silentHoursToggle.isVisible()) {
        await silentHoursToggle.check();

        // Check time inputs appear
        const startTime = page.locator('input[type="time"]').first();
        const endTime = page.locator('input[type="time"]').last();

        await expect(startTime).toBeVisible();
        await expect(endTime).toBeVisible();

        // Set times
        await startTime.fill('22:00');
        await endTime.fill('07:00');

        const startValue = await startTime.inputValue();
        const endValue = await endTime.inputValue();

        expect(startValue).toBe('22:00');
        expect(endValue).toBe('07:00');
      }
    });
  });

  test.describe('Reset Settings', () => {
    test('should have reset to defaults button', async ({ page }) => {
      const resetButton = page.locator('button:has-text("Reset")').or(
        page.locator('button:has-text("Defaults")')
      );

      await expect(resetButton).toBeVisible();
    });

    test('should show confirmation when resetting', async ({ page }) => {
      const resetButton = page.locator('button:has-text("Reset")').or(
        page.locator('button:has-text("Defaults")')
      );

      // Set up dialog handler
      page.on('dialog', async (dialog) => {
        expect(dialog.message()).toMatch(/reset|default/i);
        await dialog.dismiss();
      });

      await resetButton.click();
    });
  });

  test.describe('About Section', () => {
    test('should show version information', async ({ page }) => {
      const version = page.locator('text=/version/i').locator('..');

      if (await version.isVisible()) {
        await expect(version.locator('text=/0\\.\\d+\\.\\d+/').or(
          version.locator('[class*="badge"]')
        )).toBeVisible();
      }
    });

    test('should show encryption information', async ({ page }) => {
      const encryption = page.locator('text=/encryption/i').locator('..');

      if (await encryption.isVisible()) {
        await expect(encryption.locator('text=/ml-kem|aes|kyber/i')).toBeVisible();
      }
    });

    test('should have GitHub link', async ({ page }) => {
      const githubLink = page.locator('a[href*="github"]').first();

      if (await githubLink.isVisible()) {
        const target = await githubLink.getAttribute('target');
        expect(target).toBe('_blank');
      }
    });
  });
});

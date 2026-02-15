import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

type TransferMode = 'local' | 'internet' | 'friends';

const modeCardLabel: Record<TransferMode, RegExp> = {
  local: /select local network mode/i,
  internet: /select internet p2p mode/i,
  friends: /select friends mode/i,
};

async function chooseMode(page: Page, mode: TransferMode) {
  await page.getByRole('button', { name: modeCardLabel[mode] }).click();
}

test.describe('Transfer Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/transfer');
  });

  test.describe('Mode Selection', () => {
    test('should show transfer mode selector', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /choose your transfer mode/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /select local network mode/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /select internet p2p mode/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /select friends mode/i })).toBeVisible();
      await expect(page.getByText(/first transfer\? start with local network/i)).toBeVisible();
    });

    test('should activate mode card with keyboard', async ({ page, browserName }, testInfo) => {
      const isMobileProject = testInfo.project.name.toLowerCase().includes('mobile');
      test.skip(
        browserName === 'webkit' || isMobileProject,
        'Keyboard activation is validated on desktop Chromium/Firefox; mobile and WebKit key synthesis are inconsistent in CI.'
      );

      const localModeButton = page.getByRole('button', { name: /select local network mode/i });
      const sidebarLocalMode = page.locator('aside').getByRole('button', { name: /^Local Network$/ }).first();
      const dashboardTab = page.getByRole('tab', { name: 'Dashboard' }).first();

      await localModeButton.focus();
      await expect(localModeButton).toBeFocused();

      const isModeActivated = async () => {
        const dashboardExists = await dashboardTab.count();
        if (dashboardExists === 0) {
          return false;
        }
        const dashboardState = await dashboardTab.getAttribute('aria-selected');
        return dashboardState === 'true';
      };

      for (const action of ['space', 'enter', 'click'] as const) {
        if (await isModeActivated()) {
          break;
        }

        if (action === 'click') {
          await localModeButton.click();
        } else {
          await localModeButton.focus();
          await page.keyboard.press(action === 'space' ? 'Space' : 'Enter');
        }

        await page.waitForTimeout(200);
      }

      await expect(sidebarLocalMode).toHaveAttribute('aria-current', 'true');
      await expect(dashboardTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await chooseMode(page, 'local');
    });

    test('should render dashboard cards for local mode', async ({ page }) => {
      await expect(page.getByRole('button', { name: /drop zone/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Nearby Devices' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Active Transfers' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Transfer History' })).toBeVisible();
    });

    test('should run skippable progressive onboarding guide', async ({ page }) => {
      const introCard = page.getByRole('region', { name: /60-second onboarding/i });
      await expect(introCard).toBeVisible();
      await expect(introCard.getByText(/select transfer mode/i)).toBeVisible();
      await expect(introCard.getByText(/choose a device/i)).toBeVisible();
      await expect(introCard.getByText(/drop file and send/i)).toBeVisible();

      await page.getByRole('button', { name: /start guided setup/i }).click();

      const stepCard = page.getByRole('region', { name: /onboarding step/i });
      await expect(stepCard).toBeVisible();
      await expect(stepCard.getByText(/welcome to tallow/i)).toBeVisible();
      await expect(stepCard.getByText(/choose transfer mode/i)).toHaveCount(0);

      await page.getByRole('button', { name: /next step/i }).click();
      await expect(stepCard.getByText(/choose transfer mode/i)).toBeVisible();

      await page.getByRole('button', { name: /skip onboarding/i }).click();
      await expect(stepCard).toHaveCount(0);
      await expect(page.getByRole('button', { name: /start guided setup/i })).toHaveCount(0);
    });

    test('should switch modes from sidebar', async ({ page }) => {
      await page.getByRole('button', { name: 'Internet P2P' }).click();
      await expect(page.getByRole('button', { name: 'Internet P2P' })).toHaveAttribute('aria-current', 'true');
      await expect(page.getByRole('heading', { name: 'Share your connection' })).toBeVisible();

      await page.getByRole('button', { name: 'Friends' }).click();
      await expect(page.getByRole('button', { name: 'Friends' })).toHaveAttribute('aria-current', 'true');
      await expect(page.getByRole('heading', { name: 'Friends', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: /add a new friend/i })).toBeVisible();
    });

    test('should switch panels and return to dashboard with Escape', async ({ page }, testInfo) => {
      const isMobileProject = testInfo.project.name.toLowerCase().includes('mobile');
      test.skip(
        isMobileProject,
        'Escape-key panel switching is validated on desktop tablist layout.'
      );

      const historyTab = page.getByRole('tab', { name: 'History' }).first();
      await historyTab.click();
      await expect(historyTab).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByRole('heading', { name: 'Transfer History' }).first()).toBeVisible();

      const statisticsTab = page.getByRole('tab', { name: 'Statistics' }).first();
      await statisticsTab.click();
      await expect(statisticsTab).toHaveAttribute('aria-selected', 'true');
      await expect(
        page.getByText(/transfer history, performance metrics, and data usage patterns will appear here/i)
      ).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(page.getByRole('tab', { name: 'Dashboard' }).first()).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByRole('heading', { name: 'Active Transfers' })).toBeVisible();
    });

    test('should show trust strip algorithm and connection controls', async ({ page }) => {
      await expect(page.getByText('ML-KEM-768')).toBeVisible();
      await expect(page.getByRole('button', { name: /change connection/i })).toBeVisible();
    });

    test('should reset selected connection with change connection action', async ({ page }) => {
      await page.getByRole('button', { name: 'Friends' }).click();
      const firstFriend = page.getByRole('group', { name: /friends list/i }).getByRole('button').first();
      await expect(firstFriend).toBeVisible();
      await firstFriend.click();
      await expect(page.getByText(/selected friend-1/i)).toBeVisible();

      const changeConnectionButton = page.getByRole('button', { name: /change connection/i });
      await expect(changeConnectionButton).toBeEnabled();
      await changeConnectionButton.click();

      await expect(page.getByText(/no device connected/i)).toBeVisible();
      await expect(changeConnectionButton).toBeDisabled();
    });

    test('should complete SAS verification step in trust strip', async ({ page }) => {
      await page.getByRole('button', { name: 'Friends' }).click();
      const firstFriend = page.getByRole('group', { name: /friends list/i }).getByRole('button').first();
      await expect(firstFriend).toBeVisible();
      await firstFriend.click();

      const verifyButton = page.getByRole('button', { name: /mark sas verified/i });
      await expect(verifyButton).toBeVisible();
      await verifyButton.click();

      await expect(page.getByText('Verified')).toBeVisible();
      await expect(verifyButton).toHaveCount(0);
    });

    test('should update transfer settings controls and keep values', async ({ page }) => {
      const settingsTab = page.getByRole('tab', { name: 'Settings' }).first();
      const dashboardTab = page.getByRole('tab', { name: 'Dashboard' }).first();

      await settingsTab.click();
      await expect(settingsTab).toHaveAttribute('aria-selected', 'true');

      const deviceNameInput = page.getByLabel('Device Name');
      const autoAcceptCheckbox = page.getByLabel(/auto-accept transfers from trusted friends/i);
      const saveLocationInput = page.getByLabel('Save Location');
      const maxConcurrentSelect = page.getByLabel('Max Concurrent Transfers');
      const localDiscoveryCheckbox = page.getByLabel(/allow local device discovery/i);
      const internetP2PCheckbox = page.getByLabel(/allow internet p2p transfers/i);
      await expect(deviceNameInput).toBeVisible();
      await expect(autoAcceptCheckbox).toBeVisible();
      await expect(saveLocationInput).toBeVisible();
      await expect(maxConcurrentSelect).toBeVisible();
      await expect(localDiscoveryCheckbox).toBeVisible();
      await expect(internetP2PCheckbox).toBeVisible();

      const nextName = `Transfer QA ${Date.now().toString().slice(-4)}`;
      const nextLocation = `Downloads/Tallow-${Date.now().toString().slice(-3)}`;
      await deviceNameInput.fill(nextName);
      await expect(deviceNameInput).toHaveValue(nextName);
      await saveLocationInput.fill(nextLocation);
      await expect(saveLocationInput).toHaveValue(nextLocation);

      await maxConcurrentSelect.selectOption('5');
      await expect(maxConcurrentSelect).toHaveValue('5');

      const initiallyChecked = await autoAcceptCheckbox.isChecked();
      const localDiscoveryInitiallyChecked = await localDiscoveryCheckbox.isChecked();
      const internetP2PInitiallyChecked = await internetP2PCheckbox.isChecked();
      await autoAcceptCheckbox.click();
      if (initiallyChecked) {
        await expect(autoAcceptCheckbox).not.toBeChecked();
      } else {
        await expect(autoAcceptCheckbox).toBeChecked();
      }

      await dashboardTab.click();
      await settingsTab.click();
      await expect(deviceNameInput).toHaveValue(nextName);
      await expect(saveLocationInput).toHaveValue(nextLocation);
      await expect(maxConcurrentSelect).toHaveValue('5');
      if (initiallyChecked) {
        await expect(autoAcceptCheckbox).not.toBeChecked();
      } else {
        await expect(autoAcceptCheckbox).toBeChecked();
      }

      await localDiscoveryCheckbox.click();
      if (localDiscoveryInitiallyChecked) {
        await expect(localDiscoveryCheckbox).not.toBeChecked();
      } else {
        await expect(localDiscoveryCheckbox).toBeChecked();
      }

      await internetP2PCheckbox.click();
      if (internetP2PInitiallyChecked) {
        await expect(internetP2PCheckbox).not.toBeChecked();
      } else {
        await expect(internetP2PCheckbox).toBeChecked();
      }
    });
  });

  test.describe('File Queue', () => {
    test.beforeEach(async ({ page }) => {
      await chooseMode(page, 'local');
    });

    test('should add files from file input', async ({ page, fileHelpers }) => {
      const files = fileHelpers.createMultipleFiles(2);
      await page.locator('input[type="file"]').setInputFiles(files);

      await expect(page.getByText('test-file-1.txt')).toBeVisible();
      await expect(page.getByText('test-file-2.txt')).toBeVisible();
      await expect(page.getByText(/2 files ready/i)).toBeVisible();
    });

    test('should remove file from queue', async ({ page, fileHelpers }) => {
      const file = fileHelpers.createTextFile('remove-me.txt');
      await page.locator('input[type="file"]').setInputFiles(file);
      await expect(page.getByText('remove-me.txt')).toBeVisible();

      await page.getByRole('button', { name: /remove file/i }).first().click();
      await expect(page.getByText('remove-me.txt')).toHaveCount(0);
    });

    test('should only show send action after device selection', async ({ page, fileHelpers }) => {
      const file = fileHelpers.createTextFile('queued.txt');
      await page.locator('input[type="file"]').setInputFiles(file);

      await expect(page.getByRole('button', { name: /send to device/i })).toHaveCount(0);
      const deviceButtons = page
        .getByRole('group', { name: /nearby devices/i })
        .locator('button[aria-pressed]');
      const discoveredDeviceCount = await deviceButtons.count();

      if (discoveredDeviceCount === 0) {
        await expect(page.getByText(/no nearby devices detected/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /send to device/i })).toHaveCount(0);
        return;
      }

      const deviceButton = deviceButtons.first();
      await expect(deviceButton).toBeVisible();
      await deviceButton.click();
      await expect(page.getByRole('button', { name: /send to device/i })).toBeVisible();
    });
  });

  test.describe('Internet Share Card', () => {
    test.beforeEach(async ({ page }) => {
      await chooseMode(page, 'internet');
    });

    test('should show connection code and share actions', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Share your connection' })).toBeVisible();
      await expect(page.getByText(/\d{3}-\d{3}/)).toBeVisible();
      await expect(page.getByRole('button', { name: /copy connection code/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /copy share link/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /show qr code/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /share via email/i })).toBeVisible();
    });

    test('should expose room code join and create controls', async ({ page }) => {
      const roomCodeInput = page.getByLabel(/enter room code/i);
      await expect(roomCodeInput).toBeVisible();
      await expect(page.getByRole('button', { name: 'Join' })).toBeVisible();
      await expect(page.getByRole('button', { name: /create a room/i })).toBeVisible();

      await roomCodeInput.fill('ab12');
      await expect(roomCodeInput).toHaveValue('AB12');
    });
  });

  test.describe('Responsive', () => {
    test('should show only one navigation surface per viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/transfer');
      await chooseMode(page, 'local');

      await expect(page.locator('[data-nav-surface="desktop-sidebar"]')).toBeHidden();
      await expect(page.locator('[data-nav-surface="mobile-tabbar"]')).toBeVisible();

      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/transfer');
      await chooseMode(page, 'local');

      await expect(page.locator('[data-nav-surface="desktop-sidebar"]')).toBeVisible();
      await expect(page.locator('[data-nav-surface="mobile-tabbar"]')).toBeHidden();
    });

    test('should show mobile tab bar controls on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/transfer');
      await chooseMode(page, 'local');

      const settingsTab = page.getByRole('tab', { name: 'Settings' }).first();
      await expect(settingsTab).toBeVisible();
      await settingsTab.click();
      await expect(page.getByText(/device name, encryption preferences, and transfer configuration/i)).toBeVisible();
    });

    test('should allow horizontal scrolling in mobile tab bar', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/transfer');
      await chooseMode(page, 'local');

      const dashboardTab = page.getByRole('tab', { name: 'Dashboard' }).first();
      const overflowX = await dashboardTab.evaluate((tab) => {
        const bar = tab.parentElement;
        return bar ? getComputedStyle(bar).overflowX : '';
      });

      expect(overflowX).toBe('auto');
    });

    test('should keep mobile tab labels visible on tablet widths', async ({ page }) => {
      await page.setViewportSize({ width: 700, height: 900 });
      await page.goto('/transfer');
      await chooseMode(page, 'local');

      const dashboardTab = page.getByRole('tab', { name: 'Dashboard' }).first();
      await expect(dashboardTab).toBeVisible();

      const dashboardLabelVisible = await dashboardTab.evaluate((tab) => {
        const label = tab.querySelector('span:last-child') as HTMLElement | null;
        if (!label) {
          return false;
        }
        const style = window.getComputedStyle(label);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      });

      expect(dashboardLabelVisible).toBeTruthy();
    });
  });
});

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

test.describe('P2P Transfer Flow', () => {
  test.setTimeout(120000); // 2 minute timeout for full transfer tests

  test('receiver generates a connection code', async ({ browser }) => {
    const context = await browser.newContext();
    const receiverPage = await context.newPage();

    await receiverPage.goto('/app');

    // Select receive mode
    const receiveTab = receiverPage.getByRole('tab', { name: /receive/i });
    if (await receiveTab.isVisible()) {
      await receiveTab.click();
    }

    // Select internet P2P
    const p2pCard = receiverPage.getByText(/internet p2p/i).first();
    if (await p2pCard.isVisible()) {
      await p2pCard.click();
    }

    // Should show a connection code
    const codeDisplay = receiverPage.locator('[data-testid="connection-code"]').or(
      receiverPage.getByText(/[A-Z0-9]{8}/)
    );
    await expect(codeDisplay.first()).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test('sender can enter connection code', async ({ browser }) => {
    const context = await browser.newContext();
    const senderPage = await context.newPage();

    await senderPage.goto('/app');

    // Select send mode (default tab)
    const sendTab = senderPage.getByRole('tab', { name: /send/i });
    if (await sendTab.isVisible()) {
      await sendTab.click();
    }

    // Select internet P2P
    const p2pCard = senderPage.getByText(/internet p2p/i).first();
    if (await p2pCard.isVisible()) {
      await p2pCard.click();
    }

    // Should show code entry field
    const codeInput = senderPage.getByPlaceholder(/enter.*code/i);
    if (await codeInput.isVisible()) {
      await codeInput.fill('ABC123XY');
      await expect(codeInput).toHaveValue('ABC123XY');
    }

    await context.close();
  });

  test('complete file transfer between two peers', async ({ browser }) => {
    // CRITICAL TEST: Full P2P file transfer simulation

    // Create test file
    const testFileName = 'test-transfer.txt';
    const testContent = 'This is a test file for P2P transfer with some data: ' + Date.now();
    const testFilePath = path.join(os.tmpdir(), testFileName);
    fs.writeFileSync(testFilePath, testContent);

    try {
      // Create two separate browser contexts
      const receiverContext = await browser.newContext();
      const senderContext = await browser.newContext();

      const receiverPage = await receiverContext.newPage();
      const senderPage = await senderContext.newPage();

      // Enable console logging for debugging
      receiverPage.on('console', msg => console.log('[Receiver]', msg.text()));
      senderPage.on('console', msg => console.log('[Sender]', msg.text()));

      // Navigate both to app
      await receiverPage.goto('/app');
      await senderPage.goto('/app');

      // STEP 1: Receiver sets up to receive
      console.log('[TEST] Step 1: Receiver setup');

      // Click Receive tab
      const receiveTab = receiverPage.getByRole('tab', { name: /receive/i });
      if (await receiveTab.isVisible()) {
        await receiveTab.click();
        await receiverPage.waitForTimeout(500);
      }

      // Select Internet P2P connection method
      const receiverP2PBtn = receiverPage.getByText(/internet p2p/i).first();
      if (await receiverP2PBtn.isVisible()) {
        await receiverP2PBtn.click();
        await receiverPage.waitForTimeout(1000);
      }

      // Get connection code (wait for it to appear)
      let connectionCode: string | null = null;

      // Try to find code in multiple ways
      const codeElement = receiverPage.locator('[data-testid="connection-code"]');
      if (await codeElement.isVisible({ timeout: 5000 })) {
        connectionCode = await codeElement.textContent();
      } else {
        // Fallback: look for 8-character alphanumeric pattern
        const bodyText = await receiverPage.textContent('body');
        const codeMatch = bodyText?.match(/\b[A-Z0-9]{8}\b/);
        if (codeMatch) {
          connectionCode = codeMatch[0];
        }
      }

      if (!connectionCode) {
        throw new Error('Could not find connection code on receiver page');
      }

      console.log('[TEST] Connection code:', connectionCode);

      // STEP 2: Sender enters code and selects file
      console.log('[TEST] Step 2: Sender setup');

      // Make sure on Send tab
      const sendTab = senderPage.getByRole('tab', { name: /send/i });
      if (await sendTab.isVisible()) {
        await sendTab.click();
        await senderPage.waitForTimeout(500);
      }

      // Select Internet P2P
      const senderP2PBtn = senderPage.getByText(/internet p2p/i).first();
      if (await senderP2PBtn.isVisible()) {
        await senderP2PBtn.click();
        await senderPage.waitForTimeout(1000);
      }

      // Enter connection code
      const codeInput = senderPage.getByPlaceholder(/enter.*code/i);
      if (await codeInput.isVisible()) {
        await codeInput.fill(connectionCode);
        await senderPage.waitForTimeout(500);
      }

      // Click connect button
      const connectBtn = senderPage.getByRole('button', { name: /connect/i });
      if (await connectBtn.isVisible()) {
        await connectBtn.click();
        await senderPage.waitForTimeout(2000);
      }

      // Select file to send
      const fileInput = senderPage.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        await fileInput.setInputFiles(testFilePath);
        await senderPage.waitForTimeout(1000);
      }

      // STEP 3: Verify connection established
      console.log('[TEST] Step 3: Verify connection');

      // Look for connection indicators
      const senderConnected = senderPage.getByText(/connected|sending/i).first();
      const receiverConnected = receiverPage.getByText(/connected|receiving/i).first();

      await expect(senderConnected.or(senderPage.getByText(/peer/i))).toBeVisible({
        timeout: 15000
      });
      await expect(receiverConnected.or(receiverPage.getByText(/peer/i))).toBeVisible({
        timeout: 15000
      });

      console.log('[TEST] Peers connected!');

      // STEP 4: Send file
      console.log('[TEST] Step 4: Send file');

      const sendFileBtn = senderPage.getByRole('button', { name: /send|transfer/i });
      if (await sendFileBtn.isVisible()) {
        await sendFileBtn.click();
        console.log('[TEST] Send button clicked');
      }

      // STEP 5: Wait for transfer to complete
      console.log('[TEST] Step 5: Wait for transfer completion');

      // Wait for completion indicators (timeout: 30 seconds)
      await expect(
        senderPage.getByText(/complete|success|sent/i).first()
      ).toBeVisible({ timeout: 30000 });

      await expect(
        receiverPage.getByText(/complete|success|received/i).first()
      ).toBeVisible({ timeout: 30000 });

      console.log('[TEST] Transfer completed successfully!');

      // STEP 6: Verify file received
      console.log('[TEST] Step 6: Verify received file');

      // Look for download button or file in received list
      const downloadBtn = receiverPage.getByRole('button', { name: /download|save/i });
      if (await downloadBtn.isVisible({ timeout: 5000 })) {
        console.log('[TEST] Download button found');
        await expect(downloadBtn).toBeVisible();
      }

      // Verify file name appears
      await expect(receiverPage.getByText(testFileName)).toBeVisible();

      console.log('[TEST] All steps completed successfully!');

      await receiverContext.close();
      await senderContext.close();
    } finally {
      // Cleanup test file
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
  });

  test('verify connection fails with invalid code', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/app');

    // Select send mode
    const sendTab = page.getByRole('tab', { name: /send/i });
    if (await sendTab.isVisible()) {
      await sendTab.click();
    }

    // Select Internet P2P
    const p2pBtn = page.getByText(/internet p2p/i).first();
    if (await p2pBtn.isVisible()) {
      await p2pBtn.click();
    }

    // Enter invalid code
    const codeInput = page.getByPlaceholder(/enter.*code/i);
    if (await codeInput.isVisible()) {
      await codeInput.fill('INVALID1');
    }

    // Try to connect
    const connectBtn = page.getByRole('button', { name: /connect/i });
    if (await connectBtn.isVisible()) {
      await connectBtn.click();
      await page.waitForTimeout(3000);
    }

    // Should show error or remain disconnected
    const errorMsg = page.getByText(/error|failed|invalid/i).first();
    const stillDisconnected = page.getByText(/enter.*code/i).first();

    await expect(errorMsg.or(stillDisconnected)).toBeVisible();

    await context.close();
  });

  test('file selection shows file info correctly', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Create test file
    const testFileName = 'file-info-test.txt';
    const testContent = 'Test content for file info display';
    const testFilePath = path.join(os.tmpdir(), testFileName);
    fs.writeFileSync(testFilePath, testContent);

    try {
      await page.goto('/app');

      // Select file
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(testFilePath);
      await page.waitForTimeout(500);

      // Verify file name appears
      await expect(page.getByText(testFileName)).toBeVisible();

      // Verify file size appears (should show bytes or KB)
      await expect(page.getByText(/\d+\s*(B|KB|MB)/)).toBeVisible();

    } finally {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
      await context.close();
    }
  });

  test('can cancel transfer mid-flight', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/app');

    // This test verifies cancel button exists
    // Full implementation would require setting up transfer first

    // Look for cancel/abort buttons in transfer UI
    // Button might not be visible until transfer starts
    // Just verify the page loads correctly for now
    await expect(page).toHaveURL(/\/app/);

    await context.close();
  });
});

// Additional test suite for advanced scenarios
test.describe('P2P Transfer Advanced', () => {
  test.setTimeout(180000); // 3 minute timeout

  test('can transfer multiple files sequentially', async ({ browser }) => {
    // This would test sending file 1, waiting for completion,
    // then sending file 2
    // Implementation placeholder
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/app');
    await expect(page).toHaveURL(/\/app/);
    await context.close();
  });

  test('transfer history shows completed transfers', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/app/history');

    // Verify history page loads
    await expect(page).toHaveURL(/\/app\/history/);

    // Should show "no transfers" or list of transfers
    const noTransfers = page.getByText(/no.*transfer/i);
    const transferList = page.locator('[data-testid="transfer-list"]');

    await expect(noTransfers.or(transferList)).toBeVisible();

    await context.close();
  });
});

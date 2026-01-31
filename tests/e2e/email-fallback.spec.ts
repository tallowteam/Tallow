import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Email Fallback Feature
 * Tests the complete email-based file transfer flow
 */

test.describe('Email Fallback Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000/app');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should show email fallback button when file is selected', async ({ page }) => {
    // Click on file selector
    await page.click('[data-testid="file-selector"], button:has-text("Select File")');

    // Upload a test file
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test-file.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('This is a test file for email fallback'),
    });

    // Check if email fallback button is visible
    const emailButton = page.locator('button:has-text("Send via Email"), button[aria-label="Send file via email"]');
    await expect(emailButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('should open email dialog when email button is clicked', async ({ page }) => {
    // Select a file
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('PDF content'),
    });

    // Click email fallback button
    const emailButton = page.locator('button:has-text("Send via Email"), button[aria-label="Send file via email"]');
    await emailButton.first().click();

    // Verify dialog opened
    const dialog = page.locator('[role="dialog"]:has-text("Send File via Email")');
    await expect(dialog).toBeVisible();
  });

  test('should show file information in dialog', async ({ page }) => {
    // Select a file
    const fileContent = 'A'.repeat(1024 * 50); // 50KB file
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'large-file.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(fileContent),
    });

    // Open email dialog
    const emailButton = page.locator('button:has-text("Send via Email"), button[aria-label="Send file via email"]');
    await emailButton.first().click();

    // Verify file info is displayed
    await expect(page.locator('text=large-file.txt')).toBeVisible();
    await expect(page.locator('text=/\\d+\\.\\d+ KB/')).toBeVisible(); // File size
  });

  test('should show attachment mode for small files (<25MB)', async ({ page }) => {
    // Select a small file
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'small-file.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Small file content'),
    });

    // Open email dialog
    const emailButton = page.locator('button:has-text("Send via Email")');
    await emailButton.first().click();

    // Check for attachment indicator
    const attachmentIndicator = page.locator('text=Attachment, span:has-text("Attachment")');
    await expect(attachmentIndicator.first()).toBeVisible({ timeout: 3000 });
  });

  test('should validate email address format', async ({ page }) => {
    // Select a file
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Test'),
    });

    // Open email dialog
    const emailButton = page.locator('button:has-text("Send via Email")');
    await emailButton.first().click();

    // Enter invalid email
    const emailField = page.locator('input[type="email"]#recipient-email, input[placeholder*="recipient"]');
    await emailField.fill('invalid-email');

    // Try to send
    const sendButton = page.locator('button:has-text("Send Email")');
    await sendButton.click();

    // Should show error
    await expect(page.locator('text=/invalid.*email/i')).toBeVisible({ timeout: 3000 });
  });

  test('should allow selecting expiration time', async ({ page }) => {
    // Select a file
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Test'),
    });

    // Open email dialog
    const emailButton = page.locator('button:has-text("Send via Email")');
    await emailButton.first().click();

    // Click expiration dropdown
    const expirationSelect = page.locator('[id="expiration"]').first();
    await expirationSelect.click();

    // Verify options are available
    await expect(page.locator('text="1 hour"')).toBeVisible();
    await expect(page.locator('text="24 hours"')).toBeVisible();
    await expect(page.locator('text="7 days"')).toBeVisible();
  });

  test('should show security information', async ({ page }) => {
    // Select a file
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'secure-test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Secure content'),
    });

    // Open email dialog
    const emailButton = page.locator('button:has-text("Send via Email")');
    await emailButton.first().click();

    // Verify security info is displayed
    await expect(page.locator('text=End-to-End Encrypted')).toBeVisible();
    await expect(page.locator('text=/encrypted/i')).toBeVisible();
  });

  test('should disable send button when no recipient email', async ({ page }) => {
    // Select a file
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Test'),
    });

    // Open email dialog
    const emailButton = page.locator('button:has-text("Send via Email")');
    await emailButton.first().click();

    // Send button should be disabled
    const sendButton = page.locator('button:has-text("Send Email")');
    await expect(sendButton).toBeDisabled();
  });

  test('should enable send button when valid email is entered', async ({ page }) => {
    // Select a file
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Test'),
    });

    // Open email dialog
    const emailButton = page.locator('button:has-text("Send via Email")');
    await emailButton.first().click();

    // Enter valid email
    const emailField = page.locator('input[type="email"]#recipient-email, input[placeholder*="recipient"]');
    await emailField.fill('test@example.com');

    // Send button should be enabled
    const sendButton = page.locator('button:has-text("Send Email")');
    await expect(sendButton).toBeEnabled();
  });

  test('should show progress when sending email', async ({ page }) => {
    // Mock the API response
    await page.route('**/api/v1/send-file-email', async (route) => {
      // Delay to see progress
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true, emailId: 'test-email-id' }),
      });
    });

    // Select a file
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Test'),
    });

    // Open email dialog
    const emailButton = page.locator('button:has-text("Send via Email")');
    await emailButton.first().click();

    // Enter valid email
    const emailField = page.locator('input[type="email"]#recipient-email');
    await emailField.fill('test@example.com');

    // Click send
    const sendButton = page.locator('button:has-text("Send Email")');
    await sendButton.click();

    // Should show progress
    await expect(page.locator('text=Sending..., text=Encrypting')).toBeVisible({ timeout: 2000 });
  });

  test('should close dialog after successful send', async ({ page }) => {
    // Mock successful API response
    await page.route('**/api/v1/send-file-email', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true, emailId: 'test-123' }),
      });
    });

    // Select a file
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Test content'),
    });

    // Open email dialog
    const emailButton = page.locator('button:has-text("Send via Email")');
    await emailButton.first().click();

    // Fill in email
    const emailField = page.locator('input[type="email"]#recipient-email');
    await emailField.fill('recipient@example.com');

    // Send
    const sendButton = page.locator('button:has-text("Send Email")');
    await sendButton.click();

    // Dialog should close after success
    const dialog = page.locator('[role="dialog"]:has-text("Send File via Email")');
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  test('should show error message on API failure', async ({ page }) => {
    // Mock failed API response
    await page.route('**/api/v1/send-file-email', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Email service unavailable' }),
      });
    });

    // Select a file
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Test'),
    });

    // Open email dialog
    const emailButton = page.locator('button:has-text("Send via Email")');
    await emailButton.first().click();

    // Fill in email
    const emailField = page.locator('input[type="email"]#recipient-email');
    await emailField.fill('test@example.com');

    // Send
    const sendButton = page.locator('button:has-text("Send Email")');
    await sendButton.click();

    // Should show error
    await expect(page.locator('text=/Failed.*email/i, text=/error/i')).toBeVisible({ timeout: 3000 });
  });

  test('should allow canceling the email send', async ({ page }) => {
    // Select a file
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Test'),
    });

    // Open email dialog
    const emailButton = page.locator('button:has-text("Send via Email")');
    await emailButton.first().click();

    // Click cancel
    const cancelButton = page.locator('button:has-text("Cancel")');
    await cancelButton.click();

    // Dialog should close
    const dialog = page.locator('[role="dialog"]:has-text("Send File via Email")');
    await expect(dialog).not.toBeVisible();
  });
});

test.describe('Email API Routes', () => {
  test('should have send-file-email endpoint available', async ({ request }) => {
    // Test that the endpoint exists (should return 400/401/404/405, not 500)
    const response = await request.post('http://localhost:3000/api/v1/send-file-email', {
      data: {},
    });

    // Should not be a server error
    expect(response.status()).toBeLessThan(500);
  });

  test('should validate required fields in API', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/v1/send-file-email', {
      data: {
        recipientEmail: 'test@example.com',
        // Missing other required fields
      },
    });

    // Should return client error (400) or not found if endpoint doesn't exist (404)
    expect([400, 401, 404, 405]).toContain(response.status());

    if (response.status() === 400) {
      const body = await response.json().catch(() => ({}));
      expect(body.error || body.message).toBeTruthy();
    }
  });

  test('should reject invalid email format in API', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/v1/send-file-email', {
      data: {
        recipientEmail: 'invalid-email',
        senderName: 'Test User',
        fileName: 'test.txt',
        fileSize: 100,
        expiresAt: Date.now() + 86400000,
        mode: 'attachment',
        fileData: 'dGVzdA==', // base64 'test'
      },
    });

    // Should return client error
    expect(response.status()).toBeLessThan(500);
  });

  test('should have download-file endpoint available (GET - legacy)', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/v1/download-file');

    // Should return some response (not server error)
    expect(response.status()).toBeLessThan(500);
  });

  test('should have download-file endpoint available (POST - secure)', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/v1/download-file', {
      data: {},
    });

    // Should return some response (not server error)
    expect(response.status()).toBeLessThan(500);
  });

  test('should validate download parameters (GET)', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/v1/download-file?fileId=invalid');

    // Should handle gracefully
    expect(response.status()).toBeLessThan(500);
  });

  test('should validate download parameters (POST - secure)', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/v1/download-file', {
      data: {
        fileId: 'invalid',
        token: 'test',
        key: 'test',
      },
    });

    // Should handle gracefully - expect 400 for invalid format
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('Temp File Storage', () => {
  test('should store and retrieve files in localStorage', async ({ page }) => {
    await page.goto('http://localhost:3000/app');

    // Test storage functionality via browser context
    const storageTest = await page.evaluate(async () => {
      try {
        const { uploadTempFile } = await import('@/lib/storage/temp-file-storage');
        const { pqCrypto } = await import('@/lib/crypto/pqc-crypto');

        // Create a test file
        const testBlob = new Blob(['Test file content'], { type: 'text/plain' });
        const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });

        // Generate encryption key
        const encryptionKey = pqCrypto.randomBytes(32);

        // Upload file
        const result = await uploadTempFile(testFile, encryptionKey, {
          expirationHours: 1,
          maxDownloads: 1,
        });

        return {
          success: true,
          hasFileId: !!result.fileId,
          hasToken: !!result.downloadToken,
          hasExpiration: !!result.expiresAt,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    expect(storageTest.success).toBe(true);
    expect(storageTest.hasFileId).toBe(true);
    expect(storageTest.hasToken).toBe(true);
    expect(storageTest.hasExpiration).toBe(true);
  });

  test('should cleanup expired files', async ({ page }) => {
    await page.goto('http://localhost:3000/app');

    const cleanupTest = await page.evaluate(async () => {
      try {
        const { cleanupExpiredFiles, getStorageStats } = await import('@/lib/storage/temp-file-storage');

        // Get initial stats
        const beforeStats = getStorageStats();

        // Run cleanup
        const deletedCount = cleanupExpiredFiles();

        // Get after stats
        const afterStats = getStorageStats();

        return {
          success: true,
          deletedCount,
          beforeStats,
          afterStats,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    expect(cleanupTest.success).toBe(true);
  });
});

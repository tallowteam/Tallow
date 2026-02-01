/**
 * E2E Test Fixtures and Helpers
 * Reusable test utilities for Playwright tests
 */

import { test as base, expect, BrowserContext, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

export const APP_URL = process.env['APP_URL'] || 'http://localhost:3000';

// Extended test fixtures
type TestFixtures = {
  appPage: Page;
  dualBrowser: {
    senderContext: BrowserContext;
    receiverContext: BrowserContext;
    senderPage: Page;
    receiverPage: Page;
  };
};

export const test = base.extend<TestFixtures>({
  // Pre-configured app page
  appPage: async ({ page }, use) => {
    await page.goto(`${APP_URL}/app`);
    await page.waitForLoadState('networkidle');
    await use(page);
  },

  // Dual browser setup for P2P testing
  dualBrowser: async ({ browser }, use) => {
    const senderContext = await browser.newContext();
    const receiverContext = await browser.newContext();
    const senderPage = await senderContext.newPage();
    const receiverPage = await receiverContext.newPage();

    await Promise.all([
      senderPage.goto(`${APP_URL}/app`),
      receiverPage.goto(`${APP_URL}/app`),
    ]);

    await Promise.all([
      senderPage.waitForLoadState('networkidle'),
      receiverPage.waitForLoadState('networkidle'),
    ]);

    await use({ senderContext, receiverContext, senderPage, receiverPage });

    await senderContext.close();
    await receiverContext.close();
  },
});

export { expect };

// File creation helpers
export class TestFileManager {
  private files: string[] = [];
  private folders: string[] = [];

  async createFile(name: string, sizeMB: number): Promise<string> {
    const filePath = path.join(os.tmpdir(), name);
    const sizeBytes = sizeMB * 1024 * 1024;
    const buffer = Buffer.alloc(sizeBytes, 'A');
    fs.writeFileSync(filePath, buffer);
    this.files.push(filePath);
    return filePath;
  }

  async createTextFile(name: string, content: string): Promise<string> {
    const filePath = path.join(os.tmpdir(), name);
    fs.writeFileSync(filePath, content);
    this.files.push(filePath);
    return filePath;
  }

  async createFolder(name: string, fileCount: number): Promise<string> {
    const folderPath = path.join(os.tmpdir(), name);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    for (let i = 0; i < fileCount; i++) {
      const fileName = `file-${i + 1}.txt`;
      const filePath = path.join(folderPath, fileName);
      fs.writeFileSync(filePath, `Test file content ${i + 1}: ${Date.now()}`);
    }

    this.folders.push(folderPath);
    return folderPath;
  }

  cleanup() {
    this.files.forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });

    this.folders.forEach((folder) => {
      if (fs.existsSync(folder)) {
        fs.rmSync(folder, { recursive: true, force: true });
      }
    });

    this.files = [];
    this.folders = [];
  }
}

// P2P connection helpers
export async function establishP2PConnection(
  senderPage: Page,
  receiverPage: Page
): Promise<string | null> {
  // Receiver: Set up to receive
  const receiveTab = receiverPage.getByRole('tab', { name: /receive/i });
  if (await receiveTab.isVisible({ timeout: 5000 }).catch(() => false)) {
    await receiveTab.click();
    await receiverPage.waitForTimeout(500);
  }

  // Receiver: Select Internet P2P
  const receiverP2PBtn = receiverPage.getByText(/internet p2p/i).first();
  if (await receiverP2PBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await receiverP2PBtn.click();
    await receiverPage.waitForTimeout(1000);
  }

  // Get connection code
  let connectionCode: string | null = null;
  const codeElement = receiverPage.locator('[data-testid="connection-code"]');
  if (await codeElement.isVisible({ timeout: 5000 }).catch(() => false)) {
    connectionCode = await codeElement.textContent();
  } else {
    const bodyText = await receiverPage.textContent('body');
    const codeMatch = bodyText?.match(/\b[A-Z0-9]{8}\b/);
    if (codeMatch) {
      connectionCode = codeMatch[0];
    }
  }

  if (!connectionCode) {return null;}

  // Sender: Set up to send
  const sendTab = senderPage.getByRole('tab', { name: /send/i });
  if (await sendTab.isVisible({ timeout: 5000 }).catch(() => false)) {
    await sendTab.click();
    await senderPage.waitForTimeout(500);
  }

  // Sender: Select Internet P2P
  const senderP2PBtn = senderPage.getByText(/internet p2p/i).first();
  if (await senderP2PBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await senderP2PBtn.click();
    await senderPage.waitForTimeout(1000);
  }

  // Sender: Enter connection code
  const codeInput = senderPage.getByPlaceholder(/enter.*code/i);
  if (await codeInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await codeInput.fill(connectionCode);
    await senderPage.waitForTimeout(500);
  }

  // Sender: Click connect
  const connectBtn = senderPage.getByRole('button', { name: /connect/i });
  if (await connectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await connectBtn.click();
    await senderPage.waitForTimeout(2000);
  }

  return connectionCode;
}

// Chat helpers
export async function openChatPanel(page: Page): Promise<boolean> {
  const chatToggle = page
    .locator('button[aria-label="Open chat"]')
    .or(page.locator('button:has(.lucide-message-circle)'))
    .or(page.getByRole('button', { name: /chat/i }))
    .first();

  if (await chatToggle.isVisible({ timeout: 5000 }).catch(() => false)) {
    await chatToggle.click();
    await page.waitForTimeout(500);
    return true;
  }

  return false;
}

export async function closeChatPanel(page: Page): Promise<boolean> {
  const closeButton = page
    .locator('[aria-label="Close chat"]')
    .or(page.locator('button:has(.lucide-x)'))
    .first();

  if (await closeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await closeButton.click();
    await page.waitForTimeout(300);
    return true;
  }

  return false;
}

export async function sendChatMessage(page: Page, message: string): Promise<boolean> {
  const messageInput = page
    .locator('textarea[placeholder*="Type a message"]')
    .or(page.locator('textarea[placeholder*="message"]'))
    .or(page.locator('textarea').first());

  if (await messageInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await messageInput.fill(message);

    const sendButton = page
      .locator('button[aria-label="Send message"]')
      .or(page.locator('button:has(.lucide-send)'))
      .first();

    if (await sendButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sendButton.click();
      await page.waitForTimeout(500);
      return true;
    }
  }

  return false;
}

// Navigation helpers
export async function navigateToSettings(page: Page): Promise<boolean> {
  const settingsBtn = page.getByRole('button', { name: /settings/i });
  if (await settingsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await settingsBtn.click();
    await page.waitForTimeout(500);
    return true;
  }
  return false;
}

export async function navigateToPrivacySettings(page: Page): Promise<boolean> {
  await navigateToSettings(page);

  const privacyTab = page.getByRole('tab', { name: /privacy/i });
  if (await privacyTab.isVisible({ timeout: 5000 }).catch(() => false)) {
    await privacyTab.click();
    await page.waitForTimeout(500);
    return true;
  }

  return false;
}

// Wait helpers
export async function waitForConnectionState(
  page: Page,
  state: 'connected' | 'connecting' | 'disconnected' | 'failed',
  timeout = 15000
): Promise<boolean> {
  const stateIndicator = page.locator(`[data-connection-state="${state}"]`);
  const stateText = page.getByText(new RegExp(state, 'i'));

  try {
    await expect(stateIndicator.or(stateText).first()).toBeVisible({ timeout });
    return true;
  } catch {
    return false;
  }
}

export async function waitForTransferComplete(
  page: Page,
  timeout = 60000
): Promise<boolean> {
  try {
    await expect(page.getByText(/complete|success|sent|received/i).first()).toBeVisible({
      timeout,
    });
    return true;
  } catch {
    return false;
  }
}

// Visual testing helpers
export async function prepareForScreenshot(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        animation-fill-mode: forwards !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });
  await page.waitForTimeout(300);
}

// Accessibility helpers
export async function checkKeyboardNavigation(page: Page, steps = 10): Promise<string[]> {
  const focusedElements: string[] = [];

  for (let i = 0; i < steps; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el
        ? `${el.tagName}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className.split(' ')[0] : ''}`
        : null;
    });

    if (focusedElement) {
      focusedElements.push(focusedElement);
    }
  }

  return focusedElements;
}

export async function checkARIALabel(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector);
  const ariaLabel = await element.getAttribute('aria-label');
  const ariaLabelledby = await element.getAttribute('aria-labelledby');
  const text = await element.textContent();

  return (
    ariaLabel !== null ||
    ariaLabelledby !== null ||
    (text !== null && text.trim().length > 0)
  );
}

// Performance helpers
export async function measurePageLoad(page: Page): Promise<{
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
}> {
  const metrics = await page.evaluate(() => {
    const timing = performance.timing;
    return {
      loadTime: timing.loadEventEnd - timing.navigationStart,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      firstPaint:
        performance.getEntriesByType('paint')[0]?.startTime ||
        timing.domContentLoadedEventEnd - timing.navigationStart,
    };
  });

  return metrics;
}

export async function getMemoryUsage(page: Page): Promise<number> {
  const memory = await page.evaluate(() => {
    return (performance as any).memory?.usedJSHeapSize || 0;
  });

  return memory;
}

// Mock data helpers
export const mockConnectionCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const mockFileMetadata = (name: string, size: number) => ({
  name,
  size,
  type: 'application/octet-stream',
  lastModified: Date.now(),
});

// Console monitoring
export class ConsoleMonitor {
  private logs: { type: string; text: string; timestamp: number }[] = [];
  private page: Page;

  constructor(page: Page) {
    this.page = page;
    this.setupListeners();
  }

  private setupListeners() {
    this.page.on('console', (msg) => {
      this.logs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now(),
      });
    });
  }

  getErrors(): string[] {
    return this.logs.filter((log) => log.type === 'error').map((log) => log.text);
  }

  getWarnings(): string[] {
    return this.logs.filter((log) => log.type === 'warning').map((log) => log.text);
  }

  getLogs(): string[] {
    return this.logs.map((log) => log.text);
  }

  hasError(pattern: RegExp): boolean {
    return this.getErrors().some((error) => pattern.test(error));
  }

  clear() {
    this.logs = [];
  }
}

// Network monitoring
export class NetworkMonitor {
  private requests: any[] = [];
  private responses: any[] = [];
  private page: Page;

  constructor(page: Page) {
    this.page = page;
    this.setupListeners();
  }

  private setupListeners() {
    this.page.on('request', (request) => {
      this.requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        timestamp: Date.now(),
      });
    });

    this.page.on('response', (response) => {
      this.responses.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers(),
        timestamp: Date.now(),
      });
    });
  }

  getRequests(urlPattern?: RegExp): any[] {
    if (!urlPattern) {return this.requests;}
    return this.requests.filter((req) => urlPattern.test(req.url));
  }

  getResponses(urlPattern?: RegExp): any[] {
    if (!urlPattern) {return this.responses;}
    return this.responses.filter((res) => urlPattern.test(res.url));
  }

  getFailedRequests(): any[] {
    return this.responses.filter((res) => res.status >= 400);
  }

  clear() {
    this.requests = [];
    this.responses = [];
  }
}

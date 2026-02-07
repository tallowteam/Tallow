import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Test fixtures and helpers for E2E tests
 */

export { expect };

/**
 * Extended test fixture with custom helpers
 */
export const test = base.extend<{
  mockDevice: MockDevice;
  fileHelpers: FileHelpers;
}>({
  mockDevice: async ({}, use) => {
    const device = new MockDevice();
    await use(device);
  },

  fileHelpers: async ({}, use) => {
    const helpers = new FileHelpers();
    await use(helpers);
    helpers.cleanup();
  },
});

/**
 * Mock device for discovery tests
 */
export class MockDevice {
  id: string;
  name: string;
  platform: string;
  ip: string;

  constructor() {
    this.id = `mock-device-${Date.now()}`;
    this.name = 'Test Device';
    this.platform = 'desktop';
    this.ip = '192.168.1.100';
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      platform: this.platform,
      ip: this.ip,
      port: 9000,
      isOnline: true,
      isFavorite: false,
      lastSeen: new Date().toISOString(),
    };
  }

  /**
   * Inject mock device into page context
   */
  async inject(page: Page) {
    await page.addInitScript((deviceData) => {
      // Add mock device to discovery results
      window.__mockDevices = window.__mockDevices || [];
      window.__mockDevices.push(deviceData);
    }, this.toJSON());
  }
}

/**
 * File generation helpers for transfer tests
 */
export class FileHelpers {
  private tempFiles: string[] = [];
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(process.cwd(), 'tests', 'e2e', '.temp');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Create a test file with specific size
   */
  createTestFile(
    filename: string,
    size: number = 1024,
    content?: string
  ): string {
    const filePath = path.join(this.tempDir, filename);
    const data = content || this.generateRandomData(size);
    fs.writeFileSync(filePath, data);
    this.tempFiles.push(filePath);
    return filePath;
  }

  /**
   * Create a text file
   */
  createTextFile(filename: string, content: string = 'test content'): string {
    return this.createTestFile(filename, content.length, content);
  }

  /**
   * Create an image file (minimal PNG)
   */
  createImageFile(filename: string = 'test-image.png'): string {
    // Minimal valid PNG (1x1 transparent pixel)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    const filePath = path.join(this.tempDir, filename);
    fs.writeFileSync(filePath, pngData);
    this.tempFiles.push(filePath);
    return filePath;
  }

  /**
   * Create a PDF file (minimal valid PDF)
   */
  createPdfFile(filename: string = 'test-document.pdf'): string {
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000317 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
410
%%EOF`;

    const filePath = path.join(this.tempDir, filename);
    fs.writeFileSync(filePath, pdfContent);
    this.tempFiles.push(filePath);
    return filePath;
  }

  /**
   * Create multiple test files
   */
  createMultipleFiles(count: number = 3, prefix: string = 'test-file'): string[] {
    const files: string[] = [];
    for (let i = 0; i < count; i++) {
      files.push(this.createTextFile(`${prefix}-${i + 1}.txt`, `Content ${i + 1}`));
    }
    return files;
  }

  /**
   * Generate random data of specific size
   */
  private generateRandomData(size: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < size; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Cleanup temporary files
   */
  cleanup() {
    for (const file of this.tempFiles) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (error) {
        console.warn(`Failed to cleanup file: ${file}`, error);
      }
    }
    this.tempFiles = [];

    // Try to remove temp directory if empty
    try {
      if (fs.existsSync(this.tempDir)) {
        const files = fs.readdirSync(this.tempDir);
        if (files.length === 0) {
          fs.rmdirSync(this.tempDir);
        }
      }
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Wait for navigation and ensure page is loaded
 */
export async function waitForNavigation(page: Page, url: string) {
  await page.waitForURL(url);
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for element to be visible and stable
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout: number = 5000
) {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });
  return element;
}

/**
 * Check if element exists (without throwing)
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    await page.locator(selector).waitFor({ state: 'attached', timeout: 1000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Simulate file drop on drag-and-drop zone
 */
export async function simulateFileDrop(
  page: Page,
  selector: string,
  files: string[]
) {
  const dropZone = page.locator(selector);
  await dropZone.waitFor({ state: 'visible' });

  // Create file input if not exists
  const hasFileInput = await elementExists(page, 'input[type="file"]');
  if (!hasFileInput) {
    await page.evaluate(() => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.style.display = 'none';
      input.id = 'test-file-input';
      document.body.appendChild(input);
    });
  }

  // Set files
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(files);
}

/**
 * Wait for specific text to appear
 */
export async function waitForText(
  page: Page,
  text: string,
  timeout: number = 5000
) {
  await page.waitForSelector(`text=${text}`, { timeout });
}

/**
 * Take screenshot with custom name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: path.join(process.cwd(), 'test-results', 'screenshots', `${name}.png`),
    fullPage: true,
  });
}

/**
 * Clear browser storage (localStorage, sessionStorage, cookies)
 */
export async function clearStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.context().clearCookies();
}

/**
 * Mock WebRTC for testing
 */
export async function mockWebRTC(page: Page) {
  await page.addInitScript(() => {
    // Mock RTCPeerConnection
    window.RTCPeerConnection = class MockRTCPeerConnection {
      localDescription: any = null;
      remoteDescription: any = null;
      connectionState: string = 'new';
      iceConnectionState: string = 'new';
      signalingState: string = 'stable';

      onicecandidate: ((event: any) => void) | null = null;
      ondatachannel: ((event: any) => void) | null = null;
      onconnectionstatechange: (() => void) | null = null;

      createOffer() {
        return Promise.resolve({
          type: 'offer',
          sdp: 'mock-sdp-offer',
        });
      }

      createAnswer() {
        return Promise.resolve({
          type: 'answer',
          sdp: 'mock-sdp-answer',
        });
      }

      setLocalDescription(desc: any) {
        this.localDescription = desc;
        return Promise.resolve();
      }

      setRemoteDescription(desc: any) {
        this.remoteDescription = desc;
        return Promise.resolve();
      }

      addIceCandidate() {
        return Promise.resolve();
      }

      createDataChannel(label: string) {
        return {
          label,
          readyState: 'open',
          send: () => {},
          close: () => {},
        };
      }

      close() {
        this.connectionState = 'closed';
      }
    } as any;
  });
}

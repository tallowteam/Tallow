/**
 * Tallow Browser Extension - Popup Script
 * Handles the extension popup UI and interactions
 */

// ============================================
// Types
// ============================================

interface ShareData {
  type: 'url' | 'text' | 'image' | 'file' | 'screenshot';
  content: string | Blob;
  title?: string;
  url?: string;
  metadata?: {
    sourceUrl?: string;
    sourceTitle?: string;
    timestamp: string;
  };
}

interface HealthResponse {
  status: 'ok' | 'error';
  service: string;
  version?: string;
  timestamp: string;
  uptime?: number;
}

interface ExtensionConfig {
  tallowUrl: string;
  autoOpenApp: boolean;
  notificationsEnabled: boolean;
}

// ============================================
// Constants
// ============================================

const DEFAULT_CONFIG: ExtensionConfig = {
  tallowUrl: 'http://localhost:3000',
  autoOpenApp: false,
  notificationsEnabled: true,
};

const HEALTH_CHECK_INTERVAL = 10000; // 10 seconds
const REQUEST_TIMEOUT = 5000; // 5 seconds

// ============================================
// State Management
// ============================================

class PopupState {
  private config: ExtensionConfig = DEFAULT_CONFIG;
  private isConnected = false;
  private healthCheckInterval: number | null = null;

  async init(): Promise<void> {
    await this.loadConfig();
    await this.checkConnection();
    this.startHealthCheck();
  }

  private async loadConfig(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get('config');
      if (result.config) {
        this.config = { ...DEFAULT_CONFIG, ...result.config };
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }

  async saveConfig(config: Partial<ExtensionConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    await chrome.storage.sync.set({ config: this.config });
  }

  getConfig(): ExtensionConfig {
    return this.config;
  }

  setConnected(connected: boolean): void {
    this.isConnected = connected;
    this.updateConnectionUI();
  }

  getConnected(): boolean {
    return this.isConnected;
  }

  async checkConnection(): Promise<boolean> {
    try {
      const isHealthy = await checkTallowHealth(this.config.tallowUrl);
      this.setConnected(isHealthy);
      return isHealthy;
    } catch (error) {
      this.setConnected(false);
      return false;
    }
  }

  private startHealthCheck(): void {
    // Initial check
    this.checkConnection();

    // Periodic checks
    this.healthCheckInterval = window.setInterval(() => {
      this.checkConnection();
    }, HEALTH_CHECK_INTERVAL);
  }

  stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  private updateConnectionUI(): void {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const connectedState = document.getElementById('connectedState');
    const disconnectedState = document.getElementById('disconnectedState');

    if (!statusDot || !statusText || !connectedState || !disconnectedState) {
      return;
    }

    if (this.isConnected) {
      statusDot.className = 'status-dot connected';
      statusText.textContent = 'Connected';
      connectedState.style.display = 'block';
      disconnectedState.style.display = 'none';
    } else {
      statusDot.className = 'status-dot disconnected';
      statusText.textContent = 'Disconnected';
      connectedState.style.display = 'none';
      disconnectedState.style.display = 'block';
    }
  }
}

// ============================================
// API Functions
// ============================================

async function checkTallowHealth(baseUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return false;
    }

    const data: HealthResponse = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

async function sendToTallow(
  baseUrl: string,
  data: ShareData
): Promise<{ success: boolean; error?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    // For now, we'll use a simple endpoint structure
    // In production, this would integrate with Tallow's transfer API
    const endpoint = `${baseUrl}/api/extension/share`;

    const formData = new FormData();
    formData.append('type', data.type);

    if (typeof data.content === 'string') {
      formData.append('content', data.content);
    } else {
      formData.append('file', data.content);
    }

    if (data.title) {
      formData.append('title', data.title);
    }

    if (data.url) {
      formData.append('url', data.url);
    }

    if (data.metadata) {
      formData.append('metadata', JSON.stringify(data.metadata));
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send to Tallow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Share Actions
// ============================================

async function shareCurrentPage(state: PopupState): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url || !tab.title) {
      throw new Error('Cannot access current tab');
    }

    const shareData: ShareData = {
      type: 'url',
      content: tab.url,
      title: tab.title,
      url: tab.url,
      metadata: {
        sourceUrl: tab.url,
        sourceTitle: tab.title,
        timestamp: new Date().toISOString(),
      },
    };

    showLoading();
    const result = await sendToTallow(state.getConfig().tallowUrl, shareData);

    if (result.success) {
      showSuccess();
      if (state.getConfig().autoOpenApp) {
        chrome.tabs.create({ url: state.getConfig().tallowUrl });
      }
    } else {
      throw new Error(result.error || 'Failed to share');
    }
  } catch (error) {
    console.error('Share page failed:', error);
    alert(`Failed to share page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    showConnectedState();
  }
}

async function shareSelectedText(state: PopupState): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.id) {
      throw new Error('Cannot access current tab');
    }

    // Get selected text from the page
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString() || '',
    });

    const selectedText = result[0]?.result;

    if (!selectedText || selectedText.trim() === '') {
      alert('Please select some text on the page first');
      return;
    }

    const shareData: ShareData = {
      type: 'text',
      content: selectedText,
      title: 'Selected Text',
      url: tab.url,
      metadata: {
        sourceUrl: tab.url,
        sourceTitle: tab.title,
        timestamp: new Date().toISOString(),
      },
    };

    showLoading();
    const response = await sendToTallow(state.getConfig().tallowUrl, shareData);

    if (response.success) {
      showSuccess();
      if (state.getConfig().autoOpenApp) {
        chrome.tabs.create({ url: state.getConfig().tallowUrl });
      }
    } else {
      throw new Error(response.error || 'Failed to share');
    }
  } catch (error) {
    console.error('Share text failed:', error);
    alert(`Failed to share text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    showConnectedState();
  }
}

async function shareScreenshot(state: PopupState): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.id) {
      throw new Error('Cannot access current tab');
    }

    showLoading();

    // Capture visible tab
    const dataUrl = await chrome.tabs.captureVisibleTab(undefined, {
      format: 'png',
    });

    // Convert data URL to Blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    const shareData: ShareData = {
      type: 'screenshot',
      content: blob,
      title: `Screenshot - ${tab.title}`,
      url: tab.url,
      metadata: {
        sourceUrl: tab.url,
        sourceTitle: tab.title,
        timestamp: new Date().toISOString(),
      },
    };

    const result = await sendToTallow(state.getConfig().tallowUrl, shareData);

    if (result.success) {
      showSuccess();
      if (state.getConfig().autoOpenApp) {
        chrome.tabs.create({ url: state.getConfig().tallowUrl });
      }
    } else {
      throw new Error(result.error || 'Failed to share');
    }
  } catch (error) {
    console.error('Share screenshot failed:', error);
    alert(`Failed to share screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    showConnectedState();
  }
}

async function shareImage(state: PopupState): Promise<void> {
  alert('Image sharing from context menu - right-click on an image and select "Share with Tallow"');
}

// ============================================
// UI State Functions
// ============================================

function showLoading(): void {
  document.getElementById('connectedState')!.style.display = 'none';
  document.getElementById('disconnectedState')!.style.display = 'none';
  document.getElementById('successState')!.style.display = 'none';
  document.getElementById('loadingState')!.style.display = 'flex';
}

function showSuccess(): void {
  document.getElementById('connectedState')!.style.display = 'none';
  document.getElementById('disconnectedState')!.style.display = 'none';
  document.getElementById('loadingState')!.style.display = 'none';
  document.getElementById('successState')!.style.display = 'flex';
}

function showConnectedState(): void {
  document.getElementById('loadingState')!.style.display = 'none';
  document.getElementById('successState')!.style.display = 'none';
  document.getElementById('disconnectedState')!.style.display = 'none';
  document.getElementById('connectedState')!.style.display = 'block';
}

function showDisconnectedState(): void {
  document.getElementById('connectedState')!.style.display = 'none';
  document.getElementById('loadingState')!.style.display = 'none';
  document.getElementById('successState')!.style.display = 'none';
  document.getElementById('disconnectedState')!.style.display = 'flex';
}

// ============================================
// Event Handlers
// ============================================

function setupEventListeners(state: PopupState): void {
  // Share actions
  document.getElementById('sharePageBtn')?.addEventListener('click', () => {
    shareCurrentPage(state);
  });

  document.getElementById('shareTextBtn')?.addEventListener('click', () => {
    shareSelectedText(state);
  });

  document.getElementById('shareScreenshotBtn')?.addEventListener('click', () => {
    shareScreenshot(state);
  });

  document.getElementById('shareImageBtn')?.addEventListener('click', () => {
    shareImage(state);
  });

  // Open app
  document.getElementById('openAppBtn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: state.getConfig().tallowUrl });
  });

  // Retry connection
  document.getElementById('retryBtn')?.addEventListener('click', async () => {
    await state.checkConnection();
  });

  // Back button
  document.getElementById('backBtn')?.addEventListener('click', () => {
    showConnectedState();
  });

  // Settings
  document.getElementById('settingsBtn')?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// ============================================
// Initialization
// ============================================

async function init(): Promise<void> {
  const state = new PopupState();
  await state.init();
  setupEventListeners(state);

  // Cleanup on unload
  window.addEventListener('unload', () => {
    state.stopHealthCheck();
  });
}

// Start the popup
document.addEventListener('DOMContentLoaded', init);

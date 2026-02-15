/**
 * Tallow Browser Extension - Options Page Script
 * Manages extension settings and configuration
 */

// ============================================
// Types
// ============================================

interface ExtensionConfig {
  tallowUrl: string;
  autoOpenApp: boolean;
  notificationsEnabled: boolean;
  contentScriptEnabled: boolean;
}

// ============================================
// Constants
// ============================================

const DEFAULT_CONFIG: ExtensionConfig = {
  tallowUrl: 'http://localhost:3000',
  autoOpenApp: false,
  notificationsEnabled: true,
  contentScriptEnabled: true,
};

// ============================================
// Configuration Management
// ============================================

async function loadConfig(): Promise<ExtensionConfig> {
  try {
    const result = await chrome.storage.sync.get('config');
    return { ...DEFAULT_CONFIG, ...result.config };
  } catch (error) {
    console.error('Failed to load config:', error);
    return DEFAULT_CONFIG;
  }
}

async function saveConfig(config: ExtensionConfig): Promise<void> {
  await chrome.storage.sync.set({ config });
}

// ============================================
// Connection Testing
// ============================================

async function testConnection(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${url}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

// ============================================
// UI Updates
// ============================================

function updateConnectionStatus(connected: boolean, testing = false): void {
  const indicator = document.getElementById('statusIndicator');
  const text = document.getElementById('statusText');

  if (!indicator || !text) {return;}

  if (testing) {
    indicator.className = 'status-indicator';
    text.textContent = 'Testing connection...';
    return;
  }

  if (connected) {
    indicator.className = 'status-indicator connected';
    text.textContent = 'Connected to Tallow app';
  } else {
    indicator.className = 'status-indicator disconnected';
    text.textContent = 'Cannot connect to Tallow app';
  }
}

function showSaveStatus(): void {
  const saveStatus = document.getElementById('saveStatus');
  if (!saveStatus) {return;}

  saveStatus.style.display = 'flex';

  setTimeout(() => {
    saveStatus.style.display = 'none';
  }, 3000);
}

// ============================================
// Form Handling
// ============================================

function populateForm(config: ExtensionConfig): void {
  const tallowUrlInput = document.getElementById('tallowUrl') as HTMLInputElement;
  const autoOpenAppInput = document.getElementById('autoOpenApp') as HTMLInputElement;
  const notificationsInput = document.getElementById('notificationsEnabled') as HTMLInputElement;
  const contentScriptInput = document.getElementById('contentScriptEnabled') as HTMLInputElement;

  if (tallowUrlInput) {tallowUrlInput.value = config.tallowUrl;}
  if (autoOpenAppInput) {autoOpenAppInput.checked = config.autoOpenApp;}
  if (notificationsInput) {notificationsInput.checked = config.notificationsEnabled;}
  if (contentScriptInput) {contentScriptInput.checked = config.contentScriptEnabled;}
}

function getFormData(): ExtensionConfig {
  const tallowUrlInput = document.getElementById('tallowUrl') as HTMLInputElement;
  const autoOpenAppInput = document.getElementById('autoOpenApp') as HTMLInputElement;
  const notificationsInput = document.getElementById('notificationsEnabled') as HTMLInputElement;
  const contentScriptInput = document.getElementById('contentScriptEnabled') as HTMLInputElement;

  return {
    tallowUrl: tallowUrlInput?.value || DEFAULT_CONFIG.tallowUrl,
    autoOpenApp: autoOpenAppInput?.checked || DEFAULT_CONFIG.autoOpenApp,
    notificationsEnabled: notificationsInput?.checked || DEFAULT_CONFIG.notificationsEnabled,
    contentScriptEnabled: contentScriptInput?.checked || DEFAULT_CONFIG.contentScriptEnabled,
  };
}

// ============================================
// Event Handlers
// ============================================

async function handleSave(): Promise<void> {
  const config = getFormData();

  // Validate URL
  try {
    new URL(config.tallowUrl);
  } catch {
    alert('Please enter a valid URL');
    return;
  }

  await saveConfig(config);
  showSaveStatus();

  // Notify content scripts of config change
  const tabs = await chrome.tabs.query({});
  tabs.forEach((tab) => {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'toggleContentScript',
        enabled: config.contentScriptEnabled,
      }).catch(() => {
        // Ignore errors for tabs that don't have content script
      });
    }
  });
}

async function handleReset(): Promise<void> {
  if (!confirm('Are you sure you want to reset all settings to defaults?')) {
    return;
  }

  await saveConfig(DEFAULT_CONFIG);
  populateForm(DEFAULT_CONFIG);
  showSaveStatus();
}

async function handleTestConnection(): Promise<void> {
  const tallowUrlInput = document.getElementById('tallowUrl') as HTMLInputElement;
  const url = tallowUrlInput?.value || DEFAULT_CONFIG.tallowUrl;

  updateConnectionStatus(false, true);

  const connected = await testConnection(url);
  updateConnectionStatus(connected);
}

// ============================================
// Initialization
// ============================================

async function init(): Promise<void> {
  // Load and populate form
  const config = await loadConfig();
  populateForm(config);

  // Setup event listeners
  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');
  const testConnectionBtn = document.getElementById('testConnectionBtn');

  if (saveBtn) {
    saveBtn.addEventListener('click', handleSave);
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', handleReset);
  }

  if (testConnectionBtn) {
    testConnectionBtn.addEventListener('click', handleTestConnection);
  }

  // Auto-save on input change (debounced)
  let saveTimeout: number | null = null;
  const inputs = [
    'tallowUrl',
    'autoOpenApp',
    'notificationsEnabled',
    'contentScriptEnabled',
  ];

  inputs.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', () => {
        if (saveTimeout) {
          clearTimeout(saveTimeout);
        }
        saveTimeout = window.setTimeout(() => {
          handleSave();
        }, 1000);
      });
    }
  });

  // Test connection on load
  handleTestConnection();
}

// Start the options page
document.addEventListener('DOMContentLoaded', init);

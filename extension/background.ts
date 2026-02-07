/**
 * Tallow Browser Extension - Background Service Worker
 * Handles context menus, keyboard shortcuts, and background tasks
 */

export {};

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
// Configuration
// ============================================

async function getConfig(): Promise<ExtensionConfig> {
  try {
    const result = await chrome.storage.sync.get('config');
    return { ...DEFAULT_CONFIG, ...result.config };
  } catch (error) {
    console.error('Failed to load config:', error);
    return DEFAULT_CONFIG;
  }
}

// ============================================
// Context Menus
// ============================================

function createContextMenus(): void {
  // Remove existing menus
  chrome.contextMenus.removeAll(() => {
    // Main menu
    chrome.contextMenus.create({
      id: 'tallow-main',
      title: 'Share with Tallow',
      contexts: ['page', 'selection', 'link', 'image', 'video', 'audio'],
    });

    // Share page
    chrome.contextMenus.create({
      id: 'tallow-share-page',
      parentId: 'tallow-main',
      title: 'Share this page',
      contexts: ['page'],
    });

    // Share selection
    chrome.contextMenus.create({
      id: 'tallow-share-selection',
      parentId: 'tallow-main',
      title: 'Share selected text',
      contexts: ['selection'],
    });

    // Share link
    chrome.contextMenus.create({
      id: 'tallow-share-link',
      parentId: 'tallow-main',
      title: 'Share this link',
      contexts: ['link'],
    });

    // Share image
    chrome.contextMenus.create({
      id: 'tallow-share-image',
      parentId: 'tallow-main',
      title: 'Share this image',
      contexts: ['image'],
    });

    // Share video
    chrome.contextMenus.create({
      id: 'tallow-share-video',
      parentId: 'tallow-main',
      title: 'Share this video',
      contexts: ['video'],
    });

    // Share audio
    chrome.contextMenus.create({
      id: 'tallow-share-audio',
      parentId: 'tallow-main',
      title: 'Share this audio',
      contexts: ['audio'],
    });

    // Separator
    chrome.contextMenus.create({
      id: 'tallow-separator',
      parentId: 'tallow-main',
      type: 'separator',
      contexts: ['page', 'selection', 'link', 'image', 'video', 'audio'],
    });

    // Open Tallow
    chrome.contextMenus.create({
      id: 'tallow-open-app',
      parentId: 'tallow-main',
      title: 'Open Tallow App',
      contexts: ['page', 'selection', 'link', 'image', 'video', 'audio'],
    });
  });
}

// ============================================
// Context Menu Handlers
// ============================================

async function handleContextMenuClick(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
): Promise<void> {
  const config = await getConfig();

  try {
    switch (info.menuItemId) {
      case 'tallow-share-page':
        await sharePageFromContext(info, tab, config);
        break;

      case 'tallow-share-selection':
        await shareSelectionFromContext(info, tab, config);
        break;

      case 'tallow-share-link':
        await shareLinkFromContext(info, tab, config);
        break;

      case 'tallow-share-image':
        await shareImageFromContext(info, tab, config);
        break;

      case 'tallow-share-video':
        await shareMediaFromContext(info, tab, config, 'video');
        break;

      case 'tallow-share-audio':
        await shareMediaFromContext(info, tab, config, 'audio');
        break;

      case 'tallow-open-app':
        chrome.tabs.create({ url: config.tallowUrl });
        break;
    }
  } catch (error) {
    console.error('Context menu action failed:', error);
    showNotification('Error', `Failed to share: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function sharePageFromContext(
  info: chrome.contextMenus.OnClickData,
  tab: chrome.tabs.Tab | undefined,
  config: ExtensionConfig
): Promise<void> {
  if (!tab?.url || !tab?.title) {
    throw new Error('Cannot access tab information');
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

  await sendToTallow(config.tallowUrl, shareData);
  showNotification('Shared!', `Page "${tab.title}" shared to Tallow`);

  if (config.autoOpenApp) {
    chrome.tabs.create({ url: config.tallowUrl });
  }
}

async function shareSelectionFromContext(
  info: chrome.contextMenus.OnClickData,
  tab: chrome.tabs.Tab | undefined,
  config: ExtensionConfig
): Promise<void> {
  if (!info.selectionText) {
    throw new Error('No text selected');
  }

  const shareData: ShareData = {
    type: 'text',
    content: info.selectionText,
    title: 'Selected Text',
    url: tab?.url,
    metadata: {
      sourceUrl: tab?.url,
      sourceTitle: tab?.title,
      timestamp: new Date().toISOString(),
    },
  };

  await sendToTallow(config.tallowUrl, shareData);
  showNotification('Shared!', 'Selected text shared to Tallow');

  if (config.autoOpenApp) {
    chrome.tabs.create({ url: config.tallowUrl });
  }
}

async function shareLinkFromContext(
  info: chrome.contextMenus.OnClickData,
  tab: chrome.tabs.Tab | undefined,
  config: ExtensionConfig
): Promise<void> {
  if (!info.linkUrl) {
    throw new Error('No link URL available');
  }

  const shareData: ShareData = {
    type: 'url',
    content: info.linkUrl,
    title: info.linkText || 'Shared Link',
    url: info.linkUrl,
    metadata: {
      sourceUrl: tab?.url,
      sourceTitle: tab?.title,
      timestamp: new Date().toISOString(),
    },
  };

  await sendToTallow(config.tallowUrl, shareData);
  showNotification('Shared!', 'Link shared to Tallow');

  if (config.autoOpenApp) {
    chrome.tabs.create({ url: config.tallowUrl });
  }
}

async function shareImageFromContext(
  info: chrome.contextMenus.OnClickData,
  tab: chrome.tabs.Tab | undefined,
  config: ExtensionConfig
): Promise<void> {
  if (!info.srcUrl) {
    throw new Error('No image URL available');
  }

  // Fetch the image and convert to blob
  const response = await fetch(info.srcUrl);
  const blob = await response.blob();

  const shareData: ShareData = {
    type: 'image',
    content: blob,
    title: 'Shared Image',
    url: info.srcUrl,
    metadata: {
      sourceUrl: tab?.url,
      sourceTitle: tab?.title,
      timestamp: new Date().toISOString(),
    },
  };

  await sendToTallow(config.tallowUrl, shareData);
  showNotification('Shared!', 'Image shared to Tallow');

  if (config.autoOpenApp) {
    chrome.tabs.create({ url: config.tallowUrl });
  }
}

async function shareMediaFromContext(
  info: chrome.contextMenus.OnClickData,
  tab: chrome.tabs.Tab | undefined,
  config: ExtensionConfig,
  mediaType: 'video' | 'audio'
): Promise<void> {
  if (!info.srcUrl) {
    throw new Error('No media URL available');
  }

  const shareData: ShareData = {
    type: 'url',
    content: info.srcUrl,
    title: `Shared ${mediaType}`,
    url: info.srcUrl,
    metadata: {
      sourceUrl: tab?.url,
      sourceTitle: tab?.title,
      timestamp: new Date().toISOString(),
    },
  };

  await sendToTallow(config.tallowUrl, shareData);
  showNotification('Shared!', `${mediaType} URL shared to Tallow`);

  if (config.autoOpenApp) {
    chrome.tabs.create({ url: config.tallowUrl });
  }
}

// ============================================
// API Functions
// ============================================

async function sendToTallow(
  baseUrl: string,
  data: ShareData
): Promise<void> {
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
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }
}

// ============================================
// Notifications
// ============================================

function showNotification(title: string, message: string): void {
  getConfig().then((config) => {
    if (config.notificationsEnabled) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-128.png',
        title,
        message,
      });
    }
  });
}

// ============================================
// Keyboard Shortcuts
// ============================================

chrome.commands.onCommand.addListener(async (command) => {
  const config = await getConfig();

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    switch (command) {
      case 'share-selection':
        if (tab?.id) {
          const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => window.getSelection()?.toString() || '',
          });

          const selectedText = result[0]?.result;

          if (selectedText && selectedText.trim() !== '') {
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

            await sendToTallow(config.tallowUrl, shareData);
            showNotification('Shared!', 'Selected text shared to Tallow');

            if (config.autoOpenApp) {
              chrome.tabs.create({ url: config.tallowUrl });
            }
          }
        }
        break;

      case 'share-page':
        if (tab?.url && tab?.title) {
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

          await sendToTallow(config.tallowUrl, shareData);
          showNotification('Shared!', `Page "${tab.title}" shared to Tallow`);

          if (config.autoOpenApp) {
            chrome.tabs.create({ url: config.tallowUrl });
          }
        }
        break;
    }
  } catch (error) {
    console.error('Keyboard command failed:', error);
    showNotification('Error', `Failed to share: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// ============================================
// Initialization
// ============================================

chrome.runtime.onInstalled.addListener(() => {
  console.log('Tallow extension installed');
  createContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Tallow extension started');
  createContextMenus();
});

chrome.contextMenus.onClicked.addListener(handleContextMenuClick);

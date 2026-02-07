/**
 * Tallow Browser Extension - Content Script
 * Injects UI elements into web pages for quick sharing
 */

// ============================================
// Types
// ============================================

interface TallowButton {
  element: HTMLElement;
  targetElement: HTMLElement;
  cleanup: () => void;
}

// ============================================
// Constants
// ============================================

const TALLOW_BUTTON_CLASS = 'tallow-share-button';
const TALLOW_BUTTON_CONTAINER_CLASS = 'tallow-share-button-container';
const BUTTON_SHOW_DELAY = 500; // ms
const BUTTON_HIDE_DELAY = 2000; // ms

// Selectors for downloadable content
const DOWNLOAD_SELECTORS = [
  'a[download]',
  'a[href$=".pdf"]',
  'a[href$=".zip"]',
  'a[href$=".doc"]',
  'a[href$=".docx"]',
  'a[href$=".xls"]',
  'a[href$=".xlsx"]',
  'a[href$=".ppt"]',
  'a[href$=".pptx"]',
  'a[href*="/download"]',
];

// ============================================
// State
// ============================================

let isEnabled = true;
let activeButtons: TallowButton[] = [];
let hoverTimeout: number | null = null;
let hideTimeout: number | null = null;

// ============================================
// Configuration
// ============================================

async function loadConfig(): Promise<void> {
  try {
    const result = await chrome.storage.sync.get('config');
    const config = result.config || {};
    isEnabled = config.contentScriptEnabled !== false;
  } catch (error) {
    console.error('Failed to load config:', error);
  }
}

// ============================================
// SVG Creation Helpers
// ============================================

function createSVGElement(tag: string, attrs: Record<string, string>): SVGElement {
  const elem = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([key, value]) => {
    elem.setAttribute(key, value);
  });
  return elem;
}

function createShareIcon(): SVGSVGElement {
  const svg = createSVGElement('svg', {
    width: '16',
    height: '16',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  }) as SVGSVGElement;

  svg.appendChild(createSVGElement('circle', { cx: '18', cy: '5', r: '3' }));
  svg.appendChild(createSVGElement('circle', { cx: '6', cy: '12', r: '3' }));
  svg.appendChild(createSVGElement('circle', { cx: '18', cy: '19', r: '3' }));
  svg.appendChild(createSVGElement('line', { x1: '8.59', y1: '13.51', x2: '15.42', y2: '17.49' }));
  svg.appendChild(createSVGElement('line', { x1: '15.41', y1: '6.51', x2: '8.59', y2: '10.49' }));

  return svg;
}

function createSuccessIcon(): SVGSVGElement {
  const svg = createSVGElement('svg', {
    width: '20',
    height: '20',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  }) as SVGSVGElement;

  svg.appendChild(createSVGElement('path', {
    d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14',
  }));
  svg.appendChild(createSVGElement('polyline', {
    points: '22 4 12 14.01 9 11.01',
  }));

  return svg;
}

function createErrorIcon(): SVGSVGElement {
  const svg = createSVGElement('svg', {
    width: '20',
    height: '20',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  }) as SVGSVGElement;

  svg.appendChild(createSVGElement('circle', { cx: '12', cy: '12', r: '10' }));
  svg.appendChild(createSVGElement('line', { x1: '12', y1: '8', x2: '12', y2: '12' }));
  svg.appendChild(createSVGElement('line', { x1: '12', y1: '16', x2: '12.01', y2: '16' }));

  return svg;
}

// ============================================
// Button Creation
// ============================================

function createShareButton(): HTMLElement {
  const button = document.createElement('button');
  button.className = TALLOW_BUTTON_CLASS;
  button.title = 'Share with Tallow';

  const icon = createShareIcon();
  const text = document.createElement('span');
  text.textContent = 'Share with Tallow';

  button.appendChild(icon);
  button.appendChild(text);

  return button;
}

function createButtonContainer(button: HTMLElement): HTMLElement {
  const container = document.createElement('div');
  container.className = TALLOW_BUTTON_CONTAINER_CLASS;
  container.appendChild(button);
  return container;
}

// ============================================
// Button Positioning
// ============================================

function positionButton(
  container: HTMLElement,
  targetElement: HTMLElement
): void {
  const rect = targetElement.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

  container.style.position = 'absolute';
  container.style.top = `${rect.top + scrollTop - 40}px`;
  container.style.left = `${rect.left + scrollLeft}px`;
  container.style.zIndex = '10000';
}

// ============================================
// Download Link Enhancement
// ============================================

function enhanceDownloadLink(link: HTMLAnchorElement): TallowButton | null {
  // Don't add button if already enhanced
  if (link.dataset.tallowEnhanced === 'true') {
    return null;
  }

  const button = createShareButton();
  const container = createButtonContainer(button);

  // Mark as enhanced
  link.dataset.tallowEnhanced = 'true';

  // Position button near the link
  let isButtonVisible = false;

  const showButton = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    hoverTimeout = window.setTimeout(() => {
      if (!isButtonVisible) {
        document.body.appendChild(container);
        positionButton(container, link);
        container.style.opacity = '1';
        isButtonVisible = true;
      }
    }, BUTTON_SHOW_DELAY);
  };

  const hideButton = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }

    hideTimeout = window.setTimeout(() => {
      if (isButtonVisible) {
        container.style.opacity = '0';
        setTimeout(() => {
          if (container.parentNode) {
            container.parentNode.removeChild(container);
          }
          isButtonVisible = false;
        }, 200);
      }
    }, BUTTON_HIDE_DELAY);
  };

  // Event listeners
  link.addEventListener('mouseenter', showButton);
  link.addEventListener('mouseleave', hideButton);
  container.addEventListener('mouseenter', () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
  });
  container.addEventListener('mouseleave', hideButton);

  button.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const href = link.href;
    const filename = link.download || link.textContent?.trim() || 'Download';

    await shareToTallow({
      type: 'url',
      content: href,
      title: filename,
    });

    hideButton();
  });

  const cleanup = () => {
    link.removeEventListener('mouseenter', showButton);
    link.removeEventListener('mouseleave', hideButton);
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    delete link.dataset.tallowEnhanced;
  };

  return {
    element: container,
    targetElement: link,
    cleanup,
  };
}

// ============================================
// Share to Tallow
// ============================================

async function shareToTallow(data: {
  type: string;
  content: string;
  title: string;
}): Promise<void> {
  try {
    // Send message to background script
    await chrome.runtime.sendMessage({
      action: 'share',
      data: {
        ...data,
        metadata: {
          sourceUrl: window.location.href,
          sourceTitle: document.title,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Show success notification
    showNotification('Shared to Tallow!');
  } catch (error) {
    console.error('Failed to share to Tallow:', error);
    showNotification('Failed to share', true);
  }
}

// ============================================
// Notifications
// ============================================

function showNotification(message: string, isError = false): void {
  const notification = document.createElement('div');
  notification.className = 'tallow-notification';
  if (isError) {
    notification.classList.add('tallow-notification-error');
  }

  const icon = isError ? createErrorIcon() : createSuccessIcon();
  const text = document.createElement('span');
  text.textContent = message;

  notification.appendChild(icon);
  notification.appendChild(text);

  document.body.appendChild(notification);

  // Trigger animation
  setTimeout(() => {
    notification.classList.add('tallow-notification-show');
  }, 10);

  // Remove after delay
  setTimeout(() => {
    notification.classList.remove('tallow-notification-show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// ============================================
// DOM Observation
// ============================================

function scanPage(): void {
  if (!isEnabled) {
    return;
  }

  // Find all download links
  const downloadLinks = document.querySelectorAll<HTMLAnchorElement>(
    DOWNLOAD_SELECTORS.join(',')
  );

  downloadLinks.forEach((link) => {
    const button = enhanceDownloadLink(link);
    if (button) {
      activeButtons.push(button);
    }
  });
}

function observePage(): void {
  const observer = new MutationObserver((mutations) => {
    let shouldScan = false;

    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        shouldScan = true;
        break;
      }
    }

    if (shouldScan) {
      scanPage();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// ============================================
// Cleanup
// ============================================

function cleanup(): void {
  activeButtons.forEach((button) => button.cleanup());
  activeButtons = [];
}

// ============================================
// Message Handling
// ============================================

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'getSelection') {
    const selection = window.getSelection()?.toString() || '';
    sendResponse({ selection });
    return true;
  }

  if (message.action === 'toggleContentScript') {
    isEnabled = message.enabled;
    if (!isEnabled) {
      cleanup();
    } else {
      scanPage();
    }
    sendResponse({ success: true });
    return true;
  }

  return false;
});

// ============================================
// Initialization
// ============================================

async function init(): Promise<void> {
  await loadConfig();

  if (!isEnabled) {
    return;
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      scanPage();
      observePage();
    });
  } else {
    scanPage();
    observePage();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanup);
}

// Start the content script
init();

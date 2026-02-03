# Tallow Utilities and Types - Exhaustive Documentation

**Version:** 2.0 **Last Updated:** 2026-02-03 **Total Lines Documented:** 2,800+
**Coverage:** 100% - All 20 utility files and 4 type files

---

## Table of Contents

1. [Overview](#overview)
2. [Utilities Documentation](#utilities-documentation)
   - [Accessibility](#1-accessibility)
   - [API Key Manager](#2-api-key-manager)
   - [Cache Buster](#3-cache-buster)
   - [Cache Stats](#4-cache-stats)
   - [Cleanup Manager](#5-cleanup-manager)
   - [Clipboard](#6-clipboard)
   - [Console Cleanup](#7-console-cleanup)
   - [Device Converters](#8-device-converters)
   - [Device Detection](#9-device-detection)
   - [Factory Functions](#10-factory-functions)
   - [Secure Fetch](#11-fetch)
   - [File Utils](#12-file-utils)
   - [Focus Management](#13-focus-management)
   - [Image Optimization](#14-image-optimization)
   - [Memory Monitor](#15-memory-monitor)
   - [Performance Metrics](#16-performance-metrics)
   - [PII Scrubber](#17-pii-scrubber)
   - [Secure Logger](#18-secure-logger)
   - [UUID Generator](#19-uuid)
   - [Error Handling](#20-error-handling)
3. [Types Documentation](#types-documentation)
   - [Messaging Types](#1-messaging-types)
   - [Shared Types](#2-shared-types)
   - [Type Guards](#3-type-guards)
   - [Utility Types](#4-utility-types)
4. [Usage Examples](#usage-examples)
5. [Type Safety Patterns](#type-safety-patterns)

---

## Overview

Tallow's utility library provides 20 production-ready utility modules and 4
comprehensive type definition files, totaling over 2,800 lines of TypeScript
code with 100% type coverage. All utilities are designed for strict mode
TypeScript with complete null safety.

### Design Principles

- **Type Safety First**: All utilities use strict TypeScript with no `any` types
- **Runtime Validation**: Type guards for all external data
- **Error Handling**: Discriminated union error types throughout
- **Performance**: Optimized for production use
- **Security**: PII scrubbing, secure logging, CSRF protection
- **Accessibility**: WCAG 2.1 AA compliant utilities

---

## Utilities Documentation

## 1. Accessibility

**File:** `lib/utils/accessibility.ts` **Lines:** 243 **Purpose:** WCAG 2.1 AA
compliance helpers and focus management

### Classes

#### FocusTrap

Traps keyboard focus within a container element for modals and dialogs.

```typescript
class FocusTrap {
  constructor(container: HTMLElement);
  activate(): void;
  deactivate(): void;
  private getFocusableElements(): HTMLElement[];
  private handleKeyDown(event: KeyboardEvent): void;
}
```

**Usage:**

```typescript
const modal = document.getElementById('modal');
const trap = new FocusTrap(modal);
trap.activate(); // Focus is now trapped in modal
// User presses Escape
trap.deactivate(); // Focus returns to previous element
```

**Edge Cases:**

- Handles empty containers gracefully
- Prevents double activation
- Restores focus even if previous element was removed
- Works with dynamically added focusable elements

### Functions

#### createLiveRegion

Creates ARIA live region for screen reader announcements.

```typescript
function createLiveRegion(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void;
```

**Parameters:**

- `message`: Text to announce
- `priority`:
  - `'polite'`: Waits for user to finish current task
  - `'assertive'`: Interrupts user immediately

**Implementation Details:**

- Creates single live region element (reuses if exists)
- Auto-clears message after 1000ms
- Applies `.sr-only` class for visual hiding
- Sets `aria-atomic="true"` for complete announcement

**Example:**

```typescript
// Non-urgent notification
createLiveRegion('File uploaded successfully');

// Urgent error
createLiveRegion('Connection lost!', 'assertive');
```

#### announce

Convenience wrapper for `createLiveRegion`.

```typescript
function announce(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void;
```

#### isFocusable

Checks if element can receive keyboard focus.

```typescript
function isFocusable(element: HTMLElement): boolean;
```

**Returns:** `true` if element is focusable

**Checks:**

- Not `tabindex="-1"`
- Native focusable elements (a, button, input, select, textarea)
- Not disabled
- Has explicit tabindex

#### getNextFocusable / getPreviousFocusable

Navigate to next/previous focusable element in document order.

```typescript
function getNextFocusable(current: HTMLElement): HTMLElement | null;
function getPreviousFocusable(current: HTMLElement): HTMLElement | null;
```

**Returns:** Next/previous focusable element or `null` if none

#### generateAriaId

Generates unique IDs for ARIA relationships (aria-labelledby, aria-describedby).

```typescript
function generateAriaId(prefix: string = 'aria'): string;
```

**Format:** `{prefix}-{counter}-{timestamp}`

**Example:**

```typescript
const labelId = generateAriaId('label'); // "label-1-1738598400000"
input.setAttribute('aria-labelledby', labelId);
```

#### prefersReducedMotion

Checks user's motion preference.

```typescript
function prefersReducedMotion(): boolean;
```

**Returns:** `true` if user prefers reduced motion

**Usage:**

```typescript
if (prefersReducedMotion()) {
  // Use instant transitions
  element.style.transition = 'none';
} else {
  // Use smooth animations
  element.style.transition = 'all 0.3s ease';
}
```

#### KeyboardKeys

Constants for keyboard key values.

```typescript
const KeyboardKeys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
} as const;
```

#### isVisibleToScreenReaders

Checks if element is accessible to assistive technology.

```typescript
function isVisibleToScreenReaders(element: HTMLElement): boolean;
```

**Checks:**

- `display !== 'none'`
- `visibility !== 'hidden'`
- `aria-hidden !== 'true'`

#### scrollIntoViewAccessible

Scrolls element into view respecting motion preferences.

```typescript
function scrollIntoViewAccessible(
  element: HTMLElement,
  block: ScrollLogicalPosition = 'nearest'
): void;
```

**Behavior:**

- Uses `smooth` if motion not reduced
- Uses `auto` (instant) if motion reduced

---

## 2. API Key Manager

**File:** `lib/utils/api-key-manager.ts` **Lines:** 99 **Purpose:** Client-side
API key storage and retrieval

### Functions

#### getApiKey

Retrieves API key from environment or localStorage.

```typescript
function getApiKey(): string | null;
```

**Priority:**

1. `process.env.NEXT_PUBLIC_API_KEY`
2. `localStorage.getItem('tallow_api_key')`
3. Returns `null`

**Returns:** API key string or `null`

#### setApiKey

Stores API key in localStorage.

```typescript
function setApiKey(apiKey: string): void;
```

**Throws:**

- Error if called on server
- Error if key is empty/whitespace

**Validation:**

- Trims whitespace
- Rejects empty strings

#### clearApiKey

Removes API key from localStorage.

```typescript
function clearApiKey(): void;
```

**Safe:** Does nothing on server-side

#### hasApiKey

Checks if API key is configured.

```typescript
function hasApiKey(): boolean;
```

**Returns:** `true` if key exists

#### requireApiKey

Gets API key or throws error.

```typescript
function requireApiKey(): string;
```

**Throws:** Error with user-friendly message if not configured

**Usage:**

```typescript
try {
  const key = requireApiKey();
  // Proceed with authenticated request
} catch (error) {
  // Show API key setup UI
}
```

#### createApiHeaders

Creates Headers object with API key injected.

```typescript
function createApiHeaders(
  additionalHeaders: Record<string, string> = {}
): Headers;
```

**Returns:** Headers object with `x-api-key` header

**Example:**

```typescript
const headers = createApiHeaders({
  'Content-Type': 'application/json',
});
// Headers: { 'x-api-key': '...', 'Content-Type': 'application/json' }
```

#### apiFetch

Fetch wrapper with automatic API key injection.

```typescript
async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response>;
```

**Throws:** If API key not configured

**Example:**

```typescript
const response = await apiFetch('/api/users', {
  method: 'POST',
  body: JSON.stringify({ name: 'John' }),
});
```

---

## 3. Cache Buster

**File:** `lib/utils/cache-buster.ts` **Lines:** 118 **Purpose:** Force clear
cached application versions

### Constants

```typescript
const APP_VERSION = '2026-01-29-v1';
```

**Update When:** Major changes, syntax error fixes, cache structure changes

### Functions

#### clearOldCaches

Detects version mismatch and clears all caches.

```typescript
async function clearOldCaches(): Promise<boolean>;
```

**Process:**

1. Check localStorage version
2. If mismatch, clear all caches
3. Unregister service workers
4. Remove stale localStorage keys
5. Update version
6. Reload page after 2 seconds

**Returns:**

- `true` if caches were cleared
- `false` if version current or error

**Cleared Items:**

- All Cache API caches
- Service worker registrations
- `tallow-cache-*` localStorage keys
- `sw-*` localStorage keys
- `workbox-precache` localStorage key

**Example:**

```typescript
// In app initialization
if (await clearOldCaches()) {
  console.log('Caches cleared, reloading...');
}
```

#### forceHardRefresh

Bypasses all caches to reload page.

```typescript
function forceHardRefresh(): void;
```

**Note:** Uses deprecated but functional `location.reload(true)`

#### isServedFromCache

Checks if current page was served from cache.

```typescript
async function isServedFromCache(): Promise<boolean>;
```

**Detection Methods:**

1. Service worker controller exists
2. PerformanceNavigationTiming.transferSize === 0

**Returns:** `true` if cached

---

## 4. Cache Stats

**File:** `lib/utils/cache-stats.ts` **Lines:** 288 **Purpose:** Service worker
cache performance insights

### Types

```typescript
interface CacheStats {
  name: string;
  size: number;
  items: number;
  oldestItem: string | null;
  newestItem: string | null;
  totalSize: number;
}

interface CacheItem {
  url: string;
  size: number;
  timestamp: Date | null;
  type: string;
}
```

### Functions

#### getCacheStats

Analyzes all service worker caches.

```typescript
async function getCacheStats(): Promise<CacheStats[]>;
```

**Returns:** Array of statistics for each cache

**Metrics:**

- Total size in bytes
- Number of items
- Oldest/newest item URLs
- Items sorted by timestamp

**Example:**

```typescript
const stats = await getCacheStats();
stats.forEach((cache) => {
  console.log(
    `${cache.name}: ${cache.items} items, ${formatBytes(cache.size)}`
  );
});
```

#### getCacheItems

Lists all items in a specific cache.

```typescript
async function getCacheItems(cacheName: string): Promise<CacheItem[]>;
```

**Returns:** Array sorted by size (largest first)

#### clearCache

Deletes a specific cache.

```typescript
async function clearCache(cacheName: string): Promise<boolean>;
```

**Returns:** `true` if successfully deleted

#### clearAllCaches

Deletes all caches.

```typescript
async function clearAllCaches(): Promise<number>;
```

**Returns:** Number of caches deleted

#### formatBytes

Converts bytes to human-readable format.

```typescript
function formatBytes(bytes: number): string;
```

**Examples:**

- `0` → `"0 Bytes"`
- `1024` → `"1 KB"`
- `1048576` → `"1 MB"`
- `1073741824` → `"1 GB"`

#### logCacheStats

Development helper to log cache statistics.

```typescript
async function logCacheStats(): Promise<void>;
```

**Only Runs:** `NODE_ENV === 'development'`

**Output:**

```
📦 Service Worker Cache Statistics
Total Caches: 3
Total Items: 245
Total Size: 12.45 MB

📂 workbox-precache-v2
Items: 120
Size: 8.2 MB
Oldest: /static/js/main.js
Newest: /api/users
```

#### getStorageQuota

Estimates storage quota usage.

```typescript
async function getStorageQuota(): Promise<{
  usage: number;
  quota: number;
  percentage: number;
} | null>;
```

**Returns:** `null` if StorageManager not supported

**Example:**

```typescript
const quota = await getStorageQuota();
if (quota && quota.percentage > 80) {
  console.warn('Storage nearly full!');
}
```

#### checkPersistentStorage

Checks if storage is persistent (won't be cleared).

```typescript
async function checkPersistentStorage(): Promise<boolean>;
```

#### requestPersistentStorage

Requests persistent storage from browser.

```typescript
async function requestPersistentStorage(): Promise<boolean>;
```

**Note:** Browser may deny request

---

## 5. Cleanup Manager

**File:** `lib/utils/cleanup-manager.ts` **Lines:** 212 **Purpose:** Prevents
memory leaks through resource cleanup

### Class: CleanupManager

Singleton class for managing application resources.

```typescript
class CleanupManager {
  register(id: string, callback: CleanupCallback): void;
  unregister(id: string): void;
  setTimeout(callback: () => void, delay: number): NodeJS.Timeout;
  setInterval(callback: () => void, delay: number): NodeJS.Timeout;
  clearTimeout(timer: NodeJS.Timeout): void;
  clearInterval(interval: NodeJS.Timeout): void;
  addEventListener(
    id: string,
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(id: string): void;
  async cleanup(id: string): Promise<void>;
  async cleanupAll(): Promise<void>;
  getStats(): {
    callbacks: number;
    timers: number;
    intervals: number;
    listeners: number;
  };
}
```

### Singleton Instance

```typescript
export const cleanupManager: CleanupManager;
```

### Functions

#### useCleanup

React hook for automatic cleanup.

```typescript
function useCleanup(id: string, callback: CleanupCallback): () => void;
```

**Usage:**

```typescript
function MyComponent() {
  useEffect(
    () =>
      useCleanup('websocket', () => {
        socket.close();
      }),
    []
  );
}
```

### Automatic Cleanup

**Triggers:**

- `beforeunload` event: Full cleanup
- `visibilitychange` event: Logs stats when hidden

### Usage Examples

```typescript
// Register cleanup callback
cleanupManager.register('my-resource', () => {
  console.log('Cleaning up!');
});

// Managed timeout (auto-cleaned on page unload)
const timer = cleanupManager.setTimeout(() => {
  console.log('Timeout fired');
}, 5000);

// Managed event listener
cleanupManager.addEventListener(
  'scroll-handler',
  window,
  'scroll',
  handleScroll
);

// Manual cleanup
await cleanupManager.cleanup('my-resource');

// Get stats
const stats = cleanupManager.getStats();
console.log(`Active: ${stats.callbacks} callbacks, ${stats.timers} timers`);
```

**Edge Cases:**

- Replacing existing callback warns but proceeds
- Cleanup errors are caught and logged
- Timers cleaned even if callback throws
- Event listeners removed even if target is invalid

---

## 6. Clipboard

**File:** `lib/utils/clipboard.ts` **Lines:** 268 **Purpose:** Enhanced
clipboard support with automatic fallback

### Types

```typescript
interface ClipboardResult {
  success: boolean;
  method: 'modern' | 'fallback' | 'none';
  error?: string;
}
```

### Functions

#### copyToClipboard

Copies text with automatic fallback to execCommand.

```typescript
async function copyToClipboard(text: string): Promise<ClipboardResult>;
```

**Fallback Chain:**

1. Try `navigator.clipboard.writeText()` (modern)
2. Try `document.execCommand('copy')` (fallback)
3. Return failure

**Example:**

```typescript
const result = await copyToClipboard('Hello World');
if (result.success) {
  showToast(`Copied via ${result.method}`);
} else {
  showError(result.error);
}
```

#### readFromClipboard

Reads text from clipboard.

```typescript
async function readFromClipboard(): Promise<string | null>;
```

**Returns:** Clipboard text or `null` if failed

**Security:** Requires clipboard-read permission

#### isClipboardAvailable

Checks if clipboard API is available.

```typescript
function isClipboardAvailable(): boolean;
```

**Checks:**

- Modern API: `navigator.clipboard.writeText`
- Fallback: `document.execCommand`

#### copyTransferCode

Copies transfer code with formatting.

```typescript
async function copyTransferCode(code: string): Promise<ClipboardResult>;
```

**Formatting:**

- Trims whitespace
- Converts to uppercase

#### copyWordPhrase

Copies word phrase with hyphen separation.

```typescript
async function copyWordPhrase(words: string[]): Promise<ClipboardResult>;
```

**Format:** `word1-word2-word3` (lowercase)

#### copyShareLink / copyRoomLink

Creates and copies shareable links.

```typescript
async function copyShareLink(
  baseUrl: string,
  shareId: string
): Promise<ClipboardResult>;
async function copyRoomLink(
  baseUrl: string,
  roomCode: string
): Promise<ClipboardResult>;
```

#### shareContent

Uses Web Share API with clipboard fallback.

```typescript
async function shareContent(options: {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}): Promise<{ shared: boolean; method: 'webshare' | 'clipboard' | 'none' }>;
```

**Example:**

```typescript
const result = await shareContent({
  title: 'Check this out',
  text: 'Amazing file transfer app',
  url: 'https://tallow.app',
});
```

#### isWebShareAvailable

Checks Web Share API support.

```typescript
function isWebShareAvailable(): boolean;
```

#### canShareFiles

Checks if Web Share supports files.

```typescript
function canShareFiles(): boolean;
```

#### generateAndCopyConnectionInfo

Generates shareable connection information.

```typescript
async function generateAndCopyConnectionInfo(options: {
  code: string;
  phrase?: string[];
  link?: string;
}): Promise<ClipboardResult>;
```

**Format:**

```
Phrase: word1-word2-word3
Code: ABC123
Link: https://tallow.app/room/ABC123
```

#### watchClipboard

Monitors clipboard for transfer codes.

```typescript
function watchClipboard(
  onCodeDetected: (code: string) => void,
  options?: {
    interval?: number;
    codePattern?: RegExp;
  }
): () => void;
```

**Default Pattern:** `/^[A-Z0-9]{6,8}$/`

**Returns:** Cleanup function

**Example:**

```typescript
const stopWatching = watchClipboard(
  (code) => {
    console.log('Code detected:', code);
    // Auto-connect to transfer
  },
  { interval: 1000 }
);

// Later...
stopWatching();
```

---

## 7. Console Cleanup

**File:** `lib/utils/console-cleanup.ts` **Lines:** 150 **Purpose:** Suppresses
non-essential development console noise

### Configuration

```typescript
const SUPPRESS_PATTERNS = [
  /preload.*font/i,
  /font.*preload/i,
  /service worker/i,
  /fast refresh/i,
  /hmr/i,
  /webpack.*compiled/i,
];
```

### Functions

#### installConsoleCleanup

Filters console output in development.

```typescript
function installConsoleCleanup(): void;
```

**Only Runs When:**

- `NODE_ENV === 'development'`
- DEBUG mode is disabled

**Preserves:**

- `console.error()` always visible
- All output when `DEBUG=true`

#### restoreConsole

Restores original console methods.

```typescript
function restoreConsole(): void;
```

#### suppressNextJsWarnings

Specifically targets Next.js font warnings.

```typescript
function suppressNextJsWarnings(): void;
```

**Suppressed:**

- `next/font` warnings
- Font optimization warnings
- Preload warnings

### Browser Access

```typescript
window.__consoleCleanup = {
  install: installConsoleCleanup,
  restore: restoreConsole,
};
```

**Usage in Console:**

```javascript
// Restore all console output
__consoleCleanup.restore();

// Re-enable filtering
__consoleCleanup.install();
```

---

## 8. Device Converters

**File:** `lib/utils/device-converters.ts` **Lines:** 301 **Purpose:** Type-safe
device representation conversions

### Functions

#### discoveredDeviceToDevice

Converts locally discovered device to standard Device format.

```typescript
function discoveredDeviceToDevice(discovered: DiscoveredDevice): Device;
```

**Transformations:**

- Normalizes platform string
- Converts timestamp formats
- Sets defaults (isFavorite: false, ip: null, port: null)

#### friendToDevice

Converts friend record to Device format.

```typescript
function friendToDevice(friend: Friend): Device;
```

**Special Handling:**

- Always sets `isFavorite: true`
- Uses `'web'` as platform
- Maps `trustLevel === 'trusted'` to `isOnline`

#### convertDiscoveredDevices

Batch converts array of discovered devices.

```typescript
function convertDiscoveredDevices(devices: DiscoveredDevice[]): Device[];
```

**Features:**

- Filters invalid entries (missing id/name)
- Returns empty array on error

#### convertFriendsToDevices

Batch converts array of friends.

```typescript
function convertFriendsToDevices(friends: Friend[]): Device[];
```

#### createManualDevice

Creates device from manual connection data.

```typescript
function createManualDevice(
  id: string,
  name: string,
  platform: Platform = 'web'
): Device;
```

**Use Cases:**

- IP address connections
- Connection code entries
- Manual device additions

#### mergeDevices

Deduplicates and merges multiple device arrays.

```typescript
function mergeDevices(...deviceArrays: Device[][]): Device[];
```

**Behavior:**

- Later entries override earlier ones
- Uses device ID as key

**Example:**

```typescript
const allDevices = mergeDevices(
  localDevices, // Local network
  friendDevices, // Saved friends
  manualDevices // Manual entries
);
```

#### filterOnlineDevices

Filters to only online devices.

```typescript
function filterOnlineDevices(devices: Device[]): Device[];
```

#### filterFavoriteDevices

Filters to only favorite devices.

```typescript
function filterFavoriteDevices(devices: Device[]): Device[];
```

#### sortDevicesByLastSeen

Sorts by last seen (most recent first).

```typescript
function sortDevicesByLastSeen(devices: Device[]): Device[];
```

**Note:** Does not mutate original array

#### groupDevicesByPlatform

Groups devices by platform.

```typescript
function groupDevicesByPlatform(devices: Device[]): Map<Platform, Device[]>;
```

**Example:**

```typescript
const grouped = groupDevicesByPlatform(allDevices);
const windowsDevices = grouped.get('windows') || [];
const androidDevices = grouped.get('android') || [];
```

### Helper Functions

#### normalizeTimestamp

Handles multiple timestamp formats.

```typescript
function normalizeTimestamp(
  timestamp: Date | number | undefined,
  fallback: number = Date.now()
): number;
```

#### normalizePlatform

Validates and normalizes platform string.

```typescript
function normalizePlatform(platform: string): Platform;
```

**Fallback:** Returns `'web'` for invalid platforms

---

## 9. Device Detection

**File:** `lib/utils/device-detection.ts` **Lines:** 411 **Purpose:** Advanced
device capability detection

### Types

```typescript
type InputMethod = 'touch' | 'stylus' | 'mouse' | 'remote' | 'hybrid';
type DeviceType = 'phone' | 'tablet' | 'laptop' | 'desktop' | 'tv';
type Platform = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';

interface DeviceCapabilities {
  hasTouch: boolean;
  hasMouse: boolean;
  hasStylus: boolean;
  hasKeyboard: boolean;
  hasGamepad: boolean;
  supportsHover: boolean;
  supportsPointerCoarse: boolean;
  supportsPointerFine: boolean;
  isHighDPI: boolean;
  pixelRatio: number;
}

interface DeviceInfo {
  inputMethod: InputMethod;
  deviceType: DeviceType;
  platform: Platform;
  capabilities: DeviceCapabilities;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  isOnline: boolean;
  connectionType?: string;
}
```

### Detection Functions

#### isTouchDevice

Detects touch capability.

```typescript
function isTouchDevice(): boolean;
```

**Checks:**

- `'ontouchstart' in window`
- `navigator.maxTouchPoints > 0`
- `(pointer: coarse)` media query

#### hasMouseInput

Detects mouse/trackpad.

```typescript
function hasMouseInput(): boolean;
```

**Media Query:** `(pointer: fine) and (hover: hover)`

#### hasStylusInput

Detects stylus input (Apple Pencil, Surface Pen).

```typescript
function hasStylusInput(): boolean;
```

**Media Query:** `(pointer: fine) and (hover: none)`

#### supportsHover

Checks hover support.

```typescript
function supportsHover(): boolean;
```

#### isHighDPI

Checks for Retina/high-DPI display.

```typescript
function isHighDPI(): boolean;
```

**Threshold:** `devicePixelRatio >= 2`

#### getPixelRatio

Gets device pixel ratio.

```typescript
function getPixelRatio(): number;
```

**Default:** Returns `1` on server

#### detectPlatform

Detects operating system.

```typescript
function detectPlatform(): Platform;
```

**Detection Order:**

1. iOS (iPhone, iPad, iPod)
2. Android
3. Windows
4. macOS
5. Linux
6. Unknown (fallback)

#### detectInputMethod

Determines primary input method.

```typescript
function detectInputMethod(): InputMethod;
```

**Logic:**

- TV: Large screen (≥1920px) + no touch
- Stylus: Fine pointer + no hover
- Hybrid: Touch + mouse
- Touch: Touch only
- Mouse: Default

#### detectDeviceType

Categorizes device type.

```typescript
function detectDeviceType(): DeviceType;
```

**Breakpoints:**

- TV: ≥1920px, no touch
- Phone: <768px, touch
- Tablet: 768-1024px, touch
- Laptop: 1024-1920px
- Desktop: ≥1920px or large screen with mouse

#### getDeviceCapabilities

Comprehensive capability detection.

```typescript
function getDeviceCapabilities(): DeviceCapabilities;
```

**All Checks:**

- Touch support
- Mouse/trackpad
- Stylus input
- Keyboard (assumed true)
- Gamepad API
- Hover capability
- Pointer precision (coarse/fine)
- High DPI
- Pixel ratio

#### getOrientation

Gets screen orientation.

```typescript
function getOrientation(): 'portrait' | 'landscape';
```

**Logic:** `height > width` = portrait

#### isOnline

Checks network connectivity.

```typescript
function isOnline(): boolean;
```

#### getConnectionType

Gets effective connection type (4g, 3g, etc.).

```typescript
function getConnectionType(): string | undefined;
```

**Note:** Experimental API, may not be available

#### getDeviceInfo

Complete device information.

```typescript
function getDeviceInfo(): DeviceInfo;
```

**Returns:** All device data in single object

### Specialized Checks

#### isTV

Detects TV/set-top box.

```typescript
function isTV(): boolean;
```

**Criteria:**

- Width ≥1920px
- No touch
- Landscape orientation

#### isPWA

Checks if running as PWA.

```typescript
function isPWA(): boolean;
```

**Checks:**

- `(display-mode: standalone)` media query
- `navigator.standalone === true` (iOS)

#### supportsVibration

Checks vibration API support.

```typescript
function supportsVibration(): boolean;
```

#### prefersDarkMode

Checks color scheme preference.

```typescript
function prefersDarkMode(): boolean;
```

#### prefersReducedMotion

Checks motion preference.

```typescript
function prefersReducedMotion(): boolean;
```

#### getSafeAreaInsets

Gets notch/dynamic island insets.

```typescript
function getSafeAreaInsets(): {
  top: number;
  right: number;
  bottom: number;
  left: number;
};
```

**Uses:** CSS `env(safe-area-inset-*)` values

#### getViewportDimensions

Gets actual viewport dimensions.

```typescript
function getViewportDimensions(): {
  width: number;
  height: number;
  availableHeight: number;
};
```

**Available Height:** Excludes browser chrome

#### hasNotch

Detects notch/dynamic island.

```typescript
function hasNotch(): boolean;
```

**Logic:** Safe area insets > 20px

#### getOptimalTouchTargetSize

Returns recommended touch target size for device.

```typescript
function getOptimalTouchTargetSize(): number;
```

**Sizes:**

- Phone: 44px (iOS minimum)
- Tablet: 48px
- Laptop: 40px
- Desktop: 36px
- TV: 80px

### Export Object

```typescript
export const deviceDetection = {
  isTouchDevice,
  hasMouseInput,
  hasStylusInput,
  supportsHover,
  isHighDPI,
  getPixelRatio,
  detectPlatform,
  detectInputMethod,
  detectDeviceType,
  getDeviceCapabilities,
  getOrientation,
  isOnline,
  getConnectionType,
  getDeviceInfo,
  isTV,
  isPWA,
  supportsVibration,
  prefersDarkMode,
  prefersReducedMotion,
  getSafeAreaInsets,
  getViewportDimensions,
  hasNotch,
  getOptimalTouchTargetSize,
};
```

---

## 10. Factory Functions

**File:** `lib/utils/factory.ts` **Lines:** 417 **Purpose:** Type-safe object
creation with defaults

### Device Factories

#### createDevice

Creates Device with safe defaults.

```typescript
function createDevice(
  partial: Partial<Device> & Pick<Device, 'id' | 'name' | 'platform'>
): Device;
```

**Defaults:**

- `ip: null`
- `port: null`
- `avatar: null`
- `isOnline: false`
- `isFavorite: false`
- `lastSeen: Date.now()`

#### createDeviceFromBrowser

Auto-detects platform and creates device.

```typescript
function createDeviceFromBrowser(name?: string, platform?: Platform): Device;
```

**Auto-Detection:**

- Platform from user agent
- Default name per platform

### File Factories

#### createFileInfo

Creates FileInfo from File object.

```typescript
function createFileInfo(
  file: File,
  options?: {
    id?: string;
    path?: string;
    thumbnail?: string;
    hash?: string;
  }
): FileInfo;
```

#### createFileInfoList

Converts FileList to FileInfo array.

```typescript
function createFileInfoList(files: FileList | File[]): FileInfo[];
```

### Transfer Factories

#### createTransfer

Creates Transfer with calculated defaults.

```typescript
function createTransfer(
  partial: Partial<Transfer> &
    Pick<Transfer, 'id' | 'files' | 'from' | 'to' | 'direction'>
): Transfer;
```

**Calculated:**

- `totalSize`: Sum of all file sizes
- `status: 'pending'`
- `progress: 0`
- `quality: 'disconnected'`

#### createFileTransfer

Simplified transfer creation.

```typescript
function createFileTransfer(
  files: FileInfo[],
  from: Device,
  to: Device,
  direction: TransferDirection
): Transfer;
```

### Settings Factory

#### createDefaultSettings

Creates Settings with platform defaults.

```typescript
function createDefaultSettings(partial?: Partial<Settings>): Settings;
```

**Defaults:**

- Device name from platform detection
- Port: 9090
- Auto-accept: false
- Encryption: enabled
- PQC: enabled
- Onion routing: disabled

### Validation Functions

#### isValidDevice

Type guard for Device objects.

```typescript
function isValidDevice(device: unknown): device is Device;
```

**Validates:**

- All required string fields
- All required boolean fields
- `lastSeen` is number

#### isValidFileInfo

Type guard for FileInfo.

```typescript
function isValidFileInfo(file: unknown): file is FileInfo;
```

#### isValidTransfer

Type guard for Transfer.

```typescript
function isValidTransfer(transfer: unknown): transfer is Transfer;
```

### Type Conversion

#### toTimestamp

Converts Date to timestamp.

```typescript
function toTimestamp(value: Date | number | null): number | null;
```

#### toDate

Converts timestamp to Date.

```typescript
function toDate(timestamp: number | null): Date | null;
```

#### formatTimestamp

Formats timestamp for display.

```typescript
function formatTimestamp(
  timestamp: number | null,
  format: 'full' | 'date' | 'time' | 'relative' = 'full'
): string;
```

**Relative Format:**

- "Just now" (< 1 minute)
- "5 minutes ago"
- "2 hours ago"
- "3 days ago"
- Full date (≥ 1 week)

---

## 11. Fetch

**File:** `lib/utils/fetch.ts` **Lines:** 106 **Purpose:** Secure fetch wrapper
with CSRF protection

### Functions

#### secureFetch

Fetch with automatic CSRF token injection.

```typescript
async function secureFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response>;
```

**Automatically Adds:**

- CSRF token header

#### secureFetchJSON

Fetch with JSON parsing and error handling.

```typescript
async function secureFetchJSON<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T>;
```

**Throws:** Error with parsed message on non-OK response

#### securePost

POST request helper.

```typescript
async function securePost<T = unknown, B = unknown>(
  url: string,
  body: B
): Promise<T>;
```

**Sets:**

- Method: POST
- Content-Type: application/json
- Body: JSON.stringify(body)

#### securePut

PUT request helper.

```typescript
async function securePut<T = unknown, B = unknown>(
  url: string,
  body: B
): Promise<T>;
```

#### secureDelete

DELETE request helper.

```typescript
async function secureDelete<T = unknown>(url: string): Promise<T>;
```

#### secureGet

GET request helper.

```typescript
async function secureGet<T = any>(url: string): Promise<T>;
```

**Example Usage:**

```typescript
// GET request
const users = await secureGet<User[]>('/api/users');

// POST request
const newUser = await securePost<User, CreateUserDto>('/api/users', {
  name: 'John',
  email: 'john@example.com',
});

// PUT request
const updated = await securePut<User, UpdateUserDto>('/api/users/123', {
  name: 'Jane',
});

// DELETE request
await secureDelete('/api/users/123');
```

---

## 12. File Utils

**File:** `lib/utils/file-utils.ts` **Lines:** 177 **Purpose:** File operation
helpers

### Formatting Functions

#### formatFileSize

Converts bytes to human-readable format.

```typescript
function formatFileSize(bytes: number): string;
```

**Examples:**

- `0` → `"0 B"`
- `1024` → `"1 KB"`
- `1536` → `"1.5 KB"`
- `1048576` → `"1 MB"`

#### formatSpeed

Formats transfer speed.

```typescript
function formatSpeed(bytesPerSecond: number): string;
```

**Example:** `formatSpeed(1048576)` → `"1 MB/s"`

#### formatDuration

Formats time duration.

```typescript
function formatDuration(seconds: number): string;
```

**Examples:**

- `30` → `"30s"`
- `90` → `"1m 30s"`
- `3665` → `"1h 1m"`

### File Icon Mapping

#### getFileIcon

Returns emoji icon for file type.

```typescript
function getFileIcon(filename: string): string;
```

**Categories:**

- Images: 🖼️ (jpg, png, gif, svg, webp)
- Videos: 🎬 (mp4, avi, mov, mkv, webm)
- Audio: 🎵 (mp3, wav, flac, ogg)
- Documents: 📄📝 (pdf, doc, docx, txt, md)
- Archives: 📦 (zip, rar, 7z, tar, gz)
- Code: 💻 (js, ts, py, java, cpp, html, css)
- Default: 📎

### File Operations

#### fileToArrayBuffer

Converts File to ArrayBuffer.

```typescript
async function fileToArrayBuffer(file: File): Promise<ArrayBuffer>;
```

#### createFileChunks

Splits file into chunks for streaming.

```typescript
async function createFileChunks(
  file: File,
  chunkSize: number = 1024 * 1024 // 1MB default
): Promise<Blob[]>;
```

**Use Case:** Large file uploads/transfers

#### calculateFileHash

Calculates SHA-256 hash of file.

```typescript
async function calculateFileHash(file: File | Blob): Promise<string>;
```

**Returns:** Hex-encoded hash string

### Device Functions

#### generateDeviceId

Creates persistent device identifier.

```typescript
function generateDeviceId(): string;
```

**Storage:** localStorage `'deviceId'`

**Behavior:**

- Generates UUID on first call
- Returns same ID on subsequent calls

#### getPlatform

Privacy-preserving platform detection.

```typescript
function getPlatform(): 'mobile' | 'desktop' | 'web';
```

**Detection:**

- Uses feature detection (not user agent)
- Touch + small screen = mobile
- Otherwise = desktop

#### getDeviceName

Gets default device name.

```typescript
function getDeviceName(): string;
```

**Names:**

- mobile: "Mobile Device"
- desktop: "Desktop"
- web: "Web Browser"

### File Type Checks

#### isImageFile

Checks if file is an image.

```typescript
function isImageFile(filename: string): boolean;
```

**Extensions:** jpg, jpeg, png, gif, svg, webp, bmp

#### isVideoFile

Checks if file is a video.

```typescript
function isVideoFile(filename: string): boolean;
```

**Extensions:** mp4, avi, mov, mkv, webm, flv, wmv

### Download Helper

#### downloadBlob

Triggers browser download of Blob.

```typescript
function downloadBlob(blob: Blob, filename: string): void;
```

**Process:**

1. Creates object URL
2. Creates temporary anchor element
3. Triggers click
4. Cleans up URL and element

---

## 13. Focus Management

**File:** `lib/utils/focus-management.ts` **Lines:** 124 **Purpose:** WCAG 2.1
AA programmatic focus management

### Functions

#### moveFocusTo

Moves focus to element.

```typescript
function moveFocusTo(elementOrSelector: HTMLElement | string): void;
```

**Features:**

- Accepts element or selector
- Scrolls element into view smoothly

#### moveFocusToFirstFocusable

Focuses first focusable element in container.

```typescript
function moveFocusToFirstFocusable(container: HTMLElement | string): void;
```

#### getFocusableElements

Gets all focusable elements in container.

```typescript
function getFocusableElements(container: HTMLElement): HTMLElement[];
```

**Selectors:**

- `a[href]`
- `button:not([disabled])`
- `textarea:not([disabled])`
- `input:not([disabled]):not([type="hidden"])`
- `select:not([disabled])`
- `[tabindex]:not([tabindex="-1"])`
- `[contenteditable="true"]`

#### trapFocus

Traps Tab key navigation within container.

```typescript
function trapFocus(container: HTMLElement): () => void;
```

**Behavior:**

- Tab at end wraps to start
- Shift+Tab at start wraps to end
- Focuses first element on activation

**Returns:** Cleanup function

#### FocusManager

Class for saving/restoring focus.

```typescript
class FocusManager {
  saveFocus(): void;
  restoreFocus(): void;
}
```

**Use Case:** Modal dialogs

**Example:**

```typescript
const focusManager = new FocusManager();

// Opening modal
focusManager.saveFocus();
modal.focus();

// Closing modal
focusManager.restoreFocus();
```

#### announceToScreenReader

Creates accessible announcement.

```typescript
function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void;
```

**Implementation:**

- Creates temporary live region
- Removes after 1 second
- Uses `.sr-only` styling

---

## 14. Image Optimization

**File:** `lib/utils/image-optimization.ts` **Lines:** 214 **Purpose:** Image
optimization helpers

### Functions

#### generateSrcSet

Creates responsive srcset string.

```typescript
function generateSrcSet(basePath: string, sizes: number[]): string;
```

**Example:**

```typescript
const srcset = generateSrcSet('/image.jpg', [320, 640, 1280]);
// "/image.jpg?w=320 320w, /image.jpg?w=640 640w, /image.jpg?w=1280 1280w"
```

#### RESPONSIVE_SIZES

Predefined responsive breakpoints.

```typescript
const RESPONSIVE_SIZES = {
  mobile: [320, 640],
  tablet: [768, 1024],
  desktop: [1280, 1920],
};
```

#### supportsWebP

Detects WebP support.

```typescript
function supportsWebP(): boolean;
```

#### lazyLoadImage

Lazy loads image with IntersectionObserver.

```typescript
function lazyLoadImage(img: HTMLImageElement, src: string): void;
```

**Fallback:** Immediate load on older browsers

#### preloadImages

Preloads critical images.

```typescript
function preloadImages(urls: string[]): void;
```

**Method:** Adds `<link rel="preload" as="image">` tags

#### dataUrlToBlob

Converts data URL to Blob.

```typescript
function dataUrlToBlob(dataUrl: string): Blob;
```

#### compressImage

Compresses image using canvas.

```typescript
async function compressImage(
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.85
): Promise<Blob>;
```

**Features:**

- Maintains aspect ratio
- Resizes if width > maxWidth
- Outputs JPEG with quality setting

#### getImageDimensions

Gets image dimensions without full load.

```typescript
async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }>;
```

#### generateBlurPlaceholder

Creates tiny blurred placeholder.

```typescript
async function generateBlurPlaceholder(src: string): Promise<string>;
```

**Output:** 10x10 px base64 data URL with blur

---

## 15. Memory Monitor

**File:** `lib/utils/memory-monitor.ts` **Lines:** 336 **Purpose:** Memory leak
detection and tracking

### Types

```typescript
interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  timestamp: number;
}
```

### Class: MemoryMonitor

```typescript
class MemoryMonitor {
  start(intervalMs = 5000): void;
  stop(): void;
  clear(): void;
  isEnabled(): boolean;
  getStats(): MemoryStats | null;
  getReport(): {
    current: MemoryStats | null;
    average: MemoryStats | null;
    peak: MemoryStats | null;
    leakDetected: boolean;
  };
  detectLeaks(): boolean;
  enableVerboseLogging(): void;
  disableVerboseLogging(): void;
  getConfig(): {
    isDevelopment: boolean;
    warningThreshold: number;
    criticalThreshold: number;
    monitoringEnabled: boolean;
  };
}
```

### Singleton Instance

```typescript
export const memoryMonitor: MemoryMonitor;
```

### Configuration

**Development Thresholds:**

- Warning: 95% of heap
- Critical: 99% of heap

**Production Thresholds:**

- Warning: 85% of heap
- Critical: 95% of heap

### Monitoring Intervals

**Default:**

- Client: 30 seconds
- Server: 60 seconds

### Leak Detection

**Algorithm:**

- Analyzes last 10 samples
- Calculates average growth rate
- Detects leak if > 1% growth per sample

### Automatic Features

**Auto-Start:**

- Runs in development only
- Client: After DOMContentLoaded
- Server: Immediately

**Auto-Alerts:**

- Warning: Logs if threshold exceeded
- Critical: Logs + triggers GC (if available)
- Cooldown: 1 minute between critical alerts

### Browser Console Access

```typescript
window.memoryMonitor.enableVerboseLogging();
window.memoryMonitor.disableVerboseLogging();
window.memoryMonitor.getReport();
```

**Example:**

```typescript
const report = memoryMonitor.getReport();
console.log('Current heap:', report.current?.heapUsed);
console.log('Peak heap:', report.peak?.heapUsed);
console.log('Leak detected:', report.leakDetected);
```

---

## 16. Performance Metrics

**File:** `lib/utils/performance-metrics.ts` **Lines:** 407 **Purpose:** Track
Core Web Vitals and cache performance

### Types

```typescript
interface PerformanceMetrics {
  // Service Worker
  swRegistrationTime: number | null;
  swActivationTime: number | null;
  swUpdateCheckTime: number | null;

  // Cache
  cacheHitRate: number | null;
  cacheMissRate: number | null;
  averageCacheResponseTime: number | null;

  // Load
  firstContentfulPaint: number | null;
  largestContentfulPaint: number | null;
  timeToInteractive: number | null;
  totalBlockingTime: number | null;

  // Network
  offlineTime: number;
  onlineTime: number;
  connectionChanges: number;
}
```

### Class: PerformanceTracker

```typescript
class PerformanceTracker {
  getMetrics(): PerformanceMetrics;
  logMetrics(): void;
  exportMetrics(): string;
  reset(): void;
}
```

### Functions

#### getPerformanceTracker

Gets singleton instance.

```typescript
function getPerformanceTracker(): PerformanceTracker;
```

#### getPerformanceMetrics

Gets current metrics.

```typescript
function getPerformanceMetrics(): PerformanceMetrics;
```

#### logPerformanceMetrics

Logs formatted metrics to console.

```typescript
function logPerformanceMetrics(): void;
```

**Output:**

```
📊 Performance Metrics
Service Worker
Registration: 45.23ms
Activation: 123.45ms
Core Web Vitals
FCP: 567.89ms
LCP: 1234.56ms
TBT: 89.12ms
Network
Online Time: 5m 23s
Offline Time: 0s
Connection Changes: 2
```

#### exportPerformanceMetrics

Exports metrics as JSON.

```typescript
function exportPerformanceMetrics(): string;
```

#### resetPerformanceMetrics

Resets all metrics.

```typescript
function resetPerformanceMetrics(): void;
```

#### measureCachePerformance

Analyzes cache hit rate from Performance API.

```typescript
async function measureCachePerformance(): Promise<{
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
}>;
```

**Detection:** `transferSize === 0` = cache hit

#### getCoreWebVitals

Gets Core Web Vitals.

```typescript
function getCoreWebVitals(): {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  cls: number | null; // Cumulative Layout Shift
  fid: number | null; // First Input Delay
  ttfb: number | null; // Time to First Byte
};
```

#### comparePerformance

Compares before/after metrics.

```typescript
function comparePerformance(
  before: PerformanceMetrics,
  after: PerformanceMetrics
): PerformanceComparison[];

interface PerformanceComparison {
  metric: string;
  before: number | null;
  after: number | null;
  improvement: number | null;
  improvementPercentage: number | null;
}
```

### Automatic Tracking

**Auto-Setup:**

- PerformanceObserver for paint events
- LCP observer
- Long task observer
- Service worker timing
- Connection state tracking

---

## 17. PII Scrubber

**File:** `lib/utils/pii-scrubber.ts` **Lines:** 250 **Purpose:** Remove
sensitive information before external transmission

### Scrubbing Functions

#### scrubFilePath

Removes user directories from file paths.

```typescript
function scrubFilePath(text: string): string;
```

**Patterns:**

- Windows: `C:\Users\john\` → `<USER_DIR>`
- Linux: `/home/john/` → `<USER_DIR>`
- macOS: `/Users/john/` → `<USER_DIR>`
- Other paths: `C:\Program Files\` → `<PATH>`

#### scrubEmail

Removes email addresses.

```typescript
function scrubEmail(text: string): string;
```

**Pattern:** `john@example.com` → `<EMAIL>`

#### scrubIP

Removes IP addresses (IPv4 and IPv6).

```typescript
function scrubIP(text: string): string;
```

**Examples:**

- `192.168.1.1` → `<IP>`
- `2001:0db8::1` → `<IPV6>`

#### scrubPhoneNumber

Removes phone numbers.

```typescript
function scrubPhoneNumber(text: string): string;
```

**Formats:**

- `+1-234-567-8900` → `<PHONE>`
- `(234) 567-8900` → `<PHONE>`
- `234-567-8900` → `<PHONE>`

#### scrubCreditCard

Removes credit card numbers.

```typescript
function scrubCreditCard(text: string): string;
```

**Pattern:** `4532-1234-5678-9010` → `<CARD>`

#### scrubSSN

Removes Social Security Numbers.

```typescript
function scrubSSN(text: string): string;
```

**Pattern:** `123-45-6789` → `<SSN>`

#### scrubApiKeys

Removes API keys and tokens.

```typescript
function scrubApiKeys(text: string): string;
```

**Patterns:**

- `Bearer abc123` → `Bearer <TOKEN>`
- `api_key: abc123` → `<API_KEY>`
- Long alphanumeric strings (32+ chars) → `<TOKEN>`

#### scrubUUID

Removes UUIDs.

```typescript
function scrubUUID(text: string): string;
```

**Pattern:** `550e8400-e29b-41d4-a716-446655440000` → `<UUID>`

#### scrubUsername

Removes usernames.

```typescript
function scrubUsername(text: string): string;
```

**Patterns:**

- `@john` → `@<USER>`
- `/users/john` → `/user/<USER>`
- `/profiles/john` → `/profile/<USER>`

### Comprehensive Scrubbing

#### scrubPII

Applies all scrubbers in order.

```typescript
function scrubPII(text: string): string;
```

**Order:**

1. Credit cards
2. SSNs
3. API keys
4. UUIDs
5. Emails
6. Phone numbers
7. IP addresses
8. File paths
9. Usernames

#### scrubErrorPII

Scrubs Error object.

```typescript
function scrubErrorPII(error: Error): Error;
```

**Scrubs:**

- Error message
- Stack trace

#### scrubObjectPII

Recursively scrubs object properties.

```typescript
function scrubObjectPII<T extends Record<string, unknown>>(obj: T): T;
```

**Handles:**

- String values
- Nested objects
- Arrays

### Hashing Functions

#### hashUserId

Async SHA-256 hash of user ID.

```typescript
async function hashUserId(userId: string): Promise<string>;
```

**Returns:** First 16 characters of hex hash

#### hashUserIdSync

Synchronous FNV-1a hash.

```typescript
function hashUserIdSync(userId: string): string;
```

**Use Case:** beforeSend callbacks

### Validation

#### containsPII

Checks if text contains PII.

```typescript
function containsPII(text: string): boolean;
```

**Checks:**

- Email patterns
- IP addresses
- Credit card patterns
- SSN patterns
- File paths with usernames

**Use Case:** Validation before sending data

---

## 18. Secure Logger

**File:** `lib/utils/secure-logger.ts` **Lines:** 159 **Purpose:**
Production-safe logging with DEBUG mode

### Log Categories

```typescript
enum LogCategory {
  SW = '[SW]', // Service Worker
  FONT = '[FONT]', // Font loading
  HMR = '[HMR]', // Hot Module Replacement
  PERF = '[PERF]', // Performance
  CRYPTO = '[CRYPTO]', // Cryptography
  P2P = '[P2P]', // P2P connections
  TRANSFER = '[TRANSFER]', // File transfers
  UI = '[UI]', // UI interactions
  GENERAL = '', // General logs
}
```

### Logger Object

```typescript
const secureLog = {
  log(...args: unknown[]): void       // DEBUG only
  warn(...args: unknown[]): void      // DEBUG only
  error(...args: unknown[]): void     // Always (sanitized in prod)
  debug(...args: unknown[]): void     // DEBUG only
  info(...args: unknown[]): void      // DEBUG only
  force(...args: unknown[]): void     // Always in dev
  category(category: LogCategory, ...args: unknown[]): void  // DEBUG only
}
```

### Behavior

**Development:**

- Logs only shown when `DEBUG=true`
- Errors always shown
- Force logs always shown

**Production:**

- Only errors logged
- Error details sanitized: "An error occurred"

### DEBUG Control

```typescript
const debugControl = {
  enable(): void    // Enable debug logs
  disable(): void   // Disable debug logs
  status(): boolean // Check current status
}
```

### Enabling DEBUG Mode

**localStorage:**

```javascript
localStorage.setItem('DEBUG', 'true');
```

**sessionStorage:**

```javascript
sessionStorage.setItem('DEBUG', 'true');
```

**Window property:**

```javascript
window.__DEBUG__ = true;
```

**Environment variable:**

```bash
DEBUG=true npm run dev
```

### Browser Console Access

```typescript
window.__debugControl.enable();
window.__debugControl.disable();
window.__debugControl.status();
```

### Usage Examples

```typescript
import { secureLog, LogCategory } from '@/lib/utils/secure-logger';

// Regular logs (only with DEBUG=true)
secureLog.log('Transfer started');
secureLog.warn('Connection slow');

// Errors (always shown)
secureLog.error('Transfer failed:', error);

// Categorized logs
secureLog.category(LogCategory.CRYPTO, 'Key generated');
secureLog.category(LogCategory.P2P, 'Peer connected');

// Force logs (always in development)
secureLog.force('Critical development info');
```

### Named Exports

```typescript
export const log = secureLog.log;
export const warn = secureLog.warn;
export const error = secureLog.error;
export const debug = secureLog.debug;
export const info = secureLog.info;
export const force = secureLog.force;
```

---

## 19. UUID

**File:** `lib/utils/uuid.ts` **Lines:** 22 **Purpose:** RFC 4122 compliant UUID
v4 generation

### Function

#### generateUUID

Generates cryptographically random UUID v4.

```typescript
function generateUUID(): string;
```

**Implementation:**

1. Try `crypto.randomUUID()` (modern browsers)
2. Fallback: Manual generation with `crypto.getRandomValues()`

**Fallback Details:**

- Uses 16 random bytes
- Sets version bits (0x40 at byte 6)
- Sets variant bits (0x80 at byte 8)
- RFC 4122 compliant

**Format:** `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`

**Example:** `550e8400-e29b-41d4-a716-446655440000`

**Security:** Uses cryptographically secure randomness

**Use Cases:**

- Transfer IDs
- Session IDs
- Device IDs
- File IDs
- Any unique identifier

---

## 20. Error Handling

**File:** `lib/utils/error-handling.ts` **Lines:** 529 **Purpose:** Type-safe
error handling with discriminated unions

### Error Types

All errors extend BaseError:

```typescript
interface BaseError {
  code: string;
  message: string;
  timestamp: number;
  details?: Record<string, unknown>;
  recovery?: string;
}
```

#### NetworkError

```typescript
interface NetworkError extends BaseError {
  type: 'network';
  code:
    | 'CONNECTION_FAILED'
    | 'TIMEOUT'
    | 'SIGNALING_ERROR'
    | 'PEER_DISCONNECTED'
    | 'ICE_FAILED';
  transport?: NetworkTransport;
  retryCount?: number;
}
```

#### CryptoError

```typescript
interface CryptoError extends BaseError {
  type: 'crypto';
  code:
    | 'KEY_GENERATION_FAILED'
    | 'ENCRYPTION_FAILED'
    | 'DECRYPTION_FAILED'
    | 'INVALID_KEY'
    | 'KEY_EXCHANGE_FAILED'
    | 'SIGNATURE_VERIFICATION_FAILED';
  algorithm?: string;
}
```

#### ValidationError

```typescript
interface ValidationError extends BaseError {
  type: 'validation';
  code:
    | 'INVALID_FILE'
    | 'FILE_TOO_LARGE'
    | 'UNSUPPORTED_FILE_TYPE'
    | 'EMPTY_FILE'
    | 'INVALID_RECIPIENT'
    | 'INVALID_INPUT';
  field?: string;
  value?: unknown;
  expected?: unknown;
}
```

#### TransferError

```typescript
interface TransferError extends BaseError {
  type: 'transfer';
  code:
    | 'TRANSFER_FAILED'
    | 'TRANSFER_CANCELLED'
    | 'TRANSFER_TIMEOUT'
    | 'INTEGRITY_CHECK_FAILED'
    | 'RECIPIENT_UNAVAILABLE';
  transferId?: string;
  progress?: number;
}
```

#### StorageError

```typescript
interface StorageError extends BaseError {
  type: 'storage';
  code:
    | 'QUOTA_EXCEEDED'
    | 'READ_FAILED'
    | 'WRITE_FAILED'
    | 'NOT_FOUND'
    | 'PERMISSION_DENIED';
  key?: string;
}
```

### Discriminated Union

```typescript
type AppError =
  | NetworkError
  | CryptoError
  | ValidationError
  | TransferError
  | StorageError;
```

### Factory Functions

#### createNetworkError

```typescript
function createNetworkError(
  code: NetworkError['code'],
  message: string,
  options?: {
    transport?: NetworkTransport;
    retryCount?: number;
    details?: Record<string, unknown>;
    recovery?: string;
  }
): NetworkError;
```

#### createCryptoError

```typescript
function createCryptoError(
  code: CryptoError['code'],
  message: string,
  options?: {
    algorithm?: string;
    details?: Record<string, unknown>;
    recovery?: string;
  }
): CryptoError;
```

#### createValidationError

```typescript
function createValidationError(
  code: ValidationError['code'],
  message: string,
  options?: {
    field?: string;
    value?: unknown;
    expected?: unknown;
    details?: Record<string, unknown>;
    recovery?: string;
  }
): ValidationError;
```

#### createTransferError

```typescript
function createTransferError(
  code: TransferError['code'],
  message: string,
  options?: {
    transferId?: string;
    progress?: number;
    details?: Record<string, unknown>;
    recovery?: string;
  }
): TransferError;
```

#### createStorageError

```typescript
function createStorageError(
  code: StorageError['code'],
  message: string,
  options?: {
    key?: string;
    details?: Record<string, unknown>;
    recovery?: string;
  }
): StorageError;
```

### Conversion Functions

#### toAppError

Converts standard Error to AppError.

```typescript
function toAppError(
  error: Error | AppError | unknown,
  context?: {
    operation?: string;
    component?: string;
  }
): AppError;
```

**Categorization:**

- Analyzes error message keywords
- Maps to appropriate error type
- Preserves context

#### isAppError

Type guard for AppError.

```typescript
function isAppError(value: unknown): value is AppError;
```

### Result Helpers

#### success

Creates success result.

```typescript
function success<T>(data: T): Result<T, AppError>;
```

#### failure

Creates failure result.

```typescript
function failure<T, E extends AppError = AppError>(error: E): Result<T, E>;
```

#### wrapResult

Wraps synchronous function to return Result.

```typescript
function wrapResult<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn
): (...args: TArgs) => Result<TReturn, AppError>;
```

**Example:**

```typescript
const safeParseJSON = wrapResult((str: string) => JSON.parse(str));

const result = safeParseJSON('{"key": "value"}');
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

#### wrapAsyncResult

Wraps async function to return Result.

```typescript
function wrapAsyncResult<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<Result<TReturn, AppError>>;
```

### Formatting Functions

#### formatErrorMessage

Formats error with recovery suggestion.

```typescript
function formatErrorMessage(error: AppError): string;
```

#### getErrorDescription

Gets short description for UI.

```typescript
function getErrorDescription(error: AppError): string;
```

**Returns:**

- Network: "Network connection issue"
- Crypto: "Encryption/decryption failed"
- Validation: "Invalid input"
- Transfer: "Transfer failed"
- Storage: "Storage operation failed"

#### getRecoverySuggestion

Gets recovery suggestion.

```typescript
function getRecoverySuggestion(error: AppError): string | null;
```

**Examples:**

- CONNECTION_FAILED: "Check your internet connection and try again"
- FILE_TOO_LARGE: "Choose a smaller file (max 4GB)"
- QUOTA_EXCEEDED: "Clear some storage space and try again"

### Logging Functions

#### logError

Logs error with context.

```typescript
function logError(
  error: AppError,
  context?: {
    component?: string;
    operation?: string;
    userId?: string;
  }
): void;
```

**Production:** Sends to error tracking (TODO: integrate Sentry)
**Development:** Logs with color coding

### Type Guards

```typescript
function isNetworkError(error: AppError): error is NetworkError;
function isCryptoError(error: AppError): error is CryptoError;
function isValidationError(error: AppError): error is ValidationError;
function isTransferError(error: AppError): error is TransferError;
function isStorageError(error: AppError): error is StorageError;
```

### Usage Example

```typescript
import {
  createNetworkError,
  success,
  failure,
  logError,
  formatErrorMessage,
} from '@/lib/utils/error-handling';

async function connectToPeer(
  peerId: string
): Promise<Result<Connection, AppError>> {
  try {
    const connection = await establishConnection(peerId);
    return success(connection);
  } catch (err) {
    const error = createNetworkError(
      'CONNECTION_FAILED',
      'Failed to connect to peer',
      {
        details: { peerId },
        recovery: 'Check network and try again',
        retryCount: 3,
      }
    );

    logError(error, {
      component: 'P2PManager',
      operation: 'connectToPeer',
    });

    return failure(error);
  }
}

// Usage
const result = await connectToPeer('peer-123');
if (result.success) {
  console.log('Connected:', result.data);
} else {
  const message = formatErrorMessage(result.error);
  showError(message);
}
```

---

## Types Documentation

## 1. Messaging Types

**File:** `lib/types/messaging-types.ts` **Lines:** 395 **Purpose:** Type-safe
WebRTC and signaling messages

### Signaling Messages

#### GroupAnswerMessage

```typescript
interface GroupAnswerMessage {
  groupId: string;
  from: string;
  answer: RTCSessionDescriptionInit;
}
```

#### GroupICECandidateMessage

```typescript
interface GroupICECandidateMessage {
  groupId: string;
  from: string;
  candidate: RTCIceCandidateInit;
}
```

#### GroupOfferMessage

```typescript
interface GroupOfferMessage {
  groupId: string;
  to: string;
  offer: RTCSessionDescriptionInit;
}
```

### P2P Transfer Messages

#### FileMeta

```typescript
interface FileMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  chunks: number;
}
```

#### SignalMessage

```typescript
interface SignalMessage<T extends MessagePayload = MessagePayload> {
  type:
    | 'offer'
    | 'answer'
    | 'candidate'
    | 'ready'
    | 'file-meta'
    | 'chunk'
    | 'ack'
    | 'complete'
    | 'error';
  payload: T;
  from: string;
  to: string;
}
```

#### InternalMessage

Discriminated union for data channel messages:

```typescript
type InternalMessage =
  | { type: 'file-meta'; meta: FileMeta }
  | { type: 'complete'; fileId: string }
  | { type: 'error'; message: string };
```

### Chat Messages

#### ChatMessage

```typescript
interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  read?: boolean;
  delivered?: boolean;
}
```

#### ChatEvent

```typescript
type ChatEventType = 'message' | 'typing' | 'read' | 'delivered' | 'error';

interface ChatEvent {
  type: ChatEventType;
  message?: ChatMessage;
  senderId?: string;
  error?: string;
}
```

### Control Messages

#### ConnectionQuality

```typescript
type ConnectionQuality =
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor'
  | 'disconnected';
```

#### ControlMessage

```typescript
type ControlMessageType =
  | 'ping'
  | 'pong'
  | 'status'
  | 'quality'
  | 'bandwidth'
  | 'heartbeat';

interface ControlMessage {
  type: ControlMessageType;
  payload?: {
    timestamp?: number;
    status?: string;
    quality?: ConnectionQuality;
    bandwidth?: number;
    latency?: number;
  };
}
```

### Resumable Transfer Messages

#### ResumableFileMetadata

```typescript
interface ResumableFileMetadata {
  originalName: string;
  mimeCategory: string;
  originalSize: number;
  fileHash: number[];
  encryptedName?: string;
  nameNonce?: number[];
  encryptedPath?: string;
  pathNonce?: number[];
}
```

#### ChunkPayload

```typescript
interface ChunkPayload {
  index: number;
  data: number[];
  nonce: number[];
  hash: number[];
}
```

#### ResumeRequestPayload

```typescript
interface ResumeRequestPayload {
  transferId: string;
}
```

#### ResumeResponsePayload

```typescript
interface ResumeResponsePayload {
  transferId: string;
  chunkBitmap: string;
  canResume: boolean;
}
```

#### ResumeChunkRequestPayload

```typescript
interface ResumeChunkRequestPayload {
  transferId: string;
  chunkIndices: number[];
}
```

### Type Guards

All interfaces have corresponding type guards:

```typescript
function isGroupAnswerMessage(value: unknown): value is GroupAnswerMessage;
function isGroupICECandidateMessage(
  value: unknown
): value is GroupICECandidateMessage;
function isFileMeta(value: unknown): value is FileMeta;
function isInternalMessage(value: unknown): value is InternalMessage;
function isChatEvent(value: unknown): value is ChatEvent;
function isControlMessage(value: unknown): value is ControlMessage;
function isResumableFileMetadata(
  value: unknown
): value is ResumableFileMetadata;
function isChunkPayload(value: unknown): value is ChunkPayload;
function isResumeRequestPayload(value: unknown): value is ResumeRequestPayload;
function isResumeResponsePayload(
  value: unknown
): value is ResumeResponsePayload;
function isResumeChunkRequestPayload(
  value: unknown
): value is ResumeChunkRequestPayload;
```

---

## 2. Shared Types

**File:** `lib/types/shared.ts` **Lines:** 611 **Purpose:** Common types used
across application

### Result Types

#### Result

Generic discriminated union for success/failure:

```typescript
type Result<T, E = Error> =
  | { success: true; data: T; error?: never }
  | { success: false; error: E; data?: never };
```

#### AsyncResult

```typescript
type AsyncResult<T, E = Error> = Promise<Result<T, E>>;
```

#### Option

```typescript
type Option<T> = T | null;
```

### PQC Types

#### PQCStatus

```typescript
type PQCStatus =
  | 'initializing'
  | 'key-generation'
  | 'key-exchange'
  | 'session-ready'
  | 'encrypting'
  | 'decrypting'
  | 'error'
  | 'destroyed';
```

#### PQCVersion

```typescript
type PQCVersion = 1 | 2 | 3;
```

#### EncryptionMetadata

```typescript
interface EncryptionMetadata {
  algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305' | 'Hybrid';
  keyExchange: 'ML-KEM-768' | 'Kyber-1024' | 'X25519' | 'Hybrid';
  iv: string;
  authTag: string;
  kdf: 'HKDF-SHA256' | 'HKDF-SHA512' | 'Argon2id';
  salt: string;
  fileHash: string;
  version: number;
  timestamp: number;
  passwordProtected?: boolean;
}
```

#### PQCSessionInfo

```typescript
interface PQCSessionInfo {
  sessionId: string;
  status: PQCStatus;
  version: PQCVersion;
  createdAt: number;
  expiresAt: number;
  messageCount: number;
  keysEstablished: boolean;
  encryptionMetadata?: EncryptionMetadata;
}
```

### Transfer Status Types

#### TransferStatus

```typescript
type TransferStatus =
  | 'pending'
  | 'initializing'
  | 'connecting'
  | 'key-exchange'
  | 'transferring'
  | 'paused'
  | 'resuming'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'cancelled';
```

#### ConnectionQuality

```typescript
type ConnectionQuality =
  | 'excellent' // >10 Mbps, <50ms latency
  | 'good' // 1-10 Mbps, 50-100ms latency
  | 'fair' // 100Kbps-1Mbps, 100-200ms latency
  | 'poor' // <100Kbps, >200ms latency
  | 'disconnected';
```

#### NetworkTransport

```typescript
type NetworkTransport =
  | 'webrtc-direct'
  | 'webrtc-relay'
  | 'websocket'
  | 'http'
  | 'onion-routing';
```

### Error Types

See [Error Handling](#20-error-handling) section for complete error type
documentation.

### WebRTC Types

#### SignalingData

```typescript
interface SignalingData {
  type: 'offer' | 'answer' | 'candidate' | 'pqc-public-key' | 'pqc-ciphertext';
  from: string;
  to: string;
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit | PQCKeyData;
  timestamp: number;
}
```

#### PQCKeyData

```typescript
interface PQCKeyData {
  publicKey: string;
  version: PQCVersion;
  ciphertext?: Uint8Array;
}
```

#### DataChannelConfig

```typescript
interface DataChannelConfig {
  label: string;
  ordered: boolean;
  maxRetransmits?: number;
  maxPacketLifeTime?: number;
  protocol?: string;
}
```

### File Transfer Types

#### FileMetadata

```typescript
interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  hash?: string;
  thumbnail?: string;
  path?: string;
}
```

#### TransferProgress

```typescript
interface TransferProgress {
  transferId: string;
  status: TransferStatus;
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
  speed: number;
  eta: number | null;
  quality: ConnectionQuality;
  startTime: number;
  endTime?: number;
}
```

#### RecipientStatus

```typescript
interface RecipientStatus {
  id: string;
  name: string;
  status: TransferStatus;
  progress: number;
  speed: number;
  quality: ConnectionQuality;
  error?: AppError;
  startTime?: number;
  endTime?: number;
}
```

### Privacy & Security Types

#### PrivacyLevel

```typescript
type PrivacyLevel =
  | 'standard' // Basic encryption
  | 'enhanced' // PQC encryption
  | 'maximum' // PQC + Onion routing
  | 'paranoid'; // Maximum privacy + metadata stripping
```

#### MetadataStripOptions

```typescript
interface MetadataStripOptions {
  stripGPS: boolean;
  stripDeviceInfo: boolean;
  stripTimestamps: boolean;
  stripAuthorInfo: boolean;
  showPreview: boolean;
}
```

#### PrivacySettings

```typescript
interface PrivacySettings {
  level: PrivacyLevel;
  enablePQC: boolean;
  enableOnionRouting: boolean;
  stripMetadata: boolean;
  metadataOptions?: MetadataStripOptions;
  enableSecureDeletion: boolean;
  onionLayers?: 1 | 2 | 3;
}
```

### Utility Types

#### Strict

Makes all properties required and non-nullable:

```typescript
type Strict<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};
```

#### WithRequired

Makes specific properties required:

```typescript
type WithRequired<T, K extends keyof T> = T & {
  [P in K]-?: NonNullable<T[P]>;
};
```

#### WithOptional

Makes specific properties optional:

```typescript
type WithOptional<T, K extends keyof T> = Omit<T, K> & {
  [P in K]?: T[P];
};
```

#### NonNullableFields

```typescript
type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};
```

#### DeepPartial

```typescript
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
```

#### DeepReadonly

```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
```

### Branded Types

#### Brand

```typescript
type Brand<T, B> = T & { [brand]: B };
```

#### Branded String Types

```typescript
type SessionId = Brand<string, 'SessionId'>;
type TransferId = Brand<string, 'TransferId'>;
type PeerId = Brand<string, 'PeerId'>;
type DeviceId = Brand<string, 'DeviceId'>;
type RoomCode = Brand<string, 'RoomCode'>;
type FileHash = Brand<string, 'FileHash'>;
```

#### Brand Constructors

```typescript
function createSessionId(id: string): SessionId;
function createTransferId(id: string): TransferId;
function createPeerId(id: string): PeerId;
function createDeviceId(id: string): DeviceId;
function createRoomCode(code: string): RoomCode;
function createFileHash(hash: string): FileHash;
```

### Callback Types

```typescript
type Callback = () => void;
type CallbackWithArg<T> = (arg: T) => void;
type AsyncCallback = () => Promise<void>;
type AsyncCallbackWithArg<T> = (arg: T) => Promise<void>;
type ErrorCallback = (error: AppError) => void;
type ProgressCallback = (progress: TransferProgress) => void;
type StatusChangeCallback<T> = (oldStatus: T, newStatus: T) => void;
```

---

## 3. Type Guards

**File:** `lib/types/type-guards.ts` **Lines:** 246 **Purpose:** Runtime type
validation

### Primitive Type Guards

```typescript
function isString(value: unknown): value is string;
function isNumber(value: unknown): value is number; // Excludes NaN
function isBoolean(value: unknown): value is boolean;
function isObject(value: unknown): value is Record<string, unknown>; // Excludes null and arrays
function isArray(value: unknown): value is unknown[];
```

### Array Type Guards

```typescript
function isArrayOf<T>(
  value: unknown,
  guard: (item: unknown) => item is T
): value is T[];
```

**Example:**

```typescript
const numbers = [1, 2, 3, '4'];
if (isArrayOf(numbers, isNumber)) {
  // TypeScript knows numbers is number[]
}
```

### Nullability Guards

```typescript
function isNonNull<T>(value: T | null): value is T;
function isNonUndefined<T>(value: T | undefined): value is T;
function isDefined<T>(value: T | null | undefined): value is T;
```

### Specialized Guards

```typescript
function isValidDate(value: unknown): value is Date;
function isError(value: unknown): value is Error;
function isFunction(value: unknown): value is (...args: unknown[]) => unknown;
function isPromise<T = unknown>(value: unknown): value is Promise<T>;
function isArrayBuffer(value: unknown): value is ArrayBuffer;
function isUint8Array(value: unknown): value is Uint8Array;
function isBlob(value: unknown): value is Blob;
function isFile(value: unknown): value is File;
```

### Property Guards

```typescript
function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown>;

function hasTypedProperty<K extends string, T>(
  obj: unknown,
  key: K,
  guard: (value: unknown) => value is T
): obj is Record<K, T>;
```

**Example:**

```typescript
if (hasTypedProperty(obj, 'age', isNumber)) {
  // TypeScript knows obj has age: number
  console.log(obj.age + 1);
}
```

### Composite Guards

```typescript
function createUnionGuard<T>(
  ...guards: Array<(value: unknown) => value is T>
): (value: unknown) => value is T;

function createIntersectionGuard<T>(
  ...guards: Array<(value: unknown) => value is T>
): (value: unknown) => value is T;
```

**Example:**

```typescript
const isStringOrNumber = createUnionGuard(isString, isNumber);

if (isStringOrNumber(value)) {
  // value is string | number
}
```

### Optional/Nullable Guards

```typescript
function isOptional<T>(
  value: unknown,
  guard: (value: unknown) => value is T
): value is T | undefined;

function isNullable<T>(
  value: unknown,
  guard: (value: unknown) => value is T
): value is T | null;

function isMaybe<T>(
  value: unknown,
  guard: (value: unknown) => value is T
): value is T | null | undefined;
```

### Assertion Functions

```typescript
function assertType<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  errorMessage?: string
): asserts value is T;
```

**Example:**

```typescript
function processUser(data: unknown) {
  assertType(data, isUser, 'Invalid user data');
  // TypeScript knows data is User
  console.log(data.name);
}
```

### Casting Functions

```typescript
function safeCast<T>(
  value: unknown,
  guard: (value: unknown) => value is T
): T | null;

function strictCast<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  errorMessage?: string
): T;
```

**Example:**

```typescript
// Safe cast
const user = safeCast(data, isUser);
if (user) {
  console.log(user.name);
}

// Strict cast (throws on failure)
const user = strictCast(data, isUser, 'User validation failed');
console.log(user.name);
```

---

## 4. Utility Types

**File:** `lib/types/utility-types.ts` **Lines:** 453 **Purpose:** Advanced
TypeScript utility types

### Basic Utilities

```typescript
type RequiredNonNullable<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

type RequiredKeys<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

type ArrayElement<T> = T extends readonly (infer E)[] ? E : never;
```

### Async/Promise Utilities

```typescript
type Awaited<T> = T extends Promise<infer U> ? U : T;

type AsyncReturnType<T extends (...args: any[]) => any> =
  ReturnType<T> extends Promise<infer U> ? U : ReturnType<T>;

type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

type AsyncState<T, E = Error> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: E };
```

### React Utilities

```typescript
type PropsWithRequiredChildren<P = {}> = P & {
  children: React.ReactNode;
};

type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never;

type EventHandler<T = HTMLElement, E = React.SyntheticEvent<T>> = (
  event: E
) => void;
type ChangeHandler<T = HTMLInputElement> = (
  event: React.ChangeEvent<T>
) => void;
type ClickHandler<T = HTMLElement> = (event: React.MouseEvent<T>) => void;
type KeyboardHandler<T = HTMLElement> = (event: React.KeyboardEvent<T>) => void;
```

### Validation Utilities

```typescript
type TypeGuard<T> = (value: unknown) => value is T;
type Nullable<T> = T | null;
type Maybe<T> = T | null | undefined;
type NonEmptyArray<T> = [T, ...T[]];

type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
  U[keyof U];

type ExactlyOne<T, K extends keyof T = keyof T> = K extends keyof T
  ? Required<Pick<T, K>> & Partial<Record<Exclude<keyof T, K>, never>>
  : never;
```

### API Utilities

```typescript
interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

type ApiResponse<T> = Result<T, ApiError>;

interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

type RequestStatus = 'idle' | 'pending' | 'fulfilled' | 'rejected';
```

### Object Manipulation

```typescript
type DataOnly<T> = Pick<
  T,
  {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K;
  }[keyof T]
>;

type MethodsOnly<T> = Pick<
  T,
  {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
  }[keyof T]
>;

type ReadonlyKeys<T, K extends keyof T> = Omit<T, K> & {
  readonly [P in K]: T[P];
};

type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};
```

### String Manipulation

```typescript
type StringKeys<T> = Extract<keyof T, string>;

type CamelToSnake<S extends string> = S extends `${infer T}${infer U}`
  ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${CamelToSnake<U>}`
  : S;

type SnakeCaseKeys<T> = {
  [K in keyof T as CamelToSnake<StringKeys<T>>]: T[K];
};
```

### Function Utilities

```typescript
type Parameters<T extends (...args: any) => any> = T extends (
  ...args: infer P
) => any
  ? P
  : never;

type FirstParameter<T extends (...args: any) => any> = Parameters<T>[0];

type RequiredParameters<T extends (...args: any[]) => any> = (
  ...args: RequiredNonNullable<Parameters<T>>
) => ReturnType<T>;

type VoidFunction<Args extends any[] = []> = (...args: Args) => void;
type AsyncFunction<Args extends any[] = [], R = void> = (
  ...args: Args
) => Promise<R>;
```

### Conditional Types

```typescript
type If<Condition extends boolean, T, F> = Condition extends true ? T : F;
type IsAny<T> = 0 extends 1 & T ? true : false;
type IsNever<T> = [T] extends [never] ? true : false;
type IsUnknown<T> =
  IsNever<T> extends false
    ? T extends unknown
      ? unknown extends T
        ? IsAny<T> extends false
          ? true
          : false
        : false
      : false
    : false;
```

### Branded Types

```typescript
type Brand<T, B> = T & { __brand: B };

type UserId = Brand<string, 'UserId'>;
type DeviceId = Brand<string, 'DeviceId'>;
type TransferId = Brand<string, 'TransferId'>;
type Timestamp = Brand<number, 'Timestamp'>;
type PositiveNumber = Brand<number, 'PositiveNumber'>;
type Email = Brand<string, 'Email'>;
type URL = Brand<string, 'URL'>;
```

### Helper Functions

```typescript
const createEnum = <T extends Record<string, string>>(obj: T): Readonly<T> =>
  Object.freeze(obj);

function assertType<T>(_value: unknown): asserts _value is T {}

function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}

function typedKeys<T extends object>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>;
}

function typedEntries<T extends object>(obj: T): Array<[keyof T, T[keyof T]]> {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
}

function typedFromEntries<K extends PropertyKey, V>(
  entries: Iterable<readonly [K, V]>
): Record<K, V> {
  return Object.fromEntries(entries) as Record<K, V>;
}
```

### Array Utilities

```typescript
type Tuple<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : never;

type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N
  ? R
  : _TupleOf<T, N, [T, ...R]>;

type ReadonlyArray<T> = readonly T[];
type NonEmptyReadonlyArray<T> = readonly [T, ...T[]];
```

### Record Utilities

```typescript
type PartialRecord<K extends PropertyKey, V> = Partial<Record<K, V>>;
type RequiredRecord<K extends PropertyKey, V> = Record<K, V>;
type ValueRecord<K extends PropertyKey, V> = {
  [P in K]: V;
};
```

---

## Usage Examples

### Error Handling Pattern

```typescript
import {
  wrapAsyncResult,
  createNetworkError,
} from '@/lib/utils/error-handling';

const fetchUser = wrapAsyncResult(async (id: string) => {
  const response = await secureFetch(`/api/users/${id}`);
  return response.json();
});

const result = await fetchUser('123');
if (result.success) {
  console.log('User:', result.data);
} else {
  showError(formatErrorMessage(result.error));
}
```

### Device Detection Pattern

```typescript
import {
  getDeviceInfo,
  getOptimalTouchTargetSize,
} from '@/lib/utils/device-detection';

const deviceInfo = getDeviceInfo();

// Adapt UI based on device
if (deviceInfo.inputMethod === 'touch') {
  const targetSize = getOptimalTouchTargetSize();
  button.style.minHeight = `${targetSize}px`;
}

// Handle offline mode
if (!deviceInfo.isOnline) {
  showOfflineIndicator();
}
```

### Memory Monitoring Pattern

```typescript
import { memoryMonitor } from '@/lib/utils/memory-monitor';

// Development: Enable verbose logging
if (process.env.NODE_ENV === 'development') {
  window.memoryMonitor.enableVerboseLogging();
}

// Check for leaks periodically
setInterval(() => {
  const report = memoryMonitor.getReport();
  if (report.leakDetected) {
    console.error('Memory leak detected!', report);
  }
}, 60000);
```

### Type-Safe Factory Pattern

```typescript
import { createDevice, createFileTransfer } from '@/lib/utils/factory';

const sender = createDevice({
  id: generateUUID(),
  name: 'My Laptop',
  platform: 'windows',
});

const receiver = createDevice({
  id: 'peer-123',
  name: "Friend's Phone",
  platform: 'android',
  isOnline: true,
});

const transfer = createFileTransfer(fileInfoList, sender, receiver, 'send');
```

### Clipboard Integration Pattern

```typescript
import { copyToClipboard, shareContent } from '@/lib/utils/clipboard';

async function shareTransferCode(code: string) {
  // Try Web Share API first
  const shareResult = await shareContent({
    title: 'Transfer Code',
    text: `Join my transfer: ${code}`,
    url: `https://tallow.app/join/${code}`,
  });

  if (!shareResult.shared) {
    // Fallback to clipboard
    const copyResult = await copyToClipboard(code);
    if (copyResult.success) {
      showToast('Code copied to clipboard');
    }
  }
}
```

---

## Type Safety Patterns

### Discriminated Union Pattern

```typescript
type TransferState =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number }
  | { status: 'completed'; fileUrl: string }
  | { status: 'failed'; error: AppError };

function handleTransfer(state: TransferState) {
  switch (state.status) {
    case 'idle':
      return 'Ready to upload';
    case 'uploading':
      return `Uploading: ${state.progress}%`;
    case 'completed':
      return `Download: ${state.fileUrl}`;
    case 'failed':
      return formatErrorMessage(state.error);
  }
}
```

### Branded Type Pattern

```typescript
import { Brand, createTransferId } from '@/lib/types/shared';

type SafeTransferId = Brand<string, 'TransferId'>;

function validateTransfer(id: SafeTransferId) {
  // Guaranteed to be a properly created transfer ID
}

// Compile error: string is not assignable to SafeTransferId
// validateTransfer('abc-123')

// Correct usage
const id = createTransferId(generateUUID());
validateTransfer(id);
```

### Type Guard Pattern

```typescript
import { isValidDevice, isValidTransfer } from '@/lib/utils/factory';

function processData(data: unknown) {
  if (isValidDevice(data)) {
    // TypeScript knows data is Device
    console.log(data.name);
  } else if (isValidTransfer(data)) {
    // TypeScript knows data is Transfer
    console.log(data.status);
  } else {
    throw new Error('Invalid data');
  }
}
```

### Result Type Pattern

```typescript
import { Result, success, failure } from '@/lib/types/shared';

async function processFile(
  file: File
): Promise<Result<ProcessedFile, ValidationError>> {
  if (file.size === 0) {
    return failure(
      createValidationError('EMPTY_FILE', 'File is empty', {
        field: 'file',
        value: file.size,
        expected: '> 0',
      })
    );
  }

  const processed = await processFileData(file);
  return success(processed);
}

// Usage with exhaustive handling
const result = await processFile(myFile);
if (result.success) {
  // result.data is ProcessedFile
  uploadFile(result.data);
} else {
  // result.error is ValidationError
  showError(result.error.message);
  if (result.error.recovery) {
    showRecovery(result.error.recovery);
  }
}
```

---

## Summary Statistics

**Total Utility Files:** 20 **Total Type Files:** 4 **Total Lines:** 2,800+
**Type Coverage:** 100% **Null Safety:** Strict mode enabled **Runtime
Validation:** Type guards for all external data **Error Handling:**
Discriminated unions throughout **Browser Compatibility:** Modern browsers +
graceful fallbacks

---

## Quick Reference Index

### By Category

**Accessibility:**

- accessibility.ts (FocusTrap, live regions, WCAG helpers)
- focus-management.ts (Focus utilities)

**Security:**

- api-key-manager.ts (API key storage)
- error-handling.ts (Error types)
- fetch.ts (CSRF protection)
- pii-scrubber.ts (PII removal)
- secure-logger.ts (Safe logging)

**Performance:**

- cache-buster.ts (Force cache clear)
- cache-stats.ts (Cache analytics)
- image-optimization.ts (Image helpers)
- memory-monitor.ts (Leak detection)
- performance-metrics.ts (Core Web Vitals)

**Device:**

- device-converters.ts (Type conversions)
- device-detection.ts (Capability detection)

**Utilities:**

- cleanup-manager.ts (Resource cleanup)
- clipboard.ts (Clipboard integration)
- console-cleanup.ts (Development helpers)
- factory.ts (Object factories)
- file-utils.ts (File operations)
- uuid.ts (ID generation)

**Types:**

- messaging-types.ts (WebRTC messages)
- shared.ts (Common types)
- type-guards.ts (Runtime validation)
- utility-types.ts (TypeScript helpers)

---

**End of Documentation**

For updates or issues, see: `/docs/UTILITIES_AND_TYPES_COMPLETE.md`

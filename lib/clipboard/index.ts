/**
 * Clipboard Module
 *
 * Exports clipboard monitoring and auto-send functionality
 */

export { ClipboardMonitor } from './clipboard-monitor';
export type {
  ClipboardItemType,
  ClipboardItem,
  ClipboardFileItem,
  ClipboardImageItem,
  ClipboardTextItem,
  AnyClipboardItem,
  ClipboardMonitorCallbacks,
} from './clipboard-monitor';

export { setupAutoSend, updateAutoSendConfig } from './auto-send';
export type {
  AutoSendConfig,
  AutoSendCallbacks,
} from './auto-send';

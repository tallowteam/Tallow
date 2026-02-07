/**
 * Clipboard Monitor
 *
 * Monitors clipboard events for paste operations and clipboard changes.
 * Detects files, images, and text from clipboard data.
 *
 * Privacy: Only reads clipboard on explicit paste events (Ctrl+V/Cmd+V),
 * never polls or reads clipboard without user action.
 */

export type ClipboardItemType = 'file' | 'image' | 'text';

export interface ClipboardItem {
  type: ClipboardItemType;
  timestamp: number;
}

export interface ClipboardFileItem extends ClipboardItem {
  type: 'file';
  files: File[];
}

export interface ClipboardImageItem extends ClipboardItem {
  type: 'image';
  blob: Blob;
  dataUrl?: string;
}

export interface ClipboardTextItem extends ClipboardItem {
  type: 'text';
  text: string;
}

export type AnyClipboardItem = ClipboardFileItem | ClipboardImageItem | ClipboardTextItem;

export interface ClipboardMonitorCallbacks {
  onFilePasted?: (files: File[]) => void;
  onImagePasted?: (blob: Blob, dataUrl?: string) => void;
  onTextPasted?: (text: string) => void;
  onError?: (error: Error) => void;
}

/**
 * ClipboardMonitor class
 *
 * Listens for paste events and processes clipboard data.
 * Respects user privacy by only reading on explicit paste actions.
 */
export class ClipboardMonitor {
  private callbacks: ClipboardMonitorCallbacks;
  private isActive: boolean = false;
  private pasteHandler: ((e: ClipboardEvent) => void) | null = null;

  constructor(callbacks: ClipboardMonitorCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Start monitoring paste events
   */
  start(): void {
    if (this.isActive) {
      console.warn('ClipboardMonitor is already active');
      return;
    }

    this.pasteHandler = this.handlePaste.bind(this);
    document.addEventListener('paste', this.pasteHandler);
    this.isActive = true;
  }

  /**
   * Stop monitoring paste events
   */
  stop(): void {
    if (!this.isActive || !this.pasteHandler) {
      return;
    }

    document.removeEventListener('paste', this.pasteHandler);
    this.pasteHandler = null;
    this.isActive = false;
  }

  /**
   * Check if monitoring is active
   */
  isMonitoring(): boolean {
    return this.isActive;
  }

  /**
   * Handle paste event
   */
  private async handlePaste(event: ClipboardEvent): Promise<void> {
    try {
      const clipboardData = event.clipboardData;
      if (!clipboardData) {
        return;
      }

      // Check for files first (highest priority)
      if (clipboardData.files && clipboardData.files.length > 0) {
        const files = Array.from(clipboardData.files);

        // Check if files contain images
        const imageFiles = files.filter(f => f.type.startsWith('image/'));

        if (imageFiles.length > 0 && imageFiles.length === files.length) {
          // All files are images - treat as image paste
          if (this.callbacks.onImagePasted && imageFiles[0]) {
            const dataUrl = await this.blobToDataUrl(imageFiles[0]);
            this.callbacks.onImagePasted(imageFiles[0], dataUrl);
          }
        } else {
          // Regular file paste
          if (this.callbacks.onFilePasted) {
            this.callbacks.onFilePasted(files);
          }
        }
        return;
      }

      // Check for image data
      const items = clipboardData.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (!item) {continue;}

          // Handle image items
          if (item.type.startsWith('image/')) {
            const blob = item.getAsFile();
            if (blob && this.callbacks.onImagePasted) {
              const dataUrl = await this.blobToDataUrl(blob);
              this.callbacks.onImagePasted(blob, dataUrl);
              return;
            }
          }
        }
      }

      // Check for text
      const text = clipboardData.getData('text/plain');
      if (text && this.callbacks.onTextPasted) {
        this.callbacks.onTextPasted(text);
      }
    } catch (error) {
      if (this.callbacks.onError) {
        this.callbacks.onError(error as Error);
      } else {
        console.error('ClipboardMonitor error:', error);
      }
    }
  }

  /**
   * Convert blob to data URL for preview
   */
  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob to data URL'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Attempt to read clipboard programmatically (requires permission)
   * Note: This is separate from paste events and requires explicit user consent
   */
  async readClipboard(): Promise<AnyClipboardItem | null> {
    try {
      // Check if Clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.read) {
        throw new Error('Clipboard API not available');
      }

      // Request clipboard permission if needed
      const permissionStatus = await navigator.permissions.query({
        name: 'clipboard-read' as PermissionName
      });

      if (permissionStatus.state === 'denied') {
        throw new Error('Clipboard permission denied');
      }

      const clipboardItems = await navigator.clipboard.read();

      for (const clipboardItem of clipboardItems) {
        // Check for images
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            const dataUrl = await this.blobToDataUrl(blob);
            return {
              type: 'image',
              blob,
              dataUrl,
              timestamp: Date.now(),
            };
          }
        }

        // Check for text
        if (clipboardItem.types.includes('text/plain')) {
          const blob = await clipboardItem.getType('text/plain');
          const text = await blob.text();
          return {
            type: 'text',
            text,
            timestamp: Date.now(),
          };
        }
      }

      return null;
    } catch (error) {
      if (this.callbacks.onError) {
        this.callbacks.onError(error as Error);
      }
      return null;
    }
  }

  /**
   * Update callbacks
   */
  updateCallbacks(callbacks: Partial<ClipboardMonitorCallbacks>): void {
    this.callbacks = {
      ...this.callbacks,
      ...callbacks,
    };
  }

  /**
   * Destroy the monitor and clean up
   */
  destroy(): void {
    this.stop();
    this.callbacks = {};
  }
}

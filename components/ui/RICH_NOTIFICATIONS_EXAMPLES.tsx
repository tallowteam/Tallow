/**
 * Rich Notifications - Integration Examples
 * Copy these examples directly into your code
 */

import { useToast } from '@/components/ui/ToastProvider';
import { notificationManager } from '@/lib/utils/notification-manager';

type ToastApi = ReturnType<typeof useToast>;

// ============================================
// Example 1: Image Preview Notification
// ============================================
export function showImagePreviewExample(toast: ToastApi) {
  toast.addToast({
    title: 'Image Received',
    message: 'vacation-photo.jpg',
    variant: 'success',
    duration: 7000,
    preview: {
      type: 'image',
      src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=96&h=96&fit=crop',
      fileName: 'vacation-photo.jpg',
      fileSize: '2.4 MB',
    },
    actions: [
      {
        label: 'View',
        onClick: () => {
          window.open('https://example.com/image-full.jpg', '_blank');
        },
      },
      {
        label: 'Save',
        onClick: () => {
          console.log('Save image');
        },
      },
    ],
  });
}

// ============================================
// Example 2: File Preview Notification
// ============================================
export function showFilePreviewExample(toast: ToastApi) {
  toast.addToast({
    title: 'File Ready',
    message: 'Document is ready to transfer',
    variant: 'info',
    duration: 10000,
    preview: {
      type: 'file',
      fileName: 'presentation-final.pdf',
      fileSize: '5.2 MB',
    },
    actions: [
      {
        label: 'Accept',
        onClick: () => {
          console.log('Accept transfer');
          toast.success('Transfer accepted');
        },
      },
      {
        label: 'Reject',
        onClick: () => {
          console.log('Reject transfer');
          toast.info('Transfer rejected');
        },
      },
    ],
  });
}

// ============================================
// Example 3: Transfer Progress Notification
// ============================================
export function showTransferProgressExample(toast: ToastApi) {
  let progress = 0;
  const toastId = toast.addToast({
    title: 'Transferring',
    message: 'video-recording.mp4',
    variant: 'info',
    duration: Infinity, // Don't auto-dismiss
    preview: {
      type: 'transfer',
      fileName: 'video-recording.mp4',
      progress: 0,
    },
  });

  // Simulate progress updates
  const interval = setInterval(() => {
    progress += 10;

    // In a real implementation, you would update the toast here
    // For now, we'll just log the progress
    console.log(`Transfer progress: ${progress}%`);

    if (progress >= 100) {
      clearInterval(interval);
      toast.removeToast(toastId);

      // Show completion notification
      toast.success('Transfer complete: video-recording.mp4', {
        duration: 5000,
        preview: {
          type: 'transfer',
          fileName: 'video-recording.mp4',
          progress: 100,
        },
      });
    }
  }, 500);
}

// ============================================
// Example 4: Incoming Transfer Request
// ============================================
export function showIncomingTransferRequest(
  toast: ToastApi,
  deviceName: string,
  fileName: string,
  fileSize: string,
  onAccept: () => void,
  onReject: () => void
) {
  toast.addToast({
    title: 'Incoming Transfer Request',
    message: `${deviceName} wants to send you a file`,
    variant: 'warning',
    duration: 30000, // 30 seconds to respond
    preview: {
      type: 'file',
      fileName,
      fileSize,
    },
    actions: [
      {
        label: 'Accept',
        onClick: () => {
          onAccept();
          toast.success('Transfer accepted');
        },
      },
      {
        label: 'Reject',
        onClick: () => {
          onReject();
          toast.info('Transfer rejected');
        },
      },
    ],
  });
}

// ============================================
// Example 5: Multiple Images Received
// ============================================
export function showMultipleImagesExample(toast: ToastApi, images: Array<{ name: string; size: string; url: string }>) {
  images.forEach((image, index) => {
    setTimeout(() => {
      toast.success(`Received: ${image.name}`, {
        duration: 8000,
        preview: {
          type: 'image',
          src: image.url,
          fileName: image.name,
          fileSize: image.size,
        },
        actions: [
          {
            label: 'View',
            onClick: () => window.open(image.url, '_blank'),
          },
        ],
      });
    }, index * 1000); // Stagger notifications by 1 second
  });
}

// ============================================
// Example 6: Transfer Error with Retry
// ============================================
export function showTransferErrorExample(toast: ToastApi, fileName: string, onRetry: () => void) {
  toast.error('Transfer failed: Connection lost', {
    duration: 10000,
    preview: {
      type: 'file',
      fileName,
      fileSize: '250 MB',
    },
    actions: [
      {
        label: 'Retry',
        onClick: () => {
          onRetry();
          toast.info('Retrying transfer...');
        },
      },
    ],
  });
}

// ============================================
// Example 7: Using Notification Manager
// ============================================
export async function notificationManagerExamples() {
  // File notification with thumbnail
  await notificationManager.showFileNotification(
    'document.pdf',
    '5.2 MB',
    'https://example.com/thumbnail.jpg'
  );

  // Transfer notification with progress
  await notificationManager.showTransferNotification(
    'transfer-123',
    75, // progress percentage
    'video.mp4'
  );

  // Image notification (includes "View" action automatically)
  await notificationManager.showImageNotification(
    'https://example.com/image.jpg',
    'photo.jpg'
  );
}

// ============================================
// Example 8: Format File Size Helper
// ============================================
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// ============================================
// Example 9: Preload Image Helper
// ============================================
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

// ============================================
// Example 10: Complete File Transfer Flow
// ============================================
export async function completeFileTransferFlow(
  toast: ToastApi,
  file: { name: string; size: number; data: Blob; thumbnail?: string }
) {
  const formattedSize = formatFileSize(file.size);

  // Step 1: Announce incoming file
  toast.addToast({
    title: 'Incoming File',
    message: `Preparing to receive ${file.name}`,
    variant: 'info',
    duration: 10000,
    preview: file.thumbnail
      ? {
          type: 'image',
          src: file.thumbnail,
          fileName: file.name,
          fileSize: formattedSize,
        }
      : {
          type: 'file',
          fileName: file.name,
          fileSize: formattedSize,
        },
    actions: [
      {
        label: 'Accept',
        onClick: async () => {
          // Step 2: Start transfer with progress
          const transferId = toast.addToast({
            title: 'Transferring',
            message: file.name,
            variant: 'info',
            duration: Infinity,
            preview: {
              type: 'transfer',
              fileName: file.name,
              progress: 0,
            },
          });

          // Simulate transfer progress
          let progress = 0;
          const interval = setInterval(() => {
            progress += 10;

            // Update progress (implement toast update API)
            console.log(`Progress: ${progress}%`);

            if (progress >= 100) {
              clearInterval(interval);

              // Step 3: Show completion
              toast.removeToast(transferId);
              toast.success(`${file.name} received successfully`, {
                duration: 5000,
                preview: file.thumbnail
                  ? {
                      type: 'image',
                      src: file.thumbnail,
                      fileName: file.name,
                      fileSize: formattedSize,
                    }
                  : {
                      type: 'file',
                      fileName: file.name,
                      fileSize: formattedSize,
                    },
                actions: [
                  {
                    label: 'Open',
                    onClick: () => {
                      console.log('Open file');
                    },
                  },
                ],
              });
            }
          }, 500);
        },
      },
      {
        label: 'Reject',
        onClick: () => {
          toast.info('Transfer rejected');
        },
      },
    ],
  });
}

// ============================================
// Example 11: Batch File Upload
// ============================================
export function showBatchUploadProgress(toast: ToastApi, files: Array<{ name: string; size: number }>) {
  const totalSize = formatFileSize(files.reduce((sum, f) => sum + f.size, 0));

  toast.addToast({
    title: 'Uploading Files',
    message: `${files.length} files (${totalSize})`,
    variant: 'info',
    duration: Infinity,
    preview: {
      type: 'transfer',
      fileName: `${files.length} files`,
      progress: 0,
    },
  });
}

// ============================================
// Example 12: Connection Status with Preview
// ============================================
export function showConnectionStatus(
  toast: ToastApi,
  deviceName: string,
  status: 'connecting' | 'connected' | 'disconnected',
  deviceIcon?: string
) {
  const variants = {
    connecting: 'info' as const,
    connected: 'success' as const,
    disconnected: 'warning' as const,
  };

  const messages = {
    connecting: `Connecting to ${deviceName}...`,
    connected: `Connected to ${deviceName}`,
    disconnected: `Disconnected from ${deviceName}`,
  };

  toast.addToast({
    title: status.charAt(0).toUpperCase() + status.slice(1),
    message: messages[status],
    variant: variants[status],
    duration: 5000,
    ...(deviceIcon && {
      preview: {
        type: 'image',
        src: deviceIcon,
        fileName: deviceName,
      },
    }),
  });
}

// ============================================
// Usage in Components
// ============================================

// In a React component:
export function FileTransferComponent() {
  const toast = useToast();

  const handleFileReceived = (file: { name: string; size: string; url: string }) => {
    toast.success('File received', {
      preview: {
        type: 'image',
        src: file.url,
        fileName: file.name,
        fileSize: file.size,
      },
      actions: [
        { label: 'View', onClick: () => window.open(file.url) },
      ],
    });
  };

  return (
    <button onClick={() => handleFileReceived({
      name: 'example.jpg',
      size: '2.4 MB',
      url: 'https://example.com/image.jpg'
    })}>
      Simulate File Received
    </button>
  );
}

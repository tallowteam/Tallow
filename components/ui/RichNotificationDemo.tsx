'use client';

import { useToast } from './ToastProvider';
import { Button } from './Button';
import styles from './RichNotificationDemo.module.css';

/**
 * Rich Notification Demo Component
 * Demonstrates various rich notification types with previews and actions
 */
export const RichNotificationDemo = () => {
  const toast = useToast();

  const showImageNotification = () => {
    toast.addToast({
      title: 'Image Received',
      message: 'vacation-photo.jpg',
      variant: 'success',
      duration: 10000,
      preview: {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=100&fit=crop',
        fileName: 'vacation-photo.jpg',
        fileSize: '2.4 MB',
      },
      actions: [
        {
          label: 'View',
          onClick: () => console.log('View image'),
        },
        {
          label: 'Save',
          onClick: () => console.log('Save image'),
        },
      ],
    });
  };

  const showFileNotification = () => {
    toast.addToast({
      title: 'File Ready',
      message: 'document.pdf is ready to transfer',
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
          onClick: () => console.log('Accept file'),
        },
        {
          label: 'Reject',
          onClick: () => console.log('Reject file'),
        },
      ],
    });
  };

  const showTransferNotification = () => {
    let progress = 0;
    const toastId = toast.addToast({
      title: 'Transferring',
      message: 'video-recording.mp4',
      variant: 'info',
      duration: Infinity,
      preview: {
        type: 'transfer',
        fileName: 'video-recording.mp4',
        progress: 0,
      },
    });

    // Simulate progress
    const interval = setInterval(() => {
      progress += 10;

      if (progress <= 100) {
        // Update the existing toast (in a real app)
        console.log(`Progress: ${progress}%`);
      }

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
  };

  const showIncomingRequest = () => {
    toast.addToast({
      title: 'Incoming Transfer Request',
      message: 'John\'s iPhone wants to send you a file',
      variant: 'warning',
      duration: 30000,
      preview: {
        type: 'file',
        fileName: 'budget-2024.xlsx',
        fileSize: '1.8 MB',
      },
      actions: [
        {
          label: 'Accept',
          onClick: () => {
            console.log('Accepted transfer');
            toast.success('Transfer accepted');
          },
        },
        {
          label: 'Reject',
          onClick: () => {
            console.log('Rejected transfer');
            toast.info('Transfer rejected');
          },
        },
      ],
    });
  };

  const showMultipleFiles = () => {
    const files = [
      { name: 'photo-1.jpg', size: '3.2 MB', src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=100&fit=crop' },
      { name: 'photo-2.jpg', size: '2.8 MB', src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=100&h=100&fit=crop' },
      { name: 'photo-3.jpg', size: '4.1 MB', src: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=100&h=100&fit=crop' },
    ];

    files.forEach((file, index) => {
      setTimeout(() => {
        toast.success(`Received: ${file.name}`, {
          duration: 8000,
          preview: {
            type: 'image',
            src: file.src,
            fileName: file.name,
            fileSize: file.size,
          },
          actions: [
            {
              label: 'View',
              onClick: () => window.open(file.src, '_blank'),
            },
          ],
        });
      }, index * 1000);
    });
  };

  const showErrorWithPreview = () => {
    toast.error('Transfer failed: Connection lost', {
      duration: 10000,
      preview: {
        type: 'file',
        fileName: 'large-video-file.mp4',
        fileSize: '250 MB',
      },
      actions: [
        {
          label: 'Retry',
          onClick: () => {
            console.log('Retrying transfer');
            toast.info('Retrying transfer...');
          },
        },
      ],
    });
  };

  return (
    <div className={styles.demo}>
      <h2 className={styles.title}>Rich Notifications Demo</h2>
      <p className={styles.description}>
        Click the buttons below to see different types of rich notifications with previews and actions.
      </p>

      <div className={styles.grid}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Image Notifications</h3>
          <div className={styles.buttonGroup}>
            <Button onClick={showImageNotification}>
              Show Image Preview
            </Button>
            <Button onClick={showMultipleFiles} variant="secondary">
              Show Multiple Images
            </Button>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>File Notifications</h3>
          <div className={styles.buttonGroup}>
            <Button onClick={showFileNotification}>
              Show File Preview
            </Button>
            <Button onClick={showIncomingRequest} variant="secondary">
              Show Incoming Request
            </Button>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Transfer Notifications</h3>
          <div className={styles.buttonGroup}>
            <Button onClick={showTransferNotification}>
              Show Transfer Progress
            </Button>
            <Button onClick={showErrorWithPreview} variant="secondary">
              Show Transfer Error
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.info}>
        <h4 className={styles.infoTitle}>Features:</h4>
        <ul className={styles.featureList}>
          <li>Image thumbnails (48x48px)</li>
          <li>File preview with name and size</li>
          <li>Transfer progress bar</li>
          <li>Multiple action buttons</li>
          <li>Responsive layout</li>
          <li>Accessible keyboard navigation</li>
        </ul>
      </div>
    </div>
  );
};

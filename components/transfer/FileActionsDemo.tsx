/**
 * Demo component showing FileActions and DuplicateFileDialog usage
 *
 * This is a complete example demonstrating:
 * - Duplicate file handling
 * - Quick actions on received files
 * - Integration with toast notifications
 * - Responsive mobile/desktop behavior
 */

'use client';

import { FileActions, DuplicateFileDialog } from './index';
import { useDuplicateFileHandler } from '@/lib/hooks/use-duplicate-file-handler';
import { useToast } from '@/components/ui/ToastProvider';
import { Transfer, Device } from '@/lib/types';
import styles from './FileActionsDemo.module.css';

export function FileActionsDemo() {
  const toast = useToast();
  const {
    showDialog,
    isDialogOpen,
    currentFileName,
    suggestedName,
    handleChoice,
    closeDialog,
  } = useDuplicateFileHandler();

  // Example transfer data
  const mockDevice: Device = {
    id: 'device-1',
    name: 'John\'s MacBook',
    platform: 'macos',
    ip: '192.168.1.100',
    port: 8080,
    isOnline: true,
    isFavorite: false,
    lastSeen: Date.now(),
    avatar: null,
  };

  const mockTransfer: Transfer = {
    id: 'transfer-1',
    files: [
      {
        id: 'file-1',
        name: 'presentation.pdf',
        size: 2048576, // 2 MB
        type: 'application/pdf',
        lastModified: Date.now(),
        hash: 'abc123',
        thumbnail: null,
        path: null,
      },
    ],
    from: mockDevice,
    to: mockDevice,
    status: 'completed',
    progress: 100,
    speed: 0,
    startTime: Date.now() - 30000,
    endTime: Date.now(),
    error: null,
    direction: 'receive',
    totalSize: 2048576,
    transferredSize: 2048576,
    eta: null,
    quality: 'excellent',
    encryptionMetadata: null,
  };

  // Simulate receiving a file
  const handleSimulateReceive = async () => {
    const fileName = 'presentation.pdf';

    // Show duplicate dialog
    const result = await showDialog(fileName);

    if (result.action === 'skip') {
      toast?.info(`Skipped ${fileName}`);
      return;
    }

    const finalName = result.newName || fileName;

    if (result.action === 'rename') {
      toast?.success(`Saved as ${finalName}`);
    } else if (result.action === 'overwrite') {
      toast?.warning(`Overwritten ${fileName}`);
    }
  };

  const handleOpenFile = (transfer: Transfer) => {
    const fileName = transfer.files[0]?.name || 'file';
    toast?.success(`Opening ${fileName}...`);
    console.log('Opening file:', transfer);
  };

  const handleShareFile = (transfer: Transfer) => {
    const fileName = transfer.files[0]?.name || 'file';
    toast?.success(`Sharing ${fileName}...`);
    console.log('Sharing file:', transfer);
  };

  const handleDeleteFile = (transfer: Transfer) => {
    const fileName = transfer.files[0]?.name || 'file';
    toast?.success(`${fileName} removed from history`);
    console.log('Deleting file:', transfer);
  };

  return (
    <div className={styles.demo}>
      <div className={styles.header}>
        <h2>File Actions Demo</h2>
        <p>Hover over the transfer item to see quick actions</p>
      </div>

      {/* Simulated transfer history item */}
      <div className={styles.transferItem}>
        <div className={styles.fileIcon}>📄</div>
        <div className={styles.fileInfo}>
          <span className={styles.fileName}>presentation.pdf</span>
          <span className={styles.fileSize}>2.0 MB · Just now</span>
        </div>

        {/* Desktop actions */}
        <div className={styles.desktopActions}>
          <FileActions
            transfer={mockTransfer}
            onOpen={handleOpenFile}
            onShare={handleShareFile}
            onDelete={handleDeleteFile}
          />
        </div>

        {/* Mobile actions */}
        <div className={styles.mobileActions}>
          <FileActions
            transfer={mockTransfer}
            onOpen={handleOpenFile}
            onShare={handleShareFile}
            onDelete={handleDeleteFile}
            mobileMenu
          />
        </div>
      </div>

      {/* Test button */}
      <div className={styles.testSection}>
        <button onClick={handleSimulateReceive} className={styles.testButton}>
          Simulate Duplicate File
        </button>
        <p className={styles.testHint}>
          Click multiple times to see duplicate file dialog
        </p>
      </div>

      {/* Duplicate file dialog */}
      <DuplicateFileDialog
        open={isDialogOpen}
        onClose={closeDialog}
        onConfirm={handleChoice}
        fileName={currentFileName || ''}
        {...(suggestedName ? { suggestedName } : {})}
      />

      {/* Feature list */}
      <div className={styles.features}>
        <h3>Features Demonstrated</h3>
        <ul>
          <li>
            <strong>Quick Actions:</strong> Open, Share, and Delete buttons on hover
            (desktop) or menu (mobile)
          </li>
          <li>
            <strong>Duplicate Detection:</strong> Automatically detects files with the
            same name
          </li>
          <li>
            <strong>Resolution Options:</strong> Rename, Overwrite, or Skip duplicates
          </li>
          <li>
            <strong>Session Persistence:</strong> "Apply to All" remembers choice for
            session
          </li>
          <li>
            <strong>Responsive Design:</strong> Adapts to mobile and desktop layouts
          </li>
          <li>
            <strong>Confirmation Dialogs:</strong> Delete action requires confirmation
          </li>
          <li>
            <strong>Toast Notifications:</strong> Visual feedback for all actions
          </li>
          <li>
            <strong>Web Share API:</strong> Native sharing on supported devices
          </li>
        </ul>
      </div>
    </div>
  );
}

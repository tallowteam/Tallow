'use client';

import { useState } from 'react';
import { Button } from '../ui/Button';
import {
  Alert,
  Progress,
  Skeleton,
  SkeletonGroup,
  EmptyState,
  ErrorBoundary,
  ConfirmDialog,
  useToastHelpers,
} from './index';
import styles from './FeedbackDemo.module.css';

/**
 * Comprehensive demo of all feedback components
 * This component showcases all variants and features
 */
export function FeedbackDemo() {
  const toast = useToastHelpers();
  const [progress, setProgress] = useState(45);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Toast demos
  const showSuccessToast = () => {
    toast.success('File uploaded successfully!');
  };

  const showErrorToast = () => {
    toast.error('Failed to connect to server', {
      duration: 7000,
      action: {
        label: 'Retry',
        onClick: () => console.log('Retry clicked'),
      },
    });
  };

  const showWarningToast = () => {
    toast.warning('Your session will expire in 5 minutes');
  };

  const showInfoToast = () => {
    toast.info('New features are available!', {
      action: {
        label: 'Learn more',
        onClick: () => console.log('Learn more clicked'),
      },
    });
  };

  // Progress simulation
  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          toast.success('Upload complete!');
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  // Confirm dialog demo
  const handleConfirm = async () => {
    setConfirmLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setConfirmLoading(false);
    setShowConfirm(false);
    toast.success('File deleted successfully');
  };

  return (
    <div className={styles.demo}>
      <h1>Feedback Components Demo</h1>

      {/* Toast Notifications */}
      <section className={styles.section}>
        <h2>Toast Notifications</h2>
        <div className={styles.buttonGroup}>
          <Button onClick={showSuccessToast} variant="primary">
            Success Toast
          </Button>
          <Button onClick={showErrorToast} variant="danger">
            Error Toast
          </Button>
          <Button onClick={showWarningToast} variant="secondary">
            Warning Toast
          </Button>
          <Button onClick={showInfoToast} variant="ghost">
            Info Toast
          </Button>
        </div>
      </section>

      {/* Alerts */}
      <section className={styles.section}>
        <h2>Inline Alerts</h2>
        <div className={styles.stack}>
          <Alert variant="success" title="Success!">
            Your changes have been saved successfully.
          </Alert>

          <Alert variant="error" title="Error" dismissible>
            There was a problem processing your request. Please try again.
          </Alert>

          <Alert variant="warning" title="Warning" dismissible>
            Your storage is almost full. Consider upgrading your plan.
          </Alert>

          <Alert variant="info">
            You can now use keyboard shortcuts to navigate faster. Press{' '}
            <kbd>?</kbd> to see all shortcuts.
          </Alert>
        </div>
      </section>

      {/* Progress */}
      <section className={styles.section}>
        <h2>Progress Indicators</h2>
        <div className={styles.stack}>
          <div>
            <h3>Determinate Progress</h3>
            <Progress value={progress} showLabel />
            <Button onClick={simulateProgress} size="sm">
              Simulate Upload
            </Button>
          </div>

          <div>
            <h3>Indeterminate Progress</h3>
            <Progress indeterminate />
          </div>

          <div>
            <h3>Size Variants</h3>
            <Progress value={75} size="sm" showLabel />
            <Progress value={75} size="md" showLabel />
            <Progress value={75} size="lg" showLabel />
          </div>

          <div>
            <h3>Color Variants</h3>
            <Progress value={80} variant="success" showLabel />
            <Progress value={60} variant="warning" showLabel />
            <Progress value={30} variant="error" showLabel />
          </div>
        </div>
      </section>

      {/* Skeletons */}
      <section className={styles.section}>
        <h2>Loading Skeletons</h2>
        <div className={styles.stack}>
          <div>
            <h3>Text Skeleton</h3>
            <SkeletonGroup count={3} variant="text" />
          </div>

          <div>
            <h3>Card Skeleton</h3>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Skeleton variant="circle" width={48} height={48} />
                <div style={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </div>
              </div>
              <Skeleton variant="rectangle" height={120} />
            </div>
          </div>
        </div>
      </section>

      {/* Empty State */}
      <section className={styles.section}>
        <h2>Empty State</h2>
        <EmptyState
          title="No files found"
          description="Upload your first file to get started with secure transfers."
          action={{
            label: 'Upload File',
            onClick: () => toast.info('Upload clicked!'),
          }}
        />
      </section>

      {/* Error Boundary */}
      <section className={styles.section}>
        <h2>Error Boundary</h2>
        <ErrorBoundary showDetails={true}>
          <div className={styles.card}>
            <p>This content is wrapped in an Error Boundary.</p>
            <Button
              onClick={() => {
                throw new Error('Demo error!');
              }}
              variant="danger"
            >
              Trigger Error
            </Button>
          </div>
        </ErrorBoundary>
      </section>

      {/* Confirm Dialog */}
      <section className={styles.section}>
        <h2>Confirmation Dialog</h2>
        <div className={styles.buttonGroup}>
          <Button onClick={() => setShowConfirm(true)} variant="danger">
            Delete File
          </Button>
        </div>

        <ConfirmDialog
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirm}
          title="Delete file?"
          message={
            <>
              <p>
                This action cannot be undone. The file{' '}
                <strong>document.pdf</strong> will be permanently deleted.
              </p>
            </>
          }
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
          loading={confirmLoading}
        />
      </section>
    </div>
  );
}

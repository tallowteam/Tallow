'use client';

import { useState } from 'react';
import { useToast } from './ToastProvider';
import { Button } from './Button';
import styles from './ToastDemo.module.css';

/**
 * ToastDemo Component
 *
 * Interactive demonstration of the Toast notification system.
 * Shows all variants, features, and usage patterns.
 */
export const ToastDemo = () => {
  const { success, error, warning, info, addToast, clearAll } = useToast();
  const [customDuration, setCustomDuration] = useState(5000);

  // Basic toast examples
  const showSuccessToast = () => {
    success('File uploaded successfully!', {
      title: 'Success',
      duration: 5000,
    });
  };

  const showErrorToast = () => {
    error('Failed to connect to server. Please try again.', {
      title: 'Connection Error',
      duration: 7000,
    });
  };

  const showWarningToast = () => {
    warning('Your session will expire in 5 minutes.', {
      title: 'Session Warning',
      duration: 6000,
    });
  };

  const showInfoToast = () => {
    info('New version available. Update recommended.', {
      title: 'Update Available',
      duration: 5000,
    });
  };

  // Advanced examples
  const showToastWithAction = () => {
    addToast({
      variant: 'info',
      title: 'File Ready',
      message: 'Your download is ready.',
      duration: 8000,
      action: {
        label: 'Download Now',
        onClick: () => {
          console.info('Download initiated!');
          success('Download started!');
        },
      },
    });
  };

  const showPersistentToast = () => {
    addToast({
      variant: 'warning',
      title: 'Important',
      message: 'This notification will stay until you close it.',
      duration: Infinity,
    });
  };

  const showCustomDurationToast = () => {
    info(`This toast will dismiss in ${customDuration / 1000} seconds.`, {
      duration: customDuration,
    });
  };

  const showMultipleToasts = () => {
    success('First file uploaded');
    setTimeout(() => success('Second file uploaded'), 300);
    setTimeout(() => success('Third file uploaded'), 600);
    setTimeout(() => success('All files uploaded!', { title: 'Complete' }), 900);
  };

  const showLongMessageToast = () => {
    info(
      'This is a longer notification message that demonstrates how the toast component handles multi-line content. The text will wrap appropriately and the layout remains clean and readable.',
      {
        title: 'Long Message Example',
        duration: 8000,
      }
    );
  };

  return (
    <div className={styles.demo}>
      <div className={styles.header}>
        <h2 className={styles.title}>Toast Notification System</h2>
        <p className={styles.description}>
          Interactive demo showcasing all toast variants and features
        </p>
      </div>

      <div className={styles.sections}>
        {/* Basic Variants */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Basic Variants</h3>
          <div className={styles.grid}>
            <Button onClick={showSuccessToast} variant="primary">
              Success Toast
            </Button>
            <Button onClick={showErrorToast} variant="danger">
              Error Toast
            </Button>
            <Button onClick={showWarningToast} variant="secondary">
              Warning Toast
            </Button>
            <Button onClick={showInfoToast} variant="outline">
              Info Toast
            </Button>
          </div>
        </section>

        {/* Advanced Features */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Advanced Features</h3>
          <div className={styles.grid}>
            <Button onClick={showToastWithAction} variant="primary">
              Toast with Action
            </Button>
            <Button onClick={showPersistentToast} variant="secondary">
              Persistent Toast
            </Button>
            <Button onClick={showLongMessageToast} variant="outline">
              Long Message
            </Button>
            <Button onClick={showMultipleToasts} variant="primary">
              Multiple Toasts
            </Button>
          </div>
        </section>

        {/* Custom Duration */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Custom Duration</h3>
          <div className={styles.durationControl}>
            <label htmlFor="duration" className={styles.label}>
              Duration: {customDuration / 1000}s
            </label>
            <input
              id="duration"
              type="range"
              min="1000"
              max="10000"
              step="500"
              value={customDuration}
              onChange={(e) => setCustomDuration(Number(e.target.value))}
              className={styles.slider}
            />
            <Button onClick={showCustomDurationToast} variant="outline">
              Show Toast
            </Button>
          </div>
        </section>

        {/* Quick Examples */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Quick Examples</h3>
          <div className={styles.examples}>
            <div className={styles.example}>
              <code className={styles.code}>
                success(&apos;Upload complete!&apos;)
              </code>
            </div>
            <div className={styles.example}>
              <code className={styles.code}>
                error(&apos;Connection failed&apos;)
              </code>
            </div>
            <div className={styles.example}>
              <code className={styles.code}>
                warning(&apos;Low disk space&apos;)
              </code>
            </div>
            <div className={styles.example}>
              <code className={styles.code}>
                info(&apos;Update available&apos;)
              </code>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Actions</h3>
          <div className={styles.actions}>
            <Button onClick={clearAll} variant="danger" fullWidth>
              Clear All Toasts
            </Button>
          </div>
        </section>
      </div>

      {/* Features List */}
      <div className={styles.features}>
        <h3 className={styles.sectionTitle}>Features</h3>
        <ul className={styles.featureList}>
          <li>4 variants: success, error, warning, info</li>
          <li>Auto-dismiss with configurable duration</li>
          <li>Smooth enter/exit animations</li>
          <li>Visual progress indicator</li>
          <li>Support for multiple stacked toasts</li>
          <li>Close button on each toast</li>
          <li>Optional action buttons</li>
          <li>Optional titles and long messages</li>
          <li>Persistent toasts (duration: Infinity)</li>
          <li>Fully accessible with ARIA labels</li>
          <li>Responsive design</li>
          <li>Reduced motion support</li>
        </ul>
      </div>

      {/* Usage Example */}
      <div className={styles.usage}>
        <h3 className={styles.sectionTitle}>Usage</h3>
        <pre className={styles.codeBlock}>
{`// 1. Wrap your app with ToastProvider
import { ToastProvider } from '@/components/ui';

function App() {
  return (
    <ToastProvider position="bottom-right" maxToasts={5}>
      {/* Your app */}
    </ToastProvider>
  );
}

// 2. Use the useToast hook in your components
import { useToast } from '@/components/ui';

function MyComponent() {
  const { success, error, warning, info, addToast } = useToast();

  const handleUpload = async () => {
    try {
      await uploadFile();
      success('File uploaded successfully!', {
        title: 'Upload Complete',
        duration: 5000
      });
    } catch (err) {
      error('Upload failed. Please try again.', {
        title: 'Upload Error'
      });
    }
  };

  // With custom action
  const showNotification = () => {
    addToast({
      variant: 'info',
      message: 'New message received',
      action: {
        label: 'View',
        onClick: () => console.info('View message')
      }
    });
  };

  return <button onClick={handleUpload}>Upload</button>;
}`}
        </pre>
      </div>
    </div>
  );
};

'use client';

import { useState } from 'react';
import {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  SkeletonDeviceCard,
  Spinner,
  SpinnerOverlay,
  SpinnerInline,
  Button,
  Card,
  CardHeader,
  CardContent,
} from '@/components/ui';
import {
  DeviceDiscoveryLoading,
  FileProcessingLoading,
  TransferQueueLoading,
  TransferHistoryLoading,
  RoomConnectLoading,
  ScanningAnimation,
  UploadAnimation,
} from '@/components/transfer/LoadingStates';
import styles from './LoadingStatesDemo.module.css';

/**
 * Comprehensive Demo of All Loading States
 * Use this for testing and development reference
 */
export function LoadingStatesDemo() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);

  const handleButtonClick = () => {
    setButtonLoading(true);
    setTimeout(() => setButtonLoading(false), 2000);
  };

  return (
    <div className={styles.demo}>
      <h1 className={styles.title}>Loading States Demo</h1>
      <p className={styles.description}>
        Comprehensive showcase of all loading states and skeleton screens in Tallow
      </p>

      {/* Spinner Variants */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Spinner Variants</h2>
        <div className={styles.grid}>
          <Card>
            <CardHeader>
              <h3>Circular (Default)</h3>
            </CardHeader>
            <CardContent>
              <div className={styles.spinnerRow}>
                <Spinner size="xs" type="circular" />
                <Spinner size="sm" type="circular" />
                <Spinner size="md" type="circular" />
                <Spinner size="lg" type="circular" />
                <Spinner size="xl" type="circular" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3>Dots</h3>
            </CardHeader>
            <CardContent>
              <div className={styles.spinnerRow}>
                <Spinner size="xs" type="dots" />
                <Spinner size="sm" type="dots" />
                <Spinner size="md" type="dots" />
                <Spinner size="lg" type="dots" />
                <Spinner size="xl" type="dots" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3>Bars</h3>
            </CardHeader>
            <CardContent>
              <div className={styles.spinnerRow}>
                <Spinner size="xs" type="bars" />
                <Spinner size="sm" type="bars" />
                <Spinner size="md" type="bars" />
                <Spinner size="lg" type="bars" />
                <Spinner size="xl" type="bars" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3>Pulse</h3>
            </CardHeader>
            <CardContent>
              <div className={styles.spinnerRow}>
                <Spinner size="xs" type="pulse" />
                <Spinner size="sm" type="pulse" />
                <Spinner size="md" type="pulse" />
                <Spinner size="lg" type="pulse" />
                <Spinner size="xl" type="pulse" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3>Ring</h3>
            </CardHeader>
            <CardContent>
              <div className={styles.spinnerRow}>
                <Spinner size="xs" type="ring" />
                <Spinner size="sm" type="ring" />
                <Spinner size="md" type="ring" />
                <Spinner size="lg" type="ring" />
                <Spinner size="xl" type="ring" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Spinner Colors */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Spinner Colors</h2>
        <div className={styles.spinnerRow}>
          <div className={styles.spinnerItem}>
            <Spinner variant="primary" />
            <span>Primary</span>
          </div>
          <div className={styles.spinnerItem}>
            <Spinner variant="secondary" />
            <span>Secondary</span>
          </div>
          <div className={styles.spinnerItem} style={{ background: '#000', padding: '20px', borderRadius: '8px' }}>
            <Spinner variant="white" />
            <span style={{ color: '#fff' }}>White</span>
          </div>
        </div>
      </section>

      {/* Skeleton Components */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Skeleton Components</h2>
        <div className={styles.grid}>
          <Card>
            <CardHeader>
              <h3>Text Skeletons</h3>
            </CardHeader>
            <CardContent>
              <div className={styles.skeletonGroup}>
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" lines={3} spacing="md" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3>Shapes</h3>
            </CardHeader>
            <CardContent>
              <div className={styles.shapeRow}>
                <Skeleton variant="circular" width="40px" height="40px" />
                <Skeleton variant="circular" width="60px" height="60px" />
                <Skeleton variant="rectangular" width="100px" height="60px" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3>Animations</h3>
            </CardHeader>
            <CardContent>
              <div className={styles.skeletonGroup}>
                <Skeleton animation="pulse" width="100%" height="20px" />
                <Skeleton animation="shimmer" width="100%" height="20px" />
                <Skeleton animation="wave" width="100%" height="20px" />
                <Skeleton animation="none" width="100%" height="20px" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Compound Components */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Compound Skeleton Components</h2>
        <div className={styles.grid}>
          <SkeletonCard />
          <div>
            <h4>List</h4>
            <SkeletonList items={3} />
          </div>
          <div>
            <h4>Device Cards</h4>
            <div className={styles.deviceCardGrid}>
              <SkeletonDeviceCard />
              <SkeletonDeviceCard />
            </div>
          </div>
        </div>
      </section>

      {/* Transfer Loading States */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Transfer Loading States</h2>
        <div className={styles.grid}>
          <Card>
            <CardHeader>
              <h3>Device Discovery</h3>
            </CardHeader>
            <CardContent>
              <DeviceDiscoveryLoading count={2} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3>File Processing</h3>
            </CardHeader>
            <CardContent>
              <FileProcessingLoading
                fileName="document.pdf"
                progress={45}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3>Transfer Queue</h3>
            </CardHeader>
            <CardContent>
              <TransferQueueLoading items={2} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3>Transfer History</h3>
            </CardHeader>
            <CardContent>
              <TransferHistoryLoading items={3} />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Special Animations */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Special Animations</h2>
        <div className={styles.animationGrid}>
          <Card>
            <CardHeader>
              <h3>Scanning Animation</h3>
            </CardHeader>
            <CardContent>
              <div className={styles.animationContainer}>
                <ScanningAnimation />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3>Upload Animation</h3>
            </CardHeader>
            <CardContent>
              <div className={styles.animationContainer}>
                <UploadAnimation />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3>Room Connect</h3>
            </CardHeader>
            <CardContent>
              <RoomConnectLoading message="Connecting to secure room..." />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Interactive Examples */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Interactive Examples</h2>
        <div className={styles.grid}>
          <Card>
            <CardHeader>
              <h3>Button with Loading</h3>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleButtonClick}
                loading={buttonLoading}
              >
                {buttonLoading ? 'Processing...' : 'Click Me'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3>Inline Loading</h3>
            </CardHeader>
            <CardContent>
              <SpinnerInline text="Loading data..." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3>Overlay</h3>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowOverlay(true)}>
                Show Overlay
              </Button>
              <SpinnerOverlay
                visible={showOverlay}
                label="Processing..."
              />
              {showOverlay && (
                <Button
                  onClick={() => setShowOverlay(false)}
                  style={{ marginTop: '10px' }}
                >
                  Close Overlay
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Table Skeleton */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Table Skeleton</h2>
        <SkeletonTable rows={5} columns={4} />
      </section>
    </div>
  );
}

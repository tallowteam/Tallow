'use client';

/**
 * LocationSharingDemo
 * Interactive demo of all location sharing features
 * Showcases all states and components
 */

import { useState } from 'react';
import LocationShare from './LocationShare';
import LocationMessage from './LocationMessage';
import type { GeolocationResult } from '@/lib/geo/location-sharing';
import styles from './LocationSharingDemo.module.css';

export default function LocationSharingDemo() {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharedLocations, setSharedLocations] = useState<
    Array<{ id: string; location: GeolocationResult; isSent: boolean }>
  >([]);

  const handleShareLocation = (location: GeolocationResult) => {
    setSharedLocations((prev) => [
      {
        id: `loc-${Date.now()}`,
        location,
        isSent: true,
      },
      ...prev,
    ]);
    setIsShareModalOpen(false);
  };

  const addExampleLocations = () => {
    const examples: Array<{ location: GeolocationResult; isSent: boolean }> = [
      {
        location: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
          timestamp: Date.now(),
        },
        isSent: true,
      },
      {
        location: {
          latitude: 51.5074,
          longitude: -0.1278,
          accuracy: 1100,
          timestamp: Date.now() - 60000,
        },
        isSent: false,
      },
      {
        location: {
          latitude: 48.8566,
          longitude: 2.3522,
          accuracy: 50,
          timestamp: Date.now() - 120000,
        },
        isSent: true,
      },
      {
        location: {
          latitude: 35.6762,
          longitude: 139.6503,
          accuracy: 1100,
          timestamp: Date.now() - 180000,
        },
        isSent: false,
      },
    ];

    setSharedLocations(
      examples.map((ex, idx) => ({
        id: `example-${idx}`,
        ...ex,
      }))
    );
  };

  const clearLocations = () => {
    setSharedLocations([]);
  };

  return (
    <div className={styles.demo}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Location Sharing Demo</h1>
          <p className={styles.description}>
            Privacy-first location sharing for encrypted chat
          </p>
        </div>

        {/* Feature Grid */}
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3>End-to-End Encrypted</h3>
            <p>Location data encrypted with session keys</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <h3>Privacy Controls</h3>
            <p>Optional ~1km accuracy reduction</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" />
              </svg>
            </div>
            <h3>Static Maps</h3>
            <p>OpenStreetMap tile previews</p>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.primaryButton}
            onClick={() => setIsShareModalOpen(true)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Share Your Location
          </button>

          <button className={styles.secondaryButton} onClick={addExampleLocations}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Load Examples
          </button>

          {sharedLocations.length > 0 && (
            <button className={styles.clearButton} onClick={clearLocations}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Clear All
            </button>
          )}
        </div>

        {/* Shared Locations */}
        <div className={styles.locationsSection}>
          <h2 className={styles.sectionTitle}>
            Shared Locations ({sharedLocations.length})
          </h2>

          {sharedLocations.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3>No locations shared yet</h3>
              <p>Share your location or load examples to see them here</p>
            </div>
          ) : (
            <div className={styles.locationsList}>
              {sharedLocations.map((item) => (
                <div
                  key={item.id}
                  className={`${styles.locationItem} ${
                    item.isSent ? styles.sent : styles.received
                  }`}
                >
                  <div className={styles.locationLabel}>
                    {item.isSent ? 'You shared' : 'Received from peer'}
                  </div>
                  <LocationMessage
                    location={item.location}
                    isSent={item.isSent}
                  />
                  <div className={styles.timestamp}>
                    {new Date(item.location.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className={styles.infoSection}>
          <div className={styles.infoCard}>
            <h3>How It Works</h3>
            <ol className={styles.stepsList}>
              <li>Click "Share Your Location" to open the modal</li>
              <li>Toggle privacy mode for approximate location (~1km)</li>
              <li>Click "Get Location" to request permission</li>
              <li>Preview the map and coordinates</li>
              <li>Click "Share Location" to send</li>
              <li>Location is encrypted and sent P2P</li>
            </ol>
          </div>

          <div className={styles.infoCard}>
            <h3>Privacy Features</h3>
            <ul className={styles.featuresList}>
              <li>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Optional ~1km accuracy reduction
              </li>
              <li>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                End-to-end encryption
              </li>
              <li>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Explicit user consent required
              </li>
              <li>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Never sent to Tallow servers
              </li>
              <li>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Auto-deleted with chat session
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Location Share Modal */}
      <LocationShare
        isOpen={isShareModalOpen}
        onShare={handleShareLocation}
        onCancel={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
